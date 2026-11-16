// Regression for the first home tile, Mechanism Lab: Next experiment must
// actually change the mechanism and use all four before any repeat.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_BIN});
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.getByRole('button',{name:/Mechanism Lab/}).tap();
    await page.getByRole('button',{name:/Ratchet and pawl/}).tap();
    let seen = [];
    for(let n=0;n<12;n++){
      const name=await page.evaluate(()=>game?.q?.name);
      assert.ok(name,'No active mechanism');
      if(seen.length) assert.notEqual(name,seen.at(-1),'Next experiment repeated '+name);
      const cycle=seen.slice(Math.floor(n/4)*4);
      assert.ok(!cycle.includes(name), 'Repeated '+name+' before finishing all four mechanisms');
      seen.push(name);
      await page.getByRole('button',{name:/Reveal & learn/}).tap();
      await page.getByRole('button',{name:/Next experiment/}).tap();
    }
    // The first cycle must cover every available interactive machine.
    assert.deepEqual([...new Set(seen.slice(0,4))].sort(),['Ratchet and pawl','Cam and follower','Crankshaft','Rack and pinion'].sort());
    // Manual selection also must not cause the next random experiment to
    // immediately repeat the one the player deliberately selected.
    await page.getByRole('button',{name:/Change machine/}).tap();
    await page.getByRole('button',{name:/Cam and follower/}).tap();
    await page.getByRole('button',{name:/Reveal & learn/}).tap();
    await page.getByRole('button',{name:/Next experiment/}).tap();
    assert.notEqual(await page.evaluate(()=>game?.q?.name),'Cam and follower');
    // Every manually selected machine must start a fresh non-repeating cycle.
    // This catches queue-state bugs hidden by testing only one selected machine.
    for(const selected of ['Ratchet and pawl','Cam and follower','Crankshaft','Rack and pinion']){
      await page.getByRole('button',{name:/Change machine/}).tap();
      await page.getByRole('button',{name:selected,exact:false}).tap();
      const manualCycle=[];
      for(let round=0;round<4;round++){
        const active=await page.evaluate(()=>game?.q?.name);
        assert.ok(active,'Missing active mechanism after selecting '+selected);
        assert.ok(!manualCycle.includes(active),'Duplicate '+active+' in cycle starting at '+selected);
        manualCycle.push(active);
        await page.getByRole('button',{name:/Reveal & learn/}).tap();
        await page.getByRole('button',{name:/Next experiment/}).tap();
      }
      assert.equal(manualCycle[0],selected,'Manual selection did not load '+selected);
      assert.equal(new Set(manualCycle).size,4,'Not all four mechanisms visited from '+selected);
    }
    assert.deepEqual(errors,[],'Browser JavaScript errors: '+errors.join('; '));
    console.log('PASS: Mechanism Lab next button rotates all four machines across three full cycles, including manual selection and mobile taps.');
  } finally {
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
