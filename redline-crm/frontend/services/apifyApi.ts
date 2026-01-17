import { ApifyRunInfo, Lead } from '../types';

const API_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000/api';

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
    const response = await fetch(`${API_URL}/apify/config`);
    if (!response.ok) throw new Error('Failed to check Apify config');
    const data = await response.json();
    return data.data.configured;
  },

  /**
   * Start Google Maps scraper (async - returns immediately)
   */
  async startGoogleMapsScraper(input: GoogleMapsSearchInput): Promise<ApifyRunInfo> {
    const response = await fetch(`${API_URL}/apify/google-maps/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start scraper');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Run Google Maps scraper and wait for completion
   */
  async runGoogleMapsScraper(input: GoogleMapsSearchInput): Promise<ApifyRunInfo> {
    const response = await fetch(`${API_URL}/apify/google-maps/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run scraper');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<ApifyRunInfo> {
    const response = await fetch(`${API_URL}/apify/runs/${runId}/status`);
    if (!response.ok) throw new Error('Failed to get run status');
    const data = await response.json();
    return data.data;
  },

  /**
   * Get run results
   */
  async getRunResults(runId: string, limit: number = 100): Promise<RunResultsResponse> {
    const response = await fetch(`${API_URL}/apify/runs/${runId}/results?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get run results');
    const data = await response.json();
    return data.data;
  },

  /**
   * Import results as leads
   */
  async importAsLeads(runId: string, limit: number = 100): Promise<ImportResult> {
    const response = await fetch(`${API_URL}/apify/runs/${runId}/import?limit=${limit}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to import leads');
    const data = await response.json();
    return data.data;
  },

  /**
   * Abort a running scraper
   */
  async abortRun(runId: string): Promise<void> {
    const response = await fetch(`${API_URL}/apify/runs/${runId}/abort`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to abort run');
  },
};
