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
    // Traverse actual keyboard tab order: programmatic .focus() alone can
    // pass even when a control is unreachable by keyboard-only players.
    let battleReached=false;
    for(let i=0;i<40;i++){
      await page.keyboard.press('Tab');
      if(await battle.evaluate(el=>document.activeElement===el)){
        battleReached=true;
        break;
      }
    }
    assert.ok(battleReached,'Battle Arena is not reachable through keyboard Tab navigation');
    // Keyboard focus must be visibly identifiable, not merely reachable.
    // The game defines a 3px focus-visible outline for buttons.
    const focusAppearance=await battle.evaluate(el=>{
      const style=getComputedStyle(el);
      return {width:parseFloat(style.outlineWidth),style:style.outlineStyle,color:style.outlineColor};
    });
    assert.ok(focusAppearance.width>=2 && focusAppearance.style!=='none',
      'Battle Arena lacks a visible keyboard focus outline: '+JSON.stringify(focusAppearance));
    await page.keyboard.press('Enter');
    assert.ok(await page.getByRole('button',{name:/Start offline battle/}).count(),'Keyboard Enter did not open Battle Arena');
    const start = page.getByRole('button',{name:/Start offline battle/});
    // Do not programmatically focus Start: that would mask a broken tab order.
    // After the Battle Arena view replaces the home view, a keyboard-only
    // player must still be able to reach the offline start action.
    let startReached=false;
    for(let i=0;i<40;i++){
      await page.keyboard.press('Tab');
      if(await start.evaluate(el=>document.activeElement===el)){
        startReached=true;
        break;
      }
    }
    assert.ok(startReached,'Start offline battle is not reachable by Tab after opening Battle Arena');
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('ROUND 1/5'),'Keyboard Enter did not start offline battle');
    // Verify actual keyboard-only answer entry and submission, not just navigation.
    // A user must be able to Tab into the answer field, type, Tab to Lock answer,
    // and submit using Enter without mouse or programmatic focus.
    const answer = page.locator('#battleAnswer');
    let answerReached=false;
    for(let i=0;i<40;i++){
      await page.keyboard.press('Tab');
      if(await answer.evaluate(el=>document.activeElement===el)){answerReached=true;break;}
    }
    assert.ok(answerReached,'Battle answer field unreachable by Tab');
    const expectedAnswer=await page.evaluate(()=>game.pool[game.round].name);
    await page.keyboard.type(expectedAnswer);
    assert.equal(await answer.inputValue(),expectedAnswer,'Keyboard typing did not reach answer field');
    const lock=page.getByRole('button',{name:'Lock answer'});
    let lockReached=false;
    for(let i=0;i<40;i++){
      await page.keyboard.press('Tab');
      if(await lock.evaluate(el=>document.activeElement===el)){lockReached=true;break;}
    }
    assert.ok(lockReached,'Lock answer button unreachable by Tab');
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('Answer locked'),
      'Keyboard Enter did not submit the offline battle answer');
    assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
    console.log('PASS: keyboard focus and Enter activate Battle Arena and offline play');
    await page.close();
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
