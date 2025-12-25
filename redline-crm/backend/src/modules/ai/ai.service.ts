import { Types } from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Conversation, IConversationDocument } from './ai.model.js';
import { ChatInput, ConversationQueryInput } from './ai.validation.js';
import { AppError } from '../../middleware/errorHandler.js';
import { env } from '../../config/index.js';

// ==================== AI SERVICE ====================

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (env.VITE_APP_URL) {
      this.genAI = new GoogleGenerativeAI(env.VITE_APP_URL);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } else {
      console.warn('⚠️ VITE_APP_URL is not set. AI features will use mock responses.');
    }
  }

  /**
   * Process a chat message
   */
  async chat(data: ChatInput): Promise<{
    conversation: IConversationDocument;
    response: string;
  }> {
    let conversation: IConversationDocument | null = null;

    // 1. Retrieve or create conversation
    if (data.conversationId) {
      conversation = await Conversation.findById(data.conversationId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }
    } else {
      conversation = new Conversation({
        contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
        title: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
        messages: [],
        context: data.context || "You are a helpful CRM assistant for RedLine CRM.",
      });
    }

    // 2. Add user message
    conversation.messages.push({
      role: 'user',
      content: data.message,
      createdAt: new Date(),
    });

    // 3. Generate AI response
    let aiResponse: string;
    try {
      aiResponse = await this.generateResponse(data.message, conversation.messages);
    } catch (error) {
      console.error('AI Generation Error (Triggering Fallback):', error);
      aiResponse = "I apologize, but I'm having trouble processing your request right now. (Fallback triggered)";
    }
    
    // 4. Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date(),
    });

    try {
      await conversation.save();
    } catch (dbError) {
      console.error('DB 2Save Error:', dbError);
      throw dbError;
    }

    return {
      conversation,
      response: aiResponse,
    };
  }

  /**
   * Generate AI Response using Gemini
   */
  private async generateResponse(message: string, history: any[]): Promise<string> {
    if (!this.model) {
      // Fallback to mock if no API key
      return this.generateMockResponse(message);
    }

    try {
      // Convert history format (exclude the current message which is the last one)
      // Gemini expects: { role: 'user'|'model', parts: [{ text: string }] }
      const previousMessages = history.slice(0, -1);
      
      const geminiHistory = previousMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = this.model.startChat({
        history: geminiHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.generateMockResponse(message); // Fallback on error
    }
  }

  private generateMockResponse(message: string): string {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('reminder') || lowerMsg.includes('task')) {
      return "I can help you set a reminder. Would you like me to add that to your tasks? (Mock)";
    }
    
    if (lowerMsg.includes('email') || lowerMsg.includes('draft')) {
      return "I can draft that email for you. Who should it be addressed to? (Mock)";
    }

    if (lowerMsg.includes('contact') || lowerMsg.includes('search')) {
      return "I can search for contacts. Please provide a name. (Mock)";
    }

    return "I'm your RedLine AI Assistant. Please configure the Gemini API Key to enable real intelligence.";
  }

  /**
   * Get conversations history
   */
  async getConversations(query: ConversationQueryInput): Promise<{
    conversations: IConversationDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, contactId } = query;

    const filter: any = {};
    if (contactId) filter.contactId = new Types.ObjectId(contactId);

    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-messages'), // Exclude full message history for list view
      Conversation.countDocuments(filter),
    ]);

    return {
      conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single conversation
   */
  async getConversationById(id: string): Promise<IConversationDocument> {
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    return conversation;
  }

  /**
   * Get proactive insight
   */
  async getInsight(): Promise<string> {
    // In future: Analyze DB stats
    const insights = [
      "3 leads haven't been contacted in 7 days. Would you like to call them now?",
      "You have 5 calls scheduled for tomorrow. Prepared for the busy day?",
      "Response rate is up 10% this week. Great job!",
      "John Doe is growing into a top customer. Maybe send a thank you note?",
      "Call duration average is 4m 32s today, slightly above average."
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }
}

export const aiService = new AIService();
