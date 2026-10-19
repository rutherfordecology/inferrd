# Changelog

## v0.35.0 — 2026-10-19

From Area 1 (Tairāwhiti), where S1–S4 were dated 2019 and the big drops
next to them were missed.

- **False disturbances removed.** A CCDC break now counts only where the
  fitted line actually fell, by at least 0.05. S1–S4 had all "broken" on
  one run of odd Landsat images ending 26 December 2019 while their fitted
  lines rose (S1 0.545 → 0.611).
- **Falls CCDC missed are caught on Sentinel-2.** After each break CCDC is
  blind until it has refitted (1.33 years and 12 clear images, which can
  take years here), so S1's pixels fell ~0.35 in January 2023 with no
  break. Every 30 m pixel is now also checked on Sentinel-2's seasonally
  adjusted yearly values against the area median: a fall of 0.1 or more
  from one year to the next that is still at least half down the year
  after is a disturbance (recovering if the latest year has regained a
  quarter). These join the S and R spots, are dated on Sentinel-2 as
  before, and are marked in `spots.csv` (`detected_by`). Runs take longer.

## v0.34.0 — 2026-10-19

- **Disturbances (S and R) dated on Sentinel-2.** CCDC confirms a break
  only once the signal has stayed off its model, so a fall over a few
  months could break long after it began: on 5-05-112, S1 fell from about
  November 2025 to March 2026 but was dated August 2026. CCDC still
  decides which pixels are disturbed; each spot is now dated by the
  biggest fall in its own Sentinel-2 series (spot mean less the area or
  control median, ±45-day median smoothing) from 18 months before the
  break to 6 months after. The table, report, report images, Spots over
  time chart and `spots.csv` use these dates. Where a spot has too few
  clear images or no fall of 0.05, CCDC's dates are kept. New `spots.csv`
  columns: `dated_on`, `ccdc_break_from`, `ccdc_break_to`, `s2_fall`. One
  more Earth Engine request per run.
- **Index comparison chart:** a "Y-axis starts at 0" box, thinner lines
  and error bars, and smaller points.

## v0.33.0 — 2026-10-19

- **Break detection setting for disturbance (S) and recovering (R)
  spots.** Dead canopy trees seen on the ground were not being picked up.
  *Sensitive*, now the default, confirms a CCDC break on 4 clear images in
  a row at a 95% chi-square probability, not the published 6 at 99%, so
  smaller or patchier falls in the canopy signal break. *Standard* keeps
  the published settings. The report's Appendix A, the "possible recent
  change" count, the low-confidence flag and the export's metadata
  (`ccdc`, `break_detection`) follow whichever was used.

## v0.32.1 — 2026-10-17

From an outside review of the Riverside Road (WR63) PDF.

- **Retitled "Satellite vegetation change screening"**, with a line under
  At a glance that it screens the satellite vegetation signal, not
  ecological condition: it does not show what the vegetation is, whether it
  is indigenous, or whether the area's values are being kept.
- **Before, after and now for every disturbance.** Each disturbance spot
  now carries the change index's level on CCDC's fitted lines (trend part,
  no seasonal swing): the earlier line at the break, the new line at the
  break, and the new line at its latest image. They are in the report's
  tables ("Signal: before → after → now") and `spots.csv`
  (`index_before`, `index_after`, `index_now`). The recovery share is now
  (now − after) / (before − after) of those levels, so share and values
  always agree (on WR63: R1 0.68 → 0.43 → 0.63, 70%).
- **Recovery is worded as the signal, not the vegetation:** "the signal is
  about 70% back to its earlier level; that is not proof of what is
  growing back", with a note that different vegetation can give the same
  value.
- **30 m and 10 m in the main text:** Section 3 says disturbance is found
  at 30 m on Landsat and steady trends at 10 m on Sentinel-2, mapped onto
  the 30 m grid, and that neither shows single trees.
- Fixed: the recommendation named "the 1 disturbance and steady-decline
  spot" when there was no steady decline; it now names the spots and their
  kinds. Fixed: Appendix A printed "which gave p ≤ 0" when no pixel passed
  the false discovery rate test; it now says no pixel passed.

## v0.32.0 — 2026-10-17

**The condition check is rebuilt on published methods** at their
published settings, specified with references in
`docs/condition-check-methods.md`. Nothing is tuned to particular sites.
The home-made spot rules (area-relative spread tests, the best-split
canopy-decline rule and its thresholds tuned on Riverside Road) are gone.

- **Disturbance and recovery: CCDC** (Zhu & Woodcock 2014; Arévalo et al.
  2020) at Earth Engine's defaults, on every clear Landsat 8/9 image since
  April 2013 (NASA HLS L30 v2.0, view-angle normalised, 30 m, one image
  per day). A disturbance is a confirmed break in the period where NBR (or
  NDMI, a new setting) fell; it is recovering when the fitted line after
  the break rises, with the share regained. On 5-04-052 CCDC dated the
  cyclone damage to between 31 August and 13 December 2023 (2.6 ha) and
  July–October 2024 (1.3 ha), all recovering.
