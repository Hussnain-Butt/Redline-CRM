import { Schema, model, Document, Types } from 'mongoose';

// ==================== TYPES ====================

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled';

// ==================== INTERFACES ====================

export interface ICall {
  contactId?: Types.ObjectId;
  direction: CallDirection;
  status: CallStatus;
  from: string;
  to: string;
  duration: number; // in seconds
  recordingUrl?: string;
  recordingSid?: string; // Twilio Recording SID
  recordingDuration?: number; // Recording duration in seconds
  recordingStatus?: 'processing' | 'completed' | 'failed';
  transcription?: string;
  notes?: string;
  sid?: string; // Twilio Call SID
  tags: string[];
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>; // Twilio metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ICallDocument extends ICall, Document {}

// ==================== SCHEMA ====================

const callSchema = new Schema<ICallDocument>(
  {
    contactId: {
      type: String, // Changed from ObjectId to support frontend-generated String IDs
      required: false,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled'],
      default: 'queued',
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    recordingSid: {
      type: String,
      trim: true,
    },
    recordingDuration: {
      type: Number,
    },
    recordingStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
    },
    transcription: {
      type: String,
    },
    notes: {
      type: String,
    },
    sid: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null/undefined but unique if present
    },
    tags: [{ type: String, trim: true }],
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
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

// ==================== INDEXES ====================

callSchema.index({ contactId: 1, startTime: -1 });

callSchema.index({ direction: 1 });

// ==================== MODEL ====================

export const Call = model<ICallDocument>('Call', callSchema);
