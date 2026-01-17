import { Router } from 'express';
import { apifyController } from './apify.controller.js';

const router = Router();

// Check configuration
router.get('/config', apifyController.checkConfig);

// Google Maps Scraper
router.post('/google-maps/start', apifyController.startGoogleMapsScraper);
router.post('/google-maps/run', apifyController.runGoogleMapsScraper);

// Run management
router.get('/runs/:runId/status', apifyController.getRunStatus);
router.get('/runs/:runId/results', apifyController.getRunResults);
router.post('/runs/:runId/import', apifyController.importAsLeads);
router.post('/runs/:runId/abort', apifyController.abortRun);

export const apifyRoutes = router;
