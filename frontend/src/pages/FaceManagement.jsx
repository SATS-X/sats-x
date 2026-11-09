import { useState, useEffect } from 'react'
import { LuFingerprint, LuPlus, LuRefreshCw, LuShieldCheck, LuTrash2 } from 'react-icons/lu'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { listFaces, deleteFaceAndImage, getCollectionInfo } from '../api/websocket/faceManagement'
import { getStudentPhotoUrl } from '../lib/s3'
import AddFaceModal from '../components/FaceManagement/AddFaceModal'
import { Avatar, Button, Card, EmptyState, IconButton, LoadingState, Modal, Notice, PageHeader, SearchInput, Segmented, StatusChip } from '../components/ui'

const CLASS_COLLECTIONS = [
    { value: 'D22CQCI01-N', label: 'D22CQCI01-N' },
    { value: 'D22CQCI01-B', label: 'D22CQCI01-B' },
    { value: 'D22CQVT01-N', label: 'D22CQVT01-N' }
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
                eyebrow={`Face collection · ${collectionInfo?.faceCount ?? faces.length}`}
                title={t('faceManagement')}
                description={t('faceManagementDesc')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={() => fetchClassFaces(selectedClassId)}>
                            <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                            Sync
                        </Button>
                        <Button size="sm" onClick={() => setAddModalOpen(true)}>
                            <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Register face
                        </Button>
                    </>
                }
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Segmented options={CLASS_COLLECTIONS} value={selectedClassId} onChange={setSelectedClassId} label="Select a class collection" />
                <SearchInput
                    aria-label="Search faces"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search student ID or Face ID..."
                    className="w-full md:w-72"
                />
            </div>

            <div className="flex items-center gap-2.5 text-xs text-text-tertiary">
                <LuShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                    <span className="font-data text-text-secondary">attendance-system-{selectedClassId}</span>
                    {' · '}
                    <span className="font-data text-text-secondary">{faces.length}</span> student faces indexed
                </span>
            </div>

            {loading ? (
                <LoadingState label="Querying AWS Rekognition collection..." />
            ) : filteredFaces.length === 0 ? (
                <Card padded={false}>
                    <EmptyState
                        icon={LuFingerprint}
                        title={`No faces in collection ${selectedClassId}`}
                        description="Register the first student photo to enable automatic attendance."
                        action={
                            <Button size="sm" onClick={() => setAddModalOpen(true)}>
                                <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
                                Add a face
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredFaces.map((face) => {
                        const studentId = face.externalImageId || face.faceId
                        const photoUrl = getStudentPhotoUrl(selectedClassId, studentId)

                        return (
                            <Card key={face.faceId} padded={false} className="overflow-hidden transition-colors hover:border-accent/35">
                                <div className="relative aspect-square border-b border-border">
                                    <Avatar src={photoUrl} name={studentId} size="xl" className="rounded-none border-0" />
                                    <StatusChip variant="present" className="absolute right-2 top-2 bg-surface">
                                        {face.confidence ? `${Math.round(face.confidence)}%` : 'Indexed'}
                                    </StatusChip>
                                </div>

                                <div className="flex items-center justify-between gap-2 p-3">
                                    <div className="min-w-0">
                                        <div className="font-data truncate text-[13px] font-semibold text-text">{studentId}</div>
                                        <div className="font-data truncate text-[10px] text-text-tertiary" title={face.faceId}>
                                            {face.faceId}
                                        </div>
                                    </div>
                                    <IconButton
                                        icon={LuTrash2}
                                        label={`Remove face for ${studentId}`}
                                        tone="danger"
                                        onClick={() => {
                                            setSelectedFaceToDelete(face)
                                            setDeleteModalOpen(true)
                                        }}
                                    />
                                </div>
                            </Card>
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
                        Delete the face record for student <span className="font-data font-semibold text-text">{selectedFaceToDelete?.externalImageId}</span> from AWS
                        Rekognition and remove its image from S3?
                    </p>
                    <Notice>This cannot be undone. Automatic attendance will remain unavailable until the face is registered again.</Notice>
                </div>
            </Modal>
        </div>
    )
}
