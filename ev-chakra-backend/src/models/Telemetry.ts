import mongoose, { Document, Schema } from 'mongoose';

export interface ITelemetry extends Document {
  deviceId: string;
  voltage: number;    // in Volts
  current: number;    // in Amps
  power: number;      // in kW
  temperature: number; // in °C
  timestamp: Date;
}

const telemetrySchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  voltage: {
    type: Number,
    required: true,
  },
  current: {
    type: Number,
    required: true,
  },
  power: {
    type: Number,
    required: true,
  },
  temperature: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  }
});

// Compound index for efficient time-range queries per device
telemetrySchema.index({ deviceId: 1, timestamp: -1 });

const Telemetry = mongoose.model<ITelemetry>('Telemetry', telemetrySchema);
export default Telemetry;
