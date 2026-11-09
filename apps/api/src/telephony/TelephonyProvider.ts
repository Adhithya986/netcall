import {
  OutboundCallRequest,
  TelephonyCallResult,
  TelephonyStatusCallback,
  TelephonyProviderInfo
} from '@netcall/shared';

export interface ITelephonyProvider {
  /**
   * The unique identifier for this provider (e.g. 'MOCK', 'AIRTEL_IQ', 'EXOTEL', 'TWILIO')
   */
  readonly name: string;

  /**
   * Returns metadata and capability status of the provider
   */
  getProviderInfo(): TelephonyProviderInfo;

  /**
   * Initiates an outbound voice call terminating on the cellular/PSTN network
   */
  initiateOutboundCall(req: OutboundCallRequest): Promise<TelephonyCallResult>;

  /**
   * Terminates or cancels an ongoing telephony call session
   */
  terminateCall(providerCallSid: string): Promise<boolean>;

  /**
   * Verifies the cryptographic signature of an incoming carrier webhook event
   */
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: string | any): boolean;

  /**
   * Normalizes incoming carrier webhook payload into standard NetCall format
   */
  parseWebhookPayload(payload: any): TelephonyStatusCallback;
}
