import PropTypes from 'prop-types'
import classNames from 'classnames'

export const Table = ({ children, className }) => (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-panel">
        <table className={classNames('w-full min-w-[720px] border-collapse text-[13px]', className)}>{children}</table>
    </div>
)
Table.propTypes = { children: PropTypes.node, className: PropTypes.string }

export const THead = ({ children }) => (
    <thead className="border-b border-border">
        <tr>{children}</tr>
    </thead>
)
THead.propTypes = { children: PropTypes.node }

export const TH = ({ children, className, ...rest }) => (
    <th
        className={classNames('whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-text-tertiary', className)}
        {...rest}
    >
        {children}
    </th>
)
TH.propTypes = { children: PropTypes.node, className: PropTypes.string }

export const TBody = ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>
TBody.propTypes = { children: PropTypes.node }

export const TR = ({ children, className, onClick }) => (
    <tr onClick={onClick} className={classNames('transition-colors hover:bg-surface-sunken/70', onClick && 'cursor-pointer', className)}>
        {children}
    </tr>
)
TR.propTypes = { children: PropTypes.node, className: PropTypes.string, onClick: PropTypes.func }

export const TD = ({ children, className, ...rest }) => (
    <td className={classNames('px-4 py-3 align-middle text-text', className)} {...rest}>
        {children}
    </td>
)
TD.propTypes = { children: PropTypes.node, className: PropTypes.string }
