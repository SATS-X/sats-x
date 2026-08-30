import client from '../client'

export const deleteStudent = async (studentId) => {
    const res = await client.delete(`/api/student/${studentId}`)
    return res.data
}

export default deleteStudent
