import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LuArrowRight, LuCamera, LuClipboardList, LuEye, LuEyeOff, LuKeyRound, LuLock, LuMail, LuScanFace } from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { BrandMark, Button, Field, Input, Segmented, ThemeToggle } from '../components/ui'
import styles from '../styles/marketing.module.css'

const FLOW = [
    { icon: LuCamera, title: 'Capture at the door', detail: 'Connected cameras see each arrival' },
    { icon: LuScanFace, title: 'Verify against the class', detail: 'Faces match only that class collection' },
    { icon: LuClipboardList, title: 'Review the record', detail: 'On time and late, ready to export' }
]

const MODES = [
    { value: 'login', label: 'Sign in' },
    { value: 'activate', label: 'Activate account' }
]

export default function Login() {
    const [mode, setMode] = useState('login') // 'login' | 'activate'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [activationCode, setActivationCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { login, activate } = useAuth()
    const { showError, showSuccess } = useToast()
    const navigate = useNavigate()

    const isLogin = mode === 'login'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (isLogin) {
                const res = await login(email, password)
                if (res.success) {
                    showSuccess(`Welcome back, ${res.user?.full_name || res.user?.email}`, 'Signed in')
                    navigate('/dashboard')
                } else {
                    showError(res.message || 'Sign in failed', 'Authentication error')
                }
            } else {
                const res = await activate(email, activationCode, password)
                if (res.success) {
                    showSuccess('Password created. You can now sign in.', 'Account activated')
                    setMode('login')
                    setPassword('')
                    setActivationCode('')
                } else {
                    showError(res.message || 'Activation failed', 'Error')
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.grid} aria-hidden="true" />
            <div className={styles.ambient} aria-hidden="true">
                <span className={styles.orbOne} />
            </div>

            <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col px-5 py-5 sm:px-8 sm:py-7">
                <header className="flex items-center justify-between">
                    <Link to="/" aria-label="SATS X home" className="rounded-lg">
                        <BrandMark />
                    </Link>
                    <ThemeToggle />
                </header>

                <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_460px] lg:gap-20 lg:py-16">
                    <section className={`${styles.enter} hidden max-w-xl lg:block`}>
                        <p className="eyebrow mb-6">Intelligent attendance workspace</p>
                        <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-text">
                            Every arrival, <span className={styles.gradientText}>verified and recorded.</span>
                        </h2>
                        <p className="mt-6 max-w-lg text-[15px] leading-7 text-text-secondary">
                            Your rosters, schedules, face collections, and attendance records stay together in one workspace.
                        </p>

                        <div className={`${styles.flow} mt-10 space-y-4`}>
                            {FLOW.map(({ icon: Icon, title, detail }) => (
                                <div key={title} className={`${styles.flowNode} flex items-center gap-4`}>
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-accent shadow-panel">
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-text">{title}</p>
                                        <p className="mt-0.5 text-xs text-text-tertiary">{detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={`${styles.enter} mx-auto w-full max-w-[460px]`}>
                        <div className={styles.card}>
                            <Segmented options={MODES} value={mode} onChange={setMode} label="Account action" fill className="mb-7" />

                            <div className="mb-7">
                                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text">{isLogin ? 'Welcome back' : 'Activate your account'}</h1>
                                <p className="mt-2 text-sm leading-6 text-text-secondary">
                                    {isLogin ? 'Sign in to open your attendance workspace.' : 'Enter the one-time activation code from your administrator.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Field label="Work email" htmlFor="login-email">
                                    <Input
                                        id="login-email"
                                        type="email"
                                        icon={LuMail}
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@organization.edu"
                                        className="h-11 rounded-xl"
                                    />
                                </Field>

                                {!isLogin && (
                                    <Field label="Activation code" htmlFor="login-code">
                                        <Input
                                            id="login-code"
                                            type="text"
                                            icon={LuKeyRound}
                                            required
                                            autoComplete="one-time-code"
                                            spellCheck={false}
                                            value={activationCode}
                                            onChange={(e) => setActivationCode(e.target.value)}
                                            className="font-data h-11 rounded-xl"
                                        />
                                    </Field>
                                )}

                                <Field label={isLogin ? 'Password' : 'New password'} htmlFor="login-password">
                                    <div className="relative">
                                        <Input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            icon={LuLock}
                                            required
                                            minLength={8}
                                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-11 rounded-xl pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-text-tertiary hover:text-text"
                                        >
                                            {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </Field>

                                <Button type="submit" loading={isSubmitting} size="lg" className="mt-2 w-full">
                                    {isLogin ? 'Sign in' : 'Create password'}
                                    {!isSubmitting && <LuArrowRight className="h-4 w-4" aria-hidden="true" />}
                                </Button>
                            </form>

                            <div className="mt-6 border-t border-border pt-5 text-center text-xs text-text-tertiary">
                                <Link to="/" className="transition-colors hover:text-text">
                                    Back to overview
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    )
}
