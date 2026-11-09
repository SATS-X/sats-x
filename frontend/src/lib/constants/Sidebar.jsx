import {
    LuBookOpen,
    LuCalendar,
    LuCircleUser,
    LuClipboardList,
    LuGraduationCap,
    LuLayoutDashboard,
    LuScanFace,
    LuSettings,
    LuUsers
} from 'react-icons/lu'

export const DASHBOARD_SIDEBAR_LINKS = [
    { key: 'dashboard', labelKey: 'dashboard', path: '/dashboard', icon: LuLayoutDashboard },
    { key: 'attendance', labelKey: 'attendance', path: '/attendance', icon: LuClipboardList },
    { key: 'classes', labelKey: 'classes', path: '/classes', icon: LuGraduationCap },
    { key: 'students', labelKey: 'students', path: '/students', icon: LuUsers },
    { key: 'subjects', labelKey: 'subjects', path: '/subjects', icon: LuBookOpen },
    { key: 'schedule', labelKey: 'schedule', path: '/schedule', icon: LuCalendar },
    { key: 'faceManagement', labelKey: 'faceManagement', path: '/face-management', icon: LuScanFace }
]

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
    { key: 'profile', labelKey: 'profile', path: '/dashboard/profile', icon: LuCircleUser },
    { key: 'settings', labelKey: 'settings', path: '/settings', icon: LuSettings }
]
