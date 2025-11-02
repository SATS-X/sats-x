import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useToast } from './ToastContext'
import { WS_ATTENDANCE_URL } from '../config/api'

const WebSocketContext = createContext()

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
    const [reconnectAttempt, setReconnectAttempt] = useState(0)

    const wsRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)
    const messageHandlersRef = useRef(new Map())

    const { showError, showSuccess, showInfo } = useToast()

    // Cleanup function
    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket already connected')
            return
        }

        console.log('🔌 Connecting to Attendance WebSocket...', WS_ATTENDANCE_URL)
        setConnectionStatus('connecting')

        try {
            const ws = new WebSocket(WS_ATTENDANCE_URL)

            ws.onopen = () => {
                console.log('✅ Attendance WebSocket Connected')
                setIsConnected(true)
                setConnectionStatus('connected')
                setReconnectAttempt(0)
                showSuccess('Đã kết nối Attendance WebSocket', 'Kết nối')
            }

            ws.onmessage = (event) => {
                console.log('📨 Message received:', event.data)

                try {
                    const data = JSON.parse(event.data)
                    setLastMessage(data)

                    // Handle response from Lambda (status, message, etc.)
                    if (data.status) {
                        console.log(`Response status: ${data.status}`)

                        // Show notifications based on status
                        if (data.status === 'success') {
                            if (data.face_compare_result?.match_found) {
                                const studentId = data.face_compare_result.student_id
                                const similarity = data.face_compare_result.similarity?.toFixed(2)
                                showSuccess(`Nhận diện thành công: ${studentId} (${similarity}%)`, 'Điểm danh')
                            }

                            // Show attendance result
                            if (data.attendance_result?.status === 'success') {
                                const remark = data.attendance_result.attendance_details?.remark
                                const remarkVN = remark === 'On Time' ? 'Đúng giờ' : remark === 'Late' ? 'Trễ' : 'Vắng'
                                showSuccess(`Điểm danh ${remarkVN}`, 'Thành công')
                            }
                        } else if (data.status === 'error') {
                            showError(data.message || 'Có lỗi xảy ra', 'Lỗi')
                        } else if (data.status === 'partial_success') {
                            showInfo(data.message || 'Xử lý một phần', 'Thông báo')
                        }
                    }

                    // Handle specific message types
                    if (data.type && messageHandlersRef.current.has(data.type)) {
                        const handlers = messageHandlersRef.current.get(data.type)
                        handlers.forEach((handler) => handler(data))
                    }

                    // Call all wildcard handlers
                    if (messageHandlersRef.current.has('*')) {
                        const handlers = messageHandlersRef.current.get('*')
                        handlers.forEach((handler) => handler(data))
                    }
                } catch (error) {
                    console.error('❌ Error parsing message:', error)
                    setLastMessage(event.data)
                }
            }

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error)
                setConnectionStatus('error')
                showError('Lỗi kết nối WebSocket', 'Lỗi')
            }

            ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected', event.code, event.reason)
                setIsConnected(false)
                setConnectionStatus('disconnected')
                cleanup()

                // Auto reconnect with exponential backoff
                if (event.code !== 1000) {
                    // 1000 = normal closure
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000)
                    console.log(`🔄 Reconnecting in ${timeout}ms...`)

                    showInfo(`Đang kết nối lại sau ${timeout / 1000}s...`, 'Mất kết nối')

                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempt((prev) => prev + 1)
                        connect()
                    }, timeout)
                }
            }

            wsRef.current = ws
        } catch (error) {
            console.error('❌ Error creating WebSocket:', error)
            setConnectionStatus('error')
            showError('Không thể tạo kết nối WebSocket', 'Lỗi')
        }
    }, [reconnectAttempt, showError, showSuccess, showInfo, cleanup])

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        console.log('🔌 Disconnecting WebSocket...')
        cleanup()

        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect')
            wsRef.current = null
        }

        setIsConnected(false)
        setConnectionStatus('disconnected')
    }, [cleanup])

    // Send message through WebSocket
    const sendMessage = useCallback(
        (message) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                const payload = typeof message === 'string' ? message : JSON.stringify(message)
                console.log('📤 Sending message:', payload)
                wsRef.current.send(payload)
                return true
            } else {
                console.error('❌ WebSocket is not connected')
                showError('WebSocket chưa kết nối', 'Lỗi')
                return false
            }
        },
        [showError]
    )

    // Subscribe to specific message types
    const subscribe = useCallback((messageType, handler) => {
        if (!messageHandlersRef.current.has(messageType)) {
            messageHandlersRef.current.set(messageType, new Set())
        }
        messageHandlersRef.current.get(messageType).add(handler)

        console.log(`Subscribed to message type: ${messageType}`)

        // Return unsubscribe function
        return () => {
            const handlers = messageHandlersRef.current.get(messageType)
            if (handlers) {
                handlers.delete(handler)
                if (handlers.size === 0) {
                    messageHandlersRef.current.delete(messageType)
                }
            }
            console.log(`Unsubscribed from message type: ${messageType}`)
        }
    }, [])

    // Auto-connect on mount
    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency to only run on mount/unmount

    const value = {
        isConnected,
        connectionStatus,
        lastMessage,
        connect,
        disconnect,
        sendMessage,
        subscribe,
        reconnectAttempt
    }

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

WebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default WebSocketContext
