import { Request, Response } from 'express';
import { phoneNumberService } from './phoneNumber.service.js';

export const getPhoneNumbers = async (_req: Request, res: Response) => {
  try {
    const numbers = await phoneNumberService.getAll();
    return res.json({ success: true, data: numbers });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch phone numbers' });
  }
};

export const createPhoneNumber = async (req: Request, res: Response) => {
  try {
    const number = await phoneNumberService.create(req.body);
    return res.status(201).json({ success: true, data: number });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create phone number' });
  }
};

export const updatePhoneNumber = async (req: Request, res: Response) => {
  try {
    const number = await phoneNumberService.update(req.params.id, req.body);
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
    const success = await phoneNumberService.delete(req.params.id);
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
    const numbers = await phoneNumberService.syncWithTwilio();
    return res.json({ success: true, data: numbers, message: `Synced ${numbers.length} numbers` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to sync phone numbers' });
  }
};
