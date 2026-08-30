import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useToast } from './ToastContext'
import { WS_URL } from '../config/api'

const WebSocketContext = createContext(null)

/** Lỗi trả về từ một action WebSocket. `code`: SERVER_ERROR | TIMEOUT | NOT_CONNECTED */
export class WebSocketActionError extends Error {
    constructor(message, code) {
        super(message || 'AWS Gateway processing error')
        this.name = 'WebSocketActionError'
        this.code = code
    }
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext)
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider')
    }
    return context
}

export const WebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected, connecting, connected, error
    const [lastMessage, setLastMessage] = useState(null)
    const [messageHistory, setMessageHistory] = useState([])
    const [latency, setLatency] = useState(null)
    const [reconnectAttempt, setReconnectAttempt] = useState(0)

    const wsRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)
    const heartbeatIntervalRef = useRef(null)
    const messageHandlersRef = useRef(new Map())
    const pingStartRef = useRef(null)

    // Backoff phải đọc từ ref: `connect` được gọi lại từ trong closure của
    // ws.onclose, nên nếu chỉ đọc state thì mãi mãi thấy giá trị tại thời điểm
    // hàm được tạo (0) và khoảng chờ kẹt ở 1000ms, không hề tăng dần.
    const reconnectAttemptRef = useRef(0)
    const connectRef = useRef(null)

    const { showError, showSuccess, showInfo } = useToast()

    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
        }
    }, [])

    // Connect to AWS WebSocket API Gateway
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        setConnectionStatus('connecting')

        try {
            const ws = new WebSocket(WS_URL)

            ws.onopen = () => {
                setIsConnected(true)
                setConnectionStatus('connected')
                reconnectAttemptRef.current = 0
                setReconnectAttempt(0)
                showSuccess('Connected to AWS WebSocket Gateway', 'AWS IoT/API')

                // Giữ kết nối sống: nhiều mạng (NAT/firewall di động, wifi giá rẻ)
                // âm thầm cắt socket idle sau vài chục giây, sớm hơn nhiều so với
                // idle timeout 10 phút của API Gateway — không có traffic định kỳ
                // thì client giữ một socket "chết" mà không hề biết.
                heartbeatIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: 'ping', timestamp: Date.now() }))
                    }
                }, 25000)
            }

            ws.onmessage = (event) => {
                let data = null
                try {
                    data = JSON.parse(event.data)
                } catch {
                    data = { raw: event.data }
                }

                setLastMessage(data)
                setMessageHistory((prev) => [
                    { id: Date.now(), timestamp: new Date().toISOString(), data },
                    ...prev.slice(0, 49) // Keep last 50
                ])

                const action = data.action || (data.status ? 'response' : 'unknown')

                // Notify user on specific attendance & face events
                if (data.action === 'compare' && data.status === 'success') {
                    if (data.matched) {
                        showSuccess(
                            `Student recognized: ${data.studentId} (${data.similarity}%)`,
                            'Automatic attendance'
                        )
                    } else {
                        showInfo('Face does not match this class roster', 'Attendance')
                    }
                } else if (data.action === 'deleteFace' && data.status === 'success') {
                    showSuccess('Face removed from collection', 'Rekognition')
                } else if (
                    data.status === 'error' &&
                    !/unsupported action: ?'?ping'?/i.test(data.message || '') &&
                    // Lỗi của addFace/getUploadUrl do AddFaceModal tự hiển thị kèm
                    // ngữ cảnh (ảnh nào, sinh viên nào) — toast chung ở đây chỉ làm
                    // người dùng thấy hai thông báo trùng nhau cho cùng một sự cố.
                    !['addFace', 'getUploadUrl'].includes(data.action)
                ) {
                    // Bỏ qua lỗi "Unsupported action: ping" — xảy ra khi route "ping"
                    // trên API Gateway chưa được deploy, heartbeat rơi về $default.
                    // Không phải lỗi thật, không cần làm phiền người dùng mỗi 25s.
                    showError(data.message || 'Lambda processing error', 'AWS Gateway')
                }

                // Dispatch to subscribers
                if (action && messageHandlersRef.current.has(action)) {
                    messageHandlersRef.current.get(action).forEach((handler) => handler(data))
                }

                // Dispatch to wildcard subscribers
                if (messageHandlersRef.current.has('*')) {
                    messageHandlersRef.current.get('*').forEach((handler) => handler(data))
                }
            }

            ws.onerror = () => {
                setConnectionStatus('error')
            }

            ws.onclose = (event) => {
                setIsConnected(false)
                setConnectionStatus('disconnected')
                cleanup()

                // 1009 = "message too big": API Gateway đóng kết nối khi client gửi
                // một frame > 32KB. Không nói rõ ra thì triệu chứng chỉ là "tự nhiên
                // mất kết nối" và rất khó lần ra thủ phạm (xem AddFaceModal).
                if (event.code === 1009) {
                    showError(
                        'The payload exceeded API Gateway’s 32 KB frame limit, so the connection was closed',
                        'WebSocket 1009'
                    )
                }

                // Auto reconnect with exponential backoff if not cleanly closed
                if (event.code !== 1000) {
                    const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 15000)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptRef.current += 1
                        setReconnectAttempt(reconnectAttemptRef.current)
                        connectRef.current?.()
                    }, timeout)
                }
            }

            wsRef.current = ws
        } catch {
            setConnectionStatus('error')
            showError('Could not establish an AWS WebSocket connection', 'Error')
        }
    }, [showError, showSuccess, showInfo, cleanup])

    connectRef.current = connect

    const disconnect = useCallback(() => {
        cleanup()
        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect')
            wsRef.current = null
        }
        setIsConnected(false)
        setConnectionStatus('disconnected')
    }, [cleanup])

    // Send generic JSON payload
    const sendMessage = useCallback(
        (message) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                const payload = typeof message === 'string' ? message : JSON.stringify(message)
                wsRef.current.send(payload)
                return true
            } else {
                showError('WebSocket is not connected to AWS Gateway', 'Error')
                return false
            }
        },
        [showError]
    )

    // Send formatted action payload
    const sendAction = useCallback(
        (action, payload = {}) => {
            return sendMessage({ action, ...payload })
        },
        [sendMessage]
    )

    // Ping check to measure latency
    const ping = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            pingStartRef.current = performance.now()
            sendMessage({ action: 'ping', timestamp: Date.now() })
            setTimeout(() => {
                if (pingStartRef.current) {
                    setLatency(Math.round(performance.now() - pingStartRef.current))
                    pingStartRef.current = null
                }
            }, 300)
        }
    }, [sendMessage])

    // Subscribe to action handlers
    const subscribe = useCallback((actionType, handler) => {
        if (!messageHandlersRef.current.has(actionType)) {
            messageHandlersRef.current.set(actionType, new Set())
        }
        messageHandlersRef.current.get(actionType).add(handler)

        return () => {
            const handlers = messageHandlersRef.current.get(actionType)
            if (handlers) {
                handlers.delete(handler)
                if (handlers.size === 0) {
                    messageHandlersRef.current.delete(actionType)
                }
            }
        }
    }, [])

    /**
     * Gửi một action và chờ đúng phản hồi của nó — biến WebSocket một chiều thành
     * request/response để chỗ gọi viết được `await` thay vì rải subscribe + timeout
     * thủ công ở từng component (dễ quên dọn, dễ kẹt spinner mãi mãi).
     */
    const requestAction = useCallback(
        (action, payload = {}, { timeout = 15000, responseAction = action } = {}) =>
            new Promise((resolve, reject) => {
                let settled = false

                const finish = (fn, arg) => {
                    if (settled) return
                    settled = true
                    clearTimeout(timer)
                    unsubscribeAction()
                    unsubscribeGeneric()
                    fn(arg)
                }

                const unsubscribeAction = subscribe(responseAction, (res) => {
                    if (res?.status === 'error') {
                        finish(reject, new WebSocketActionError(res.message, 'SERVER_ERROR'))
                    } else {
                        finish(resolve, res)
                    }
                })

                // Lambda cũ trả lỗi KHÔNG kèm field `action`, nên payload rơi vào
                // nhóm 'response' chứ không tới subscriber của action — nghe thêm ở
                // đây để lỗi hiện ra ngay thay vì phải chờ hết timeout.
                const unsubscribeGeneric = subscribe('response', (res) => {
                    if (res?.status === 'error') {
                        finish(reject, new WebSocketActionError(res.message, 'SERVER_ERROR'))
                    }
                })

                const timer = setTimeout(() => {
                    finish(reject, new WebSocketActionError('The server did not respond', 'TIMEOUT'))
                }, timeout)

                if (!sendMessage({ action, ...payload })) {
                    finish(reject, new WebSocketActionError('WebSocket is not connected to AWS Gateway', 'NOT_CONNECTED'))
                }
            }),
        [subscribe, sendMessage]
    )

    useEffect(() => {
        connect()
        return () => disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const value = {
        isConnected,
        connectionStatus,
        lastMessage,
        messageHistory,
        latency,
        wsUrl: WS_URL,
        connect,
        disconnect,
        sendMessage,
        sendAction,
        subscribe,
        requestAction,
        ping,
        reconnectAttempt
    }

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

WebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default WebSocketContext