- **Possible recent change, not yet confirmed:** a departure at the end of
  the record that CCDC has not confirmed (fewer than six clear images) is
  given in hectares, never as a spot.
- **Steady decline or improvement:** Mann-Kendall and Theil-Sen on each
  10 m Sentinel-2 pixel's seasonally adjusted yearly values, with a
  Benjamini-Hochberg false discovery rate correction (the floor, the
  moisture veto and the dense-canopy gate are gone).
- **Spot kinds** keep their codes for the report workflow: `sudden_drop`
  (Disturbance), `dropped_recovered` (Disturbed, recovering), `slow_decline`
  (Steady decline), `gain` (Steady improvement). `canopy_decline` is
  retired. Spots are 30 m pixels (0.09 ha); a disturbance spot is one break
  year, dated by the window its pixels changed in (`date_before` to
  `date_after`, with `date_typical`, a new column).
- **Settings** are now the period, trend index, the index disturbance is
  measured on, the recent window and the smallest spot (default 0.27 ha).
  The spread slider, floors, "allow for area-wide change" and canopy
  settings are gone.
- **Control area:** analysed the same way and set beside the area (area of
  each kind, and its trend dashed on the chart), instead of supplying the
  spread the area was measured against.
- **Report and summary.json** describe the new methods with references,
  state that results are unvalidated until a validation sample is labelled,
  and add `validated`, `disturbed_by_year_ha`,
  `possible_recent_change_unconfirmed_ha` and the CCDC settings; the old
  rule settings are gone.
- **Validation sample** works on the 30 m grid, and its strata now come
  from the spot outlines painted onto the grid: `reduceToImage` had
  rasterised them too coarsely (8.97 ha of strata for 3.87 ha of spots on
  a 15 ha test), which inflated earlier samples' stratum areas.
- Tested: Sentinel-2 was meant to join Landsat in CCDC, adjusted with HLS's
  bandpass coefficients, but without HLS's view-angle correction (not in
  Earth Engine) it left a false step at the end of 2018: 162 pixels "broke"
  in 2019 on 5-04-185, against 4 with Landsat alone. So CCDC runs on
  Landsat, as published. Runs took 50–60 s for 15–105 ha.

## v0.31.2 — 2026-10-17

Fixes found on a small area in forest where one dieback patch (C1) was a
third of the area: its leaf water fell sharply in late 2021, but it was
dated "from 2024", and two other spots seemed to get wetter at that moment.

- **Canopy decline is measured against one yardstick.** Each split year's
  drop was compared with the spread of drops at that split, which an event
  covering much of the area widens, so the event's own year was the one it
  was least likely to pass. Every split now uses the typical (median)
  spread across splits. C1 grew from 3.4 to 5.5 ha.
- **Canopy decline is dated by its biggest drop.** Among the split years
  where a pixel passes, the one with the biggest drop in index units dates
  it (it was the biggest drop against the spread). C1 now reads "from 2022
  (2022–2023 against 2019–2021)".
- **Spots over time measures against the area's median**, as the spot
  tests do, not its mean. A big patch inside the area dragged the mean,
  making every other spot look as if it had suddenly gone up.

## v0.31.1 — 2026-10-17

- **Spots over time charts a spot on the index it was tested on.** Adding
  a spot switches the chart to that spot's test index: NDMI for canopy
  decline, the drop index (NBR by default) for a recent sudden drop, the
  trend index (EVI by default) otherwise. It can still be changed by hand,
  and a spot charted on another index says "tested on …" in red. A canopy
  decline spot charted on EVI showed its drop in a different year from its
  flag, which tested canopy moisture.

## v0.31.0 — 2026-10-17

- **Per-pixel yearly values allow for the season.** Each year was the
  median of that year's clear images, so for vegetation with a strong
  seasonal swing a year with more clear winter images came out lower
  although nothing had changed. On 5-04-185 that produced five "dropped and
  recovered" spots (2.3 ha) on 2020 against 2021: the spots' yearly median
  went 0.54 → 0.35 while 2020 had 15 winter and 15 summer images and 2021
  had 17 and 11, and nothing showed on the image-by-image chart. Now each
  month of each year is a median composite less the pixel's normal for
  that month (its median over the period), each year is the median of its
  months, and the pixel's average monthly normal is added back. Every
  month present counts the same and missing months don't matter. This is
  the per-pixel version of the whole-area adjustment and affects slow
  decline, gains, older sudden drops, dropped and recovered, canopy
  decline and the canopy trend map. The report's methods say so.
