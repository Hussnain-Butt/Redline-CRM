import { FilterQuery, SortOrder } from 'mongoose';
import { Template, ITemplateDocument, ITemplate } from './template.model.js';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateQueryInput,
} from './template.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

// ==================== TEMPLATE SERVICE ====================

export class TemplateService {
  /**
   * Create a new template
   */
  async create(data: CreateTemplateInput & { userId: string }): Promise<ITemplateDocument> {
    const template = new Template(data);
    return await template.save();
  }

  /**
   * Get all templates with filtering, sorting, and pagination
   */
  async getAll(userId: string, query: TemplateQueryInput): Promise<{
    templates: ITemplateDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, category, search, sortBy, sortOrder } = query;

    // Build filter
    const filter: FilterQuery<ITemplate> = { userId };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: { [key: string]: SortOrder } = {
      [sortBy || 'name']: sortOrder === 'desc' ? -1 : 1,
    };

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      Template.find(filter).sort(sort).skip(skip).limit(limit),
      Template.countDocuments(filter),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single template by ID
   */
  async getById(id: string, userId: string): Promise<ITemplateDocument> {
    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      throw new AppError('Template not found', 404);
    }
    return template;
  }

  /**
   * Update a template
   */
  async update(id: string, userId: string, data: UpdateTemplateInput): Promise<ITemplateDocument> {
    const template = await Template.findOne({ _id: id, userId });
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Update fields
    Object.assign(template, data);
    return await template.save(); // This triggers the pre-save hook to update variables
  }

  /**
   * Delete a template
   */
  async delete(id: string, userId: string): Promise<void> {
    const template = await Template.findOneAndDelete({ _id: id, userId });
    if (!template) {
      throw new AppError('Template not found', 404);
    }
  }

  /**
   * Apply variables to template content
   * Replaces {{variable}} placeholders with actual values
   */
  async applyVariables(
    id: string,
    userId: string,
    variables: Record<string, string>
  ): Promise<{ content: string; subject?: string }> {
    const template = await this.getById(id, userId);

    let content = template.content;
    let subject = template.subject;

    // Replace all variables in content and subject
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
      if (subject) {
        subject = subject.replace(regex, value);
      }
    }

    return { content, subject };
  }

  /**
   * Get templates by category
   */
  async getByCategory(category: string, userId: string): Promise<ITemplateDocument[]> {
    return await Template.find({ category, userId }).sort({ name: 1 });
  }

  /**
   * Get template counts by category
   */
  async getCounts(userId: string): Promise<Record<string, number>> {
    const categories = ['proposal', 'follow-up', 'welcome', 'custom'];
    const counts: Record<string, number> = {};

    for (const category of categories) {
      counts[category] = await Template.countDocuments({ category, userId });
    }

    counts.total = await Template.countDocuments({ userId });
    return counts;
  }

  /**
   * Duplicate a template
   */
  async duplicate(id: string, userId: string): Promise<ITemplateDocument> {
    const original = await this.getById(id, userId);
    
    const duplicate = new Template({
      userId,
      name: `${original.name} (Copy)`,
      category: original.category,
      subject: original.subject,
      content: original.content,
    });

    return await duplicate.save();
  }
}

// Export singleton instance
export const templateService = new TemplateService();
