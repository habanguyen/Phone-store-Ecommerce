const fs = require('fs');
const path = require('path');

let intents = [];

const loadIntents = () => {
  try {
    const file = fs.readFileSync(path.join(__dirname, '..', 'ai', 'intents.json'), 'utf-8');
    const parsed = JSON.parse(file);
    intents = parsed.intents || [];
    return intents;
  } catch (err) {
    console.error('Failed to load intents:', err);
    intents = [];
    return intents;
  }
};

// Simple keyword-based intent detector
const detectIntent = (text) => {
  if (!text || !text.trim()) return { name: 'unknown', score: 0 };
  const lower = text.toLowerCase();
  if (!intents.length) loadIntents();

  let best = { name: 'unknown', score: 0, type: null };

  for (const intent of intents) {
    let matches = 0;
    for (const ex of intent.examples || []) {
      const key = ex.toLowerCase();
      if (lower.includes(key)) matches++;
    }
    const score = matches / Math.max(1, (intent.examples || []).length);
    if (score > best.score) {
      best = { name: intent.name, score, type: intent.type };
    }
  }

  // small heuristic: if message length small and contains hello words
  if (best.score === 0) {
    const short = lower.split(/\s+/).length <= 3;
    if (/^(hi|hello|xin chào|chào|hey)/i.test(lower) && short) {
      best = { name: 'greeting', score: 0.8, type: 'faq' };
    }
  }

  return best;
};

module.exports = { loadIntents, detectIntent };
