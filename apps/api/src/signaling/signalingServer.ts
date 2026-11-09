import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { CallService } from '../services/callService';
import { SOCKET_EVENTS, CallStatus } from '@netcall/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  email?: string;
  currentCallId?: string;
}

interface ActiveCallSession {
  callId: string;
  callerId: string;
  receiverId?: string;
  startedAt: Date;
  status: CallStatus;
}

export class SignalingServer {
  private io: SocketIOServer;
  // Map of userId -> Set of socketIds (supports multiple tabs/devices)
  private userSockets: Map<string, Set<string>> = new Map();
  // Map of socketId -> userId
  private socketUsers: Map<string, string> = new Map();
  // Map of callId -> ActiveCallSession
  private activeCalls: Map<string, ActiveCallSession> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupAuthMiddleware();
    this.setupEventHandlers();
  }

  private setupAuthMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      try {
        const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        socket.email = decoded.email;
        next();
      } catch (err) {
        next(new Error('Invalid or expired authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const username = socket.username!;

      console.log(`[Signaling] User connected: ${username} (${userId}) on socket ${socket.id}`);

      // Track active sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);
      this.socketUsers.set(socket.id, userId);

      // Join personal room for targeted alerts
      socket.join(`user:${userId}`);

      // Broadcast online status or notify peers if needed
      this.io.emit('user:status', { userId, status: 'online' });

      // Handle Call Initiation
      socket.on(SOCKET_EVENTS.CALL_INITIATE, async (data: { targetUserId?: string; targetUsername?: string; callType: any; destinationNumber?: string }) => {
        try {
          const { targetUserId, callType } = data;

          if (callType === 'INTERNET_WEBRTC') {
            if (!targetUserId) {
              socket.emit(SOCKET_EVENTS.CALL_ERROR, { message: 'Target user is required for Internet call' });
              return;
            }

            // Check if target user is online
            const targetSockets = this.userSockets.get(targetUserId);
            if (!targetSockets || targetSockets.size === 0) {
              socket.emit(SOCKET_EVENTS.CALL_UNAVAILABLE, { reason: 'offline', message: 'User is currently offline' });
              return;
            }

            // Check if caller or target is already in an active call
            if (socket.currentCallId) {
              socket.emit(SOCKET_EVENTS.CALL_ERROR, { message: 'You are already in an active call' });
              return;
            }

            // Create call in database
            const { callRecord, targetUser } = await CallService.initiateCall(userId, {
              callType: 'INTERNET_WEBRTC',
              targetUserId
            });

            const callId = callRecord.callId;
            socket.currentCallId = callId;
            socket.join(`call:${callId}`);

            this.activeCalls.set(callId, {
              callId,
              callerId: userId,
              receiverId: targetUserId,
              startedAt: new Date(),
              status: 'RINGING'
            });

            // Notify caller that recipient is ringing
            socket.emit(SOCKET_EVENTS.CALL_RINGING, { callId, targetUser });

            // Notify callee of incoming call
            this.io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_INCOMING, {
              callId,
              callType: 'INTERNET_WEBRTC',
              caller: {
                id: userId,
                fullName: callRecord.callerName,
                username: callRecord.callerUsername
              }
            });
          }
        } catch (err: any) {
          console.error('[Signaling] Call initiate error:', err);
          socket.emit(SOCKET_EVENTS.CALL_ERROR, { message: err.message || 'Failed to initiate call' });
        }
      });

      // Handle Call Accept
      socket.on(SOCKET_EVENTS.CALL_ACCEPT, async (data: { callId: string }) => {
        try {
          const { callId } = data;
          const session = this.activeCalls.get(callId);

          if (!session || session.receiverId !== userId) {
            socket.emit(SOCKET_EVENTS.CALL_ERROR, { message: 'Invalid call session' });
            return;
          }

          socket.currentCallId = callId;
          socket.join(`call:${callId}`);
          session.status = 'ANSWERED';

          await CallService.markAnswered(callId);

          // Tell both participants that call is accepted and to begin WebRTC offer/answer
          this.io.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ACCEPTED, { callId });
        } catch (err: any) {
          console.error('[Signaling] Call accept error:', err);
          socket.emit(SOCKET_EVENTS.CALL_ERROR, { message: err.message || 'Failed to accept call' });
        }
      });

      // Handle Call Reject
      socket.on(SOCKET_EVENTS.CALL_REJECT, async (data: { callId: string }) => {
        try {
          const { callId } = data;
          const session = this.activeCalls.get(callId);

          if (session) {
            this.activeCalls.delete(callId);
            await CallService.endCall(callId, 'Call rejected by callee', 'REJECTED');
            this.io.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_REJECTED, { callId, reason: 'rejected' });
          }
        } catch (err: any) {
          console.error('[Signaling] Call reject error:', err);
        }
      });

      // Handle WebRTC Offer
      socket.on(SOCKET_EVENTS.CALL_OFFER, (data: { callId: string; sdp: any }) => {
        const { callId, sdp } = data;
        // Broadcast offer to everyone else in this call room
        socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_OFFER, { callId, sdp });
      });

      // Handle WebRTC Answer
      socket.on(SOCKET_EVENTS.CALL_ANSWER, (data: { callId: string; sdp: any }) => {
        const { callId, sdp } = data;
        socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ANSWER, { callId, sdp });
      });

      // Handle WebRTC ICE Candidate
      socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, (data: { callId: string; candidate: any }) => {
        const { callId, candidate } = data;
        socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, { callId, candidate });
      });

      // Handle Mute Status Sync
      socket.on(SOCKET_EVENTS.CALL_MUTE_TOGGLE, (data: { callId: string; isMuted: boolean }) => {
        const { callId, isMuted } = data;
        socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_PEER_MUTED, { callId, isMuted, userId });
      });

      // Handle Call Hangup / End
      socket.on(SOCKET_EVENTS.CALL_HANGUP, async (data: { callId: string; reason?: string }) => {
        await this.handleCallHangup(socket, data.callId, data.reason || 'User ended call');
      });

      // Handle Disconnection
      socket.on('disconnect', async () => {
        console.log(`[Signaling] Socket disconnected: ${socket.id} (User: ${username})`);

        if (socket.currentCallId) {
          await this.handleCallHangup(socket, socket.currentCallId, 'Peer connection lost');
        }

        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            this.io.emit('user:status', { userId, status: 'offline' });
          }
        }
        this.socketUsers.delete(socket.id);
      });
    });
  }

  private async handleCallHangup(socket: AuthenticatedSocket, callId: string, reason: string) {
    try {
      const session = this.activeCalls.get(callId);
      this.activeCalls.delete(callId);

      // Notify other peers in room
      this.io.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ENDED, { callId, reason });

      // Clean up call socket room
      socket.leave(`call:${callId}`);
      socket.currentCallId = undefined;

      // Finalize database record & billing
      await CallService.endCall(callId, reason);
    } catch (err) {
      console.error('[Signaling] Error during call hangup:', err);
    }
  }

  public isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }
}
