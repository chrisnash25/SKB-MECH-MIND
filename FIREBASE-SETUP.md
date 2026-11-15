# SKB MECH MIND — Firebase Spark multiplayer setup (phone-only)

The existing GitHub Pages game now contains a Firebase web client, at \`multiplayer.js\`, using the Firebase project **mech-mind**. The firebaseConfig provided in Firebase Console is **public client configuration**, not a private service-account key. Do not add administrator keys to this repository.

## Activate the free backend

1. Open [Firebase Console](https://console.firebase.google.com/project/mech-mind/overview), select **Mech Mind**, and confirm **Spark (no billing)**.
2. Go to **Build → Authentication → Get started → Sign-in method**. Enable **Anonymous** and save. Opponents need no email/password.
3. Go to **Build → Firestore Database → Create database**. Choose **Standard edition**, a European database location and **Production mode**. Do **not** use Test mode: its broadly permissive rules are unsafe.
4. Open **Firestore Database → Rules**. Replace the starter rule text with the full contents of [firestore.rules](./firestore.rules) and click **Publish**. The rules file being in GitHub does **not** automatically deploy it to Firebase.
5. In **Authentication → Settings → Authorized domains**, add \`chrisnash25.github.io\` if it is not already allowed. No slash, path or \`https://\` prefix.
6. Open https://chrisnash25.github.io/SKB-MECH-MIND/ → **Battle Arena → Online invitation setup**. Name yourself, create an invitation and send the link to another phone.
7. On the other phone, open the link and choose **Join this battle**. Both phones receive the same ten engineering questions. Choose **Live Duel** to reveal each round after both answer, or **Independent Battle** to reveal the final results after both have completed all ten rounds.

**IMPORTANT AFTER THE NOVEMBER 15 UPDATE:** The new Independent Battle delayed-reveal implementation requires the **latest** [firestore.rules](./firestore.rules) to be published again in Firebase Console. Updating this GitHub file does **not** update your Firebase project. Older rules will reject new `sealed-v1` Independent Battle invitations. Live Duel remains unchanged.

**You do not need npm, Firebase Hosting, Google Analytics, a Firebase plugin or a payment card** for this Spark version.

## What is implemented

- Anonymous Firebase sign-in and persistent identity on each browser.
- Firestore document for each ten-round match, with a high-entropy, seven-day invitation URL.
- First-join claims the guest slot transactionally, limited to two players by rules.
- Live document subscriptions, reconnect/resume and separate player answers.
- **Live Duel:** SHA-256 answer commitments; cleartext is uploaded after both players lock each round. If locally saved pending answers are lost, the affected round can be forfeited.
- **Independent Battle (new `sealed-v1` matches):** each answer is stored immediately in an immutable, access-controlled Firestore document, written atomically alongside the round commitment. Security Rules deny all reads of these answers until both players have submitted the tenth answer; the other player can therefore finish later even if the first player's browser is closed. Legacy Independent Battle matches retain their earlier behaviour.
- Matching engineering subjects, full/partial credit (140/70 points) and final winner.
- Existing offline modes and saved progress remain independent.

## Important limitations

- **Casual, not anti-cheat:** canonical questions and scoring run in the open-source browser, not a trusted server. A determined player can inspect answers or modify their local code. This is unsuitable for ranked or prize-bearing competitions. Proper authoritative scoring requires trusted server code, generally beyond this Firebase Spark-only architecture.
- There is no automatic match expiry deletion. Expiry prevents further joins/answer writes, but saved documents remain and occupy quota until cleaned up.
- Match results are not copied to local Workshop statistics.
- The real Firebase project and deployed rules remain **unverified** because the project console is not connected here. GitHub Actions tests mock-browser multiplayer, and now also exercise the rules using a **local Firebase Firestore emulator**. An emulator result does not prove the project has published those rules. Activate Firestore, publish the current rules and run an actual two-device test.

## Troubleshooting

- **"Anonymous sign-in is not enabled"**: Authentication → Sign-in method → Anonymous → Enable.
- **"Firestore access was denied"**: Check that the database exists and the exact rules in \`firestore.rules\` were published.
- **Invite opens but cannot join**: Open it on a separate browser/device, not the host's own Firebase anonymous session.
- **Online game doesn't appear**: Confirm GitHub Pages has deployed the new \`multiplayer.js\`; reload the site.
- **"Rules failed to publish"**: Keep the existing Production rules unchanged, copy the error text and report it. Do not use \`allow read, write: if true\` to bypass the error.

## Testing

The GitHub Actions regression suite includes:
- \`tests/game.test.cjs\` — original offline gameplay safeguards.
- \`tests/multiplayer.test.cjs\` — two independent browser contexts against a mock Firebase API. Covers both Live Duel and Independent Battle; for Independent Battle, verifies no early reads and result delivery to a guest after the host browser closes.
- \`tests/firestore-rules.test.cjs\` — tests against the **real local Firestore rules emulator** (anonymous/authenticated read permissions, ordered immutable answer writes, delayed reveal and non-participant denial). The CI workflow starts the emulator with \`firebase.json\`.

The mock is not an integration test against live Firebase security rules. Confirm the CI result in GitHub Actions, then test with two genuine devices.
