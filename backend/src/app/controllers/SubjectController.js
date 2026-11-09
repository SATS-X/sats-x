import prisma from '../../config/db/index.js';

const fail = (res, status, error, message) =>
    res.status(status).json({ success: false, error, message });

const SAFE_ID = /^[A-Za-z0-9._-]{1,32}$/;

const TEACHER_SELECT = {
    teacherId: true,
    fullName: true,
    email: true,
    phoneNumber: true
};

const toTeacher = (t) =>
    t
        ? {
              teacher_id: t.teacherId,
              teacher_name: t.fullName,
              teacher_email: t.email,
              teacher_phone: t.phoneNumber
          }
        : null;

const WITH_ROSTER = {
    teacher: { select: TEACHER_SELECT },
    students: { select: { studentId: true } },
    classes: {
        select: {
            classId: true,
            class: { select: { name: true, students: { select: { studentId: true } } } }
        }
    }
};

/** Sĩ số gồm sinh viên của các lớp được gán, cộng sinh viên được thêm riêng vào môn. */
const toSubjectRow = (s) => {
    const roster = new Set(s.students.map((x) => x.studentId));
    s.classes.forEach((c) => c.class.students.forEach((x) => roster.add(x.studentId)));

    return {
        subject_id: s.subjectId,
        name: s.name,
        ...toTeacher(s.teacher),
        teacher_id: s.teacherId,
        class_ids: s.classes.map((c) => c.classId).sort(),
        class_names: s.classes.map((c) => c.class.name),
        student_count: roster.size,
        direct_student_count: s.students.length,
        class_count: s.classes.length
    };
};

const canManage = (subject, user) => user.role === 'admin' || !subject.teacherId || subject.teacherId === user.teacher_id;

const loadManagedSubject = async (req, res) => {
    const subject = await prisma.subject.findUnique({ where: { subjectId: req.params.subject_id } });

    if (!subject) {
        fail(res, 404, 'NotFound', `Subject not found: ${req.params.subject_id}`);
        return null;
    }
    if (!canManage(subject, req.user)) {
        fail(res, 403, 'Forbidden', 'You can only change your own subjects');
        return null;
    }
    return subject;
};

const readClassIds = (value) =>
    Array.isArray(value) && value.every((id) => typeof id === 'string') ? [...new Set(value)] : null;

