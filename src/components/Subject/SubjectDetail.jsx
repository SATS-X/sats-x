import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
    HiOutlineUsers,
    HiOutlineBookOpen,
    HiOutlineClipboardList,
    HiOutlineRefresh,
    HiOutlineArrowLeft,
    HiOutlineSearch,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineLocationMarker,
    HiOutlinePencil,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineUserAdd,
    HiOutlineTrash
} from 'react-icons/hi'
import { getAllStudentsBySubjectId } from '../../api/student/getStudent'
import { updateSchedule } from '../../api/schedule/putUpateSchedule'
import { removeStudentFromSubject } from '../../api/subject/removeStudentFromSubject'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import AddStudentModal from './AddStudentModal'
import RemoveStudentModal from './RemoveStudentModal'

const SubjectDetail = ({ subject, onBack, onRefresh }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    const [studentsData, setStudentsData] = useState(null)
    const [studentsLoading, setStudentsLoading] = useState(false)
    const [studentsError, setStudentsError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingScheduleIndex, setEditingScheduleIndex] = useState(null)
    const [editedTimes, setEditedTimes] = useState({
        start_time: '',
        end_time: '',
        checkin_opens_at: '',
        ontime_ends_at: '',
        checkin_closes_at: ''
    })
    const [savingSchedule, setSavingSchedule] = useState(false)
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
    const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false)
    const [studentToRemove, setStudentToRemove] = useState(null)
    const [isRemoving, setIsRemoving] = useState(false)

    const fetchStudentsForSubject = useCallback(
        async (subjectId) => {
            setStudentsLoading(true)
            setStudentsError(null)

            try {
                const response = await getAllStudentsBySubjectId(subjectId)

                // Check if API returned an error response (but didn't throw)
                if (
                    response &&
                    response.success === false &&
                    response.error &&
                    response.error.includes('No students found for this subject')
                ) {
                    // Create empty response structure for empty class
                    setStudentsData({
                        success: true,
                        subject: {
                            subject_id: response.subject_id || subjectId.toUpperCase(),
                            subject_name: subject?.subject_name || 'Unknown Subject'
                        },
                        data: [],
                        count: 0
                    })
                } else if (response && response.success === false) {
                    // Other API errors
                    setStudentsError(response.error || 'Failed to fetch students')
                } else {
                    // Successful response
                    setStudentsData(response)
                }
            } catch (error) {
                console.error('Error fetching students for subject:', error)

                // Check if it's an empty class (not a real error)
                if (error.message && error.message.includes('No students found for this subject')) {
                    // Create empty response structure for empty class
                    setStudentsData({
                        success: true,
                        subject: {
                            subject_id: subjectId.toUpperCase(),
                            subject_name: subject?.subject_name || 'Unknown Subject'
                        },
                        data: [],
                        count: 0
                    })
                } else {
                    setStudentsError(error.message || 'Failed to fetch students')
                }
            } finally {
                setStudentsLoading(false)
            }
        },
        [subject]
    )

    useEffect(() => {
        if (subject) {
            fetchStudentsForSubject(subject.subject_id)
        }
    }, [subject, fetchStudentsForSubject])

    const handleRefresh = () => {
        if (subject) {
            fetchStudentsForSubject(subject.subject_id)
            // Also refresh subject data from parent if callback provided
            if (onRefresh) {
                onRefresh()
            }
        }
    }

    const handleEditSchedule = (index, schedule) => {
        setEditingScheduleIndex(index)
        setEditedTimes({
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            checkin_opens_at: schedule.attendance_windows.checkin_opens_at,
            ontime_ends_at: schedule.attendance_windows.ontime_ends_at,
            checkin_closes_at: schedule.attendance_windows.checkin_closes_at
        })
    }

    const handleCancelEdit = () => {
        setEditingScheduleIndex(null)
        setEditedTimes({
            start_time: '',
            end_time: '',
            checkin_opens_at: '',
            ontime_ends_at: '',
            checkin_closes_at: ''
        })
    }

    const handleSaveEdit = async (index) => {
        setSavingSchedule(true)

        try {
            const schedule = subject.schedules[index]

            // Validate all fields are filled
            if (
                !editedTimes.start_time ||
                !editedTimes.end_time ||
                !editedTimes.checkin_opens_at ||
                !editedTimes.ontime_ends_at ||
                !editedTimes.checkin_closes_at
            ) {
                showError(t('pleaseAllFields'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            // Calculate attendance window minutes from times
            const calculateMinutes = (timeStr) => {
                const [hours, minutes] = timeStr.split(':').map(Number)
                return hours * 60 + minutes
            }

            const startMinutes = calculateMinutes(editedTimes.start_time)
            const checkinOpensMinutes = calculateMinutes(editedTimes.checkin_opens_at)
            const ontimeEndsMinutes = calculateMinutes(editedTimes.ontime_ends_at)
            const checkinClosesMinutes = calculateMinutes(editedTimes.checkin_closes_at)

            // Calculate attendance window minutes from start_time (not from checkin_opens_at)
            const early_checkin_minutes = startMinutes - checkinOpensMinutes
            const ontime_window_minutes = ontimeEndsMinutes - startMinutes  // From start_time to ontime_ends_at
            const late_window_minutes = checkinClosesMinutes - startMinutes  // From start_time to checkin_closes_at

            // Frontend validation based on backend rules
            if (early_checkin_minutes < 0 || early_checkin_minutes > 60) {
                showError(t('earlyCheckinMinutesError'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            if (ontime_window_minutes < 0 || ontime_window_minutes > 180) {
                showError(t('ontimeWindowMinutesError'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            if (late_window_minutes < 0 || late_window_minutes > 300) {
                showError(t('lateWindowMinutesError'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            // Validate time logic
            if (startMinutes <= checkinOpensMinutes) {
                showError(t('startTimeMustAfterCheckinOpens'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            if (ontimeEndsMinutes <= checkinOpensMinutes) {
                showError(t('ontimeEndsMustAfterCheckinOpens'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            if (checkinClosesMinutes <= ontimeEndsMinutes) {
                showError(t('checkinClosesMustAfterOntimeEnds'), t('validationError'))
                setSavingSchedule(false)
                return
            }

            // Prepare data for API call according to the new format
            const scheduleData = {
                // Required fields to identify the schedule
                day: schedule.day,
                month: schedule.month,
                year: schedule.year,
                subject_id: subject.subject_id,
                start_time: schedule.start_time, // Current start_time for identification

                // Optional fields to update
                new_start_time: editedTimes.start_time,
                new_end_time: editedTimes.end_time,
                early_checkin_minutes: early_checkin_minutes,
                ontime_window_minutes: ontime_window_minutes,
                late_window_minutes: late_window_minutes
            }

            console.log('Saving edited schedule:', scheduleData)

            // Call API to update schedule
            const response = await updateSchedule(scheduleData)

            console.log('Schedule update response:', response)

            // Update local state with response data from backend
            if (response && response.data) {
                const updatedSchedule = response.data
                
                subject.schedules[index].start_time = updatedSchedule.start_time
                subject.schedules[index].end_time = updatedSchedule.end_time
                subject.schedules[index].time_slot = `${updatedSchedule.start_time} - ${updatedSchedule.end_time}`
                subject.schedules[index].room = updatedSchedule.room
                subject.schedules[index].attendance_windows = {
                    early_checkin_minutes: updatedSchedule.early_checkin_minutes,
                    ontime_window_minutes: updatedSchedule.ontime_window_minutes,
                    late_window_minutes: updatedSchedule.late_window_minutes,
                    checkin_opens_at: updatedSchedule.checkin_opens_at,
                    ontime_ends_at: updatedSchedule.ontime_ends_at,
                    checkin_closes_at: updatedSchedule.checkin_closes_at
                }
            }

            // Show success toast
            showSuccess(t('attendanceWindowUpdated'), t('success'))

            // Reset editing state
            setEditingScheduleIndex(null)
            setEditedTimes({
                start_time: '',
                end_time: '',
                checkin_opens_at: '',
                ontime_ends_at: '',
                checkin_closes_at: ''
            })

            // Auto-refresh to get latest data from server
            handleRefresh()
        } catch (error) {
            console.error('Error saving schedule:', error)
            // Extract error message from backend response
            const errorMessage = error.message || error.error || t('failedToSaveSchedule')
            showError(errorMessage, t('error'))
        } finally {
            setSavingSchedule(false)
        }
    }

    const handleTimeChange = (field, value) => {
        setEditedTimes((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleOpenAddStudentModal = () => {
        setIsAddStudentModalOpen(true)
    }

    const handleCloseAddStudentModal = () => {
        setIsAddStudentModalOpen(false)
    }

    const handleStudentAdded = () => {
        // Refresh the students list after adding a new student
        if (subject) {
            fetchStudentsForSubject(subject.subject_id)
        }
    }

    const handleOpenRemoveStudentModal = (student) => {
        setStudentToRemove(student)
        setIsRemoveStudentModalOpen(true)
    }

    const handleCloseRemoveStudentModal = () => {
        setIsRemoveStudentModalOpen(false)
        setStudentToRemove(null)
    }

    const handleConfirmRemoveStudent = async () => {
        if (!studentToRemove) return

        setIsRemoving(true)
        try {
            const response = await removeStudentFromSubject(subject.subject_id, studentToRemove.student_id)
            showSuccess(response.message || t('studentRemovedSuccessfully'), t('success'))
            handleCloseRemoveStudentModal()
            // Refresh the students list
            fetchStudentsForSubject(subject.subject_id)
        } catch (error) {
            console.error('Error removing student:', error)
            showError(error.message || t('failedToRemoveStudent'), t('error'))
        } finally {
            setIsRemoving(false)
        }
    }

    // Filter students based on search term
    const filteredStudents =
        studentsData?.data?.filter(
            (student) =>
                student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) || []

    if (!subject) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <HiOutlineBookOpen className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">{t('noSubjectSelected')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <button
                            onClick={onBack}
                            className="mr-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                        >
                            <HiOutlineArrowLeft className="h-6 w-6" />
                        </button>
                        <div className="flex items-center">
                            <div className="bg-indigo-100 p-3 rounded-full">
                                <HiOutlineUsers className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                                <h1 className="text-2xl font-bold text-slate-900">{subject.subject_name}</h1>
                                <p className="text-slate-600">
                                    {t('subject')} ID: {subject.subject_id}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                        <HiOutlineRefresh className="mr-2 h-4 w-4" />
                        {t('refresh')}
                    </button>
                </div>

                {/* Subject Stats */}
                {studentsData && (
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center">
                                <HiOutlineUsers className="h-5 w-5 text-slate-600 mr-2" />
                                <span className="text-sm text-slate-600">{t('totalStudents')}: </span>
                                <span className="font-semibold text-slate-900 ml-1">{studentsData.count}</span>
                            </div>
                            <div className="flex items-center">
                                <HiOutlineBookOpen className="h-5 w-5 text-slate-600 mr-2" />
                                <span className="text-sm text-slate-600">{t('subject')}: </span>
                                <span className="font-semibold text-slate-900 ml-1">
                                    {studentsData.subject?.subject_name}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <HiOutlineClipboardList className="h-5 w-5 text-slate-600 mr-2" />
                                <span className="text-sm text-slate-600">{t('showing')}: </span>
                                <span className="font-semibold text-slate-900 ml-1">
                                    {filteredStudents.length} {t('students')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Schedule Information */}
            {subject.schedules && subject.schedules.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                            {subject.schedules.map((schedule, index) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-indigo-600 rounded-xl blur opacity-20"></div>
                                                    <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                                                        <span className="text-2xl font-semibold leading-none">
                                                            {schedule.day}
                                                        </span>
                                                        <span className="text-[10px] font-normal opacity-90 uppercase">
                                                            {schedule.month}/{schedule.year}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-base font-medium text-slate-900">
                                                        {schedule.day_name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{schedule.full_date}</div>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    schedule.schedule_status === 1
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}
                                            >
                                                {schedule.schedule_status === 1 ? t('active') : t('inactive')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 space-y-3">
                                        {editingScheduleIndex === index ? (
                                            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-lg p-4 border border-indigo-200">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
                                                    <h4 className="text-sm font-medium text-indigo-900">
                                                        {t('timeSlot')}
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-indigo-700 mb-1.5">
                                                            {t('startTime')}
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={editedTimes.start_time}
                                                            onChange={(e) =>
                                                                handleTimeChange('start_time', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-indigo-900 font-medium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-indigo-700 mb-1.5">
                                                            {t('endTime')}
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={editedTimes.end_time}
                                                            onChange={(e) =>
                                                                handleTimeChange('end_time', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 text-sm border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-indigo-900 font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start space-x-3">
                                                <div className="bg-indigo-50 rounded-lg p-2 mt-0.5">
                                                    <HiOutlineClock className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-500 mb-0.5">{t('timeSlot')}</div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {schedule.time_slot}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start space-x-3">
                                            <div className="bg-purple-50 rounded-lg p-2 mt-0.5">
                                                <HiOutlineLocationMarker className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-slate-500 mb-0.5">{t('room')}</div>
                                                <div className="text-sm font-medium text-slate-900">
                                                    {schedule.room}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {schedule.attendance_windows && (
                                        <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                                    <h3 className="text-sm font-medium text-slate-700">
                                                        {t('attendanceWindow')}
                                                    </h3>
                                                </div>
                                                {editingScheduleIndex === index ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(index)}
                                                            disabled={savingSchedule}
                                                            className={`px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 ${savingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {savingSchedule ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                                            ) : (
                                                                <HiOutlineCheck className="h-3.5 w-3.5" />
                                                            )}
                                                            <span>{t('save')}</span>
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            disabled={savingSchedule}
                                                            className={`px-3 py-1.5 bg-slate-400 text-white text-xs font-semibold rounded-lg hover:bg-slate-500 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 ${savingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <HiOutlineX className="h-3.5 w-3.5" />
                                                            <span>{t('cancel')}</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditSchedule(index, schedule)}
                                                        className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                                                    >
                                                        <HiOutlinePencil className="h-3.5 w-3.5" />
                                                        <span>{t('edit')}</span>
                                                    </button>
                                                )}
                                            </div>

                                            {editingScheduleIndex === index ? (
                                                <div className="space-y-3">
                                                    <div className="relative group">
                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg opacity-20 group-hover:opacity-30 transition"></div>
                                                        <div className="relative bg-white rounded-lg border border-emerald-200 p-3">
                                                            <label className="flex items-center text-xs font-medium text-emerald-700 mb-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                                                {t('checkInOpens')}
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={editedTimes.checkin_opens_at}
                                                                onChange={(e) =>
                                                                    handleTimeChange('checkin_opens_at', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 text-base border border-emerald-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/50 text-emerald-900 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-20 group-hover:opacity-30 transition"></div>
                                                        <div className="relative bg-white rounded-lg border border-blue-200 p-3">
                                                            <label className="flex items-center text-xs font-medium text-blue-700 mb-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                                                {t('onTimeEnds')}
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={editedTimes.ontime_ends_at}
                                                                onChange={(e) =>
                                                                    handleTimeChange('ontime_ends_at', e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 text-base border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 text-blue-900 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="relative group">
                                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-400 to-rose-600 rounded-lg opacity-20 group-hover:opacity-30 transition"></div>
                                                        <div className="relative bg-white rounded-lg border border-rose-200 p-3">
                                                            <label className="flex items-center text-xs font-medium text-rose-700 mb-2">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div>
                                                                {t('checkInCloses')}
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={editedTimes.checkin_closes_at}
                                                                onChange={(e) =>
                                                                    handleTimeChange(
                                                                        'checkin_closes_at',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full px-3 py-2 text-base border border-rose-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/50 text-rose-900 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="group bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg px-3 py-2.5 border border-emerald-200/50 hover:border-emerald-300 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                <span className="text-xs font-medium text-emerald-700">
                                                                    {t('checkInOpens')}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-medium text-emerald-900 font-mono">
                                                                {schedule.attendance_windows.checkin_opens_at}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="group bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg px-3 py-2.5 border border-blue-200/50 hover:border-blue-300 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                                <span className="text-xs font-medium text-blue-700">
                                                                    {t('onTimeEnds')}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-medium text-blue-900 font-mono">
                                                                {schedule.attendance_windows.ontime_ends_at}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="group bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-lg px-3 py-2.5 border border-rose-200/50 hover:border-rose-300 transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                                <span className="text-xs font-medium text-rose-700">
                                                                    {t('checkInCloses')}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-medium text-rose-900 font-mono">
                                                                {schedule.attendance_windows.checkin_closes_at}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* No Schedule Message */}
            {subject.schedules && subject.schedules.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                    <HiOutlineCalendar className="mx-auto h-12 w-12 text-amber-400 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">{t('noSchedule')}</h3>
                    <p className="text-slate-600">{t('noScheduleMessage')}</p>
                </div>
            )}

            {/* Search Bar and Add Student Button */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('searchStudentsPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleOpenAddStudentModal}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 whitespace-nowrap"
                    >
                        <HiOutlineUserAdd className="mr-2 h-5 w-5" />
                        {t('addStudent')}
                    </button>
                </div>
            </div>

            {/* Students Loading/Error States */}
            {studentsLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-lg text-slate-600">{t('loadingStudents')}</span>
                </div>
            )}

            {studentsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">{t('errorLoadingStudents')}</div>
                    <p className="text-red-500 mb-4">{studentsError}</p>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                        <HiOutlineRefresh className="mr-2" />
                        {t('tryAgain')}
                    </button>
                </div>
            )}

            {/* Students List */}
            {studentsData && !studentsLoading && !studentsError && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">{t('studentsList')}</h2>
                        <p className="text-sm text-slate-600">
                            {filteredStudents.length} {t('of')} {studentsData.count} {t('students')}
                        </p>
                    </div>

                    {filteredStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {t('student')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {t('classes')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {t('contact')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {t('status')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredStudents.map((student) => (
                                        <tr
                                            key={student.student_id}
                                            className="hover:bg-slate-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                        {student.full_name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {student.full_name}
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {student.student_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {student.class_names ? (
                                                        student.class_names.split(',').map((className, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                            >
                                                                {className.trim()}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-slate-500">{t('noClasses')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900">
                                                    <div className="flex items-center mb-1">
                                                        <HiOutlineMail className="h-4 w-4 text-slate-400 mr-2" />
                                                        {student.email}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <HiOutlinePhone className="h-4 w-4 text-slate-400 mr-2" />
                                                        {student.phone_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        student.status === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {student.status === 1 ? t('active') : t('inactive')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleOpenRemoveStudentModal(student)}
                                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                                                    title={t('removeStudent')}
                                                >
                                                    <HiOutlineTrash className="h-4 w-4 mr-1" />
                                                    {t('remove')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <HiOutlineUsers className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                {searchTerm ? t('noStudentsFound') : t('emptyClass')}
                            </h3>
                            <p className="text-slate-600">
                                {searchTerm ? t('noStudentsMatch') : t('noStudentsEnrolled')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={isAddStudentModalOpen}
                onClose={handleCloseAddStudentModal}
                subjectId={subject.subject_id}
                onStudentAdded={handleStudentAdded}
                enrolledStudentIds={studentsData?.data?.map((s) => s.student_id) || []}
            />

            {/* Remove Student Modal */}
            <RemoveStudentModal
                isOpen={isRemoveStudentModalOpen}
                onClose={handleCloseRemoveStudentModal}
                onConfirm={handleConfirmRemoveStudent}
                student={studentToRemove}
                isRemoving={isRemoving}
            />
        </div>
    )
}

SubjectDetail.propTypes = {
    subject: PropTypes.shape({
        subject_id: PropTypes.string.isRequired,
        subject_name: PropTypes.string.isRequired,
        schedules: PropTypes.arrayOf(
            PropTypes.shape({
                day: PropTypes.number,
                month: PropTypes.number,
                year: PropTypes.number,
                full_date: PropTypes.string,
                day_of_week: PropTypes.string,
                day_name: PropTypes.string,
                room: PropTypes.string,
                start_time: PropTypes.string,
                end_time: PropTypes.string,
                time_slot: PropTypes.string,
                schedule_status: PropTypes.number,
                attendance_windows: PropTypes.shape({
                    early_checkin_minutes: PropTypes.number,
                    ontime_window_minutes: PropTypes.number,
                    late_window_minutes: PropTypes.number,
                    checkin_opens_at: PropTypes.string,
                    ontime_ends_at: PropTypes.string,
                    checkin_closes_at: PropTypes.string
                })
            })
        )
    }),
    onBack: PropTypes.func.isRequired,
    onRefresh: PropTypes.func
}

export default SubjectDetail
