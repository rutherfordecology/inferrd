# Changelog

## v0.3.3 — 2026-09-18

- **v0.3.1's fix for the missing-stdDev-key crash didn't actually work** —
  the same `Dictionary does not contain key` error recurred live, this
  time for EVI. `.get(key, null)` turned out not to reliably suppress the
  error (the EE JS client likely drops a literal `null` default rather
  than passing it through). Replaced with `ee.Algorithms.If(dict.contains(key),
  dict.get(key), MISSING_SENTINEL)`, which has unambiguous, well-defined
  server-side semantics instead of relying on an optional-parameter
  behavior that didn't hold up. The sentinel value is converted back to a
  real `null` client-side once results return.

## v0.3.2 — 2026-09-18

- **Added a "Y-axis starts at 0" toggle** for both the annual and monthly
  charts — off by default (auto-scaled to the data, which shows subtle
  change more clearly), on shows the change in the context of the index's
  full range. Toggling re-draws from the already-fetched data, no new
  Earth Engine call.
- **Corrected a factual error**: the app and README claimed Sentinel-2
  data goes back to "mid-2015" — true for raw Level-1C data, but this
  tool deliberately uses Level-2A surface reflectance
  (`COPERNICUS/S2_SR_HARMONIZED`), which actually only starts **28 March
  2017**. Fixed the claim everywhere it appeared, and moved the year
  selectors' floor from 2016 to 2017 (2018 is the first fully-complete
  calendar year, since 2017 is missing Jan-Mar).

## v0.3.1 — 2026-09-18

- **Fixed a real crash from live testing**: `Dictionary.get: Dictionary
  does not contain key: 'NDVI_stdDev'`. When a year or month has too few
  valid pixels to compute a standard deviation, Earth Engine omits that
  key from its result dictionary entirely rather than returning null —
  `.get()` without a fallback throws a hard server-side error that killed
  the *entire* batched request (all years/months), not just that one data
  point. Fixed with `.get(key, null)`, which the rest of the pipeline
  already handled gracefully (same as a genuinely missing year). First
  bug actually found via a real Earth Engine call — sign-in and the
  overall query pipeline are confirmed working now that this surfaced.

## v0.3.0 — 2026-09-18

- **Monthly detail (opt-in).** New checkbox fetches one composite per
  calendar month instead of one per year (~12x more sub-queries, so it's
  slower — off by default). From it: a monthly chart showing the actual
  seasonal wave, and a real, location-specific "natural variability"
  baseline — the spread of each month's deviation from its own calendar
  month's average (deseasonalized anomalies), not a generic textbook
  number. Answers "how stable is vegetation normally here" from the same
  satellite record, not an assumption.
- The "biggest single-year change" call-out now prefers this baseline
  when available (reported as "N× typical natural variability") instead
  of the cruder same-year spatial-std fallback used before.
- **Resizable, adjustable results pane.** The map/results split is now a
  draggable divider instead of a fixed 52vh — starts map-heavy (nothing
  to show in results yet) and automatically expands to reveal the report
  once an analysis actually completes. Drag it yourself anytime.

## v0.2.3 — 2026-09-18

- **Fixed a misleading "no trend" case.** Real test data showed a cyclone-
  damaged area (sharp drop, partial recovery over the next couple of
  years) reported as "no statistically significant trend" — technically
  correct (Mann-Kendall/Sen's slope only test for a *monotonic* trend, and
  a disturbance-then-recovery pattern isn't one) but the old wording
  ("effectively stable") was actively misleading for a series like that.
  Added a separate "biggest single-year change" statistic, always
  computed and shown as its own metric card; when it accounts for most of
  the series' total spread, the interpretation text now calls it out
  explicitly instead of saying "stable". Documented the same limitation
  in the About modal.
- Documented spatial resolution (10m, from the native NIR/Red/Blue bands;
  cloud masking comes from the coarser 20m Scene Classification Layer,
  resampled to align) in the About modal.

## v0.2.2 — 2026-09-18

- **Switched the Earth Engine JS library CDN.** v0.2.1's fix (using
  `authenticateViaPopup`) was correct in principle, but the library build
  Google's own docs still point to (`ajax.googleapis.com/.../0.1.365/...`)
  turned out to be stale and doesn't actually contain the Google-Identity-
  Services-based implementation — calling it threw the old `gapi.auth2`
  error `idpiframe_initialization_failed`. Switched to
  `cdn.jsdelivr.net/npm/@google/earthengine@1.7.43/build/browser.min.js`
  (the current published package), which does contain the GIS-based code.
  Confirmed in live testing: Google Identity Services now generates a
  fully correct OAuth URL (right client ID, scope, and origin) — the only
  remaining error was GIS's own "popup blocked" detection, most likely
  specific to the automated browser session used to test this rather than
  a real bug. Needs a real human click to fully confirm.

