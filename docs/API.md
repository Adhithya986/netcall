# NetCall REST & Realtime Signaling API Reference

**Base URL:** `http://localhost:5000/api`  
**WebSocket URL:** `ws://localhost:5000` (Socket.IO)  
**Authentication Scheme:** `Bearer <accessToken>` Header  

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Creates a new NetCall user, generates wallet with initial ₹500 demo calling bonus, and returns JWT tokens.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "caller_one",
    "fullName": "Caller One",
    "password": "Password123!",
    "phone": "+919876543210"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "...", "email": "...", "username": "...", "role": "user" },
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
  ```

### `POST /api/auth/login`
- **Request Body:** `{ "identifier": "caller_one", "password": "Password123!" }`
- **Response (200 OK):** User details and fresh access & refresh tokens.

### `POST /api/auth/refresh`
- **Request Body:** `{ "refreshToken": "eyJhbGci..." }`
- **Response (200 OK):** Rotated token pair.

### `GET /api/auth/me`
Returns profile details of the authenticated caller.

---

## 2. Calling Endpoints (`/api/calls`)

### `POST /api/calls/initiate`
Initiates a WebRTC internet call or a Telecom PSTN bridge call.
- **Request Body (WebRTC):**
  ```json
  {
    "callType": "INTERNET_WEBRTC",
    "targetUserId": "65b82...",
    "targetUsername": "caller_two"
  }
  ```
- **Request Body (Telecom PSTN):**
  ```json
  {
    "callType": "TELECOM_PSTN",
    "destinationNumber": "+919876543210"
  }
  ```
- **Response (201 Created):** Call record with allocated `callId` and status `INITIATED`.

### `POST /api/calls/:callId/end`
Concludes a call session, computes duration, and triggers ledger debit if billable.
- **Request Body:** `{ "reason": "User hung up", "finalStatus": "COMPLETED" }`

### `GET /api/calls/history?page=1&limit=20`
Returns paginated call logs for the authenticated user.

---

## 3. Wallet & Pricing Endpoints (`/api/wallet`)

### `GET /api/wallet`
Returns user's current wallet balance in paise and currency code (`INR`).

### `GET /api/wallet/plans`
Returns available calling package tiers (Starter Flex, Pro Professional, Enterprise Ultra).

### `POST /api/wallet/topup`
Credits wallet in Sandbox mode.
- **Request Body:** `{ "amountPaise": 25000, "planId": "starter" }`

### `GET /api/wallet/transactions?page=1&limit=20`
Returns immutable audit trail of all credits and call debits.

---

## 4. Telephony & Webhook Endpoints (`/api/telephony`)

### `GET /api/telephony/provider`
Returns active telecom provider name, sandbox status, and DoT/TRAI regulatory disclaimers.

### `POST /api/telephony/webhook/:provider`
Carrier status callback ingress with cryptographic HMAC signature verification.

### `POST /api/telephony/sandbox/simulate-event`
Simulates carrier states (`answered`, `completed`) for testing without real cellular trunks.

---

## 5. WebRTC ICE Configuration (`/api/webrtc`)

### `GET /api/webrtc/ice-servers`
Returns configured STUN and TURN server array for WebRTC `RTCPeerConnection`.

---

## 6. Socket.IO Signaling Protocol

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `call:initiate` | Client -> Server | `{ targetUserId, callType }` | Starts call negotiation |
| `call:incoming` | Server -> Client | `{ callId, caller, callType }` | Alerts callee device |
| `call:ringing` | Server -> Client | `{ callId, targetUser }` | Informs caller peer is ringing |
| `call:accept` | Client -> Server | `{ callId }` | Callee accepts call |
| `call:accepted` | Server -> Room | `{ callId }` | Triggers WebRTC SDP offer |
| `call:offer` | Client <-> Room | `{ callId, sdp }` | Relays SDP offer to peer |
| `call:answer` | Client <-> Room | `{ callId, sdp }` | Relays SDP answer to peer |
| `call:ice-candidate`| Client <-> Room | `{ callId, candidate }` | Relays ICE candidate |
| `call:mute-toggle`| Client <-> Room | `{ callId, isMuted }` | Syncs microphone mute state |
| `call:hangup` | Client <-> Room | `{ callId, reason }` | Concludes active call |
| `call:ended` | Server -> Room | `{ callId, reason }` | Notifies peers of teardown |
