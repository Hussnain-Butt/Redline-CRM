import { Schema, model, Document } from 'mongoose';

// ==================== TYPES ====================

export type TemplateCategory = 'sales' | 'meeting' | 'follow-up' | 'proposal' | 'contract' | 'welcome' | 'custom';

// ==================== INTERFACE ====================

export interface ITemplate {
  userId: string;  // Clerk user ID for multi-tenancy
  name: string;
  category: TemplateCategory;
  subject?: string;
  content: string;
  variables: string[];  // Array of variable placeholders like {{name}}, {{company}}
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateDocument extends ITemplate, Document {}

// ==================== SCHEMA ====================

const templateSchema = new Schema<ITemplateDocument>(
  {
    userId: { type: String, required: true, index: true },  // Clerk user ID
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: ['sales', 'meeting', 'follow-up', 'proposal', 'contract', 'welcome', 'custom'],
      default: 'custom',
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Template content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    variables: {
      type: [String],
      default: [],
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

// Index for category-based filtering
templateSchema.index({ category: 1 });

// Index for name search
templateSchema.index({ name: 'text' });

// ==================== METHODS ====================

/**
 * Extract variables from content (finds {{variable}} patterns)
 */
templateSchema.pre('save', function (next) {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const matches = this.content.match(variableRegex);
  if (matches) {
    // Extract variable names without the braces
    this.variables = [...new Set(matches.map(m => m.slice(2, -2)))];
  } else {
    this.variables = [];
  }
  next();
});

// ==================== MODEL ====================

export const Template = model<ITemplateDocument>('Template', templateSchema);
