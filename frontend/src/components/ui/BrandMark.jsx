import PropTypes from 'prop-types'
import classNames from 'classnames'

export default function BrandMark({ compact = false, className }) {
    return (
        <span className={classNames('inline-flex items-center gap-2.5', className)} aria-label="SATS X">
            <span className="brand-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-[-0.06em] text-white dark:text-[#15151a]">
                SX
            </span>
            {!compact && <span className="text-[15px] font-semibold tracking-[-0.02em] text-text">SATS X</span>}
        </span>
    )
}

BrandMark.propTypes = {
    compact: PropTypes.bool,
    className: PropTypes.string
}
