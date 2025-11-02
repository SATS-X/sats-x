import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import { useToast } from './ToastContext'
import { WS_FACE_MANAGEMENT_URL } from '../config/api'

const FaceManagementWebSocketContext = createContext()

export const useFaceManagementWebSocket = () => {
    const context = useContext(FaceManagementWebSocketContext)
    if (!context) {
        throw new Error('useFaceManagementWebSocket must be used within FaceManagementWebSocketProvider')
    }
    return context
}

export const FaceManagementWebSocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('disconnected')
    const [lastMessage, setLastMessage] = useState(null)
    const [reconnectAttempt, setReconnectAttempt] = useState(0)
    
    const wsRef = useRef(null)
    const reconnectTimeoutRef = useRef(null)
    const messageHandlersRef = useRef(new Map())
    
    const { showError, showSuccess, showInfo } = useToast()

    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('✅ Face Management WebSocket already connected')
            return
        }

        console.log('🔌 Connecting to Face Management WebSocket...', WS_FACE_MANAGEMENT_URL)
        setConnectionStatus('connecting')

        try {
            const ws = new WebSocket(WS_FACE_MANAGEMENT_URL)
            
            ws.onopen = () => {
                console.log('✅ Face Management WebSocket Connected')
                setIsConnected(true)
                setConnectionStatus('connected')
                setReconnectAttempt(0)
                showSuccess('Đã kết nối Face Management', 'Kết nối')
            }

            ws.onmessage = (event) => {
                console.log('📨 Face Management message received:', event.data)
                
                try {
                    const data = JSON.parse(event.data)
                    setLastMessage(data)
                    
                    // Handle response based on action
                    if (data.action) {
                        console.log(`Face Management action: ${data.action}`)
                        
                        // Show notifications
                        if (data.result?.success) {
                            switch (data.action) {
                                case 'addFace':
                                    showSuccess(`Đã thêm khuôn mặt: ${data.result.student_name}`, 'Thành công')
                                    break
                                case 'deleteFace':
                                case 'deleteFaceAndImage':
                                    showSuccess('Đã xóa khuôn mặt', 'Thành công')
                                    break
                                case 'listFaces':
                                    showInfo(`Tìm thấy ${data.result.total_faces} khuôn mặt`, 'Danh sách')
                                    break
                            }
                        } else if (data.result?.success === false) {
                            showError(data.result.error || 'Có lỗi xảy ra', 'Lỗi')
                        }
                    }
                    
                    // Call specific handlers
                    if (data.action && messageHandlersRef.current.has(data.action)) {
                        const handlers = messageHandlersRef.current.get(data.action)
                        handlers.forEach(handler => handler(data))
                    }
                    
                    // Call wildcard handlers
                    if (messageHandlersRef.current.has('*')) {
                        const handlers = messageHandlersRef.current.get('*')
                        handlers.forEach(handler => handler(data))
                    }
                } catch (error) {
                    console.error('❌ Error parsing Face Management message:', error)
                    setLastMessage(event.data)
                }
            }

            ws.onerror = (error) => {
                console.error('❌ Face Management WebSocket error:', error)
                setConnectionStatus('error')
                showError('Lỗi kết nối Face Management', 'Lỗi')
            }

            ws.onclose = (event) => {
                console.log('🔌 Face Management WebSocket disconnected', event.code, event.reason)
                setIsConnected(false)
                setConnectionStatus('disconnected')
                cleanup()
                
                // Auto reconnect
                if (event.code !== 1000) {
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000)
                    console.log(`🔄 Reconnecting Face Management in ${timeout}ms...`)
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        setReconnectAttempt(prev => prev + 1)
                        connect()
                    }, timeout)
                }
            }

            wsRef.current = ws
        } catch (error) {
            console.error('❌ Error creating Face Management WebSocket:', error)
            setConnectionStatus('error')
            showError('Không thể tạo kết nối Face Management', 'Lỗi')
        }
    }, [reconnectAttempt, showError, showSuccess, showInfo, cleanup])

    const disconnect = useCallback(() => {
        console.log('🔌 Disconnecting Face Management WebSocket...')
        cleanup()
        
        if (wsRef.current) {
            wsRef.current.close(1000, 'Client disconnect')
            wsRef.current = null
        }
        
        setIsConnected(false)
        setConnectionStatus('disconnected')
    }, [cleanup])

    const sendMessage = useCallback((message) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const payload = typeof message === 'string' ? message : JSON.stringify(message)
            console.log('📤 Sending Face Management message:', payload)
            wsRef.current.send(payload)
            return true
        } else {
            console.error('❌ Face Management WebSocket is not connected')
            showError('Face Management WebSocket chưa kết nối', 'Lỗi')
            return false
        }
    }, [showError])

    const subscribe = useCallback((messageType, handler) => {
        if (!messageHandlersRef.current.has(messageType)) {
            messageHandlersRef.current.set(messageType, new Set())
        }
        messageHandlersRef.current.get(messageType).add(handler)
        
        console.log(`Subscribed to Face Management message type: ${messageType}`)
        
        return () => {
            const handlers = messageHandlersRef.current.get(messageType)
            if (handlers) {
                handlers.delete(handler)
                if (handlers.size === 0) {
                    messageHandlersRef.current.delete(messageType)
                }
            }
            console.log(`Unsubscribed from Face Management message type: ${messageType}`)
        }
    }, [])

    // Auto-connect on mount
    useEffect(() => {
        connect()
        
        return () => {
            disconnect()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    return (
        <FaceManagementWebSocketContext.Provider value={value}>
            {children}
        </FaceManagementWebSocketContext.Provider>
    )
}

FaceManagementWebSocketProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default FaceManagementWebSocketContext
