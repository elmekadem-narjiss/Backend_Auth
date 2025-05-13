import Battery from '../models/Battery';

export const getAllBatteries = async () => {
  return await Battery.findAll();
};

export const getBatteryById = async (id: number) => {
  return await Battery.findByPk(id);
};

export const createBattery = async (data: {
  name: string;
  capacity: number;
  stateOfCharge?: number;
  chemistry?: string;
  cycleCount?: number;
  temperature?: number;
  manufacturedDate?: Date | null;
  lastMaintenance?: Date | null;
}) => {
  return await Battery.create(data);
};

export const updateBattery = async (
  id: number,
  data: {
    name?: string;
    capacity?: number;
    stateOfCharge?: number;
    chemistry?: string;
    cycleCount?: number;
    temperature?: number;
    manufacturedDate?: Date | null;
    lastMaintenance?: Date | null;
  }
) => {
  const battery = await Battery.findByPk(id);
  if (!battery) {
    return null;
  }
  await battery.update(data);
  return battery;
};

export const deleteBattery = async (id: number) => {
  const battery = await Battery.findByPk(id);
  if (!battery) {
    return false;
  }
  await battery.destroy();
  return true;
};