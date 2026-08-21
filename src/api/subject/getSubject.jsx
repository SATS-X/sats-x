import client from '../client'

// GET /api/subject/teacher/:teacher_id — chỉ xem được môn của chính mình (trừ admin).
export const getSubjectsByTeacherId = async (teacherId) => {
    if (!teacherId) return { success: false, data: [] }
    const res = await client.get(`/api/subject/teacher/${teacherId}`)
    return res.data
}

export const getSubjectById = async (subjectId) => {
    const res = await client.get(`/api/subject/${subjectId}`)
    return res.data
}

export const getSubjectStudents = async (subjectId) => {
    const res = await client.get(`/api/subject/${subjectId}/students`)
    return res.data
}

export default {
    getSubjectsByTeacherId,
    getSubjectById,
    getSubjectStudents
}
