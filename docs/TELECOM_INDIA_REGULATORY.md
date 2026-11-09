# Indian Telecom Regulatory Analysis & Provider Verification Guide

**Document:** Indian Telecom & PSTN Interconnect Architecture  
**Authority Reference:** Department of Telecommunications (DoT), Ministry of Communications, Government of India; Telecom Regulatory Authority of India (TRAI)  
**Applicable Statutes:** Indian Telegraph Act, 1885; Indian Wireless Telegraphy Act, 1933; Unified License (UL) Guidelines; TRAI Telecom Commercial Communications Customer Preference Regulations (TCCCPR), 2018  

---

## 1. Regulatory Framework Overview

In India, voice communications bridging the unmanaged Internet (Internet Protocol / VoIP) with the Public Switched Telephone Network (PSTN) or Public Land Mobile Network (PLMN / Cellular) are strictly regulated. 

### Key Regulatory Tenets:
1. **Separation of Unrestricted VoIP and PSTN (IP-PSTN Bypass):**
   - Direct interconnection between unmanaged internet voice (such as vanilla WebRTC) and Indian cellular phones is **prohibited** without passing through a licensed Telecom Service Provider (TSP) possessing an Access Service License or Unified License (VNO - Virtual Network Operator).
   - "Toll bypass" (routing international or national long-distance calls over the internet to evade interconnect usage charges - IUC) is a punishable violation under the Indian Telegraph Act.
2. **Calling Line Identification (CLI) Spoofing Prevention:**
   - Under DoT directives (Circular No. 800-47/2012-VAS), every outbound call terminating on an Indian subscriber mobile device must present a verified, allocated Indian telephone number (CLI) assigned to the originating entity within the corresponding licensed telecom circle (LSA).
   - Arbitrary or spoofed caller IDs are strictly blocked by Indian national transit gateways (DoT CIID system).
3. **TRAI TCCCPR (2018) & Anti-Spam DLT Mandates:**
   - Commercial voice traffic (promotional or transactional) must be registered on a telecom Distributed Ledger Technology (DLT) platform (operated by Airtel, Jio, Vodafone Idea, or BSNL).
   - Outbound calling to numbers registered on the National Do Not Disturb (DND) register without verifiable consumer consent is unlawful.

---

## 2. Comparative Evaluation of Indian Telephony Providers

To enable outbound calling from NetCall to Indian mobile phones, an enterprise must contract with an authorized, DoT-licensed provider:

| Provider | License Type | Strengths | Requirements / KYC | Pricing Model |
|---|---|---|---|---|
| **Bharti Airtel IQ** | Tier-1 Unified License (TSP) | Direct interconnect on Airtel's national 4G/5G/IMS core; lowest latency; zero intermediate hops | Indian Enterprise KYC (GSTIN, PAN, Certificate of Incorporation), static IP whitelist, enterprise contract | ~₹0.80 - ₹1.20 / min (Volume-based pulse billing) |
| **Exotel** | Cloud Telephony / VNO Partner | Developer-friendly REST API, virtual number allocation (ExoPhones), automated call callbacks | Indian business registration, Aadhaar/PAN of authorized signatory, DLT entity registration | ~₹1.20 - ₹1.50 / min + monthly DID rental |
| **Tata Tele Business Services (TTBS)** | Unified Access License (TSP) | High-concurrency enterprise SIP trunks, SmartFlo cloud PBX platform | Enterprise enterprise KYC, signed interconnect agreement, SLA guarantees | Tiered trunk rates, ~₹0.70 - ₹1.10 / min |
| **Twilio India** | VNO License Partnership | Unified global API with Indian local number termination | Local entity presence, strict TRAI regulatory compliance form submission | ~₹1.80 - ₹2.50 / min (Higher markups) |
| **Plivo India** | Telecom Partner Bridge | REST voice API, multi-circle Indian termination | Business verification, KYC documents, pre-funded wallet | ~₹1.40 - ₹1.80 / min |

---

## 3. NetCall Provider Adapter Architecture

NetCall implements the **`TelephonyProvider`** interface (`apps/api/src/telephony/TelephonyProvider.ts`):
- **`MockTelephonyProvider` (Default Sandbox):** Operates out-of-the-box in local development and automated CI environments without requiring carrier contracts. It simulates call progression states (ringing, answered, duration tracking, webhook delivery) and enforces integer paise deductions on the auditable ledger.
- **`ExotelProvider` & `AirtelIqProvider`:** Production adapters ready to communicate with live Indian carrier gateways once enterprise credentials (`EXOTEL_ACCOUNT_SID`, `AIRTEL_IQ_APP_ID`, etc.) and approved virtual numbers (CLIs) are injected into the environment.

---

## 4. Operational Checklist for Enabling Live Indian PSTN Calling

When transitioning NetCall from Mock Sandbox Mode to Live Telecom:

1. **Enterprise Entity Verification:**
   - Obtain Indian Company Incorporation Certificate (CIN), GSTIN, and Company PAN.
2. **Provider Onboarding:**
   - Sign service agreement with Airtel IQ or Exotel.
   - Complete Video KYC and submit authorized signatory credentials.
3. **TRAI DLT Entity Registration:**
   - Register the business entity on the telecom DLT portal (e.g., Vilpower / Airtel DLT).
   - Whitelist the Voice Calling Header and consent templates.
4. **Number Allocation (CLI):**
   - Acquire allocated virtual phone numbers (e.g., 011-XXXXXXXX or 080-XXXXXXXX) through the provider.
5. **Configure NetCall Environment:**
   - Set `TELEPHONY_PROVIDER=EXOTEL` or `TELEPHONY_PROVIDER=AIRTEL_IQ`.
   - Set `TELEPHONY_SANDBOX_MODE=false`.
   - Inject carrier credentials into `.env`:
     ```env
     EXOTEL_ACCOUNT_SID=your_actual_account_sid
     EXOTEL_API_KEY=your_actual_api_key
     EXOTEL_API_TOKEN=your_actual_api_token
     EXOTEL_SUBDOMAIN=api.exotel.com
     TELEPHONY_WEBHOOK_SECRET=your_configured_webhook_secret
     ```
6. **Deploy Production Webhook Ingress:**
   - Ensure the server endpoint `/api/telephony/webhook/:provider` is accessible via public HTTPS with a valid TLS certificate.

