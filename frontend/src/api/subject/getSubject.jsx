import client from '../client'

// Chỉ admin được gọi; giáo viên dùng getSubjectsByTeacherId.
export const getAllSubjects = async () => {
    const res = await client.get('/api/subject')
    return res.data
}

// GET /api/subject/teacher/:teacher_id — chỉ xem được môn của chính mình (trừ admin).
export const getSubjectsByTeacherId = async (teacherId) => {
    if (!teacherId) return { success: false, data: [] }
    const res = await client.get(`/api/subject/teacher/${teacherId}`)
    return res.data
}

/** Môn học mà người dùng hiện tại được quản lý. */
export const getManagedSubjects = (user) => (user?.role === 'admin' ? getAllSubjects() : getSubjectsByTeacherId(user?.teacher_id))

export const getSubjectStudents = async (subjectId) => {
    const res = await client.get(`/api/subject/${subjectId}/students`)
    return res.data
}

export const createSubject = async (payload) => {
    const res = await client.post('/api/subject', payload)
    return res.data
}

export const updateSubject = async (subjectId, payload) => {
    const res = await client.put(`/api/subject/${subjectId}`, payload)
    return res.data
}

export const deleteSubject = async (subjectId) => {
    const res = await client.delete(`/api/subject/${subjectId}`)
    return res.data
}

export const addSubjectStudents = async (subjectId, studentIds) => {
    const res = await client.post(`/api/subject/${subjectId}/students`, { student_ids: studentIds })
    return res.data
}

export const removeSubjectStudent = async (subjectId, studentId) => {
    const res = await client.delete(`/api/subject/${subjectId}/students/${studentId}`)
    return res.data
}
