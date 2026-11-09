import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuCalendar, LuGraduationCap, LuRefreshCw, LuUser, LuUsers } from 'react-icons/lu'
import { getSubjectsByTeacherId } from '../api/subject/getSubject'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Button, Card, EmptyState, LoadingState, PageHeader, SearchInput } from '../components/ui'

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
                eyebrow={`Subjects · ${filteredSubjects.length}`}
                title={t('mySubjects')}
                description={t('manageSubjects')}
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchSubjects}>
                        <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                        Refresh
                    </Button>
                }
            />

            <SearchInput
                aria-label="Search subjects"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by subject name or code..."
                className="max-w-md"
            />

            {loading ? (
                <LoadingState label="Loading subjects..." />
            ) : filteredSubjects.length === 0 ? (
                <Card padded={false}>
                    <EmptyState title="No subjects found" description="Subjects assigned to you will appear here." />
                </Card>
            ) : (
                <div className="space-y-2.5">
                    {filteredSubjects.map((sub) => (
                        <Card key={sub.subject_id} padded={false} className="transition-colors hover:border-accent/35">
                            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-x-2">
                                        <h3 className="truncate text-sm font-semibold text-text">{sub.name}</h3>
                                        <span className="font-data text-[11px] text-text-tertiary">{sub.subject_id}</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                                        <span className="flex items-center gap-1">
                                            <LuUser className="h-3 w-3" aria-hidden="true" />
                                            {sub.teacher_name || '—'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <LuUsers className="h-3 w-3" aria-hidden="true" />
                                            <span className="font-data">{sub.student_count ?? 0}</span> students
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <LuGraduationCap className="h-3 w-3" aria-hidden="true" />
                                            <span className="font-data">{sub.class_count ?? 0}</span> classes
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5">
                                    <Button as={Link} to="/schedule" variant="ghost" size="sm">
                                        <LuCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                                        View schedule
                                    </Button>
                                    <Button as={Link} to="/attendance" variant="secondary" size="sm">
                                        Attendance
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
