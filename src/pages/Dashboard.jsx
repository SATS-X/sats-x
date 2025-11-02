import { useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import DashboardStats from '../components/Dashboard/DashboardStats'
import RecentAttendance from '../components/Dashboard/RecentAttended'
import TodaySubjects from '../components/Dashboard/TodaySubjects'

const Dashboard = () => {
    const { t } = useLanguage()
    
    useEffect(() => {
        // Add entrance animations
        const elements = document.querySelectorAll('.dashboard-element')
        elements.forEach((element, index) => {
            element.style.opacity = '0'
            element.style.transform = 'translateY(20px)'
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease-out'
                element.style.opacity = '1'
                element.style.transform = 'translateY(0)'
            }, index * 100)
        })
    }, [])

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Welcome Section */}
            <div className="dashboard-element">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-4 sm:p-6 text-white shadow-lg">
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('welcomeBack')}</h1>
                    <p className="text-indigo-100 text-sm sm:text-base">{t('dashboardSubtitle')}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-element">
                <DashboardStats />
            </div>

            {/* Today's Subjects */}
            <div className="dashboard-element">
                <TodaySubjects />
            </div>

            {/* Recent Attendance Section */}
            <div className="dashboard-element">
                <RecentAttendance />
            </div>
        </div>
    )
}

export default Dashboard
