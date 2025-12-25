import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, MessageSquare, Check } from 'lucide-react';
import { PhoneNumber, getCountryByCode } from '../types';

interface NumberSelectorProps {
    phoneNumbers: PhoneNumber[];
    selectedNumberId: string | null;
    onSelect: (phoneNumber: PhoneNumber) => void;
    mode?: 'call' | 'sms' | 'both';
    className?: string;
    compact?: boolean;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({
    phoneNumbers,
    selectedNumberId,
    onSelect,
    mode = 'both',
    className = '',
    compact = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter numbers based on mode
    const filteredNumbers = phoneNumbers.filter(num => {
        if (mode === 'call') return num.canCall;
        if (mode === 'sms') return num.canSMS;
        return true;
    });

    const selectedNumber = filteredNumbers.find(n => n.id === selectedNumberId) || filteredNumbers[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (filteredNumbers.length === 0) {
        return (
            <div className={`text-sm text-neutral-400 p-2 ${className}`}>
                No phone numbers configured
            </div>
        );
    }

    const getCountryFlag = (countryCode: string) => {
        const country = getCountryByCode(countryCode);
        return country?.flag || '🌐';
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'
                    } ${isOpen ? 'ring-2 ring-red-500 border-transparent' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(selectedNumber?.country || '')}</span>
                    {!compact && (
                        <div className="text-left">
                            <p className="text-sm font-medium text-neutral-900">{selectedNumber?.number}</p>
                            <p className="text-xs text-neutral-500">{selectedNumber?.label || selectedNumber?.countryName}</p>
                        </div>
                    )}
                    {compact && (
                        <span className="text-sm font-medium text-neutral-900">{selectedNumber?.number}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2 border-b border-neutral-100 bg-neutral-50">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                            {mode === 'call' ? 'Call From' : mode === 'sms' ? 'Send SMS From' : 'Select Number'}
                        </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filteredNumbers.map(num => {
                            const isSelected = num.id === selectedNumber?.id;
                            return (
                                <button
                                    key={num.id}
                                    onClick={() => {
                                        onSelect(num);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-red-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{getCountryFlag(num.country)}</span>
                                        <div className="text-left">
                                            <p className={`text-sm font-medium ${isSelected ? 'text-red-600' : 'text-neutral-900'}`}>
                                                {num.number}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-neutral-500">{num.label || num.countryName}</span>
                                                <div className="flex items-center gap-1">
                                                    {num.canCall && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                                            <Phone className="w-3 h-3 inline" />
                                                        </span>
                                                    )}
                                                    {num.canSMS && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                            <MessageSquare className="w-3 h-3 inline" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-red-600" />}
                                    {num.isDefault && !isSelected && (
                                        <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                                            Default
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NumberSelector;
