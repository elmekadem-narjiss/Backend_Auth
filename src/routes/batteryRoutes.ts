import { Router, RequestHandler } from 'express';
import {
  getAllBatteries,
  getBatteryById,
  createBattery,
  updateBattery,
  deleteBattery,
} from '../controllers/batteryController';

const router = Router();

router.get('/', getAllBatteries as RequestHandler);
router.get('/:id', getBatteryById as RequestHandler);
router.post('/', createBattery as RequestHandler);
router.put('/:id', updateBattery as RequestHandler);
router.delete('/:id', deleteBattery as RequestHandler);

export default router;