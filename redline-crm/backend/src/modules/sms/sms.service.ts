import { SMS, ISMSDocument } from './sms.model.js';
import { Contact } from '../contacts/contact.model.js';
import Twilio from 'twilio';
import { env } from '../../config/env.js';

// Initialize Twilio client lazily
let twilioClient: Twilio.Twilio | null = null;

function getTwilioClient(): Twilio.Twilio {
  if (!twilioClient) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

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

  /**
   * Send SMS via Twilio and save to database
   */
  async sendSMS(data: {
    to: string;
    from: string;
    body: string;
    contactId?: string;
  }): Promise<{ success: boolean; data?: ISMSDocument; error?: string }> {
    try {
      const client = getTwilioClient();
      
      // Send via Twilio
      const message = await client.messages.create({
        to: data.to,
        from: data.from,
        body: data.body,
      });

      console.log('✅ SMS sent via Twilio:', message.sid);

      // Auto-link to contact if contactId not provided
      let contactId = data.contactId;
      if (!contactId) {
        const contact = await Contact.findOne({ phone: data.to });
        if (contact) {
          contactId = contact._id.toString();
        }
      }

      // Save to database
      const smsRecord = new SMS({
        contactId,
        fromNumber: data.from,
        toNumber: data.to,
        body: data.body,
        direction: 'outbound',
        status: message.status || 'sent',
        twilioSid: message.sid,
        timestamp: new Date(),
      });
      
      const saved = await smsRecord.save();
      console.log('✅ SMS saved to database:', saved.id);

      return { success: true, data: saved };
    } catch (error: any) {
      console.error('❌ Failed to send SMS:', error.message);
      return { 
        success: false, 
        error: error.message || 'Failed to send SMS' 
      };
    }
  }
}

export const smsService = new SMSService();
