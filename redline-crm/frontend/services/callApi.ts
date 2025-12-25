import { CallLog } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

export interface CreateCallLogDTO {
  contactId?: string;
  direction: 'inbound' | 'outbound' | 'missed';
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled';
  from: string;
  to: string;
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  notes?: string;
  sid?: string;
  startTime?: Date;
  endTime?: Date;
}

export const callApi = {
  /**
   * Get all call logs
   */
  getHistory: async (): Promise<CallLog[]> => {
    const response = await fetch(`${API_URL}/calls`);
    if (!response.ok) {
      throw new Error('Failed to fetch call history');
    }
    const data = await response.json();
    return data.data.map((item: any) => ({
      ...item,
      id: item.id || item._id, // Ensure id is mapped
      date: new Date(item.startTime),
      durationSeconds: item.duration,
      type: item.direction === 'inbound' ? 'inbound' : (item.status === 'missed' ? 'missed' : 'outbound'), // Map direction/status to type
      fromNumber: item.from,
      toNumber: item.to,
      twilioCallSid: item.sid,
    }));
  },

  /**
   * Create a new call log
   */
  createLog: async (log: CreateCallLogDTO): Promise<CallLog> => {
    const response = await fetch(`${API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });

    if (!response.ok) {
      throw new Error('Failed to create call log');
    }
    const data = await response.json();
    const item = data.data;
    
    return {
      ...item,
      id: item.id || item._id,
      date: new Date(item.startTime),
      durationSeconds: item.duration,
      type: item.direction === 'inbound' ? 'inbound' : 'outbound',
      fromNumber: item.from,
      toNumber: item.to,
      twilioCallSid: item.sid,
    } as CallLog;
  },

  /**
   * Get Twilio Access Token
   */
  getToken: async (identity: string = 'user'): Promise<{ token: string; identity: string }> => {
    const response = await fetch(`${API_URL}/calls/token?identity=${identity}`);
    if (!response.ok) {
        throw new Error('Failed to get token');
    }
    const data = await response.json();
    return data.data;
  }
};
