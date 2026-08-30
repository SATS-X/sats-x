import PropTypes from 'prop-types'
import classNames from 'classnames'

export default function BrandMark({ compact = false, className }) {
    return (
        <div className={classNames('flex items-center gap-3', className)} aria-label="SATS X">
            <span className="brand-gradient surface-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-xs font-bold tracking-[-0.08em] text-white">
                SX
            </span>
            {!compact && (
                <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-none tracking-tight text-text">SATS X</span>
                    <span className="mt-1 block text-[11px] text-text-tertiary">Intelligent attendance</span>
                </span>
            )}
        </div>
    )
}

BrandMark.propTypes = {
    compact: PropTypes.bool,
    className: PropTypes.string
}
