# SKB MECH MIND — Firebase Spark multiplayer setup (phone-only)

The existing GitHub Pages game now contains a Firebase web client, at \`multiplayer.js\`, using the Firebase project **mech-mind**. The firebaseConfig provided in Firebase Console is **public client configuration**, not a private service-account key. Do not add administrator keys to this repository.

## Activate the free backend

1. Open [Firebase Console](https://console.firebase.google.com/project/mech-mind/overview), select **Mech Mind**, and confirm **Spark (no billing)**.
2. Go to **Build → Authentication → Get started → Sign-in method**. Enable **Anonymous** and save. Opponents need no email/password.
3. Go to **Build → Firestore Database → Create database**. Choose **Standard edition**, a European database location and **Production mode**. Do **not** use Test mode: its broadly permissive rules are unsafe.
4. Open **Firestore Database → Rules**. Replace the starter rule text with the full contents of [firestore.rules](./firestore.rules) and click **Publish**. The rules file being in GitHub does **not** automatically deploy it to Firebase.
5. In **Authentication → Settings → Authorized domains**, add \`chrisnash25.github.io\` if it is not already allowed. No slash, path or \`https://\` prefix.
6. Open https://chrisnash25.github.io/SKB-MECH-MIND/ → **Battle Arena → Online invitation setup**. Name yourself, create an invitation and send the link to another phone.
7. On the other phone, open the link and choose **Join this battle**. Both phones answer the same ten engineering questions. Each answer is cryptographically committed before being revealed after both have submitted.

**You do not need npm, Firebase Hosting, Google Analytics, a Firebase plugin or a payment card** for this Spark version.

## What is implemented

- Anonymous Firebase sign-in and persistent identity on each browser.
- Firestore document for each ten-round match, with a high-entropy, seven-day invitation URL.
- First-join claims the guest slot transactionally, limited to two players by rules.
- Live document subscriptions, reconnect/resume and separate player answers.
- SHA-256 answer commitments: a player's cleartext is uploaded only after both players have locked their commitments. Lost browser-local pending answers can be forfeited so a battle is not stranded.
- Matching engineering subjects, full/partial credit (140/70 points) and final winner.
- Existing offline modes and saved progress remain independent.

## Important limitations

- **Casual, not anti-cheat:** canonical questions and scoring run in the open-source browser, not a trusted server. A determined player can inspect answers or modify their local code. This is unsuitable for ranked or prize-bearing competitions. Proper authoritative scoring requires trusted server code, generally beyond this Firebase Spark-only architecture.
- There is no automatic match expiry deletion. Expiry prevents further joins/answer writes, but saved documents remain and occupy quota until cleaned up.
- Match results are not copied to local Workshop statistics.
- These repository files and simulated browser tests alone do not prove the real Firebase database or its rules are deployed. The user must activate Firestore and publish rules in their Firebase project. Run actual two-device checks after that.

## Troubleshooting

- **"Anonymous sign-in is not enabled"**: Authentication → Sign-in method → Anonymous → Enable.
- **"Firestore access was denied"**: Check that the database exists and the exact rules in \`firestore.rules\` were published.
- **Invite opens but cannot join**: Open it on a separate browser/device, not the host's own Firebase anonymous session.
- **Online game doesn't appear**: Confirm GitHub Pages has deployed the new \`multiplayer.js\`; reload the site.
- **"Rules failed to publish"**: Keep the existing Production rules unchanged, copy the error text and report it. Do not use \`allow read, write: if true\` to bypass the error.

## Testing

The GitHub Actions regression suite includes:
- \`tests/game.test.cjs\` — original offline gameplay safeguards.
- \`tests/multiplayer.test.cjs\` — TWO independent browser contexts against a mocked in-memory Firebase API. It covers invitations, joining, all ten rounds, lock/reveal and score reporting.

The mock is not an integration test against live Firebase security rules. Confirm the CI result in GitHub Actions, then test with two genuine devices.
