export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export type CallType = 'INTERNET_WEBRTC' | 'TELECOM_PSTN';

export type CallStatus = 
  | 'INITIATED' 
  | 'RINGING' 
  | 'ANSWERED' 
  | 'REJECTED' 
  | 'BUSY' 
  | 'MISSED' 
  | 'COMPLETED' 
  | 'FAILED';

export interface CallRecordDTO {
  id: string;
  callId: string;
  callerId: string;
  callerName: string;
  callerUsername: string;
  receiverId?: string;
  receiverName?: string;
  receiverUsername?: string;
  destinationNumber?: string;
  callType: CallType;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds: number;
  costPaise: number;
  endReason?: string;
}

export interface WalletDTO {
  id: string;
  userId: string;
  balancePaise: number;
  currency: 'INR';
  isDemo: boolean;
  updatedAt: string;
}

export type TransactionType = 'CREDIT_TOPUP' | 'DEBIT_CALL' | 'REFUND' | 'PROMO_GRANT';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';

export interface TransactionLedgerDTO {
  id: string;
  transactionId: string;
  userId: string;
  type: TransactionType;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  pricePaise: number;
  creditPaise: number;
  pstnRatePerMinutePaise: number;
  features: string[];
  popular?: boolean;
}

// Signaling Payloads
export interface CallInitiatePayload {
  targetUserId?: string;
  targetUsername?: string;
  destinationNumber?: string;
  callType: CallType;
}

export interface CallIncomingPayload {
  callId: string;
  caller: {
    id: string;
    fullName: string;
    username: string;
  };
  callType: CallType;
}

export interface CallOfferPayload {
  callId: string;
  sdp: any;
}

export interface CallAnswerPayload {
  callId: string;
  sdp: any;
}

export interface CallIceCandidatePayload {
  callId: string;
  candidate: any;
}

export interface CallHangupPayload {
  callId: string;
  reason?: string;
}

export interface CallStatusPayload {
  callId: string;
  status: CallStatus;
  details?: string;
}

// Telephony Provider Interface DTOs
export interface OutboundCallRequest {
  callId: string;
  fromNumber: string;
  toNumber: string;
  callerName?: string;
  maxDurationSeconds?: number;
}

export interface TelephonyCallResult {
  success: boolean;
  providerCallSid: string;
  status: CallStatus;
  message?: string;
  isMock: boolean;
  providerName: string;
}

export interface TelephonyStatusCallback {
  providerCallSid: string;
  callId: string;
  callStatus: CallStatus;
  durationSeconds: number;
  costPaise?: number;
  rawPayload?: Record<string, any>;
}

export interface TelephonyProviderInfo {
  providerId: string;
  name: string;
  isMock: boolean;
  isSandboxMode: boolean;
  configured: boolean;
  countrySupported: string[];
  complianceNotes: string;
}
