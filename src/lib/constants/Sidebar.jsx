import { 
    HiOutlineViewGrid, 
    HiOutlineUsers, 
    HiOutlineUserCircle, 
    HiOutlineCog,
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlineClipboardList,
    HiOutlinePhotograph
} from 'react-icons/hi'

import { MdSubject } from 'react-icons/md'
import { FaGraduationCap } from 'react-icons/fa'

export const DASHBOARD_SIDEBAR_LINKS = [
    {
        key: 'dashboard',
        labelKey: 'dashboard',
        path: '/dashboard',
        icon: <HiOutlineViewGrid />
    },
    {
        key: 'classes',
        labelKey: 'classes',
        path: '/classes',
        icon: <HiOutlineAcademicCap />
    },
    {
        key: 'students',
        labelKey: 'students',
        path: '/students',
        icon: <HiOutlineUsers />
    },
    {
        key: 'subjects',
        labelKey: 'subjects',
        path: '/subjects',
        icon: <MdSubject />
    },
    {
        key: 'attendance',
        labelKey: 'attendance',
        path: '/attendance',
        icon: <HiOutlineClipboardList />
    },
    {
        key: 'schedule',
        labelKey: 'schedule',
        path: '/schedule',
        icon: <HiOutlineCalendar />
    },
    {
        key: 'faceManagement',
        labelKey: 'faceManagement',
        path: '/face-management',
        icon: <HiOutlinePhotograph />
    }
]

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
    {
        key: 'profile',
        labelKey: 'profile',
        path: '/dashboard/profile',
        icon: <HiOutlineUserCircle />
    },
    {
        key: 'settings',
        labelKey: 'settings',
        path: '/settings',
        icon: <HiOutlineCog />
    }
]
