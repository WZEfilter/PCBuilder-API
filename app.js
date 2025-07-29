// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { searchProduct } from './tools.js';

dotenv.config();
const app = express();

// Enable CORS for all origins (adjust if you want to restrict)
app.use(cors({ origin: '*' }));

app.use(express.json());

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID       = 'https://openrouter.ai/deepseek/deepseek-chat-v3-0324';

/**
 * Calls DeepSeek Chat V3 to get a JSON list of parts + brief reasons.
 * Returns an array of objects: { part: string, reason: string }.
 */
async function getPartsList(budget, useCase, requirements = '') {
  const messages = [
    {
      role: 'system',
      content: `You are an expert PC‑build assistant. You always return ONLY valid JSON.`
    },
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
    {
      model: MODEL_ID,
      messages,
      temperature: 0.7,    // control randomness
      max_tokens: 1000     // cap response length
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json'
      }
    }
  );

  // Defensive check
  if (!resp.data.choices || resp.data.choices.length === 0) {
    console.error('DeepSeek returned no choices:', resp.data);
    throw new Error('AI did not return any completions');
  }

  const content = resp.data.choices[0].message.content;
  return JSON.parse(content).build;
}

// POST /build endpoint
app.post('/build', async (req, res) => {
  try {
    const { budget, useCase, additionalRequirements } = req.body;

    // 1️⃣ Get parts + reasons from DeepSeek
    const items = await getPartsList(
      budget,
      useCase,
      additionalRequirements
    );

    // 2️⃣ Enrich each with your affiliate‑tagged Amazon link
    const detailed = await Promise.all(
      items.map(async ({ part, reason }) => {
        const { link } = await searchProduct(part);
        return { part, reason, link };
      })
    );

    // 3️⃣ Return the final build array
    res.json({ build: detailed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Health check or welcome message at the root
app.get('/', (req, res) => {
  res.send('AI PC Builder API is up! POST to /build with JSON.');
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Listening on http://localhost:${process.env.PORT}`);
});
