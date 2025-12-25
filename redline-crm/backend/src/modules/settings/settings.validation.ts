import { z } from 'zod';

// ==================== EMAIL SETTINGS VALIDATION ====================

export const emailSettingsSchema = z.object({
  SMTP_HOST: z.string().min(1, 'SMTP Host is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP Port must be a number'),
  SMTP_USER: z.string().email('Invalid email address'),
  SMTP_PASS: z.string().min(1, 'SMTP Password is required'),
  EMAIL_FROM: z.string().email('Invalid email address').optional(),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

// Partial schema for updates (all fields optional)
export const updateEmailSettingsSchema = emailSettingsSchema.partial();

export type UpdateEmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;
