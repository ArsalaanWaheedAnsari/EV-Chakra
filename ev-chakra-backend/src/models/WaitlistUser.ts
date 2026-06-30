import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlistUser extends Document {
  email: string;
  status: 'pending' | 'invited' | 'registered';
  createdAt: Date;
}

const waitlistUserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'invited', 'registered'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const WaitlistUser = mongoose.model<IWaitlistUser>('WaitlistUser', waitlistUserSchema);
export default WaitlistUser;
