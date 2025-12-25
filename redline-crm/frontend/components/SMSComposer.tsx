import React, { useState } from 'react';
import { Send, X, Smile, Paperclip } from 'lucide-react';
import { PhoneNumber, SMSMessage, Contact, getCountryByCode } from '../types';
import NumberSelector from './NumberSelector';

interface SMSComposerProps {
    contact: Contact;
    phoneNumbers: PhoneNumber[];
    selectedPhoneNumber: PhoneNumber | null;
    onPhoneNumberSelect: (phoneNumber: PhoneNumber) => void;
    onSend: (message: Omit<SMSMessage, 'id' | 'timestamp' | 'twilioSid'>) => void;
    onClose: () => void;
    messages: SMSMessage[];
}

const SMSComposer: React.FC<SMSComposerProps> = ({
    contact,
    phoneNumbers,
    selectedPhoneNumber,
    onPhoneNumberSelect,
    onSend,
    onClose,
    messages
}) => {
    const [messageText, setMessageText] = useState('');

    const handleSend = () => {
        if (!messageText.trim() || !selectedPhoneNumber) return;

        onSend({
            contactId: contact.id,
            fromNumber: selectedPhoneNumber.number,
            toNumber: contact.phone,
            direction: 'outbound',
            body: messageText.trim(),
            status: 'queued'
        });

        setMessageText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Calculate SMS segments (160 chars per segment for GSM-7)
    const getSegmentInfo = (text: string) => {
        const length = text.length;
        if (length <= 160) return { segments: 1, remaining: 160 - length };
        const segments = Math.ceil(length / 153); // 153 for multi-part messages
        const remaining = (segments * 153) - length;
        return { segments, remaining };
    };

    const segmentInfo = getSegmentInfo(messageText);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold">
                            {contact.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-900">{contact.name}</h3>
                            <p className="text-sm text-neutral-500">{contact.phone}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
            </div>

            {/* From Number Selector */}
            <div className="px-4 py-2 border-b border-neutral-100 bg-white">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 uppercase font-medium">From:</span>
                    {phoneNumbers.length > 0 ? (
                        <NumberSelector
                            phoneNumbers={phoneNumbers}
                            selectedNumberId={selectedPhoneNumber?.id || null}
                            onSelect={onPhoneNumberSelect}
                            mode="sms"
                            compact
                        />
                    ) : (
                        <span className="text-sm text-neutral-400">No SMS-enabled numbers</span>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-neutral-400">
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.direction === 'outbound'
                                        ? 'bg-red-600 text-white rounded-br-sm'
                                        : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-sm'
                                    }`}
                            >
                                <p className="text-sm">{msg.body}</p>
                                <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                                    }`}>
                                    <span className={`text-xs ${msg.direction === 'outbound' ? 'text-red-200' : 'text-neutral-400'
                                        }`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.direction === 'outbound' && (
                                        <span className={`text-xs ${msg.status === 'delivered' ? 'text-green-300' :
                                                msg.status === 'sent' ? 'text-red-200' :
                                                    msg.status === 'failed' ? 'text-red-300' :
                                                        'text-red-200'
                                            }`}>
                                            {msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Compose */}
            <div className="p-4 border-t border-neutral-100 bg-white">
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-3 pr-24 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <span className={`text-xs ${messageText.length > 160 ? 'text-orange-500' : 'text-neutral-400'}`}>
                                {messageText.length}/{segmentInfo.segments > 1 ? `${segmentInfo.segments} parts` : '160'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!messageText.trim() || !selectedPhoneNumber}
                        className="p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SMSComposer;
