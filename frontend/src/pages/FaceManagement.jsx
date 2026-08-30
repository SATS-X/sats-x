import { useState, useEffect } from 'react'
import classNames from 'classnames'
import { HiOutlinePlus, HiOutlineRefresh, HiOutlineTrash, HiOutlineShieldCheck } from 'react-icons/hi'
import { RiFingerprintLine } from 'react-icons/ri'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { listFaces, deleteFaceAndImage, getCollectionInfo } from '../api/websocket/faceManagement'
import { getStudentPhotoUrl } from '../lib/s3'
import AddFaceModal from '../components/FaceManagement/AddFaceModal'
import { Avatar, Badge, Button, EmptyState, Modal, PageHeader, SearchInput, Spinner, StatusChip } from '../components/ui'

const CLASS_COLLECTIONS = [
    { id: 'D22CQCI01-N', name: 'Class D22CQCI01-N' },
    { id: 'D22CQCI01-B', name: 'Class D22CQCI01-B' },
    { id: 'D22CQVT01-N', name: 'Class D22CQVT01-N' }
]

export default function FaceManagement() {
    const { t } = useLanguage()
    const { sendMessage, subscribe, isConnected } = useWebSocket()
    const { showSuccess, showError, showInfo } = useToast()

    const [selectedClassId, setSelectedClassId] = useState('D22CQCI01-N')
    const [faces, setFaces] = useState([])
    const [collectionInfo, setCollectionInfo] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const [addModalOpen, setAddModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [selectedFaceToDelete, setSelectedFaceToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchClassFaces = (classId) => {
        if (!isConnected) {
            showInfo('Connecting to AWS Gateway...', 'WebSocket')
            return
        }
        setLoading(true)
        setFaces([])
        listFaces({ sendMessage }, classId)
        getCollectionInfo({ sendMessage }, classId)
    }

    useEffect(() => {
        const unsubList = subscribe('listFaces', (res) => {
            setLoading(false)
            if (res?.status === 'success') setFaces(res.faces || [])
        })
        const unsubInfo = subscribe('getCollectionInfo', (res) => {
            if (res?.status === 'success') setCollectionInfo(res)
        })
        const unsubDelete = subscribe('deleteFaceAndImage', (res) => {
            setIsDeleting(false)
            setDeleteModalOpen(false)
            if (res?.status === 'success') {
                showSuccess('Face removed from collection', 'Success')
                fetchClassFaces(selectedClassId)
            } else {
                showError(res?.message || 'Could not remove face', 'Error')
            }
        })
        return () => {
            unsubList()
            unsubInfo()
            unsubDelete()
        }
    }, [subscribe, selectedClassId, showSuccess, showError])

    useEffect(() => {
        if (isConnected) fetchClassFaces(selectedClassId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassId, isConnected])

    const handleDeleteConfirm = () => {
        if (!selectedFaceToDelete) return
        setIsDeleting(true)
        deleteFaceAndImage(
            { sendMessage },
            { classId: selectedClassId, studentId: selectedFaceToDelete.externalImageId, faceId: selectedFaceToDelete.faceId }
        )
    }

    const filteredFaces = faces.filter((f) => {
        const search = searchTerm.toLowerCase()
        return !searchTerm || f.externalImageId?.toLowerCase().includes(search) || f.faceId?.toLowerCase().includes(search)
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <span className="inline-flex items-center gap-2.5">
                        {t('faceManagement')}
                        <Badge className="inline-flex items-center gap-1">
                            <RiFingerprintLine className="h-3.5 w-3.5" />
                            AWS Rekognition
                        </Badge>
                    </span>
                }
                description={t('faceManagementDesc')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => fetchClassFaces(selectedClassId)}>
                            <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                            Sync
                        </Button>
                        <Button size="sm" onClick={() => setAddModalOpen(true)}>
                            <HiOutlinePlus className="h-4 w-4" />
                            Register face
                        </Button>
                    </>
                }
            />

            <div className="flex flex-wrap gap-2 rounded-card border border-border bg-surface p-2">
                {CLASS_COLLECTIONS.map((c) => {
                    const isSelected = selectedClassId === c.id
                    return (
                        <button
                            key={c.id}
                            onClick={() => setSelectedClassId(c.id)}
                            className={classNames(
                                'flex min-w-[150px] flex-1 items-center justify-between gap-2 rounded-card px-4 py-2.5 text-xs font-medium transition-colors',
                                isSelected ? 'bg-accent text-accent-foreground' : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                            )}
                        >
                            <span>{c.name}</span>
                            <span className={classNames('font-data rounded-chip px-2 py-0.5 text-[10px]', isSelected ? 'bg-white/20' : 'bg-surface-sunken')}>
                                {isSelected && collectionInfo ? `${collectionInfo.faceCount || 0} faces` : c.id}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-border text-text-secondary">
                        <HiOutlineShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-data text-xs font-medium text-text">
                            Collection: attendance-system-{selectedClassId}
                        </div>
                        <div className="mt-0.5 text-xs text-text-secondary">
                            <span className="font-data font-medium text-text">{faces.length}</span> student faces indexed
                        </div>
                    </div>
                </div>

                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search student ID or Face ID..."
                    className="w-full md:w-72"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Querying AWS Rekognition collection...
                </div>
            ) : filteredFaces.length === 0 ? (
                <EmptyState
                    icon={RiFingerprintLine}
                    title={`No faces in collection ${selectedClassId}`}
                    description={'Select "Register face" to add the first student image.'}
                    action={
                        <Button size="sm" onClick={() => setAddModalOpen(true)}>
                            <HiOutlinePlus className="h-4 w-4" />
                            Add a face
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredFaces.map((face) => {
                        const studentId = face.externalImageId || face.faceId
                        const photoUrl = getStudentPhotoUrl(selectedClassId, studentId)

                        return (
                            <div key={face.faceId} className="space-y-3 rounded-card border border-border bg-surface p-4">
                                <div className="relative aspect-square overflow-hidden rounded-card border border-border">
                                    <Avatar src={photoUrl} name={studentId} size="xl" className="rounded-none border-0" />
                                    <div className="absolute right-2 top-2">
                                        <StatusChip variant="present">
                                            {face.confidence ? `${Math.round(face.confidence)}%` : 'Indexed'}
                                        </StatusChip>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-data truncate text-sm font-semibold text-text">{studentId}</span>
                                        <Badge className="font-data shrink-0">{selectedClassId}</Badge>
                                    </div>
                                    <div className="font-data truncate text-[11px] text-text-tertiary" title={face.faceId}>
                                        FID: {face.faceId}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-border pt-2.5">
                                    <span className="text-[11px] font-medium text-present">Active</span>
                                    <button
                                        onClick={() => {
                                            setSelectedFaceToDelete(face)
                                            setDeleteModalOpen(true)
                                        }}
                                        title="Remove face from AWS"
                                        className="rounded-card p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <AddFaceModal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                defaultClassId={selectedClassId}
                onAdded={() => fetchClassFaces(selectedClassId)}
            />

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Face ID"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm} loading={isDeleting}>
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                        Delete the face record for student{' '}
                        <span className="font-data font-semibold text-text">{selectedFaceToDelete?.externalImageId}</span> from AWS Rekognition
                        and remove its image from S3?
                    </p>
                    <div className="rounded-card border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
                        This cannot be undone. Automatic attendance will remain unavailable until the face is registered again.
                    </div>
                </div>
            </Modal>
        </div>
    )
}
