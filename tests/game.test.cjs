const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_BIN });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    assert.match(await page.locator('#app').innerText(), /Battle Arena/);
    const results = await page.evaluate(() => {
      const entries = DB.map(q => ({ name:q.name, correct:evaluate(q.name,q), wrong:evaluate('banana spaceship nonsense',q) }));
      const ratchet = DB.find(q => q.name === 'Ratchet and pawl');
      const informal = evaluate('gear and latch', ratchet);
      const incorrect = evaluate('the gear and latch makes it spin faster', ratchet);
      const harmonic = DB.find(q => q.name === 'Harmonic drive');
      const harmonicNames = ['A Strain weave gear.', 'strain wave gear', 'strain wave gearing', 'strain wave gearbox', 'strain wave transmission'];
      const harmonicResults = harmonicNames.map(answer => ({answer, result:evaluate(answer,harmonic)}));
      const harmonicWrong = evaluate('thermal compound',harmonic);
      const concepts = DB.filter(q => partialConcepts[q.name]).map(q => { const sample=partialConcepts[q.name].map(g=>g[0]).join(' ')+' mechanism'; return {name:q.name, sample, result:evaluate(sample,q)}; });
      return { count:DB.length, entries, informal, incorrect, harmonicResults, harmonicWrong, concepts, savedKey:localStorage.getItem('skb_mech_v2') !== null };
    });
    assert.equal(results.count, 67, 'Question bank size unexpectedly changed');
    for (const item of results.entries) {
      assert.equal(item.correct.ok, true, 'Correct technical name rejected: '+item.name);
      assert.equal(item.wrong.ok, false, 'Nonsense accepted: '+item.name);
    }
    assert.equal(results.informal.ok, true);
    assert.equal(results.informal.partial, true);
    assert.equal(results.incorrect.ok, false);
    for (const item of results.harmonicResults) assert.equal(item.result.ok, true, 'Harmonic drive synonym rejected: '+item.answer);
    assert.equal(results.harmonicWrong.ok, false, 'Unrelated harmonic-drive answer accepted');
    assert.equal(results.concepts.length, 66, 'Expected 66 subject-specific concept rules');
    for (const item of results.concepts) assert.equal(item.result.ok, true, 'Concept example rejected: '+item.name+' — '+item.sample);
    // Regression: Mystery Vault answer must have an explicit accessible name.
    // Test the rendered page, not only a source-string assertion.
    await page.getByRole('button', { name: /Mystery Vault/ }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Engineering subject answer' }).count(), 1,
      'Mystery Vault answer lacks its expected accessible name');
    await page.getByRole('button', { name: /Workshop/ }).click();
    await page.getByRole('button', { name: /Battle Arena/ }).click();
    await page.getByRole('button', { name: /Online invitation setup/ }).click();
    assert.equal(await page.locator('#onlineName').inputValue(), 'Chris');
    assert.match(await page.locator('#app').innerText(), /Rounds:\s*10/);
    assert.equal(await page.getByRole('button', { name: /Create secure invitation/ }).isDisabled(), true);
    await page.getByRole('button', { name: /Battle Arena/ }).first().click();
    await page.getByRole('button', { name: /Start offline battle/ }).click();
    assert.match(await page.locator('#app').innerText(), /ROUND 1\/5/);
    // Exercise actual UI correction controls and ensure score deltas are reversible.
    const correctName=await page.evaluate(()=>game.pool[0].name);
    await page.locator('#battleAnswer').fill(correctName);
    await page.getByRole('button',{name:'Lock answer'}).click();
    await page.getByRole('button',{name:'Next player'}).click();
    await page.locator('#battleAnswer').fill('banana spaceship nonsense');
    await page.getByRole('button',{name:'Lock answer'}).click();
    await page.getByRole('button',{name:'See round result'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[140,0],'Initial battle scores incorrect');
    await page.getByRole('button',{name:'Change to correct'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[140,140],'Manual acceptance did not credit Player 2');
    await page.getByRole('button',{name:'Change to incorrect'}).nth(1).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[140,0],'Manual reversal double-counted Player 2');
    await page.getByRole('button',{name:'Change to incorrect'}).first().click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[0,0],'Manual rejection did not debit Player 1');
    await page.getByRole('button',{name:'Next round'}).click();
    assert.match(await page.locator('#app').innerText(), /ROUND 2\/5/);
    assert.deepEqual(await page.evaluate(()=>game.scores),[0,0],
      'Corrected scores changed unexpectedly when advancing to round 2');
    // A fresh battle exercises hint penalties and manual corrections without
    // depending on the random engineering subject selected for round one.
    await page.evaluate(()=>startBattle());
    const hintedName=await page.evaluate(()=>game.pool[0].name);
    await page.getByRole('button',{name:'Hint',exact:true}).click();
    await page.getByRole('button',{name:'Hint',exact:true}).click();
    await page.getByRole('button',{name:'Hint',exact:true}).click();
    await page.locator('#battleAnswer').fill(hintedName);
    await page.getByRole('button',{name:'Lock answer'}).click();
    assert.deepEqual(await page.evaluate(()=>({hints:game.locked[0].hints,pts:game.locked[0].pts})),
      {hints:2,pts:90},'Hint penalty must be capped at two hints');
    await page.getByRole('button',{name:'Next player'}).click();
    await page.locator('#battleAnswer').fill(hintedName);
    await page.getByRole('button',{name:'Lock answer'}).click();
    await page.getByRole('button',{name:'See round result'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[90,140],
      'Player 2 must not inherit Player 1 hint penalty');
    await page.getByRole('button',{name:'Change to incorrect'}).first().click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[0,140],
      'Manual correction must remove the discounted score, not full points');
    await page.getByRole('button',{name:'Change to correct'}).first().click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[90,140],
      'Reversing manual correction must restore discounted points');
    await page.getByRole('button',{name:'Next round'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[90,140],
      'Hint-adjusted corrections must persist across round transition');
    // Subject-specific partial credit: verify real browser scoring and reversibility.
    // Fix the selected round subject to avoid dependence on shuffled puzzle order.
    await page.evaluate(() => {
      startBattle();
      game.pool[0] = DB.find(q => q.name === 'Ratchet and pawl');
      battle();
    });
    await page.locator('#battleAnswer').fill('gear and latch');
    await page.getByRole('button',{name:'Lock answer'}).click();
    assert.deepEqual(await page.evaluate(()=>({partial:game.locked[0].partial,pts:game.locked[0].pts})),
      {partial:true,pts:70},'Recognised informal mechanism answer must receive partial credit');
    await page.getByRole('button',{name:'Next player'}).click();
    await page.locator('#battleAnswer').fill('banana spaceship nonsense');
    await page.getByRole('button',{name:'Lock answer'}).click();
    await page.getByRole('button',{name:'See round result'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[70,0],
      'Partial credit must not award full points');
    await page.getByRole('button',{name:'Change to incorrect'}).first().click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[0,0],
      'Rejecting partial credit must debit only 70 points');
    await page.getByRole('button',{name:'Change to correct'}).first().click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[70,0],
      'Reinstating partial credit must restore exactly 70 points');
    await page.getByRole('button',{name:'Next round'}).click();
    assert.deepEqual(await page.evaluate(()=>game.scores),[70,0],
      'Partial-credit correction must persist into next round');
    assert.equal(errors.length, 0, 'Browser JS errors: '+errors.join('; '));
    console.log('PASS: 67 technical answers, 67 nonsense answers, 66 concept examples, partial credit, contradiction, invitation safety, offline navigation, browser JS.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
