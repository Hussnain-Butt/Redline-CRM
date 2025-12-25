import { ScheduledCall, IScheduledCallDocument } from './scheduledCall.model.js';

export class ScheduledCallService {
  async getByContactId(contactId: string): Promise<IScheduledCallDocument[]> {
    return await ScheduledCall.find({ contactId }).sort({ scheduledAt: 1 });
  }

  async getAllPending(): Promise<IScheduledCallDocument[]> {
     return await ScheduledCall.find({ status: 'pending' }).sort({ scheduledAt: 1 });
  }

  async create(data: Partial<IScheduledCallDocument>): Promise<IScheduledCallDocument> {
    const call = new ScheduledCall(data);
    return await call.save();
  }

  async update(id: string, data: Partial<IScheduledCallDocument>): Promise<IScheduledCallDocument | null> {
    return await ScheduledCall.findByIdAndUpdate(id, data, { new: true });
  }
  
  async delete(id: string): Promise<boolean> {
      const result = await ScheduledCall.findByIdAndDelete(id);
      return !!result;
  }
}

export const scheduledCallService = new ScheduledCallService();
