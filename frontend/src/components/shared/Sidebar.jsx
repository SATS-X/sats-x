import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Link, useLocation } from 'react-router-dom'
import { LuChevronsLeft, LuChevronsRight, LuLogOut, LuMenu, LuX } from 'react-icons/lu'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { DASHBOARD_SIDEBAR_BOTTOM_LINKS, NAV_GROUPS } from '../../lib/constants/Sidebar'
import { Avatar, BrandMark, ThemeToggle } from '../ui'
import WebSocketStatus from './WebSocketStatus'

const COLLAPSE_KEY = 'satsx_sidebar_collapsed'

const isLinkActive = (pathname, path) =>
    path === '/dashboard' ? pathname === '/dashboard' : pathname === path || pathname.startsWith(`${path}/`)

const readCollapsed = () => {
    try {
        return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
        return false
    }
}

/** Thanh điều hướng bên trái: thu gọn được trên desktop, thành ngăn kéo trên điện thoại. */
export default function Sidebar() {
    const { pathname } = useLocation()
    const [collapsed, setCollapsed] = useState(readCollapsed)
    const [drawerOpen, setDrawerOpen] = useState(false)

    useEffect(() => setDrawerOpen(false), [pathname])

    useEffect(() => {
        if (!drawerOpen) return undefined
        const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [drawerOpen])

    const toggleCollapsed = () => {
        setCollapsed((value) => {
            try {
                localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
            } catch {
                // Không lưu được thì lần sau mở rộng như mặc định.
            }
            return !value
        })
    }

    return (
        <>
            {/* Thanh trên cùng cho màn hình nhỏ */}
            <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-4 backdrop-blur-xl lg:hidden" style={{ background: 'var(--surface-header)' }}>
                <Link to="/dashboard" aria-label="SATS X dashboard" className="rounded-lg">
                    <BrandMark />
                </Link>
                <div className="flex items-center gap-2">
                    <WebSocketStatus compact />
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open navigation"
                        aria-expanded={drawerOpen}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-text-secondary shadow-sm hover:bg-surface-hover hover:text-text"
                    >
                        <LuMenu className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {drawerOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] animate-fade-in flex-col border-r border-border bg-surface shadow-elevated">
                        <div className="flex h-14 items-center justify-between px-4">
                            <BrandMark />
                            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="grid h-8 w-8 place-items-center rounded-lg text-text-tertiary hover:bg-surface-hover hover:text-text">
                                <LuX className="h-4 w-4" />
                            </button>
                        </div>
                        <NavContent pathname={pathname} collapsed={false} />
                    </aside>
                </div>
            )}

            {/* Desktop */}
            <aside
                className={classNames(
                    'sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-border transition-[width] duration-200 lg:flex',
                    collapsed ? 'w-[68px]' : 'w-[248px]'
                )}
                style={{ background: 'var(--surface-header)' }}
            >
                <div className={classNames('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between px-4')}>
                    <Link to="/dashboard" aria-label="SATS X dashboard" className="rounded-lg">
                        <BrandMark compact={collapsed} />
                    </Link>
                    {!collapsed && (
                        <button type="button" onClick={toggleCollapsed} aria-label="Collapse sidebar" title="Collapse sidebar" className="grid h-7 w-7 place-items-center rounded-lg text-text-tertiary hover:bg-surface-hover hover:text-text">
                            <LuChevronsLeft className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {collapsed && (
                    <button type="button" onClick={toggleCollapsed} aria-label="Expand sidebar" title="Expand sidebar" className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-lg text-text-tertiary hover:bg-surface-hover hover:text-text">
                        <LuChevronsRight className="h-4 w-4" />
                    </button>
                )}
                <NavContent pathname={pathname} collapsed={collapsed} />
            </aside>
        </>
    )
}

function NavContent({ pathname, collapsed }) {
    const { t } = useLanguage()
    const { user, logout } = useAuth()
    const displayName = user?.full_name || user?.email || 'Instructor'

    return (
        <>
            <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
                {NAV_GROUPS.map((group) => (
                    <div key={group.key} className="mt-4 first:mt-1">
                        {collapsed ? <div className="mx-2 mb-2 border-t border-border" /> : <p className="eyebrow mb-1.5 px-2.5">{group.label}</p>}
                        <ul className="space-y-0.5">
                            {group.links.map((link) => (
                                <li key={link.key}>
                                    <NavLink link={link} label={link.label ?? t(link.labelKey)} active={isLinkActive(pathname, link.path)} collapsed={collapsed} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="space-y-2 border-t border-border p-3">
                {!collapsed && (
                    <div className="flex items-center justify-between gap-2">
                        <WebSocketStatus />
                        <ThemeToggle />
                    </div>
                )}
                <ul className="space-y-0.5">
                    {DASHBOARD_SIDEBAR_BOTTOM_LINKS.map((link) => (
                        <li key={link.key}>
                            <NavLink link={link} label={t(link.labelKey)} active={isLinkActive(pathname, link.path)} collapsed={collapsed} />
                        </li>
                    ))}
                </ul>
                <div className={classNames('flex items-center gap-2.5 rounded-lg', collapsed ? 'flex-col' : 'px-1.5 py-1')}>
                    <Avatar name={displayName} size="sm" />
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-text">{displayName}</p>
                            <p className="truncate font-mono text-[10px] text-text-tertiary">{user?.role === 'admin' ? 'Administrator' : 'Instructor'}</p>
                        </div>
                    )}
                    {collapsed && <ThemeToggle />}
                    <button type="button" onClick={logout} aria-label={t('logout')} title={t('logout')} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-tertiary hover:bg-danger/10 hover:text-danger">
                        <LuLogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    )
}

NavContent.propTypes = { pathname: PropTypes.string.isRequired, collapsed: PropTypes.bool.isRequired }

function NavLink({ link, label, active, collapsed }) {
    const Icon = link.icon
    return (
        <Link
            to={link.path}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? label : undefined}
            className={classNames(
                'relative flex h-9 items-center gap-2.5 rounded-lg text-[13px] transition-colors',
                collapsed ? 'justify-center' : 'px-2.5',
                active ? 'bg-surface-hover font-medium text-text' : 'text-text-secondary hover:bg-surface-hover/70 hover:text-text'
            )}
        >
            <Icon className={classNames('h-4 w-4 shrink-0', active ? 'text-accent' : 'text-text-tertiary')} aria-hidden="true" />
            {!collapsed && <span className="truncate">{label}</span>}
            {link.live && <span className={classNames('h-1.5 w-1.5 rounded-full bg-present animate-lamp', collapsed ? 'absolute right-2 top-2' : 'ml-auto')} aria-hidden="true" />}
            {link.fullscreen && !collapsed && <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-text-tertiary">Full</span>}
        </Link>
    )
}

NavLink.propTypes = { link: PropTypes.object.isRequired, label: PropTypes.string.isRequired, active: PropTypes.bool, collapsed: PropTypes.bool }
