import PropTypes from 'prop-types'
import classNames from 'classnames'

// Mượn từ dải màu cạnh thẻ ra-vào: trạng thái sống trong một dải hẹp ở cạnh trái,
// không phải toàn bộ chip đổi màu. Đây là điểm nhận diện xuyên suốt hệ thống.
const VARIANTS = {
    present: 'border-present text-present',
    late: 'border-late text-late',
    absent: 'border-absent text-absent',
    active: 'border-accent text-accent',
    neutral: 'border-text-tertiary text-text-secondary'
}

const StatusChip = ({ variant = 'neutral', children, className }) => {
    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1.5 rounded-chip border-l-[3px] bg-surface-hover py-1 pl-2 pr-2.5 text-xs font-medium leading-none',
                VARIANTS[variant],
                className
            )}
        >
            {children}
        </span>
    )
}

StatusChip.propTypes = {
    variant: PropTypes.oneOf(['present', 'late', 'absent', 'active', 'neutral']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string
}

export default StatusChip
