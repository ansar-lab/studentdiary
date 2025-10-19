StudyNest server example
========================

This small example shows how to add WebAuthn (registration + assertion) endpoints and an AI suggestions endpoint.

Important: This is a demo. Do NOT use this as-is in production. Use persistent storage, HTTPS, and secure key management.

Setup
-----

1. Copy `.env.example` to `.env` and set `ORIGIN` to your frontend origin (e.g., http://localhost:8080) and `GEMINI_API_KEY` to your API key.

2. Install dependencies and start:

```powershell
cd server
npm install
npm start
```

Endpoints
---------
- POST /api/webauthn/attestation-options { userId }
- POST /api/webauthn/verify-attestation { userId, attResp }
- POST /api/webauthn/assertion-options { userId }
- POST /api/webauthn/verify-assertion { sessionId, credential }
- POST /api/ai/suggestions { studentId, sessionId, subject }

Remember
--------
- This uses an in-memory store for credentials — restart clears registrations.
- The AI endpoint is a placeholder; swap the fetch URL for your actual Gemini/Vertex API and adapt the request/response shape accordingly.
