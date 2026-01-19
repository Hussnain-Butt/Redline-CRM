import mongoose, { Document, Schema } from 'mongoose';

// ==================== SETTINGS INTERFACE ====================

export interface ISettings {
  userId: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface ISettingsDocument extends ISettings, Document {
  _id: mongoose.Types.ObjectId;
}

// ==================== SETTINGS SCHEMA ====================

const settingsSchema = new Schema<ISettingsDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    SMTP_HOST: {
      type: String,
      default: '',
    },
    SMTP_PORT: {
      type: String,
      default: '587',
    },
    SMTP_USER: {
      type: String,
      default: '',
    },
    SMTP_PASS: {
      type: String,
      default: '',
    },
    EMAIL_FROM: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'settings',
  }
);

// ==================== SETTINGS MODEL ====================

export const Settings = mongoose.model<ISettingsDocument>('Settings', settingsSchema);
