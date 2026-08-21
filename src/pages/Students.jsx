import { useEffect, useMemo, useState } from 'react'
import { HiOutlinePlus, HiOutlineRefresh, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi'
import { RiFingerprintLine } from 'react-icons/ri'
import { getAllStudents } from '../api/student/getStudent'
import { getClasses } from '../api/class/getClasses'
import { deleteStudent } from '../api/student/deleteStudent'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import StudentDetailModal from '../components/Student/StudentDetailModal'
import AddFaceModal from '../components/FaceManagement/AddFaceModal'
import {
    Avatar,
    Badge,
    Button,
    EmptyState,
    Modal,
    PageHeader,
    SearchInput,
    Select,
    Spinner,
    Table,
    TBody,
    TD,
    TH,
    THead,
    TR
} from '../components/ui'

export default function Students() {
    const { t } = useLanguage()
    const { showSuccess, showError } = useToast()

    const [students, setStudents] = useState([])
    const [classesList, setClassesList] = useState([])
    const [loading, setLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')

    const [detailModalOpen, setDetailModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [studentToDelete, setStudentToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [addFaceModalOpen, setAddFaceModalOpen] = useState(false)

    const fetchStudentsData = async () => {
        setLoading(true)
        try {
            const [studentsRes, classesRes] = await Promise.allSettled([getAllStudents(), getClasses()])

            if (studentsRes.status === 'fulfilled' && studentsRes.value?.success) {
                setStudents(
                    (studentsRes.value.data || []).map((s) => ({
                        id: s.student_id,
                        name: s.full_name,
                        grade: s.class_names || null,
                        email: s.email,
                        phone: s.phone_number,
                        subjects: s.subject_names || null,
                        status: s.status || 'active'
                    }))
                )
            }

            if (classesRes.status === 'fulfilled' && classesRes.value?.success) {
                setClassesList(classesRes.value.data || [])
            }
        } catch (err) {
            console.warn('Failed to load students:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudentsData()
    }, [])

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const search = searchTerm.toLowerCase()
            const matchesSearch =
                !searchTerm || s.name?.toLowerCase().includes(search) || s.id?.toLowerCase().includes(search)
            const matchesClass = selectedClass === 'all' || (s.grade && s.grade.includes(selectedClass))
            return matchesSearch && matchesClass
        })
    }, [students, searchTerm, selectedClass])

    const handleDeleteStudent = async () => {
        if (!studentToDelete) return
        setIsDeleting(true)
        try {
            await deleteStudent(studentToDelete.id)
            showSuccess(`Đã xóa sinh viên ${studentToDelete.name}`, 'Thành công')
            setDeleteModalOpen(false)
            fetchStudentsData()
        } catch (err) {
            showError(err.response?.data?.message || err.message || 'Không thể xóa sinh viên', 'Lỗi')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <span className="inline-flex items-center gap-2.5">
                        {t('studentsManagement')}
                        <Badge>{filteredStudents.length} sinh viên</Badge>
                    </span>
                }
                description={t('studentsManagementDesc')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchStudentsData}>
                            <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                            Làm mới
                        </Button>
                        <Button size="sm" onClick={() => setAddFaceModalOpen(true)}>
                            <HiOutlinePlus className="h-4 w-4" />
                            Thêm sinh viên / Face ID
                        </Button>
                    </>
                }
            />

            <div className="flex flex-col gap-3 sm:flex-row">
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm theo họ tên, MSSV..."
                    className="flex-1"
                />
                <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="sm:w-60">
                    <option value="all">Tất cả các lớp</option>
                    {classesList.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                            {c.class_id} — {c.class_name}
                        </option>
                    ))}
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Đang tải danh sách sinh viên...
                </div>
            ) : filteredStudents.length === 0 ? (
                <EmptyState title="Không tìm thấy sinh viên nào" />
            ) : (
                <Table>
                    <THead>
                        <TH>Sinh viên</TH>
                        <TH>Lớp</TH>
                        <TH>Liên hệ</TH>
                        <TH>Khuôn mặt</TH>
                        <TH className="text-right">Thao tác</TH>
                    </THead>
                    <TBody>
                        {filteredStudents.map((student) => (
                            <TR key={student.id}>
                                <TD>
                                    <div className="flex items-center gap-3">
                                        <Avatar name={student.name} size="sm" />
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-text">{student.name}</div>
                                            <div className="font-data text-xs text-text-tertiary">{student.id}</div>
                                        </div>
                                    </div>
                                </TD>
                                <TD>{student.grade ? <Badge className="font-data">{student.grade}</Badge> : '—'}</TD>
                                <TD>
                                    <div className="text-text-secondary">{student.email || '—'}</div>
                                    <div className="font-data text-xs text-text-tertiary">{student.phone || '—'}</div>
                                </TD>
                                <TD>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                                        <RiFingerprintLine className="h-4 w-4" />
                                        Xem tại Quản lý khuôn mặt
                                    </span>
                                </TD>
                                <TD>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student)
                                                setDetailModalOpen(true)
                                            }}
                                            title="Xem chi tiết"
                                            className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text"
                                        >
                                            <HiOutlineEye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setStudentToDelete(student)
                                                setDeleteModalOpen(true)
                                            }}
                                            title="Xóa sinh viên"
                                            className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                                        >
                                            <HiOutlineTrash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            )}

            <StudentDetailModal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} student={selectedStudent} />

            <AddFaceModal isOpen={addFaceModalOpen} onClose={() => setAddFaceModalOpen(false)} onAdded={fetchStudentsData} />

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác nhận xóa sinh viên"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                            Hủy
                        </Button>
                        <Button variant="danger" onClick={handleDeleteStudent} loading={isDeleting}>
                            Xóa sinh viên
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                        Bạn có chắc chắn muốn xóa sinh viên <span className="font-semibold text-text">{studentToDelete?.name}</span> (
                        <span className="font-data">{studentToDelete?.id}</span>) khỏi hệ thống?
                    </p>
                    <div className="rounded-card border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
                        Hành động này sẽ xóa sinh viên khỏi tất cả danh sách lớp và môn học liên quan.
                    </div>
                </div>
            </Modal>
        </div>
    )
}
