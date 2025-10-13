import axios from 'axios'
import { API_BASE_URL } from '../../config/api'

export const updateSchedule = async (scheduleData) => {
    try {
        if (!scheduleData) {
            throw new Error('Schedule data is required')
        }

        // Validate required fields
        const requiredFields = ['day', 'month', 'year', 'subject_id', 'start_time']
        const missingFields = requiredFields.filter(field => !scheduleData[field])
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
        }

        console.log('Updating schedule with data:', scheduleData)

        const response = await axios.put(
            `${API_BASE_URL}/api/schedule/update-schedule`, 
            scheduleData,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        )

        console.log('Schedule updated successfully:', response.data)
        return response.data
    } catch (error) {
        console.error('Error updating schedule:', error.response?.data || error.message)
        throw {
            message: error.response?.data?.error || error.message,
            status: error.response?.status || 500,
            data: error.response?.data || null
        }
    }
}

export default updateSchedule