- Tested live with the same settings. On 5-04-185 the false "dropped and
  recovered" spots are gone and canopy decline went from 17 spots (6.04 ha)
  to 15 (3.25 ha). On 5-04-052 ("allow for area-wide change" unticked) the
  Gabrielle canopy decline is still found (5.2 ha, dated 2023). Runs took
  36–41 s, against 83 s before.

## v0.30.1 — 2026-10-17

- **Spots over time shows what each flag compared.** A row of bars per
  charted spot above the chart: hollow = the years before, solid = the
  years after (also shaded lightly behind the lines), dashed = the year a
  dropped-and-recovered spot had grown back by, or the whole period for
  slow decline and growth; a recent drop is the gap between the last clear
  image before and the first after. On 5-04-185 this showed five
  "dropped and recovered" spots flagged on 2020 against 2021, with nothing
  visible in 2021 on the chart.

## v0.30.0 — 2026-10-17

- **Condition check against a control area.** With two or more areas
  drawn, pick the area to check and a control (with exactly two, the other
  one is the control by default). Every typical value behind the spot
  tests (area medians and robust spreads, for recent drops, slow decline,
  dropped and recovered, and canopy decline) then comes from the control,
  so change shared with it cancels out and the spots show where the area
  differs from the control. "Allow for area-wide change" is always on with
  a control. Spots and the canopy trend map stay inside the checked area.
- The whole-area chart draws the control's trend as a dashed line with
  hollow yearly averages; the text gives the control's verdict, and Spots
  over time charts each spot against the control.
- The report names the control (methods and At a glance), and
  `summary.json` gains `control_area` and `measured_against`.
- The whole-area chart's key wraps onto more rows instead of running off
  a narrow pane.

## v0.29.0 — 2026-10-17

The condition check now shows a block-wide event such as Cyclone Gabrielle,
which it used to cancel out (found on covenant 5-04-052, flattened in
February 2023 but reported as "no clear trend" with almost no spots).

- **Whole-area drop.** Besides the trend test, the whole-area result looks
  for the biggest fall from an earlier year to a later one whose 95% bars
  don't overlap. "Whole area" then reads "dropped in 2023", the text gives
  both years' values and how much had grown back, and the PDF's At a glance
  and `summary.json` (`trend.biggest_drop`) say so. Mann-Kendall only finds
  steady trends, so a drop that partly recovers came out as "no clear
  trend".
- **Warning when area-wide change hides the damage.** If the whole area
  dropped (that test, or a median change across the area beyond its
  typical spread) while "allow for area-wide change" is ticked, the results
  say that shared change was cancelled out of the spots and to untick it.
  On 5-04-052, unticking it maps a 6.3 ha canopy-decline patch dated 2023.
- **"Y-axis starts at 0" on the whole-area chart**, as on the trend charts.
  It only extends the axis down to 0, never crops, and the report's copy
  follows it.
- **Layers panel can't be closed in inferrd.** Its ✕ is gone; a chevron on
  its left edge folds it to a strip at the right of the map and back
  (remembered). Projects ▾ → Layers brings a folded panel back out.
- **Spot-type ticks show in one place.** The sidebar copy under Run
  condition check is hidden while the Layers panel, which has the same
  ticks, is open.

## v0.28.2 — 2026-10-17

- **Smallest spot can be 0.01 ha (1 pixel).** A single flagged 10 m pixel
  then counts as a spot. The hint warns that this also lets through more
  cloud edges, shadows and odd pixels, and that a lone dead crown is
  usually split across several pixels and diluted by the live canopy
  around it, so it may still not be flagged.

## v0.28.1 — 2026-10-17

- **Area outlines stand out on the map.** The coloured outline is now 90%
  opaque instead of 45%, which all but vanished against canopy, with a
  1 px black line down its middle. The black line sits above spot and
  change layers, follows the shape while it is reshaped, and goes when the
  area is removed. Report images already drew their own dark-edged
  outline and are unchanged.
- **The Layers panel stays up.** Once this browser holds the Layers
  password, the panel opens with the page every time instead of waiting
  for Projects ▾ → Layers. ✕ closes it until the next load.

## v0.28.0 — 2026-10-17

Accuracy assessment for the condition check, so the spot rules can be
validated (Olofsson et al. 2014, *Remote Sensing of Environment* 148:42–57).

- **Validation sample.** A new card under the spots table draws a
  stratified random sample of 10 m pixels: one stratum per spot type plus
  `no_spot`, with the number of points per stratum adjustable (50 per spot
  type and 100 outside spots by default) and a recorded seed. Strata come
  from the reported spot polygons on the 10 m grid, and each stratum's
  mapped area is measured from the same grid. Downloads as CSV or GeoJSON
  with `point_id`, `stratum`, `lat`, `lon`, `stratum_area_ha` and empty
  `reference_label`, `reference_source` and `notes` columns. Points are
  shuffled, given neutral ids and shown on the map without their type, for
  blind labelling.
