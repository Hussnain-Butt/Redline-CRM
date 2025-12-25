import { Request, Response } from 'express';
import { callService } from './call.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  calculatePagination,
} from '../../shared/utils/response.js';
import {
  CreateCallInput,
  UpdateCallInput,
  CallQueryInput,
} from './call.validation.js';

// ==================== CALL CONTROLLER ====================

/**
 * Create a call log (Manual or via webhook later)
 * POST /api/calls
 */
export const createCall = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateCallInput;
  const call = await callService.create(data);
  sendCreated(res, call, 'Call log created successfully');
});

/**
 * Get call logs
 * GET /api/calls
 */
export const getCalls = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as CallQueryInput;
  const result = await callService.getAll(query);

  const pagination = calculatePagination(result.total, result.page, result.limit);
  sendPaginated(res, result.calls, pagination);
});

/**
 * Get single call log
 * GET /api/calls/:id
 */
export const getCallById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const call = await callService.getById(id);
  sendSuccess(res, call);
});

/**
 * Update call log
 * PUT /api/calls/:id
 */
export const updateCall = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateCallInput;
  const call = await callService.update(id, data);
  sendSuccess(res, call, 'Call log updated successfully');
});

/**
 * Generate Twilio Voice Token for Frontend
 * GET /api/calls/token
 */
export const getVoiceToken = asyncHandler(async (req: Request, res: Response) => {
  const identity = (req.query.identity as string) || 'user';
  const tokenData = callService.generateToken(identity);
  sendSuccess(res, tokenData);
});

/**
 * Twilio Voice Webhook (Returns XML)
 * POST /api/calls/voice
 */
export const handleVoiceWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { From, To } = req.body;
  const xml = callService.handleVoiceWebhook(From, To);
  
  res.type('text/xml');
  res.send(xml);
});

/**
 * Twilio Call Status Webhook
 * POST /api/calls/status
 */
export const handleCallStatus = asyncHandler(async (req: Request, res: Response) => {
  const { CallSid, CallStatus, CallDuration, From, To } = req.body;
  
  console.log('📊 Call status update:', {
    callSid: CallSid,
    status: CallStatus,
    from: From,
    to: To,
    duration: CallDuration
  });

  await callService.updateStatus(
    CallSid, 
    CallStatus, 
    CallDuration ? parseInt(CallDuration) : undefined
  );
  
  res.sendStatus(200);
});

/**
 * Twilio Recording Status Webhook
 * POST /api/calls/recording-status
 */
export const handleRecordingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { CallSid, RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration } = req.body;
  
  console.log('🎙️ Recording status update:', {
    callSid: CallSid,
    recordingSid: RecordingSid,
    status: RecordingStatus,
    duration: RecordingDuration
  });

  await callService.updateRecording(
    CallSid,
    RecordingSid,
    RecordingUrl,
    RecordingStatus,
    RecordingDuration ? parseInt(RecordingDuration) : undefined
  );
  
  res.sendStatus(200);
});

/**
 * Download Recording (Proxy with Authentication)
 * GET /api/calls/recording/:recordingSid
 */
export const downloadRecording = asyncHandler(async (req: Request, res: Response) => {
  const { recordingSid } = req.params;
  
  console.log('📥 Downloading recording:', recordingSid);

  const recordingData = await callService.downloadRecording(recordingSid);
  
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition');
  
  // Set headers for audio download
  res.setHeader('Content-Type', recordingData.contentType);
  res.setHeader('Content-Disposition', `inline; filename="recording-${recordingSid}.mp3"`);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
  // Send the audio data
  res.send(recordingData.data);
});

