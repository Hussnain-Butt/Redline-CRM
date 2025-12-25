import { Request, Response } from 'express';
import { reminderService } from './reminder.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
  calculatePagination,
} from '../../shared/utils/response.js';
import {
  CreateReminderInput,
  UpdateReminderInput,
  ReminderQueryInput,
  UpdateStatusInput,
} from './reminder.validation.js';

// ==================== REMINDER CONTROLLER ====================

/**
 * Create a new reminder
 * POST /api/reminders
 */
export const createReminder = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateReminderInput;
  const reminder = await reminderService.create(data);
  sendCreated(res, reminder, 'Reminder created successfully');
});

/**
 * Get all reminders with filters
 * GET /api/reminders
 */
export const getReminders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReminderQueryInput;
  const result = await reminderService.getAll(query);

  const pagination = calculatePagination(result.total, result.page, result.limit);
  sendPaginated(res, result.reminders, pagination);
});

/**
 * Get a single reminder by ID
 * GET /api/reminders/:id
 */
export const getReminderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reminder = await reminderService.getById(id);
  sendSuccess(res, reminder);
});

/**
 * Update a reminder
 * PUT /api/reminders/:id
 */
export const updateReminder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateReminderInput;
  const reminder = await reminderService.update(id, data);
  sendSuccess(res, reminder, 'Reminder updated successfully');
});

/**
 * Delete a reminder
 * DELETE /api/reminders/:id
 */
export const deleteReminder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await reminderService.delete(id);
  sendNoContent(res);
});

/**
 * Update reminder status only
 * PATCH /api/reminders/:id/status
 */
export const updateReminderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as UpdateStatusInput;
  const reminder = await reminderService.updateStatus(id, status);
  sendSuccess(res, reminder, 'Reminder status updated');
});

/**
 * Get today's reminders
 * GET /api/reminders/today
 */
export const getTodayReminders = asyncHandler(async (_req: Request, res: Response) => {
  const reminders = await reminderService.getToday();
  sendSuccess(res, reminders);
});

/**
 * Get overdue reminders
 * GET /api/reminders/overdue
 */
export const getOverdueReminders = asyncHandler(async (_req: Request, res: Response) => {
  const reminders = await reminderService.getOverdue();
  sendSuccess(res, reminders);
});

/**
 * Get upcoming reminders (next 7 days)
 * GET /api/reminders/upcoming
 */
export const getUpcomingReminders = asyncHandler(async (_req: Request, res: Response) => {
  const reminders = await reminderService.getUpcoming();
  sendSuccess(res, reminders);
});

/**
 * Get reminder counts
 * GET /api/reminders/counts
 */
export const getReminderCounts = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await reminderService.getCounts();
  sendSuccess(res, counts);
});
