import './App.css'
import PropTypes from 'prop-types'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spinner } from './components/ui'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages & Components
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/shared/Layout'
import Profile from './pages/Profile'
import Subject from './pages/Subject'
import Students from './pages/Students'
import Classes from './pages/Classes'
import Settings from './pages/Settings'
import FaceManagement from './pages/FaceManagement'
import Attendance from './pages/Attendance'
import Schedule from './pages/Schedule'
import Live from './pages/Live'
import Devices from './pages/Devices'
import CheckIn from './pages/CheckIn'
import ClassDetail from './pages/ClassDetail'
import Kiosk from './pages/Kiosk'
import NotFound from './pages/NotFound'

// Route Guard
function RequireAuth({ children }) {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-bg text-text">
                <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <span className="font-data text-xs text-text-tertiary">Starting SATS X...</span>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

RequireAuth.propTypes = {
    children: PropTypes.node.isRequired
}

export default function App() {
    return (
        <ThemeProvider>
        <LanguageProvider>
            <ToastProvider>
                <AuthProvider>
                    <WebSocketProvider>
                        <Routes>
                            {/* Public Landing & Login */}
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />

                            {/* Mọi trang quản lý dùng chung một layout có sidebar. */}
                            <Route
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/dashboard/profile" element={<Profile />} />
                                <Route path="/live" element={<Live />} />
                                <Route path="/check-in" element={<CheckIn />} />
                                <Route path="/devices" element={<Devices />} />
                                <Route path="/classes" element={<Classes />} />
                                <Route path="/classes/:classId" element={<ClassDetail />} />
                                <Route path="/students" element={<Students />} />
                                <Route path="/subjects" element={<Subject />} />
                                <Route path="/attendance" element={<Attendance />} />
                                <Route path="/schedule" element={<Schedule />} />
                                <Route path="/face-management" element={<FaceManagement />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>

                            {/* Kiosk triển lãm chiếm toàn màn hình, chạy dưới tài khoản nhân viên. */}
                            <Route
                                path="/kiosk"
                                element={
                                    <RequireAuth>
                                        <Kiosk />
                                    </RequireAuth>
                                }
                            />

                            <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </WebSocketProvider>
                </AuthProvider>
            </ToastProvider>
        </LanguageProvider>
        </ThemeProvider>
    )
}
