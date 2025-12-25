import { ContactNote } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const noteApi = {
  getByContactId: async (contactId: string): Promise<ContactNote[]> => {
    const response = await fetch(`${API_URL}/notes/${contactId}`);
    if (!response.ok) throw new Error('Failed to fetch notes');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt)
    }));
  },

  create: async (note: Omit<ContactNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactNote> => {
    const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
    });
    if (!response.ok) throw new Error('Failed to create note');
    const data = await response.json();
    const item = data.data;
    return {
        ...item,
        id: item.id || item._id,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
    };
  },

  delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete note');
  }
};
