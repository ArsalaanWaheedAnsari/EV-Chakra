import { Router, Request, Response } from 'express';
import Device from '../models/Device';
import Telemetry from '../models/Telemetry';
import { publishCommand } from '../services/mqttService';

const router = Router();

// Helper to get or create a device
const getOrCreateDevice = async (deviceId: string) => {
  let device = await Device.findOne({ deviceId });
  if (!device) {
    device = new Device({ deviceId });
    await device.save();
  }
  return device;
};

// @route   GET /api/dashboard/:deviceId
// @desc    Get current device telemetry and status (real data from MQTT)
// @access  Public (for MVP)
router.get('/:deviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    const device = await getOrCreateDevice(deviceId);

    res.status(200).json(device);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dashboard/:deviceId/toggle
// @desc    Toggle charging status — also sends MQTT command to the device
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

    // Send MQTT command to the ESP32 (or simulator)
    publishCommand(deviceId, {
      command: 'SET_CHARGE',
      isCharging,
      maxAmps: isCharging ? 16 : 0,
    });

    res.status(200).json(device);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dashboard/:deviceId/command
// @desc    Send an arbitrary MQTT command to a device
// @access  Public (for MVP)
router.post('/:deviceId/command', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    const { command, ...params } = req.body;

    if (!command) {
      res.status(400).json({ message: 'Command is required' });
      return;
    }

    const sent = publishCommand(deviceId, { command, ...params });

    if (sent) {
      res.status(200).json({ message: `Command '${command}' sent to ${deviceId}` });
    } else {
      res.status(503).json({ message: 'MQTT broker not connected' });
    }
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/:deviceId/history
// @desc    Get telemetry history for charts (last N minutes)
// @access  Public (for MVP)
router.get('/:deviceId/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    const minutes = parseInt(req.query.minutes as string) || 30; // Default last 30 min

    const since = new Date(Date.now() - minutes * 60 * 1000);

    const telemetry = await Telemetry.find({
      deviceId,
      timestamp: { $gte: since }
    })
      .sort({ timestamp: 1 })
      .limit(500) // Cap at 500 data points
      .select('voltage current power temperature timestamp -_id');

    res.status(200).json({
      deviceId,
      minutes,
      count: telemetry.length,
      data: telemetry,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
