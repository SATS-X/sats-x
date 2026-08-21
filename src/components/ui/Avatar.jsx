import { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const SIZES = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-full w-full text-2xl'
}

function initialsOf(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    const last = parts[parts.length - 1]?.[0] ?? ''
    const first = parts.length > 1 ? parts[0][0] : ''
    return (first + last).toUpperCase() || name[0]?.toUpperCase() || '?'
}

/**
 * Khung ảnh vuông, bo góc kiểu thẻ (không phải avatar tròn) — mượn từ thẻ định danh
 * thật: một khung cố định, có ảnh thì hiện ảnh, chưa có (hoặc ảnh lỗi 404) thì hiện
 * chữ cái đầu — không bao giờ rơi về avatar hoạt hình giả.
 */
const Avatar = ({ src, name, size = 'md', className }) => {
    const [failed, setFailed] = useState(false)
    const showImage = src && !failed

    return (
        <div
            className={classNames(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-card border border-border bg-surface-hover font-medium text-text-secondary',
                SIZES[size],
                className
            )}
        >
            {showImage ? (
                <img src={src} alt={name || ''} className="h-full w-full object-cover" loading="lazy" onError={() => setFailed(true)} />
            ) : (
                <span aria-hidden="true">{initialsOf(name)}</span>
            )}
        </div>
    )
}

Avatar.propTypes = {
    src: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    className: PropTypes.string
}

export default Avatar
