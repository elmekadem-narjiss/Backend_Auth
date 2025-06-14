import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const settings = (await axios.get('http://localhost:3000/api/saveSettings')).data;
    if (!settings.pipeline.ciCdEnabled) {
      return res.status(400).json({ message: 'CI/CD disabled' });
    }
    const response = await axios.post('http://localhost:8001/retrain');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrain' });
  }
});

export default router;