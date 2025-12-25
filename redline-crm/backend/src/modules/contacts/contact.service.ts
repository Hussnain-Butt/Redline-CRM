import { Contact, IContactDocument } from './contact.model.js';

export class ContactService {
  async getAll(): Promise<IContactDocument[]> {
    return await Contact.find().sort({ updatedAt: -1 });
  }

  async getById(id: string): Promise<IContactDocument | null> {
    return await Contact.findById(id);
  }

  async create(data: Partial<IContactDocument>): Promise<IContactDocument> {
    const contact = new Contact(data);
    return await contact.save();
  }

  async update(id: string, data: Partial<IContactDocument>): Promise<IContactDocument | null> {
    return await Contact.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await Contact.findByIdAndDelete(id);
    return !!result;
  }

  async import(contacts: Partial<IContactDocument>[]): Promise<number> {
    const validContacts = contacts.map(c => ({
        ...c,
        lastContacted: c.lastContacted || new Date(),
        status: c.status || 'Lead'
    }));
    
    if (validContacts.length === 0) return 0;

    const result = await Contact.insertMany(validContacts);
    return result.length;
  }
}

export const contactService = new ContactService();
