import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuBan, LuCalendarRange, LuChevronLeft, LuChevronRight, LuMapPin, LuPencil, LuPlus, LuRotateCcw, LuTrash2, LuUser } from 'react-icons/lu'
import { deleteSchedule, getSchedule, updateSchedule } from '../api/schedule/getSchedule'
import { getManagedSubjects } from '../api/subject/getSubject'
import { getTerms } from '../api/term/termApi'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { addDays, formatLongDate, formatShortDate, startOfWeek, toISODate } from '../lib/date'
import { apiErrorMessage } from '../lib/errors'
import SessionFormModal from '../components/Schedule/SessionFormModal'
import TermsModal from '../components/Schedule/TermsModal'
import { Button, Card, EmptyState, IconButton, LoadingState, Modal, PageHeader, StatusChip } from '../components/ui'

const STATUS_CHIP = {
    completed: { variant: 'present', label: 'Completed' },
    no_attendance: { variant: 'late', label: 'No check-ins' },
    cancelled: { variant: 'neutral', label: 'Cancelled' }
}

const compareSessions = (a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)

export default function Schedule() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const { showError, showSuccess } = useToast()

    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
    const [sessions, setSessions] = useState([])
    const [subjects, setSubjects] = useState([])
    const [terms, setTerms] = useState([])
    const [loading, setLoading] = useState(true)

    const [modal, setModal] = useState(null) // 'form' | 'terms' | 'delete'
    const [selected, setSelected] = useState(null)
    const [busy, setBusy] = useState(false)

    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])

    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getSchedule({ from: toISODate(weekStart), to: toISODate(weekEnd) })
            setSessions(res?.success ? [...res.data].sort(compareSessions) : [])
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not load the schedule'), 'Error')
        } finally {
            setLoading(false)
        }
    }, [weekStart, weekEnd, showError])

    const fetchTerms = useCallback(async () => {
        const res = await getTerms()
        setTerms(res?.data ?? [])
    }, [])

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    useEffect(() => {
        Promise.all([getManagedSubjects(user), fetchTerms()])
            .then(([subjectsRes]) => setSubjects(subjectsRes?.data ?? []))
            .catch((err) => showError(apiErrorMessage(err, 'Could not load subjects and terms'), 'Error'))
    }, [user, fetchTerms, showError])

    const days = useMemo(() => {
        const grouped = new Map()
        sessions.forEach((session) => grouped.set(session.date, [...(grouped.get(session.date) ?? []), session]))
        return [...grouped.entries()]
    }, [sessions])

    const openModal = (name, session = null) => {
        setSelected(session)
        setModal(name)
    }

    const setCancelled = async (session, cancelled) => {
        try {
            await updateSchedule(session.id, { status: cancelled ? 'cancelled' : 'scheduled' })
            showSuccess(cancelled ? 'Session cancelled' : 'Session restored', 'Schedule updated')
            fetchSessions()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not update the session'), 'Error')
        }
    }

    const handleDelete = async (scope) => {
        setBusy(true)
        try {
            const res = await deleteSchedule(selected.id, scope)
            showSuccess(res.message, 'Schedule updated')
            setModal(null)
            fetchSessions()
            fetchTerms()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not delete the session'), 'Error')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Sessions · ${sessions.length}`}
                title={t('weeklySchedule')}
                description="Teaching sessions and attendance windows by room."
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => openModal('terms')}>
                            <LuCalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
                            Terms
                        </Button>
                        <Button size="sm" onClick={() => openModal('form')}>
                            <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Add sessions
                        </Button>
                    </>
                }
            />

            <div className="flex flex-wrap items-center gap-2">
                <IconButton icon={LuChevronLeft} label="Previous week" className="border border-border bg-surface" onClick={() => setWeekStart(addDays(weekStart, -7))} />
                <IconButton icon={LuChevronRight} label="Next week" className="border border-border bg-surface" onClick={() => setWeekStart(addDays(weekStart, 7))} />
                <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
                    This week
                </Button>
                <p className="font-data ml-1 text-[13px] text-text-secondary" aria-live="polite">
                    {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
                </p>
            </div>

            {loading ? (
                <LoadingState label="Loading schedule..." />
            ) : days.length === 0 ? (
                <Card padded={false}>
                    <EmptyState title="No sessions this week" description="Add one session, or create a weekly schedule for the whole term." />
                </Card>
            ) : (
                <div className="space-y-6">
                    {days.map(([date, daySessions]) => (
                        <section key={date} className="space-y-2.5">
                            <h2 className="text-[13px] font-semibold text-text">{formatLongDate(date)}</h2>
                            {daySessions.map((item) => {
                                const chip = STATUS_CHIP[item.status]
                                const isCancelled = item.status === 'cancelled'
                                const isOpen = item.status === 'scheduled'
                                const canDelete = isOpen || isCancelled

                                return (
                                    <Card key={item.id} padded={false} className="transition-colors hover:border-accent/35">
                                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
                                            <div className={`font-data shrink-0 text-sm font-semibold sm:w-[116px] ${isCancelled ? 'text-text-tertiary line-through' : 'text-text'}`}>
                                                {item.start_time}
                                                <span className="font-normal text-text-tertiary"> – {item.end_time}</span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <h3 className="truncate text-sm font-semibold text-text">{item.subject_name}</h3>
                                                    <span className="font-data text-[11px] text-text-tertiary">{item.subject_id}</span>
                                                    {chip && <StatusChip variant={chip.variant}>{chip.label}</StatusChip>}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                                                    <span className="flex items-center gap-1">
                                                        <LuMapPin className="h-3 w-3" aria-hidden="true" />
                                                        {item.room}
                                                    </span>
                                                    {item.teacher_name && (
                                                        <span className="flex items-center gap-1">
                                                            <LuUser className="h-3 w-3" aria-hidden="true" />
                                                            {item.teacher_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                {isOpen && <IconButton icon={LuPencil} label={`Edit ${item.subject_name} session`} onClick={() => openModal('form', item)} />}
                                                {isOpen && <IconButton icon={LuBan} label={`Cancel ${item.subject_name} session`} onClick={() => setCancelled(item, true)} />}
                                                {isCancelled && <IconButton icon={LuRotateCcw} label={`Restore ${item.subject_name} session`} onClick={() => setCancelled(item, false)} />}
                                                {canDelete && <IconButton icon={LuTrash2} label={`Delete ${item.subject_name} session`} tone="danger" onClick={() => openModal('delete', item)} />}
                                                <Button as={Link} to={`/attendance?subject=${encodeURIComponent(item.subject_id)}&date=${item.date}`} variant="secondary" size="sm" className="ml-1">
                                                    Attendance
                                                    <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </section>
                    ))}
                </div>
            )}

            <SessionFormModal isOpen={modal === 'form'} onClose={() => setModal(null)} session={selected} subjects={subjects} terms={terms} onSaved={() => {
                fetchSessions()
                fetchTerms()
            }} />
            <TermsModal isOpen={modal === 'terms'} onClose={() => setModal(null)} terms={terms} onChanged={fetchTerms} />

            <Modal
                isOpen={modal === 'delete'}
                onClose={() => setModal(null)}
                title="Delete session"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Keep session
                        </Button>
                        {selected?.series_id && (
                            <Button variant="danger" disabled={busy} onClick={() => handleDelete('series')}>
                                This and following
                            </Button>
                        )}
                        <Button variant="danger" loading={busy} onClick={() => handleDelete()}>
                            Only this session
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-text-secondary">
                    Delete <span className="font-semibold text-text">{selected?.subject_name}</span> on <span className="font-data">{selected?.date}</span> at{' '}
                    <span className="font-data">{selected?.start_time}</span>?
                </p>
            </Modal>
        </div>
    )
}
