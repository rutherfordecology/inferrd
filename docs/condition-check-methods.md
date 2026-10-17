# Condition check: methods specification

Status: **implemented in inferrd v0.32.0** (v0.32.1 adds the before, after and now levels) (signed off 17 October 2026;
the changes found necessary in testing are marked "As built"). This
replaces the condition check's home-made spot rules with published
methods run at their published settings, plus an accuracy assessment, so
that every step can be cited and every result comes with a measured error
rate.

## Principles

1. **Published methods only.** Each step follows a peer-reviewed method,
   cited below. Where a step is a reporting choice rather than a method
   (the smallest patch reported, the period), it is stated as a choice.
2. **Published settings, not site tuning.** Algorithms run at their
   published defaults. Nothing is tuned to particular covenants or events.
   (The earlier canopy-decline thresholds were tuned on two dieback
   patches at Riverside Road; that is what this replaces.)
3. **Accuracy is measured, not assumed.** Different change-detection
   algorithms agree on how much forest is undisturbed but disagree on
   which pixels are disturbed (Cohen et al. 2017). So the map's error
   rates are estimated with a stratified sample and reported with every
   result (Olofsson et al. 2014). Until a sample is labelled, results are
   marked unvalidated.

## Data

- **Change detection (CCDC): Landsat 8/9 only,** from NASA's Harmonized
  Landsat Sentinel-2 L30 product (`NASA/HLS/HLSL30/v002`, April 2013 on;
  Claverie et al. 2018): surface reflectance normalised for view angle
  (NBAR), 30 m, masked with its Fmask bits (cloud, next to cloud or
  shadow, cloud shadow, snow or ice). One image per day: where HLS tiles
  overlap the same pass comes twice, and CCDC would count it as two
  observations. Scenes more than 80% cloudy are skipped to keep requests
  small; clouds are masked pixel by pixel either way.
- **Steady trends and the whole-area trend: Sentinel-2 MSI Level-2A**
  (`COPERNICUS/S2_SR_HARMONIZED`, 10 m), masked with Cloud Score+
  (`cs_cdf` ≥ 0.6; Pasquarella et al. 2023) and the Scene Classification
  band. From 2019 it covers every year over New Zealand.
- Spots are mapped on the HLS 30 m grid (0.09 ha pixels); the steady-trend
  classes are sampled onto it. The 10 m Sentinel-2 imagery is still used
  for the report's image chips.

**As built: Sentinel-2 left out of CCDC.** The specification put
Sentinel-2 into CCDC as well, adjusted to the Landsat scale with HLS's
bandpass coefficients (HLS User Guide v2.0, Table 5). Earth Engine hosts
only HLS's Landsat product, not its Sentinel-2 one, so that adjustment
could not include HLS's view-angle normalisation. In testing, the
combined record showed a false step where Sentinel-2 joins it over New
Zealand at the end of 2018: on covenant 5-04-185, 162 of its pixels
"broke" in 2019 with both satellites, against 4 with Landsat alone. CCDC
was designed and published on Landsat, so Landsat alone is the defensible
configuration.

## 1. Abrupt change and recovery: CCDC

**Method.** Continuous Change Detection and Classification (CCDC; Zhu &
Woodcock 2014), as implemented in Earth Engine
(`ee.Algorithms.TemporalSegmentation.Ccdc`; tools and guidance in
Arévalo et al. 2020). CCDC fits each pixel's every clear observation with
a harmonic model (season) plus a trend, and records a break when new
observations depart from the model for several observations in a row.
Seasonality is modelled explicitly, so a winter-heavy year cannot fake a
change.

**Settings (Earth Engine defaults, as published).**

| Parameter | Value |
|---|---|
| breakpointBands | green, red, NIR, SWIR1, SWIR2 |
| tmaskBands (outlier screening) | green, SWIR2 |
| minObservations | 6 |
| chiSquareProbability | 0.99 |
| minNumOfYearsScaler | 1.33 |
| lambda (LASSO) | 20, with reflectance scaled 0–10 000 as the default assumes |
| maxIterations | 25 000 |

