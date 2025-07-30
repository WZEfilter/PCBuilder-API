// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { searchProduct } from './tools.js';

dotenv.config();
const app = express();

// Enable CORS for Lovable (or any origin)
app.use(cors({ origin: '*' }));
app.use(express.json());

// ←–– Correct endpoint & model ID
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID       = 'deepseek/deepseek-chat-v3-0324:free';

async function getPartsList(budget, useCase, requirements = '') {
  const messages = [
    { role: 'system', content: 'You are an expert PC‑build assistant. You always return ONLY valid JSON.' },
    { role: 'user', content:
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
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json'
      }
    }
  );

  // Pull out the assistant's raw content
  let content = resp.data.choices?.[0]?.message?.content;
  if (!content) {
    console.error('No content in response:', resp.data);
    throw new Error('AI did not return any content');
  }

  // Strip Markdown code fences if present
  const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)```/i);
  if (fenceMatch) {
    content = fenceMatch[1];
  }

  // Trim any extra whitespace
  content = content.trim();

  // Parse and return
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse JSON:', content);
    throw new Error('Invalid JSON from AI');
  }
  return parsed.build;
}

app.post('/build', async (req, res) => {
  console.log('✅ /build called with:', req.body);
  try {
    const { budget, useCase, additionalRequirements } = req.body;
    const items = await getPartsList(budget, useCase, additionalRequirements);

    // Enrich each with an affiliate‑tagged link
    const detailed = await Promise.all(
      items.map(async ({ part, reason }) => {
        const { link } = await searchProduct(part);
        return { part, reason, link };
      })
    );

    res.json({ build: detailed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Health‑check at root
app.get('/', (req, res) => {
  res.send('AI PC Builder API is up! POST to /build with JSON.');
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Listening on http://localhost:${process.env.PORT}`);
});
