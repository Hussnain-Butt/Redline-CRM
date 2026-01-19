import { Contact, IContactDocument } from './contact.model.js';

export class ContactService {
  async getAll(userId: string): Promise<IContactDocument[]> {
    return await Contact.find({ userId }).sort({ updatedAt: -1 });
  }

  async getById(id: string, userId: string): Promise<IContactDocument | null> {
    return await Contact.findOne({ _id: id, userId });
  }

  async create(data: Partial<IContactDocument>): Promise<IContactDocument> {
    const contact = new Contact(data);
    return await contact.save();
  }

  async update(id: string, userId: string, data: Partial<IContactDocument>): Promise<IContactDocument | null> {
    return await Contact.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await Contact.findOneAndDelete({ _id: id, userId });
    return !!result;
  }

  async import(contacts: Partial<IContactDocument>[], userId: string): Promise<number> {
    const validContacts = contacts.map(c => ({
        ...c,
        userId,
        lastContacted: c.lastContacted || new Date(),
        status: c.status || 'Lead'
    }));
    
    if (validContacts.length === 0) return 0;

    const result = await Contact.insertMany(validContacts);
    return result.length;
  }

  async count(userId: string): Promise<number> {
    return await Contact.countDocuments({ userId });
  }
}

export const contactService = new ContactService();
