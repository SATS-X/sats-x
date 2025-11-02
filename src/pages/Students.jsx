import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import {
    HiOutlinePlus,
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineEye,
    HiOutlineTrash
} from 'react-icons/hi'
import { getAllStudents, getAllStudentsByClassId } from '../api/student/getStudent'
import { getAllSubjectsByTeacherId } from '../api/subject/getSubject'
import { getAllClasses } from '../api/class/getClasses'
import { deleteStudent } from '../api/student/deleteStudent'
import useUserAttributes from '../hooks/useUserAttributes'
import StudentDetailModal from '../components/Student/StudentDetailModal'
import { useParams } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import Modal from 'react-modal'

const Students = () => {
    const { t } = useLanguage()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState('all')

    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [subjects, setSubjects] = useState([])
    const [classes, setClasses] = useState([])
    const userAttributes = useUserAttributes()
    const { classId } = useParams()
    const { showSuccess, showError } = useToast()

    // Modal states
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                let res
                if (classId) {
                    res = await getAllStudentsByClassId(classId)
                } else {
                    res = await getAllStudents()
                }
                const list = (res?.data || []).map((s) => ({
                    id: s.student_id,
                    name: s.full_name,
                    grade: s.class_names || '—',
                    email: s.email,
                    phone: s.phone_number,
                    subjects: s.subject_names || '—',
                    attendance_rate: 0,
                    status: s.status === 1 ? 'active' : 'inactive'
                }))
                setStudents(list)
            } catch (e) {
                setError(e.message || 'Failed to load students')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [classId])

    // Load subjects for dropdown
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                if (!userAttributes?.sub) return
                const res = await getAllSubjectsByTeacherId(userAttributes.sub)
                const subjectList = (res?.subjects || []).map((s) => ({
                    id: s.subject_id,
                    name: s.name || s.subject_name || s.subject_id
                }))
                setSubjects(subjectList)
            } catch {
                setSubjects([])
            }
        }
        loadSubjects()
    }, [userAttributes])

    // Load classes for dropdown
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const res = await getAllClasses()
                if (res?.success && res?.data) {
                    setClasses(res.data)
                } else {
                    setClasses([])
                }
            } catch (error) {
                console.error('Error loading classes:', error)
                setClasses([])
            }
        }
        loadClasses()
    }, [])

    const filteredStudents = useMemo(() => {
        console.log('=== FILTERING DEBUG ===')
        console.log('Selected filters:', { selectedClass, selectedSubject })
        console.log('Total students:', students.length)
        console.log('Available subjects in dropdown:', subjects)

        // Debug: Show some student data structure
        if (students.length > 0) {
            console.log('Sample student data:', students[0])
        }

        return students.filter((student) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.id.toLowerCase().includes(searchTerm.toLowerCase())

            // If we're on a specific class page, don't filter by class
            let matchesClass = true
            if (!classId && selectedClass !== 'all') {
                // Find the selected class name from classes array
                const selectedClassObj = classes.find((c) => c.class_id === selectedClass)
                if (selectedClassObj) {
                    // Check if student's grade (class_names) contains the selected class name or class_id
                    matchesClass =
                        student.grade &&
                        (student.grade.toLowerCase().includes(selectedClassObj.class_name.toLowerCase()) ||
                            student.grade.includes(selectedClass))
                    console.log(
                        `Class filter: ${student.name} - grade: "${student.grade}", looking for: "${selectedClassObj.class_name}" or "${selectedClass}", matches: ${matchesClass}`
                    )
                } else {
                    matchesClass = false
                }
            }

            // Filter by subject - more flexible matching
            let matchesSubject = true
            if (selectedSubject !== 'all') {
                const selectedSubjectObj = subjects.find((s) => s.id === selectedSubject)
                const selectedSubjectName = selectedSubjectObj ? selectedSubjectObj.name : selectedSubject

                console.log(`\n--- Subject Filter Debug for ${student.name} ---`)
                console.log(`Student subjects: "${student.subjects}"`)
                console.log(`Looking for subject ID: "${selectedSubject}"`)
                console.log(`Looking for subject name: "${selectedSubjectName}"`)

                if (student.subjects && student.subjects !== '—') {
                    // Try multiple matching strategies
                    const subjectLower = student.subjects.toLowerCase()
                    const selectedIdLower = selectedSubject.toLowerCase()
                    const selectedNameLower = selectedSubjectName.toLowerCase()

                    matchesSubject = subjectLower.includes(selectedIdLower) || subjectLower.includes(selectedNameLower)

                    console.log(`Match by ID: ${subjectLower.includes(selectedIdLower)}`)
                    console.log(`Match by Name: ${subjectLower.includes(selectedNameLower)}`)
                    console.log(`Final subject match: ${matchesSubject}`)
                } else {
                    matchesSubject = false
                    console.log(`Student has no subjects or placeholder`)
                }
            }

            const finalMatch = matchesSearch && matchesClass && matchesSubject
            console.log(
                `${student.name}: search=${matchesSearch}, class=${matchesClass}, subject=${matchesSubject}, final=${finalMatch}`
            )

            return finalMatch
        })
    }, [students, searchTerm, selectedClass, selectedSubject, classId, classes, subjects])

    // Handle view student details
    const handleViewStudent = (student) => {
        setSelectedStudent(student)
        setIsViewModalOpen(true)
    }

    // Handle delete student
    const handleDeleteClick = (student) => {
        setStudentToDelete(student)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!studentToDelete) return

        setIsDeleting(true)
        try {
            await deleteStudent(studentToDelete.id)
            showSuccess(`Đã xóa sinh viên ${studentToDelete.name}`, 'Thành công')

            // Refresh student list
            setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id))
            setIsDeleteModalOpen(false)
            setStudentToDelete(null)
        } catch (error) {
            console.error('Error deleting student:', error)
            showError(error.message || 'Không thể xóa sinh viên', 'Lỗi')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false)
        setSelectedStudent(null)
    }

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false)
        setStudentToDelete(null)
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {classId ? t('studentsManagement') : t('studentsManagement')}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">
                        {classId ? `${t('class')}: ${classId}` : t('studentsManagementDesc')}
                    </p>
                </div>
                <button className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm sm:text-base">
                    <HiOutlinePlus className="text-lg" />
                    <span className="hidden sm:inline">{t('addStudent')}</span>
                    <span className="sm:hidden">{t('add')}</span>
                </button>
            </div>

            {/* Filters */}
            {!classId && (
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1">
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('searchStudents')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base min-w-0 flex-1 sm:flex-none"
                            >
                                <option value="all">Tất cả lớp</option>
                                {classes.map((classItem) => (
                                    <option key={classItem.class_id} value={classItem.class_id}>
                                        {classItem.class_name} ({classItem.class_id})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base min-w-0 flex-1 sm:flex-none"
                            >
                                <option value="all">Tất cả môn học</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                            <button className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-sm sm:text-base whitespace-nowrap">
                                <HiOutlineFilter />
                                <span className="hidden sm:inline">{t('filter')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error/Loading */}
            {loading && <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">Loading...</div>}
            {error && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-red-600">{error}</div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Mobile Cards View */}
                <div className="block sm:hidden">
                    <div className="divide-y divide-slate-200">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-slate-500">{student.id}</p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    student.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {student.status === 'active' ? t('studying') : t('onLeave')}
                                            </span>
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">{t('class')}:</span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {student.grade}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">{t('attendanceRate')}:</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-slate-200 rounded-full h-1.5">
                                                        <div
                                                            className="bg-emerald-500 h-1.5 rounded-full"
                                                            style={{ width: `${student.attendance_rate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-slate-900">
                                                        {student.attendance_rate}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewStudent(student)}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                title="Xem chi tiết"
                                            >
                                                <HiOutlineEye className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(student)}
                                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                title="Xóa sinh viên"
                                            >
                                                <HiOutlineTrash className="text-lg" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('student')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('class')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Môn học đang học
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                                    {t('contact')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('attendanceRate')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('status')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{student.name}</div>
                                                <div className="text-sm text-slate-500">{student.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {student.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1 max-w-[320px]">
                                            {(student.subjects ? student.subjects.split(',') : []).map((subj, idx) => (
                                                <span
                                                    key={`${student.id}-subj-${idx}`}
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800"
                                                >
                                                    {subj.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                        <div className="text-sm text-slate-900">{student.email}</div>
                                        <div className="text-sm text-slate-500">{student.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-slate-200 rounded-full h-2 mr-2 max-w-[80px]">
                                                <div
                                                    className="bg-emerald-500 h-2 rounded-full"
                                                    style={{ width: `${student.attendance_rate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-slate-900">{student.attendance_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                student.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {student.status === 'active' ? t('studying') : t('onLeave')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewStudent(student)}
                                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                                                title="Xem chi tiết"
                                            >
                                                <HiOutlineEye className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(student)}
                                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                title="Xóa sinh viên"
                                            >
                                                <HiOutlineTrash className="text-lg" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 sm:px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-slate-700 text-center sm:text-left">
                        {t('showing')} <span className="font-medium">{filteredStudents.length}</span>{' '}
                        {t('studentsTotal')}
                    </div>
                </div>
            </div>

            {/* View Student Modal */}
            <StudentDetailModal isOpen={isViewModalOpen} onClose={handleCloseViewModal} student={selectedStudent} />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onRequestClose={handleCloseDeleteModal}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <HiOutlineTrash className="text-2xl text-red-600" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa sinh viên</h3>

                        {studentToDelete && (
                            <p className="text-slate-600 text-center mb-6">
                                Bạn có chắc chắn muốn xóa sinh viên <strong>{studentToDelete.name}</strong> (
                                {studentToDelete.id})?
                                <br />
                                <span className="text-red-600 text-sm">Hành động này không thể hoàn tác.</span>
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseDeleteModal}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Students
