import { z } from 'zod';

// ==================== CHAT SCHEMA ====================

export const chatSchema = z.object({
  contactId: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  conversationId: z.string().optional(), // If providing an existing conversation ID
  context: z.string().optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;

// ==================== QUERY PARAMS SCHEMA ====================

export const conversationQuerySchema = z.object({
  page: z.string().transform(Number).optional().default('1'),
  limit: z.string().transform(Number).optional().default('20'),
  contactId: z.string().optional(),
});

export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;

// ==================== PARAMS SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
