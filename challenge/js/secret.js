// Secret reveals for Level 10 and Level 12.
//
// Heads up, code reader 👋 — yes, the secret is in here. It's NOT stored as
// plain text: it's XOR-scrambled and base64'd, and only un-scrambled the
// instant you actually beat the level. So you can't just read it here.
//
// Could a clever coder un-scramble it anyway? ...Yes. And honestly, if you're
// good enough to do that, come tell Mr. Yancy HOW you did it — that's its own
// kind of win. But the easy path is just to beat the boss. 😄

function unscramble(b64, key) {
  const bin = atob(b64);
  let out = '';
  for (let i = 0; i < bin.length; i++) {
    out += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

// Milestone rewards. Each blob is one scrambled "verse|reference" string.
// L4/L6/L8 are early walls (single-key scramble); L10/L12 are the hard gates
// (L12 split into two halves with separate keys). NB: L11 (Achilles) gives no
// verse — it's the level you beat with an exploit, so the scripture reward is
// earned only by clearing the patched Apex (L12).
const L4_BLOB = 'MQkNAAAAAAAADVUdCA0QGwcdDwBIWwYfA1MwHU8ACFkUEQkNEhIADgcDFhQXAw0dGwZPDAINUBofThwBAA4JAkkYUwpCAVQGBwtHYVsBCA0KGwcdTiBCUFMbRB8YUg0LR1pdBwQNChsHTxkPSEYWGkgBVAsAG0dKW10QZxwHGhoPRxwOSg==';
const L6_BLOB = 'OkxOEhpSAQFHFQRBFgcERABUBg0cCAEPRRYbBUBTAxoKTgAdHkhFUwFIUwcGFwsJExxFGA88RRoYGxUeDhUGXhZHVhxA';
const L8_BLOB = 'Jx5YBwZVGhoNTBsJDTgdBxdUWlEHBA0VHhlTDUJNAUxFERMHB1gNWR0IDRAdVR0bWRgXCV0RHBFTG0MYCgNYBlIaBBoNTR0ISAYBARIaSVEdCwMIIgccAkhKER8NR0hA';
const PROVERBS_BLOB = 'GB0GQRVIMhxBBAMNOAkHDX5fQFJsHBBBB0U2TgMOAkQiDwtDVRBdUGwCChIXQj5CQQoLSWwKDEJFXFdSKxBDDhUNJwYESy1CIBhCYlxVEl8/VRYPF0ghHRUKC0klDwUDTmBAWToQEQMADWpUUFs=';
const PSALMS_A_BLOB = 'PwYHAVRaBxMIRkQLFxBGBRMeBA0ODh5GQAEXFwMMBl9U';
const PSALMS_B_BLOB = 'EkUPBgkMWUgOAkZAFBMKEhELQRI0XgkNARUNXAJDSVRTWg==';

// Returns { verse, ref } — the verse text and its reference, unscrambled now.
export function revealSecret(level) {
  let raw = '';
  if      (level === 4)  raw = unscramble(L4_BLOB, 'sl-strong-4');
  else if (level === 6)  raw = unscramble(L6_BLOB, 'sl-strength-6');
  else if (level === 8)  raw = unscramble(L8_BLOB, 'sl-trust-8');
  else if (level === 10) raw = unscramble(PROVERBS_BLOB, 'Lucas-Snake-Lab-2026');
  else if (level === 12) raw = unscramble(PSALMS_A_BLOB, 'first-half-x7q') + unscramble(PSALMS_B_BLOB, 'second-half-m3z');
  else return null;
  const [verse, ref] = raw.split('|');
  return { verse, ref };
}
