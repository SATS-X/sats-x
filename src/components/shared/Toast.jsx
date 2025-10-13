import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi'

const Toast = ({ type = 'info', message, title, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bgColor: 'bg-white',
                    borderColor: 'border-l-green-500',
                    iconColor: 'text-green-500',
                    icon: HiOutlineCheckCircle,
                    titleColor: 'text-green-800',
                    messageColor: 'text-green-700',
                    progressBg: 'bg-green-500'
                }
            case 'error':
                return {
                    bgColor: 'bg-white',
                    borderColor: 'border-l-red-500',
                    iconColor: 'text-red-500',
                    icon: HiOutlineXCircle,
                    titleColor: 'text-red-800',
                    messageColor: 'text-red-700',
                    progressBg: 'bg-red-500'
                }
            case 'warning':
                return {
                    bgColor: 'bg-white',
                    borderColor: 'border-l-amber-500',
                    iconColor: 'text-amber-500',
                    icon: HiOutlineExclamationCircle,
                    titleColor: 'text-amber-800',
                    messageColor: 'text-amber-700',
                    progressBg: 'bg-amber-500'
                }
            case 'info':
            default:
                return {
                    bgColor: 'bg-white',
                    borderColor: 'border-l-blue-500',
                    iconColor: 'text-blue-500',
                    icon: HiOutlineInformationCircle,
                    titleColor: 'text-blue-800',
                    messageColor: 'text-blue-700',
                    progressBg: 'bg-blue-500'
                }
        }
    }

    const styles = getToastStyles()
    const IconComponent = styles.icon

    return (
        <div 
            className="animate-slide-down transition-all duration-300 ease-in-out pointer-events-auto"
            role="alert"
        >
            <div className={`${styles.bgColor} ${styles.borderColor} border-l-4 rounded-lg shadow-2xl hover:shadow-3xl transition-shadow overflow-hidden min-w-[320px] max-w-md`}>
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <IconComponent className={`h-6 w-6 ${styles.iconColor}`} />
                        </div>
                        <div className="ml-3 flex-1">
                            {title && (
                                <h3 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
                                    {title}
                                </h3>
                            )}
                            <p className={`text-sm ${styles.messageColor}`}>
                                {message}
                            </p>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close"
                            >
                                <HiOutlineX className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Progress bar */}
                {duration && (
                    <div className="h-1 bg-gray-200">
                        <div 
                            className={`h-full ${styles.progressBg} animate-progress`}
                            style={{ animationDuration: `${duration}ms` }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    )
}

Toast.propTypes = {
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    message: PropTypes.string.isRequired,
    title: PropTypes.string,
    onClose: PropTypes.func,
    duration: PropTypes.number
}

export default Toast

