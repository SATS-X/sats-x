import express from 'express';
import { deleteAllVisitors, deleteVisitor, enrollVisitor, getVisitors, identifyVisitor } from '../app/controllers/KioskController.js';

const router = express.Router();

router.get('/visitors', getVisitors);
router.post('/visitors', enrollVisitor);
router.delete('/visitors', deleteAllVisitors);
router.delete('/visitors/:id', deleteVisitor);
router.post('/identify', identifyVisitor);

export default router;
