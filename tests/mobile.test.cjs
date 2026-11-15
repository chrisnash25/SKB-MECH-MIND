// Browser-based mobile smoke regression. This tests the actual index.html, not a standalone mock.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_BIN});
  try {
    for (const width of [320, 360, 390, 430, 768]) {
      const page = await browser.newPage({viewport:{width,height:844}, isMobile:true, hasTouch:true});
      const errors=[];
      page.on('pageerror', error=>errors.push(error.message));
      try {
        await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
        await page.locator('#app button').first().waitFor();
        const check = async (stage) => {
          const result=await page.evaluate(() => ({
            viewport:document.documentElement.clientWidth,
            scroll:document.documentElement.scrollWidth,
            app:document.querySelector('#app')?.getBoundingClientRect().width,
            buttons:[...document.querySelectorAll('#app button')].filter(b=>{
              const r=b.getBoundingClientRect();
              return r.width>0 && r.height>0 && getComputedStyle(b).visibility!=='hidden';
            }).map(b=>({text:b.innerText.slice(0,40),width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))
          }));
          assert.ok(result.scroll <= result.viewport+2, `Horizontal overflow at ${width}px / ${stage}: ${JSON.stringify(result)}`);
          assert.ok(result.app>0, `Missing app at ${width}px / ${stage}`);
          assert.ok(result.buttons.length>0, `No visible buttons at ${width}px / ${stage}`);
          for(const button of result.buttons) assert.ok(button.width>=24 && button.height>=24,
            `Unusable mobile target at ${width}px / ${stage}: ${JSON.stringify(button)}`);
        };
        await check('home');
        await page.getByRole('button',{name:/Battle Arena/}).first().tap();
        await check('arena');
        await page.getByRole('button',{name:/Start offline battle/}).tap();
        assert.ok((await page.locator('#app').innerText()).includes('ROUND 1/5'), 'Offline round did not start');
        await check('offline round');
        assert.deepEqual(errors,[],`Browser exceptions at ${width}px`);
        console.log(`PASS: mobile navigation and layout at ${width}px`);
      } catch(error) {
        await page.screenshot({path:`mobile-failure-${width}.png`,fullPage:true}).catch(()=>{});
        throw error;
      } finally {await page.close()}
    }
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