- **Load labelled validation sample…** under Run condition check reads the
  labelled CSV or GeoJSON back (no condition check needed) and shows the
  area-weighted error matrix, overall, user's and producer's accuracy and
  error-adjusted areas per type, each with a 95% interval, using the
  Olofsson et al. (2014) estimators. Results download as CSV. Blank,
  unsure and unrecognised labels are left out and reported.
- The estimator matches the `mapaccuracy` R package (Olofsson et al. 2013
  examples 1–2 and the 2014 paper's Table 8) to floating-point precision,
  including strata with one or no labelled points (where intervals are
  flagged as unreliable).

## v0.27.0 — 2026-10-17

Methods checked against the peer-reviewed literature, and fixed where they
fell short.

- **Cloud mask is now Google's Cloud Score+** (`cs_cdf` ≥ 0.6, Pasquarella
  et al. 2023) instead of the Scene Classification Layer, which misses much
  thin cloud and shadow and kept class 7 ("clouds, low probability /
  unclassified"). The SCL still drops no-data, saturated and snow pixels.
  Applies everywhere: trends, change map, change dating, condition check
  and report image chips.
- **"No significant trend" no longer reads as "stable".** It is reported as
  "not shown either way", since with ~8 yearly values Mann-Kendall has
  little power. Fewer than 5 years is flagged as unable to reach
  significance at all.
- **Mann-Kendall variance corrected for serial correlation** (Hamed & Rao
  1998), only ever widened. Checked against an independent scipy
  implementation.
- **Sen's slope divides by years elapsed**, so a year missing for cloud no
  longer distorts the trend mode's slope.
- **Canopy trend map uses a false discovery rate** (Benjamini–Hochberg,
  q = 0.05) instead of p < 0.05 per pixel, which flagged about one pixel
  in twenty in an unchanging forest. The cut-off used is in the PDF and
  `summary.json` (`canopy_trend.p_cutoff`).
- **Condition-check error bars allow for correlated images.** Each month is
  averaged first, and each year's 95% interval uses an effective sample
  size cut for month-to-month autocorrelation. `trend.csv` columns are now
  `months_used`, `effective_n`, `scenes` and `clear_looks`.
- **Clear looks per area.** Results, CSVs and the PDF add `n_clear`, the
  number of clear views the typical pixel of the area got; the
  low-quality-year warnings use it instead of the whole-tile scene count.
- **Years before 2019 flagged.** Level-2A was only produced worldwide from
  December 2018; year pickers now default to 2019.
- **Biggest-jump check compares like with like:** a yearly change is now
  judged against the typical change between deseasonalised yearly
  averages, not the scatter of single months.
- **"Severe" is now "strong"** on the change map and in exports, with a
  note that these are not burn-severity classes.

## v0.26.0 — 2026-10-16

- **Canopy trend: healthy forest growing well.** Every dense-canopy pixel
  gets its own Mann-Kendall test on its yearly values (EVI by default,
  with canopy moisture as a check), measured from zero rather than against
  the rest of the area, so a whole forest improving shows as improving.
  Pixels are improving steadily, stable, or declining steadily. A new
  "Canopy trend map" layer (off until ticked) shows them, the summary
  bar and the PDF give the shares ("62% improved steadily…"), and
  `summary.json` records them under `canopy_trend`.
- **G spots are now sustained growth:** touching steadily improving
  pixels, instead of patches that only gained more than the rest of the
  area.

## v0.25.1 — 2026-10-16

- **Clear-image test fixed** for the spots-over-time chart and the
  whole-area trend: an image's clear share is now measured against the
  clearest image of that spot or area. Counting pixels on a different grid
  meant some spots never looked fully clear, so they charted no images.

## v0.25.0 — 2026-10-16

- **Spots over time.** Click condition-check spots on the map, or tick
  Chart in the spot table, to follow them together on one chart: each
  spot's average minus the whole area's on every clear image (so season,
  weather and haze cancel), with a 6-month moving median. Lines keep their
  spot type's colour; spots of one type differ by dash pattern and are
  labelled at the line end. Choose EVI, NDVI, NBR or NDMI; remove a spot
  from its chip, or Clear.

## v0.24.2 — 2026-10-16

- **Area outlines wider and more see-through** (4 px at 45% opacity,
  lighter fill), so the canopy at the edge of an area stays visible.

## v0.24.1 — 2026-10-16

- **Condition summary on one line.** The whole-area and spot-count boxes
  above the chart stay in a single row at any width, in the legend's
  order, with the full text on hover.

## v0.24.0 — 2026-10-16

- **Spot types on and off.** Each condition check spot type (sudden drop,
  dropped and recovered, canopy decline, slow decline, gain) is its own
  map layer with a tick box, in the sidebar legend and in a new
  "Condition check" group at the top of the Layers panel, with counts
  and hectares. Unticked types are left out of Export for report: the
  map, tables, images, CSVs and PDF (whose sections renumber, and which
  says what was left out); `summary.json` lists them as
  `kinds_left_out`.
- **Layer groups fold.** The Gisborne District Council, QEII National
  Trust and Manaaki Whenua groups in the Layers panel (from occurd.'s
  layers.js) fold away with a chevron, remembered between visits.

## v0.23.2 — 2026-10-16

- **Condition check on big areas.** The check's four Earth Engine
  requests now run one after another instead of all at once, show which
  step they are on, and retry with a growing pause if Earth Engine says
  it is busy ("too many concurrent aggregations"). Area-wide medians are
  worked out at 20 m, coarser on very large areas.

## v0.23.1 — 2026-10-16

- **Deleting a block clears its condition check.** Removing the area
  (✕ in section 2) now removes its results panel and what Export for
  report would save, so the next block starts clean. Removing an area
  while a check is still running no longer leaves "Run condition check"
  switched off.

## v0.23.0 — 2026-10-16

- **Canopy decline spots cover the whole dieback patch.** A spot still has
  to start from pixels that pass the canopy decline test (default 2x the
  spread and 0.08), but now grows into touching pixels that pass a
  looser one (1.5x and 0.06). At Rangikohua Station Bush (WR39) this
  takes the flagged dieback from 1.1 ha to 3.1 ha, following the grey,
  leafless tawa crowns rather than only their strongest core, without
  flagging scattered weak pixels elsewhere. The check takes a little
  longer.

## v0.22.2 — 2026-10-16

- **Sharper, quieter condition chart.** Drawn at the size it is shown and
  at the screen's pixel density instead of stretched from 900 pixels, with
  smaller type, a lighter grid, wider margins and the key above the plot.
  The report export draws its own copy at a fixed, higher resolution.

## v0.22.1 — 2026-10-16

- **Explanations start closed.** Each "Explanation" in the sidebar is
  folded away until opened; one you open stays open next time.

## v0.22.0 — 2026-10-16

- **Canopy decline at any point in the period.** Instead of comparing the
  first years with the last two, each pixel's yearly canopy moisture
  (against the rest of the area) is split at every year in turn, up to
  four years before against the two after, and the biggest drop dates the
  decline. So it is not tied to one event: an older decline, or a future
  one, is found with its own start year. C spots report "from <year>",
  how much has been regained since, and are low confidence when only one
  year of data follows the drop. Whole-year values mean seasonal leaf
  fall of deciduous trees cancels out.

## v0.21.0 — 2026-10-16

- **Canopy decline spots (C).** A fifth spot type for canopy that is
  dying while still green: canopy moisture (NDMI, near-infrared against
  the shortwave infrared that leaf water absorbs) in the last two years
  of the period against the first years, in dense canopy only, measured
  against the rest of the area. It has its own, gentler tolerance
  (default 2x the typical spread and at least 0.08). Tuned on two
  dieback patches at Riverside Road (WR63) after Cyclone Gabrielle, which
  lost leaf water from early 2023 while greenness barely moved; it picks
  both up. Treat the defaults as provisional until checked on more sites.
- **Shortwave-infrared row in the spot images**, where well-watered
  canopy is green and drying or dead canopy olive to brown.

## v0.20.0 — 2026-10-16

- **Dropped-and-recovered spots (R).** The condition check now maps
  places whose vegetation fell sharply in one year and has since grown
  back by at least half, such as storm or slip damage regrowing after
  Cyclone Gabrielle. Before, only drops that were still down were
  flagged, so damage that recovered went unmapped. R spots are purple on
  the map, have their own table and images in the summary PDF, and carry
  the share regained (`recovered_share`) in `spots.csv`.

## v0.19.0 — 2026-10-16

- **Condition check trend adjusted for the time of year.** The whole-area
  chart now uses the area average on every clear image (with at least
  half the area clear), less the normal value for its calendar month, so
  spring growth, winter dips and a year that happened to get mostly winter
  images no longer move the yearly value. Each year is the average of its
  adjusted images with a 95% confidence interval, and the chart adds the
  single images as faint dots and a 12-month moving median. The old
  between-pixel SD moves to the tables, where it describes how varied the
  area is. `trend.csv` is rebuilt around the adjusted values and a new
  `images.csv` lists every image used.
- **"Allow for area-wide change" tick box** in the condition check. Off,
  sudden drops and slow decline are measured from zero instead of from
  what the area as a whole did, so a decline across most of the area is
  flagged too.

## v0.18.0 — 2026-10-16

- **Satellite images of each spot.** The condition export now includes
  Sentinel-2 images of the whole area (first year, lowest year, last year)
  and of each sudden-drop and slow-decline spot (before and after, plus
  the latest year for older drops), in natural colour and false-colour
  infrared, where healthy canopy shows bright red. They are saved in
  `spot-images/` and shown in a new Appendix B of the summary PDF. Up to
  12 spots; built from Earth Engine map tiles, so no extra permission.
- **File names start with the date and time.** The zip, its folder and
  the PDF are named `YYYY-MM-DD_HHMM_<block>`.
- **PDF title on one line**, shrinking a little if needed, or on two
  even lines when it is too long; PDF images are embedded as JPEG, so the
  file is a fraction of the size.

## v0.17.4 — 2026-10-16

- **Results summary PDF in the export.** "Export for report" adds
  `condition-summary.pdf`: At a glance, the map, the year-by-year chart,
  spot tables with GPS points and what to check, limitations, and a
  methods and settings appendix, in the condition report's structure and
  wording. It is marked as an automatic, unreviewed draft, not the issued
  report.

## v0.17.3 — 2026-10-16

- **Condition check chart: error bars, no trend line.** The whole-area
  chart shows each year's mean with ± 1 standard deviation across the
  area's pixels, and no fitted line, so a reader can judge the pattern
  (a dip and recovery, say) against the spread. "Declined" or "improved"
  now also needs the change over the period to be bigger than the typical
  error bar, not just a significant trend test. `trend.csv` gains an SD
  column; `summary.json` gains `change_vs_spread`.

## v0.17.2 — 2026-10-16

- **Report map from the aerial basemap.** The export's `map.png` is now
  drawn from the same Esri World Imagery tiles the app shows, with the
  area outline, labelled spots, a legend, scale bar, north arrow and
  imagery credit. It no longer needs Earth Engine's thumbnail permission,
  which the service account doesn't have.

## v0.17.1 — 2026-10-16

- **Condition check fixes from the first live runs.** Spots now come back
  (they were lost when fetched inside a dictionary, so every run reported
  none), and a long look-back no longer fails on images whose values
  differ in range.

## v0.17.0 — 2026-10-16

- **Condition check.** A third analysis type for one area, such as a
  covenant or PMA picked with "Analyse this area". It gives the whole
  area's trend (Mann-Kendall and Sen's slope on yearly composites) and
  traces spots inside it: sudden drops (recent ones from each clear image
  in a look-back window against the 180 days before; older ones from a
  single big step between two years), slow decline and gains (each
  pixel's change over the years against the area's typical spread). The
  tolerance is adjustable: smallest drop, spread multiple, how many clear
  images a drop must stay down for, and smallest spot.
