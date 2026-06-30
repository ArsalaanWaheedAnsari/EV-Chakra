import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  isCharging: boolean;
  chargePower: number; // in kW
  homeLoad: number; // in kW
  maxCapacity: number; // in kW
  todayCost: number; // in INR
  carbonOffset: number; // in kg
  lastUpdated: Date;
}

const deviceSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  isCharging: {
    type: Boolean,
    default: true,
  },
  chargePower: {
    type: Number,
    default: 4.2,
  },
  homeLoad: {
    type: Number,
    default: 3.8,
  },
  maxCapacity: {
    type: Number,
    default: 9.0,
  },
  todayCost: {
    type: Number,
    default: 47.20,
  },
  carbonOffset: {
    type: Number,
    default: 2.1,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const Device = mongoose.model<IDevice>('Device', deviceSchema);
export default Device;
