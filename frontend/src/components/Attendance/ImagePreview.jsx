import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { LuBookOpen, LuClock, LuGraduationCap } from 'react-icons/lu'
import { requestImageUrls } from '../../api/websocket/faceManagement'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Avatar, Button, Modal, StatusChip } from '../ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'On time', Late: 'Late', Absent: 'Absent' }

export default function ImagePreview({ isOpen, onClose, attendanceRecord }) {
    const ws = useWebSocket()
    const [imageUrl, setImageUrl] = useState(null)
    const imageKey = isOpen ? attendanceRecord?.image_key : null

    useEffect(() => {
        setImageUrl(null)
        if (!imageKey || !ws.isConnected) return undefined

        let active = true
        requestImageUrls(ws, [imageKey])
            .then((urls) => active && setImageUrl(urls[imageKey] ?? null))
            .catch((err) => console.warn('Could not load the capture image:', err.message))

        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageKey, ws.isConnected])

    if (!attendanceRecord) return null

    const { student_name: studentName, student_id: studentId, class_names: className, subject_name: subjectName, status, time, day, month, year, remark } = attendanceRecord

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Attendance details"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Avatar name={studentName} size="lg" />
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-text">{studentName}</h3>
                        <p className="font-data text-xs text-text-tertiary">{studentId}</p>
                    </div>
                    <StatusChip variant={REMARK_VARIANT[remark] || 'neutral'}>{REMARK_LABEL[remark] || remark}</StatusChip>
                </div>

                {imageUrl && <img src={imageUrl} alt={`Capture of ${studentName}`} className="max-h-72 w-full rounded-lg border border-border object-contain" />}

                <div className="text-sm">
                    <Row icon={LuBookOpen} label="Subject" value={subjectName || '—'} />
                    <Row icon={LuGraduationCap} label="Class" value={className || '—'} />
                    <Row icon={LuClock} label="Recorded at" value={`${status === 1 ? time : '—'} · ${day}/${month}/${year}`} />
                </div>
            </div>
        </Modal>
    )
}

function Row({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between border-t border-border py-2.5">
            <span className="flex items-center gap-1.5 text-text-tertiary">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
            </span>
            <span className="font-data font-medium text-text">{value}</span>
        </div>
    )
}

Row.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node
}

ImagePreview.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    attendanceRecord: PropTypes.object
}
