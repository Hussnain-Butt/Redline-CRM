import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { dncService } from './service.js';
import {
  checkPhoneNumberSchema,
  checkBatchSchema,
  addInternalDNCSchema,
  removeInternalDNCSchema,
} from './validators.js';

// Extend Express Request type to include file property from multer
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

/**
 * Configure multer for CSV file uploads
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/dnc/'); // Temporary storage
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'dnc-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

export const uploadMiddleware = upload.single('file');

/**
 * Controller for DNC operations
 */
export class DNCController {
  /**
   * Upload DNC CSV file
   * POST /api/dnc/upload
   */
  async uploadDNCFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return void res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const { source = 'MANUAL', state, uploadedBy } = req.body;

      const result = await dncService.uploadDNCFile(
        req.file.path,
        req.file.originalname,
        source,
        uploadedBy,
        state
      );

      res.json({
        success: true,
        message: 'DNC file uploaded successfully',
        data: {
          uploadId: result._id,
          totalRecords: result.totalRecords,
          successfulImports: result.successfulImports,
          failedImports: result.failedImports,
          processingTime: result.processingTime,
          errors: result.uploadErrors?.slice(0, 10), // Return first 10 errors only
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check single phone number
   * GET /api/dnc/check/:phoneNumber
   */
  async checkPhoneNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber } = req.params;

      // Validate input
      checkPhoneNumberSchema.parse({ phoneNumber });

      const result = await dncService.checkPhoneNumber(phoneNumber);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check multiple phone numbers in batch
   * POST /api/dnc/check-batch
   */
  async checkBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumbers } = req.body;

      // Validate input
      checkBatchSchema.parse({ phoneNumbers });

      const results = await dncService.checkBatch(phoneNumbers);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add phone number to internal DNC list
   * POST /api/dnc/internal/add
   */
  async addToInternalDNC(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const validatedData = addInternalDNCSchema.parse(req.body);

      await dncService.addToInternalDNC(validatedData);

      res.json({
        success: true,
        message: 'Phone number added to internal DNC list',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove phone number from internal DNC list
   * DELETE /api/dnc/internal/:phoneNumber
   */
  async removeFromInternalDNC(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber } = req.params;
      const { removedBy, removedReason } = req.body;

      // Validate input
      removeInternalDNCSchema.parse({ phoneNumber, removedBy, removedReason });

      await dncService.removeFromInternalDNC({ phoneNumber, removedBy, removedReason });

      res.json({
        success: true,
        message: 'Phone number removed from internal DNC list',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get DNC statistics
   * GET /api/dnc/stats
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dncService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove expired DNC records
   * POST /api/dnc/cleanup
   */
  async cleanupExpired(_req: Request, res: Response, next: NextFunction) {
    try {
      const deletedCount = await dncService.removeExpiredRecords();

      res.json({
        success: true,
        message: `Removed ${deletedCount} expired DNC records`,
        data: {
          deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dncController = new DNCController();
