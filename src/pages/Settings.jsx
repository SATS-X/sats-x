import { useState } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineCloud, HiOutlineClipboardCopy, HiOutlinePlay, HiOutlineRefresh } from 'react-icons/hi'
import { RiSignalWifiFill, RiTerminalBoxLine } from 'react-icons/ri'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { WS_URL, AWS_REGION, AWS_S3_BUCKET } from '../config/api'
import { Badge, Button, Card, Select } from '../components/ui'

const QUICK_PAYLOADS = {
    Ping: '{\n  "action": "ping"\n}',
    listFaces: '{\n  "action": "listFaces",\n  "classId": "D22CQCI01-N"\n}',
    getCollectionInfo: '{\n  "action": "getCollectionInfo",\n  "classId": "D22CQCI01-N"\n}'
}

export default function Settings() {
    const { t, language, setLanguage } = useLanguage()
    const { theme, setTheme } = useTheme()
    const { isConnected, connectionStatus, connect, disconnect, ping, latency, sendMessage, messageHistory } = useWebSocket()
    const { showSuccess, showInfo } = useToast()

    const [customPayload, setCustomPayload] = useState(QUICK_PAYLOADS.getCollectionInfo)
    const [sending, setSending] = useState(false)

    const handleSendTestPayload = () => {
        setSending(true)
        try {
            const parsed = JSON.parse(customPayload)
            if (sendMessage(parsed)) showSuccess('Đã gửi payload tới AWS WebSocket Gateway', 'WebSocket Tester')
        } catch (err) {
            showInfo('JSON payload không hợp lệ: ' + err.message, 'Lỗi cú pháp')
        } finally {
            setSending(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        showSuccess('Đã sao chép vào clipboard', 'Clipboard')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-text">{t('systemSettings')}</h1>
                <p className="mt-1 text-sm text-text-secondary">{t('systemSettingsDesc')}</p>
            </div>

            <Card padded={false}>
                <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-card border border-border text-text-secondary">
                            <RiSignalWifiFill className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-text">Chẩn đoán AWS WebSocket Gateway</h3>
                            <p className="text-xs text-text-secondary">Kiểm tra kết nối thời gian thực tới API Gateway v2</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <Button variant="secondary" size="sm" onClick={disconnect}>
                                Ngắt kết nối
                            </Button>
                        ) : (
                            <Button size="sm" onClick={connect}>
                                <HiOutlineRefresh className="h-3.5 w-3.5" />
                                Kết nối lại
                            </Button>
                        )}
                        <Button variant="secondary" size="sm" disabled={!isConnected} onClick={ping}>
                            Ping độ trễ
                        </Button>
                    </div>
                </div>

                <div className="space-y-6 p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <InfoTile label="Trạng thái">
                            <span className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-present' : 'bg-text-tertiary'}`} />
                                <span className={isConnected ? 'text-present' : 'text-text'}>
                                    {isConnected ? 'Đã kết nối' : connectionStatus}
                                </span>
                            </span>
                        </InfoTile>
                        <InfoTile label="Độ trễ round-trip">{latency ? `${latency} ms` : '—'}</InfoTile>
                        <InfoTile label="Giao thức">WSS / JSON</InfoTile>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Endpoint WebSocket Gateway</label>
                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={WS_URL}
                                className="font-data h-9 w-full rounded-card border border-border bg-surface-sunken px-3 text-xs text-text-secondary"
                            />
                            <Button variant="secondary" size="sm" onClick={() => copyToClipboard(WS_URL)} title="Sao chép URL">
                                <HiOutlineClipboardCopy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-text">
                                <RiTerminalBoxLine className="h-4 w-4" />
                                Gửi payload kiểm thử trực tiếp
                            </label>
                            <div className="flex gap-1.5">
                                {Object.entries(QUICK_PAYLOADS).map(([label, payload]) => (
                                    <button
                                        key={label}
                                        onClick={() => setCustomPayload(payload)}
                                        className="font-data rounded-chip bg-surface-hover px-2 py-1 text-[11px] text-text-secondary hover:text-text"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            rows={4}
                            value={customPayload}
                            onChange={(e) => setCustomPayload(e.target.value)}
                            className="font-data h-auto min-h-[6rem] w-full rounded-card border border-border bg-surface-sunken p-3 text-xs text-text"
                        />

                        <div className="flex justify-end">
                            <Button size="sm" disabled={!isConnected || sending} onClick={handleSendTestPayload}>
                                <HiOutlinePlay className="h-3.5 w-3.5" />
                                Gửi frame qua WebSocket
                            </Button>
                        </div>
                    </div>

                    {messageHistory.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-text-secondary">Nhật ký frame nhận được ({messageHistory.length})</div>
                            <div className="font-data max-h-48 space-y-2 overflow-y-auto rounded-card border border-border bg-surface-sunken p-3 text-xs">
                                {messageHistory.map((item) => (
                                    <div key={item.id} className="border-b border-border pb-1.5 last:border-0">
                                        <span className="text-text-tertiary">{new Date(item.timestamp).toLocaleTimeString()} → </span>
                                        <span className="text-text-secondary">{JSON.stringify(item.data)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card padded={false}>
                <div className="flex items-center gap-3 border-b border-border p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-card border border-border text-text-secondary">
                        <HiOutlineCloud className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text">Cấu hình hạ tầng AWS</h3>
                        <p className="text-xs text-text-secondary">Được triển khai tự động bởi Terraform</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    <InfoTile label="AWS Region">{AWS_REGION}</InfoTile>
                    <InfoTile label="S3 Storage Bucket">{AWS_S3_BUCKET}</InfoTile>
                </div>
            </Card>

            <Card padded={false}>
                <div className="border-b border-border p-5">
                    <h3 className="text-sm font-semibold text-text">{t('appearance')}</h3>
                    <p className="text-xs text-text-secondary">{t('appearanceDesc')}</p>
                </div>
                <div className="space-y-4 p-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text">Ngôn ngữ hiển thị</span>
                        <Select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-40">
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text">Giao diện</span>
                        <Select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-40">
                            <option value="light">Sáng</option>
                            <option value="dark">Tối</option>
                        </Select>
                    </div>
                </div>
            </Card>
        </div>
    )
}

function InfoTile({ label, children }) {
    return (
        <div className="space-y-1 rounded-card border border-border bg-surface-sunken p-4">
            <div className="text-[11px] uppercase tracking-wide text-text-tertiary">{label}</div>
            <div className="font-data text-sm font-semibold text-text">{children}</div>
        </div>
    )
}

InfoTile.propTypes = {
    label: PropTypes.string.isRequired,
    children: PropTypes.node
}
