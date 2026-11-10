// API & WebSocket Configuration

// "" là giá trị hợp lệ (production build sau nginx reverse-proxy /api, cùng
// origin) nên dùng ?? thay vì || — || sẽ coi "" là falsy và rơi về fallback sai.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

// Live AWS WebSocket URL for attendance and face management
// Lấy từ `terraform output websocket_url` (infrastructure) — đổi mỗi lần
// API Gateway được tạo lại.
// Để trống thì SATS X chạy hoàn toàn cục bộ: không kết nối AWS, khuôn mặt được nhận
// diện bằng bộ máy OpenCV trên chính máy này (xem liveness/app/faces.py).
export const WS_URL = import.meta.env.VITE_WS_URL || ''
export const CLOUD_ENABLED = Boolean(WS_URL)

// 'local' lưu khuôn mặt trong Postgres; 'aws' dùng Rekognition qua WebSocket API.
export const FACE_PROVIDER = import.meta.env.VITE_FACE_PROVIDER || (CLOUD_ENABLED ? 'aws' : 'local')

export const WS_ATTENDANCE_URL = WS_URL
export const WS_FACE_MANAGEMENT_URL = WS_URL

// AWS S3 Configuration
export const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-1'
export const AWS_S3_BUCKET = import.meta.env.VITE_AWS_S3_BUCKET || 'attendance-system-dev-022499043310'

export default {
    API_BASE_URL,
    WS_URL,
    CLOUD_ENABLED,
    FACE_PROVIDER,
    WS_ATTENDANCE_URL,
    WS_FACE_MANAGEMENT_URL,
    AWS_REGION,
    AWS_S3_BUCKET
}
