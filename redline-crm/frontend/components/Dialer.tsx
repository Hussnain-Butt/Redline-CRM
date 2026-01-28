import React, { useState, useEffect, useRef } from 'react';
import { Phone, Delete, Mic, MicOff, PhoneOff, User, MoreVertical, Archive, ChevronDown, AlertCircle, Loader2, Volume2, Search, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { CallLog, PhoneNumber, getCountryByCode, COUNTRIES, parsePhoneNumber } from '../types';
import NumberSelector from './NumberSelector';
import { useCallContext } from '../contexts/CallContext';

// DTMF frequency pairs for dial tones
const DTMF_FREQUENCIES: { [key: string]: [number, number] } = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

interface DialerProps {
  onCallEnd: (log: CallLog) => void;
  initialNumber?: string;
  phoneNumbers: PhoneNumber[];
  selectedPhoneNumber: PhoneNumber | null;
  onPhoneNumberSelect: (phoneNumber: PhoneNumber) => void;
  contactName?: string;
  callHistory?: CallLog[];
}

type ViewMode = 'dialer' | 'history';

const Dialer: React.FC<DialerProps> = ({
  onCallEnd,
  initialNumber = '',
  phoneNumbers,
  selectedPhoneNumber,
  onPhoneNumberSelect,
  contactName,
  callHistory = []
}) => {
  // Use global CallContext for persistent call state
  const {
    callStatus,
    duration,
    isMuted,
    isRecording,
    deviceReady,
    callError,
    voiceSDKAvailable,
    incomingCall,
    makeCall,
    hangupCall,
    muteToggle,
    acceptIncomingCall,
    rejectIncomingCall,
    sendDTMF,
    clearError,
    activeCallInfo,
  } = useCallContext();

  // Local UI state (not call-related)
  const [number, setNumber] = useState(initialNumber);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dialer');

  // Audio context for DTMF tones
  const audioContextRef = useRef<AudioContext | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const ringtoneOscillatorsRef = useRef<any[]>([]);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Initialize AudioContext on first user interaction
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Play DTMF tone for a digit
  const playDTMFTone = (digit: string) => {
    const frequencies = DTMF_FREQUENCIES[digit];
    if (!frequencies) return;

    try {
      const ctx = getAudioContext();
      const toneDuration = 0.15;
      const time = ctx.currentTime;

      frequencies.forEach(freq => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + toneDuration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(time);
        oscillator.stop(time + toneDuration);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Handle initial number from props - auto-detect country code
  useEffect(() => {
    if (initialNumber) {
      // Use parsePhoneNumber for proper country detection (longer codes first)
      const { country, localNumber } = parsePhoneNumber(initialNumber);
      if (country) {
        setSelectedCountry(country);
        setNumber(localNumber);
      } else {
        // No country detected, just set the number as-is
        setNumber(initialNumber.replace(/[^\d]/g, ''));
      }
    }
  }, [initialNumber]);

  // Report call end to parent when call ends
  useEffect(() => {
    if (callStatus === 'idle' || callStatus === 'ready') {
      if (callStartTimeRef.current) {
        // Call just ended
        const log: CallLog = {
          id: Math.random().toString(36).substr(2, 9),
          contactId: 'unknown',
          date: callStartTimeRef.current,
          durationSeconds: duration,
          type: 'outbound',
          fromNumber: selectedPhoneNumber?.number,
          fromCountry: selectedPhoneNumber?.country,
          toNumber: getFullNumber(),
        };
        onCallEnd(log);
        callStartTimeRef.current = null;
      }
    }
  }, [callStatus]);

  // Track call start
  useEffect(() => {
    if (callStatus === 'calling' && !callStartTimeRef.current) {
      callStartTimeRef.current = new Date();
    }
  }, [callStatus]);

  const playRingtone = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      
      for (let i = 0; i < 10; i++) {
        const time = now + (i * 6);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.setValueAtTime(0.1, time + 2);
        gain.gain.setValueAtTime(0, time + 2.1);
      }

      osc1.start();
      osc2.start();
      ringtoneOscillatorsRef.current = [osc1, osc2, gain];
    } catch (e) {
      console.warn("Failed to play ringtone", e);
    }
  };

  const stopRingtone = () => {
    ringtoneOscillatorsRef.current.forEach(node => {
      try {
        node.stop && node.stop();
        node.disconnect && node.disconnect();
      } catch(e){}
    });
    ringtoneOscillatorsRef.current = [];
  };

  const handleDigit = (digit: string) => {
    if (callStatus === 'idle' || callStatus === 'ready') {
      playDTMFTone(digit);
      setNumber(prev => prev + digit);
    } else if (callStatus === 'connected') {
      sendDTMF(digit);
      playDTMFTone(digit);
    }
  };

  const getFullNumber = () => {
    return `${selectedCountry.dialCode}${number}`;
  };

  const handleCall = async () => {
    console.log('🔘 Call button clicked');
    console.log('📋 Current state:', {
      number,
      selectedPhoneNumber,
      phoneNumbers,
      deviceReady,
      callStatus,
      voiceSDKAvailable
    });

    if (!number) {
      console.warn('❌ No number entered');
      return;
    }

    if (!selectedPhoneNumber) {
      console.error('❌ No phone number selected for calling');
      console.error('Available phone numbers:', phoneNumbers);
      return;
    }

    const toNumber = getFullNumber();
    const fromNumber = selectedPhoneNumber.number;
    
    console.log(`📞 Initiating call: ${fromNumber} → ${toNumber}`);
    
    // Only use contactName if we're calling the original number we navigated here with
    // This prevents stale contact names when user dials a different number
    const effectiveContactName = (initialNumber && toNumber.includes(initialNumber.replace(/[^0-9]/g, ''))) 
      ? contactName 
      : undefined;
    
    playRingtone();
    await makeCall(toNumber, fromNumber, effectiveContactName);
  };

  const handleHangup = () => {
    stopRingtone();
    hangupCall();
  };

  const handleAcceptCall = async () => {
    stopRingtone();
    await acceptIncomingCall();
  };

  const handleRejectCall = () => {
    stopRingtone();
    rejectIncomingCall();
  };

  const handleMuteToggle = () => {
    muteToggle();
  };

  // Stop ringtone when call connects or ends
  useEffect(() => {
    if (callStatus === 'connected' || callStatus === 'idle' || callStatus === 'ready') {
      stopRingtone();
    }
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCallerIdDisplay = () => {
    if (!selectedPhoneNumber) return 'No number selected';
    const country = getCountryByCode(selectedPhoneNumber.country);
    return `${country?.flag || ''} ${selectedPhoneNumber.number}`;
  };

  const getStatusDisplay = () => {
    switch (callStatus) {
      case 'calling': return 'Connecting...';
      case 'ringing': return 'Ringing...';
      case 'connected': return formatTime(duration);
      case 'disconnecting': return 'Ending call...';
      default: return '';
    }
  };

  // Get display number - use activeCallInfo when in call, otherwise use local input
  const getDisplayNumber = () => {
    // If we have active call info, use that (this persists across navigation)
    if (activeCallInfo?.toNumber) {
      return activeCallInfo.toNumber;
    }
    // Otherwise use local state (for dialing)
    return getFullNumber();
  };

  // Get display name - use activeCallInfo when in call
  const getDisplayName = () => {
    if (activeCallInfo?.contactName) {
      return activeCallInfo.contactName;
    }
    return contactName;
  };


  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'outbound': return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case 'missed': return <PhoneMissed className="w-4 h-4 text-red-500" />;
      default: return <Phone className="w-4 h-4 text-neutral-400" />;
    }
  };

  const dialFromHistory = (log: CallLog) => {
    if (log.toNumber) {
      const { country, localNumber } = parsePhoneNumber(log.toNumber);
      if (country) {
        setSelectedCountry(country);
        setNumber(localNumber);
      } else {
        setNumber(log.toNumber.replace(/[^\d]/g, ''));
      }
    }
    setViewMode('dialer');
  };

  // Incoming Call Overlay
  if (incomingCall) {
    return (
      <div className="h-full flex flex-col items-center justify-between py-12 bg-neutral-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neutral-900 to-black z-0"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-600 rounded-full blur-[120px] opacity-20 animate-pulse pointer-events-none"></div>

        <div className="z-10 flex flex-col items-center mt-12 space-y-4">
          <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-700 shadow-xl animate-bounce">
            <PhoneIncoming className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Incoming Call</h2>
          <p className="text-xl text-white font-medium">{incomingCall.parameters?.From || 'Unknown'}</p>
          <p className="text-neutral-400">RedLine CRM</p>
        </div>

        <div className="z-10 w-full max-w-md px-8 mb-8 flex items-center justify-center gap-8">
          <button
            onClick={handleRejectCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:bg-red-500 transition-all active:scale-95">
              <PhoneOff className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-medium text-red-500">Decline</span>
          </button>

          <button
            onClick={handleAcceptCall}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-900/50 group-hover:bg-green-500 transition-all active:scale-95 animate-pulse">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-medium text-green-500">Answer</span>
          </button>
        </div>
      </div>
    );
  }

  // In-call view
  if (callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected' || callStatus === 'disconnecting') {
    return (
      <div className="h-full flex flex-col items-center justify-between py-12 bg-neutral-900 text-white rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neutral-900 to-black z-0"></div>
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="z-10 flex flex-col items-center mt-12 space-y-4">
          <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-700 shadow-xl">
            {getDisplayName() ? (
              <span className="text-4xl font-bold">{getDisplayName()!.charAt(0)}</span>
            ) : (
              <User className="w-16 h-16 text-neutral-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{getDisplayName() || getDisplayNumber()}</h2>
          {getDisplayName() && <p className="text-neutral-400">{getDisplayNumber()}</p>}
          <p className="text-red-500 font-medium animate-pulse">
            {getStatusDisplay()}
          </p>

          {callStatus === 'connected' && voiceSDKAvailable && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-900/50 rounded-full">
              <Volume2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">Audio Active</span>
            </div>
          )}

          {callStatus === 'connected' && !voiceSDKAvailable && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 border border-amber-900/50 rounded-full">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-semibold">REST API Mode (No Audio)</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800/50 rounded-full">
            <span className="text-xs text-neutral-400">From:</span>
            <span className="text-sm font-medium">{getCallerIdDisplay()}</span>
          </div>

          {isRecording && callStatus === 'connected' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-900/50 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">Rec</span>
            </div>
          )}
        </div>

        <div className="z-10 w-full max-w-md px-8 mb-8">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <button
              onClick={handleMuteToggle}
              disabled={callStatus !== 'connected' || !voiceSDKAvailable}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-full transition-all disabled:opacity-50 ${isMuted ? 'bg-white text-neutral-900' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
              {isMuted ? <MicOff /> : <Mic />}
              <span className="text-xs">Mute</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-full bg-neutral-800 text-neutral-300 opacity-50 cursor-not-allowed">
              <Archive />
              <span className="text-xs">Hold</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-full bg-neutral-800 text-neutral-300 opacity-50 cursor-not-allowed">
              <MoreVertical />
              <span className="text-xs">More</span>
            </button>
          </div>
          <button
            onClick={handleHangup}
            disabled={callStatus === 'disconnecting'}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-full shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
            <PhoneOff className="w-6 h-6" />
            <span className="text-lg font-bold">End Call</span>
          </button>
        </div>
      </div>
    );
  }

  // Idle/Dial view
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-neutral-50 rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
      {/* Premium Header with gradient */}
      <div className="p-5 border-b border-neutral-100 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-neutral-400 uppercase font-medium tracking-wider mb-1.5">Calling From</p>
            {phoneNumbers.length > 0 ? (
              <NumberSelector
                phoneNumbers={phoneNumbers}
                selectedNumberId={selectedPhoneNumber?.id || null}
                onSelect={onPhoneNumberSelect}
                mode="call"
              />
            ) : (
              <p className="text-sm text-neutral-500">No phone numbers configured</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {callStatus === 'initializing' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Connecting...</span>
              </div>
            )}
            {deviceReady && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Ready</span>
              </div>
            )}
          </div>
        </div>
        {/* Premium Tab buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('dialer')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              viewMode === 'dialer'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-900/30'
                : 'bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            Keypad
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              viewMode === 'history'
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-900/30'
                : 'bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'history' ? (
        <div className="flex-1 overflow-y-auto p-5">
          {callHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-base font-medium">No call history yet</p>
              <p className="text-sm text-neutral-400 mt-1">Your recent calls will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {callHistory.slice(0, 20).map((log) => (
                <button
                  key={log.id}
                  onClick={() => dialFromHistory(log)}
                  className="w-full flex items-center gap-4 p-4 bg-white hover:bg-neutral-50 rounded-2xl transition-all duration-200 text-left border border-neutral-100 hover:border-neutral-200 hover:shadow-md group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center">
                    {getCallTypeIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {log.toNumber || log.fromNumber || 'Unknown'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {formatDate(log.date)} • {formatTime(log.durationSeconds)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-green-500/30">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-xs space-y-4">
            {/* Number Input */}
            <div className="relative">
              <div className="flex items-center bg-white rounded-xl border border-neutral-200 p-1.5">
                <button
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg mr-2 transition-colors"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-xs font-semibold text-neutral-700">{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                </button>

                <input
                  type="text"
                  value={number}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^0-9*#]/g, '');
                    setNumber(filtered);
                  }}
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && /[0-9*#]/.test(e.key)) {
                      playDTMFTone(e.key);
                    }
                  }}
                  placeholder="Enter Number..."
                  className="flex-1 text-xl font-bold bg-transparent outline-none text-neutral-900 placeholder-neutral-300"
                />
                {number && (
                  <button onClick={() => setNumber(prev => prev.slice(0, -1))} className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors">
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Country Picker Dropdown */}
              {showCountryPicker && (
                <div className="absolute top-full left-0 mt-2 w-72 max-h-64 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                      <Search className="w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search..."
                        className="flex-1 bg-transparent outline-none text-sm text-neutral-900 placeholder-neutral-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCountries.length === 0 ? (
                      <div className="p-4 text-center text-neutral-400 text-sm">Not found</div>
                    ) : (
                      filteredCountries.map(country => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryPicker(false);
                            setCountrySearch('');
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 transition-colors text-sm ${selectedCountry.code === country.code ? 'bg-red-50' : ''}`}
                        >
                          <span>{country.flag}</span>
                          <span className="flex-1 text-left text-neutral-900">{country.name}</span>
                          <span className="text-neutral-500 text-xs">{country.dialCode}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Compact Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleDigit(key.toString())}
                  className="h-14 rounded-xl bg-neutral-50 hover:bg-red-50 border border-neutral-200 hover:border-red-300 text-xl font-semibold text-neutral-800 hover:text-red-600 transition-all active:scale-95"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {callError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{callError}</span>
                <button onClick={() => clearError()} className="ml-auto text-red-400 hover:text-red-600">×</button>
              </div>
            )}

            {/* Call Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleCall}
                disabled={!number || phoneNumbers.length === 0}
                className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Phone className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialer;
