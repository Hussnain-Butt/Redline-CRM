import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Custom error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  status: string;
  message: string;
  error?: string;
  stack?: string;
}

// Send error response in development
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ErrorResponse = {
    status: err.status,
    message: err.message,
    error: err.name,
    stack: err.stack,
  };
  res.status(err.statusCode).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Global error handling middleware
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values for unknown errors
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else {
    error = new AppError(err.message || 'Internal server error', 500);
    error.stack = err.stack;
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  if (err.name === 'ValidationError') {
    error = new AppError(`Validation Error: ${err.message}`, 400);
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    error = new AppError('Duplicate field value entered', 400);
  }

  // Send appropriate response based on environment
  if (env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Not found handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl}`, 404));
};
