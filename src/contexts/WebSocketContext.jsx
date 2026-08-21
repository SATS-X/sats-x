import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useToast } from './ToastContext'
import { WS_URL } from '../config/api'

const WebSocketContext = createContext(null)

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
    const messageHandlersRef = useRef(new Map())
    const pingStartRef = useRef(null)

    const { showError, showSuccess, showInfo } = useToast()

    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
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
                setReconnectAttempt(0)
                showSuccess('Đã kết nối AWS WebSocket Gateway', 'AWS IoT/API')
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
                            `Nhận diện thành công sinh viên: ${data.studentId} (${data.similarity}%)`,
                            'Điểm danh tự động'
                        )
                    } else {
                        showInfo('Khuôn mặt không khớp trong danh sách lớp', 'Điểm danh')
                    }
                } else if (data.action === 'addFace' && data.status === 'success') {
                    showSuccess(`Đã thêm khuôn mặt cho sinh viên ${data.studentId}`, 'Rekognition')
                } else if (data.action === 'deleteFace' && data.status === 'success') {
                    showSuccess(`Đã xoá khuôn mặt khỏi bộ sưu tập`, 'Rekognition')
                } else if (data.status === 'error') {
                    showError(data.message || 'Lỗi xử lý từ Lambda', 'AWS Gateway')
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

                // Auto reconnect with exponential backoff if not cleanly closed
                if (event.code !== 1000) {
                    const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttempt), 15000)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempt((prev) => prev + 1)
                        connect()
                    }, timeout)
                }
            }

            wsRef.current = ws
        } catch (error) {
            setConnectionStatus('error')
            showError('Không thể tạo kết nối WebSocket AWS', 'Lỗi')
        }
    }, [reconnectAttempt, showError, showSuccess, showInfo, cleanup])

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
                showError('WebSocket chưa kết nối tới AWS Gateway', 'Lỗi')
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

    useEffect(() => {
        connect()
        return () => disconnect()
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
        ping,
        reconnectAttempt
    }

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

WebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default WebSocketContext
