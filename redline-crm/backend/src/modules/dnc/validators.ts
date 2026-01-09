import { z } from 'zod';

/**
 * Phone number validation - Must be E.164 format
 * Example: +12025551234
 */
const phoneNumberSchema = z
  .string()
  .regex(/^\+1\d{10}$/, 'Phone number must be in E.164 format (+1XXXXXXXXXX)');

/**
 * Validator for single phone number check
 */
export const checkPhoneNumberSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

/**
 * Validator for batch phone number check
 * Max 1000 numbers per request to prevent overload
 */
export const checkBatchSchema = z.object({
  phoneNumbers: z
    .array(phoneNumberSchema)
    .min(1, 'At least one phone number required')
    .max(1000, 'Maximum 1000 numbers allowed per batch'),
});

/**
 * Validator for adding to internal DNC list
 */
export const addInternalDNCSchema = z.object({
  phoneNumber: phoneNumberSchema,
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  requestMethod: z.enum(['PHONE_CALL', 'TEXT_MESSAGE', 'EMAIL', 'WEB_FORM', 'MANUAL']),
  contactId: z.string().optional(),
  processedBy: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Validator for removing from internal DNC list
 */
export const removeInternalDNCSchema = z.object({
  phoneNumber: phoneNumberSchema,
  removedBy: z.string().min(2),
  removedReason: z.string().min(5, 'Removal reason must be at least 5 characters').max(500),
});

/**
 * Validator for CSV file upload
 */
export const uploadDNCFileSchema = z.object({
  filename: z.string().refine((name) => name.endsWith('.csv'), {
    message: 'Only CSV files are allowed',
  }),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
  source: z.enum(['NATIONAL', 'STATE', 'MANUAL']),
  state: z.string().length(2).optional(), // US state code (e.g., 'CA', 'NY')
  uploadedBy: z.string().optional(),
});

/**
 * Validator for DNC stats query
 */
export const getDNCStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  source: z.enum(['NATIONAL', 'STATE', 'INTERNAL', 'MANUAL_UPLOAD', 'ALL']).optional(),
});

export type CheckPhoneNumberInput = z.infer<typeof checkPhoneNumberSchema>;
export type CheckBatchInput = z.infer<typeof checkBatchSchema>;
export type AddInternalDNCInput = z.infer<typeof addInternalDNCSchema>;
export type RemoveInternalDNCInput = z.infer<typeof removeInternalDNCSchema>;
export type UploadDNCFileInput = z.infer<typeof uploadDNCFileSchema>;
export type GetDNCStatsInput = z.infer<typeof getDNCStatsSchema>;
