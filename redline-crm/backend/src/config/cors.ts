import cors, { CorsOptions } from 'cors';
import { env } from './env.js';

// CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      env.FRONTEND_URL,
      'https://delightful-rejoicing-production.up.railway.app',
      'http://localhost:3009',
      'http://localhost:5173',
      'http://127.0.0.1:3009',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (env.NODE_ENV === 'development') {
      // Allow all origins in development
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
