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

                            {/* Protected Dashboard Routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Dashboard />} />
                                <Route path="profile" element={<Profile />} />
                            </Route>

                            <Route
                                path="/classes"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Classes />} />
                            </Route>

                            <Route
                                path="/students"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Students />} />
                            </Route>

                            <Route
                                path="/subjects"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Subject />} />
                            </Route>

                            <Route
                                path="/attendance"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Attendance />} />
                            </Route>

                            <Route
                                path="/schedule"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Schedule />} />
                            </Route>

                            <Route
                                path="/face-management"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<FaceManagement />} />
                            </Route>

                            <Route
                                path="/settings"
                                element={
                                    <RequireAuth>
                                        <Layout />
                                    </RequireAuth>
                                }
                            >
                                <Route index element={<Settings />} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </WebSocketProvider>
                </AuthProvider>
            </ToastProvider>
        </LanguageProvider>
        </ThemeProvider>
    )
}
