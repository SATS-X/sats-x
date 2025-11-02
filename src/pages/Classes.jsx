import { useEffect, useState } from 'react'
import {
    HiOutlinePlus,
    HiOutlineSearch,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineX,
    HiOutlineUsers
} from 'react-icons/hi'
import { getAllClasses, createClass, updateClass, deleteClass } from '../api/class/classApi'
import { useToast } from '../contexts/ToastContext'
import Modal from 'react-modal'

const Classes = () => {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const { showSuccess, showError } = useToast()

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedClass, setSelectedClass] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        class_id: '',
        name: '',
        number_of_students: 0,
        status: 1
    })

    const loadClasses = async () => {
        setLoading(true)
        try {
            const response = await getAllClasses()
            setClasses(response.data || [])
        } catch (error) {
            showError(error.message || 'Không thể tải danh sách lớp', 'Lỗi')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadClasses()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredClasses = classes.filter(
        (cls) =>
            cls.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.class_id?.toString().includes(searchTerm)
    )

    const handleOpenCreateModal = () => {
        setFormData({ class_id: '', name: '', number_of_students: 0, status: 1 })
        setIsCreateModalOpen(true)
    }

    const handleOpenEditModal = (cls) => {
        setSelectedClass(cls)
        setFormData({
            class_id: cls.class_id,
            name: cls.class_name,
            number_of_students: cls.number_of_students,
            status: cls.status
        })
        setIsEditModalOpen(true)
    }

    const handleOpenDeleteModal = (cls) => {
        setSelectedClass(cls)
        setIsDeleteModalOpen(true)
    }

    const handleCloseModals = () => {
        setIsCreateModalOpen(false)
        setIsEditModalOpen(false)
        setIsDeleteModalOpen(false)
        setSelectedClass(null)
        setFormData({ class_id: '', name: '', number_of_students: 0, status: 1 })
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'number_of_students' ? parseInt(value) || 0 : name === 'status' ? parseInt(value) : value
        }))
    }

    const handleCreateClass = async (e) => {
        e.preventDefault()
        if (!formData.class_id.trim()) {
            showError('Mã lớp không được để trống', 'Lỗi')
            return
        }
        if (!formData.name.trim()) {
            showError('Tên lớp không được để trống', 'Lỗi')
            return
        }

        setIsSubmitting(true)
        try {
            // Ensure number_of_students is 0 for new class
            const dataToSubmit = {
                ...formData,
                number_of_students: 0
            }
            await createClass(dataToSubmit)
            showSuccess('Tạo lớp học thành công', 'Thành công')
            handleCloseModals()
            loadClasses()
        } catch (error) {
            showError(error.message || 'Không thể tạo lớp học', 'Lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateClass = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            showError('Tên lớp không được để trống', 'Lỗi')
            return
        }

        setIsSubmitting(true)
        try {
            await updateClass(selectedClass.class_id, formData)
            showSuccess('Cập nhật lớp học thành công', 'Thành công')
            handleCloseModals()
            loadClasses()
        } catch (error) {
            showError(error.message || 'Không thể cập nhật lớp học', 'Lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClass = async () => {
        setIsSubmitting(true)
        try {
            await deleteClass(selectedClass.class_id)
            showSuccess('Xóa lớp học thành công', 'Thành công')
            handleCloseModals()
            loadClasses()
        } catch (error) {
            if (error.data?.student_count > 0) {
                showError(
                    `Không thể xóa lớp có ${error.data.student_count} sinh viên. Vui lòng xóa sinh viên trước.`,
                    'Lỗi'
                )
            } else {
                showError(error.message || 'Không thể xóa lớp học', 'Lỗi')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý lớp học</h1>
                    <p className="text-slate-600 mt-1">Quản lý thông tin các lớp học trong hệ thống</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <HiOutlinePlus className="text-lg" />
                    Thêm lớp học
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm lớp học..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="text-slate-600">Đang tải...</div>
                </div>
            )}

            {/* Classes Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClasses.map((cls) => (
                        <div
                            key={cls.class_id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <HiOutlineUsers className="text-xl text-slate-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{cls.class_name}</h3>
                                        <p className="text-sm text-slate-500">{cls.class_id}</p>
                                    </div>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                        cls.status === 1 || cls.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {cls.status === 1 || cls.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Sĩ số</span>
                                    <span className="font-semibold text-slate-900">{cls.number_of_students}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Hiện tại</span>
                                    <span className="font-semibold text-emerald-600">{cls.actual_student_count}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => handleOpenEditModal(cls)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                                >
                                    <HiOutlinePencil />
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleOpenDeleteModal(cls)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                >
                                    <HiOutlineTrash />
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredClasses.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <HiOutlineUsers className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-600">
                        {searchTerm ? 'Không tìm thấy lớp học nào' : 'Chưa có lớp học nào'}
                    </p>
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onRequestClose={handleCloseModals}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900">Thêm lớp học mới</h2>
                        <button onClick={handleCloseModals} className="text-slate-400 hover:text-slate-600">
                            <HiOutlineX className="text-2xl" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateClass} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Mã lớp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="class_id"
                                value={formData.class_id}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ví dụ: D22CQCI01-N"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tên lớp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Ví dụ: Internet Vạn Vật"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Sĩ số <span className="text-slate-500 text-xs">(Mặc định: 0)</span>
                            </label>
                            <input
                                type="number"
                                name="number_of_students"
                                value={0}
                                disabled
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Sĩ số sẽ tự động cập nhật khi thêm sinh viên</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value={1}>Hoạt động</option>
                                <option value={0}>Không hoạt động</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseModals}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang tạo...' : 'Tạo lớp'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onRequestClose={handleCloseModals}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900">Chỉnh sửa lớp học</h2>
                        <button onClick={handleCloseModals} className="text-slate-400 hover:text-slate-600">
                            <HiOutlineX className="text-2xl" />
                        </button>
                    </div>

                    <form onSubmit={handleUpdateClass} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tên lớp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sĩ số</label>
                            <input
                                type="number"
                                name="number_of_students"
                                value={formData.number_of_students}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value={1}>Hoạt động</option>
                                <option value={0}>Không hoạt động</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseModals}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onRequestClose={handleCloseModals}
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
                ariaHideApp={false}
            >
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <HiOutlineTrash className="text-2xl text-red-600" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xác nhận xóa lớp học</h3>

                        {selectedClass && (
                            <p className="text-slate-600 text-center mb-6">
                                Bạn có chắc chắn muốn xóa lớp <strong>{selectedClass.class_name}</strong>?
                                <br />
                                <span className="text-red-600 text-sm">Hành động này không thể hoàn tác.</span>
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModals}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteClass}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Classes
