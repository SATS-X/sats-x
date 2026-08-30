/**
 * Face Management & Attendance WebSocket API helpers
 * Routes matched directly with Terraform WebSocket Gateway & Lambdas
 */

/**
 * Trần an toàn cho ảnh base64 nhúng thẳng vào frame WebSocket.
 *
 * API Gateway đóng kết nối với code 1009 khi nhận frame > 32KB, và trình duyệt
 * không tự chia nhỏ frame. 30KB chừa lại ~2KB cho phần JSON còn lại (action,
 * classId, studentId). Đây chỉ là đường dự phòng — đường chính là upload thẳng
 * lên S3 qua presigned URL rồi chỉ gửi s3Key.
 */
export const WS_INLINE_IMAGE_MAX_BASE64 = 30 * 1024

export const listFaces = (ws, classId = 'D22CQCI01-N') => {
    if (!ws) return false
    const payload = {
        action: 'listFaces',
        classId
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

/**
 * Xin presigned PUT URL để đẩy ảnh gốc thẳng lên S3, không đi qua WebSocket.
 * Cần route "getUploadUrl" trên API Gateway (infrastructure/main.tf).
 */
export const requestUploadUrl = (ws, { classId, studentId }) =>
    ws.requestAction('getUploadUrl', { classId, studentId, contentType: 'image/jpeg' }, { timeout: 8000 })

/** Lập chỉ mục khuôn mặt từ ảnh đã nằm sẵn trên S3 (đường chính). */
export const addFaceFromS3 = (ws, { classId, studentId, s3Key }) =>
    ws.requestAction('addFace', { classId, studentId, s3Key }, { timeout: 25000 })

/** Lập chỉ mục từ ảnh base64 nhúng trong frame (dự phòng, phải < 32KB). */
export const addFaceInline = (ws, { classId, studentId, image }) =>
    ws.requestAction('addFace', { classId, studentId, image }, { timeout: 25000 })

export const deleteFace = (ws, classId, faceId) => {
    if (!ws || !classId || !faceId) return false
    const payload = {
        action: 'deleteFace',
        classId,
        faceId
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

export const deleteFaceAndImage = (ws, { classId, studentId, faceId }) => {
    if (!ws || !classId || !studentId || !faceId) return false
    const payload = {
        action: 'deleteFaceAndImage',
        classId,
        studentId,
        faceId
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

export const getCollectionInfo = (ws, classId = 'D22CQCI01-N') => {
    if (!ws) return false
    const payload = {
        action: 'getCollectionInfo',
        classId
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

export const compareFace = (ws, { classId, image }) => {
    if (!ws || !classId || !image) return false
    const payload = {
        action: 'compare',
        classId,
        image
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

export default {
    listFaces,
    requestUploadUrl,
    addFaceFromS3,
    addFaceInline,
    deleteFace,
    deleteFaceAndImage,
    getCollectionInfo,
    compareFace
}
