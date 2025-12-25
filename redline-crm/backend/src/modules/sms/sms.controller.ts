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
