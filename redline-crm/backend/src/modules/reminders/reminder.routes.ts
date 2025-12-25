import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createReminderSchema,
  updateReminderSchema,
  updateStatusSchema,
  reminderQuerySchema,
  idParamSchema,
} from './reminder.validation.js';
import {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  updateReminderStatus,
  getTodayReminders,
  getOverdueReminders,
  getUpcomingReminders,
  getReminderCounts,
} from './reminder.controller.js';

const router = Router();

// ==================== SPECIAL ROUTES (before :id to avoid conflicts) ====================

// GET /api/reminders/today - Get today's reminders
router.get('/today', getTodayReminders);

// GET /api/reminders/overdue - Get overdue reminders
router.get('/overdue', getOverdueReminders);

// GET /api/reminders/upcoming - Get upcoming reminders
router.get('/upcoming', getUpcomingReminders);

// GET /api/reminders/counts - Get reminder counts
router.get('/counts', getReminderCounts);

// ==================== CRUD ROUTES ====================

// GET /api/reminders - Get all reminders with filters
router.get('/', validateRequest(reminderQuerySchema, 'query'), getReminders);

// POST /api/reminders - Create a new reminder
router.post('/', validateRequest(createReminderSchema), createReminder);

// GET /api/reminders/:id - Get a reminder by ID
router.get('/:id', validateRequest(idParamSchema, 'params'), getReminderById);

// PUT /api/reminders/:id - Update a reminder
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateReminderSchema),
  updateReminder
);

// DELETE /api/reminders/:id - Delete a reminder
router.delete('/:id', validateRequest(idParamSchema, 'params'), deleteReminder);

// PATCH /api/reminders/:id/status - Update reminder status only
router.patch(
  '/:id/status',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateStatusSchema),
  updateReminderStatus
);

export default router;
