import { Schema, model, Document, Types } from 'mongoose';

// ==================== TYPES ====================

export type MessageRole = 'user' | 'assistant' | 'system';

// ==================== INTERFACES ====================

export interface IMessage {
  role: MessageRole;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IConversation {
  userId: string;
  contactId?: Types.ObjectId;
  title: string;
  messages: IMessage[];
  context?: string; // System prompt or context used
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document {}

// ==================== SCHEMAS ====================

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    _id: false, // Messages are subdocuments
  }
);

const conversationSchema = new Schema<IConversationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
      required: false,
    },
    title: {
      type: String,
      trim: true,
      default: 'New Conversation',
    },
    messages: [messageSchema],
    context: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  }
);

// ==================== INDEXES ====================

conversationSchema.index({ userId: 1, contactId: 1, updatedAt: -1 });

// ==================== MODEL ====================

export const Conversation = model<IConversationDocument>('Conversation', conversationSchema);
