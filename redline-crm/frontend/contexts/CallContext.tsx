import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { getTwilioAccessToken, isVoiceServerAvailable } from '../services/twilioService';

// Types
export type CallStatus = 'idle' | 'initializing' | 'ready' | 'calling' | 'ringing' | 'connected' | 'disconnecting';

export interface CallInfo {
  toNumber: string;
  fromNumber: string;
  contactName?: string;
  startTime: Date | null;
}

interface CallContextType {
  // State
  callStatus: CallStatus;
  duration: number;
  isMuted: boolean;
  isRecording: boolean;
  deviceReady: boolean;
  callError: string | null;
  activeCallInfo: CallInfo | null;
  voiceSDKAvailable: boolean;
  incomingCall: any | null;

  // Actions
  initializeDevice: () => Promise<void>;
  makeCall: (toNumber: string, fromNumber: string, contactName?: string) => Promise<void>;
  hangupCall: () => void;
  muteToggle: () => void;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => void;
  sendDTMF: (digit: string) => void;
  clearError: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

// Dynamic import for Voice SDK
let Device: any = null;
let Call: any = null;

const loadVoiceSDK = async () => {
  try {
    const sdk = await import('@twilio/voice-sdk');
    Device = sdk.Device;
    Call = sdk.Call;
    return true;
  } catch (e) {
    console.warn('Twilio Voice SDK not available');
    return false;
  }
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [activeCallInfo, setActiveCallInfo] = useState<CallInfo | null>(null);
  const [voiceSDKAvailable, setVoiceSDKAvailable] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  // Refs (persist across renders)
  const deviceRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const durationIntervalRef = useRef<number | null>(null);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const sdkLoaded = await loadVoiceSDK();
      setVoiceSDKAvailable(sdkLoaded);

      if (sdkLoaded) {
        const serverAvailable = await isVoiceServerAvailable();
        if (serverAvailable) {
          await initializeDevice();
        } else {
          setCallStatus('ready');
          setDeviceReady(true);
        }
      } else {
        setCallStatus('ready');
        setDeviceReady(true);
      }
    };
    init();

