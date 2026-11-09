import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight } from 'react-icons/lu'
import { getAllAttendance } from '../../api/attendance/getAttendance'
import { Avatar, Card, CardHeader, EmptyState, StatusChip } from '../ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'On time', Late: 'Late', Absent: 'Absent' }

export default function RecentAttendance() {
    const [records, setRecords] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        getAllAttendance({ limit: 6, page: 1 })
            .then((res) => {
                if (isMounted && res?.success) setRecords(res.data ?? [])
            })
            .catch((err) => console.warn('Failed to load recent attendance:', err))
            .finally(() => isMounted && setIsLoading(false))
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <Card padded={false}>
            <CardHeader
                title="Recent attendance"
                description="Automatic facial recognition log"
                action={
                    <Link to="/attendance" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                        View all
                        <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                }
            />

            {isLoading ? (
                <div className="space-y-2 p-5">
                    <div className="h-12 animate-pulse rounded-lg bg-surface-hover" />
                    <div className="h-12 animate-pulse rounded-lg bg-surface-hover" />
                </div>
            ) : records.length === 0 ? (
                <EmptyState title="No attendance records yet" description="Records will appear when an ESP32-CAM device recognizes a student." />
            ) : (
                <div className="divide-y divide-border">
                    {records.map((rec, idx) => (
                        <div key={`${rec.student_id}-${idx}`} className="flex items-center gap-3 px-5 py-3">
                            <Avatar name={rec.student_name} size="sm" />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium text-text">{rec.student_name || rec.student_id}</div>
                                <div className="font-data truncate text-[11px] text-text-tertiary">
                                    {rec.student_id} · {rec.class_names || 'Unassigned'}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="font-data hidden text-[11px] text-text-tertiary sm:inline">{rec.time || '—'}</span>
                                <StatusChip variant={REMARK_VARIANT[rec.remark] || 'neutral'}>{REMARK_LABEL[rec.remark] || rec.remark}</StatusChip>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
