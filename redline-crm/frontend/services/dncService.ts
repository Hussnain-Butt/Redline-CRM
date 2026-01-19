import apiClient from './apiClient';

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

    const { data } = await apiClient.post('/dnc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data.data;
  }

  /**
   * Check single phone number
   */
  async checkPhoneNumber(phoneNumber: string): Promise<DNCCheckResult> {
    const { data } = await apiClient.get(`/dnc/check/${encodeURIComponent(phoneNumber)}`);
    return data.data;
  }

  /**
   * Check batch of phone numbers
   */
  async checkBatch(phoneNumbers: string[]): Promise<Array<DNCCheckResult & { phoneNumber: string }>> {
    const { data } = await apiClient.post('/dnc/check-batch', { phoneNumbers });
    return data.data;
  }

  /**
   * Add to internal DNC list
   */
  async addToInternalDNC(payload: {
    phoneNumber: string;
    reason: string;
    requestMethod: 'PHONE_CALL' | 'TEXT_MESSAGE' | 'EMAIL' | 'WEB_FORM' | 'MANUAL';
    contactId?: string;
    processedBy?: string;
    notes?: string;
  }): Promise<void> {
    await apiClient.post('/dnc/internal/add', payload);
  }

  /**
   * Remove from internal DNC list
   */
  async removeFromInternalDNC(phoneNumber: string, removedBy: string, removedReason: string): Promise<void> {
    await apiClient.delete(`/dnc/internal/${encodeURIComponent(phoneNumber)}`, {
      data: { removedBy, removedReason },
    });
  }

  /**
   * Get DNC statistics
   */
  async getStats(): Promise<DNCStats> {
    const { data } = await apiClient.get('/dnc/stats');
    return data.data;
  }

  /**
   * Cleanup expired records
   */
  async cleanupExpired(): Promise<{ deletedCount: number }> {
    const { data } = await apiClient.post('/dnc/cleanup');
    return data.data;
  }
}

export const dncService = new DNCService();
