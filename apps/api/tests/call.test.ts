import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Calling Engine & WebRTC Signaling API', () => {
  let userA: { token: string; id: string; username: string };
  let userB: { token: string; id: string; username: string };

  const registerUser = async (u: { email: string; username: string; fullName: string }) => {
    const res = await request(app).post('/api/auth/register').send({
      ...u,
      password: 'Password123!'
    });
    return {
      token: res.body.data.accessToken,
      id: res.body.data.user.id,
      username: res.body.data.user.username
    };
  };

  it('should return valid ICE STUN servers configuration', async () => {
    const res = await request(app).get('/api/webrtc/ice-servers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.iceServers.length).toBeGreaterThan(0);
    expect(res.body.data.iceServers[0].urls).toContain('stun:');
  });

  it('should initiate an Internet WebRTC call between two users', async () => {
    userA = await registerUser({
      email: 'usera@netcall.test',
      username: 'user_a',
      fullName: 'User Alpha'
    });
    userB = await registerUser({
      email: 'userb@netcall.test',
      username: 'user_b',
      fullName: 'User Beta'
    });

    const res = await request(app)
      .post('/api/calls/initiate')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        callType: 'INTERNET_WEBRTC',
        targetUserId: userB.id
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.callRecord.callId).toBeDefined();
    expect(res.body.data.callRecord.callType).toBe('INTERNET_WEBRTC');
    expect(res.body.data.callRecord.status).toBe('INITIATED');
  });

  it('should initiate a Telecom PSTN call routed to mock carrier adapter', async () => {
    const caller = await registerUser({
      email: 'caller_pstn@netcall.test',
      username: 'caller_pstn',
      fullName: 'PSTN Caller'
    });

    const res = await request(app)
      .post('/api/calls/initiate')
      .set('Authorization', `Bearer ${caller.token}`)
      .send({
        callType: 'TELECOM_PSTN',
        destinationNumber: '+919876543210'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.telecomResult.isMock).toBe(true);
    expect(res.body.data.telecomResult.providerName).toBe('MOCK_SANDBOX');
  });

  it('should conclude call session, record duration, and write to call history', async () => {
    const caller = await registerUser({
      email: 'history_user@netcall.test',
      username: 'history_user',
      fullName: 'History Caller'
    });

    const initRes = await request(app)
      .post('/api/calls/initiate')
      .set('Authorization', `Bearer ${caller.token}`)
      .send({
        callType: 'TELECOM_PSTN',
        destinationNumber: '+919876543210'
      });

    const callId = initRes.body.data.callRecord.callId;

    // Simulate carrier answering and completing
    await request(app)
      .post('/api/telephony/sandbox/simulate-event')
      .send({ callId, event: 'answered' });

    const endRes = await request(app)
      .post(`/api/calls/${callId}/end`)
      .set('Authorization', `Bearer ${caller.token}`)
      .send({ reason: 'Normal call end' });

    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('COMPLETED');

    // Check history endpoint
    const historyRes = await request(app)
      .get('/api/calls/history')
      .set('Authorization', `Bearer ${caller.token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.calls.length).toBeGreaterThan(0);
    expect(historyRes.body.data.calls[0].callId).toBe(callId);
  });
});

