import express from 'express';
import {
    createSchedule,
    deleteSchedule,
    getAllSchedules,
    getScheduleByTeacherId,
    updateSchedule
} from '../app/controllers/ScheduleController.js';
import { requireSelfOrAdmin } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.get('/teacher/:teacher_id', requireSelfOrAdmin('teacher_id'), getScheduleByTeacherId);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
