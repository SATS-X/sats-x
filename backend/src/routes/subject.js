import express from 'express';
import {
    addSubjectStudents,
    createSubject,
    deleteSubject,
    getAllSubjects,
    getAllSubjectsByTeacherId,
    getSubjectById,
    getSubjectStudent,
    removeSubjectStudent,
    updateSubject
} from '../app/controllers/SubjectController.js';
import { requireRole, requireSelfOrAdmin } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireRole('admin'), getAllSubjects);
router.post('/', createSubject);

// Route tĩnh phải đứng trước '/:subject_id', nếu không 'teacher' sẽ bị
// hiểu thành một subject_id.
router.get('/teacher/:teacher_id', requireSelfOrAdmin('teacher_id'), getAllSubjectsByTeacherId);
router.get('/:subject_id/students', getSubjectStudent);
router.post('/:subject_id/students', addSubjectStudents);
router.delete('/:subject_id/students/:student_id', removeSubjectStudent);
router.get('/:subject_id', getSubjectById);
router.put('/:subject_id', updateSubject);
router.delete('/:subject_id', deleteSubject);

export default router;
