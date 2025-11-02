import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineBookOpen, HiOutlineClock, HiOutlineLocationMarker, HiOutlineChevronRight } from 'react-icons/hi'
import { getAllSubjectsByTeacherId } from '../../api/subject/getSubject'
import useUserAttributes from '../../hooks/useUserAttributes'

const TodaySubjects = () => {
    const [todaySubjects, setTodaySubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const userAttributes = useUserAttributes()
    const navigate = useNavigate()

    useEffect(() => {
        const loadTodaySubjects = async () => {
            if (!userAttributes?.sub) return

            try {
                const response = await getAllSubjectsByTeacherId(userAttributes.sub)
                const subjects = response?.subjects || []

                // Get today's date
                const today = new Date()
                const currentDay = today.getDate()
                const currentMonth = today.getMonth() + 1
                const currentYear = today.getFullYear()

                // Filter subjects that have schedule today
                const subjectsToday = subjects
                    .map((subject) => {
                        const todaySchedules = subject.schedules?.filter(
                            (schedule) =>
                                schedule.day === currentDay &&
                                schedule.month === currentMonth &&
                                schedule.year === currentYear &&
                                schedule.schedule_status === 1
                        )

                        if (todaySchedules && todaySchedules.length > 0) {
                            return {
                                ...subject,
                                todaySchedules
                            }
                        }
                        return null
                    })
                    .filter(Boolean)
                    .sort((a, b) => {
                        // Sort by earliest start time
                        const aTime = a.todaySchedules[0].start_time
                        const bTime = b.todaySchedules[0].start_time
                        return aTime.localeCompare(bTime)
                    })

                setTodaySubjects(subjectsToday)
            } catch (error) {
                console.error('Error loading today subjects:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTodaySubjects()
    }, [userAttributes])

    const handleSubjectClick = (subject) => {
        // Navigate to subjects page with the subject selected
        navigate('/subjects', { state: { selectedSubject: subject } })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-slate-600">Đang tải...</span>
                </div>
            </div>
        )
    }

    if (todaySubjects.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="text-center">
                    <HiOutlineBookOpen className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Không có môn học hôm nay</h3>
                    <p className="text-slate-600">Bạn không có lịch giảng dạy nào trong ngày hôm nay</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Môn học hôm nay</h2>
                        <p className="text-sm text-slate-600">{todaySubjects.length} môn học</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <HiOutlineClock className="h-5 w-5" />
                        <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-200">
                {todaySubjects.map((subject) => (
                    <div
                        key={subject.subject_id}
                        onClick={() => handleSubjectClick(subject)}
                        className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                                    <HiOutlineBookOpen className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                        {subject.subject_name}
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-3">{subject.subject_id}</p>

                                    <div className="space-y-2">
                                        {subject.todaySchedules.map((schedule, idx) => (
                                            <div key={idx} className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <HiOutlineClock className="h-4 w-4 text-slate-500" />
                                                    <span className="font-medium">{schedule.time_slot}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <HiOutlineLocationMarker className="h-4 w-4 text-slate-500" />
                                                    <span>{schedule.room}</span>
                                                </div>
                                                {schedule.attendance_windows && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                                            Check-in: {schedule.attendance_windows.checkin_opens_at}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <HiOutlineChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TodaySubjects
