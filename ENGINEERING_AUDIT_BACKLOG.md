# Engineering audit backlog

Updated: 2026-11-15 (UTC). Evidence level: repository API inspection only; no full deployed gameplay test completed in this audit.

## Audit scope and evidence
- Default branch contains `index.html` with a monolithic inline script, embedded WebP image data, responsive CSS, reduced-motion styles and SVG interaction styling (observed directly via GitHub file API).
- Root `package.json`, `README.md` and `src/` returned 404. `tests/` and `.github/workflows/` are directories; their contents were not enumerated by this audit.
- The page footer identifies an offline engineering alpha v0.3. This is a page label, **not proof** that online multiplayer is absent.
- No production browser, Firebase multiplayer, deployed application, mobile touch or all-subject regression result was executed in this audit. Do not infer that the standalone gear test verifies these areas.

## Prioritised work queue
| ID | Priority | Status | Requirement / risk | Reproduction / verification plan |
|---|---|---|---|---|
| E-001 | P0 | Open; unverified | End-to-end deployed game test coverage | Load https://chrisnash25.github.io/SKB-MECH-MIND/ in real Chromium/Firefox; record console/network errors; enter every mode, navigate, solve and retry puzzles; report actual results |
| E-002 | P0 | Open; unverified | Battle Arena and Firebase multiplayer | With two isolated browser profiles, verify matchmaking, synchronisation, scoring, reconnect, leave/rejoin and invalid/late messages; do not report pass without two-client execution |
| E-003 | P0 | Open; unverified | 67 engineering subjects and answer/scoring correctness | Enumerate actual subject/question catalogue from source, compare to requirements; exercise correct, wrong and partial-credit answers and score persistence; produce coverage matrix |
| E-004 | P1 | Browser smoke coverage added; CI result pending | Mobile viewport/touch/navigation and accessible controls | Execute Playwright mobile viewport tests, tap each interactive target, check clipping, focus order, contrast, keyboard and reduced-motion |
| E-005 | P1 | Open; unverified | Mechanism simulation including rack-and-pinion | Validate geometry and physical motion in deployed game, not just standalone HTML harness; exercise dragging, repeated cycles, reset and edge cases |
| E-006 | P1 | Open; unverified | Persistence and upgrades | Test save/load across refresh, offline/online transitions and code upgrades with existing user progress preserved |
| E-007 | P1 | Partial: mobile regression CI added; deployed smoke still open | Browser test infrastructure | Identify existing tests and CI; establish reproducible automated browser runs with artifact screenshots, assertions, failures and a deployment smoke test |
| E-008 | P2 | Open; static observation | Maintainability/performance of monolithic HTML and embedded image | Measure initial page bytes, parse/paint timings and image impact before proposing safe refactor; avoid unmeasured performance claims |
| E-009 | P1 | Open; unverified | Cross-project coverage | Inventory other explicitly authorised accessible repositories and create separate project-specific evidence/backlogs without assuming Mech Mind checks cover them |

## Closed-loop procedure
1. Select highest-impact actionable item with available evidence and permissions.
2. Diagnose and attempt a safe fix; if tooling fails, try another legitimate approach.
3. Execute tests and record command, environment, observed results and limitations.
4. Re-audit the **whole** application for regressions and improvements, then repeat while execution budget allows.
5. Never equate an isolated demonstration, static inspection or CI green badge with full deployed regression coverage.

## Audit history
- 2026-11-15: Retrieved default-branch `index.html`; checked root paths and attempted repository code searches (returned no results). Established the backlog. No production code changed; no browser/gameplay test run; all functional items remain unverified.

## 2026-11-15 follow-up engineering pass
- Read GitHub repository metadata, recent commits, workflow, `index.html`, `multiplayer.js`, and both existing browser test files. Existing `tests/game.test.cjs` asserts 67 questions and offline navigation; `tests/multiplayer.test.cjs` uses an in-memory Firebase mock and cannot validate production Firebase/rules.
- Added `tests/mobile.test.cjs` with real app page loading, five viewport widths (320, 360, 390, 430, 768), touch navigation to offline Battle Arena, horizontal-overflow assertions, visible control dimensions, and browser exception checks. The suite captures screenshots on failure.
- Updated `.github/workflows/game-tests.yml` to run this suite and upload failure screenshots. Commits: e19cb01, c85acd6, 56661db.
- Evidence limitation: GitHub accepted commits, but this automation environment could not clone GitHub directly (DNS resolution failure). New test execution and GitHub Actions outcome are **not verified**. Treat mobile coverage as newly implemented, not passed. CI may reveal assertions that need adjustment.
- Next: inspect Actions run for commit 56661db, fetch failure logs, fix any test or app regression; then expand independent-mode two-browser tests, production Firestore rules validation, deployment smoke tests and mechanism motion checks. Preserve progress and avoid claims that mocked multiplayer proves live service behaviour.

## 2026-11-15 continued pass: progress persistence
- Inspected actual home UI, localStorage parsing/normalisation, save function and existing browser suite. Added `tests/persistence.test.cjs` (commit `58edd046`) testing seeded XP, discovery and invention across reloads, malformed JSON recovery, invalid saved shapes and browser exceptions on the actual index.html.
- Integrated the persistence test into GitHub Actions workflow (commit `53583ed5`). Both commits were accepted by GitHub; CI outcome remains unverified. Do not label these new checks passed until a workflow result is inspected.
- Attempted to inspect workflow runs through the available interfaces; repository Actions web page could not be fetched in this environment and the connected GitHub API exposes jobs only with a known run ID. Next priority: obtain workflow run ID/status, inspect job logs, correct failures and expand deployed-app end-to-end coverage.

