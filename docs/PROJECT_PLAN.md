# NetCall Project Plan & Execution Roadmap

**Project Name:** NETCALL  
**Repository:** `project-money` (NetCall Monorepo)  
**Target:** Production-Grade Internet & Telecom Calling Platform (Mobile-First WebRTC MVP + Indian Telecom PSTN Layer Architecture)  
**Author:** Senior Full-Stack Software Architect, Security Engineer, DevOps & QA Engineer  
**Date:** November 2026  

---

## 1. Executive Summary & Vision

**NetCall** is a modern, mobile-first internet calling platform engineered with a strict two-tier communication paradigm:
1. **Tier 1 (Internet-to-Internet MVP):** High-definition voice calls over WebRTC between browser clients on Wi-Fi or cellular data, orchestrated via an authenticated, authorized Socket.IO signaling layer with STUN/TURN traversal.
2. **Tier 2 (Internet-to-PSTN Telecom Bridge):** A modular telephony provider abstraction designed to place outbound calls terminating on the Indian Public Switched Telephone Network (PSTN) / Cellular Mobile Networks (PLMN). In accordance with the Department of Telecommunications (DoT) and Telecom Regulatory Authority of India (TRAI) regulations, VoIP-to-PSTN bridging requires strict licensing (Unified License - Access Service / VNO), registered Calling Line Identification (CLI), mandatory KYC, and approved telecom partner gateways (such as Airtel IQ, Tata Tele Business Services, Exotel, Twilio India). 
3. **Transparency & Safety Mandate:** WebRTC audio alone *cannot* dial ordinary SIM numbers without an interconnect gateway. NetCall explicitly separates internet calls from telecom calls in UI and backend, operates in a certified Mock Sandbox Mode unless production telecom credentials and regulatory approvals are present, and never fabricates fake PSTN call connections.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Monorepo Structure** | npm workspaces | Zero-dependency orchestration (`apps/web`, `apps/api`, `packages/shared`) |
| **Frontend** | React 18 / Vite / TypeScript | Ultra-fast HMR, strict type safety, optimized production bundle |
| **Styling** | Tailwind CSS / Lucide React | Clean, mobile-first responsive design, dark navy (`#0B1120`) & emerald theme |
| **Backend** | Node.js (v20+) / Express / TypeScript | High throughput, asynchronous I/O, event-driven architecture |
| **Realtime Signaling** | Socket.IO | Persistent bidirectional transport, heartbeat, room authorization, reconnection |
| **Audio Engine** | WebRTC (RTCPeerConnection) | Low-latency OPUS codec audio streams, ICE gathering (STUN/TURN) |
| **Database** | MongoDB / Mongoose | Flexible document model for user auth, call logs, wallets, ledger, rate limits |
| **Validation** | Zod | End-to-end schema validation shared across frontend and backend |
| **Security** | bcryptjs, jsonwebtoken, helmet, cors, express-rate-limit | Strict JWT rotation, salted hash, CSRF/CORS barriers, rate limiting |
| **Telecom Interface** | `TelephonyProvider` abstraction | Decoupled architecture with `MockTelephonyProvider` sandbox and Indian gateway stubs |
| **Testing** | Vitest, Supertest, Playwright | Multi-tier test suite: unit, integration, API, and E2E browser testing |
| **DevOps / Infra** | Docker, Docker Compose, Coturn config | Containerized reproducibility, multi-stage production Dockerfiles |

---

## 3. Work Breakdown Structure (Phased Execution)

### Phase 1: Planning, Architecture & Monorepo Initialization (Current)
- [x] Inspect workspace and environment tooling (Node v24, npm v12).
- [x] Draft `docs/PROJECT_PLAN.md` and `docs/ARCHITECTURE.md`.
- [ ] Initialize root monorepo `package.json`, `tsconfig.base.json`, `.gitignore`, and `.env.example`.
- [ ] Initialize `packages/shared` with shared interfaces, DTOs, and Zod schemas.

### Phase 2: Core Backend, Database Models & Authentication
- [ ] Set up `apps/api` with Express, TypeScript, Mongoose, and Socket.IO.
- [ ] Implement database models: `User`, `CallRecord`, `Wallet`, `TransactionLedger`, `TelecomLog`.
- [ ] Build authentication system: JWT access tokens, refresh token rotation, bcrypt password hashing.
- [ ] Implement rate-limiting middleware, security headers (Helmet), input sanitization, and structured error handling.
- [ ] Build user profile, account settings, and contact book endpoints.

