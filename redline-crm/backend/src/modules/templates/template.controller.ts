import { Request, Response } from 'express';
import { templateService } from './template.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
  calculatePagination,
} from '../../shared/utils/response.js';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateQueryInput,
  ApplyVariablesInput,
} from './template.validation.js';

// ==================== TEMPLATE CONTROLLER ====================

/**
 * Create a new template
 * POST /api/templates
 */
export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateTemplateInput;
  const template = await templateService.create(data);
  sendCreated(res, template, 'Template created successfully');
});

/**
 * Get all templates with filters
 * GET /api/templates
 */
export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as TemplateQueryInput;
  const result = await templateService.getAll(query);

  const pagination = calculatePagination(result.total, result.page, result.limit);
  sendPaginated(res, result.templates, pagination);
});

/**
 * Get a single template by ID
 * GET /api/templates/:id
 */
export const getTemplateById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const template = await templateService.getById(id);
  sendSuccess(res, template);
});

/**
 * Update a template
 * PUT /api/templates/:id
 */
export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateTemplateInput;
  const template = await templateService.update(id, data);
  sendSuccess(res, template, 'Template updated successfully');
});

/**
 * Delete a template
 * DELETE /api/templates/:id
 */
export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await templateService.delete(id);
  sendNoContent(res);
});

/**
 * Apply variables to a template
 * POST /api/templates/:id/apply
 */
export const applyTemplateVariables = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { variables } = req.body as ApplyVariablesInput;
  const result = await templateService.applyVariables(id, variables);
  sendSuccess(res, result);
});

/**
 * Get templates by category
 * GET /api/templates/category/:category
 */
export const getTemplatesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const templates = await templateService.getByCategory(category);
  sendSuccess(res, templates);
});

/**
 * Get template counts by category
 * GET /api/templates/counts
 */
export const getTemplateCounts = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await templateService.getCounts();
  sendSuccess(res, counts);
});

/**
 * Duplicate a template
 * POST /api/templates/:id/duplicate
 */
export const duplicateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const template = await templateService.duplicate(id);
  sendCreated(res, template, 'Template duplicated successfully');
});
