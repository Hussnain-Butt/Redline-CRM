import { Lead, LeadStatus, LeadFolder } from '../types';
import apiClient from './apiClient';

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
    const { data } = await apiClient.get('/leads', { params: filters });
    return data.data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
    }));
  },

  async getById(id: string): Promise<Lead> {
    const { data } = await apiClient.get(`/leads/${id}`);
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: data.data.updatedAt ? new Date(data.data.updatedAt) : undefined,
    };
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const { data } = await apiClient.post('/leads', lead);
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async bulkCreate(leads: Omit<Lead, 'id' | 'createdAt'>[]): Promise<BulkImportResult> {
    const { data } = await apiClient.post('/leads/bulk', { leads });
    return data.data;
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data } = await apiClient.put(`/leads/${id}`, updates);
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async updateStatus(id: string, status: LeadStatus): Promise<Lead> {
    const { data } = await apiClient.patch(`/leads/${id}/status`, { status });
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
    };
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },

  async getStats(): Promise<LeadStats> {
    const { data } = await apiClient.get('/leads/stats');
    return data.data;
  },

  async convertToContact(id: string): Promise<{ lead: Lead; contact: any }> {
    const { data } = await apiClient.post(`/leads/${id}/convert`);
    return data.data;
  },

  // ========== FOLDER METHODS ==========
  async getFolders(): Promise<LeadFolder[]> {
    const { data } = await apiClient.get('/leads/folders');
    return data.data.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  },

  async createFolder(folder: { name: string; description?: string; color?: string }): Promise<LeadFolder> {
    const { data } = await apiClient.post('/leads/folders', folder);
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  },

  async updateFolder(id: string, updates: Partial<LeadFolder>): Promise<LeadFolder> {
    const { data } = await apiClient.put(`/leads/folders/${id}`, updates);
    return data.data;
  },

  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/leads/folders/${id}`);
  },
};

