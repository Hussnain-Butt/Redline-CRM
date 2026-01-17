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
  async getAll(): Promise<FolderWithCount[]> {
    const folders = await LeadFolder.find().sort({ createdAt: -1 }).lean();
    
    // Get lead counts for each folder
    const folderIds = folders.map((f: any) => f._id);
    const counts = await Lead.aggregate([
      { $match: { folderId: { $in: folderIds } } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } }
    ]);
    
    const countMap = new Map(counts.map(c => [c._id.toString(), c.count]));
    
    return folders.map(folder => ({
      ...folder,
      id: folder._id.toString(),
      leadCount: countMap.get(folder._id.toString()) || 0,
    })) as FolderWithCount[];
  },

  async getById(id: string): Promise<ILeadFolderDocument | null> {
    return await LeadFolder.findById(id);
  },

  async create(data: CreateFolderDto): Promise<ILeadFolderDocument> {
    const folder = new LeadFolder({
      name: data.name,
      description: data.description,
      color: data.color || '#dc2626',
      icon: data.icon || 'folder',
    });
    return await folder.save();
  },

  async update(id: string, data: Partial<CreateFolderDto>): Promise<ILeadFolderDocument | null> {
    return await LeadFolder.findByIdAndUpdate(id, data, { new: true });
  },

  async delete(id: string): Promise<boolean> {
    // Also update leads to remove folderId reference
    await Lead.updateMany({ folderId: id }, { $unset: { folderId: 1 } });
    const result = await LeadFolder.findByIdAndDelete(id);
    return !!result;
  },

  async getLeadCount(folderId: string): Promise<number> {
    return await Lead.countDocuments({ folderId });
  },
};
