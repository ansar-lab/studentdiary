const express = require('express');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const base64url = require('base64url');

const router = express.Router();

// In-memory store for demo only
const userDB = new Map();
// userId -> { id, username, credentials: [{ id, publicKey, counter }] , currentChallenge }

function getUser(userId) {
  if (!userDB.has(userId)) userDB.set(userId, { id: userId, username: 'user-' + userId, credentials: [], currentChallenge: null });
  return userDB.get(userId);
}

router.post('/attestation-options', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send('userId required');
  const user = getUser(userId);

  const rpName = 'StudyNest';
  const options = generateRegistrationOptions({
    rpName,
    userID: user.id,
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: { userVerification: 'preferred', authenticatorAttachment: 'platform' },
  });

  user.currentChallenge = options.challenge;
  res.json(options);
});

router.post('/verify-attestation', async (req, res) => {
  const { userId, attResp } = req.body;
  if (!userId || !attResp) return res.status(400).send('userId and attResp required');
  const user = getUser(userId);
  try {
    const verification = await verifyRegistrationResponse({ response: attResp, expectedChallenge: user.currentChallenge, expectedOrigin: process.env.ORIGIN, expectedRPID: new URL(process.env.ORIGIN).hostname });
    if (verification.verified) {
      const { registrationInfo } = verification;
      user.credentials.push({ id: registrationInfo.credentialID.toString('base64url'), publicKey: registrationInfo.credentialPublicKey, counter: registrationInfo.counter });
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || String(err));
  }
});

router.post('/assertion-options', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send('userId required');
  const user = getUser(userId);
  const allowCreds = user.credentials.map(c => ({ id: c.id, type: 'public-key', transports: ['internal'] }));
  const opts = generateAuthenticationOptions({ allowCredentials: allowCreds, userVerification: 'required' });
  user.currentChallenge = opts.challenge;
  // convert allowCredentials id to base64url strings
  opts.allowCredentials = allowCreds.map(c => ({ ...c, id: c.id }));
  res.json({ publicKey: opts });
});

router.post('/verify-assertion', async (req, res) => {
  const { sessionId, credential } = req.body;
  // For demo we rely on sessionId being the userId — adapt as needed
  const userId = sessionId;
  const user = getUser(userId);
  try {
    const dbCred = user.credentials.find(c => c.id === credential.id || c.id === credential.rawId);
    if (!dbCred) return res.status(400).send('No matching credential');

    const expectedChallenge = user.currentChallenge;
    const expectedOrigin = process.env.ORIGIN;
    const expectedRPID = new URL(process.env.ORIGIN).hostname;

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      authenticator: { credentialPublicKey: dbCred.publicKey, credentialID: Buffer.from(dbCred.id, 'base64url'), counter: dbCred.counter },
    });

    if (verification.verified) {
      dbCred.counter = verification.authenticationInfo.newCounter;
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || String(err));
  }
});

module.exports = { webauthnRouter: router };
