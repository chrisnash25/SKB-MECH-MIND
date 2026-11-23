# DROPZONE — Tesco Extra Frontage Graphics Overhaul: Phase 1
**Status: APPROVED PLAN — NOT YET IMPLEMENTED**  
**Art direction:** [LOCKED Option C / Hybrid Realism](ART_DIRECTION_OPTION_C.md) · 23 November 2026  
**Scope:** Tesco Extra storefront, its canopy, immediate pedestrian approach, pavement/kerb/parking transition, nearby lighting and street furniture. **Do not rebuild the whole town in this first release.**

## Existing baseline (verified from published build metadata and release workflow)
- Current published binary was built **20 Nov 2026**. `dropzone/BUILD_INFO.txt` describes the **red serif TESCO**, **five blue marks/slashes**, **italic blue “extra”**, on an **outside-facing wave canopy**, plus the original Yate splash, MP3, McDonald's, retail master and Xbox inputs.
- Existing source/export references in `.github/workflows/publish-retail-master.yml` include: `main.tscn`, `world/streets.json` (73 shop placements in the release checks), `world/retail_furniture.json` (11 bollards, 8 lamps, 3 parking signs at the full retail dataset level), `assets/signage/tesco_wordmark.png`, `assets/signage/shops_atlas.png`, `tests/retail_smoke.gd`, `tests/tesco_sign_smoke.gd` and `tests/gamepad_smoke.gd`.
- The repo currently contains a **published Web export**, not necessarily the complete latest *editable* Godot source. Do not confuse `dropzone/index.pck` with editable scene files.
- Some historic releases used an expiring signed ZIP URL; **locate/checksum the source archive afresh** before any build. Do not rerun an old workflow expecting an expired link to work.

## Definition of done
Three **real in-engine** before/after paired views prove the same camera and lighting configuration. At player height, the Tesco Extra fascia is recognizable and legible; canopy, glazing, entry, pavement, kerbs, car-park approach and contact shadows have convincing depth. No clipping, severe texture stretching, wrong-facing signs or building collisions. Smoke, web export, desktop/browser, phone-viewport and input checks all pass; physical devices assessed when available. Source ZIP and screenshots retained for rollback.

## Work packages, in execution order

### P0 — Source recovery, reference pack and rollback (blocker)
- [ ] Identify the **latest complete editable** Godot project archive (prefer the already QA-checked source from the graphics task / Library/Drive); verify SHA256, Godot import and Tesco smoke baseline.
- [ ] Inventory current `main.tscn`, Tesco model / materials / signage resources and `world/streets.json`. Record the actual node paths/coordinates; **do not invent geometry locations**.
- [ ] Preserve a read-only `before` source ZIP and the currently working `dropzone/` web release. Work on an isolated branch or source copy.
- [ ] Gather approved user-supplied Tesco frontage photographs / screenshots and map reference; note focal length, perspective, sign placement, canopy profile, entry bay, glazing/pier layout, colours. Where the precise detail is missing, label it **estimated** rather than inventing "photo-exact" dimensions.
- [ ] Capture 3 baseline renders from **fixed cameras** (A: approach at pedestrian height; B: shop sign/canopy close-up; C: footpath/kerb/car park), with world transforms, FOV, viewport, daylight settings, asset revision in a JSON manifest.
**Gate G0:** full project compiles and baseline renders stored before editing.

### P1 — Architectural silhouette and sign
- [ ] Rebuild/adjust the **curved outdoor canopy**, soffit thickness, fascia/backing, side trims, supports and contact geometry to reference proportions.
- [ ] Keep the **large, front-facing TESCO / five blue slashes / italic extra** as the focal point; use sharp atlas/signage textures at realistic aspect and UV scale. Verify direction and readability from camera A and B.
- [ ] Add depth: recessed glazed entrance, frame/mullions, piers, parapet, shopfront setbacks, roof edges and clean bevels. Avoid decorative geometry where the photographs do not support it.
- [ ] Check doorway, sidewalk and building collision; ensure the player can traverse the existing approach and doesn't clip the canopy.
**Gate G1:** existing `tests/tesco_sign_smoke.gd` and traversal/collision tests pass; photo-reference review documents remaining assumptions.

### P2 — Materials, pavement, lighting and focal-point polish
- [ ] Replace placeholder-looking wall/cladding material with photo-matched **PBR albedo/roughness/normal** where supported by the web renderer; texture scale consistent across adjacent bays.
- [ ] Improve facade glazing (frame depth, tinted/translucent glass as appropriate, interior darkness and cheap non-SSR reflections); retain sight lines.
- [ ] Improve immediate asphalt/pavement/kerb transition with tiling, slab joints, asphalt breakup, road paint, seams, surface decals and clean shadow contact.
- [ ] Place/adjust already-grounded nearby bollards, lamps, signs, drainage/street furniture and shop planters only where reference evidence supports them; no arbitrary prop scattering.
- [ ] Apply Option C daylight: warm neutral highlights, cooler shaded areas, plausible ambient fill, soft directional shadows, no strong cartoon bloom or ultra-saturated materials.
**Gate G2:** same-camera A/B/C comparison shows materially improved depth without losing the Tesco identity.

