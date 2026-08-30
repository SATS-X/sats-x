import client from '../client'

export const getAllStudents = async (params = {}) => {
    const res = await client.get('/api/student', { params })
    return res.data
}

export const getAllStudentsByClassId = async (classId) => {
    if (!classId) return { success: false, data: [] }
    const res = await client.get(`/api/student/class/${classId}`)
    return res.data
}

export const getAllStudentsBySubjectId = async (subjectId) => {
    if (!subjectId) return { success: false, data: [] }
    const res = await client.get(`/api/student/subject/${subjectId}`)
    return res.data
}

export default {
    getAllStudents,
    getAllStudentsByClassId,
    getAllStudentsBySubjectId
}
