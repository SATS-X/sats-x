import { randomUUID } from 'crypto';

/**
 * Khách tham quan ở chế độ triển lãm chỉ sống trong bộ nhớ, không bao giờ ghi vào DB,
 * và tự xoá sau VISITOR_TTL_MINUTES. Khởi động lại backend cũng xoá sạch.
 */
export const VISITOR_TTL_MS = (Number(process.env.VISITOR_TTL_MINUTES) || 15) * 60 * 1000;
const MAX_VISITORS = 300;
const SWEEP_MS = 30 * 1000;

const visitors = new Map();

const sweep = () => {
    const now = Date.now();
    for (const [id, visitor] of visitors) {
        if (visitor.expiresAt <= now) visitors.delete(id);
    }
};

setInterval(sweep, SWEEP_MS).unref();

const toPublic = (visitor) => ({
    id: visitor.id,
    nickname: visitor.nickname,
    photo: visitor.photo,
    created_at: new Date(visitor.createdAt).toISOString(),
    expires_at: new Date(visitor.expiresAt).toISOString()
});

export const addVisitor = ({ nickname, embedding, photo }) => {
    sweep();
    if (visitors.size >= MAX_VISITORS) {
        // Bỏ người cũ nhất thay vì từ chối người đang đứng trước máy.
        const oldest = [...visitors.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
        visitors.delete(oldest.id);
    }
    const now = Date.now();
    const visitor = { id: randomUUID(), nickname, embedding: Float64Array.from(embedding), photo, createdAt: now, expiresAt: now + VISITOR_TTL_MS };
    visitors.set(visitor.id, visitor);
    return toPublic(visitor);
};

export const visitorTemplates = () => {
    sweep();
    return [...visitors.values()].map((visitor) => ({ id: visitor.id, embedding: visitor.embedding, visitor }));
};

export const publicVisitor = toPublic;

export const listVisitors = () => {
    sweep();
    return [...visitors.values()].sort((a, b) => b.createdAt - a.createdAt).map(toPublic);
};

export const removeVisitor = (id) => visitors.delete(id);

export const clearVisitors = () => {
    const count = visitors.size;
    visitors.clear();
    return count;
};
