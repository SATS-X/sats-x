import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

/**
 * Remove a student from a subject
 * DELETE /api/subjects/:subject_id/students/:student_id
 * @param {string} subjectId - Subject ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Response data from API
 */
export const removeStudentFromSubject = async (subjectId, studentId) => {
    try {
        if (!subjectId) {
            throw new Error('Subject ID is required')
        }
        if (!studentId) {
            throw new Error('Student ID is required')
        }

        const response = await axios.delete(`${API_BASE_URL}/api/subject/${subjectId}/students/${studentId}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        return response.data
    } catch (error) {
        console.error('Error removing student from subject:', error.response?.data || error.message)

        if (error.response?.status === 404) {
            throw {
                message: error.response?.data?.error || 'Subject or student not found',
                status: 404,
                data: error.response?.data || null
            }
        } else {
            throw {
                message: error.response?.data?.error || error.message || 'Failed to remove student from subject',
                status: error.response?.status || 500,
                data: error.response?.data || null
            }
        }
    }
}

export default removeStudentFromSubject
