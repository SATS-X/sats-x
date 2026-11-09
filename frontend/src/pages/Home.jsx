import { Link } from 'react-router-dom'
import {
    LuActivity,
    LuArrowRight,
    LuCamera,
    LuCheck,
    LuChevronRight,
    LuClipboardList,
    LuCloud,
    LuCpu,
    LuDatabase,
    LuFingerprint,
    LuGauge,
    LuLock,
    LuRadio,
    LuScanFace,
    LuServer,
    LuShieldCheck,
    LuUsers
} from 'react-icons/lu'
import { useAuth } from '../contexts/AuthContext'
import { BrandMark, Button, ThemeToggle } from '../components/ui'
import styles from '../styles/marketing.module.css'

const CAPABILITIES = [
    {
        icon: LuCamera,
        title: 'Touchless capture',
        description: 'A proximity sensor wakes the classroom camera when a student stands in frame. Nobody signs a sheet or scans a code.'
    },
    {
        icon: LuFingerprint,
        title: 'Class-scoped identity',
        description: 'Every class matches against its own Rekognition collection, so a face is only ever compared with the right roster.'
    },
    {
        icon: LuClipboardList,
        title: 'Automatic records',
        description: 'Each match is checked against the timetable and saved as on time or late, ready to review or export.'
    },
    {
        icon: LuRadio,
        title: 'Connected operations',
        description: 'See whether the device gateway is online and trigger a capture from the console when a session needs it.'
    }
]

const WORKFLOW = [
    { step: '01', icon: LuRadio, title: 'Detect', description: 'The ESP32 sensor sees someone at the door for three seconds and signals the camera over MQTT.' },
    { step: '02', icon: LuCamera, title: 'Capture', description: 'The ESP32-CAM takes a frame and sends it to AWS over a secured WebSocket.' },
    { step: '03', icon: LuScanFace, title: 'Match', description: 'Rekognition searches the collection for that class and returns the closest verified identity.' },
    { step: '04', icon: LuClipboardList, title: 'Record', description: 'SATS X finds the running session, writes the attendance, and shows the result on the device.' }
]

const SAFEGUARDS = [
    'Only signed-in staff can enroll or remove a face',
    'Devices connect with their own credentials',
    'Every face deletion asks for confirmation first',
    'Photos stay in private S3 storage'
]

const CONTROLS = [
    { icon: LuUsers, label: 'Face enrollment', value: 'Staff only' },
    { icon: LuLock, label: 'Device channel', value: 'Token required' },
    { icon: LuDatabase, label: 'Image storage', value: 'Private S3' },
    { icon: LuGauge, label: 'Match threshold', value: '95%' }
]

const STACK = [
    { icon: LuCpu, label: 'ESP32-CAM' },
    { icon: LuRadio, label: 'AWS IoT Core' },
    { icon: LuCloud, label: 'API Gateway' },
    { icon: LuServer, label: 'AWS Lambda' },
    { icon: LuScanFace, label: 'Rekognition' },
    { icon: LuDatabase, label: 'PostgreSQL' }
]

const FACTS = [
    ['ESP32-CAM', 'Edge capture'],
    ['MQTT + WSS', 'Device transport'],
    ['Per class', 'Face collections'],
    ['On time / Late', 'Automatic status']
]

const TRACE = [
    ['Person detected', 'done'],
    ['Frame captured', 'done'],
    ['Face matched', 'active'],
    ['Record saved', 'queued']
]

function SectionLabel({ children }) {
    return <p className="eyebrow mb-5">{children}</p>
}

function PipelineNode({ icon: Icon, children, active }) {
    return (
        <div className={active ? `${styles.node} ${styles.nodeActive}` : styles.node}>
            <Icon className={active ? 'h-3.5 w-3.5 text-accent' : 'h-3.5 w-3.5'} aria-hidden="true" />
            <span>{children}</span>
        </div>
    )
}

function Line() {
    return (
        <div className={styles.line} aria-hidden="true">
            <span className={styles.signal} />
        </div>
    )
}

