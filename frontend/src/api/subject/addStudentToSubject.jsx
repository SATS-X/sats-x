import client from '../client'

export const addStudentToSubject = async ({ studentId, subjectId }) => {
    const res = await client.post('/api/subject/student', { studentId, subjectId })
    return res.data
}

export default addStudentToSubject
