import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff, HiOutlineCheckCircle } from 'react-icons/hi'
import { RiFingerprintLine } from 'react-icons/ri'
import { BrandMark, Button, Field, Input, ThemeToggle } from '../components/ui'

const HIGHLIGHTS = [
    'Live biometric matching with clear confidence signals',
    'Bidirectional IoT Core MQTT and WebSocket connectivity',
    'Classes, schedules, students, and face records in one place'
]

export default function Login() {
    const [mode, setMode] = useState('login') // 'login' | 'activate'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { login, activate } = useAuth()
    const { showError, showSuccess } = useToast()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (mode === 'login') {
                const res = await login(email, password)
                if (res.success) {
                    showSuccess(`Welcome back, ${res.user?.full_name || res.user?.email}`, 'Signed in')
                    navigate('/dashboard')
                } else {
                    showError(res.message || 'Sign in failed', 'Authentication error')
                }
            } else {
                const res = await activate(email, password)
                if (res.success) {
                    showSuccess('Password created. You can now sign in.', 'Account activated')
                    setMode('login')
                    setPassword('')
                } else {
                    showError(res.message || 'Activation failed', 'Error')
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] bg-bg text-text">
            <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-12 lg:flex lg:w-1/2">
                <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-brand-end/20 blur-3xl" />
                <div className="flex items-center justify-between">
                    <BrandMark />
                    <ThemeToggle />
                </div>

                <div className="relative my-auto max-w-lg space-y-7">
                    <div className="inline-flex items-center gap-2 rounded-chip border border-border px-3 py-1.5 text-xs text-text-secondary">
                        <RiFingerprintLine className="h-4 w-4" />
                        AI Biometric Attendance Platform
                    </div>

                    <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-text">
                        Attendance intelligence, always in view.
                    </h1>

                    <p className="max-w-md text-base leading-relaxed text-text-secondary">
                        SATS X turns connected cameras and AWS recognition into a clear, real-time operational record.
                    </p>

                    <div className="space-y-3 pt-2">
                        {HIGHLIGHTS.map((text) => (
                            <div key={text} className="flex items-center gap-3 text-sm text-text-secondary">
                                <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-present" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="font-data text-xs text-text-tertiary">© 2026 SATS X · Intelligent attendance platform</div>
            </div>

            <div className="flex w-full items-center justify-center p-6 lg:w-1/2 sm:p-12">
                <div className="w-full max-w-sm space-y-6">
                    <div className="mb-2 flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-2.5">
                            <BrandMark />
                        </div>
                        <ThemeToggle />
                    </div>

                    <div className="space-y-6 rounded-card border border-border bg-surface p-6 sm:p-8">
                        <div className="flex rounded-card border border-border bg-surface-sunken p-1">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`flex-1 rounded-card py-2 text-xs font-semibold transition-colors ${
                                    mode === 'login' ? 'bg-accent text-accent-foreground' : 'text-text-secondary hover:text-text'
                                }`}
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('activate')}
                                className={`flex-1 rounded-card py-2 text-xs font-semibold transition-colors ${
                                    mode === 'activate' ? 'bg-accent text-accent-foreground' : 'text-text-secondary hover:text-text'
                                }`}
                            >
                                Activate account
                            </button>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-text">
                                {mode === 'login' ? 'Sign in to SATS X' : 'Activate your account'}
                            </h2>
                            <p className="mt-1 text-xs text-text-secondary">
                                {mode === 'login'
                                    ? 'Use your credentials to open the operations workspace.'
                                    : 'For invited instructors who have not created a password yet.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Work email" required>
                                <div className="relative">
                                    <HiOutlineMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@organization.edu"
                                        className="pl-9"
                                    />
                                </div>
                            </Field>

                            <Field label={mode === 'login' ? 'Password' : 'New password'} required>
                                <div className="relative">
                                    <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-9 pr-9"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <HiEyeOff className="h-4 w-4" /> : <HiEye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>

                            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                                {mode === 'login' ? 'Sign in' : 'Create password'}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-xs text-text-tertiary">
                        <Link to="/" className="hover:text-text-secondary">
                            ← Back to overview
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
