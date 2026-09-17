# Changelog

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
