// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { searchProduct } from './tools.js';

dotenv.config();
const app = express();

// ─── STARTUP LOG ──────────────────────────────────────────────────────────────
console.log('🚩 Starting AI PC Builder with debug‑logging enabled');

app.use(cors({ origin: '*' }));
app.use(express.json());

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID       = 'deepseek/deepseek-chat-v3-0324:free';

// ─── DeepSeek CALL ────────────────────────────────────────────────────────────
async function getPartsList(budget, useCase, requirements = '') {
  console.log('🤖 getPartsList()', { budget, useCase, requirements });

  const messages = [
    { role: 'system', content: 'You are an expert PC‑build assistant. You always return ONLY valid JSON.' },
    {
      role: 'user',
      content:
        `User budget: $${budget}\n` +
        `Primary use‑case: ${useCase}\n` +
        (requirements ? `Additional requirements: ${requirements}\n` : '') +
        `\nPlease output JSON exactly in this format:\n` +
        `{\n` +
        `  "build": [\n` +
        `    { "part": "Component name", "reason": "Brief one‑sentence reason" },\n` +
        `    …\n` +
        `  ]\n` +
        `}`
    }
  ];

  const resp = await axios.post(
    OPENROUTER_URL,
    { model: MODEL_ID, messages, temperature: 0.7, max_tokens: 1000 },
    { headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json'
      }
    }
  );

  if (!resp.data.choices?.length) {
    console.error('⚠️ No choices from OpenRouter:', resp.data);
    throw new Error('AI did not return any completions');
  }

  const raw = resp.data.choices[0].message.content;
  console.log('📥 Raw AI content:', raw);

  // strip markdown fences
  const match = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
  const jsonText = (match ? match[1] : raw).trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error('❌ JSON parse error:', e.message, '\nContent was:', jsonText);
    throw new Error('Invalid JSON from AI');
  }

  console.log('📦 Parsed parts list:', parsed.build);
  return parsed.build;
}

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
app.post('/build', async (req, res) => {
  console.log('✅ /build called with:', req.body);

  try {
    const { budget, useCase, additionalRequirements } = req.body;
    const items = await getPartsList(budget, useCase, additionalRequirements);

    const detailed = await Promise.all(
      items.map(async ({ part, reason, asin }) => {
        console.log(`🔎 Calling searchProduct("${part}")`);
        const product = await searchProduct(part);
        console.log('🔍 searchProduct returned:', product);
        return { part, reason, link: product.link };
      })
    );

    console.log('🚀 /build returning payload:', detailed);
    res.json({ build: detailed });
  } catch (err) {
    console.error('❌ /build error:', err);
    res.status(500).json({ error: err.message });
  }
});

// health‑check
app.get('/', (req, res) => {
  res.send('AI PC Builder API is up! POST to /build with JSON.');
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`🚀 Listening on http://localhost:${process.env.PORT}`);
});
