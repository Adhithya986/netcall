import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { connectDB, disconnectDB } from './db/connection';
import { SignalingServer } from './signaling/signalingServer';
import { config } from './config';

async function bootstrap() {
  try {
    console.log('[NetCall] Starting NetCall API Server...');

    // Connect to MongoDB
    await connectDB();

    // Create Express application
    const app = createApp();

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO Server with CORS
    const io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 30000,
      pingInterval: 15000
    });

    // Initialize WebRTC Signaling Server
    const signalingServer = new SignalingServer(io);

    // Start Listening
    server.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`  🚀 NETCALL API SERVER STARTED                    `);
      console.log(`  📡 Port: http://localhost:${config.port}         `);
      console.log(`  📞 Signaling: Socket.IO initialized             `);
      console.log(`  🇮🇳 Telephony: ${config.telephony.provider} (Sandbox: ${config.telephony.sandboxMode})`);
      console.log(`  🛢️  Database: Connected                          `);
      console.log(`====================================================`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      console.log(`\n[NetCall] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        console.log('[NetCall] HTTP & Socket.IO server closed.');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('[NetCall] Fatal error during startup:', error);
    process.exit(1);
  }
}

bootstrap();

