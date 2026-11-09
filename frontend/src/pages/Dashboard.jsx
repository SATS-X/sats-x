import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuClipboardList, LuScanFace } from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import DashboardStats from '../components/Dashboard/DashboardStats'
import RecentAttendance from '../components/Dashboard/RecentAttended'
import TodaySubjects from '../components/Dashboard/TodaySubjects'
import { Avatar, Button, Card, CardHeader, PageHeader, StatusChip } from '../components/ui'

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
                eyebrow="Operations"
                title={`${t('welcomeBack').replace(/!$/, '')}, ${user?.full_name || user?.email || 'Instructor'}`}
                description="Today’s attendance, sessions, and class roster at a glance."
                actions={
                    <>
                        <Button as={Link} to="/face-management" variant="secondary" size="sm">
                            <LuScanFace className="h-3.5 w-3.5" aria-hidden="true" />
                            Register face
                        </Button>
                        <Button as={Link} to="/attendance" size="sm">
                            <LuClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                            View attendance
                        </Button>
                    </>
                }
            />

            <DashboardStats />

            {liveEvents.length > 0 && (
                <Card padded={false}>
                    <CardHeader title="Live recognition" description="Latest matches from AWS Rekognition" />
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        {liveEvents.map((evt) => (
                            <div key={evt.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
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
                </Card>
            )}

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
                <RecentAttendance />
                <TodaySubjects />
            </div>
        </div>
    )
}
