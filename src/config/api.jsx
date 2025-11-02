// API Configuration
// You can set the API base URL through environment variables
// For development: VITE_API_BASE_URL=http://localhost:4000
// For production: VITE_API_BASE_URL=https://your-api-domain.com

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

// WebSocket Configuration for Attendance (compare face)
// Lambda 1: Xử lý điểm danh với route 'compare'
export const WS_ATTENDANCE_URL =
    import.meta.env.VITE_WS_ATTENDANCE_URL || 'wss://zg1nxlo8m4.execute-api.ap-southeast-1.amazonaws.com/production/'

// WebSocket Configuration for Face Management (addFace, deleteFace, listFaces)
// Lambda 2: Quản lý khuôn mặt với routes 'addFace', 'deleteFace', 'listFaces', etc.
export const WS_FACE_MANAGEMENT_URL =
    import.meta.env.VITE_WS_FACE_MANAGEMENT_URL || 'wss://YOUR_FACE_MANAGEMENT_WEBSOCKET_URL/production/'

// Backward compatibility
export const WS_URL = WS_ATTENDANCE_URL

export default {
    API_BASE_URL,
    WS_URL,
    WS_ATTENDANCE_URL,
    WS_FACE_MANAGEMENT_URL
}
