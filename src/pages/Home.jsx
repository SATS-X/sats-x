import { Link } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi'
import { RiFingerprintLine, RiCpuLine, RiCloudLine } from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import { Badge, Button, ThemeToggle } from '../components/ui'
import ptitLogo from '../assets/images/ptit-bg.png'

const ARCHITECTURE = [
    {
        icon: RiCpuLine,
        title: 'Thiết bị biên IoT (ESP32)',
        description:
            'Cảm biến phát hiện chuyển động kết hợp camera ESP32-CAM chụp ảnh sinh viên, truyền dữ liệu qua MQTT (AWS IoT Core) và WebSocket.',
        tags: ['ESP32-CAM', 'FreeRTOS', 'MQTT']
    },
    {
        icon: RiCloudLine,
        title: 'AWS serverless & AI',
        description:
            'API Gateway WebSocket kết nối trực tiếp AWS Lambda, trích xuất đặc trưng khuôn mặt bằng AWS Rekognition, lưu ảnh lịch sử trên S3.',
        tags: ['API Gateway', 'Rekognition', 'S3']
    },
    {
        icon: RiFingerprintLine,
        title: 'Bảng điều khiển giảng viên',
        description:
            'Web app thời gian thực hiển thị kết quả điểm danh ngay lập tức, quản lý lịch học và bộ sưu tập khuôn mặt theo từng lớp.',
        tags: ['React + Vite', 'Tailwind CSS']
    }
]

export default function Home() {
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-[100dvh] bg-bg text-text">
            <header className="sticky top-0 z-40 border-b border-border bg-surface">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-card border border-border bg-white p-1">
                            <img src={ptitLogo} alt="PTIT" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold leading-none text-text">PTIT Attendance</div>
                            <div className="font-data mt-1 text-[11px] text-text-tertiary">Biometric IoT Platform</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                            <Button size="sm">
                                {isAuthenticated ? 'Vào hệ thống' : 'Đăng nhập'}
                                <HiOutlineArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-20 px-6 pb-24 pt-16">
                <section className="mx-auto max-w-2xl space-y-6 text-center">
                    <Badge>NCKH 2024-2025 · Đề tài nghiên cứu khoa học</Badge>

                    <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-text sm:text-5xl">
                        Điểm danh sinh viên bằng nhận diện khuôn mặt
                    </h1>

                    <p className="text-base leading-relaxed text-text-secondary">
                        Kết hợp phần cứng ESP32-CAM, AWS Rekognition và WebSocket thời gian thực — sinh viên không
                        cần thao tác gì, giáo viên xem kết quả ngay khi có mặt trong lớp.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                            <Button size="lg">
                                Truy cập hệ thống
                                <HiOutlineArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="#architecture">
                            <Button variant="secondary" size="lg">
                                Xem kiến trúc hệ thống
                            </Button>
                        </a>
                    </div>
                </section>

                <section id="architecture" className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-text">Kiến trúc hệ thống</h2>
                        <p className="text-sm text-text-secondary">Từ thiết bị biên IoT đến nền tảng serverless AWS.</p>
                    </div>

                    <div className="divide-y divide-border rounded-card border border-border bg-surface">
                        {ARCHITECTURE.map(({ icon: Icon, title, description, tags }) => (
                            <div key={title} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <h3 className="text-sm font-semibold text-text">{title}</h3>
                                    <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {tags.map((tag) => (
                                            <Badge key={tag} className="font-data">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="flex flex-col items-start justify-between gap-6 rounded-card border border-border bg-surface p-8 sm:flex-row sm:items-center">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-text">Sẵn sàng triển khai giảng đường</h2>
                        <p className="max-w-xl text-sm text-text-secondary">
                            Đã thử nghiệm thực tế với sinh viên các lớp D22CQCI01-N, D22CQCI01-B và D22CQVT01-N.
                        </p>
                    </div>
                    <Link to={isAuthenticated ? '/dashboard' : '/login'} className="shrink-0">
                        <Button size="lg">
                            Bắt đầu ngay
                            <HiOutlineArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </section>
            </main>

            <footer className="border-t border-border py-8 text-xs text-text-tertiary">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <img src={ptitLogo} alt="PTIT" className="h-5 w-5 object-contain" />
                        <span>Học viện Công nghệ Bưu chính Viễn thông — PTIT</span>
                    </div>
                    <div className="font-data">Đề tài NCKH 2024-2025 · Lớp D22CQCI01-N</div>
                </div>
            </footer>
        </div>
    )
}
