const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
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
      return { count:DB.length, entries, informal, incorrect, savedKey:localStorage.getItem('skb_mech_v2') !== null };
    });
    assert.equal(results.count, 67, 'Question bank size unexpectedly changed');
    for (const item of results.entries) {
      assert.equal(item.correct.ok, true, 'Correct technical name rejected: '+item.name);
      assert.equal(item.wrong.ok, false, 'Nonsense accepted: '+item.name);
    }
    assert.equal(results.informal.ok, true);
    assert.equal(results.informal.partial, true);
    assert.equal(results.incorrect.ok, false);
    await page.getByRole('button', { name: /Battle Arena/ }).click();
    await page.getByRole('button', { name: /Online invitation setup/ }).click();
    assert.equal(await page.locator('#onlineName').inputValue(), 'Chris');
    assert.match(await page.locator('#app').innerText(), /Rounds:\s*10/);
    assert.equal(await page.getByRole('button', { name: /Create secure invitation/ }).isDisabled(), true);
    await page.getByRole('button', { name: /Battle Arena/ }).first().click();
    await page.getByRole('button', { name: /Start offline battle/ }).click();
    assert.match(await page.locator('#app').innerText(), /ROUND 1\/5/);
    assert.equal(errors.length, 0, 'Browser JS errors: '+errors.join('; '));
    console.log('PASS: 67 technical answers, 67 nonsense answers, partial credit, contradiction, invitation safety, offline navigation, browser JS.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
