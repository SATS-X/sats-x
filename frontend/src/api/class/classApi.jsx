import client from '../client'
export * from './getClasses'

export const getAllClasses = async () => {
    const res = await client.get('/api/class')
    return res.data
}

export default {
    getAllClasses
}

export const getClassById = async (classId) => {
    const res = await client.get(`/api/class/${encodeURIComponent(classId)}`)
    return res.data
}
