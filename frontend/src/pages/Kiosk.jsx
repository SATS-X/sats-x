import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { LuArrowLeft, LuCamera, LuLogOut, LuMaximize, LuScanFace, LuSettings2, LuShieldCheck, LuShieldAlert, LuTrash2, LuUserPlus, LuX } from 'react-icons/lu'
import { clearVisitors, deleteVisitor, enrollVisitor, getVisitors, identifyVisitor } from '../api/faces/faceApi'
import CameraView from '../components/camera/CameraView'
import useCamera from '../components/camera/useCamera'
import useRecognitionLoop from '../components/camera/useRecognitionLoop'
import { BrandMark } from '../components/ui'

const COPY = {
    vi: {
        tag: 'Trải nghiệm nhận diện khuôn mặt',
        headline: 'Hệ thống có nhận ra bạn không?',
        lead: 'Đăng ký khuôn mặt trong 5 giây, rồi thử để SATS X gọi đúng tên bạn — giống cách sinh viên điểm danh trong lớp.',
        enroll: 'Đăng ký khuôn mặt',
        recognize: 'Nhận diện tôi',
        visitors: (n) => `${n} khách đang thử`,
        autoDelete: (m) => `Ảnh tự xoá sau ${m} phút`,
        consentTitle: 'Trước khi chụp',
        consentBody: (m) => [
            'Ảnh và đặc trưng khuôn mặt của bạn chỉ lưu trên máy này, trong bộ nhớ tạm.',
            `Dữ liệu tự xoá sau ${m} phút, hoặc ngay khi bạn bấm "Xoá dữ liệu của tôi".`,
            'Không lưu tên thật — bạn chỉ cần một biệt danh. Ảnh không gửi lên Internet.'
        ],
        agree: 'Tôi đồng ý',
        decline: 'Không, cảm ơn',
        nicknameTitle: 'Bạn muốn được gọi là gì?',
        nicknameHint: 'Biệt danh hiện trên màn hình khi hệ thống nhận ra bạn.',
        randomName: 'Tên ngẫu nhiên',
        next: 'Tiếp tục',
        back: 'Quay lại',
        captureTitle: 'Nhìn thẳng vào camera',
        captureHint: 'Đặt khuôn mặt vào khung, giữ yên một chút.',
        captureNow: 'Chụp',
        saving: 'Đang xử lý…',
        hello: (n) => `Xin chào, ${n}!`,
        enrolledBody: 'Khuôn mặt của bạn đã được ghi nhớ. Bước ra khỏi khung rồi quay lại để xem hệ thống nhận ra bạn.',
        tryNow: 'Thử nhận diện ngay',
        recognizeTitle: 'Đứng trước camera',
        searching: 'Đang tìm khuôn mặt…',
        noFace: 'Chưa thấy khuôn mặt nào',
        unknown: 'Chưa nhận ra bạn',
        unknownHint: 'Bạn chưa đăng ký? Bấm "Đăng ký khuôn mặt".',
        noVisitors: 'Chưa có ai đăng ký. Hãy là người đầu tiên!',
        match: 'Độ giống',
        live: 'Khuôn mặt thật',
        spoof: 'Nghi ảnh giả mạo',
        liveHint: 'Thử giơ ảnh trên điện thoại lên camera — lớp chống giả mạo sẽ cố phát hiện.',
        done: 'Xong',
        deleteMine: 'Xoá dữ liệu của tôi',
        deleted: 'Đã xoá dữ liệu của bạn. Cảm ơn bạn đã ghé thăm!',
        staff: 'Nhân viên',
        holdHint: 'Giữ để mở',
        staffTitle: 'Quản lý kiosk',
        expiresIn: (m) => `xoá sau ${m} phút`,
        deleteAll: 'Xoá tất cả',
        exit: 'Thoát kiosk',
        fullscreen: 'Toàn màn hình',
        empty: 'Chưa có khách nào',
        guest: 'Khách'
    },
    en: {
        tag: 'Face recognition demo',
        headline: 'Will the system recognise you?',
        lead: 'Register your face in five seconds, then see SATS X call you by name — the same way students check in to class.',
        enroll: 'Register my face',
        recognize: 'Recognise me',
        visitors: (n) => `${n} visitor${n === 1 ? '' : 's'} trying now`,
        autoDelete: (m) => `Photos delete after ${m} min`,
        consentTitle: 'Before we take a photo',
        consentBody: (m) => [
            'Your photo and face data stay on this computer, in temporary memory only.',
            `Everything is deleted after ${m} minutes, or right away when you tap "Delete my data".`,
            'No real name needed — just a nickname. Nothing is sent to the internet.'
        ],
        agree: 'I agree',
        decline: 'No, thanks',
        nicknameTitle: 'What should we call you?',
        nicknameHint: 'Your nickname appears on screen when the system recognises you.',
        randomName: 'Random name',
        next: 'Continue',
        back: 'Back',
        captureTitle: 'Look straight at the camera',
        captureHint: 'Fit your face in the frame and hold still.',
        captureNow: 'Capture',
        saving: 'Working…',
        hello: (n) => `Hello, ${n}!`,
        enrolledBody: 'Your face is registered. Step out of the frame and come back to see the system recognise you.',
        tryNow: 'Try recognition now',
        recognizeTitle: 'Stand in front of the camera',
        searching: 'Looking for a face…',
        noFace: 'No face in view',
        unknown: "We don't know you yet",
        unknownHint: 'Not registered? Tap "Register my face".',
        noVisitors: 'Nobody has registered yet. Be the first!',
        match: 'Match',
        live: 'Real face',
        spoof: 'Possible spoof',
        liveHint: 'Try holding up a photo on your phone — the anti-spoofing layer will try to catch it.',
        done: 'Done',
        deleteMine: 'Delete my data',
        deleted: 'Your data has been deleted. Thanks for visiting!',
        staff: 'Staff',
        holdHint: 'Hold to open',
        staffTitle: 'Kiosk controls',
        expiresIn: (m) => `deletes in ${m} min`,
        deleteAll: 'Delete all',
        exit: 'Exit kiosk',
        fullscreen: 'Full screen',
        empty: 'No visitors yet',
        guest: 'Guest'
    }
}

