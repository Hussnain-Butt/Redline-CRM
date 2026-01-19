import { LeadFolder, ILeadFolderDocument } from './leadFolder.model.js';
import { Lead } from './lead.model.js';

export interface CreateFolderDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface FolderWithCount {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const leadFolderService = {
  async getAll(userId: string): Promise<FolderWithCount[]> {
    const folders = await LeadFolder.find({ userId }).sort({ createdAt: -1 }).lean();
    
    // Get lead counts for each folder, scoped by userId
    const folderIds = folders.map((f: any) => f._id);
    const counts = await Lead.aggregate([
      { $match: { folderId: { $in: folderIds }, userId } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
    
    return folders.map(folder => ({
      ...folder,
      id: (folder as any)._id.toString(),
      leadCount: countMap.get((folder as any)._id.toString()) || 0,
    } as any)) as FolderWithCount[];
  },

  async getById(id: string, userId: string): Promise<ILeadFolderDocument | null> {
    return await LeadFolder.findOne({ _id: id, userId });
  },

  async create(data: CreateFolderDto & { userId: string }): Promise<ILeadFolderDocument> {
    const folder = new LeadFolder({
      userId: data.userId,
      name: data.name,
      description: data.description,
      color: data.color || '#dc2626',
      icon: data.icon || 'folder',
    });
    return await folder.save();
  },

  async update(id: string, userId: string, data: Partial<CreateFolderDto>): Promise<ILeadFolderDocument | null> {
    return await LeadFolder.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  },

  async delete(id: string, userId: string): Promise<boolean> {
    // Also update leads to remove folderId reference, scoped by userId
    await Lead.updateMany({ folderId: id, userId }, { $unset: { folderId: 1 } });
    const result = await LeadFolder.findOneAndDelete({ _id: id, userId });
    return !!result;
  },

  async getLeadCount(folderId: string, userId: string): Promise<number> {
    return await Lead.countDocuments({ folderId, userId });
  },
};
