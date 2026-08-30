import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light theme' : 'Dark theme'}
            className="flex h-9 w-9 items-center justify-center rounded-card text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
        >
            {isDark ? <HiOutlineSun className="h-[18px] w-[18px]" /> : <HiOutlineMoon className="h-[18px] w-[18px]" />}
        </button>
    )
}

export default ThemeToggle
