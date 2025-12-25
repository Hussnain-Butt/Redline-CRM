import { z } from 'zod';

// ==================== CREATE REMINDER SCHEMA ====================

export const createReminderSchema = z.object({
  contactId: z.string().optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  type: z.enum(['call', 'email', 'meeting', 'task']).default('task'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
  dueTime: z.string().optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  status: z.enum(['pending', 'completed', 'snoozed']).default('pending'),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;

// ==================== UPDATE REMINDER SCHEMA ====================

export const updateReminderSchema = z.object({
  contactId: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['call', 'email', 'meeting', 'task']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dueDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  dueTime: z.string().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'completed', 'snoozed']).optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
});

export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// ==================== UPDATE STATUS SCHEMA ====================

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'snoozed']),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// ==================== QUERY PARAMS SCHEMA ====================

export const reminderQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  status: z.enum(['pending', 'completed', 'snoozed']).optional(),
  type: z.enum(['call', 'email', 'meeting', 'task']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  contactId: z.string().optional(),
  sortBy: z.string().optional().default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ReminderQueryInput = z.infer<typeof reminderQuerySchema>;

// ==================== PARAMS SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
