import { useState } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineX, HiOutlineExclamation, HiOutlineTrash } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import { WS_URL } from '../../config/api'

const DeleteFaceModal = ({ isOpen, onClose, student, className, onSuccess }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!student || !student.student_id || !student.faceID) {
            showError(t('faceNotFound'), t('error'))
            return
        }

        try {
            setIsDeleting(true)

            // Generate collection_id based on class_name
            const collectionId = `attendance-system-${className}`

            const ws = new WebSocket(WS_URL)
            
            const payload = {
                action: "deleteFaceAndImage",
                face_id: student.faceID,
                student_id: student.student_id,
                student_name: student.full_name,
                class_name: className,
                collection_id: collectionId
            }

            console.log('Sending deleteFaceAndImage payload:', payload)

            ws.onopen = () => {
                console.log('WebSocket connection opened for deleting face')
                ws.send(JSON.stringify(payload))
            }

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data)
                    console.log('Delete face response:', response)
                    
                    // Check if response has result object
                    if (response.action === 'deleteFaceAndImage' && response.result) {
                        if (response.result.success === true) {
                            // Success case
                            const successMessage = response.result.message || t('faceDeletedSuccess')
                            showSuccess(successMessage, t('success'))
                            onSuccess()
                            onClose()
                        } else {
                            // Failed case
                            showError(response.result.message || t('cannotDeleteFace'), t('error'))
                        }
                    } 
                    // Fallback to old format
                    else if (response.status === 'success') {
                        showSuccess(t('faceDeletedSuccess'), t('success'))
                        onSuccess()
                        onClose()
                    } else {
                        showError(response.message || t('cannotDeleteFace'), t('error'))
                    }
                } catch (error) {
                    console.error('Error parsing response:', error)
                    showError(t('errorDeletingFace'), t('error'))
                }
                setIsDeleting(false)
                ws.close()
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                showError(t('websocketConnectionError'), t('error'))
                setIsDeleting(false)
                ws.close()
            }

            // Timeout after 30 seconds
            setTimeout(() => {
                if (ws.readyState !== WebSocket.CLOSED) {
                    ws.close()
                    setIsDeleting(false)
                    showError(t('deleteTimeout'), t('error'))
                }
            }, 30000)

        } catch (error) {
            console.error('Error deleting face:', error)
            showError(t('errorDeletingFace'), t('error'))
            setIsDeleting(false)
        }
    }

    if (!isOpen || !student) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-5 border-b border-orange-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-orange-500 rounded-full p-2.5 mr-3 shadow-sm">
                                <HiOutlineExclamation className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-orange-600 uppercase tracking-wide font-medium">
                                    {t('warning')}
                                </p>
                                <h2 className="text-xl font-semibold text-gray-800">{t('deleteFaceID')}</h2>
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
                                <span className="font-medium w-24">{t('class')}:</span>
                                <span>{className}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="font-medium w-24">Face ID:</span>
                                <span className="text-xs font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
                                    {student.faceID}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <HiOutlineExclamation className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-orange-800">
                                    {t('deleteFaceConfirmMessage')}
                                </p>
                                <p className="mt-2 text-sm text-orange-700">
                                    {t('deleteFaceWarning')}
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
                                    : 'bg-orange-600 text-white hover:bg-orange-700'
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

DeleteFaceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.shape({
        student_id: PropTypes.string,
        full_name: PropTypes.string,
        faceID: PropTypes.string
    }),
    className: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired
}

export default DeleteFaceModal

