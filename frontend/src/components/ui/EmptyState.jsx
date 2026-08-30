import PropTypes from 'prop-types'

const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-card border border-border text-text-tertiary">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
        )}
        <div className="space-y-1">
            <p className="text-sm font-medium text-text">{title}</p>
            {description && <p className="text-sm text-text-secondary">{description}</p>}
        </div>
        {action}
    </div>
)

EmptyState.propTypes = {
    icon: PropTypes.elementType,
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    action: PropTypes.node
}

export default EmptyState
