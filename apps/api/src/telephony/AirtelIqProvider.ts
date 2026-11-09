import { ITelephonyProvider } from './TelephonyProvider';
import {
  OutboundCallRequest,
  TelephonyCallResult,
  TelephonyStatusCallback,
  TelephonyProviderInfo,
  CallStatus
} from '@netcall/shared';
import { config } from '../config';

export class AirtelIqProvider implements ITelephonyProvider {
  readonly name = 'AIRTEL_IQ';

  private get isConfigured(): boolean {
    const { appId, secret } = config.telephony.airtelIq;
    return Boolean(appId && secret);
  }

  getProviderInfo(): TelephonyProviderInfo {
    return {
      providerId: 'AIRTEL_IQ',
      name: 'Bharti Airtel IQ (Indian Enterprise Telephony)',
      isMock: false,
      isSandboxMode: !this.isConfigured,
      configured: this.isConfigured,
      countrySupported: ['IN (+91)'],
      complianceNotes:
        'Airtel IQ operates directly on Bharti Airtel Tier-1 telecom infrastructure in India. Requires verified business entity, Indian GSTIN, PAN, and TRAI regulatory clearance.'
    };
  }

  async initiateOutboundCall(req: OutboundCallRequest): Promise<TelephonyCallResult> {
    if (!this.isConfigured) {
      console.warn('[AirtelIqProvider] Airtel IQ credentials not configured. Refusing outbound PSTN call.');
      return {
        success: false,
        providerCallSid: '',
        status: 'FAILED',
        message: 'Airtel IQ provider credentials not configured. Outbound PSTN disabled.',
        isMock: false,
        providerName: this.name
      };
    }

    return {
      success: false,
      providerCallSid: '',
      status: 'FAILED',
      message: 'Airtel IQ live integration requires active enterprise TLS tunnel and static IP whitelisting.',
      isMock: false,
      providerName: this.name
    };
  }

  async terminateCall(providerCallSid: string): Promise<boolean> {
    return false;
  }

  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: any): boolean {
    return false;
  }

  parseWebhookPayload(payload: any): TelephonyStatusCallback {
    return {
      providerCallSid: payload.callSessionId || '',
      callId: payload.correlationId || '',
      callStatus: 'COMPLETED',
      durationSeconds: parseInt(payload.billableDuration || '0', 10),
      rawPayload: payload
    };
  }
}

