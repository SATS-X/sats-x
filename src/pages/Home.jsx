import { Link } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi'
import { RiFingerprintLine, RiCpuLine, RiCloudLine } from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import { Badge, BrandMark, Button, ThemeToggle } from '../components/ui'

const ARCHITECTURE = [
    {
        icon: RiCpuLine,
        title: 'Connected edge devices',
        description:
            'ESP32-CAM devices capture attendance events and stream them securely through MQTT and WebSocket channels.',
        tags: ['ESP32-CAM', 'FreeRTOS', 'MQTT']
    },
    {
        icon: RiCloudLine,
        title: 'Serverless intelligence',
        description:
            'AWS Lambda and Rekognition process biometric matches while S3 keeps a traceable image history.',
        tags: ['API Gateway', 'Rekognition', 'S3']
    },
    {
        icon: RiFingerprintLine,
        title: 'Real-time operations',
        description:
            'A focused workspace for rosters, schedules, face collections, and live attendance decisions.',
        tags: ['React + Vite', 'Tailwind CSS']
    }
]

export default function Home() {
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-[100dvh] overflow-x-clip bg-bg text-text">
            <header className="sticky top-0 z-40 border-b border-border bg-surface/75 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <BrandMark />

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                            <Button size="sm">
                                {isAuthenticated ? 'Open workspace' : 'Sign in'}
                                <HiOutlineArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-32 px-6 pb-28 pt-20 sm:pt-28">
                <section className="relative mx-auto max-w-6xl space-y-8 text-center">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />
                    <Badge className="border border-accent/20 bg-accent/10 text-accent">Biometric attendance infrastructure</Badge>

                    <h1 className="mx-auto max-w-6xl text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-text">
                        Attendance that runs itself.
                    </h1>

                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
                        SATS X connects edge cameras, facial recognition, and live operations in one dependable system.
                        Know who arrived, when they arrived, and what needs attention.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                            <Button size="lg">
                                Enter SATS X
                                <HiOutlineArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="#architecture">
                            <Button variant="secondary" size="lg">
                                Explore the architecture
                            </Button>
                        </a>
                    </div>
                </section>

                <section id="architecture" className="space-y-8 scroll-mt-24">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-semibold tracking-tight text-text">One continuous attendance pipeline</h2>
                        <p className="text-sm text-text-secondary">From the classroom edge to a verified record in seconds.</p>
                    </div>

                    <div className="grid grid-flow-dense grid-cols-1 overflow-hidden rounded-[1.25rem] border border-border bg-surface/80 lg:grid-cols-12">
                        {ARCHITECTURE.map(({ icon: Icon, title, description, tags }) => (
                            <article key={title} className="group flex flex-col gap-5 border-b border-border p-7 transition-colors hover:bg-surface-hover lg:col-span-4 lg:border-b-0 lg:border-r last:border-0">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-accent/10 text-accent transition-transform duration-300 group-hover:-translate-y-1">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                    <h3 className="text-lg font-semibold text-text">{title}</h3>
                                    <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {tags.map((tag) => (
                                            <Badge key={tag} className="font-data">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="brand-gradient surface-glow flex flex-col items-start justify-between gap-8 rounded-[1.5rem] p-8 text-white sm:flex-row sm:items-center sm:p-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-semibold tracking-tight">Ready for the next session.</h2>
                        <p className="max-w-xl text-sm text-white/80">
                            Configure classes, register identities, and monitor attendance from a single operational workspace.
                        </p>
                    </div>
                    <Link to={isAuthenticated ? '/dashboard' : '/login'} className="shrink-0">
                        <Button size="lg" className="bg-white text-emerald-800 shadow-none [background-image:none] hover:bg-white/90">
                            Get started
                            <HiOutlineArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </section>
            </main>

            <footer className="border-t border-border py-8 text-xs text-text-tertiary">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                    <BrandMark />
                    <div className="font-data">Designed and built for connected learning environments.</div>
                </div>
            </footer>
        </div>
    )
}
