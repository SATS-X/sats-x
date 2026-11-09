import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuSearch } from 'react-icons/lu'

const SearchInput = ({ className, ...rest }) => (
    <div className={classNames('relative', className)}>
        <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
        <input type="search" className="control h-9 pl-9 pr-3 text-[13px]" {...rest} />
    </div>
)

SearchInput.propTypes = { className: PropTypes.string }

export default SearchInput