**What is reported, per pixel.**

- **Disturbance:** a *confirmed* break (CCDC change probability 1, i.e.
  six clear observations in a row departed from the model) inside the
  reporting period where NBR (or NDMI) falls across the break. The fall is
  CCDC's change magnitude. Where a pixel has several, the biggest fall is
  reported. No magnitude threshold is tuned; the slight / moderate / strong
  grades are descriptive bands of the magnitude, stated as such.
- **Recovering:** a disturbance whose post-break segment trends back up
  (positive slope). The share regained is reported as a recovery ratio, in
  the spirit of Kennedy et al. (2012)'s relative recovery indicator.
- **Before, after and now (v0.32.1):** for every disturbance, the change
  index's level on CCDC's fitted lines, from their intercept and slope (the
  seasonal terms left out): the earlier line at the break (before), the new
  line at the break (after), and the new line at its latest image (now).
  The recovery ratio is (now − after) / (before − after), so the share and
  the three values always agree. It is a share of the satellite signal, not
  of canopy or of indigenous vegetation: different vegetation can give the
  same value.
- **Recent change:** a confirmed break after the start of the "recent"
  window is a recent disturbance. **As built:** at the end of the record
  Earth Engine also reports a departure that is still being confirmed
  (change probability under 1, e.g. 1/6 after one odd image). These are
  reported as "possible recent change, not yet confirmed", in hectares,
  never as spots.

**As built: spots and dates.** A spot is touching pixels of the same kind
and, for a disturbance, the same break year, so one spot is one event.
Each pixel breaks when its own record departs, so a patch's dates spread
(a cyclone-damaged patch broke over several months). A spot's dates are
the window its pixels changed in: from the earliest last clear image
before any of them changed (`date_before`) to the latest break
(`date_after`), with the median break as `date_typical`.

This replaces the earlier "sudden drop", "dropped and recovered" and
"canopy decline" rules.

## 2. Gradual change: Mann-Kendall and Theil-Sen

**Method.** Per 10 m Sentinel-2 pixel, on yearly values adjusted for the
season (each month's median composite minus the pixel's normal for that
month; the year is the median of its months):

- Theil-Sen slope (Sen 1968) for the size of the change;
- Mann-Kendall test (Mann 1945; Kendall 1975) for its significance;
- Benjamini-Hochberg false discovery rate control across all pixels
  tested (q = 0.05; Benjamini & Hochberg 1995), because thousands of
  pixel tests at p < 0.05 would otherwise flag about 5% by chance.

Reported as steady decline or steady improvement. This replaces the
current "slow decline" and "sustained growth" rules, which compared each
pixel with the rest of its area using a tuned multiple of the spread.

## 3. Whole-area trend

Unchanged: the area average on every clear image, adjusted for the season,
averaged by month and year with 95% intervals allowing for month-to-month
autocorrelation. Mann-Kendall with the variance corrected for serial
correlation (Hamed & Rao 1998) and Theil-Sen slope.

## 4. Comparison with a control area

