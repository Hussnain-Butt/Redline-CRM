import { Request, Response } from 'express';
import { contactService } from './contact.service.js';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await contactService.getAll(req.userId!);
    return res.json({ success: true, data: contacts });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
};

export const getContact = async (req: Request, res: Response) => {
  try {
    const contact = await contactService.getById(req.params.id, req.userId!);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    return res.json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch contact' });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const contact = await contactService.create({
      ...req.body,
      userId: req.userId!
    });
    return res.status(201).json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const contact = await contactService.update(req.params.id, req.userId!, req.body);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    return res.json({ success: true, data: contact });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const success = await contactService.delete(req.params.id, req.userId!);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    return res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  try {
    const contacts = req.body.contacts; // Expecting { contacts: [...] }
    if (!Array.isArray(contacts)) {
         return res.status(400).json({ success: false, error: 'Invalid data format. Expected array.' });
    }
    const count = await contactService.import(contacts, req.userId!);
    return res.status(201).json({ success: true, count, message: `Successfully imported ${count} contacts` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to import contacts' });
  }
};
