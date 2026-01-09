/**
 * DNC API Service
 * All API calls for DNC functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface DNCCheckResult {
  isOnDNC: boolean;
  source?: string;
  canCall: boolean;
  reason?: string;
  expiryDate?: string;
}

export interface DNCStats {
  total: number;
  bySource: {
    national: number;
    state: number;
    internal: number;
    manualUpload: number;
  };
  expired: number;
  lastUpload: {
    date: string;
    filename: string;
    records: number;
  } | null;
}

export interface UploadResult {
  uploadId: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  processingTime: number;
  errors?: Array<{
    row: number;
    phoneNumber: string;
    error: string;
  }>;
}

class DNCService {
  /**
   * Upload DNC CSV file
   */
  async uploadFile(
    file: File,
    source: 'NATIONAL' | 'STATE' | 'MANUAL' = 'MANUAL',
    uploadedBy?: string
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    const response = await fetch(`${API_BASE_URL}/dnc/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Check single phone number
   */
  async checkPhoneNumber(phoneNumber: string): Promise<DNCCheckResult> {
    const response = await fetch(`${API_BASE_URL}/dnc/check/${encodeURIComponent(phoneNumber)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Check failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Check batch of phone numbers
   */
  async checkBatch(phoneNumbers: string[]): Promise<Array<DNCCheckResult & { phoneNumber: string }>> {
    const response = await fetch(`${API_BASE_URL}/dnc/check-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumbers }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Batch check failed');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Add to internal DNC list
   */
  async addToInternalDNC(data: {
    phoneNumber: string;
    reason: string;
    requestMethod: 'PHONE_CALL' | 'TEXT_MESSAGE' | 'EMAIL' | 'WEB_FORM' | 'MANUAL';
    contactId?: string;
    processedBy?: string;
    notes?: string;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dnc/internal/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add to internal DNC');
    }
  }

  /**
   * Remove from internal DNC list
   */
  async removeFromInternalDNC(phoneNumber: string, removedBy: string, removedReason: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dnc/internal/${encodeURIComponent(phoneNumber)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removedBy, removedReason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove from internal DNC');
    }
  }

  /**
   * Get DNC statistics
   */
  async getStats(): Promise<DNCStats> {
    const response = await fetch(`${API_BASE_URL}/dnc/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get stats');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Cleanup expired records
   */
  async cleanupExpired(): Promise<{ deletedCount: number }> {
    const response = await fetch(`${API_BASE_URL}/dnc/cleanup`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Cleanup failed');
    }

    const result = await response.json();
    return result.data;
  }
}

export const dncService = new DNCService();
