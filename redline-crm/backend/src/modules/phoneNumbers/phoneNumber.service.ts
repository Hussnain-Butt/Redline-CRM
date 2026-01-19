import Twilio from 'twilio';
import { env } from '../../config/env.js';
import { PhoneNumber, IPhoneNumberDocument } from './phoneNumber.model.js';

export class PhoneNumberService {
  async getAll(userId: string): Promise<IPhoneNumberDocument[]> {
    return await PhoneNumber.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
  }

  async create(data: Partial<IPhoneNumberDocument> & { userId: string }): Promise<IPhoneNumberDocument> {
    // If setting as default, unset others first for this user
    if (data.isDefault) {
      await PhoneNumber.updateMany({ userId: data.userId }, { isDefault: false });
    }
    const phoneNumber = new PhoneNumber(data);
    return await phoneNumber.save();
  }

  async update(id: string, userId: string, data: Partial<IPhoneNumberDocument>): Promise<IPhoneNumberDocument | null> {
    // If setting as default, unset others first for this user
    if (data.isDefault) {
      await PhoneNumber.updateMany({ _id: { $ne: id }, userId }, { isDefault: false });
    }
    return await PhoneNumber.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await PhoneNumber.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  async syncWithTwilio(userId: string): Promise<IPhoneNumberDocument[]> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      // Return empty or throw, but better to return empty for now to avoid crashing if keys missing
      console.warn('Cannot sync Twilio numbers: Credentials missing');
      return [];
    }

    try {
      const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const incomingNumbers = await client.incomingPhoneNumbers.list();
      const results: IPhoneNumberDocument[] = [];
      const existingCount = await PhoneNumber.countDocuments({ userId });

      for (const [index, num] of incomingNumbers.entries()) {
        let dbNum = await PhoneNumber.findOne({ twilioSid: num.sid, userId });

        // Update or Create
        if (!dbNum) {
          // Check if number property exists
          dbNum = await PhoneNumber.findOne({ number: num.phoneNumber, userId });
        }

        const data = {
          userId,
          number: num.phoneNumber,
          label: num.friendlyName,
          twilioSid: num.sid,
          canCall: num.capabilities.voice,
          canSMS: num.capabilities.sms,
          country: 'US', // Default to US for now, or use libphonenumber if needed
          countryName: 'United States',
          // Set first one as default if no numbers existed
          isDefault: existingCount === 0 && index === 0, 
        };

        if (dbNum) {
          // Update existing
          // Don't override isDefault unless necessary
          const updated = await PhoneNumber.findOneAndUpdate({ _id: (dbNum as any)._id, userId }, data, { new: true });
          if (updated) results.push(updated);
        } else {
          // Create new
          const created = await this.create(data);
          results.push(created);
        }
      }
      return results;
    } catch (error) {
      console.error('Twilio Sync Error:', error);
      throw new Error('Failed to sync with Twilio');
    }
  }
}

export const phoneNumberService = new PhoneNumberService();
