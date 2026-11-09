import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { updateDevice } from '../../api/device/deviceApi'
import { useToast } from '../../contexts/ToastContext'
import { apiErrorMessage } from '../../lib/errors'
import { Button, Field, Input, Modal, Segmented } from '../ui'

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' }
]

export default function DeviceEditModal({ isOpen, onClose, device, rooms, onSaved }) {
    const { showSuccess, showError } = useToast()
    const [form, setForm] = useState({ name: '', room: '', status: 'active' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen && device) setForm({ name: device.name || '', room: device.room || '', status: device.status })
    }, [isOpen, device])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateDevice(device.device_id, form)
            showSuccess('Device updated', 'Success')
            onClose()
            onSaved()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not update the device'), 'Error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Device settings"
            description={device?.device_id}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="device-form" loading={saving}>
                        Save device
                    </Button>
                </>
            }
        >
            <form id="device-form" onSubmit={handleSubmit} className="space-y-4">
                <Field label="Name">
                    <Input maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Example: Front door camera" />
                </Field>
                <Field label="Room" hint="The camera only follows this room’s schedule. Leave empty to follow every room.">
                    <Input list="device-rooms" maxLength={64} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Example: A2-401" />
                    <datalist id="device-rooms">
                        {rooms.map((room) => (
                            <option key={room} value={room} />
                        ))}
                    </datalist>
                </Field>
                <Field label="Status" hint="A disabled camera receives no schedule and cannot record attendance.">
                    <Segmented options={STATUS_OPTIONS} value={form.status} onChange={(status) => setForm({ ...form, status })} label="Device status" fill />
                </Field>
            </form>
        </Modal>
    )
}

DeviceEditModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    device: PropTypes.object,
    rooms: PropTypes.array.isRequired,
    onSaved: PropTypes.func.isRequired
}
