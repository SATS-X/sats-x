import {
    LuBookOpen,
    LuCalendar,
    LuCircleUser,
    LuClipboardList,
    LuCpu,
    LuGraduationCap,
    LuLayoutDashboard,
    LuRadio,
    LuScanFace,
    LuSettings,
    LuUsers
} from 'react-icons/lu'

export const DASHBOARD_SIDEBAR_LINKS = [
    { key: 'dashboard', labelKey: 'dashboard', path: '/dashboard', icon: LuLayoutDashboard },
    { key: 'live', label: 'Live', path: '/live', icon: LuRadio, live: true },
    { key: 'attendance', labelKey: 'attendance', path: '/attendance', icon: LuClipboardList },
    { key: 'schedule', labelKey: 'schedule', path: '/schedule', icon: LuCalendar },
    { key: 'classes', labelKey: 'classes', path: '/classes', icon: LuGraduationCap },
    { key: 'students', labelKey: 'students', path: '/students', icon: LuUsers },
    { key: 'subjects', labelKey: 'subjects', path: '/subjects', icon: LuBookOpen },
    { key: 'faceManagement', label: 'Faces', path: '/face-management', icon: LuScanFace },
    { key: 'devices', label: 'Devices', path: '/devices', icon: LuCpu }
]

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
    { key: 'profile', labelKey: 'profile', path: '/dashboard/profile', icon: LuCircleUser },
    { key: 'settings', labelKey: 'settings', path: '/settings', icon: LuSettings }
]
