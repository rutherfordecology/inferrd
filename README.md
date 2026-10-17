# inferrd.

Vegetation-index monitoring for any area, anywhere — draw a boundary, pull its
Sentinel-2 EVI/NDVI history, and get a statistically defensible read on
whether it's changing over time.

A single self-contained static page (`index.html`) — no build step, no
framework. It talks to Google Earth Engine from your browser using a
short-lived token from a tiny key-checking Worker.

Port of an earlier `inferrd.py` notebook script (Python + geemap), rebuilt as
a web app so it doesn't need Jupyter/Colab to run.

## One-time setup

inferrd. signs in with an **access key**, not a Google account. A small
Cloudflare Worker (`worker/`) checks the key and returns a short-lived,
read-only Earth Engine token minted from a service account, so visitors never
see a Google sign-in. Follow [`worker/README.md`](worker/README.md) to create
the service account, register it for Earth Engine, and deploy the Worker, then
set the two constants near the top of the `<script>` block in `index.html`:

```js
const WORKER_URL = 'https://inferrd-auth.<your-subdomain>.workers.dev';
const EE_PROJECT = 'your-ee-cloud-project-id';
```

Neither value is secret. The service-account key and the access keys live only
as Worker secrets.

## Running it locally

No build step — just serve the folder and open it:

```bash
python -m http.server 7899
```

then open `http://localhost:7899`. (In the Occurd repo's `.claude/launch.json`
there's an `inferrd` preview entry that does this automatically.)

## How it works

1. Draw your area of interest on the map (polygon or rectangle tool)
2. In section 3, pick what you want to see: **Trend over years** (the
   graphs and trend tests described here) or **Change between two dates**
   (a map of where vegetation increased or decreased, described below).
   Section 4 then shows only that mode's settings and its own button
3. For a trend, choose a start/end year, an optional season window (month range, repeats
   every year — see below), a max scene cloud-cover threshold, and an index
   (EVI, NDVI, NBR or NDMI)
4. For each year, inferrd. builds a cloud-masked median composite from
   Sentinel-2 Level-2A surface reflectance (`COPERNICUS/S2_SR_HARMONIZED`) —
   atmospherically corrected via Sen2Cor, not raw top-of-atmosphere imagery,
   to avoid false "change" from atmospheric differences between dates.
   Cloud and cloud shadow are masked with Google's Cloud Score+
   (`GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED`, `cs_cdf` ≥ 0.6; Pasquarella
   et al. 2023), linked to each scene; the Scene Classification Layer still
   drops no-data, saturated/defective and snow pixels. (The SCL alone misses
   much thin cloud and shadow in published comparisons.)
5. The per-year mean is run through: OLS linear slope (reference only),
   a Mann-Kendall trend test (non-parametric — doesn't assume normality,
   the standard choice for short/noisy environmental time series) with its
   variance widened for serial correlation after Hamed & Rao (1998), and
   Sen's slope estimator (median of all pairwise slopes, divided by the
   years between them so a missing year doesn't distort it)
6. Results include a plain-English interpretation flagging statistical
   significance (a non-significant result is reported as "not shown either
   way", never as "stable" — with ~8 yearly values the test has little
   power), low-data-quality years (judged by clear looks per pixel, see
   below), years before 2019 (Level-2A was only produced worldwide from
   December 2018), and a caveat that a vegetation
   index decline alone can't distinguish dieback from drought, pests, or
   clearance

### Change between two dates

With **Change between two dates** chosen in section 3, inferrd. maps the
pixels that changed between a "before" and an "after"
date, for checking a specific event such as reported clearance. Each date
becomes a cloud-masked median of every clear image within a window around it
(±15–60 days), and the two are subtracted pixel by pixel (NBR by default —
the most responsive to bare ground). With "allow for area-wide change" on,
each pixel's change is measured against the area's median change, so a
season or drought that shifts every pixel together cancels out. A pixel is
flagged when it differs from that by more than *k* × the area's robust spread
(1.4826 × the median absolute deviation, which the outliers themselves can't
inflate); *k* is the sensitivity slider. Changes under 0.05 are never
flagged. Each area gets its own baseline, so draw it wider than the
suspected clearance — if most of the area changed, that change becomes the
"typical" one. Flagged pixels are shaded slight / moderate / strong by
the size of the change (0.05–0.15, 0.15–0.3, over 0.3 index units — rough
defaults, not calibrated thresholds, and not burn severity: on Key & Benson's
2006 dNBR scale a 0.27–0.44 drop is only "moderate-low"). Grey marks pixels with no clear view
(cloud or shadow on every pass in a window) and light grey marks pixels
backed by only one clear image. The sidebar reports hectares per shade, the
unassessable area, how much flagged loss rests on a single image, and the
number of clear images behind each date.

To date a flagged change, click a patch on the change map. inferrd. traces
the flagged patch under the click (the same rule as the map, pixels joined
eight-connected; a 10 m circle round the point if nothing is flagged
there), then takes every Sentinel-2 image of roughly the last two years in
which the whole patch is clear (passes the cloud mask above) and
compares the patch mean with the median of a ring of surroundings 30–150 m
out. The results pane plots patch, surroundings and patch minus
surroundings, and reports "changed between X and Y": the last clear image
before the difference moves beyond the map's flag threshold and stays
there for at least two images in a row, and the first one after. A dip
that recovers on the very next image is called out as likely cloud shadow
or haze rather than change. The per-image series exports as CSV.

### Reference layers (shared with occurd.)

**Projects ▾ → Layers** unlocks occurd.'s reference layers with the Layers
password (or your own LRIS API key): LCDB v6 land cover, potential
vegetation, the Vegetative Cover Map, the Threatened Environment
Classification, PAN-NZ protected areas, QEII covenants and Gisborne District
Council plan layers. Its panel can check every drawn area against every layer
and download a CSV.

inferrd. doesn't keep its own copy: it loads `layers.js` and
`layers-register.json` from `https://occurd.rutherfordecology.co.nz/` at
start-up, so adding a layer to occurd.'s register adds it here as well. It
hands its drawn areas to the module through `window.LAYERS_HOST`. To try
occurd. beta or a local occurd. checkout, open inferrd. with
`?occurd=https://occurd.rutherfordecology.co.nz/beta/` or
`?occurd=http://localhost:<port>/` (only those addresses are accepted; a
local server must send CORS headers).

### Measuring distances and areas

The two buttons under the drawing tools measure a distance or an area on
the map without adding an analysis area. Click a measurement to remove it.
The tool (`measure.js`) is shared with occurd. and loaded from its site,
like the reference layers.

### Data volume and timing

Every request is a summary-statistics query — mean/std/image-count per year,
computed server-side by Earth Engine's `reduceRegion` — not a bulk pixel or
scene download. That keeps it a small, synchronous request rather than an
async job: expect seconds to roughly a minute depending on area size, year
count and cloud threshold, not something you'd need to leave running and
come back to.

### Sentinel-2 revisit rate and seasonality

Sentinel-2's two satellites together revisit most places roughly every 5
days, but how many of those passes are usably cloud-free varies by season —
the per-year `n_clear` ("Clear looks": how many clear views the typical
pixel of your area got) is the real signal for how much data actually went
into a given year. `n_images` ("Scenes") counts scenes that passed the
whole-tile cloud filter, which can be cloudy over your area. Requesting a full calendar
year (the default) mixes every season together, which can make two years
look different just because their cloud-free scenes happened to cluster in
different seasons. Narrowing the season window to the same months every
year (e.g. peak growing season) keeps years genuinely comparable.

### Why EVI by default, not NDVI

EVI resists saturation better than NDVI in dense, closed-canopy vegetation —
the technical pick for that case. NDVI stays available as a toggle since it
remains the more common reference point in general time-series work, and
costs nothing extra to compute alongside EVI.

### NBR and NDMI

Both are computed from the same Sentinel-2 scene, at no extra query cost —
they just read different bands than EVI/NDVI. NBR (NIR vs. shortwave-infrared
band 12) is the standard index for fire/clearance detection: it's driven by
bare ground and char rather than leaf greenness, so it can separate "this
area burned" from "this area just looks a bit less green." NDMI (NIR vs.
shortwave-infrared band 11) tracks canopy moisture content, and tends to
respond to drought or water stress before greenness-based indices do. All
four indices move the same direction (higher = healthier/wetter), so the
trend analysis works identically regardless of which one is selected.

