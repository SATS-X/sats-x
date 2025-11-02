import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineTrash } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'

const DropdownMenu = ({ student, onDeleteFace, onDeleteStudent, onClose, buttonRef }) => {
    const { t } = useLanguage()
    const dropdownRef = useRef(null)
    const [position, setPosition] = useState({ top: 0, right: 0 })

    useEffect(() => {
        if (buttonRef && dropdownRef.current) {
            const buttonRect = buttonRef.getBoundingClientRect()
            const dropdownRect = dropdownRef.current.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const viewportWidth = window.innerWidth
            
            let top = buttonRect.bottom + 8 // 8px spacing
            let right = viewportWidth - buttonRect.right
            
            // Check if dropdown goes beyond viewport bottom
            if (top + dropdownRect.height > viewportHeight - 20) {
                // Position dropdown above the button
                top = buttonRect.top - dropdownRect.height - 8
            }
            
            // Check if dropdown goes beyond viewport left
            if (buttonRect.right - 224 < 0) { // 224px = 14rem (w-56)
                right = viewportWidth - buttonRect.left - buttonRect.width
            }
            
            setPosition({ top, right })
        }
    }, [buttonRef])

    return (
        <>
            {/* Invisible backdrop to close dropdown */}
            <div 
                className="fixed inset-0 z-[100]"
                onClick={onClose}
            ></div>
            
            {/* Dropdown Content */}
            <div 
                ref={dropdownRef}
                className="fixed w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-[101]"
                style={{
                    top: `${position.top}px`,
                    right: `${position.right}px`
                }}
            >
                <div className="py-1">
                    {/* Delete Face ID */}
                    {student.faceID && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteFace(student)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-150 flex items-center"
                        >
                            <HiOutlineTrash className="mr-3 h-4 w-4" />
                            {t('deleteFaceID')}
                        </button>
                    )}
                    
                    {/* Divider */}
                    {student.faceID && (
                        <div className="border-t border-slate-200 my-1"></div>
                    )}

                    {/* Delete Student */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDeleteStudent(student)
                            onClose()
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center"
                    >
                        <HiOutlineTrash className="mr-3 h-4 w-4" />
                        {t('deleteStudent')}
                    </button>
                </div>
            </div>
        </>
    )
}

DropdownMenu.propTypes = {
    student: PropTypes.shape({
        student_id: PropTypes.string,
        faceID: PropTypes.string
    }).isRequired,
    onDeleteFace: PropTypes.func.isRequired,
    onDeleteStudent: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    buttonRef: PropTypes.object
}

export default DropdownMenu

