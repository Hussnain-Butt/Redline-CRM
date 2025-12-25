import { SMS, ISMSDocument } from './sms.model.js';

export class SMSService {
  async getAll(): Promise<ISMSDocument[]> {
    return await SMS.find().sort({ timestamp: -1 });
  }

  async getByContactId(contactId: string): Promise<ISMSDocument[]> {
    return await SMS.find({ contactId }).sort({ timestamp: 1 });
  }

  async create(data: Partial<ISMSDocument>): Promise<ISMSDocument> {
    const sms = new SMS(data);
    return await sms.save();
  }

  async updateStatus(twilioSid: string, status: string): Promise<ISMSDocument | null> {
    return await SMS.findOneAndUpdate({ twilioSid }, { status }, { new: true });
  }
}

export const smsService = new SMSService();
