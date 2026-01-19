import { ContactNote, IContactNoteDocument } from './note.model.js';

export class NoteService {
  async getByContactId(contactId: string, userId: string): Promise<IContactNoteDocument[]> {
    return await ContactNote.find({ contactId, userId }).sort({ createdAt: -1 });
  }

  async create(data: Partial<IContactNoteDocument>): Promise<IContactNoteDocument> {
    const note = new ContactNote(data);
    return await note.save();
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await ContactNote.findOneAndDelete({ _id: id, userId });
    return !!result;
  }
}

export const noteService = new NoteService();
