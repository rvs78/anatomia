/* Prova end-to-end de Cor en Joc (Playwright + Chromium).
 * Ús: node tests/e2e.js [directori_captures]
 * Recorre les tres fases amb errors intencionats i comprova els criteris d'acceptació (docs/SPEC.md). */
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const OUT = process.argv[2] || path.join(__dirname, 'out');
const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const results = [];
const check = (name, cond, extra) => { results.push([cond ? 'PASS' : 'FAIL', name, extra || '']); };

(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const lives = () => page.evaluate(() => CJ._state().lives);

  await page.goto(URL);
  await page.waitForTimeout(400);
  const intro = await page.textContent('#screen-intro');
  check('CA2 presentació amb autor, centre i any', /Rubén Vallejo/.test(intro) && /FP Sanitari Vall d'Hebron/.test(intro) && /2026/.test(intro));
  await shot('01-intro');

  // CA1: registre invàlid
  await page.click('#btnStart');
  check('CA1 nom buit bloqueja', await page.isVisible('#screen-intro') && (await page.textContent('#nameError')).length > 0);
  await page.fill('#playerName', 'Laia Puig Serra');
  await page.fill('#playerEmail', 'laia@exemple');
  await page.click('#btnStart');
  check('CA1 correu invàlid bloqueja', (await page.textContent('#emailError')).length > 0);
  await page.fill('#playerEmail', 'laia.puig@exemple.cat');
  await page.click('#btnStart');
  await page.waitForSelector('#screen-instr.is-active');
  await shot('02-instruccions-f1');
  check('CA3 comença amb 10 cors', (await lives()) === 10 && (await page.$$('#hudLives .life:not(.is-lost)')).length === 10);
  await page.click('#btnInstrGo');
  await page.waitForTimeout(2500);
  await shot('03-fase1');

  // CA5: clic real sobre el ventricle esquerre
  const lvPt = await page.evaluate(() => {
    const h = CJ.Phase1.heart, r = h.canvas.getBoundingClientRect();
    for (let y = r.top + r.height * 0.5; y < r.bottom - 20; y += 6) for (let x = r.left + r.width * 0.5; x < r.right - 20; x += 6) {
      if (h.pick(x, y) === 'lv') return { x, y };
    }
    return null;
  });
  check('Picking 3D troba el ventricle esquerre', !!lvPt);
  await page.mouse.click(lvPt.x, lvPt.y);
  await page.waitForSelector('#identifyModal:not([hidden])');
  await page.fill('#identifyInput', 'ventricle');
  await page.click('#btnCheck');
  check('CA5 «ventricle» demana concreció sense restar', (await lives()) === 10 && /incompleta/.test(await page.textContent('#identifyFeedback')));
  await page.fill('#identifyInput', 'aorta');
  await page.click('#btnCheck');
  check('CA5 «aorta» per al VE resta 1 cor', (await lives()) === 9);
  await page.fill('#identifyInput', 'ventrículo izquierdo');
  await page.click('#btnCheck');
  check('CA5 «ventrículo izquierdo» és correcte', /Correcte/.test(await page.textContent('#identifyFeedback')));
  await shot('04-fase1-modal');
  await page.click('#btnCheck'); // Continua

  // CA6: amb el tall frontal es poden triar les vàlvules
  await page.$eval('#ctlCut', el => { el.value = 100; el.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(300);
  const valvesPickable = await page.evaluate(() => {
    const h = CJ.Phase1.heart, ids = ['tricuspid', 'mitral', 'pulmvalve', 'aorticvalve'], r = h.canvas.getBoundingClientRect();
    return ids.map(id => {
      const st = h.structures[id]; const v = st.valveGroup.getWorldPosition(new THREE.Vector3()).project(h.camera);
      const x = r.left + (v.x + 1) / 2 * r.width, y = r.top + (1 - v.y) / 2 * r.height;
      for (let dx = -8; dx <= 8; dx += 4) for (let dy = -8; dy <= 8; dy += 4) if (h.pick(x + dx, y + dy) === id) return true;
      return false;
    });
  });
  check('CA6 vàlvules seleccionables amb el tall', valvesPickable.every(Boolean), JSON.stringify(valvesPickable));
  await shot('05-fase1-tall');
  await page.$eval('#ctlAlpha', el => { el.value = 70; el.dispatchEvent(new Event('input')); });
  await page.waitForTimeout(300);
  await shot('06-fase1-transparencia');

  // Resta d'estructures (via el mateix modal)
  const names = await page.evaluate(() => CJ.STRUCTURES.filter(s => s.id !== 'lv').map(s => [s.id, s.name]));
  for (const [id, name] of names) {
    await page.evaluate(i => CJ.Phase1._open(i), id);
    if (id === 'mitral') { await page.click('#btnHint'); }
    await page.fill('#identifyInput', name);
    await page.click('#btnCheck');
    await page.click('#btnCheck');
  }
  await page.waitForSelector('#screen-summary.is-active');
  await shot('07-resum-f1');
  const s1 = await page.evaluate(() => CJ._state().phaseStats[1]);
  check('Fase 1 puntuació (15×100 + 50 − 30 pista)', s1.points === 1520, JSON.stringify(s1));

  // ---------------- FASE 2 ----------------
  await page.click('#btnSumNext');
  await page.waitForSelector('#screen-instr.is-active');
  await page.click('#btnInstrGo');
  await page.waitForTimeout(500);
  const scen = await page.evaluate(() => CJ.CYCLE);
  const map = { tricuspid: 'tricuspid', mitral: 'mitral', pulmonary: 'pulmonary', aortic: 'aortic' };
  for (let i = 0; i < scen.length; i++) {
    const s = scen[i];
    if (i === 0) { // error intencionat: tot tancat
      await page.click('#optContract [data-v="none"]'); await page.click('#optVent [data-v="diastole"]');
      const before = await lives();
      await page.click('#btnPump');
      check('Fase 2A: error resta 1 cor i dona pista', (await lives()) === before - 1 && /auriculoventriculars/.test(await page.textContent('#p2Feedback')));
    }
    for (const v in map) {
      const open = await page.evaluate(id => CJ.Phase2._debug().valves[id], v);
      if (open !== s.valves[v]) {
        if (i % 2) await page.click('#valveState li[data-v="' + v + '"]');
        else { const box = await page.locator('.valve[aria-label="Vàlvula ' + { tricuspid: 'Tricúspide', mitral: 'Mitral', pulmonary: 'Pulmonar', aortic: 'Aòrtica' }[v] + '"] .hit').boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
      }
    }
    if (s.id === 'ejection') { // CA7: ejecció amb diàstole és incorrecte
      await page.click('#optContract [data-v="ventricles"]'); await page.click('#optVent [data-v="diastole"]');
      const b = await lives(); await page.click('#btnPump');
      check('CA7 ejecció amb «diàstole» és incorrecta', (await lives()) === b - 1);
    }
    await page.click('#optContract [data-v="' + s.contract + '"]');
    await page.click('#optVent [data-v="' + s.ventricles + '"]');
    await page.click('#btnPump');
    await page.waitForTimeout(900);
    check('Fase 2A escenari ' + s.id + ' correcte', /Correcte/.test(await page.textContent('#p2Feedback')));
    if (s.id === 'ejection') await shot('08-fase2-ejeccio');
    await page.click('#btnP2Next');
  }
  await page.waitForSelector('#p2PartB:not([hidden])');
  const route = await page.evaluate(() => CJ.ROUTE.map(r => r.id));
  for (let i = 0; i < route.length; i++) {
    if (i === 1) {
      const b = await lives();
      await page.click('#routeBtns [data-r="lv"]');
      check('CA8 «Ventricle esquerre» després de «Venes caves» resta 1 cor', (await lives()) === b - 1);
    }
    await page.click('#routeBtns [data-r="' + route[i] + '"]');
    try { await page.waitForFunction(() => !CJ.Phase2._debug().locked || CJ.Phase2._debug().routeIdx >= CJ.ROUTE.length, null, { timeout: 8000 }); }
    catch (e) { throw new Error('Part B encallada al pas ' + i + ': ' + JSON.stringify(await page.evaluate(() => ({ idx: CJ.Phase2._debug().routeIdx, locked: CJ.Phase2._debug().locked, lives: CJ._state().lives })))); }
    if (i === 7) await shot('09-fase2-gota');
  }
  await page.waitForSelector('#btnP2Next:not([hidden])');
  await page.click('#btnP2Next');
  await page.waitForSelector('#screen-summary.is-active');
  await shot('10-resum-f2');

  // ---------------- FASE 3 ----------------
  await page.click('#btnSumNext');
  await page.click('#btnInstrGo');
  await page.waitForTimeout(400);
  await shot('11-fase3');
  const dragTo = async (key, n) => {
    const tag = page.locator('.tag[data-key="' + key + '"]');
    const gap = page.locator('.gap[data-n="' + n + '"]');
    await gap.scrollIntoViewIfNeeded();
    const a = await tag.boundingBox(), b = await gap.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(120);
  };
  // CA9: etiqueta incorrecta
  const b3 = await lives();
  await dragTo('d1', 1);
  check('CA9 etiqueta incorrecta torna i resta 1 cor', (await lives()) === b3 - 1 && (await page.$('.tag[data-key="d1"]')) !== null);
  const gaps = await page.$$eval('.gap', gs => gs.map(g => [g.dataset.key, g.dataset.n]));
  for (let i = 0; i < gaps.length; i++) {
    const [key, n] = gaps[i];
    if (i % 3 === 2) { // alternativa per tocs
      await page.click('.tag[data-key="' + key + '"]');
      await page.click('.gap[data-n="' + n + '"]');
    } else await dragTo(key, n);
    if (i === 8) await shot('12-fase3-mig');
  }
  await page.waitForSelector('#screen-summary.is-active', { timeout: 5000 });
  await shot('13-resum-f3');
  await page.click('#btnSumNext');
  await page.waitForSelector('#screen-results.is-active');
  await page.waitForTimeout(300);
  await shot('14-resultats');
  const R = await page.evaluate(() => CJ._state().result);
  check('Resultats: estat completat i nota calculada', R.status === 'Completada' && R.grade > 8, JSON.stringify({ grade: R.grade, total: R.total, lives: R.lives }));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnDownload')]);
  const txt = require('fs').readFileSync(await dl.path(), 'utf8');
  check('CA10 informe descarregable', /Laia Puig Serra/.test(txt) && /NOTA/.test(txt), dl.suggestedFilename());
  const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('corEnJoc.history.v1')).length);
  check('CA10 historial desat', hist >= 1);

  // ---------------- GAME OVER ----------------
  await page.click('#btnRestart');
  await page.click('#btnInstrGo');
  await page.waitForTimeout(800);
  await page.evaluate(() => CJ.Phase1._open('ra'));
  for (let i = 0; i < 10; i++) {
    if (await page.isHidden('#identifyModal')) await page.evaluate(k => CJ.Phase1._open(k), ['ra', 'la', 'rv', 'svc'][Math.floor(i / 3)]);
    await page.fill('#identifyInput', 'pàncrees');
    await page.click('#btnCheck');
    if (/Era:/.test(await page.textContent('#identifyFeedback'))) await page.click('#btnCheck');
  }
  await page.waitForSelector('#gameOverModal:not([hidden])', { timeout: 3000 });
  await shot('15-game-over');
  await page.click('#btnGoResults');
  check('CA4 sense cors → resultats «Sense vides»', /sense cors/i.test(await page.textContent('#resStatus')));
  await shot('16-resultats-game-over');

  // Mòbil
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  m.on('pageerror', e => errors.push('mobile: ' + e.message));
  await m.goto(URL); await m.waitForTimeout(300);
  await m.screenshot({ path: path.join(OUT, '17-mobil-intro.png'), fullPage: true });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check('Mòbil sense desbordament horitzontal', !overflow);

  check('CA11 sense errors a la consola', errors.length === 0, errors.join(' | '));
  await browser.close();
  results.forEach(r => console.log(r.join('  ')));
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log('\n' + (results.length - fails) + '/' + results.length + ' comprovacions superades');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); results.forEach(r => console.log(r.join('  '))); process.exit(2); });
