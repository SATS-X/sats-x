import PropTypes from 'prop-types'
import classNames from 'classnames'

const VALUE_TONE = { present: 'text-present', late: 'text-late', absent: 'text-absent' }

const StatStrip = ({ items }) => (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, detail, tone, icon: Icon }) => (
            <div key={label} className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-panel">
                <div className="min-w-0">
                    <p className="text-xs text-text-tertiary">{label}</p>
                    <p className={classNames('font-data mt-1.5 truncate text-xl font-semibold tracking-[-0.03em]', VALUE_TONE[tone] || 'text-text')}>
                        {value}
                    </p>
                    {detail && <p className="mt-1 text-[11px] text-text-tertiary">{detail}</p>}
                </div>
                {Icon && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                )}
            </div>
        ))}
    </section>
)

StatStrip.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.node.isRequired,
            detail: PropTypes.node,
            tone: PropTypes.oneOf(['present', 'late', 'absent']),
            icon: PropTypes.elementType
        })
    ).isRequired
}

export default StatStrip
