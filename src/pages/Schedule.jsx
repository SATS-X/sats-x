import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineRefresh, HiOutlineArrowRight } from 'react-icons/hi'
import { getSchedule } from '../api/schedule/getSchedule'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Badge, Button, EmptyState, PageHeader, Spinner } from '../components/ui'

const DAYS = [
    { key: 'Monday', label: 'Thứ Hai' },
    { key: 'Tuesday', label: 'Thứ Ba' },
    { key: 'Wednesday', label: 'Thứ Tư' },
    { key: 'Thursday', label: 'Thứ Năm' },
    { key: 'Friday', label: 'Thứ Sáu' },
    { key: 'Saturday', label: 'Thứ Bảy' }
]

const dayLabel = (key) => DAYS.find((d) => d.key === key)?.label || key

export default function Schedule() {
    const { t } = useLanguage()
    const { showError } = useToast()

    const [scheduleList, setScheduleList] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState('all')

    const fetchScheduleData = async () => {
        setLoading(true)
        try {
            const res = await getSchedule()
            setScheduleList(res?.success ? res.data : [])
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Không thể tải thời khoá biểu', 'Lỗi')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchScheduleData()
    }, [])

    const filteredSchedule = scheduleList.filter((item) => selectedDay === 'all' || item.day_of_week === selectedDay)

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('weeklySchedule')}
                description="Thời khoá biểu giảng dạy và điểm danh theo phòng học"
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchScheduleData}>
                        <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Làm mới
                    </Button>
                }
            />

            <div className="flex flex-wrap gap-2 rounded-card border border-border bg-surface p-2">
                <DayPill active={selectedDay === 'all'} onClick={() => setSelectedDay('all')}>
                    Tất cả các ngày
                </DayPill>
                {DAYS.map((d) => (
                    <DayPill key={d.key} active={selectedDay === d.key} onClick={() => setSelectedDay(d.key)}>
                        {d.label}
                    </DayPill>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Đang tải thời khoá biểu...
                </div>
            ) : filteredSchedule.length === 0 ? (
                <EmptyState title="Không có buổi học nào vào ngày đã chọn" />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSchedule.map((item) => (
                        <div
                            key={`${item.subject_id}-${item.day}-${item.start_time}`}
                            className="flex flex-col justify-between rounded-card border border-border bg-surface p-5"
                        >
                            <div className="space-y-3">
                                <Badge>{dayLabel(item.day_of_week)}</Badge>

                                <div>
                                    <h3 className="line-clamp-1 text-base font-semibold text-text">{item.subject_name}</h3>
                                    <p className="font-data mt-0.5 text-xs text-text-tertiary">{item.subject_id}</p>
                                </div>

                                <div className="space-y-2 rounded-card border border-border bg-surface-sunken p-3 text-xs">
                                    <div className="font-data flex items-center gap-2 text-text-secondary">
                                        <HiOutlineClock className="h-4 w-4 shrink-0 text-text-tertiary" />
                                        {item.start_time} - {item.end_time}
                                    </div>
                                    <div className="flex items-center gap-2 text-text-secondary">
                                        <HiOutlineLocationMarker className="h-4 w-4 shrink-0 text-text-tertiary" />
                                        {item.room}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <span className="font-data text-[11px] text-text-tertiary">{item.teacher_name}</span>
                                <Link to="/attendance">
                                    <Button size="sm">
                                        Vào phòng học
                                        <HiOutlineArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function DayPill({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={classNames(
                'rounded-card px-3.5 py-2 text-xs font-medium transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-text-secondary hover:bg-surface-hover hover:text-text'
            )}
        >
            {children}
        </button>
    )
}

DayPill.propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func,
    children: PropTypes.node
}
