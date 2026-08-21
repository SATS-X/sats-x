import PropTypes from 'prop-types'
import { HiOutlineAcademicCap, HiOutlineClock } from 'react-icons/hi'
import { Avatar, Button, Modal, StatusChip } from '../ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'Đúng giờ', Late: 'Trễ', Absent: 'Vắng' }

export default function ImagePreview({ isOpen, onClose, attendanceRecord }) {
    if (!attendanceRecord) return null

    const { student_name: studentName, student_id: studentId, class_names: className, time, day, month, year, remark } =
        attendanceRecord

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Chi tiết điểm danh"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Đóng
                </Button>
            }
        >
            <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-card border border-border bg-surface-sunken p-4">
                    <Avatar name={studentName} size="lg" />
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold text-text">{studentName}</h3>
                        <p className="font-data text-xs text-text-tertiary">{studentId}</p>
                    </div>
                    <StatusChip variant={REMARK_VARIANT[remark] || 'neutral'}>{REMARK_LABEL[remark] || remark}</StatusChip>
                </div>

                <div className="space-y-2 text-sm">
                    <Row icon={HiOutlineAcademicCap} label="Lớp học" value={className || '—'} mono />
                    <Row icon={HiOutlineClock} label="Thời gian ghi nhận" value={`${time || '—'} · ${day}/${month}/${year}`} mono />
                </div>
            </div>
        </Modal>
    )
}

function Row({ icon: Icon, label, value, mono }) {
    return (
        <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
            <span className="flex items-center gap-1.5 text-text-tertiary">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <span className={`font-medium text-text ${mono ? 'font-data' : ''}`}>{value}</span>
        </div>
    )
}

Row.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    mono: PropTypes.bool
}

ImagePreview.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    attendanceRecord: PropTypes.object
}
