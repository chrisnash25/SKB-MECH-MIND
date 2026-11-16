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
    // Accessible name must be explicit and identify the active player;
    // placeholder text alone is not a reliable screen-reader label.
    assert.equal(await page.getByRole('textbox',{name:'Engineering subject answer for Player 1'}).count(),1,
      'Player 1 battle answer lacks an accessible label');
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
    // Complete the second player's turn and reveal using only Tab and Enter.
    // This guards against a keyboard trap after the first answer is locked.
    async function tabTo(control,description){
      for(let i=0;i<40;i++){
        await page.keyboard.press('Tab');
        if(await control.evaluate(el=>document.activeElement===el)) return;
      }
      assert.fail(description+' unreachable through keyboard Tab');
    }
    await tabTo(page.getByRole('button',{name:'Next player'}),'Next player');
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('ROUND 1/5'),
      'Next player did not open the second turn');
    assert.equal(await page.getByRole('textbox',{name:'Engineering subject answer for Player 2'}).count(),1,
      'Player 2 battle answer lacks an accessible label');
    const secondAnswer=page.locator('#battleAnswer');
    await tabTo(secondAnswer,'Player 2 answer');
    await page.keyboard.type(expectedAnswer);
    assert.equal(await secondAnswer.inputValue(),expectedAnswer,'Player 2 keyboard answer mismatch');
    await tabTo(page.getByRole('button',{name:'Lock answer'}),'Player 2 Lock answer');
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('Both players have finished this round.'),
      'Player 2 answer was not locked');
    await tabTo(page.getByRole('button',{name:'See round result'}),'See round result');
    await page.keyboard.press('Enter');
    const reveal=await page.locator('#app').innerText();
    assert.ok(reveal.includes('Round 1 reveal'),'Keyboard reveal did not open');
    assert.ok(reveal.includes('Player 1:')&&reveal.includes('Player 2:'),
      'Round reveal does not show both scores');
    await tabTo(page.getByRole('button',{name:'Next round'}),'Next round');
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#app').innerText()).includes('ROUND 2/5'),
      'Keyboard Next round did not advance the battle');
    // Exercise the remaining four rounds entirely through real keyboard input.
    // A five-round completion catches focus traps and final-result regressions
    // that a one-round smoke test cannot detect.
    for(let round=2;round<=5;round++){
      assert.ok((await page.locator('#app').innerText()).includes('ROUND '+round+'/5'),
        'Round '+round+' did not load');
      const correct=await page.evaluate(()=>game.pool[game.round].name);
      for(let player=0;player<2;player++){
        const field=page.locator('#battleAnswer');
        await tabTo(field,'Round '+round+' player '+(player+1)+' answer');
        await page.keyboard.type(correct);
        assert.equal(await field.inputValue(),correct);
        await tabTo(page.getByRole('button',{name:'Lock answer'}),'Round '+round+' Lock answer');
        await page.keyboard.press('Enter');
        if(player===0){
          await tabTo(page.getByRole('button',{name:'Next player'}),'Round '+round+' Next player');
          await page.keyboard.press('Enter');
        }
      }
      await tabTo(page.getByRole('button',{name:'See round result'}),'Round '+round+' reveal');
      await page.keyboard.press('Enter');
      assert.ok((await page.locator('#app').innerText()).includes('Round '+round+' reveal'),
        'Round '+round+' result missing');
      await tabTo(page.getByRole('button',{name:round===5?'Final result':'Next round'}),
        'Round '+round+' advance');
      await page.keyboard.press('Enter');
    }
    assert.ok((await page.locator('#app').innerText()).includes('Battle drawn'),
      'Equal correct answers should produce a drawn final result');
    assert.equal(await page.evaluate(()=>game.round),5,'Final battle round not recorded');
    assert.equal(await page.evaluate(()=>game.locked.length),10,'Not all ten answers were recorded');
    assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('; '));
    console.log('PASS: keyboard-only five-round offline battle, ten answers, scores and final result');
    await page.close();
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
