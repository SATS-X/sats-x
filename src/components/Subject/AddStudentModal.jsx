import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
    HiOutlineX,
    HiOutlineSearch,
    HiOutlineUserAdd,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineCalendar,
    HiOutlineAcademicCap
} from 'react-icons/hi'
import { getAllStudentsByClassId } from '../../api/student/getStudent'
import { getAllClasses } from '../../api/class/getClasses'
import { addStudentToSubject } from '../../api/subject/addStudentToSubject'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'

const AddStudentModal = ({ isOpen, onClose, subjectId, onStudentAdded, enrolledStudentIds }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    const [classesWithAvailableCount, setClassesWithAvailableCount] = useState([])
    const [selectedClass, setSelectedClass] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)

    const fetchClasses = useCallback(async () => {
        setLoading(true)
        try {
            const response = await getAllClasses()
            if (response.success) {
                const classesData = response.data || []
                
                // Fetch available student count for each class
                const classesWithCount = await Promise.all(
                    classesData.map(async (classItem) => {
                        try {
                            const studentsResponse = await getAllStudentsByClassId(classItem.class_id)
                            if (studentsResponse.success) {
                                const availableCount = (studentsResponse.data || []).filter(
                                    (student) => !enrolledStudentIds.includes(student.student_id)
                                ).length
                                return {
                                    ...classItem,
                                    available_student_count: availableCount
                                }
                            }
                            return {
                                ...classItem,
                                available_student_count: 0
                            }
                        } catch (error) {
                            console.error(`Error fetching students for class ${classItem.class_id}:`, error)
                            return {
                                ...classItem,
                                available_student_count: 0
                            }
                        }
                    })
                )
                setClassesWithAvailableCount(classesWithCount)
            }
        } catch (error) {
            console.error('Error fetching classes:', error)
            showError(error.message || t('errorLoadingClasses'), t('error'))
        } finally {
            setLoading(false)
        }
    }, [showError, t, enrolledStudentIds])

    const fetchStudentsByClass = useCallback(
        async (classId) => {
            setLoadingStudents(true)
            setStudents([])
            setSelectedStudent(null)
            try {
                const response = await getAllStudentsByClassId(classId)
                if (response.success) {
                    // Filter out students already enrolled in the subject
                    const availableStudents = (response.data || []).filter(
                        (student) => !enrolledStudentIds.includes(student.student_id)
                    )
                    setStudents(availableStudents)
                }
            } catch (error) {
                console.error('Error fetching students:', error)
                showError(error.message || t('failedToLoadStudents'), t('error'))
            } finally {
                setLoadingStudents(false)
            }
        },
        [enrolledStudentIds, showError, t]
    )

    useEffect(() => {
        if (isOpen) {
            fetchClasses()
            setSelectedClass(null)
            setStudents([])
            setSelectedStudent(null)
            setSearchTerm('')
        }
    }, [isOpen, fetchClasses])

    const handleSelectStudent = (student) => {
        setSelectedStudent(student)
    }

    const handleSave = async () => {
        if (!selectedStudent) {
            showError(t('pleaseSelectStudent'), t('validationError'))
            return
        }

        setSaving(true)
        try {
            const response = await addStudentToSubject(subjectId, selectedStudent.student_id)
            showSuccess(response.message || t('studentAddedSuccessfully'), t('success'))
            onStudentAdded()
            handleClose()
        } catch (error) {
            console.error('Error adding student:', error)
            showError(error.message || t('failedToAddStudent'), t('error'))
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        setSelectedClass(null)
        setSelectedStudent(null)
        setSearchTerm('')
        setStudents([])
        onClose()
    }

    const handleClassSelect = (classItem) => {
        setSelectedClass(classItem)
        fetchStudentsByClass(classItem.class_id)
    }

    const filteredStudents = students.filter(
        (student) =>
            student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

            {/* Modal panel */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <HiOutlineUserAdd className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="ml-3 text-xl font-semibold text-white">{t('addStudentToSubject')}</h3>
                        </div>
                        <button onClick={handleClose} className="text-white hover:text-slate-200 transition-colors">
                            <HiOutlineX className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Classes List */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden h-[500px] flex flex-col">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex-shrink-0">
                                <h4 className="text-sm font-semibold text-slate-700">
                                    {t('selectClass')} ({classesWithAvailableCount.length})
                                </h4>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : classesWithAvailableCount.length > 0 ? (
                                    <div className="divide-y divide-slate-200">
                                        {classesWithAvailableCount.map((classItem) => (
                                            <div
                                                key={classItem.class_id}
                                                onClick={() => handleClassSelect(classItem)}
                                                className={`p-4 cursor-pointer transition-colors ${
                                                    selectedClass?.class_id === classItem.class_id
                                                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="text-sm font-medium text-slate-900">
                                                    {classItem.class_name}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {classItem.available_student_count || 0} {t('availableStudentsCount')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-slate-500">{t('noClassesInSystem')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Students List */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden h-[500px] flex flex-col">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex-shrink-0">
                                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                                    {t('availableStudents')} ({filteredStudents.length})
                                </h4>
                                {/* Search Bar */}
                                <div className="relative">
                                    <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder={t('searchStudents')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {!selectedClass ? (
                                    <div className="p-8 text-center">
                                        <p className="text-slate-500 text-sm">{t('selectClassFirst')}</p>
                                    </div>
                                ) : loadingStudents ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : filteredStudents.length > 0 ? (
                                    <div className="divide-y divide-slate-200">
                                        {filteredStudents.map((student) => (
                                            <div
                                                key={student.student_id}
                                                onClick={() => handleSelectStudent(student)}
                                                className={`p-4 cursor-pointer transition-colors ${
                                                    selectedStudent?.student_id === student.student_id
                                                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                        {student.full_name.charAt(0)}
                                                    </div>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-900 truncate">
                                                            {student.full_name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {student.student_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <p className="text-slate-500 text-sm">
                                            {searchTerm ? t('noStudentsMatch') : t('noAvailableStudents')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Student Details */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden h-[500px] flex flex-col">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex-shrink-0">
                                <h4 className="text-sm font-semibold text-slate-700">{t('studentDetails')}</h4>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {selectedStudent ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center mb-6">
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold">
                                                {selectedStudent.full_name.charAt(0)}
                                            </div>
                                        </div>

                                        <div className="text-center mb-6">
                                            <h3 className="text-xl font-semibold text-slate-900">
                                                {selectedStudent.full_name}
                                            </h3>
                                            <p className="text-sm text-slate-500">{selectedStudent.student_id}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                                                <HiOutlineMail className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="ml-3">
                                                    <div className="text-xs text-slate-500">{t('email')}</div>
                                                    <div className="text-sm text-slate-900 break-all">
                                                        {selectedStudent.email}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                                                <HiOutlinePhone className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="ml-3">
                                                    <div className="text-xs text-slate-500">{t('phone')}</div>
                                                    <div className="text-sm text-slate-900">
                                                        {selectedStudent.phone_number}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                                                <HiOutlineCalendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="ml-3">
                                                    <div className="text-xs text-slate-500">{t('birthday')}</div>
                                                    <div className="text-sm text-slate-900">
                                                        {selectedStudent.birthday}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                                                <HiOutlineAcademicCap className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                                <div className="ml-3">
                                                    <div className="text-xs text-slate-500">{t('classes')}</div>
                                                    <div className="text-sm text-slate-900">
                                                        {selectedStudent.class_names || t('noClasses')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-start p-3 bg-slate-50 rounded-lg">
                                                <div className="ml-3">
                                                    <div className="text-xs text-slate-500">{t('status')}</div>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            selectedStudent.status === 1
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {selectedStudent.status === 1 ? t('active') : t('inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <HiOutlineUserAdd className="h-16 w-16 text-slate-300 mb-4" />
                                        <p className="text-slate-500">{t('selectStudentToView')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-200 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('close')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedStudent || saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                {t('saving')}
                            </>
                        ) : (
                            <>
                                <HiOutlineUserAdd className="h-4 w-4 mr-2" />
                                {t('save')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

AddStudentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    subjectId: PropTypes.string.isRequired,
    onStudentAdded: PropTypes.func.isRequired,
    enrolledStudentIds: PropTypes.arrayOf(PropTypes.string).isRequired
}

export default AddStudentModal
