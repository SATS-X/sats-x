import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineX, HiOutlineUserAdd, HiOutlineCheck } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import { getAllClasses } from '../../api/class/getClasses'
import { createStudent } from '../../api/student/createStudent'

const AddStudentModal = ({ isOpen, onClose, selectedClass, onSuccess }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [classes, setClasses] = useState([])
    const [loadingClasses, setLoadingClasses] = useState(false)
    const [formData, setFormData] = useState({
        student_id: '',
        full_name: '',
        class_id: '',
        email: '',
        phone_number: '',
        birthday: '',
        status: 1
    })

    // Fetch all classes for dropdown
    useEffect(() => {
        const fetchClasses = async () => {
            setLoadingClasses(true)
            try {
                const response = await getAllClasses()
                if (response?.data) {
                    setClasses(response.data)
                }
            } catch (error) {
                console.error('Error fetching classes:', error)
            } finally {
                setLoadingClasses(false)
            }
        }

        if (isOpen) {
            fetchClasses()
        }
    }, [isOpen])

    // Set selected class when modal opens
    useEffect(() => {
        if (selectedClass && isOpen) {
            setFormData(prev => ({
                ...prev,
                class_id: selectedClass.class_id
            }))
        }
    }, [selectedClass, isOpen])

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.student_id || !formData.full_name || !formData.class_id || 
            !formData.email || !formData.phone_number || !formData.birthday) {
            showError(t('pleaseAllFields'), t('validationError'))
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            showError(t('invalidEmailFormat'), t('validationError'))
            return
        }

        // Validate phone number (basic validation)
        const phoneRegex = /^[0-9]{10,11}$/
        if (!phoneRegex.test(formData.phone_number)) {
            showError(t('invalidPhoneFormat'), t('validationError'))
            return
        }

        try {
            setIsSubmitting(true)

            // Call API to create student
            const response = await createStudent({
                student_id: formData.student_id,
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                birthday: formData.birthday,
                class_id: formData.class_id,
                status: formData.status
            })

            // Show success message from API or default message
            const successMessage = response.message || t('studentAddedSuccess')
            showSuccess(successMessage, t('success'))
            
            // Callback to refresh data
            onSuccess()
            handleClose()

        } catch (error) {
            console.error('Error adding student:', error)
            
            // Show specific error message
            let errorMessage = t('errorAddingStudent')
            
            if (error.status === 409) {
                errorMessage = t('studentIdExists')
            } else if (error.status === 400) {
                errorMessage = error.message || t('invalidStudentData')
            } else if (error.message) {
                errorMessage = error.message
            }
            
            showError(errorMessage, t('error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({
            student_id: '',
            full_name: '',
            class_id: selectedClass?.class_id || '',
            email: '',
            phone_number: '',
            birthday: '',
            status: 1
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-blue-500 rounded-full p-2.5 mr-3 shadow-sm">
                                <HiOutlineUserAdd className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                                    {t('studentManagement')}
                                </p>
                                <h2 className="text-xl font-semibold text-gray-800">{t('addNewStudent')}</h2>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('studentId')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.student_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value.toUpperCase() }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={t('enterStudentId')}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('fullName')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={t('enterFullName')}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('class')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
                                    disabled={isSubmitting || loadingClasses}
                                >
                                    <option value="">{loadingClasses ? t('loading') : t('selectClass')}</option>
                                    {classes.map((classItem) => (
                                        <option key={classItem.class_id} value={classItem.class_id}>
                                            {classItem.class_id} - {classItem.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={t('enterEmail')}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('phoneNumber')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value.replace(/\D/g, '') }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={t('enterPhoneNumber')}
                                    disabled={isSubmitting}
                                    maxLength={11}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('birthday')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.birthday}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('status')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
                                    disabled={isSubmitting}
                                >
                                    <option value={1}>{t('active')}</option>
                                    <option value={0}>{t('inactive')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !formData.student_id || !formData.full_name || 
                                     !formData.class_id || !formData.email || !formData.phone_number || 
                                     !formData.birthday}
                            className={`px-4 py-2 text-sm rounded-lg flex items-center transition-colors duration-150 ${
                                isSubmitting || !formData.student_id || !formData.full_name || 
                                !formData.class_id || !formData.email || !formData.phone_number || 
                                !formData.birthday
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('adding')}
                                </>
                            ) : (
                                <>
                                    <HiOutlineCheck className="w-4 h-4 mr-2" />
                                    {t('save')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

AddStudentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedClass: PropTypes.shape({
        class_id: PropTypes.string,
        class_name: PropTypes.string
    }),
    onSuccess: PropTypes.func.isRequired
}

export default AddStudentModal

