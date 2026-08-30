import client from '../client'

export const getSchedule = async () => {
    const res = await client.get('/api/schedule')
    return res.data
}

export const getScheduleBySubjectId = async (subjectId) => {
    if (!subjectId) return { success: false, data: [] }
    const res = await client.get(`/api/schedule/${subjectId}`)
    return res.data
}

export default {
    getSchedule,
    getScheduleBySubjectId
}
