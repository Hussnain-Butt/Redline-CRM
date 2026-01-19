import { Schema, model, Document } from 'mongoose';

export interface IContact {
  userId: string;  // Clerk user ID for multi-tenancy
  name: string;
  phone: string;
  email: string;
  company: string;
  status: 'Lead' | 'Customer' | 'Churned';
  notes: string;
  lastContacted: Date;
  avatarUrl?: string;
  tags: string[];
  score: number;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactDocument extends IContact, Document {}

const contactSchema = new Schema<IContactDocument>(
  {
    userId: { type: String, required: true, index: true },  // Clerk user ID
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Lead', 'Customer', 'Churned'],
      default: 'Lead',
    },
    notes: { type: String, default: '' },
    lastContacted: { type: Date, default: Date.now },
    avatarUrl: { type: String },
    tags: [{ type: String }],
    score: { type: Number, default: 0 },
    source: { type: String },
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
contactSchema.index({ name: 1 });
contactSchema.index({ phone: 1 });
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });

export const Contact = model<IContactDocument>('Contact', contactSchema);
