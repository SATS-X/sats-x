import { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import { LuCamera, LuCircleArrowUp, LuCpu, LuMapPin, LuPencil, LuRefreshCw, LuTrash2 } from 'react-icons/lu'
import { captureOnDevice, deleteDevice, getDevices } from '../api/device/deviceApi'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { formatRelativeTime } from '../lib/date'
import { apiErrorMessage } from '../lib/errors'
import DeviceEditModal from '../components/Devices/DeviceEditModal'
import FirmwareModal from '../components/Devices/FirmwareModal'
import { Button, Card, EmptyState, IconButton, LoadingState, Modal, Notice, PageHeader, StatusChip } from '../components/ui'

const POLL_MS = 30000

const statusChip = (device) => {
    if (device.status === 'disabled') return { variant: 'neutral', label: 'Disabled' }
    return device.online ? { variant: 'present', label: 'Online' } : { variant: 'absent', label: 'Offline' }
}

export default function Devices() {
    const ws = useWebSocket()
    const { user } = useAuth()
    const { showSuccess, showError } = useToast()

    const [devices, setDevices] = useState([])
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null) // 'edit' | 'firmware' | 'delete'
    const [selected, setSelected] = useState(null)
    const [capturing, setCapturing] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const isAdmin = user?.role === 'admin'

    const fetchDevices = useCallback(async () => {
        try {
            const res = await getDevices()
            setDevices(res?.data ?? [])
            setRooms(res?.rooms ?? [])
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not load devices'), 'Error')
        } finally {
            setLoading(false)
        }
    }, [showError])

    useEffect(() => {
        fetchDevices()
        const timer = setInterval(fetchDevices, POLL_MS)
        return () => clearInterval(timer)
    }, [fetchDevices])

    const openModal = (name, device) => {
        setSelected(device)
        setModal(name)
    }

    const handleCapture = async (device) => {
        setCapturing(device.device_id)
        try {
            await captureOnDevice(ws, device.device_id)
            showSuccess(`Capture sent to ${device.name || device.device_id}`, 'Camera')
        } catch (err) {
            showError(err.message, 'Camera')
        } finally {
            setCapturing(null)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await deleteDevice(selected.device_id)
            showSuccess('Device removed', 'Success')
            setModal(null)
            fetchDevices()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not remove the device'), 'Error')
        } finally {
            setDeleting(false)
        }
    }

    const onlineCount = devices.filter((d) => d.online).length
    const unassigned = devices.filter((d) => !d.room && d.status === 'active').length

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Online · ${onlineCount} of ${devices.length}`}
                title="Devices"
                description="Assign each camera to a room, watch its connection, and keep its firmware current."
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchDevices}>
                        <LuRefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Refresh
                    </Button>
                }
            />

            {unassigned > 0 && (
                <div className="flex items-center gap-2.5 rounded-xl border border-late/25 bg-late/[0.07] px-4 py-3 text-[13px] text-text-secondary">
                    <LuMapPin className="h-4 w-4 shrink-0 text-late" aria-hidden="true" />
                    {unassigned} {unassigned === 1 ? 'camera has' : 'cameras have'} no room yet and will follow every room’s schedule.
                </div>
            )}

            {loading ? (
                <LoadingState label="Loading devices..." />
            ) : devices.length === 0 ? (
                <Card padded={false}>
                    <EmptyState icon={LuCpu} title="No cameras connected yet" description="A camera appears here automatically the first time it connects." />
                </Card>
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {devices.map((device) => {
                        const chip = statusChip(device)
                        return (
                            <Card key={device.device_id} padded={false} className="overflow-hidden transition-colors hover:border-accent/35">
                                <div className="canvas-band flex items-start justify-between gap-3 border-b border-border p-5">
                                    <div className="flex min-w-0 items-center gap-3.5">
                                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface">
                                            <span className={classNames('h-2.5 w-2.5 rounded-full', device.online ? 'animate-lamp bg-present' : 'bg-text-tertiary')} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-text">{device.name || device.device_id}</h3>
                                            <p className="font-data truncate text-[11px] text-text-tertiary">{device.device_id}</p>
                                        </div>
                                    </div>
                                    <StatusChip variant={chip.variant} className="shrink-0">
                                        {chip.label}
                                    </StatusChip>
                                </div>

                                <dl className="grid grid-cols-3 gap-px bg-border">
                                    <Fact label="Room" value={device.room || '—'} />
                                    <Fact label="Firmware" value={device.firmware_version || '—'} mono />
                                    <Fact label="Last seen" value={formatRelativeTime(device.last_seen_at)} />
                                </dl>

                                <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                                    <Button variant="ghost" size="sm" disabled={!device.online || !ws.isConnected || capturing === device.device_id} onClick={() => handleCapture(device)}>
                                        <LuCamera className="h-3.5 w-3.5" aria-hidden="true" />
                                        Capture now
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {isAdmin && (
                                            <IconButton
                                                icon={LuCircleArrowUp}
                                                label={`Update firmware on ${device.device_id}`}
                                                disabled={!device.online || !ws.isConnected}
                                                onClick={() => openModal('firmware', device)}
                                            />
                                        )}
                                        <IconButton icon={LuPencil} label={`Edit ${device.device_id}`} onClick={() => openModal('edit', device)} />
                                        <IconButton icon={LuTrash2} label={`Remove ${device.device_id}`} tone="danger" onClick={() => openModal('delete', device)} />
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            <DeviceEditModal isOpen={modal === 'edit'} onClose={() => setModal(null)} device={selected} rooms={rooms} onSaved={fetchDevices} />
            <FirmwareModal isOpen={modal === 'firmware'} onClose={() => setModal(null)} device={selected} />

            <Modal
                isOpen={modal === 'delete'}
                onClose={() => setModal(null)}
                title="Remove device"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting}>
                            Remove device
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                        Remove <span className="font-data font-semibold text-text">{selected?.device_id}</span> from this list?
                    </p>
                    <Notice>If the camera is still running it will reappear without its room. Disable it instead to stop it from recording attendance.</Notice>
                </div>
            </Modal>
        </div>
    )
}

function Fact({ label, value, mono }) {
    return (
        <div className="min-w-0 bg-surface px-5 py-3">
            <dt className="text-[11px] text-text-tertiary">{label}</dt>
            <dd className={classNames('mt-0.5 truncate text-[13px] font-medium text-text', mono && 'font-data')}>{value}</dd>
        </div>
    )
}
