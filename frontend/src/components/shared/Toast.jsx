import PropTypes from 'prop-types'
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu'

const ICONS = {
    success: <LuCircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-present" aria-hidden="true" />,
    error: <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />,
    info: <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />,
    warning: <LuCircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-late" aria-hidden="true" />
}

export default function Toast({ toast, onClose }) {
    return (
        <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-md animate-fade-in items-start gap-2.5 rounded-xl border border-border bg-surface p-3.5 text-text shadow-elevated"
        >
            {ICONS[toast.type] || ICONS.info}
            <div className="min-w-0 flex-1">
                {toast.title && <div className="mb-0.5 text-[13px] font-medium text-text">{toast.title}</div>}
                <div className="break-words text-xs leading-5 text-text-secondary">{toast.message}</div>
            </div>
            <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="shrink-0 rounded-md p-0.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
                aria-label="Close"
            >
                <LuX className="h-3.5 w-3.5" />
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
