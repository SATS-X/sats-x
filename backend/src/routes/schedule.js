import express from 'express';
import {
    createSchedule,
    deleteSchedule,
    getAllSchedules,
    getLiveSessions,
    getScheduleByTeacherId,
    getSessionRoster,
    updateSchedule
} from '../app/controllers/ScheduleController.js';
import { requireSelfOrAdmin } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllSchedules);
router.post('/', createSchedule);
router.get('/live', getLiveSessions);
router.get('/:id/roster', getSessionRoster);
router.get('/teacher/:teacher_id', requireSelfOrAdmin('teacher_id'), getScheduleByTeacherId);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
