import React, { useState } from 'react';
import { Contact } from '../types';
import { Search, MoreHorizontal, Phone, MessageSquare, Plus, Upload } from 'lucide-react';

interface ContactsProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onCall: (number: string) => void;
  onMessage: (contact: Contact) => void;
  onAddContact?: () => void;
  onImportContacts?: () => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, onSelectContact, onCall, onMessage, onAddContact, onImportContacts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Contacts</h2>
          <div className="flex gap-2">
            {onImportContacts && (
              <button
                onClick={onImportContacts}
                className="flex items-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
            )}
            {onAddContact && (
              <button
                onClick={onAddContact}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search name, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            {contacts.length === 0 ? (
              <>
                <Plus className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No contacts yet</p>
                <p className="text-sm mb-4">Add your first contact or import from CSV</p>
                <div className="flex gap-2">
                  {onImportContacts && (
                    <button
                      onClick={onImportContacts}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-600"
                    >
                      <Upload className="w-4 h-4" />
                      Import CSV
                    </button>
                  )}
                  {onAddContact && (
                    <button
                      onClick={onAddContact}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Contact
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p>No contacts found.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map(contact => (
              <div
                key={contact.id}
                className="group flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-neutral-100"
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-sm group-hover:bg-red-600 transition-colors">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{contact.name}</h3>
                    <p className="text-sm text-neutral-500">{contact.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onCall(contact.phone); }}
                    className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMessage(contact); }}
                    className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-neutral-600 hover:text-neutral-900 rounded-full transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
