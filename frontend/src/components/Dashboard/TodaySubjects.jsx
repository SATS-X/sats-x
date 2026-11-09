import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuClock, LuMapPin } from 'react-icons/lu'
import { getSchedule } from '../../api/schedule/getSchedule'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO } from '../../lib/date'
import { Badge, Button, Card, CardHeader, EmptyState } from '../ui'

export default function TodaySubjects() {
    const { user } = useAuth()
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        const today = todayISO()
        getSchedule({ from: today, to: today })
            .then((res) => {
                if (!isMounted || !res?.success) return
                setSchedules(
                    (res.data ?? [])
                        .filter((s) => s.status !== 'cancelled' && (!user?.teacher_id || s.teacher_id === user.teacher_id))
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                )
            })
            .catch((err) => console.warn('Failed to load today schedule:', err))
            .finally(() => isMounted && setIsLoading(false))
        return () => {
            isMounted = false
        }
    }, [user?.teacher_id])

    return (
        <Card padded={false}>
            <CardHeader
                title="Today’s schedule"
                description="Current and upcoming sessions"
                action={
                    <Link to="/schedule" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                        View week
                        <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                }
            />

            {isLoading ? (
                <div className="space-y-2 p-5">
                    <div className="h-14 animate-pulse rounded-lg bg-surface-hover" />
                    <div className="h-14 animate-pulse rounded-lg bg-surface-hover" />
                </div>
            ) : schedules.length === 0 ? (
                <EmptyState title="No sessions today" description="Scheduled sessions will appear here on the day." />
            ) : (
                <div className="divide-y divide-border">
                    {schedules.map((s) => (
                        <div key={`${s.subject_id}-${s.start_time}`} className="flex items-center justify-between gap-4 px-5 py-3.5">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-[13px] font-medium text-text">{s.subject_name}</span>
                                    <Badge className="font-data">{s.subject_id}</Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                                    <span className="font-data flex items-center gap-1">
                                        <LuClock className="h-3 w-3" aria-hidden="true" />
                                        {s.start_time} - {s.end_time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <LuMapPin className="h-3 w-3" aria-hidden="true" />
                                        {s.room}
                                    </span>
                                </div>
                            </div>
                            <Button as={Link} to={`/attendance?subject=${encodeURIComponent(s.subject_id)}&date=${s.date}`} variant="secondary" size="sm">
                                Attendance
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
