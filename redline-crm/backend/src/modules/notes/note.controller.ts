import { Request, Response } from 'express';
import { noteService } from './note.service.js';

export const getNotesByContact = async (req: Request, res: Response) => {
  try {
    const notes = await noteService.getByContactId(req.params.contactId);
    return res.json({ success: true, data: notes });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch notes' });
  }
};

export const createNote = async (req: Request, res: Response) => {
  try {
    const note = await noteService.create(req.body);
    return res.status(201).json({ success: true, data: note });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create note' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const success = await noteService.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    return res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
};
