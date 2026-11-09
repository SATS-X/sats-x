import prisma from '../../config/db/index.js';

const fail = (res, status, error, message) =>
    res.status(status).json({ success: false, error, message });

// Thiết bị báo nhịp mỗi 60 giây; cho phép lỡ một nhịp trước khi coi là mất kết nối.
const ONLINE_WINDOW_MS = 150 * 1000;

const toDeviceRow = (device, now = Date.now()) => ({
    device_id: device.deviceId,
    name: device.name,
    room: device.room,
    status: device.status,
    firmware_version: device.firmwareVersion,
    last_seen_at: device.lastSeenAt,
    online: device.status === 'active' && Boolean(device.lastSeenAt) && now - device.lastSeenAt.getTime() < ONLINE_WINDOW_MS
});

/** GET /api/devices */
export const getDevices = async (req, res) => {
    try {
        const [devices, rooms] = await Promise.all([
            prisma.device.findMany({ orderBy: [{ room: 'asc' }, { deviceId: 'asc' }] }),
            prisma.schedule.findMany({ distinct: ['room'], select: { room: true }, orderBy: { room: 'asc' } })
        ]);

        return res.status(200).json({
            success: true,
            data: devices.map((device) => toDeviceRow(device)),
            rooms: rooms.map((item) => item.room),
            count: devices.length
        });
    } catch (error) {
        console.error('Error in getDevices:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** PUT /api/devices/:device_id — đổi tên, gán phòng, bật hoặc tắt thiết bị. */
export const updateDevice = async (req, res) => {
    try {
        const body = req.body || {};
        const data = {};

        for (const field of ['name', 'room']) {
            if (body[field] === undefined) continue;
            const value = typeof body[field] === 'string' ? body[field].trim() : '';
            const limit = field === 'name' ? 100 : 64;
            if (value.length > limit) return fail(res, 400, 'ValidationError', `${field} must be at most ${limit} characters`);
            data[field] = value || null;
        }

        if (body.status !== undefined) {
            if (!['active', 'disabled'].includes(body.status)) return fail(res, 400, 'ValidationError', 'status must be active or disabled');
            data.status = body.status;
        }

        if (Object.keys(data).length === 0) return fail(res, 400, 'ValidationError', 'No fields were provided for update');

        const device = await prisma.device.update({ where: { deviceId: req.params.device_id }, data });

        return res.status(200).json({ success: true, message: 'Device updated', data: toDeviceRow(device) });
    } catch (error) {
        if (error.code === 'P2025') return fail(res, 404, 'NotFound', 'Device not found');
        console.error('Error in updateDevice:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** DELETE /api/devices/:device_id — thiết bị vẫn sẽ xuất hiện lại nếu còn kết nối. */
export const deleteDevice = async (req, res) => {
    try {
        await prisma.device.delete({ where: { deviceId: req.params.device_id } });
        return res.status(200).json({ success: true, message: 'Device removed' });
    } catch (error) {
        if (error.code === 'P2025') return fail(res, 404, 'NotFound', 'Device not found');
        console.error('Error in deleteDevice:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};
