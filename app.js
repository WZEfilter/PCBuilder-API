// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { searchProduct } from './tools.js';

dotenv.config();
const app = express();

// ─── ENABLE CORS ──────────────────────────────────────────────────────────────
// Allow any origin (you can replace '*' with your Lovable URL if you want to lock it down)
app.use(cors({ origin: '*' }));

app.use(express.json());

const OPENROUTER_URL = 'https://api.openrouter.ai/v1/chat/completions';
const MODEL_ID       = 'deepseek-chat-v3-0324:free';

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
    { model: MODEL_ID, messages },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json'
      }
    }
  );

  // Parse the assistant’s JSON reply
  const content = resp.data.choices[0].message.content;
  return JSON.parse(content).build;
}

// HTTP endpoint
app.post('/build', async (req, res) => {
  try {
    const { budget, useCase, additionalRequirements } = req.body;

    // 1️⃣ Get parts + reasons from DeepSeek
    const items = await getPartsList(budget, useCase, additionalRequirements);

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

app.listen(process.env.PORT, () => {
  console.log(`🚀 Listening on http://localhost:${process.env.PORT}`);
});
