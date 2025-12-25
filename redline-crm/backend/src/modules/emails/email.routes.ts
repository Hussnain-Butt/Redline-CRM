import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  sendEmailSchema,
  saveDraftSchema,
  emailQuerySchema,
  generateDraftSchema,
  idParamSchema,
} from './email.validation.js';
import {
  sendEmail,
  saveDraft,
  getEmails,
  getEmailById,
  generateAIDraft,
} from './email.controller.js';

const router = Router();

// ==================== ACTIONS ====================

// POST /api/emails/send - Send an email
router.post('/send', validateRequest(sendEmailSchema), sendEmail);

// POST /api/emails/draft - Save a draft
router.post('/draft', validateRequest(saveDraftSchema), saveDraft);

// POST /api/emails/generate - Generate AI draft
router.post('/generate', validateRequest(generateDraftSchema), generateAIDraft);

// ==================== CRUD ROUTES ====================

// GET /api/emails - Get all emails
router.get('/', validateRequest(emailQuerySchema, 'query'), getEmails);

// GET /api/emails/:id - Get email by ID
router.get('/:id', validateRequest(idParamSchema, 'params'), getEmailById);

export default router;
