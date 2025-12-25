import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { sendSuccess } from '../../shared/utils/response.js';

/**
 * Get core dashboard stats
 * GET /api/dashboard/stats
 */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  sendSuccess(res, stats);
});

/**
 * Get today's overview (widgets)
 * GET /api/dashboard/today
 */
export const getTodayOverview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await dashboardService.getTodayOverview();
  sendSuccess(res, data);
});

/**
 * Get AI insights
 * GET /api/dashboard/insights
 */
export const getDashboardInsights = asyncHandler(async (_req: Request, res: Response) => {
  const insights = await dashboardService.getInsights();
  sendSuccess(res, insights);
});
