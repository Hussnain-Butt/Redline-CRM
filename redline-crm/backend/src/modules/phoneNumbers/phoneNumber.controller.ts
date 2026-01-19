import { Request, Response } from 'express';
import { phoneNumberService } from './phoneNumber.service.js';
import { env } from '../../config/env.js';

export const getPhoneNumbers = async (_req: Request, res: Response) => {
  try {
    // Return the shared TWILIO_PHONE_NUMBER from environment
    // All users use the same centralized number
    if (env.TWILIO_PHONE_NUMBER) {
      const sharedNumber = {
        sid: 'shared-number',
        phoneNumber: env.TWILIO_PHONE_NUMBER,
        friendlyName: 'Main Phone Number',
        capabilities: {
          voice: true,
          sms: true,
          mms: false
        },
        countryCode: env.TWILIO_PHONE_NUMBER.startsWith('+1') ? 'US' :
          env.TWILIO_PHONE_NUMBER.startsWith('+44') ? 'GB' :
          env.TWILIO_PHONE_NUMBER.startsWith('+92') ? 'PK' : 'XX'
      };
      return res.json({ success: true, data: [sharedNumber] });
    }
    
    // Fallback: if no env number, return empty array
    return res.json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch phone numbers' });
  }
};

export const createPhoneNumber = async (req: Request, res: Response) => {
  try {
    const number = await phoneNumberService.create({
      ...req.body,
      userId: req.userId!
    });
    return res.status(201).json({ success: true, data: number });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create phone number' });
  }
};

export const updatePhoneNumber = async (req: Request, res: Response) => {
  try {
    const number = await phoneNumberService.update(req.params.id, req.userId!, req.body);
    if (!number) {
      return res.status(404).json({ success: false, error: 'Phone number not found' });
    }
    return res.json({ success: true, data: number });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update phone number' });
  }
};

export const deletePhoneNumber = async (req: Request, res: Response) => {
  try {
    const success = await phoneNumberService.delete(req.params.id, req.userId!);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Phone number not found' });
    }
    return res.json({ success: true, message: 'Phone number deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete phone number' });
  }
};

export const syncPhoneNumbers = async (req: Request, res: Response) => {
  try {
    const numbers = await phoneNumberService.syncWithTwilio(req.userId!);
    return res.json({ success: true, data: numbers, message: `Synced ${numbers.length} numbers` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to sync phone numbers' });
  }
};
