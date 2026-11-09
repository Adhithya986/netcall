# NetCall Security & Compliance Guide

**Author:** Senior Security & DevOps Engineer  
**Status:** Certified Production-Ready Standard  

---

## 1. Authentication & Session Security

- **Dual-Token JWT Architecture:**
  - Short-lived Access Tokens (15 minutes) signed with HMAC-SHA256 (`JWT_ACCESS_SECRET`).
  - Long-lived Refresh Tokens (7 days) signed with `JWT_REFRESH_SECRET` and stored in MongoDB with token versioning for instant revocation upon logout or breach detection.
  - Refresh token rotation: Every token refresh issues a new pair and burns the old refresh token.
- **Password Protection:**
  - One-way salted hashing using `bcryptjs` with 10 salt rounds.
  - Plaintext passwords and hashes are strictly excluded from all API response serializations (`toJSON` exclusion and model field protection).
- **Role-Based Access Control (RBAC):**
  - Granular middleware checks `requireRole('admin')` for all user management, billing ledger modifications, and platform telemetry.

---

## 2. Real-Time WebRTC Media & Signaling Protection

- **Encrypted Media Streams:**
  - WebRTC voice channels strictly utilize **SRTP (Secure Real-time Transport Protocol)** negotiated via **DTLS (Datagram Transport Layer Security)**.
  - Peer audio packets are encrypted directly between browsers; raw audio never passes through the application server unencrypted.
- **Signaling Channel Authorization:**
  - The Socket.IO signaling hub enforces JWT handshake authentication.
  - Room authorization prevents unauthorized listening: sockets can only emit or receive signaling messages for calls where they are the verified caller or invited callee.

---

## 3. Network, Rate Limiting & Denial-of-Service Defense

- **Sliding-Window Rate Limiting:**
  - General API: 300 requests per 15-minute sliding window per IP.
  - Authentication `/api/auth/*`: 25 attempts per 15 minutes per IP to eliminate brute-force attack vectors.
  - Call Initiation `/api/calls/initiate`: 15 calls per minute per user to prevent call spam.
- **Security Headers (Helmet):**
  - Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options (`nosniff`), and X-Frame-Options (`DENY`).
- **CORS Protection:**
  - Explicit origin whitelisting (`ALLOWED_ORIGINS`). Cross-origin requests with non-whitelisted origins are denied.

---

## 4. Financial & Telephony Ledger Integrity

- **Integer Arithmetic (Paise):**
  - All ledger operations use integer paise ($1\text{ INR} = 100\text{ paise}$) to prevent floating-point representation drift.
- **Immutable Transaction Ledger:**
  - Every wallet credit and call deduction generates an append-only ledger transaction with unique `TXN-` ID, balance snapshot before and after, and call reference ID.
- **Zero Phantom Deductions:**
  - Calls are only billed when billable carrier duration has been verified. Failed or uncompleted calls incur zero cost.
- **Secret Isolation:**
  - Zero hardcoded credentials or API keys in client code or Git repository. Environment variables template strictly preserved in `.env.example`.

