import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { HiMenuAlt2, HiOutlineUser, HiOutlineLogout, HiOutlineCog, HiOutlineTranslate } from 'react-icons/hi'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { Avatar, ThemeToggle } from '../ui'
import WebSocketStatus from './WebSocketStatus'

export default function Header({ onOpenMobileMenu }) {
    const { user, logout } = useAuth()
    const { language, setLanguage, t } = useLanguage()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenMobileMenu}
                    className="rounded-card p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
                    aria-label="Mở menu"
                >
                    <HiMenuAlt2 className="h-6 w-6" />
                </button>
                <span className="font-data hidden text-xs text-text-tertiary sm:inline">Năm học 2024-2025</span>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden md:block">
                    <WebSocketStatus />
                </div>

                <ThemeToggle />

                <button
                    onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                    title="Đổi ngôn ngữ"
                    className="flex h-9 items-center gap-1.5 rounded-card px-2.5 text-xs font-semibold uppercase text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
                >
                    <HiOutlineTranslate className="h-4 w-4" />
                    {language === 'vi' ? 'VI' : 'EN'}
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen((v) => !v)}
                        className="flex items-center gap-2 rounded-card p-1 transition-colors hover:bg-surface-hover"
                    >
                        <Avatar name={user?.full_name || user?.email} size="sm" />
                        <span className="hidden text-xs font-medium text-text md:inline">{user?.full_name || user?.email}</span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-56 animate-fade-in rounded-card border border-border bg-surface py-1 shadow-elevated">
                            <div className="border-b border-border px-4 py-3">
                                <div className="truncate text-xs font-semibold text-text">{user?.full_name || 'Giảng viên'}</div>
                                <div className="truncate text-[11px] text-text-tertiary">{user?.email}</div>
                            </div>

                            <Link
                                to="/dashboard/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
                            >
                                <HiOutlineUser className="h-4 w-4 text-text-tertiary" />
                                {t('profile')}
                            </Link>

                            <Link
                                to="/settings"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
                            >
                                <HiOutlineCog className="h-4 w-4 text-text-tertiary" />
                                {t('settings')}
                            </Link>

                            <div className="my-1 border-t border-border" />

                            <button
                                onClick={() => {
                                    setIsMenuOpen(false)
                                    logout()
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-danger transition-colors hover:bg-danger/10"
                            >
                                <HiOutlineLogout className="h-4 w-4" />
                                {t('logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

Header.propTypes = {
    onOpenMobileMenu: PropTypes.func
}
