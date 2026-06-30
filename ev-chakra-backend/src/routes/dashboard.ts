import { Router, Request, Response } from 'express';
import Device from '../models/Device';

const router = Router();

// Helper to seed a default device if none exists
const getOrCreateDevice = async (deviceId: string) => {
  let device = await Device.findOne({ deviceId });
  if (!device) {
    device = new Device({ deviceId });
    await device.save();
  }
  return device;
};

// @route   GET /api/dashboard/:deviceId
// @desc    Get current device telemetry and status
// @access  Public (for MVP)
router.get('/:deviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    
    // For the MVP simulation, we randomly fluctuate the home load here
    // In a real scenario, the ESP32 would be PUT/POSTing this data to another endpoint.
    const device = await getOrCreateDevice(deviceId);
    
    // Simulate real-time home load fluctuation (between 1.0 and 6.0 kW)
    const newHomeLoad = Math.max(1.0, Math.min(6.0, device.homeLoad + (Math.random() * 0.4 - 0.2)));
    device.homeLoad = newHomeLoad;
    
    // Dynamic load balancing simulation logic
    if (device.isCharging) {
      const safeAvailable = (device.maxCapacity - device.homeLoad) * 0.9;
      device.chargePower = Math.min(7.2, safeAvailable); // Max charger speed 7.2 kW
    } else {
      device.chargePower = 0;
    }
    
    device.lastUpdated = new Date();
    await device.save();

    res.status(200).json(device);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dashboard/:deviceId/toggle
// @desc    Toggle charging status
// @access  Public (for MVP)
router.post('/:deviceId/toggle', async (req: Request, res: Response): Promise<void> => {
    try {
      const deviceId = req.params.deviceId as string;
      const { isCharging } = req.body;
      
      const device = await getOrCreateDevice(deviceId);
      
      device.isCharging = isCharging;
      if (!isCharging) {
        device.chargePower = 0;
      }
      
      await device.save();
  
      res.status(200).json(device);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

export default router;
