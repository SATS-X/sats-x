import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    HiOutlinePlus,
    HiOutlineRefresh,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineUsers
} from 'react-icons/hi'
import { RiFingerprintLine } from 'react-icons/ri'
import { getClasses, createClass, updateClass, deleteClass } from '../api/class/getClasses'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, SearchInput, Spinner, StatusChip } from '../components/ui'

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
            showError(err.message || 'Không thể tải danh sách lớp', 'Lỗi')
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
                showSuccess('Đã thêm lớp học mới', 'Thành công')
            } else if (modalMode === 'edit') {
                await updateClass(selectedClass.class_id, formData)
                showSuccess('Đã cập nhật thông tin lớp', 'Thành công')
            }
            setModalMode(null)
            fetchClasses()
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Thao tác thất bại', 'Lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedClass) return
        setIsSubmitting(true)
        try {
            await deleteClass(selectedClass.class_id)
            showSuccess('Đã xóa lớp học', 'Thành công')
            setModalMode(null)
            fetchClasses()
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Không thể xóa lớp', 'Lỗi')
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
                title={
                    <span className="inline-flex items-center gap-2.5">
                        {t('classesManagement')}
                        <Badge>{filteredClasses.length} lớp</Badge>
                    </span>
                }
                description={t('classesManagementDesc')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchClasses}>
                            <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                            Làm mới
                        </Button>
                        <Button size="sm" onClick={handleOpenCreate}>
                            <HiOutlinePlus className="h-4 w-4" />
                            Tạo lớp mới
                        </Button>
                    </>
                }
            />

            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo mã lớp, tên lớp..."
                className="max-w-md"
            />

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Đang tải danh sách lớp học...
                </div>
            ) : filteredClasses.length === 0 ? (
                <EmptyState title="Không tìm thấy lớp học nào" />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map((cls) => (
                        <div key={cls.class_id} className="flex flex-col justify-between rounded-card border border-border bg-surface p-5">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-data truncate text-base font-semibold text-text">{cls.class_id}</h3>
                                        <p className="mt-0.5 truncate text-xs text-text-secondary">{cls.class_name}</p>
                                    </div>
                                    <StatusChip variant={cls.status === 'active' || !cls.status ? 'active' : 'neutral'}>
                                        {cls.status || 'active'}
                                    </StatusChip>
                                </div>

                                <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface-sunken p-3 text-xs">
                                    <div>
                                        <span className="font-data text-[10px] uppercase text-text-tertiary">Sinh viên</span>
                                        <div className="mt-0.5 flex items-center gap-1.5 font-medium text-text">
                                            <HiOutlineUsers className="h-3.5 w-3.5 text-text-tertiary" />
                                            {cls.actual_student_count ?? cls.number_of_students ?? 0}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-data text-[10px] uppercase text-text-tertiary">Rekognition</span>
                                        <div className="mt-0.5 flex items-center gap-1.5 font-medium text-present">
                                            <RiFingerprintLine className="h-3.5 w-3.5" />
                                            Đã liên kết
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                                <Link
                                    to="/face-management"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                                >
                                    <RiFingerprintLine className="h-3.5 w-3.5" />
                                    Quản lý khuôn mặt
                                </Link>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEdit(cls)}
                                        title="Chỉnh sửa"
                                        className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
                                    >
                                        <HiOutlinePencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleOpenDelete(cls)}
                                        title="Xóa lớp"
                                        className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={modalMode === 'create' || modalMode === 'edit'}
                onClose={() => setModalMode(null)}
                title={modalMode === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa lớp học'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalMode(null)}>
                            Hủy
                        </Button>
                        <Button type="submit" form="class-form" loading={isSubmitting}>
                            Lưu thông tin
                        </Button>
                    </>
                }
            >
                <form id="class-form" onSubmit={handleSubmitForm} className="space-y-4">
                    <Field label="Mã lớp" required>
                        <Input
                            required
                            disabled={modalMode === 'edit'}
                            value={formData.class_id}
                            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                            placeholder="Ví dụ: D22CQCI01-N"
                            className="font-data"
                        />
                    </Field>
                    <Field label="Tên lớp" required>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Công nghệ Thông tin 01 CLC"
                        />
                    </Field>
                </form>
            </Modal>

            <Modal
                isOpen={modalMode === 'delete'}
                onClose={() => setModalMode(null)}
                title="Xác nhận xóa lớp"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalMode(null)}>
                            Hủy
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm} loading={isSubmitting}>
                            Xác nhận xóa
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-text-secondary">
                    Bạn có chắc chắn muốn xóa lớp{' '}
                    <span className="font-data font-semibold text-text">{selectedClass?.class_id}</span>? Thao tác này
                    không thể hoàn tác.
                </p>
            </Modal>
        </div>
    )
}
