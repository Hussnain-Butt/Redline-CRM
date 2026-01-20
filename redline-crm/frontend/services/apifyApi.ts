import { ApifyRunInfo, Lead } from '../types';
import apiClient from './apiClient';

export interface GoogleMapsSearchInput {
  searchQueries: string[];
  location?: string;
  maxResults?: number;
  language?: string;
}

export interface RunResultsResponse {
  count: number;
  leads: Lead[];
  raw: any[];
}

export interface ImportResult {
  total: number;
  inserted: number;
  duplicates: number;
}

export const apifyApi = {
  /**
   * Check if Apify API is configured
   */
  async checkConfig(): Promise<boolean> {
    const { data } = await apiClient.get('/apify/config');
    return data.data.configured;
  },

  /**
   * Start Google Maps scraper (async - returns immediately)
   */
  async startGoogleMapsScraper(input: GoogleMapsSearchInput): Promise<ApifyRunInfo> {
    const { data } = await apiClient.post('/apify/google-maps/start', input);
    return data.data;
  },

  /**
   * Run Google Maps scraper and wait for completion
   */
  async runGoogleMapsScraper(input: GoogleMapsSearchInput): Promise<ApifyRunInfo> {
    const { data } = await apiClient.post('/apify/google-maps/run', input);
    return data.data;
  },

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<ApifyRunInfo> {
    const { data } = await apiClient.get(`/apify/runs/${runId}/status`);
    return data.data;
  },

  /**
   * Get run results
   */
  async getRunResults(runId: string, limit: number = 100): Promise<RunResultsResponse> {
    const { data } = await apiClient.get(`/apify/runs/${runId}/results`, { params: { limit } });
    return data.data;
  },

  /**
   * Import results as leads
   */
  async importAsLeads(runId: string, limit: number = 100, folderId?: string): Promise<ImportResult> {
    const { data } = await apiClient.post(`/apify/runs/${runId}/import`, { folderId }, { params: { limit } });
    return data.data;
  },

  /**
   * Abort a running scraper
   */
  async abortRun(runId: string): Promise<void> {
    await apiClient.post(`/apify/runs/${runId}/abort`);
  },
};
