import { Contact } from '../types';
import apiClient from './apiClient';

export const contactApi = {
  getAll: async (): Promise<Contact[]> => {
    const { data } = await apiClient.get('/contacts');
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, // Ensure id is mapped
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  getById: async (id: string): Promise<Contact> => {
    const { data } = await apiClient.get(`/contacts/${id}`);
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  create: async (contact: Omit<Contact, 'id'>): Promise<Contact> => {
    const { data } = await apiClient.post('/contacts', contact);
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  update: async (id: string, contact: Partial<Contact>): Promise<Contact> => {
    const { data } = await apiClient.put(`/contacts/${id}`, contact);
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },

  import: async (contacts: any[]): Promise<number> => {
    const { data } = await apiClient.post('/contacts/import', { contacts });
    return data.count;
  },
  
  updateScore: async (id: string, score: number): Promise<void> => {
       await contactApi.update(id, { score });
  }
};
