import { Schema, model, Document } from 'mongoose';

export interface IScheduledCall {
  contactId: string;
  scheduledAt: Date;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'missed';
  reminderMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledCallDocument extends IScheduledCall, Document {}

const scheduledCallSchema = new Schema<IScheduledCallDocument>(
  {
    contactId: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'missed'],
      default: 'pending',
    },
    reminderMinutes: { type: Number, default: 15 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  }
);

scheduledCallSchema.index({ contactId: 1, scheduledAt: 1 });
scheduledCallSchema.index({ scheduledAt: 1 });

export const ScheduledCall = model<IScheduledCallDocument>('ScheduledCall', scheduledCallSchema);