## Limitations

- **Sign-in is still being debugged.** The OAuth popup flow hasn't
  completed successfully yet in real-world testing — see CHANGELOG for
  the current diagnosis. Once it works, your first real analysis run is
  still the actual correctness test for the Earth Engine calls themselves.
- Vegetation index alone can't tell you *why* a change happened — dieback,
  drought stress, pest/weed incursion, and clearance can all look similar
  from space. Use this to flag where to send someone to look, not as a
  substitute for ground-truthing.
- The Level-2A surface reflectance data this tool queries only goes back
  to 28 March 2017, and ESA only produced it worldwide from December 2018:
  outside Europe, 2017 and most of 2018 are missing or thin. The selectors
  still offer 2017 but default to 2019, and results flag earlier years.
- **The condition-check spot rules have not been validated.** The
  canopy-decline thresholds were tuned on two dieback patches at
  Riverside Road. Nobody has yet checked a random sample of mapped and
  unmapped pixels against field visits or aerial photos (the standard
  set out in Olofsson et al. 2014, *Remote Sensing of Environment*
  148:42–57), so the spots' error rates are unknown. Until that is done,
  a spot is a place to look, not a finding.
- The canopy-decline test tries every split year and keeps the biggest
  drop, which makes chance drops likelier to pass than its spread
  multiplier suggests. It is left as tuned because changing it without
  validation data would only swap one unchecked rule for another.
- The per-pixel canopy trend uses a false discovery rate correction, but
  not the serial-correlation correction the whole-area trend gets
  (that would need per-pixel autocorrelation, which Earth Engine can't
  estimate cheaply from ~8 yearly values anyway).
- Every visitor needs their own free, Earth-Engine-registered Google
  account — there's no way around this without adding a backend that holds
  service-account credentials (a deliberate trade-off to keep this a plain
  static site; see project notes if that changes later).

## Licence

Code: [PolyForm Strict 1.0.0](LICENSE) — free to use for non-commercial purposes; redistributing or modifying it is not permitted. Written content and original images: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). Third-party data and media keep their own licences. For commercial use, contact Rutherford Ecology.
