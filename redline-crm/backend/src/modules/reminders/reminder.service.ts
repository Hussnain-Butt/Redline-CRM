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
  async create(data: CreateReminderInput & { userId: string }): Promise<IReminderDocument> {
    const reminder = new Reminder({
      ...data,
      contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    });
    return await reminder.save();
  }

  /**
   * Get all reminders with filtering, sorting, and pagination
   */
  async getAll(userId: string, query: ReminderQueryInput): Promise<{
    reminders: IReminderDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, status, type, priority, contactId, sortBy, sortOrder } = query;

    // Build filter
    const filter: FilterQuery<IReminder> = { userId };
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
  async getById(id: string, userId: string): Promise<IReminderDocument> {
    const reminder = await Reminder.findOne({ _id: id, userId });
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
    return reminder;
  }

  /**
   * Update a reminder
   */
  async update(id: string, userId: string, data: UpdateReminderInput): Promise<IReminderDocument> {
    const updateData: any = { ...data };
    if (data.contactId) {
      updateData.contactId = new Types.ObjectId(data.contactId);
    }

    const reminder = await Reminder.findOneAndUpdate({ _id: id, userId }, updateData, {
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
  async delete(id: string, userId: string): Promise<void> {
    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }
  }

  /**
   * Update reminder status only
   */
  async updateStatus(id: string, userId: string, status: string): Promise<IReminderDocument> {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId },
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
  async getToday(userId: string): Promise<IReminderDocument[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await Reminder.find({
      userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'completed' },
    }).sort({ dueTime: 1, priority: -1 });
  }

  /**
   * Get overdue reminders
   */
  async getOverdue(userId: string): Promise<IReminderDocument[]> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return await Reminder.find({
      userId,
      dueDate: { $lt: now },
      status: { $ne: 'completed' },
    }).sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Get upcoming reminders (next 7 days)
   */
  async getUpcoming(userId: string): Promise<IReminderDocument[]> {
    const startOfTomorrow = new Date();
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    return await Reminder.find({
      userId,
      dueDate: { $gte: startOfTomorrow, $lte: endOfWeek },
      status: { $ne: 'completed' },
    }).sort({ dueDate: 1, priority: -1 });
  }

  /**
   * Get reminder counts by status
   */
  async getCounts(userId: string): Promise<{
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
      Reminder.countDocuments({ userId, status: 'pending' }),
      Reminder.countDocuments({ userId, status: 'completed' }),
      Reminder.countDocuments({ userId, dueDate: { $lt: now }, status: { $ne: 'completed' } }),
      Reminder.countDocuments({
        userId,
        dueDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'completed' },
      }),
    ]);

    return { pending, completed, overdue, today };
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