### Phase 3: WebRTC Signaling & Voice Calling Engine
- [ ] Implement Socket.IO signaling server with JWT handshake authentication.
- [ ] Build room authorization: prevent eavesdropping or uninvited signaling.
- [ ] WebRTC event flow: `call:initiate`, `call:incoming`, `call:accept`, `call:reject`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:hangup`, `call:busy`.
- [ ] Configure public STUN servers (Google/Twilio) and configurable TURN credentials.
- [ ] Frontend WebRTC hook / state machine (`useWebRTC`): local audio track acquisition, peer connection management, mute/unmute, audio stream playback, network quality, call timer.

### Phase 4: Mobile-First Frontend Application (`apps/web`)
- [ ] Initialize Vite + React + Tailwind CSS client with emerald & dark navy theme.
- [ ] Design components:
  - Landing Page with interactive preview and feature highlights.
  - Auth Modals / Pages: Registration, Login, Form validation.
  - Main Dashboard with quick dial, user status, balance badge.
  - Dial Pad with audio DTMF feedback, contact autocomplete, type selector (Internet vs Telecom PSTN).
  - Outgoing Call Screen (ringing state, destination details, cancel).
  - Incoming Call Screen (visual pulses, caller info, Accept / Decline).
  - Active Call Screen (call timer, animated audio wave visualizer, Mute mic, Speaker toggle, End Call).
  - Call History with duration, status badges, timestamps, pagination, and retry action.
  - Wallet & Pricing UI (INR paise display, plan tiers, mock checkout sandbox, transaction ledger).
  - Account Settings & Security (password change, notification preferences, KYC tier status).
  - Admin Dashboard (user count, active calls, call logs, ledger audit, telephony provider status).

### Phase 5: Call History, Wallet, Plans & Auditable Ledger
- [ ] Ledger design: strict double-entry-style accounting principles with integer paise (1 INR = 100 paise).
- [ ] Rule: Never charge unless a billable call duration is formally confirmed.
- [ ] Implement call billing calculator based on call type (Internet WebRTC is free/bundled; PSTN is billed per minute/pulse).
- [ ] Sandbox wallet top-up workflow with verifiable transaction IDs.
- [ ] Call history recording at signaling disconnect with exact millisecond duration.

### Phase 6: Telecom Adapter Architecture & Indian Regulatory Compliance
- [ ] Define `TelephonyProvider` TypeScript interface:
  - `makeOutboundCall(req: OutboundCallRequest): Promise<CallResult>`
  - `hangupCall(callId: string): Promise<boolean>`
  - `getCallStatus(callId: string): Promise<CallStatus>`
  - `verifyWebhookSignature(headers: Record<string, string>, body: any): boolean`
  - `handleStatusCallback(payload: any): Promise<CallbackResult>`
- [ ] Implement `MockTelephonyProvider` with simulated network states (ringing, answered, busy, completed, failed) clearly tagged as `[SANDBOX MOCK]`.
- [ ] Research and document Indian telecom requirements:
  - DoT OSP Regulations & VNO guidelines.
  - TRAI guidelines on VoIP interconnect and Calling Line Identification (CLI) spoofing prevention.
  - Eligibility criteria for commercial outbound calling (KYC, enterprise registration).
  - Provider specifications: Exotel, Tata Tele Business Services, Airtel IQ, Plivo, Twilio India.
- [ ] Ensure clear UI distinction: "Internet Call (Free/WebRTC)" vs "PSTN Phone Call (Mock Telecom Sandbox - Requires DoT License in Prod)".

### Phase 7: Comprehensive Testing Suite
- [ ] Unit tests for authentication, billing ledger, and Zod validators (Vitest).
- [ ] API integration tests for endpoints using Supertest.
- [ ] WebRTC signaling & room authorization tests.
- [ ] Playwright E2E browser tests: verify dial pad, login, UI states, call lifecycle.
- [ ] Verify error states: mic denied, user offline, network drop, insufficient balance.

### Phase 8: Production Readiness, Docker & Documentation
- [ ] Multi-stage `Dockerfile` for API and Web.
- [ ] `docker-compose.yml` including Mongo and app containers.
- [ ] Production environment template `.env.example` with zero secrets.
- [ ] `docs/ARCHITECTURE.md`, `docs/TELECOM_INDIA_REGULATORY.md`, `docs/SECURITY.md`, `README.md`.
- [ ] Verify production build (`npm run build`).

---

## 4. Risk Analysis & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| NAT/Firewall blocking WebRTC audio | Call connection failure | Multi-STUN fallback + TURN server configuration hooks; connection state indicators. |
| Microphone permission denied by browser | User unable to speak | Graceful permission query, explicit user guide banner with retry mechanism. |
| Illegal VoIP-PSTN bridging assumptions | Legal / Regulatory non-compliance | Explicit separation; no claims of WebRTC dialing PSTN directly; provider sandbox interface. |
| In-flight call disconnect during network drop | Incorrect call billing or phantom calls | Socket.IO ping/pong heartbeat; automatic session cleanup and ledger finalization on disconnect. |
| Race conditions on wallet deduction | Double spending / negative balance | Atomic MongoDB `$inc` with `$gte` balance checks, ledger transaction isolation. |

---

## 5. Success Criteria & Verification Checklist

- [ ] `npm run build` succeeds across all workspaces without TypeScript or bundling errors.
- [ ] Backend API boots with clean logging and healthcheck endpoint (`/api/health`).
- [ ] Frontend boots cleanly on Vite dev server and production preview.
- [ ] Full user registration, login, and profile workflow functional with JWT.
- [ ] Two distinct browser instances can connect, initiate call, signal, negotiate WebRTC, transmit audio, mute, and hang up.
- [ ] Call logs accurately recorded in MongoDB with duration and status.
- [ ] Wallet balances displayed in INR (paise) with auditable ledger.
- [ ] Telecom PSTN tab clearly warns and runs in certified Mock Sandbox Mode.
- [ ] Admin dashboard displays user list, call logs, financial metrics, and provider status.
- [ ] Vitest and Supertest automated test suites pass.

