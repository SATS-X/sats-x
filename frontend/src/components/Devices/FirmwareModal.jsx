import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { listFirmware, updateFirmware } from '../../api/device/deviceApi'
import { useToast } from '../../contexts/ToastContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Button, Field, LoadingState, Modal, Notice, Select } from '../ui'

export default function FirmwareModal({ isOpen, onClose, device }) {
    const ws = useWebSocket()
    const { showSuccess, showError } = useToast()
    const [releases, setReleases] = useState(null)
    const [version, setVersion] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (!isOpen) return undefined

        let active = true
        setReleases(null)
        setVersion('')
        listFirmware(ws)
            .then((res) => active && setReleases(res?.releases ?? []))
            .catch((err) => {
                if (!active) return
                setReleases([])
                showError(err.message, 'Firmware')
            })

        return () => {
            active = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    const handleSend = async () => {
        setSending(true)
        try {
            await updateFirmware(ws, device.device_id, version)
            showSuccess(`The camera will restart when version ${version} is installed.`, 'Update sent')
            onClose()
        } catch (err) {
            showError(err.message, 'Firmware')
        } finally {
            setSending(false)
        }
    }

    const available = (releases ?? []).filter((release) => release.version !== device?.firmware_version)

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update firmware"
            description={device ? `${device.name || device.device_id} · running ${device.firmware_version || 'unknown'}` : undefined}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} loading={sending} disabled={!version}>
                        Send update
                    </Button>
                </>
            }
        >
            {releases === null ? (
                <LoadingState label="Loading firmware releases..." />
            ) : available.length === 0 ? (
                <p className="text-sm text-text-tertiary">No other firmware version is available. Publish one with iot/scripts/publish_firmware.sh.</p>
            ) : (
                <div className="space-y-3">
                    <Field label="Version">
                        <Select value={version} onChange={(e) => setVersion(e.target.value)} className="h-10">
                            <option value="">Select a version</option>
                            {available.map((release) => (
                                <option key={release.version} value={release.version}>
                                    {release.version} · {(release.size / 1048576).toFixed(2)} MB
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Notice>The camera stops recording attendance while it updates. Avoid updating during a session.</Notice>
                </div>
            )}
        </Modal>
    )
}

FirmwareModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    device: PropTypes.object
}
