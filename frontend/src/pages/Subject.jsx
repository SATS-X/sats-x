import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { LuCalendar, LuGraduationCap, LuPencil, LuPlus, LuRefreshCw, LuTrash2, LuUser, LuUserPlus, LuUsers } from 'react-icons/lu'
import { deleteSubject, getManagedSubjects } from '../api/subject/getSubject'
import { getClasses } from '../api/class/getClasses'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { apiErrorMessage } from '../lib/errors'
import SubjectFormModal from '../components/Subject/SubjectFormModal'
import SubjectStudentsModal from '../components/Subject/SubjectStudentsModal'
import { Button, Card, EmptyState, IconButton, LoadingState, Modal, Notice, PageHeader, SearchInput } from '../components/ui'

export default function Subject() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const { showError, showSuccess } = useToast()

    const [subjects, setSubjects] = useState([])
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [modal, setModal] = useState(null) // 'form' | 'students' | 'delete'
    const [selected, setSelected] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const fetchSubjects = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const [subjectsRes, classesRes] = await Promise.all([getManagedSubjects(user), getClasses()])
            setSubjects(subjectsRes?.success ? subjectsRes.data : [])
            setClasses(classesRes?.data ?? [])
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not load subjects'), 'Error')
        } finally {
            setLoading(false)
        }
    }, [user, showError])

    useEffect(() => {
        fetchSubjects()
    }, [fetchSubjects])

    const openModal = (name, subject = null) => {
        setSelected(subject)
        setModal(name)
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await deleteSubject(selected.subject_id)
            showSuccess('Subject deleted', 'Success')
            setModal(null)
            fetchSubjects()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not delete the subject'), 'Error')
        } finally {
            setDeleting(false)
        }
    }

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
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchSubjects}>
                            <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => openModal('form')}>
                            <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Create subject
                        </Button>
                    </>
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
                    <EmptyState title="No subjects found" description="Create a subject and assign the classes that take it." />
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
                                            {sub.class_ids?.length ? <span className="font-data">{sub.class_ids.join(', ')}</span> : 'No class assigned'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <Button as={Link} to="/schedule" variant="ghost" size="sm">
                                        <LuCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                                        Schedule
                                    </Button>
                                    <IconButton icon={LuUserPlus} label={`Additional students for ${sub.name}`} onClick={() => openModal('students', sub)} />
                                    <IconButton icon={LuPencil} label={`Edit ${sub.name}`} onClick={() => openModal('form', sub)} />
                                    <IconButton icon={LuTrash2} label={`Delete ${sub.name}`} tone="danger" onClick={() => openModal('delete', sub)} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <SubjectFormModal isOpen={modal === 'form'} onClose={() => setModal(null)} subject={selected} classes={classes} onSaved={fetchSubjects} />
            <SubjectStudentsModal isOpen={modal === 'students'} onClose={() => setModal(null)} subject={selected} onChanged={fetchSubjects} />

            <Modal
                isOpen={modal === 'delete'}
                onClose={() => setModal(null)}
                title="Delete subject"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModal(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting}>
                            Delete subject
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                        Delete <span className="font-semibold text-text">{selected?.name}</span> (<span className="font-data">{selected?.subject_id}</span>)?
                    </p>
                    <Notice>This also removes its scheduled sessions. Subjects that already have attendance records cannot be deleted.</Notice>
                </div>
            </Modal>
        </div>
    )
}
