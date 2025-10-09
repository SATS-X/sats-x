import { useEffect, useRef } from 'react'
import { MdClose, MdDevices, MdPerson, MdFace, MdSchool, MdAccessTime } from 'react-icons/md'
import PropTypes from 'prop-types'

const ImagePreview = ({
  isOpen,
  onClose,
  studentData,
  attendanceRecord
}) => {
  const closeBtnRef = useRef(null)

  // Đóng bằng phím ESC và focus nút đóng khi modal mở
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    closeBtnRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Trì hoãn return null cho đến sau khi hooks đã được gọi để giữ thứ tự hooks ổn định
  if (!isOpen || !studentData) return null

  const formatDate = (day, month, year) => {
    if (!day || !month || !year) return 'N/A'
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  }

  const getStatusColor = (remark) => {
    switch ((remark || '').toLowerCase()) {
      case 'on time':
        return 'bg-green-500'
      case 'absent':
        return 'bg-red-500'
      case 'late':
        return 'bg-amber-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (remark) => {
    switch ((remark || '').toLowerCase()) {
      case 'on time':
        return 'Present'
      case 'absent':
        return 'Absent'
      case 'late':
        return 'Late'
      default:
        return 'Unknown'
    }
  }

  const imageUrl =
    studentData?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      studentData?.student_name || 'Unknown'
    )}&size=400&background=4f46e5&color=ffffff&format=png`

  return (
    // Overlay chiếm full màn hình, làm mờ & tối nền
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop: màu xám + blur nền phía sau */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 opacity-100" />

      {/* Modal panel */}
      <div
        className="relative bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 flex animate-[fadeIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()} // ngăn đóng khi click bên trong
        style={{
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Left Side - Information */}
        <div className="w-2/5 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">Student Information</h3>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(attendanceRecord?.day, attendanceRecord?.month, attendanceRecord?.year)}
              </p>
            </div>

            {/* Student Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Student Details</h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center mb-2">
                  <MdPerson className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {studentData.student_name || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {studentData.student_id || 'No ID'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(attendanceRecord?.remark)} mr-2`} />
                  <span className="text-xs text-gray-600">
                    {getStatusText(attendanceRecord?.remark)}
                  </span>
                </div>
              </div>
            </div>

            {/* Class Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Class Information</h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center">
                  <MdSchool className="w-4 h-4 text-blue-500 mr-2" />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1">
                      {(attendanceRecord?.class_names
                        ? attendanceRecord.class_names.split(',')
                        : ['N/A']
                      ).map((className, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {className.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Info */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Subject Information</h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center">
                  <MdDevices className="w-4 h-4 text-purple-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attendanceRecord?.subject_name || 'Unknown Subject'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code: {attendanceRecord?.subject_id || 'No Code'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Details */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Attendance Details</h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                <div className="flex items-center">
                  <MdAccessTime className="w-3 h-3 text-gray-400 mr-2" />
                  <span className="text-xs text-gray-600">
                    {attendanceRecord?.time || 'No time recorded'}
                  </span>
                </div>
                <div className="flex items-center">
                  <MdFace className="w-3 h-3 text-green-500 mr-2" />
                  <span className="text-xs text-gray-600">
                    {attendanceRecord?.day_of_week || 'Unknown day'}
                  </span>
                </div>
              </div>
            </div>

            {/* Image Information */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Image Information</h4>
              <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${studentData?.imageUrl ? 'bg-green-500' : 'bg-gray-400'} mr-2`}
                  />
                  <span className="text-xs text-gray-600">
                    {studentData?.imageUrl ? 'Live Camera Photo' : 'Generated Avatar'}
                  </span>
                </div>
                {studentData?.imageUrl && (
                  <div className="text-xs text-gray-500">Source: ESP32CAM_01 Device</div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {attendanceRecord?.remark && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Status Notes</h4>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 capitalize">{attendanceRecord.remark}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-3">
            <img
              src={imageUrl}
              alt={`${studentData.student_name} Profile Picture`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              onError={(e) => {
                e.currentTarget.src =
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.student_name)}&size=300&background=6366f1&color=ffffff&format=png&bold=true`
              }}
            />
            {studentData?.imageUrl && (
              <div className="absolute top-2 left-2">
                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                  Live Photo
                </div>
              </div>
            )}
          </div>

          {/* Student Name Overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{studentData.student_name}</p>
              <p className="text-xs text-gray-600">{studentData.student_id}</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            ref={closeBtnRef}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={onClose}
            aria-label="Close"
          >
            <MdClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

ImagePreview.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentData: PropTypes.object,
  attendanceRecord: PropTypes.object
}

export default ImagePreview