- **Export for report.** Saves a zip for the report workflow: summary,
  trend and spot tables, spot outlines, the area, a labelled map and the
  trend chart.

## v0.16.0 — 2026-10-16

- **Analyse a covenant or plan area.** QEII covenant popups and reference
  layer popups (such as Gisborne's Protection Management Areas) have an
  "Analyse this area" button that adds the boundary as an area, named after
  the feature, ready for a trend or a change map. Reference-layer boundaries
  are fetched again at full detail, since the map shows a simplified
  outline. A covenant in several blocks becomes one area; the layer check
  lists each block separately.

## v0.15.0 — 2026-10-16

- **Measure tools.** Two buttons under the drawing tools measure a distance
  (draw a line; its length shows in m or km) or an area (draw a polygon;
  its area shows in ha or m², with the perimeter). Measurements stay on the
  map until clicked and never become analysis areas. The tool is occurd.'s
  `measure.js`, loaded live from occurd.'s site like the layers, so the two
  apps stay the same.

## v0.14.1 — 2026-10-16

- **Change map and "When did this change?" on Sentinel-2's own pixels.**
  The area's median change and spread, the hectare totals, the traced
  patch outline and the patch and surroundings values in the time series
  are now worked out on the Sentinel-2 tile's own 10 m grid (its UTM zone)
  instead of Earth Engine's default lat/long grid, which sat up to half a
  pixel off the real pixels. A traced outline now follows the coloured
  pixels exactly. The flagging rule itself is unchanged.
- **Patch re-traced from either side of the change.** Once the time series
  dates a change, the clicked patch is traced again from the clear images
  just before and just after it (same rule, same median and spread),
  because a change inside a wide "after" window is diluted and its patch
  comes out too small (in one case 12 pixels of an event covering 17). If
  that gives different pixels, the time series is redone for them and the
  description says which images it was traced from.

## v0.14.0 — 2026-10-16

- **Reference layers from occurd.** Projects ▾ → Layers (password, or your
  own LRIS API key) adds the same layers panel as occurd.: current land
  cover (LCDB v6), potential vegetation, the Vegetative Cover Map,
  threatened environments, PAN-NZ protected areas, QEII covenants and
  Gisborne District Council plan layers, plus a check of every drawn area
  against every layer with a CSV download.
- **Shared, not copied.** The module and its layer list load live from
  occurd.'s site, so a layer added to occurd. appears here too. Needs the
  matching occurd. change to `layers.js` (portable helpers and a
  `window.LAYERS_HOST` hook) to be deployed first.

## v0.13.0 — 2026-10-16

- **Choose what you want to see first.** A new section 3 asks whether you
  want a **trend over years** (graphs of the index year by year, with the
  trend tests) or **change between two dates** (a map of where vegetation
  increased or decreased). Section 4 then shows only that mode's settings,
  ending in its own button — Run analysis or Show change — so it's clear
  which one you're running. The cloud-cover limit is shared by both and
  sits at the top of section 4.
- Switching mode removes the other mode's map layers (the index preview or
  the change map). Results already in the results pane stay until you run
  something new. The last mode you used is remembered on this device.
