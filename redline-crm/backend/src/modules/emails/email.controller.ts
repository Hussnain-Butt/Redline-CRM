import { Request, Response } from 'express';
import { emailService } from './email.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  calculatePagination,
} from '../../shared/utils/response.js';
import {
  SendEmailInput,
  SaveDraftInput,
  EmailQueryInput,
  GenerateDraftInput,
} from './email.validation.js';

// ==================== EMAIL CONTROLLER ====================

/**
 * Send an email
 * POST /api/emails/send
 */
export const sendEmail = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as SendEmailInput;
  const email = await emailService.send(req.userId!, data);
  sendCreated(res, email, 'Email sent successfully');
});

/**
 * Save a draft
 * POST /api/emails/draft
 */
export const saveDraft = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as SaveDraftInput;
  const email = await emailService.saveDraft(req.userId!, data);
  sendCreated(res, email, 'Draft saved successfully');
});

/**
 * Get emails
 * GET /api/emails
 */
export const getEmails = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as EmailQueryInput;
  const result = await emailService.getAll(req.userId!, query);

  const pagination = calculatePagination(result.total, result.page, result.limit);
  sendPaginated(res, result.emails, pagination);
});

/**
 * Get single email
 * GET /api/emails/:id
 */
export const getEmailById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const email = await emailService.getById(id, req.userId!);
  sendSuccess(res, email);
});

/**
 * Generate AI draft
 * POST /api/emails/generate
 */
export const generateAIDraft = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as GenerateDraftInput;
  const draft = await emailService.generateDraft(data);
  sendSuccess(res, draft);
});
