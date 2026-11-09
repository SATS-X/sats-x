import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { Link, useLocation } from 'react-router-dom'
import { LuChevronDown, LuLogOut, LuMenu, LuX } from 'react-icons/lu'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { DASHBOARD_SIDEBAR_BOTTOM_LINKS, DASHBOARD_SIDEBAR_LINKS } from '../../lib/constants/Sidebar'
import { Avatar, BrandMark, ThemeToggle } from '../ui'
import WebSocketStatus from './WebSocketStatus'

const isLinkActive = (pathname, path) =>
    path === '/dashboard' ? pathname === '/dashboard' : pathname === path || pathname.startsWith(`${path}/`)

export default function Header() {
    const { user, logout } = useAuth()
    const { t } = useLanguage()
    const { pathname } = useLocation()
    const [isAccountOpen, setIsAccountOpen] = useState(false)
    const [isNavOpen, setIsNavOpen] = useState(false)
    const accountRef = useRef(null)

    const displayName = user?.full_name || user?.email || 'Instructor'

    useEffect(() => {
        setIsAccountOpen(false)
        setIsNavOpen(false)
    }, [pathname])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) setIsAccountOpen(false)
        }
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsAccountOpen(false)
                setIsNavOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    return (
        <header className="sticky top-0 z-30 border-b border-border backdrop-blur-xl" style={{ background: 'var(--surface-header)' }}>
            <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-5">
                <div className="flex min-w-0 items-center gap-6">
                    <Link to="/dashboard" aria-label="SATS X dashboard" className="rounded-lg">
                        <BrandMark />
                    </Link>

                    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary navigation">
                        {DASHBOARD_SIDEBAR_LINKS.map((link) => {
                            const active = isLinkActive(pathname, link.path)
                            return (
                                <Link
                                    key={link.key}
                                    to={link.path}
                                    aria-current={active ? 'page' : undefined}
                                    className={classNames(
                                        'whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                                        'inline-flex items-center gap-1.5',
                                        active ? 'bg-surface-hover font-medium text-text' : 'text-text-secondary hover:text-text'
                                    )}
                                >
                                    {link.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-present" aria-hidden="true" />}
                                    {link.label ?? t(link.labelKey)}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden xl:block">
                        <WebSocketStatus />
                    </div>
                    <div className="xl:hidden">
                        <WebSocketStatus compact />
                    </div>

                    <ThemeToggle />

                    <div className="relative" ref={accountRef}>
                        <button
                            type="button"
                            onClick={() => setIsAccountOpen((open) => !open)}
                            aria-expanded={isAccountOpen}
                            aria-haspopup="menu"
                            aria-label="Account menu"
                            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface pl-1.5 pr-2 text-xs text-text shadow-sm transition-colors hover:bg-surface-hover"
                        >
                            <Avatar name={displayName} size="sm" className="!h-6 !w-6 !rounded-md !border-0 !bg-accent/10 !text-[10px] !text-accent" />
                            <LuChevronDown className={classNames('h-3 w-3 text-text-tertiary transition-transform', isAccountOpen && 'rotate-180')} />
                        </button>

                        {isAccountOpen && (
                            <div role="menu" className="absolute right-0 z-50 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-elevated">
                                <div className="border-b border-border px-2.5 py-2.5">
                                    <p className="truncate text-xs font-medium text-text">{displayName}</p>
                                    <p className="mt-0.5 truncate font-mono text-[10px] text-text-tertiary">{user?.email}</p>
                                </div>
                                <div className="mt-1">
                                    {DASHBOARD_SIDEBAR_BOTTOM_LINKS.map(({ key, labelKey, path, icon: Icon }) => (
                                        <Link
                                            key={key}
                                            role="menuitem"
                                            to={path}
                                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
                                        >
                                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                            {t(labelKey)}
                                        </Link>
                                    ))}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={logout}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-danger transition-colors hover:bg-danger/10"
                                    >
                                        <LuLogOut className="h-3.5 w-3.5" aria-hidden="true" />
                                        {t('logout')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsNavOpen((open) => !open)}
                        aria-expanded={isNavOpen}
                        aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-text-secondary shadow-sm transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
                    >
                        {isNavOpen ? <LuX className="h-4 w-4" /> : <LuMenu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {isNavOpen && (
                <nav className="animate-fade-in border-t border-border px-5 py-3 lg:hidden" aria-label="Mobile navigation">
                    <div className="grid gap-0.5 sm:grid-cols-2">
                        {DASHBOARD_SIDEBAR_LINKS.map(({ key, label, labelKey, path, icon: Icon }) => {
                            const active = isLinkActive(pathname, path)
                            return (
                                <Link
                                    key={key}
                                    to={path}
                                    aria-current={active ? 'page' : undefined}
                                    className={classNames(
                                        'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                        active ? 'bg-surface-hover font-medium text-text' : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                                    )}
                                >
                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                    {label ?? t(labelKey)}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            )}
        </header>
    )
}
