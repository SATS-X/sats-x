import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { updateStudent } from '../../api/student/getStudent'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import { Button, CheckList, Field, Input, Modal, Select } from '../ui'

export default function StudentEditModal({ isOpen, onClose, student, classes, onSaved }) {
    const { showSuccess, showError } = useToast()
    const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', status: 'active', class_ids: [] })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen && student) {
            setForm({
                full_name: student.name || '',
                email: student.email || '',
                phone_number: student.phone || '',
                status: student.status || 'active',
                class_ids: student.classIds
            })
        }
    }, [isOpen, student])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateStudent(student.id, form)
            showSuccess('Student updated', 'Success')
            onClose()
            onSaved()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not update the student'), 'Error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit student"
            description={student?.id}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="student-edit-form" loading={saving}>
                        Save changes
                    </Button>
                </>
            }
        >
            <form id="student-edit-form" onSubmit={handleSubmit} className="space-y-4">
                <Field label="Full name" required>
                    <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Email">
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label="Phone number">
                        <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="font-data" />
                    </Field>
                </div>
                <Field label="Status" hint="Inactive students are not marked absent.">
                    <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-10">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </Field>
                <Field label="Classes">
                    <CheckList
                        options={classes.map((c) => ({ value: c.class_id, label: c.class_name }))}
                        selected={form.class_ids}
                        onChange={(class_ids) => setForm({ ...form, class_ids })}
                        emptyLabel="No classes have been created yet."
                    />
                </Field>
            </form>
        </Modal>
    )
}

StudentEditModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    student: PropTypes.object,
    classes: PropTypes.array.isRequired,
    onSaved: PropTypes.func.isRequired
}
