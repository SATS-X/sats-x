import PropTypes from 'prop-types'
import classNames from 'classnames'

const VARIANTS = {
    present: { chip: 'border-present/25 bg-present/[0.08] text-present', dot: 'bg-present' },
    late: { chip: 'border-late/25 bg-late/[0.08] text-late', dot: 'bg-late' },
    absent: { chip: 'border-absent/25 bg-absent/[0.08] text-absent', dot: 'bg-absent' },
    active: { chip: 'border-accent/25 bg-accent/[0.08] text-accent', dot: 'bg-accent' },
    neutral: { chip: 'border-border bg-surface-sunken text-text-secondary', dot: 'bg-text-tertiary' }
}

const StatusChip = ({ variant = 'neutral', children, className }) => {
    const styles = VARIANTS[variant]

    return (
        <span className={classNames('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', styles.chip, className)}>
            <span className={classNames('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} aria-hidden="true" />
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
