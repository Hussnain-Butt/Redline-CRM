import { Router } from 'express';
import {
  getDashboardStats,
  getTodayOverview,
  getDashboardInsights,
} from './dashboard.controller.js';

const router = Router();

// GET /api/dashboard/stats - Main stats
router.get('/stats', getDashboardStats);

// GET /api/dashboard/today - Today's tasks/widgets
router.get('/today', getTodayOverview);

// GET /api/dashboard/insights - AI Insights
router.get('/insights', getDashboardInsights);

export default router;
