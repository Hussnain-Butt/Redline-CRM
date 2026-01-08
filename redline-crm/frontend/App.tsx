/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Phone,
    Users as UsersIcon,
    MessageSquare,
    Settings,
    Sparkles,
    LogOut,
    X,
    Upload,
    Plus,
    Globe,
    Mail,
    FileText,
    Bell,
    Mic,
    Lock,
    Unlock
} from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Dialer from './components/Dialer';
import Contacts from './components/Contacts';
import ContactDetail from './components/ContactDetail';
import SMSComposer from './components/SMSComposer';
import SMSInbox from './components/SMSInbox';
import PhoneNumbersSettings from './components/PhoneNumbersSettings';
import EmailSystem from './components/EmailSystem';
import Templates from './components/Templates';
import Reminders from './components/Reminders';
import CallRecordings from './components/CallRecordings';
import AIAssistant from './components/AIAssistant';
import LockScreen from './components/LockScreen';
import { ViewState, Contact, CallLog, Message, PhoneNumber, SMSMessage, ContactNote, getCountryByCode } from './types';
import { summarizeTranscript, generateEmailDraft } from './services/geminiService';
import {
    fetchTwilioPhoneNumbers,
    isTwilioConfigured,
    sendTwilioSMS,
    TwilioPhoneNumber
} from './services/twilioService';

// Lead Score Calculation
function calculateLeadScore(contact: Contact): number {
    let score = 0;
    if (contact.email) score += 10;
    if (contact.phone) score += 10;
    if (contact.company) score += 5;
    if (contact.status === 'Customer') score += 50;
    return score;
}
import { callApi } from './services/callApi';
import { contactApi } from './services/contactApi';
import { phoneNumberApi } from './services/phoneNumberApi';
import { smsApi } from './services/smsApi';
import { noteApi } from './services/noteApi';
import { scheduledCallApi } from './services/scheduledCallApi';
import * as settingsApi from './services/settingsApi';
import { reminderApi, Reminder } from './services/reminderApi';


