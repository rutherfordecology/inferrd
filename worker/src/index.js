// inferrd-auth — a tiny Cloudflare Worker that swaps an access key for a
// short-lived Google Earth Engine access token.
//
// The browser app (inferrd) posts a key here. If it matches one of the keys
// in the ACCESS_KEYS secret, the Worker signs a service-account JWT, trades it
// with Google for an access token, and returns just that token (~1 hour,
// read-only Earth Engine scope). The service-account private key never leaves
// the Worker, and visitors never see a Google sign-in.
//
// Secrets (set with `wrangler secret put`, never committed):
//   SA_KEY_JSON  the service account's JSON key, pasted as-is
//   ACCESS_KEYS  comma-separated list of valid access keys, e.g. "key-for-me,key-for-anna"
//                (remove a key from the list to revoke that person)

const SCOPE = 'https://www.googleapis.com/auth/earthengine.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Browser origins allowed to call this Worker. Add new app origins here.
const ALLOWED_ORIGINS = [
  'https://rutherfordecology.github.io',
  'http://localhost:7899',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Compare without bailing out at the first differing character.
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

function keyIsValid(supplied, allowedCsv) {
  if (!supplied || !allowedCsv) return false;
  let ok = false;
  for (const k of allowedCsv.split(',').map(s => s.trim()).filter(Boolean)) {
    if (timingSafeEqual(supplied.trim(), k)) ok = true; // no early exit
  }
  return ok;
}

function b64url(bytes) {
  let s = '';
  bytes = new Uint8Array(bytes);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const b64urlStr = (str) => b64url(new TextEncoder().encode(str));

async function signJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64urlStr(JSON.stringify({
    iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(header + '.' + claims));
  return header + '.' + claims + '.' + b64url(sig);
}

// One token is shared by every request while it's fresh, so Google is asked
// for a new one about once an hour however many people use the app.
let cached = null; // { token, expiresAt (ms) }

async function getAccessToken(env) {
  if (cached && cached.expiresAt - Date.now() > 5 * 60 * 1000) return cached;
  const sa = JSON.parse(env.SA_KEY_JSON);
  const jwt = await signJwt(sa);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  if (!res.ok) throw new Error('Google token exchange failed: HTTP ' + res.status);
  const data = await res.json();
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request.headers.get('Origin') || '');

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Bad request' }, 400, cors); }

    if (!keyIsValid(body && body.key, env.ACCESS_KEYS)) {
      return json({ error: 'Wrong key' }, 401, cors);
    }

    try {
      const t = await getAccessToken(env);
      return json({
        access_token: t.token,
        token_type: 'Bearer',
        expires_in: Math.max(60, Math.floor((t.expiresAt - Date.now()) / 1000)),
      }, 200, cors);
    } catch (e) {
      console.error(e);
      return json({ error: 'Could not get an Earth Engine token' }, 502, cors);
    }
  },
};
