# Changelog

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
