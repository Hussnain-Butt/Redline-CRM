import { z } from 'zod';

// ==================== CREATE TEMPLATE SCHEMA ====================

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  category: z.enum(['sales', 'meeting', 'follow-up', 'proposal', 'contract', 'welcome', 'custom']).default('custom'),
  subject: z.string().max(200, 'Subject cannot exceed 200 characters').optional(),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content cannot exceed 10000 characters'),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

// ==================== UPDATE TEMPLATE SCHEMA ====================

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['sales', 'meeting', 'follow-up', 'proposal', 'contract', 'welcome', 'custom']).optional(),
  subject: z.string().max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ==================== APPLY VARIABLES SCHEMA ====================

export const applyVariablesSchema = z.object({
  variables: z.record(z.string(), z.string()),
});

export type ApplyVariablesInput = z.infer<typeof applyVariablesSchema>;

// ==================== QUERY PARAMS SCHEMA ====================

export const templateQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  category: z.enum(['sales', 'meeting', 'follow-up', 'proposal', 'contract', 'welcome', 'custom']).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type TemplateQueryInput = z.infer<typeof templateQuerySchema>;

// ==================== PARAMS SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
