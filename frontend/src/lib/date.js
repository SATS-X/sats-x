/** Ngày theo giờ máy người dùng, dạng YYYY-MM-DD như API yêu cầu. */
export const toISODate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const todayISO = () => toISODate(new Date())

export const addDays = (date, amount) => {
    const next = new Date(date)
    next.setDate(next.getDate() + amount)
    return next
}

/** Thứ Hai của tuần chứa ngày được truyền vào. */
export const startOfWeek = (date) => {
    const offset = (date.getDay() + 6) % 7
    const monday = addDays(date, -offset)
    monday.setHours(0, 0, 0, 0)
    return monday
}

/** Đọc "YYYY-MM-DD" theo giờ địa phương; new Date(chuỗi) sẽ hiểu là UTC và lệch ngày. */
export const fromISODate = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

export const formatLongDate = (value) =>
    fromISODate(value).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export const formatRelativeTime = (iso) => {
    if (!iso) return 'Never'
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export const formatShortDate = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
