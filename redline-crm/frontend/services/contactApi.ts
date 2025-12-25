import { Contact } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const contactApi = {
  getAll: async (): Promise<Contact[]> => {
    const response = await fetch(`${API_URL}/contacts`);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, // Ensure id is mapped
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    }));
  },

  getById: async (id: string): Promise<Contact> => {
    const response = await fetch(`${API_URL}/contacts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch contact');
    const data = await response.json();
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  create: async (contact: Omit<Contact, 'id'>): Promise<Contact> => {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    const data = await response.json();
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  update: async (id: string, contact: Partial<Contact>): Promise<Contact> => {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    const data = await response.json();
    const item = data.data;
    return {
      ...item,
      id: item.id || item._id,
      lastContacted: new Date(item.lastContacted),
      createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    } as Contact;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete contact');
  },

  import: async (contacts: any[]): Promise<number> => {
    const response = await fetch(`${API_URL}/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
    });
    if (!response.ok) throw new Error('Failed to import contacts');
    const data = await response.json();
    return data.count;
  },
  
  updateScore: async (id: string, score: number): Promise<void> => {
       // Ideally backend should handle this, for now just update the field
       await contactApi.update(id, { score });
  }
};
