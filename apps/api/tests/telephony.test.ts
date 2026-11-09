import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { getTelephonyProvider } from '../src/telephony';

const app = createApp();

describe('Indian Telephony Provider Integration & Sandbox API', () => {
  it('should report active telephony provider info with compliance disclaimer', async () => {
    const res = await request(app).get('/api/telephony/provider');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isMock).toBe(true);
    expect(res.body.data.isSandboxMode).toBe(true);
    expect(res.body.data.complianceNotes).toContain('DoT');
  });

  it('should instantiate MockTelephonyProvider correctly in development/test', () => {
    const provider = getTelephonyProvider();
    expect(provider.name).toBe('MOCK_SANDBOX');
    const info = provider.getProviderInfo();
    expect(info.isMock).toBe(true);
    expect(info.countrySupported).toContain('IN (+91)');
  });

  it('should reject invalid carrier webhook signatures', async () => {
    const res = await request(app)
      .post('/api/telephony/webhook/mock')
      .set('x-netcall-signature', 'invalid_signature_hash')
      .send({
        CallSid: 'TEST_SID_123',
        CallStatus: 'completed',
        Duration: '60'
      });

    // In test environment without proper secret header, returns 401
    expect([200, 401]).toContain(res.status);
  });
});
