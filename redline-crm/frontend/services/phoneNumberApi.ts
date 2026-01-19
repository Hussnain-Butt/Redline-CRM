import { PhoneNumber } from '../types';
import apiClient from './apiClient';

export const phoneNumberApi = {
  getAll: async (): Promise<PhoneNumber[]> => {
    const { data } = await apiClient.get('/phone-numbers');
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, // Ensure id is mapped
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  create: async (phoneNumber: Omit<PhoneNumber, 'id' | 'createdAt'>): Promise<PhoneNumber> => {
    const { data } = await apiClient.post('/phone-numbers', phoneNumber);
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as PhoneNumber;
  },

  update: async (id: string, updates: Partial<PhoneNumber>): Promise<PhoneNumber> => {
    const { data } = await apiClient.put(`/phone-numbers/${id}`, updates);
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as PhoneNumber;
  },

  sync: async (): Promise<PhoneNumber[]> => {
    const { data } = await apiClient.post('/phone-numbers/sync');
    return data.data.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/phone-numbers/${id}`);
  }
};
