import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LuArrowRight, LuCalendarPlus, LuClock, LuMapPin } from 'react-icons/lu'
import { getLiveSessions } from '../../api/schedule/getSchedule'
import SessionProgress from '../Live/SessionProgress'
import { Button } from '../ui'

const REFRESH_MS = 30000

/** Điểm nhấn của Dashboard: buổi đang diễn ra, hoặc buổi kế tiếp trong ngày. */
export default function SessionHero() {
    const [sessions, setSessions] = useState(null)

    useEffect(() => {
        let active = true
        const load = () =>
            getLiveSessions()
                .then((res) => active && setSessions(res?.data ?? []))
                .catch(() => active && setSessions((current) => current ?? []))

        load()
        const timer = setInterval(load, REFRESH_MS)
        return () => {
            active = false
            clearInterval(timer)
        }
    }, [])

    if (sessions === null) return <div className="h-[168px] animate-pulse rounded-2xl border border-border bg-surface" />

    const session = sessions.find((s) => s.is_active) ?? sessions.find((s) => s.status === 'scheduled')

    if (!session) {
        return (
            <section className="canvas-band flex flex-col gap-5 rounded-2xl border border-border p-6 shadow-panel sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.035em] text-text">No more sessions today</h2>
                    <p className="mt-1 text-sm text-text-secondary">Plan the next one, or review what was recorded today.</p>
                </div>
                <Button as={Link} to="/schedule" variant="secondary" size="lg">
                    <LuCalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Open schedule
                </Button>
            </section>
        )
    }

    const arrived = session.on_time + session.late

    return (
        <section className="canvas-band flex flex-col gap-6 rounded-2xl border border-border p-6 shadow-panel sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">{session.is_active ? 'In session now' : 'Up next'}</p>
                <h2 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl">{session.subject_name}</h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-secondary">
                    <span className="font-data flex items-center gap-1.5">
                        <LuClock className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                        {session.start_time} – {session.end_time}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <LuMapPin className="h-3.5 w-3.5 text-text-tertiary" aria-hidden="true" />
                        {session.room}
                    </span>
                </div>
            </div>

            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center lg:w-auto">
                <div className="sm:w-56">
                    <p className="font-data text-[13px] text-text-secondary">
                        <span className="text-2xl font-semibold tracking-[-0.03em] text-text">{arrived}</span> / {session.expected} arrived
                    </p>
                    <SessionProgress onTime={session.on_time} late={session.late} absent={session.absent} expected={session.expected} className="mt-2.5" />
                </div>
                <Button as={Link} to="/live" size="lg">
                    Open roll sheet
                    <LuArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>
        </section>
    )
}