export default function App() {
    // React Router
    const navigate = useNavigate();
    const location = useLocation();

    // App State
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('auth_token') === 'logged_in';
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
    const [allSMS, setAllSMS] = useState<SMSMessage[]>([]);
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<PhoneNumber | null>(null);
    const [isDbReady, setIsDbReady] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // Contact detail data
    const [contactCallLogs, setContactCallLogs] = useState<CallLog[]>([]);
    const [contactSMS, setContactSMS] = useState<SMSMessage[]>([]);
    const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);

    // Modal states
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState<{ subject: string, body: string } | null>(null);
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [lastCallSummary, setLastCallSummary] = useState<{ summary: string, log: CallLog } | null>(null);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showSMSComposer, setShowSMSComposer] = useState(false);

    // Form state
    const [newContact, setNewContact] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        status: 'Lead' as 'Lead' | 'Customer' | 'Churned',
        notes: ''
    });
    const [activeNumber, setActiveNumber] = useState<string>('');
    const [dialerContactName, setDialerContactName] = useState<string>('');

    // Email settings state
    const [emailSettings, setEmailSettings] = useState<settingsApi.EmailSettings>({
        SMTP_HOST: '',
        SMTP_PORT: '587',
        SMTP_USER: '',
        SMTP_PASS: '',
        EMAIL_FROM: '',
    });
    const [isSavingEmailSettings, setIsSavingEmailSettings] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [emailSettingsFeedback, setEmailSettingsFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Lock screen state
    const [isLocked, setIsLocked] = useState(false);
    const [lockPassword, setLockPassword] = useState('');
    const [lockError, setLockError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize and load data
    useEffect(() => {
        async function init() {
            await loadData();
            setIsDbReady(true);

            // Auto-sync phone numbers from Twilio if configured
            // Auto-sync phone numbers from Twilio via Backend
            try {
                const updatedNumbers = await phoneNumberApi.sync();
                if (updatedNumbers && updatedNumbers.length > 0) {
                    setPhoneNumbers(updatedNumbers);
                    
                    // Update selected phone number if not set or invalid
                    const currentSelectedExists = updatedNumbers.some(p => p.id === selectedPhoneNumber?.id);
                    if (!selectedPhoneNumber || !currentSelectedExists) {
                        const defaultNum = updatedNumbers.find(p => p.isDefault) || updatedNumbers[0];
                        if (defaultNum) setSelectedPhoneNumber(defaultNum);
                    }
                    console.log(`✅ Auto-synced ${updatedNumbers.length} phone number(s) from Twilio via Backend`);
                }
            } catch (error) {
                console.warn('⚠️ Twilio sync failed (backend might not have credentials):', error);
                // We don't block app load, just log warning
            }
        }
        init();
        init();
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem('auth_token', 'logged_in');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('auth_token');
    };



    // SMS Polling
    useEffect(() => {
        if (!isAuthenticated) return;
        const pollSMS = async () => {
             try {
                const backendSMS = await smsApi.getAll();
                setAllSMS(prev => {
                    if (prev.length !== backendSMS.length) return backendSMS;
                    if (prev.length > 0 && backendSMS.length > 0 && prev[prev.length-1].id !== backendSMS[backendSMS.length-1].id) return backendSMS;
                    return prev;
                });
            } catch (error) {
                 console.error("Failed to poll SMS:", error);
            }
        };

        pollSMS();
        const interval = setInterval(pollSMS, 5000);
        return () => clearInterval(interval);
    }, []);

    async function loadData() {
        // Load Phone Numbers from Backend
        try {
            const backendNumbers = await phoneNumberApi.getAll();
            setPhoneNumbers(backendNumbers);
        } catch (error) {
            console.error("Failed to load phone numbers from backend:", error);
        }

        // Load Contacts from Backend
        try {
            const backendContacts = await contactApi.getAll();
            setContacts(backendContacts);
        } catch (error) {
            console.error("Failed to load contacts from backend:", error);
        }

        // Load call logs from Backend
        try {
            const backendLogs = await callApi.getHistory();
            setCallLogs(backendLogs);
        } catch (error) {
            console.error("Failed to load call logs from backend:", error);
        }

        // Load reminders from Backend
        try {
            const backendReminders = await reminderApi.getAll();
            setReminders(backendReminders);
        } catch (error) {
            console.error("Failed to load reminders from backend:", error);
        }

        // Set default phone number (logic simplified)
    }

    // Load contact-specific data when contact is selected
    useEffect(() => {
        if (selectedContact) {
            async function fetchContactDetails() {
                try {
                    // Fetch logs (filtered from API or state - here using API for cleanliness or state if available)
                    // Since we have global logs, we can filter them, OR fetch specific if API supports it.
                    // For now, let's filter the local state if it's already loaded, or fetch if we want to be sure.
                    // However, we have API endpoints. Let's filter global state for now as callLogs are loaded globally.
                    // Actually, for Notes and ScheduledCalls, we definitely need to fetch.
                    
                    const notes = await noteApi.getByContactId(selectedContact.id);
                    setContactNotes(notes);

                    // SMS
                    // Assuming we have an endpoint or filtering global.
                    // If we want to move fully to backend, we should have getSMSByContactId
                    // But for now, let's filter the global allSMS state which is loaded from backend
                    const sms = allSMS.filter(m => m.contactId === selectedContact.id);
                    setContactSMS(sms);

                    // Call Logs
                    const logs = callLogs.filter(l => l.contactId === selectedContact.id);
                    setContactCallLogs(logs);

                    // Calculate Lead Score (Local calculation on the object)
                     // Note: We're not updating the DB here, just calculating for display or logic if needed
                } catch (e) {
                    console.error('Failed to load contact details:', e);
                }
            }
            fetchContactDetails();
        } else {
            setContactCallLogs([]);
            setContactSMS([]);
            setContactNotes([]);
        }
    }, [selectedContact, allSMS, callLogs]);

    const handleCallEnd = async (log: CallLog) => {
        const fullLog = {
            ...log,
            contactId: selectedContact?.id || 'unknown',
            fromNumber: selectedPhoneNumber?.number,
            fromCountry: selectedPhoneNumber?.country
        };

        // Save to backend
        try {
             // Map frontend CallLog to Backend DTO
             const savedLog = await callApi.createLog({
                contactId: fullLog.contactId !== 'unknown' ? fullLog.contactId : undefined,
                direction: fullLog.type === 'inbound' ? 'inbound' : 'outbound',
                status: 'completed',
                from: fullLog.fromNumber || '',
                to: fullLog.toNumber || '',
                duration: fullLog.durationSeconds,
                recordingUrl: fullLog.recordingUrl,
                transcription: fullLog.transcript,
                sid: fullLog.twilioCallSid,
                startTime: fullLog.date
             });
             
             setCallLogs(prev => [savedLog, ...prev]);
        } catch (error) {
            console.error("Failed to save call log to backend:", error);
            // Optionally save to local DB as fallback or show error
        }

        // Trigger AI Summary
        if (log.transcript) {
            const summary = await summarizeTranscript(log.transcript);
            setLastCallSummary({ summary, log: fullLog });
        }
    };

    const handleGenerateEmail = async () => {
        if (!selectedContact) return;
        setIsGeneratingEmail(true);
        const draft = await generateEmailDraft(selectedContact.name, "Follow up on our recent call regarding your account", "friendly but professional");
        setGeneratedEmail(draft);
        setIsGeneratingEmail(false);
        setShowEmailModal(true);
    };

    const handleAddContact = async () => {
        if (!newContact.name || !newContact.phone) return;

        try {
            const savedContact = await contactApi.create({
                name: newContact.name,
                phone: newContact.phone,
                email: newContact.email,
                company: newContact.company,
                status: newContact.status,
                notes: newContact.notes,
                lastContacted: new Date(),
                tags: [],
                score: 0,
                source: 'manual',
                createdAt: new Date()
            });

            setContacts(prev => [...prev, savedContact]);
            setNewContact({ name: '', phone: '', email: '', company: '', status: 'Lead', notes: '' });
            setShowAddContactModal(false);
        } catch (error) {
            console.error("Failed to create contact:", error);
            alert("Failed to create contact");
        }
    };

    // CSV Parser helper
    const parseContactsCSV = (text: string): any[] => {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const contacts = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if(!line) continue;
            const values = line.split(',');
            const contact: any = {};
            headers.forEach((h, index) => {
                contact[h] = values[index]?.trim();
            });
            contacts.push(contact);
        }
        return contacts;
    };

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const parsedContacts = parseContactsCSV(text);
            try {
                const importedCount = await contactApi.import(parsedContacts);
                loadData();
                setShowImportModal(false);
                alert(`Successfully imported ${importedCount} contacts!`);
            } catch (error) {
                console.error("Failed to import contacts:", error);
                alert("Failed to import contacts");
            }
        };

        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Phone number management
    const handleAddPhoneNumber = async (phoneNumber: Omit<PhoneNumber, 'id' | 'createdAt'>) => {
        try {
            const saved = await phoneNumberApi.create({
                ...phoneNumber,
                isDefault: phoneNumber.isDefault ? true : false,
                canCall: phoneNumber.canCall ? true : false,
                canSMS: phoneNumber.canSMS ? true : false
            });

            setPhoneNumbers(prev => [...prev, saved]);
            if (saved.isDefault || phoneNumbers.length === 0) {
                setSelectedPhoneNumber(saved);
            }
        } catch (error) {
            console.error("Failed to add phone number:", error);
            alert("Failed to add phone number");
        }
    };

    const handleUpdatePhoneNumber = async (id: string, updates: Partial<PhoneNumber>) => {
        try {
            await phoneNumberApi.update(id, updates);
            loadData();
        } catch (error) {
             console.error("Failed to update phone number:", error);
        }
    };

    const handleDeletePhoneNumber = async (id: string) => {
        try {
            await phoneNumberApi.delete(id);
            loadData();
        } catch (error) {
             console.error("Failed to delete phone number:", error);
        }
    };

    // SMS handling
    const handleSendSMS = async (sms: Omit<SMSMessage, 'id' | 'timestamp' | 'twilioSid'>) => {
        try {
            // First send via Twilio if configured
            let twilioSid = undefined;
            if (isTwilioConfigured()) {
                try {
                    const result = await sendTwilioSMS(sms.fromNumber, sms.toNumber, sms.body);
                    console.log('✅ SMS sent via Twilio:', result.sid);
                    twilioSid = result.sid;
                } catch (error) {
                    console.error('❌ Failed to send SMS via Twilio:', error);
                    alert('Failed to send SMS. Please check your Twilio configuration.');
                }
            } else {
                 console.warn('⚠️ Twilio not configured - SMS saved locally only');
            }
            
            // Save to backend
            const saved = await smsApi.create({
                ...sms,
                status: 'sent',
                twilioSid
            });
            setContactSMS(prev => [...prev, saved]);
        } catch (error) {
            console.error("Failed to send/save SMS:", error);
        }
    };

    // Notes handling
    const handleAddNote = async (content: string) => {
        if (!selectedContact) return;
        try {
            const saved = await noteApi.create({
                contactId: selectedContact.id,
                content,
                createdBy: 'user' // Placeholder
            });
            setContactNotes(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add note:", error);
            alert("Failed to add note");
        }
    };

    const handleDeleteNote = async (id: string) => {
        try {
            await noteApi.delete(id);
            setContactNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
             console.error("Failed to delete note:", error);
        }
    };

    // Schedule call
    const handleScheduleCall = async (date: Date, notes: string) => {
        if (!selectedContact) return;
        try {
            await scheduledCallApi.create({
                contactId: selectedContact.id,
                scheduledAt: date,
                notes,
                status: 'pending',
                reminderMinutes: 15
            });
            alert('Call scheduled!');
        } catch (error) {
            console.error("Failed to schedule call:", error);
            alert("Failed to schedule call");
        }
    };

    // Delete contact
    const handleDeleteContact = async () => {
        if (!selectedContact) return;
        try {
            await contactApi.delete(selectedContact.id);
            setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
            setSelectedContact(null);
        } catch (error) {
            console.error("Failed to delete contact:", error);
            alert("Failed to delete contact");
        }
    };

    // SMS send (global - for inbox)
    const handleSendSMSGlobal = async (sms: Omit<SMSMessage, 'id' | 'timestamp' | 'twilioSid'>) => {
        try {
            // Send via Twilio API if configured (Frontend call for now)
            let twilioSid = undefined;
            if (isTwilioConfigured()) {
                try {
                    const result = await sendTwilioSMS(sms.fromNumber, sms.toNumber, sms.body);
                    console.log('✅ SMS sent via Twilio:', result.sid);
                    twilioSid = result.sid;
                } catch (error) {
                    console.error('❌ Failed to send SMS via Twilio:', error);
                    alert('Failed to send SMS. Please check your Twilio configuration.');
                }
            } else {
                 console.warn('⚠️ Twilio not configured - SMS saved locally only');
            }

            // Save to backend
            const saved = await smsApi.create({
                ...sms,
                status: 'sent',
                twilioSid
            });
            setAllSMS(prev => [...prev, saved]);
        } catch (error) {
            console.error("Failed to save global SMS:", error);
        }
    };

    // Email settings handlers
    const loadEmailSettings = async () => {
        try {
            const settings = await settingsApi.getEmailSettings();
            setEmailSettings(settings);
        } catch (error) {
            console.error("Failed to load email settings:", error);
        }
    };

    const handleSaveEmailSettings = async () => {
        setIsSavingEmailSettings(true);
        setEmailSettingsFeedback(null);
        
        try {
            await settingsApi.updateEmailSettings(emailSettings);
            setEmailSettingsFeedback({
                type: 'success',
                message: 'Email settings saved successfully! ✅'
            });
            setTimeout(() => setEmailSettingsFeedback(null), 5000);
        } catch (error: any) {
            setEmailSettingsFeedback({
                type: 'error',
                message: error.message || 'Failed to save email settings'
            });
        } finally {
            setIsSavingEmailSettings(false);
        }
    };

    const handleTestEmailConnection = async () => {
        setIsTestingConnection(true);
        setEmailSettingsFeedback(null);
        
        try {
            const result = await settingsApi.testEmailConnection(emailSettings);
            setEmailSettingsFeedback({
                type: result.success ? 'success' : 'error',
                message: result.message
            });
            setTimeout(() => setEmailSettingsFeedback(null), 5000);
        } catch (error: any) {
            setEmailSettingsFeedback({
                type: 'error',
                message: error.message || 'Connection test failed'
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    // Load email settings on mount
    useEffect(() => {
        loadEmailSettings();
    }, []);

    // Lock screen handlers
    const handleLockScreen = () => {
        setIsLocked(true);
        setLockPassword('');
        setLockError('');
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (lockPassword === 'Password') {
            setIsLocked(false);
            setLockPassword('');
            setLockError('');
        } else {
            setLockError('Incorrect password');
            setLockPassword('');
        }
    };

    const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
        const isActive = location.pathname === path;
        
        return (
            <button
                onClick={() => {
                    navigate(path);
                    setSelectedContact(null);
                    setShowSMSComposer(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
            >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-red-500'}`} />
                <span className="font-medium">{label}</span>
            </button>
        );
    };

    if (!isDbReady) {
        return (
            <div className="flex h-screen items-center justify-center bg-neutral-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading RedLine CRM...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-neutral-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 bg-gradient-to-b from-neutral-900 to-neutral-950 text-white flex flex-col h-screen overflow-y-auto">
                {/* Logo */}
                <div className="p-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
                            <span className="text-xl font-bold">R</span>
                        </div>
                        <h1 className="text-xl font-bold">RedLine</h1>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-6">
                    <nav className="space-y-1">
                        <NavItem path="/" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem path="/dialer" icon={Phone} label="Phone" />
                        <NavItem path="/contacts" icon={UsersIcon} label="Contacts" />
                        <NavItem path="/messages" icon={MessageSquare} label="Messages" />
                        <NavItem path="/email" icon={Mail} label="Email" />
                        <NavItem path="/templates" icon={FileText} label="Templates" />
                        <NavItem path="/reminders" icon={Bell} label="Reminders" />
                        <NavItem path="/recordings" icon={Mic} label="Recordings" />
                        <NavItem path="/settings" icon={Settings} label="Settings" />
                    </nav>

                    {/* Phone Number Indicator */}
                    {selectedPhoneNumber && (
                        <div className="mt-6 p-3 bg-neutral-800 rounded-xl">
                            <p className="text-xs text-neutral-400 mb-1">Active Number</p>
                            <div className="flex items-center gap-2">
                                <span>{getCountryByCode(selectedPhoneNumber.country)?.flag}</span>
                                <span className="text-sm font-medium truncate">{selectedPhoneNumber.number}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile & Actions */}
                <div className="p-6 border-t border-neutral-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neutral-700 to-neutral-600 border-2 border-neutral-500"></div>
                        <div>
                            <p className="text-sm font-semibold">Admin User</p>
                            <p className="text-xs text-neutral-500">{phoneNumbers.length} numbers</p>
                        </div>
                    </div>

                    {/* Quick Caller ID Toggle */}
                    <button
                        onClick={() => {
                            if (phoneNumbers.length <= 1) return;
                            const currentIndex = phoneNumbers.findIndex(p => p.id === selectedPhoneNumber?.id);
                            const nextIndex = (currentIndex + 1) % phoneNumbers.length;
                            setSelectedPhoneNumber(phoneNumbers[nextIndex]);
                        }}
                        disabled={phoneNumbers.length <= 1}
                        className={`w-full flex items-center justify-between gap-2 p-3 mb-3 rounded-xl transition-all group shadow-lg ${
                            phoneNumbers.length <= 1 
                                ? 'bg-gradient-to-r from-neutral-600 to-neutral-500 opacity-50 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-900/30'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-white" />
                            <div className="text-left">
                                <p className="text-xs text-blue-100 font-medium">
                                    {phoneNumbers.length <= 1 ? 'Add More Numbers' : 'Quick Switch'}
                                </p>
                                <p className="text-sm text-white font-semibold truncate max-w-[140px]">
                                    {selectedPhoneNumber?.number || 'No Number'}
                                </p>
                            </div>
                        </div>
                        <div className={`w-6 h-6 bg-white/20 rounded-full flex items-center justify-center transition-transform duration-300 ${
                            phoneNumbers.length > 1 ? 'group-hover:rotate-180' : ''
                        }`}>
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                    </button>
                    
                    <button 
                        onClick={handleLockScreen}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm mb-2"
                    >
                        <Lock className="w-4 h-4" />
                        <span>Lock Screen</span>
                    </button>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col min-w-0">

                {/* Add Contact Modal */}
                {showAddContactModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-neutral-900">Add New Contact</h2>
                                <button onClick={() => setShowAddContactModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone *</label>
                                    <input
                                        type="text"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="+1-555-0123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="john@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={newContact.company}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Acme Inc"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                                    <select
                                        value={newContact.status}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, status: e.target.value as 'Lead' | 'Customer' | 'Churned' }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="Lead">Lead</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Churned">Churned</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                                    <textarea
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-20 resize-none"
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddContactModal(false)}
                                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddContact}
                                    disabled={!newContact.name || !newContact.phone}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add Contact
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Import Contacts Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-neutral-900">Import Contacts</h2>
                                <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center">
                                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                                <p className="text-neutral-600 mb-2">Upload a CSV file with your contacts</p>
                                <p className="text-sm text-neutral-400 mb-4">Columns: name, phone, email, company, status, notes</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleImportCSV}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                                >
                                    Select CSV File
                                </label>
                            </div>

                            <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                                <p className="text-sm font-medium text-neutral-700 mb-2">Example CSV format:</p>
                                <code className="text-xs text-neutral-600 block">
                                    name,phone,email,company,status<br />
                                    John Doe,+1-555-0123,john@test.com,Acme Inc,Lead
                                </code>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Detail Overlay */}
                {selectedContact && !showSMSComposer && (
                    <ContactDetail
                        contact={selectedContact}
                        callLogs={contactCallLogs}
                        smsMessages={contactSMS}
                        notes={contactNotes}
                        phoneNumbers={phoneNumbers}
                        onClose={() => setSelectedContact(null)}
                        onCall={(num) => {
                            setActiveNumber(num);
                            setDialerContactName(selectedContact.name);
                            setCurrentView(ViewState.DIALER);
                            setSelectedContact(null);
                        }}
                        onSMS={() => setShowSMSComposer(true)}
                        onGenerateEmail={handleGenerateEmail}
                        onAddNote={handleAddNote}
                        onDeleteNote={handleDeleteNote}
                        onScheduleCall={handleScheduleCall}
                        onDeleteContact={handleDeleteContact}
                    />
                )}

                {/* SMS Composer Overlay */}
                {selectedContact && showSMSComposer && (
                    <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex justify-end">
                        <div className="w-full max-w-xl h-full">
                            <SMSComposer
                                contact={selectedContact}
                                phoneNumbers={phoneNumbers.filter(p => p.canSMS)}
                                selectedPhoneNumber={selectedPhoneNumber}
                                onPhoneNumberSelect={setSelectedPhoneNumber}
                                onSend={handleSendSMS}
                                onClose={() => setShowSMSComposer(false)}
                                messages={contactSMS}
                            />
                        </div>
                    </div>
                )}

                {/* Email Modal */}
                {showEmailModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-red-500" />
                                    AI Generated Draft
                                </h3>
                                <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {isGeneratingEmail ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                                    <div className="h-20 bg-neutral-100 rounded w-full"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 uppercase">Subject</label>
                                        <input type="text" className="w-full p-2 border border-neutral-200 rounded font-medium text-neutral-900" value={generatedEmail?.subject} readOnly />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-400 uppercase">Body</label>
                                        <textarea className="w-full p-2 border border-neutral-200 rounded h-40 text-neutral-700 resize-none" value={generatedEmail?.body} readOnly />
                                    </div>
                                    <button className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700">Send via Email</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Global Alert for AI Summary */}
                {lastCallSummary && (
                    <div className="absolute top-4 right-4 z-50 w-80 bg-neutral-900 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-top duration-500 border-l-4 border-red-500">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-red-500" />
                                <span className="font-bold text-sm">Call Analyzed</span>
                            </div>
                            <button onClick={() => setLastCallSummary(null)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed">{lastCallSummary.summary}</p>
                    </div>
                )}

                {/* Routes */}
                <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={
                        <Dashboard 
                            logs={callLogs} 
                            contacts={contacts} 
                            sms={allSMS}
                            reminders={reminders}
                            onNavigateToReminders={() => navigate('/reminders')}
                        />
                    } />

                    {/* Dialer */}
                    <Route path="/dialer" element={
                        <div className="h-full p-8 flex justify-center">
                            <div className="w-full max-w-4xl h-full">
                                <Dialer
                                    onCallEnd={handleCallEnd}
                                    initialNumber={activeNumber}
                                    phoneNumbers={phoneNumbers.filter(p => p.canCall)}
                                    selectedPhoneNumber={selectedPhoneNumber}
                                    onPhoneNumberSelect={setSelectedPhoneNumber}
                                    contactName={dialerContactName}
                                    callHistory={callLogs}
                                />
                            </div>
                        </div>
                    } />

                    {/* Contacts */}
                    <Route path="/contacts" element={
                        <div className="h-full p-8">
                            <Contacts
                                contacts={contacts}
                                onSelectContact={setSelectedContact}
                                onCall={(num) => { setActiveNumber(num); setDialerContactName(''); navigate('/dialer'); }}
                                onMessage={(c) => { setSelectedContact(c); setShowSMSComposer(true); }}
                                onAddContact={() => setShowAddContactModal(true)}
                                onImportContacts={() => setShowImportModal(true)}
                                onEmail={(contact) => {
                                    setGeneratedEmail({ subject: '', body: '' });
                                    navigate('/email');
                                }}
                            />
                        </div>
                    } />

                    {/* Messages */}
                    <Route path="/messages" element={
                        <div className="h-full p-8">
                            <SMSInbox
                                contacts={contacts}
                                allMessages={allSMS}
                                phoneNumbers={phoneNumbers.filter(p => p.canSMS)}
                                selectedPhoneNumber={selectedPhoneNumber}
                                onPhoneNumberSelect={setSelectedPhoneNumber}
                                onSendSMS={handleSendSMSGlobal}
                                onSelectContact={setSelectedContact}
                            />
                        </div>
                    } />

                    {/* Email */}
                    <Route path="/email" element={
                        <div className="h-full p-8">
                            <EmailSystem 
                                initialData={generatedEmail ? { subject: generatedEmail.subject, body: generatedEmail.body } : undefined}
                            />
                        </div>
                    } />

                    {/* Templates */}
                    <Route path="/templates" element={
                        <div className="h-full p-8">
                            <Templates 
                                onUseTemplate={(template) => {
                                    setGeneratedEmail({
                                        subject: template.subject || '',
                                        body: template.content
                                    });
                                    navigate('/email');
                                }}
                            />
                        </div>
                    } />

                    {/* Reminders */}
                    <Route path="/reminders" element={
                        <div className="h-full p-8">
                            <Reminders />
                        </div>
                    } />

                    {/* Recordings */}
                    <Route path="/recordings" element={
                        <div className="h-full p-8">
                            <CallRecordings callLogs={callLogs} onRefresh={loadData} />
                        </div>
                    } />

                    {/* Settings */}
                    <Route path="/settings" element={
                        <div className="h-full overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100">
                            {/* Premium Header */}
                            <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 px-8 py-10">
                                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                                <p className="text-neutral-400">Manage your account and preferences</p>
                            </div>

                            <div className="max-w-3xl mx-auto p-8 space-y-6 -mt-6">
                            {/* Phone Numbers Section */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg">
                                <PhoneNumbersSettings
                                    phoneNumbers={phoneNumbers}
                                    onAdd={handleAddPhoneNumber}
                                    onUpdate={handleUpdatePhoneNumber}
                                    onDelete={handleDeletePhoneNumber}
                                />
                            </div>

                            {/* API Connections */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-900">API Connections</h2>
                                        <p className="text-sm text-neutral-500">External service integrations</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    {/* Twilio */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                                <Phone className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-900">Twilio</p>
                                                <p className="text-sm text-neutral-500">Voice calls & SMS messaging</p>
                                            </div>
                                        </div>
                                        {import.meta.env.VITE_TWILIO_ACCOUNT_SID && import.meta.env.VITE_TWILIO_ACCOUNT_SID !== 'your_account_sid_here' ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-sm font-medium">Connected</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                                <span className="text-sm font-medium">Not Configured</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ElevenLabs */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-900">ElevenLabs</p>
                                                <p className="text-sm text-neutral-500">AI voice synthesis</p>
                                            </div>
                                        </div>
                                        {import.meta.env.VITE_ELEVENLABS_API_KEY && import.meta.env.VITE_ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here' ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-sm font-medium">Connected</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                                <span className="text-sm font-medium">Not Configured</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Google Gemini */}
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-neutral-900">Google Gemini</p>
                                                <p className="text-sm text-neutral-500">AI summaries & insights</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-medium">Connected</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-neutral-400 mt-4 pt-4 border-t border-neutral-100">
                                    Configure API keys in your .env.local file to enable these features.
                                </p>
                            </div>

                            {/* Email Credentials Section */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-900">Email Credentials</h2>
                                        <p className="text-sm text-neutral-500">Configure SMTP settings for email sending</p>
                                    </div>
                                </div>

                                {/* Feedback Message */}
                                {emailSettingsFeedback && (
                                    <div className={`mb-4 p-3 rounded-lg border ${
                                        emailSettingsFeedback.type === 'success' 
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                            : 'bg-red-50 border-red-200 text-red-700'
                                    }`}>
                                        <p className="text-sm font-medium">{emailSettingsFeedback.message}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {/* SMTP Host */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            SMTP Host *
                                        </label>
                                        <input
                                            type="text"
                                            value={emailSettings.SMTP_HOST}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, SMTP_HOST: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>

                                    {/* SMTP Port */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            SMTP Port *
                                        </label>
                                        <input
                                            type="text"
                                            value={emailSettings.SMTP_PORT}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, SMTP_PORT: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="587"
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">Use 587 for TLS or 465 for SSL</p>
                                    </div>

                                    {/* SMTP User (Email) */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            SMTP User (Email) *
                                        </label>
                                        <input
                                            type="email"
                                            value={emailSettings.SMTP_USER}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, SMTP_USER: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="your-email@gmail.com"
                                        />
                                    </div>

                                    {/* SMTP Password (App Password) */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            SMTP Password (App Password) *
                                        </label>
                                        <input
                                            type="password"
                                            value={emailSettings.SMTP_PASS}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, SMTP_PASS: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="••••••••••••••••"
                                        />
                                        <p className="text-xs text-neutral-500 mt-1">
                                            For Gmail, use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">App Password</a>
                                        </p>
                                    </div>

                                    {/* From Email (Optional) */}
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                                            From Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={emailSettings.EMAIL_FROM}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, EMAIL_FROM: e.target.value }))}
                                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Defaults to SMTP User if empty"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleTestEmailConnection}
                                            disabled={isTestingConnection || !emailSettings.SMTP_HOST || !emailSettings.SMTP_USER || !emailSettings.SMTP_PASS}
                                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-neutral-700"
                                        >
                                            {isTestingConnection ? 'Testing...' : 'Test Connection'}
                                        </button>
                                        <button
                                            onClick={handleSaveEmailSettings}
                                            disabled={isSavingEmailSettings || !emailSettings.SMTP_HOST || !emailSettings.SMTP_USER || !emailSettings.SMTP_PASS}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-red-500/20"
                                        >
                                            {isSavingEmailSettings ? 'Saving...' : 'Save Credentials'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Call Settings */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-900">Call Settings</h2>
                                        <p className="text-sm text-neutral-500">Configure call behavior</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors">
                                        <div>
                                            <p className="font-medium text-neutral-900">Call Recording</p>
                                            <p className="text-sm text-neutral-500">Automatically record all calls</p>
                                        </div>
                                        <button className="w-14 h-7 bg-gradient-to-r from-red-500 to-orange-500 rounded-full relative cursor-pointer shadow-lg shadow-red-500/20 transition-all">
                                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors">
                                        <div>
                                            <p className="font-medium text-neutral-900">AI Call Summary</p>
                                            <p className="text-sm text-neutral-500">Generate AI summaries after each call</p>
                                        </div>
                                        <button className="w-14 h-7 bg-gradient-to-r from-red-500 to-orange-500 rounded-full relative cursor-pointer shadow-lg shadow-red-500/20 transition-all">
                                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors">
                                        <div>
                                            <p className="font-medium text-neutral-900">Auto-Transcription</p>
                                            <p className="text-sm text-neutral-500">Convert calls to text automatically</p>
                                        </div>
                                        <button className="w-14 h-7 bg-neutral-200 rounded-full relative cursor-pointer transition-all">
                                            <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
                                        <p className="text-sm text-neutral-500">Manage alerts and reminders</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors">
                                        <div>
                                            <p className="font-medium text-neutral-900">Desktop Notifications</p>
                                            <p className="text-sm text-neutral-500">Show browser notifications</p>
                                        </div>
                                        <button className="w-14 h-7 bg-gradient-to-r from-red-500 to-orange-500 rounded-full relative cursor-pointer shadow-lg shadow-red-500/20 transition-all">
                                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-xl transition-colors">
                                        <div>
                                            <p className="font-medium text-neutral-900">Sound Alerts</p>
                                            <p className="text-sm text-neutral-500">Play sound on incoming calls</p>
                                        </div>
                                        <button className="w-14 h-7 bg-gradient-to-r from-red-500 to-orange-500 rounded-full relative cursor-pointer shadow-lg shadow-red-500/20 transition-all">
                                            <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-red-100 rounded-xl text-red-600">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
                                        <p className="text-sm text-neutral-500">Irreversible actions</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                    <div>
                                        <p className="font-medium text-neutral-900">Clear All Data</p>
                                        <p className="text-sm text-neutral-500">Delete all contacts, calls, and messages</p>
                                    </div>
                                    <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
                                        Clear Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                } />
                </Routes>

            </main>

            {/* AI Assistant Floating Widget */}
            <AIAssistant />

            {/* Professional 3D Lock Screen */}
            <LockScreen
                isLocked={isLocked}
                password={lockPassword}
                error={lockError}
                onPasswordChange={setLockPassword}
                onUnlock={handleUnlock}
                onErrorClear={() => setLockError('')}
            />
        </div>
    );
}
