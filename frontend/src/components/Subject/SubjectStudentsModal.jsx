import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { addSubjectStudents, getSubjectStudents, removeSubjectStudent } from '../../api/subject/getSubject'
import { getAllStudents } from '../../api/student/getStudent'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import { Button, IconButton, LoadingState, Modal, Select } from '../ui'

/** Sinh viên học riêng môn này, ngoài những sinh viên đã có qua lớp được gán. */
export default function SubjectStudentsModal({ isOpen, onClose, subject, onChanged }) {
    const { showError } = useToast()
    const [enrolled, setEnrolled] = useState([])
    const [allStudents, setAllStudents] = useState([])
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(false)
    const [busy, setBusy] = useState(false)

    const subjectId = subject?.subject_id

    const load = async () => {
        const res = await getSubjectStudents(subjectId)
        setEnrolled(res?.students ?? [])
    }

    useEffect(() => {
        if (!isOpen || !subjectId) return undefined

        let active = true
        setLoading(true)
        setSelectedId('')
        Promise.all([getSubjectStudents(subjectId), getAllStudents()])
            .then(([enrolledRes, studentsRes]) => {
                if (!active) return
                setEnrolled(enrolledRes?.students ?? [])
                setAllStudents(studentsRes?.data ?? [])
            })
            .catch((err) => active && showError(apiErrorMessage(err, 'Could not load students'), 'Error'))
            .finally(() => active && setLoading(false))

        return () => {
            active = false
        }
    }, [isOpen, subjectId, showError])

    const run = async (action) => {
        setBusy(true)
        try {
            await action()
            await load()
            onChanged()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not update the subject roster'), 'Error')
        } finally {
            setBusy(false)
        }
    }

    const enrolledIds = new Set(enrolled.map((s) => s.student_id))
    const available = allStudents.filter((s) => !enrolledIds.has(s.student_id))

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Additional students"
            description={subject ? `${subject.name} · students outside the assigned classes` : undefined}
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Done
                </Button>
            }
        >
            {loading ? (
                <LoadingState label="Loading students..." />
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Select aria-label="Student to add" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="flex-1">
                            <option value="">Select a student</option>
                            {available.map((s) => (
                                <option key={s.student_id} value={s.student_id}>
                                    {s.student_id} — {s.full_name}
                                </option>
                            ))}
                        </Select>
                        <Button
                            size="sm"
                            className="h-9"
                            disabled={!selectedId || busy}
                            onClick={() =>
                                run(async () => {
                                    await addSubjectStudents(subjectId, [selectedId])
                                    setSelectedId('')
                                })
                            }
                        >
                            <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Add
                        </Button>
                    </div>

                    {enrolled.length === 0 ? (
                        <p className="text-xs text-text-tertiary">No additional students. Students from assigned classes are included automatically.</p>
                    ) : (
                        <div className="divide-y divide-border rounded-lg border border-border">
                            {enrolled.map((s) => (
                                <div key={s.student_id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-medium text-text">{s.full_name}</p>
                                        <p className="font-data text-[11px] text-text-tertiary">{s.student_id}</p>
                                    </div>
                                    <IconButton
                                        icon={LuTrash2}
                                        label={`Remove ${s.full_name}`}
                                        tone="danger"
                                        disabled={busy}
                                        onClick={() => run(() => removeSubjectStudent(subjectId, s.student_id))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

SubjectStudentsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    subject: PropTypes.object,
    onChanged: PropTypes.func.isRequired
}
