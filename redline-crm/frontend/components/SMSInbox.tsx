import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Plus, Search, Send, ArrowLeft, Phone, User, Check, CheckCheck, X, Loader2, Clock
} from 'lucide-react';
import { Contact, SMSMessage, PhoneNumber, getCountryByCode, COUNTRIES } from '../types';
import NumberSelector from './NumberSelector';

interface SMSInboxProps {
    contacts: Contact[];
    allMessages: SMSMessage[];
    phoneNumbers: PhoneNumber[];
    selectedPhoneNumber: PhoneNumber | null;
    onPhoneNumberSelect: (phoneNumber: PhoneNumber) => void;
    onSendSMS: (sms: Omit<SMSMessage, 'id' | 'timestamp' | 'twilioSid'>) => void;
    onSelectContact: (contact: Contact) => void;
}

interface Conversation {
    contact: Contact;
    lastMessage: SMSMessage;
    unreadCount: number;
}

const SMSInbox: React.FC<SMSInboxProps> = ({
    contacts,
    allMessages,
    phoneNumbers,
    selectedPhoneNumber,
    onPhoneNumberSelect,
    onSendSMS,
    onSelectContact
}) => {
    const [view, setView] = useState<'inbox' | 'conversation' | 'compose'>('inbox');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMessage, setNewMessage] = useState('');

    // New message state
    const [composeNumber, setComposeNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Group messages by contact or phone number
    const conversations: Conversation[] = React.useMemo(() => {
        const convMap = new Map<string, Conversation>();

        // 1. Initialize with specific contacts who have messages
        contacts.forEach(contact => {
            const contactMessages = allMessages.filter(m => m.contactId === contact.id);
            if (contactMessages.length > 0) {
                const lastMessage = contactMessages.sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];

                convMap.set(contact.id, {
                    contact,
                    lastMessage,
                    unreadCount: contactMessages.filter(m => m.direction === 'inbound' && m.status === 'received').length
                });
            }
        });

        // 2. Find messages from unknown numbers (no contactId or contactId not in contacts list)
        allMessages.forEach(msg => {
            // If message is already associated with a known contact, skip
            if (msg.contactId && contacts.find(c => c.id === msg.contactId)) return;

            // Identify conversation key (use raw phone number for unknown)
            // For inbound, use fromNumber. For outbound, use toNumber.
            const otherPartyNumber = msg.direction === 'inbound' ? msg.fromNumber : msg.toNumber;
            
            if (!otherPartyNumber) return;

            // Check if we already have a conversation for this number (via contact match)
            const isKnownContact = contacts.find(c => c.phone === otherPartyNumber || c.phone.includes(otherPartyNumber));
            if (isKnownContact && convMap.has(isKnownContact.id)) return;

            // If it's truly unknown, create/update a placeholder conversation
            if (!convMap.has(otherPartyNumber)) {
                convMap.set(otherPartyNumber, {
                    contact: {
                        id: `unknown-${otherPartyNumber}`,
                        name: otherPartyNumber, // Display number as name
                        phone: otherPartyNumber,
                        email: '',
                        company: 'Unknown',
                        status: 'Lead',
                        notes: 'Auto-generated from SMS',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            const conv = convMap.get(otherPartyNumber)!;
            // Update last message if this one is newer
            if (new Date(msg.timestamp).getTime() > new Date(conv.lastMessage.timestamp).getTime()) {
                conv.lastMessage = msg;
            }
            if (msg.direction === 'inbound' && msg.status === 'received') {
                conv.unreadCount++;
            }
        });

        return Array.from(convMap.values()).sort((a, b) => 
            new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
        );
    }, [contacts, allMessages]);

    const filteredConversations = conversations.filter(c =>
        c.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact.phone.includes(searchTerm)
    );

    const conversationMessages = selectedConversation
        ? allMessages.filter(m => {
            if (selectedConversation.contact.id.startsWith('unknown-')) {
                 return m.fromNumber === selectedConversation.contact.phone || m.toNumber === selectedConversation.contact.phone;
            }
            return m.contactId === selectedConversation.contact.id;
        }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedPhoneNumber || isSending) return;

        setIsSending(true);
        
        if (view === 'compose') {
            const fullNumber = `${selectedCountry.dialCode}${composeNumber}`;
            // Find or determine contact ID
            const existingContact = contacts.find(c => c.phone === fullNumber || c.phone.includes(composeNumber));

            onSendSMS({
                contactId: existingContact?.id || 'unknown',
                fromNumber: selectedPhoneNumber.number,
                toNumber: fullNumber,
                direction: 'outbound',
                body: newMessage,
                status: 'sent'
            });
        } else if (selectedConversation) {
            onSendSMS({
                contactId: selectedConversation.contact.id,
                fromNumber: selectedPhoneNumber.number,
                toNumber: selectedConversation.contact.phone,
                direction: 'outbound',
                body: newMessage,
                status: 'sent'
            });
        }

        setNewMessage('');
        // Small delay for visual feedback
        setTimeout(() => setIsSending(false), 500);
    };

    const getStatusIcon = (status: SMSMessage['status']) => {
        switch (status) {
            case 'delivered':
                return <CheckCheck className="w-4 h-4 text-blue-500" />;
            case 'sent':
                return <Check className="w-4 h-4 text-neutral-400" />;
            case 'queued':
                return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
            case 'failed':
                return <X className="w-4 h-4 text-red-500" />;
            case 'received':
                return null;
            default:
                return <Clock className="w-4 h-4 text-neutral-300" />;
        }
    };

    // Compose New Message View
    if (view === 'compose') {
        return (
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-neutral-100 bg-white">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setView('inbox')}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold">New Message</h2>
                    </div>
                </div>

                {/* Recipient Input */}
                <div className="p-4 border-b border-neutral-100">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">To:</label>
                    <div className="flex items-center gap-2 relative">
                        {/* Country Picker */}
                        <button
                            onClick={() => setShowCountryPicker(!showCountryPicker)}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        >
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.dialCode}</span>
                        </button>

                        <input
                            type="tel"
                            value={composeNumber}
                            onChange={(e) => setComposeNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Phone number"
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />

                        {/* Country Picker Dropdown */}
                        {showCountryPicker && (
                            <div className="absolute top-full left-0 mt-2 w-64 max-h-48 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-y-auto">
                                {COUNTRIES.map(country => (
                                    <button
                                        key={country.code}
                                        onClick={() => {
                                            setSelectedCountry(country);
                                            setShowCountryPicker(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 transition-colors text-left"
                                    >
                                        <span>{country.flag}</span>
                                        <span className="flex-1 text-sm">{country.name}</span>
                                        <span className="text-xs text-neutral-500">{country.dialCode}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* From Number */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">From:</label>
                        {phoneNumbers.filter(p => p.canSMS).length > 0 ? (
                            <NumberSelector
                                phoneNumbers={phoneNumbers.filter(p => p.canSMS)}
                                selectedNumberId={selectedPhoneNumber?.id || null}
                                onSelect={onPhoneNumberSelect}
                                mode="sms"
                            />
                        ) : (
                            <p className="text-sm text-red-500">No SMS-enabled numbers available</p>
                        )}
                    </div>
                </div>

                {/* Message Composer */}
                <div className="flex-1 p-4 flex flex-col justify-end">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={3}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !composeNumber || !selectedPhoneNumber || isSending}
                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2 text-right">
                        {newMessage.length} / 160 ({Math.ceil(newMessage.length / 160) || 1} segment{newMessage.length > 160 ? 's' : ''})
                    </p>
                </div>
            </div>
        );
    }

    // Conversation View
    if (view === 'conversation' && selectedConversation) {
        return (
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-neutral-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setView('inbox');
                                    setSelectedConversation(null);
                                }}
                                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
                                    {selectedConversation.contact.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-bold text-neutral-900">{selectedConversation.contact.name}</h2>
                                    <p className="text-xs text-neutral-500">{selectedConversation.contact.phone}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => onSelectContact(selectedConversation.contact)}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                            title="View Contact"
                        >
                            <User className="w-5 h-5 text-neutral-600" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                    {conversationMessages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] p-3 rounded-2xl ${msg.direction === 'outbound'
                                        ? 'bg-red-600 text-white rounded-br-sm'
                                        : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-sm'
                                    }`}
                            >
                                <p className="text-sm">{msg.body}</p>
                                <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <span className={`text-xs ${msg.direction === 'outbound' ? 'text-red-200' : 'text-neutral-400'
                                        }`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {conversationMessages.length === 0 && (
                        <div className="text-center py-12 text-neutral-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No messages yet</p>
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-neutral-100 bg-white">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !selectedPhoneNumber || isSending}
                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Inbox View
    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-neutral-900">Messages</h2>
                    <button
                        onClick={() => setView('compose')}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New SMS</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">No conversations yet</p>
                        <p className="text-sm mb-4">Start a new conversation</p>
                        <button
                            onClick={() => setView('compose')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <Plus className="w-4 h-4" />
                            New SMS
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {filteredConversations.map(conv => (
                            <button
                                key={conv.contact.id}
                                onClick={() => {
                                    setSelectedConversation(conv);
                                    setView('conversation');
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors text-left"
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
                                        {conv.contact.name.charAt(0)}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-semibold text-neutral-900 truncate">{conv.contact.name}</h3>
                                        <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                                            {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 truncate">
                                        {conv.lastMessage.direction === 'outbound' && 'You: '}
                                        {conv.lastMessage.body}
                                    </p>
                                </div>
                                {conv.lastMessage.direction === 'outbound' && (
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(conv.lastMessage.status)}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SMSInbox;