/** GET /api/subject — toàn bộ môn học, chỉ dành cho admin. */
export const getAllSubjects = async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({ include: WITH_ROSTER, orderBy: { subjectId: 'asc' } });
        const data = subjects.map(toSubjectRow);

        return res.status(200).json({ success: true, message: 'Subjects retrieved successfully', data, count: data.length });
    } catch (error) {
        console.error('Error in getAllSubjects:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** GET /api/subject/teacher/:teacher_id */
export const getAllSubjectsByTeacherId = async (req, res) => {
    try {
        const { teacher_id } = req.params;

        if (!teacher_id) {
            return fail(res, 400, 'ValidationError', 'Missing teacher_id parameter');
        }

        const subjects = await prisma.subject.findMany({
            where: { teacherId: teacher_id },
            include: WITH_ROSTER,
            orderBy: { subjectId: 'asc' }
        });

        const data = subjects.map(toSubjectRow);

        return res.status(200).json({
            success: true,
            message: `Subjects for teacher ${teacher_id} retrieved successfully`,
            data,
            count: data.length,
            teacher_id
        });
    } catch (error) {
        console.error('Error in getAllSubjectsByTeacherId:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** POST /api/subject — giáo viên tạo môn cho chính mình; admin có thể chỉ định teacher_id. */
export const createSubject = async (req, res) => {
    try {
        const { subject_id, name, teacher_id } = req.body || {};
        const classIds = readClassIds(req.body?.class_ids ?? []);
        const trimmedName = typeof name === 'string' ? name.trim() : '';

        if (typeof subject_id !== 'string' || !SAFE_ID.test(subject_id)) {
            return fail(res, 400, 'ValidationError', 'Subject code may only contain letters, numbers, dots, underscores, and hyphens');
        }
        if (!trimmedName) return fail(res, 400, 'ValidationError', 'Enter a subject name');
        if (!classIds) return fail(res, 400, 'ValidationError', 'class_ids must be a list of class IDs');

        const subject = await prisma.subject.create({
            data: {
                subjectId: subject_id,
                name: trimmedName,
                teacherId: req.user.role === 'admin' && teacher_id ? teacher_id : req.user.teacher_id,
                classes: { create: classIds.map((classId) => ({ classId })) }
            },
            include: WITH_ROSTER
        });

        return res.status(201).json({ success: true, message: 'Subject created', data: toSubjectRow(subject) });
    } catch (error) {
        if (error.code === 'P2002') return fail(res, 409, 'DuplicateEntry', `Subject code ${req.body?.subject_id} already exists`);
        if (error.code === 'P2003') return fail(res, 404, 'NotFound', 'A selected class or teacher no longer exists');
        console.error('Error in createSubject:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** PUT /api/subject/:subject_id — đổi tên và thay danh sách lớp được gán. */
export const updateSubject = async (req, res) => {
    try {
        const subject = await loadManagedSubject(req, res);
        if (!subject) return undefined;

        const data = {};

        if (req.body?.name !== undefined) {
            const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
            if (!name) return fail(res, 400, 'ValidationError', 'Enter a subject name');
            data.name = name;
        }

        if (req.body?.class_ids !== undefined) {
            const classIds = readClassIds(req.body.class_ids);
            if (!classIds) return fail(res, 400, 'ValidationError', 'class_ids must be a list of class IDs');
            data.classes = { deleteMany: {}, create: classIds.map((classId) => ({ classId })) };
        }

        if (Object.keys(data).length === 0) {
            return fail(res, 400, 'ValidationError', 'No fields were provided for update');
        }

        const updated = await prisma.subject.update({
            where: { subjectId: subject.subjectId },
            data,
            include: WITH_ROSTER
        });

        return res.status(200).json({ success: true, message: 'Subject updated', data: toSubjectRow(updated) });
    } catch (error) {
        if (error.code === 'P2003') return fail(res, 404, 'NotFound', 'A selected class no longer exists');
        console.error('Error in updateSubject:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** DELETE /api/subject/:subject_id — từ chối khi đã có điểm danh, vì xoá sẽ mất luôn lịch sử. */
export const deleteSubject = async (req, res) => {
    try {
        const subject = await loadManagedSubject(req, res);
        if (!subject) return undefined;

        const recordCount = await prisma.attendance.count({ where: { subjectId: subject.subjectId } });
        if (recordCount > 0) {
            return fail(res, 409, 'SubjectHasAttendance', `This subject has ${recordCount} attendance record(s) and cannot be deleted`);
        }

        await prisma.subject.delete({ where: { subjectId: subject.subjectId } });

        return res.status(200).json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        console.error('Error in deleteSubject:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** POST /api/subject/:subject_id/students — thêm riêng sinh viên ngoài các lớp được gán. */
export const addSubjectStudents = async (req, res) => {
    try {
        const subject = await loadManagedSubject(req, res);
        if (!subject) return undefined;

        const studentIds = readClassIds(req.body?.student_ids);
        if (!studentIds || studentIds.length === 0) {
            return fail(res, 400, 'ValidationError', 'student_ids must be a non-empty list');
        }

        const { count } = await prisma.subjectStudent.createMany({
            data: studentIds.map((studentId) => ({ subjectId: subject.subjectId, studentId })),
            skipDuplicates: true
        });

        return res.status(201).json({ success: true, message: `Added ${count} student(s)`, count });
    } catch (error) {
        if (error.code === 'P2003') return fail(res, 404, 'NotFound', 'A selected student no longer exists');
        console.error('Error in addSubjectStudents:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** DELETE /api/subject/:subject_id/students/:student_id */
export const removeSubjectStudent = async (req, res) => {
    try {
        const subject = await loadManagedSubject(req, res);
        if (!subject) return undefined;

        await prisma.subjectStudent.deleteMany({
            where: { subjectId: subject.subjectId, studentId: req.params.student_id }
        });

        return res.status(200).json({ success: true, message: 'Student removed from subject' });
    } catch (error) {
        console.error('Error in removeSubjectStudent:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** GET /api/subject/:subject_id */
export const getSubjectById = async (req, res) => {
    try {
        const { subject_id } = req.params;

        if (!subject_id) {
            return fail(res, 400, 'ValidationError', 'Missing subject_id parameter');
        }

        const subject = await prisma.subject.findUnique({
            where: { subjectId: subject_id },
            include: {
                teacher: { select: TEACHER_SELECT },
                classes: {
                    select: {
                        class: {
                            select: { classId: true, name: true, numberOfStudents: true, status: true }
                        }
                    }
                }
            }
        });

        if (!subject) {
            return fail(res, 404, 'NotFound', `Subject not found: ${subject_id}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Subject retrieved successfully',
            data: {
                subject_id: subject.subjectId,
                name: subject.name,
                teacher_id: subject.teacherId,
                ...toTeacher(subject.teacher)
            },
            classes: subject.classes.map((c) => ({
                class_id: c.class.classId,
                class_name: c.class.name,
                number_of_students: c.class.numberOfStudents,
                status: c.class.status
            })),
            count: subject.classes.length
        });
    } catch (error) {
        console.error('Error in getSubjectById:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};

/** GET /api/subject/:subject_id/students */
export const getSubjectStudent = async (req, res) => {
    try {
        const { subject_id } = req.params;

        if (!subject_id) {
            return fail(res, 400, 'ValidationError', 'Missing subject_id parameter');
        }

        const subject = await prisma.subject.findUnique({
            where: { subjectId: subject_id },
            include: {
                teacher: { select: TEACHER_SELECT },
                students: {
                    select: {
                        student: {
                            select: { studentId: true, fullName: true, email: true, phoneNumber: true }
                        }
                    }
                }
            }
        });

        if (!subject) {
            return res.status(404).json({
                success: false,
                error: 'No students found for this subject or subject does not exist',
                subject_id
            });
        }

        const students = subject.students
            .map((s) => ({
                student_id: s.student.studentId,
                full_name: s.student.fullName,
                email: s.student.email,
                phone_number: s.student.phoneNumber
            }))
            .sort((a, b) => a.full_name.localeCompare(b.full_name));

        return res.status(200).json({
            success: true,
            message: 'Students of subject retrieved successfully',
            subject: {
                subject_id: subject.subjectId,
                subject_name: subject.name,
                teacher: toTeacher(subject.teacher)
            },
            count: students.length,
            students
        });
    } catch (error) {
        console.error('Error in getSubjectStudent:', error);
        return fail(res, 500, 'Internal server error', error.message);
    }
};
