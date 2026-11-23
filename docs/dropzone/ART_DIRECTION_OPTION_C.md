# DROPZONE / Yate Free Roam — Art Direction v1.0
**Status: LOCKED — Option C · 23 November 2026**  
**Art target:** Semi-realistic British urban environment with premium stylised readability — approximately **80% GTA-inspired grounded realism / 20% Fortnite-inspired clarity**, a *creative shorthand*, not a render-technology ratio.

## Vision
Make Yate town centre **recognisable first**, **visually striking second**, and **playable on supported hardware third**. This is an original visual identity, not an attempt to copy GTA/Fortnite assets. The world must look credible at street level while keeping readable shapes, store signage, player silhouettes, UI and interaction cues.

### Immutable pillars
1. **Place fidelity:** preserve the real-world arrangement where supported by supplied reference photography and map evidence; mark inferred dimensions, shop bays and geometry explicitly. Do not invent exact survey measurements. Existing Tesco, McDonald's, West Walk, North Walk, shops and parking are landmarks to improve, not replace with fictional designs.
2. **Materials with depth:** plausible PBR roughness, texture-scale consistency, glass, cladding, tarmac, concrete, brickwork, trims, edge grime, normal maps and light response. Avoid smooth flat placeholder faces or repeating textures.
3. **Sunlit cinematic clarity:** contemporary south-west England daytime look, directional sun, balanced skylight, soft directional shadows, clear foreground/background depth, highlights protected, no oversaturated neon or permanent wet-road look.
4. **Selective stylisation:** slightly stronger colour separation, readable silhouettes, contrast around the player and major landmarks; architectural proportions and signage remain grounded.
5. **Gameplay readability:** pedestrians, player, roads, pedestrian paths, collision edges and interactable targets visually distinguishable; HUD remains legible without obstructing gameplay.
6. **Measured performance:** Xbox browser and Android phone/browser need budgeted quality tiers. 1080p is the *high-quality output target where supported*, not a guaranteed mobile render resolution or a claim of GTA-level assets.

## Colour and lighting guide
| Surface / element | Direction | Approximate palette (starting points, adjust against reference) |
| --- | --- | --- |
| Asphalt | neutral charcoal with aggregate, patching and faint tyre wear | #34383A / #4A4B4A |
| Concrete paving | warm/neutral grey with restrained slab joints and edge wear | #858482 / #ACAAA3 |
| Kerbs / markings | lighter readable edges; worn off-white road paint | #C0BDB7 / #E4E0D5 |
| Shop glazing | dark neutral glass with subtle sky/interior reflections and depth | #34454C / #657A80 |
| Cladding / masonry | colour matched to local references, moderate roughness, real texture scale | photo-derived, not a fixed brand colour |
| Vegetation | muted UK green, diverse leaf values; no fluorescent green | #53694B / #78905E |
| TESCO identity | red serif TESCO, five blue marks, italic blue “extra” | **match approved photographed signage; don't approximate by palette alone** |
| Visual accents | warm highlights, cooler shadows, stronger local contrast | restrained, not cartoon neon |

**Lighting pass:** choose one repeatable midday/late-afternoon daylight configuration for comparisons. Prefer a clear partly-cloudy appearance, soft but readable shadows, sensible exposure and tone mapping, balanced ambient fill and light probes or baked solutions that work in Godot's **Compatibility/WebGL2** pipeline. Avoid depending on unsupported Forward+ screen-space effects in the web build. Improve reflections using economical environment/material techniques rather than assuming SSR.

## Geometry, texture and visual quality rules
- **Hero landmarks** (Tesco canopy/sign, McDonald's frontage, recognizable intersections): custom modular geometry, clean bevels, glazing recesses, architectural depth and dedicated UVs. Prioritise camera-visible facades.
- **Reused architecture:** shopfront kit with façade wall, pier, glazing, entry recess, fascia strip, canopy, soffit, parapet, rear/service wall; preserve the approved 73-shop placement dataset unless changes are evidence-based.
- **Street surfaces:** appropriate-scale tiling, subtle roughness variation and decals for seams, road paint and wear; correct kerb heights/collision before decorating. No decal z-fighting.
- **Props:** sensible ground contacts, dimensions consistent with pedestrians, varied placement; bollards, lamps, parking signs, bins, benches, planters and barriers.
- **Textures:** reference-driven albedo, normal and roughness where possible. Starting budgets: 1–2K for hero surfaces, 512–1K for shared props, atlases for repeated shop signs; tune from measured device memory, not visual guesswork.
- **Models:** use shared modular meshes and materials, culled hidden faces, simple collision, distance detail/culling where supported. Avoid needless draw calls and high-poly detail invisible on a phone.
- **Character direction:** semi-realistic anatomy/clothing, clean silhouettes, coherent foot contact and soft shadows; no rigid placeholder animation. Character work follows the first environment milestone.
- **HUD:** Xbox-style face buttons and maps retain easy-to-read labels and accessible touch sizing. Visual polish must not break input behaviour.

## Quality tiers and acceptance targets
| Tier | Target | Strategy |
| --- | --- | --- |
| High | Up to 1920×1080 on a capable desktop/browser; aim for smooth 60 FPS | full landmark detail, higher resolution, appropriate shadow quality |
| Balanced | Galaxy S21/mobile browser / Xbox browser; **target** stable ~30 FPS | adaptive render resolution, restrained shadows/vegetation, atlased textures |
| Performance | lower-power devices | lower internal resolution, fewer far props/decals, reduced effects |

These are **targets**, not benchmark claims. Record device/browser, internal resolution, average and worst-percentile frame times, loading time, memory symptoms, WebGL errors and any context loss. If a target cannot be met, ship a quality toggle rather than hiding performance degradation.

## Protection rules
- Never remove current Tesco/McDonald's shop-sign details, existing map, retail placements, working touch/Xbox controls, Yate Free Roam splash or MP3 as a side effect of this graphics pass.
- Don't change gameplay/weapon/control scripts unless a documented graphics regression requires it.
- Preserve a known-good release and ship through a separate test/build pipeline with a reversible commit.
- No "looks like Fortnite/GTA" claim without real in-game 1080p captures and representative device results.

## Proof standard / change control
Capture **before and after from the same in-engine camera** (position, target, FOV, viewport, time of day, resolution), including a medium street approach, signage close-up and player-height sidewalk view. Include source reference notes, screenshot artifacts, changed asset inventory, Godot import/runtime tests, browser startup, and mobile/input regression checks. Declare any unresolved reference mismatch; do not pass a build only because assets exist.

## Phase priority
1. **Tesco Extra hero frontage + approach** — define the quality benchmark.
2. McDonald's / West Walk and neighbouring bays.
3. Roads, pavement, kerbs, car park and furniture.
4. North Walk / retail parade, repeatable building modules and vegetation.
5. Pedestrian/player animations, vehicles, HUD polish and broader optimisation.

**Canonical implementation plan:** [Tesco Extra Phase 1](TESCO_EXTRA_PHASE_1_PLAN.md).  
**Current live reference:** https://chrisnash25.github.io/SKB-MECH-MIND/dropzone/  
**Existing release evidence:** `dropzone/BUILD_INFO.txt`; `.github/workflows/publish-retail-master.yml`.
