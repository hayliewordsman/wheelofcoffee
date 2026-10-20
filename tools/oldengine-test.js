// Plays a full game in PhantomJS 1.9.8, whose QtWebKit 534.34 engine is close to the
// Android 4.2 WebView (WebKit 534.30). Catches JS errors and layout problems that modern
// browsers hide. Usage:
//   phantomjs tools/oldengine-test.js <screenshot-dir> [width] [height]
// Prints a state line per step; any "JS ERROR" or "MISSING" line is a failure.
var sys = require('system'), page = require('webpage').create(), OUT = sys.args[1];
var W = +(sys.args[2] || 1024), H = +(sys.args[3] || 552);
page.viewportSize = { width: W, height: H };
var log = [];
page.onError = function (msg, trace) { log.push('JS ERROR: ' + msg + (trace && trace[0] ? ' line ' + trace[0].line : '')); };
function pos(sel) {
  return page.evaluate(function (s) { var e = document.querySelector(s); if (!e) return null; var b = e.getBoundingClientRect(); if (!b.width) return null; return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
}
function click(sel) { var r = pos(sel); if (!r) { log.push('MISSING/HIDDEN ' + sel); return; } page.sendEvent('click', r.x, r.y); }
function clickText(sel, text) {
  var r = page.evaluate(function (s, t) { var es = document.querySelectorAll(s); for (var j = 0; j < es.length; j++) if (es[j].textContent === t) { var b = es[j].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } return null; }, sel, text);
  if (!r) { log.push('NO ' + sel + ' "' + text + '"'); return; } page.sendEvent('click', r.x, r.y);
}
function type(text) {
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i), label = ch === ' ' ? 'SPACE' : ch === '/' ? 'NEW LINE' : ch.toUpperCase();
    var r = page.evaluate(function (l) { var ks = document.querySelectorAll('#kb .kk'); for (var j = 0; j < ks.length; j++) if (ks[j].textContent.toUpperCase() === l) { var b = ks[j].getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; } return null; }, label);
    if (r) page.sendEvent('click', r.x, r.y); else log.push('no key ' + ch);
  }
}
function st(tag) {
  log.push(tag + ' ' + page.evaluate(function () {
    var s = WOC.state(); if (!s) return 'no state';
    return JSON.stringify({ busy: WOC.busy(), mode: s.mode, cur: s.cur, reg: s.reg ? (s.reg.solved ? 'solved' : 'live:' + s.reg.category) : null,
      bonus: s.bonus ? (s.bonus.finished ? 'finished' : 'live') : null, round0: s.players[0].round, total0: s.players[0].total,
      modal: document.getElementById('modal').style.display, kb: document.getElementById('kb').style.display });
  }));
}
function shot(n) { page.render(OUT + '/' + W + '-' + n + '.png'); }
var S = [
  function () { click('.cnt[data-n="2"]'); click('#pn0'); },
  function () { type('haylie'); shot('01-name-typing'); click('#kb .kk.go'); },
  function () { log.push('name field shows: ' + page.evaluate(function () { return document.querySelector('#pn0 span').textContent; })); shot('02-setup'); click('#btnStart'); },
  function () { shot('03-loader'); click('#inPz'); },
  function () { type('A CUP OF JOE'); },
  function () { shot('04-puzzle-typing'); click('#kb .kk.go'); },
  function () { click('.chip[data-c="FOOD & DRINK"]'); shot('05-loader-filled'); click('#mOk'); },
  function () { st('after load 1'); shot('06-board'); page.evaluate(function () { WOC.forceSpin(0); }); },
  0, 0, 0, 0, 0, 0, 0, 0, 0,
  function () { st('after spin'); clickText('#keys .key', 'P'); },
  0, 0, 0,
  function () { st('after P'); click('#btnSolve'); },
  function () { shot('07-solved-confetti'); st('right after solve'); click('#btnMenu'); },
  function () { clickText('.mitem', 'LOAD PUZZLE'); },
  function () { click('#inPz'); },
  function () { type('COFFEE BREAK'); click('#kb .kk.go'); },
  function () { click('.chip[data-c="THING"]'); click('#mOk'); },
  function () { st('after load 2 (menu path)'); shot('08-second-puzzle'); click('#btnSolve'); },
  function () { st('after solve 2'); click('#btnSolve'); },
  function () { st('after clear'); click('#btnSpin'); },
  function () { click('#inPz'); },
  function () { type('DOUBLE SHOT/ESPRESSO'); click('#kb .kk.go'); click('#mOk'); },
  function () { st('after load 3 (clear path)'); shot('09-third-puzzle'); click('#btnMenu'); },
  function () { clickText('.mitem', 'EDIT SCORES'); },
  function () { click('#et0'); },
  function () { type('2500'); shot('10-score-typing'); click('#kb .kk.go'); click('#mOk'); },
  function () { st('after edit scores'); click('#btnMenu'); },
  function () { clickText('.mitem', 'BONUS ROUND'); },
  function () { click('#inPz'); },
  function () { type('COFFEE CAKE'); click('#kb .kk.go'); click('#mOk'); },
  function () { st('bonus loaded'); click('#bBtnRst'); },
  0, 0,
  function () { clickText('#keys .key', 'C'); clickText('#keys .key', 'K'); clickText('#keys .key', 'F'); clickText('#keys .key', 'O'); click('#bBtnRev'); },
  0, 0,
  function () { click('#bBtnTimer'); },
  0,
  function () { click('#bBtnSolve'); },
  function () { shot('11-bonus-solved'); st('bonus solved'); }
];
var i = 0;
page.open('file://' + require('fs').absolute(phantom.libraryPath + '/../www/index.html'), function () {
  page.evaluate(function () { try { localStorage.clear(); } catch (e) {} });
  setTimeout(function next() {
    if (i >= S.length) { console.log(log.join('\n')); phantom.exit(); return; }
    try { if (S[i]) S[i](); } catch (e) { log.push('STEP ' + i + ' threw ' + e); }
    i++; setTimeout(next, 900);
  }, 800);
});
