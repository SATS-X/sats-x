import PropTypes from 'prop-types'
import Modal from 'react-modal'
import { HiOutlineX } from 'react-icons/hi'

const StudentDetailModal = ({ isOpen, onClose, student }) => {
    if (!student) return null

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
            ariaHideApp={false}
        >
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Thông tin sinh viên</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <HiOutlineX className="text-2xl" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Basic Info */}
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
                        <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                            {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                            <p className="text-slate-600">{student.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {student.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                        </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Lớp</p>
                            <p className="font-semibold text-slate-900">{student.grade}</p>
                        </div>
                        
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Tỷ lệ điểm danh</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div 
                                        className="bg-emerald-500 h-2 rounded-full" 
                                        style={{ width: `${student.attendance_rate}%` }}
                                    ></div>
                                </div>
                                <span className="font-semibold text-slate-900">{student.attendance_rate}%</span>
                            </div>
                        </div>
                        
                        <div className="col-span-2">
                            <p className="text-sm text-slate-500 mb-1">Email</p>
                            <p className="font-medium text-slate-900 break-all">{student.email}</p>
                        </div>
                        
                        <div className="col-span-2">
                            <p className="text-sm text-slate-500 mb-1">Số điện thoại</p>
                            <p className="font-medium text-slate-900">{student.phone}</p>
                        </div>
                    </div>

                    {/* Subjects */}
                    <div>
                        <p className="text-sm text-slate-500 mb-3">Môn học đang học</p>
                        <div className="flex flex-wrap gap-2">
                            {(student.subjects && student.subjects !== '—' 
                                ? student.subjects.split(',') 
                                : []
                            ).map((subj, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                    {subj.trim()}
                                </span>
                            ))}
                            {(!student.subjects || student.subjects === '—') && (
                                <span className="text-slate-500 text-sm">Chưa đăng ký môn học</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end px-6 py-4 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </Modal>
    )
}

StudentDetailModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        grade: PropTypes.string,
        email: PropTypes.string,
        phone: PropTypes.string,
        subjects: PropTypes.string,
        attendance_rate: PropTypes.number,
        status: PropTypes.string
    })
}

export default StudentDetailModal
