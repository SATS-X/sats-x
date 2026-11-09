import { useState } from 'react'
import PropTypes from 'prop-types'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { createTerm, deleteTerm } from '../../api/term/termApi'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import { Button, Field, IconButton, Input, Modal } from '../ui'

const EMPTY_FORM = { name: '', start_date: '', end_date: '' }

export default function TermsModal({ isOpen, onClose, terms, onChanged }) {
    const { showError } = useToast()
    const [form, setForm] = useState(EMPTY_FORM)
    const [busy, setBusy] = useState(false)

    const run = async (action) => {
        setBusy(true)
        try {
            await action()
            onChanged()
            return true
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not update terms'), 'Error')
            return false
        } finally {
            setBusy(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (await run(() => createTerm(form))) setForm(EMPTY_FORM)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Academic terms"
            description="Use a term to fill the dates of a weekly schedule."
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Done
                </Button>
            }
        >
            <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Field label="Term name" required>
                        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Semester 1, 2026–2027" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Starts" required>
                            <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                        </Field>
                        <Field label="Ends" required>
                            <Input type="date" required min={form.start_date || undefined} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                        </Field>
                    </div>
                    <Button type="submit" size="sm" variant="secondary" loading={busy}>
                        {!busy && <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />}
                        Add term
                    </Button>
                </form>

                {terms.length > 0 && (
                    <div className="divide-y divide-border rounded-lg border border-border">
                        {terms.map((term) => (
                            <div key={term.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-medium text-text">{term.name}</p>
                                    <p className="font-data text-[11px] text-text-tertiary">
                                        {term.start_date} → {term.end_date} · {term.session_count} sessions
                                    </p>
                                </div>
                                <IconButton icon={LuTrash2} label={`Delete ${term.name}`} tone="danger" disabled={busy} onClick={() => run(() => deleteTerm(term.id))} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}

TermsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    terms: PropTypes.array.isRequired,
    onChanged: PropTypes.func.isRequired
}
