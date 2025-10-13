import { useEffect } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'

/**
 * Custom hook to subscribe to WebSocket messages of a specific type
 * 
 * @param {string} messageType - The type of message to listen for (use '*' for all messages)
 * @param {function} handler - Callback function to handle the message
 * @param {array} dependencies - Optional dependencies array for the handler
 * 
 * @example
 * useWebSocketMessage('attendance_update', (data) => {
 *   console.log('Attendance updated:', data)
 *   setAttendanceData(data)
 * }, [])
 */
export const useWebSocketMessage = (messageType, handler, dependencies = []) => {
    const { subscribe } = useWebSocket()

    useEffect(() => {
        if (!messageType || !handler) return

        const unsubscribe = subscribe(messageType, handler)
        
        return () => {
            unsubscribe()
        }
    }, [messageType, subscribe, ...dependencies])
}

export default useWebSocketMessage

