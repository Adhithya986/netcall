# NETCALL — Real-Time Internet Calling & Indian Telecom Bridge Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](https://github.com)
[![Tests](https://img.shields.io/badge/Tests-19%2F19%20Passing-emerald.svg)](https://github.com)
[![WebRTC](https://img.shields.io/badge/Voice-WebRTC%20Opus%2048kHz-blue.svg)](https://webrtc.org)
[![Indian Telecom](https://img.shields.io/badge/Telephony-Indian%20PSTN%20Bridge%20(DoT%20Compliant)-orange.svg)](https://dot.gov.in)

> **NetCall** is a production-grade, mobile-first calling platform designed to provide high-definition browser-to-browser voice calling over WebRTC, accompanied by an Indian Telecom (PSTN/PLMN) bridge layer designed for outbound termination to cellular SIM cards.

---

## 🌟 Key Architecture & Technical Vision

NetCall solves communication across two distinct technical tiers:

### 1. Tier 1: Internet-to-Internet Calling (WebRTC Audio)
- **Direct Peer-to-Peer:** Encrypted audio streaming directly between devices using WebRTC `RTCPeerConnection` and the Opus codec at 48 kHz.
- **Real-Time Signaling:** Authenticated Socket.IO signaling layer managing rooms, session offers, answers, and ICE candidates (STUN/TURN).
- **Free & Unlimited:** Unmetered voice calling over Wi-Fi or mobile cellular data.

### 2. Tier 2: Internet-to-PSTN Telecom Bridge (Indian Mobile Networks)
- **Problem Statement:** In India, an ordinary smartphone user without an active data pack or internet connection cannot receive WebRTC packets. They can only answer incoming calls terminating on the cellular network (GSM/VoLTE/5G) via their SIM card.
- **Regulatory Truth:** Under the **Indian Telegraph Act, 1885** and **Department of Telecommunications (DoT) / TRAI Regulations**, VoIP-to-PSTN interconnect is strictly prohibited unless routed through an entity with a Unified License (Access Service or VNO). Calling Line Identification (CLI) spoofing is illegal.
- **Provider Adapter Architecture:** NetCall implements a modular `TelephonyProvider` interface with out-of-the-box **Certified Mock Sandbox Mode** and production adapter hooks for Indian carriers (Airtel IQ, Exotel, Tata Tele Business Services).
- **Transparency Guarantee:** The UI clearly differentiates between free Internet WebRTC calls and Telecom PSTN calls. NetCall never fakes or simulates real PSTN call connections.

---

## 🎨 Visual Design & Theme

- **Theme:** Minimalist, mobile-first dark navy (`#0B1120`, `#070C18`) and vibrant emerald (`#10B981`, `#059669`).
- **Layouts:** Responsive desktop dashboard and mobile-optimized phone viewports with native touch dial pad, bottom navigation, and calling overlays.
- **Audio Synthesizer:** Built-in Web Audio API DTMF tone generator and calling cues (zero audio asset dependencies, works offline).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20+ recommended, tested on Node v24)
- npm (v10+)
- MongoDB (Local instance, Docker, Mongo Atlas, or automatic in-memory fallback)

### 1. Installation
Clone repository and install dependencies across all monorepo workspaces:
```bash
git clone <repo-url>
cd project-money
npm install
```

### 2. Configure Environment
Copy the environment template:
```bash
cp .env.example .env
```
Default values work out of the box for local development and testing.

### 3. Build All Workspaces
```bash
npm run build
```
This builds `@netcall/shared`, `@netcall/api`, and `@netcall/web` (Vite production bundle).

### 4. Run the Application

#### Option A: Run Backend API & Frontend Client Concurrently
In two separate terminals:

**Terminal 1 (Backend API & Signaling Server):**
```bash
npm run dev:api
```
*API boots on `http://localhost:5000` with Socket.IO signaling enabled.*

**Terminal 2 (Frontend Client):**
```bash
npm run dev:web
```
*Vite web client boots on `http://localhost:5173`.*

---

## 🧪 Testing Two-Device / Multi-Tab WebRTC Calling

To verify browser-to-browser voice audio exchange locally:

1. Open **Browser Window 1** (e.g. Chrome) at `http://localhost:5173/register` and create an account:
   - Full Name: `Rohit Sharma`
   - Username: `rohit_sharma`
   - Password: `Password123!`
2. Open **Browser Window 2** (e.g. Chrome Incognito or Firefox) at `http://localhost:5173/register`:
   - Full Name: `Priya Verma`
   - Username: `priya_verma`
   - Password: `Password123!`
3. In Window 1's dial pad:
   - Select **Internet Voice (Free)**.
   - Search for `priya_verma` or click Select.
   - Click **Call @priya_verma**.
4. In Window 2:
   - The Incoming Call screen pops up with ringing audio and visual pulse.
   - Click **Accept**.
5. **Call Connected:** Both browsers establish peer-to-peer WebRTC audio via RTCPeerConnection!
   - Test **Mute/Unmute**: The peer displays "Peer has muted microphone".
   - Test **End Call**: Both sides conclude cleanly, recording exact duration and zero charges on the ledger.

---

## 💰 Wallet & Auditable Financial Ledger

- **Integer Arithmetic in Paise:** Financial balances and transactions are strictly tracked in integer **paise** ($1\text{ INR} = 100\text{ paise}$) to eliminate IEEE 754 floating-point rounding errors.
- **Double-Entry Style Ledger:** Every wallet mutation produces an immutable `TransactionLedger` record with unique transaction ID (`TXN-XXXX`), balance before, balance after, and reference call ID.
- **Zero Phantom Charges:** Internet WebRTC calls cost ₹0.00. Telecom PSTN calls are billed at ₹1.50/min only upon confirmed carrier duration reported via webhook.
- **Demo Balance:** Every new user receives ₹500.00 (50,000 paise) welcome calling balance in Sandbox Mode.

---

## 🛡️ Indian Telecom Regulatory Compliance Summary

| Requirement | NetCall Architecture | DoT / TRAI Compliance |
|---|---|---|
| **Interconnect Gateway** | Decoupled `TelephonyProvider` adapter layer | Direct IP-to-PSTN prohibited; routes exclusively through licensed carrier trunks (Airtel IQ, Exotel). |
| **Caller ID (CLI)** | Fixed virtual CLI allocation in provider payload | Arbitrary CLI spoofing blocked. |
| **Sandbox Safety** | `MockTelephonyProvider` default mode | Clearly labeled mock simulation; never fabricates fake live cellular connections. |
| **Audit Trails** | Complete `TelecomLog` collection in MongoDB | Records carrier SID, webhook payloads, timestamps, and duration for 1-year compliance. |

See [docs/TELECOM_INDIA_REGULATORY.md](file:///c:/Users/Akshaya/Downloads/project-money/docs/TELECOM_INDIA_REGULATORY.md) for full legal analysis.

---

## 🧪 Automated Test Suite Report

NetCall includes comprehensive integration and API tests powered by **Vitest** and **Supertest**:

```bash
npm run test --workspace=@netcall/api
```

### Verified Test Results:
```text
✓ tests/telephony.test.ts  (3 tests passed)
  ✓ should report active telephony provider info with compliance disclaimer
  ✓ should instantiate MockTelephonyProvider correctly in development/test
  ✓ should reject invalid carrier webhook signatures

✓ tests/wallet.test.ts     (3 tests passed)
  ✓ should initialize wallet with ₹500 demo balance upon registration
  ✓ should return default pricing plans list
  ✓ should process sandbox top-up and record an auditable ledger entry

✓ tests/call.test.ts       (4 tests passed)
  ✓ should return valid ICE STUN servers configuration
  ✓ should initiate an Internet WebRTC call between two users
  ✓ should initiate a Telecom PSTN call routed to mock carrier adapter
  ✓ should conclude call session, record duration, and write to call history

✓ tests/admin.test.ts      (3 tests passed)
  ✓ should restrict admin endpoints from unauthorized or non-admin users
  ✓ should allow admin to retrieve platform metrics without exposing secrets
  ✓ should allow admin to suspend and reactivate users

✓ tests/auth.test.ts       (6 tests passed)
  ✓ should successfully register a new user with hashed password and initial wallet bonus
  ✓ should prevent registration with duplicate email or username
  ✓ should validate registration input parameters via Zod
  ✓ should successfully authenticate user with valid credentials
  ✓ should reject login with incorrect password
  ✓ should allow fetching authenticated user profile

Test Files:  5 passed (5)
Tests:       19 passed (19)
Duration:    3.10s
```

---

## 🐳 Docker Deployment

To launch NetCall with MongoDB, API server, Web client, and Coturn STUN/TURN server:

```bash
docker compose -f infrastructure/docker-compose.yml up --build -d
```
- Web Application: `http://localhost:80`
- API Backend: `http://localhost:5000`
- Coturn STUN/TURN: `3478` (UDP/TCP)

---

## 📂 Monorepo Structure

```
project-money/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript + Socket.IO Backend
│   └── web/                     # React + Vite + TypeScript + Tailwind CSS Frontend
├── packages/
│   └── shared/                  # Shared types, Zod schemas, constants & DTOs
├── infrastructure/              # Multi-stage Dockerfiles, docker-compose, coturn & Nginx
├── docs/                        # Architecture, Project Plan, Regulatory & Security Docs
│   ├── PROJECT_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── TELECOM_INDIA_REGULATORY.md
│   ├── SECURITY.md
│   └── API.md
├── .env.example
├── package.json
└── tsconfig.base.json
```

---

## ⚖️ License & Disclaimers

NetCall is developed as a production-oriented architectural platform. Outbound termination to Indian cellular phones in live environments requires commercial contracts with DoT-licensed Indian Telecom Service Providers (TSPs) and strict adherence to TRAI TCCCPR anti-spam regulations.
