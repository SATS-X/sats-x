import client from '../client'

// Nhận diện chạy trên máy chủ cục bộ có thể mất vài giây ở lần đầu nạp model.
const FACE_TIMEOUT = 30000

export const getFaceEngineStatus = () => client.get('/api/faces/status').then((res) => res.data?.data)

export const getFaces = (classId) => client.get('/api/faces', { params: classId ? { class_id: classId } : {} }).then((res) => res.data)

export const addFace = (studentId, image, { force = false } = {}) =>
    client.post('/api/faces', { student_id: studentId, image, force }, { timeout: FACE_TIMEOUT }).then((res) => res.data)

export const deleteFace = (id) => client.delete(`/api/faces/${id}`).then((res) => res.data)

export const identifyStudent = (image, { checkIn = false, signal } = {}) =>
    client.post('/api/faces/identify', { image, check_in: checkIn }, { timeout: FACE_TIMEOUT, signal }).then((res) => res.data)

/** Ảnh cần token nên tải bằng axios rồi tạo blob URL; người gọi phải revoke khi không dùng. */
export const fetchFacePhoto = (id) =>
    client.get(`/api/faces/${id}/photo`, { responseType: 'blob' }).then((res) => URL.createObjectURL(res.data))

export const getVisitors = () => client.get('/api/kiosk/visitors').then((res) => res.data)

export const enrollVisitor = (nickname, image) =>
    client.post('/api/kiosk/visitors', { nickname, image, consent: true }, { timeout: FACE_TIMEOUT }).then((res) => res.data)

export const identifyVisitor = (image, { signal } = {}) =>
    client.post('/api/kiosk/identify', { image }, { timeout: FACE_TIMEOUT, signal }).then((res) => res.data)

export const deleteVisitor = (id) => client.delete(`/api/kiosk/visitors/${encodeURIComponent(id)}`).then((res) => res.data)

export const clearVisitors = () => client.delete('/api/kiosk/visitors').then((res) => res.data)
