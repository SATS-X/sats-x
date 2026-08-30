import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineRefresh, HiOutlineCalendar } from 'react-icons/hi'
import { getSubjectsByTeacherId } from '../api/subject/getSubject'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Badge, Button, EmptyState, PageHeader, SearchInput, Spinner } from '../components/ui'

export default function Subject() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const { showError } = useToast()

    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchSubjects = async () => {
        if (!user?.teacher_id) return
        setLoading(true)
        try {
            const res = await getSubjectsByTeacherId(user.teacher_id)
            setSubjects(res?.success ? res.data : [])
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Could not load subjects', 'Error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSubjects()
    }, [user?.teacher_id])

    const filteredSubjects = subjects.filter((s) => {
        const search = searchTerm.toLowerCase()
        return !searchTerm || s.subject_id?.toLowerCase().includes(search) || s.name?.toLowerCase().includes(search)
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <span className="inline-flex items-center gap-2.5">
                        {t('mySubjects')}
                        <Badge>{filteredSubjects.length} subjects</Badge>
                    </span>
                }
                description={t('manageSubjects')}
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchSubjects}>
                        <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                        Refresh
                    </Button>
                }
            />

            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject name or code..."
                className="max-w-md"
            />

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Loading subjects...
                </div>
            ) : filteredSubjects.length === 0 ? (
                <EmptyState title="No subjects found" />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map((sub) => (
                        <div key={sub.subject_id} className="flex flex-col justify-between rounded-card border border-border bg-surface p-5">
                            <div className="space-y-3">
                                <div>
                                    <h3 className="line-clamp-1 text-base font-semibold text-text">{sub.name}</h3>
                                    <p className="font-data mt-0.5 text-xs text-text-tertiary">{sub.subject_id}</p>
                                </div>

                                <div className="space-y-1.5 rounded-card border border-border bg-surface-sunken p-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-tertiary">Instructor</span>
                                        <span className="font-medium text-text">{sub.teacher_name || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-tertiary">Enrolled students</span>
                                        <span className="font-data font-medium text-text">{sub.student_count ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-tertiary">Classes</span>
                                        <span className="font-data font-medium text-text">{sub.class_count ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                                <Link
                                    to="/schedule"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                                >
                                    <HiOutlineCalendar className="h-3.5 w-3.5" />
                                    View schedule
                                </Link>
                                <Link to="/attendance">
                                    <Button size="sm">Attendance</Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
