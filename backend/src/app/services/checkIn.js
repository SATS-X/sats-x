import prisma from '../../config/db/index.js';
import { toMinutes, toVietnamParts } from '../helpers/dates.js';
import { rosterWhere } from './sessionCloser.js';

const ON_TIME_MINUTES = 15;

/**
 * Điểm danh bằng webcam: tìm buổi học đang diễn ra mà sinh viên có tên trong danh sách,
 * rồi ghi bản ghi giống hệt luồng ESP32-CAM (On Time trong 15 phút đầu, sau đó Late).
 */
export const checkInStudent = async ({ studentId, deviceId, liveness }) => {
    const now = new Date();
    const { day, month, year, time } = toVietnamParts(now);
    const nowMinutes = toMinutes(time);

    const today = await prisma.schedule.findMany({
        where: { day, month, year, status: 'scheduled' },
        include: { subject: { select: { name: true } } },
        orderBy: { startTime: 'asc' }
    });
    const running = today.filter((s) => toMinutes(s.startTime) <= nowMinutes && nowMinutes <= toMinutes(s.endTime));

    let session = null;
    for (const candidate of running) {
        const onRoster = await prisma.student.count({ where: { studentId, ...rosterWhere(candidate.subjectId) } });
        if (onRoster > 0) {
            session = candidate;
            break;
        }
    }

    if (!session) return { recorded: false, reason: 'NoActiveSession' };

    const sessionInfo = {
        schedule_id: session.id,
        subject: session.subject?.name ?? session.subjectId,
        room: session.room,
        start_time: session.startTime,
        end_time: session.endTime
    };

    const existing = await prisma.attendance.findUnique({ where: { studentId_scheduleId: { studentId, scheduleId: session.id } } });
    if (existing) return { recorded: false, reason: 'AlreadyRecorded', remark: existing.remark, time: existing.time, session: sessionInfo };

    const remark = nowMinutes - toMinutes(session.startTime) <= ON_TIME_MINUTES ? 'On Time' : 'Late';
    try {
        await prisma.attendance.create({
            data: {
                studentId,
                subjectId: session.subjectId,
                scheduleId: session.id,
                time,
                day,
                month,
                year,
                dayOfWeek: session.dayOfWeek,
                status: 1,
                remark,
                deviceId,
                livenessVerdict: liveness?.verdict ?? null,
                livenessScore: typeof liveness?.score === 'number' ? liveness.score : null
            }
        });
    } catch (error) {
        if (error.code === 'P2002') return { recorded: false, reason: 'AlreadyRecorded', session: sessionInfo };
        throw error;
    }

    return { recorded: true, remark, time, session: sessionInfo };
};
