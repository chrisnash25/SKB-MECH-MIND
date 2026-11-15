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
