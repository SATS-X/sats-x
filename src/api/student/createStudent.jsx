import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

/**
 * Create a new student
 * POST /api/student/create
 * @param {Object} studentData - Student information
 * @param {string} studentData.student_id - Student ID
 * @param {string} studentData.full_name - Full name
 * @param {string} studentData.email - Email address
 * @param {string} studentData.phone_number - Phone number
 * @param {string} studentData.birthday - Birthday in DD/MM/YYYY format
 * @param {string} studentData.class_id - Class ID
 * @param {boolean} studentData.status - Status (true for active, false for inactive)
 * @returns {Promise<Object>} Response data from API
 */
export const createStudent = async (studentData) => {
    try {
        // Validate required fields
        if (!studentData.student_id) {
            throw new Error('Student ID is required')
        }
        if (!studentData.full_name) {
            throw new Error('Full name is required')
        }
        if (!studentData.email) {
            throw new Error('Email is required')
        }
        if (!studentData.phone_number) {
            throw new Error('Phone number is required')
        }
        if (!studentData.birthday) {
            throw new Error('Birthday is required')
        }
        if (!studentData.class_id) {
            throw new Error('Class ID is required')
        }

        // Format birthday from YYYY-MM-DD to DD/MM/YYYY
        const formatBirthday = (dateStr) => {
            if (!dateStr) return ''
            const date = new Date(dateStr)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            return `${day}/${month}/${year}`
        }

        // Prepare request payload
        const payload = {
            student_id: studentData.student_id,
            full_name: studentData.full_name,
            email: studentData.email,
            phone_number: studentData.phone_number,
            birthday: formatBirthday(studentData.birthday),
            class_id: studentData.class_id,
            status: studentData.status === 1 || studentData.status === true
        }

        console.log('Creating student with payload:', payload)

        const response = await axios.post(
            `${API_BASE_URL}/api/student/create`,
            payload,
            {
                headers: { 
                    'Content-Type': 'application/json'
                }
            }
        )

        console.log('Student created successfully:', response.data)
        return response.data

    } catch (error) {
        console.error('Error creating student:', error.response?.data || error.message)
        
        // Handle specific error cases
        if (error.response?.status === 400) {
            throw {
                message: error.response?.data?.message || 'Invalid student data',
                status: 400,
                data: error.response?.data || null
            }
        } else if (error.response?.status === 409) {
            throw {
                message: 'Student ID already exists',
                status: 409,
                data: error.response?.data || null
            }
        } else {
            throw {
                message: error.response?.data?.message || error.message || 'Failed to create student',
                status: error.response?.status || 500,
                data: error.response?.data || null
            }
        }
    }
}

export default createStudent

