import { createContext, useContext, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import Toast from '../components/shared/Toast'

const ToastContext = createContext(null)

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const addToast = useCallback((type, message, title = '', duration = 4000) => {
        const id = Date.now() + Math.random()
        const newToast = { id, type, message, title }

        setToasts((prev) => [...prev, newToast])

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [removeToast])

    const showSuccess = useCallback((message, title) => addToast('success', message, title), [addToast])
    const showError = useCallback((message, title) => addToast('error', message, title, 6000), [addToast])
    const showInfo = useCallback((message, title) => addToast('info', message, title), [addToast])
    const showWarning = useCallback((message, title) => addToast('warning', message, title), [addToast])

    const value = {
        showSuccess,
        showError,
        showInfo,
        showWarning,
        addToast,
        removeToast
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

ToastProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default ToastContext
