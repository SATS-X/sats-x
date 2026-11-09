import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { createSubject, updateSubject } from '../../api/subject/getSubject'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import { Button, CheckList, Field, Input, Modal } from '../ui'

const EMPTY_FORM = { subject_id: '', name: '', class_ids: [] }

export default function SubjectFormModal({ isOpen, onClose, subject, classes, onSaved }) {
    const { showSuccess, showError } = useToast()
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) setForm(subject ? { subject_id: subject.subject_id, name: subject.name, class_ids: subject.class_ids ?? [] } : EMPTY_FORM)
    }, [isOpen, subject])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (subject) {
                await updateSubject(subject.subject_id, { name: form.name, class_ids: form.class_ids })
                showSuccess('Subject updated', 'Success')
            } else {
                await createSubject(form)
                showSuccess('Subject created', 'Success')
            }
            onClose()
            onSaved()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not save the subject'), 'Error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subject ? 'Edit subject' : 'Create a subject'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="subject-form" loading={saving}>
                        Save subject
                    </Button>
                </>
            }
        >
            <form id="subject-form" onSubmit={handleSubmit} className="space-y-4">
                <Field label="Subject code" required>
                    <Input
                        required
                        maxLength={32}
                        pattern="[A-Za-z0-9._\-]+"
                        title="Letters, numbers, dots, underscores, and hyphens only"
                        disabled={Boolean(subject)}
                        value={form.subject_id}
                        onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                        placeholder="Example: INT1449"
                        className="font-data"
                    />
                </Field>
                <Field label="Subject name" required>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Embedded Systems" />
                </Field>
                <Field label="Classes taking this subject" hint="Every student in these classes is expected in its sessions.">
                    <CheckList
                        options={classes.map((c) => ({ value: c.class_id, label: c.class_name }))}
                        selected={form.class_ids}
                        onChange={(class_ids) => setForm({ ...form, class_ids })}
                        emptyLabel="Create a class first, then assign it here."
                    />
                </Field>
            </form>
        </Modal>
    )
}

SubjectFormModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    subject: PropTypes.object,
    classes: PropTypes.array.isRequired,
    onSaved: PropTypes.func.isRequired
}
