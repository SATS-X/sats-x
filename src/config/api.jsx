// API & WebSocket Configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

// Live AWS WebSocket URL for attendance and face management
// Lấy từ `terraform output websocket_url` (attendance-system-infra) — đổi mỗi lần
// API Gateway được tạo lại.
export const WS_URL =
    import.meta.env.VITE_WS_URL ||
    'wss://7i91rxj536.execute-api.ap-southeast-1.amazonaws.com/production'

export const WS_ATTENDANCE_URL = WS_URL
export const WS_FACE_MANAGEMENT_URL = WS_URL

// AWS S3 Configuration
export const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-1'
export const AWS_S3_BUCKET = import.meta.env.VITE_AWS_S3_BUCKET || 'attendance-system-dev-022499043310'

export default {
    API_BASE_URL,
    WS_URL,
    WS_ATTENDANCE_URL,
    WS_FACE_MANAGEMENT_URL,
    AWS_REGION,
    AWS_S3_BUCKET
}
