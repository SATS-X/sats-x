import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

export const Input = forwardRef(({ className, invalid, icon: Icon, ...rest }, ref) => {
    const input = (
        <input
            ref={ref}
            className={classNames('control h-10 px-3', Icon && 'pl-9', invalid && 'border-danger', className)}
            {...rest}
        />
    )

    if (!Icon) return input

    return (
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
            {input}
        </div>
    )
})
Input.displayName = 'Input'
Input.propTypes = { className: PropTypes.string, invalid: PropTypes.bool, icon: PropTypes.elementType }

export const Select = forwardRef(({ className, invalid, children, ...rest }, ref) => (
    <select
        ref={ref}
        className={classNames('control h-9 appearance-none bg-no-repeat pl-3 pr-8 text-[13px]', invalid && 'border-danger', className)}
        style={{
            backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23878ea0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
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
        className={classNames('control min-h-[6rem] px-3 py-2.5', invalid && 'border-danger', className)}
        {...rest}
    />
))
Textarea.displayName = 'Textarea'
Textarea.propTypes = { className: PropTypes.string, invalid: PropTypes.bool }
