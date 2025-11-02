import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

/**
 * Add a student to a subject
 * POST /api/subjects/:subject_id/students/:student_id
 * @param {string} subjectId - Subject ID
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Response data from API
 */
export const addStudentToSubject = async (subjectId, studentId) => {
    try {
        if (!subjectId) {
            throw new Error('Subject ID is required')
        }
        if (!studentId) {
            throw new Error('Student ID is required')
        }

        const response = await axios.post(
            `${API_BASE_URL}/api/subject/${subjectId}/students/${studentId}`,
            {},
            {
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
        )

        return response.data
    } catch (error) {
        console.error('Error adding student to subject:', error.response?.data || error.message)
        
        if (error.response?.status === 404) {
            throw {
                message: error.response?.data?.error || 'Subject or student not found',
                status: 404,
                data: error.response?.data || null
            }
        } else if (error.response?.status === 409) {
            throw {
                message: error.response?.data?.error || 'Student is already enrolled in this subject',
                status: 409,
                data: error.response?.data || null
            }
        } else {
            throw {
                message: error.response?.data?.error || error.message || 'Failed to add student to subject',
                status: error.response?.status || 500,
                data: error.response?.data || null
            }
        }
    }
}

export default addStudentToSubject
