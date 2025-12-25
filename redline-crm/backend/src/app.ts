import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import { corsMiddleware, isDatabaseConnected } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import { reminderRoutes } from './modules/reminders/index.js';
import { templateRoutes } from './modules/templates/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { emailRoutes } from './modules/emails/index.js';
import { aiRoutes } from './modules/ai/index.js';
import { callRoutes } from './modules/calls/index.js';
import { settingsRoutes } from './modules/settings/index.js';

// Create Express app
const app: Application = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet for security headers (with relaxed settings for audio)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(corsMiddleware);

// ==================== BODY PARSING ====================

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== HEALTH CHECK ====================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
  });
});

// ==================== API ROUTES ====================

// Reminders Module
app.use('/api/reminders', reminderRoutes);

// Templates Module
app.use('/api/templates', templateRoutes);

// Dashboard Module
app.use('/api/dashboard', dashboardRoutes);

// Email Module
app.use('/api/emails', emailRoutes);

// AI Assistant Module
app.use('/api/ai', aiRoutes);

// Call Module
app.use('/api/calls', callRoutes);

// Settings Module
app.use('/api/settings', settingsRoutes);

// Contact Module
import { contactRoutes } from './modules/contacts/index.js';
app.use('/api/contacts', contactRoutes);

// Phone Number Module
import { phoneNumberRoutes } from './modules/phoneNumbers/index.js';
app.use('/api/phone-numbers', phoneNumberRoutes);

// SMS Module
import { smsRoutes } from './modules/sms/index.js';
app.use('/api/sms', smsRoutes);

// Notes and Scheduled Calls
import { noteRoutes } from './modules/notes/index.js';
import { scheduledCallRoutes } from './modules/scheduledCalls/index.js';

app.use('/api/notes', noteRoutes);
app.use('/api/scheduled-calls', scheduledCallRoutes);

// Future routes:
// app.use('/api/contacts', contactRoutes);
// app.use('/api/calls', callRoutes);
// app.use('/api/calls', callRoutes);
// app.use('/api/contacts', contactRoutes);

// ==================== ERROR HANDLING ====================

// Handle 404 - Route not found
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
