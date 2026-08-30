import { useState, useEffect, useMemo, useRef } from 'react'
import { HiOutlineDownload, HiOutlineRefresh, HiOutlineEye, HiOutlineCamera } from 'react-icons/hi'
import { getAllAttendance } from '../api/attendance/getAttendance'
import { getClasses } from '../api/class/getClasses'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import ImagePreview from '../components/Attendance/ImagePreview'
import {
    Avatar,
    Badge,
    Button,
    EmptyState,
    PageHeader,
    SearchInput,
    Select,
    Spinner,
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
    const { showInfo, showSuccess, showError } = useToast()
    const { subscribe, sendMessage, isConnected } = useWebSocket()
    const [triggering, setTriggering] = useState(false)

    const [attendanceData, setAttendanceData] = useState([])
    const [classesList, setClassesList] = useState([])
    const [loading, setLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedRemark, setSelectedRemark] = useState('all')

    const [previewOpen, setPreviewOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState(null)

    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 12

    const fetchAttendanceData = async () => {
        setLoading(true)
        try {
            const [attRes, clsRes] = await Promise.allSettled([getAllAttendance(), getClasses()])
            if (attRes.status === 'fulfilled' && attRes.value?.success) setAttendanceData(attRes.value.data)
            if (clsRes.status === 'fulfilled' && clsRes.value?.success) setClassesList(clsRes.value.data)
        } catch (err) {
            showError(err.message || 'Could not load attendance records', 'Error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAttendanceData()
    }, [])

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
                setTimeout(fetchAttendanceData, 6000)
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

    const filteredData = useMemo(() => {
        return attendanceData.filter((item) => {
            const search = searchTerm.toLowerCase()
            const matchesSearch =
                !searchTerm || item.student_name?.toLowerCase().includes(search) || item.student_id?.toLowerCase().includes(search)
            const matchesClass = selectedClass === 'all' || item.class_names?.includes(selectedClass)
            const matchesRemark = selectedRemark === 'all' || item.remark === selectedRemark
            return matchesSearch && matchesClass && matchesRemark
        })
    }, [attendanceData, searchTerm, selectedClass, selectedRemark])

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, currentPage])

    const exportCSV = () => {
        const headers = ['Student ID', 'Full name', 'Class', 'Date', 'Time', 'Status']
        const rows = filteredData.map((r) => [
            r.student_id || '',
            r.student_name || '',
            r.class_names || '',
            `${r.day}/${r.month}/${r.year}`,
            r.time || '',
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
                title={
                    <span className="inline-flex items-center gap-2.5">
                        {t('attendanceManagement')}
                        {isConnected && <Badge className="text-present">Live IoT Stream</Badge>}
                    </span>
                }
                description={t('dailyAttendanceTracking')}
                actions={
                    <>
                        <Button variant="secondary" size="sm" onClick={fetchAttendanceData}>
                            <HiOutlineRefresh className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                            Refresh
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={!isConnected || triggering}
                            onClick={handleTriggerCapture}
                            title={isConnected ? undefined : 'WebSocket is not connected to AWS Gateway'}
                        >
                            <HiOutlineCamera className={triggering ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                            {triggering ? 'Sending command...' : 'Capture now'}
                        </Button>
                        <Button size="sm" onClick={exportCSV}>
                            <HiOutlineDownload className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                    }}
                    placeholder="Search by name or student ID..."
                />
                <Select
                    value={selectedClass}
                    onChange={(e) => {
                        setSelectedClass(e.target.value)
                        setCurrentPage(1)
                    }}
                >
                    <option value="all">All classes</option>
                    {classesList.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                            {c.class_id}
                        </option>
                    ))}
                </Select>
                <Select
                    value={selectedRemark}
                    onChange={(e) => {
                        setSelectedRemark(e.target.value)
                        setCurrentPage(1)
                    }}
                >
                    <option value="all">All statuses</option>
                    <option value="On Time">On time</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-card border border-border bg-surface py-16 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Loading attendance records...
                </div>
            ) : paginatedData.length === 0 ? (
                <EmptyState title="No matching attendance records" />
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
                                                <div className="font-data text-xs text-text-tertiary">{record.student_id}</div>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD>{record.class_names ? <Badge className="font-data">{record.class_names}</Badge> : '—'}</TD>
                                    <TD className="font-data">{record.time || '—'}</TD>
                                    <TD className="font-data text-text-tertiary">{record.day}/{record.month}/{record.year}</TD>
                                    <TD>
                                        <StatusChip variant={REMARK_VARIANT[record.remark] || 'neutral'}>
                                            {REMARK_LABEL[record.remark] || record.remark}
                                        </StatusChip>
                                    </TD>
                                    <TD>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setSelectedRecord(record)
                                                    setPreviewOpen(true)
                                                }}
                                                className="inline-flex items-center gap-1 rounded-card px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                                            >
                                                <HiOutlineEye className="h-3.5 w-3.5" />
                                                Xem
                                            </button>
                                        </div>
                                    </TD>
                                </TR>
                            ))}
                        </TBody>
                    </Table>

                    <div className="flex items-center justify-between text-xs text-text-secondary">
                        <div>
                            Showing <span className="font-medium text-text">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                            <span className="font-medium text-text">{Math.min(currentPage * pageSize, filteredData.length)}</span> of{' '}
                            <span className="font-medium text-text">{filteredData.length}</span> records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                Previous page
                            </Button>
                            <span className="font-data px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Trang sau
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <ImagePreview isOpen={previewOpen} onClose={() => setPreviewOpen(false)} attendanceRecord={selectedRecord} />
        </div>
    )
}
