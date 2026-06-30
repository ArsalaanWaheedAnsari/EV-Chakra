import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  isCharging: boolean;
  chargePower: number;   // in kW
  homeLoad: number;      // in kW
  maxCapacity: number;   // in kW
  todayCost: number;     // in INR
  carbonOffset: number;  // in kg
  voltage: number;       // in Volts (from MQTT telemetry)
  current: number;       // in Amps (from MQTT telemetry)
  temperature: number;   // in °C (from MQTT telemetry)
  isOnline: boolean;     // true if heartbeat received within last 30s
  lastHeartbeat: Date;   // last time telemetry was received
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
    default: 0,
  },
  homeLoad: {
    type: Number,
    default: 0,
  },
  maxCapacity: {
    type: Number,
    default: 9.0,
  },
  todayCost: {
    type: Number,
    default: 0,
  },
  carbonOffset: {
    type: Number,
    default: 0,
  },
  voltage: {
    type: Number,
    default: 0,
  },
  current: {
    type: Number,
    default: 0,
  },
  temperature: {
    type: Number,
    default: 0,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastHeartbeat: {
    type: Date,
    default: null,
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
