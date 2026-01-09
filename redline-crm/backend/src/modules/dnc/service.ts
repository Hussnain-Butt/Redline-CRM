import fs from 'fs';
import csv from 'csv-parser';
import { DNCList, InternalDNC, DNCUpload, IDNCUpload } from './models.js';
import type { AddInternalDNCInput, RemoveInternalDNCInput } from './validators.js';

/**
 * DNC Service - Core business logic for Do Not Call compliance
 */
export class DNCService {
  /**
   * Check if a single phone number is on any DNC list
   */
  async checkPhoneNumber(phoneNumber: string): Promise<{
    isOnDNC: boolean;
    source?: string;
    canCall: boolean;
    reason?: string;
    expiryDate?: Date;
  }> {
    // Normalize phone number to E.164 format
    const normalizedNumber = this.normalizePhoneNumber(phoneNumber);

    // Check Internal DNC first (highest priority, permanent)
    const internalDNC = await InternalDNC.findOne({ 
      phoneNumber: normalizedNumber,
      removedDate: { $exists: false } // Not removed
    });

    if (internalDNC) {
      return {
        isOnDNC: true,
        source: 'INTERNAL',
        canCall: false,
        reason: internalDNC.reason,
      };
    }

    // Check National/State DNC lists
    const dncRecord = await DNCList.findOne({
      phoneNumber: normalizedNumber,
      expiryDate: { $gt: new Date() }, // Not expired
    });

    if (dncRecord) {
      return {
        isOnDNC: true,
        source: dncRecord.source,
        canCall: false,
        expiryDate: dncRecord.expiryDate,
      };
    }

    // Number is safe to call
    return {
      isOnDNC: false,
      canCall: true,
    };
  }

  /**
   * Check multiple phone numbers in batch
   */
  async checkBatch(phoneNumbers: string[]): Promise<
    Array<{
      phoneNumber: string;
      isOnDNC: boolean;
      source?: string;
      canCall: boolean;
    }>
  > {
    const results = await Promise.all(
      phoneNumbers.map(async (number) => {
        const result = await this.checkPhoneNumber(number);
        return {
          phoneNumber: number,
          ...result,
        };
      })
    );

    return results;
  }

