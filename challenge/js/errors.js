// Kid-friendly error translation — ported from lucasgame-academy.
// Never show a raw stack trace as the headline. We translate the common
// ones, and keep the raw message visible in small print — hiding the
// truth would teach the wrong lesson.

const RULES = [
  [/unexpected end of (input|script)/i,
    'Something opened but never closed — count your { } and ( ) pairs.'],
  [/unexpected token '?\}'?/i,
    'There\'s a } without a partner { above it.'],
  [/unexpected token/i,
    'The computer got confused reading this line — look for a typo or a missing piece nearby.'],
  [/'([^']+)' is not defined|([A-Za-z_$][\w$]*) is not defined/,
    (m) => `Your bot doesn't know the word “${m[1] || m[2]}”. Check the spelling — the words you CAN use are on the function card.`],
  [/cannot read propert.* of (undefined|null)/i,
    'You tried to look inside something that\'s empty. Is the name before the dot spelled right?'],
  [/is not a function/i,
    'You used ( ) on something that isn\'t a function.'],
  [/invalid or unexpected token/i,
    'There\'s a stray character the computer can\'t read — check quotes and symbols.'],
];

export function translate(err) {
  const raw = String(err && err.message ? err.message : err);
  for (const [pattern, friendly] of RULES) {
    const m = raw.match(pattern);
    if (m) return { friendly: typeof friendly === 'function' ? friendly(m) : friendly, raw };
  }
  return { friendly: 'Something went wrong in your code — read the small print below.', raw };
}
