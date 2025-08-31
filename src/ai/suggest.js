// src/ai/suggest.js

// Quick, local lists (can extend later)
const MOODS = [
  'joyful','excited','relaxed','nostalgic','adventurous','romantic',
  'anxious','tired','grateful','curious','peaceful','overwhelmed'
];

const TRAVEL_TAGS = [
  'beach','mountain','hike','museum','art','history','food','street food',
  'market','festival','road trip','train','flight','airport','hotel',
  'hostel','airbnb','budget','luxury','family','solo','friends','adventure',
  'nature','city','nightlife','sunset','sunrise','temple','church','mosque',
  'park','waterfall','lake','island','desert','snow'
];

// Basic cleanup
function cleanText(t) {
  return (t || '').replace(/\s+/g, ' ').trim();
}

function sentences(t) {
  const s = cleanText(t).split(/(?<=[.!?])\s+/).filter(Boolean);
  return s.length ? s : (cleanText(t) ? [cleanText(t)] : []);
}

function topWords(t, k = 8) {
  const stop = new Set([
    'the','and','a','an','is','it','to','of','in','on','for','with','at','as','that','this','was','were','be','by','from','or','we','i','you','they','he','she','but','so','are','my','me','our','their'
  ]);
  const freq = {};
  cleanText(t)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !stop.has(w))
    .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0,k)
    .map(([w]) => w);
}

// Guess location by simple pattern
function guessLocation(t) {
  // look for patterns like "in <Place>" or capitalized words
  const m = t.match(/\b(in|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/);
  if (m) return m[2];
  // fallback: pick first capitalized token that isn't sentence start punctuation
  const cap = t.match(/\b([A-Z][a-zA-Z]{2,})(?:\s+[A-Z][a-zA-Z]{2,})?\b/);
  return cap ? cap[0] : null;
}

export function suggestTitle(t) {
  const sents = sentences(t);
  if (!sents.length) return null;
  // use the strongest sentence fragment by keywords
  const top = topWords(t, 5);
  // try to form "<StrongWord> at/in <Location>" style
  const loc = guessLocation(t);
  if (top.length && loc) {
    return `${top[0][0].toUpperCase() + top[0].slice(1)} in ${loc}`;
  }
  // else pick a concise snippet from first sentence
  const first = sents[0].replace(/^[-–—\s]+/, '').slice(0, 60);
  return first.endsWith('.') ? first.slice(0, -1) : first;
}

export function suggestTags(t) {
  const words = new Set(topWords(t, 20));
  const matched = TRAVEL_TAGS.filter(tag => {
    const re = new RegExp(`\\b${tag.replace(/\s+/g,'\\s+')}\\b`, 'i');
    return re.test(t);
  });
  // Add top nouns-ish words as lightweight tags (heuristic)
  const extras = [...words].filter(w => w.length > 3 && !TRAVEL_TAGS.includes(w)).slice(0, 4);
  const all = [...new Set([...matched, ...extras])];
  return all.slice(0, 8);
}

export function suggestMood(t) {
  const low = t.toLowerCase();
  // direct mood keyword hit
  const hit = MOODS.find(m => low.includes(m));
  if (hit) return hit;
  // sentiment-ish heuristic
  const pos = /(amazing|beautiful|stunning|relax|peace|love|great|enjoy|fun|wow|delicious|perfect|sunny|vibrant)/i;
  const neg = /(tiring|lost|rain|cold|queue|crowd|expensive|late|delayed|worried|anxious|stress)/i;
  if (pos.test(t) && !neg.test(t)) return 'joyful';
  if (neg.test(t) && !pos.test(t)) return 'overwhelmed';
  return 'curious';
}

export function suggestOutline(t) {
  const sents = sentences(t);
  if (!sents.length) return [];
  const bullets = [];
  bullets.push(`Where/When: ${guessLocation(t) || '—'} • ${new Date().toLocaleDateString()}`);
  const kws = topWords(t, 5);
  if (kws.length) bullets.push(`Highlights: ${kws.slice(0,3).join(', ')}`);
  bullets.push(`What happened: ${sents[0]}`);
  if (sents[1]) bullets.push(`Why it mattered: ${sents[1]}`);
  bullets.push('Tip for others: ');
  return bullets.slice(0,5);
}

export function suggestHighlights(t) {
  const sents = sentences(t);
  if (!sents.length) return [];
  // take 1-2 most informative sentences by length cap
  const ranked = [...sents].sort((a,b) => b.length - a.length);
  const picks = ranked.slice(0, 2).map(s => s.slice(0, 140));
  return picks;
}

export function suggestLocation(t) {
  return guessLocation(t);
}
