import { Router, Request, Response, NextFunction } from 'express';
import { getPredictions } from '../models/predictions';

const router = Router();

// Middleware pour valider la requête
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  req.query.limit = req.query.limit || '10';
  next();
};

// Route API
router.get('/', validateRequest, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10);
    const predictions = await getPredictions(limit);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

export default router;