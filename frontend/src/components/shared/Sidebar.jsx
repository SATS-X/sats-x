import classNames from 'classnames'
import PropTypes from 'prop-types'
import { Link, useLocation } from 'react-router-dom'
import { HiOutlineLogout, HiX } from 'react-icons/hi'
import { DASHBOARD_SIDEBAR_LINKS, DASHBOARD_SIDEBAR_BOTTOM_LINKS } from '../../lib/constants/Sidebar'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar, BrandMark } from '../ui'
import WebSocketStatus from './WebSocketStatus'

export default function Sidebar({ onClose }) {
    const { t } = useLanguage()
    const { user, logout } = useAuth()

    return (
        <aside className="flex h-full w-72 flex-col justify-between border-r border-border bg-surface/95 p-4 backdrop-blur-xl">
            <div className="min-h-0">
                <div className="mb-4 flex items-center justify-between px-1 py-2">
                    <BrandMark />
                    {onClose && (
                        <button
                            onClick={onClose}
                            aria-label="Close menu"
                            className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
                        >
                            <HiX className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="mb-4 px-1">
                    <WebSocketStatus compact />
                </div>

                <nav className="flex max-h-[calc(100vh-280px)] flex-col gap-0.5 overflow-y-auto pr-1">
                    {DASHBOARD_SIDEBAR_LINKS.map((link) => (
                        <SidebarLink key={link.key} link={link} onClose={onClose} />
                    ))}
                </nav>
            </div>

            <div className="flex flex-col gap-0.5 border-t border-border pt-3">
                {DASHBOARD_SIDEBAR_BOTTOM_LINKS.map((link) => (
                    <SidebarLink key={link.key} link={link} onClose={onClose} />
                ))}

                <div className="mt-2 flex items-center gap-2.5 rounded-card border border-border bg-surface-sunken px-2.5 py-2">
                    <Avatar name={user?.full_name || user?.email} size="sm" />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-text">{user?.full_name || user?.email || 'User'}</div>
                        <div className="truncate text-[11px] capitalize text-text-tertiary">{user?.role || 'Instructor'}</div>
                    </div>
                    <button
                        onClick={logout}
                        title={t('logout')}
                        className="shrink-0 rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                        <HiOutlineLogout className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    )
}

function SidebarLink({ link, onClose }) {
    const { pathname } = useLocation()
    const { t } = useLanguage()
    const isActive = pathname === link.path || (link.path !== '/dashboard' && pathname.startsWith(link.path))

    return (
        <Link
            to={link.path}
            onClick={onClose}
            className={classNames(
                'flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                isActive
                    ? 'brand-gradient surface-glow text-white'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text'
            )}
        >
            <span className="text-lg leading-none">{link.icon}</span>
            <span className="truncate">{t(link.labelKey)}</span>
        </Link>
    )
}

Sidebar.propTypes = {
    onClose: PropTypes.func
}

SidebarLink.propTypes = {
    link: PropTypes.shape({
        key: PropTypes.string.isRequired,
        labelKey: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        icon: PropTypes.node.isRequired
    }).isRequired,
    onClose: PropTypes.func
}
