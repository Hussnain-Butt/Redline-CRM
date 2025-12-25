import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  chatSchema,
  conversationQuerySchema,
  idParamSchema,
} from './ai.validation.js';
import {
  chat,
  getConversations,
  getConversationById,
  getInsight,
} from './ai.controller.js';

const router = Router();

// POST /api/ai/chat - Send message to AI
router.post('/chat', validateRequest(chatSchema), chat);

// GET /api/ai/conversations - Get conversation history
router.get('/conversations', validateRequest(conversationQuerySchema, 'query'), getConversations);

// GET /api/ai/conversations/:id - Get specific conversation
router.get('/conversations/:id', validateRequest(idParamSchema, 'params'), getConversationById);

// GET /api/ai/insight - Get proactive insight
router.get('/insight', getInsight);

export default router;
