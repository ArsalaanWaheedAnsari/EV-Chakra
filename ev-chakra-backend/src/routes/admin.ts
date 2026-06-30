import { Router, Request, Response } from 'express';
import User from '../models/User';
import WaitlistUser from '../models/WaitlistUser';
import Device from '../models/Device';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all admin routes
router.use(requireAuth);
// Restrict to admin or super_admin
router.use(requireRole(['admin', 'super_admin']));

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Private (Admin/Super Admin)
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    const waitlistCount = await WaitlistUser.countDocuments();
    const deviceCount = await Device.countDocuments();

    res.json({ userCount, waitlistCount, deviceCount });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin/Super Admin)
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private (Super Admin ONLY)
router.put('/users/:id/role', requireRole(['super_admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'super_admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
