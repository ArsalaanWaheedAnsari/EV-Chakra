import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  deviceId: string;
  userId: string;
  targetChargePercent: number;  // e.g. 80%
  readyByTime: string;          // e.g. "07:00" (24h format)
  mode: 'off_peak' | 'solar_priority' | 'cheapest' | 'immediate';
  isActive: boolean;
  daysOfWeek: number[];         // 0=Sun, 1=Mon, ... 6=Sat. Empty = every day
  calculatedStartTime: string | null;  // Backend-computed optimal start time
  estimatedCost: number;        // Estimated cost in INR
  estimatedSavings: number;     // Savings vs immediate charging
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  targetChargePercent: {
    type: Number,
    required: true,
    default: 80,
    min: 20,
    max: 100,
  },
  readyByTime: {
    type: String,
    required: true,
    default: '07:00',
  },
  mode: {
    type: String,
    enum: ['off_peak', 'solar_priority', 'cheapest', 'immediate'],
    default: 'off_peak',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  daysOfWeek: {
    type: [Number],
    default: [], // Empty = every day
  },
  calculatedStartTime: {
    type: String,
    default: null,
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  estimatedSavings: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// One active schedule per device
scheduleSchema.index({ deviceId: 1, isActive: 1 });

const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);
export default Schedule;
