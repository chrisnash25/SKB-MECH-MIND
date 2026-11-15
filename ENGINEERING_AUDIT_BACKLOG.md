## Engineering follow-up — 15 November 2026 (invitation ownership)

- Confirmed GitHub Actions game regression run 43771388381 **success** for expanded question-ID rules tests (commit 99898c44); Pages deployment 43771403236 **success** for fa2a8e69. CI browser tests and local Firestore emulator are not production Firebase or physical-device validation.
- Reviewed the current workflow, game and mobile test suites, Firestore rules and existing handoff. Identified a missing explicit security regression: unauthenticated invitation creation and forged `hostUid` attempts were not exercised in the emulator suite, although rules require authenticated creator identity.
- Added real emulator assertions rejecting anonymous and forged-host invitation creation and accepting a valid invitation created by the second authenticated user (commit ee7074c8). GitHub accepted the change. **New CI run result pending**; do not claim these assertions passed until the corresponding workflow completes.
- Next: inspect the workflow for ee7074c8; investigate any failures. Verify production Firestore rules deployment and two-device asynchronous battles, then expand expiry/reconnect, forged reveal, mechanism accuracy, accessibility and cross-project coverage. Preserve player progress and never deploy Firebase rules without production compatibility checks.

## Follow-up engineering run — 15 November 2026

- Inspected latest repository head 93db4dd, Firestore rules, emulator test and workflow. Prior regression run 43761002202 passed. Production Firebase and two real phones remain unverified.
- P1 question-index integrity: new-match creation formerly accepted duplicate, string and out-of-range IDs. Added explicit integer bounds 0..66 and uniqueness for ten IDs (commit f7091566). The 67-question count must be revised if the catalogue grows.
- Added Firebase emulator regressions for duplicate, out-of-range, negative and string IDs, plus valid distinct IDs including 66 (commit adf761b6).
- CI run 43765831359 was pending at last check; do not claim these tests passed until its result is confirmed. Prior rules-only run 43765821836 was in progress.
- Release gate: repository rules are not automatically published to production Firebase. Publish only after verified emulator results and compatibility review. Existing matches are not rewritten.
- Next: check CI 43765831359, fix failures, verify real deployed gameplay, production rules, two-device authentication/reconnect/expiry and forged answers; continue mobile, accessibility, mechanism and cross-project audits.

# Engineering audit backlog

## Engineering loop handoff — 2026-11-15, subsequent run

- **Verified prior change:** GitHub Actions [43765831359](https://github.com/chrisnash25/SKB-MECH-MIND/actions/runs/43765831359) completed successfully for commit `adf761b6`, including browser regression, mobile layout, persistence, two-context simulated multiplayer, and real Firestore rules emulator steps. This is not evidence of production Firebase rules deployment or two physical phones.
- **Expanded regression:** commit `99898c44` adds rejected match-creation cases for nine or eleven question IDs, fractional, null and boolean indices; adds a second valid boundary-range selection. The production rule is unchanged. GitHub accepted the commit, but its new workflow [43771388381](https://github.com/chrisnash25/SKB-MECH-MIND/actions/runs/43771388381) was queued when checked; do not label it passed until confirmed.
- **Highest release blocker:** The updated `firestore.rules` has not been verified as deployed to the production Firebase project. GitHub Pages deployment success does not deploy Firestore rules. Verify production permissions and two real-device delayed Independent Battles before describing production multiplayer as secure or complete.
- **Further priorities:** Add explicit expired-match and reconnect coverage; verify all 67 puzzle animations and partial-credit semantics in deployed Android browsers; inspect accessibility, performance and other authorised projects in separate evidence-backed passes. No live credentials or Firebase production data were accessed.


## Latest engineering handoff — 15 November 2026, approximately 20:48–21:00 UTC

**Fix delivered: Independent Battle now supports delayed results without both phones being online together.** Previously, the first player had to reconnect after the other finished to disclose locally stored answers. A fully completed host could leave a match stranded. This violated the asynchronous battle requirement. The new `sealed-v1` protocol writes each immutable answer to Firestore atomically with its corresponding commitment; Security Rules deny retrieval until each participant has written their tenth answer. New matches use the protocol; existing matches continue using the legacy flow.

**Code:** [client `56766445`](https://github.com/chrisnash25/SKB-MECH-MIND/commit/56766445e88d3448a2c16fb1455223482f634e69), [rules `559d4205`](https://github.com/chrisnash25/SKB-MECH-MIND/commit/559d420573847bbbf72c7024b14e74a8b9396219), [two-browser test `1cf7eb4b`](https://github.com/chrisnash25/SKB-MECH-MIND/commit/1cf7eb4b755242a1dd91cc284563604b99532384), emulator setup and test `4d96b430` / `4f11a31f`, CI update `87d52af9`, setup guide update `b74b2a95`.

**Execution evidence:** [GitHub Actions run 43761002202](https://github.com/chrisnash25/SKB-MECH-MIND/actions/runs/43761002202) completed successfully at approximately 20:59 UTC. The following checks actually ran and passed: 67 engineering name answers and 66 concept examples; mobile navigation/overflow at widths 320/360/390/430/768 px; saved-progress recovery; Live Duel across two browser contexts; Independent Battle host finishing ten rounds then closing browser while the guest finishes; read attempt before both complete returning denial in the simulated backend; and the **real local Firebase Firestore emulator** rejecting premature reads, outsider access, out-of-order answer writes, impersonation and answer overwrites, then permitting both participants to read all 20 documents after completion. Browser game checks use a simulated backend; rules checks use the actual local Firestore emulator. Neither constitutes a test against the production Firebase project.

**Release gate — required user/project action:** The latest `firestore.rules` file must be **published in the Mech Mind Firebase console** before any new Independent Battle invitations can use `sealed-v1`. The GitHub repository is not connected to Firebase deployment permissions; no live production rules deployment is verified. Live multiplayer with two real phones is not verified. Keep a visible distinction between CI, local emulator and production. No service credentials were requested or stored.

**Remaining highest priorities:**
1. P0: Publish/test actual project Firestore rules; test two independent real devices with host closing browser before guest completes, plus failure/reconnect cases and permissions.
2. P1: Validate all ten question indices and uniqueness in Firestore match creation rules, including adversarial inputs and legacy compatibility.
3. P1: Test malicious players submitting forged commitments or bypassing expected flow; ranked authoritative scoring requires a trusted backend beyond client-only Spark.
4. P1: Ensure expired or abandoned matches are cleaned up without accidental quota/cost escalation, and provide visible expiry/reconnect handling.
5. P1: Automated cross-browser visual checks, mechanism accuracy, interactive gameplay on Android and coverage of independent mid-battle reconnect.
6. P2: Add caching for the Firestore emulator in GitHub Actions to avoid unnecessary downloads; migrate CI dependency installation to reproducible lock files.

---


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
