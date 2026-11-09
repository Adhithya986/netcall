import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { generalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import callRoutes from './routes/callRoutes';
import walletRoutes from './routes/walletRoutes';
import telephonyRoutes from './routes/telephonyRoutes';
import adminRoutes from './routes/adminRoutes';

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin) || config.env === 'development') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local dev
    },
    credentials: true
  }));

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // General Rate Limiting
  app.use(generalRateLimiter);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NetCall Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // WebRTC STUN/TURN ICE Servers config endpoint
  app.get('/api/webrtc/ice-servers', (req, res) => {
    const iceServers = config.webrtc.stunServers.map(url => ({ urls: url.trim() }));
    if (config.webrtc.turnServerUrl) {
      iceServers.push({
        urls: config.webrtc.turnServerUrl,
        username: config.webrtc.turnUsername,
        credential: config.webrtc.turnCredential
      } as any);
    }
    res.json({ success: true, data: { iceServers } });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/calls', callRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/telephony', telephonyRoutes);
  app.use('/api/admin', adminRoutes);

  // In production, serve the frontend single-page application from apps/web/dist
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDistPath)) {
    console.log(`[NetCall] Serving production web client from: ${webDistPath}`);
    app.use(express.static(webDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

