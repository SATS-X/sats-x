import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuLoaderCircle } from 'react-icons/lu'

const VARIANTS = {
    primary: 'bg-text text-bg shadow-sm hover:bg-text/90',
    secondary: 'border border-border bg-surface text-text-secondary shadow-sm hover:border-border-strong hover:bg-surface-hover hover:text-text',
    ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20'
}

const SIZES = {
    sm: 'h-8 rounded-lg px-3 text-xs gap-1.5',
    md: 'h-9 rounded-lg px-3.5 text-sm gap-2',
    lg: 'h-11 rounded-xl px-5 text-[13px] font-semibold gap-2'
}

/** `as` cho phép render thành Link mà không lồng <button> trong <a>. */
const Button = forwardRef(
    ({ as: Component = 'button', variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest }, ref) => {
        const nativeProps = Component === 'button' ? { disabled: disabled || loading } : {}

        return (
            <Component
                ref={ref}
                className={classNames(
                    'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:translate-y-px',
                    'disabled:pointer-events-none disabled:opacity-50',
                    VARIANTS[variant],
                    SIZES[size],
                    className
                )}
                {...nativeProps}
                {...rest}
            >
                {loading && <LuLoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {children}
            </Component>
        )
    }
)

Button.displayName = 'Button'

Button.propTypes = {
    as: PropTypes.elementType,
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node
}

export default Button
