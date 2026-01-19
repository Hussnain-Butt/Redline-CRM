import apiClient from './apiClient';

export interface EmailSettings {
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

/**
 * Get current email settings
 */
export const getEmailSettings = async (): Promise<EmailSettings> => {
  const { data } = await apiClient.get('/settings/email');
  return data.data;
};

/**
 * Update email settings
 */
export const updateEmailSettings = async (settings: EmailSettings): Promise<EmailSettings> => {
  const { data } = await apiClient.put('/settings/email', settings);
  return data.data;
};

/**
 * Test email connection with provided credentials
 */
export const testEmailConnection = async (settings: EmailSettings): Promise<TestConnectionResult> => {
  try {
    const { data } = await apiClient.post('/settings/email/test', settings);
    return data.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Connection test failed',
    };
  }
};
