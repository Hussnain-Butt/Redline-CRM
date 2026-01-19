import { ContactNote } from '../types';
import apiClient from './apiClient';

export const noteApi = {
  getByContactId: async (contactId: string): Promise<ContactNote[]> => {
    const { data } = await apiClient.get(`/notes/${contactId}`);
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  },

  create: async (note: Omit<ContactNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactNote> => {
    const { data } = await apiClient.post('/notes', note);
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
    };
  },

  delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/notes/${id}`);
  }
};
