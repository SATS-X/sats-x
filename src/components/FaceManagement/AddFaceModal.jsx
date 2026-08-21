import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineCloudUpload } from 'react-icons/hi'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useToast } from '../../contexts/ToastContext'
import { addFace } from '../../api/websocket/faceManagement'
import { Button, Field, Input, Modal, Select } from '../ui'

export default function AddFaceModal({ isOpen, onClose, defaultClassId = 'D22CQCI01-N', onAdded }) {
    const { sendMessage, subscribe, isConnected } = useWebSocket()
    const { showSuccess, showError } = useToast()

    const [classId, setClassId] = useState(defaultClassId)
    const [studentId, setStudentId] = useState('')
    const [imagePreview, setImagePreview] = useState(null)
    const [imageBase64, setImageBase64] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) setClassId(defaultClassId)
    }, [isOpen, defaultClassId])

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            showError('Vui lòng chọn file hình ảnh (JPG, PNG)', 'Định dạng không hợp lệ')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            showError('Kích thước ảnh tối đa 5MB', 'Ảnh quá lớn')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result
            setImagePreview(base64String)
            setImageBase64(base64String.split(',')[1] || base64String)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!studentId.trim() || !imageBase64) {
            showError('Vui lòng nhập mã sinh viên và chọn ảnh khuôn mặt', 'Thiếu thông tin')
            return
        }
        if (!isConnected) {
            showError('WebSocket chưa kết nối tới AWS Gateway', 'Mất kết nối')
            return
        }

        setIsSubmitting(true)

        const unsubscribe = subscribe('addFace', (res) => {
            setIsSubmitting(false)
            if (res?.status === 'success') {
                showSuccess(`Đã đăng ký Face ID cho sinh viên ${studentId}`, 'AWS Rekognition')
                onAdded?.(res)
                handleClose()
            } else {
                showError(res?.message || 'Không thể trích xuất khuôn mặt từ ảnh', 'Lỗi Rekognition')
            }
            unsubscribe()
        })

        const sent = addFace({ sendMessage }, { classId, studentId: studentId.trim(), image: imageBase64 })

        if (!sent) {
            setIsSubmitting(false)
            unsubscribe()
        }

        setTimeout(() => {
            setIsSubmitting((current) => {
                if (current) unsubscribe()
                return false
            })
        }, 15000)
    }

    const handleClose = () => {
        setStudentId('')
        setImagePreview(null)
        setImageBase64('')
        setIsSubmitting(false)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Đăng ký khuôn mặt sinh viên"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose}>
                        Hủy
                    </Button>
                    <Button type="submit" form="add-face-form" loading={isSubmitting} disabled={!imageBase64 || !studentId}>
                        Lưu & lập chỉ mục
                    </Button>
                </>
            }
        >
            <form id="add-face-form" onSubmit={handleSubmit} className="space-y-4">
                <Field label="Lớp học / bộ sưu tập">
                    <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                        <option value="D22CQCI01-N">D22CQCI01-N</option>
                        <option value="D22CQCI01-B">D22CQCI01-B</option>
                        <option value="D22CQVT01-N">D22CQVT01-N</option>
                    </Select>
                </Field>

                <Field label="Mã sinh viên (MSSV)" required>
                    <Input
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Ví dụ: B22DCCN001"
                        className="font-data"
                    />
                </Field>

                <Field label="Ảnh khuôn mặt trực diện" required>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />

                    {imagePreview ? (
                        <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface-sunken p-3">
                            <div className="flex items-center gap-3">
                                <img src={imagePreview} alt="Xem trước" className="h-14 w-14 rounded-card border border-border object-cover" />
                                <div>
                                    <div className="text-xs font-medium text-text">Ảnh đã chọn</div>
                                    <div className="text-[11px] text-present">Sẵn sàng lập chỉ mục AI</div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setImagePreview(null)
                                    setImageBase64('')
                                }}
                            >
                                Chọn lại
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full rounded-card border border-dashed border-border-strong bg-surface-sunken p-6 text-center transition-colors hover:border-accent hover:bg-surface-hover"
                        >
                            <HiOutlineCloudUpload className="mx-auto h-6 w-6 text-text-tertiary" />
                            <div className="mt-2 text-xs font-medium text-text">Nhấn để tải ảnh hoặc kéo thả vào đây</div>
                            <div className="mt-0.5 text-[11px] text-text-tertiary">JPG, PNG · tối đa 5MB · rõ mặt, đủ sáng</div>
                        </button>
                    )}
                </Field>
            </form>
        </Modal>
    )
}

AddFaceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    defaultClassId: PropTypes.string,
    onAdded: PropTypes.func
}
