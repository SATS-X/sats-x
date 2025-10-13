import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

/**
 * Get all schedules
 * GET /api/schedule
 */
export const getAllSchedules = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/schedule`, {
            headers: { 'Content-Type': 'application/json' }
        })
        return response.data
    } catch (error) {
        console.error('Error fetching all schedules:', error.response?.data || error.message)
        throw {
            message: error.response?.data?.error || error.message,
            status: error.response?.status || 500,
            data: error.response?.data || null
        }
    }
}

/**
 * Get schedule by teacher ID
 * GET /api/schedule/:teacher_id
 */
export const getScheduleByTeacherId = async (teacherId) => {
    try {
        if (!teacherId) {
            throw new Error('Teacher ID is required')
        }

        const response = await axios.get(`${API_BASE_URL}/api/schedule/${teacherId}`, {
            headers: { 'Content-Type': 'application/json' }
        })
        return response.data
    } catch (error) {
        console.error('Error fetching schedule by teacher ID:', error.response?.data || error.message)
        throw {
            message: error.response?.data?.error || error.message,
            status: error.response?.status || 500,
            data: error.response?.data || null
        }
    }
}

/**
 * Update attendance window for a schedule
 * PUT /api/schedule/attendance-window
 */
export const updateAttendanceWindow = async (scheduleData) => {
    try {
        if (!scheduleData) {
            throw new Error('Schedule data is required')
        }

        const response = await axios.put(`${API_BASE_URL}/api/schedule/attendance-window`, scheduleData, {
            headers: { 'Content-Type': 'application/json' }
        })
        return response.data
    } catch (error) {
        console.error('Error updating attendance window:', error.response?.data || error.message)
        throw {
            message: error.response?.data?.error || error.message,
            status: error.response?.status || 500,
            data: error.response?.data || null
        }
    }
}

export default {
    getAllSchedules,
    getScheduleByTeacherId,
    updateAttendanceWindow
}
