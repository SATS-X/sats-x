import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import client from '../api/client'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('attendance_user')
        try {
            return saved ? JSON.parse(saved) : null
        } catch {
            return null
        }
    })
    const [token, setToken] = useState(() => localStorage.getItem('attendance_access_token'))
    const [isLoading, setIsLoading] = useState(true)

    // Verify or refresh current user session on mount
    const checkAuth = useCallback(async () => {
        const currentToken = localStorage.getItem('attendance_access_token')
        if (!currentToken) {
            setUser(null)
            setIsLoading(false)
            return
        }

        try {
            const res = await client.get('/api/auth/me')
            const userData = res.data?.user || res.data?.data
            if (res.data?.success && userData) {
                setUser(userData)
                localStorage.setItem('attendance_user', JSON.stringify(userData))
            }
        } catch (err) {
            console.warn('Auth verification failed:', err?.response?.data?.message || err.message)
            // If invalid token, clear
            if (err?.response?.status === 401) {
                setUser(null)
                setToken(null)
                localStorage.removeItem('attendance_access_token')
                localStorage.removeItem('attendance_user')
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        checkAuth()

        const handleLogoutEvent = () => {
            setUser(null)
            setToken(null)
        }

        window.addEventListener('auth:logout', handleLogoutEvent)
        return () => window.removeEventListener('auth:logout', handleLogoutEvent)
    }, [checkAuth])

    // Login with Email & Password
    const login = async (email, password) => {
        setIsLoading(true)
        try {
            const res = await client.post('/api/auth/login', { email, password })
            if (res.data?.success) {
                const userData = res.data.user
                const accessToken = res.data.accessToken
                // Refresh token không nằm trong body — backend đặt nó qua cookie httpOnly
                // (Set-Cookie ở response), trình duyệt tự giữ và tự gửi lại nhờ withCredentials.

                if (accessToken) {
                    localStorage.setItem('attendance_access_token', accessToken)
                    setToken(accessToken)
                }
                if (userData) {
                    localStorage.setItem('attendance_user', JSON.stringify(userData))
                    setUser(userData)
                }
                return { success: true, user: userData }
            }
            return { success: false, message: res.data?.message || 'Login failed' }
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Error connecting to auth service'
            return { success: false, message }
        } finally {
            setIsLoading(false)
        }
    }

    // Kích hoạt tài khoản đã có sẵn trong hệ thống (đặt mật khẩu lần đầu).
    // Khác với register: không tạo mới, chỉ đặt mật khẩu cho giáo viên đã tồn tại.
    const activate = async (email, password) => {
        try {
            const res = await client.post('/api/auth/activate', { email, password })
            return res.data
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || err.message || 'Account activation failed'
            }
        }
    }

    // Register a new user
    const register = async (userData) => {
        setIsLoading(true)
        try {
            const res = await client.post('/api/auth/register', userData)
            return res.data
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || err.message || 'Registration failed'
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Logout — backend đọc refresh token từ cookie (gửi kèm nhờ withCredentials) và thu hồi nó.
    const logout = async () => {
        try {
            await client.post('/api/auth/logout').catch(() => {})
        } finally {
            localStorage.removeItem('attendance_access_token')
            localStorage.removeItem('attendance_user')
            setUser(null)
            setToken(null)
        }
    }

    // Update Profile
    const updateProfile = async (profileData) => {
        try {
            const res = await client.put('/api/auth/me', profileData)
            const userData = res.data?.user || res.data?.data
            if (res.data?.success && userData) {
                setUser(userData)
                localStorage.setItem('attendance_user', JSON.stringify(userData))
                return { success: true, user: userData }
            }
            return { success: false, message: res.data?.message }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to update profile'
            }
        }
    }

    // Change Password
    const changePassword = async (oldPassword, newPassword) => {
        try {
            const res = await client.post('/api/auth/change-password', {
                current_password: oldPassword,
                new_password: newPassword
            })
            return res.data
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || 'Failed to change password'
            }
        }
    }

    const value = {
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        activate,
        register,
        logout,
        updateProfile,
        changePassword,
        checkAuth
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export default AuthContext
