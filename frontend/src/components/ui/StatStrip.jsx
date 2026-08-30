import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Dải số liệu tổng quan trong MỘT khối liền, ngăn bằng đường kẻ dọc — cố tình không
 * phải lưới nhiều thẻ rời rạc cùng kích thước (mẫu "hero-metric card" bị cấm ở craft floor).
 */
const StatStrip = ({ items }) => (
    <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface sm:flex-row sm:divide-x sm:divide-y-0">
        {items.map((item) => (
            <div key={item.label} className="flex-1 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{item.label}</p>
                <p
                    className={classNames(
                        'mt-1.5 font-data text-2xl font-semibold',
                        item.tone === 'present' && 'text-present',
                        item.tone === 'late' && 'text-late',
                        item.tone === 'absent' && 'text-absent',
                        !item.tone && 'text-text'
                    )}
                >
                    {item.value}
                </p>
            </div>
        ))}
    </div>
)

StatStrip.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.node.isRequired,
            tone: PropTypes.oneOf(['present', 'late', 'absent'])
        })
    ).isRequired
}

export default StatStrip
