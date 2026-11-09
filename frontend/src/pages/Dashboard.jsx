import { Link } from 'react-router-dom'
import { LuClipboardList, LuScanFace } from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import DashboardStats from '../components/Dashboard/DashboardStats'
import RecentAttendance from '../components/Dashboard/RecentAttended'
import SessionHero from '../components/Dashboard/SessionHero'
import TodaySubjects from '../components/Dashboard/TodaySubjects'
import { Button, PageHeader } from '../components/ui'

export default function Dashboard() {
    const { user } = useAuth()
    const { t } = useLanguage()

    return (
        <div className="space-y-5">
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
                        <Button as={Link} to="/attendance" variant="secondary" size="sm">
                            <LuClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                            View attendance
                        </Button>
                    </>
                }
            />

            <SessionHero />
            <DashboardStats />

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
                <RecentAttendance />
                <TodaySubjects />
            </div>
        </div>
    )
}
