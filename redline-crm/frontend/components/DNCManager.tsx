import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Calendar,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import { dncService, DNCStats, DNCCheckResult, UploadResult } from '../services/dncService';

export const DNCManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'check' | 'stats' | 'internal'>('stats');
  const [stats, setStats] = useState<DNCStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dncService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="w-10 h-10 text-red-500" />
              DNC Compliance Manager
            </h1>
            <p className="text-gray-400 mt-2">Do Not Call List Management & Protection System</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
            <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-400 font-medium">Success</p>
              <p className="text-green-300 text-sm mt-1">{success}</p>
            </div>
            <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'stats', label: 'Dashboard', icon: TrendingUp },
            { id: 'upload', label: 'Upload CSV', icon: Upload },
            { id: 'check', label: 'Check Numbers', icon: Search },
            { id: 'internal', label: 'Internal DNC', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'stats' && (
          <StatsTab stats={stats} onRefresh={loadStats} setError={setError} setSuccess={setSuccess} />
        )}
        {activeTab === 'upload' && (
          <UploadTab setError={setError} setSuccess={setSuccess} onUploadComplete={loadStats} />
        )}
        {activeTab === 'check' && <CheckTab setError={setError} />}
        {activeTab === 'internal' && <InternalDNCTab setError={setError} setSuccess={setSuccess} />}
      </div>
    </div>
  );
};

// ==================== Stats Tab ====================
interface StatsTabProps {
  stats: DNCStats | null;
  onRefresh: () => void;
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
}

