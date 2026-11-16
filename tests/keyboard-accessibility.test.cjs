// Keyboard accessibility smoke test against the real game page.
// Tests native button focus and Enter activation, not a simulated UI.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_BIN});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    const battle = page.getByRole('button',{name:/Battle Arena/}).first();
    assert.ok(await battle.count(),'Battle Arena control missing');
    await battle.focus();
    assert.equal(await battle.evaluate(el=>document.activeElement===el),true,'Battle Arena button cannot receive keyboard focus');
    await page.keyboard.press('Enter');
    assert.ok(await page.getByRole('button',{name:/Start offline battle/}).count(),'Keyboard Enter did not open Battle Arena');
    const start = page.getByRole('button',{name:/Start offline battle/});
    await start.focus();
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('ROUND 1/5'),'Keyboard Enter did not start offline battle');
    assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
    console.log('PASS: keyboard focus and Enter activate Battle Arena and offline play');
    await page.close();
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
