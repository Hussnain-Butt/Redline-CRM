import { ScheduledCall } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export const scheduledCallApi = {
  getByContactId: async (contactId: string): Promise<ScheduledCall[]> => {
    const response = await fetch(`${API_URL}/scheduled-calls/contact/${contactId}`);
    if (!response.ok) throw new Error('Failed to fetch scheduled calls');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      scheduledAt: new Date(item.scheduledAt),
      createdAt: new Date(item.createdAt)
    }));
  },

  create: async (call: Omit<ScheduledCall, 'id' | 'createdAt'>): Promise<ScheduledCall> => {
    const response = await fetch(`${API_URL}/scheduled-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(call)
    });
    if (!response.ok) throw new Error('Failed to create scheduled call');
    const data = await response.json();
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        scheduledAt: new Date(item.scheduledAt),
        createdAt: new Date(item.createdAt)
    };
  },
  
  delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/scheduled-calls/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete scheduled call');
  }
};
