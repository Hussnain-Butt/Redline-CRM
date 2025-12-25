const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const response = await fetch(`${API_URL}/api/settings/email`);
  if (!response.ok) {
    throw new Error('Failed to fetch email settings');
  }
  const data = await response.json();
  return data.data;
};

/**
 * Update email settings
 */
export const updateEmailSettings = async (settings: EmailSettings): Promise<EmailSettings> => {
  const response = await fetch(`${API_URL}/api/settings/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update email settings');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Test email connection with provided credentials
 */
export const testEmailConnection = async (settings: EmailSettings): Promise<TestConnectionResult> => {
  const response = await fetch(`${API_URL}/api/settings/email/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      message: data.message || 'Connection test failed',
    };
  }

  return data.data;
};
