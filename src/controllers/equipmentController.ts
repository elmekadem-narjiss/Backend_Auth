import { Request, Response } from 'express';
import EquipmentMetrics from '../models/equipmentMetrics';

export const getEquipmentData = async (req: Request, res: Response) => {
  try {
    const equipmentData = await EquipmentMetrics.findAll({
      order: [['timestamp', 'DESC']],
    });
    res.status(200).json(equipmentData);
  } catch (error) {
    console.error('Error fetching equipment data:', error);
    res.status(500).json({ error: 'Failed to fetch equipment data' });
  }
};