# Changelog

## v0.8.1 — 2026-09-18

- **Moved "Preview index on map" below the Index picker**, instead of
  above it. It always showed the first selected index's tiles, but sat
  in "2 · Areas of interest" — above the Index buttons in "3 · Analysis
  settings" — so there was no way to tell which index you were looking
  at without scrolling down first. Now it's the next thing after the
  Index field in the same section, and its hint spells out that it
  follows whichever button is selected first. Purely a reorder — no
  behaviour change.

## v0.8.0 — 2026-09-18

- **Added multi-index comparison for a single area.** The index buttons
  are now multi-select (at least one stays active) instead of an
  exclusive toggle. Drawing exactly one area and selecting 2+ indices
  now overlays them as separate coloured lines on one chart — same
  treatment as the existing multi-area comparison view (per-series
  trend/Sen's-slope/biggest-change, its own summary table, CSV export),
  just keyed by index instead of by area. Selecting multiple indices
  with multiple areas drawn falls back to the first selected index for
  the area comparison (an area×index grid of lines would get messy
  fast) — the status line says so when it happens.
- `yearStatsFeature`/`monthStatsFeature` now tag each result with `idx`
  so multi-index queries (one Earth Engine sub-query per index, same
  cost scaling as the existing monthly-detail option) can be split back
  out client-side.
- Each index now has a fixed colour (`INDEX_COLORS`) so its line means
  the same thing on every chart, rather than depending on selection
  order.
- The map preview always shows one index's tiles at a time — with
  multiple indices selected, it now shows the first and says so in the
  legend ("1 of N selected") instead of silently picking one.

## v0.7.1 — 2026-09-18

- Added a brief hover tooltip (native `title` attribute, matching the
  pattern already used for the resize handle and area-remove icon) to
  each of the four index buttons, spelling out what the code stands for
  and what it's for — EVI/NDVI/NBR/NDMI aren't self-explanatory at a
  glance.

## v0.7.0 — 2026-09-18

- **Added NBR and NDMI as selectable indices**, alongside EVI/NDVI. Both
  come from the same Sentinel-2 scene at no extra query cost — `addIndices`
  now also computes NBR (NIR vs. SWIR2, band 12 — the standard fire/clearance
  signature) and NDMI (NIR vs. SWIR1, band 11 — canopy moisture, tends to
  respond to drought stress before greenness does). The whole stats/trend
  pipeline (`yearStatsFeature`, `monthStatsFeature`, `buildYearComposite`)
  was already generic over `indexName`, so no changes were needed there —
  this was purely a matter of computing the extra bands and exposing them
  as buttons.
- The map-preview "fixed" colour scale used one shared `0.2–0.95` range for
  every index. That range assumes a healthy-canopy EVI/NDVI value and
  doesn't fit NBR/NDMI, which sit closer to zero and swing negative under
  burn/stress — replaced with `INDEX_RANGES`/`visParamsFor()`, keyed per
  index (NBR/NDMI use `-0.2–0.6`), so each index's fixed-scale legend and
  tile colours are meaningful rather than borrowing EVI's range.
- Updated the About modal and README with a short explanation of what each
  of the four indices measures and why NBR/NDMI were added.

## v0.6.2 — 2026-09-18

- Restyled the header byline to match the "by **Rutherford** *ecology*"
  treatment already used in Occurd's welcome modal — bold "Rutherford",
  light italic lowercase "ecology" — instead of one flat 45%-opacity
  string. Same burnt-orange header, no colour change.

## v0.6.1 — 2026-09-18

- **Added error bars to the multi-area comparison chart.** `renderChart`
  (single area) always drew ±1σ error bars, but `renderComparisonChart`
  never did — a gap between the two functions, not a shared bug. Each
  series now gets bars in its own colour at reduced opacity, drawn
  under the line/points so the trend stays legible with several areas
  on screen. The y-axis range now accounts for the bars' extent too,
  so they don't get clipped.
- Shrunk the comparison chart's aspect ratio (`240` → `180` logical
  height) — it's an SVG that fills its container width, so this makes
  it noticeably more compact without needing a fixed pixel size.

## v0.6.0 — 2026-09-18

- **Added a second colour-scale mode for the map preview.** "Standard
  scale" keeps the shared `0.2–0.95` range from v0.5.1, so a colour
  means the same index value on every tile — comparable across areas
  and years. The new "This area's range" mode stretches each tile to
  its own 2nd–98th percentile instead, computed via `reduceRegion` per
  area/year before requesting the tile, so subtle variation *within* one
  polygon shows up even when the whole polygon sits in a narrow band
  (e.g. all healthy canopy). Toggle lives under "Preview index on map";
  switching it re-renders any layers currently shown. Falls back to the
  standard range if an area's spread is too small to stretch (flat/no
  data), and the legend shows the actual computed min/max when exactly
  one area is on screen.

