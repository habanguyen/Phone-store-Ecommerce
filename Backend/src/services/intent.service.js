const fs = require('fs');
const path = require('path');

let intents = [];

const loadIntents = () => {
  try {
    const file = fs.readFileSync(path.join(__dirname, '..', 'ai', 'intents.json'), 'utf-8');
    const parsed = JSON.parse(file);
    const hierarchy = parsed.intentHierarchy || {};
    intents = Object.entries(hierarchy).reduce((all, [group, entries]) => {
      const mapped = (entries || []).map((intent) => ({ ...intent, group }));
      return all.concat(mapped);
    }, []);
    return intents;
  } catch (err) {
    console.error('Failed to load intents:', err);
    intents = [];
    return intents;
  }
};

const normalizeText = (text) => (text || '').toLowerCase();

const calculateIntentScore = (intent, lowerText) => {
  const candidates = (intent.examples || []).map((example) => example.toLowerCase());
  if (!candidates.length) return 0;

  let score = 0;
  for (const phrase of candidates) {
    if (!phrase) continue;
    if (lowerText.includes(phrase)) {
      score += 1;
      continue;
    }
    const words = phrase.split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (word.length > 2 && lowerText.includes(word)) {
        score += 0.2;
      }
    }
  }

  return Math.min(1, score / candidates.length);
};

const detectIntent = (text) => {
  if (!text || !text.trim()) return { name: 'fallback', score: 0, group: 'system' };
  const lower = normalizeText(text);
  if (!intents.length) loadIntents();

  let best = { name: 'fallback', score: 0, group: 'system' };

  for (const intent of intents) {
    const score = calculateIntentScore(intent, lower);
    if (score > best.score) {
      best = { name: intent.name, score, group: intent.group };
    }
  }

  if (best.score === 0) {
    if (/\b(hi|hello|xin chào|chào|hey)\b/.test(lower)) {
      return { name: 'greeting', score: 0.9, group: 'system' };
    }
    if (/\b(cảm ơn|thanks|thank you)\b/.test(lower)) {
      return { name: 'thanks', score: 0.9, group: 'system' };
    }
  }

  const productQueryPattern = /\b(điện thoại|smartphone|iphone|samsung|xiaomi|oppo|vivo|realme|camera|pin|game|gaming|battery|student|quay|livestream|vlog|selfie|4k|du lịch|học online|sinh viên|văn phòng|giá|triệu)\b/i;
  if (best.score <= 0 && productQueryPattern.test(text)) {
    return { name: 'recommend_general', score: 0.35, group: 'sales' };
  }

  return best;
};

const getIntentByName = (name) => {
  if (!intents.length) loadIntents();
  return intents.find((intent) => intent.name === name) || null;
};

module.exports = { loadIntents, detectIntent, getIntentByName };
