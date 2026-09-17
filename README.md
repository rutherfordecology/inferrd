# inferrd.

QEII covenant vegetation-index monitoring — draw a covenant boundary, pull its
Sentinel-2 EVI/NDVI history, and get a statistically defensible read on
whether forest cover is changing over time.

A single self-contained static page (`index.html`) — no build step, no
backend, no framework. It talks directly to Google Earth Engine from your
browser using your own sign-in.

Port of an earlier `inferrd.py` notebook script (Python + geemap), rebuilt as
a web app so it doesn't need Jupyter/Colab to run.

## One-time setup

Earth Engine sign-in needs two values filled in before it will work — both
are set as constants near the top of the `<script>` block in `index.html`:

```js
const CLIENT_ID = 'REPLACE_WITH_YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com';
const EE_PROJECT = 'REPLACE_WITH_YOUR_EE_CLOUD_PROJECT_ID';
```

1. **Register for Earth Engine** (free, non-commercial use) at
   [code.earthengine.google.com/register](https://code.earthengine.google.com/register)
   if you haven't already — this also creates/links a Google Cloud project.
   `EE_PROJECT` is that project's ID (Cloud Console → project selector).
2. **Create an OAuth Client ID** in that same Cloud project:
   Cloud Console → *APIs & Services* → *Credentials* → *Create Credentials* →
   *OAuth client ID* → Application type **Web application**. Under
   *Authorized JavaScript origins*, add every origin you'll open this page
   from — e.g. `http://localhost:7899` for local preview, and your GitHub
   Pages origin (e.g. `https://rutherfordecology.github.io`) once deployed.
   Copy the resulting Client ID into `CLIENT_ID` above.

Neither value is secret — both are safe to commit once issued. Anyone who
opens the deployed page still signs in with their **own** free Earth Engine
account; these two constants only identify *this app* to Google, they don't
grant access to anyone's data.

## Running it locally

No build step — just serve the folder and open it:

```bash
python -m http.server 7899
```

then open `http://localhost:7899`. (In the Occurd repo's `.claude/launch.json`
there's an `inferrd` preview entry that does this automatically.)

## How it works

1. Draw the covenant boundary on the map (polygon or rectangle tool)
2. Choose a start/end year, a max scene cloud-cover threshold, and a
   vegetation index (EVI or NDVI)
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

### Why EVI by default, not NDVI

EVI resists saturation better than NDVI in dense, closed-canopy remnant
forest — the technical pick for this use case. NDVI stays available as a
toggle since it remains the more common reference point in general
time-series work, and costs nothing extra to compute alongside EVI.

## Limitations

- **Not yet run against live Earth Engine data.** This was built and
  syntax-checked without a registered OAuth client, so the actual Earth
  Engine calls haven't been exercised end-to-end. Treat your first real run
  as a test, not an assumption that it's bug-free.
- Vegetation index alone can't tell you *why* a change happened — dieback,
  drought stress, pest/weed incursion, and clearance can all look similar
  from space. Use this to flag where to send someone to look, not as a
  substitute for ground-truthing.
- Sentinel-2 only goes back to mid-2015, capping how far back "change over
  time" can go for older covenants.
- Every visitor needs their own free, Earth-Engine-registered Google
  account — there's no way around this without adding a backend that holds
  service-account credentials (a deliberate trade-off to keep this a plain
  static site; see project notes if that changes later).

## Licence

CC BY-NC — free to use and adapt for non-commercial purposes.
