import { createContext, useContext, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import Toast from '../components/shared/Toast'

const ToastContext = createContext()

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { ...toast, id }])
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const showToast = useCallback(({ type = 'info', message, title, duration = 5000, position = 'top-right' }) => {
        return addToast({ type, message, title, duration, position })
    }, [addToast])

    const showSuccess = useCallback((message, title, duration) => {
        return showToast({ type: 'success', message, title, duration })
    }, [showToast])

    const showError = useCallback((message, title, duration) => {
        return showToast({ type: 'error', message, title, duration })
    }, [showToast])

    const showWarning = useCallback((message, title, duration) => {
        return showToast({ type: 'warning', message, title, duration })
    }, [showToast])

    const showInfo = useCallback((message, title, duration) => {
        return showToast({ type: 'info', message, title, duration })
    }, [showToast])

    return (
        <ToastContext.Provider
            value={{
                showToast,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                removeToast
            }}
        >
            {children}
            {/* Render all toasts stacked */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        message={toast.message}
                        title={toast.title}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

ToastProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default ToastContext

