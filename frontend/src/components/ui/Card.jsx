import PropTypes from 'prop-types'
import classNames from 'classnames'

const Card = ({ children, className, padded = true }) => (
    <div className={classNames('rounded-card border border-border bg-surface shadow-panel', padded && 'p-5', className)}>
        {children}
    </div>
)

Card.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    padded: PropTypes.bool
}

export const CardHeader = ({ title, description, action, className }) => (
    <div className={classNames('flex items-center justify-between gap-4 border-b border-border px-5 py-4', className)}>
        <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
        </div>
        {action}
    </div>
)

CardHeader.propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    action: PropTypes.node,
    className: PropTypes.string
}

export default Card
