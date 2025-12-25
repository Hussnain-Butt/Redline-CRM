import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  applyVariablesSchema,
  templateQuerySchema,
  idParamSchema,
} from './template.validation.js';
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  applyTemplateVariables,
  getTemplatesByCategory,
  getTemplateCounts,
  duplicateTemplate,
} from './template.controller.js';

const router = Router();

// ==================== SPECIAL ROUTES (before :id to avoid conflicts) ====================

// GET /api/templates/counts - Get template counts by category
router.get('/counts', getTemplateCounts);

// GET /api/templates/category/:category - Get templates by category
router.get('/category/:category', getTemplatesByCategory);

// ==================== CRUD ROUTES ====================

// GET /api/templates - Get all templates with filters
router.get('/', validateRequest(templateQuerySchema, 'query'), getTemplates);

// POST /api/templates - Create a new template
router.post('/', validateRequest(createTemplateSchema), createTemplate);

// GET /api/templates/:id - Get a template by ID
router.get('/:id', validateRequest(idParamSchema, 'params'), getTemplateById);

// PUT /api/templates/:id - Update a template
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateTemplateSchema),
  updateTemplate
);

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', validateRequest(idParamSchema, 'params'), deleteTemplate);

// ==================== SPECIAL ACTIONS ====================

// POST /api/templates/:id/apply - Apply variables to a template
router.post(
  '/:id/apply',
  validateRequest(idParamSchema, 'params'),
  validateRequest(applyVariablesSchema),
  applyTemplateVariables
);

// POST /api/templates/:id/duplicate - Duplicate a template
router.post('/:id/duplicate', validateRequest(idParamSchema, 'params'), duplicateTemplate);

export default router;
