import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      passwordHash,
      // By default new users get 'user' role. Super admins can upgrade them later.
      role: 'user', 
    });

    await user.save();

    const payload = { id: user.id, role: user.role };
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid Credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid Credentials' });
      return;
    }

    const payload = { id: user.id, role: user.role };
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
