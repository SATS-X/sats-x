import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import DashboardStats from '../components/Dashboard/DashboardStats'
import RecentAttendance from '../components/Dashboard/RecentAttended'
import TodaySubjects from '../components/Dashboard/TodaySubjects'
import { HiOutlinePhotograph, HiOutlineClipboardList } from 'react-icons/hi'
import { Avatar, Button, PageHeader, StatusChip } from '../components/ui'

export default function Dashboard() {
    const { user } = useAuth()
    const { subscribe } = useWebSocket()
    const { t } = useLanguage()
    const [liveEvents, setLiveEvents] = useState([])

    useEffect(() => {
        const unsubscribe = subscribe('compare', (data) => {
            if (!data) return
            setLiveEvents((prev) => [
                { id: Date.now(), timestamp: new Date().toLocaleTimeString('en-US'), ...data },
                ...prev.slice(0, 3)
            ])
        })
        return () => unsubscribe()
    }, [subscribe])

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${t('welcomeBack')}, ${user?.full_name || user?.email || 'Instructor'}`}
                description="Live attendance operations powered by connected ESP32-CAM devices and AWS Rekognition."
                actions={
                    <>
                        <Link to="/face-management">
                            <Button variant="secondary" size="sm">
                                <HiOutlinePhotograph className="h-4 w-4" />
                                Register face
                            </Button>
                        </Link>
                        <Link to="/attendance">
                            <Button size="sm">
                                <HiOutlineClipboardList className="h-4 w-4" />
                                View attendance
                            </Button>
                        </Link>
                    </>
                }
            />

            {liveEvents.length > 0 && (
                <div className="rounded-card border border-border bg-surface">
                    <div className="flex items-center justify-between border-b border-border px-5 py-3">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-present" aria-hidden="true" />
                            <span className="text-xs font-semibold text-text">Live recognition</span>
                        </div>
                        <span className="font-data text-[11px] text-text-tertiary">AWS Rekognition</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        {liveEvents.map((evt) => (
                            <div key={evt.id} className="flex items-center gap-3 rounded-card border border-border p-3">
                                <Avatar name={evt.studentId} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-data truncate text-xs font-medium text-text">{evt.studentId || 'Unknown'}</div>
                                    <div className="font-data text-[11px] text-text-tertiary">{evt.timestamp}</div>
                                </div>
                                <StatusChip variant={evt.matched ? 'present' : 'neutral'} className="shrink-0">
                                    {evt.matched ? `${evt.similarity}%` : 'No match'}
                                </StatusChip>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <DashboardStats />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TodaySubjects />
                <RecentAttendance />
            </div>
        </div>
    )
}
