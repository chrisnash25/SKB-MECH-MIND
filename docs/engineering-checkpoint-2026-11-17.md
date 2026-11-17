# Engineering loop checkpoint — 2026-11-17

Source: [failed regression run 44067609074](https://github.com/chrisnash25/SKB-MECH-MIND/actions/runs/44067609074), Python step (8 tests: 5 passed, 2 failed, 1 error). This is actual CI evidence, not local or production verification.

## P0 — Daily XP replay exploit (fixed; awaiting CI)
Reproduce: open Daily Discovery, submit correct answer for +140 XP, reload and submit same answer. Expected: +0 XP and no repeat award. Actual on baseline: +140 XP. Root cause: startup best-score sanitation discarded every score above 100 although legitimate awards are 140/180 or higher. Fix: accept valid stored scores up to 1000 in index.html, commit 238229ac. Verify with test_daily_replay and reload persistence checks; investigate remaining numeric validation edge cases.

## P1 — Python offline battle test stale locator (fixed; awaiting CI)
Reproduce: run Python test_battle. Expected: offline pass-and-play executes five rounds. Actual: 30-second timeout looking for obsolete Create secure button; UI now exposes Start offline battle and Online invitation setup. Fix: test offline path directly, commit 3ceb0f9e. Test real online flow separately using Firebase emulator rather than assuming optional backend state.

## P1 — Lab screen-reader feedback truncated (fixed; awaiting CI)
Reproduce: submit incorrect Mechanism Lab explanation and compare #feedback visible text with #screenReaderStatus. Expected: complete explanatory feedback announced. Actual: only evaluator reason announced, excluding follow-up guidance. Fix: announce feedback element's full visible text, commit 238229ac. Verify with Python accessibility regression and physical Android TalkBack when available.

## Verification and next steps
Latest head at checkpoint: 3ceb0f9e. GitHub Actions run 44085724941 queued/pending at last observation; do not claim pass. CI concurrency cancels superseded pushes. After result: read failed job logs, fix genuine regressions, re-run full JavaScript, Python, Firebase emulator and multiplayer suites. Independently review 67 subjects, mobile, scoring, security, accessibility and deployed runtime. No physical Android or production Firebase verification performed in this checkpoint.

## 13:43–13:46 UTC follow-up — Python accessibility assertion
[Run 44085724941](https://github.com/chrisnash25/SKB-MECH-MIND/actions/runs/44085724941) completed with browser-tests failure. Node game/mobile/keyboard/mechanism/persistence stages passed; Python 7 passed, 1 failed. Reproduce with `python -m unittest discover -s tests -p 'test_*.py' -v`: `test_screen_reader_status_survives_navigation_and_lab_feedback` compares raw `#feedback.inner_text()` (contains paragraph newlines) against `#screenReaderStatus.inner_text()` (whitespace collapsed). Expected: equivalent spoken words; actual: raw substring assertion fails despite all words present. Fix commit b25c564a normalizes whitespace on both sides; no gameplay change. CI on new commit is not yet verified. The failed Python step skipped downstream Firebase/multiplayer stages, so their status is untested in this run. Next: inspect fresh CI, confirm all stages, then production-equivalent multiplayer and Android TalkBack checks. Physical device and deployed app remain unverified.
