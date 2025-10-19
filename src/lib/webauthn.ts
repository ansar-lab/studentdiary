// Client-side WebAuthn helper
// This file implements the client steps for WebAuthn (FIDO2) authentication.
// It expects server endpoints to provide assertion options and to verify the assertion:
//  - POST /api/webauthn/assertion-options  (body: { userId, sessionId }) -> returns PublicKeyCredentialRequestOptions (base64 fields)
//  - POST /api/webauthn/verify-assertion   (body: { id: sessionId, credential }) -> returns { ok: true }
// Server must convert ArrayBuffers to/from base64url and verify using the user's registered credential public key.

// base64url helpers
function toBase64Url(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string) {
  const padding = '=='.slice(0, (4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function coercePublicKeyCredentialRequestOptions(options: any) {
  const publicKey: any = { ...options };
  if (publicKey.challenge && typeof publicKey.challenge === 'string') {
    publicKey.challenge = new Uint8Array(fromBase64Url(publicKey.challenge));
  }
  if (publicKey.allowCredentials && Array.isArray(publicKey.allowCredentials)) {
    publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({
      ...c,
      id: typeof c.id === 'string' ? new Uint8Array(fromBase64Url(c.id)) : c.id,
    }));
  }
  return publicKey;
}

export async function isPlatformAuthenticatorAvailable() {
  if (!('PublicKeyCredential' in window) || !PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    console.warn('Platform authenticator check failed', e);
    return false;
  }
}

export async function authenticateWithWebAuthn(sessionId: string, userId?: string) {
  if (!('credentials' in navigator) || !('PublicKeyCredential' in window)) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Optional: check platform authenticator availability
  const platformAvailable = await isPlatformAuthenticatorAvailable();
  console.debug('Platform authenticator available:', platformAvailable);

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

  // If allowCredentials is empty, inform the caller (likely no registered credential for user)
  if (!publicKey.allowCredentials || publicKey.allowCredentials.length === 0) {
    throw new Error('No registered authenticator found for this user. Please register a biometric authenticator first.');
  }

  let cred: any;
  try {
    // Request credential from authenticator (this should trigger OS-level biometric prompt)
    cred = await (navigator as any).credentials.get({ publicKey } as any);
  } catch (err: any) {
    // Surface DOMExceptions like NotAllowedError or NotSupportedError
    console.error('navigator.credentials.get failed', err);
    throw new Error(err?.message || 'Failed to get credential from authenticator');
  }

  if (!cred) throw new Error('No credential returned');

  // Prepare data to send to server for verification (use base64url)
  const authData = {
    id: cred.id,
    rawId: toBase64Url(cred.rawId),
    response: {
      clientDataJSON: toBase64Url(cred.response.clientDataJSON),
      authenticatorData: toBase64Url(cred.response.authenticatorData || new ArrayBuffer(0)),
      signature: toBase64Url(cred.response.signature || new ArrayBuffer(0)),
      userHandle: cred.response.userHandle ? toBase64Url(cred.response.userHandle) : null,
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
