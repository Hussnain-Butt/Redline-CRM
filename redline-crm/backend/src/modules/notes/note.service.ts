import { ContactNote, IContactNoteDocument } from './note.model.js';

export class NoteService {
  async getByContactId(contactId: string): Promise<IContactNoteDocument[]> {
    return await ContactNote.find({ contactId }).sort({ createdAt: -1 });
  }

  async create(data: Partial<IContactNoteDocument>): Promise<IContactNoteDocument> {
    const note = new ContactNote(data);
    return await note.save();
  }

  async delete(id: string): Promise<boolean> {
    const result = await ContactNote.findByIdAndDelete(id);
    return !!result;
  }
}

export const noteService = new NoteService();
