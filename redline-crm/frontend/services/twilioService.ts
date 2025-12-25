/**
 * Twilio Service
 * Handles integration with Twilio API for phone numbers, SMS, and calls
 */

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;

// Base64 encode credentials for Basic Auth
const getAuthHeader = () => {
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    return `Basic ${credentials}`;
};

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
    return Boolean(
        TWILIO_ACCOUNT_SID &&
        TWILIO_AUTH_TOKEN &&
        TWILIO_ACCOUNT_SID !== 'your_account_sid_here'
    );
}

// Get credentials status
export function getTwilioStatus(): { configured: boolean; accountSid: string | null } {
    return {
        configured: isTwilioConfigured(),
        accountSid: TWILIO_ACCOUNT_SID ? TWILIO_ACCOUNT_SID.substring(0, 8) + '***' : null
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
 * Fetch all phone numbers from Twilio account
 */
export async function fetchTwilioPhoneNumbers(): Promise<TwilioPhoneNumber[]> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured. Please add your credentials to .env.local');
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`,
            {
                headers: {
                    'Authorization': getAuthHeader(),
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch phone numbers');
        }

        const data = await response.json();

        return data.incoming_phone_numbers.map((num: any) => ({
            sid: num.sid,
            phoneNumber: num.phone_number,
            friendlyName: num.friendly_name,
            capabilities: {
                voice: num.capabilities?.voice || false,
                sms: num.capabilities?.sms || false,
                mms: num.capabilities?.mms || false,
            },
            countryCode: num.phone_number.startsWith('+1') ? 'US' :
                num.phone_number.startsWith('+44') ? 'GB' :
                    num.phone_number.startsWith('+61') ? 'AU' : 'XX',
        }));
    } catch (error) {
        console.error('Error fetching Twilio numbers:', error);
        throw error;
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
 * Send an SMS message via Twilio
 */
export async function sendTwilioSMS(
    from: string,
    to: string,
    body: string
): Promise<TwilioSMSMessage> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('From', from);
    formData.append('To', to);
    formData.append('Body', body);

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send SMS');
        }

        const data = await response.json();

        return {
            sid: data.sid,
            from: data.from,
            to: data.to,
            body: data.body,
            status: data.status,
            dateSent: data.date_sent,
            direction: data.direction,
        };
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

/**
 * Fetch SMS message history
 */
export async function fetchTwilioMessages(
    phoneNumber?: string,
    limit: number = 50
): Promise<TwilioSMSMessage[]> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    let url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json?PageSize=${limit}`;

    if (phoneNumber) {
        url += `&To=${encodeURIComponent(phoneNumber)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': getAuthHeader(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch messages');
        }

        const data = await response.json();

        return data.messages.map((msg: any) => ({
            sid: msg.sid,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            status: msg.status,
            dateSent: msg.date_sent,
            direction: msg.direction,
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
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

/**
 * Initiate an outbound call via Twilio REST API (server-to-server)
 * Note: This connects two phones, not the browser
 * For browser-based calling, use the Voice SDK functions below
 */
export async function initiateTwilioCall(
    from: string,
    to: string,
    callbackUrl?: string
): Promise<TwilioCall> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('From', from);
    formData.append('To', to);

    // TwiML for connecting the call
    const twiml = `<Response><Dial callerId="${from}">${to}</Dial></Response>`;
    formData.append('Twiml', twiml);

    if (callbackUrl) {
        formData.append('StatusCallback', callbackUrl);
        formData.append('StatusCallbackEvent', 'initiated ringing answered completed');
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to initiate call');
        }

        const data = await response.json();

        return {
            sid: data.sid,
            from: data.from,
            to: data.to,
            status: data.status,
            duration: parseInt(data.duration) || 0,
            direction: data.direction,
            startTime: data.start_time,
            endTime: data.end_time,
        };
    } catch (error) {
        console.error('Error initiating call:', error);
        throw error;
    }
}

/**
 * Terminate an active call via Twilio REST API
 * Updates the call status to 'completed' which ends the call
 */
export async function terminateTwilioCall(callSid: string): Promise<void> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    if (!callSid) {
        console.warn('No call SID provided to terminate');
        return;
    }

    const formData = new URLSearchParams();
    formData.append('Status', 'completed');

    try {
        console.log(`Terminating call: ${callSid}`);
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Failed to terminate call:', error);
            // Don't throw - call might already be completed
        } else {
            console.log('Call terminated successfully');
        }
    } catch (error) {
        console.error('Error terminating call:', error);
        // Don't throw - we still want to clean up UI state
    }
}

// ==================== VOICE SDK (Browser-Based Calling) ====================

const TWILIO_SERVER_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

/**
 * Fetch access token from backend server for Voice SDK
 */
export async function getTwilioAccessToken(identity?: string): Promise<{ token: string; identity: string }> {
    try {
        const url = new URL(`${TWILIO_SERVER_URL}/calls/token`);
        if (identity) {
            url.searchParams.set('identity', identity);
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get access token');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

/**
 * Check if Voice SDK backend is available
 */
export async function isVoiceServerAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${TWILIO_SERVER_URL}/health`);
        if (!response.ok) return false;

        if (!response.ok) return false;

        const data = await response.json();
        return data.status === 'ok';
    } catch {
        return false;
    }
}


/**
 * Fetch call history
 */
export async function fetchTwilioCalls(limit: number = 50): Promise<TwilioCall[]> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json?PageSize=${limit}`,
            {
                headers: {
                    'Authorization': getAuthHeader(),
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch calls');
        }

        const data = await response.json();

        return data.calls.map((call: any) => ({
            sid: call.sid,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: parseInt(call.duration) || 0,
            direction: call.direction,
            startTime: call.start_time,
            endTime: call.end_time,
        }));
    } catch (error) {
        console.error('Error fetching calls:', error);
        throw error;
    }
}

// ==================== ACCOUNT INFO ====================

export interface TwilioAccountInfo {
    sid: string;
    friendlyName: string;
    status: string;
    type: string;
}

/**
 * Get Twilio account information
 */
export async function getTwilioAccountInfo(): Promise<TwilioAccountInfo> {
    if (!isTwilioConfigured()) {
        throw new Error('Twilio is not configured');
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}.json`,
            {
                headers: {
                    'Authorization': getAuthHeader(),
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch account info');
        }

        const data = await response.json();

        return {
            sid: data.sid,
            friendlyName: data.friendly_name,
            status: data.status,
            type: data.type,
        };
    } catch (error) {
        console.error('Error fetching account info:', error);
        throw error;
    }
}
