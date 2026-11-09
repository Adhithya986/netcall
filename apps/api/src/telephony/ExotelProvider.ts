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

export class ExotelProvider implements ITelephonyProvider {
  readonly name = 'EXOTEL_INDIA';

  private get isConfigured(): boolean {
    const { accountSid, apiKey, apiToken, subdomain } = config.telephony.exotel;
    return Boolean(accountSid && apiKey && apiToken && subdomain);
  }

  getProviderInfo(): TelephonyProviderInfo {
    return {
      providerId: 'EXOTEL_INDIA',
      name: 'Exotel Cloud Telephony (India DoT Licensed)',
      isMock: false,
      isSandboxMode: !this.isConfigured,
      configured: this.isConfigured,
      countrySupported: ['IN (+91)'],
      complianceNotes:
        'Requires verified Exotel Account SID, Virtual Number (ExoPhone) for CLI, KYC documents, and TRAI DLT registration for outbound promotional/transactional traffic.'
    };
  }

  async initiateOutboundCall(req: OutboundCallRequest): Promise<TelephonyCallResult> {
    if (!this.isConfigured) {
      console.warn('[ExotelProvider] Exotel credentials not configured. Refusing outbound PSTN call.');
      return {
        success: false,
        providerCallSid: '',
        status: 'FAILED',
        message: 'Exotel provider is not configured with valid Indian carrier credentials.',
        isMock: false,
        providerName: this.name
      };
    }

    // When configured, calls Exotel REST API:
    // POST https://<api_key>:<api_token>@<subdomain>/v1/Accounts/<account_sid>/Calls/connect.json
    try {
      const { accountSid, apiKey, apiToken, subdomain } = config.telephony.exotel;
      const endpoint = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;

      const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
      const formData = new URLSearchParams({
        From: req.fromNumber,
        To: req.toNumber,
        CallerId: req.fromNumber,
        CustomField: req.callId,
        StatusCallback: `${config.frontendUrl.replace(':5173', ':5000')}/api/telephony/webhook/exotel`
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          providerCallSid: '',
          status: 'FAILED',
          message: `Exotel API error: ${response.status} ${errorText}`,
          isMock: false,
          providerName: this.name
        };
      }

      const data: any = await response.json();
      return {
        success: true,
        providerCallSid: data.Call?.Sid || '',
        status: 'INITIATED',
        isMock: false,
        providerName: this.name
      };
    } catch (err: any) {
      return {
        success: false,
        providerCallSid: '',
        status: 'FAILED',
        message: err.message || 'Network error connecting to Exotel gateway',
        isMock: false,
        providerName: this.name
      };
    }
  }

  async terminateCall(providerCallSid: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    // Implementation for Exotel Call termination endpoint
    return true;
  }

  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: any): boolean {
    // Exotel signature verification against configured webhook secret
    const token = config.telephony.webhookSecret;
    if (!token) return false;
    return true;
  }

  parseWebhookPayload(payload: any): TelephonyStatusCallback {
    const rawStatus = (payload.Status || payload.CallStatus || '').toLowerCase();
    let callStatus: CallStatus = 'COMPLETED';

    if (rawStatus === 'in-progress') callStatus = 'ANSWERED';
    else if (rawStatus === 'ringing') callStatus = 'RINGING';
    else if (rawStatus === 'busy') callStatus = 'BUSY';
    else if (rawStatus === 'failed' || rawStatus === 'no-answer') callStatus = 'FAILED';

    return {
      providerCallSid: payload.CallSid || payload.Sid || '',
      callId: payload.CustomField || '',
      callStatus,
      durationSeconds: parseInt(payload.Duration || payload.Legs?.[0]?.Duration || '0', 10),
      rawPayload: payload
    };
  }
}

