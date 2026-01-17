import { Lead, LeadStatus, LeadFolder } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export interface LeadFilters {
  status?: LeadStatus;
  source?: string;
  runId?: string;
  folderId?: string;
  search?: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}

export interface BulkImportResult {
  inserted: number;
  duplicates: number;
}

export const leadsApi = {
  async getAll(filters: LeadFilters = {}): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.source) params.append('source', filters.source);
    if (filters.runId) params.append('runId', filters.runId);
    if (filters.folderId) params.append('folderId', filters.folderId);
    if (filters.search) params.append('search', filters.search);

    const url = `${API_URL}/leads${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch leads');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }));
  },

  async getById(id: string): Promise<Lead> {
    const response = await fetch(`${API_URL}/leads/${id}`);
    if (!response.ok) throw new Error('Failed to fetch lead');
    const data = await response.json();
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: data.data.updatedAt ? new Date(data.data.updatedAt) : undefined,
    };
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error('Failed to create lead');
    const data = await response.json();
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async bulkCreate(leads: Omit<Lead, 'id' | 'createdAt'>[]): Promise<BulkImportResult> {
    const response = await fetch(`${API_URL}/leads/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    });
    if (!response.ok) throw new Error('Failed to bulk create leads');
    const data = await response.json();
    return data.data;
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const response = await fetch(`${API_URL}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update lead');
    const data = await response.json();
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const response = await fetch(`${API_URL}/leads/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update lead status');
    const data = await response.json();
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/leads/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lead');
  },

  async getStats(): Promise<LeadStats> {
    const response = await fetch(`${API_URL}/leads/stats`);
    if (!response.ok) throw new Error('Failed to fetch lead stats');
    const data = await response.json();
    return data.data;
  },

  async convertToContact(id: string): Promise<{ lead: Lead; contact: any }> {
    const response = await fetch(`${API_URL}/leads/${id}/convert`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to convert lead to contact');
    const data = await response.json();
    return data.data;
  },

  // ========== FOLDER METHODS ==========
  async getFolders(): Promise<LeadFolder[]> {
    const response = await fetch(`${API_URL}/leads/folders`);
    if (!response.ok) throw new Error('Failed to fetch folders');
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  },

  async createFolder(folder: { name: string; description?: string; color?: string }): Promise<LeadFolder> {
    const response = await fetch(`${API_URL}/leads/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder),
    });
    if (!response.ok) throw new Error('Failed to create folder');
    const data = await response.json();
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  },

  async updateFolder(id: string, updates: Partial<LeadFolder>): Promise<LeadFolder> {
    const response = await fetch(`${API_URL}/leads/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update folder');
    const data = await response.json();
    return data.data;
  },

  async deleteFolder(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/leads/folders/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete folder');
  },
};

