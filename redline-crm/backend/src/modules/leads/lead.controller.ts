import { Request, Response } from 'express';
import { leadService, LeadFilters } from './lead.service.js';
import { contactService } from '../contacts/contact.service.js';

export const leadController = {
  async getAll(req: Request, res: Response) {
    try {
      const filters: LeadFilters = {
        status: req.query.status as any,
        source: req.query.source as string,
        apifyRunId: req.query.runId as string,
        folderId: req.query.folderId as string,
        search: req.query.search as string,
      };

      const leads = await leadService.getAll(filters);
      return res.json({ success: true, data: leads });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const lead = await leadService.getById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      return res.json({ success: true, data: lead });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const lead = await leadService.create(req.body);
      return res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    try {
      const { leads } = req.body;
      if (!Array.isArray(leads)) {
        return res.status(400).json({ success: false, error: 'leads must be an array' });
      }

      const result = await leadService.bulkCreate(leads);
      return res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const lead = await leadService.update(req.params.id, req.body);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      return res.json({ success: true, data: lead });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const lead = await leadService.updateStatus(req.params.id, status);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      return res.json({ success: true, data: lead });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const success = await leadService.delete(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }
      return res.json({ success: true, message: 'Lead deleted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getStats(_req: Request, res: Response) {
    try {
      const stats = await leadService.getStats();
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async convertToContact(req: Request, res: Response) {
    try {
      const lead = await leadService.getById(req.params.id);
      if (!lead) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      // Create contact from lead
      const contact = await contactService.create({
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        company: lead.company || '',
        status: 'Lead',
        notes: `Converted from lead. Original source: ${lead.source}\n${lead.notes || ''}`,
        source: lead.source,
        tags: [lead.category || 'imported'],
        score: Math.round((lead.rating || 0) * 20),
      });

      // Mark lead as converted
      await leadService.updateStatus(req.params.id, 'converted');

      return res.json({ success: true, data: { lead, contact } });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};
