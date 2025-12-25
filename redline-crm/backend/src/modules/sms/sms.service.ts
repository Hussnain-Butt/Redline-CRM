import { SMS, ISMSDocument } from './sms.model.js';
import { Contact } from '../contacts/contact.model.js';

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

  /**
   * Create incoming SMS and auto-link to contact if exists
   */
  async createIncoming(data: {
    twilioSid: string;
    from: string;
    to: string;
    body: string;
    direction: string;
    status: string;
  }): Promise<ISMSDocument> {
    // Try to find existing contact by phone number
    const contact = await Contact.findOne({ phone: data.from });
    
    const smsData: Partial<ISMSDocument> = {
      twilioSid: data.twilioSid,
      fromNumber: data.from,
      toNumber: data.to,
      body: data.body,
      direction: data.direction as 'inbound' | 'outbound',
      status: data.status as 'queued' | 'sent' | 'delivered' | 'failed' | 'received',
      timestamp: new Date(),
      ...(contact && { contactId: contact._id.toString() })
    };

    const sms = new SMS(smsData);
    const savedSMS = await sms.save();
    
    console.log(`✅ Incoming SMS saved${contact ? ` and linked to contact: ${contact.name}` : ''}`);
    
    return savedSMS;
  }

  async updateStatus(twilioSid: string, status: string): Promise<ISMSDocument | null> {
    return await SMS.findOneAndUpdate({ twilioSid }, { status }, { new: true });
  }
}

export const smsService = new SMSService();
