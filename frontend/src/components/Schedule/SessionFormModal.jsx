import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { createSchedule, updateSchedule } from '../../api/schedule/getSchedule'
import { useToast } from '../../contexts/ToastContext'
import { todayISO } from '../../lib/date'
import { apiErrorMessage } from '../../lib/errors'
import { Button, Field, Input, Modal, Notice, Segmented, Select } from '../ui'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const MODES = [
    { value: 'single', label: 'One session' },
    { value: 'weekly', label: 'Repeat weekly' }
]

const emptyForm = () => ({
    subject_id: '',
    date: todayISO(),
    term_id: '',
    start_date: '',
    end_date: '',
    weekdays: [],
    start_time: '07:30',
    end_time: '09:30',
    room: ''
})

export default function SessionFormModal({ isOpen, onClose, session, subjects, terms, onSaved }) {
    const { showSuccess, showError } = useToast()
    const [mode, setMode] = useState('single')
    const [form, setForm] = useState(emptyForm)
    const [conflicts, setConflicts] = useState([])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setMode('single')
        setConflicts([])
        setForm(
            session
                ? { ...emptyForm(), subject_id: session.subject_id, date: session.date, start_time: session.start_time, end_time: session.end_time, room: session.room }
                : emptyForm()
        )
    }, [isOpen, session])

    const set = (patch) => setForm((current) => ({ ...current, ...patch }))

    const toggleWeekday = (day) =>
        set({ weekdays: form.weekdays.includes(day) ? form.weekdays.filter((item) => item !== day) : [...form.weekdays, day] })

    const buildPayload = () => {
        const shared = { room: form.room, start_time: form.start_time, end_time: form.end_time }
        if (session) return { ...shared, date: form.date }
        if (mode === 'single') return { ...shared, subject_id: form.subject_id, date: form.date }
        return {
            ...shared,
            subject_id: form.subject_id,
            weekdays: form.weekdays,
            ...(form.term_id ? { term_id: Number(form.term_id) } : { start_date: form.start_date, end_date: form.end_date })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!session && mode === 'weekly' && form.weekdays.length === 0) {
            showError('Choose at least one weekday', 'Missing information')
            return
        }

        setSaving(true)
        setConflicts([])
        try {
            const res = session ? await updateSchedule(session.id, buildPayload()) : await createSchedule(buildPayload())
            showSuccess(res.message, 'Schedule updated')
            onClose()
            onSaved()
        } catch (err) {
            const found = err.response?.data?.conflicts
            if (found) setConflicts(found)
            else showError(apiErrorMessage(err, 'Could not save the session'), 'Error')
        } finally {
            setSaving(false)
        }
    }

    const isWeekly = !session && mode === 'weekly'

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={session ? 'Edit session' : 'Add sessions'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="session-form" loading={saving}>
                        Save
                    </Button>
                </>
            }
        >
            <form id="session-form" onSubmit={handleSubmit} className="space-y-4">
                {!session && <Segmented options={MODES} value={mode} onChange={setMode} label="Session type" fill />}

                <Field label="Subject" required>
                    <Select required disabled={Boolean(session)} value={form.subject_id} onChange={(e) => set({ subject_id: e.target.value })} className="h-10">
                        <option value="">Select a subject</option>
                        {session && !subjects.some((s) => s.subject_id === session.subject_id) && <option value={session.subject_id}>{session.subject_name}</option>}
                        {subjects.map((s) => (
                            <option key={s.subject_id} value={s.subject_id}>
                                {s.subject_id} — {s.name}
                            </option>
                        ))}
                    </Select>
                </Field>

                {isWeekly ? (
                    <>
                        <Field label="Term" hint={terms.length === 0 ? 'Add a term to reuse its dates, or choose dates below.' : undefined}>
                            <Select value={form.term_id} onChange={(e) => set({ term_id: e.target.value })} className="h-10">
                                <option value="">Custom date range</option>
                                {terms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.name}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        {!form.term_id && (
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="From" required>
                                    <Input type="date" required value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} />
                                </Field>
                                <Field label="To" required>
                                    <Input type="date" required min={form.start_date || undefined} value={form.end_date} onChange={(e) => set({ end_date: e.target.value })} />
                                </Field>
                            </div>
                        )}

                        <Field label="Repeat on" required>
                            <div className="flex flex-wrap gap-1.5">
                                {WEEKDAYS.map((day) => {
                                    const active = form.weekdays.includes(day)
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => toggleWeekday(day)}
                                            className={classNames(
                                                'h-8 w-11 rounded-lg border text-xs font-medium transition-colors',
                                                active ? 'border-text bg-text text-bg' : 'border-border bg-input text-text-secondary hover:bg-surface-hover'
                                            )}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    )
                                })}
                            </div>
                        </Field>
                    </>
                ) : (
                    <Field label="Date" required>
                        <Input type="date" required value={form.date} onChange={(e) => set({ date: e.target.value })} />
                    </Field>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Starts" required>
                        <Input type="time" required value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} className="font-data" />
                    </Field>
                    <Field label="Ends" required>
                        <Input type="time" required value={form.end_time} onChange={(e) => set({ end_time: e.target.value })} className="font-data" />
                    </Field>
                </div>

                <Field label="Room" required>
                    <Input required maxLength={64} value={form.room} onChange={(e) => set({ room: e.target.value })} placeholder="Example: A2-401" />
                </Field>

                {conflicts.length > 0 && (
                    <Notice>
                        <p className="font-medium">The room or teacher is already booked:</p>
                        <ul className="font-data mt-1 space-y-0.5">
                            {conflicts.slice(0, 5).map((c) => (
                                <li key={c.id}>
                                    {c.date} {c.start_time}–{c.end_time} · {c.room} · {c.subject_name}
                                </li>
                            ))}
                        </ul>
                        {conflicts.length > 5 && <p className="mt-1">and {conflicts.length - 5} more</p>}
                    </Notice>
                )}
            </form>
        </Modal>
    )
}

SessionFormModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    session: PropTypes.object,
    subjects: PropTypes.array.isRequired,
    terms: PropTypes.array.isRequired,
    onSaved: PropTypes.func.isRequired
}
