import client from '../client'

export const removeStudentFromSubject = async ({ studentId, subjectId }) => {
    const res = await client.delete('/api/subject/student', {
        data: { studentId, subjectId }
    })
    return res.data
}

export default removeStudentFromSubject
