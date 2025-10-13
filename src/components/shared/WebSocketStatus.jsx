import { useWebSocket } from '../../contexts/WebSocketContext'
import { HiOutlineWifi, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi'

const WebSocketStatus = () => {
    const { isConnected, connectionStatus, reconnectAttempt, connect, disconnect } = useWebSocket()

    const getStatusConfig = () => {
        switch (connectionStatus) {
            case 'connected':
                return {
                    icon: HiOutlineWifi,
                    text: 'Đã kết nối',
                    bgColor: 'bg-green-50',
                    textColor: 'text-green-700',
                    iconColor: 'text-green-500',
                    borderColor: 'border-green-200'
                }
            case 'connecting':
                return {
                    icon: HiOutlineRefresh,
                    text: 'Đang kết nối...',
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-700',
                    iconColor: 'text-blue-500',
                    borderColor: 'border-blue-200',
                    animate: true
                }
            case 'error':
                return {
                    icon: HiOutlineX,
                    text: 'Lỗi kết nối',
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-700',
                    iconColor: 'text-red-500',
                    borderColor: 'border-red-200'
                }
            case 'disconnected':
            default:
                return {
                    icon: HiOutlineX,
                    text: 'Ngắt kết nối',
                    bgColor: 'bg-gray-50',
                    textColor: 'text-gray-700',
                    iconColor: 'text-gray-500',
                    borderColor: 'border-gray-200'
                }
        }
    }

    const config = getStatusConfig()
    const IconComponent = config.icon

    return (
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg px-3 py-2 flex items-center gap-2`}>
            <IconComponent 
                className={`h-4 w-4 ${config.iconColor} ${config.animate ? 'animate-spin' : ''}`} 
            />
            <span className={`text-sm font-medium ${config.textColor}`}>
                {config.text}
            </span>
            
            {reconnectAttempt > 0 && (
                <span className="text-xs text-gray-500">
                    (Lần {reconnectAttempt})
                </span>
            )}
            
            {/* Action buttons */}
            {!isConnected && connectionStatus !== 'connecting' && (
                <button
                    onClick={connect}
                    className="ml-2 text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                    Kết nối
                </button>
            )}
            
            {isConnected && (
                <button
                    onClick={disconnect}
                    className="ml-2 text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                    Ngắt
                </button>
            )}
        </div>
    )
}

export default WebSocketStatus

