import PropTypes from 'prop-types'

/** Một thanh chia ba đoạn, mỗi đoạn tương ứng một trạng thái điểm danh. */
export default function SessionProgress({ onTime, late, absent, expected, className }) {
    const percent = (value) => (expected > 0 ? `${(value / expected) * 100}%` : '0%')

    return (
        <div
            role="img"
            aria-label={`${onTime} on time, ${late} late, ${absent} absent, ${expected} expected`}
            className={`flex h-1.5 overflow-hidden rounded-full bg-text/10 ${className ?? ''}`}
        >
            <span className="h-full bg-present transition-[width] duration-500" style={{ width: percent(onTime) }} />
            <span className="h-full bg-late transition-[width] duration-500" style={{ width: percent(late) }} />
            <span className="h-full bg-absent transition-[width] duration-500" style={{ width: percent(absent) }} />
        </div>
    )
}

SessionProgress.propTypes = {
    onTime: PropTypes.number.isRequired,
    late: PropTypes.number.isRequired,
    absent: PropTypes.number.isRequired,
    expected: PropTypes.number.isRequired,
    className: PropTypes.string
}
