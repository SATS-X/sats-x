import {
    HiOutlineViewGrid,
    HiOutlineUsers,
    HiOutlineUserCircle,
    HiOutlineCog,
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlinePhotograph,
    HiOutlineBookOpen
} from 'react-icons/hi'

// Toàn bộ icon dùng chung một bộ (react-icons/hi, Heroicons outline) để giữ nhất
// quán độ dày nét — trước đây trộn lẫn Hi/Md/Fa khiến icon không đồng bộ.

export const DASHBOARD_SIDEBAR_LINKS = [
    { key: 'dashboard', labelKey: 'dashboard', path: '/dashboard', icon: <HiOutlineViewGrid /> },
    { key: 'classes', labelKey: 'classes', path: '/classes', icon: <HiOutlineAcademicCap /> },
    { key: 'students', labelKey: 'students', path: '/students', icon: <HiOutlineUsers /> },
    { key: 'subjects', labelKey: 'subjects', path: '/subjects', icon: <HiOutlineBookOpen /> },
    { key: 'attendance', labelKey: 'attendance', path: '/attendance', icon: <HiOutlineClipboardList /> },
    { key: 'schedule', labelKey: 'schedule', path: '/schedule', icon: <HiOutlineCalendar /> },
    { key: 'faceManagement', labelKey: 'faceManagement', path: '/face-management', icon: <HiOutlinePhotograph /> }
]

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
    { key: 'profile', labelKey: 'profile', path: '/dashboard/profile', icon: <HiOutlineUserCircle /> },
    { key: 'settings', labelKey: 'settings', path: '/settings', icon: <HiOutlineCog /> }
]
