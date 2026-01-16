import { SMSMessage } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export const smsApi = {
  getAll: async (): Promise<SMSMessage[]> => {
    const response = await fetch(`${API_URL}/sms`);
    if (!response.ok) throw new Error('Failed to fetch SMS messages');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, 
      timestamp: new Date(item.timestamp),
    }));
  },

  getByContactId: async (contactId: string): Promise<SMSMessage[]> => {
    const response = await fetch(`${API_URL}/sms/contact/${contactId}`);
    if (!response.ok) throw new Error('Failed to fetch contact SMS');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      timestamp: new Date(item.timestamp),
    }));
  },

  create: async (sms: Omit<SMSMessage, 'id' | 'timestamp'>): Promise<SMSMessage> => {
    // Note: In a real app, you'd trigger the send via backend and let backend create the log.
    // Here we are just saving the log as per current architecture, or triggering a send endpoint.
    // For now we assume this creates the log.
    const response = await fetch(`${API_URL}/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sms),
    });
    if (!response.ok) throw new Error('Failed to send/save SMS');
    const data = await response.json();
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      timestamp: new Date(item.timestamp),
    } as SMSMessage;
  },

  /**
   * Send SMS via backend (secure - no credentials exposed)
   */
  send: async (data: {
    to: string;
    from: string;
    body: string;
    contactId?: string;
  }): Promise<{ success: boolean; data?: SMSMessage; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Failed to send SMS' };
      }

      const item = result.data;
      return {
        success: true,
        data: {
          ...item,
          id: item.id || item._id,
          timestamp: new Date(item.timestamp),
        } as SMSMessage,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }
};
