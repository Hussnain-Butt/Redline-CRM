import { Schema, model, Document } from 'mongoose';

export interface IPhoneNumber {
  number: string;
  country: string;
  countryName: string;
  label: string;
  twilioSid?: string;
  isDefault: boolean;
  canCall: boolean;
  canSMS: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPhoneNumberDocument extends IPhoneNumber, Document {}

const phoneNumberSchema = new Schema<IPhoneNumberDocument>(
  {
    number: { type: String, required: true, unique: true, trim: true },
    country: { type: String, required: true, trim: true }, // Country code, e.g., 'US'
    countryName: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: '' },
    twilioSid: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    canCall: { type: Boolean, default: true },
    canSMS: { type: Boolean, default: true },
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
phoneNumberSchema.index({ number: 1 });
phoneNumberSchema.index({ twilioSid: 1 });

export const PhoneNumber = model<IPhoneNumberDocument>('PhoneNumber', phoneNumberSchema);
