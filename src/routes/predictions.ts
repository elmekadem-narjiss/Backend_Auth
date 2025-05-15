import { Router, Request, Response } from 'express';
import { getPredictions } from '../models/predictions';

const router = Router();

// Route API
router.get('/', async (req: Request, res: Response) => {
  try {
    const predictions = await getPredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

export default router;