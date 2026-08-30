import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { HiOutlineRefresh } from 'react-icons/hi'

const VARIANTS = {
    primary: 'brand-gradient surface-glow text-white hover:brightness-105',
    secondary: 'border border-border bg-surface/80 text-text hover:border-accent/40 hover:bg-surface-hover',
    ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text',
    danger: 'border border-danger/30 bg-surface text-danger hover:bg-danger/10'
}

const SIZES = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-sm gap-2'
}

const Button = forwardRef(
    ({ variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={classNames(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-card font-medium transition-all duration-200 active:scale-[0.98]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    VARIANTS[variant],
                    SIZES[size],
                    className
                )}
                {...rest}
            >
                {loading && <HiOutlineRefresh className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'

Button.propTypes = {
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.node
}

export default Button
