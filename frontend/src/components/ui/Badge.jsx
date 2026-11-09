import PropTypes from 'prop-types'
import classNames from 'classnames'

/** Nhãn trung tính cho số đếm/tag — không mang nghĩa trạng thái như StatusChip. */
const Badge = ({ children, className }) => (
    <span
        className={classNames(
            'inline-flex items-center rounded-md border border-border bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-text-secondary',
            className
        )}
    >
        {children}
    </span>
)

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
}

export default Badge
