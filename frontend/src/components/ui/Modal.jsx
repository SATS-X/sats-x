import PropTypes from 'prop-types'
import ReactModal from 'react-modal'
import { HiOutlineX } from 'react-icons/hi'

/**
 * Modal dùng chung cho toàn hệ thống — bọc react-modal (focus trap, khoá cuộn nền,
 * ESC để đóng có sẵn) và style theo token hiện có. Chỉ dùng cho tác vụ thật sự cần
 * gián đoạn (xác nhận xoá, form thêm mới) — không dùng cho nội dung có thể hiện inline.
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
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        className={`w-full ${SIZES[size]} rounded-card border border-border bg-surface shadow-elevated outline-none`}
        closeTimeoutMS={0}
    >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
                <h2 className="text-base font-semibold text-text">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-card text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
            >
                <HiOutlineX className="h-4 w-4" />
            </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
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
