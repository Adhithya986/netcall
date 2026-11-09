import crypto from 'crypto';
import { ITelephonyProvider } from './TelephonyProvider';
import {
  OutboundCallRequest,
  TelephonyCallResult,
  TelephonyStatusCallback,
  TelephonyProviderInfo,
  CallStatus
} from '@netcall/shared';
import { config } from '../config';

export class MockTelephonyProvider implements ITelephonyProvider {
  readonly name = 'MOCK_SANDBOX';

  getProviderInfo(): TelephonyProviderInfo {
    return {
      providerId: 'MOCK_SANDBOX',
      name: 'NetCall Indian Telecom Simulator (Sandbox)',
      isMock: true,
      isSandboxMode: true,
      configured: true,
      countrySupported: ['IN (+91)'],
      complianceNotes:
        'Simulation Mode. In production, an Indian Unified License (Access/VNO) with verified carrier interconnect (Airtel IQ, Tata Tele, Exotel) is mandatory under DoT guidelines.'
    };
  }

  async initiateOutboundCall(req: OutboundCallRequest): Promise<TelephonyCallResult> {
    console.log(`[MOCK TELEPHONY SANDBOX] Outbound call requested to: ${req.toNumber} from: ${req.fromNumber}`);
    
    // Simulate carrier delay and allocation of Call SID
    const mockSid = `MOCK_SID_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Validate phone number format for India (+91 or 10 digits)
    const cleanedNumber = req.toNumber.replace(/[\s-]/g, '');
    const isIndianNumber = /^(?:\+91|91)?[6-9]\d{9}$/.test(cleanedNumber);

    if (!isIndianNumber) {
      console.warn(`[MOCK TELEPHONY SANDBOX] Warning: ${req.toNumber} does not match standard Indian mobile number pattern`);
    }

    return {
      success: true,
      providerCallSid: mockSid,
      status: 'INITIATED',
      message: 'Outbound call simulation initiated in certified Mock Sandbox Mode',
      isMock: true,
      providerName: this.name
    };
  }

  async terminateCall(providerCallSid: string): Promise<boolean> {
    console.log(`[MOCK TELEPHONY SANDBOX] Terminating simulated call SID: ${providerCallSid}`);
    return true;
  }

  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string | any): boolean {
    const signature = headers['x-netcall-signature'] || headers['x-mock-signature'];
    if (!signature) {
      // In mock development, accept if matching configured secret or test environment
      return config.env === 'development' || config.env === 'test';
    }

    const secret = config.telephony.webhookSecret;
    const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyStr)
      .digest('hex');

    return signature === expectedSignature;
  }

  parseWebhookPayload(payload: any): TelephonyStatusCallback {
    // Normalizes mock carrier webhook payload
    const rawStatus = (payload.status || payload.CallStatus || 'completed').toLowerCase();
    let callStatus: CallStatus = 'COMPLETED';

    switch (rawStatus) {
      case 'in-progress':
      case 'answered':
        callStatus = 'ANSWERED';
        break;
      case 'ringing':
        callStatus = 'RINGING';
        break;
      case 'busy':
        callStatus = 'BUSY';
        break;
      case 'no-answer':
      case 'failed':
        callStatus = 'FAILED';
        break;
      case 'completed':
      default:
        callStatus = 'COMPLETED';
        break;
    }

    const durationSeconds = parseInt(payload.Duration || payload.durationSeconds || '0', 10);
    const costPaise = parseInt(payload.costPaise || '0', 10);

    return {
      providerCallSid: payload.CallSid || payload.providerCallSid || 'UNKNOWN_SID',
      callId: payload.callId || payload.CustomField || '',
      callStatus,
      durationSeconds,
      costPaise,
      rawPayload: payload
    };
  }
}
