import PropTypes from 'prop-types'
import classNames from 'classnames'

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-9 w-9 border-[3px]' }

const Spinner = ({ size = 'md', className }) => (
    <div
        role="status"
        aria-label="Loading"
        className={classNames(
            'animate-spin rounded-full border-border-strong border-t-accent',
            SIZES[size],
            className
        )}
    />
)

Spinner.propTypes = { size: PropTypes.oneOf(['sm', 'md', 'lg']), className: PropTypes.string }

export default Spinner
