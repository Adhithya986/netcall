import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { SignalingServer } from '../src/signaling/signalingServer';
import { config } from '../src/config';
import { SOCKET_EVENTS } from '@netcall/shared';
import { mockDb } from './mocks/dbMock';

describe('Real-Time WebRTC Signaling Server End-to-End', () => {
  let httpServer: http.Server;
  let ioServer: SocketIOServer;
  let serverPort: number;

  let client1: ClientSocketType;
  let client2: ClientSocketType;

  const user1 = {
    userId: 'test_webrtc_user_1',
    username: 'user_one',
    email: 'user1@netcall.test',
    role: 'user'
  };

  const user2 = {
    userId: 'test_webrtc_user_2',
    username: 'user_two',
    email: 'user2@netcall.test',
    role: 'user'
  };

  const token1 = jwt.sign(user1, config.jwt.accessSecret);
  const token2 = jwt.sign(user2, config.jwt.accessSecret);

  beforeAll(async () => {
    const app = createApp();
    httpServer = http.createServer(app);
    ioServer = new SocketIOServer(httpServer, {
      cors: { origin: '*' }
    });

    new SignalingServer(ioServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address() as any;
        serverPort = address.port;
        resolve();
      });
    });
  });

  beforeEach(() => {
    // Ensure users exist in mockDb before each test runs
    mockDb.users.push(
      {
        _id: user1.userId,
        email: user1.email,
        username: user1.username,
        fullName: 'User One',
        role: 'user',
        status: 'active'
      },
      {
        _id: user2.userId,
        email: user2.email,
        username: user2.username,
        fullName: 'User Two',
        role: 'user',
        status: 'active'
      }
    );
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    ioServer?.close();
    await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
  });

  it('should authenticate and connect two clients via Socket.IO signaling', async () => {
    const connectClient = (token: string): Promise<ClientSocketType> => {
      return new Promise((resolve, reject) => {
        const socket = ClientSocket(`http://localhost:${serverPort}`, {
          auth: { token },
          transports: ['websocket']
        });
        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', reject);
      });
    };

    client1 = await connectClient(token1);
    client2 = await connectClient(token2);

    expect(client1.connected).toBe(true);
    expect(client2.connected).toBe(true);
  });

  it('should negotiate complete WebRTC calling lifecycle between Client 1 and Client 2', async () => {
    let activeCallId = '';

    // Step 1: Client 1 initiates call to Client 2
    const incomingPromise = new Promise<{ callId: string; caller: any }>((resolve) => {
      client2.on(SOCKET_EVENTS.CALL_INCOMING, (payload) => {
        resolve(payload);
      });
    });

    client1.emit(SOCKET_EVENTS.CALL_INITIATE, {
      callType: 'INTERNET_WEBRTC',
      targetUserId: user2.userId
    });

    const incoming = await incomingPromise;
    expect(incoming.callId).toBeDefined();
    expect(incoming.caller.id).toBe(user1.userId);
    activeCallId = incoming.callId;

    // Step 2: Client 2 accepts call
    const acceptedPromise = new Promise<{ callId: string }>((resolve) => {
      client1.on(SOCKET_EVENTS.CALL_ACCEPTED, (payload) => {
        resolve(payload);
      });
    });

    client2.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: activeCallId });
    const accepted = await acceptedPromise;
    expect(accepted.callId).toBe(activeCallId);

    // Step 3: SDP Offer exchange
    const offerPromise = new Promise<any>((resolve) => {
      client2.on(SOCKET_EVENTS.CALL_OFFER, (data) => resolve(data));
    });

    const mockOfferSdp = { type: 'offer', sdp: 'v=0\r\no=mock 123456...' };
    client1.emit(SOCKET_EVENTS.CALL_OFFER, {
      callId: activeCallId,
      sdp: mockOfferSdp
    });

    const receivedOffer = await offerPromise;
    expect(receivedOffer.sdp.sdp).toBe(mockOfferSdp.sdp);

    // Step 4: SDP Answer exchange
    const answerPromise = new Promise<any>((resolve) => {
      client1.on(SOCKET_EVENTS.CALL_ANSWER, (data) => resolve(data));
    });

    const mockAnswerSdp = { type: 'answer', sdp: 'v=0\r\no=mock 654321...' };
    client2.emit(SOCKET_EVENTS.CALL_ANSWER, {
      callId: activeCallId,
      sdp: mockAnswerSdp
    });

    const receivedAnswer = await answerPromise;
    expect(receivedAnswer.sdp.sdp).toBe(mockAnswerSdp.sdp);

    // Step 5: ICE Candidate trickle
    const icePromise = new Promise<any>((resolve) => {
      client2.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, (data) => resolve(data));
    });

    const mockCandidate = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };
    client1.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
      callId: activeCallId,
      candidate: mockCandidate
    });

    const receivedCandidate = await icePromise;
    expect(receivedCandidate.candidate.candidate).toBe(mockCandidate.candidate);

    // Step 6: Mute Status synchronization
    const mutePromise = new Promise<any>((resolve) => {
      client2.on(SOCKET_EVENTS.CALL_PEER_MUTED, (data) => resolve(data));
    });

    client1.emit(SOCKET_EVENTS.CALL_MUTE_TOGGLE, {
      callId: activeCallId,
      isMuted: true
    });

    const muteData = await mutePromise;
    expect(muteData.isMuted).toBe(true);

    // Step 7: Hangup / Teardown
    const endedPromise = new Promise<any>((resolve) => {
      client2.on(SOCKET_EVENTS.CALL_ENDED, (data) => resolve(data));
    });

    client1.emit(SOCKET_EVENTS.CALL_HANGUP, {
      callId: activeCallId,
      reason: 'User completed conversation'
    });

    const endedData = await endedPromise;
    expect(endedData.callId).toBe(activeCallId);
  });
});
