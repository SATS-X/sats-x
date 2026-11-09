import client from '../client'

export const getDevices = async () => {
    const res = await client.get('/api/devices')
    return res.data
}

export const updateDevice = async (deviceId, payload) => {
    const res = await client.put(`/api/devices/${deviceId}`, payload)
    return res.data
}

export const deleteDevice = async (deviceId) => {
    const res = await client.delete(`/api/devices/${deviceId}`)
    return res.data
}

export const captureOnDevice = (ws, deviceId) => ws.requestAction('triggerCapture', { device_id: deviceId }, { timeout: 8000 })

export const listFirmware = (ws) => ws.requestAction('listFirmware', {}, { timeout: 8000 })

export const updateFirmware = (ws, deviceId, version) => ws.requestAction('updateFirmware', { device_id: deviceId, version }, { timeout: 8000 })
