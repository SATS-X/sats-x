import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiArrowRight } from 'react-icons/hi'
import { getAllAttendance } from '../../api/attendance/getAttendance'
import { Avatar, Card, EmptyState, StatusChip } from '../ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'Đúng giờ', Late: 'Trễ', Absent: 'Vắng' }

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
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-text">Điểm danh gần đây</h3>
                    <p className="mt-0.5 text-xs text-text-secondary">Nhật ký nhận diện khuôn mặt tự động</p>
                </div>
                <Link to="/attendance" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
                    Xem tất cả
                    <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-2 p-5">
                    <div className="h-14 animate-pulse rounded-card bg-surface-hover" />
                    <div className="h-14 animate-pulse rounded-card bg-surface-hover" />
                </div>
            ) : records.length === 0 ? (
                <EmptyState
                    title="Chưa có bản ghi điểm danh nào"
                    description="Dữ liệu sẽ tự động xuất hiện khi ESP32-CAM nhận diện sinh viên."
                />
            ) : (
                <div className="divide-y divide-border">
                    {records.map((rec, idx) => (
                        <div key={`${rec.student_id}-${idx}`} className="flex items-center gap-3 px-5 py-3">
                            <Avatar name={rec.student_name} size="sm" />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-text">{rec.student_name || rec.student_id}</div>
                                <div className="font-data truncate text-xs text-text-tertiary">
                                    {rec.student_id} · {rec.class_names || 'Chưa xếp lớp'}
                                </div>
                            </div>
                            <div className="shrink-0 space-y-1 text-right">
                                <StatusChip variant={REMARK_VARIANT[rec.remark] || 'neutral'}>
                                    {REMARK_LABEL[rec.remark] || rec.remark}
                                </StatusChip>
                                <div className="font-data text-[11px] text-text-tertiary">{rec.time || '—'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
