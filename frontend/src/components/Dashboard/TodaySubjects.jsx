import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineClock, HiOutlineLocationMarker, HiArrowRight } from 'react-icons/hi'
import { getSchedule } from '../../api/schedule/getSchedule'
import { useAuth } from '../../contexts/AuthContext'
import { Badge, Button, Card, EmptyState } from '../ui'

export default function TodaySubjects() {
    const { user } = useAuth()
    const [schedules, setSchedules] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        getSchedule()
            .then((res) => {
                if (!isMounted || !res?.success) return
                const now = new Date()
                const today = (res.data ?? []).filter(
                    (s) =>
                        s.day === now.getDate() &&
                        s.month === now.getMonth() + 1 &&
                        s.year === now.getFullYear() &&
                        (!user?.teacher_id || s.teacher_id === user.teacher_id)
                )
                setSchedules(today)
            })
            .catch((err) => console.warn('Failed to load today schedule:', err))
            .finally(() => isMounted && setIsLoading(false))
        return () => {
            isMounted = false
        }
    }, [user?.teacher_id])

    return (
        <Card padded={false}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-text">Today’s schedule</h3>
                    <p className="mt-0.5 text-xs text-text-secondary">Current and upcoming sessions</p>
                </div>
                <Link to="/schedule" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                    View week
                    <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-5">
                    <div className="h-16 animate-pulse rounded-card bg-surface-hover" />
                    <div className="h-16 animate-pulse rounded-card bg-surface-hover" />
                </div>
            ) : schedules.length === 0 ? (
                <EmptyState title="No sessions today" description="Scheduled sessions will appear here on the day." />
            ) : (
                <div className="divide-y divide-border">
                    {schedules.map((s) => (
                        <div key={`${s.subject_id}-${s.start_time}`} className="flex items-center justify-between gap-4 px-5 py-3.5">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-sm font-medium text-text">{s.subject_name}</span>
                                    <Badge className="font-data">{s.subject_id}</Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-text-secondary">
                                    <span className="font-data flex items-center gap-1">
                                        <HiOutlineClock className="h-3.5 w-3.5" />
                                        {s.start_time} - {s.end_time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <HiOutlineLocationMarker className="h-3.5 w-3.5" />
                                        {s.room}
                                    </span>
                                </div>
                            </div>
                            <Link to="/attendance" className="shrink-0">
                                <Button variant="secondary" size="sm">
                                    Attendance
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
