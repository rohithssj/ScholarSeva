require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function callOpenRouter(prompt, model = 'openai/gpt-3.5-turbo') {
  console.log(`[Backend Attempt] Model: ${model} | Prompt len: ${prompt.length}`);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ScholarSeva'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful scholarship advisor for students in India. Always respond in short, clear bullet points or concise lines.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250
      })
    });

    const data = await response.json();
    if (!response.ok) {
       return { error: true, data: data, status: response.status };
    }
    return { error: false, result: data.choices[0].message.content.trim() };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

// Proxy endpoint for OpenRouter AI
app.post('/api/ai', async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: true, message: 'Prompt is required' });
  }

  const primaryModel = model || 'openai/gpt-3.5-turbo';
  const fallbackModel = 'openai/gpt-3.5-turbo';

  // Primary Attempt
  let response = await callOpenRouter(prompt, primaryModel);

  // Fallback Attempt (if primary failed and wasn't already the fallback)
  if (response.error && primaryModel !== fallbackModel) {
     console.warn(`[Backend Fallback] ${primaryModel} failed. Retrying with ${fallbackModel}...`);
     response = await callOpenRouter(prompt, fallbackModel);
  }

  if (response.error) {
    console.error('[Backend Final Failure]', response.data || response.message);
    // Return 200 with result to avoid breaking frontend, but with fallback text
    return res.json({ 
        result: "AI temporarily unavailable. Please check your eligibility details manually.",
        is_fallback: true
    });
  }

  console.log('[Backend Success] Response generated.');
  res.json({ result: response.result });
});

app.listen(PORT, () => {
  console.log(`ScholarSeva AI Backend running on http://localhost:${PORT}`);
});
