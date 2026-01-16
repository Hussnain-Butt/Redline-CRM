import { Request, Response } from 'express';
import { smsService } from './sms.service.js';

export const getAllSMS = async (_req: Request, res: Response) => {
  try {
    const messages = await smsService.getAll();
    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch SMS messages' });
  }
};

export const getSMSByContact = async (req: Request, res: Response) => {
  try {
    const messages = await smsService.getByContactId(req.params.contactId);
    return res.json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch contact SMS' });
  }
};

export const createSMS = async (req: Request, res: Response) => {
  try {
    const sms = await smsService.create(req.body);
    return res.status(201).json({ success: true, data: sms });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create SMS' });
  }
};

// Send SMS via Twilio (secure backend endpoint)
export const sendSMS = async (req: Request, res: Response) => {
  try {
    const { to, from, body, contactId } = req.body;

    // Validation
    if (!to || !from || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, from, body' 
      });
    }

    // Send via service
    const result = await smsService.sendSMS({ to, from, body, contactId });

    if (result.success) {
      return res.status(201).json({ success: true, data: result.data });
    } else {
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('❌ SMS send endpoint error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    });
  }
};

// Webhook for incoming SMS from Twilio
export const handleIncomingSMS = async (req: Request, res: Response) => {
  try {
    const { MessageSid, From, To, Body, NumMedia } = req.body;
    
    console.log('📨 Incoming SMS webhook:', {
      messageSid: MessageSid,
      from: From,
      to: To,
      body: Body,
      numMedia: NumMedia
    });

    // Create incoming SMS record
    await smsService.createIncoming({
      twilioSid: MessageSid,
      from: From,
      to: To,
      body: Body,
      direction: 'inbound',
      status: 'received'
    });

    // Respond with empty TwiML to acknowledge receipt
    return res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('❌ Error processing incoming SMS:', error);
    return res.status(500).send('<Response></Response>');
  }
};

// Webhook for Twilio status callbacks
export const updateSMSStatus = async (req: Request, res: Response) => {
  try {
    const { MessageSid, MessageStatus } = req.body;
    if (MessageSid && MessageStatus) {
      await smsService.updateStatus(MessageSid, MessageStatus);
    }
    return res.status(200).send('<Response></Response>');
  } catch (error) {
    return res.status(500).send('Error processing webhook');
  }
};

// Mark messages as read for a conversation
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { contactId, phoneNumber } = req.body;
    
    if (!contactId && !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either contactId or phoneNumber is required' 
      });
    }

    const count = await smsService.markAsRead({ contactId, phoneNumber });
    return res.json({ success: true, data: { markedCount: count } });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
  }
};

// Get unread message count
export const getUnreadCount = async (_req: Request, res: Response) => {
  try {
    const count = await smsService.getUnreadCount();
    return res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
};
