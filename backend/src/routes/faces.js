import express from 'express';
import { addFace, deleteFace, getEngineStatus, getFacePhoto, getFaces, identifyStudent } from '../app/controllers/FaceController.js';

const router = express.Router();

router.get('/', getFaces);
router.get('/status', getEngineStatus);
router.post('/', addFace);
router.post('/identify', identifyStudent);
router.get('/:id/photo', getFacePhoto);
router.delete('/:id', deleteFace);

export default router;
