import { Router } from 'express';
import * as phoneNumberController from './phoneNumber.controller.js';

const router = Router();

router.get('/', phoneNumberController.getPhoneNumbers);
router.post('/', phoneNumberController.createPhoneNumber);
router.post('/sync', phoneNumberController.syncPhoneNumbers);
router.put('/:id', phoneNumberController.updatePhoneNumber);
router.delete('/:id', phoneNumberController.deletePhoneNumber);

export const phoneNumberRoutes = router;
