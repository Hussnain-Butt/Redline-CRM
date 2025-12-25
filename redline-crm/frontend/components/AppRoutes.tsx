import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Dialer from './components/Dialer';
import Contacts from './components/Contacts';
import ContactDetail from './components/ContactDetail';
import SMSInbox from './components/SMSInbox';
import EmailSystem from './components/EmailSystem';
import Templates from './components/Templates';
import Reminders from './components/Reminders';
import CallRecordings from './components/CallRecordings';
import PhoneNumbersSettings from './components/PhoneNumbersSettings';
import { CallLog, Contact, SMSMessage, PhoneNumber, ContactNote } from './types';

interface AppRoutesProps {
    // Data props
    callLogs: CallLog[];
    contacts: Contact[];
    allSMS: SMSMessage[];
    phoneNumbers: PhoneNumber[];
    selectedContact: Contact | null;
    contactCallLogs: CallLog[];
    contactSMS: SMSMessage[];
    contactNotes: ContactNote[];
    selectedPhoneNumber: PhoneNumber | null;
    activeNumber: string;
    dialerContactName: string;
    
    // Handlers
    onRefresh: () => void;
    onCallEnd: (log: CallLog) => void;
    onPhoneNumberSelect: (number: PhoneNumber | null) => void;
    onContactSelect: (contact: Contact) => void;
    onContactClose: () => void;
    onCall: (number: string) => void;
    onSMS: () => void;
    onGenerateEmail: () => void;
    onAddNote: (content: string) => void;
    onDeleteNote: (id: string) => void;
    onScheduleCall: (date: Date, notes: string) => void;
    onDeleteContact: () => void;
    onAddPhoneNumber: (phoneNumber: Omit<PhoneNumber, 'id' | 'createdAt'>) => void;
    onUpdatePhoneNumber: (id: string, updates: Partial<PhoneNumber>) => void;
    onDeletePhoneNumber: (id: string) => void;
    onSendSMS: (sms: Omit<SMSMessage, 'id' | 'timestamp' | 'twilioSid'>) => void;
}

const AppRoutes: React.FC<AppRoutesProps> = (props) => {
    return (
        <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route 
                path="/dashboard" 
                element={
                    <Dashboard 
                        logs={props.callLogs} 
                        contacts={props.contacts} 
                        sms={props.allSMS} 
                    />
                } 
            />
            
            {/* Dialer */}
            <Route 
                path="/dialer" 
                element={
                    <div className="h-full p-8 flex justify-center">
                        <div className="w-full max-w-4xl h-full">
                            <Dialer
                                onCallEnd={props.onCallEnd}
                                initialNumber={props.activeNumber}
                                phoneNumbers={props.phoneNumbers.filter(p => p.canCall)}
                                selectedPhoneNumber={props.selectedPhoneNumber}
                                onPhoneNumberSelect={props.onPhoneNumberSelect}
                                contactName={props.dialerContactName}
                                callHistory={props.callLogs}
                            />
                        </div>
                    </div>
                } 
            />
            
            {/* Contacts */}
            <Route 
                path="/contacts" 
                element={
                    <div className="h-full p-8">
                        <Contacts
                            contacts={props.contacts}
                            onSelectContact={props.onContactSelect}
                            onCall={props.onCall}
                            onSMS={props.onSMS}
                        />
                    </div>
                } 
            />
            
            {/* Messages */}
            <Route 
                path="/messages" 
                element={
                    <div className="h-full p-8">
                        <SMSInbox
                            messages={props.allSMS}
                            contacts={props.contacts}
                            phoneNumbers={props.phoneNumbers}
                            onSendSMS={props.onSendSMS}
                        />
                    </div>
                } 
            />
            
            {/* Email */}
            <Route 
                path="/email" 
                element={
                    <div className="h-full p-8">
                        <EmailSystem />
                    </div>
                } 
            />
            
            {/* Templates */}
            <Route 
                path="/templates" 
                element={
                    <div className="h-full p-8">
                        <Templates />
                    </div>
                } 
            />
            
            {/* Reminders */}
            <Route 
                path="/reminders" 
                element={
                    <div className="h-full p-8">
                        <Reminders />
                    </div>
                } 
            />
            
            {/* Call Recordings */}
            <Route 
                path="/recordings" 
                element={
                    <div className="h-full">
                        <CallRecordings callLogs={props.callLogs} onRefresh={props.onRefresh} />
                    </div>
                } 
            />
            
            {/* Settings */}
            <Route 
                path="/settings" 
                element={
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
                                    phoneNumbers={props.phoneNumbers}
                                    onAdd={props.onAddPhoneNumber}
                                    onUpdate={props.onUpdatePhoneNumber}
                                    onDelete={props.onDeletePhoneNumber}
                                />
                            </div>
                        </div>
                    </div>
                } 
            />
        </Routes>
    );
};

export default AppRoutes;
