import { useState, useEffect, useCallback } from 'react'
import { 
    HiOutlineUserGroup, 
    HiOutlineUsers, 
    HiOutlinePhotograph, 
    HiOutlineRefresh, 
    HiOutlineArrowLeft, 
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineUserAdd,
    HiOutlineDotsVertical,
    HiOutlinePencilAlt
} from 'react-icons/hi'
import { getAllClasses } from '../api/class/getClasses'
import { getAllStudentsByClassId } from '../api/student/getStudent'
import { useLanguage } from '../contexts/LanguageContext'
import ListFaceClasses from '../components/FaceManagement/ListFaceClasses'
import AddFaceModal from '../components/FaceManagement/AddFaceModal'
import AddStudentModal from '../components/FaceManagement/AddStudentModal'
import DeleteStudentModal from '../components/FaceManagement/DeleteStudentModal'
import DeleteFaceModal from '../components/FaceManagement/DeleteFaceModal'
import DropdownMenu from '../components/FaceManagement/DropdownMenu'

const FaceManagement = () => {
    const { t } = useLanguage()
    
    // State for classes
    const [classesData, setClassesData] = useState(null)
    const [classesLoading, setClassesLoading] = useState(false)
    const [classesError, setClassesError] = useState(null)
    
    // State for selected class and students
    const [selectedClass, setSelectedClass] = useState(null)
    const [studentsData, setStudentsData] = useState(null)
    const [studentsLoading, setStudentsLoading] = useState(false)
    const [studentsError, setStudentsError] = useState(null)
    
    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 15
    
    // State for add face modal
    const [showAddFaceModal, setShowAddFaceModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    
    // State for add student modal
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    
    // State for delete student modal
    const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState(null)
    
    // State for delete face modal
    const [showDeleteFaceModal, setShowDeleteFaceModal] = useState(false)
    const [faceToDelete, setFaceToDelete] = useState(null)
    
    // State for dropdown menu
    const [openDropdownId, setOpenDropdownId] = useState(null)
    const [dropdownButtonRef, setDropdownButtonRef] = useState(null)

    // Fetch all classes
    const fetchClasses = useCallback(async () => {
        setClassesLoading(true)
        setClassesError(null)
        
        try {
            const response = await getAllClasses()
            setClassesData(response)
        } catch (error) {
            console.error('Error fetching classes:', error)
            setClassesError(error.message || t('errorLoadingClasses'))
        } finally {
            setClassesLoading(false)
        }
    }, [t])

    // Fetch students for selected class
    const fetchStudentsForClass = useCallback(async (classId) => {
        setStudentsLoading(true)
        setStudentsError(null)
        
        try {
            const response = await getAllStudentsByClassId(classId)
            setStudentsData(response)
        } catch (error) {
            console.error('Error fetching students for class:', error)
            setStudentsError(error.message || t('errorLoadingStudents'))
        } finally {
            setStudentsLoading(false)
        }
    }, [t])

    useEffect(() => {
        fetchClasses()
    }, [fetchClasses])

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    const handleClassClick = (classItem) => {
        setSelectedClass(classItem)
        fetchStudentsForClass(classItem.class_id)
        setSearchTerm('')
        setCurrentPage(1)
    }

    const handleBackToClasses = () => {
        setSelectedClass(null)
        setStudentsData(null)
        setSearchTerm('')
        setCurrentPage(1)
    }

    const handleRefresh = () => {
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.class_id)
        } else {
            fetchClasses()
        }
    }

    const handleAddFaceClick = (student) => {
        // Add class_id to student object for the modal
        const studentWithClass = {
            ...student,
            class_id: selectedClass.class_id,
            class_names: selectedClass.class_name
        }
        setSelectedStudent(studentWithClass)
        setShowAddFaceModal(true)
    }

    const handleAddFaceSuccess = () => {
        // Refresh student list to show updated faceID
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.class_id)
        }
    }

    const handleAddStudentSuccess = () => {
        // Refresh student list after adding new student
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.class_id)
        }
        // Also refresh classes to update student count
        fetchClasses()
    }

    const handleDeleteStudentClick = (student) => {
        setStudentToDelete(student)
        setShowDeleteStudentModal(true)
    }

    const handleDeleteStudentSuccess = () => {
        // Refresh student list after deleting student
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.class_id)
        }
        // Also refresh classes to update student count
        fetchClasses()
    }

    const handleDeleteFaceClick = (student) => {
        setFaceToDelete(student)
        setShowDeleteFaceModal(true)
        setOpenDropdownId(null)
        setDropdownButtonRef(null)
    }

    const handleDeleteFaceSuccess = () => {
        // Refresh student list after deleting face
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.class_id)
        }
    }

    const toggleDropdown = (studentId, buttonElement) => {
        if (openDropdownId === studentId) {
            setOpenDropdownId(null)
            setDropdownButtonRef(null)
        } else {
            setOpenDropdownId(studentId)
            setDropdownButtonRef(buttonElement)
        }
    }

    // Filter students based on search term
    const filteredStudents = studentsData?.data?.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = Math.min(startIdx + pageSize, filteredStudents.length)
    const pageRows = filteredStudents.slice(startIdx, endIdx)

    // Render loading state
    if (classesLoading && !selectedClass) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-lg text-slate-600">{t('loadingClasses')}</span>
            </div>
        )
    }

    // Render error state
    if (classesError && !selectedClass) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 text-lg font-medium mb-2">{t('errorLoadingClasses')}</div>
                <p className="text-red-500 mb-4">{classesError}</p>
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                    <HiOutlineRefresh className="mr-2" />
                    {t('tryAgain')}
                </button>
            </div>
        )
    }

    // Render class detail view (students list)
    if (selectedClass) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToClasses}
                            className="mr-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                        >
                            <HiOutlineArrowLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {t('faceManagement')} - {selectedClass.class_name}
                            </h1>
                            <p className="text-slate-600">{t('class')}: {selectedClass.class_id}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddStudentModal(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            <HiOutlineUserAdd className="text-lg" />
                            {t('addNewStudent')}
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                        >
                            <HiOutlineRefresh className="text-lg" />
                            {t('refresh')}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {studentsData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <HiOutlineUsers className="text-indigo-600 text-xl" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">{t('totalStudents')}</p>
                                    <p className="text-2xl font-bold text-slate-900">{studentsData.count}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <HiOutlineUserGroup className="text-green-600 text-xl" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">{t('class')}</p>
                                    <p className="text-2xl font-bold text-slate-900">{selectedClass.class_name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <HiOutlinePhotograph className="text-purple-600 text-xl" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-600">{t('displayingStudents')}</p>
                                    <p className="text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('searchStudentsPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Loading/Error States */}
                {studentsLoading && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        {t('loadingStudentList')}
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

                {/* Students Table */}
                {studentsData && !studentsLoading && !studentsError && (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {t('studentName')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {t('class')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {t('contact')}
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Face ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {t('status')}
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                {t('actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {pageRows.map((student) => (
                                            <tr key={student.student_id} className="hover:bg-slate-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                            {student.full_name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-slate-900">{student.full_name}</div>
                                                            <div className="text-sm text-slate-500">{student.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        {selectedClass.class_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    <div>{student.email}</div>
                                                    <div className="text-xs text-slate-500">{student.phone_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {student.faceID ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                                <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
                                                                {student.faceID}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                            <HiOutlineXCircle className="mr-1 h-4 w-4" />
                                                            {t('noFaceImages')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        student.status === 1 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {student.status === 1 ? t('active') : t('inactive')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Face Image Button */}
                                                        <button
                                                            onClick={() => handleAddFaceClick(student)}
                                                            className={`inline-flex items-center justify-center px-3 py-2 text-white text-sm rounded-lg transition-all duration-200 ${
                                                                student.faceID 
                                                                    ? 'bg-green-600 hover:bg-green-700' 
                                                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                                            }`}
                                                            title={student.faceID ? t('updateFaceImage') : t('addFaceImage')}
                                                        >
                                                            {student.faceID ? (
                                                                <>
                                                                    <HiOutlinePencilAlt className="mr-1.5 h-4 w-4" />
                                                                    <span className="hidden sm:inline">{t('update')}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <HiOutlinePlus className="mr-1.5 h-4 w-4" />
                                                                    <span className="hidden sm:inline">{t('add')}</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleDropdown(student.student_id, e.currentTarget)
                                                                }}
                                                                className="inline-flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                                                                title={t('moreActions')}
                                                            >
                                                                <HiOutlineDotsVertical className="h-5 w-5" />
                                                            </button>

                                                            {/* Dropdown Menu Component */}
                                                            {openDropdownId === student.student_id && dropdownButtonRef && (
                                                                <DropdownMenu
                                                                    student={student}
                                                                    onDeleteFace={handleDeleteFaceClick}
                                                                    onDeleteStudent={handleDeleteStudentClick}
                                                                    onClose={() => {
                                                                        setOpenDropdownId(null)
                                                                        setDropdownButtonRef(null)
                                                                    }}
                                                                    buttonRef={dropdownButtonRef}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-700">
                                    {t('showingRecords')} <span className="font-medium">{filteredStudents.length === 0 ? 0 : startIdx + 1}</span> {t('toRecords')} <span className="font-medium">{endIdx}</span> {t('ofTotalRecords')} <span className="font-medium">{filteredStudents.length}</span> {t('students')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 border border-slate-300 rounded-md text-sm transition-colors duration-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                                    >
                                        {t('previous')}
                                    </button>
                                    <span className="text-sm text-slate-700">{t('page')} {currentPage}/{totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 border border-slate-300 rounded-md text-sm transition-colors duration-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                                    >
                                        {t('next')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Add Face Modal */}
                <AddFaceModal
                    isOpen={showAddFaceModal}
                    onClose={() => {
                        setShowAddFaceModal(false)
                        setSelectedStudent(null)
                    }}
                    student={selectedStudent}
                    onSuccess={handleAddFaceSuccess}
                />

                {/* Add Student Modal */}
                <AddStudentModal
                    isOpen={showAddStudentModal}
                    onClose={() => setShowAddStudentModal(false)}
                    selectedClass={selectedClass}
                    onSuccess={handleAddStudentSuccess}
                />

                {/* Delete Student Modal */}
                <DeleteStudentModal
                    isOpen={showDeleteStudentModal}
                    onClose={() => {
                        setShowDeleteStudentModal(false)
                        setStudentToDelete(null)
                    }}
                    student={studentToDelete}
                    onSuccess={handleDeleteStudentSuccess}
                />

                {/* Delete Face Modal */}
                <DeleteFaceModal
                    isOpen={showDeleteFaceModal}
                    onClose={() => {
                        setShowDeleteFaceModal(false)
                        setFaceToDelete(null)
                    }}
                    student={faceToDelete}
                    className={selectedClass?.class_id}
                    onSuccess={handleDeleteFaceSuccess}
                />
            </div>
        )
    }

    // Render classes list view
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('faceManagement')}</h1>
                    <p className="text-slate-600">{t('faceManagementDesc')}</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                    <HiOutlineRefresh className="text-lg" />
                    {t('refresh')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <HiOutlineUserGroup className="text-blue-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('totalClasses')}</p>
                            <p className="text-2xl font-bold text-slate-900">{classesData?.count || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <HiOutlineUsers className="text-green-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('totalStudents')}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {classesData?.data?.reduce((sum, cls) => sum + (cls.actual_student_count || cls.number_of_students || 0), 0) || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <HiOutlinePhotograph className="text-purple-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('manageFaces')}</p>
                            <p className="text-2xl font-bold text-slate-900">{t('faceManagementReady')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes List */}
            <ListFaceClasses 
                classes={classesData?.data || []} 
                onClassClick={handleClassClick}
            />
        </div>
    )
}

export default FaceManagement
