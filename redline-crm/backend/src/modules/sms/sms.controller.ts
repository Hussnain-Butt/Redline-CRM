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
