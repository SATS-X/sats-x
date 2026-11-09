import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuCheck } from 'react-icons/lu'

/** Danh sách chọn nhiều, dùng để gán lớp cho môn học hoặc cho sinh viên. */
const CheckList = ({ options, selected, onChange, emptyLabel, disabled }) => {
    const toggle = (value) => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])

    if (options.length === 0) {
        return <p className="rounded-[10px] border border-border bg-input px-3 py-2.5 text-xs text-text-tertiary">{emptyLabel}</p>
    }

    return (
        <div className="max-h-44 divide-y divide-border overflow-y-auto rounded-[10px] border border-border bg-input">
            {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        disabled={disabled}
                        onClick={() => toggle(option.value)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-hover disabled:opacity-60"
                    >
                        <span
                            className={classNames(
                                'grid h-4 w-4 shrink-0 place-items-center rounded border',
                                isSelected ? 'border-text bg-text text-bg' : 'border-border-strong bg-surface'
                            )}
                        >
                            {isSelected && <LuCheck className="h-3 w-3" aria-hidden="true" />}
                        </span>
                        <span className="font-data text-xs font-medium text-text">{option.value}</span>
                        <span className="truncate text-xs text-text-tertiary">{option.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

CheckList.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.node })).isRequired,
    selected: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
    emptyLabel: PropTypes.node,
    disabled: PropTypes.bool
}

export default CheckList
