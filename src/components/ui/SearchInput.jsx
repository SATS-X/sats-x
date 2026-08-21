import PropTypes from 'prop-types'
import classNames from 'classnames'
import { HiOutlineSearch } from 'react-icons/hi'

const SearchInput = ({ className, ...rest }) => (
    <div className={classNames('relative', className)}>
        <HiOutlineSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
        />
        <input
            type="search"
            className="h-9 w-full rounded-card border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-tertiary transition-colors hover:border-border-strong"
            {...rest}
        />
    </div>
)

SearchInput.propTypes = { className: PropTypes.string }

export default SearchInput
