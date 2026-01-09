import { Router } from 'express';
import { dncController, uploadMiddleware } from './controller.js';

const router = Router();

/**
 * DNC Management Routes
 */

// Upload DNC CSV file
router.post('/upload', uploadMiddleware, dncController.uploadDNCFile.bind(dncController));

// Check single phone number
router.get('/check/:phoneNumber', dncController.checkPhoneNumber.bind(dncController));

// Check batch of phone numbers
router.post('/check-batch', dncController.checkBatch.bind(dncController));

// Get DNC statistics
router.get('/stats', dncController.getStats.bind(dncController));

// Internal DNC management
router.post('/internal/add', dncController.addToInternalDNC.bind(dncController));
router.delete(
  '/internal/:phoneNumber',
  dncController.removeFromInternalDNC.bind(dncController)
);

// Cleanup expired records
router.post('/cleanup', dncController.cleanupExpired.bind(dncController));

export const dncRoutes = router;
