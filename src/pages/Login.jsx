import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff, HiOutlineCheckCircle } from 'react-icons/hi'
import { RiFingerprintLine } from 'react-icons/ri'
import { Button, Field, Input, ThemeToggle } from '../components/ui'
import ptitLogo from '../assets/images/ptit-bg.png'

const HIGHLIGHTS = [
    'Nhận diện khuôn mặt dưới 500ms, độ chính xác cao',
    'Tích hợp IoT Core MQTT & WebSocket hai chiều',
    'Quản lý lớp học, thời khoá biểu và sinh viên tự động'
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
                    showSuccess(`Chào mừng ${res.user?.full_name || res.user?.email}`, 'Đăng nhập thành công')
                    navigate('/dashboard')
                } else {
                    showError(res.message || 'Đăng nhập thất bại', 'Lỗi xác thực')
                }
            } else {
                const res = await activate(email, password)
                if (res.success) {
                    showSuccess('Đã đặt mật khẩu. Bạn có thể đăng nhập.', 'Kích hoạt thành công')
                    setMode('login')
                    setPassword('')
                } else {
                    showError(res.message || 'Kích hoạt thất bại', 'Lỗi')
                }
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-[100dvh] bg-bg text-text">
            <div className="hidden flex-col justify-between border-r border-border bg-surface p-12 lg:flex lg:w-1/2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-card border border-border bg-white p-1.5">
                            <img src={ptitLogo} alt="PTIT" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-text">PTIT Attendance System</div>
                            <div className="text-xs text-text-tertiary">Học viện Công nghệ Bưu chính Viễn thông</div>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="my-auto max-w-md space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-chip border border-border px-3 py-1.5 text-xs text-text-secondary">
                        <RiFingerprintLine className="h-4 w-4" />
                        AI Biometric Attendance Platform
                    </div>

                    <h1 className="text-3xl font-semibold leading-tight tracking-tight text-text">
                        Hệ thống điểm danh bằng nhận diện khuôn mặt
                    </h1>

                    <p className="text-sm leading-relaxed text-text-secondary">
                        Tự động nhận diện sinh viên qua camera ESP32-CAM và AWS Rekognition, đồng bộ dữ liệu thời gian
                        thực qua WebSocket và lưu trữ an toàn trên AWS S3.
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

                <div className="font-data text-xs text-text-tertiary">© 2024-2025 NCKH D22CQCI01-N · PTIT</div>
            </div>

            <div className="flex w-full items-center justify-center p-6 lg:w-1/2 sm:p-12">
                <div className="w-full max-w-sm space-y-6">
                    <div className="mb-2 flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-2.5">
                            <img src={ptitLogo} alt="PTIT" className="h-8 w-8 rounded-card border border-border bg-white object-contain p-1" />
                            <span className="text-sm font-semibold text-text">PTIT Attendance</span>
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
                                Đăng nhập
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('activate')}
                                className={`flex-1 rounded-card py-2 text-xs font-semibold transition-colors ${
                                    mode === 'activate' ? 'bg-accent text-accent-foreground' : 'text-text-secondary hover:text-text'
                                }`}
                            >
                                Kích hoạt tài khoản
                            </button>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-text">
                                {mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Kích hoạt tài khoản'}
                            </h2>
                            <p className="mt-1 text-xs text-text-secondary">
                                {mode === 'login'
                                    ? 'Nhập thông tin xác thực để truy cập hệ thống'
                                    : 'Dành cho giáo viên đã có trong hệ thống nhưng chưa đặt mật khẩu'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Email trường" required>
                                <div className="relative">
                                    <HiOutlineMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="teacher@ptit.edu.vn"
                                        className="pl-9"
                                    />
                                </div>
                            </Field>

                            <Field label={mode === 'login' ? 'Mật khẩu' : 'Mật khẩu mới'} required>
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
                                {mode === 'login' ? 'Đăng nhập' : 'Đặt mật khẩu'}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-xs text-text-tertiary">
                        <Link to="/" className="hover:text-text-secondary">
                            ← Quay lại trang giới thiệu
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
