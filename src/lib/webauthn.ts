// Client-side WebAuthn helper
// This file implements the client steps for WebAuthn (FIDO2) authentication.
// It expects server endpoints to provide assertion options and to verify the assertion:
//  - POST /api/webauthn/assertion-options  (body: { userId, sessionId }) -> returns PublicKeyCredentialRequestOptions (base64 fields)
//  - POST /api/webauthn/verify-assertion   (body: { id: sessionId, credential }) -> returns { ok: true }
// Server must convert ArrayBuffers to/from base64url and verify using the user's registered credential public key.

function base64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function coercePublicKeyCredentialRequestOptions(options: any) {
  // Convert base64url strings to Uint8Array for challenge and allowCredentials id
  const publicKey: any = { ...options };
  if (publicKey.challenge && typeof publicKey.challenge === 'string') {
    publicKey.challenge = base64ToUint8Array(publicKey.challenge);
  }
  if (publicKey.allowCredentials && Array.isArray(publicKey.allowCredentials)) {
    publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({
      ...c,
      id: typeof c.id === 'string' ? base64ToUint8Array(c.id) : c.id,
    }));
  }
  return publicKey;
}

export async function authenticateWithWebAuthn(sessionId: string, userId?: string) {
  if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Fetch assertion options from server
  const optsRes = await fetch('/api/webauthn/assertion-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId }),
  });

  if (!optsRes.ok) {
    const txt = await optsRes.text();
    throw new Error('Failed to get assertion options: ' + txt);
  }

  const options = await optsRes.json();
  const publicKey = coercePublicKeyCredentialRequestOptions(options.publicKey || options);

  // Request credential from authenticator (this triggers biometric prompt if configured)
  const cred: any = await navigator.credentials.get({ publicKey } as any);
  if (!cred) throw new Error('No credential returned');

  // Prepare data to send to server for verification
  const authData = {
    id: cred.id,
    rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
    response: {
      clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON))),
      authenticatorData: btoa(String.fromCharCode(...new Uint8Array(cred.response.authenticatorData || new Uint8Array()))),
      signature: btoa(String.fromCharCode(...new Uint8Array(cred.response.signature || new Uint8Array()))),
      userHandle: cred.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(cred.response.userHandle))) : null,
    },
    type: cred.type,
  };

  // Send assertion to server for verification
  const verifyRes = await fetch('/api/webauthn/verify-assertion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, credential: authData }),
  });

  if (!verifyRes.ok) {
    const txt = await verifyRes.text();
    throw new Error('Failed to verify assertion: ' + txt);
  }

  const verifyJson = await verifyRes.json();
  if (!verifyJson || !verifyJson.ok) throw new Error('Assertion verification failed');

  return verifyJson;
}
