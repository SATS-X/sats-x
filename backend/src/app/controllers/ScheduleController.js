import { randomUUID } from 'crypto';
import prisma from '../../config/db/index.js';
import {
    WEEKDAY_NAMES,
    compareDates,
    dateRangeFilter,
    enumerateDates,
    formatDate,
    isValidTime,
    parseDate,
    weekdayOf
} from '../helpers/dates.js';

const fail = (res, status, error, message, extra = {}) =>
    res.status(status).json({ success: false, error, message, ...extra });

const NEWEST_FIRST = [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { startTime: 'asc' }];
const MAX_GENERATED_SESSIONS = 200;
const MAX_SERIES_RANGE_DAYS = 366;

const toScheduleRow = (s) => ({
    id: s.id,
    date: formatDate(s),
    day: s.day,
    month: s.month,
    year: s.year,
    day_of_week: s.dayOfWeek,
    subject_id: s.subjectId,
    subject_name: s.subject?.name ?? null,
    teacher_id: s.teacherId,
    teacher_name: s.teacher?.fullName ?? null,
    teacher_email: s.teacher?.email ?? null,
    teacher_phone: s.teacher?.phoneNumber ?? null,
    term_id: s.termId,
    series_id: s.seriesId,
    room: s.room,
    start_time: s.startTime,
    end_time: s.endTime,
    status: s.status
});

const WITH_RELATIONS = {
    subject: { select: { name: true } },
    teacher: { select: { fullName: true, email: true, phoneNumber: true } }
};

const canManageSubject = (subject, user) =>
    user.role === 'admin' || !subject.teacherId || subject.teacherId === user.teacher_id;

/** Tìm buổi trùng giờ ở cùng phòng, hoặc của cùng giáo viên, trong các ngày được chọn. */
const findConflicts = async ({ dates, startTime, endTime, room, teacherId, excludeId }) => {
    const existing = await prisma.schedule.findMany({
        where: {
            OR: dates,
            status: { not: 'cancelled' },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            ...(excludeId ? { id: { not: excludeId } } : {})
        },
        include: { subject: { select: { name: true } } }
    });

    const normalizedRoom = room.toLowerCase();

    return existing
        .filter((s) => s.room.toLowerCase() === normalizedRoom || (teacherId && s.teacherId === teacherId))
        .map((s) => ({
            id: s.id,
            date: formatDate(s),
            start_time: s.startTime,
            end_time: s.endTime,
            room: s.room,
            subject_name: s.subject?.name ?? s.subjectId
        }));
};

const respondConflict = (res, conflicts) =>
    fail(res, 409, 'ScheduleConflict', 'The room or teacher is already booked at this time', { conflicts });

/** Ngày cần tạo: một ngày duy nhất, hoặc các thứ được chọn trong khoảng ngày/học kỳ. */
const resolveDates = async (body) => {
    if (body.date) {
        const date = parseDate(body.date);
        return date ? { dates: [date], termId: body.term_id ? Number(body.term_id) : null } : { error: 'date must use the YYYY-MM-DD format' };
    }

    if (!Array.isArray(body.weekdays) || body.weekdays.length === 0 || !body.weekdays.every((day) => WEEKDAY_NAMES.includes(day))) {
        return { error: 'Choose at least one weekday, for example ["Monday"]' };
    }

    let start = parseDate(body.start_date);
    let end = parseDate(body.end_date);
    let termId = null;

    if (body.term_id) {
        const term = await prisma.term.findUnique({ where: { id: Number(body.term_id) } });
        if (!term) return { error: 'Term not found', status: 404 };
        termId = term.id;
        start = start ?? parseDate(term.startDate.toISOString().slice(0, 10));
        end = end ?? parseDate(term.endDate.toISOString().slice(0, 10));
    }

    if (!start || !end) return { error: 'Provide a term or a start_date and end_date' };

    const range = enumerateDates(start, end, MAX_SERIES_RANGE_DAYS);
    if (!range) return { error: `The date range must be valid and at most ${MAX_SERIES_RANGE_DAYS} days` };

    const dates = range.filter((date) => body.weekdays.includes(weekdayOf(date)));
    if (dates.length === 0) return { error: 'No session falls inside the selected dates and weekdays' };
    if (dates.length > MAX_GENERATED_SESSIONS) return { error: `A series can have at most ${MAX_GENERATED_SESSIONS} sessions` };

    return { dates, termId, isSeries: true };
};

