import { Router } from 'express';
import * as contactController from './contact.controller.js';

const router = Router();

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);
router.post('/', contactController.createContact);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.post('/import', contactController.importContacts);

export const contactRoutes = router;