function AttendancePipeline() {
    return (
        <div className={styles.previewWrap} role="img" aria-label="Sample attendance pipeline from classroom sensor to a saved record">
            <div className={styles.previewGlow} />
            <div className={styles.previewCard}>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5" aria-hidden="true">
                            <span className="h-2 w-2 rounded-full bg-text/15" />
                            <span className="h-2 w-2 rounded-full bg-text/15" />
                            <span className="h-2 w-2 rounded-full bg-text/15" />
                        </div>
                        <span className="ml-2 font-mono text-[10px] text-text-tertiary">classroom.pipeline</span>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-text-tertiary">
                        Sample data
                    </span>
                </div>

                <div className="grid grid-cols-[1fr_124px] sm:grid-cols-[1fr_156px]">
                    <div className={`${styles.canvas} border-r border-border`}>
                        <div className={styles.stage}>
                            <PipelineNode icon={LuRadio}>Proximity sensor</PipelineNode>
                            <Line />
                            <PipelineNode icon={LuCamera}>ESP32-CAM</PipelineNode>
                            <Line />
                            <PipelineNode icon={LuScanFace} active>
                                Rekognition
                            </PipelineNode>
                            <div className={styles.branch} aria-hidden="true">
                                <svg viewBox="0 0 100 42" preserveAspectRatio="none">
                                    <path className={styles.flowPath} d="M50 0C50 20 25 20 25 42" />
                                    <path className={styles.flowPath} d="M50 0C50 20 75 20 75 42" />
                                    <circle className={styles.particle} r="2">
                                        <animateMotion dur="2.8s" repeatCount="indefinite" path="M50 0C50 20 25 20 25 42" />
                                    </circle>
                                    <circle className={styles.particle} r="2">
                                        <animateMotion begin="1.4s" dur="2.8s" repeatCount="indefinite" path="M50 0C50 20 75 20 75 42" />
                                    </circle>
                                </svg>
                            </div>
                            <div className="grid w-full grid-cols-2 justify-items-center gap-2">
                                <PipelineNode icon={LuDatabase}>Image history</PipelineNode>
                                <PipelineNode icon={LuClipboardList}>Attendance</PipelineNode>
                            </div>
                        </div>
                    </div>

                    <div className="p-3">
                        <div className="mb-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-text-tertiary">
                            <LuActivity className="h-3 w-3" aria-hidden="true" />
                            Event trace
                        </div>
                        <div className="space-y-4">
                            {TRACE.map(([label, state], index) => (
                                <div key={label} className={`${styles.traceItem} relative pl-4`}>
                                    {index < TRACE.length - 1 && <span className="absolute left-[3px] top-3 h-6 w-px bg-border" />}
                                    <span
                                        className={`absolute left-0 top-1 h-[7px] w-[7px] rounded-full ${
                                            state === 'done' ? 'bg-present' : state === 'active' ? 'bg-accent' : 'border border-border-strong'
                                        }`}
                                    />
                                    <p className="text-[11px] leading-4 text-text-secondary">{label}</p>
                                    <p className="font-mono text-[9px] text-text-tertiary">{state}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 rounded-lg border border-border bg-surface-sunken p-2.5">
                            <div className="mb-2 flex items-center justify-between text-[10px] text-text-tertiary">
                                <span>Similarity</span>
                                <span className="font-mono text-accent">98.4%</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-text/10">
                                <div className="brand-gradient h-full w-[98.4%] rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Home() {
    const { isAuthenticated } = useAuth()
    const entryPath = isAuthenticated ? '/dashboard' : '/login'

    return (
        <div className={styles.page}>
            <div className={styles.ambient} aria-hidden="true">
                <span className={styles.orbOne} />
                <span className={styles.orbTwo} />
            </div>

            <header className={styles.header}>
                <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 lg:px-8">
                    <a href="#top" aria-label="SATS X home" className="rounded-lg">
                        <BrandMark />
                    </a>
                    <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
                        <a className={styles.navLink} href="#platform">Platform</a>
                        <a className={styles.navLink} href="#workflow">Workflow</a>
                        <a className={styles.navLink} href="#safeguards">Safeguards</a>
                        <a className={styles.navLink} href="#stack">Stack</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button as={Link} to={entryPath} className="h-9">
                            {isAuthenticated ? 'Open workspace' : 'Sign in'}
                            <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                    </div>
                </div>
            </header>

            <main>
                <section id="top" className="mx-auto grid max-w-[1200px] items-center gap-16 px-5 pb-20 pt-32 lg:min-h-[760px] lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-24 lg:pt-28">
                    <div className={styles.enter}>
                        <div className={`${styles.statusPill} mb-6`}>
                            <span className={styles.liveDot} />
                            Biometric attendance for connected classrooms
                            <LuChevronRight className="h-3 w-3 text-text-tertiary" aria-hidden="true" />
                        </div>
                        <h1 className={styles.heroTitle}>
                            Attendance that <span className={styles.gradientText}>runs itself.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                            SATS X connects edge cameras, facial recognition, and live operations in one dependable system. Know who arrived, when they
                            arrived, and what needs attention.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Button as={Link} to={entryPath} size="lg">
                                Enter SATS X
                                <LuArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button as="a" href="#workflow" variant="secondary" size="lg">
                                See how it works
                            </Button>
                        </div>
                        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-tertiary">
                            {['No sign-in sheets', 'Per-class matching', 'Exportable records'].map((item) => (
                                <span key={item} className="flex items-center gap-1.5">
                                    <LuCheck className="h-3 w-3 text-present" aria-hidden="true" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    <AttendancePipeline />
                </section>

                <section className="border-y border-border">
                    <div className="mx-auto grid max-w-[1200px] grid-cols-2 divide-x divide-border px-5 sm:grid-cols-4 lg:px-8">
                        {FACTS.map(([value, label]) => (
                            <div key={label} className="px-4 py-6 text-center sm:py-7">
                                <p className="font-mono text-base font-medium text-text">{value}</p>
                                <p className="mt-1 text-xs text-text-tertiary">{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="platform" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-24 lg:px-8 lg:py-32">
                    <div className="max-w-2xl">
                        <SectionLabel>The platform</SectionLabel>
                        <h2 className={styles.sectionTitle}>One continuous attendance pipeline.</h2>
                        <p className={styles.sectionDescription}>From the classroom edge to a verified record in seconds, with rosters, schedules, and face collections in one workspace.</p>
                    </div>
                    <div className="mt-14 grid gap-4 md:grid-cols-2">
                        {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                            <article key={title} className={styles.featureCard}>
                                <div className="relative">
                                    <div className={`${styles.iconTile} mb-10`}>
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-xl font-medium tracking-[-0.025em] text-text">{title}</h3>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">{description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="workflow" className="scroll-mt-20 border-y border-border bg-surface-sunken/60 py-24 lg:py-32">
                    <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div className="max-w-2xl">
                                <SectionLabel>How it works</SectionLabel>
                                <h2 className={styles.sectionTitle}>A student walks in. The record writes itself.</h2>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-text-secondary">Four steps run in order on every arrival, with no action from the student or the instructor.</p>
                        </div>
                        <div className="mt-14 grid overflow-hidden rounded-2xl border border-border bg-surface shadow-panel md:grid-cols-4">
                            {WORKFLOW.map(({ step, icon: Icon, title, description }, index) => (
                                <article key={step} className={`p-6 ${index < WORKFLOW.length - 1 ? 'border-b border-border md:border-b-0 md:border-r' : ''}`}>
                                    <div className="mb-8 flex items-center justify-between">
                                        <div className={styles.iconTile}>
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                        </div>
                                        <span className="font-mono text-[11px] text-text-tertiary">{step}</span>
                                    </div>
                                    <h3 className="text-base font-medium text-text">{title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="safeguards" className="mx-auto grid max-w-[1200px] scroll-mt-20 items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
                    <div>
                        <SectionLabel>Biometric safeguards</SectionLabel>
                        <h2 className={styles.sectionTitle}>Sensitive data. Clear boundaries.</h2>
                        <p className={styles.sectionDescription}>A face is not a password anyone can reset. SATS X keeps enrollment deliberate, access limited, and removal explicit.</p>
                        <div className="mt-8 space-y-3">
                            {SAFEGUARDS.map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-present/25 bg-present/[0.08]">
                                        <LuCheck className="h-3 w-3 text-present" aria-hidden="true" />
                                    </span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
                        <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-sm text-text-secondary">
                            <LuShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                            Access controls
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-border">
                            {CONTROLS.map(({ icon: Icon, label, value }) => (
                                <div key={label} className="bg-surface p-5 sm:p-6">
                                    <Icon className="mb-7 h-4 w-4 text-accent" aria-hidden="true" />
                                    <p className="text-xs text-text-tertiary">{label}</p>
                                    <p className="mt-1 font-mono text-sm text-text">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="stack" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 pb-24 lg:px-8 lg:pb-32">
                    <div className="text-center">
                        <SectionLabel>Built on</SectionLabel>
                        <h2 className={`${styles.sectionTitle} mx-auto max-w-2xl`}>From a door sensor to the cloud.</h2>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
                        {STACK.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex min-h-[112px] flex-col items-center justify-center gap-2.5 bg-surface text-xs text-text-secondary">
                                <Icon className="h-5 w-5 text-text-tertiary" aria-hidden="true" />
                                {label}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="px-5 pb-24 lg:px-8 lg:pb-32">
                    <div className={`${styles.finalCta} mx-auto max-w-[1136px]`}>
                        <div className="relative z-10 mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
                            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-5xl">Ready for the next session.</h2>
                            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
                                Configure classes, register identities, and monitor attendance from a single operational workspace.
                            </p>
                            <Button as={Link} to={entryPath} size="lg" className="mt-8">
                                Get started
                                <LuArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <BrandMark />
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">Built for connected learning environments</p>
                    <div className="flex items-center gap-5 text-xs text-text-tertiary">
                        <Link to={entryPath} className="transition-colors hover:text-text">Workspace</Link>
                        <a href="#platform" className="transition-colors hover:text-text">Platform</a>
                        <span>© {new Date().getFullYear()}</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