A reference-site comparison in the Before-After-Control-Impact tradition
(Stewart-Oaten et al. 1986; Underwood 1992). The control is analysed with the
same methods, and the report sets the two side by side: the area of each
kind (disturbed, recovering, steady decline, steady improvement) and the
whole-area trends (the control's is the dashed line on the chart). This
replaces measuring the area's pixels against the control's spread, which
was an inferrd construction.

## 5. Reporting choices (not methods)

- Smallest patch reported (minimum mapping unit): user setting, default
  0.27 ha (three 30 m pixels). Patches are joined pixels with the same
  result (eight-connected) and, for a disturbance, the same break year.
- Reporting period: user setting, default the last full years of the record.
- Severity grades: descriptive bands of the change magnitude, stated with
  their values.

## 6. Accuracy assessment

Before results go into a covenant or PMA report, map accuracy is estimated
by stratified random sampling with the map classes as strata, on the same
30 m grid. Points are
labelled blind from aerial imagery or site visits. The estimators are those of
Olofsson et al. (2014), with user's accuracy, producer's accuracy and
error-adjusted area per class, each with a 95% interval. The sampler and
estimator are already in inferrd (v0.28), checked against the mapaccuracy R
package. Until a sample has been labelled for a region and vegetation type,
results are labelled "unvalidated".

## 7. Limitations to state in reports

- 30 m pixels: single trees and patches smaller than about 0.1 ha are below
  what can be mapped.
- A spectral change says where and when canopy changed, not why (storm,
  dieback, browsing, clearance).
- Algorithms differ in what they catch (Cohen et al. 2017). The accuracy
  assessment, not the method's reputation, is the evidence for this map.
- Recent changes need six clear Landsat observations to be confirmed
  (two or three months), and the most recent are the least certain.

## What goes

Retired from the condition check (v0.32.0): the area-relative z-score spot tests,
the best-split canopy-decline rule and its growing step, the
dropped-and-recovered rule, the recent-drop persistence rule, the dense
canopy NDVI 0.8 cut-off as a detection gate, and all thresholds tuned to
local sites.

## References

Checked while writing this (sources found online): Arévalo et al. 2020;
Claverie et al. 2018; Cohen et al. 2017; Olofsson et al. 2014; the Earth
Engine CCDC parameter defaults. Others are standard references cited from
memory: check them against the library before publishing.

- Arévalo, P., Bullock, E.L., Woodcock, C.E., Olofsson, P. (2020). A suite
  of tools for continuous land change monitoring in Google Earth Engine.
  *Frontiers in Climate* 2:576740. doi:10.3389/fclim.2020.576740
- Benjamini, Y., Hochberg, Y. (1995). Controlling the false discovery rate.
  *Journal of the Royal Statistical Society B* 57:289–300.
- Claverie, M., Ju, J., Masek, J.G., et al. (2018). The Harmonized Landsat
  and Sentinel-2 surface reflectance data set. *Remote Sensing of
  Environment* 219:145–161. doi:10.1016/j.rse.2018.09.002
- Cohen, W.B., Healey, S.P., Yang, Z., et al. (2017). How similar are forest
  disturbance maps derived from different Landsat time series algorithms?
  *Forests* 8(4):98. doi:10.3390/f8040098
- Hamed, K.H., Rao, A.R. (1998). A modified Mann-Kendall trend test for
  autocorrelated data. *Journal of Hydrology* 204:182–196.
- Kendall, M.G. (1975). *Rank Correlation Methods*. Griffin, London.
- Kennedy, R.E., Yang, Z., Cohen, W.B., et al. (2012). Spatial and temporal
  patterns of forest disturbance and regrowth within the area of the
  Northwest Forest Plan. *Remote Sensing of Environment* 122:117–133.
- Mann, H.B. (1945). Nonparametric tests against trend. *Econometrica*
  13:245–259.
- Olofsson, P., Foody, G.M., Herold, M., et al. (2014). Good practices for
  estimating area and assessing accuracy of land change. *Remote Sensing of
  Environment* 148:42–57.
- Pasquarella, V.J., Brown, C.F., Czerwinski, W., Rucklidge, W.J. (2023).
  Comprehensive quality assessment of optical satellite imagery using
  weakly supervised video learning. *CVPR Workshops*.
- Sen, P.K. (1968). Estimates of the regression coefficient based on
  Kendall's tau. *Journal of the American Statistical Association*
  63:1379–1389.
- Stewart-Oaten, A., Murdoch, W.W., Parker, K.R. (1986). Environmental
  impact assessment: "pseudoreplication" in time? *Ecology* 67:929–940.
- Underwood, A.J. (1992). Beyond BACI: the detection of environmental
  impacts on populations in the real, but variable, world. *Journal of
  Experimental Marine Biology and Ecology* 161:145–178.
- Zhu, Z., Woodcock, C.E. (2014). Continuous change detection and
  classification of land cover using all available Landsat data. *Remote
  Sensing of Environment* 144:152–171.
