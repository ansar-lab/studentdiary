const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/suggestions', async (req, res) => {
  const { studentId, sessionId, subject } = req.body;
  if (!studentId || !sessionId) return res.status(400).send('studentId and sessionId required');

  // Build a simple prompt — in production you'd gather real attendance metrics
  const prompt = `Student ${studentId} marked present for session ${sessionId} (subject: ${subject}). Provide 2 quick study suggestions and one follow-up question.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).send('AI key not configured');

    // Example: call OpenAI/Google/Vertex endpoint — here we use a hypothetical fetch
    const aiRes = await fetch('https://generativeapi.example/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt, max_tokens: 200 }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return res.status(500).send('AI request failed: ' + txt);
    }

    const body = await aiRes.json();
    // Adapt this to the actual API response shape
    const message = body?.choices?.[0]?.text || (body?.output?.[0]?.content?.[0]?.text) || 'No suggestion';
    return res.json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message || String(err));
  }
});

module.exports = { aiRouter: router };
