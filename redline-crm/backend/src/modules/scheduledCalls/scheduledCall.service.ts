import { ScheduledCall, IScheduledCallDocument } from './scheduledCall.model.js';

export class ScheduledCallService {
  async getByContactId(contactId: string, userId: string): Promise<IScheduledCallDocument[]> {
    return await ScheduledCall.find({ contactId, userId }).sort({ scheduledAt: 1 });
  }

  async getAllPending(userId: string): Promise<IScheduledCallDocument[]> {
     return await ScheduledCall.find({ status: 'pending', userId }).sort({ scheduledAt: 1 });
  }

  async create(data: Partial<IScheduledCallDocument> & { userId: string }): Promise<IScheduledCallDocument> {
    const call = new ScheduledCall(data);
    return await call.save();
  }

  async update(id: string, userId: string, data: Partial<IScheduledCallDocument>): Promise<IScheduledCallDocument | null> {
    return await ScheduledCall.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  }
  
  async delete(id: string, userId: string): Promise<boolean> {
      const result = await ScheduledCall.findOneAndDelete({ _id: id, userId });
      return !!result;
  }
}

export const scheduledCallService = new ScheduledCallService();
