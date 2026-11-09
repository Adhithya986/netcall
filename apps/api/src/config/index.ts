import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root or local directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/netcall',
    useInMemory: process.env.USE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test'
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'netcall_access_token_dev_secret_replace_in_production_32chars!',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'netcall_refresh_token_dev_secret_replace_in_production_32chars!',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10)
  },

  webrtc: {
    stunServers: (process.env.STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302').split(','),
    turnServerUrl: process.env.TURN_SERVER_URL || '',
    turnUsername: process.env.TURN_USERNAME || '',
    turnCredential: process.env.TURN_CREDENTIAL || ''
  },

  telephony: {
    provider: (process.env.TELEPHONY_PROVIDER || 'MOCK').toUpperCase(),
    sandboxMode: process.env.TELEPHONY_SANDBOX_MODE !== 'false',
    webhookSecret: process.env.TELEPHONY_WEBHOOK_SECRET || 'mock_webhook_secret_for_local_development',
    exotel: {
      accountSid: process.env.EXOTEL_ACCOUNT_SID || '',
      apiKey: process.env.EXOTEL_API_KEY || '',
      apiToken: process.env.EXOTEL_API_TOKEN || '',
      subdomain: process.env.EXOTEL_SUBDOMAIN || ''
    },
    airtelIq: {
      appId: process.env.AIRTEL_IQ_APP_ID || '',
      secret: process.env.AIRTEL_IQ_SECRET || ''
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || ''
    }
  },

  billing: {
    initialWalletPaise: parseInt(process.env.INITIAL_USER_WALLET_PAISE || '50000', 10), // ₹500
    pstnRatePerMinutePaise: parseInt(process.env.PSTN_CALL_RATE_PAISE_PER_MIN || '150', 10), // ₹1.50
    internetRatePerMinutePaise: parseInt(process.env.INTERNET_CALL_RATE_PAISE_PER_MIN || '0', 10) // ₹0
  }
};
