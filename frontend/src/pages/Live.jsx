import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { LuCalendarPlus, LuCamera, LuCircleAlert, LuClock, LuMapPin, LuScanFace, LuShieldAlert, LuUser } from 'react-icons/lu'
import { getLiveSessions, getSessionRoster } from '../api/schedule/getSchedule'
import { captureOnDevice, getDevices } from '../api/device/deviceApi'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useToast } from '../contexts/ToastContext'
import { apiErrorMessage } from '../lib/errors'
import ImagePreview from '../components/Attendance/ImagePreview'
import RosterSheet from '../components/Live/RosterSheet'
import SessionProgress from '../components/Live/SessionProgress'
import { Button, Card, CardHeader, EmptyState, LoadingState, Segmented } from '../components/ui'

const POLL_MS = 20000
const FRESH_MS = 2600

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Waiting' },
    { value: 'arrived', label: 'Arrived' }
]

const REMARK_BY_STATE = { present: 'On Time', late: 'Late', absent: 'Absent' }

const EXCEPTION_COPY = {
    unknown: { icon: LuCircleAlert, title: 'Unrecognized face', tone: 'text-text-secondary' },
    rejected: { icon: LuShieldAlert, title: 'Possible spoof rejected', tone: 'text-danger' },
    not_recorded: { icon: LuCircleAlert, title: 'Recognized, not recorded', tone: 'text-late' }
}

const pickDefaultSession = (sessions) => sessions.find((s) => s.is_active) ?? sessions.find((s) => s.status === 'scheduled') ?? sessions[sessions.length - 1] ?? null

