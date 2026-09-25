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
2. Choose a start/end year, an optional season window (month range, repeats
   every year — see below), a max scene cloud-cover threshold, and an index
   (EVI, NDVI, NBR or NDMI)
3. For each year, inferrd. builds a cloud-masked median composite from
   Sentinel-2 Level-2A surface reflectance (`COPERNICUS/S2_SR_HARMONIZED`) —
   atmospherically corrected via Sen2Cor, not raw top-of-atmosphere imagery,
   to avoid false "change" from atmospheric differences between dates.
   Cloud/shadow/cirrus/defective pixels are dropped using the Scene
   Classification Layer (SCL) band
4. The per-year mean is run through: OLS linear slope (reference only),
   a Mann-Kendall trend test (non-parametric — doesn't assume normality,
   the standard choice for short/noisy environmental time series), and
   Sen's slope estimator (median of all pairwise slopes — robust to
   outliers)
5. Results include a plain-English interpretation flagging statistical
   significance, low-data-quality years, and a caveat that a vegetation
   index decline alone can't distinguish dieback from drought, pests, or
   clearance

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
the per-year `n_images` count in the results table is the real signal for
how much data actually went into a given year. Requesting a full calendar
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
  to 28 March 2017 — capping how far back "change over time" can go, and
  meaning 2017 itself is a partial year (missing Jan-Mar). The year
  selectors start at 2017 accordingly.
- Every visitor needs their own free, Earth-Engine-registered Google
  account — there's no way around this without adding a backend that holds
  service-account credentials (a deliberate trade-off to keep this a plain
  static site; see project notes if that changes later).

## Licence

CC BY-NC — free to use and adapt for non-commercial purposes.
