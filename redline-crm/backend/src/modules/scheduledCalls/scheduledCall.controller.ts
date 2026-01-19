import { Request, Response } from 'express';
import { scheduledCallService } from './scheduledCall.service.js';

export const getScheduledCallsByContact = async (req: Request, res: Response) => {
  try {
    const calls = await scheduledCallService.getByContactId(req.params.contactId, req.userId!);
    return res.json({ success: true, data: calls });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch scheduled calls' });
  }
};

export const createScheduledCall = async (req: Request, res: Response) => {
  try {
    const call = await scheduledCallService.create({ ...req.body, userId: req.userId! });
    return res.status(201).json({ success: true, data: call });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create scheduled call' });
  }
};

export const updateScheduledCall = async (req: Request, res: Response) => {
  try {
      const call = await scheduledCallService.update(req.params.id, req.userId!, req.body);
      if(!call) return res.status(404).json({ success: false, error: 'Scheduled call not found' });
      return res.json({ success: true, data: call });
  } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to update scheduled call' });
  }
};

export const deleteScheduledCall = async (req: Request, res: Response) => {
    try {
        const success = await scheduledCallService.delete(req.params.id, req.userId!);
        if(!success) return res.status(404).json({ success: false, error: 'Scheduled call not found' });
        return res.json({ success: true, message: 'Scheduled call deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to delete scheduled call' });
    }
}
