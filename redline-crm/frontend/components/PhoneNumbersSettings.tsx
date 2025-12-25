import React, { useState } from 'react';
import {
    Phone,
    Plus,
    Trash2,
    Edit2,
    Star,
    Check,
    X,
    MessageSquare,
    Globe,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { PhoneNumber, COUNTRIES, getCountryByCode } from '../types';
import {
    fetchTwilioPhoneNumbers,
    isTwilioConfigured,
    TwilioPhoneNumber
} from '../services/twilioService';

interface PhoneNumbersSettingsProps {
    phoneNumbers: PhoneNumber[];
    onAdd: (phoneNumber: Omit<PhoneNumber, 'id' | 'createdAt'>) => void;
    onUpdate: (id: string, updates: Partial<PhoneNumber>) => void;
    onDelete: (id: string) => void;
}

const PhoneNumbersSettings: React.FC<PhoneNumbersSettingsProps> = ({
    phoneNumbers,
    onAdd,
    onUpdate,
    onDelete
}) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [newNumber, setNewNumber] = useState({
        number: '',
        country: 'US',
        label: '',
        twilioSid: '',
        isDefault: false,
        canCall: true,
        canSMS: true
    });

    const handleAdd = () => {
        const country = getCountryByCode(newNumber.country);
        onAdd({
            ...newNumber,
            countryName: country?.name || '',
            isDefault: phoneNumbers.length === 0 ? true : newNumber.isDefault
        });
        setShowAddModal(false);
        setNewNumber({
            number: '',
            country: 'US',
            label: '',
            twilioSid: '',
            isDefault: false,
            canCall: true,
            canSMS: true
        });
    };

    const handleSetDefault = (id: string) => {
        onUpdate(id, { isDefault: true });
    };

    // Detect country from phone number
    const detectCountry = (phoneNumber: string): string => {
        if (phoneNumber.startsWith('+1')) return 'US';
        if (phoneNumber.startsWith('+44')) return 'GB';
        if (phoneNumber.startsWith('+61')) return 'AU';
        if (phoneNumber.startsWith('+49')) return 'DE';
        if (phoneNumber.startsWith('+33')) return 'FR';
        if (phoneNumber.startsWith('+81')) return 'JP';
        if (phoneNumber.startsWith('+86')) return 'CN';
        if (phoneNumber.startsWith('+91')) return 'IN';
        if (phoneNumber.startsWith('+66')) return 'TH';
        // Add more as needed
        return 'US'; // Default
    };

    // Sync phone numbers from Twilio
    const handleSyncFromTwilio = async () => {
        if (!isTwilioConfigured()) {
            setSyncError('Twilio is not configured. Add your credentials to .env.local');
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            const twilioNumbers = await fetchTwilioPhoneNumbers();

            // Add each Twilio number that doesn't already exist
            twilioNumbers.forEach((tn: TwilioPhoneNumber, index: number) => {
                const exists = phoneNumbers.some(p => p.twilioSid === tn.sid || p.number === tn.phoneNumber);
                if (!exists) {
                    const country = detectCountry(tn.phoneNumber);
                    const countryInfo = getCountryByCode(country);
                    onAdd({
                        number: tn.phoneNumber,
                        country,
                        countryName: countryInfo?.name || '',
                        label: tn.friendlyName,
                        twilioSid: tn.sid,
                        isDefault: phoneNumbers.length === 0 && index === 0,
                        canCall: tn.capabilities.voice,
                        canSMS: tn.capabilities.sms
                    });
                }
            });

            if (twilioNumbers.length === 0) {
                setSyncError('No phone numbers found in your Twilio account');
            }
        } catch (error: any) {
            setSyncError(error.message || 'Failed to sync from Twilio');
        } finally {
            setIsSyncing(false);
        }
    };

    const twilioConfigured = isTwilioConfigured();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Phone Numbers</h3>
                    <p className="text-sm text-neutral-500">Manage your Twilio phone numbers for calls and SMS</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncFromTwilio}
                        disabled={isSyncing || !twilioConfigured}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${twilioConfigured
                                ? 'border-neutral-300 hover:bg-neutral-50'
                                : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                        title={twilioConfigured ? 'Sync from Twilio' : 'Configure Twilio credentials first'}
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync from Twilio'}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Manual
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {syncError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{syncError}</span>
                    <button onClick={() => setSyncError(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Twilio Status */}
            {!twilioConfigured && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Twilio not configured. Add VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN to .env.local</span>
                </div>
            )}

            {/* Phone Numbers List */}
            <div className="space-y-3">
                {phoneNumbers.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                        <Globe className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 font-medium">No phone numbers configured</p>
                        <p className="text-sm text-neutral-400 mb-4">Add your Twilio phone numbers to start making calls</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-black transition-colors"
                        >
                            Add First Number
                        </button>
                    </div>
                ) : (
                    phoneNumbers.map(num => {
                        const country = getCountryByCode(num.country);
                        return (
                            <div
                                key={num.id}
                                className={`flex items-center justify-between p-4 bg-white border rounded-xl ${num.isDefault ? 'border-red-200 ring-1 ring-red-100' : 'border-neutral-200'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{country?.flag || '🌐'}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-neutral-900">{num.number}</p>
                                            {num.isDefault && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-sm text-neutral-500">{num.label || num.countryName}</p>
                                            <div className="flex items-center gap-1">
                                                {num.canCall && (
                                                    <span className="flex items-center gap-1 text-xs text-green-600">
                                                        <Phone className="w-3 h-3" /> Calls
                                                    </span>
                                                )}
                                                {num.canSMS && (
                                                    <span className="flex items-center gap-1 text-xs text-blue-600">
                                                        <MessageSquare className="w-3 h-3" /> SMS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!num.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(num.id)}
                                            className="p-2 text-neutral-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                                            title="Set as default"
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDelete(num.id)}
                                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Number Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-neutral-900">Add Phone Number</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                                <select
                                    value={newNumber.country}
                                    onChange={(e) => setNewNumber(prev => ({ ...prev, country: e.target.value }))}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.name} ({c.dialCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number *</label>
                                <input
                                    type="text"
                                    value={newNumber.number}
                                    onChange={(e) => setNewNumber(prev => ({ ...prev, number: e.target.value }))}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="+1-555-123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Label</label>
                                <input
                                    type="text"
                                    value={newNumber.label}
                                    onChange={(e) => setNewNumber(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Main USA Line"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Twilio SID (optional)</label>
                                <input
                                    type="text"
                                    value={newNumber.twilioSid}
                                    onChange={(e) => setNewNumber(prev => ({ ...prev, twilioSid: e.target.value }))}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newNumber.canCall}
                                        onChange={(e) => setNewNumber(prev => ({ ...prev, canCall: e.target.checked }))}
                                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-neutral-700">Can make calls</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newNumber.canSMS}
                                        onChange={(e) => setNewNumber(prev => ({ ...prev, canSMS: e.target.checked }))}
                                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-neutral-700">Can send SMS</span>
                                </label>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newNumber.isDefault}
                                    onChange={(e) => setNewNumber(prev => ({ ...prev, isDefault: e.target.checked }))}
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-neutral-700">Set as default number</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!newNumber.number}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Number
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneNumbersSettings;
