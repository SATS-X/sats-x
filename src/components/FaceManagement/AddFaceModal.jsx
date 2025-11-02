import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineX, HiOutlineCloudUpload, HiOutlinePhotograph, HiOutlineCheck, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import { WS_URL } from '../../config/api'
import { getAllClasses } from '../../api/class/getClasses'

const AddFaceModal = ({ isOpen, onClose, student, onSuccess }) => {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()
    
    const [isUploading, setIsUploading] = useState(false)
    const [classes, setClasses] = useState([])
    const [loadingClasses, setLoadingClasses] = useState(false)
    const [currentFaceImage, setCurrentFaceImage] = useState(null)
    const [loadingCurrentImage, setLoadingCurrentImage] = useState(false)
    const [formData, setFormData] = useState({
        student_id: '',
        student_name: '',
        class_name: '',
        email: '',
        phone_number: '',
        image: null,
        imagePreview: null
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

    // Update form data when student prop changes
    useEffect(() => {
        if (student && isOpen) {
            // Extract class_id from class_names if it exists
            // class_names might be "Internet Vạn Vật" but we need the class_id
            // We'll use the first class from the dropdown or the provided class_id
            setFormData({
                student_id: student.student_id || '',
                student_name: student.full_name || '',
                class_name: student.class_id || student.class_names?.split(',')[0]?.trim() || '',
                email: student.email || '',
                phone_number: student.phone_number || '',
                image: null,
                imagePreview: null
            })

            // Fetch current face image if student has faceID
            if (student.faceID) {
                fetchCurrentFaceImage(student)
            } else {
                setCurrentFaceImage(null)
            }
        }
    }, [student, isOpen])

    // Fetch current face image using WebSocket
    const fetchCurrentFaceImage = async (studentData) => {
        if (!studentData.faceID) return

        try {
            setLoadingCurrentImage(true)
            
            const ws = new WebSocket(WS_URL)
            
            const payload = {
                action: "student-image",
                class_name: studentData.class_id || studentData.class_names?.split(',')[0]?.trim(),
                student_name: studentData.full_name,
                student_id: studentData.student_id,
                expiration: 1800
            }

            console.log('Fetching student image with payload:', payload)

            ws.onopen = () => {
                console.log('WebSocket connection opened for fetching student image')
                ws.send(JSON.stringify(payload))
            }

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data)
                    console.log('Student image response:', response)
                    
                    // Check for the actual response format
                    if (response.status === 'success' && response.data && response.data.presigned_url) {
                        console.log('✅ Found presigned URL in response.data:', response.data.presigned_url)
                        setCurrentFaceImage(response.data.presigned_url)
                    } else if (response.action === 'student-image' && response.result) {
                        if (response.result.success === true && response.result.presigned_url) {
                            setCurrentFaceImage(response.result.presigned_url)
                        } else {
                            console.warn('Failed to get student image:', response.result.message)
                            setCurrentFaceImage(null)
                        }
                    } else if (response.presigned_url) {
                        // Direct presigned_url format
                        setCurrentFaceImage(response.presigned_url)
                    } else {
                        console.warn('No presigned URL found in response:', response)
                        setCurrentFaceImage(null)
                    }
                } catch (error) {
                    console.error('Error parsing student image response:', error)
                    setCurrentFaceImage(null)
                }
                setLoadingCurrentImage(false)
                ws.close()
            }

            ws.onerror = (error) => {
                console.error('WebSocket error while fetching student image:', error)
                setLoadingCurrentImage(false)
                setCurrentFaceImage(null)
                ws.close()
            }

            // Timeout after 10 seconds
            setTimeout(() => {
                if (ws.readyState !== WebSocket.CLOSED) {
                    ws.close()
                    setLoadingCurrentImage(false)
                    setCurrentFaceImage(null)
                }
            }, 10000)

        } catch (error) {
            console.error('Error fetching current face image:', error)
            setLoadingCurrentImage(false)
            setCurrentFaceImage(null)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError(t('invalidImageFormat'), t('error'))
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError(t('imageTooLarge'), t('error'))
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: file,
                    imagePreview: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.student_id || !formData.student_name || !formData.class_name || 
            !formData.email || !formData.phone_number || !formData.image) {
            showError(t('pleaseAllFields'), t('validationError'))
            return
        }

        try {
            setIsUploading(true)

            // Convert image to base64 (remove data:image/xxx;base64, prefix)
            const base64Image = formData.imagePreview.split(',')[1]

            // Generate collection_id based on class_name
            const collectionId = `attendance-system-${formData.class_name}`

            const ws = new WebSocket(WS_URL)
            
            const payload = {
                action: "addFace",
                image: base64Image,
                student_id: formData.student_id,
                student_name: formData.student_name,
                class_name: formData.class_name,
                email: formData.email,
                phone_number: formData.phone_number,
                collection_id: collectionId
            }

            console.log('Sending addFace payload:', {
                ...payload,
                image: `${base64Image.substring(0, 50)}...` // Log only first 50 chars of image
            })

            ws.onopen = () => {
                console.log('WebSocket connection opened for adding face')
                ws.send(JSON.stringify(payload))
            }

            ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data)
                    console.log('Add face response:', response)
                    
                    // Check if response has result object (new format)
                    if (response.action === 'addFace' && response.result) {
                        if (response.result.success === true) {
                            // Success case
                            const successMessage = response.result.message || t('faceAddedSuccess')
                            showSuccess(successMessage, t('success'))
                            onSuccess()
                            handleClose()
                        } else {
                            // Failed case with result but success = false
                            showError(response.result.message || t('cannotAddFace'), t('error'))
                        }
                    } 
                    // Fallback to old format
                    else if (response.status === 'success') {
                        showSuccess(t('faceAddedSuccess'), t('success'))
                        onSuccess()
                        handleClose()
                    } else {
                        showError(response.message || t('cannotAddFace'), t('error'))
                    }
                } catch (error) {
                    console.error('Error parsing response:', error)
                    showError(t('errorAddingFace'), t('error'))
                }
                setIsUploading(false)
                ws.close()
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                showError(t('websocketConnectionError'), t('error'))
                setIsUploading(false)
                ws.close()
            }

            // Timeout after 30 seconds
            setTimeout(() => {
                if (ws.readyState !== WebSocket.CLOSED) {
                    ws.close()
                    setIsUploading(false)
                    showError(t('uploadTimeout'), t('error'))
                }
            }, 30000)

        } catch (error) {
            console.error('Error adding face:', error)
            showError(t('errorAddingFace'), t('error'))
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            student_id: '',
            student_name: '',
            class_name: '',
            email: '',
            phone_number: '',
            image: null,
            imagePreview: null
        })
        setCurrentFaceImage(null)
        setLoadingCurrentImage(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-indigo-500 rounded-full p-2.5 mr-3 shadow-sm">
                                <HiOutlinePhotograph className="text-white w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                                    {t('faceRegistration')}
                                </p>
                                <h2 className="text-xl font-semibold text-gray-800">{t('addNewFace')}</h2>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isUploading}
                            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full transition-colors disabled:opacity-50"
                        >
                            <HiOutlineX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Form Fields */}
                        <div className="lg:col-span-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('studentId')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.student_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder={t('enterStudentId')}
                                    disabled={isUploading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('fullName')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.student_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, student_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder={t('enterFullName')}
                                    disabled={isUploading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('class')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.class_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white"
                                    disabled={isUploading || loadingClasses}
                                >
                                    <option value="">{loadingClasses ? t('loading') : t('selectClass')}</option>
                                    {classes.map((classItem) => (
                                        <option key={classItem.class_id} value={classItem.class_id}>
                                            {classItem.class_id} - {classItem.class_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder={t('enterEmail')}
                                    disabled={isUploading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('phoneNumber')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                    placeholder={t('enterPhoneNumber')}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        {/* Middle Column - Current Face Image */}
                        {student?.faceID && (
                            <div className="lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('currentFaceImage')}
                                </label>
                                <div className="border border-gray-300 rounded-lg p-4 h-full min-h-[400px] flex items-center justify-center bg-gray-50">
                                    {loadingCurrentImage ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                            <p className="text-sm text-gray-500">{t('loadingCurrentImage')}</p>
                                        </div>
                                    ) : currentFaceImage ? (
                                        <div className="space-y-3 text-center w-full">
                                            <img
                                                src={currentFaceImage}
                                                alt="Current Face"
                                                className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
                                                onError={(e) => {
                                                    console.error('Failed to load current face image:', currentFaceImage)
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.full_name || 'Student')}&size=300&background=6366f1&color=ffffff&format=png&bold=true`
                                                }}
                                                onLoad={() => {
                                                    console.log('✅ Current face image loaded successfully')
                                                }}
                                            />
                                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center">
                                                <HiOutlineCheckCircle className="mr-1 h-4 w-4" />
                                                {t('studentHasFaceID')}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 text-center">
                                            <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                                                <HiOutlineXCircle className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <p className="text-sm text-gray-500">{t('noCurrentImage')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Right Column - Image Upload */}
                        <div className={student?.faceID ? "lg:col-span-1" : "lg:col-span-2"}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {student?.faceID ? t('uploadNewImageToUpdate') : t('uploadFaceImage')} <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-indigo-400 h-full min-h-[400px] flex items-center justify-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="face-image-upload"
                                    disabled={isUploading}
                                />
                                <label htmlFor="face-image-upload" className="cursor-pointer block w-full h-full flex items-center justify-center">
                                    {formData.imagePreview ? (
                                        <div className="space-y-3 text-center w-full">
                                            <img
                                                src={formData.imagePreview}
                                                alt="Preview"
                                                className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
                                            />
                                            <div className="flex items-center justify-center text-sm text-gray-500">
                                                <HiOutlineCloudUpload className="w-5 h-5 mr-1" />
                                                {t('clickToChangeImage')}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 text-center">
                                            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                                                <HiOutlineCloudUpload className="w-10 h-10 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {t('clickToUploadFaceImage')}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t('supportedFormats')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {t('maxFileSize')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isUploading || !formData.student_id || !formData.student_name || 
                                     !formData.class_name || !formData.email || !formData.phone_number || 
                                     !formData.image}
                            className={`px-4 py-2 text-sm rounded-lg flex items-center transition-colors duration-150 ${
                                isUploading || !formData.student_id || !formData.student_name || 
                                !formData.class_name || !formData.email || !formData.phone_number || 
                                !formData.image
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('uploading')}
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

AddFaceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.shape({
        student_id: PropTypes.string,
        full_name: PropTypes.string,
        class_id: PropTypes.string,
        class_names: PropTypes.string,
        email: PropTypes.string,
        phone_number: PropTypes.string,
        faceID: PropTypes.string
    }),
    onSuccess: PropTypes.func.isRequired
}

export default AddFaceModal
