import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LuFingerprint, LuPencil, LuPlus, LuRefreshCw, LuTrash2, LuUsers } from 'react-icons/lu'
import { getClasses, createClass, updateClass, deleteClass } from '../api/class/getClasses'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Button, Card, EmptyState, Field, IconButton, Input, LoadingState, Modal, PageHeader, SearchInput, StatusChip } from '../components/ui'

export default function Classes() {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()

    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | 'delete'
    const [selectedClass, setSelectedClass] = useState(null)
    const [formData, setFormData] = useState({ class_id: '', name: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchClasses = async () => {
        setLoading(true)
        try {
            const res = await getClasses()
            setClasses(Array.isArray(res?.data) ? res.data : [])
        } catch (err) {
            showError(err.message || 'Could not load classes', 'Error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClasses()
    }, [])

    const handleOpenCreate = () => {
        setFormData({ class_id: '', name: '' })
        setSelectedClass(null)
        setModalMode('create')
    }

    const handleOpenEdit = (cls) => {
        setSelectedClass(cls)
        setFormData({ class_id: cls.class_id, name: cls.class_name || '' })
        setModalMode('edit')
    }

    const handleOpenDelete = (cls) => {
        setSelectedClass(cls)
        setModalMode('delete')
    }

    const handleSubmitForm = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            if (modalMode === 'create') {
                await createClass(formData)
                showSuccess('Class created', 'Success')
            } else if (modalMode === 'edit') {
                await updateClass(selectedClass.class_id, formData)
                showSuccess('Class updated', 'Success')
            }
            setModalMode(null)
            fetchClasses()
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Operation failed', 'Error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedClass) return
        setIsSubmitting(true)
        try {
            await deleteClass(selectedClass.class_id)
            showSuccess('Class deleted', 'Success')
            setModalMode(null)
            fetchClasses()
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Could not delete class', 'Error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredClasses = classes.filter((cls) => {
        const search = searchTerm.toLowerCase()
        return !searchTerm || cls.class_id?.toLowerCase().includes(search) || cls.class_name?.toLowerCase().includes(search)
    })

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Classes · ${filteredClasses.length}`}
                title={t('classesManagement')}
                description={t('classesManagementDesc')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchClasses}>
                            <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button size="sm" onClick={handleOpenCreate}>
                            <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Create class
                        </Button>
                    </>
                }
            />

            <SearchInput
                aria-label="Search classes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by class ID or name..."
                className="max-w-md"
            />

            {loading ? (
                <LoadingState label="Loading classes..." />
            ) : filteredClasses.length === 0 ? (
                <Card padded={false}>
                    <EmptyState title="No classes found" description="Create a class to start building its roster." />
                </Card>
            ) : (
                <div className="space-y-2.5">
                    {filteredClasses.map((cls) => (
                        <Card key={cls.class_id} padded={false} className="transition-colors hover:border-accent/35">
                            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-data truncate text-sm font-semibold text-text">
                                            <Link to={`/classes/${encodeURIComponent(cls.class_id)}`} className="hover:text-accent hover:underline">
                                                {cls.class_id}
                                            </Link>
                                        </h3>
                                        <StatusChip variant={cls.status === 'active' || !cls.status ? 'active' : 'neutral'}>{cls.status || 'active'}</StatusChip>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                                        <span className="truncate">{cls.class_name}</span>
                                        <span className="flex items-center gap-1">
                                            <LuUsers className="h-3 w-3" aria-hidden="true" />
                                            <span className="font-data">{cls.actual_student_count ?? cls.number_of_students ?? 0}</span> students
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <Button as={Link} to={`/face-management?class=${encodeURIComponent(cls.class_id)}`} variant="ghost" size="sm">
                                        <LuFingerprint className="h-3.5 w-3.5" aria-hidden="true" />
                                        Manage faces
                                    </Button>
                                    <IconButton icon={LuPencil} label={`Edit ${cls.class_id}`} onClick={() => handleOpenEdit(cls)} />
                                    <IconButton icon={LuTrash2} label={`Delete ${cls.class_id}`} tone="danger" onClick={() => handleOpenDelete(cls)} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                onClose={() => setModalMode(null)}
                title={modalMode === 'create' ? 'Create a class' : 'Edit class'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalMode(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="class-form" loading={isSubmitting}>
                            Save details
                        </Button>
                    </>
                }
            >
                <form id="class-form" onSubmit={handleSubmitForm} className="space-y-4">
                    <Field label="Class ID" required>
                        <Input
                            required
                            maxLength={32}
                            pattern="[A-Za-z0-9._\-]+"
                            title="Letters, numbers, dots, underscores, and hyphens only"
                            disabled={modalMode === 'edit'}
                            value={formData.class_id}
                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                            placeholder="Example: CS-2026-A"
                            className="font-data"
                        />
                    </Field>
                    <Field label="Class name" required>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Example: Computer Science A"
                        />
                    </Field>
                </form>
            </Modal>

            <Modal
                isOpen={modalMode === 'delete'}
                onClose={() => setModalMode(null)}
                title="Delete class"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalMode(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm} loading={isSubmitting}>
                            Delete class
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-text-secondary">
                    Delete class <span className="font-data font-semibold text-text">{selectedClass?.class_id}</span>? This action cannot be undone.
                </p>
            </Modal>
        </div>
    )
}