### P3 — Optimisation and scalable quality
- [ ] Merge/reuse common architectural materials where practical, atlas shop signage, cull invisible faces and use economical mesh/collision representations.
- [ ] Capture pre/post p50 and p95 frame times, browser memory symptoms, resolution, asset size and startup time. Test graphics **High / Balanced / Performance** (no false claim of universally achievable 1080p).
- [ ] On mobile, use capped internal resolution when required; test touch input together with a visible scene. Verify web Compatibility/WebGL2; do not rely on Godot Forward+-only effects.
**Gate G3:** no unrecoverable WebGL errors/context loss, and any performance regression is measured, disclosed or fixed rather than ignored.

### P4 — Regression QA, proof and controlled publication
- [ ] Run clean Godot 4.6.3 import, short startup smoke, `tests/tesco_sign_smoke.gd`, `tests/retail_smoke.gd`, `tests/gamepad_smoke.gd`; verify all existing scene references resolve.
- [ ] Confirm **73 store locations**, retail furniture dataset, McDonald's graphics, pre-existing splash and Yate soundtrack remain intact; no unintended changes to controls, map or combat.
- [ ] Export Web, verify `index.html`, `index.js`, `index.wasm`, `index.pck`; open public test URL, press **START GAME**, watch resource responses and screenshot actual rendered scene. Do not call a page that only returns HTTP 200 a gameplay pass.
- [ ] Run desktop at **1920×1080 when available**, mobile portrait and landscape browser viewports, and actual Galaxy S21 / Xbox browser only when accessible. Record unsupported/unverified hardware explicitly.
- [ ] Deliver: updated editable project archive, before/after 3-camera image pairs, side-by-side checklist, asset diffs, test log, measured FPS/loading where available and a **new verified** playable URL. Keep the previous build accessible for rollback.
**Gate G4:** signed-off evidence; only then merge/publish to the canonical `dropzone/` site.

## Scene capture manifest (template)
```json
{
  "location": "Tesco Extra Yate, UK",
  "baselineCommit": "ebb5a0f5a",
  "sourceSha256": "verify-current-project-archive",
  "view": "A-pedestrian-approach",
  "cameraTransform": "copy actual Godot transform, no guessing",
  "fovDegrees": "capture actual value",
  "viewport": [1920, 1080],
  "sunTime": "fixed between before/after",
  "qualityTier": "High",
  "referencePhoto": "actual filename / evidence / inferred notes"
}
```

## Acceptance scorecard
| Criterion | Pass standard |
| --- | --- |
| Identity | Exact approved **TESCO, five blue slashes, italic extra** placement/style retained |
| Street realism | Canopy, entry recess, glazing, sidewalk and kerb have clear 3D depth at human-eye camera |
| Visual proof | Matching A/B/C camera coordinates and daylight, actual rendered images, no synthetic "after" |
| Traversal | Player, camera and collisions behave on approach and entry frontage |
| Stability | Godot imports/exports cleanly, browser launches actual game, no script parse errors |
| Preservation | McDonald's, 73-shop retail dataset, Xbox/touch mapping, Yate splash/music intact |
| Performance | Report measured before/after frame times/load; 30 FPS mobile and 60 FPS desktop **targets**, not guarantees |
| Reversibility | Original verified package saved; published version easy to roll back |

## First implementation sprint (smallest vertical slice)
1. Recover verified editable source and record existing Tesco coordinates, materials and camera positions.
2. Produce three **before** in-engine screenshots and capture reference/camera manifest.
3. Replace/upgrade only **Tesco sign, canopy geometry and entrance glazing**; no broad world edits.
4. Run Tesco, retail, gamepad and browser smoke checks.
5. Capture three **after** shots; check side by side and record differences.
6. If all gates pass, extend to asphalt, paving, bollards and sunlit material pass; otherwise correct the milestone and retest.

## Other graphics phases (master backlog, *not part of Tesco Phase 1*)
- [ ] **McDonald's / West Walk:** frontage, neighbours, forecourt, lamps, parking.
- [ ] **Street kit:** tarmac, slab paving, kerbs, crossing/parking marks, puddle/edge wear (contextual only).
- [ ] **North Walk:** cladding, varied canopies, 73-shop signage atlas, glazing/doors.
- [ ] **Street detail:** grounded prop placement, bollards, benches, bins, parking signs, trees/hedges.
- [ ] **Characters and vehicles:** materials, proper gait/idle, collision foot contact, car variety.
- [ ] **HUD and atmosphere:** Xbox/mobile visual UI, minimap, shadows, sky and quality modes.
- [ ] **Final QA:** stable game and matched before/after visuals with representative device benchmarks.

**Current playable version (before):** https://chrisnash25.github.io/SKB-MECH-MIND/dropzone/  
**Existing release commit:** `ebb5a0f5a` (20 Nov 2026).  
**Note:** This is an executable plan, not a statement that the Tesco overhaul is already implemented.
