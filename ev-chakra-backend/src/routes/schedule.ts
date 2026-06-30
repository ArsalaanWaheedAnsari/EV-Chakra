import { Router, Request, Response } from 'express';
import Schedule from '../models/Schedule';
import { calculateOptimalSchedule } from '../services/schedulerService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// @route   GET /api/schedule/:deviceId
// @desc    Get the active schedule for a device
// @access  Public (for MVP)
router.get('/:deviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    const schedule = await Schedule.findOne({ deviceId, isActive: true });
    
    if (!schedule) {
      res.status(200).json({ hasSchedule: false });
      return;
    }
    
    res.status(200).json({ hasSchedule: true, schedule });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/schedule/:deviceId
// @desc    Create or update a schedule for a device
// @access  Public (for MVP)
router.post('/:deviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    const { targetChargePercent, readyByTime, mode, daysOfWeek } = req.body;

    if (!targetChargePercent || !readyByTime || !mode) {
      res.status(400).json({ message: 'targetChargePercent, readyByTime, and mode are required' });
      return;
    }

    // Calculate optimal start time
    const optimal = calculateOptimalSchedule({ targetChargePercent, readyByTime, mode });

    // Deactivate any existing schedule for this device
    await Schedule.updateMany({ deviceId }, { isActive: false });

    // Create new schedule
    const schedule = new Schedule({
      deviceId,
      userId: 'mvp_user', // In production, get from JWT
      targetChargePercent,
      readyByTime,
      mode,
      daysOfWeek: daysOfWeek || [],
      isActive: true,
      calculatedStartTime: optimal.startTime,
      estimatedCost: optimal.estimatedCost,
      estimatedSavings: optimal.estimatedSavings,
    });

    await schedule.save();

    res.status(201).json({
      schedule,
      optimization: {
        startTime: optimal.startTime,
        estimatedCost: optimal.estimatedCost,
        estimatedSavings: optimal.estimatedSavings,
        breakdown: optimal.breakdown,
      }
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/schedule/:deviceId/preview
// @desc    Preview a schedule without saving (for UI cost preview)
// @access  Public (for MVP)
router.post('/:deviceId/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetChargePercent, readyByTime, mode } = req.body;

    if (!targetChargePercent || !readyByTime || !mode) {
      res.status(400).json({ message: 'targetChargePercent, readyByTime, and mode are required' });
      return;
    }

    const optimal = calculateOptimalSchedule({ targetChargePercent, readyByTime, mode });

    res.status(200).json({
      startTime: optimal.startTime,
      estimatedCost: optimal.estimatedCost,
      estimatedSavings: optimal.estimatedSavings,
      breakdown: optimal.breakdown,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/schedule/:deviceId
// @desc    Cancel/deactivate the active schedule
// @access  Public (for MVP)
router.delete('/:deviceId', async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = req.params.deviceId as string;
    await Schedule.updateMany({ deviceId }, { isActive: false });
    res.status(200).json({ message: 'Schedule cancelled' });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
