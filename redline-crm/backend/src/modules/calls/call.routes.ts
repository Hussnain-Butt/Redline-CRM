import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { dncFilterMiddleware } from '../../middleware/dncFilter.js';
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

import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

// ==================== SPECIAL ROUTES ====================

// GET /api/calls/token - Generate Twilio Token (PROTECTED)
router.get('/token', requireAuth, getVoiceToken);

// POST /api/calls/voice - Twilio Webhook (PUBLIC)
// Note: Twilio sends form-encoded data usually, verify Middleware handles it (app.ts does)
router.post('/voice', handleVoiceWebhook);

// POST /api/calls/status - Twilio Status Webhook (PUBLIC)
router.post('/status', handleCallStatus);

// POST /api/calls/recording-status - Twilio Recording Status Webhook (PUBLIC)
router.post('/recording-status', handleRecordingStatus);

// GET /api/calls/recording/:recordingSid - Download Recording (Proxy) (PROTECTED)
router.get('/recording/:recordingSid', requireAuth, downloadRecording);

// ==================== CRUD ROUTES ====================

// GET /api/calls - Get all calls (PROTECTED)
router.get('/', requireAuth, validateRequest(callQuerySchema, 'query'), getCalls);

// POST /api/calls - Create call log (PROTECTED)
router.post('/', requireAuth, dncFilterMiddleware, validateRequest(createCallSchema), createCall);

// GET /api/calls/:id - Get call by ID (PROTECTED)
router.get('/:id', requireAuth, validateRequest(idParamSchema, 'params'), getCallById);

// PUT /api/calls/:id - Update call log (PROTECTED)
router.put(
  '/:id',
  requireAuth,
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateCallSchema),
  updateCall
);

export default router;
