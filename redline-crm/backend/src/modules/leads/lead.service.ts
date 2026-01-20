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
  async getAll(userId: string, filters: LeadFilters = {}): Promise<ILeadDocument[]> {
    const query: any = { userId };
    
    if (filters.status) query.status = filters.status;
    if (filters.source) query.source = filters.source;
    if (filters.apifyRunId) query.apifyRunId = filters.apifyRunId;
    if (filters.folderId) query.folderId = filters.folderId;
    if (filters.search) {
      query.$text = { $search: filters.search };
    }
    
    return Lead.find(query).sort({ createdAt: -1 });
  },

  async getById(id: string, userId: string): Promise<ILeadDocument | null> {
    return Lead.findOne({ _id: id, userId });
  },

  async create(data: CreateLeadDto & { userId: string }): Promise<ILeadDocument> {
    const lead = new Lead(data);
    return lead.save();
  },

  async bulkCreate(leads: CreateLeadDto[], userId: string): Promise<{ inserted: number; duplicates: number }> {
    console.log(`bulkCreate: Processing ${leads.length} leads for user ${userId}`);
    let inserted = 0;
    let duplicates = 0;
    const toInsert: any[] = [];

    for (const leadData of leads) {
      // Check for duplicate by phone (if exists) within user's leads
      if (leadData.phone) {
        const existing = await Lead.findOne({ phone: leadData.phone, userId });
        if (existing) {
          duplicates++;
          continue;
        }
      }
      toInsert.push({ ...leadData, userId });
    }

    console.log(`bulkCreate: Found ${duplicates} duplicates, attempting to insert ${toInsert.length} new leads`);

    if (toInsert.length > 0) {
      try {
        const result = await Lead.insertMany(toInsert, { ordered: false });
        inserted = result.length;
        console.log(`bulkCreate: Successfully inserted ${inserted} leads`);
      } catch (error: any) {
        // If some succeeded and some failed (e.g. unique constraint violation)
        if (error.insertedDocs) {
          inserted = error.insertedDocs.length;
        }
        console.error('bulkCreate: Partial or full failure:', error.message);
        // We log the error but don't re-throw to allow 200 with partial success,
        // unless we want to treat it as a full failure. 
        // For debugging, let's re-throw if it's not just a duplicate error.
        if (!error.message.includes('duplicate key')) {
          console.error('Full bulkCreate error:', error);
          throw error;
        }
      }
    }

    return { inserted, duplicates };
  },

  async update(id: string, userId: string, data: Partial<CreateLeadDto>): Promise<ILeadDocument | null> {
    return Lead.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  },

  async updateStatus(id: string, userId: string, status: ILead['status']): Promise<ILeadDocument | null> {
    return Lead.findOneAndUpdate({ _id: id, userId }, { status }, { new: true });
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await Lead.findOneAndDelete({ _id: id, userId });
    return !!result;
  },

  async deleteByRunId(runId: string, userId: string): Promise<number> {
    const result = await Lead.deleteMany({ apifyRunId: runId, userId });
    return result.deletedCount;
  },

  async getStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const total = await Lead.countDocuments({ userId });
    
    const statusAgg = await Lead.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatus: Record<string, number> = {};
    statusAgg.forEach(s => { byStatus[s._id] = s.count; });

    const sourceAgg = await Lead.aggregate([
      { $match: { userId } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const bySource: Record<string, number> = {};
    sourceAgg.forEach(s => { bySource[s._id] = s.count; });

    return { total, byStatus, bySource };
  },

  async convertToContact(leadId: string, userId: string): Promise<ILeadDocument | null> {
    const lead = await Lead.findOne({ _id: leadId, userId });
    if (!lead) return null;

    // Mark as converted
    lead.status = 'converted';
    await lead.save();
    
    return lead;
  }
};
