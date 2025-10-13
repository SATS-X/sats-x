import { useState } from 'react'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useWebSocketMessage } from '../../hooks/useWebSocketMessage'
import WebSocketStatus from './WebSocketStatus'
import { HiOutlinePaperAirplane, HiOutlineRefresh } from 'react-icons/hi'

/**
 * Demo component to test WebSocket functionality
 * Can be placed in any page for testing
 */
const WebSocketDemo = () => {
    const { sendMessage, lastMessage } = useWebSocket()
    const [messages, setMessages] = useState([])
    const [inputMessage, setInputMessage] = useState('')

    // Subscribe to all messages
    useWebSocketMessage('*', (data) => {
        setMessages(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            data: data
        }])
    }, [])

    const handleSend = () => {
        if (inputMessage.trim()) {
            sendMessage({
                action: 'message',
                message: inputMessage,
                timestamp: new Date().toISOString()
            })
            setInputMessage('')
        }
    }

    const handleSendPing = () => {
        sendMessage({ action: 'ping' })
    }

    const handleClearMessages = () => {
        setMessages([])
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 mb-2">WebSocket Demo</h2>
                <WebSocketStatus />
            </div>

            {/* Send Message Section */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Send Message</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <HiOutlinePaperAirplane className="h-4 w-4" />
                        Send
                    </button>
                </div>
                <button
                    onClick={handleSendPing}
                    className="mt-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    Send Ping
                </button>
            </div>

            {/* Last Message Section */}
            {lastMessage && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Last Message</h3>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <pre className="text-xs text-slate-700 overflow-x-auto">
                            {JSON.stringify(lastMessage, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* Messages History */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-700">
                        Messages History ({messages.length})
                    </h3>
                    <button
                        onClick={handleClearMessages}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                        <HiOutlineRefresh className="h-4 w-4" />
                        Clear
                    </button>
                </div>
                <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No messages yet. Send a message or wait for incoming messages.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {messages.map((msg, idx) => (
                                <div key={idx} className="p-3 hover:bg-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-slate-600">
                                            Message #{idx + 1}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-slate-700 overflow-x-auto">
                                        {JSON.stringify(msg.data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> This demo subscribes to all WebSocket messages. 
                    Any message received will appear in the history above.
                </p>
            </div>
        </div>
    )
}

export default WebSocketDemo

