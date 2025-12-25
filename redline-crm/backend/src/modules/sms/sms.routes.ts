import { Router } from 'express';
import * as smsController from './sms.controller.js';

const router = Router();

router.get('/', smsController.getAllSMS);
router.get('/contact/:contactId', smsController.getSMSByContact);
router.post('/', smsController.createSMS);
router.post('/status', smsController.updateSMSStatus); // For Twilio webhooks

export const smsRoutes = router;