    // Cleanup on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      // Don't destroy device on unmount - this is the whole point!
      // We only destroy when explicitly requested or app closes
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'connected' && !durationIntervalRef.current) {
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else if (callStatus !== 'connected' && durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callStatus]);

  // Initialize Twilio Device
  const initializeDevice = useCallback(async () => {
    if (!Device) return;

    try {
      setCallStatus('initializing');
      setCallError(null);

      console.log('🔧 Initializing Twilio Device (Global)...');
      const { token, identity } = await getTwilioAccessToken();
      console.log('✅ Token received for identity:', identity);

      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: Call ? [Call.Codec.Opus, Call.Codec.PCMU] : undefined,
      });

      device.on('registered', () => {
        console.log('✅ Twilio Device registered and ready (Global)');
        setDeviceReady(true);
        setCallStatus('ready');
      });

      device.on('error', async (error: any) => {
        console.error('❌ Twilio Device error:', error);
        
        // Handle expired token - auto reinitialize
        if (error.code === 20104 || error.message?.includes('AccessTokenExpired')) {
          console.log('🔄 Token expired, reinitializing device...');
          setCallError('Session expired, reconnecting...');
          
          // Destroy old device
          try {
            device.destroy();
            deviceRef.current = null;
          } catch (e) {
            console.warn('Error destroying old device:', e);
          }
          
          // Wait a moment then reinitialize
          setTimeout(() => {
            initializeDevice();
          }, 1000);
          return;
        }
        
        setCallError(`Device error: ${error.message}`);
        setDeviceReady(false);
      });

      device.on('incoming', (call: any) => {
        console.log('📞 Incoming call from:', call.parameters.From);
        setIncomingCall(call);
        setCallStatus('ringing');
      });

      device.on('tokenWillExpire', async () => {
        console.log('🔄 Token will expire, refreshing...');
        try {
          const { token: newToken } = await getTwilioAccessToken();
          device.updateToken(newToken);
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      });

      await device.register();
      deviceRef.current = device;

    } catch (error) {
      console.error('Failed to initialize Twilio Device:', error);
      setCallError(error instanceof Error ? error.message : 'Failed to initialize phone');
      setCallStatus('ready');
      setDeviceReady(true);
    }
  }, []);

  // Make outbound call
  const makeCall = useCallback(async (toNumber: string, fromNumber: string, contactName?: string) => {
    setCallError(null);
    setCallStatus('calling');
    setActiveCallInfo({
      toNumber,
      fromNumber,
      contactName,
      startTime: new Date(),
    });

    try {
      if (deviceRef.current && voiceSDKAvailable) {
        console.log(`📞 Making call from ${fromNumber} to ${toNumber}...`);

        const call = await deviceRef.current.connect({
          params: {
            To: toNumber,
            callerId: fromNumber,
          }
        });

        activeCallRef.current = call;

        call.on('ringing', () => {
          console.log('📳 Call ringing');
          setCallStatus('ringing');
        });

        call.on('accept', () => {
          console.log('✅ Call connected');
          setCallStatus('connected');
          setIsRecording(true);
        });

        call.on('disconnect', () => {
          console.log('📴 Call disconnected');
          handleCallEnd();
        });

        call.on('cancel', () => {
          console.log('❌ Call cancelled');
          handleCallEnd();
        });

        call.on('reject', () => {
          console.log('🚫 Call rejected');
          setCallError('Call was rejected');
          handleCallEnd();
        });

        call.on('error', (error: any) => {
          console.error('Call error:', error);
          setCallError(`Call error: ${error.message}`);
          handleCallEnd();
        });

        call.on('mute', (muted: boolean) => {
          setIsMuted(muted);
        });

      } else {
        // Fallback - no audio in browser
        console.warn('Voice SDK not available, call may not have audio');
        setCallStatus('connected');
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to make call:', error);
      setCallError(error instanceof Error ? error.message : 'Failed to make call');
      setCallStatus(deviceReady ? 'ready' : 'idle');
      setActiveCallInfo(null);
    }
  }, [voiceSDKAvailable, deviceReady]);

  // Handle call end (cleanup)
  const handleCallEnd = useCallback(() => {
    setDuration(0);
    setIsRecording(false);
    setIsMuted(false);
    activeCallRef.current = null;
    setActiveCallInfo(null);
    setCallStatus(deviceReady ? 'ready' : 'idle');
  }, [deviceReady]);

  // Hangup call
  const hangupCall = useCallback(() => {
    setCallStatus('disconnecting');

    if (activeCallRef.current && typeof activeCallRef.current.disconnect === 'function') {
      activeCallRef.current.disconnect();
    } else {
      handleCallEnd();
    }
  }, [handleCallEnd]);

  // Toggle mute
  const muteToggle = useCallback(() => {
    if (activeCallRef.current && typeof activeCallRef.current.mute === 'function') {
      const newMuteState = !isMuted;
      activeCallRef.current.mute(newMuteState);
      setIsMuted(newMuteState);
    }
  }, [isMuted]);

  // Accept incoming call
  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      await incomingCall.accept();
      activeCallRef.current = incomingCall;
      
      setActiveCallInfo({
        toNumber: incomingCall.parameters.From || 'Unknown',
        fromNumber: 'Incoming',
        contactName: undefined,
        startTime: new Date(),
      });

      setIncomingCall(null);
      setCallStatus('connected');
      setIsRecording(true);

      incomingCall.on('disconnect', () => handleCallEnd());
      incomingCall.on('error', (error: any) => {
        setCallError(`Call error: ${error.message}`);
        handleCallEnd();
      });
      incomingCall.on('mute', (muted: boolean) => setIsMuted(muted));

    } catch (e: any) {
      console.error('Failed to accept call:', e);
      setCallError('Failed to accept call');
      setIncomingCall(null);
      setCallStatus('ready');
    }
  }, [incomingCall, handleCallEnd]);

  // Reject incoming call
  const rejectIncomingCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.reject();
      setIncomingCall(null);
      setCallStatus('ready');
    }
  }, [incomingCall]);

  // Send DTMF tones
  const sendDTMF = useCallback((digit: string) => {
    if (activeCallRef.current && typeof activeCallRef.current.sendDigits === 'function') {
      activeCallRef.current.sendDigits(digit);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setCallError(null);
  }, []);

  const value: CallContextType = {
    callStatus,
    duration,
    isMuted,
    isRecording,
    deviceReady,
    callError,
    activeCallInfo,
    voiceSDKAvailable,
    incomingCall,
    initializeDevice,
    makeCall,
    hangupCall,
    muteToggle,
    acceptIncomingCall,
    rejectIncomingCall,
    sendDTMF,
    clearError,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

// Hook for using call context
export const useCallContext = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
};

export default CallContext;
