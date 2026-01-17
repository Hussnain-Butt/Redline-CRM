import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadFolder {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadFolderDocument extends ILeadFolder, Document {
  id: string;
}

const leadFolderSchema = new Schema<ILeadFolderDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#dc2626', // Default red color matching theme
    },
    icon: {
      type: String,
      default: 'folder',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
leadFolderSchema.index({ name: 1 });
leadFolderSchema.index({ createdAt: -1 });

export const LeadFolder = mongoose.model<ILeadFolderDocument>('LeadFolder', leadFolderSchema);
