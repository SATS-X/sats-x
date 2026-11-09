import PropTypes from 'prop-types'

const PageHeader = ({ eyebrow, title, description, actions }) => (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] text-text">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-sm text-text-tertiary">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div>}
    </div>
)

PageHeader.propTypes = {
    eyebrow: PropTypes.node,
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    actions: PropTypes.node
}

export default PageHeader
