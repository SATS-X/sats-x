import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const baseClass =
    'h-9 w-full rounded-card border border-border bg-surface px-3 text-sm text-text placeholder:text-text-tertiary transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50'

export const Input = forwardRef(({ className, invalid, ...rest }, ref) => (
    <input
        ref={ref}
        className={classNames(baseClass, invalid && 'border-danger', className)}
        {...rest}
    />
))
Input.displayName = 'Input'
Input.propTypes = { className: PropTypes.string, invalid: PropTypes.bool }

export const Select = forwardRef(({ className, invalid, children, ...rest }, ref) => (
    <select
        ref={ref}
        className={classNames(baseClass, 'appearance-none bg-no-repeat pr-8', invalid && 'border-danger', className)}
        style={{
            backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '16px'
        }}
        {...rest}
    >
        {children}
    </select>
))
Select.displayName = 'Select'
Select.propTypes = { className: PropTypes.string, invalid: PropTypes.bool, children: PropTypes.node }

export const Textarea = forwardRef(({ className, invalid, ...rest }, ref) => (
    <textarea
        ref={ref}
        className={classNames(baseClass, 'h-auto min-h-[6rem] py-2', invalid && 'border-danger', className)}
        {...rest}
    />
))
Textarea.displayName = 'Textarea'
Textarea.propTypes = { className: PropTypes.string, invalid: PropTypes.bool }
