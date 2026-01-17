import { Router } from 'express';
import { leadController } from './lead.controller.js';
import { leadFolderController } from './leadFolder.controller.js';

const router = Router();

// ========== FOLDER ROUTES ==========
router.get('/folders', leadFolderController.getAll);
router.get('/folders/:id', leadFolderController.getById);
router.post('/folders', leadFolderController.create);
router.put('/folders/:id', leadFolderController.update);
router.delete('/folders/:id', leadFolderController.delete);

// ========== LEAD ROUTES ==========
router.get('/', leadController.getAll);
router.get('/stats', leadController.getStats);
router.get('/:id', leadController.getById);
router.post('/', leadController.create);
router.post('/bulk', leadController.bulkCreate);
router.put('/:id', leadController.update);
router.patch('/:id/status', leadController.updateStatus);
router.delete('/:id', leadController.delete);

// Convert to contact
router.post('/:id/convert', leadController.convertToContact);

export const leadRoutes = router;
