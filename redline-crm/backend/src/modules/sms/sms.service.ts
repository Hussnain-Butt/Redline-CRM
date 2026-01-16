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

      // Save to database - outbound messages are always marked as read
      const smsRecord = new SMS({
        contactId,
        fromNumber: data.from,
        toNumber: data.to,
        body: data.body,
        direction: 'outbound',
        status: message.status || 'sent',
        twilioSid: message.sid,
        read: true, // Outbound messages are always read
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

  /**
   * Mark all messages from a phone number or contact as read
   */
  async markAsRead(params: { contactId?: string; phoneNumber?: string }): Promise<number> {
    const query: any = { direction: 'inbound', read: false };
    
    if (params.contactId && !params.contactId.startsWith('unknown-')) {
      query.contactId = params.contactId;
    } else if (params.phoneNumber) {
      query.fromNumber = params.phoneNumber;
    } else {
      return 0;
    }

    const result = await SMS.updateMany(query, { read: true });
    console.log(`✅ Marked ${result.modifiedCount} messages as read`);
    return result.modifiedCount;
  }

  /**
   * Get count of unread messages (inbound only)
   */
  async getUnreadCount(): Promise<number> {
    return await SMS.countDocuments({ direction: 'inbound', read: false });
  }

  /**
   * Migration: Add read field to all existing SMS documents
   * Sets read=true for all existing messages (marking them as read since they're old)
   */
  async migrateAddReadField(): Promise<number> {
    // Update all documents that don't have the read field
    const result = await SMS.updateMany(
      { read: { $exists: false } },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }
}

export const smsService = new SMSService();
