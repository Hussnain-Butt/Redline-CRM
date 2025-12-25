import { Schema, model, Document, Types } from 'mongoose';

export interface ISMS {
  contactId?: string; // String ID to match frontend
  fromNumber: string;
  toNumber: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  twilioSid?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISMSDocument extends ISMS, Document {}

const smsSchema = new Schema<ISMSDocument>(
  {
    contactId: { type: String, required: false }, // Changed from ObjectId to String
    fromNumber: { type: String, required: true, trim: true },
    toNumber: { type: String, required: true, trim: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'received'],
      default: 'queued',
    },
    twilioSid: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
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

// Indexes
smsSchema.index({ contactId: 1, timestamp: -1 });
smsSchema.index({ twilioSid: 1 });
smsSchema.index({ status: 1 });

export const SMS = model<ISMSDocument>('SMS', smsSchema);