## v0.5.2 — 2026-09-18

- **Fixed the index tile layer disappearing when zoomed in close.** It
  was created without a `maxZoom`, so Leaflet applied its default cap of
  18 and stopped rendering the EE tiles past that zoom level, while the
  base aerial imagery (explicitly capped at 19) kept going — leaving the
  colour overlay blank up close but visible again once you zoomed back
  out. Raised to 20; Earth Engine's tile service renders on demand per
  request rather than from a fixed pyramid, so there's no native-res
  ceiling to respect here.

## v0.5.1 — 2026-09-18

- **Tightened the map preview colour scale.** `INDEX_VIS_PARAMS` was
  fixed at `-0.2–0.8`, but real EVI/NDVI values over vegetation rarely
  go negative and mostly cluster in the upper half of that range — so
  most tiles rendered as a wash of similar greens, with the red-yellow
  half of the ramp never touched. Narrowed to `0.2–0.95` so subtle
  differences between tiles actually show up as distinct colours.

## v0.5.0 — 2026-09-18

- **Monthly detail now works across multiple areas.** Lifted the
  single-area restriction from v0.4.0 — with 2+ areas and monthly detail
  on, the comparison view gains its own seasonal chart (one line per
  area) and each area's natural-variability baseline appears in the
  per-area summary table, computed independently rather than pooled.
  Cost scales with areas × years × 12, so it's the slowest combination
  available, but that trade-off is now available rather than blocked.
- **Fixed a real colour-collision bug.** Area colours were assigned from
  `areas.length` (the array's current size), which shrinks when an area
  is removed — draw two areas, remove the first, draw a third, and the
  new one could get handed a colour already in use by a survivor (found
  via a real comparison where both areas rendered identically blue).
  Colours are now keyed off each area's permanent id instead, which
  never gets reused or reassigned.
- Added a "this is built for vegetation, not water" caveat to the About
  modal — EVI/NDVI over water measures turbidity/sediment/chlorophyll,
  not anything the tool's dieback/drought/pest/clearance interpretation
  was built to explain, and the cloud mask deliberately keeps water
  pixels rather than excluding them.

## v0.4.2 — 2026-09-18

- Made it visible, not just a hover tooltip, when "monthly detail" is
  disabled because more than one area is drawn (v0.4.0 restricted it to
  single-area use, since it multiplies Earth Engine cost per extra area).
  Previously this only showed as a greyed-out checkbox with a title
  attribute — easy to miss, and looked exactly like "ticking it doesn't
  do anything" rather than "it's currently unavailable, here's why."

## v0.4.1 — 2026-09-18

- **Map preview of the actual EVI/NDVI composite**, not just summary
  statistics. New "Preview index on map" control (year picker + Show/Hide)
  in the areas sidebar section — renders the same composite the stats
  query reduces, as a coloured tile layer clipped to each area, with a
  legend. Independent of "Run analysis": Earth Engine's `getMapId()` just
  registers a tile-serving endpoint (tiles are then fetched on demand as
  you pan/zoom), so it's a separate, lightweight request rather than the
  reduceRegion stats query. Works for all currently-drawn areas at once
  (each clipped to its own footprint); auto-hides if the drawn areas
  change, so a stale layer is never left showing.

## v0.4.0 — 2026-09-18

- **Multiple areas, compared on one graph.** Draw as many polygons as you
  want (each gets a name — editable inline — and a colour, shown in a
  sidebar list matching Occurd's own multi-item list style). With one
  area, the full single-area view (metrics, interpretation, monthly
  detail) works exactly as before. With two or more, results switch to a
  comparison view instead: one overlaid chart with a legend, plus a
  per-area summary table (trend, Mann-Kendall p, Sen's slope, biggest
  single-year change — computed independently per area, not pooled).
  Monthly detail and the deseasonalized natural-variability baseline stay
  single-area only, since they'd multiply cost per extra area.
- The polygon edit tool (reshape) now keeps each area's stored geometry
  in sync when dragged/reshaped, not just at first draw.
- Default start year is now 2017 (matching the corrected Sentinel-2
  Level-2A data-availability floor from the previous release).

## v0.3.5 — 2026-09-18

- Monthly chart x-axis now shows a small tick for every calendar month
  in range, plus a taller, bolder tick and label at each January — the
  monthly rhythm is visible at a glance while the year stays the primary
  reference point, instead of only labelling January with no month ticks
  at all.

## v0.3.4 — 2026-09-18

- Added an OLS linear trend line (dashed) to the monthly detail chart, so
  the overall direction is visible at a glance alongside the seasonal
  wave. Noisier than the annual Sen's-slope trend by nature — it doesn't
  account for seasonality — so it's a visual cue, not a replacement for
  the main trend analysis.

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
