import { Lead, ILead, ILeadDocument } from './lead.model.js';

export interface CreateLeadDto {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  source: string;
  apifyActorId?: string;
  apifyRunId?: string;
  folderId?: string;
  rawData?: Record<string, any>;
  status?: ILead['status'];
  notes?: string;
}

export interface LeadFilters {
  status?: ILead['status'];
  source?: string;
  apifyRunId?: string;
  folderId?: string;
  search?: string;
}

export const leadService = {
  async getAll(filters: LeadFilters = {}): Promise<ILeadDocument[]> {
    const query: any = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.source) query.source = filters.source;
    if (filters.apifyRunId) query.apifyRunId = filters.apifyRunId;
    if (filters.folderId) query.folderId = filters.folderId;
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    return Lead.find(query).sort({ createdAt: -1 });
  },

  async getById(id: string): Promise<ILeadDocument | null> {
    return Lead.findById(id);
  },

  async create(data: CreateLeadDto): Promise<ILeadDocument> {
    const lead = new Lead(data);
    return lead.save();
  },

  async bulkCreate(leads: CreateLeadDto[]): Promise<{ inserted: number; duplicates: number }> {
    let inserted = 0;
    let duplicates = 0;

    for (const leadData of leads) {
      // Check for duplicate by phone (if exists)
      if (leadData.phone) {
        const existing = await Lead.findOne({ phone: leadData.phone });
        if (existing) {
          duplicates++;
          continue;
        }
      }
      
      await Lead.create(leadData);
      inserted++;
    }

    return { inserted, duplicates };
  },

  async update(id: string, data: Partial<CreateLeadDto>): Promise<ILeadDocument | null> {
    return Lead.findByIdAndUpdate(id, data, { new: true });
  },

  async updateStatus(id: string, status: ILead['status']): Promise<ILeadDocument | null> {
    return Lead.findByIdAndUpdate(id, { status }, { new: true });
  },

  async delete(id: string): Promise<boolean> {
    const result = await Lead.findByIdAndDelete(id);
    return !!result;
  },

  async deleteByRunId(runId: string): Promise<number> {
    const result = await Lead.deleteMany({ apifyRunId: runId });
    return result.deletedCount;
  },

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const total = await Lead.countDocuments();
    
    const statusAgg = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus: Record<string, number> = {};
    statusAgg.forEach(s => { byStatus[s._id] = s.count; });

    const sourceAgg = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const bySource: Record<string, number> = {};
    sourceAgg.forEach(s => { bySource[s._id] = s.count; });

    return { total, byStatus, bySource };
  },

  async convertToContact(leadId: string): Promise<ILeadDocument | null> {
    const lead = await Lead.findById(leadId);
    if (!lead) return null;

    // Mark as converted
    lead.status = 'converted';
    await lead.save();
    
    return lead;
  }
};
