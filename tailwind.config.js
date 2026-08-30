/** @type {import('tailwindcss').Config} */
export default {
    // Theme chuyển bằng data-theme="dark" trên <html> (đặt trong index.html trước khi
    // React mount, để tránh nháy sai theme ở lần vẽ đầu tiên).
    darkMode: ['selector', '[data-theme="dark"]'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
            },
            colors: {
                bg: 'rgb(var(--color-bg) / <alpha-value>)',
                surface: 'rgb(var(--color-surface) / <alpha-value>)',
                'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
                'surface-sunken': 'rgb(var(--color-surface-sunken) / <alpha-value>)',
                border: 'rgb(var(--color-border) / <alpha-value>)',
                'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',
                text: 'rgb(var(--color-text) / <alpha-value>)',
                'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
                'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
                'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
                'brand-end': 'rgb(var(--color-brand-end) / <alpha-value>)',
                present: 'rgb(var(--color-present) / <alpha-value>)',
                late: 'rgb(var(--color-late) / <alpha-value>)',
                absent: 'rgb(var(--color-absent) / <alpha-value>)',
                danger: 'rgb(var(--color-danger) / <alpha-value>)'
            },
            borderRadius: {
                card: '0.875rem',
                chip: '0.5rem'
            },
            boxShadow: {
                elevated: 'var(--shadow-elevated)' /* chỉ dùng cho dropdown/modal nổi trên nội dung */
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(4px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                }
            },
            animation: {
                'fade-in': 'fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }
        }
    },
    plugins: []
};
