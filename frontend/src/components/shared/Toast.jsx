import PropTypes from 'prop-types'
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi'

const TOAST_STYLES = {
    success: { border: 'border-l-present', icon: <HiCheckCircle className="h-5 w-5 shrink-0 text-present" /> },
    error: { border: 'border-l-danger', icon: <HiExclamationCircle className="h-5 w-5 shrink-0 text-danger" /> },
    info: { border: 'border-l-accent', icon: <HiInformationCircle className="h-5 w-5 shrink-0 text-accent" /> },
    warning: { border: 'border-l-late', icon: <HiExclamationCircle className="h-5 w-5 shrink-0 text-late" /> }
}

export default function Toast({ toast, onClose }) {
    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info

    return (
        <div
            className={`flex w-full max-w-md items-start gap-3 rounded-card border border-border border-l-[3px] ${style.border} bg-surface p-4 text-text shadow-elevated animate-fade-in pointer-events-auto`}
        >
            {style.icon}
            <div className="min-w-0 flex-1">
                {toast.title && <div className="mb-0.5 text-sm font-semibold text-text">{toast.title}</div>}
                <div className="break-words text-xs leading-relaxed text-text-secondary">{toast.message}</div>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="shrink-0 rounded-card p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
                aria-label="Close"
            >
                <HiX className="h-4 w-4" />
            </button>
        </div>
    )
}

Toast.propTypes = {
    toast: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        type: PropTypes.string,
        title: PropTypes.string,
        message: PropTypes.string.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired
}
