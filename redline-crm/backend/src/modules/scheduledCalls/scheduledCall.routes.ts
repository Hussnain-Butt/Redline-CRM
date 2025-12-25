import { Router } from 'express';
import * as scheduledCallController from './scheduledCall.controller.js';

const router = Router();

router.get('/contact/:contactId', scheduledCallController.getScheduledCallsByContact);
router.post('/', scheduledCallController.createScheduledCall);
router.put('/:id', scheduledCallController.updateScheduledCall);
router.delete('/:id', scheduledCallController.deleteScheduledCall);

export const scheduledCallRoutes = router;
