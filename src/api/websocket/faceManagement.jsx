/**
 * Face Management WebSocket API helpers
 * Sử dụng với Lambda 2 (Face Management)
 */

/**
 * List all faces in collection
 */
export const listFaces = (ws, collectionId = 'attendance-system-collection') => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected')
        return false
    }

    try {
        const payload = {
            action: 'listFaces',
            collection_id: collectionId
        }

        console.log('📤 Sending listFaces request...')
        ws.send(JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('❌ Error sending listFaces request:', error)
        return false
    }
}

/**
 * Add face to collection
 */
export const addFace = (ws, {
    imageBase64,
    studentId,
    studentName,
    className,
    email,
    phoneNumber,
    collectionId = 'attendance-system-collection'
}) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected')
        return false
    }

    if (!imageBase64 || !studentId || !studentName || !className || !email || !phoneNumber) {
        console.error('❌ Missing required fields for addFace')
        return false
    }

    try {
        const payload = {
            action: 'addFace',
            image: imageBase64,
            student_id: studentId,
            student_name: studentName,
            class_name: className,
            email: email,
            phone_number: phoneNumber,
            collection_id: collectionId
        }

        console.log('📤 Sending addFace request for student:', studentName)
        ws.send(JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('❌ Error sending addFace request:', error)
        return false
    }
}

/**
 * Delete face from collection (keeps image in S3)
 */
export const deleteFace = (ws, faceId, collectionId = 'attendance-system-collection') => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected')
        return false
    }

    if (!faceId) {
        console.error('❌ faceId is required')
        return false
    }

    try {
        const payload = {
            action: 'deleteFace',
            face_id: faceId,
            collection_id: collectionId
        }

        console.log('📤 Sending deleteFace request...')
        ws.send(JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('❌ Error sending deleteFace request:', error)
        return false
    }
}

/**
 * Delete face and image completely
 */
export const deleteFaceAndImage = (ws, {
    faceId,
    studentId,
    studentName,
    className,
    collectionId = 'attendance-system-collection'
}) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected')
        return false
    }

    if (!faceId || !studentId || !studentName || !className) {
        console.error('❌ Missing required fields for deleteFaceAndImage')
        return false
    }

    try {
        const payload = {
            action: 'deleteFaceAndImage',
            face_id: faceId,
            student_id: studentId,
            student_name: studentName,
            class_name: className,
            collection_id: collectionId
        }

        console.log('📤 Sending deleteFaceAndImage request...')
        ws.send(JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('❌ Error sending deleteFaceAndImage request:', error)
        return false
    }
}

/**
 * Get collection info
 */
export const getCollectionInfo = (ws, collectionId = 'attendance-system-collection') => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket is not connected')
        return false
    }

    try {
        const payload = {
            action: 'getCollectionInfo',
            collection_id: collectionId
        }

        console.log('📤 Sending getCollectionInfo request...')
        ws.send(JSON.stringify(payload))
        return true
    } catch (error) {
        console.error('❌ Error sending getCollectionInfo request:', error)
        return false
    }
}

export default {
    listFaces,
    addFace,
    deleteFace,
    deleteFaceAndImage,
    getCollectionInfo
}
