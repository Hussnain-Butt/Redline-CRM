import { Request, Response } from 'express';
import { leadFolderService } from './leadFolder.service.js';

export const leadFolderController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const folders = await leadFolderService.getAll();
      res.json({ success: true, data: folders });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const folder = await leadFolderService.getById(req.params.id);
      if (!folder) {
        res.status(404).json({ success: false, error: 'Folder not found' });
        return;
      }
      res.json({ success: true, data: folder });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color, icon } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: 'Name is required' });
        return;
      }
      const folder = await leadFolderService.create({ name, description, color, icon });
      res.status(201).json({ success: true, data: folder });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const folder = await leadFolderService.update(req.params.id, req.body);
      if (!folder) {
        res.status(404).json({ success: false, error: 'Folder not found' });
        return;
      }
      res.json({ success: true, data: folder });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await leadFolderService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Folder not found' });
        return;
      }
      res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
