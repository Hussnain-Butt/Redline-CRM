import { Schema, model, Document, Types } from 'mongoose';

// ==================== TYPES ====================

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type EmailDirection = 'inbound' | 'outbound';

// ==================== INTERFACE ====================

export interface IEmail {
  userId: string;
  contactId?: Types.ObjectId;
  to: string[];
  cc: string[];
  bcc: string[];
  from: string;
  subject: string;
  body: string;   // HTML content
  text: string;   // Plain text content
  status: EmailStatus;
  direction: EmailDirection;
  messageId?: string; // Provider ID (SendGrid/Gmail)
  scheduledAt?: Date;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, any>; // Provider specific metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailDocument extends IEmail, Document {}

// ==================== SCHEMA ====================

const emailSchema = new Schema<IEmailDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: false,
    },
    to: [{ type: String, trim: true }],
    cc: [{ type: String, trim: true }],
    bcc: [{ type: String, trim: true }],
    from: {
      type: String,
      required: [true, 'From address is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      maxlength: [500, 'Subject cannot exceed 500 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
    },
    text: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'failed'],
      default: 'draft',
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'outbound',
    },
    messageId: {
      type: String,
      trim: true,
    },
    scheduledAt: Date,
    sentAt: Date,
    error: String,
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

// Index for getting emails by contact
emailSchema.index({ userId: 1, contactId: 1, createdAt: -1 });

// Index for finding scheduled emails
emailSchema.index({ userId: 1, status: 1, scheduledAt: 1 });

// Index for finding by messageId (webhooks)
emailSchema.index({ userId: 1, messageId: 1 });

// ==================== MODEL ====================

export const Email = model<IEmailDocument>('Email', emailSchema);
