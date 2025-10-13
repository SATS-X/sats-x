import { createContext, useContext, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// Language translations
const translations = {
    vi: {
        // Common
        save: 'Lưu',
        cancel: 'Hủy',
        confirm: 'Xác nhận',
        delete: 'Xóa',
        edit: 'Chỉnh sửa',
        add: 'Thêm',
        search: 'Tìm kiếm',
        loading: 'Đang tải...',
        success: 'Thành công',
        error: 'Lỗi',
        enable: 'Bật',
        disable: 'Tắt',
        view: 'Xem',
        filter: 'Lọc',
        actions: 'Thao tác',
        status: 'Trạng thái',
        active: 'Đang hoạt động',
        inactive: 'Không hoạt động',
        all: 'Tất cả',
        
        // System
        systemTitle: 'Hệ thống',
        systemSubtitle: 'Quản lý học sinh',
        
        // Navigation
        dashboard: 'Tổng quan',
        students: 'Học sinh',
        classes: 'Lớp học',
        subjects: 'Môn học',
        attendance: 'Điểm danh',
        schedule: 'Lịch học',
        profile: 'Hồ sơ',
        settings: 'Cài đặt',
        logout: 'Đăng xuất',
        
        // Home page
        homeTitle: 'Hệ thống quản lý học sinh',
        homeTitleShort: 'QLHS',
        homeHero: 'Quản lý học sinh',
        homeHeroHighlight: 'thông minh',
        homeDescription: 'Hệ thống quản lý học sinh hiện đại với công nghệ điểm danh thông minh, giúp giáo viên tiết kiệm thời gian và nâng cao hiệu quả quản lý lớp học.',
        getStarted: 'Bắt đầu ngay',
        learnMore: 'Tìm hiểu thêm',
        login: 'Đăng nhập',
        
        // Home features
        studentManagement: 'Quản lý học sinh',
        studentManagementDesc: 'Theo dõi thông tin học sinh, điểm danh và kết quả học tập một cách hiệu quả',
        classManagement: 'Quản lý lớp học',
        classManagementDesc: 'Tổ chức lớp học, phân công giáo viên và lập lịch học tập khoa học',
        smartAttendance: 'Điểm danh thông minh',
        smartAttendanceDesc: 'Hệ thống điểm danh tự động với công nghệ nhận diện khuôn mặt tiên tiến',
        detailedReports: 'Báo cáo chi tiết',
        detailedReportsDesc: 'Thống kê và báo cáo điểm danh, kết quả học tập với biểu đồ trực quan',
        
        // Dashboard
        welcomeBack: 'Chào mừng trở lại!',
        dashboardSubtitle: 'Hệ thống quản lý học sinh - Theo dõi điểm danh và quản lý lớp học',
        
        // Students page
        studentsManagement: 'Quản lý học sinh',
        studentsManagementDesc: 'Quản lý thông tin học sinh và theo dõi điểm danh',
        addStudent: 'Thêm học sinh',
        searchStudents: 'Tìm kiếm học sinh...',
        allClasses: 'Tất cả lớp',
        student: 'Học sinh',
        class: 'Lớp',
        contact: 'Liên hệ',
        attendanceRate: 'Tỷ lệ điểm danh',
        studentStatus: 'Trạng thái',
        studying: 'Đang học',
        onLeave: 'Nghỉ học',
        
        // Classes page
        classesManagement: 'Quản lý lớp học',
        classesManagementDesc: 'Quản lý thông tin lớp học và phân công giáo viên',
        addClass: 'Thêm lớp học',
        searchClasses: 'Tìm kiếm lớp học, môn học, giáo viên...',
        allGrades: 'Tất cả khối',
        grade: 'Khối',
        totalClasses: 'Tổng lớp học',
        totalStudents: 'Tổng học sinh',
        fullClasses: 'Lớp đầy',
        avgAttendanceRate: 'Tỷ lệ điểm danh TB',
        subject: 'Môn học',
        teacher: 'Giáo viên',
        classSchedule: 'Lịch học',
        
        // Pagination
        showing: 'Hiển thị',
        to: 'đến',
        of: 'trong tổng số',
        studentsTotal: 'học sinh',
        classesTotal: 'lớp học',
        previous: 'Trước',
        next: 'Sau',
        
        // Settings page
        systemSettings: 'Cài đặt hệ thống',
        systemSettingsDesc: 'Quản lý cài đặt và tùy chọn hệ thống của bạn',
        resetToDefault: 'Khôi phục mặc định',
        settingsSaved: 'Cài đặt đã được lưu!',
        savingSettings: 'Đang lưu cài đặt...',
        
        // Notifications
        notifications: 'Thông báo',
        notificationsDesc: 'Quản lý cách bạn nhận thông báo từ hệ thống',
        emailNotifications: 'Email thông báo',
        emailNotificationsDesc: 'Nhận thông báo quan trọng qua email',
        pushNotifications: 'Thông báo đẩy',
        pushNotificationsDesc: 'Nhận thông báo ngay lập tức trên thiết bị',
        attendanceAlerts: 'Cảnh báo điểm danh',
        attendanceAlertsDesc: 'Thông báo khi có học sinh vắng mặt',
        weeklyReports: 'Báo cáo tuần',
        weeklyReportsDesc: 'Nhận báo cáo tổng kết hàng tuần',
        
        // Appearance
        appearance: 'Giao diện',
        appearanceDesc: 'Tùy chỉnh giao diện và ngôn ngữ hệ thống',
        darkMode: 'Chế độ tối',
        darkModeDesc: 'Sử dụng giao diện tối để bảo vệ mắt',
        language: 'Ngôn ngữ',
        languageDesc: 'Chọn ngôn ngữ hiển thị của hệ thống',
        
        // Privacy
        privacy: 'Quyền riêng tư',
        privacyDesc: 'Kiểm soát thông tin cá nhân và quyền truy cập',
        profileVisible: 'Hiển thị hồ sơ',
        profileVisibleDesc: 'Cho phép người khác xem hồ sơ của bạn',
        showEmail: 'Hiển thị email',
        showEmailDesc: 'Cho phép người khác xem địa chỉ email',
        
        // System
        system: 'Hệ thống',
        systemDesc: 'Cài đặt sao lưu và quản lý dữ liệu',
        autoBackup: 'Sao lưu tự động',
        autoBackupDesc: 'Tự động sao lưu dữ liệu định kỳ',
        dataRetention: 'Lưu trữ dữ liệu',
        dataRetentionDesc: 'Thời gian lưu trữ dữ liệu trong hệ thống',
        
        // Danger Zone
        dangerZone: 'Vùng nguy hiểm',
        dangerZoneDesc: 'Các hành động không thể hoàn tác - hãy thận trọng!',
        deleteAllData: 'Xóa tất cả dữ liệu',
        deleteAllDataDesc: 'Xóa vĩnh viễn tất cả dữ liệu điểm danh, học sinh và báo cáo',
        resetSettings: 'Khôi phục cài đặt gốc',
        resetSettingsDesc: 'Đặt lại tất cả cài đặt về trạng thái mặc định',
        
        // Time periods
        months3: '3 tháng',
        months6: '6 tháng',
        months12: '12 tháng',
        months24: '24 tháng',
        
        // Footer
        systemVersion: 'Hệ thống điểm danh thông minh • Phiên bản 1.0.0',
        
        // Profile page
        userProfile: 'Hồ sơ cá nhân',
        userProfileDesc: 'Quản lý thông tin cá nhân và cài đặt tài khoản',
        personalInfo: 'Thông tin cá nhân',
        fullName: 'Họ và tên',
        phoneNumber: 'Số điện thoại',
        birthDate: 'Ngày sinh',
        position: 'Chức vụ',
        department: 'Khoa/Bộ môn',
        experience: 'Kinh nghiệm',
        education: 'Học vấn',
        address: 'Địa chỉ',
        accountSecurity: 'Bảo mật tài khoản',
        changePassword: 'Đổi mật khẩu',
        updatePassword: 'Cập nhật mật khẩu của bạn',
        twoFactorAuth: 'Xác thực 2 bước',
        enhanceSecurity: 'Tăng cường bảo mật tài khoản',
        change: 'Đổi',
        notProvided: 'Chưa cung cấp',
        enterFullName: 'Nhập họ và tên',
        enterEmail: 'Nhập địa chỉ email',
        enterPhoneNumber: 'Nhập số điện thoại',
        enterPosition: 'Nhập chức vụ',
        enterDepartment: 'Nhập khoa/bộ môn',
        enterExperience: 'Nhập kinh nghiệm',
        enterEducation: 'Nhập trình độ học vấn',
        enterAddress: 'Nhập địa chỉ',
        
        // Header
        hello: 'Xin chào',
        messages: 'Tin nhắn',
        openUserMenu: 'Mở menu người dùng',
        
        // Confirmations
        confirmResetSettings: 'Bạn có chắc chắn muốn khôi phục tất cả cài đặt về mặc định?',
        confirmDeleteData: 'CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu. Bạn có chắc chắn?',
        confirmDeleteDataFinal: 'Xác nhận lần cuối: Tất cả dữ liệu sẽ bị mất và không thể khôi phục!',
        demoNotImplemented: 'Chức năng này chưa được triển khai trong môi trường demo',
        
        // Subject page
        mySubjects: 'Môn học của tôi',
        manageSubjects: 'Quản lý môn học giảng dạy',
        refresh: 'Làm mới',
        totalSubjects: 'Tổng môn học',
        activeSubjects: 'Môn học hoạt động',
        departments: 'Bộ môn',
        subjectList: 'Danh sách môn học',
        allSubjectsTeaching: 'Tất cả môn học bạn đang giảng dạy',
        noSubjectsFound: 'Không tìm thấy môn học',
        noSubjectsAssigned: 'Bạn chưa được phân công môn học nào.',
        noSubjectSelected: 'Chưa chọn môn học',
        errorLoadingSubjects: 'Lỗi khi tải môn học',
        tryAgain: 'Thử lại',
        loadingSubjects: 'Đang tải môn học...',
        
        // Student list in subject
        searchStudentsPlaceholder: 'Tìm kiếm học sinh theo tên, mã số hoặc email...',
        loadingStudents: 'Đang tải danh sách học sinh...',
        errorLoadingStudents: 'Lỗi khi tải danh sách học sinh',
        studentsList: 'Danh sách học sinh',
        noStudentsFound: 'Không tìm thấy học sinh',
        emptyClass: 'Lớp học trống',
        noStudentsMatch: 'Không có học sinh nào phù hợp với tiêu chí tìm kiếm. Hãy thử điều chỉnh từ khóa tìm kiếm.',
        noStudentsEnrolled: 'Môn học này hiện tại chưa có học sinh nào đăng ký. Học sinh sẽ xuất hiện ở đây khi được phân công vào môn học này.',
        noClasses: 'Không có lớp',
        scheduleInformation: 'Thông tin lịch học',
        scheduledClasses: 'buổi học đã lên lịch',
        timeSlot: 'Thời gian',
        startTime: 'Giờ bắt đầu',
        endTime: 'Giờ kết thúc',
        room: 'Phòng',
        attendanceWindow: 'Cửa sổ điểm danh',
        checkInOpens: 'Mở điểm danh',
        onTimeEnds: 'Hết giờ đúng giờ',
        checkInCloses: 'Đóng điểm danh',
        noSchedule: 'Chưa có lịch học',
        noScheduleMessage: 'Môn học này chưa có lịch học nào được lên kế hoạch.',
        attendanceWindowUpdated: 'Cửa sổ điểm danh đã được cập nhật thành công!',
        
        // Validation messages
        validationError: 'Lỗi xác thực',
        pleaseAllFields: 'Vui lòng điền đầy đủ tất cả các trường thời gian',
        earlyCheckinMinutesError: 'Thời gian mở điểm danh sớm phải từ 0 đến 60 phút trước giờ học',
        ontimeWindowMinutesError: 'Thời gian điểm danh đúng giờ phải từ 0 đến 180 phút',
        lateWindowMinutesError: 'Thời gian điểm danh muộn phải từ 0 đến 300 phút',
        startTimeMustAfterCheckinOpens: 'Giờ bắt đầu học phải sau thời gian mở điểm danh',
        ontimeEndsMustAfterCheckinOpens: 'Thời gian kết thúc đúng giờ phải sau thời gian mở điểm danh',
        checkinClosesMustAfterOntimeEnds: 'Thời gian đóng điểm danh phải sau thời gian kết thúc đúng giờ',
        failedToSaveSchedule: 'Không thể lưu thay đổi lịch học',
        
        // Schedule page
        mySchedule: 'Lịch học của tôi',
        weeklySchedule: 'Thời khóa biểu hàng tuần',
        selectWeek: 'Chọn tuần',
        week: 'Tuần',
        from: 'từ ngày',
        noScheduleData: 'Không có dữ liệu lịch học',
        loadingSchedule: 'Đang tải lịch học...',
        errorLoadingSchedule: 'Lỗi khi tải lịch học',
        monday: 'Thứ 2',
        tuesday: 'Thứ 3', 
        wednesday: 'Thứ 4',
        thursday: 'Thứ 5',
        friday: 'Thứ 6',
        saturday: 'Thứ 7',
        sunday: 'Chủ nhật',
        time: 'Thời gian',
        noClassToday: 'Không có lớp học',
        
        // Attendance page
        attendanceManagement: 'Điểm danh học sinh',
        dailyAttendanceTracking: 'Quản lý và theo dõi điểm danh hàng ngày',
        exportReport: 'Xuất báo cáo',
        totalCount: 'Tổng số',
        present: 'Có mặt',
        late: 'Đi muộn',
        absent: 'Vắng mặt',
        searchStudentsAttendance: 'Tìm kiếm học sinh...',
        allSubjects: 'Tất cả môn học',
        studentName: 'Học sinh',
        subjectName: 'Môn học',
        subjectCode: 'Mã môn',
        date: 'Ngày',
        dayOfWeek: 'Thứ',
        statusLabel: 'Trạng thái',
        loadingAttendance: 'Đang tải điểm danh...',
        showingRecords: 'Hiển thị',
        toRecords: 'đến',
        ofTotalRecords: 'trong tổng số',
        records: 'bản ghi',
        page: 'Trang',
        onTime: 'Có mặt',
        absentStatus: 'Vắng mặt',
        lateStatus: 'Đi muộn',
        unknown: 'Không xác định',
        
        // Dashboard Stats
        totalStudentsCount: 'Tổng học sinh',
        currentClasses: 'Lớp học hiện tại',
        todayAttendance: 'Điểm danh hôm nay',
        todayAbsent: 'Vắng mặt hôm nay',
        
        // Recent Attendance
        recentAttendance: 'Điểm danh gần đây',
        latestAttendanceList: 'Danh sách điểm danh mới nhất',
        notCheckedIn: 'Chưa điểm danh',
        noRecentAttendance: 'Không có dữ liệu điểm danh gần đây',
        viewAllAttendance: 'Xem tất cả điểm danh'
    },
    
    en: {
        // Common
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        enable: 'Enable',
        disable: 'Disable',
        view: 'View',
        filter: 'Filter',
        actions: 'Actions',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        all: 'All',
        
        // System
        systemTitle: 'System',
        systemSubtitle: 'Student Management',
        
        // Navigation
        dashboard: 'Dashboard',
        students: 'Students',
        classes: 'Classes',
        subjects: 'Subjects',
        attendance: 'Attendance',
        schedule: 'Schedule',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        
        // Home page
        homeTitle: 'Student Management System',
        homeTitleShort: 'SMS',
        homeHero: 'Smart Student',
        homeHeroHighlight: 'Management',
        homeDescription: 'Modern student management system with smart attendance technology, helping teachers save time and improve classroom management efficiency.',
        getStarted: 'Get Started',
        learnMore: 'Learn More',
        login: 'Login',
        
        // Home features
        studentManagement: 'Student Management',
        studentManagementDesc: 'Track student information, attendance and academic results efficiently',
        classManagement: 'Class Management',
        classManagementDesc: 'Organize classes, assign teachers and schedule learning scientifically',
        smartAttendance: 'Smart Attendance',
        smartAttendanceDesc: 'Automatic attendance system with advanced facial recognition technology',
        detailedReports: 'Detailed Reports',
        detailedReportsDesc: 'Statistics and reports on attendance, academic results with visual charts',
        
        // Dashboard
        welcomeBack: 'Welcome back!',
        dashboardSubtitle: 'Student Management System - Track attendance and manage classes',
        
        // Students page
        studentsManagement: 'Student Management',
        studentsManagementDesc: 'Manage student information and track attendance',
        addStudent: 'Add Student',
        searchStudents: 'Search students...',
        allClasses: 'All Classes',
        student: 'Student',
        class: 'Class',
        contact: 'Contact',
        attendanceRate: 'Attendance Rate',
        studentStatus: 'Status',
        studying: 'Studying',
        onLeave: 'On Leave',
        
        // Classes page
        classesManagement: 'Class Management',
        classesManagementDesc: 'Manage class information and assign teachers',
        addClass: 'Add Class',
        searchClasses: 'Search classes, subjects, teachers...',
        allGrades: 'All Grades',
        grade: 'Grade',
        totalClasses: 'Total Classes',
        totalStudents: 'Total Students',
        fullClasses: 'Full Classes',
        avgAttendanceRate: 'Avg Attendance Rate',
        subject: 'Subject',
        teacher: 'Teacher',
        classSchedule: 'Schedule',
        
        // Pagination
        showing: 'Showing',
        to: 'to',
        of: 'of',
        studentsTotal: 'students',
        classesTotal: 'classes',
        previous: 'Previous',
        next: 'Next',
        
        // Settings page
        systemSettings: 'System Settings',
        systemSettingsDesc: 'Manage your system settings and preferences',
        resetToDefault: 'Reset to Default',
        settingsSaved: 'Settings saved successfully!',
        savingSettings: 'Saving settings...',
        
        // Notifications
        notifications: 'Notifications',
        notificationsDesc: 'Manage how you receive notifications from the system',
        emailNotifications: 'Email Notifications',
        emailNotificationsDesc: 'Receive important notifications via email',
        pushNotifications: 'Push Notifications',
        pushNotificationsDesc: 'Receive instant notifications on your device',
        attendanceAlerts: 'Attendance Alerts',
        attendanceAlertsDesc: 'Get notified when students are absent',
        weeklyReports: 'Weekly Reports',
        weeklyReportsDesc: 'Receive weekly summary reports',
        
        // Appearance
        appearance: 'Appearance',
        appearanceDesc: 'Customize system interface and language',
        darkMode: 'Dark Mode',
        darkModeDesc: 'Use dark interface to protect your eyes',
        language: 'Language',
        languageDesc: 'Choose system display language',
        
        // Privacy
        privacy: 'Privacy',
        privacyDesc: 'Control personal information and access rights',
        profileVisible: 'Profile Visibility',
        profileVisibleDesc: 'Allow others to view your profile',
        showEmail: 'Show Email',
        showEmailDesc: 'Allow others to view your email address',
        
        // System
        system: 'System',
        systemDesc: 'Backup settings and data management',
        autoBackup: 'Auto Backup',
        autoBackupDesc: 'Automatically backup data periodically',
        dataRetention: 'Data Retention',
        dataRetentionDesc: 'Data storage duration in the system',
        
        // Danger Zone
        dangerZone: 'Danger Zone',
        dangerZoneDesc: 'Irreversible actions - proceed with caution!',
        deleteAllData: 'Delete All Data',
        deleteAllDataDesc: 'Permanently delete all attendance, student, and report data',
        resetSettings: 'Reset Settings',
        resetSettingsDesc: 'Reset all settings to default state',
        
        // Time periods
        months3: '3 months',
        months6: '6 months',
        months12: '12 months',
        months24: '24 months',
        
        // Footer
        systemVersion: 'Smart Attendance System • Version 1.0.0',
        
        // Profile page
        userProfile: 'User Profile',
        userProfileDesc: 'Manage personal information and account settings',
        personalInfo: 'Personal Information',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        birthDate: 'Birth Date',
        position: 'Position',
        department: 'Department',
        experience: 'Experience',
        education: 'Education',
        address: 'Address',
        accountSecurity: 'Account Security',
        changePassword: 'Change Password',
        updatePassword: 'Update your password',
        twoFactorAuth: 'Two-Factor Authentication',
        enhanceSecurity: 'Enhance account security',
        change: 'Change',
        notProvided: 'Not provided',
        enterFullName: 'Enter full name',
        enterEmail: 'Enter email address',
        enterPhoneNumber: 'Enter phone number',
        enterPosition: 'Enter position',
        enterDepartment: 'Enter department',
        enterExperience: 'Enter experience',
        enterEducation: 'Enter education level',
        enterAddress: 'Enter address',
        
        // Header
        hello: 'Hello',
        messages: 'Messages',
        openUserMenu: 'Open user menu',
        
        // Confirmations
        confirmResetSettings: 'Are you sure you want to reset all settings to default?',
        confirmDeleteData: 'WARNING: This action will permanently delete all data. Are you sure?',
        confirmDeleteDataFinal: 'Final confirmation: All data will be lost and cannot be recovered!',
        demoNotImplemented: 'This feature is not implemented in demo environment',
        
        // Subject page
        mySubjects: 'My Subjects',
        manageSubjects: 'Manage your teaching subjects',
        refresh: 'Refresh',
        totalSubjects: 'Total Subjects',
        activeSubjects: 'Active Subjects',
        departments: 'Departments',
        subjectList: 'Subject List',
        allSubjectsTeaching: 'All subjects you are teaching',
        noSubjectsFound: 'No Subjects Found',
        noSubjectsAssigned: 'You don\'t have any subjects assigned yet.',
        noSubjectSelected: 'No Subject Selected',
        errorLoadingSubjects: 'Error Loading Subjects',
        tryAgain: 'Try Again',
        loadingSubjects: 'Loading subjects...',
        
        // Student list in subject
        searchStudentsPlaceholder: 'Search students by name, ID, or email...',
        loadingStudents: 'Loading students...',
        errorLoadingStudents: 'Error Loading Students',
        studentsList: 'Students List',
        noStudentsFound: 'No Students Found',
        emptyClass: 'Empty Class',
        noStudentsMatch: 'No students match your search criteria. Try adjusting your search terms.',
        noStudentsEnrolled: 'This subject currently has no students enrolled. Students will appear here once they are assigned to this subject.',
        noClasses: 'No classes',
        scheduleInformation: 'Schedule Information',
        scheduledClasses: 'scheduled classes',
        timeSlot: 'Time Slot',
        startTime: 'Start Time',
        endTime: 'End Time',
        room: 'Room',
        attendanceWindow: 'Attendance Window',
        checkInOpens: 'Check-in Opens',
        onTimeEnds: 'On-time Ends',
        checkInCloses: 'Check-in Closes',
        noSchedule: 'No Schedule',
        noScheduleMessage: 'This subject does not have any scheduled classes yet.',
        attendanceWindowUpdated: 'Attendance window updated successfully!',
        
        // Validation messages
        validationError: 'Validation Error',
        pleaseAllFields: 'Please fill in all time fields',
        earlyCheckinMinutesError: 'Early check-in time must be between 0 and 60 minutes before class starts',
        ontimeWindowMinutesError: 'On-time window must be between 0 and 180 minutes',
        lateWindowMinutesError: 'Late window must be between 0 and 300 minutes',
        startTimeMustAfterCheckinOpens: 'Start time must be after check-in opens',
        ontimeEndsMustAfterCheckinOpens: 'On-time ends must be after check-in opens',
        checkinClosesMustAfterOntimeEnds: 'Check-in closes must be after on-time ends',
        failedToSaveSchedule: 'Failed to save schedule changes',
        
        // Schedule page
        mySchedule: 'My Schedule',
        weeklySchedule: 'Weekly Schedule',
        selectWeek: 'Select Week',
        week: 'Week',
        from: 'from',
        noScheduleData: 'No schedule data available',
        loadingSchedule: 'Loading schedule...',
        errorLoadingSchedule: 'Error loading schedule',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday', 
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
        time: 'Time',
        noClassToday: 'No classes today',
        
        // Attendance page
        attendanceManagement: 'Student Attendance',
        dailyAttendanceTracking: 'Manage and track daily attendance',
        exportReport: 'Export Report',
        totalCount: 'Total',
        present: 'Present',
        late: 'Late',
        absent: 'Absent',
        searchStudentsAttendance: 'Search students...',
        allSubjects: 'All Subjects',
        studentName: 'Student',
        subjectName: 'Subject',
        subjectCode: 'Subject Code',
        date: 'Date',
        dayOfWeek: 'Day',
        statusLabel: 'Status',
        loadingAttendance: 'Loading attendance...',
        showingRecords: 'Showing',
        toRecords: 'to',
        ofTotalRecords: 'of',
        records: 'records',
        page: 'Page',
        onTime: 'Present',
        absentStatus: 'Absent',
        lateStatus: 'Late',
        unknown: 'Unknown',
        
        // Dashboard Stats
        totalStudentsCount: 'Total Students',
        currentClasses: 'Current Classes',
        todayAttendance: 'Today\'s Attendance',
        todayAbsent: 'Today\'s Absent',
        
        // Recent Attendance
        recentAttendance: 'Recent Attendance',
        latestAttendanceList: 'Latest attendance records',
        notCheckedIn: 'Not checked in',
        noRecentAttendance: 'No recent attendance data',
        viewAllAttendance: 'View all attendance'
    }
}

// Create Language Context
const LanguageContext = createContext()

// Language Provider Component
export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // Get saved language from localStorage or default to Vietnamese
        return localStorage.getItem('language') || 'vi'
    })

    // Save language to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('language', language)
    }, [language])

    // Get translation function
    const t = (key) => {
        return translations[language][key] || key
    }

    // Change language function
    const changeLanguage = (newLanguage) => {
        if (translations[newLanguage]) {
            setLanguage(newLanguage)
        }
    }

    const value = {
        language,
        changeLanguage,
        t,
        availableLanguages: Object.keys(translations)
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

// Custom hook to use language context
export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

LanguageProvider.propTypes = {
    children: PropTypes.node.isRequired
} 