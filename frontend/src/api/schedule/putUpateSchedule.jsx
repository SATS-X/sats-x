import client from '../client'

export const updateSchedule = async (scheduleId, scheduleData) => {
    const res = await client.put(`/api/schedule/${scheduleId}`, scheduleData)
    return res.data
}

export default updateSchedule
