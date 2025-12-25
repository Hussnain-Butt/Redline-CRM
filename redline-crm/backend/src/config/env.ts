import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url().or(z.string().startsWith('mongodb')),
  FRONTEND_URL: z.string().url().default('http://localhost:3009'),
  JWT_SECRET: z.string().default('your_jwt_secret_here'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Call System (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_API_KEY: z.string().optional(),
  TWILIO_API_SECRET: z.string().optional(),
  TWILIO_TWIML_APP_SID: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  BACKEND_URL: z.string().url().optional(),
  
  // AI
  GEMINI_API_KEY: z.string().optional(),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      console.error(`❌ Missing or invalid environment variables: ${missing}`);
      console.error('Please check your .env file');
    }
    throw error;
  }
};

export const env = parseEnv();

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
