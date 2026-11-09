/** @type {import('tailwindcss').Config} */
export default {
    // Theme chuyển bằng data-theme="dark" trên <html> (đặt trong index.html trước khi
    // React mount, để tránh nháy sai theme ở lần vẽ đầu tiên).
    darkMode: ['selector', '[data-theme="dark"]'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Geist"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
            },
            colors: {
                bg: 'rgb(var(--color-bg) / <alpha-value>)',
                surface: 'rgb(var(--color-surface) / <alpha-value>)',
                'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
                'surface-sunken': 'rgb(var(--color-surface-sunken) / <alpha-value>)',
                input: 'rgb(var(--color-input) / <alpha-value>)',
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
                card: '0.75rem',
                chip: '0.5rem'
            },
            boxShadow: {
                panel: 'var(--shadow-panel)',
                elevated: 'var(--shadow-elevated)'
            },
            keyframes: {
                'fade-in': {
                    '0%': { transform: 'translateY(4px)' },
                    '100%': { transform: 'translateY(0)' }
                },
                stamp: {
                    '0%': { transform: 'scale(1.5) rotate(-11deg)' },
                    '100%': { transform: 'scale(1) rotate(-3deg)' }
                },
                'row-arrive': {
                    '0%': { backgroundColor: 'rgb(var(--color-accent) / 0.22)' },
                    '100%': { backgroundColor: 'transparent' }
                },
                lamp: {
                    '0%': { boxShadow: '0 0 0 0 rgb(var(--color-present) / 0.45)' },
                    '100%': { boxShadow: '0 0 0 7px rgb(var(--color-present) / 0)' }
                }
            },
            animation: {
                'fade-in': 'fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                stamp: 'stamp 0.28s cubic-bezier(0.2, 0.9, 0.25, 1)',
                'row-arrive': 'row-arrive 2.4s ease-out',
                lamp: 'lamp 2s ease-out infinite'
            }
        }
    },
    plugins: []
};
