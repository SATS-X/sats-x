import PropTypes from 'prop-types'
import { HiOutlineExclamation, HiOutlineX } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'

const RemoveStudentModal = ({ isOpen, onClose, onConfirm, student, isRemoving }) => {
    const { t } = useLanguage()

    if (!isOpen || !student) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background overlay */}
            <div 
                className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity"
                onClick={onClose}
            />

            {/* Modal panel */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md z-10">
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <HiOutlineExclamation className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="ml-3 text-xl font-semibold text-white">
                                {t('removeStudent')}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isRemoving}
                            className="text-white hover:text-slate-200 transition-colors disabled:opacity-50"
                        >
                            <HiOutlineX className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <div className="mb-4">
                        <p className="text-slate-700 mb-2">
                            {t('removeStudentConfirmMessage')}
                        </p>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    {student.full_name.charAt(0)}
                                </div>
                                <div className="ml-3">
                                    <div className="text-sm font-medium text-slate-900">
                                        {student.full_name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {student.student_id}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                            {t('removeStudentWarning')}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-200 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={isRemoving}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isRemoving}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isRemoving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                {t('removing')}
                            </>
                        ) : (
                            t('removeStudent')
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

RemoveStudentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    student: PropTypes.shape({
        student_id: PropTypes.string.isRequired,
        full_name: PropTypes.string.isRequired
    }),
    isRemoving: PropTypes.bool.isRequired
}

export default RemoveStudentModal
