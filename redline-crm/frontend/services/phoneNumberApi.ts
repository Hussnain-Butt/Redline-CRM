import { PhoneNumber } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export const phoneNumberApi = {
  getAll: async (): Promise<PhoneNumber[]> => {
    const response = await fetch(`${API_URL}/phone-numbers`);
    if (!response.ok) throw new Error('Failed to fetch phone numbers');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, // Ensure id is mapped
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  create: async (phoneNumber: Omit<PhoneNumber, 'id' | 'createdAt'>): Promise<PhoneNumber> => {
    const response = await fetch(`${API_URL}/phone-numbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(phoneNumber),
    });
    if (!response.ok) throw new Error('Failed to create phone number');
    const data = await response.json();
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as PhoneNumber;
  },

  update: async (id: string, updates: Partial<PhoneNumber>): Promise<PhoneNumber> => {
    const response = await fetch(`${API_URL}/phone-numbers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update phone number');
    const data = await response.json();
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as PhoneNumber;
  },

  sync: async (): Promise<PhoneNumber[]> => {
    const response = await fetch(`${API_URL}/phone-numbers/sync`, {
        method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to sync phone numbers');
    const data = await response.json();
    return data.data.map((item: any) => ({
        ...item,
        id: item.id || item._id,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/phone-numbers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete phone number');
  }
};
