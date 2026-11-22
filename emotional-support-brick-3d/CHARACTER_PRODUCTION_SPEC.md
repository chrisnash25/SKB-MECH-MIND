# Emotional Support Brick — character production acceptance criteria

Reference: user's original ten-character team artwork (22 Nov 2026). Do not substitute AI reinterpretations or simplified brick primitives for the approved character designs.

## Release policy
Build and review ONE character at a time in this order: Bricko, Rusty, Pulse, Calm, Spark, Blocky, Cozy, Zapp, Echo, Gizmo. Do not publish the replacement cast into the playable game until all ten models and their unique voice profiles pass QA. Preserve the currently playable version until then.

## Visual acceptance
- Exact recognizable front silhouette, proportions, brick studs, facial features, clothing, accessories, footwear, colours and material finishes from the original art.
- Fully modelled three-dimensional bodies, not textured flat cards or a single coloured cuboid.
- Separate articulated limbs, facial expression and mouth controls, plus PBR materials and texture maps.
- Compare side-by-side screenshots against the original for each character. Because source artwork has only a frontal view, back and side geometry must be inferred without changing visible front details.
- Reject models that lack visible signature accessories or substitute generic clothing.

## Individual signatures
1. Bricko: orange brick, red BRICKO cap, black headphones at neck, orange hands, red/white trainers; positive energetic supportive male voice.
2. Rusty: weathered rusty brown brick, brass/blue goggles, tool harness and boots; witty sarcastic loyal male voice.
3. Pulse: dark brick, cyan/magenta glowing circuit patterns, over-ear headphones; musical excitable male voice.
4. Calm: blue brick, knitted blue beanie, blue-grey hoodie with white lotus, relaxed eyes; gentle reassuring male voice.
5. Spark: yellow brick, dark star-shaped glasses, pink daisy hoodie, bracelets; playful confident male voice.
6. Blocky: grey textured brick, large black glasses, book, muted outfit; curious analytical male voice.
7. Cozy: pink brick, fluffy cream robe, heart mug, eyelashes; warm nurturing female voice.
8. Zapp: vivid green brick, black sports headband, lightning marks, trainers; fast motivating male voice.
9. Echo: purple galaxy brick, cyan-lit headphones, glowing spiral emblem; reflective imaginative female voice.
10. Gizmo: orange/yellow brick, navy mechanic cap, work belt, gloves, wrench, red trainers; practical inventive male voice.

Voice casting above is the planned eight-masculine/two-feminine allocation, subject to approval of voice tests. Every voice must be audibly distinct.

## Rig and animation acceptance
Idle, walk, run, turn, jump, sit, talk, blink, eye look, smile, surprise, laugh, wave, gesture and personality-specific reactions. Test all clips in the actual game, verify no limb detachment, model flicker, broken materials, frozen poses or uncontrolled rotation.

## Workflow QA
For each model: export GLB; inspect glTF structure, textures, skeleton and animation tracks; render front/side/back and compare to reference; run browser WebGL smoke tests; test keyboard/gamepad input and audio; fix and rerun on failure. A successful CI exit code alone does not prove visual fidelity or voice quality.

## Deployment
Stage ten assets and voice profiles; integrate them together in one game update after all ten are accepted. Keep rollback available. Verify public URL, loaded models, audible unique voices, working conversations and responsive animation before declaring release.
