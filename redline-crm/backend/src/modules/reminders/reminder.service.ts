import { FilterQuery, SortOrder, Types } from 'mongoose';
import { Reminder, IReminderDocument, IReminder } from './reminder.model.js';
import {
  CreateReminderInput,
  UpdateReminderInput,
  ReminderQueryInput,
} from './reminder.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

// ==================== REMINDER SERVICE ====================

export class ReminderService {
  /**
   * Create a new reminder
   */
  async create(data: CreateReminderInput): Promise<IReminderDocument> {
    const reminder = new Reminder({
      ...data,
      contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    });
    return await reminder.save();
  }

  /**
   * Get all reminders with filtering, sorting, and pagination
   */
  async getAll(query: ReminderQueryInput): Promise<{
    reminders: IReminderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, type, priority, contactId, sortBy, sortOrder } = query;

    // Build filter
    const filter: FilterQuery<IReminder> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (contactId) filter.contactId = new Types.ObjectId(contactId);

    // Build sort
    const sort: { [key: string]: SortOrder } = {
      [sortBy || 'dueDate']: sortOrder === 'desc' ? -1 : 1,
    };

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [reminders, total] = await Promise.all([
      Reminder.find(filter).sort(sort).skip(skip).limit(limit),
      Reminder.countDocuments(filter),
    ]);

    return {
      reminders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single reminder by ID
   */
  async getById(id: string): Promise<IReminderDocument> {
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
    return reminder;
  }

  /**
   * Update a reminder
   */
  async update(id: string, data: UpdateReminderInput): Promise<IReminderDocument> {
    const updateData: any = { ...data };
    if (data.contactId) {
      updateData.contactId = new Types.ObjectId(data.contactId);
    }

    const reminder = await Reminder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
    return reminder;
  }

  /**
   * Delete a reminder
   */
  async delete(id: string): Promise<void> {
    const reminder = await Reminder.findByIdAndDelete(id);
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
  }

  /**
   * Update reminder status only
   */
  async updateStatus(id: string, status: string): Promise<IReminderDocument> {
    const reminder = await Reminder.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
    return reminder;
  }

  /**
   * Get today's reminders
   */
  async getToday(): Promise<IReminderDocument[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await Reminder.find({
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'completed' },
    }).sort({ dueTime: 1, priority: -1 });
  }

  /**
   * Get overdue reminders
   */
  async getOverdue(): Promise<IReminderDocument[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return await Reminder.find({
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    }).sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcoming(): Promise<IReminderDocument[]> {
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    return await Reminder.find({
      dueDate: { $gte: startOfTomorrow, $lte: endOfWeek },
      status: { $ne: 'completed' },
    }).sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Get reminder counts by status
   */
  async getCounts(): Promise<{
    pending: number;
    completed: number;
    overdue: number;
    today: number;
  }> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [pending, completed, overdue, today] = await Promise.all([
      Reminder.countDocuments({ status: 'pending' }),
      Reminder.countDocuments({ status: 'completed' }),
      Reminder.countDocuments({ dueDate: { $lt: now }, status: { $ne: 'completed' } }),
      Reminder.countDocuments({
        dueDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'completed' },
      }),
    ]);

    return { pending, completed, overdue, today };
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
