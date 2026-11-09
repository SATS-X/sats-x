import PropTypes from 'prop-types'
import classNames from 'classnames'

/** Bộ chọn dạng đoạn: dùng cho lọc theo ngày, theo bộ sưu tập, và chế độ đăng nhập. */
const Segmented = ({ options, value, onChange, label, className, fill = false }) => (
    <div role="group" aria-label={label} className={classNames('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border bg-surface p-1 [scrollbar-width:none]', fill && 'flex w-full', className)}>
        {options.map((option) => {
            const isActive = option.value === value
            return (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChange(option.value)}
                    className={classNames(
                        'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                        fill && 'flex-1',
                        isActive ? 'bg-text text-bg' : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                    )}
                >
                    {option.label}
                </button>
            )
        })}
    </div>
)

Segmented.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.node.isRequired })).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    className: PropTypes.string,
    fill: PropTypes.bool
}

export default Segmented
