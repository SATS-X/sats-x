import PropTypes from 'prop-types'
import classNames from 'classnames'

/** Bọc label + control + thông báo lỗi, dùng chung cho mọi form trong hệ thống. */
const Field = ({ label, htmlFor, error, hint, required, className, children }) => (
    <div className={classNames('flex flex-col gap-2', className)}>
        {label && (
            <label htmlFor={htmlFor} className="field-label">
                {label}
                {required && <span className="text-danger"> *</span>}
            </label>
        )}
        {children}
        {error ? <p className="text-xs text-danger">{error}</p> : hint && <p className="text-xs text-text-tertiary">{hint}</p>}
    </div>
)

Field.propTypes = {
    label: PropTypes.node,
    htmlFor: PropTypes.string,
    error: PropTypes.node,
    hint: PropTypes.node,
    required: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node.isRequired
}

export default Field