const StatsTab: React.FC<StatsTabProps> = ({ stats, onRefresh, setError, setSuccess }) => {
  const [cleaning, setCleaning] = useState(false);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const result = await dncService.cleanupExpired();
      setSuccess(`Cleaned up ${result.deletedCount} expired DNC records`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total DNC Records"
          value={stats.total.toLocaleString()}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="National DNC"
          value={stats.bySource.national.toLocaleString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Internal Opt-Outs"
          value={stats.bySource.internal.toLocaleString()}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Expired Records"
          value={stats.expired.toLocaleString()}
          icon={AlertCircle}
          color="yellow"
          warning={stats.expired > 0}
        />
      </div>

      {/* Last Upload Info */}
      {stats.lastUpload && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Last Upload
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-500">Filename:</span> {stats.lastUpload.filename}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">Records:</span>{' '}
                  {stats.lastUpload.records.toLocaleString()}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">Date:</span>{' '}
                  {new Date(stats.lastUpload.date).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onRefresh}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                title="Refresh stats"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {stats.expired > 0 && (
                <button
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className={`w-4 h-4 ${cleaning ? 'animate-spin' : ''}`} />
                  Cleanup Expired
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Source Breakdown</h3>
        <div className="space-y-3">
          <SourceBar label="National DNC" count={stats.bySource.national} total={stats.total} color="blue" />
          <SourceBar label="State DNC" count={stats.bySource.state} total={stats.total} color="purple" />
          <SourceBar label="Internal Opt-Outs" count={stats.bySource.internal} total={stats.total} color="red" />
          <SourceBar
            label="Manual Upload"
            count={stats.bySource.manualUpload}
            total={stats.total}
            color="green"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== Upload Tab ====================
interface UploadTabProps {
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
  onUploadComplete: () => void;
}

const UploadTab: React.FC<UploadTabProps> = ({ setError, setSuccess, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [source, setSource] = useState<'NATIONAL' | 'STATE' | 'MANUAL'>('MANUAL');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only CSV files are allowed');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only CSV files are allowed');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadResult(null);

    try {
      const result = await dncService.uploadFile(file, source);
      setUploadResult(result);
      setSuccess(
        `Successfully imported ${result.successfulImports} records (${result.failedImports} failed)`
      );
      setFile(null);
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
        <h3 className="text-lg font-semibold mb-6">Upload DNC CSV File</h3>

        {/* Source Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Source Type</label>
          <div className="flex gap-2">
            {(['MANUAL', 'NATIONAL', 'STATE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  source === s
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
            dragActive
              ? 'border-red-500 bg-red-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-red-400' : 'text-gray-500'}`} />
          {file ? (
            <>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-400 text-sm mt-2">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={() => setFile(null)}
                className="mt-4 text-red-400 hover:text-red-300 text-sm"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <p className="text-white font-medium mb-2">Drag & drop your CSV file here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <label className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer transition-all">
                Browse Files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 text-sm mt-4">Maximum file size: 10MB</p>
            </>
          )}
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Process
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Records</p>
              <p className="text-2xl font-bold text-white mt-1">
                {uploadResult.totalRecords.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Successful</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {uploadResult.successfulImports.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {uploadResult.failedImports.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Processing Time</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {(uploadResult.processingTime / 1000).toFixed(2)}s
              </p>
            </div>
          </div>

          {/* Errors */}
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Errors ({uploadResult.errors.length})
              </h4>
              <div className="bg-gray-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {uploadResult.errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-400 mb-2">
                    Row {err.row}: {err.phoneNumber} - {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">CSV Format Instructions</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• CSV file should have a column named: <code className="bg-gray-700 px-2 py-1 rounded">phoneNumber</code></p>
          <p>• Phone numbers should be in E.164 format: <code className="bg-gray-700 px-2 py-1 rounded">+12025551234</code></p>
          <p>• Alternative formats are supported: (202) 555-1234, 202-555-1234, 2025551234</p>
          <p>• Maximum file size: 10MB</p>
          <p>• DNC records expire after 31 days (federal requirement)</p>
        </div>
      </div>
    </div>
  );
};

// ==================== Check Tab ====================
interface CheckTabProps {
  setError: (msg: string | null) => void;
}

const CheckTab: React.FC<CheckTabProps> = ({ setError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<DNCCheckResult | null>(null);

  const handleCheck = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setChecking(true);
    setError(null);
    setResult(null);

    try {
      const checkResult = await dncService.checkPhoneNumber(phoneNumber);
      setResult(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Check Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
        <h3 className="text-lg font-semibold mb-6">Check Phone Number</h3>

        <div className="flex gap-4">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="+1 (202) 555-1234"
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCheck}
            disabled={checking}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium flex items-center gap-2 transition-all"
          >
            {checking ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Check
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`bg-gray-800/50 backdrop-blur-sm border rounded-lg p-8 ${
            result.isOnDNC
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-green-500/50 bg-green-500/5'
          }`}
        >
          <div className="flex items-start gap-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                result.isOnDNC ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}
            >
              {result.isOnDNC ? (
                <XCircle className="w-8 h-8 text-red-400" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-400" />
              )}
            </div>

            <div className="flex-1">
              <h3
                className={`text-2xl font-bold mb-2 ${
                  result.isOnDNC ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {result.isOnDNC ? '⛔ On DNC List - DO NOT CALL' : '✅ Safe to Call'}
              </h3>
              <p className="text-gray-300 mb-4">
                {result.isOnDNC
                  ? 'This number is on the Do Not Call list. Calling this number may result in legal penalties.'
                  : 'This number is not on any DNC lists and is safe to call.'}
              </p>

              {result.isOnDNC && (
                <div className="space-y-2 text-sm">
                  {result.source && (
                    <p className="text-gray-400">
                      <span className="font-medium">Source:</span> {result.source}
                    </p>
                  )}
                  {result.reason && (
                    <p className="text-gray-400">
                      <span className="font-medium">Reason:</span> {result.reason}
                    </p>
                  )}
                  {result.expiryDate && (
                    <p className="text-gray-400">
                      <span className="font-medium">Expires:</span>{' '}
                      {new Date(result.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Internal DNC Tab ====================
interface InternalDNCTabProps {
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
}

const InternalDNCTab: React.FC<InternalDNCTabProps> = ({ setError, setSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!phoneNumber.trim() || !reason.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      await dncService.addToInternalDNC({
        phoneNumber,
        reason,
        requestMethod: 'MANUAL',
        processedBy: 'CSR',
      });
      setSuccess(`Successfully added ${phoneNumber} to internal DNC list`);
      setPhoneNumber('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to internal DNC');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add to Internal DNC List
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (202) 555-1234"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Customer requested opt-out during call..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-all"
          >
            {adding ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add to Internal DNC
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium mb-2">Important: Internal DNC Policy</p>
            <ul className="text-yellow-300 text-sm space-y-1">
              <li>• Internal DNC entries are <strong>permanent</strong> (100 years expiry)</li>
              <li>• These represent customer opt-out requests and must be honored</li>
              <li>• Removal requires manager approval and documented consent</li>
              <li>• Violations can result in fines up to $50,120 per call</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Helper Components ====================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  warning?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, warning }) => {
  const colors = {
    blue: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-red-500 to-red-600',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm">{title}</p>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <p className={`text-3xl font-bold ${warning ? 'text-yellow-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
};

interface SourceBarProps {
  label: string;
  count: number;
  total: number;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const SourceBar: React.FC<SourceBarProps> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default DNCManager;
