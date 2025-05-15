import express, { Request, Response } from 'express';
import Equipment from '../models/Equipment';
import { writeEquipmentMetrics, queryEquipmentMetrics, flushWrites } from '../services/influx';
import { EquipmentData, StoredEquipmentData } from '../types';

const router = express.Router();

// Simulate Equipment Data
function simulateEquipmentData(): EquipmentData[] {
  const equipmentTypes = ['sensor', 'panel', 'cpu', 'ram', 'storage'];
  const data: EquipmentData[] = [];
  for (let i = 1; i <= 5; i++) {
    const type = equipmentTypes[i - 1]; // One of each type
    const metrics: EquipmentData['metrics'] = {};
    if (type === 'sensor') {
      metrics.temperature = 20 + Math.random() * 20; // 20–40°C
      metrics.humidity = 30 + Math.random() * 50; // 30–80%
    } else if (type === 'panel') {
      metrics.energyProduced = 20 + Math.random() * 30; // 20–50 kWh (daily, 10 kW array)
    } else if (type === 'cpu') {
      metrics.cpuUsage = Math.random() * 100; // 0–100%
    } else if (type === 'ram') {
      metrics.ramUsage = Math.random() * 100; // 0–100%
    } else if (type === 'storage') {
      metrics.storageUsed = Math.random() * 1000; // 0–1000 GB
      metrics.storageTotal = 1000; // Fixed total
    }
    data.push({
      equipmentId: `EQ${i}`,
      type,
      metrics,
    });
  }
  return data;
}

// Get Equipment Data
router.get('/', async (req: Request, res: Response) => {
  try {
    const equipments = await Equipment.findAll();
    const equipmentData: StoredEquipmentData[] = [];
    for (const equip of equipments) {
      const metrics = await queryEquipmentMetrics(equip.equipmentId, equip.type, '1h');
      equipmentData.push({
        equipmentId: equip.equipmentId,
        type: equip.type,
        metrics,
      });
    }
    res.json(equipmentData);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Error fetching equipment data' });
  }
});

// Simulate and Store Data
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const simulatedData = simulateEquipmentData();
    // Clear existing data
    await Equipment.destroy({ where: {} });
    for (const data of simulatedData) {
      await Equipment.create({ equipmentId: data.equipmentId, type: data.type });
      writeEquipmentMetrics(data.equipmentId, data.type, data.metrics);
    }
    await flushWrites();
    res.json(simulatedData);
  } catch (err) {
    console.error('Error simulating equipment:', err);
    res.status(500).json({ error: 'Error simulating data' });
  }
});

export default router;