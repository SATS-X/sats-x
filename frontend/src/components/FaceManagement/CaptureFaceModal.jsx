import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { LuCamera, LuImageUp, LuRotateCcw } from 'react-icons/lu'
import { addFace } from '../../api/faces/faceApi'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import CameraView from '../camera/CameraView'
import useCamera, { fileToJpeg } from '../camera/useCamera'
import { Button, Modal, Notice, Segmented } from '../ui'

const COUNTDOWN_SECONDS = 3

/** Chụp ảnh khuôn mặt bằng webcam (hoặc chọn ảnh có sẵn) và lưu làm mẫu nhận diện. */
export default function CaptureFaceModal({ isOpen, onClose, student, onSaved }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title={student ? `Add a face for ${student.full_name}` : 'Add a face'}
            description="Look straight at the camera in even light. Add 2–3 photos from slightly different angles for better recognition."
        >
            {/* Chỉ mount khi mở để camera tắt ngay khi đóng modal. */}
            {isOpen && student && <CaptureBody student={student} onSaved={onSaved} onClose={onClose} />}
        </Modal>
    )
}

function CaptureBody({ student, onSaved, onClose }) {
    const { showSuccess } = useToast()
    const [source, setSource] = useState('camera')
    const camera = useCamera({ autoStart: true })
    const [photo, setPhoto] = useState(null)
    const [countdown, setCountdown] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [conflict, setConflict] = useState(null)
    const fileRef = useRef(null)

    const reset = () => {
        setPhoto(null)
        setError(null)
        setConflict(null)
    }

    const startCountdown = () => {
        reset()
        let left = COUNTDOWN_SECONDS
        setCountdown(left)
        const timer = setInterval(() => {
            left -= 1
            if (left > 0) {
                setCountdown(left)
                return
            }
            clearInterval(timer)
            setCountdown(null)
            const frame = camera.capture()
            if (frame) setPhoto(frame)
            else setError('The camera is not ready yet.')
        }, 1000)
    }

    const pickFile = async (event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        reset()
        try {
            setPhoto(await fileToJpeg(file))
        } catch (err) {
            setError(err.message)
        }
    }

    const save = async (force = false) => {
        setSaving(true)
        setError(null)
        try {
            const res = await addFace(student.student_id, photo, { force })
            const flagged = res.liveness?.verdict === 'fake'
            showSuccess(flagged ? 'Saved. The anti-spoofing check flagged this photo, so check it is a real face.' : res.message, 'Face saved')
            onSaved?.()
            reset()
            if (source === 'upload') onClose()
        } catch (err) {
            const data = err?.response?.data
            if (data?.error === 'FaceBelongsToOther') setConflict(data.other)
            setError(apiErrorMessage(err, 'Could not save this face'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <Segmented
                label="Photo source"
                value={source}
                onChange={(value) => {
                    reset()
                    setSource(value)
                    if (value === 'camera') camera.start()
                    else camera.stop()
                }}
                options={[
                    { value: 'camera', label: 'Camera' },
                    { value: 'upload', label: 'Upload a photo' }
                ]}
            />

            {source === 'camera' && !photo && (
                <CameraView camera={camera} className="aspect-video w-full">
                    {countdown !== null && (
                        <div className="absolute inset-0 grid place-items-center bg-black/30">
                            <span className="font-data text-7xl font-semibold text-white" aria-live="assertive">
                                {countdown}
                            </span>
                        </div>
                    )}
                    {camera.status === 'ready' && (
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
                            <div className="h-[70%] aspect-[3/4] rounded-[45%] border-2 border-dashed border-white/50" />
                        </div>
                    )}
                </CameraView>
            )}

            {source === 'upload' && !photo && (
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-sunken text-sm text-text-secondary transition-colors hover:bg-surface-hover"
                >
                    <LuImageUp className="h-6 w-6" aria-hidden="true" />
                    Choose a JPEG or PNG photo
                </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />

            {photo && <img src={photo} alt={`Captured face of ${student.full_name}`} className="aspect-video w-full rounded-xl bg-black object-contain" />}

            {error && (
                <Notice>
                    {error}
                    {conflict && ' If this really is the same person registered twice, delete the other record first.'}
                </Notice>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
                {photo ? (
                    <>
                        <Button variant="ghost" onClick={reset} disabled={saving}>
                            <LuRotateCcw className="h-4 w-4" aria-hidden="true" />
                            Retake
                        </Button>
                        {conflict && (
                            <Button variant="danger" onClick={() => save(true)} loading={saving}>
                                Save anyway
                            </Button>
                        )}
                        {!conflict && (
                            <Button onClick={() => save(false)} loading={saving}>
                                Save face
                            </Button>
                        )}
                    </>
                ) : source === 'camera' ? (
                    <Button onClick={startCountdown} disabled={camera.status !== 'ready' || countdown !== null}>
                        <LuCamera className="h-4 w-4" aria-hidden="true" />
                        Take photo
                    </Button>
                ) : null}
            </div>
        </div>
    )
}

CaptureBody.propTypes = {
    student: PropTypes.object.isRequired,
    onSaved: PropTypes.func,
    onClose: PropTypes.func.isRequired
}

CaptureFaceModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.object,
    onSaved: PropTypes.func
}
