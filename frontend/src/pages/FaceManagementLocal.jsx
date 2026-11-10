import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useSearchParams } from 'react-router-dom'
import { LuCamera, LuRefreshCw, LuScanFace, LuShieldAlert, LuTrash2, LuUserCheck, LuUsers } from 'react-icons/lu'
import { deleteFace, fetchFacePhoto, getFaceEngineStatus, getFaces, identifyStudent } from '../api/faces/faceApi'
import { getClasses } from '../api/class/getClasses'
import { useToast } from '../contexts/ToastContext'
import { apiErrorMessage } from '../lib/errors'
import CaptureFaceModal from '../components/FaceManagement/CaptureFaceModal'
import CameraView from '../components/camera/CameraView'
import useCamera from '../components/camera/useCamera'
import useRecognitionLoop from '../components/camera/useRecognitionLoop'
import { Avatar, Button, Card, CardHeader, EmptyState, LoadingState, Modal, Notice, PageHeader, SearchInput, Select, StatStrip, StatusChip } from '../components/ui'

export default function FaceManagementLocal() {
    const { showSuccess, showError } = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const classId = searchParams.get('class') || ''

    const [classes, setClasses] = useState([])
    const [students, setStudents] = useState([])
    const [maxFaces, setMaxFaces] = useState(5)
    const [engine, setEngine] = useState(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [captureFor, setCaptureFor] = useState(null)
    const [pendingDelete, setPendingDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [testOpen, setTestOpen] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const [res, status] = await Promise.all([getFaces(classId), getFaceEngineStatus().catch(() => null)])
            setStudents(res.data ?? [])
            setMaxFaces(res.max_faces ?? 5)
            setEngine(status)
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not load faces'), 'Error')
        } finally {
            setLoading(false)
        }
    }, [classId, showError])

    useEffect(() => {
        load()
    }, [load])

    useEffect(() => {
        getClasses()
            .then((res) => setClasses(res?.data ?? []))
            .catch(() => {})
    }, [])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return students
        return students.filter((s) => s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q))
    }, [students, search])

    const enrolled = students.filter((s) => s.faces.length > 0).length
    const photos = students.reduce((sum, s) => sum + s.faces.length, 0)
    const flagged = students.reduce((sum, s) => sum + s.faces.filter((f) => f.liveness_verdict === 'fake').length, 0)

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await deleteFace(pendingDelete.id)
            showSuccess('Face photo deleted', 'Deleted')
            setPendingDelete(null)
            load()
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not delete this photo'), 'Error')
        } finally {
            setDeleting(false)
        }
    }

    const engineReady = engine?.online && engine?.models

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Recognition · on this computer"
                title="Faces"
                description="Capture each student's face with the webcam. Recognition runs locally with OpenCV, so no cloud account is needed."
                actions={
                    <>
                        <Button variant="secondary" onClick={load}>
                            <LuRefreshCw className="h-4 w-4" aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button variant="secondary" onClick={() => setTestOpen(true)} disabled={!engineReady}>
                            <LuScanFace className="h-4 w-4" aria-hidden="true" />
                            Test recognition
                        </Button>
                        <Button as={Link} to="/check-in">
                            <LuUserCheck className="h-4 w-4" aria-hidden="true" />
                            Open check-in station
                        </Button>
                    </>
                }
            />

            {engine && !engineReady && (
                <Notice>
                    {engine.online
                        ? 'The face models are missing. Run ./start.sh again to download them.'
                        : 'The face engine is not running, so photos cannot be saved or recognised. Start everything with ./start.sh.'}
                </Notice>
            )}

            <StatStrip
                items={[
                    { label: 'Students', value: students.length, icon: LuUsers },
                    { label: 'With a face', value: `${enrolled}/${students.length}`, tone: enrolled === students.length && students.length ? 'present' : undefined },
                    { label: 'Photos stored', value: photos, detail: `Up to ${maxFaces} per student` },
                    { label: 'Flagged by anti-spoofing', value: flagged, tone: flagged ? 'late' : undefined, icon: LuShieldAlert }
                ]}
            />

            <Card padded={false}>
                <CardHeader
                    title="Students"
                    description="Students without a photo cannot be recognised."
                    action={
                        <div className="flex flex-wrap gap-2">
                            <Select
                                aria-label="Class"
                                value={classId}
                                onChange={(e) => setSearchParams(e.target.value ? { class: e.target.value } : {})}
                                className="w-48"
                            >
                                <option value="">All classes</option>
                                {classes.map((c) => (
                                    <option key={c.class_id} value={c.class_id}>
                                        {c.class_id}
                                    </option>
                                ))}
                            </Select>
                            <SearchInput placeholder="Search name or ID" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
                        </div>
                    }
                />

                {loading ? (
                    <div className="px-5">
                        <LoadingState label="Loading faces…" />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon={LuUsers} title="No students found" description="Add students first, then capture their faces here." action={<Button as={Link} to="/students" variant="secondary" size="sm">Go to students</Button>} />
                ) : (
                    <ul className="divide-y divide-border">
                        {filtered.map((student) => (
                            <li key={student.student_id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                                <Avatar name={student.full_name} />
                                <div className="min-w-[10rem] flex-1">
                                    <p className="truncate text-sm font-medium text-text">{student.full_name}</p>
                                    <p className="font-data text-xs text-text-tertiary">
                                        {student.student_id}
                                        {student.class_ids.length > 0 && ` · ${student.class_ids.join(', ')}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {student.faces.map((face) => (
                                        <FaceThumb key={face.id} face={face} name={student.full_name} onDelete={() => setPendingDelete({ ...face, name: student.full_name })} />
                                    ))}
                                    {student.faces.length === 0 && <StatusChip variant="absent">No face</StatusChip>}
                                </div>

                                <span className="font-data w-10 text-right text-xs text-text-tertiary">
                                    {student.faces.length}/{maxFaces}
                                </span>
                                <Button
                                    size="sm"
                                    variant={student.faces.length ? 'secondary' : 'primary'}
                                    onClick={() => setCaptureFor(student)}
                                    disabled={!engineReady || student.faces.length >= maxFaces}
                                >
                                    <LuCamera className="h-3.5 w-3.5" aria-hidden="true" />
                                    {student.faces.length ? 'Add photo' : 'Capture face'}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <CaptureFaceModal isOpen={Boolean(captureFor)} onClose={() => setCaptureFor(null)} student={captureFor} onSaved={load} />

            <Modal
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                size="sm"
                title="Delete this face photo?"
                description={pendingDelete ? `${pendingDelete.name} will no longer be recognised from this photo. This cannot be undone.` : ''}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} loading={deleting}>
                            Delete photo
                        </Button>
                    </>
                }
            />

            <Modal isOpen={testOpen} onClose={() => setTestOpen(false)} size="xl" title="Test recognition" description="Nothing is recorded. Stand in front of the camera to see who SATS X thinks you are.">
                {testOpen && <RecognitionTest />}
            </Modal>
        </div>
    )
}

function FaceThumb({ face, name, onDelete }) {
    const [url, setUrl] = useState(null)

    useEffect(() => {
        let objectUrl = null
        let active = true
        fetchFacePhoto(face.id)
            .then((value) => {
                objectUrl = value
                if (active) setUrl(value)
                else URL.revokeObjectURL(value)
            })
            .catch(() => {})
        return () => {
            active = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [face.id])

    return (
        <div className="group relative h-11 w-11 overflow-hidden rounded-lg border border-border bg-surface-sunken">
            {url && <img src={url} alt={`Face photo of ${name}`} className="h-full w-full object-cover" />}
            {face.liveness_verdict === 'fake' && (
                <span title="Flagged by the anti-spoofing check" className="absolute left-0.5 top-0.5 h-2 w-2 rounded-full bg-late ring-2 ring-surface" />
            )}
            <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete face photo of ${name}`}
                className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
            >
                <LuTrash2 className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    )
}

FaceThumb.propTypes = { face: PropTypes.object.isRequired, name: PropTypes.string.isRequired, onDelete: PropTypes.func.isRequired }

function RecognitionTest() {
    const camera = useCamera()
    const { result, error } = useRecognitionLoop({
        camera,
        enabled: true,
        identify: (image, signal) => identifyStudent(image, { signal })
    })

    const match = result?.match
    return (
        <div className="space-y-3">
            <CameraView camera={camera} box={result?.box} boxTone={match ? 'match' : 'neutral'} className="aspect-video w-full" />
            <div className="flex min-h-[3rem] flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-sunken px-4 py-3" aria-live="polite">
                {error ? (
                    <span className="text-sm text-danger">{error}</span>
                ) : !result ? (
                    <span className="text-sm text-text-tertiary">Looking for a face…</span>
                ) : result.face_count === 0 ? (
                    <span className="text-sm text-text-tertiary">No face in view</span>
                ) : match ? (
                    <span className="text-sm text-text">
                        <strong className="font-semibold">{match.full_name}</strong> <span className="font-data text-text-tertiary">{match.student_id}</span>
                    </span>
                ) : (
                    <span className="text-sm text-text-secondary">Not recognised{result.enrolled === 0 && ' · no faces stored yet'}</span>
                )}
                {result?.face_count > 0 && (
                    <span className="font-data text-xs text-text-tertiary">
                        match {Math.round((match?.similarity ?? result.closest ?? 0) * 100)}% · liveness {result.liveness?.verdict ?? '—'}
                    </span>
                )}
            </div>
        </div>
    )
}
