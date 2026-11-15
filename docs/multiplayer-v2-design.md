# SKB Mech Mind — Multiplayer 2.0 design specification

Status: approved design, not deployed functionality. Existing online Live Duel and offline modes must remain working.

## Player access
- Guests: anonymous Firebase session; random matchmaking in either Live Duel or Independent Battle; no friend targeting or permanent public ranking.
- Registered: Google sign-in first; Facebook sign-in only after Meta OAuth configuration; public nickname, avatar, engineering rank, friends, invitations, persistent battle history and cross-device progression.
- Guest-to-account upgrade must link the anonymous Firebase identity where possible, migrate existing local progress deliberately, and never overwrite higher-value progress silently.
- Public profile exposes nickname, avatar ID, earned badges, rank and selected battle statistics; never expose email or authentication provider identifiers.

## Avatar catalogue
- Source of truth: user's numbered 50-character Mech Mind avatar collection (IDs 01–50).
- Image assets: `assets/avatars/avatar-01.webp` through `avatar-50.webp`; `assets/avatars/manifest.json`.
- The asset pack is prepared separately and must be uploaded before a UI references these paths.
- Avatar selection is independent of XP rank and engineering specialisation. Default catalogue selectable; future cosmetics may be unlockable.
- Never accept arbitrary external avatar URLs as public profile images without appropriate validation.

## Battle Arena
- Offline Battle: preserve existing five-round local pass-and-play.
- Live Duel: preserve current 10-round shared-question mode. Once both answers are committed, reveal promptly using realtime listeners rather than waiting for a timeout; measure actual delay before changing.
- Independent Battle: same seeded set of 10 questions for both players; each answers at own pace; no correctness feedback or opponent answers until both have finished; simultaneous final reveal of correct answers, scores and winner.
- Random Match: queue guests and registered players by selected mode, transactionally claim one opponent, prevent double matching, expire abandoned queue entries, handle disconnects and allow consensual rematches.
- Friends: registered players can send, accept and remove friend requests and challenge specific friends. Existing private invite links remain functional during transition.

## Progression
- Draft XP rank thresholds (subject to balancing): Apprentice 0, Technician 500, Engineer 1500, Specialist 4000, Master Engineer 10000, Engineering Legend 25000.
- Separate per-subject mastery from global XP; avoid equating XP with verified competence.
- Example profile shows nickname, avatar, rank, XP progress, wins, losses, accuracy, achievements and optional public battle history.
- Leaderboards require trusted score adjudication; existing client-calculated scores must not be treated as tamper-proof ranked results.

## Firebase data model (proposal, not live schema)
- `profiles/{uid}`: public nickname, avatarId, rank, XP, createdAt, visibility; authenticated write with field validation.
- `userPrivate/{uid}`: account preferences and private metadata; owner-only.
- `friendRequests/{id}`: senderUid, recipientUid, status, timestamps; recipient-only acceptance.
- `matchQueue/{uid}`: mode, state, expiresAt; atomic matchmaking with server timestamps.
- `matches/{matchId}`: mode, participants, question seed/IDs, state, completion flags, timestamps.
- `matches/{matchId}/answers/{uid_round}`: participant's locked response; deny opponent reads until final reveal or use separate server-owned reveal document.
- `rankedResults/{matchId}`: server-verified results only.

## Security and delivery gates
1. Keep Firebase anonymous sign-in and current `firestore.rules` working during migration.
2. Add Google account login and player profile with nicknames and avatar IDs.
3. Deploy the 50 user-supplied avatar files and manifest; verify all 50 load on Android.
4. Implement Independent Battle with tests for independent progress, hidden answers, reconnect and both-finished reveal.
5. Fix and measure Live Duel reveal latency; ensure no regression.
6. Add queue-based random matchmaking and guest restrictions.
7. Add friends, direct challenges, rematches and sharing.
8. Add ranked leaderboards only after trusted result verification.
9. Test both Android browsers and two independent devices; verify Firestore rules against unauthorized reads/writes.

## Compatibility requirements
- Preserve existing localStorage game progress and existing offline modes.
- Existing battle invite URLs must keep opening correctly.
- Mobile-first UI with accessible touch targets and no controls obscured by Android navigation.
- No new paid Firebase services without explicit approval.
