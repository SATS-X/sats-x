import { useEffect, useMemo, useState } from 'react'
import { HiOutlineSearch, HiOutlineFilter, HiOutlineDownload, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineCalendar, HiOutlineRefresh, HiOutlinePhotograph } from 'react-icons/hi'
import { getAllAttendance } from '../api/attendance/getAttendance'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import { useWebSocketMessage } from '../hooks/useWebSocketMessage'
import { WS_URL } from '../config/api'
import ImagePreview from '../components/Attendance/ImagePreview'

const Attendance = () => {
    const { t } = useLanguage()
    const { showSuccess, showInfo } = useToast()
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [attendanceData, setAttendanceData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 15
    const [showImagePreview, setShowImagePreview] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [loadingImageId, setLoadingImageId] = useState(null)

    const fetchAttendance = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getAllAttendance()
            const list = (res?.data || []).map((r, idx) => ({
                id: `${r.year}-${r.month}-${r.day}-${r.time}-${r.student_id}-${idx}`,
                time: r.time,
                day: r.day,
                month: r.month,
                year: r.year,
                day_of_week: r.day_of_week,
                student_id: r.student_id,
                student_name: r.student_name,
                subject_id: r.subject_id,
                subject_name: r.subject_name,
                status: r.status,
                remark: r.remark,
                class_ids: r.class_ids,
                class_names: r.class_names
            }))
            setAttendanceData(list)
        } catch (e) {
            setError(e.message || 'Failed to load attendance')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                await fetchAttendance()
            } catch (e) {
                setError(e.message || 'Failed to load attendance')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    // Subscribe to WebSocket messages for real-time attendance updates
    useWebSocketMessage('*', (data) => {
        console.log('📨 Received WebSocket message:', data)
        
        // Check if this is an attendance update message
        if (data.status === 'success' && data.attendance_result) {
            const attendanceInfo = data.attendance_result.attendance_result
            const classInfo = data.attendance_result.class_info
            const attendanceDetails = data.attendance_result.attendance_details
            const faceCompare = data.face_compare_result
            
            // Extract student name from external_id (format: "TranDaiVi-N22DCCI044")
            const externalId = faceCompare?.external_id || ''
            let studentName = ''
            let studentId = attendanceDetails?.student_id || faceCompare?.student_id || 'Unknown'
            
            if (externalId && externalId.includes('-')) {
                const parts = externalId.split('-')
                studentName = parts[0] // "TranDaiVi"
                studentId = parts[1] || studentId // "N22DCCI044"
            }
            
            const subjectName = classInfo?.subject || attendanceDetails?.subject_id || 'Unknown Subject'
            const status = attendanceDetails?.remark || attendanceInfo?.new_status || 'Unknown'
            const time = attendanceDetails?.time || attendanceInfo?.time || ''
            
            // Determine toast type based on status
            const isOnTime = status.toLowerCase().includes('on time')
            const isLate = status.toLowerCase().includes('late')
            
            // Create formatted message
            const message = studentName 
                ? `${studentName} (${studentId}) đã điểm danh vào lúc ${time}\n${subjectName}`
                : `${studentId} đã điểm danh vào lúc ${time}\n${subjectName}`
            
            // Show toast notification
            if (isOnTime) {
                showSuccess(
                    message,
                    'Điểm danh đúng giờ'
                )
            } else if (isLate) {
                showInfo(
                    message,
                    'Điểm danh muộn'
                )
            } else {
                showInfo(
                    message,
                    `Điểm danh: ${status}`
                )
            }
            
            // Auto refresh attendance data to show new record
            setTimeout(() => {
                fetchAttendance()
            }, 1000)
        }
    }, [fetchAttendance, showSuccess, showInfo])

    const classes = useMemo(() => {
        const set = new Set()
        attendanceData.forEach(r => (r.class_names || '').split(',').forEach(c => c && set.add(c.trim())))
        return Array.from(set)
    }, [attendanceData])

    const subjects = useMemo(() => {
        const set = new Set()
        attendanceData.forEach(r => r.subject_name && set.add(r.subject_name))
        return Array.from(set)
    }, [attendanceData])

    const filteredAttendance = useMemo(() => attendanceData.filter(record => {
        const matchesSearch = record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            record.student_id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesClass = selectedClass === 'all' || (record.class_names || '').split(',').map(s => s.trim()).includes(selectedClass)
        const matchesSubject = selectedSubject === 'all' || record.subject_name === selectedSubject
        const matchesDate = selectedDate
            ? `${record.year}-${String(record.month).padStart(2, '0')}-${String(record.day).padStart(2, '0')}` === selectedDate
            : true
        return matchesSearch && matchesClass && matchesSubject && matchesDate
    }), [attendanceData, searchTerm, selectedClass, selectedSubject, selectedDate])

    // Reset to page 1 whenever filters change or data reloads
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedClass, selectedSubject, selectedDate, attendanceData])

    const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize))
    const startIdx = (currentPage - 1) * pageSize
    const endIdx = Math.min(startIdx + pageSize, filteredAttendance.length)
    const pageRows = filteredAttendance.slice(startIdx, endIdx)

    const getStatusIcon = (remark) => {
        switch ((remark || '').toLowerCase()) {
            case 'on time':
                return <HiOutlineCheckCircle className="text-emerald-500" />
            case 'absent':
                return <HiOutlineXCircle className="text-rose-500" />
            default:
                return <HiOutlineClock className="text-amber-500" />
        }
    }

    const getStatusText = (remark) => {
        const r = (remark || '').toLowerCase()
        if (r === 'on time') return t('onTime')
        if (r === 'absent') return t('absentStatus')
        if (r === 'late') return t('lateStatus')
        return t('unknown')
    }

    const getStatusColor = (remark) => {
        switch ((remark || '').toLowerCase()) {
            case 'on time':
                return 'text-emerald-700 bg-emerald-50 border-emerald-200'
            case 'absent':
                return 'text-rose-700 bg-rose-50 border-rose-200'
            case 'late':
            default:
                return 'text-amber-700 bg-amber-50 border-amber-200'
        }
    }

    const totalStudents = filteredAttendance.length
    const presentCount = filteredAttendance.filter(r => (r.remark || '').toLowerCase() === 'on time').length
    const lateCount = filteredAttendance.filter(r => (r.remark || '').toLowerCase() === 'late').length
    const absentCount = filteredAttendance.filter(r => (r.remark || '').toLowerCase() === 'absent').length
    const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0

    const formatDateForAPI = (day, month, year) => {
        if (!day || !month || !year) return null
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
    }

    const formatTimeForFileName = (time, day, month, year) => {
        if (!time || !day || !month || !year) return null
        // Convert time format "HH:MM:SS" or "HH:MM" to "HH-MM-SS" for filename
        const timeParts = time.split(':')
        if (timeParts.length >= 2) {
            const hours = timeParts[0].padStart(2, '0')
            const minutes = timeParts[1].padStart(2, '0')
            // Sử dụng giây thực từ time, nếu không có thì mặc định là '00'
            const seconds = timeParts.length >= 3 ? timeParts[2].padStart(2, '0') : '00'
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            return `${dateStr}_${hours}-${minutes}-${seconds}.jpg`
        }
        return null
    }

    const callWebSocketAPI = (record) => {
        const formattedDay = formatDateForAPI(record.day, record.month, record.year)
        const fileName = formatTimeForFileName(record.time, record.day, record.month, record.year)
        
        if (!formattedDay || !fileName) {
            console.error('Cannot format date or filename for WebSocket API')
            setSelectedStudent(record)
            setShowImagePreview(true)
            return
        }

        setLoadingImageId(record.id)
        const ws = new WebSocket(WS_URL)

        const payload = {
            action: "url",
            object: "history",
            deviceId: "ESP32CAM_01",
            day: formattedDay,
            name: fileName,
            expiration: 3600
        }

        ws.onopen = () => {
            console.log('WebSocket connection opened')
            console.log('Sending payload:', payload)
            ws.send(JSON.stringify(payload))
        }

        ws.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data)
                console.log('WebSocket response:', response)
                
                // Xử lý response từ WebSocket
                if (response.status === 'success' && response.data && response.data.presigned_url) {
                    // Cập nhật record với URL ảnh thực
                    const updatedRecord = {
                        ...record,
                        imageUrl: response.data.presigned_url
                    }
                    setSelectedStudent(updatedRecord)
                    setShowImagePreview(true)
                } else {
                    console.warn('No presigned URL in response')
                    // Vẫn hiển thị modal với avatar mặc định
                    setSelectedStudent(record)
                    setShowImagePreview(true)
                }
            } catch (error) {
                console.error('Error parsing WebSocket response:', error)
                // Vẫn hiển thị modal với avatar mặc định
                setSelectedStudent(record)
                setShowImagePreview(true)
            }
            setLoadingImageId(null)
            ws.close()
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            // Vẫn hiển thị modal với avatar mặc định nếu có lỗi
            setSelectedStudent(record)
            setShowImagePreview(true)
            setLoadingImageId(null)
            ws.close()
        }

        ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason)
        }

        // Timeout sau 10 giây
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                console.warn('WebSocket timeout, closing connection')
                ws.close()
                // Vẫn hiển thị modal với avatar mặc định
                setSelectedStudent(record)
                setShowImagePreview(true)
                setLoadingImageId(null)
            }
        }, 10000)
    }

    const handleImageClick = (record) => {
        // Call WebSocket API để lấy presigned URL cho ảnh
        callWebSocketAPI(record)
    }

    const handleCloseImagePreview = () => {
        setShowImagePreview(false)
        setSelectedStudent(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('attendanceManagement')}</h1>
                    <p className="text-slate-600">{t('dailyAttendanceTracking')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            try {
                                const rows = filteredAttendance
                                const headers = [
                                    'time','day','month','year','day_of_week','student_id','student_name','subject_id','subject_name','status','class_names'
                                ]
                                const csvRows = []
                                csvRows.push(headers.join(','))
                                rows.forEach(r => {
                                    const statusLabel = getStatusText(r.remark)
                                    const values = [
                                        r.time,
                                        r.day,
                                        r.month,
                                        r.year,
                                        r.day_of_week,
                                        r.student_id,
                                        r.student_name?.replaceAll(',',' '),
                                        r.subject_id,
                                        r.subject_name?.replaceAll(',',' '),
                                        statusLabel,
                                        (r.class_names || '').replaceAll('\n',' ').replaceAll(',',' |')
                                    ]
                                    csvRows.push(values.map(v => `"${v ?? ''}"`).join(','))
                                })
                                const csvContent = '\ufeff' + csvRows.join('\n')
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                const url = URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                const today = new Date()
                                const name = `attendance_${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}.csv`
                                link.setAttribute('download', name)
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                URL.revokeObjectURL(url)
                            } catch (e) {
                                console.error('Export CSV failed', e)
                            }
                        }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    >
                        <HiOutlineDownload className="text-lg" />
                        {t('exportReport')}
                    </button>
                    <button
                        onClick={fetchAttendance}
                        className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                        title={t('refresh')}
                    >
                        <HiOutlineRefresh className="text-lg" />
                        {t('refresh')}
                    </button>
                </div>
            </div>

            {/* Loading/Error */}
            {loading && <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">{t('loadingAttendance')}</div>}
            {error && <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-red-600">{error}</div>}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <HiOutlineCalendar className="text-slate-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('totalCount')}</p>
                            <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <HiOutlineCheckCircle className="text-emerald-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('present')}</p>
                            <p className="text-2xl font-bold text-slate-900">{presentCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <HiOutlineClock className="text-amber-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('late')}</p>
                            <p className="text-2xl font-bold text-slate-900">{lateCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <HiOutlineXCircle className="text-rose-600 text-xl" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('absent')}</p>
                            <p className="text-2xl font-bold text-slate-900">{absentCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <div className="text-indigo-600 text-xl font-bold">%</div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-600">{t('attendanceRate')}</p>
                            <p className="text-2xl font-bold text-slate-900">{attendanceRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('searchStudentsAttendance')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">{t('allClasses')}</option>
                            {classes.map(className => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">{t('allSubjects')}</option>
                            {subjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                            <HiOutlineFilter />
                            {t('filter')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('studentName')}
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('image')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('class')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('subjectName')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('subjectCode')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('date')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('time')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dayOfWeek')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {t('statusLabel')}
                                </th>
                                
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {pageRows.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                {record.student_name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{record.student_name}</div>
                                                <div className="text-sm text-slate-500">{record.student_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleImageClick(record)}
                                            disabled={loadingImageId === record.id}
                                            className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 ${loadingImageId === record.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={`${t('viewImage')} - ${record.student_name}`}
                                        >
                                            {loadingImageId === record.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <HiOutlinePhotograph className="text-lg" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                                            {(record.class_names ? record.class_names.split(',') : []).map((c, idx) => (
                                                <span key={`${record.id}-c-${idx}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{c.trim()}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {record.subject_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.subject_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{`${String(record.day).padStart(2, '0')}/${String(record.month).padStart(2, '0')}/${record.year}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {record.time || '--:--'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{record.day_of_week}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(record.remark)}
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.remark)}`}>
                                                {getStatusText(record.remark)}
                                            </span>
                                        </div>
                                    </td>
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-700">
                        {t('showingRecords')} <span className="font-medium">{filteredAttendance.length === 0 ? 0 : startIdx + 1}</span> {t('toRecords')} <span className="font-medium">{endIdx}</span> {t('ofTotalRecords')} <span className="font-medium">{filteredAttendance.length}</span> {t('records')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 border border-slate-300 rounded-md text-sm transition-colors duration-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        >
                            {t('previous')}
                        </button>
                        <span className="text-sm text-slate-700">{t('page')} {currentPage}/{totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 border border-slate-300 rounded-md text-sm transition-colors duration-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        >
                            {t('next')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            <ImagePreview
                isOpen={showImagePreview}
                onClose={handleCloseImagePreview}
                studentData={selectedStudent}
                attendanceRecord={selectedStudent}
            />
        </div>
    )
}

export default Attendance