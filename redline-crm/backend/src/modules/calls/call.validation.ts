import { z } from 'zod';

// ==================== CREATE CALL LOG SCHEMA ====================

export const createCallSchema = z.object({
  contactId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled']),
  from: z.string().min(1, 'From number is required'),
  to: z.string().min(1, 'To number is required'),
  duration: z.number().int().min(0).optional(),
  recordingUrl: z.string().url().optional(),
  transcription: z.string().optional(),
  notes: z.string().optional(),
  sid: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startTime: z.string().datetime().optional(),
});

export type CreateCallInput = z.infer<typeof createCallSchema>;

// ==================== UPDATE CALL LOG SCHEMA ====================

export const updateCallSchema = z.object({
  status: z.enum(['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled']).optional(),
  duration: z.number().int().min(0).optional(),
  recordingUrl: z.string().url().optional(),
  transcription: z.string().optional(),
  notes: z.string().optional(),
  endTime: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateCallInput = z.infer<typeof updateCallSchema>;

// ==================== QUERY PARAMS SCHEMA ====================

export const callQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  contactId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  status: z.enum(['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled']).optional(),
  sortBy: z.string().optional().default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CallQueryInput = z.infer<typeof callQuerySchema>;

// ==================== PARAMS SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
