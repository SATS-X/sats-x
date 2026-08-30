import axios from 'axios'
import { API_BASE_URL } from '../config/api'

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000,
    // Refresh token sống trong cookie httpOnly (backend đặt qua Set-Cookie ở /api/auth/login),
    // không phải trong localStorage — bắt buộc bật withCredentials để trình duyệt gửi kèm
    // cookie này ở mọi request, kể cả khi frontend và backend khác origin.
    withCredentials: true
})

client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('attendance_access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

let refreshPromise = null

// Nhiều request 401 cùng lúc (ví dụ Dashboard gọi 3 API song song khi token vừa hết hạn)
// chỉ nên kích hoạt đúng một lần gọi /refresh, không phải một lần mỗi request.
const refreshAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Không thử refresh cho chính các endpoint xác thực công khai — 401 ở đây nghĩa là
        // sai thông tin đăng nhập thật, không phải access token hết hạn.
        const isAuthEntryPoint = ['/api/auth/login', '/api/auth/refresh', '/api/auth/activate'].some((p) =>
            originalRequest.url?.includes(p)
        )

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEntryPoint) {
            originalRequest._retry = true

            try {
                const res = await refreshAccessToken()
                const newAccessToken = res.data?.accessToken

                if (res.data?.success && newAccessToken) {
                    localStorage.setItem('attendance_access_token', newAccessToken)
                    if (res.data.user) {
                        localStorage.setItem('attendance_user', JSON.stringify(res.data.user))
                    }
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return client(originalRequest)
                }
            } catch (refreshErr) {
                console.warn('Session expired. Logging out...', refreshErr)
            }

            localStorage.removeItem('attendance_access_token')
            localStorage.removeItem('attendance_user')
            window.dispatchEvent(new Event('auth:logout'))
        }

        return Promise.reject(error)
    }
)

export default client
