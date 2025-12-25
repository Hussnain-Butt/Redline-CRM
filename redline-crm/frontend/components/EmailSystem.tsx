import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Inbox, Star, Trash2, Search, Plus, Sparkles, Paperclip,
    ChevronDown, X, Bold, Italic, List, Link, Image, MoreHorizontal,
    Clock, CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react';



import { emailApi, Email } from '../services/emailApi';

interface EmailSystemProps {
    initialData?: {
        to?: string;
        subject: string;
        body: string;
    };
}

const EmailSystem: React.FC<EmailSystemProps> = ({ initialData }) => {
    const [view, setView] = useState<'inbox' | 'compose'>('inbox');
    const [selectedFolder, setSelectedFolder] = useState<'sent' | 'drafts' | 'starred'>('sent');
    const [searchTerm, setSearchTerm] = useState('');
    const [emails, setEmails] = useState<Email[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Compose state
    const [composeTo, setComposeTo] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Initialize from props
    useEffect(() => {
        if (initialData) {
            setComposeSubject(initialData.subject || '');
            setComposeBody(initialData.body || '');
            if (initialData.to) setComposeTo(initialData.to);
            setView('compose');
        }
    }, [initialData]);

    useEffect(() => {
        loadEmails();
    }, []);

    const loadEmails = async () => {
        try {
            setIsLoading(true);
            const data = await emailApi.getAll();
            setEmails(data);
        } catch (error) {
            console.error('Failed to load emails:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!composeTo || !composeBody) {
            alert('Please fill in To and Body fields');
            return;
        }

        try {
            setIsSending(true);
            await emailApi.create({
                to: composeTo.split(',').map(e => e.trim()),
                subject: composeSubject,
                body: composeBody
            });
            await loadEmails();
            setView('inbox');
            setComposeTo('');
            setComposeSubject('');
            setComposeBody('');
            alert('Email sent successfully!');
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    const filteredEmails = emails.filter(email => {
        // Since backend might not have folders yet, we just show all in 'sent' for now if status is sent
        if (selectedFolder === 'sent') return email.status === 'sent';
        if (selectedFolder === 'drafts') return email.status === 'draft';
        return true;
    }).filter(email =>
        (email.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(email.to) ? email.to.join(' ') : email.to).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusIcon = (status: Email['status']) => {
        switch (status) {
            case 'sent':
                return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'failed':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-neutral-400" />;
        }
    };

    // Compose View
    if (view === 'compose') {
        return (
            <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setView('inbox')}
                                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold text-neutral-900">New Email</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleSend}
                                disabled={isSending}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-red-500/25 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {isSending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Compose Form */}
                <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
                    {/* To Field */}
                    <div className="flex items-center gap-4">
                        <label className="w-16 text-sm font-medium text-neutral-500">To:</label>
                        <input
                            type="email"
                            value={composeTo}
                            onChange={(e) => setComposeTo(e.target.value)}
                            placeholder="recipient@email.com"
                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    {/* Subject Field */}
                    <div className="flex items-center gap-4">
                        <label className="w-16 text-sm font-medium text-neutral-500">Subject:</label>
                        <input
                            type="text"
                            value={composeSubject}
                            onChange={(e) => setComposeSubject(e.target.value)}
                            placeholder="Email subject"
                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    {/* Body Field */}
                    <textarea
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        placeholder="Write your email..."
                        className="flex-1 min-h-[300px] px-4 py-3 border border-neutral-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>
        );
    }

    // Inbox View
    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-neutral-900">Email</h2>
                        <p className="text-sm text-neutral-500 mt-1">Manage your communications</p>
                    </div>
                    <button
                        onClick={() => setView('compose')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-red-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        Compose
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Folders */}
                <div className="w-48 border-r border-neutral-100 p-3 flex-shrink-0">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setSelectedFolder('sent')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${selectedFolder === 'sent'
                                ? 'bg-red-50 text-red-600 font-medium'
                                : 'text-neutral-600 hover:bg-neutral-50'
                                }`}
                        >
                            <Send className="w-4 h-4" />
                            <span>Sent</span>
                        </button>
                        <button
                            onClick={() => setSelectedFolder('drafts')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${selectedFolder === 'drafts'
                                ? 'bg-red-50 text-red-600 font-medium'
                                : 'text-neutral-600 hover:bg-neutral-50'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            <span>Drafts</span>
                        </button>
                    </nav>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredEmails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                            <Mail className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No emails found</p>
                            <p className="text-sm mt-1">Start composing your first email</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {filteredEmails.map(email => (
                                <div
                                    key={email.id}
                                    className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors cursor-pointer group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-neutral-900 truncate">
                                                {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                                            </p>
                                            <span className="text-xs text-neutral-400 flex-shrink-0 ml-4">
                                                {new Date(email.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-neutral-700 truncate">{email.subject}</p>
                                        <p className="text-sm text-neutral-500 truncate mt-0.5">{email.body}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(email.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailSystem;
