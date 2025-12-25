import { Schema, model, Document } from 'mongoose';

export interface IContactNote {
  contactId: string;
  content: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactNoteDocument extends IContactNote, Document {}

const contactNoteSchema = new Schema<IContactNoteDocument>(
  {
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
