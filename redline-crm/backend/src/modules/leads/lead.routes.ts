import { Router } from 'express';
import { leadController } from './lead.controller.js';

const router = Router();

// Lead CRUD
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
