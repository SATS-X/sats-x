import { useState } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineX, HiOutlineExclamation, HiOutlineTrash } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import { deleteStudent } from '../../api/student/deleteStudent'

const DeleteStudentModal = ({ isOpen, onClose, student, onSuccess }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!student || !student.student_id) {
            showError(t('studentNotFound'), t('error'))
            return
        }

        try {
            setIsDeleting(true)

            // Call API to delete student
            const response = await deleteStudent(student.student_id)

            // Show success message from API or default message
            const successMessage = response.message || t('studentDeletedSuccess')
            showSuccess(successMessage, t('success'))
            
            // Callback to refresh data
            onSuccess()
            onClose()

        } catch (error) {
            console.error('Error deleting student:', error)
            
            // Show specific error message
            let errorMessage = t('errorDeletingStudent')
            
            if (error.status === 404) {
                errorMessage = t('studentNotFound')
            } else if (error.message) {
                errorMessage = error.message
            }
            
            showError(errorMessage, t('error'))
        } finally {
            setIsDeleting(false)
        }
    }

    if (!isOpen || !student) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-red-500 rounded-full p-2.5 mr-3 shadow-sm">
                                <HiOutlineExclamation className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-red-600 uppercase tracking-wide font-medium">
                                    {t('warning')}
                                </p>
                                <h2 className="text-xl font-semibold text-gray-800">{t('deleteStudent')}</h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                                {student.full_name?.charAt(0) || 'S'}
                            </div>
                            <div className="ml-4">
                                <div className="text-base font-semibold text-gray-900">{student.full_name}</div>
                                <div className="text-sm text-gray-500">{student.student_id}</div>
                            </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                                <span className="font-medium w-24">{t('email')}:</span>
                                <span>{student.email}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium w-24">{t('phoneNumber')}:</span>
                                <span>{student.phone_number}</span>
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <HiOutlineExclamation className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">
                                    {t('deleteStudentConfirmMessage')}
                                </p>
                                <p className="mt-2 text-sm text-red-700">
                                    {t('deleteStudentWarning')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600">
                        {t('confirmAction')}
                    </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`px-4 py-2 text-sm rounded-lg flex items-center transition-colors duration-150 ${
                                isDeleting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('deleting')}
                                </>
                            ) : (
                                <>
                                    <HiOutlineTrash className="w-4 h-4 mr-2" />
                                    {t('delete')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

DeleteStudentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.shape({
        student_id: PropTypes.string,
        full_name: PropTypes.string,
        email: PropTypes.string,
        phone_number: PropTypes.string
    }),
    onSuccess: PropTypes.func.isRequired
}

export default DeleteStudentModal

