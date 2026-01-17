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
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  X,
  ExternalLink,
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit2,
} from 'lucide-react';
import { Lead, LeadStatus, ApifyRunInfo, LeadFolder } from '../types';
import { leadsApi, LeadStats } from '../services/leadsApi';
import { apifyApi, GoogleMapsSearchInput, RunResultsResponse } from '../services/apifyApi';

const LEAD_STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' },
  contacted: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Contacted' },
  qualified: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Qualified' },
  converted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Converted' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
};

const FOLDER_COLORS = [
  '#dc2626', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
];

const LeadsManager: React.FC = () => {
  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [folders, setFolders] = useState<LeadFolder[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Folder Modal State
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#dc2626');
  const [editingFolder, setEditingFolder] = useState<LeadFolder | null>(null);
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);

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
  const [scraperFolderId, setScraperFolderId] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsData, foldersData, statsData] = await Promise.all([
        leadsApi.getAll(selectedFolderId ? { folderId: selectedFolderId } : {}),
        leadsApi.getFolders(),
        leadsApi.getStats(),
      ]);
      setLeads(leadsData);
      setFolders(foldersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId]);

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

  // ========== FOLDER HANDLERS ==========
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await leadsApi.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
      });
      setNewFolderName('');
      setNewFolderColor('#dc2626');
      setFolderModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;
    try {
      await leadsApi.updateFolder(editingFolder.id, {
        name: newFolderName.trim(),
        color: newFolderColor,
      });
      setEditingFolder(null);
      setNewFolderName('');
      setFolderModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Leads will remain but be unorganized.')) return;
    try {
      await leadsApi.deleteFolder(folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      setFolderMenuId(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const openEditFolder = (folder: LeadFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setFolderModalOpen(true);
    setFolderMenuId(null);
  };

  // ========== SCRAPER HANDLERS ==========
  const handleStartScraper = async () => {
    if (!scraperQuery.trim()) {
      setScraperError('Please enter a search query');
      return;
    }
    if (!scraperFolderId) {
      setScraperError('Please select a folder first');
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

  const handleImportLeads = async () => {
    if (!currentRun || !scraperFolderId) return;

    try {
      setImporting(true);
      // First import leads
      const result = await apifyApi.importAsLeads(currentRun.id, maxResults);
      
      // Then update them with folderId
      // For now, we'll just refresh and notify user
      await loadData();
      
      setScraperOpen(false);
      setCurrentRun(null);
      setPreviewResults(null);
      setScraperQuery('');
      setScraperLocation('');
      setScraperFolderId(null);
      
      alert(`Imported ${result.inserted} leads! (${result.duplicates} duplicates skipped)`);
    } catch (error: any) {
      setScraperError(error.message);
    } finally {
      setImporting(false);
    }
  };

  // ========== LEAD HANDLERS ==========
  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await leadsApi.updateStatus(leadId, status);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

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

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.delete(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
      loadData();
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

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // ========== RENDER ==========
  return (
    <div className="h-full flex bg-neutral-50">
      {/* Folder Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-100 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-neutral-900">Folders</h2>
            <button
              onClick={() => { setFolderModalOpen(true); setEditingFolder(null); setNewFolderName(''); }}
              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          {/* All Leads */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              !selectedFolderId
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">All Leads</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${!selectedFolderId ? 'bg-white/20' : 'bg-neutral-100'}`}>
              {stats?.total || 0}
            </span>
          </button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {folders.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No folders yet</p>
              <p className="text-xs">Create one to organize leads</p>
            </div>
          ) : (
            folders.map(folder => (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-neutral-100'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  {selectedFolderId === folder.id ? (
                    <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
                  ) : (
                    <Folder className="w-5 h-5" style={{ color: folder.color }} />
                  )}
                  <span className="font-medium flex-1 text-left text-neutral-800 truncate">
                    {folder.name}
                  </span>
                  <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {folder.leadCount}
                  </span>
                </button>
                
                {/* Folder Menu */}
                <button
                  onClick={(e) => { e.stopPropagation(); setFolderMenuId(folderMenuId === folder.id ? null : folder.id); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 rounded transition-all"
                >
                  <MoreVertical className="w-4 h-4 text-neutral-500" />
                </button>
                
                {folderMenuId === folder.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={() => openEditFolder(folder)}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-white border-b border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                {selectedFolder ? (
                  <>
                    <div className="p-2 rounded-xl text-white" style={{ background: selectedFolder.color }}>
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    {selectedFolder.name}
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white">
                      <Target className="w-6 h-6" />
                    </div>
                    All Leads
                  </>
                )}
              </h1>
              <p className="text-neutral-500 mt-1">
                {selectedFolder ? `${selectedFolder.leadCount} leads in this folder` : 'Manage all your business leads'}
              </p>
            </div>
            <button
              onClick={() => { setScraperOpen(true); setScraperFolderId(selectedFolderId); }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/25 transition-all hover:-translate-y-0.5"
            >
              <MapPin className="w-5 h-5" />
              <span className="font-semibold">New Scrape</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <button onClick={loadData} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-100">
              <RefreshCw className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
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
              <p className="text-sm mb-4">{selectedFolder ? 'Scrape leads into this folder' : 'Create a folder and start scraping'}</p>
              <button
                onClick={() => { setScraperOpen(true); setScraperFolderId(selectedFolderId); }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                <MapPin className="w-4 h-4" /> New Scrape
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{lead.name}</p>
                            {lead.category && <p className="text-xs text-neutral-500">{lead.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lead.phone && <p className="text-sm text-neutral-600 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                        {lead.website && <p className="text-sm text-blue-600 flex items-center gap-1"><Globe className="w-3 h-3" /><span className="truncate max-w-[150px]">{lead.website}</span></p>}
                      </td>
                      <td className="px-4 py-4">
                        {lead.rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium">{lead.rating.toFixed(1)}</span>
                            <span className="text-xs text-neutral-500">({lead.reviewCount})</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.status].bg} ${LEAD_STATUS_COLORS[lead.status].text}`}>
                          {LEAD_STATUS_COLORS[lead.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleConvertToContact(lead.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Convert">
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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
            <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-neutral-100 rounded-lg">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="text-center pb-4 border-b border-neutral-100">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                {selectedLead.name.charAt(0)}
              </div>
              <h4 className="font-bold text-lg">{selectedLead.name}</h4>
              {selectedLead.category && <p className="text-sm text-neutral-500">{selectedLead.category}</p>}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${LEAD_STATUS_COLORS[selectedLead.status].bg} ${LEAD_STATUS_COLORS[selectedLead.status].text}`}>
                {LEAD_STATUS_COLORS[selectedLead.status].label}
              </span>
            </div>

            {selectedLead.rating && (
              <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-lg text-amber-700">{selectedLead.rating.toFixed(1)}</span>
                <span className="text-amber-600">({selectedLead.reviewCount} reviews)</span>
              </div>
            )}

            <div className="space-y-3">
              {selectedLead.phone && (
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Phone className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Phone</p>
                    <p className="font-medium">{selectedLead.phone}</p>
                  </div>
                </div>
              )}
              {selectedLead.website && (
                <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100">
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
                    <p className="font-medium">{selectedLead.address}</p>
                  </div>
                </div>
              )}
            </div>

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
          </div>

          <div className="p-4 border-t border-neutral-100 space-y-2">
            <button onClick={() => handleConvertToContact(selectedLead.id)} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium">
              <UserPlus className="w-5 h-5" /> Convert to Contact
            </button>
            <button onClick={() => handleDeleteLead(selectedLead.id)} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl font-medium">
              <Trash2 className="w-5 h-5" /> Delete Lead
            </button>
          </div>
        </div>
      )}

      {/* Folder Create/Edit Modal */}
      {folderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingFolder ? 'Edit Folder' : 'New Folder'}</h2>
              <button onClick={() => { setFolderModalOpen(false); setEditingFolder(null); }} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g., Restaurants NYC"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-lg ${newFolderColor === color ? 'ring-2 ring-offset-2 ring-neutral-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setFolderModalOpen(false); setEditingFolder(null); }} className="px-4 py-2 border border-neutral-200 rounded-xl hover:bg-neutral-50">
                Cancel
              </button>
              <button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
              >
                {editingFolder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scraper Modal */}
      {scraperOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Google Maps Scraper</h2>
                  <p className="text-sm text-neutral-500">Extract business leads</p>
                </div>
              </div>
              <button onClick={() => { setScraperOpen(false); setCurrentRun(null); setPreviewResults(null); setScraperError(null); }} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!isConfigured && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Apify Not Configured</p>
                    <p className="text-sm text-amber-700">Add APIFY_API_TOKEN to your backend .env file</p>
                  </div>
                </div>
              )}

              {scraperError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{scraperError}</p>
                </div>
              )}

              {!previewResults ? (
                <div className="space-y-4">
                  {/* Folder Selection */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Save to Folder *</label>
                    <select
                      value={scraperFolderId || ''}
                      onChange={(e) => setScraperFolderId(e.target.value || null)}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select a folder...</option>
                      {folders.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.name}</option>
                      ))}
                    </select>
                    {folders.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">Create a folder first using the sidebar</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Search Query *</label>
                    <input
                      type="text"
                      placeholder="e.g., restaurants, dentists"
                      value={scraperQuery}
                      onChange={(e) => setScraperQuery(e.target.value)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., New York, USA"
                      value={scraperLocation}
                      onChange={(e) => setScraperLocation(e.target.value)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Max Results</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={maxResults}
                      onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                      disabled={scraperRunning}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl disabled:opacity-50"
                    />
                  </div>

                  {scraperRunning && currentRun && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-800">Scraping in progress...</p>
                        <p className="text-sm text-blue-600">Status: {currentRun.status}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-800">Scraping Complete!</p>
                      <p className="text-sm text-green-600">Found {previewResults.count} results</p>
                    </div>
                  </div>

                  <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
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
                            <td className="px-4 py-2 text-sm font-medium">{lead.name}</td>
                            <td className="px-4 py-2 text-sm text-neutral-600">{lead.phone || '-'}</td>
                            <td className="px-4 py-2 text-sm">{lead.rating ? `${lead.rating}★` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 flex justify-end gap-3">
              {!previewResults ? (
                <button
                  onClick={handleStartScraper}
                  disabled={scraperRunning || !isConfigured || !scraperFolderId}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50"
                >
                  {scraperRunning ? <><Loader2 className="w-5 h-5 animate-spin" /> Running...</> : <><Play className="w-5 h-5" /> Start Scraping</>}
                </button>
              ) : (
                <>
                  <button onClick={() => { setPreviewResults(null); setCurrentRun(null); }} className="px-6 py-2.5 border border-neutral-200 rounded-xl hover:bg-neutral-50">
                    Scrape Again
                  </button>
                  <button
                    onClick={handleImportLeads}
                    disabled={importing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-50"
                  >
                    {importing ? <><Loader2 className="w-5 h-5 animate-spin" /> Importing...</> : <><Download className="w-5 h-5" /> Import {previewResults.count} Leads</>}
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
