# inferrd-auth

A tiny Cloudflare Worker that swaps an **access key** for a short-lived
Google Earth Engine token, so inferrd. visitors need no Google sign-in.

The service account's private key stays in the Worker as a secret. The browser
only ever receives a ~1 hour, read-only Earth Engine token.

## One-time setup

**1. Service account** (Google Cloud console, project `inferrd-508920`)
- *IAM & Admin → Service accounts → Create service account* (e.g. `inferrd-app`).
- Give it the roles **Earth Engine Resource Viewer** and **Service Usage Consumer**.
- *Keys → Add key → Create new key → JSON*. Keep the downloaded file private.

**2. Earth Engine registration**
- Nothing extra to do: the project just needs to be registered for Earth Engine already
  (a separate service-account registration wasn't required — checked 2026-09-25 by running
  a test computation as the service account).

**3. Deploy the Worker**

```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put SA_KEY_JSON    # paste the whole JSON key file contents
npx wrangler secret put ACCESS_KEYS    # e.g. my-long-random-key,another-key
npx wrangler deploy
```

Deploy prints the Worker URL (`https://inferrd-auth.<your-subdomain>.workers.dev`).
Put that in `WORKER_URL` near the top of `../index.html`.

## Day to day

- **Give someone access:** add a key to `ACCESS_KEYS` (`wrangler secret put ACCESS_KEYS`
  again, with the full comma-separated list) and send them that key.
- **Revoke someone:** remove their key from the list.
- **Origins:** browser origins allowed to call the Worker are listed in
  `ALLOWED_ORIGINS` in `src/index.js`.

## Things to know

- Anyone holding a valid key gets an Earth Engine token for about an hour, good for
  any read-only Earth Engine computation under the project, not just inferrd.'s queries.
  Only give keys to people you trust.
- All usage counts against `inferrd-508920`'s Earth Engine quota. Check that project's
  registration (non-commercial vs commercial) covers how it is used.
- Consider a Cloudflare rate-limiting rule on the Worker route to slow key guessing.
