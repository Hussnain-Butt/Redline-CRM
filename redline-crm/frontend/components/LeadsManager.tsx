import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Target,
  MapPin,
  Play,
  Loader2,
  Download,
  Trash2,
  UserPlus,
  Star,
  Phone,
  Globe,
  Building2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  BarChart3,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { Lead, LeadStatus, ApifyRunInfo } from '../types';
import { leadsApi, LeadStats } from '../services/leadsApi';
import { apifyApi, GoogleMapsSearchInput, RunResultsResponse } from '../services/apifyApi';

const LEAD_STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' },
  contacted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contacted' },
  qualified: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Qualified' },
  converted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Converted' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

const LeadsManager: React.FC = () => {
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Scraper State
  const [scraperOpen, setScraperOpen] = useState(false);
  const [scraperQuery, setScraperQuery] = useState('');
  const [scraperLocation, setScraperLocation] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [scraperRunning, setScraperRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<ApifyRunInfo | null>(null);
  const [previewResults, setPreviewResults] = useState<RunResultsResponse | null>(null);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Load leads and stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsData, statsData] = await Promise.all([
        leadsApi.getAll(),
        leadsApi.getStats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check Apify configuration
  const checkConfig = useCallback(async () => {
    try {
      const configured = await apifyApi.checkConfig();
      setIsConfigured(configured);
    } catch {
      setIsConfigured(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    checkConfig();
  }, [loadData, checkConfig]);

  // Poll for run status
  useEffect(() => {
    if (!currentRun || currentRun.status === 'SUCCEEDED' || currentRun.status === 'FAILED') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await apifyApi.getRunStatus(currentRun.id);
        setCurrentRun(status);

        if (status.status === 'SUCCEEDED') {
          // Fetch results
          const results = await apifyApi.getRunResults(currentRun.id);
          setPreviewResults(results);
          setScraperRunning(false);
        } else if (status.status === 'FAILED' || status.status === 'ABORTED') {
          setScraperError('Scraper failed or was aborted');
          setScraperRunning(false);
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentRun]);

  // Start scraper
  const handleStartScraper = async () => {
    if (!scraperQuery.trim()) {
      setScraperError('Please enter a search query');
      return;
    }

    try {
      setScraperError(null);
      setScraperRunning(true);
      setPreviewResults(null);

      const input: GoogleMapsSearchInput = {
        searchQueries: [scraperQuery.trim()],
        location: scraperLocation.trim() || undefined,
        maxResults: maxResults,
      };

      const run = await apifyApi.startGoogleMapsScraper(input);
      setCurrentRun(run);
    } catch (error: any) {
      setScraperError(error.message);
      setScraperRunning(false);
    }
  };

  // Import leads
  const handleImportLeads = async () => {
    if (!currentRun) return;

    try {
      setImporting(true);
      const result = await apifyApi.importAsLeads(currentRun.id, maxResults);
      
      // Refresh leads list
      await loadData();
      
      // Reset scraper state
      setScraperOpen(false);
      setCurrentRun(null);
      setPreviewResults(null);
      setScraperQuery('');
      setScraperLocation('');
      
      alert(`Imported ${result.inserted} leads! (${result.duplicates} duplicates skipped)`);
    } catch (error: any) {
      setScraperError(error.message);
    } finally {
      setImporting(false);
    }
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await leadsApi.updateStatus(leadId, status);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Convert to contact
  const handleConvertToContact = async (leadId: string) => {
    try {
      await leadsApi.convertToContact(leadId);
      await loadData();
      setSelectedLead(null);
      alert('Lead converted to contact successfully!');
    } catch (error) {
      console.error('Failed to convert:', error);
      alert('Failed to convert lead to contact');
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await leadsApi.delete(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.address?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, gradient }: any) => (
    <div className="stat-card group">
      <div className="stat-card-glow" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${gradient} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-neutral-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white">
                <Target className="w-6 h-6" />
              </div>
              Leads Manager
            </h1>
            <p className="text-neutral-500 mt-1">Scrape and manage business leads from Google Maps</p>
          </div>
          <button
            onClick={() => setScraperOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
          >
            <MapPin className="w-5 h-5" />
            <span className="font-semibold">New Scrape</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={stats?.total || 0}
            icon={Target}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="New Leads"
            value={stats?.byStatus?.new || 0}
            icon={AlertCircle}
            gradient="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            title="Qualified"
            value={stats?.byStatus?.qualified || 0}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            title="Converted"
            value={stats?.byStatus?.converted || 0}
            icon={UserPlus}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leads List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 bg-white border-b border-neutral-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search leads by name, company, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Leads Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                <Target className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">No leads found</p>
                <p className="text-sm mb-4">Start scraping to generate leads</p>
                <button
                  onClick={() => setScraperOpen(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  New Scrape
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Business</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-neutral-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-900">{lead.name}</p>
                              {lead.category && (
                                <p className="text-xs text-neutral-500">{lead.category}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {lead.phone && (
                              <p className="text-sm text-neutral-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </p>
                            )}
                            {lead.website && (
                              <p className="text-sm text-blue-600 flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{lead.website}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {lead.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="font-medium text-neutral-900">{lead.rating.toFixed(1)}</span>
                              <span className="text-xs text-neutral-500">({lead.reviewCount})</span>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.status].bg} ${LEAD_STATUS_COLORS[lead.status].text}`}>
                            {LEAD_STATUS_COLORS[lead.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConvertToContact(lead.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Convert to Contact"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lead Detail Sidebar */}
        {selectedLead && (
          <div className="w-96 bg-white border-l border-neutral-100 flex flex-col overflow-hidden animate-slide-in-right">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Header */}
              <div className="text-center pb-4 border-b border-neutral-100">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                  {selectedLead.name.charAt(0)}
                </div>
                <h4 className="font-bold text-lg text-neutral-900">{selectedLead.name}</h4>
                {selectedLead.category && (
                  <p className="text-sm text-neutral-500">{selectedLead.category}</p>
                )}
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${LEAD_STATUS_COLORS[selectedLead.status].bg} ${LEAD_STATUS_COLORS[selectedLead.status].text}`}>
                    {LEAD_STATUS_COLORS[selectedLead.status].label}
                  </span>
                </div>
              </div>

              {/* Rating */}
              {selectedLead.rating && (
                <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-lg text-amber-700">{selectedLead.rating.toFixed(1)}</span>
                  <span className="text-amber-600">({selectedLead.reviewCount} reviews)</span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3">
                {selectedLead.phone && (
                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <Phone className="w-5 h-5 text-neutral-500" />
                    <div>
                      <p className="text-xs text-neutral-500">Phone</p>
                      <p className="font-medium text-neutral-900">{selectedLead.phone}</p>
                    </div>
                  </div>
                )}
                {selectedLead.website && (
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-500">Website</p>
                      <p className="font-medium text-blue-600 truncate">{selectedLead.website}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                  </a>
                )}
                {selectedLead.address && (
                  <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-neutral-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-neutral-500">Address</p>
                      <p className="font-medium text-neutral-900">{selectedLead.address}</p>
                      {(selectedLead.city || selectedLead.country) && (
                        <p className="text-sm text-neutral-600">{[selectedLead.city, selectedLead.country].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(LEAD_STATUS_COLORS) as LeadStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedLead.id, status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedLead.status === status
                          ? `${LEAD_STATUS_COLORS[status].bg} ${LEAD_STATUS_COLORS[status].text}`
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {LEAD_STATUS_COLORS[status].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meta Info */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Source</span>
                  <span className="font-medium text-neutral-900">{selectedLead.source}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Added</span>
                  <span className="font-medium text-neutral-900">
                    {new Date(selectedLead.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => handleConvertToContact(selectedLead.id)}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Convert to Contact
              </button>
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-medium transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete Lead
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scraper Modal */}
      {scraperOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Google Maps Scraper</h2>
                  <p className="text-sm text-neutral-500">Extract business leads from Google Maps</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setScraperOpen(false);
                  setCurrentRun(null);
                  setPreviewResults(null);
                  setScraperError(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!isConfigured && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Apify Not Configured</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Add APIFY_API_TOKEN to your backend .env file to enable scraping.
                    </p>
                  </div>
                </div>
              )}

              {scraperError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{scraperError}</p>
                  </div>
                </div>
              )}

              {!previewResults ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Search Query *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., restaurants, plumbers, dentists"
                      value={scraperQuery}
                      onChange={(e) => setScraperQuery(e.target.value)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., New York, USA"
                      value={scraperLocation}
                      onChange={(e) => setScraperLocation(e.target.value)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Results
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={maxResults}
                      onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  {scraperRunning && currentRun && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <div>
                          <p className="font-medium text-blue-800">Scraping in progress...</p>
                          <p className="text-sm text-blue-600 mt-1">
                            Status: {currentRun.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-800">Scraping Complete!</p>
                        <p className="text-sm text-green-600">Found {previewResults.count} results</p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500">Phone</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-500">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {previewResults.leads.slice(0, 10).map((lead, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm font-medium text-neutral-900">{lead.name}</td>
                              <td className="px-4 py-2 text-sm text-neutral-600">{lead.phone || '-'}</td>
                              <td className="px-4 py-2 text-sm text-neutral-600">
                                {lead.rating ? `${lead.rating}★` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewResults.count > 10 && (
                      <div className="px-4 py-2 bg-neutral-50 text-center text-sm text-neutral-500">
                        Showing 10 of {previewResults.count} results
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3">
              {!previewResults ? (
                <button
                  onClick={handleStartScraper}
                  disabled={scraperRunning || !isConfigured}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {scraperRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Scraping
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setPreviewResults(null);
                      setCurrentRun(null);
                    }}
                    className="px-6 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Scrape Again
                  </button>
                  <button
                    onClick={handleImportLeads}
                    disabled={importing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg disabled:opacity-50 transition-colors"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Import {previewResults.count} Leads
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManager;
