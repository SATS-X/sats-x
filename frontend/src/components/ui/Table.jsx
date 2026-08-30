import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Bảng dữ liệu dùng chung. Hàng đóng vai trò "thẻ" — không zebra-stripe, ranh giới
 * là hairline, hover là surface-hover, giữ đúng ngôn ngữ thẻ định danh xuyên suốt app.
 */
export const Table = ({ children, className }) => (
    <div className="overflow-x-auto rounded-card border border-border">
        <table className={classNames('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
)
Table.propTypes = { children: PropTypes.node, className: PropTypes.string }

export const THead = ({ children }) => (
    <thead className="border-b border-border bg-surface-sunken">
        <tr>{children}</tr>
    </thead>
)
THead.propTypes = { children: PropTypes.node }

export const TH = ({ children, className, ...rest }) => (
    <th
        className={classNames(
            'whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-tertiary',
            className
        )}
        {...rest}
    >
        {children}
    </th>
)
TH.propTypes = { children: PropTypes.node, className: PropTypes.string }

export const TBody = ({ children }) => <tbody className="divide-y divide-border bg-surface">{children}</tbody>
TBody.propTypes = { children: PropTypes.node }

export const TR = ({ children, className, onClick }) => (
    <tr
        onClick={onClick}
        className={classNames('transition-colors', onClick && 'cursor-pointer hover:bg-surface-hover', className)}
    >
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
