import prisma from '../../config/db/index.js';

/**
 * Bộ nhận diện chạy cục bộ: service Python (liveness/app/faces.py) chỉ trích xuất vector,
 * còn backend lưu và so khớp. Vector SFace đã chuẩn hoá nên độ giống = tích vô hướng.
 */
const LIVENESS_URL = (process.env.LIVENESS_URL || 'http://localhost:8000').replace(/\/$/, '');
const ANALYZE_TIMEOUT_MS = 15000;

// OpenCV đề xuất 0.363 cho SFace. Triển lãm có nhiều người lạ nên chọn cao hơn một chút
// để đổi vài lần "không nhận ra" lấy việc gần như không nhận nhầm người.
export const MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD) || 0.42;
export const MAX_IMAGE_BASE64 = 900 * 1024;

export class FaceEngineError extends Error {
    constructor(status, code, message, extra = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.extra = extra;
    }
}

const stripDataUrl = (image) => (typeof image === 'string' ? image.replace(/^data:image\/[a-z]+;base64,/, '') : '');

/** Kiểm tra ảnh base64 do trình duyệt gửi lên và trả về chuỗi base64 thuần. */
export const readImage = (image) => {
    const base64 = stripDataUrl(image);
    if (!base64 || base64.length > MAX_IMAGE_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
        throw new FaceEngineError(400, 'InvalidImage', 'Send one JPEG image under 650 KB as base64');
    }
    return base64;
};

export const analyzeImage = async (base64) => {
    let response;
    try {
        response = await fetch(`${LIVENESS_URL}/v1/faces/analyze`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.SERVICE_TOKEN || ''}` },
            body: JSON.stringify({ image: base64 }),
            signal: AbortSignal.timeout(ANALYZE_TIMEOUT_MS)
        });
    } catch (error) {
        console.error('Face engine unreachable:', error.message);
        throw new FaceEngineError(503, 'FaceEngineUnavailable', 'The face engine is not running. Start it with ./start.sh');
    }

    if (response.status === 400) throw new FaceEngineError(400, 'InvalidImage', 'The image could not be read');
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.error(`Face engine returned ${response.status}: ${detail.slice(0, 200)}`);
        throw new FaceEngineError(503, 'FaceEngineUnavailable', 'The face engine could not analyse this image');
    }
    return response.json();
};

/** Ảnh dùng để lưu hoặc đăng ký phải có đúng một khuôn mặt rõ nét. */
export const requireSingleFace = (analysis) => {
    if (analysis.face_count === 0) {
        throw new FaceEngineError(422, 'NoFace', 'No face found. Look straight at the camera in good light.');
    }
    if (analysis.face_count > 1) {
        throw new FaceEngineError(422, 'MultipleFaces', 'More than one face is in the frame. Only one person at a time.');
    }
    if (analysis.issues?.includes('too_small')) {
        throw new FaceEngineError(422, 'FaceTooSmall', 'Move closer so your face fills more of the frame.');
    }
    if (analysis.issues?.includes('blurry')) {
        throw new FaceEngineError(422, 'Blurry', 'The photo is blurry. Hold still and try again.');
    }
    return analysis;
};

export const similarity = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i += 1) sum += a[i] * b[i];
    return sum;
};

/** Trả về danh tính có độ giống cao nhất trong số các mẫu; mỗi danh tính lấy mẫu tốt nhất. */
export const bestMatch = (embedding, templates, threshold = MATCH_THRESHOLD) => {
    let best = null;
    for (const template of templates) {
        const score = similarity(embedding, template.embedding);
        if (!best || score > best.score) best = { ...template, score };
    }
    if (!best || best.score < threshold) return { match: null, closest: best?.score ?? null };
    return { match: best, closest: best.score };
};

// Mẫu khuôn mặt sinh viên được đọc một lần rồi giữ trong bộ nhớ; mọi thay đổi gọi
// invalidateStudentTemplates() để lần nhận diện sau nạp lại.
// Hết hạn sau một phút để sinh viên bị xoá hoặc tạm ngưng không còn được nhận ra.
const CACHE_TTL_MS = 60 * 1000;
let templateCache = null;
let cachedAt = 0;

export const invalidateStudentTemplates = () => {
    templateCache = null;
};

export const loadStudentTemplates = async () => {
    if (!templateCache || Date.now() - cachedAt > CACHE_TTL_MS) {
        cachedAt = Date.now();
        templateCache = prisma.faceTemplate
            .findMany({
                where: { student: { status: 'active' } },
                select: { id: true, studentId: true, embedding: true, student: { select: { fullName: true } } }
            })
            .then((rows) =>
                rows.map((row) => ({
                    id: row.id,
                    studentId: row.studentId,
                    fullName: row.student.fullName,
                    embedding: Float64Array.from(row.embedding)
                }))
            )
            .catch((error) => {
                templateCache = null;
                throw error;
            });
    }
    return templateCache;
};

/** Cho biết service nhận diện có chạy và đã có model chưa. */
export const engineStatus = async () => {
    try {
        const response = await fetch(`${LIVENESS_URL}/v1/faces/health`, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) return { online: false, models: false };
        const body = await response.json();
        return { online: true, models: Boolean(body.models) };
    } catch {
        return { online: false, models: false };
    }
};

export const sendFaceError = (res, error, context) => {
    if (error instanceof FaceEngineError) {
        return res.status(error.status).json({ success: false, error: error.code, message: error.message, ...error.extra });
    }
    console.error(`Error in ${context}:`, error);
    return res.status(500).json({ success: false, error: 'Internal server error', message: error.message });
};
