import { Request, Response } from 'express';
import * as batteryService from '../services/batteryService';

export const getAllBatteries = async (req: Request, res: Response) => {
  try {
    const batteries = await batteryService.getAllBatteries();
    res.json(batteries);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des batteries' });
  }
};

export const getBatteryById = async (req: Request, res: Response) => {
  try {
    const battery = await batteryService.getBatteryById(Number(req.params.id));
    if (!battery) {
      return res.status(404).json({ error: 'Batterie non trouvée' });
    }
    res.json(battery);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la batterie' });
  }
};

export const createBattery = async (req: Request, res: Response) => {
  try {
    const battery = await batteryService.createBattery(req.body);
    res.status(201).json(battery);
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la création de la batterie' });
  }
};

export const updateBattery = async (req: Request, res: Response) => {
  try {
    const battery = await batteryService.updateBattery(Number(req.params.id), req.body);
    if (!battery) {
      return res.status(404).json({ error: 'Batterie non trouvée' });
    }
    res.json(battery);
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la mise à jour de la batterie' });
  }
};

export const deleteBattery = async (req: Request, res: Response) => {
  try {
    const success = await batteryService.deleteBattery(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Batterie non trouvée' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la suppression de la batterie' });
  }
};