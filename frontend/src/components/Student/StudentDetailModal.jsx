import PropTypes from 'prop-types'
import { LuBookOpen, LuGraduationCap, LuMail, LuPhone } from 'react-icons/lu'
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
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Avatar name={student.name} size="lg" />
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-semibold tracking-[-0.02em] text-text">{student.name}</h3>
                        <p className="font-data text-xs text-text-tertiary">{student.id}</p>
                    </div>
                    <StatusChip variant={isActive ? 'present' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</StatusChip>
                </div>

                <div className="text-sm">
                    <DetailRow icon={LuGraduationCap} label="Class" value={student.grade || '—'} mono />
                    <DetailRow icon={LuMail} label="Email" value={student.email || '—'} />
                    <DetailRow icon={LuPhone} label="Phone number" value={student.phone || '—'} mono />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                    <h4 className="flex items-center gap-1.5 text-xs text-text-tertiary">
                        <LuBookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Enrolled subjects
                    </h4>
                    {student.subjects && student.subjects !== '—' ? (
                        <div className="flex flex-wrap gap-1.5">
                            {student.subjects.split(',').map((subj) => (
                                <Badge key={subj}>{subj.trim()}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-text-tertiary">No enrolled subjects</p>
                    )}
                </div>
            </div>
        </Modal>
    )
}

function DetailRow({ icon: Icon, label, value, mono }) {
    return (
        <div className="flex items-center justify-between gap-4 border-t border-border py-2.5">
            <span className="flex shrink-0 items-center gap-1.5 text-text-tertiary">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
            </span>
            <span className={`truncate font-medium text-text ${mono ? 'font-data' : ''}`}>{value}</span>
        </div>
    )
}

DetailRow.propTypes = {
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
