// Persistent progress regression against the real game document.
// Requires: npm install playwright && npx playwright install chromium
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_BIN});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const seed={xp:47,solved:['Ratchet and pawl'],wins:3,losses:1,
      ideas:[{question:'How can gears save energy?',idea:'Reduce friction'}],
      bestScores:{'mechanism:Ratchet and pawl':47}};
    await page.evaluate(value=>localStorage.setItem('skb_mech_v2',JSON.stringify(value)),seed);
    await page.reload();
    assert.match(await page.locator('#app').innerText(),/47 XP/,'XP lost after reload');
    assert.match(await page.locator('#app').innerText(),/1 discoveries/,'Discovery count lost');
    await page.getByRole('button',{name:/My Workshop/}).click();
    const workshop=await page.locator('#app').innerText();
    assert.match(workshop,/Ratchet and pawl/,'Saved discovery missing');
    assert.match(workshop,/Reduce friction/,'Saved invention missing');
    await page.reload();
    assert.match(await page.locator('#app').innerText(),/47 XP/,'XP lost after second reload');
    // Malformed storage should not prevent app startup.
    await page.evaluate(()=>localStorage.setItem('skb_mech_v2','{invalid JSON'));
    await page.reload();
    assert.match(await page.locator('#app').innerText(),/0 XP/,'Malformed save was not reset safely');
    // Invalid stored shapes must not crash the application.
    await page.evaluate(()=>localStorage.setItem('skb_mech_v2',JSON.stringify({
      xp:-5,solved:'invalid',ideas:null,bestScores:[],wins:0,losses:0
    })));
    await page.reload();
    assert.match(await page.locator('#app').innerText(),/0 XP/,'Invalid XP not normalised');
    await page.getByRole('button',{name:/My Workshop/}).click();
    // Malformed invention entries must not crash the Workshop view.
    await page.evaluate(()=>localStorage.setItem('skb_mech_v2',JSON.stringify({
      xp:12,solved:[],ideas:[null,42,{}, {question:'Valid idea',idea:'Test the design'}],bestScores:{}
    })));
    await page.reload();
    await page.getByRole('button',{name:/My Workshop/}).click();
    assert.match(await page.locator('#app').innerText(),/Valid idea/,'Valid invention discarded');
    assert.doesNotMatch(await page.locator('#app').innerText(),/undefined/,'Invalid invention leaked into UI');
    // Preserve valid discoveries while excluding malformed entries; reset invalid battle totals.
    await page.evaluate(()=>localStorage.setItem('skb_mech_v2',JSON.stringify({
      xp:19,solved:[null,23,'Ratchet and pawl',{},'Cam and follower'],
      wins:-3,losses:'five',ideas:[],bestScores:{}
    })));
    await page.reload();
    assert.match(await page.locator('#app').innerText(),/2 discoveries/,'Malformed discoveries counted');
    await page.getByRole('button',{name:/My Workshop/}).click();
    const repaired=await page.evaluate(()=>({solved:data.solved,wins:data.wins,losses:data.losses}));
    assert.deepEqual(repaired,{solved:['Ratchet and pawl','Cam and follower'],wins:0,losses:0},
      'Invalid saved discovery or battle data not normalised');
    assert.deepEqual(errors,[],'Unexpected browser exceptions: '+errors.join('; '));
    console.log('PASS: saved XP, discoveries, inventions, reloads, malformed and invalid local storage');
    await context.close();
  } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
