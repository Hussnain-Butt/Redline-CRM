import mongoose, { Schema, Document } from 'mongoose';

/**
 * DNC List Entry - Stores phone numbers from DNC registry
 * Source can be: NATIONAL, STATE, INTERNAL, MANUAL_UPLOAD
 */
export interface IDNCList extends Document {
  userId?: string; // Optional: null for National/State, set for Tenant-specific
  phoneNumber: string; // E.164 format: +1XXXXXXXXXX
  source: 'NATIONAL' | 'STATE' | 'INTERNAL' | 'MANUAL_UPLOAD';
  state?: string; // For state-specific DNC lists
  addedDate: Date;
  expiryDate: Date; // DNC records expire after 31 days (federal requirement)
  uploadId?: mongoose.Types.ObjectId; // Reference to upload batch
  metadata?: {
    originalFormat?: string;
    uploadedBy?: string;
    notes?: string;
  };
}

const DNCListSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: function (v: string) {
          // E.164 format validation: +1XXXXXXXXXX (US numbers)
          return /^\+1\d{10}$/.test(v);
        },
        message: 'Phone number must be in E.164 format (+1XXXXXXXXXX)',
      },
    },
    source: {
      type: String,
      enum: ['NATIONAL', 'STATE', 'INTERNAL', 'MANUAL_UPLOAD'],
      required: true,
      index: true,
    },
    state: {
      type: String,
      maxlength: 2,
    },
    addedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    uploadId: {
      type: Schema.Types.ObjectId,
      ref: 'DNCUpload',
    },
    metadata: {
      originalFormat: String,
      uploadedBy: String,
      notes: String,
    },
  },
  {
    timestamps: true,
    collection: 'dnc_lists',
  }
);

// Compound index for efficient querying
// Note: userId can be null for global lists
DNCListSchema.index({ phoneNumber: 1, userId: 1, source: 1 }, { unique: true });
DNCListSchema.index({ expiryDate: 1 }); // For finding expired records

export const DNCList = mongoose.model<IDNCList>('DNCList', DNCListSchema);

/**
 * Internal DNC List - Company-specific opt-out requests
 * These are PERMANENT unless manually removed
 */
export interface IInternalDNC extends Document {
  userId: string;
  phoneNumber: string;
  reason: string; // Why they opted out
  requestDate: Date;
  requestMethod: 'PHONE_CALL' | 'TEXT_MESSAGE' | 'EMAIL' | 'WEB_FORM' | 'MANUAL';
  contactId?: mongoose.Types.ObjectId;
  processedBy?: string; // CSR who processed the request
  notes?: string;
  removedDate?: Date; // If ever removed from DNC
  removedBy?: string;
  removedReason?: string;
}

const InternalDNCSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      validate: {
        validator: function (v: string) {
          return /^\+1\d{10}$/.test(v);
        },
        message: 'Phone number must be in E.164 format (+1XXXXXXXXXX)',
      },
    },
    reason: {
      type: String,
      required: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    requestMethod: {
      type: String,
      enum: ['PHONE_CALL', 'TEXT_MESSAGE', 'EMAIL', 'WEB_FORM', 'MANUAL'],
      required: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
    },
    processedBy: String,
    notes: String,
    removedDate: Date,
    removedBy: String,
    removedReason: String,
  },
  {
    timestamps: true,
    collection: 'internal_dnc',
  }
);

// Compound unique index: Per user, phone numbers must be unique
InternalDNCSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

export const InternalDNC = mongoose.model<IInternalDNC>('InternalDNC', InternalDNCSchema);

/**
 * DNC Upload History - Track CSV file uploads
 */
export interface IDNCUpload extends Document {
  userId: string;
  filename: string;
  uploadDate: Date;
  uploadedBy?: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  source: 'NATIONAL' | 'STATE' | 'MANUAL';
  state?: string;
  uploadErrors?: Array<{
    row: number;
    phoneNumber: string;
    error: string;
  }>;
  fileSize: number; // in bytes
  processingTime?: number; // in milliseconds
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

const DNCUploadSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: String,
    totalRecords: {
      type: Number,
      required: true,
      default: 0,
    },
    successfulImports: {
      type: Number,
      default: 0,
    },
    failedImports: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['NATIONAL', 'STATE', 'MANUAL'],
      required: true,
    },
    state: String,
    uploadErrors: [
      {
        row: Number,
        phoneNumber: String,
        error: String,
      },
    ],
    fileSize: Number,
    processingTime: Number,
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PROCESSING',
    },
  },
  {
    timestamps: true,
    collection: 'dnc_uploads',
  }
);

export const DNCUpload = mongoose.model<IDNCUpload>('DNCUpload', DNCUploadSchema);
