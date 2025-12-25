import { Request, Response } from 'express';
import { settingsService } from './settings.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { EmailSettingsInput } from './settings.validation.js';

// ==================== SETTINGS CONTROLLER ====================

/**
 * Get email settings
 * GET /api/settings/email
 */
export const getEmailSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await settingsService.getEmailSettings();
  sendSuccess(res, settings);
});

/**
 * Update email settings
 * PUT /api/settings/email
 */
export const updateEmailSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as EmailSettingsInput;
  const settings = await settingsService.updateEmailSettings(data);
  
  // Mask password in response
  const response = {
    SMTP_HOST: settings.SMTP_HOST,
    SMTP_PORT: settings.SMTP_PORT,
    SMTP_USER: settings.SMTP_USER,
    SMTP_PASS: '••••••••',
    EMAIL_FROM: settings.EMAIL_FROM,
  };
  
  sendSuccess(res, response, 'Email settings updated successfully');
});

/**
 * Test email connection
 * POST /api/settings/email/test
 */
export const testEmailConnection = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as EmailSettingsInput;
  const result = await settingsService.testEmailConnection(data);
  
  if (result.success) {
    sendSuccess(res, result);
  } else {
    res.status(400).json({
      success: false,
      message: result.message,
    });
  }
});
