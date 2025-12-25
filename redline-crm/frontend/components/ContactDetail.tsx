import React, { useState } from 'react';
import {
    X, Phone, MessageSquare, Mail, Plus, Clock, FileText,
    Play, Download, ChevronRight, Sparkles, Star, Tag,
    Calendar, Edit2, Trash2, Save
} from 'lucide-react';
import { Contact, CallLog, SMSMessage, ContactNote, PhoneNumber, getCountryByCode, DISPOSITION_CODES } from '../types';

interface ContactDetailProps {
    contact: Contact;
    callLogs: CallLog[];
    smsMessages: SMSMessage[];
    notes: ContactNote[];
    phoneNumbers: PhoneNumber[];
    onClose: () => void;
    onCall: (number: string) => void;
    onSMS: () => void;
    onGenerateEmail: () => void;
    onAddNote: (content: string) => void;
    onDeleteNote: (id: string) => void;
    onScheduleCall: (date: Date, notes: string) => void;
    onDeleteContact?: () => void;
}

type TabType = 'overview' | 'calls' | 'messages' | 'notes' | 'timeline';

const ContactDetail: React.FC<ContactDetailProps> = ({
    contact,
    callLogs,
    smsMessages,
    notes,
    phoneNumbers,
    onClose,
    onCall,
    onSMS,
    onGenerateEmail,
    onAddNote,
    onDeleteNote,
    onScheduleCall,
    onDeleteContact
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [newNote, setNewNote] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleNotes, setScheduleNotes] = useState('');

    const handleAddNote = () => {
        if (newNote.trim()) {
            onAddNote(newNote.trim());
            setNewNote('');
        }
    };

    const handleSchedule = () => {
        if (scheduleDate) {
            onScheduleCall(new Date(scheduleDate), scheduleNotes);
            setShowScheduleModal(false);
            setScheduleDate('');
            setScheduleNotes('');
        }
    };

    const getDispositionBadge = (disposition?: string) => {
        if (!disposition) return null;
        const d = DISPOSITION_CODES.find(c => c.value === disposition);
        if (!d) return null;
        const colors: Record<string, string> = {
            green: 'bg-green-100 text-green-700',
            yellow: 'bg-yellow-100 text-yellow-700',
            orange: 'bg-orange-100 text-orange-700',
            red: 'bg-red-100 text-red-700',
            gray: 'bg-neutral-100 text-neutral-700',
            blue: 'bg-blue-100 text-blue-700',
            purple: 'bg-purple-100 text-purple-700'
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors[d.color] || colors.gray}`}>
                {d.label}
            </span>
        );
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const tabs: { id: TabType; label: string; count?: number }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'calls', label: 'Calls', count: callLogs.length },
        { id: 'messages', label: 'Messages', count: smsMessages.length },
        { id: 'notes', label: 'Notes', count: notes.length },
        { id: 'timeline', label: 'Timeline' }
    ];

    // Combine all activities for timeline
    const timelineItems = [
        ...callLogs.map(c => ({ type: 'call' as const, date: new Date(c.date), data: c })),
        ...smsMessages.map(s => ({ type: 'sms' as const, date: new Date(s.timestamp), data: s })),
        ...notes.map(n => ({ type: 'note' as const, date: new Date(n.createdAt), data: n }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-3xl bg-white h-full shadow-2xl border-l border-neutral-200 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold relative">
                            {contact.name.charAt(0)}
                            {contact.score && contact.score > 50 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <Star className="w-3 h-3 text-yellow-900" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">{contact.name}</h2>
                            <p className="text-neutral-500">{contact.company} • {contact.status}</p>
                            {contact.score !== undefined && (
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="h-2 w-20 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                                            style={{ width: `${Math.min(contact.score, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-neutral-500">Score: {contact.score}</span>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => onCall(contact.phone)}
                                    className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                                    title="Call"
                                >
                                    <Phone className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onSMS}
                                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                    title="Message"
                                >
                                    <MessageSquare className="w-4 h-4 text-neutral-600" />
                                </button>
                                <button
                                    onClick={onGenerateEmail}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg font-medium flex items-center gap-2 hover:bg-red-100 transition-colors"
                                    title="AI Draft"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm">AI Email</span>
                                </button>
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                                    title="Schedule Call"
                                >
                                    <Calendar className="w-4 h-4 text-neutral-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onDeleteContact && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Delete Contact"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-neutral-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-neutral-100 px-6">
                    <div className="flex gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-neutral-100 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Contact Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500">Email</p>
                                        <p className="font-medium">{contact.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Phone</p>
                                        <p className="font-medium">{contact.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Company</p>
                                        <p className="font-medium">{contact.company || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Status</p>
                                        <p className="font-medium">{contact.status}</p>
                                    </div>
                                    {contact.notes && (
                                        <div className="col-span-2">
                                            <p className="text-neutral-500">Notes</p>
                                            <p className="font-medium p-3 bg-neutral-50 rounded-lg mt-1 text-neutral-700">{contact.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Recent Activity Preview */}
                            <section>
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    {timelineItems.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                                            <div className={`p-2 rounded-full ${item.type === 'call' ? 'bg-green-100' :
                                                item.type === 'sms' ? 'bg-blue-100' : 'bg-purple-100'
                                                }`}>
                                                {item.type === 'call' ? <Phone className="w-3 h-3 text-green-600" /> :
                                                    item.type === 'sms' ? <MessageSquare className="w-3 h-3 text-blue-600" /> :
                                                        <FileText className="w-3 h-3 text-purple-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {item.type === 'call' ? `${(item.data as CallLog).type} call` :
                                                        item.type === 'sms' ? `SMS ${(item.data as SMSMessage).direction}` :
                                                            'Note added'}
                                                </p>
                                                <p className="text-xs text-neutral-500 truncate">
                                                    {item.type === 'sms' ? (item.data as SMSMessage).body :
                                                        item.type === 'note' ? (item.data as ContactNote).content :
                                                            `Duration: ${formatDuration((item.data as CallLog).durationSeconds)}`}
                                                </p>
                                            </div>
                                            <span className="text-xs text-neutral-400">
                                                {item.date.toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                    {timelineItems.length === 0 && (
                                        <p className="text-neutral-400 text-sm text-center py-6">No activity yet</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Calls Tab */}
                    {activeTab === 'calls' && (
                        <div className="space-y-3">
                            {callLogs.length === 0 ? (
                                <div className="text-center py-12 text-neutral-400">
                                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No call history</p>
                                </div>
                            ) : (
                                callLogs.map(log => (
                                    <div key={log.id} className="p-4 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${log.type === 'inbound' ? 'bg-green-100' :
                                                    log.type === 'outbound' ? 'bg-blue-100' : 'bg-red-100'
                                                    }`}>
                                                    <Phone className={`w-4 h-4 ${log.type === 'inbound' ? 'text-green-600' :
                                                        log.type === 'outbound' ? 'text-blue-600' : 'text-red-600'
                                                        }`} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">
                                                        {log.type.charAt(0).toUpperCase() + log.type.slice(1)} Call
                                                    </p>
                                                    <p className="text-sm text-neutral-500">
                                                        {new Date(log.date).toLocaleString()} • {formatDuration(log.durationSeconds)}
                                                    </p>
                                                    {log.fromNumber && (
                                                        <p className="text-xs text-neutral-400 mt-1">
                                                            From: {getCountryByCode(log.fromCountry || '')?.flag} {log.fromNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getDispositionBadge(log.disposition)}
                                            </div>
                                        </div>
                                        {log.summary && (
                                            <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Sparkles className="w-3 h-3 text-red-500" />
                                                    <span className="text-xs font-semibold text-neutral-500 uppercase">AI Summary</span>
                                                </div>
                                                <p className="text-sm text-neutral-700">{log.summary}</p>
                                            </div>
                                        )}
                                        {log.recordingUrl && (
                                            <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Play className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs font-semibold text-neutral-500 uppercase">Recording</span>
                                                </div>
                                                <audio controls className="w-full mt-2" src={log.recordingUrl}>
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <div className="space-y-3">
                            {smsMessages.length === 0 ? (
                                <div className="text-center py-12 text-neutral-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No messages</p>
                                    <button
                                        onClick={onSMS}
                                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Send First Message
                                    </button>
                                </div>
                            ) : (
                                smsMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`p-4 rounded-xl ${msg.direction === 'outbound' ? 'bg-red-50 ml-8' : 'bg-neutral-50 mr-8'
                                            }`}
                                    >
                                        <p className="text-sm text-neutral-900">{msg.body}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-neutral-400">
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </span>
                                            <span className={`text-xs ${msg.status === 'delivered' ? 'text-green-600' :
                                                msg.status === 'failed' ? 'text-red-600' : 'text-neutral-400'
                                                }`}>
                                                {msg.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            {/* Add Note */}
                            <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note..."
                                    className="w-full p-3 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                    rows={3}
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            {/* Notes List */}
                            {notes.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No notes yet</p>
                                </div>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="p-4 border border-neutral-100 rounded-xl group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="text-neutral-900 whitespace-pre-wrap">{note.content}</p>
                                                <p className="text-xs text-neutral-400 mt-2">
                                                    {new Date(note.createdAt).toLocaleString()}
                                                    {new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime() && ' (edited)'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onDeleteNote(note.id)}
                                                className="p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-100"></div>
                            <div className="space-y-4">
                                {timelineItems.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-400">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No activity yet</p>
                                    </div>
                                ) : (
                                    timelineItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 pl-8 relative">
                                            <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${item.type === 'call' ? 'bg-green-500' :
                                                item.type === 'sms' ? 'bg-blue-500' : 'bg-purple-500'
                                                }`}></div>
                                            <div className="flex-1 p-4 bg-neutral-50 rounded-xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {item.type === 'call' ? <Phone className="w-4 h-4 text-green-600" /> :
                                                        item.type === 'sms' ? <MessageSquare className="w-4 h-4 text-blue-600" /> :
                                                            <FileText className="w-4 h-4 text-purple-600" />}
                                                    <span className="font-medium text-sm text-neutral-900">
                                                        {item.type === 'call' ? `${(item.data as CallLog).type} call` :
                                                            item.type === 'sms' ? `SMS ${(item.data as SMSMessage).direction}` :
                                                                'Note'}
                                                    </span>
                                                    <span className="text-xs text-neutral-400 ml-auto">
                                                        {item.date.toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-600">
                                                    {item.type === 'call' ?
                                                        `Duration: ${formatDuration((item.data as CallLog).durationSeconds)}` :
                                                        item.type === 'sms' ? (item.data as SMSMessage).body :
                                                            (item.data as ContactNote).content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Schedule Call Modal */}
                {showScheduleModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                            <h3 className="text-lg font-bold mb-4">Schedule a Call</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                    <textarea
                                        value={scheduleNotes}
                                        onChange={(e) => setScheduleNotes(e.target.value)}
                                        placeholder="What's this call about?"
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSchedule}
                                    disabled={!scheduleDate}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4 animate-in zoom-in-95">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Contact</h3>
                                <p className="text-neutral-600 mb-6">
                                    Are you sure you want to delete <strong>{contact.name}</strong>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (onDeleteContact) {
                                            onDeleteContact();
                                        }
                                        setShowDeleteModal(false);
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactDetail;