  /**
   * Upload and process DNC CSV file
   */
  async uploadDNCFile(
    filePath: string,
    filename: string,
    source: 'NATIONAL' | 'STATE' | 'MANUAL',
    uploadedBy?: string,
    state?: string
  ): Promise<IDNCUpload> {
    const startTime = Date.now();
    
    // Create upload record
    const uploadRecord = await DNCUpload.create({
      filename,
      source,
      state,
      uploadedBy,
      totalRecords: 0,
      successfulImports: 0,
      failedImports: 0,
      fileSize: fs.statSync(filePath).size,
      status: 'PROCESSING',
    });

    const errors: Array<{ row: number; phoneNumber: string; error: string }> = [];
    let totalRecords = 0;
    let successfulImports = 0;
    let failedImports = 0;

    // Calculate expiry date (31 days from now per federal law)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 31);

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', async (row) => {
            totalRecords++;
            
            try {
              // Extract phone number from CSV (support multiple column names)
              const phoneNumber =
                row.phoneNumber ||
                row.phone ||
                row.number ||
                row.Phone ||
                row['Phone Number'] ||
                Object.values(row)[0]; // First column if no header match

              if (!phoneNumber) {
                throw new Error('No phone number found in row');
              }

              // Normalize and validate
              const normalizedNumber = this.normalizePhoneNumber(phoneNumber);

              // Upsert (create or update) DNC record
              await DNCList.findOneAndUpdate(
                { phoneNumber: normalizedNumber },
                {
                  phoneNumber: normalizedNumber,
                  source,
                  state,
                  addedDate: new Date(),
                  expiryDate,
                  uploadId: uploadRecord._id,
                },
                { upsert: true, new: true }
              );

              successfulImports++;
            } catch (error) {
              failedImports++;
              errors.push({
                row: totalRecords,
                phoneNumber: row.phoneNumber || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Update upload record with results
      uploadRecord.totalRecords = totalRecords;
      uploadRecord.successfulImports = successfulImports;
      uploadRecord.failedImports = failedImports;
      uploadRecord.uploadErrors = errors.slice(0, 100); // Limit error storage
      uploadRecord.processingTime = Date.now() - startTime;
      uploadRecord.status = 'COMPLETED';
      await uploadRecord.save();

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return uploadRecord;
    } catch (error) {
      uploadRecord.status = 'FAILED';
      uploadRecord.uploadErrors = [
        {
          row: 0,
          phoneNumber: '',
          error: error instanceof Error ? error.message : 'File processing failed',
        },
      ];
      await uploadRecord.save();

      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw error;
    }
  }

  /**
   * Add phone number to internal DNC list
   */
  async addToInternalDNC(data: AddInternalDNCInput): Promise<void> {
    const normalizedNumber = this.normalizePhoneNumber(data.phoneNumber);

    // Check if already exists and not removed
    const existing = await InternalDNC.findOne({
      phoneNumber: normalizedNumber,
      removedDate: { $exists: false },
    });

    if (existing) {
      throw new Error('Phone number already on internal DNC list');
    }

    // Add to internal DNC
    await InternalDNC.create({
      phoneNumber: normalizedNumber,
      reason: data.reason,
      requestMethod: data.requestMethod,
      requestDate: new Date(),
      contactId: data.contactId,
      processedBy: data.processedBy,
      notes: data.notes,
    });

    // Also add to DNCList with INTERNAL source (permanent)
    const permanentExpiry = new Date();
    permanentExpiry.setFullYear(permanentExpiry.getFullYear() + 100); // 100 years = effectively permanent

    await DNCList.findOneAndUpdate(
      { phoneNumber: normalizedNumber },
      {
        phoneNumber: normalizedNumber,
        source: 'INTERNAL',
        addedDate: new Date(),
        expiryDate: permanentExpiry,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Remove phone number from internal DNC list
   */
  async removeFromInternalDNC(data: RemoveInternalDNCInput): Promise<void> {
    const normalizedNumber = this.normalizePhoneNumber(data.phoneNumber);

    const record = await InternalDNC.findOne({
      phoneNumber: normalizedNumber,
      removedDate: { $exists: false },
    });

    if (!record) {
      throw new Error('Phone number not found on internal DNC list');
    }

    // Mark as removed (soft delete for audit trail)
    record.removedDate = new Date();
    record.removedBy = data.removedBy;
    record.removedReason = data.removedReason;
    await record.save();

    // Remove from DNCList if source is INTERNAL
    await DNCList.deleteOne({
      phoneNumber: normalizedNumber,
      source: 'INTERNAL',
    });
  }

  /**
   * Get expired DNC records (older than 31 days)
   */
  async getExpiredRecords(): Promise<number> {
    const now = new Date();
    const expiredCount = await DNCList.countDocuments({
      expiryDate: { $lt: now },
      source: { $ne: 'INTERNAL' }, // Exclude internal (permanent)
    });

    return expiredCount;
  }

  /**
   * Remove expired DNC records
   */
  async removeExpiredRecords(): Promise<number> {
    const now = new Date();
    const result = await DNCList.deleteMany({
      expiryDate: { $lt: now },
      source: { $ne: 'INTERNAL' },
    });

    return result.deletedCount || 0;
  }

  /**
   * Get DNC statistics
   */
  async getStats() {
    const [totalDNC, nationalDNC, stateDNC, internalDNC, manualUploadDNC, expiredDNC, latestUpload] =
      await Promise.all([
        DNCList.countDocuments({ expiryDate: { $gt: new Date() } }),
        DNCList.countDocuments({ source: 'NATIONAL', expiryDate: { $gt: new Date() } }),
        DNCList.countDocuments({ source: 'STATE', expiryDate: { $gt: new Date() } }),
        DNCList.countDocuments({ source: 'INTERNAL' }),
        DNCList.countDocuments({ source: 'MANUAL_UPLOAD', expiryDate: { $gt: new Date() } }),
        this.getExpiredRecords(),
        DNCUpload.findOne().sort({ uploadDate: -1 }),
      ]);

    return {
      total: totalDNC,
      bySource: {
        national: nationalDNC,
        state: stateDNC,
        internal: internalDNC,
        manualUpload: manualUploadDNC,
      },
      expired: expiredDNC,
      lastUpload: latestUpload
        ? {
            date: latestUpload.uploadDate,
            filename: latestUpload.filename,
            records: latestUpload.successfulImports,
          }
        : null,
    };
  }

  /**
   * Normalize phone number to E.164 format
   * Handles various input formats:
   * - (202) 555-1234 -> +12025551234
   * - 202-555-1234 -> +12025551234
   * - 2025551234 -> +12025551234
   * - +1 202 555 1234 -> +12025551234
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if missing (assume US +1)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    // Validate length
    if (cleaned.length !== 11 || !cleaned.startsWith('1')) {
      throw new Error(`Invalid US phone number format: ${phoneNumber}`);
    }

    // Return E.164 format
    return '+' + cleaned;
  }
}

export const dncService = new DNCService();
