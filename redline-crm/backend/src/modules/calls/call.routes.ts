import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createCallSchema,
  updateCallSchema,
  callQuerySchema,
  idParamSchema,
} from './call.validation.js';
import {
  createCall,
  getCalls,
  getCallById,
  updateCall,
  getVoiceToken,
  handleVoiceWebhook,
  handleCallStatus,
  handleRecordingStatus,
  downloadRecording,
} from './call.controller.js';

const router = Router();

// ==================== SPECIAL ROUTES ====================

// GET /api/calls/token - Generate Twilio Token
router.get('/token', getVoiceToken);

// POST /api/calls/voice - Twilio Webhook (Public usually, but here we keep it structured)
// Note: Twilio sends form-encoded data usually, verify Middleware handles it (app.ts does)
router.post('/voice', handleVoiceWebhook);

// POST /api/calls/status - Twilio Status Webhook
router.post('/status', handleCallStatus);

// POST /api/calls/recording-status - Twilio Recording Status Webhook
router.post('/recording-status', handleRecordingStatus);

// GET /api/calls/recording/:recordingSid - Download Recording (Proxy)
router.get('/recording/:recordingSid', downloadRecording);

// ==================== CRUD ROUTES ====================

// GET /api/calls - Get all calls
router.get('/', validateRequest(callQuerySchema, 'query'), getCalls);

// POST /api/calls - Create call log
router.post('/', validateRequest(createCallSchema), createCall);

// GET /api/calls/:id - Get call by ID
router.get('/:id', validateRequest(idParamSchema, 'params'), getCallById);

// PUT /api/calls/:id - Update call log
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateCallSchema),
  updateCall
);

export default router;
