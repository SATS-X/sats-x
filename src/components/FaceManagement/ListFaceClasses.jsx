import PropTypes from 'prop-types'
import { HiOutlineUsers, HiOutlineUserGroup } from 'react-icons/hi'
import { useLanguage } from '../../contexts/LanguageContext'

const ListFaceClasses = ({ classes, onClassClick }) => {
    const { t } = useLanguage()

    if (!classes || classes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
                <HiOutlineUserGroup className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t('noClasses')}</h3>
                <p className="text-slate-600">{t('noClassesInSystem')}</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">{t('classList')}</h2>
                <p className="text-sm text-slate-600">{t('selectClassToManage')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {classes.map((classItem) => (
                    <div
                        key={classItem.class_id}
                        onClick={() => onClassClick(classItem)}
                        className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                    <span className="text-white font-bold text-sm">
                                        {classItem.class_id.substring(0, 3)}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {classItem.class_name}
                                    </h3>
                                    <p className="text-sm text-slate-600">{classItem.class_id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex items-center text-sm text-slate-600">
                                <HiOutlineUsers className="h-4 w-4 mr-1" />
                                <span>{classItem.actual_student_count || classItem.number_of_students || 0} {t('students')}</span>
                            </div>
                            <button className="p-2 text-slate-400 group-hover:text-indigo-600 transition-colors duration-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

ListFaceClasses.propTypes = {
    classes: PropTypes.arrayOf(PropTypes.shape({
        class_id: PropTypes.string.isRequired,
        class_name: PropTypes.string.isRequired,
        actual_student_count: PropTypes.number,
        number_of_students: PropTypes.number,
        status: PropTypes.number
    })).isRequired,
    onClassClick: PropTypes.func.isRequired
}

export default ListFaceClasses

