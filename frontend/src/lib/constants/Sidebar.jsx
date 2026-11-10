import {
    LuBookOpen,
    LuCalendar,
    LuCircleUser,
    LuClipboardList,
    LuCpu,
    LuGraduationCap,
    LuLayoutDashboard,
    LuMonitorPlay,
    LuRadio,
    LuScanFace,
    LuSettings,
    LuUserCheck,
    LuUsers
} from 'react-icons/lu'

/** Điều hướng chính, chia nhóm theo công việc của giáo viên. */
export const NAV_GROUPS = [
    {
        key: 'overview',
        label: 'Overview',
        links: [
            { key: 'dashboard', labelKey: 'dashboard', path: '/dashboard', icon: LuLayoutDashboard },
            { key: 'live', label: 'Live', path: '/live', icon: LuRadio, live: true }
        ]
    },
    {
        key: 'attendance',
        label: 'Attendance',
        links: [
            { key: 'attendance', label: 'Records', path: '/attendance', icon: LuClipboardList },
            { key: 'checkIn', label: 'Check-in station', path: '/check-in', icon: LuUserCheck },
            { key: 'schedule', labelKey: 'schedule', path: '/schedule', icon: LuCalendar }
        ]
    },
    {
        key: 'academic',
        label: 'Academic',
        links: [
            { key: 'classes', labelKey: 'classes', path: '/classes', icon: LuGraduationCap },
            { key: 'students', labelKey: 'students', path: '/students', icon: LuUsers },
            { key: 'subjects', labelKey: 'subjects', path: '/subjects', icon: LuBookOpen }
        ]
    },
    {
        key: 'recognition',
        label: 'Recognition',
        links: [
            { key: 'faceManagement', label: 'Faces', path: '/face-management', icon: LuScanFace },
            { key: 'devices', label: 'Devices', path: '/devices', icon: LuCpu },
            { key: 'kiosk', label: 'Exhibition kiosk', path: '/kiosk', icon: LuMonitorPlay, fullscreen: true }
        ]
    }
]

export const DASHBOARD_SIDEBAR_LINKS = NAV_GROUPS.flatMap((group) => group.links)

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
    { key: 'profile', labelKey: 'profile', path: '/dashboard/profile', icon: LuCircleUser },
    { key: 'settings', labelKey: 'settings', path: '/settings', icon: LuSettings }
]
