import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { LuMaximize, LuMinimize, LuRadio, LuScanFace } from 'react-icons/lu'
import { identifyStudent } from '../api/faces/faceApi'
import { getLiveSessions } from '../api/schedule/getSchedule'
import CameraView from '../components/camera/CameraView'
import useCamera from '../components/camera/useCamera'
import useRecognitionLoop from '../components/camera/useRecognitionLoop'
import { Button, Card, CardHeader, EmptyState, Notice, PageHeader, StatusChip } from '../components/ui'

const REASON_COPY = {
    NoActiveSession: 'No session is running for this student right now',
    AlreadyRecorded: 'Already checked in',
    DeviceDisabled: 'The webcam station is disabled on the Devices page'
}
const REMARK_VARIANT = { 'On Time': 'present', Late: 'late' }
// Sau khi nhận ra một người thì giữ kết quả trên màn hình một lúc cho họ kịp đọc.
const HOLD_MS = 2500

/** Trạm điểm danh bằng webcam: thay cho ESP32-CAM khi demo hoặc khi chưa có phần cứng. */
export default function CheckIn() {
    const camera = useCamera()
    const [sessions, setSessions] = useState([])
    const [log, setLog] = useState([])
    const [banner, setBanner] = useState(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const holdUntilRef = useRef(0)
    const stageRef = useRef(null)

    const loadSessions = useCallback(() => {
        getLiveSessions()
            .then((res) => setSessions(res?.data ?? []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        loadSessions()
        const timer = setInterval(loadSessions, 30000)
        return () => clearInterval(timer)
    }, [loadSessions])

    useEffect(() => {
        const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const handleResult = useCallback(
        (res) => {
            if (Date.now() < holdUntilRef.current) return
            if (!res.match) {
                setBanner(null)
                return
            }
            const entry = { id: `${res.match.student_id}-${Date.now()}`, ...res.match, attendance: res.attendance, liveness: res.liveness, at: new Date() }
            setBanner(entry)
            holdUntilRef.current = Date.now() + HOLD_MS
            if (res.attendance?.recorded) {
                setLog((prev) => [entry, ...prev].slice(0, 30))
                loadSessions()
            }
        },
        [loadSessions]
    )

    const { result, error } = useRecognitionLoop({
        camera,
        enabled: true,
        intervalMs: 1000,
        identify: (image, signal) => identifyStudent(image, { checkIn: true, signal }),
        onResult: handleResult
    })

    const active = sessions.filter((s) => s.is_active)

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen?.()
        else stageRef.current?.requestFullscreen?.()
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Attendance · webcam"
                title="Check-in station"
                description="Students look at the camera and are checked in to the session running now, exactly like an ESP32-CAM in the classroom."
                actions={
                    <Button as={Link} to="/live" variant="secondary">
                        <LuRadio className="h-4 w-4" aria-hidden="true" />
                        Open live roll sheet
                    </Button>
                }
            />

            {active.length === 0 && (
                <Notice>No session is running right now, so faces are recognised but nothing is recorded. Create a session for the current time on the Schedule page to try it.</Notice>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div ref={stageRef} className="relative bg-black [&:fullscreen]:grid [&:fullscreen]:place-items-center">
                    <CameraView
                        camera={camera}
                        box={result?.box}
                        boxTone={banner ? 'match' : 'neutral'}
                        className={classNames('w-full', isFullscreen ? 'h-[100dvh]' : 'aspect-video')}
                        rounded={isFullscreen ? 'rounded-none' : 'rounded-xl'}
                    >
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                            className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-white backdrop-blur"
                        >
                            {isFullscreen ? <LuMinimize className="h-4 w-4" /> : <LuMaximize className="h-4 w-4" />}
                        </button>

                        <div className="absolute inset-x-3 bottom-3" aria-live="assertive">
                            {banner ? (
                                <div className="animate-fade-in rounded-xl bg-black/70 px-4 py-3 text-white backdrop-blur">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-lg font-semibold tracking-[-0.02em]">{banner.full_name}</p>
                                        {banner.attendance?.recorded ? (
                                            <span className="animate-stamp font-data rounded-md border-2 border-present px-2 py-0.5 text-sm font-semibold uppercase text-present">
                                                {banner.attendance.remark === 'Late' ? 'Late' : 'On time'}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 text-xs text-white/75">
                                        {banner.attendance?.recorded
                                            ? `${banner.attendance.session.subject} · ${banner.attendance.session.room} · ${banner.attendance.time}`
                                            : REASON_COPY[banner.attendance?.reason] ?? 'Recognised'}
                                        {banner.liveness?.verdict === 'fake' && ' · flagged by anti-spoofing'}
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl bg-black/50 px-4 py-2.5 text-sm text-white/85 backdrop-blur">
                                    {error ? error : result?.face_count ? 'Not recognised. Has this student had a face captured?' : 'Look at the camera to check in'}
                                </div>
                            )}
                        </div>
                    </CameraView>
                </div>

                <div className="space-y-6">
                    <Card padded={false}>
                        <CardHeader title="Running now" description="Check-ins go to these sessions" />
                        <ul className="divide-y divide-border">
                            {active.length === 0 ? (
                                <li className="px-5 py-4 text-sm text-text-tertiary">Nothing running</li>
                            ) : (
                                active.map((s) => (
                                    <li key={s.id} className="px-5 py-3">
                                        <p className="text-sm font-medium text-text">{s.subject_name}</p>
                                        <p className="font-data mt-0.5 text-xs text-text-tertiary">
                                            {s.room} · {s.start_time}–{s.end_time} · {s.on_time + s.late}/{s.expected}
                                        </p>
                                    </li>
                                ))
                            )}
                        </ul>
                    </Card>

                    <Card padded={false}>
                        <CardHeader title="Checked in here" description="This browser session only" />
                        {log.length === 0 ? (
                            <EmptyState icon={LuScanFace} title="No check-ins yet" />
                        ) : (
                            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                                {log.map((entry) => (
                                    <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-text">{entry.full_name}</p>
                                            <p className="font-data text-[11px] text-text-tertiary">
                                                {entry.attendance.time} · {entry.attendance.session.subject}
                                            </p>
                                        </div>
                                        <StatusChip variant={REMARK_VARIANT[entry.attendance.remark] ?? 'neutral'}>{entry.attendance.remark === 'Late' ? 'Late' : 'On time'}</StatusChip>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