- Show change is greyed out until you've unlocked and drawn an area, like
  Run analysis, instead of the whole section staying hidden.

## v0.12.0 — 2026-10-16

- **"When did this change?"** With the change map showing, click a flagged
  patch to date the change. The patch is traced with the same rule as the
  map, and every Sentinel-2 image of roughly the last two years in which the
  whole patch is clear gives one point: the patch mean against the median of
  its surroundings (a ring 30–150 m out, inside the area). The results pane
  charts patch, surroundings and their difference, and names the two clear
  images the change falls between — where the difference crosses the map's
  flag threshold and stays there for two or more images. Single-image dips
  that recover straight away are called out as likely cloud shadow or haze.
  The per-image series exports as CSV. Clicking outside a flagged patch
  inspects the 10 m around the point instead.

## v0.11.1 — 2026-10-16

- **Change map shows how big each change was.** Flagged pixels are shaded
  slight / moderate / severe (0.05–0.15, 0.15–0.3, over 0.3 index units
  from the area-wide change), with hectares per shade in the summary. The
  sensitivity slider still decides which pixels are flagged at all; the
  breaks are rough defaults, not calibrated thresholds.
- **Grey for pixels with no clear view** — cloud or shadow on every pass in
  one of the windows — so they no longer look like "no change", plus the
  hectares that couldn't be assessed.
