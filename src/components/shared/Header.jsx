import { Fragment } from 'react'
import {
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
    Popover,
    PopoverButton,
    PopoverPanel,
    Transition
} from '@headlessui/react'
import { HiOutlineBell, HiOutlineSearch, HiOutlineChatAlt, HiOutlineUser, HiOutlineMenu } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { Authenticator } from '@aws-amplify/ui-react'
import useUserAttributes from '../../hooks/useUserAttributes'
import { useLanguage } from '../../contexts/LanguageContext'
import PropTypes from 'prop-types'

export default function Header({ onMenuClick }) {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const userAttributes = useUserAttributes()

    
    return (
        <div className="bg-white h-16 px-4 sm:px-6 flex items-center border-b border-slate-200 justify-between shadow-sm">
            {/* Left section with menu button and search */}
            <div className="flex items-center gap-4 flex-1">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                >
                    <HiOutlineMenu fontSize={24} />
                </button>

                {/* Search bar */}
                <div className="relative flex-1 max-w-md">
                    <div className="relative">
                        <HiOutlineSearch fontSize={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('search') + '...'}
                            className="w-full bg-slate-50 pl-10 pr-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white rounded-lg transition-all duration-200 border border-slate-200 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>
            
            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Welcome message - hidden on small screens */}
                <div className="hidden md:flex items-center gap-2">
                    <div className="text-sm text-slate-600">
                        <span className="font-medium">{t('hello')},</span>
                        <span className="ml-1 text-indigo-600 font-semibold">
                            {userAttributes?.preferred_username || t('teacher')}
                        </span>
                    </div>
                </div>
                
                {/* Messages popover */}
                <Popover className="relative">
                    {({ open }) => (
                        <>
                            <PopoverButton
                                className={classNames(
                                    open && 'bg-indigo-50 text-indigo-600',
                                    'group inline-flex items-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-all duration-200'
                                )}
                            >
                                <HiOutlineChatAlt fontSize={20} />
                            </PopoverButton>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 translate-y-1"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 translate-y-1"
                            >
                                <PopoverPanel className="absolute right-0 z-10 mt-2.5 transform w-80 max-w-[90vw]">
                                    <div className="bg-white rounded-lg shadow-lg ring-1 ring-slate-200 px-2 py-2.5">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <strong className="text-sm font-semibold text-slate-800">{t('messages')}</strong>
                                        </div>
                                        <div className="mt-2 px-4 py-2 text-sm">
                                            <a
                                                className="flex flex-col gap-2.5 border-t border-slate-100 px-4.5 py-3 hover:bg-slate-50 rounded-lg transition-colors duration-200"
                                                href="/"
                                            >
                                                <p className="text-sm">
                                                    <span className="text-slate-800 font-medium">
                                                        Thông báo điểm danh
                                                    </span>
                                                    <span className="block text-slate-600 mt-1">
                                                        Lớp 10A1 đã hoàn thành điểm danh sáng nay.
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-500">Hôm nay, 08:30</p>
                                            </a>
                                        </div>
                                    </div>
                                </PopoverPanel>
                            </Transition>
                        </>
                    )}
                </Popover>
                
                {/* Notifications popover */}
                <Popover className="relative">
                    {({ open }) => (
                        <>
                            <PopoverButton
                                className={classNames(
                                    open && 'bg-indigo-50 text-indigo-600',
                                    'group inline-flex items-center rounded-lg p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-all duration-200 relative'
                                )}
                            >
                                <HiOutlineBell fontSize={20} />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    3
                                </span>
                            </PopoverButton>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 translate-y-1"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 translate-y-1"
                            >
                                <PopoverPanel className="absolute right-0 z-10 mt-2.5 transform w-80 max-w-[90vw]">
                                    <div className="bg-white rounded-lg shadow-lg ring-1 ring-slate-200 px-2 py-2.5">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <strong className="text-sm font-semibold text-slate-800">{t('notifications')}</strong>
                                        </div>
                                        <div className="mt-2 px-4 py-2 text-sm space-y-2">
                                            <a
                                                className="flex flex-col gap-2.5 border-t border-slate-100 px-4.5 py-3 hover:bg-slate-50 rounded-lg transition-colors duration-200"
                                                href="/"
                                            >
                                                <p className="text-sm">
                                                    <span className="text-slate-800 font-medium">
                                                        Lịch họp giáo viên
                                                    </span>
                                                    <span className="block text-slate-600 mt-1">
                                                        Họp giáo viên vào thứ 6 tuần này lúc 14:00.
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-500">2 giờ trước</p>
                                            </a>
                                            <a
                                                className="flex flex-col gap-2.5 border-t border-slate-100 px-4.5 py-3 hover:bg-slate-50 rounded-lg transition-colors duration-200"
                                                href="/"
                                            >
                                                <p className="text-sm">
                                                    <span className="text-slate-800 font-medium">
                                                        Báo cáo điểm danh
                                                    </span>
                                                    <span className="block text-slate-600 mt-1">
                                                        Báo cáo điểm danh tháng 12 đã sẵn sàng.
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-500">1 ngày trước</p>
                                            </a>
                                        </div>
                                    </div>
                                </PopoverPanel>
                            </Transition>
                        </>
                    )}
                </Popover>
                
                {/* User menu */}
                <Menu as="div" className="relative">
                    <div>
                        <MenuButton className="ml-2 bg-gradient-to-r from-indigo-500 to-indigo-600 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 hover:shadow-lg">
                            <span className="sr-only">{t('openUserMenu')}</span>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-cover bg-no-repeat bg-center flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                                {userAttributes?.preferred_username ? 
                                    userAttributes.preferred_username.charAt(0).toUpperCase() :
                                    <HiOutlineUser fontSize={16} />
                                }
                            </div>
                        </MenuButton>
                    </div>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <MenuItems className="origin-top-right z-10 absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-1 bg-white ring-1 ring-slate-200 focus:outline-none">
                            <MenuItem>
                                <div
                                    onClick={() => navigate('/dashboard/profile')}
                                    className="hover:bg-indigo-50 focus:bg-indigo-100 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium cursor-pointer transition-colors duration-200"
                                >
                                    {t('userProfile')}
                                </div>
                            </MenuItem>
                            <MenuItem>
                                <div
                                    onClick={() => navigate('/dashboard/settings')}
                                    className="hover:bg-indigo-50 focus:bg-indigo-100 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium cursor-pointer transition-colors duration-200"
                                >
                                    {t('settings')}
                                </div>
                            </MenuItem>

                            <MenuItem>
                                <Authenticator>
                                    {({ signOut }) => (
                                        <div
                                            onClick={signOut}
                                            className="hover:bg-red-50 focus:bg-red-100 rounded-lg px-4 py-2 text-red-600 text-sm font-medium cursor-pointer transition-colors duration-200"
                                        >
                                            {t('logout')}
                                        </div>
                                    )}
                                </Authenticator>
                            </MenuItem>
                        </MenuItems>
                    </Transition>
                </Menu>
            </div>
        </div>
    )
}

Header.propTypes = {
    onMenuClick: PropTypes.func
}
