import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

// Get all classes
export const getAllClasses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/class`)
        return response.data
    } catch (error) {
        console.error('Error fetching class:', error)
        throw {
            message: error.response?.data?.message || error.message,
            status: error.response?.status || 500
        }
    }
}

// Get class by ID
export const getClassById = async (classId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/class/${classId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching class:', error)
        throw {
            message: error.response?.data?.message || error.message,
            status: error.response?.status || 500
        }
    }
}

// Create new class
export const createClass = async (classData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/class`, classData)
        return response.data
    } catch (error) {
        console.error('Error creating class:', error)
        throw {
            message: error.response?.data?.message || error.message,
            status: error.response?.status || 500
        }
    }
}

// Update class
export const updateClass = async (classId, classData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/api/class/${classId}`, classData)
        return response.data
    } catch (error) {
        console.error('Error updating class:', error)
        throw {
            message: error.response?.data?.message || error.message,
            status: error.response?.status || 500
        }
    }
}

// Delete class
export const deleteClass = async (classId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/class/${classId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting class:', error)
        throw {
            message: error.response?.data?.message || error.message,
            status: error.response?.status || 500,
            data: error.response?.data
        }
    }
}
