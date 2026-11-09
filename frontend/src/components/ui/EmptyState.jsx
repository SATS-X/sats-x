import PropTypes from 'prop-types'

const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </div>
        )}
        <div className="space-y-1">
            <p className="text-sm font-medium text-text">{title}</p>
            {description && <p className="text-sm text-text-tertiary">{description}</p>}
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
