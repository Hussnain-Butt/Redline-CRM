import { Settings, ISettingsDocument } from './settings.model.js';
import { EmailSettingsInput } from './settings.validation.js';
import { AppError } from '../../middleware/errorHandler.js';
import nodemailer from 'nodemailer';

// ==================== SETTINGS SERVICE ====================

export class SettingsService {
  /**
   * Get email settings (with password masked for security)
   */
  async getEmailSettings(): Promise<Partial<ISettingsDocument>> {
    let settings = await Settings.findOne();

    // If no settings exist in DB, return empty object
    if (!settings) {
      return {
        SMTP_HOST: '',
        SMTP_PORT: '587',
        SMTP_USER: '',
        SMTP_PASS: '',
        EMAIL_FROM: '',
      };
    }

    // Mask password for security
    return {
      SMTP_HOST: settings.SMTP_HOST,
      SMTP_PORT: settings.SMTP_PORT,
      SMTP_USER: settings.SMTP_USER,
      SMTP_PASS: settings.SMTP_PASS ? '••••••••' : '',
      EMAIL_FROM: settings.EMAIL_FROM,
    };
  }

  /**
   * Get email settings (unmasked, for internal use)
   */
  async getEmailSettingsRaw(): Promise<ISettingsDocument | null> {
    return await Settings.findOne();
  }

  /**
   * Update email settings
   */
  async updateEmailSettings(data: EmailSettingsInput): Promise<ISettingsDocument> {
    // Use findOneAndUpdate with upsert to create if doesn't exist
    const settings = await Settings.findOneAndUpdate(
      {}, // Empty filter to match the single document
      {
        SMTP_HOST: data.SMTP_HOST,
        SMTP_PORT: data.SMTP_PORT,
        SMTP_USER: data.SMTP_USER,
        SMTP_PASS: data.SMTP_PASS,
        EMAIL_FROM: data.EMAIL_FROM || data.SMTP_USER,
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    if (!settings) {
      throw new AppError('Failed to update settings', 500);
    }

    // Reinitialize email service with new credentials
    const { emailService } = await import('../emails/email.service.js');
    await emailService.reinitializeTransporter();

    console.log('✅ Email settings updated successfully');
    return settings;
  }

  /**
   * Test email connection with provided credentials
   */
  async testEmailConnection(data: EmailSettingsInput): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test transporter
      const testTransporter = nodemailer.createTransport({
        host: data.SMTP_HOST,
        port: parseInt(data.SMTP_PORT),
        secure: data.SMTP_PORT === '465',
        auth: {
          user: data.SMTP_USER,
          pass: data.SMTP_PASS,
        },
      });

      // Verify connection
      await testTransporter.verify();

      console.log('✅ Email connection test successful');
      return {
        success: true,
        message: 'Connection successful! SMTP credentials are valid.',
      };
    } catch (error: any) {
      console.error('❌ Email connection test failed:', error.message);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }
}

export const settingsService = new SettingsService();
