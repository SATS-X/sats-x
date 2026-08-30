import PropTypes from 'prop-types'
import { HiOutlineMail, HiOutlinePhone, HiOutlineAcademicCap, HiOutlineBookOpen } from 'react-icons/hi'
import { Avatar, Badge, Button, Modal, StatusChip } from '../ui'

export default function StudentDetailModal({ isOpen, onClose, student }) {
    if (!student) return null

    const isActive = !student.status || student.status === 'active'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Student profile"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-card border border-border bg-surface-sunken p-4">
                    <Avatar name={student.name} size="lg" />
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-base font-semibold text-text">{student.name}</h3>
                            <StatusChip variant={isActive ? 'present' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</StatusChip>
                        </div>
                        <p className="font-data text-xs text-text-tertiary">MSSV: {student.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailField icon={HiOutlineAcademicCap} label="Class" value={student.grade || '—'} mono />
                    <DetailField icon={HiOutlineMail} label="Email" value={student.email || '—'} />
                    <DetailField icon={HiOutlinePhone} label="Phone number" value={student.phone || '—'} mono />
                </div>

                <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                        <HiOutlineBookOpen className="h-4 w-4" />
                        Enrolled subjects
                    </h4>
                    <div className="rounded-card border border-border bg-surface-sunken p-3">
                        {student.subjects && student.subjects !== '—' ? (
                            <div className="flex flex-wrap gap-1.5">
                                {student.subjects.split(',').map((subj) => (
                                    <Badge key={subj}>{subj.trim()}</Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-text-tertiary">No enrolled subjects</span>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

function DetailField({ icon: Icon, label, value, mono }) {
    return (
        <div className="space-y-1 rounded-card border border-border bg-surface-sunken p-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                <Icon className="h-4 w-4" />
                {label}
            </span>
            <div className={`truncate text-sm font-medium text-text ${mono ? 'font-data' : ''}`}>{value}</div>
        </div>
    )
}

DetailField.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    mono: PropTypes.bool
}

StudentDetailModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.object
}