const readRoomAndTime = (body) => {
    const room = typeof body?.room === 'string' ? body.room.trim() : '';
    if (!room || room.length > 64) return { error: 'Provide a room name of up to 64 characters' };
    if (!isValidTime(body?.start_time) || !isValidTime(body?.end_time)) return { error: 'Times must use the HH:MM format' };
    if (body.start_time >= body.end_time) return { error: 'The start time must be before the end time' };
    return { room, startTime: body.start_time, endTime: body.end_time };
};

/**
 * GET /api/schedule
 * Lọc tuỳ chọn theo ?day=&month=&year=, ?from=&to= (YYYY-MM-DD), ?subject_id=
 */
export const getAllSchedules = async (req, res) => {
    try {
        const { filter, error: rangeError } = dateRangeFilter(req.query);
        if (rangeError) return fail(res, 400, 'ValidationError', rangeError);

        const where = { ...filter };
        for (const field of ['day', 'month', 'year']) {
            const value = Number.parseInt(req.query?.[field], 10);
            if (Number.isInteger(value)) {
                where[field] = value;
            }
        }
        if (req.query?.subject_id) where.subjectId = req.query.subject_id;

        const schedules = await prisma.schedule.findMany({
            where,
            include: WITH_RELATIONS,
            orderBy: NEWEST_FIRST
        });

        const data = schedules.map(toScheduleRow);

        return res.status(200).json({
            success: true,
            message: 'Schedules retrieved successfully',
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Error in getAllSchedules:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** GET /api/schedule/teacher/:teacher_id */
export const getScheduleByTeacherId = async (req, res) => {
    try {
        const { teacher_id } = req.params;

        if (!teacher_id) {
            return fail(res, 400, 'ValidationError', 'Missing teacher_id parameter');
        }

        const schedules = await prisma.schedule.findMany({
            where: { teacherId: teacher_id },
            include: WITH_RELATIONS,
            orderBy: NEWEST_FIRST
        });

        const data = schedules.map(toScheduleRow);

        return res.status(200).json({
            success: true,
            message: 'Schedule retrieved successfully',
            teacher_id,
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Error in getScheduleByTeacherId:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** POST /api/schedule — tạo một buổi (date) hoặc lịch lặp (weekdays + term_id / start_date, end_date). */
export const createSchedule = async (req, res) => {
    try {
        const body = req.body || {};
        const { room, startTime, endTime, error: invalid } = readRoomAndTime(body);
        if (invalid) return fail(res, 400, 'ValidationError', invalid);

        const subject = body.subject_id
            ? await prisma.subject.findUnique({ where: { subjectId: body.subject_id } })
            : null;
        if (!subject) return fail(res, 404, 'NotFound', 'Subject not found');
        if (!canManageSubject(subject, req.user)) return fail(res, 403, 'Forbidden', 'You can only schedule your own subjects');

        const { dates, termId, isSeries, error: dateError, status } = await resolveDates(body);
        if (dateError) return fail(res, status || 400, 'ValidationError', dateError);

        const teacherId = subject.teacherId ?? req.user.teacher_id;
        const conflicts = await findConflicts({ dates, startTime, endTime, room, teacherId });
        if (conflicts.length > 0) return respondConflict(res, conflicts);

        const seriesId = isSeries ? randomUUID() : null;

        await prisma.schedule.createMany({
            data: dates.map((date) => ({
                ...date,
                subjectId: subject.subjectId,
                teacherId,
                termId,
                seriesId,
                dayOfWeek: weekdayOf(date),
                room,
                startTime,
                endTime
            }))
        });

        return res.status(201).json({
            success: true,
            message: `Created ${dates.length} session(s)`,
            count: dates.length,
            series_id: seriesId
        });
    } catch (error) {
        if (error.code === 'P2003') return fail(res, 404, 'NotFound', 'The selected term no longer exists');
        console.error('Error in createSchedule:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

const loadManagedSession = async (req, res) => {
    const id = Number(req.params.id);
    const session = Number.isInteger(id)
        ? await prisma.schedule.findUnique({ where: { id }, include: { subject: true } })
        : null;

    if (!session) {
        fail(res, 404, 'NotFound', 'Session not found');
        return null;
    }
    if (!canManageSubject(session.subject, req.user)) {
        fail(res, 403, 'Forbidden', 'You can only change sessions of your own subjects');
        return null;
    }
    return session;
};

/** PUT /api/schedule/:id — đổi ngày, giờ, phòng, hoặc huỷ/khôi phục một buổi. */
export const updateSchedule = async (req, res) => {
    try {
        const session = await loadManagedSession(req, res);
        if (!session) return undefined;

        if (!['scheduled', 'cancelled'].includes(session.status)) {
            return fail(res, 409, 'SessionClosed', 'This session has ended and can no longer be changed');
        }

        const body = req.body || {};

        if (body.status !== undefined && !['scheduled', 'cancelled'].includes(body.status)) {
            return fail(res, 400, 'ValidationError', 'status must be scheduled or cancelled');
        }

        const { room, startTime, endTime, error: invalid } = readRoomAndTime({
            room: body.room ?? session.room,
            start_time: body.start_time ?? session.startTime,
            end_time: body.end_time ?? session.endTime
        });
        if (invalid) return fail(res, 400, 'ValidationError', invalid);

        const date = body.date ? parseDate(body.date) : { year: session.year, month: session.month, day: session.day };
        if (!date) return fail(res, 400, 'ValidationError', 'date must use the YYYY-MM-DD format');

        const nextStatus = body.status ?? session.status;

        if (nextStatus !== 'cancelled') {
            const conflicts = await findConflicts({
                dates: [date],
                startTime,
                endTime,
                room,
                teacherId: session.teacherId,
                excludeId: session.id
            });
            if (conflicts.length > 0) return respondConflict(res, conflicts);
        }

        const updated = await prisma.schedule.update({
            where: { id: session.id },
            data: { ...date, dayOfWeek: weekdayOf(date), room, startTime, endTime, status: nextStatus },
            include: WITH_RELATIONS
        });

        return res.status(200).json({ success: true, message: 'Session updated', data: toScheduleRow(updated) });
    } catch (error) {
        console.error('Error in updateSchedule:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** DELETE /api/schedule/:id[?scope=series] — series xoá buổi này và các buổi sau chưa có điểm danh. */
export const deleteSchedule = async (req, res) => {
    try {
        const session = await loadManagedSession(req, res);
        if (!session) return undefined;

        if (req.query.scope === 'series' && session.seriesId) {
            const siblings = await prisma.schedule.findMany({
                where: { seriesId: session.seriesId, status: { in: ['scheduled', 'cancelled'] }, attendances: { none: {} } },
                select: { id: true, day: true, month: true, year: true }
            });
            const ids = siblings.filter((s) => compareDates(s, session) >= 0).map((s) => s.id);

            await prisma.schedule.deleteMany({ where: { id: { in: ids } } });

            return res.status(200).json({ success: true, message: `Deleted ${ids.length} session(s)`, count: ids.length });
        }

        const recordCount = await prisma.attendance.count({ where: { scheduleId: session.id } });
        if (recordCount > 0) {
            return fail(res, 409, 'SessionHasAttendance', 'This session has attendance records. Cancel it instead of deleting it');
        }

        await prisma.schedule.delete({ where: { id: session.id } });

        return res.status(200).json({ success: true, message: 'Session deleted', count: 1 });
    } catch (error) {
        console.error('Error in deleteSchedule:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};
