import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, Maximize2, User, PhoneIncoming, X } from 'lucide-react';
import { useCallContext, CallStatus } from '../contexts/CallContext';

/**
 * Persistent Call Overlay
 * 
 * Floating widget that appears when a call is active on any page.
 * Allows user to control call without navigating back to dialer.
 */
const PersistentCallOverlay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    callStatus,
    duration,
    isMuted,
    activeCallInfo,
    incomingCall,
    hangupCall,
    muteToggle,
    acceptIncomingCall,
    rejectIncomingCall,
  } = useCallContext();

  // Don't show on dialer page (full UI already there)
  const isOnDialerPage = location.pathname === '/dialer';

  // Only show when call is active or incoming
  const isCallActive = ['calling', 'ringing', 'connected', 'disconnecting'].includes(callStatus);
  const hasIncomingCall = incomingCall !== null;

  if (isOnDialerPage || (!isCallActive && !hasIncomingCall)) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling': return 'Connecting...';
      case 'ringing': return 'Ringing...';
      case 'connected': return formatTime(duration);
      case 'disconnecting': return 'Ending...';
      default: return '';
    }
  };

  // Incoming call UI
  if (hasIncomingCall) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl shadow-2xl shadow-green-900/40 p-4 min-w-[280px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-100 font-medium">Incoming Call</p>
              <p className="text-lg font-bold truncate">
                {incomingCall.parameters?.From || 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={rejectIncomingCall}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={acceptIncomingCall}
              className="flex-1 bg-white text-green-600 hover:bg-green-50 py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active call UI
  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl shadow-2xl shadow-black/40 p-4 min-w-[280px] border border-neutral-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            callStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {activeCallInfo?.contactName ? (
              <span className="text-lg font-bold">
                {activeCallInfo.contactName.charAt(0)}
              </span>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {activeCallInfo?.contactName || activeCallInfo?.toNumber || 'Unknown'}
            </p>
            <p className={`text-xs font-medium ${
              callStatus === 'connected' ? 'text-green-400' : 'text-red-400'
            }`}>
              {getStatusText()}
            </p>
          </div>
          
          {/* Recording indicator */}
          {callStatus === 'connected' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-red-400 uppercase">Rec</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            onClick={muteToggle}
            disabled={callStatus !== 'connected'}
            className={`flex-1 py-2 px-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              isMuted 
                ? 'bg-white text-neutral-900' 
                : 'bg-neutral-700 hover:bg-neutral-600 text-white'
            } disabled:opacity-50`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          {/* Open Dialer button */}
          <button
            onClick={() => navigate('/dialer')}
            className="py-2 px-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl flex items-center justify-center transition-colors"
            title="Open Dialer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* End call button */}
          <button
            onClick={hangupCall}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersistentCallOverlay;
