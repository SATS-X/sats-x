import { LuMoon, LuSun } from 'react-icons/lu'
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
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-text-secondary shadow-sm transition-colors hover:bg-surface-hover hover:text-text"
        >
            {isDark ? <LuSun className="h-4 w-4" /> : <LuMoon className="h-4 w-4" />}
        </button>
    )
}

export default ThemeToggle
