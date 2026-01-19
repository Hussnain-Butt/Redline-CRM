import { SMSMessage } from '../types';
import apiClient from './apiClient';

export const smsApi = {
  getAll: async (): Promise<SMSMessage[]> => {
    const { data } = await apiClient.get('/sms');
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, 
      timestamp: new Date(item.timestamp),
    }));
  },

  getByContactId: async (contactId: string): Promise<SMSMessage[]> => {
    const { data } = await apiClient.get(`/sms/contact/${contactId}`);
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      timestamp: new Date(item.timestamp),
    }));
  },

  create: async (sms: Omit<SMSMessage, 'id' | 'timestamp'>): Promise<SMSMessage> => {
    const { data } = await apiClient.post('/sms', sms);
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
  send: async (payload: {
    to: string;
    from: string;
    body: string;
    contactId?: string;
  }): Promise<{ success: boolean; data?: SMSMessage; error?: string }> => {
    try {
      const { data } = await apiClient.post('/sms/send', payload);
      
      if (!data.success) {
        return { success: false, error: data.error || 'Failed to send SMS' };
      }

      const item = data.data;
      return {
        success: true,
        data: {
          ...item,
          id: item.id || item._id,
          timestamp: new Date(item.timestamp),
        } as SMSMessage,
      };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message || 'Network error' };
    }
  },

  /**
   * Mark messages as read for a conversation
   */
  markAsRead: async (params: { contactId?: string; phoneNumber?: string }): Promise<boolean> => {
    try {
      const { data } = await apiClient.post('/sms/mark-read', params);
      return data.success;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      return false;
    }
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get('/sms/unread-count');
      return data.success ? data.data.unreadCount : 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
};
