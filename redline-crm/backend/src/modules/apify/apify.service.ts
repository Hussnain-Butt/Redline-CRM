import { ApifyClient } from 'apify-client';

// Initialize client - will use token from env
const getClient = () => {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not set in environment variables');
  }
  return new ApifyClient({ token });
};

// Google Maps Scraper Actor ID
const GOOGLE_MAPS_ACTOR_ID = 'compass/crawler-google-places';

export interface GoogleMapsInput {
  searchStringsArray: string[];
  locationQuery?: string;
  maxCrawledPlacesPerSearch?: number;
  language?: string;
  deeperCityScrape?: boolean;
}

export interface ApifyRunInfo {
  id: string;
  actorId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  defaultDatasetId: string;
}

export interface GoogleMapsResult {
  title: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  countryCode?: string;
  categoryName?: string;
  totalScore?: number;
  reviewsCount?: number;
  url?: string;
  placeId?: string;
  [key: string]: any;
}

export const apifyService = {
  /**
   * Run Google Maps Scraper
   */
  async runGoogleMapsScraper(input: GoogleMapsInput): Promise<ApifyRunInfo> {
    const client = getClient();
    
    // Prepare input for Google Maps Scraper
    const actorInput = {
      searchStringsArray: input.searchStringsArray,
      locationQuery: input.locationQuery || '',
      maxCrawledPlacesPerSearch: input.maxCrawledPlacesPerSearch || 20,
      language: input.language || 'en',
      deeperCityScrape: input.deeperCityScrape || false,
    };

    // Start the actor run
    const run = await client.actor(GOOGLE_MAPS_ACTOR_ID).call(actorInput) as any;
    
    return {
      id: run.id,
      actorId: run.actorId || GOOGLE_MAPS_ACTOR_ID,
      status: run.status,
      startedAt: run.startedAt?.toISOString() || new Date().toISOString(),
      finishedAt: run.finishedAt?.toISOString(),
      defaultDatasetId: run.defaultDatasetId,
    };
  },

  /**
   * Start actor run asynchronously (doesn't wait for completion)
   */
  async startGoogleMapsScraper(input: GoogleMapsInput): Promise<ApifyRunInfo> {
    const client = getClient();
    
    const actorInput = {
      searchStringsArray: input.searchStringsArray,
      locationQuery: input.locationQuery || '',
      maxCrawledPlacesPerSearch: input.maxCrawledPlacesPerSearch || 20,
      language: input.language || 'en',
      deeperCityScrape: input.deeperCityScrape || false,
    };

    // Start without waiting
    const run = await client.actor(GOOGLE_MAPS_ACTOR_ID).start(actorInput) as any;
    
    return {
      id: run.id,
      actorId: run.actorId || GOOGLE_MAPS_ACTOR_ID,
      status: run.status,
      startedAt: run.startedAt?.toISOString() || new Date().toISOString(),
      finishedAt: run.finishedAt?.toISOString(),
      defaultDatasetId: run.defaultDatasetId,
    };
  },

  /**
   * Get run status
   */
  async getRunStatus(runId: string): Promise<ApifyRunInfo> {
    const client = getClient();
    const run = await client.run(runId).get() as any;
    
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    return {
      id: run.id,
      actorId: run.actId || run.actorId || GOOGLE_MAPS_ACTOR_ID,
      status: run.status,
      startedAt: run.startedAt?.toISOString() || new Date().toISOString(),
      finishedAt: run.finishedAt?.toISOString(),
      defaultDatasetId: run.defaultDatasetId,
    };
  },

  /**
   * Get run results from dataset
   */
  async getRunResults(runId: string, limit: number = 500): Promise<GoogleMapsResult[]> {
    const client = getClient();
    
    // Get run info first to get dataset ID
    const run = await client.run(runId).get();
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    // Fetch results from dataset
    const dataset = await client.dataset(run.defaultDatasetId).listItems({ limit });
    
    return dataset.items as GoogleMapsResult[];
  },

  /**
   * Abort a running actor
   */
  async abortRun(runId: string): Promise<void> {
    const client = getClient();
    await client.run(runId).abort();
  },

  /**
   * Transform Google Maps results to Lead format
   */
  transformToLeads(results: GoogleMapsResult[], runId: string, userId: string, folderId?: string): any[] {
    return results.map(item => ({
      userId,
      name: item.title || 'Unknown',
      phone: item.phone || undefined,
      website: item.website || undefined,
      address: item.address || undefined,
      city: item.city || undefined,
      country: item.countryCode || undefined,
      category: item.categoryName || undefined,
      rating: item.totalScore || undefined,
      reviewCount: item.reviewsCount || 0,
      source: 'google-maps',
      apifyActorId: GOOGLE_MAPS_ACTOR_ID,
      apifyRunId: runId,
      folderId: folderId || undefined,
      rawData: item,
      status: 'new',
    }));
  },

  /**
   * Check if API token is configured
   */
  isConfigured(): boolean {
    return !!process.env.APIFY_API_TOKEN;
  }
};
