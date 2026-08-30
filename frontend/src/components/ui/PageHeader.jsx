import PropTypes from 'prop-types'

/** Tiêu đề trang dùng chung — không dùng kicker/eyebrow, heading tự mang đủ trọng lượng. */
const PageHeader = ({ title, description, actions }) => (
    <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
)

PageHeader.propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    actions: PropTypes.node
}

export default PageHeader
