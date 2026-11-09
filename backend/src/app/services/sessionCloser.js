import prisma from '../../config/db/index.js';
import { toVietnamParts } from '../helpers/dates.js';

const CHECK_INTERVAL_MS = 60 * 1000;

/** Sinh viên phải có mặt: thuộc lớp được gán vào môn, hoặc được thêm riêng vào môn. */
export const rosterWhere = (subjectId) => ({
    status: 'active',
    OR: [{ subjects: { some: { subjectId } } }, { classes: { some: { class: { subjects: { some: { subjectId } } } } } }]
});

const closeSession = async (session) =>
    prisma.$transaction(async (tx) => {
        const records = await tx.attendance.findMany({
            where: { scheduleId: session.id },
            select: { studentId: true, status: true }
        });

        // Không ai được ghi nhận thì gần như chắc chắn thiết bị không chạy, không phải
        // cả lớp cùng vắng. Đánh vắng cả lớp sẽ tạo ra số liệu sai.
        if (!records.some((record) => record.status === 1)) {
            await tx.schedule.update({ where: { id: session.id }, data: { status: 'no_attendance' } });
            return 0;
        }

        const recorded = new Set(records.map((record) => record.studentId));
        const roster = await tx.student.findMany({ where: rosterWhere(session.subjectId), select: { studentId: true } });
        const absentees = roster.filter((student) => !recorded.has(student.studentId));

        if (absentees.length > 0) {
            await tx.attendance.createMany({
                data: absentees.map((student) => ({
                    studentId: student.studentId,
                    subjectId: session.subjectId,
                    scheduleId: session.id,
                    time: '00:00',
                    day: session.day,
                    month: session.month,
                    year: session.year,
                    dayOfWeek: session.dayOfWeek,
                    status: 0,
                    remark: 'Absent'
                })),
                skipDuplicates: true
            });
        }

        await tx.schedule.update({ where: { id: session.id }, data: { status: 'completed' } });
        return absentees.length;
    });

/** Đóng mọi buổi học đã kết thúc và ghi vắng cho sinh viên chưa có bản ghi. */
export const closeEndedSessions = async (now = new Date()) => {
    const { day, month, year, time } = toVietnamParts(now);

    const candidates = await prisma.schedule.findMany({
        where: {
            status: 'scheduled',
            OR: [{ year: { lt: year } }, { year, month: { lt: month } }, { year, month, day: { lte: day } }]
        }
    });

    // Giờ kết thúc vẫn còn điểm danh được, nên chỉ đóng khi đã qua hẳn phút đó.
    const ended = candidates.filter(
        (session) => !(session.year === year && session.month === month && session.day === day) || session.endTime < time
    );

    let absentCount = 0;
    for (const session of ended) {
        absentCount += await closeSession(session);
    }

    return { closed: ended.length, absent: absentCount };
};

export const startSessionCloser = () => {
    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;
        try {
            const { closed, absent } = await closeEndedSessions();
            if (closed > 0) console.log(`Closed ${closed} ended session(s), marked ${absent} absence(s)`);
        } catch (error) {
            console.error('Could not close ended sessions:', error);
        } finally {
            running = false;
        }
    };

    tick();
    setInterval(tick, CHECK_INTERVAL_MS).unref();
};
