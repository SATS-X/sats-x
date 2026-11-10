import {
    FaceEngineError,
    analyzeImage,
    bestMatch,
    readImage,
    requireSingleFace,
    sendFaceError
} from '../services/faceEngine.js';
import { VISITOR_TTL_MS, addVisitor, clearVisitors, listVisitors, publicVisitor, removeVisitor, visitorTemplates } from '../services/visitorStore.js';

/**
 * Chế độ triển lãm: khách đi ngang tự đăng ký bằng biệt danh rồi thử nhận diện.
 * Chỉ so khớp với khách khác — không bao giờ lộ tên hay ảnh sinh viên thật.
 */
const NICKNAME = /^[\p{L}\p{N} ._'-]{1,32}$/u;

const readNickname = (value) => {
    const nickname = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    if (!NICKNAME.test(nickname)) {
        throw new FaceEngineError(400, 'InvalidNickname', 'Use 1–32 letters, numbers or spaces for the nickname');
    }
    return nickname;
};

/** GET /api/kiosk/visitors */
export const getVisitors = (req, res) => {
    const data = listVisitors();
    return res.status(200).json({ success: true, data, count: data.length, ttl_minutes: VISITOR_TTL_MS / 60000 });
};

/** POST /api/kiosk/visitors { nickname, image, consent } */
export const enrollVisitor = async (req, res) => {
    try {
        const { nickname: rawNickname, image, consent } = req.body || {};
        if (consent !== true) {
            throw new FaceEngineError(400, 'ConsentRequired', 'The visitor must agree before their face is stored');
        }
        const nickname = readNickname(rawNickname);
        const base64 = readImage(image);
        const analysis = requireSingleFace(await analyzeImage(base64));

        const visitor = addVisitor({ nickname, embedding: analysis.embedding, photo: `data:image/jpeg;base64,${base64}` });
        return res.status(201).json({ success: true, data: visitor, liveness: analysis.liveness, ttl_minutes: VISITOR_TTL_MS / 60000 });
    } catch (error) {
        return sendFaceError(res, error, 'enrollVisitor');
    }
};

/** POST /api/kiosk/identify { image } */
export const identifyVisitor = async (req, res) => {
    try {
        const analysis = await analyzeImage(readImage(req.body?.image));
        const base = { face_count: analysis.face_count, box: analysis.box ?? null, liveness: analysis.liveness ?? null };
        if (analysis.face_count === 0) return res.status(200).json({ success: true, ...base, match: null });

        const templates = visitorTemplates();
        const { match, closest } = bestMatch(analysis.embedding, templates);
        return res.status(200).json({
            success: true,
            ...base,
            enrolled: templates.length,
            closest: closest === null ? null : Number(closest.toFixed(3)),
            match: match ? { ...publicVisitor(match.visitor), similarity: Number(match.score.toFixed(3)) } : null
        });
    } catch (error) {
        return sendFaceError(res, error, 'identifyVisitor');
    }
};

/** DELETE /api/kiosk/visitors/:id */
export const deleteVisitor = (req, res) => {
    if (!removeVisitor(req.params.id)) {
        return res.status(404).json({ success: false, error: 'NotFound', message: 'Visitor not found or already expired' });
    }
    return res.status(200).json({ success: true, message: 'Visitor deleted' });
};

/** DELETE /api/kiosk/visitors */
export const deleteAllVisitors = (req, res) => {
    const count = clearVisitors();
    return res.status(200).json({ success: true, message: `Deleted ${count} visitor(s)`, count });
};
