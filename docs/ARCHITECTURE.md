# NetCall Architecture & Technical Specification

**System Name:** NetCall Real-Time Internet & Telecom Voice Platform  
**Target Environment:** Node.js, React, WebRTC, MongoDB, Socket.IO  
**Classification:** Production-Oriented Monorepo Architecture  

---

## 1. High-Level Architecture Overview

NetCall is built around an event-driven, decoupled client-server architecture. The system separates peer-to-peer real-time media flows from transactional business logic and telecom gateways.

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Application (apps/web)"]
        UI["React 18 Mobile-First UI"]
        AudioEngine["WebRTC Audio Engine (RTCPeerConnection)"]
        SigClient["Socket.IO Signaling Client"]
        APIClient["Axios/Fetch REST Client (JWT Auth)"]
    end

    subgraph EdgeLayer ["Edge & Ingress (Nginx / Cloudflare)"]
        Ingress["Reverse Proxy / SSL / Rate Limiting"]
    end

    subgraph BackendLayer ["Application Server (apps/api)"]
        AuthService["Auth & Session Service (JWT/Bcrypt)"]
        SignalingServer["Socket.IO Signaling Hub (Rooms & Auth)"]
        CallService["Call Session & Billing Coordinator"]
        WalletService["Wallet & Auditable Ledger (Paise)"]
        AdminService["Admin Analytics & User Mgmt"]
        TelecomBridge["Telephony Adapter Layer (Provider Interface)"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        MongoDB[("MongoDB Primary Replica Set")]
    end

    subgraph NATTraversal ["NAT / ICE Traversal"]
        STUN["Public STUN Servers (Google/Coturn)"]
        TURN["Configurable TURN Relay Servers"]
    end

    subgraph TelecomGateways ["External Telecom Gateways (PSTN/PLMN)"]
        MockProvider["Mock Telephony Sandbox (Default)"]
        IndiaGateways["DoT Compliant Indian Gateways (Airtel IQ / Exotel / Tata / Twilio)"]
    end

    UI --> AudioEngine
    UI --> SigClient
    UI --> APIClient

    SigClient <-->|WSS Signaling| Ingress
    APIClient <-->|HTTPS REST| Ingress

    Ingress <--> SignalingServer
    Ingress <--> AuthService
    Ingress <--> CallService
    Ingress <--> WalletService
    Ingress <--> AdminService
    Ingress <--> TelecomBridge

    AudioEngine <-->|STUN/TURN Binding| STUN
    AudioEngine <-->|Relayed Media| TURN
    AudioEngine <===>|Direct P2P SRTP Media| AudioEngine

    AuthService --> MongoDB
    CallService --> MongoDB
    WalletService --> MongoDB
    AdminService --> MongoDB

    TelecomBridge --> MockProvider
    TelecomBridge -.->|Production with DoT License| IndiaGateways
```

---

## 2. WebRTC Peer-to-Peer Voice Calling Architecture

### 2.1 Media Flow vs Signaling Flow
- **Signaling Flow (Over WebSocket/Socket.IO):** Carries session control messages (`call:initiate`, `call:offer`, `call:answer`, `call:ice-candidate`, `call:hangup`). Every message is authenticated via JWT and validated against the room membership.
- **Media Flow (Over SRTP/UDP):** Encrypted voice audio using the OPUS codec directly between peers (or relayed via TURN when symmetric NATs prevent direct hole punching). The signaling server **never** proxies or intercepts raw audio, ensuring zero audio latency and complete privacy.

### 2.2 Signaling Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Caller (User A)
    participant Server as Signaling Hub (Socket.IO)
    participant Callee as Callee (User B)

    Note over Caller, Callee: Both authenticated with JWT on Socket.IO
    Caller->>Server: call:initiate { targetUserId, callType: 'internet' }
    Server->>Server: Validate caller balance, check if Callee is online & available
    alt Callee is Busy or Offline
        Server-->>Caller: call:unavailable { reason: 'offline' | 'busy' }
    else Callee is Online
        Server->>Callee: call:incoming { callId, caller: { id, name, username } }
        Server-->>Caller: call:ringing { callId }
    end

    alt Callee Rejects
        Callee->>Server: call:reject { callId }
        Server-->>Caller: call:rejected { callId }
    else Callee Accepts
        Callee->>Server: call:accept { callId }
        Server-->>Caller: call:accepted { callId }
        
        Note over Caller: Acquire Microphone (getUserMedia)<br/>Create RTCPeerConnection<br/>Create SDP Offer
        Caller->>Server: call:offer { callId, sdp }
        Server->>Callee: call:offer { callId, sdp }

        Note over Callee: Acquire Microphone<br/>Create RTCPeerConnection<br/>Set Remote Description<br/>Create SDP Answer
        Callee->>Server: call:answer { callId, sdp }
        Server->>Caller: call:answer { callId, sdp }

        Note over Caller, Callee: ICE Candidate Trickling
        Caller->>Server: call:ice-candidate { callId, candidate }
        Server->>Callee: call:ice-candidate { callId, candidate }
        Callee->>Server: call:ice-candidate { callId, candidate }
        Server->>Caller: call:ice-candidate { callId, candidate }

        Note over Caller, Callee: Direct P2P SRTP Audio Established (Opus Codec)
        
        Caller->>Server: call:hangup { callId }
        Server->>Callee: call:hangup { callId }
        Server->>Server: Record Call Record & Reconcile Duration
    end
```

---

## 3. Internet-to-PSTN Telecom Bridge Architecture

### 3.1 The Regulatory Boundary in India
Under the Indian Telegraph Act, 1885, TRAI Recommendations, and DoT Guidelines:
1. **Unrestricted Internet-to-PSTN Calling is strictly controlled**: An entity cannot bridge voice packets originating from the unmanaged internet directly to an Indian mobile or landline without a Unified License (Access Service or Virtual Network Operator - VNO).
2. **Calling Line Identification (CLI) Spoofing is illegal**: Outbound calls terminating on Indian mobile networks must present an allocated, verified CLI from the telecom circle of origination.
3. **Mandatory KYC & Anti-Spam (DND/TCCCPR)**: Commercial promotional and transactional calls require Distributed Ledger Technology (DLT) entity registration (TRAI TCCCPR 2018).
4. **Implementation Mandate:** NetCall implements a provider-agnostic `TelephonyProvider` adapter. By default, it operates in a certified **Mock Sandbox Mode** with comprehensive logging, simulated carrier responses, and clear UI disclaimers.

```mermaid
flowchart LR
    subgraph NetCallCore ["NetCall Core System"]
        API["REST / Socket API"]
        Billing["Billing Engine"]
        Bridge["TelephonyAdapter (Provider Interface)"]
    end

    subgraph Providers ["Provider Implementations"]
        Mock["MockTelephonyProvider (Default Sandbox)"]
        Airtel["Airtel IQ Provider Adapter (Stub)"]
        Tata["Tata Tele Services Adapter (Stub)"]
        Exotel["Exotel Cloud PBX Adapter (Stub)"]
        Twilio["Twilio India SIP Adapter (Stub)"]
    end

    API --> Bridge
    Bridge -->|Config: MOCK| Mock
    Bridge -.->|Config: AIRTEL_IQ| Airtel
    Bridge -.->|Config: TATA_TELE| Tata
    Bridge -.->|Config: EXOTEL| Exotel
    Bridge -.->|Config: TWILIO| Twilio
    
    Mock -->|Simulate Ringing / Duration / Webhooks| Billing
```

---

## 4. Wallet, Pricing & Financial Ledger Architecture

1. **Integer Arithmetic (Paise):** To prevent floating-point rounding errors, all financial values (balances, call rates, debit/credit transactions) are strictly stored and computed in integer **paise** ($1\text{ INR} = 100\text{ paise}$).
2. **Double-Entry Style Ledger:** Every wallet mutation produces an immutable `TransactionLedger` record with:
   - `transactionId` (UUID v4)
   - `userId`
   - `type` (`CREDIT_TOPUP`, `DEBIT_CALL`, `REFUND`, `PROMOTIONAL_GRANT`)
   - `amountPaise`
   - `balanceBeforePaise`
   - `balanceAfterPaise`
   - `referenceId` (Call ID or Payment ID)
   - `status` (`COMPLETED`, `PENDING`, `FAILED`)
3. **Zero Phantom Billing Guarantee:**
   - WebRTC Internet calls: 0 paise (unlimited free voice calling).
   - PSTN calls: Billed strictly on confirmed call duration received from the provider's billable call status callback. No upfront deduction without session verification.

---

## 5. Database Schema & Data Models

```mermaid
erDiagram
    USER ||--o{ CALL_RECORD : initiates
    USER ||--o{ CALL_RECORD : receives
    USER ||--|| WALLET : owns
    WALLET ||--o{ TRANSACTION_LEDGER : records
    CALL_RECORD ||--o| TELECOM_LOG : logs

    USER {
        ObjectId _id PK
        string email UK
        string username UK
        string fullName
        string passwordHash
        string role "user | admin"
        string status "active | suspended"
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        int balancePaise "Current balance in paise"
        string currency "INR"
        boolean isDemo
        datetime updatedAt
    }

    TRANSACTION_LEDGER {
        ObjectId _id PK
        string transactionId UK
        ObjectId walletId FK
        ObjectId userId FK
        string type "CREDIT_TOPUP | DEBIT_CALL | REFUND"
        int amountPaise
        int balanceBeforePaise
        int balanceAfterPaise
        string referenceId
        string description
        string status "COMPLETED | REVERSED"
        datetime createdAt
    }

    CALL_RECORD {
        ObjectId _id PK
        string callId UK
        ObjectId callerId FK
        ObjectId receiverId FK
        string destinationNumber "Optional PSTN number"
        string callType "INTERNET_WEBRTC | TELECOM_PSTN"
        string status "INITIATED | RINGING | ANSWERED | REJECTED | BUSY | MISSED | COMPLETED | FAILED"
        datetime startedAt
        datetime answeredAt
        datetime endedAt
        int durationSeconds
        int costPaise
        string endReason
    }

    TELECOM_LOG {
        ObjectId _id PK
        string callId FK
        string providerName "MOCK | EXOTEL | AIRTEL_IQ | TWILIO"
        string providerCallSid
        json requestPayload
        json webhookEvents
        string rawStatus
        datetime createdAt
    }
```

---

## 6. Monorepo Structure

```
project-money/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript Backend
│   │   ├── src/
│   │   │   ├── config/          # Environment variables & constants
│   │   │   ├── controllers/     # Route request handlers
│   │   │   ├── middleware/      # Auth, RateLimiting, Validation, Error
│   │   │   ├── models/          # Mongoose DB models
│   │   │   ├── routes/          # Express route definitions
│   │   │   ├── services/        # Business logic (Auth, Wallet, Call, Admin)
│   │   │   ├── signaling/       # Socket.IO WebRTC signaling server
│   │   │   ├── telephony/       # TelephonyProvider interface & adapters
│   │   │   ├── index.ts         # Server bootstrap
│   │   │   └── app.ts           # Express app setup
│   │   ├── tests/               # Vitest + Supertest integration tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                     # React + Vite + TypeScript Frontend
│       ├── src/
│       │   ├── assets/          # Sounds, icons, graphics
│       │   ├── components/      # UI components (DialPad, CallScreen, Nav, etc.)
│       │   ├── context/         # AuthContext, CallContext, ThemeContext
│       │   ├── hooks/           # useWebRTC, useSound, useSocket
│       │   ├── pages/           # Landing, Dashboard, History, Wallet, Admin, Settings
│       │   ├── services/        # API and Socket client services
│       │   ├── types/           # Frontend-specific state types
│       │   ├── App.tsx          # Router and global layout
│       │   ├── main.tsx         # Root mount
│       │   └── index.css        # Tailwind directives & dark navy theme
│       ├── tests/               # Component & Playwright E2E tests
│       ├── package.json
│       ├── tailwind.config.js
│       └── vite.config.ts
│
├── packages/
│   └── shared/                  # Shared types, Zod schemas, DTOs
│       ├── src/
│       │   ├── types/           # Call, User, Wallet, Signaling types
│       │   ├── schemas/         # Zod schemas for auth, calls, wallet
│       │   └── constants/       # Pricing, event names, status codes
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/              # Dockerfiles, docker-compose, coturn
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── turnserver.conf
│
├── docs/                        # Complete project documentation
│   ├── PROJECT_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── TELECOM_INDIA_REGULATORY.md
│   ├── SECURITY.md
│   └── API.md
│
├── .env.example                 # Safe environment template
├── .gitignore
├── package.json                 # Monorepo root package.json
└── tsconfig.base.json           # Shared TypeScript base configuration
```

---

## 7. Security & Compliance Guardrails

1. **Zero Secret Leakage:** No JWT secrets, passwords, or provider keys are committed to Git or exposed via client-facing bundles.
2. **Access & Refresh Flow:** 15-minute access tokens with HMAC SHA-256 signing; 7-day refresh tokens securely stored in MongoDB with device fingerprints and revocation tracking.
3. **CORS & CSP:** Cross-Origin Resource Sharing strictly allows designated origins; Content Security Policy restricts audio stream sources and socket connections.
4. **Signaling Authorization:** Users can only signal peers in rooms they have been actively invited to or initiated.
5. **Rate Limiting:** IP-based and user-based sliding window rate limits protect login, registration, and call initiation endpoints against brute-force attacks and denial-of-service.
