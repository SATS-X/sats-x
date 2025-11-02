import axios from 'axios'
import { API_BASE_URL } from '../../config/api'
 
export const deleteStudent = async (studentId) => {
    try {
        // Validate student ID
        if (!studentId) {
            throw new Error('Student ID is required')
        }

        console.log('Deleting student:', studentId)

        const response = await axios.delete(
            `${API_BASE_URL}/api/student/delete/${studentId}`,
            {
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
        )

        console.log('Student deleted successfully:', response.data)
        return response.data

    } catch (error) {
        console.error('Error deleting student:', error.response?.data || error.message)
        
        // Handle specific error cases
        if (error.response?.status === 404) {
            throw {
                message: 'Student not found',
                status: 404,
                data: error.response?.data || null
            }
        } else if (error.response?.status === 400) {
            throw {
                message: error.response?.data?.message || 'Invalid student ID',
                status: 400,
                data: error.response?.data || null
            }
        } else {
            throw {
                message: error.response?.data?.message || error.message || 'Failed to delete student',
                status: error.response?.status || 500,
                data: error.response?.data || null
            }
        }
    }
}

export default deleteStudent

