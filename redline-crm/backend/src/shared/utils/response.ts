import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types/index.js';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    message,
  };
  return res.status(200).json(response);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
