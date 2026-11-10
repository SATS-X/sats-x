import prisma from '../../config/db/index.js';
import { touchDevice } from './DeviceController.js';
import { checkInStudent } from '../services/checkIn.js';
import {
    FaceEngineError,
    analyzeImage,
    bestMatch,
    engineStatus,
    invalidateStudentTemplates,
    loadStudentTemplates,
    readImage,
    requireSingleFace,
    sendFaceError
} from '../services/faceEngine.js';

const MAX_FACES_PER_STUDENT = 5;
export const WEBCAM_DEVICE_ID = 'webcam-kiosk';

const toFaceRow = (face) => ({
    id: face.id,
    student_id: face.studentId,
    liveness_verdict: face.livenessVerdict,
    liveness_score: face.livenessScore,
    created_at: face.createdAt
});

/** GET /api/faces/status — frontend dùng để báo bộ nhận diện cục bộ đang chạy hay không. */
export const getEngineStatus = async (req, res) => {
    const [engine, templates] = await Promise.all([engineStatus(), prisma.faceTemplate.count().catch(() => null)]);
    return res.status(200).json({ success: true, data: { ...engine, templates } });
};

/** GET /api/faces?class_id= — sinh viên kèm danh sách khuôn mặt mẫu đã lưu. */
export const getFaces = async (req, res) => {
    try {
        const classId = typeof req.query.class_id === 'string' && req.query.class_id ? req.query.class_id : null;
        const students = await prisma.student.findMany({
            where: classId ? { classes: { some: { classId } } } : {},
            select: {
                studentId: true,
                fullName: true,
                status: true,
                classes: { select: { classId: true } },
                faces: { select: { id: true, studentId: true, livenessVerdict: true, livenessScore: true, createdAt: true }, orderBy: { createdAt: 'asc' } }
            },
            orderBy: { fullName: 'asc' }
        });

        const data = students.map((s) => ({
            student_id: s.studentId,
            full_name: s.fullName,
            status: s.status,
            class_ids: s.classes.map((c) => c.classId),
            faces: s.faces.map(toFaceRow)
        }));

        return res.status(200).json({ success: true, data, count: data.length, max_faces: MAX_FACES_PER_STUDENT });
    } catch (error) {
        return sendFaceError(res, error, 'getFaces');
    }
};

/** GET /api/faces/:id/photo — ảnh JPEG của một mẫu (frontend tải bằng token rồi tạo blob URL). */
export const getFacePhoto = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const face = Number.isInteger(id) ? await prisma.faceTemplate.findUnique({ where: { id }, select: { photo: true } }) : null;
        if (!face) return res.status(404).json({ success: false, error: 'NotFound', message: 'Face not found' });

        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'private, max-age=3600');
        return res.send(Buffer.from(face.photo));
    } catch (error) {
        return sendFaceError(res, error, 'getFacePhoto');
    }
};

/** POST /api/faces { student_id, image, force? } — chụp và lưu một khuôn mặt mẫu. */
export const addFace = async (req, res) => {
    try {
        const { student_id: studentId, image, force } = req.body || {};
        if (typeof studentId !== 'string' || !studentId) {
            throw new FaceEngineError(400, 'ValidationError', 'student_id is required');
        }
        const base64 = readImage(image);

        const student = await prisma.student.findUnique({ where: { studentId }, select: { fullName: true, _count: { select: { faces: true } } } });
        if (!student) throw new FaceEngineError(404, 'StudentNotFound', `Student not found: ${studentId}`);
        if (student._count.faces >= MAX_FACES_PER_STUDENT) {
            throw new FaceEngineError(409, 'TooManyFaces', `A student can have at most ${MAX_FACES_PER_STUDENT} photos. Delete one first.`);
        }

        const analysis = requireSingleFace(await analyzeImage(base64));

        // Cùng một khuôn mặt đăng ký cho hai sinh viên sẽ làm điểm danh nhầm người.
        const others = (await loadStudentTemplates()).filter((t) => t.studentId !== studentId);
        const { match } = bestMatch(analysis.embedding, others);
        if (match && !force) {
            throw new FaceEngineError(409, 'FaceBelongsToOther', `This face looks like ${match.fullName} (${match.studentId}).`, {
                other: { student_id: match.studentId, full_name: match.fullName, similarity: Number(match.score.toFixed(3)) }
            });
        }

        const face = await prisma.faceTemplate.create({
            data: {
                studentId,
                embedding: analysis.embedding,
                photo: Buffer.from(base64, 'base64'),
                livenessVerdict: analysis.liveness?.verdict ?? null,
                livenessScore: typeof analysis.liveness?.score === 'number' ? analysis.liveness.score : null
            }
        });
        invalidateStudentTemplates();

        return res.status(201).json({ success: true, message: `Face saved for ${student.fullName}`, data: toFaceRow(face), liveness: analysis.liveness });
    } catch (error) {
        return sendFaceError(res, error, 'addFace');
    }
};

/** DELETE /api/faces/:id */
export const deleteFace = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { count } = Number.isInteger(id) ? await prisma.faceTemplate.deleteMany({ where: { id } }) : { count: 0 };
        if (count === 0) return res.status(404).json({ success: false, error: 'NotFound', message: 'Face not found' });

        invalidateStudentTemplates();
        return res.status(200).json({ success: true, message: 'Face deleted' });
    } catch (error) {
        return sendFaceError(res, error, 'deleteFace');
    }
};

/**
 * POST /api/faces/identify { image, check_in? } — nhận diện sinh viên trước webcam.
 * check_in=true thì ghi điểm danh vào buổi học đang diễn ra, giống như camera ESP32.
 */
export const identifyStudent = async (req, res) => {
    try {
        const { image, check_in: checkIn } = req.body || {};
        const analysis = await analyzeImage(readImage(image));
        const base = { face_count: analysis.face_count, box: analysis.box ?? null, liveness: analysis.liveness ?? null };

        if (analysis.face_count === 0) return res.status(200).json({ success: true, ...base, match: null });

        const templates = await loadStudentTemplates();
        const { match, closest } = bestMatch(analysis.embedding, templates);
        const result = {
            ...base,
            enrolled: templates.length,
            closest: closest === null ? null : Number(closest.toFixed(3)),
            match: match ? { student_id: match.studentId, full_name: match.fullName, similarity: Number(match.score.toFixed(3)) } : null
        };

        if (match && checkIn) {
            const device = await touchDevice(WEBCAM_DEVICE_ID);
            result.attendance =
                device?.status === 'disabled'
                    ? { recorded: false, reason: 'DeviceDisabled' }
                    : await checkInStudent({ studentId: match.studentId, deviceId: WEBCAM_DEVICE_ID, liveness: analysis.liveness });
        }

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return sendFaceError(res, error, 'identifyStudent');
    }
};
