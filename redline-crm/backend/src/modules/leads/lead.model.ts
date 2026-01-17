import { Schema, model, Document, Types } from 'mongoose';

export interface ILead {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  source: string;
  apifyActorId?: string;
  apifyRunId?: string;
  folderId?: Types.ObjectId;
  rawData?: Record<string, any>;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadDocument extends ILead, Document {}

const leadSchema = new Schema<ILeadDocument>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    company: { type: String, trim: true },
    website: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    category: { type: String, trim: true },
    source: { type: String, required: true, default: 'google-maps' },
    apifyActorId: { type: String },
    apifyRunId: { type: String },
    folderId: { type: Schema.Types.ObjectId, ref: 'LeadFolder' },
    rawData: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'rejected'],
      default: 'new',
    },
    notes: { type: String },
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

// Indexes for fast queries
leadSchema.index({ name: 'text', company: 'text', address: 'text' });
leadSchema.index({ phone: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ apifyRunId: 1 });
leadSchema.index({ folderId: 1 });
leadSchema.index({ createdAt: -1 });

export const Lead = model<ILeadDocument>('Lead', leadSchema);
