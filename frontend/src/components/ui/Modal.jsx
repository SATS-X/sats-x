import PropTypes from 'prop-types'
import ReactModal from 'react-modal'
import { LuX } from 'react-icons/lu'

/**
 * Modal dùng chung — bọc react-modal (focus trap, khoá cuộn nền, ESC để đóng).
 * Chỉ dùng cho tác vụ thật sự cần gián đoạn: xác nhận xoá, form thêm mới.
 */
const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
}

const Modal = ({ isOpen, onClose, title, description, size = 'md', children, footer }) => (
    <ReactModal
        isOpen={isOpen}
        onRequestClose={onClose}
        ariaHideApp={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        className={`w-full ${SIZES[size]} animate-fade-in overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated outline-none`}
        closeTimeoutMS={0}
    >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
                <h2 className="text-base font-semibold tracking-[-0.02em] text-text">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
            >
                <LuX className="h-4 w-4" />
            </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-sunken/60 px-5 py-3.5">{footer}</div>}
    </ReactModal>
)

Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    children: PropTypes.node,
    footer: PropTypes.node
}

export default Modal