- **Light grey for low confidence** — pixels backed by only one clear image
  on either date — and a note of how much of the flagged loss rests on a
  single image. Widening the window usually fixes it.

## v0.11.0 — 2026-10-16

- **Added "Change between two dates"** (sidebar section 4, shown once an
  area is drawn). Pick a before and after date and a window around each;
  inferrd. builds a cloud-masked median for each and maps the pixels whose
  index changed significantly — red for loss, optionally green for gain —
  with the flagged hectares and clear-image counts per area. NBR by default.
- **"Allow for area-wide change"** (on by default) measures each pixel
  against the area's own median change, so a season or drought that shifts
  every pixel together cancels out and only pixels that changed unlike the
  rest are flagged. A sensitivity slider sets how far out (1.5–6 × the
  area's robust spread, from the median absolute deviation); changes under
  0.05 are never flagged.

## v0.10.2 — 2026-10-16

- **Fixed the map preview (Show) failing since v0.10.0.** The service
  account's Earth Engine Resource Viewer role doesn't include
  `earthengine.maps.create`, which the preview tiles need (analyses only
  need `computations.create`, so they kept working). `worker/README.md` now
  says to grant that permission too.
- A failed preview now shows Earth Engine's actual error under the layer
  controls instead of only "1 of 1 layers failed to load".

## v0.10.1 — 2026-09-29

- **Changed the licence** from CC BY-NC to PolyForm Strict 1.0.0 for the
  code (free for non-commercial use; no redistribution or modified
  versions) and CC BY-NC-ND 4.0 for written content. Added a `LICENSE`
  file and updated the README and the About dialog to match.

## v0.10.0 — 2026-09-25

- **Replaced the Google sign-in with an access key.** The popup sign-in
  was awkward and, with the OAuth app in "Testing" mode, blocked anyone
  who wasn't a listed test user. Now you type an access key; a small
  Cloudflare Worker (`worker/`, "inferrd-auth") checks it and returns a
  short-lived, read-only Earth Engine token minted from a service account.
  The service-account private key lives only in the Worker as a secret.
  Tokens are renewed automatically before they expire, and there's an
  optional "Remember on this device". Keys can be added or revoked per
  person by editing one Worker secret.
- Removed the Google Identity Services script, the OAuth client ID, the
  popup watchdog and the "use your own Earth Engine account" wording.
- The Worker is deployed at `inferrd-auth.rutherfordecology.workers.dev`. Its service
  account needs only the project's Earth Engine roles (Resource Viewer + Service
  Usage Consumer) — no separate Earth Engine registration was required.
  Setup notes are in `worker/README.md`.

