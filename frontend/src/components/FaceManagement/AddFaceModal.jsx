import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineCloudUpload } from 'react-icons/hi'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useToast } from '../../contexts/ToastContext'
import {
    requestUploadUrl,
    addFaceFromS3,
    addFaceInline,
    WS_INLINE_IMAGE_MAX_BASE64
} from '../../api/websocket/faceManagement'
import { createStudent } from '../../api/student/createStudent'
import { compressImage, prepareImageForUpload } from '../../lib/image'
import { Button, Field, Input, Modal, Select, Spinner } from '../ui'

// Ảnh đi qua S3 nên không bị bó vào giới hạn frame của WebSocket. Ngưỡng để
// rộng rãi để ảnh JPEG chụp bằng điện thoại đi thẳng lên S3 không qua canvas —
// mã hoá lại là lúc ICC profile bị vứt và màu bị nhạt đi so với ảnh gốc.
const S3_MAX_DIMENSION = 4096
const S3_MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// Đường dự phòng nhúng thẳng base64 vào frame: phải chui lọt 32KB/frame.
const INLINE_MAX_DIMENSION = 640

const STAGE_LABEL = {
    creating: 'Creating student record…',
    compressing: 'Optimizing image…',
    uploading: 'Uploading image to S3…',
    indexing: 'Indexing with AWS Rekognition…',
    fallback: 'S3 unavailable. Sending a compressed image over WebSocket…'
}

