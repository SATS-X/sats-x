import client from '../client'

/** params: from, to (YYYY-MM-DD), subject_id */
export const getSchedule = async (params = {}) => {
    const res = await client.get('/api/schedule', { params })
    return res.data
}

export const createSchedule = async (payload) => {
    const res = await client.post('/api/schedule', payload)
    return res.data
}

export const updateSchedule = async (id, payload) => {
    const res = await client.put(`/api/schedule/${id}`, payload)
    return res.data
}

/** scope: undefined cho một buổi, 'series' cho buổi này và các buổi sau trong chuỗi. */
export const deleteSchedule = async (id, scope) => {
    const res = await client.delete(`/api/schedule/${id}`, { params: scope ? { scope } : {} })
    return res.data
}