## v0.2.1 — 2026-09-18

- **Fixed the sign-in hang.** Root cause found via live debugging plus
  checking Earth Engine's actual current source: `ee.data.authenticateViaOauth`
  is built on Google's `gapi.auth2` library, which Google archived on
  18 April 2026 — it no longer reliably calls back at all, silently, which
  is exactly the "hangs forever, no popup, no password prompt" behaviour
  reported. Rewired the sign-in button to call `ee.data.authenticateViaPopup()`
  instead, which Earth Engine has already migrated to Google Identity
  Services (`google.accounts.oauth2`) under the hood — added the GIS
  script tag (`accounts.google.com/gsi/client`) the page needs for it.
  `authenticateViaOauth` is still called once on page load (fire-and-forget,
  to configure the client ID/scopes and opportunistically try a silent
  sign-in) but nothing depends on its callbacks firing anymore.

## v0.2.0 — 2026-09-18

- **No longer QEII/covenant-specific** — generalized all UI copy, the About
  modal, and README to "any area, anywhere". QEII covenants remain one use
  case (the original motivation) but aren't baked into the tool or its
  language anymore
- **Added a season window** (month range that repeats every year, e.g.
  Nov–Feb) so composites can be restricted to the same months across years
  instead of always using the full calendar year — avoids comparing a
  summer-heavy year's data against a winter-heavy one. Defaults to the full
  year (Jan–Dec), matching prior behaviour, with wrap-around support for
  windows that cross the year boundary
- Added explicit cloud-threshold guidance (20% or below recommended) and an
  explanation of Sentinel-2's ~5-day revisit rate vs. actual cloud-free
  frequency, both inline and in the About modal
- Clarified that every request is a small server-side summary-statistics
  query (mean/std/image-count), not a bulk data download — sets realistic
  timing expectations (seconds to ~a minute) instead of implying an
  async/email-delivery flow is needed
- **Sign-in debugging**: real-world testing found the "Sign in with Google"
  button could hang indefinitely with no popup, no password prompt, and no
  error — a silent failure mode. Added console logging at every stage of
  the OAuth/`ee.initialize` flow and a 15-second watchdog that re-enables
  the button with a specific, actionable message (checks for a
  browser-blocked popup) instead of hanging forever. Root cause is not yet
  confirmed — next real attempt should reveal which stage it's stuck at

## v0.1.2 — 2026-09-18

- Set `CLIENT_ID` — OAuth 2.0 Web application client created in the
  `inferrd-508920` Cloud project, authorized for `http://localhost:7899`
  and `https://rutherfordecology.github.io`. Sign-in is wired up and
  ready to test end-to-end.

## v0.1.1 — 2026-09-18

- Filled in `EE_PROJECT` with the real Earth-Engine-enabled Cloud Project
  (`inferrd-508920`). `CLIENT_ID` (OAuth) still needs to be set before
  sign-in will work — see README.md

## v0.1.0 — 2026-09-18

- Initial build: ported `inferrd.py` (Python/geemap notebook script) into a
  self-contained static web app — Leaflet + Leaflet.draw polygon tool on an
  Esri World Imagery basemap, client-side Earth Engine sign-in (no backend),
  Sentinel-2 SCL cloud masking, annual EVI/NDVI composite + trend analysis
  (OLS slope, Mann-Kendall test, Sen's slope — hand-rolled in vanilla JS)
- Switched default vegetation index to EVI (closed-canopy forest resists
  saturation better than NDVI); NDVI kept as a toggle
- Styled to match the Occurd family design system, in a dark burnt-orange
  palette
- Not yet run against live Earth Engine data — needs a registered OAuth
  Client ID and Cloud Project first (see README.md)
