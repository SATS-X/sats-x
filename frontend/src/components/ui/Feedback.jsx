import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuLoaderCircle } from 'react-icons/lu'

export const LoadingState = ({ label }) => (
    <div role="status" className="flex items-center gap-2 py-8 text-sm text-text-tertiary">
        <LuLoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
    </div>
)
LoadingState.propTypes = { label: PropTypes.node.isRequired }

export const Notice = ({ tone = 'danger', children, className }) => (
    <div
        role={tone === 'danger' ? 'alert' : 'status'}
        className={classNames(
            'rounded-lg border px-3 py-2.5 text-xs leading-5',
            tone === 'danger' ? 'border-danger/20 bg-danger/[0.07] text-danger' : 'border-present/20 bg-present/[0.07] text-present',
            className
        )}
    >
        {children}
    </div>
)
Notice.propTypes = { tone: PropTypes.oneOf(['danger', 'success']), children: PropTypes.node, className: PropTypes.string }

export const IconButton = ({ icon: Icon, label, tone = 'default', className, ...rest }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        className={classNames(
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-tertiary transition-colors disabled:opacity-50',
            tone === 'danger' ? 'hover:bg-danger/10 hover:text-danger' : 'hover:bg-surface-hover hover:text-text',
            className
        )}
        {...rest}
    >
        <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
)
IconButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['default', 'danger']),
    className: PropTypes.string
}
