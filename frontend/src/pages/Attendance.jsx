import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LuCamera, LuDownload, LuEye, LuRefreshCw } from 'react-icons/lu'
import { getAllAttendance } from '../api/attendance/getAttendance'
import { getClasses } from '../api/class/getClasses'
import { getManagedSubjects } from '../api/subject/getSubject'
import { useAuth } from '../contexts/AuthContext'
import { apiErrorMessage } from '../lib/errors'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import ImagePreview from '../components/Attendance/ImagePreview'
import {
    Avatar,
    Badge,
    Button,
    Card,
    EmptyState,
    IconButton,
    LoadingState,
    PageHeader,
    SearchInput,
    Select,
    StatusChip,
    Table,
    TBody,
    TD,
    TH,
    THead,
    TR
} from '../components/ui'

const REMARK_VARIANT = { 'On Time': 'present', Late: 'late', Absent: 'absent' }
const REMARK_LABEL = { 'On Time': 'On time', Late: 'Late', Absent: 'Absent' }

export default function Attendance() {
    const { t } = useLanguage()
    const { user } = useAuth()
    const { showInfo, showSuccess, showError } = useToast()
    const { subscribe, sendMessage, isConnected } = useWebSocket()
    const [triggering, setTriggering] = useState(false)

    const [attendanceData, setAttendanceData] = useState([])
    const [totalRecords, setTotalRecords] = useState(0)
    const [classesList, setClassesList] = useState([])
    const [subjectsList, setSubjectsList] = useState([])
    const [loading, setLoading] = useState(true)

    const [searchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'all')
    const [selectedRemark, setSelectedRemark] = useState('all')
    const [fromDate, setFromDate] = useState(searchParams.get('date') || '')
    const [toDate, setToDate] = useState(searchParams.get('date') || '')

    const [previewOpen, setPreviewOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 12

    const filterParams = useMemo(
        () => ({
            ...(debouncedSearch ? { q: debouncedSearch } : {}),
            ...(selectedClass !== 'all' ? { class_id: selectedClass } : {}),
            ...(selectedSubject !== 'all' ? { subject_id: selectedSubject } : {}),
            ...(selectedRemark !== 'all' ? { remark: selectedRemark } : {}),
            ...(fromDate ? { from: fromDate } : {}),
            ...(toDate ? { to: toDate } : {})
        }),
        [debouncedSearch, selectedClass, selectedSubject, selectedRemark, fromDate, toDate]
    )

    // Chỉ áp dụng kết quả của lần gọi mới nhất, phòng phản hồi cũ về sau phản hồi mới.
    const requestIdRef = useRef(0)

    const fetchAttendanceData = useCallback(async () => {
        requestIdRef.current += 1
        const requestId = requestIdRef.current
        setLoading(true)
        try {
            const res = await getAllAttendance({ ...filterParams, page: currentPage, limit: pageSize })
            if (requestId !== requestIdRef.current) return
            setAttendanceData(res?.data ?? [])
            setTotalRecords(res?.pagination?.total ?? 0)
        } catch (err) {
            if (requestId === requestIdRef.current) showError(apiErrorMessage(err, 'Could not load attendance records'), 'Error')
        } finally {
            if (requestId === requestIdRef.current) setLoading(false)
        }
    }, [filterParams, currentPage, showError])

    // setTimeout trong handleTriggerCapture cần gọi được bộ lọc mới nhất.
    const fetchRef = useRef(fetchAttendanceData)
    fetchRef.current = fetchAttendanceData

    useEffect(() => {
        fetchAttendanceData()
    }, [fetchAttendanceData])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim())
            setCurrentPage(1)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        Promise.allSettled([getClasses(), getManagedSubjects(user)]).then(([classesRes, subjectsRes]) => {
            if (classesRes.status === 'fulfilled') setClassesList(classesRes.value?.data ?? [])
            if (subjectsRes.status === 'fulfilled') setSubjectsList(subjectsRes.value?.data ?? [])
        })
    }, [user])

    const updateFilter = (setter) => (e) => {
        setter(e.target.value)
        setCurrentPage(1)
    }

    // Dọn subscription + timer đang chờ khi rời trang trước khi có phản hồi —
    // nếu không, closure cũ (showSuccess/showError/setTriggering của lần render
    // đã unmount) vẫn nằm trong messageHandlersRef của WebSocketProvider (sống ở
    // App root, không unmount theo route) và có thể bị gọi nhầm về sau.
    const pendingCaptureRef = useRef(null)

    useEffect(() => {
        return () => {
            if (pendingCaptureRef.current) {
                clearTimeout(pendingCaptureRef.current.safetyTimer)
                pendingCaptureRef.current.unsubscribe()
                pendingCaptureRef.current = null
            }
        }
    }, [])

    // Lambda "compare" chỉ trả lời về đúng connection đã gửi yêu cầu compare —
    // tức connection của THIẾT BỊ, không phải của trình duyệt đang mở trang này.
    // Vì vậy không có cách nào nhận kết quả "trực tiếp" qua WebSocket ở đây; xác
    // nhận trung thực hơn là gửi lệnh xong rồi tải lại bảng sau vài giây, đọc
    // đúng dữ liệu thật mà /api/device/attendance vừa ghi vào DB.
    const handleTriggerCapture = () => {
        setTriggering(true)

        // An toàn: nếu 8s không có phản hồi (Lambda lỗi, không post_to_connection
        // được...), tự tắt trạng thái loading thay vì treo nút mãi mãi.
        const safetyTimer = setTimeout(() => {
            unsubscribe()
            pendingCaptureRef.current = null
            setTriggering(false)
        }, 8000)

        const unsubscribe = subscribe('triggerCapture', (data) => {
            clearTimeout(safetyTimer)
            unsubscribe()
            pendingCaptureRef.current = null
            setTriggering(false)
            if (data?.status === 'success') {
                showSuccess(data.message || 'Capture command sent to device', 'Camera triggered')
                setTimeout(() => fetchRef.current(), 6000)
            } else {
                showError(data?.message || 'Could not send command to device', 'Error')
            }
        })

        pendingCaptureRef.current = { safetyTimer, unsubscribe }

        const sent = sendMessage({ action: 'triggerCapture' })
        if (!sent) {
            clearTimeout(safetyTimer)
            unsubscribe()
            pendingCaptureRef.current = null
            setTriggering(false)
        }
    }

    const totalPages = Math.ceil(totalRecords / pageSize) || 1
    const paginatedData = attendanceData

    const exportCSV = async () => {
        let allRecords
        try {
            const res = await getAllAttendance(filterParams)
            allRecords = res?.data ?? []
        } catch (err) {
            showError(apiErrorMessage(err, 'Could not export attendance records'), 'Error')
            return
        }

        const headers = ['Student ID', 'Full name', 'Class', 'Subject', 'Date', 'Time', 'Status']
        const rows = allRecords.map((r) => [
            r.student_id || '',
            r.student_name || '',
            r.class_names || '',
            r.subject_name || '',
            `${r.day}/${r.month}/${r.year}`,
            r.status === 1 ? r.time : '',
            REMARK_LABEL[r.remark] || r.remark || ''
        ])
        const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers, ...rows].map((e) => e.join(',')).join('\n')
        const link = document.createElement('a')
        link.href = encodeURI(csvContent)
        link.download = `diem-danh-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showInfo('Attendance CSV exported', 'Export complete')
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow={`Records · ${totalRecords}`}
                title={t('attendanceManagement')}
                description={t('dailyAttendanceTracking')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchAttendanceData}>
                            <LuRefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={!isConnected || triggering}
                            onClick={handleTriggerCapture}
                            title={isConnected ? undefined : 'WebSocket is not connected to AWS Gateway'}
                        >
                            <LuCamera className={triggering ? 'h-3.5 w-3.5 animate-pulse' : 'h-3.5 w-3.5'} aria-hidden="true" />
                            {triggering ? 'Sending command...' : 'Capture now'}
                        </Button>
                        <Button size="sm" onClick={exportCSV}>
                            <LuDownload className="h-3.5 w-3.5" aria-hidden="true" />
                            Export CSV
                        </Button>
                    </>
                }
            />

            <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <SearchInput
                        aria-label="Search attendance"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name or student ID..."
                        className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                        <input aria-label="From date" type="date" value={fromDate} onChange={updateFilter(setFromDate)} className="control font-data h-9 px-2.5 text-xs sm:w-[140px]" />
                        <span className="text-xs text-text-tertiary">to</span>
                        <input aria-label="To date" type="date" value={toDate} min={fromDate || undefined} onChange={updateFilter(setToDate)} className="control font-data h-9 px-2.5 text-xs sm:w-[140px]" />
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Select aria-label="Filter by class" value={selectedClass} onChange={updateFilter(setSelectedClass)}>
                        <option value="all">All classes</option>
                        {classesList.map((c) => (
                            <option key={c.class_id} value={c.class_id}>
                                {c.class_id}
                            </option>
                        ))}
                    </Select>
                    <Select aria-label="Filter by subject" value={selectedSubject} onChange={updateFilter(setSelectedSubject)}>
                        <option value="all">All subjects</option>
                        {subjectsList.map((s) => (
                            <option key={s.subject_id} value={s.subject_id}>
                                {s.subject_id} — {s.name}
                            </option>
                        ))}
                    </Select>
                    <Select aria-label="Filter by status" value={selectedRemark} onChange={updateFilter(setSelectedRemark)}>
                        <option value="all">All statuses</option>
                        <option value="On Time">On time</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                    </Select>
                </div>
            </div>

            {loading ? (
                <LoadingState label="Loading attendance records..." />
            ) : paginatedData.length === 0 ? (
                <Card padded={false}>
                    <EmptyState title="No matching attendance records" description="Try a different name, class, or status." />
                </Card>
            ) : (
                <>
                    <Table>
                        <THead>
                            <TH>Student</TH>
                            <TH>Class</TH>
                            <TH>Time</TH>
                            <TH>Date</TH>
                            <TH>Status</TH>
                            <TH className="text-right">Details</TH>
                        </THead>
                        <TBody>
                            {paginatedData.map((record, index) => (
                                <TR key={`${record.student_id}-${record.day}-${record.time}-${index}`}>
                                    <TD>
                                        <div className="flex items-center gap-3">
                                            <Avatar name={record.student_name} size="sm" />
                                            <div className="min-w-0">
                                                <div className="truncate font-medium text-text">{record.student_name}</div>
                                                <div className="font-data text-[11px] text-text-tertiary">{record.student_id}</div>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD>{record.class_names ? <Badge className="font-data">{record.class_names}</Badge> : '—'}</TD>
                                    <TD className="font-data">{record.status === 1 ? record.time : '—'}</TD>
                                    <TD className="font-data text-text-tertiary">
                                        {record.day}/{record.month}/{record.year}
                                    </TD>
                                    <TD>
                                        <span className="inline-flex items-center gap-1.5">
                                            <StatusChip variant={REMARK_VARIANT[record.remark] || 'neutral'}>{REMARK_LABEL[record.remark] || record.remark}</StatusChip>
                                            {record.liveness_verdict === 'fake' && <StatusChip variant="late">Review</StatusChip>}
                                        </span>
                                    </TD>
                                    <TD>
                                        <div className="flex justify-end">
                                            <IconButton
                                                icon={LuEye}
                                                label={`View details for ${record.student_name}`}
                                                onClick={() => {
                                                    setSelectedRecord(record)
                                                    setPreviewOpen(true)
                                                }}
                                            />
                                        </div>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>

                    <div className="flex flex-col gap-3 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            Showing <span className="font-data font-medium text-text">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                            <span className="font-data font-medium text-text">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                            <span className="font-data font-medium text-text">{totalRecords}</span> records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                Previous
                            </Button>
                            <span className="font-data px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <ImagePreview isOpen={previewOpen} onClose={() => setPreviewOpen(false)} attendanceRecord={selectedRecord} />
        </div>
    )
}
