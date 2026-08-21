import PropTypes from 'prop-types'
import classNames from 'classnames'
import { HiOutlineRefresh } from 'react-icons/hi'
import { useWebSocket } from '../../contexts/WebSocketContext'

const DOT_TONE = {
    connected: 'bg-present',
    connecting: 'bg-late animate-pulse',
    disconnected: 'bg-text-tertiary'
}

export default function WebSocketStatus({ compact = false }) {
    const { isConnected, connectionStatus, connect, latency } = useWebSocket()
    const tone = isConnected ? 'connected' : connectionStatus === 'connecting' ? 'connecting' : 'disconnected'

    const label = isConnected
        ? `Đã kết nối${latency ? ` · ${latency}ms` : ''}`
        : connectionStatus === 'connecting'
          ? 'Đang kết nối…'
          : 'Mất kết nối'

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-1 text-xs text-text-secondary">
                <span className={classNames('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONE[tone])} aria-hidden="true" />
                <span className="font-data truncate">{label}</span>
                {!isConnected && connectionStatus !== 'connecting' && (
                    <button onClick={connect} className="ml-auto shrink-0 text-accent hover:text-accent-hover" title="Kết nối lại">
                        <HiOutlineRefresh className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="inline-flex items-center gap-2.5 rounded-chip border border-border bg-surface px-3 py-1.5 text-xs">
            <span className={classNames('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONE[tone])} aria-hidden="true" />
            <span className="font-medium text-text-secondary">{label}</span>
            {!isConnected && connectionStatus !== 'connecting' && (
                <button onClick={connect} className="flex items-center gap-1 font-medium text-accent hover:text-accent-hover">
                    <HiOutlineRefresh className="h-3 w-3" />
                    Thử lại
                </button>
            )}
        </div>
    )
}

WebSocketStatus.propTypes = {
    compact: PropTypes.bool
}
