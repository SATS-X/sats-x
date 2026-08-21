import client from '../client'

export const getAllAttendance = async (params = {}) => {
    const res = await client.get('/api/attendance', { params })
    return res.data
}

export const getAllAttendanceByClassId = async (classId) => {
    if (!classId) return { success: false, data: [] }
    const res = await client.get(`/api/attendance/class/${classId}`)
    return res.data
}

export const getAllAttendanceByStudentId = async (studentId) => {
    if (!studentId) return { success: false, data: [] }
    const res = await client.get(`/api/attendance/student/${studentId}`)
    return res.data
}

export const getAllStudentsBySubjectId = async (subjectId) => {
    if (!subjectId) return { success: false, data: [] }
    const res = await client.get(`/api/attendance/subject/${subjectId}`)
    return res.data
}

export default {
    getAllAttendance,
    getAllAttendanceByClassId,
    getAllAttendanceByStudentId,
    getAllStudentsBySubjectId
}
