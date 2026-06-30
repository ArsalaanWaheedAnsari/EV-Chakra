import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import waitlistRoutes from './routes/waitlist';
import dashboardRoutes from './routes/dashboard';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'EV Chakra API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
