import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { LuCopy, LuPlay, LuRefreshCw, LuTerminal } from 'react-icons/lu'
import { useWebSocket } from '../contexts/WebSocketContext'
import { getFaceEngineStatus, getVisitors } from '../api/faces/faceApi'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { WS_URL, AWS_REGION, AWS_S3_BUCKET } from '../config/api'
import { Button, Card, CardHeader, IconButton, PageHeader, Segmented, Textarea } from '../components/ui'

const QUICK_PAYLOADS = {
    Ping: '{\n  "action": "ping"\n}',
    listFaces: '{\n  "action": "listFaces",\n  "classId": "YOUR_CLASS_ID"\n}',
    getCollectionInfo: '{\n  "action": "getCollectionInfo",\n  "classId": "YOUR_CLASS_ID"\n}'
}

const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
]

export default function Settings() {
    const { t } = useLanguage()
    const { theme, setTheme } = useTheme()
    const { isLocalMode, isConnected, connectionStatus, connect, disconnect, ping, latency, sendMessage, messageHistory } = useWebSocket()
    const { showSuccess, showInfo } = useToast()

    const [customPayload, setCustomPayload] = useState(QUICK_PAYLOADS.getCollectionInfo)
    const [sending, setSending] = useState(false)

    const handleSendTestPayload = () => {
        setSending(true)
        try {
            const parsed = JSON.parse(customPayload)
            if (sendMessage(parsed)) showSuccess('Payload sent to AWS WebSocket Gateway', 'WebSocket tester')
        } catch (err) {
            showInfo('Invalid JSON payload: ' + err.message, 'Syntax error')
        } finally {
            setSending(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        showSuccess('Copied to clipboard', 'Clipboard')
    }

    return (
        <div className="mx-auto max-w-[960px] space-y-6">
            <PageHeader eyebrow="System" title={t('systemSettings')} description={t('systemSettingsDesc')} />

            {isLocalMode ? (
                <LocalEngineCard />
            ) : (
            <Card padded={false}>
                <CardHeader
                    title="AWS WebSocket Gateway diagnostics"
                    description="Inspect the live API Gateway v2 connection"
                    action={
                        <div className="flex shrink-0 items-center gap-2">
                            {isConnected ? (
                                <Button variant="secondary" size="sm" onClick={disconnect}>
                                    Disconnect
                                </Button>
                            ) : (
                                <Button size="sm" onClick={() => connect()}>
                                    <LuRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                                    Reconnect
                                </Button>
                            )}
                            <Button variant="secondary" size="sm" disabled={!isConnected} onClick={ping}>
                                Measure latency
                            </Button>
                        </div>
                    }
                />

                <div className="space-y-6 p-5">
                    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                        <InfoTile label="Status">
                            <span className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-present' : 'bg-text-tertiary'}`} aria-hidden="true" />
                                <span className={isConnected ? 'text-present' : 'text-text'}>{isConnected ? 'Connected' : connectionStatus}</span>
                            </span>
                        </InfoTile>
                        <InfoTile label="Round-trip latency">{latency ? `${latency} ms` : '—'}</InfoTile>
                        <InfoTile label="Protocol">WSS / JSON</InfoTile>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="ws-endpoint" className="field-label">
                            WebSocket endpoint
                        </label>
                        <div className="flex gap-2">
                            <input id="ws-endpoint" readOnly value={WS_URL} className="control font-data h-9 px-3 text-xs text-text-secondary" />
                            <IconButton icon={LuCopy} label="Copy endpoint URL" className="h-9 w-9 border border-border bg-surface" onClick={() => copyToClipboard(WS_URL)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label htmlFor="ws-payload" className="field-label flex items-center gap-1.5">
                                <LuTerminal className="h-3.5 w-3.5" aria-hidden="true" />
                                Live test payload
                            </label>
                            <div className="flex gap-1.5">
                                {Object.entries(QUICK_PAYLOADS).map(([label, payload]) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setCustomPayload(payload)}
                                        className="font-data rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-[10px] text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/[0.08] hover:text-text"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Textarea id="ws-payload" rows={4} value={customPayload} onChange={(e) => setCustomPayload(e.target.value)} className="font-data text-xs" />

                        <div className="flex justify-end">
                            <Button size="sm" disabled={!isConnected || sending} onClick={handleSendTestPayload}>
                                <LuPlay className="h-3.5 w-3.5" aria-hidden="true" />
                                Send WebSocket frame
                            </Button>
                        </div>
                    </div>

                    {messageHistory.length > 0 && (
                        <div className="space-y-2">
                            <div className="field-label">Received frames · {messageHistory.length}</div>
                            <div className="font-data max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-input p-3 text-xs">
                                {messageHistory.map((item) => (
                                    <div key={item.id} className="border-b border-border pb-1.5 last:border-0">
                                        <span className="text-text-tertiary">{new Date(item.timestamp).toLocaleTimeString()} → </span>
                                        <span className="break-all text-text-secondary">{JSON.stringify(item.data)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
            )}

            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                <Card padded={false}>
                    <CardHeader title="AWS infrastructure" description="Provisioned with Terraform" />
                    <div className="m-5 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border">
                        <InfoTile label="AWS region">{AWS_REGION}</InfoTile>
                        <InfoTile label="S3 storage bucket">{AWS_S3_BUCKET}</InfoTile>
                    </div>
                </Card>

                <Card padded={false}>
                    <CardHeader title={t('appearance')} description={t('appearanceDesc')} />
                    <div className="flex items-center justify-between gap-4 p-5">
                        <span className="text-sm text-text">Theme</span>
                        <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} label="Theme" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

function InfoTile({ label, children }) {
    return (
        <div className="min-w-0 bg-surface p-4">
            <div className="text-xs text-text-tertiary">{label}</div>
            <div className="font-data mt-1 truncate text-sm font-medium text-text">{children}</div>
        </div>
    )
}

InfoTile.propTypes = {
    label: PropTypes.string.isRequired,
    children: PropTypes.node
}

function LocalEngineCard() {
    const [status, setStatus] = useState(null)
    const [visitors, setVisitors] = useState(null)

    useEffect(() => {
        getFaceEngineStatus().then(setStatus).catch(() => setStatus({ online: false, models: false }))
        getVisitors()
            .then((res) => setVisitors(res))
            .catch(() => {})
    }, [])

    const ready = status?.online && status?.models
    return (
        <Card padded={false}>
            <CardHeader
                title="Local recognition engine"
                description="SATS X is running without AWS. Faces are matched on this computer with OpenCV YuNet and SFace."
                action={
                    <Button as={Link} to="/kiosk" size="sm">
                        Open exhibition kiosk
                    </Button>
                }
            />
            <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                    <InfoTile label="Engine">
                        <span className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-present' : 'bg-absent'}`} aria-hidden="true" />
                            <span className={ready ? 'text-present' : 'text-absent'}>{status === null ? 'Checking…' : ready ? 'Ready' : status.online ? 'Models missing' : 'Not running'}</span>
                        </span>
                    </InfoTile>
                    <InfoTile label="Student face photos">{status?.templates ?? '—'}</InfoTile>
                    <InfoTile label="Kiosk visitors">{visitors ? `${visitors.count} · auto-delete ${visitors.ttl_minutes} min` : '—'}</InfoTile>
                </div>
                <p className="text-xs leading-5 text-text-tertiary">
                    To use AWS Rekognition and ESP32-CAM devices instead, set <code className="font-data">VITE_WS_URL</code> in <code className="font-data">frontend/.env</code> to the
                    deployed WebSocket URL and restart with <code className="font-data">./start.sh</code>.
                </p>
            </div>
        </Card>
    )
}
