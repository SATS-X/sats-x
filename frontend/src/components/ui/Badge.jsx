import PropTypes from 'prop-types'
import classNames from 'classnames'

/** Nhãn trung tính cho số đếm/tag — khác StatusChip: không có dải cạnh, không mang nghĩa trạng thái. */
const Badge = ({ children, className }) => (
    <span
        className={classNames(
            'inline-flex items-center rounded-chip bg-surface-hover px-2 py-0.5 text-xs font-medium text-text-secondary',
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
