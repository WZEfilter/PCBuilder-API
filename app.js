import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { searchProduct } from './tools.js';

dotenv.config();
const app = express();
app.use(express.json());

const OPENROUTER_URL = 'https://api.openrouter.ai/v1/chat/completions';
const MODEL_ID       = 'deepseek-chat-v3-0324:free';

// Get parts list from DeepSeek, including optional requirements
async function getPartsList(budget, useCase, requirements = '') {
  let prompt = 
    `User budget: $${budget}. Use case: "${useCase}".`;
  if (requirements) {
    prompt += ` Additional requirements: "${requirements}".`;
  }
  prompt +=
    `\nPlease respond with valid JSON:\n\n` +
    `{\n  "parts": ["Part Name A", "Part Name B", ...]\n}`;

  const payload = {
    model: MODEL_ID,
    messages: [
      { role: 'system', content: 'You are an expert PC‑build assistant.' },
      { role: 'user',   content: prompt }
    ]
  };

  const resp = await axios.post(OPENROUTER_URL, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':  'application/json'
    }
  });

  return JSON.parse(resp.data.choices[0].message.content).parts;
}

// HTTP endpoint
app.post('/build', async (req, res) => {
  try {
    const { budget, useCase, additionalRequirements } = req.body;
    const parts = await getPartsList(budget, useCase, additionalRequirements);
    const detailed = await Promise.all(parts.map(searchProduct));
    res.json({ build: detailed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Listening on http://localhost:${process.env.PORT}`);
});