const ADJECTIVES = ['Blue', 'Swift', 'Happy', 'Brave', 'Lucky', 'Calm', 'Bright', 'Sunny']
const ANIMALS = ['Fox', 'Panda', 'Otter', 'Tiger', 'Owl', 'Koala', 'Dolphin', 'Falcon']
const randomNickname = () =>
    `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`

// Không ai chạm vào màn hình trong khoảng này thì quay về màn hình chào.
const IDLE_MS = 75 * 1000
const COUNTDOWN_SECONDS = 3
const HOLD_TO_OPEN_MS = 1200

const readLang = () => {
    try {
        return localStorage.getItem('satsx_kiosk_lang') === 'en' ? 'en' : 'vi'
    } catch {
        return 'vi'
    }
}

export default function Kiosk() {
    const [lang, setLang] = useState(readLang)
    const t = COPY[lang]
    const camera = useCamera()
    const [step, setStep] = useState('attract') // attract | consent | nickname | capture | enrolled | recognize | goodbye
    const [nickname, setNickname] = useState('')
    const [me, setMe] = useState(null)
    const [enrollResult, setEnrollResult] = useState(null)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const [countdown, setCountdown] = useState(null)
    const [visitors, setVisitors] = useState([])
    const [ttl, setTtl] = useState(15)
    const [staffOpen, setStaffOpen] = useState(false)
    const idleRef = useRef(null)

    const refreshVisitors = useCallback(() => {
        getVisitors()
            .then((res) => {
                setVisitors(res.data ?? [])
                setTtl(res.ttl_minutes ?? 15)
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        refreshVisitors()
        const timer = setInterval(refreshVisitors, 15000)
        return () => clearInterval(timer)
    }, [refreshVisitors])

    const goHome = useCallback(() => {
        setStep('attract')
        setNickname('')
        setMe(null)
        setEnrollResult(null)
        setError(null)
        setCountdown(null)
    }, [])

    // Màn hình chào là trạng thái nghỉ; mọi bước khác tự quay về nếu bị bỏ dở.
    useEffect(() => {
        const bump = () => {
            clearTimeout(idleRef.current)
            idleRef.current = setTimeout(goHome, IDLE_MS)
        }
        bump()
        const events = ['pointerdown', 'keydown']
        events.forEach((e) => window.addEventListener(e, bump))
        return () => {
            clearTimeout(idleRef.current)
            events.forEach((e) => window.removeEventListener(e, bump))
        }
    }, [goHome, step])

    const switchLang = (value) => {
        setLang(value)
        try {
            localStorage.setItem('satsx_kiosk_lang', value)
        } catch {
            // Chỉ là tiện ích, không lưu được cũng không sao.
        }
    }

    const { result } = useRecognitionLoop({
        camera,
        enabled: step === 'recognize',
        intervalMs: 900,
        identify: (image, signal) => identifyVisitor(image, { signal })
    })

    const capture = () => {
        setError(null)
        let left = COUNTDOWN_SECONDS
        setCountdown(left)
        const timer = setInterval(async () => {
            left -= 1
            if (left > 0) {
                setCountdown(left)
                return
            }
            clearInterval(timer)
            setCountdown(null)
            const frame = camera.capture()
            if (!frame) return
            setBusy(true)
            try {
                const res = await enrollVisitor(nickname, frame)
                setMe(res.data)
                setEnrollResult(res)
                setStep('enrolled')
                refreshVisitors()
            } catch (err) {
                setError(err?.response?.data?.message || err.message)
            } finally {
                setBusy(false)
            }
        }, 1000)
    }

    const deleteMine = async () => {
        if (me) await deleteVisitor(me.id).catch(() => {})
        refreshVisitors()
        setMe(null)
        setStep('goodbye')
        setTimeout(goHome, 4000)
    }

    const match = result?.match
    const isMe = match && me && match.id === me.id
    const showBox = step === 'recognize' ? result?.box : null

    return (
        <div data-theme="dark" className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
            <CameraView camera={camera} box={showBox} boxTone={match ? 'match' : 'neutral'} rounded="rounded-none" className="absolute inset-0 h-full w-full">
                {/* Nhãn tên đi theo khuôn mặt. */}
                {step === 'recognize' && match && result?.box && (
                    <div
                        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full pb-2"
                        style={{ left: `${(result.box.left + result.box.width / 2) * 100}%`, top: `${result.box.top * 100}%` }}
                    >
                        <span className="whitespace-nowrap rounded-full bg-present px-3 py-1 text-sm font-semibold text-black">{match.nickname}</span>
                    </div>
                )}
            </CameraView>

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50" />

            <header className="absolute inset-x-0 top-0 flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex items-center gap-3">
                    <BrandMark />
                    <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-white/70 sm:inline">{t.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[11px] text-white/80 backdrop-blur md:inline">
                        {t.visitors(visitors.length)} · {t.autoDelete(ttl)}
                    </span>
                    <div role="group" aria-label="Language" className="flex rounded-full border border-white/15 bg-white/10 p-0.5 backdrop-blur">
                        {['vi', 'en'].map((code) => (
                            <button
                                key={code}
                                type="button"
                                aria-pressed={lang === code}
                                onClick={() => switchLang(code)}
                                className={classNames('rounded-full px-3 py-1 text-xs font-semibold uppercase', lang === code ? 'bg-white text-black' : 'text-white/75')}
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 sm:pb-10">
                <div className="mx-auto w-full max-w-3xl">
                    {step === 'attract' && (
                        <Panel>
                            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">{t.headline}</h1>
                            <p className="mt-4 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{t.lead}</p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <BigButton icon={LuUserPlus} onClick={() => setStep('consent')} primary>
                                    {t.enroll}
                                </BigButton>
                                <BigButton icon={LuScanFace} onClick={() => setStep('recognize')}>
                                    {t.recognize}
                                </BigButton>
                            </div>
                        </Panel>
                    )}

                    {step === 'consent' && (
                        <Card>
                            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t.consentTitle}</h2>
                            <ul className="mt-4 space-y-3">
                                {t.consentBody(ttl).map((line) => (
                                    <li key={line} className="flex gap-3 text-base leading-7 text-white/85">
                                        <LuShieldCheck className="mt-1.5 h-4 w-4 shrink-0 text-present" aria-hidden="true" />
                                        {line}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <BigButton
                                    primary
                                    onClick={() => {
                                        setNickname(randomNickname())
                                        setStep('nickname')
                                    }}
                                >
                                    {t.agree}
                                </BigButton>
                                <BigButton onClick={goHome}>{t.decline}</BigButton>
                            </div>
                        </Card>
                    )}

                    {step === 'nickname' && (
                        <Card>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    if (nickname.trim()) setStep('capture')
                                }}
                            >
                                <label htmlFor="kiosk-nickname" className="text-2xl font-semibold tracking-[-0.03em]">
                                    {t.nicknameTitle}
                                </label>
                                <p className="mt-1 text-sm text-white/70">{t.nicknameHint}</p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <input
                                        id="kiosk-nickname"
                                        autoFocus
                                        maxLength={32}
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="h-14 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-xl text-white outline-none placeholder:text-white/40 focus:border-white/60"
                                    />
                                    <BigButton type="button" onClick={() => setNickname(randomNickname())}>
                                        {t.randomName}
                                    </BigButton>
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <BigButton type="submit" primary disabled={!nickname.trim()}>
                                        {t.next}
                                    </BigButton>
                                    <BigButton type="button" icon={LuArrowLeft} onClick={goHome}>
                                        {t.back}
                                    </BigButton>
                                </div>
                            </form>
                        </Card>
                    )}

                    {step === 'capture' && (
                        <Card>
                            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{t.captureTitle}</h2>
                            <p className="mt-1 text-base text-white/75">{t.captureHint}</p>
                            {error && (
                                <p role="alert" className="mt-4 rounded-xl border border-late/40 bg-late/15 px-4 py-3 text-base text-white">
                                    {error}
                                </p>
                            )}
                            <div className="mt-6 flex flex-wrap gap-3">
                                <BigButton primary icon={LuCamera} onClick={capture} disabled={busy || countdown !== null || camera.status !== 'ready'}>
                                    {busy ? t.saving : t.captureNow}
                                </BigButton>
                                <BigButton icon={LuArrowLeft} onClick={() => setStep('nickname')} disabled={busy}>
                                    {t.back}
                                </BigButton>
                            </div>
                        </Card>
                    )}

                    {step === 'enrolled' && me && (
                        <Card>
                            <div className="flex flex-wrap items-center gap-5">
                                <img src={me.photo} alt="" className="h-24 w-24 rounded-2xl object-cover ring-2 ring-present" />
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-3xl font-semibold tracking-[-0.03em]">{t.hello(me.nickname)}</h2>
                                    <p className="mt-2 text-base leading-7 text-white/80">{t.enrolledBody}</p>
                                </div>
                            </div>
                            <LivenessLine liveness={enrollResult?.liveness} t={t} />
                            <div className="mt-6 flex flex-wrap gap-3">
                                <BigButton primary icon={LuScanFace} onClick={() => setStep('recognize')}>
                                    {t.tryNow}
                                </BigButton>
                                <BigButton icon={LuTrash2} onClick={deleteMine}>
                                    {t.deleteMine}
                                </BigButton>
                            </div>
                        </Card>
                    )}

                    {step === 'recognize' && (
                        <Card>
                            <div aria-live="polite" className="min-h-[5.5rem]">
                                {!result ? (
                                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white/80">{t.searching}</h2>
                                ) : result.face_count === 0 ? (
                                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white/80">{t.noFace}</h2>
                                ) : match ? (
                                    <div className="flex flex-wrap items-center gap-5">
                                        <img src={match.photo} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-present" />
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-4xl font-semibold tracking-[-0.035em]">{t.hello(match.nickname)}</h2>
                                            <SimilarityBar value={match.similarity} label={t.match} />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-3xl font-semibold tracking-[-0.03em]">{t.unknown}</h2>
                                        <p className="mt-1 text-base text-white/70">{result.enrolled === 0 ? t.noVisitors : t.unknownHint}</p>
                                    </div>
                                )}
                            </div>
                            {result?.face_count > 0 && <LivenessLine liveness={result.liveness} t={t} hint />}
                            <div className="mt-6 flex flex-wrap gap-3">
                                {!me && (
                                    <BigButton primary icon={LuUserPlus} onClick={() => setStep('consent')}>
                                        {t.enroll}
                                    </BigButton>
                                )}
                                <BigButton onClick={goHome}>{t.done}</BigButton>
                                {(me || isMe) && (
                                    <BigButton icon={LuTrash2} onClick={deleteMine}>
                                        {t.deleteMine}
                                    </BigButton>
                                )}
                            </div>
                        </Card>
                    )}

                    {step === 'goodbye' && (
                        <Card>
                            <h2 className="text-3xl font-semibold tracking-[-0.03em]">{t.deleted}</h2>
                        </Card>
                    )}
                </div>
            </main>

            {step === 'capture' && camera.status === 'ready' && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center pb-56">
                    <div className="relative h-[46vh] aspect-[3/4] rounded-[45%] border-[3px] border-dashed border-white/70">
                        {countdown !== null && (
                            <span className="absolute inset-0 grid place-items-center font-mono text-[9rem] font-semibold leading-none text-white">{countdown}</span>
                        )}
                    </div>
                </div>
            )}

            <StaffButton label={t.staff} hint={t.holdHint} onOpen={() => setStaffOpen(true)} />
            {staffOpen && (
                <StaffPanel
                    t={t}
                    visitors={visitors}
                    onClose={() => setStaffOpen(false)}
                    onChanged={refreshVisitors}
                    onCleared={() => {
                        refreshVisitors()
                        goHome()
                    }}
                />
            )}
        </div>
    )
}

function Panel({ children }) {
    return <div className="animate-fade-in">{children}</div>
}
Panel.propTypes = { children: PropTypes.node }

function Card({ children }) {
    return <div className="animate-fade-in rounded-3xl border border-white/15 bg-black/60 p-6 shadow-elevated backdrop-blur-xl sm:p-8">{children}</div>
}
Card.propTypes = { children: PropTypes.node }

function BigButton({ icon: Icon, primary = false, children, type = 'button', ...rest }) {
    return (
        <button
            type={type}
            className={classNames(
                'inline-flex h-14 items-center gap-2.5 rounded-2xl px-6 text-lg font-semibold transition-all active:translate-y-px disabled:opacity-50',
                primary ? 'bg-white text-black hover:bg-white/90' : 'border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20'
            )}
            {...rest}
        >
            {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
            {children}
        </button>
    )
}
BigButton.propTypes = { icon: PropTypes.elementType, primary: PropTypes.bool, children: PropTypes.node, type: PropTypes.string }

function SimilarityBar({ value, label }) {
    const percent = Math.max(0, Math.min(100, Math.round(value * 100)))
    return (
        <div className="mt-3 max-w-sm">
            <div className="flex justify-between font-mono text-xs text-white/70">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-present transition-[width] duration-300" style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}
SimilarityBar.propTypes = { value: PropTypes.number.isRequired, label: PropTypes.string.isRequired }

function LivenessLine({ liveness, t, hint = false }) {
    if (!liveness || liveness.verdict === 'unavailable') return null
    const real = liveness.verdict === 'real'
    const Icon = real ? LuShieldCheck : LuShieldAlert
    return (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={classNames('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', real ? 'bg-present/20 text-present' : 'bg-late/20 text-late')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {real ? t.live : t.spoof}
            </span>
            {hint && <span className="text-sm text-white/60">{t.liveHint}</span>}
        </div>
    )
}
LivenessLine.propTypes = { liveness: PropTypes.object, t: PropTypes.object.isRequired, hint: PropTypes.bool }

/** Giữ nút để mở, để khách bấm nhầm không vào được phần quản lý. */
function StaffButton({ label, hint, onOpen }) {
    const timerRef = useRef(null)
    const [holding, setHolding] = useState(false)

    const begin = () => {
        setHolding(true)
        timerRef.current = setTimeout(() => {
            setHolding(false)
            onOpen()
        }, HOLD_TO_OPEN_MS)
    }
    const cancel = () => {
        setHolding(false)
        clearTimeout(timerRef.current)
    }

    return (
        <button
            type="button"
            onPointerDown={begin}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onKeyDown={(e) => e.key === 'Enter' && onOpen()}
            aria-label={`${label} (${hint})`}
            title={hint}
            className={classNames(
                'absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full text-white/35 transition-colors hover:text-white/70',
                holding && 'animate-pulse bg-white/15 text-white'
            )}
        >
            <LuSettings2 className="h-4 w-4" aria-hidden="true" />
        </button>
    )
}
StaffButton.propTypes = { label: PropTypes.string.isRequired, hint: PropTypes.string.isRequired, onOpen: PropTypes.func.isRequired }

function StaffPanel({ t, visitors, onClose, onChanged, onCleared }) {
    const [now, setNow] = useState(Date.now())
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10000)
        return () => clearInterval(timer)
    }, [])

    const remove = async (id) => {
        await deleteVisitor(id).catch(() => {})
        onChanged()
    }
    const removeAll = async () => {
        await clearVisitors().catch(() => {})
        onCleared()
    }

    return (
        <div className="absolute inset-0 z-20 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose} role="presentation">
            <aside
                role="dialog"
                aria-label={t.staffTitle}
                onClick={(e) => e.stopPropagation()}
                className="flex h-full w-full max-w-sm animate-fade-in flex-col border-l border-white/10 bg-neutral-950 p-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t.staffTitle}</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white">
                        <LuX className="h-4 w-4" />
                    </button>
                </div>

                <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
                    {visitors.length === 0 && <li className="py-6 text-center text-sm text-white/50">{t.empty}</li>}
                    {visitors.map((v) => (
                        <li key={v.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
                            <img src={v.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{v.nickname}</p>
                                <p className="font-mono text-[11px] text-white/50">{t.expiresIn(Math.max(1, Math.ceil((new Date(v.expires_at) - now) / 60000)))}</p>
                            </div>
                            <button type="button" onClick={() => remove(v.id)} aria-label={`Delete ${v.nickname}`} className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-danger/20 hover:text-danger">
                                <LuTrash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm hover:bg-white/10">
                        <LuMaximize className="h-4 w-4" aria-hidden="true" />
                        {t.fullscreen}
                    </button>
                    <button type="button" onClick={removeAll} disabled={visitors.length === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-danger/15 text-sm text-danger hover:bg-danger/25 disabled:opacity-40">
                        <LuTrash2 className="h-4 w-4" aria-hidden="true" />
                        {t.deleteAll} ({visitors.length})
                    </button>
                    <Link to="/dashboard" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 text-sm hover:bg-white/10">
                        <LuLogOut className="h-4 w-4" aria-hidden="true" />
                        {t.exit}
                    </Link>
                </div>
            </aside>
        </div>
    )
}
StaffPanel.propTypes = {
    t: PropTypes.object.isRequired,
    visitors: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onChanged: PropTypes.func.isRequired,
    onCleared: PropTypes.func.isRequired
}
