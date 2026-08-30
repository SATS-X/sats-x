import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

const ClassCard = ({ classInfo, subjectId }) => {
    const navigate = useNavigate()
    const backgroundColor = '#24303f'

    return (
        <div className="bg-white rounded-2xl p-4 shadow-lg flex flex-col justify-between w-70 h-[270px] relative overflow-hidden">
            <div
                className="relative z-10 flex items-center justify-center rounded-full h-12 w-12 text-white font-bold text-lg"
                style={{ backgroundColor }}
            >
                {classInfo.name.charAt(0)}
            </div>

            <div className="mt-4 relative z-10 text-neutral-600">
                <h3 className="text-lg font-semibold">{classInfo.name}</h3>
                <p className="text-sm">{classInfo.class_id}</p>
                <p className="text-sm">👥 {classInfo.number_of_students} Students</p>
                <p className="text-sm">🕒 {classInfo.schedule}</p>
                <p className="text-sm">
                    📅 {new Date(classInfo.start_day).toLocaleDateString('vi-VN')} ➝ {new Date(classInfo.end_day).toLocaleDateString('vi-VN')}
                </p>
            </div>

            {/* Button */}
            <button
                className="w-1/2 relative z-10 mt-4 px-4 py-2 border border-neutral-700 rounded-lg hover:bg-blue-100 transition"
                onClick={() => navigate(`/subject/${subjectId}/${classInfo.class_id}`)}
            >
                View Details
            </button>
        </div>
    )
}

const ClassList = ({ classes, subjectId }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {classes.map((classInfo) => (
                <ClassCard key={classInfo.class_id} classInfo={classInfo} subjectId={subjectId} />
            ))}
        </div>
    )
}

ClassCard.propTypes = {
    classInfo: PropTypes.shape({
        class_id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        backgroundColor: PropTypes.string,
        number_of_students: PropTypes.number.isRequired,
        schedule: PropTypes.string.isRequired,
        start_day: PropTypes.string.isRequired,
        end_day: PropTypes.string.isRequired
    }).isRequired,
    subjectId: PropTypes.string.isRequired
}

ClassList.propTypes = {
    classes: PropTypes.arrayOf(
        PropTypes.shape({
            class_id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            number_of_students: PropTypes.number.isRequired,
            schedule: PropTypes.string.isRequired,
            start_day: PropTypes.string.isRequired,
            end_day: PropTypes.string.isRequired
        })
    ).isRequired,
    subjectId: PropTypes.string.isRequired
}

export default ClassList
