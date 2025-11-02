import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { HiOutlineAcademicCap, HiOutlineUsers, HiOutlineBookOpen, HiOutlineClipboardList, HiOutlineRefresh, HiOutlineCalendar } from 'react-icons/hi'
import { getAllSubjectsByTeacherId } from '../api/subject/getSubject'
import { useLanguage } from '../contexts/LanguageContext'
import useUserAttributes from '../hooks/useUserAttributes'
import SubjectDetail from '../components/Subject/SubjectDetail'

const Subject = () => {
    const { t } = useLanguage()
    const location = useLocation()
    const [subjectData, setSubjectData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedSubject, setSelectedSubject] = useState(null)
    const userAttributes = useUserAttributes()

    const fetchSubjects = useCallback(async () => {
        if (!userAttributes?.sub) return

        setLoading(true)
        setError(null)
        
        try {
            const response = await getAllSubjectsByTeacherId(userAttributes.sub)
            setSubjectData(response)
        } catch (error) {
            console.error('Error fetching teacher subjects:', error)
            setError(error.message || 'Failed to fetch subjects')
        } finally {
            setLoading(false)
        }
    }, [userAttributes])

    useEffect(() => {
        fetchSubjects()
    }, [fetchSubjects])

    // Handle navigation from Dashboard
    useEffect(() => {
        if (location.state?.selectedSubject) {
            setSelectedSubject(location.state.selectedSubject)
            // Clear the state to avoid reopening on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location])

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject)
    }

    const handleBackToSubjects = () => {
        setSelectedSubject(null)
    }

    const handleRefresh = () => {
        fetchSubjects()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-lg text-slate-600">{t('loadingSubjects')}</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 text-lg font-medium mb-2">{t('errorLoadingSubjects')}</div>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={handleRefresh}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                    <HiOutlineRefresh className="mr-2" />
                    {t('tryAgain')}
                </button>
            </div>
        )
    }

    if (!subjectData) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                <HiOutlineBookOpen className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600">{t('noSubjectsFound')}</p>
            </div>
        )
    }

    const { teacher, subjects, count } = subjectData

    // If a subject is selected, show student detail view
    if (selectedSubject) {
        return <SubjectDetail subject={selectedSubject} onBack={handleBackToSubjects} />
    }

    // Default subject list view
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <HiOutlineAcademicCap className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                            <h1 className="text-2xl font-bold text-slate-900">{t('mySubjects')}</h1>
                            <p className="text-slate-600">{t('manageSubjects')}</p>
                        </div>
                    </div>
                        <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                        <HiOutlineRefresh className="mr-2 h-4 w-4" />
                        {t('refresh')}
                    </button>
                </div>

                {/* Teacher Info */}
                {teacher && (
                    <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="bg-slate-200 p-2 rounded-full">
                                <HiOutlineUsers className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="font-semibold text-slate-900">{teacher.teacher_name}</h3>
                                <p className="text-sm text-slate-600">{teacher.teacher_email}</p>
                                {teacher.teacher_phone && (
                                    <p className="text-sm text-slate-600">{teacher.teacher_phone}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <HiOutlineBookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('totalSubjects')}</p>
                            <p className="text-2xl font-bold text-slate-900">{count}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full">
                            <HiOutlineClipboardList className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('activeSubjects')}</p>
                            <p className="text-2xl font-bold text-slate-900">{subjects?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <HiOutlineAcademicCap className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('departments')}</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {new Set(subjects?.map(s => s.subject_id.substring(0, 3))).size || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">{t('subjectList')}</h2>
                    <p className="text-sm text-slate-600">{t('allSubjectsTeaching')}</p>
                </div>

                {subjects && subjects.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                        {subjects.map((subject) => (
                            <div
                                key={subject.subject_id}
                                onClick={() => handleSubjectClick(subject)}
                                className="p-6 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {subject.subject_id.substring(0, 3)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-grow">
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {subject.subject_name}
                                            </h3>
                                            <p className="text-sm text-slate-600">
                                                Subject ID: {subject.subject_id}
                                            </p>
                                            {subject.schedules && subject.schedules.length > 0 && (
                                                <div className="flex items-center mt-1 text-xs text-indigo-600">
                                                    <HiOutlineCalendar className="h-4 w-4 mr-1" />
                                                    <span>{subject.schedules.length} {t('scheduledClasses')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {subject.schedules && subject.schedules.length > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {t('active')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                {t('noSchedule')}
                                            </span>
                                        )}
                                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <HiOutlineBookOpen className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">{t('noSubjectsFound')}</h3>
                        <p className="text-slate-600">{t('noSubjectsAssigned')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Subject