export default function Live() {
    const ws = useWebSocket()
    const { liveEvents, isConnected } = ws
    const { showError, showSuccess } = useToast()

    const [sessions, setSessions] = useState(null)
    const [selectedId, setSelectedId] = useState(null)
    const [roster, setRoster] = useState([])
    const [devices, setDevices] = useState([])
    const [filter, setFilter] = useState('all')
    const [freshIds, setFreshIds] = useState(() => new Set())
    const [capturing, setCapturing] = useState(null)
    const [preview, setPreview] = useState(null)

    const statesRef = useRef(new Map())

    const loadSessions = useCallback(async () => {
        try {
            const res = await getLiveSessions()
            const list = res?.data ?? []
            setSessions(list)
            setSelectedId((current) => (list.some((s) => s.id === current) ? current : (pickDefaultSession(list)?.id ?? null)))
        } catch (err) {
            setSessions((current) => current ?? [])
            showError(apiErrorMessage(err, 'Could not load today’s sessions'), 'Error')
        }
    }, [showError])

    const loadRoster = useCallback(async (id) => {
        const res = await getSessionRoster(id)
        const list = res?.data ?? []
        const previous = statesRef.current

        // Dấu chỉ "đóng" khi có thay đổi thật, không chạy lại mỗi lần tải dữ liệu.
        if (previous.size > 0) {
            const arrivals = list.filter((s) => s.state !== 'pending' && previous.get(s.student_id) === 'pending').map((s) => s.student_id)
            if (arrivals.length > 0) {
                setFreshIds(new Set(arrivals))
                setTimeout(() => setFreshIds(new Set()), FRESH_MS)
            }
        }

        statesRef.current = new Map(list.map((s) => [s.student_id, s.state]))
        setRoster(list)
    }, [])

    const refreshAll = useCallback(() => {
        loadSessions()
        getDevices()
            .then((res) => setDevices(res?.data ?? []))
            .catch((err) => console.warn('Failed to load devices:', err))
    }, [loadSessions])

    useEffect(() => {
        refreshAll()
        const timer = setInterval(refreshAll, POLL_MS)
        return () => clearInterval(timer)
    }, [refreshAll])

    useEffect(() => {
        statesRef.current = new Map()
        setRoster([])
        if (!selectedId) return undefined

        loadRoster(selectedId).catch((err) => showError(apiErrorMessage(err, 'Could not load the roster'), 'Error'))
        const timer = setInterval(() => loadRoster(selectedId).catch(() => {}), POLL_MS)
        return () => clearInterval(timer)
    }, [selectedId, loadRoster, showError])

    // Có sự kiện từ camera thì tải lại ngay, không đợi tới lượt kiểm tra định kỳ.
    const latestEventId = liveEvents[0]?.id
    useEffect(() => {
        if (!latestEventId || !selectedId) return
        loadRoster(selectedId).catch(() => {})
        loadSessions()
    }, [latestEventId, selectedId, loadRoster, loadSessions])

    const session = sessions?.find((s) => s.id === selectedId) ?? null

    const students = useMemo(() => {
        const numbered = roster.map((student, index) => ({ ...student, index: index + 1 }))
        if (filter === 'pending') return numbered.filter((s) => s.state === 'pending')
        if (filter === 'arrived') return numbered.filter((s) => s.state === 'present' || s.state === 'late')
        return numbered
    }, [roster, filter])

    const exceptions = liveEvents.filter((event) => EXCEPTION_COPY[event.type] || event.liveness?.verdict === 'fake').slice(0, 6)

    const sessionRoom = session?.room?.toLowerCase()
    const sortedDevices = useMemo(
        () => [...devices].sort((a, b) => Number(b.room?.toLowerCase() === sessionRoom) - Number(a.room?.toLowerCase() === sessionRoom) || Number(b.online) - Number(a.online)),
        [devices, sessionRoom]
    )

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

    const openStudent = (student) =>
        setPreview({
            student_name: student.full_name,
            student_id: student.student_id,
            subject_name: session?.subject_name,
            status: student.state === 'absent' ? 0 : 1,
            remark: REMARK_BY_STATE[student.state],
            time: student.time,
            day: session?.day,
            month: session?.month,
            year: session?.year,
            image_key: student.image_key,
            liveness_verdict: student.liveness_verdict,
            liveness_score: student.liveness_score
        })

    if (sessions === null) return <LoadingState label="Opening today’s sessions..." />

    if (sessions.length === 0) {
        return (
            <section className="canvas-band rounded-2xl border border-border px-6 py-16 shadow-panel">
                <EmptyState
                    icon={LuCalendarPlus}
                    title="No sessions today"
                    description="The roll sheet opens here on days with a scheduled session."
                    action={
                        <Button as={Link} to="/schedule" size="sm">
                            Open schedule
                        </Button>
                    }
                />
            </section>
        )
    }

    const arrived = (session?.on_time ?? 0) + (session?.late ?? 0)
    const waiting = Math.max((session?.expected ?? 0) - arrived - (session?.absent ?? 0), 0)

    return (
        <div className="space-y-5">
            <section className="canvas-band overflow-hidden rounded-2xl border border-border shadow-panel">
                <div className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-secondary">
                            <span className={classNames('h-1.5 w-1.5 rounded-full', session?.is_active ? 'animate-pulse bg-present' : 'bg-text-tertiary')} aria-hidden="true" />
                            {session?.is_active ? 'In session' : session?.status === 'scheduled' ? 'Up next' : 'Ended'}
                        </div>
                        <h1 className="mt-4 truncate text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-text sm:text-5xl">{session?.subject_name}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-secondary">
                            <span className="font-data flex items-center gap-1.5">
                                <LuClock className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                                {session?.start_time} – {session?.end_time}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <LuMapPin className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                                {session?.room}
                            </span>
                            {session?.teacher_name && (
                                <span className="flex items-center gap-1.5">
                                    <LuUser className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                                    {session.teacher_name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="w-full shrink-0 lg:w-80">
                        <div className="flex items-baseline gap-2">
                            <span className="font-data text-6xl font-semibold leading-none tracking-[-0.04em] text-text">{arrived}</span>
                            <span className="font-data text-xl text-text-tertiary">/ {session?.expected ?? 0}</span>
                            <span className="ml-auto text-xs text-text-tertiary">arrived</span>
                        </div>
                        <SessionProgress onTime={session?.on_time ?? 0} late={session?.late ?? 0} absent={session?.absent ?? 0} expected={session?.expected ?? 0} className="mt-4" />
                        <dl className="mt-3 grid grid-cols-3 text-xs">
                            <Tally label="Late" value={session?.late ?? 0} tone="text-late" />
                            <Tally label="Absent" value={session?.absent ?? 0} tone="text-absent" />
                            <Tally label="Waiting" value={waiting} tone="text-text" />
                        </dl>
                    </div>
                </div>

                {sessions.length > 1 && (
                    <div className="flex gap-px overflow-x-auto border-t border-border bg-border [scrollbar-width:none]">
                        {sessions.map((item) => {
                            const active = item.id === selectedId
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setSelectedId(item.id)}
                                    className={classNames(
                                        'min-w-[190px] flex-1 px-5 py-3 text-left transition-colors',
                                        active ? 'bg-surface' : 'bg-surface-sunken hover:bg-surface-hover'
                                    )}
                                >
                                    <span className="font-data flex items-center gap-1.5 text-[11px] text-text-tertiary">
                                        {item.is_active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-present" aria-hidden="true" />}
                                        {item.start_time} – {item.end_time}
                                    </span>
                                    <span className={classNames('mt-0.5 block truncate text-[13px] font-medium', active ? 'text-text' : 'text-text-secondary')}>{item.subject_name}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </section>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <Card padded={false} className="overflow-hidden">
                    <CardHeader
                        title="Roll sheet"
                        description="Sorted by name. Select a stamped row to see its record."
                        action={<Segmented options={FILTERS} value={filter} onChange={setFilter} label="Filter students" />}
                    />
                    {students.length === 0 ? (
                        <EmptyState
                            icon={LuScanFace}
                            title={roster.length === 0 ? 'No students on this roster' : 'Nobody in this view'}
                            description={roster.length === 0 ? 'Assign a class to this subject to fill the roll sheet.' : undefined}
                        />
                    ) : (
                        <RosterSheet students={students} freshIds={freshIds} onSelect={openStudent} />
                    )}
                </Card>

                <aside className="space-y-4">
                    <Card padded={false}>
                        <CardHeader title="Cameras" description={isConnected ? 'Live connection' : 'Live updates are offline'} />
                        {sortedDevices.length === 0 ? (
                            <p className="px-5 py-6 text-xs text-text-tertiary">Cameras appear here after they first connect.</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {sortedDevices.slice(0, 5).map((device) => (
                                    <li key={device.device_id} className="flex items-center gap-3 px-5 py-2.5">
                                        <span className={classNames('h-2 w-2 shrink-0 rounded-full', device.online ? 'animate-lamp bg-present' : 'bg-text-tertiary')} aria-hidden="true" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-medium text-text">{device.name || device.device_id}</span>
                                            <span className="block truncate text-[11px] text-text-tertiary">
                                                {device.room || 'No room'} · {device.online ? 'Online' : 'Offline'}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Capture on ${device.name || device.device_id}`}
                                            title="Capture now"
                                            disabled={!device.online || !isConnected || capturing === device.device_id}
                                            onClick={() => handleCapture(device)}
                                            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-40"
                                        >
                                            <LuCamera className="h-3.5 w-3.5" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    <Card padded={false}>
                        <CardHeader title="Needs attention" description="From this browser session" />
                        {exceptions.length === 0 ? (
                            <p className="px-5 py-6 text-xs text-text-tertiary">Nothing to review right now.</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {exceptions.map((event) => {
                                    const copy = EXCEPTION_COPY[event.type] ?? { icon: LuShieldAlert, title: 'Possible spoof, needs review', tone: 'text-late' }
                                    const Icon = copy.icon
                                    return (
                                        <li key={event.id} className="flex items-start gap-2.5 px-5 py-2.5">
                                            <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${copy.tone}`} aria-hidden="true" />
                                            <span className="min-w-0">
                                                <span className="block text-xs font-medium text-text">{copy.title}</span>
                                                <span className="font-data block truncate text-[11px] text-text-tertiary">
                                                    {event.studentName || event.studentId || event.classId} · {new Date(event.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </Card>
                </aside>
            </div>

            <ImagePreview isOpen={Boolean(preview)} onClose={() => setPreview(null)} attendanceRecord={preview} />
        </div>
    )
}

function Tally({ label, value, tone }) {
    return (
        <div>
            <dt className="text-text-tertiary">{label}</dt>
            <dd className={`font-data mt-0.5 text-base font-semibold ${tone}`}>{value}</dd>
        </div>
    )
}
