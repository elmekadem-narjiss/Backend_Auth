import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// Proxy settings to Next.js API
router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('http://localhost:3000/api/saveSettings');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post('http://localhost:3000/api/saveSettings', req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;