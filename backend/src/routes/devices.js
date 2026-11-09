import express from 'express';
import { deleteDevice, getDevices, updateDevice } from '../app/controllers/FleetController.js';

const router = express.Router();

router.get('/', getDevices);
router.put('/:device_id', updateDevice);
router.delete('/:device_id', deleteDevice);

export default router;
