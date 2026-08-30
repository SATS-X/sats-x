import { createContext, useContext } from 'react'
import PropTypes from 'prop-types'

// Language translations
const translations = {
    en: {
        // Common
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        update: 'Update',
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
        systemTitle: 'SATS X',
        systemSubtitle: 'Intelligent Attendance',

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
        homeTitle: 'SATS X',
        homeTitleShort: 'SX',
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
        dashboardSubtitle: 'Live attendance, identity, and classroom operations',

        // Students page
        studentsManagement: 'Student Management',
        studentsManagementDesc: 'Manage student information and track attendance',
        addStudent: 'Add Student',
        addStudentToSubject: 'Add Student to Subject',
        availableStudents: 'Available Students',
        studentDetails: 'Student Details',
        selectStudentToView: 'Select a student to view details',
        pleaseSelectStudent: 'Please select a student',
        studentAddedSuccessfully: 'Student added to subject successfully',
        failedToAddStudent: 'Failed to add student to subject',
        failedToLoadStudents: 'Failed to load students',
        email: 'Email',
        phone: 'Phone',
        close: 'Close',
        saving: 'Saving...',
        searchStudents: 'Search students...',
        selectClass: 'Select Class',
        selectClassFirst: 'Please select a class first',
        noAvailableStudents: 'No available students in this class',
        removeStudent: 'Remove Student',
        remove: 'Remove',
        removing: 'Removing...',
        removeStudentConfirmMessage: 'Are you sure you want to remove this student from the subject?',
        removeStudentWarning: 'This action will remove the student from this subject. The student can be added back later if needed.',
        studentRemovedSuccessfully: 'Student removed from subject successfully',
        failedToRemoveStudent: 'Failed to remove student from subject',
        availableStudentsCount: 'available students',
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
        systemVersion: 'SATS X • Version 1.0.0',

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
        viewAllAttendance: 'View all attendance',

        // Face Management
        faceManagement: 'Face Management',
        faceManagementDesc: 'Manage student face images by class',
        manageFacesByClass: 'Manage student face images by class',
        faceManagementReady: 'Ready',
        classList: 'Class List',
        selectClassToManage: 'Select a class to manage student faces',
        noClassesInSystem: 'No classes in the system yet.',
        manageFaces: 'Manage Faces',
        loadingClasses: 'Loading classes...',
        errorLoadingClasses: 'Error loading classes',
        loadingStudentList: 'Loading student list...',
        displayingStudents: 'Displaying',
        viewFaces: 'View Faces',
        faceImagesList: 'Face Images List',
        addImage: 'Add Image',
        loadingImages: 'Loading images...',
        noFaceImages: 'No Face Images',
        noFaceImagesDesc: 'This student has no face images saved in the system.',
        addFirstImage: 'Add First Image',
        viewImage: 'View',
        deleteImage: 'Delete',
        confirmDeleteImage: 'Are you sure you want to delete this image?',
        imageDeletedSuccess: 'Image deleted successfully',
        cannotDeleteImage: 'Cannot delete image',
        errorDeletingImage: 'Error deleting image',
        cannotLoadImage: 'Cannot load image',
        uploadFeatureComingSoon: 'Upload feature will be implemented soon',
        cannotLoadFaceList: 'Cannot load face images list',
        websocketConnectionError: 'WebSocket connection error',
        faceRegistration: 'Face Registration',
        addNewFace: 'Add New Face',
        studentId: 'Student ID',
        enterStudentId: 'Enter student ID',
        enterClassName: 'Enter class name',
        selectClassOption: 'Select class',
        uploadFaceImage: 'Upload Face Image',
        clickToUploadFaceImage: 'Click to upload face image',
        clickToChangeImage: 'Click to change image',
        supportedFormats: 'Supported formats: JPG, PNG, JPEG',
        maxFileSize: 'Maximum size: 5MB',
        uploading: 'Uploading...',
        invalidImageFormat: 'Invalid image format',
        imageTooLarge: 'Image too large (max 5MB)',
        faceAddedSuccess: 'Face added successfully',
        cannotAddFace: 'Cannot add face',
        errorAddingFace: 'Error adding face',
        uploadTimeout: 'Upload timeout',
        backToClassList: 'Back to class list',
        image: 'Image',
        addFaceImage: 'Add Face Image',
        updateFaceImage: 'Update Image',
        totalFaceImages: 'Total Face Images',
        faceImagesCount: 'images',
        manageStudentsSection: 'Student Management',
        addNewStudent: 'Add New Student',
        studentAddedSuccess: 'Student added successfully',
        errorAddingStudent: 'Error adding student',
        invalidEmailFormat: 'Invalid email format',
        invalidPhoneFormat: 'Phone number must be 10-11 digits',
        adding: 'Adding...',
        birthday: 'Birthday',
        studentIdExists: 'Student ID already exists',
        invalidStudentData: 'Invalid student data',
        deleteStudent: 'Delete Student',
        deleteStudentConfirmMessage: 'Are you sure you want to delete this student?',
        deleteStudentWarning: 'All data related to this student will be permanently deleted. This action cannot be undone.',
        studentDeletedSuccess: 'Student deleted successfully',
        errorDeletingStudent: 'Error deleting student',
        studentNotFound: 'Student not found',
        deleting: 'Deleting...',
        warning: 'Warning',
        confirmAction: 'Please confirm your action.',
        deleteFaceID: 'Delete Face ID',
        moreActions: 'More actions',
        faceNotFound: 'Face ID not found',
        faceDeletedSuccess: 'Face ID deleted successfully',
        errorDeletingFace: 'Error deleting Face ID',
        cannotDeleteFace: 'Cannot delete Face ID',
        deleteFaceConfirmMessage: 'Are you sure you want to delete this Face ID?',
        deleteFaceWarning: 'Face data will be removed from the system. Student will not be able to check attendance by face until re-added.',
        deleteTimeout: 'Delete timeout',
        currentFaceImage: 'Current Face Image',
        studentHasFaceID: 'Student has Face ID',
        uploadNewImageToUpdate: 'Upload new image to update face',
        loadingCurrentImage: 'Loading current image...',
        noCurrentImage: 'No current image'
    }
}

// Create Language Context
const LanguageContext = createContext()

// Language Provider Component
export const LanguageProvider = ({ children }) => {
    const language = 'en'

    // Get translation function
    const t = (key) => {
        return translations.en[key] || key
    }

    // Change language function
    const changeLanguage = () => {}

    const value = {
        language,
        changeLanguage,
        t,
        setLanguage: changeLanguage,
        availableLanguages: ['en']
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
