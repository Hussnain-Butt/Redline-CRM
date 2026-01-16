import { Router } from 'express';
import * as smsController from './sms.controller.js';

const router = Router();

router.get('/', smsController.getAllSMS);
router.get('/unread-count', smsController.getUnreadCount); // Get unread message count
router.get('/contact/:contactId', smsController.getSMSByContact);
router.post('/', smsController.createSMS);
router.post('/send', smsController.sendSMS); // New: Send SMS via backend
router.post('/mark-read', smsController.markAsRead); // Mark messages as read
router.post('/incoming', smsController.handleIncomingSMS); // Twilio incoming SMS webhook
router.post('/status', smsController.updateSMSStatus); // Twilio status callback webhook

export const smsRoutes = router;
