import { Schema, model, Document, Types } from 'mongoose';

// ==================== TYPES ====================

export type ReminderType = 'call' | 'email' | 'meeting' | 'task';
export type ReminderPriority = 'high' | 'medium' | 'low';
export type ReminderStatus = 'pending' | 'completed' | 'snoozed';
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

// ==================== INTERFACE ====================

export interface IReminder {
  userId: string;  // Clerk user ID for multi-tenancy
  contactId?: Types.ObjectId;
  title: string;
  type: ReminderType;
  priority: ReminderPriority;
  dueDate: Date;
  dueTime?: string;
  notes?: string;
  status: ReminderStatus;
  repeat: ReminderRepeat;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReminderDocument extends IReminder, Document {}

// ==================== SCHEMA ====================

const reminderSchema = new Schema<IReminderDocument>(
  {
    userId: { type: String, required: true, index: true },  // Clerk user ID
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: false,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'task'],
      default: 'task',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    dueTime: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'snoozed'],
      default: 'pending',
    },
    repeat: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
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

// Index for querying by status and due date (common queries)
reminderSchema.index({ status: 1, dueDate: 1 });

// Index for contact-based queries
reminderSchema.index({ contactId: 1 });

// Index for date range queries
reminderSchema.index({ dueDate: 1 });

// ==================== VIRTUALS ====================

// Check if reminder is overdue
reminderSchema.virtual('isOverdue').get(function (this: IReminderDocument) {
  if (this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// ==================== MODEL ====================

export const Reminder = model<IReminderDocument>('Reminder', reminderSchema);
