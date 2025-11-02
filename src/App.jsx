import './App.css'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Layout from './components/shared/Layout'
import Profile from './pages/Profile'
import Subject from './pages/Subject'
import Students from './pages/Students'
import Classes from './pages/Classes'
import Settings from './pages/Settings'
import FaceManagement from './pages/FaceManagement'
import { LanguageProvider } from './contexts/LanguageContext'
import { ToastProvider } from './contexts/ToastContext'
import { WebSocketProvider } from './contexts/WebSocketContext'

import { Routes, Route, Navigate } from 'react-router-dom'

import PropTypes from 'prop-types'
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
import Attendance from './pages/Attendance'
import Schedule from './pages/Schedule'
import { components, customStyles } from './pages/Login'

Amplify.configure(outputs)

const formFields = {
    signUp: {
        email: {
            order: 1
        },
        preferred_username: {
            order: 2
        },
        phone_number: {
            order: 4,
            dialCode: '+84'
        },
        birthdate: {
            order: 5
        },
        password: {
            order: 6
        },
        confirm_password: {
            order: 7
        }
    }
}

const signUpAttributes = ['birthdate', 'preferred_username', 'phone_number']

function RequireAuth({ children }) {

    const { authStatus } = useAuthenticator((context) => [context.authStatus])

    if (authStatus !== 'authenticated') {
        return <Navigate to="/login" replace />
    }

    return children
}

function App() {
    return (
        <LanguageProvider>
            <ToastProvider>
                <WebSocketProvider>
                    <Authenticator.Provider>
                        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
                        <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/login"
                        element={
                            <Authenticator formFields={formFields} signUpAttributes={signUpAttributes} components={components}>
                                {({ user }) => (user ? <Navigate to="/dashboard" replace /> : <Home />)}
                            </Authenticator>
                        }
                    />

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
                        <Route path=":subjectId/:classId" element={<Schedule />} />
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

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Authenticator.Provider>
                </WebSocketProvider>
            </ToastProvider>
        </LanguageProvider>
    )
}

RequireAuth.propTypes = {
    children: PropTypes.node.isRequired
}

export default App
