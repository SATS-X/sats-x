/**
 * Face Management & Attendance WebSocket API helpers
 * Routes matched directly with Terraform WebSocket Gateway & Lambdas
 */

export const listFaces = (ws, classId = 'D22CQCI01-N') => {
    if (!ws) return false
    const payload = {
        action: 'listFaces',
        classId
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

export const addFace = (ws, { classId, studentId, image }) => {
    if (!ws || !classId || !studentId || !image) return false
    const payload = {
        action: 'addFace',
        classId,
        studentId,
        image
    }
    return ws.sendMessage ? ws.sendMessage(payload) : false
}

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
    addFace,
    deleteFace,
    deleteFaceAndImage,
    getCollectionInfo,
    compareFace
}
