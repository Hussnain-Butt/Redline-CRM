import { FilterQuery, SortOrder, Types } from 'mongoose';
import Twilio from 'twilio';
import { Call, ICallDocument, ICall } from './call.model.js';
import {
  CreateCallInput,
  UpdateCallInput,
  CallQueryInput,
} from './call.validation.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/env.js';

// Initialize Twilio Client (only if env vars present)
// We mock this safely if keys are missing to prevent backend crash
// const twilioClient = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
//   ? Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
//   : null;

// ==================== CALL SERVICE ====================

export class CallService {
  /**
   * Create a call log
   */
  async create(data: CreateCallInput): Promise<ICallDocument> {
    const call = new Call({
      ...data,
      contactId: data.contactId,
    });
    return await call.save();
  }

  /**
   * Update a call log
   */
  async update(id: string, data: UpdateCallInput): Promise<ICallDocument> {
    const call = await Call.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!call) {
      throw new AppError('Call not found', 404);
    }
    return call;
  }

  /**
   * Get call logs with filtering
   */
  async getAll(query: CallQueryInput): Promise<{
    calls: ICallDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, contactId, direction, status, sortBy, sortOrder } = query;

    const filter: FilterQuery<ICall> = {};
    if (contactId) filter.contactId = new Types.ObjectId(contactId);
    if (direction) filter.direction = direction;
    if (status) filter.status = status;

    const sort: { [key: string]: SortOrder } = {
      [sortBy || 'startTime']: sortOrder === 'desc' ? -1 : 1,
    };

    const skip = (page - 1) * limit;
    const [calls, total] = await Promise.all([
      Call.find(filter).sort(sort).skip(skip).limit(limit),
      Call.countDocuments(filter),
    ]);

    return {
      calls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single call log
   */
  async getById(id: string): Promise<ICallDocument> {
    const call = await Call.findById(id);
    if (!call) {
      throw new AppError('Call not found', 404);
    }
    return call;
  }

  /**
   * Generate Twilio Capability Token for Frontend
   */
  generateToken(identity: string = 'user'): { token: string; identity: string } {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_API_KEY || !env.TWILIO_API_SECRET) {
      // Return a mock token for development if no keys configured
      console.warn('⚠️ Twilio keys missing. Returning mock token.');
      return {
        token: `mock_twilio_token_${Date.now()}`,
        identity,
      };
    }

    const AccessToken = Twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: env.TWILIO_TWIML_APP_SID,
      incomingAllow: true, // Allow incoming calls
    });

    // Create an Access Token
    const token = new AccessToken(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_API_KEY,
      env.TWILIO_API_SECRET,
      { identity: identity }
    );
    token.addGrant(voiceGrant);

    return {
      token: token.toJwt(),
      identity: identity,
    };
  }

  /**
   * Handle Twilio Voice Webhook (TwiML)
   * This is called by Twilio when a call is made/received
   */
  handleVoiceWebhook(From: string, To: string): string {
    const VoiceResponse = Twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    console.log(`📞 Handling webhook: From ${From} to ${To}`);

    if (To) {
      // Outbound call - dial the number
      console.log(`📤 Outbound call to: ${To}`);
      
      // For TwilioClient calls, callerId is REQUIRED and must be a validated number
      const dial = response.dial({
        callerId: env.TWILIO_PHONE_NUMBER,
        timeout: 30,
        timeLimit: 14400,
        record: 'record-from-answer', // Enable recording from when call is answered
        recordingStatusCallback: `${env.BACKEND_URL || 'http://localhost:3000'}/api/calls/recording-status`,
        recordingStatusCallbackMethod: 'POST',
      });
      
      dial.number(To);
    } else {
      // Inbound call
      console.log(`📥 Inbound call from: ${From}`);
      response.say('Welcome to RedLine CRM. Connecting you to an agent.');
      
      const dial = response.dial({
        timeout: 30,
        timeLimit: 14400,
        record: 'record-from-answer',
        recordingStatusCallback: `${env.BACKEND_URL || 'http://localhost:3000'}/api/calls/recording-status`,
        recordingStatusCallbackMethod: 'POST',
      });
      dial.client('user');
    }

    const twiml = response.toString();
    console.log('📋 Generated TwiML:', twiml);
    return twiml;
  }

  /**
   * Handle Twilio Status Callback
   */
  async updateStatus(callSid: string, status: string, duration?: number): Promise<void> {
    if (!callSid) return;

    // Map Twilio status to our status enum
    const validStatuses = ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled'];
    if (!validStatuses.includes(status)) return;

    const data: any = { status };
    if (duration) data.duration = duration;
    if (status === 'completed' || status === 'failed' || status === 'canceled') {
      data.endTime = new Date();
    }

    // Find by SID (Twilio SID) or if stored as _id (unlikely for sid)
    // We update based on sid field
    await Call.findOneAndUpdate({ sid: callSid }, data);
  }

  /**
   * Handle Twilio Recording Status Callback
   */
  async updateRecording(
    callSid: string,
    recordingSid: string,
    recordingUrl: string,
    recordingStatus: string,
    recordingDuration?: number
  ): Promise<void> {
    if (!callSid) return;

    const data: any = {
      recordingSid,
      recordingUrl,
      recordingStatus: recordingStatus === 'completed' ? 'completed' : recordingStatus === 'failed' ? 'failed' : 'processing',
    };
    
    if (recordingDuration) {
      data.recordingDuration = recordingDuration;
    }

    await Call.findOneAndUpdate({ sid: callSid }, data);
    console.log(`✅ Recording saved for call ${callSid}: ${recordingUrl}`);
  }

  /**
   * Download Recording from Twilio (with authentication)
   */
  async downloadRecording(recordingSid: string): Promise<{ data: Buffer; contentType: string }> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

    // Construct Twilio recording URL
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.mp3`;

    // Fetch recording with Basic Auth
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      data: buffer,
      contentType: 'audio/mpeg'
    };
  }
}

export const callService = new CallService();