## 2026-11-15 independent engineering run: malformed invention recovery
- Root cause found by source inspection: saved `ideas` was only checked for array type, allowing null/non-object entries; the Workshop view dereferences `x.question` and `x.idea`, which can throw and leave the screen broken.
- Fixed initial saved-data normalization to retain only object entries with string `question` and `idea` fields. Commit `b112ea1ee5c4a299934420bbe0b1ddde80896629`.
- Added a browser regression in `tests/persistence.test.cjs` seeding null, numeric, empty-object and valid entries, checking Workshop loads and valid invention survives. Commit `8c19953f2fa31835a0089191e30042d54e2387b4`.
- Verification: GitHub accepted both commits; re-fetched production file, test file and CI workflow; confirmed fix, regression and CI command are present. Test source parsed as JavaScript. Chromium execution, GitHub Actions pass and production deployment remain **unverified**.
- Next: run CI browser suite and inspect logs; test malformed `solved` and numeric win/loss fields, investigate actual Firebase rules integration, and perform deployed mobile/desktop smoke checks. No user progress keys were renamed or reset.

## 2026-11-15 02:29 UTC engineering pass: saved-data hardening
- Inspected latest commits, production `index.html`, persistence browser regression, and existing backlog; confirmed prior browser/CI verification gaps remain.
- Found `solved` was validated only as an array, so malformed entries were counted as discoveries; `wins` and `losses` were not normalised, allowing invalid or negative battle totals. Expected: valid discovery names only, nonnegative integer totals. Reproduce: seed `skb_mech_v2` with `solved:[null,23,'Ratchet and pawl',{},'Cam and follower'],wins:-3,losses:'five'`, reload, inspect workshop and state.
- Production fix committed as `9d27a18bb1cb842aa60d98f4410fa6dc0ddd74eb`: filter non-string discovery entries; reset invalid wins/losses to zero while preserving valid saved values and storage key.
- Regression added as `bdadf4165097d7006aff1d0db91451daa7054e3d` in `tests/persistence.test.cjs`; checks two valid discoveries and repaired battle totals.
- Evidence: GitHub accepted both commits. This runtime could not clone repository (GitHub DNS resolution failed). Browser test execution, GitHub Actions result and deployed-game verification are NOT established. Next: run persistence test in CI, check actual output; inspect malformed `bestScores` values and real multiplayer authentication/rules; continue full 67-subject and deployed mobile audits.

## 2026-11-15 03:26 UTC engineering pass: best-score recovery
- Inspected recent commits, audit backlog, production persistence logic and browser regression. Open GitHub issues search returned none; repository README missing. Previous browser/CI/deployed verification remains open.
- Root cause: `bestScores` was validated as an object only. Invalid strings/negative values could be coerced or retained, interfering with XP award calculations. Reproduce by storing malformed best scores under `skb_mech_v2`, reloading and invoking `awardBest`.
- Fixed in `41d37d7a6b4a32f32166582fbbb69e32ef3c369b`: retain finite numeric best scores between 0 and 100; discard invalid entries, preserving valid progress and existing storage key.
- Added browser regression in `c483cb9dc30421e787cf87458b76d807c6cdc552`: reload malformed scores, verify valid entries survive and XP can be awarded after repair.
- Evidence: GitHub accepted both commits. Browser test, deployed behaviour, CI pass and two-client Firebase validation were NOT executed/verified. Next: execute CI regression, inspect logs, check game score maxima and actual Firebase security rules, then full 67-subject/mobile audit.

## 2026-11-15 20:48 UTC independent audit: CI and multiplayer trust boundary
- Retrieved latest eight commits (head `be5b053`), existing audit, `tests/persistence.test.cjs`, `.github/workflows/game-tests.yml`, `multiplayer.js`, and `firestore.rules` through authenticated GitHub API. No newer commits observed in this query. Direct `git clone --depth 1` failed: `Could not resolve host: github.com`; this is an execution-environment DNS failure, not evidence that GitHub or the application is down.
- **E-010 (P1, open, static finding):** `firestore.rules` allows any 10-element `questionIds` list on match creation, with no integer/range/uniqueness checks. Reproduction plan: authenticate against a disposable Firebase emulator, attempt match creation with `questionIds:['bad', ...]` and duplicate/out-of-range indices; expected denial of malformed question selections; current rule predicate appears to permit these if remaining fields are valid. Client currently generates indices using `shuffledIndices(env.DB.length)`, but a modified client can bypass it. Add rules constraints and emulator tests before production deployment; first confirm intended catalogue size and backwards compatibility.
- **E-011 (P1, open, static finding):** reveal writes are limited by ownership/shape but rules do not verify reveal against a prior SHA-256 commit. The client checks hashes; this is not server-enforced anti-cheat. Preserve casual-play positioning; for competitive integrity, implement a trusted adjudication service or explicitly accept this trust boundary. Test forged reveal against Firebase emulator and two real clients before making stronger claims.
- **E-012 (P1, open, test infrastructure):** workflow contains Playwright browser suites but no observed run result. Direct clone failed again; use GitHub Actions run logs/artifacts when run IDs become accessible. Do not claim these tests passed.
- No production code modified in this pass: rule changes without emulator verification could block existing legitimate matches. Next highest-value safe action is isolated Firebase rules emulator tests, followed by validated rules tightening, real two-profile gameplay and CI evidence. All 67 subjects, deployed UI, and cross-project inspection remain incomplete.
