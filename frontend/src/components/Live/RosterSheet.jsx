import PropTypes from 'prop-types'
import classNames from 'classnames'
import { LuShieldAlert } from 'react-icons/lu'

const STAMPS = {
    present: { label: 'On time', ink: 'border-present text-present' },
    late: { label: 'Late', ink: 'border-late text-late' },
    absent: { label: 'Absent', ink: 'border-absent text-absent' }
}

function Stamp({ state, fresh }) {
    const stamp = STAMPS[state]
    if (!stamp) return <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">Waiting</span>

    return (
        <span
            className={classNames(
                'inline-block -rotate-3 rounded-[4px] border-[1.5px] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]',
                stamp.ink,
                fresh && 'animate-stamp'
            )}
        >
            {stamp.label}
        </span>
    )
}

Stamp.propTypes = { state: PropTypes.string.isRequired, fresh: PropTypes.bool }

/** Sổ điểm danh: mỗi dòng là một sinh viên, được đóng dấu khi đến lớp. */
export default function RosterSheet({ students, freshIds, onSelect }) {
    return (
        <ol className="divide-y divide-border">
            {students.map((student) => {
                const waiting = student.state === 'pending'
                const suspicious = student.liveness_verdict === 'fake'
                const fresh = freshIds.has(student.student_id)
                const interactive = !waiting

                return (
                    <li key={student.student_id} className={fresh ? 'animate-row-arrive' : undefined}>
                        <button
                            type="button"
                            disabled={!interactive}
                            onClick={() => onSelect(student)}
                            className={classNames(
                                'grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5 text-left sm:grid-cols-[28px_minmax(0,1fr)_56px_92px]',
                                interactive && 'transition-colors hover:bg-surface-sunken/70'
                            )}
                        >
                            <span className="font-data text-[11px] text-text-tertiary">{String(student.index).padStart(2, '0')}</span>
                            <span className="min-w-0">
                                <span className={classNames('flex items-center gap-1.5 truncate text-[13px] font-medium', waiting ? 'text-text-secondary' : 'text-text')}>
                                    <span className="truncate">{student.full_name}</span>
                                    {suspicious && <LuShieldAlert className="h-3.5 w-3.5 shrink-0 text-late" aria-label="Needs review" />}
                                </span>
                                <span className="font-data block truncate text-[11px] text-text-tertiary">{student.student_id}</span>
                            </span>
                            <span className="font-data hidden text-xs text-text-secondary sm:block">{student.time ?? ''}</span>
                            <span className="justify-self-end">
                                <Stamp state={student.state} fresh={fresh} />
                            </span>
                        </button>
                    </li>
                )
            })}
        </ol>
    )
}

RosterSheet.propTypes = {
    students: PropTypes.array.isRequired,
    freshIds: PropTypes.instanceOf(Set).isRequired,
    onSelect: PropTypes.func.isRequired
}
