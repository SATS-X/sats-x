import PropTypes from 'prop-types'
import classNames from 'classnames'
import { useEffect, useState } from 'react'
import { LuRefreshCw } from 'react-icons/lu'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { getFaceEngineStatus } from '../../api/faces/faceApi'

const TONE = {
    connected: { pill: 'border-present/20 bg-present/[0.08] text-present', dot: 'bg-present' },
    connecting: { pill: 'border-late/20 bg-late/[0.08] text-late', dot: 'bg-late animate-pulse' },
    disconnected: { pill: 'border-border bg-surface text-text-secondary', dot: 'bg-text-tertiary' }
}

/** Chế độ cục bộ không có cổng thiết bị AWS; thay vào đó báo bộ nhận diện có chạy không. */
function LocalStatus({ compact }) {
    const [online, setOnline] = useState(null)

    useEffect(() => {
        let active = true
        const check = () =>
            getFaceEngineStatus()
                .then((s) => active && setOnline(Boolean(s?.online && s?.models)))
                .catch(() => active && setOnline(false))
        check()
        const timer = setInterval(check, 30000)
        return () => {
            active = false
            clearInterval(timer)
        }
    }, [])

    const state = online ? 'connected' : online === null ? 'connecting' : 'disconnected'
    const label = online ? 'Local · engine on' : online === null ? 'Local' : 'Local · engine off'
    const title = online ? 'Running on this computer. Face recognition is ready.' : 'Running on this computer. The face engine is not reachable; run ./start.sh.'

    if (compact) {
        return (
            <span role="status" title={title} aria-label={label} className="grid h-9 w-6 place-items-center">
                <span className={classNames('h-2 w-2 rounded-full', TONE[state].dot)} />
            </span>
        )
    }

    return (
        <div role="status" title={title} className={classNames('inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.08em]', TONE[state].pill)}>
            <span className={classNames('h-1.5 w-1.5 shrink-0 rounded-full', TONE[state].dot)} aria-hidden="true" />
            {label}
        </div>
    )
}

LocalStatus.propTypes = { compact: PropTypes.bool }

export default function WebSocketStatus({ compact = false }) {
    const { isLocalMode } = useWebSocket()
    if (isLocalMode) return <LocalStatus compact={compact} />
    return <CloudStatus compact={compact} />
}

function CloudStatus({ compact }) {
    const { isConnected, connectionStatus, connect, latency } = useWebSocket()
    const state = isConnected ? 'connected' : connectionStatus === 'connecting' ? 'connecting' : 'disconnected'
    const canRetry = state === 'disconnected'

    const label = isConnected ? `Live${latency ? ` · ${latency}ms` : ''}` : state === 'connecting' ? 'Connecting' : 'Offline'

    if (compact) {
        return (
            <span role="status" title={`Device gateway: ${label}`} aria-label={`Device gateway: ${label}`} className="grid h-9 w-6 place-items-center">
                <span className={classNames('h-2 w-2 rounded-full', TONE[state].dot)} />
            </span>
        )
    }

    return (
        <div role="status" className={classNames('inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.08em]', TONE[state].pill)}>
            <span className={classNames('h-1.5 w-1.5 shrink-0 rounded-full', TONE[state].dot)} aria-hidden="true" />
            {label}
            {canRetry && (
                <button type="button" onClick={() => connect()} aria-label="Reconnect to device gateway" title="Reconnect" className="ml-0.5 text-accent hover:text-accent-hover">
                    <LuRefreshCw className="h-3 w-3" />
                </button>
            )}
        </div>
    )
}

WebSocketStatus.propTypes = {
    compact: PropTypes.bool
}

CloudStatus.propTypes = { compact: PropTypes.bool }
