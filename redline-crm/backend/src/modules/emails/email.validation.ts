import { z } from 'zod';

// ==================== SEND EMAIL SCHEMA ====================

export const sendEmailSchema = z.object({
  contactId: z.string().optional(),
  to: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required'),
  text: z.string().optional(), // Plain text version of email
  scheduledAt: z.string().datetime().optional(), // For scheduling
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

// ==================== SAVE DRAFT SCHEMA ====================

export const saveDraftSchema = z.object({
  contactId: z.string().optional(),
  to: z.array(z.string()).optional().default([]),
  cc: z.array(z.string()).optional().default([]),
  bcc: z.array(z.string()).optional().default([]),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;

// ==================== QUERY PARAMS SCHEMA ====================

export const emailQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  contactId: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'sent', 'failed']).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type EmailQueryInput = z.infer<typeof emailQuerySchema>;

// ==================== AI GENERATE SCHEMA ====================

export const generateDraftSchema = z.object({
  contactId: z.string().optional(),
  context: z.string().min(1, 'Context is required'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'persuasive']).default('professional'),
});

export type GenerateDraftInput = z.infer<typeof generateDraftSchema>;

// ==================== PARAMS SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
