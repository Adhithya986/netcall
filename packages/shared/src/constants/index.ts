import { PricingPlan } from '../types';

export const SOCKET_EVENTS = {
  // Client to Server
  CALL_INITIATE: 'call:initiate',
  CALL_ACCEPT: 'call:accept',
  CALL_REJECT: 'call:reject',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  CALL_ICE_CANDIDATE: 'call:ice-candidate',
  CALL_HANGUP: 'call:hangup',
  CALL_MUTE_TOGGLE: 'call:mute-toggle',

  // Server to Client
  CALL_INCOMING: 'call:incoming',
  CALL_RINGING: 'call:ringing',
  CALL_ACCEPTED: 'call:accepted',
  CALL_REJECTED: 'call:rejected',
  CALL_BUSY: 'call:busy',
  CALL_UNAVAILABLE: 'call:unavailable',
  CALL_ENDED: 'call:ended',
  CALL_PEER_MUTED: 'call:peer-muted',
  CALL_ERROR: 'call:error',
  WALLET_UPDATED: 'wallet:updated'
} as const;

// Default initial wallet credit: 500 INR (50,000 paise)
export const DEFAULT_INITIAL_WALLET_PAISE = 50000;

// Rates in integer paise (1 INR = 100 paise)
export const RATES_PAISE = {
  INTERNET_PER_MINUTE: 0,      // Unlimited free WebRTC calling
  PSTN_INDIA_PER_MINUTE: 150,  // ₹1.50 per minute (150 paise)
  PSTN_MINIMUM_BILLABLE_PULSE_SECONDS: 60
} as const;

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Flex',
    description: 'Perfect for casual internet voice calling and light Indian telecom calls.',
    pricePaise: 19900, // ₹199
    creditPaise: 25000, // ₹250 wallet credit (Bonus ₹51)
    pstnRatePerMinutePaise: 150, // ₹1.50/min
    features: [
      'Unlimited HD Internet-to-Internet Calls',
      'Encrypted P2P Voice (Opus Codec)',
      '₹250 Calling Balance for Telecom (PSTN)',
      'Standard Caller ID Presentation',
      'Call Logs & History'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Professional',
    description: 'Designed for active professionals and remote teams with higher telecom call volume.',
    pricePaise: 49900, // ₹499
    creditPaise: 65000, // ₹650 wallet credit (Bonus ₹151)
    pstnRatePerMinutePaise: 120, // ₹1.20/min discounted
    popular: true,
    features: [
      'Unlimited HD Internet-to-Internet Calls',
      'Discounted PSTN Rate: ₹1.20 / min',
      '₹650 Calling Balance for Telecom (PSTN)',
      'Enterprise TURN Relay Priority',
      'Detailed Auditable Transaction Ledger',
      'Priority Audio QoS'
    ]
  },
  {
    id: 'business',
    name: 'Enterprise Ultra',
    description: 'High-volume business calling with dedicated telecom trunk and audit compliance.',
    pricePaise: 149900, // ₹1,499
    creditPaise: 200000, // ₹2,000 wallet credit (Bonus ₹501)
    pstnRatePerMinutePaise: 90, // ₹0.90/min high volume
    features: [
      'Unlimited HD Internet-to-Internet Calls',
      'Lowest PSTN Rate: ₹0.90 / min',
      '₹2,000 Calling Balance for Telecom (PSTN)',
      'Regulatory TRAI DND Compliance Filter',
      'Full API Access & Webhook Callbacks',
      'Dedicated Customer Support'
    ]
  }
];

export const TELECOM_COMPLIANCE_DISCLAIMER = 
  'Indian Telecom Notice: Under DoT & TRAI guidelines, VoIP-to-PSTN calling requires licensed carrier interconnect. In this environment, NetCall runs in verified Mock Sandbox Mode unless production DoT-approved carrier credentials (e.g., Airtel IQ, Exotel, Tata Tele) are configured.';
