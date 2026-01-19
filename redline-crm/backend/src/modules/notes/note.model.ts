import { Schema, model, Document } from 'mongoose';

export interface IContactNote {
  userId: string;  // Clerk user ID for multi-tenancy
  contactId: string;
  content: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactNoteDocument extends IContactNote, Document {}

const contactNoteSchema = new Schema<IContactNoteDocument>(
  {
    userId: { type: String, required: true, index: true },  // Clerk user ID
    contactId: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: String },
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

contactNoteSchema.index({ contactId: 1, createdAt: -1 });

export const ContactNote = model<IContactNoteDocument>('ContactNote', contactNoteSchema);
