import PropTypes from 'prop-types'
import { LuClock, LuGraduationCap } from 'react-icons/lu'
import { Avatar, Button, Modal, StatusChip } from '../ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'On time', Late: 'Late', Absent: 'Absent' }

export default function ImagePreview({ isOpen, onClose, attendanceRecord }) {
    if (!attendanceRecord) return null

    const { student_name: studentName, student_id: studentId, class_names: className, time, day, month, year, remark } = attendanceRecord

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

                <div className="text-sm">
                    <Row icon={LuGraduationCap} label="Class" value={className || '—'} />
                    <Row icon={LuClock} label="Recorded at" value={`${time || '—'} · ${day}/${month}/${year}`} />
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
