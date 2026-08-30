import { useEffect } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'


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

