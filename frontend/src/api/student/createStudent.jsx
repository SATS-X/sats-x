import client from '../client'

export const createStudent = async (studentData) => {
    const res = await client.post('/api/student', studentData)
    return res.data
}

export default createStudent
