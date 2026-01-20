import { Request, Response } from 'express';
import { apifyService, GoogleMapsInput } from './apify.service.js';
import { leadService } from '../leads/index.js';

export const apifyController = {
  /**
   * Check if Apify is configured
   */
  async checkConfig(_req: Request, res: Response) {
    try {
      const configured = apifyService.isConfigured();
      return res.json({ success: true, data: { configured } });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Start Google Maps scraper (async - returns immediately)
   */
  async startGoogleMapsScraper(req: Request, res: Response) {
    try {
      const input: GoogleMapsInput = {
        searchStringsArray: req.body.searchQueries || [],
        locationQuery: req.body.location,
        maxCrawledPlacesPerSearch: req.body.maxResults || 20,
        language: req.body.language || 'en',
      };

      if (!input.searchStringsArray.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'searchQueries is required and must be a non-empty array' 
        });
      }

      const run = await apifyService.startGoogleMapsScraper(input);
      return res.json({ success: true, data: run });
    } catch (error: any) {
      console.error('Apify start error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Run Google Maps scraper and wait for completion
   */
  async runGoogleMapsScraper(req: Request, res: Response) {
    try {
      const input: GoogleMapsInput = {
        searchStringsArray: req.body.searchQueries || [],
        locationQuery: req.body.location,
        maxCrawledPlacesPerSearch: req.body.maxResults || 20,
        language: req.body.language || 'en',
      };

      if (!input.searchStringsArray.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'searchQueries is required and must be a non-empty array' 
        });
      }

      const run = await apifyService.runGoogleMapsScraper(input);
      return res.json({ success: true, data: run });
    } catch (error: any) {
      console.error('Apify run error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get run status
   */
  async getRunStatus(req: Request, res: Response) {
    try {
      const { runId } = req.params;
      const run = await apifyService.getRunStatus(runId);
      return res.json({ success: true, data: run });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get run results
   */
  async getRunResults(req: Request, res: Response) {
    try {
      const { runId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const results = await apifyService.getRunResults(runId, limit);
      const leads = apifyService.transformToLeads(results, runId, req.userId!);
      
      return res.json({ 
        success: true, 
        data: { 
          count: results.length,
          leads,
          raw: results 
        } 
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Import results as leads
   */
  async importAsLeads(req: Request, res: Response) {
    console.log('--- APIFY IMPORT START ---');
    try {
      const { runId } = req.params;
      const { folderId } = req.body;
      const limit = parseInt(req.query.limit as string) || 100;
      const userId = req.userId;
      
      console.log('Params:', { runId, limit, folderId, userId });

      if (!userId) {
        console.error('Import failed: req.userId is missing');
        return res.status(401).json({ success: false, error: 'User not authenticated (req.userId missing)' });
      }
      
      console.log(`Step 1: Fetching results for run ${runId}`);
      const results = await apifyService.getRunResults(runId, limit);
      console.log(`Step 2: Fetched ${results?.length || 0} results`);
      
      if (!Array.isArray(results)) {
        throw new Error('Apify results are not an array');
      }

      console.log('Step 3: Transforming to leads');
      const leads = apifyService.transformToLeads(results, runId, userId, folderId);
      console.log(`Step 4: Transformed into ${leads.length} lead objects`);
      
      console.log('Step 5: Calling bulkCreate');
      const result = await leadService.bulkCreate(leads, userId);
      console.log('Step 6: Import finished successfully', result);
      
      return res.json({ 
        success: true, 
        data: {
          total: results.length,
          inserted: result.inserted,
          duplicates: result.duplicates
        }
      });
    } catch (error: any) {
      console.error('--- APIFY IMPORT ERROR ---');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.response) {
        console.error('Response Data:', error.response.data);
      }
      
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Internal server error during import',
        details: error.stack,
        apifyError: error.response?.data
      });
    } finally {
      console.log('--- APIFY IMPORT END ---');
    }
  },

  /**
   * Abort a running scraper
   */
  async abortRun(req: Request, res: Response) {
    try {
      const { runId } = req.params;
      await apifyService.abortRun(runId);
      return res.json({ success: true, message: 'Run aborted' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};
