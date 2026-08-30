import { useEffect, useState } from 'react'
import { getAllStudents } from '../../api/student/getStudent'
import { getClasses } from '../../api/class/getClasses'
import { getAllAttendance } from '../../api/attendance/getAttendance'
import { useLanguage } from '../../contexts/LanguageContext'
import { StatStrip } from '../ui'

const isToday = (record) => {
    const now = new Date()
    return record.day === now.getDate() && record.month === now.getMonth() + 1 && record.year === now.getFullYear()
}

export default function DashboardStats() {
    const { t } = useLanguage()
    const [studentCount, setStudentCount] = useState(null)
    const [classCount, setClassCount] = useState(null)
    const [todayStats, setTodayStats] = useState(null)

    useEffect(() => {
        let isMounted = true

        const fetchStats = async () => {
            const [studentsRes, classesRes, attendanceRes] = await Promise.allSettled([
                getAllStudents(),
                getClasses(),
                getAllAttendance()
            ])

            if (!isMounted) return

            if (studentsRes.status === 'fulfilled') {
                setStudentCount(studentsRes.value?.count ?? studentsRes.value?.data?.length ?? 0)
            }

            if (classesRes.status === 'fulfilled') {
                setClassCount(classesRes.value?.count ?? classesRes.value?.data?.length ?? 0)
            }

            if (attendanceRes.status === 'fulfilled') {
                const records = (attendanceRes.value?.data ?? []).filter(isToday)
                const present = records.filter((r) => r.status === 1).length
                const onTime = records.filter((r) => r.remark === 'On Time').length
                setTodayStats({
                    total: records.length,
                    present,
                    onTimeRate: present > 0 ? Math.round((onTime / present) * 100) : null
                })
            }
        }

        fetchStats()
        return () => {
            isMounted = false
        }
    }, [])

    const loadingLabel = '—'

    return (
        <StatStrip
            items={[
                {
                    label: t('totalStudentsCount'),
                    value: studentCount === null ? loadingLabel : studentCount
                },
                {
                    label: t('classesTotal'),
                    value: classCount === null ? loadingLabel : classCount
                },
                {
                    label: t('todayAttendance'),
                    value: todayStats === null ? loadingLabel : todayStats.present,
                    tone: 'present'
                },
                {
                    label: 'On-time rate today',
                    value: todayStats === null || todayStats.onTimeRate === null ? loadingLabel : `${todayStats.onTimeRate}%`,
                    tone: 'late'
                }
            ]}
        />
    )
}
