import PropTypes from 'prop-types'
import classNames from 'classnames'

/** Container mặt phẳng dùng cho panel/bảng — không dùng để dựng dàn ý trang bằng lưới ô đều nhau. */
const Card = ({ children, className, padded = true }) => (
    <div className={classNames('rounded-card border border-border bg-surface', padded && 'p-5', className)}>
        {children}
    </div>
)

Card.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    padded: PropTypes.bool
}

export default Card
