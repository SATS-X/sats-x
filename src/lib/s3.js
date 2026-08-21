import { AWS_REGION, AWS_S3_BUCKET } from '../config/api'

/**
 * Generates an S3 Object URL
 * @param {string} key - e.g. "classes/D22CQCI01-N/B22DCCN001.jpg" or "history/..."
 * @returns {string} S3 Direct URL
 */
export const getS3Url = (key) => {
    if (!key) return null
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
        return key
    }
    // Standard regional S3 path
    const cleanKey = key.startsWith('/') ? key.slice(1) : key
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${cleanKey}`
}

/**
 * Formats a student photo URL with fallback support
 * @param {string} classId - Class identifier
 * @param {string} studentId - Student identifier
 * @returns {string} S3 path for student registered face
 */
export const getStudentPhotoUrl = (classId, studentId) => {
    if (!classId || !studentId) return null
    return getS3Url(`classes/${classId}/${studentId}.jpg`)
}
