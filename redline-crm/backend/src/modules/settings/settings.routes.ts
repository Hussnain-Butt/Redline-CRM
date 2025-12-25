import { Router } from 'express';
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
} from './settings.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { emailSettingsSchema } from './settings.validation.js';

const router = Router();

// ==================== SETTINGS ROUTES ====================

/**
 * @route   GET /api/settings/email
 * @desc    Get email settings
 * @access  Private (add auth middleware later)
 */
router.get('/email', getEmailSettings);

/**
 * @route   PUT /api/settings/email
 * @desc    Update email settings
 * @access  Private (add auth middleware later)
 */
router.put('/email', validateRequest(emailSettingsSchema), updateEmailSettings);

/**
 * @route   POST /api/settings/email/test
 * @desc    Test email connection
 * @access  Private (add auth middleware later)
 */
router.post('/email/test', validateRequest(emailSettingsSchema), testEmailConnection);

export default router;
