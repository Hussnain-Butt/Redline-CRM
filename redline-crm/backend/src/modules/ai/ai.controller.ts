import { Request, Response } from 'express';
import { aiService } from './ai.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  sendSuccess,
  sendPaginated,
  calculatePagination,
} from '../../shared/utils/response.js';
import { ChatInput, ConversationQueryInput } from './ai.validation.js';

// ==================== AI CONTROLLER ====================

/**
 * Chat with AI
 * POST /api/ai/chat
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as ChatInput;
  const result = await aiService.chat(req.userId!, data);
  sendSuccess(res, result);
});

/**
 * Get conversations
 * GET /api/ai/conversations
 */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ConversationQueryInput;
  const result = await aiService.getConversations(req.userId!, query);

  const pagination = calculatePagination(result.total, result.page, result.limit);
  sendPaginated(res, result.conversations, pagination);
});

/**
 * Get single conversation
 * GET /api/ai/conversations/:id
 */
export const getConversationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const conversation = await aiService.getConversationById(id, req.userId!);
  sendSuccess(res, conversation);
});

/**
 * Get proactive insight
 * GET /api/ai/insight
 */
export const getInsight = asyncHandler(async (req: Request, res: Response) => {
  const insight = await aiService.getInsight(req.userId!);
  sendSuccess(res, { insight });
});
