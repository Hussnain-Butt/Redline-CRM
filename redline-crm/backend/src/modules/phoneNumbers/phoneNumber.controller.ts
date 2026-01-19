import { Request, Response } from 'express';
import { phoneNumberService } from './phoneNumber.service.js';
import { env } from '../../config/env.js';

export const getPhoneNumbers = async (_req: Request, res: Response) => {
  try {
    // Return the shared TWILIO_PHONE_NUMBER from environment
    // All users use the same centralized number
    if (env.TWILIO_PHONE_NUMBER) {
      // Detect country from phone number
      const phoneNum = env.TWILIO_PHONE_NUMBER;
      let country = 'US';
      let countryName = 'United States';
      
      if (phoneNum.startsWith('+1')) {
        country = 'US';
        countryName = 'United States';
      } else if (phoneNum.startsWith('+44')) {
        country = 'GB';
        countryName = 'United Kingdom';
      } else if (phoneNum.startsWith('+92')) {
        country = 'PK';
        countryName = 'Pakistan';
      }
      
      const sharedNumber = {
        id: 'shared-number',           // Frontend expects 'id'
        sid: 'shared-number',
        number: phoneNum,              // Frontend expects 'number', not 'phoneNumber'
        phoneNumber: phoneNum,         // Keep for backwards compatibility
        country: country,              // Frontend expects 'country', not 'countryCode'
        countryCode: country,          // Keep for backwards compatibility
        countryName: countryName,      // Frontend expects 'countryName'
        label: 'Main Phone Number',    // Frontend expects 'label'
        friendlyName: 'Main Phone Number',
        isDefault: true,
        canCall: true,
        canSMS: true,
        capabilities: {
          voice: true,
          sms: true,
          mms: false
        },
        createdAt: new Date()
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

export const syncPhoneNumbers = async (_req: Request, res: Response) => {
  try {
    // Sync disabled: We now use centralized TWILIO_PHONE_NUMBER from environment
    // No need to sync to database since all users share the same number
    return res.json({ 
      success: true, 
      data: [], 
      message: 'Sync disabled - using centralized phone number from environment' 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to sync phone numbers' });
  }
};
