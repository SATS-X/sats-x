import client from '../client'

export const getClasses = async () => {
    const res = await client.get('/api/class')
    return res.data
}

export const getClassById = async (classId) => {
    const res = await client.get(`/api/class/${classId}`)
    return res.data
}

export const createClass = async (classData) => {
    const res = await client.post('/api/class', classData)
    return res.data
}

export const updateClass = async (classId, classData) => {
    const res = await client.put(`/api/class/${classId}`, classData)
    return res.data
}

export const deleteClass = async (classId) => {
    const res = await client.delete(`/api/class/${classId}`)
    return res.data
}

export default {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
}
