import { FilterQuery, SortOrder, Types } from 'mongoose';
import { Email, IEmailDocument, IEmail } from './email.model.js';
import {
  SendEmailInput,
  SaveDraftInput,
  EmailQueryInput,
  GenerateDraftInput,
} from './email.validation.js';
import { AppError } from '../../middleware/errorHandler.js';
import nodemailer from 'nodemailer';

// ==================== EMAIL SERVICE ====================

export class EmailService {
  private transporters: Map<string, nodemailer.Transporter> = new Map();

  constructor() {
    // We'll initialize transporters on-demand or during settings update
  }

  /**
   * Get transporter for a specific user
   */
  private async getTransporter(userId?: string): Promise<nodemailer.Transporter | null> {
    // If no userId, or system fallback requested
    if (!userId) {
      return this.createSystemTransporter();
    }

    // Check cache
    if (this.transporters.has(userId)) {
      return this.transporters.get(userId)!;
    }

    // Try to create from user settings
    try {
      const { settingsService } = await import('../settings/settings.service.js');
      const dbSettings = await settingsService.getEmailSettingsRaw(userId);

      if (dbSettings && dbSettings.SMTP_HOST && dbSettings.SMTP_USER && dbSettings.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: dbSettings.SMTP_HOST,
          port: parseInt(dbSettings.SMTP_PORT || '587'),
          secure: dbSettings.SMTP_PORT === '465',
          auth: {
            user: dbSettings.SMTP_USER,
            pass: dbSettings.SMTP_PASS,
          },
        });
        
        this.transporters.set(userId, transporter);
        console.log(`✅ Using email credentials from database for user ${userId}`);
        return transporter;
      }
    } catch (error) {
      console.error(`❌ Failed to load SMTP settings for user ${userId}:`, error);
    }

    // Fallback to system transporter
    return this.createSystemTransporter();
  }

  /**
   * Create system fallback transporter from env variables
   */
  private createSystemTransporter(): nodemailer.Transporter | null {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      return transporter;
    }

    return null;
  }

  /**
   * Reinitialize transporter for a specific user (called after settings update)
   */
  async reinitializeTransporter(userId: string) {
    console.log(`🔄 Reinitializing email transporter for user ${userId}...`);
    this.transporters.delete(userId);
    await this.getTransporter(userId);
  }

  /**
   * Send an email via Nodemailer
   */
  async send(userId: string, data: SendEmailInput): Promise<IEmailDocument> {
    // 1. Create email record
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'system@redlinecrm.com';
    const email = new Email({
      ...data,
      userId,
      from: fromEmail,
      status: data.scheduledAt ? 'scheduled' : 'sent',
      direction: 'outbound',
      sentAt: data.scheduledAt ? undefined : new Date(),
      contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    });

    await email.save();

    // 2. Send via Nodemailer (if not scheduled)
    if (!data.scheduledAt) {
      const transporter = await this.getTransporter(userId);
      if (transporter) {
        try {
          const info = await transporter.sendMail({
            from: fromEmail,
            to: data.to.join(', '),
            cc: data.cc?.join(', '),
            bcc: data.bcc?.join(', '),
            subject: data.subject,
            text: data.text || data.body,
            html: data.body,
          });

          // Update with message ID
          email.messageId = info.messageId;
          email.status = 'sent';
          email.metadata = {
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
          };
          await email.save();
          
          console.log(`✅ Email sent successfully: ${info.messageId}`);
          console.log(`   To: ${data.to.join(', ')}`);
          console.log(`   Subject: ${data.subject}`);
        } catch (error: any) {
          console.error('❌ Failed to send email via SMTP:', error);
          email.status = 'failed';
          email.error = error.message;
          await email.save();
          throw new AppError(`Failed to send email: ${error.message}`, 500);
        }
      } else {
        // No transporter configured - save as sent but log warning
        console.warn('⚠️ Email saved to database but not sent (SMTP not configured)');
        console.log(`   To: ${data.to.join(', ')}`);
        console.log(`   Subject: ${data.subject}`);
        email.messageId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await email.save();
      }
    } else {
      console.log(`⏰ Email scheduled for ${data.scheduledAt}`);
    }

    return email;
  }

  /**
   * Save a draft
   */
  async saveDraft(userId: string, data: SaveDraftInput): Promise<IEmailDocument> {
    const email = new Email({
      ...data,
      userId,
      from: 'system@redlinecrm.com',
      status: 'draft',
      direction: 'outbound',
      contactId: data.contactId ? new Types.ObjectId(data.contactId) : undefined,
    });

    return await email.save();
  }

  /**
   * Get all emails with filtering
   */
  async getAll(userId: string, query: EmailQueryInput): Promise<{
    emails: IEmailDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit, contactId, status, search, sortBy, sortOrder } = query;

    const filter: FilterQuery<IEmail> = { userId };
    if (contactId) filter.contactId = new Types.ObjectId(contactId);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
        { to: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: { [key: string]: SortOrder } = {
      [sortBy || 'createdAt']: sortOrder === 'desc' ? -1 : 1,
    };

    const skip = (page - 1) * limit;
    const [emails, total] = await Promise.all([
      Email.find(filter).sort(sort).skip(skip).limit(limit),
      Email.countDocuments(filter),
    ]);

    return {
      emails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single email
   */
  async getById(id: string, userId: string): Promise<IEmailDocument> {
    const email = await Email.findOne({ _id: id, userId });
    if (!email) {
      throw new AppError('Email not found', 404);
    }
    return email;
  }

  /**
   * Generate AI draft (Mock for now, replacing Gemini usage)
   */
  async generateDraft(data: GenerateDraftInput): Promise<{ subject: string; body: string }> {
    // In production, this would call Gemini API or OpenAI
    // For now, we return a mock response based on tone/context
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API latency

    const subject = `Regarding: ${data.context.substring(0, 30)}...`;
    let body = '';

    switch (data.tone) {
      case 'professional':
        body = `Dear [Name],\n\nI hope this email finds you well.\n\nI am writing to discuss ${data.context}.\n\nPlease let me know when you are available to chat properly.\n\nBest regards,\n[Your Name]`;
        break;
      case 'friendly':
        body = `Hi [Name]!\n\nJust wanted to reach out about ${data.context}.\n\nWould love to catch up soon!\n\nCheers,\n[Your Name]`;
        break;
      case 'urgent':
        body = `Hi [Name],\n\nUrgent matter regarding ${data.context}. Please get back to me ASAP.\n\nThanks,\n[Your Name]`;
        break;
      case 'persuasive':
        body = `Hello [Name],\n\nHave you considered how ${data.context} could benefit you?\n\nI'd love to show you the possibilities.\n\nBest,\n[Your Name]`;
        break;
    }

    return { subject, body };
  }
}

export const emailService = new EmailService();
