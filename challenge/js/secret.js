// Secret reveals for Level 8 and Level 10.
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

// Level 8 — one scrambled blob.
const L8_BLOB = 'GB0GQRVIMhxBBAMNOAkHDX5fQFJsHBBBB0U2TgMOAkQiDwtDVRBdUGwCChIXQj5CQQoLSWwKDEJFXFdSKxBDDhUNJwYESy1CIBhCYlxVEl8/VRYPF0ghHRUKC0klDwUDTmBAWToQEQMADWpUUFs=';

// Level 10 — split into two halves, each with its own key, joined only at reveal.
const L10A_BLOB = 'PwYHAVRaBxMIRkQLFxBGBRMeBA0ODh5GQAEXFwMMBl9U';
const L10B_BLOB = 'EkUPBgkMWUgOAkZAFBMKEhELQRI0XgkNARUNXAJDSVRTWg==';

// Returns { verse, ref } — the verse text and its reference, unscrambled now.
export function revealSecret(level) {
  let raw = '';
  if (level === 8) {
    raw = unscramble(L8_BLOB, 'Lucas-Snake-Lab-2026');
  } else if (level === 10) {
    raw = unscramble(L10A_BLOB, 'first-half-x7q') + unscramble(L10B_BLOB, 'second-half-m3z');
  } else {
    return null;
  }
  const [verse, ref] = raw.split('|');
  return { verse, ref };
}