## v0.9.3 — 2026-09-19

- **Added a "Buy me a coffee" link**, matching Occurd: in the header next
  to the occurd. link (same gold), plus a line in the About dialog.

## v0.9.2 — 2026-09-19

- **Added an optional 12-month moving mean to the monthly chart.** A new
  "Overlay" selector on the monthly detail card chooses between the
  existing dashed trend line (still the default), a 12-month moving mean,
  or nothing. The moving mean is a centred 12-month window, so it
  averages out the seasonal wave and shows the slower change underneath.
  Months lost to cloud just mean fewer points in a window; a point needs
  at least 3 real months to be drawn, and the line breaks across gaps
  rather than bridging them.

## v0.9.1 — 2026-09-19

- **Added a statistical comparison between areas.** The multi-area view
  now has an "Are the areas different from each other?" table with one
  row per pair of areas, comparing them year by year over the years both
  have data for. "Level" is an exact Wilcoxon signed-rank test on the
  yearly differences (is one area consistently higher?); "Gap over time"
  is a Mann-Kendall test on the differences (is the gap widening or
  narrowing?). Exact rather than approximate because there are only
  about 5-10 paired years; at least 6 shared years are needed to reach
  p < 0.05. Yearly means are treated as independent, and with 3+ areas
  the extra pairs raise the false-positive risk — the on-screen note says
  so.

## v0.9.0 — 2026-09-19

- **Added the QEII covenant layer, behind a Projects dropdown**, matching
  Occurd: a key-gated "Projects" menu in the header (same key as Occurd)
  that shows QEII National Trust covenant boundaries on the map, with a
  popup per covenant (number, type, area, registered date, TA, region).
  The boundaries are fetched live from QEII's public ArcGIS service for
  the current map view and refresh as you pan and zoom — no covenant data
  is stored in inferrd. Covenants sit under the drawn areas and index
  tiles, and stop intercepting clicks while you're drawing a shape. Once
  unlocked, choosing QEII again toggles the layer on and off.

## v0.8.8 — 2026-09-19

- **The explanatory text in the left column can now be minimised.** Each
  hint and the note at the bottom of the sidebar has a small chevron
  toggle ("Explanation") above it that collapses or expands it. Your
  choice is remembered between visits.

## v0.8.7 — 2026-09-19

- **The index in use is now named in the chart title**, e.g. "Vegetation
  index over time (EVI) — comparing 2 areas", on both the single-area and
  multi-area charts.
- **Added a "Y-axis starts at 0" option to the multi-area comparison
  charts** (yearly and monthly). It previously existed only on the
  single-area chart. It extends the axis down to 0 and never crops data.

## v0.8.6 — 2026-09-19

- **"This area's range" now uses one shared range across all drawn
  areas.** Each area used to be stretched to its own 2nd–98th percentile,
  so with two areas the same colour meant different values and they
  couldn't be compared. The percentiles are now taken over all areas
  together and applied to every tile, and the legend shows those shared
  min/max values whenever more than one area is drawn. With a single area
  it behaves as before.

## v0.8.5 — 2026-09-19

- **The index button being previewed on the map now gets a black
  border.** The preview only ever shows one index (the first selected),
  which wasn't obvious when several were active. The border appears while
  the preview is visible and clears on Hide.

## v0.8.4 — 2026-09-19

- **Fixed the map preview showing the old year after changing the year.**
  Since v0.8.3 made Hide keep the tiles loaded, changing the year and
  pressing Show just un-faded the previous year's tiles. Changing the
  year, season months, cloud threshold or index now reloads a visible
  layer straight away, and drops a hidden one so Show fetches fresh tiles.

## v0.8.3 — 2026-09-19

- **Added an opacity slider to the map preview, and Hide no longer
  discards the layer.** Hide used to remove the tiles, so Show had to
  fetch them from Earth Engine again. It now just makes them transparent
  (tiles stay loaded), and Show brings them back instantly. The slider
  fades the index layer over the aerial imagery; dragging it while the
  layer is hidden brings it back. Changing scale mode or drawing/removing
  an area still reloads the layer, as before.

## v0.8.2 — 2026-09-19

- **Removing an area now removes it from the results too.** Previously
  deleting an area from the list left its line, table row and stats on
  screen. Multi-area results now drop that area from the chart, legend
  and tables (and collapse to the single-area view when one is left);
  single-area and multi-index results for the removed area are cleared.
  Uses the data already fetched, so no new Earth Engine call.

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
