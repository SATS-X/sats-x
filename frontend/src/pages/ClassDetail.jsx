import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LuArrowLeft, LuBookOpen, LuClipboardList, LuScanFace, LuUsers } from 'react-icons/lu'
import { getClassById } from '../api/class/classApi'
import { getAllStudentsByClassId } from '../api/student/getStudent'
import { getFaces } from '../api/faces/faceApi'
import { FACE_PROVIDER } from '../config/api'
import { apiErrorMessage } from '../lib/errors'
import { Avatar, Button, Card, CardHeader, EmptyState, LoadingState, Notice, PageHeader, StatStrip, StatusChip, Table, TBody, TD, TH, THead, TR } from '../components/ui'

export default function ClassDetail() {
    const { classId } = useParams()
    const [cls, setCls] = useState(null)
    const [students, setStudents] = useState([])
    const [faceCounts, setFaceCounts] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)
        Promise.all([
            getClassById(classId),
            getAllStudentsByClassId(classId),
            FACE_PROVIDER === 'local' ? getFaces(classId).catch(() => null) : Promise.resolve(null)
        ])
            .then(([classRes, studentRes, faceRes]) => {
                if (!active) return
                setCls(classRes.data)
                setStudents(studentRes.data ?? [])
                setFaceCounts(faceRes ? new Map(faceRes.data.map((s) => [s.student_id, s.faces.length])) : null)
            })
            .catch((err) => active && setError(err?.response?.status === 404 ? 'This class does not exist.' : apiErrorMessage(err, 'Could not load this class')))
            .finally(() => active && setLoading(false))
        return () => {
            active = false
        }
    }, [classId])

    if (loading) return <LoadingState label="Loading class…" />
    if (error || !cls) {
        return (
            <div className="space-y-4">
                <Button as={Link} to="/classes" variant="ghost" size="sm">
                    <LuArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    All classes
                </Button>
                <Notice>{error || 'This class does not exist.'}</Notice>
            </div>
        )
    }

    const withFace = faceCounts ? students.filter((s) => (faceCounts.get(s.student_id) ?? 0) > 0).length : null

    return (
        <div className="space-y-6">
            <Button as={Link} to="/classes" variant="ghost" size="sm" className="-ml-2">
                <LuArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                All classes
            </Button>

            <PageHeader
                eyebrow={`Class · ${cls.class_id}`}
                title={cls.class_name}
                description="Everyone enrolled in this class, the subjects it takes, and who can be recognised by camera."
                actions={
                    <Button as={Link} to={`/face-management?class=${encodeURIComponent(cls.class_id)}`}>
                        <LuScanFace className="h-4 w-4" aria-hidden="true" />
                        Capture faces
                    </Button>
                }
            />

            <StatStrip
                items={[
                    { label: 'Students', value: students.length, detail: cls.number_of_students ? `Planned size ${cls.number_of_students}` : undefined, icon: LuUsers },
                    { label: 'Subjects', value: cls.subjects.length, icon: LuBookOpen },
                    ...(withFace !== null
                        ? [{ label: 'Can be recognised', value: `${withFace}/${students.length}`, tone: withFace === students.length && students.length ? 'present' : 'late', icon: LuScanFace }]
                        : []),
                    { label: 'Status', value: cls.status || 'active' }
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <Card padded={false}>
                    <CardHeader title="Students" description={`${students.length} enrolled`} action={<Button as={Link} to="/students" variant="ghost" size="sm">Manage students</Button>} />
                    {students.length === 0 ? (
                        <EmptyState icon={LuUsers} title="No students yet" description="Assign students to this class on the Students page." />
                    ) : (
                        <Table>
                            <THead>
                                <TH>Student</TH>
                                <TH>Contact</TH>
                                {faceCounts && <TH>Face</TH>}
                            </THead>
                            <TBody>
                                {students.map((s) => {
                                    const faces = faceCounts?.get(s.student_id) ?? 0
                                    return (
                                        <TR key={s.student_id}>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={s.full_name} size="sm" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm text-text">{s.full_name}</p>
                                                        <p className="font-data text-xs text-text-tertiary">{s.student_id}</p>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD className="text-xs text-text-secondary">{s.email || '—'}</TD>
                                            {faceCounts && (
                                                <TD>
                                                    <StatusChip variant={faces ? 'present' : 'absent'}>{faces ? `${faces} photo${faces === 1 ? '' : 's'}` : 'Missing'}</StatusChip>
                                                </TD>
                                            )}
                                        </TR>
                                    )
                                })}
                            </TBody>
                        </Table>
                    )}
                </Card>

                <Card padded={false}>
                    <CardHeader title="Subjects" />
                    {cls.subjects.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-text-tertiary">No subjects assigned</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {cls.subjects.map((subject) => (
                                <li key={subject.subject_id} className="flex items-center justify-between gap-3 px-5 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-text">{subject.name}</p>
                                        <p className="font-data text-xs text-text-tertiary">{subject.subject_id}</p>
                                    </div>
                                    <Button as={Link} to={`/attendance?subject=${encodeURIComponent(subject.subject_id)}`} variant="ghost" size="sm" aria-label={`Attendance for ${subject.name}`}>
                                        <LuClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    )
}
