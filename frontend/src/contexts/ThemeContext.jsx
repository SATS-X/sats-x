import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

const ThemeContext = createContext()

const STORAGE_KEY = 'theme'

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light'

    // index.html đã đặt data-theme trước khi React mount (chặn nháy sai theme),
    // nên đọc lại đúng giá trị đó thay vì tính toán lần hai có thể lệch nhau.
    const applied = document.documentElement.dataset.theme
    if (applied === 'light' || applied === 'dark') return applied

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        try {
            localStorage.setItem(STORAGE_KEY, theme)
        } catch {
            // Chế độ duyệt riêng tư có thể chặn localStorage — không phải lỗi nghiêm trọng.
        }
    }, [theme])

    // Theo hệ thống chỉ khi người dùng chưa từng tự chọn theme trên trình duyệt này.
    useEffect(() => {
        let hasStoredChoice = false
        try {
            hasStoredChoice = localStorage.getItem(STORAGE_KEY) !== null
        } catch {
            hasStoredChoice = false
        }
        if (hasStoredChoice) return

        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light')
        media.addEventListener('change', handleChange)
        return () => media.removeEventListener('change', handleChange)
    }, [])

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
    )
}

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