export default function AddFaceModal({
    isOpen,
    onClose,
    defaultClassId = 'D22CQCI01-N',
    onAdded,
    withStudentRecord = false
}) {
    const ws = useWebSocket()
    const { isConnected } = ws
    const { showSuccess, showError, showInfo } = useToast()

    const [classId, setClassId] = useState(defaultClassId)
    const [studentId, setStudentId] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [imagePreview, setImagePreview] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const [stage, setStage] = useState(null)
    const fileInputRef = useRef(null)
    const mountedRef = useRef(true)
    const previewUrlRef = useRef(null)

    // Object URL sống tới khi bị revoke — không thu hồi bản cũ mỗi lần đổi ảnh
    // thì blob gốc (có thể vài MB) bị giữ lại trong bộ nhớ suốt phiên làm việc.
    const setPreviewFrom = (file) => {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = file ? URL.createObjectURL(file) : null
        setImagePreview(previewUrlRef.current)
    }

    const isSubmitting = stage !== null

    useEffect(() => {
        if (isOpen) setClassId(defaultClassId)
    }, [isOpen, defaultClassId])

    // Sau khi modal unmount giữa chừng (đóng tay, điều hướng trang...) thì các
    // promise còn bay vẫn resolve — chặn setState ở đây để không cảnh báo update
    // trên component đã biến mất.
    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        }
    }, [])

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            showError('Choose a JPG or PNG image', 'Invalid format')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            showError('Maximum image size is 10 MB', 'Image too large')
            return
        }

        // Preview trỏ thẳng vào file gốc. Trước đây chỗ này vẽ lại qua canvas rồi
        // xuất JPEG — mà canvas thì vứt ICC profile, nên ảnh chụp bằng máy ảnh/
        // điện thoại hiện lên đã nhạt màu sẵn dù file gốc vẫn nguyên vẹn.
        setPreviewFrom(file)
        setImageFile(file)
    }

    /**
     * Đường chính: xin presigned URL → PUT thẳng lên S3 → chỉ gửi s3Key qua
     * WebSocket. Trả về false nếu hạ tầng chưa sẵn sàng (route getUploadUrl chưa
     * deploy, CORS bucket chưa mở) để chỗ gọi rơi xuống đường dự phòng.
     */
    const uploadViaS3 = async (trimmedStudentId) => {
        let uploadUrl = null
        let s3Key = null

        try {
            const res = await requestUploadUrl(ws, { classId, studentId: trimmedStudentId })
            uploadUrl = res?.uploadUrl
            s3Key = res?.s3Key
        } catch (err) {
            if (err.code === 'NOT_CONNECTED') throw err
            return false
        }
        if (!uploadUrl || !s3Key) return false

        setStage('compressing')
        const { blob } = await prepareImageForUpload(imageFile, {
            maxDimension: S3_MAX_DIMENSION,
            maxBytes: S3_MAX_UPLOAD_BYTES
        })

        setStage('uploading')
        try {
            const putResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': 'image/jpeg' }
            })
            if (!putResponse.ok) return false
        } catch {
            // Lỗi mạng hoặc CORS bucket chưa cho phép origin này.
            return false
        }

        setStage('indexing')
        return addFaceFromS3(ws, { classId, studentId: trimmedStudentId, s3Key })
    }

    /** Dự phòng: nhúng base64 vào frame, bắt buộc phải < 32KB. */
    const uploadInline = async (trimmedStudentId) => {
        setStage('fallback')
        const { base64, withinBudget } = await compressImage(imageFile, {
            maxDimension: INLINE_MAX_DIMENSION,
            maxBase64Length: WS_INLINE_IMAGE_MAX_BASE64
        })
        if (!withinBudget) {
            throw new Error('The image is still too large for WebSocket. Choose another image.')
        }

        setStage('indexing')
        return addFaceInline(ws, { classId, studentId: trimmedStudentId, image: base64 })
    }

    /**
     * Đăng ký khuôn mặt chỉ ghi vào Rekognition + S3, hoàn toàn không đụng tới
     * Postgres — nên nếu bỏ qua bước này thì trang Học sinh (đọc từ GET
     * /api/student) vẫn trống trơn dù Face ID đã đăng ký xong.
     */
    const createStudentRecord = async (trimmedStudentId) => {
        setStage('creating')
        const payload = {
            student_id: trimmedStudentId,
            full_name: fullName.trim(),
            email: email.trim() || undefined,
            phone_number: phone.trim() || undefined,
            class_id: classId
        }

        try {
            await createStudent(payload)
        } catch (err) {
            const status = err.response?.status
            if (status === 409) {
                // Sinh viên đã có sẵn — người dùng chỉ đang bổ sung/chụp lại khuôn mặt.
                showInfo(`Student ${trimmedStudentId} already exists. Only the face record will be updated.`, 'Student record')
                return
            }
            if (status === 404) {
                // Lớp chưa tồn tại trong CSDL (collection Rekognition và bảng class
                // là hai nơi độc lập). Vẫn tạo sinh viên, chỉ là chưa gắn lớp —
                // tốt hơn là chặn toàn bộ thao tác lại.
                await createStudent({ ...payload, class_id: undefined })
                showInfo(`Class ${classId} does not exist in the database. The student was created without a class.`, 'Student record')
                return
            }
            throw new Error(err.response?.data?.message || err.message || 'Could not create student record')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const trimmedStudentId = studentId.trim()

        if (!trimmedStudentId || !imageFile) {
            showError('Enter a student ID and choose a face image', 'Missing information')
            return
        }
        if (withStudentRecord && !fullName.trim()) {
            showError('Enter the student’s full name', 'Missing information')
            return
        }
        if (!isConnected) {
            showError('WebSocket is not connected to AWS Gateway', 'Connection unavailable')
            return
        }

        setStage('compressing')

        try {
            if (withStudentRecord) {
                await createStudentRecord(trimmedStudentId)
            }

            let result = await uploadViaS3(trimmedStudentId)

            if (result === false) {
                showInfo('S3 is unavailable. SATS X will send a compressed image over WebSocket.', 'Face registration')
                result = await uploadInline(trimmedStudentId)
            }

            if (!mountedRef.current) return
            showSuccess(
                withStudentRecord
                    ? `Student ${trimmedStudentId} added and Face ID registered`
                    : `Face ID registered for student ${trimmedStudentId}`,
                withStudentRecord ? 'Success' : 'AWS Rekognition'
            )
            onAdded?.(result)
            handleClose()
        } catch (err) {
            if (!mountedRef.current) return
            setStage(null)
            // NOT_CONNECTED đã được sendMessage trong WebSocketContext báo rồi —
            // báo thêm lần nữa ở đây thành hai toast cho cùng một sự cố.
            if (err.code === 'NOT_CONNECTED') return
            const title = err.code === 'TIMEOUT' ? 'Request timed out' : 'Face registration error'
            showError(err.message || 'Could not extract a face from the image', title)
        }
    }

    const handleClose = () => {
        setStudentId('')
        setFullName('')
        setEmail('')
        setPhone('')
        setPreviewFrom(null)
        setImageFile(null)
        setStage(null)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={withStudentRecord ? 'Add student and register Face ID' : 'Register student face'}
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" form="add-face-form" loading={isSubmitting} disabled={!imageFile || !studentId}>
                        {withStudentRecord ? 'Add student and index' : 'Save and index'}
                    </Button>
                </>
            }
        >
            <form id="add-face-form" onSubmit={handleSubmit} className="space-y-4">
                <Field label="Class / collection">
                    <Select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={isSubmitting}>
                        <option value="D22CQCI01-N">D22CQCI01-N</option>
                        <option value="D22CQCI01-B">D22CQCI01-B</option>
                        <option value="D22CQVT01-N">D22CQVT01-N</option>
                    </Select>
                </Field>

                <Field label="Student ID" required>
                    <Input
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Example: STU-2026-001"
                        className="font-data"
                        disabled={isSubmitting}
                    />
                </Field>

                {withStudentRecord && (
                    <>
                        <Field label="Full name" required>
                            <Input
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Example: Alex Morgan"
                                disabled={isSubmitting}
                            />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Email">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="student@organization.edu"
                                    disabled={isSubmitting}
                                />
                            </Field>
                            <Field label="Phone number">
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="09xxxxxxxx"
                                    className="font-data"
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>
                    </>
                )}

                <Field label="Front-facing photo" required>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />

                    {imagePreview ? (
                        <div className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface-sunken p-3">
                            <div className="flex items-center gap-3">
                                <img src={imagePreview} alt="Selected face preview" className="h-14 w-14 rounded-card border border-border object-cover" />
                                <div>
                                    <div className="text-xs font-medium text-text">Image selected</div>
                                    <div className="text-[11px] text-present">Ready for AI indexing</div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setPreviewFrom(null)
                                    setImageFile(null)
                                }}
                            >
                                Choose another
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full rounded-card border border-dashed border-border-strong bg-surface-sunken p-6 text-center transition-colors hover:border-accent hover:bg-surface-hover"
                        >
                            <HiOutlineCloudUpload className="mx-auto h-6 w-6 text-text-tertiary" />
                            <div className="mt-2 text-xs font-medium text-text">Choose an image or drop it here</div>
                            <div className="mt-0.5 text-[11px] text-text-tertiary">JPG or PNG · up to 10 MB · clear face and even light</div>
                        </button>
                    )}
                </Field>

                {stage && (
                    <div className="flex items-center gap-2 rounded-card border border-border bg-surface-sunken px-3 py-2 text-[11px] text-text-secondary">
                        <Spinner size="sm" />
                        <span>{STAGE_LABEL[stage]}</span>
                    </div>
                )}
            </form>
        </Modal>
    )
}

AddFaceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    defaultClassId: PropTypes.string,
    onAdded: PropTypes.func,
    withStudentRecord: PropTypes.bool
}
