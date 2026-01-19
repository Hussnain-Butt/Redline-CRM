import { ScheduledCall } from '../types';
import apiClient from './apiClient';

export const scheduledCallApi = {
  getByContactId: async (contactId: string): Promise<ScheduledCall[]> => {
    const { data } = await apiClient.get(`/scheduled-calls/contact/${contactId}`);
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      scheduledAt: new Date(item.scheduledAt),
      createdAt: new Date(item.createdAt)
    }));
  },

  create: async (call: Omit<ScheduledCall, 'id' | 'createdAt'>): Promise<ScheduledCall> => {
    const { data } = await apiClient.post('/scheduled-calls', call);
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        scheduledAt: new Date(item.scheduledAt),
        createdAt: new Date(item.createdAt)
    };
  },
  
  delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/scheduled-calls/${id}`);
  }
};
