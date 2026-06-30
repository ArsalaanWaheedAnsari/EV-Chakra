import { Router, Request, Response } from 'express';
import WaitlistUser from '../models/WaitlistUser';

const router = Router();

// @route   POST /api/waitlist
// @desc    Join the waitlist
// @access  Public
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user already exists
    let user = await WaitlistUser.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'Email is already on the waitlist' });
      return;
    }

    user = new WaitlistUser({ email });
    await user.save();

    res.status(201).json({ message: 'Successfully joined the waitlist!' });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/waitlist/count
// @desc    Get total waitlist count
// @access  Public
router.get('/count', async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await WaitlistUser.countDocuments();
      res.status(200).json({ count });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

export default router;
