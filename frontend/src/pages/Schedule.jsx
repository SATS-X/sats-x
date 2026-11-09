import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuMapPin, LuRefreshCw, LuUser } from 'react-icons/lu'
import { getSchedule } from '../api/schedule/getSchedule'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Badge, Button, Card, EmptyState, LoadingState, PageHeader, Segmented } from '../components/ui'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_OPTIONS = [{ value: 'all', label: 'All days' }, ...DAYS.map((day) => ({ value: day, label: day }))]

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
            showError(err.response?.data?.message || err.message || 'Could not load schedule', 'Error')
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
                eyebrow={`Sessions · ${filteredSchedule.length}`}
                title={t('weeklySchedule')}
                description="Teaching sessions and attendance windows by room."
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchScheduleData}>
                        <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                        Refresh
                    </Button>
                }
            />

            <Segmented options={DAY_OPTIONS} value={selectedDay} onChange={setSelectedDay} label="Filter by day" />

            {loading ? (
                <LoadingState label="Loading schedule..." />
            ) : filteredSchedule.length === 0 ? (
                <Card padded={false}>
                    <EmptyState title="No sessions on the selected day" description="Choose another day to see its sessions." />
                </Card>
            ) : (
                <div className="space-y-2.5">
                    {filteredSchedule.map((item) => (
                        <Card key={`${item.subject_id}-${item.day}-${item.start_time}`} padded={false} className="transition-colors hover:border-accent/35">
                            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5">
                                <div className="font-data shrink-0 text-sm font-semibold text-text sm:w-[116px]">
                                    {item.start_time}
                                    <span className="font-normal text-text-tertiary"> – {item.end_time}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <h3 className="truncate text-sm font-semibold text-text">{item.subject_name}</h3>
                                        <span className="font-data text-[11px] text-text-tertiary">{item.subject_id}</span>
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

                                <div className="flex shrink-0 items-center gap-3">
                                    <Badge>{item.day_of_week}</Badge>
                                    <Button as={Link} to="/attendance" variant="secondary" size="sm">
                                        Open classroom
                                        <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
