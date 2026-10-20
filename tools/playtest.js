// Plays through a full game in headless Chromium and saves screenshots.
// Usage: node tools/playtest.js <screenshot-dir> [width] [height]
// Needs the "playwright" npm package. Prints state checks; ends with "errors: none" on success.
const { chromium } = (function () { try { return require('playwright'); } catch (e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const SP = process.argv[2], W = +process.argv[3] || 1024, H = +process.argv[4] || 552;
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: W, height: H }, hasTouch: true, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await page.goto('file://' + require('path').resolve(__dirname, '../www/index.html'));
  await page.waitForTimeout(800);
  const shot = n => page.screenshot({ path: require('path').join(SP, W + 'x' + H + '-' + n + '.png') });
  await shot('01-setup');
  await page.tap('.cnt[data-n="3"]');
  await page.fill('#pn0', 'Haylie'); await page.fill('#pn1', 'Sam');
  await page.tap('#pRows .prow:nth-child(2) .sw.green');   // Sam picks green (swap)
  await shot('02-setup-filled');
  await page.tap('#btnStart'); await page.waitForTimeout(300);
  await page.tap('.chip[data-c="PHRASE"]');
  await page.fill('#inPz', "IT'S A GREAT DAY FOR A CUP OF COFFEE");
  await page.waitForTimeout(200);
  await shot('03-loader');
  await page.tap('#mOk'); await page.waitForTimeout(300);
  await shot('04-board');
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(WOC.state())));
  // spin onto wedge 0 (a value wedge)
  await page.evaluate(() => WOC.forceSpin(0));
  await page.waitForTimeout(1500); await shot('05-spinning');
  await page.waitForTimeout(5800); await shot('06-landed');
  await page.waitForTimeout(2500);
  let s = await st(); const v = s.pending; console.log('pending', v, 'wheel', s.wheel.join(','));
  await page.tap('.key:text-is("F")');   // F appears 4 times: FOR, OF, COFFEE x2
  await page.waitForTimeout(1700); await shot('07-lit');
  await page.waitForTimeout(2500); await shot('08-revealed');
  s = await st(); console.log('after F: cur', s.cur, 'round', s.players[0].round, 'expected', v*4);
  // buy a vowel
  await page.tap('.key:text-is("A")'); await page.waitForTimeout(4500);
  s = await st(); console.log('after A: cur', s.cur, 'round', s.players[0].round, 'expected', v*4-200);
  // consonant without spin -> toast
  await page.tap('.key:text-is("T")'); await page.waitForTimeout(200); await shot('09-toast-spin-first');
  await page.waitForTimeout(2000);
  // spin -> value, pick letter not in puzzle -> next player
  await page.evaluate(() => WOC.forceSpin(1)); await page.waitForTimeout(9500);
  await page.tap('.key:text-is("Z")'); await page.waitForTimeout(1800);
  s = await st(); console.log('after Z miss: cur', s.cur, '(expect 1)');
  // bankrupt (wedge 5) for player 1
  await page.evaluate(() => WOC.forceSpin(5)); await page.waitForTimeout(7000); await shot('10-bankrupt');
  await page.waitForTimeout(2500);
  s = await st(); console.log('after bankrupt: cur', s.cur, '(expect 2)');
  // lose a turn (wedge 11)
  await page.evaluate(() => WOC.forceSpin(11)); await page.waitForTimeout(7000); await shot('11-lose');
  await page.waitForTimeout(2500);
  s = await st(); console.log('after lose: cur', s.cur, '(expect 0)');
  await shot('12-before-solve');
  await page.tap('#btnSolve'); await page.waitForTimeout(1200); await shot('13-solved-confetti');
  await page.waitForTimeout(3000);
  s = await st(); console.log('after solve: total p0', s.players[0].total, 'solved', s.reg.solved);
  await page.tap('#btnSolve'); await page.waitForTimeout(400); await shot('14-cleared');
  s = await st(); console.log('after clear: reg', s.reg, 'cur', s.cur);
  // bonus round
  await page.tap('#btnMenu'); await page.waitForTimeout(200); await shot('15-menu');
  await page.tap('.mitem:text-is("BONUS ROUND")'); await page.waitForTimeout(300);
  await page.tap('.chip[data-c="THING"]');
  await page.fill('#inPz', 'ESPRESSO MACHINE');
  await page.tap('#mOk'); await page.waitForTimeout(300);
  await shot('16-bonus');
  await page.tap('#bBtnRst'); await page.waitForTimeout(2500);
  for (const L of ['C','H','M','O']) { await page.tap(`.key:text-is("${L}")`); await page.waitForTimeout(150); }
  await shot('17-bonus-picks');
  await page.tap('#bBtnRev'); await page.waitForTimeout(2500); await shot('18-bonus-revealed');
  await page.tap('#bBtnTimer'); await page.waitForTimeout(3200); await shot('19-timer');
  await page.waitForTimeout(7300); await shot('20-timer-fail-midreveal');
  await page.waitForTimeout(2500); await shot('21-bonus-failed');
  s = await st(); console.log('bonus finished', s.bonus.finished, 'won', s.bonus.won, 'hidden', s.bonus.cells.filter(c=>!c.s).length);
  // reload -> resume
  await page.reload(); await page.waitForTimeout(600); await shot('22-reload-setup');
  await page.tap('#btnResume'); await page.waitForTimeout(400); await shot('23-resumed');
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
