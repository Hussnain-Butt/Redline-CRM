/**
 * Twilio Service
 * Handles integration with Twilio via Backend API (secure, centralized)
 */

import apiClient from './apiClient';

// ==================== CONFIGURATION ====================

/**
 * Check if Twilio is configured (via backend)
 */
export async function isTwilioConfigured(): Promise<boolean> {
    try {
        const { data } = await apiClient.get('/phone-numbers');
        return data.success && data.data?.length > 0;
    } catch {
        return false;
    }
}

// Get credentials status
export function getTwilioStatus(): { configured: boolean; accountSid: string | null } {
    return {
        configured: true, // Always true since backend handles it
        accountSid: 'Backend Managed'
    };
}

// ==================== PHONE NUMBERS ====================

export interface TwilioPhoneNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
    };
    countryCode: string;
}

/**
 * Fetch all phone numbers from backend
 * Returns the single shared number configured in backend
 */
export async function fetchTwilioPhoneNumbers(): Promise<TwilioPhoneNumber[]> {
    try {
        const { data } = await apiClient.get('/phone-numbers');
        if (data.success && data.data) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching phone numbers:', error);
        return [];
    }
}

// ==================== SMS ====================

export interface TwilioSMSMessage {
    sid: string;
    from: string;
    to: string;
    body: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    dateSent: string;
    direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
}

/**
 * Send an SMS message via Backend API
 */
export async function sendTwilioSMS(
    from: string,
    to: string,
    body: string
): Promise<TwilioSMSMessage> {
    try {
        const { data } = await apiClient.post('/sms/send', { from, to, body });
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to send SMS');
        }

        // Map backend response to TwilioSMSMessage
        const sms = data.data;
        return {
            sid: sms.twilioSid || sms._id,
            from: sms.fromNumber,
            to: sms.toNumber,
            body: sms.body,
            status: sms.status,
            dateSent: sms.timestamp,
            direction: sms.direction
        };
    } catch (error: any) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}


/**
 * Fetch SMS message history from backend
 */
export async function fetchTwilioMessages(
    contactId?: string,
    limit: number = 50
): Promise<TwilioSMSMessage[]> {
    try {
        let endpoint = '/sms';
        if (contactId) {
            endpoint = `/sms/contact/${contactId}`;
        }
        
        const { data } = await apiClient.get(endpoint);
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch messages');
        }

        // Map backend response to TwilioSMSMessage format
        return (data.data || []).map((msg: any) => ({
            sid: msg.twilioSid || msg._id,
            from: msg.fromNumber,
            to: msg.toNumber,
            body: msg.body,
            status: msg.status,
            dateSent: msg.timestamp,
            direction: msg.direction
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}


// ==================== CALLS ====================

export interface TwilioCall {
    sid: string;
    from: string;
    to: string;
    status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
    duration: number;
    direction: 'inbound' | 'outbound-api' | 'outbound-dial';
    startTime: string;
    endTime: string;
}

// ==================== VOICE SDK (Browser-Based Calling) ====================

/**
 * Fetch access token from backend server for Voice SDK
 * This is used by the browser-based calling via Twilio Voice SDK
 */
export async function getTwilioAccessToken(identity?: string): Promise<{ token: string; identity: string }> {
    try {
        const { data } = await apiClient.get('/calls/token', { params: { identity } });
        return data.data;
    } catch (error: any) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

/**
 * Check if Voice SDK backend is available
 */
export async function isVoiceServerAvailable(): Promise<boolean> {
    try {
        const { data } = await apiClient.get('/health');
        return data.status === 'ok';
    } catch {
        return false;
    }
}

/**
 * Fetch call history from backend
 */
export async function fetchTwilioCalls(limit: number = 50): Promise<TwilioCall[]> {
    try {
        const { data } = await apiClient.get('/calls', { params: { limit } });
        
        if (!data.success) {
            return [];
        }

        // Map backend call records to TwilioCall format
        return (data.data?.calls || []).map((call: any) => ({
            sid: call.sid || call._id,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: call.duration || 0,
            direction: call.direction,
            startTime: call.startTime,
            endTime: call.endTime
        }));
    } catch (error) {
        console.error('Error fetching calls:', error);
        return [];
    }
}
