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
    try {
      const { runId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      // Fetch results
      const results = await apifyService.getRunResults(runId, limit);
      const leads = apifyService.transformToLeads(results, runId, req.userId!);
      
      // Bulk insert
      const result = await leadService.bulkCreate(leads, req.userId!);
      
      return res.json({ 
        success: true, 
        data: {
          total: results.length,
          inserted: result.inserted,
          duplicates: result.duplicates
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
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
