/* Cor en Joc — controlador principal: registre, vides, puntuació, pantalles i resultats */
(function () {
  const $ = id => document.getElementById(id);
  const U = CJ.util;
  const HISTORY_KEY = 'corEnJoc.history.v1';
  const PHASE_NAMES = { 1: 'Model 3D', 2: 'Sístole i diàstole', 3: 'Text amb buits' };

  const INSTR = {
    1: {
      title: 'Fase 1 · Identifica el cor en 3D',
      goal: 'Tens davant un cor humà en tres dimensions, en vista anterior (el costat dret del pacient queda a l\'esquerra de la pantalla). Has d\'identificar les ' + CJ.STRUCTURES.length + ' estructures marcades.',
      steps: [
        '<b>Gira</b> el cor arrossegant-lo amb el ratolí o el dit. Fes <b>zoom</b> amb la roda o pessigant la pantalla.',
        'Passa el ratolí per sobre: l\'estructura s\'il·lumina en groc. <b>Clica-hi</b> per obrir la finestra de resposta.',
        '<b>Escriu el nom</b> de l\'estructura (p. ex. «ventricle esquerre», «vena cava superior») i prem <b>Comprova</b>. S\'accepten el català, el castellà i les abreviatures (VE, AD…).',
        'Si la resposta és incompleta (p. ex. només «ventricle»), et demanarem que la concretis <b>sense perdre cap cor</b>.',
        'Per veure les <b>4 vàlvules</b>, que són a dins, mou el control <b>«Tall frontal»</b> o la <b>«Transparència»</b>.',
        'Quan hagis identificat totes les estructures, passaràs a la fase 2.'
      ],
      scoring: '<p>✅ Encert al primer intent: <b>+100</b> · després d\'un error: <b>+50</b>.</p><p>❌ Cada error: <b>−1 cor</b>. Al tercer error en una estructura, se\'t mostra la resposta (0 punts).</p><p>💡 Pista opcional: <b>−30 punts</b> (no resta cors).</p>'
    },
    2: {
      title: 'Fase 2 · Sístole i diàstole',
      goal: 'Pilota el cicle cardíac en un esquema 2D del cor i, després, guia una gota de sang per tot el circuit.',
      steps: [
        '<b>Part A.</b> Llegeix l\'escenari del quadre lateral (hi ha 5 moments del cicle).',
        '<b>Clica les vàlvules</b> de l\'esquema (T, M, P, Ao) per obrir-les o tancar-les segons la situació.',
        'Tria <b>quines cavitats es contrauen</b> (cap, aurícules o ventricles) i si els ventricles són en <b>sístole o diàstole</b>.',
        'Prem <b>Bombeja!</b> Si tot és correcte, veuràs el flux de sang, sentiràs el batec i llegiràs l\'explicació.',
        '<b>Part B.</b> La gota de sang és als teixits. Prem els botons <b>en l\'ordre</b> en què la sang recorre el cor i els pulmons fins a tornar als teixits.',
        'Observa com la gota canvia de <b style="color:#3b5bd6">blau</b> (desoxigenada) a <b style="color:#e5332a">vermell</b> (oxigenada) als pulmons.'
      ],
      scoring: '<p>✅ Part A: <b>+100</b> per escenari (+50 després d\'un error) · Part B: <b>+20</b> per pas (+10).</p><p>❌ Cada error: <b>−1 cor</b>. A la part A, et direm quin element falla sense donar-te la solució.</p>'
    },
    3: {
      title: 'Fase 3 · Text amb buits',
      goal: 'Completa un text sobre l\'anatomia i la fisiologia del cor amb les etiquetes de la part superior. Compte: n\'hi ha dues que sobren!',
      steps: [
        'Llegeix primer el text sencer per entendre\'n el context.',
        '<b>Arrossega</b> una etiqueta fins al buit on correspon i deixa-la anar.',
        'També pots <b>tocar una etiqueta</b> i després <b>tocar el buit</b> (ideal per a tauletes i teclat).',
        'Si l\'etiqueta és correcta, queda fixada en verd. Si no, torna a la part superior.',
        'Quan omplis tots els buits, veuràs els teus resultats finals.'
      ],
      scoring: '<p>✅ Encert al primer intent: <b>+50</b> · després d\'un error amb aquella etiqueta: <b>+25</b>.</p><p>❌ Cada etiqueta mal col·locada: <b>−1 cor</b>.</p>'
    }
  };

  /* Recomanacions de repàs segons la fase (diapositives de la presentació) */
  const REVIEW = {
    1: 'Repassa la morfologia externa i les cavitats (diapositives «Cares anatòmiques», «Les quatre cavitats» i «Distribució de l\'aparell valvular»).',
    2: 'Repassa la «Dinàmica valvular en el cicle cardíac» i les «Fases del cicle cardíac»: AV obertes en diàstole, semilunars obertes en l\'ejecció; S1 = tancament AV, S2 = tancament semilunar.',
    3: 'Repassa el pericardi, les capes de la paret cardíaca, l\'aparell valvular i la irrigació coronària.'
  };

  let G = null;

  /* ---------------- API per a les fases ---------------- */
  const game = {
    isOver: () => !G || G.over,
    addPoints(pts, phase) {
      G.score = Math.max(0, G.score + pts);
      G.phasePoints[phase] = (G.phasePoints[phase] || 0) + pts;
      const s = document.querySelector('.hud__score');
      $('hudScore').textContent = G.score;
      if (pts > 0) { s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
    },
    correct() { CJ.audio.ok(); },
    logError(phase, item, answer) { G.errors.push({ phase, item, answer: String(answer || '').slice(0, 60) }); },
    wrong(shakeEl) {
      if (G.over) return false;
      G.lives = Math.max(0, G.lives - 1);
      CJ.audio.ko();
      renderLives(true);
      if (shakeEl) U.shake(shakeEl);
      if (G.lives <= 0) {
        G.over = true; G.status = 'lives';
        CJ.audio.lose();
        if (CJ.Phase2) CJ.Phase2.stop();
        $('identifyModal').hidden = true;
        setTimeout(() => { $('gameOverModal').hidden = false; $('btnGoResults').focus(); }, 650);
        return false;
      }
      return true;
    },
    phaseDone(phase, stats) {
      G.phaseStats[phase] = stats;
      CJ.audio.win();
      showSummary(phase, stats);
    }
  };

  /* ---------------- Pantalles ---------------- */
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
    $('hud').hidden = id === 'screen-intro';
    window.scrollTo(0, 0);
    if (CJ.Phase1.heart) CJ.Phase1.pause(id !== 'screen-p1');
  }

  function setPhaseHud(phase) {
    document.querySelectorAll('.hud__phases li').forEach(li => {
      const p = +li.dataset.phase;
      li.classList.toggle('is-current', p === phase);
      li.classList.toggle('is-done', !!(G && G.phaseStats[p]));
    });
  }

  function renderLives(breaking) {
    const box = $('hudLives');
    const max = CJ.MAX_LIVES;
    if (box.children.length !== max) box.innerHTML = Array.from({ length: max }, () => U.heartSvg('life')).join('');
    [...box.children].forEach((h, i) => {
      const lost = i >= G.lives;
      if (breaking && lost && !h.classList.contains('is-lost') && i === G.lives) {
        h.classList.add('is-breaking'); setTimeout(() => h.classList.remove('is-breaking'), 700);
      }
      h.classList.toggle('is-lost', lost);
    });
    box.setAttribute('aria-label', G.lives + ' cors de ' + max);
  }

  function showInstructions(phase, thenStart) {
    const d = INSTR[phase];
    $('instrEyebrow').textContent = 'Fase ' + phase + ' de 3 · Instruccions';
    $('instrTitle').textContent = d.title;
    $('instrGoal').innerHTML = d.goal;
    $('instrSteps').innerHTML = d.steps.map((s, i) => '<li style="animation-delay:' + (i * 60) + 'ms">' + s + '</li>').join('');
    $('instrScoring').innerHTML = d.scoring;
    $('btnInstrGo').textContent = thenStart ? 'Som-hi!' : 'Torna a l\'activitat';
    $('btnInstrGo').onclick = () => {
      if (thenStart) startPhase(phase);
      else show('screen-p' + phase);
    };
    G.instrReturn = phase;
    show('screen-instr');
    setPhaseHud(phase);
  }

  function startPhase(phase) {
    G.phase = phase;
    setPhaseHud(phase);
    show('screen-p' + phase);
    if (phase === 1) CJ.Phase1.init(game);
    if (phase === 2) CJ.Phase2.init(game);
    if (phase === 3) CJ.Phase3.init(game);
  }

  function showSummary(phase, s) {
    const pct = s.max ? Math.max(0, Math.round(100 * s.points / s.max)) : 0;
    $('sumBadge').textContent = pct >= 85 ? '🏆' : pct >= 60 ? '💪' : '📚';
    $('sumEyebrow').textContent = 'Fase ' + phase + ' completada';
    $('sumTitle').textContent = PHASE_NAMES[phase] + ': ' + (pct >= 85 ? 'excel·lent!' : pct >= 60 ? 'bona feina!' : 'cal repassar');
    $('sumKpis').innerHTML = kpi('Punts', s.points + ' / ' + s.max) + kpi('Encerts al 1r intent', s.firstTry + ' / ' + s.total) + kpi('Errors', s.errors) + kpi('Cors', G.lives + ' / ' + CJ.MAX_LIVES);
    const errs = G.errors.filter(e => e.phase === phase);
    let fb = '<p>' + (pct >= 85 ? 'Domines aquesta part. Continua així!' : pct >= 60 ? 'Bona base. Revisa els errors per consolidar-la.' : REVIEW[phase]) + '</p>';
    if (errs.length) fb += '<p><b>On t\'has equivocat:</b></p><ul>' + unique(errs.map(e => e.item)).slice(0, 8).map(i => '<li>' + U.esc(i) + '</li>').join('') + '</ul>';
    $('sumFeedback').innerHTML = fb;
    $('btnSumNext').textContent = phase < 3 ? 'Continua a la fase ' + (phase + 1) + ' →' : 'Veure els resultats finals →';
    $('btnSumNext').onclick = () => { if (phase < 3) showInstructions(phase + 1, true); else { G.status = 'complete'; showResults(); } };
    setPhaseHud(0);
    show('screen-summary');
  }

  function kpi(t, v) { return '<div><dt>' + t + '</dt><dd>' + v + '</dd></div>'; }
  function unique(a) { return [...new Set(a)]; }

  /* ---------------- Resultats ---------------- */
  function maxPoints() {
    return CJ.STRUCTURES.length * CJ.POINTS.p1 + CJ.CYCLE.length * CJ.POINTS.p2a + CJ.ROUTE.length * CJ.POINTS.p2b +
      (CJ.CLOZE.paragraphs.join(' ').match(/\[\[/g) || []).length * CJ.POINTS.p3;
  }

  function buildResult() {
    const max = maxPoints();
    const base = Math.max(0, [1, 2, 3].reduce((a, p) => a + (G.phasePoints[p] || 0), 0));
    const grade = Math.round(100 * base / max) / 10;
    const bonus = G.status === 'complete' ? G.lives * CJ.POINTS.lifeBonus : 0;
    const secs = Math.round((Date.now() - G.start) / 1000);
    return {
      name: G.name, email: G.email, date: new Date().toISOString(),
      status: G.status === 'complete' ? 'Completada' : 'Sense vides',
      grade, points: base, bonus, total: base + bonus, max, lives: G.lives, seconds: secs,
      phases: [1, 2, 3].map(p => ({ phase: p, name: PHASE_NAMES[p], points: Math.max(0, G.phasePoints[p] || 0), max: phaseMax(p), done: !!G.phaseStats[p], errors: G.errors.filter(e => e.phase === p).length })),
      errors: G.errors
    };
  }

  function phaseMax(p) {
    if (p === 1) return CJ.STRUCTURES.length * CJ.POINTS.p1;
    if (p === 2) return CJ.CYCLE.length * CJ.POINTS.p2a + CJ.ROUTE.length * CJ.POINTS.p2b;
    return (CJ.CLOZE.paragraphs.join(' ').match(/\[\[/g) || []).length * CJ.POINTS.p3;
  }

  function fmtTime(s) { return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; }

  function showResults() {
    if (CJ.Phase2) CJ.Phase2.stop();
    const R = G.result = buildResult();
    $('gameOverModal').hidden = true;
    $('resStatus').textContent = R.status === 'Completada' ? 'Activitat completada' : 'Activitat aturada: sense cors';
    $('resTitle').textContent = R.grade >= 9 ? 'Cor de cardiòleg! 🫀' : R.grade >= 7 ? 'Molt bona feina!' : R.grade >= 5 ? 'Aprovat: segueix practicant' : 'Cal repassar la unitat';
    $('resWho').innerHTML = '<b>' + U.esc(R.name) + '</b> · ' + U.esc(R.email) + ' · ' + new Date(R.date).toLocaleString('ca-ES');
    const gEl = $('resGrade');
    gEl.innerHTML = R.grade.toFixed(1).replace('.', ',') + '<small>sobre 10</small>';
    gEl.className = 'grade' + (R.grade < 5 ? ' is-low' : R.grade < 7 ? ' is-mid' : '');
    $('resKpis').innerHTML = kpi('Punts', R.points + ' / ' + R.max) + kpi('Bonus de cors', '+' + R.bonus) + kpi('Total', R.total) + kpi('Cors restants', R.lives + ' / ' + CJ.MAX_LIVES) + kpi('Temps', fmtTime(R.seconds));
    $('resPhases').innerHTML = R.phases.map(p => {
      const pct = p.max ? Math.round(100 * p.points / p.max) : 0;
      return '<div class="pbar"><div class="pbar__head"><span>Fase ' + p.phase + ' · ' + p.name + (p.done ? '' : ' <em>(no completada)</em>') + '</span><span>' + p.points + ' / ' + p.max + ' · ' + pct + '%</span></div><div class="pbar__track"><div class="pbar__fill" style="width:' + pct + '%"></div></div></div>';
    }).join('');

    let fb = '';
    if (R.status !== 'Completada') fb += '<p>T\'has quedat sense cors abans d\'acabar. Llegeix les recomanacions i torna-ho a provar: els punts es guarden per a cada fase que hagis fet.</p>';
    R.phases.forEach(p => {
      const pct = p.max ? p.points / p.max : 0;
      if (!p.done || pct < 0.75) fb += '<p><b>Fase ' + p.phase + ':</b> ' + REVIEW[p.phase] + '</p>';
    });
    if (!fb) fb = '<p>Excel·lent domini de l\'anatomia del cor: estructures, dinàmica valvular, circulació i vocabulari. 👏</p>';
    if (R.errors.length) {
      fb += '<p><b>Detall dels errors (' + R.errors.length + '):</b></p><ul>' +
        R.errors.slice(0, 14).map(e => '<li>Fase ' + e.phase + ' · ' + U.esc(e.item) + (e.answer ? ' — resposta: «' + U.esc(e.answer) + '»' : '') + '</li>').join('') +
        (R.errors.length > 14 ? '<li>… i ' + (R.errors.length - 14) + ' més.</li>' : '') + '</ul>';
    }
    $('resFeedback').innerHTML = fb;
    if (!G.saved) { saveHistory(R); sendRemote(R); G.saved = true; }
    renderHistory();
    setPhaseHud(0);
    document.querySelectorAll('.hud__phases li').forEach(li => li.classList.toggle('is-done', !!G.phaseStats[+li.dataset.phase]));
    show('screen-results');
  }

  function loadHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { return []; } }
  function saveHistory(R) {
    try {
      const h = loadHistory();
      h.unshift({ name: R.name, email: R.email, date: R.date, grade: R.grade, total: R.total, status: R.status });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 30)));
    } catch (e) { /* emmagatzematge no disponible */ }
  }
  function renderHistory() {
    const h = loadHistory();
    $('resHistory').innerHTML = h.length ? h.map(x => '<li>' + new Date(x.date).toLocaleString('ca-ES') + ' · ' + U.esc(x.name) + ' · nota ' + String(x.grade).replace('.', ',') + ' · ' + x.total + ' punts · ' + U.esc(x.status) + '</li>').join('') : '<li>Encara no hi ha intents desats.</li>';
  }
  function sendRemote(R) {
    const url = window.CJ_CONFIG && window.CJ_CONFIG.RESULTS_ENDPOINT;
    if (!url) return;
    try { fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(R) }); } catch (e) { /* sense connexió */ }
  }

  function reportTxt(R) {
    const L = [];
    L.push('COR EN JOC — INFORME DE RESULTATS');
    L.push('Activitat: Anatomia del cor humà (3 fases)');
    L.push('Autor i professor: Rubén Vallejo · FP Sanitari Vall d\'Hebron · 2026');
    L.push(''.padEnd(56, '='));
    L.push('Alumne/a: ' + R.name);
    L.push('Correu:   ' + R.email);
    L.push('Data:     ' + new Date(R.date).toLocaleString('ca-ES'));
    L.push('Estat:    ' + R.status);
    L.push('');
    L.push('NOTA: ' + R.grade.toFixed(1).replace('.', ',') + ' / 10');
    L.push('Punts: ' + R.points + ' / ' + R.max + '   Bonus de cors: +' + R.bonus + '   Total: ' + R.total);
    L.push('Cors restants: ' + R.lives + ' / ' + CJ.MAX_LIVES + '   Temps: ' + fmtTime(R.seconds));
    L.push('');
    R.phases.forEach(p => L.push('Fase ' + p.phase + ' (' + p.name + '): ' + p.points + ' / ' + p.max + ' punts · ' + p.errors + ' errors' + (p.done ? '' : ' · NO COMPLETADA')));
    L.push('');
    L.push('ERRORS:');
    if (!R.errors.length) L.push('  Cap error. Enhorabona!');
    R.errors.forEach(e => L.push('  - Fase ' + e.phase + ' · ' + e.item + (e.answer ? ' (resposta: «' + e.answer + '»)' : '')));
    return L.join('\r\n');
  }
  function reportCsv(R) {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const head = ['nom', 'correu', 'data', 'estat', 'nota', 'punts', 'maxim', 'bonus', 'total', 'cors', 'temps_s', 'fase1', 'fase2', 'fase3', 'errors'];
    const row = [R.name, R.email, R.date, R.status, R.grade, R.points, R.max, R.bonus, R.total, R.lives, R.seconds, R.phases[0].points, R.phases[1].points, R.phases[2].points, R.errors.length];
    return '﻿' + head.join(';') + '\r\n' + row.map(q).join(';') + '\r\n';
  }
  function slug(s) { return U.normalize(s).replace(/ /g, '-') || 'alumne'; }

  /* ---------------- Inici ---------------- */
  function startGame(name, email) {
    G = { name, email, lives: CJ.MAX_LIVES, score: 0, phasePoints: {}, phaseStats: {}, errors: [], start: Date.now(), over: false, status: 'playing', saved: false };
    $('hudPlayer').textContent = name;
    $('hudScore').textContent = '0';
    renderLives(false);
    showInstructions(1, true);
  }

  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); }

  function boot() {
    $('introHearts').innerHTML = Array.from({ length: CJ.MAX_LIVES }, (_, i) => U.heartSvg('life').replace('<svg', '<svg style="animation-delay:' + (i * 50) + 'ms"')).join('');

    $('registerForm').addEventListener('submit', e => {
      e.preventDefault();
      const nameEl = $('playerName'), emailEl = $('playerEmail');
      const name = nameEl.value.trim().replace(/\s+/g, ' '), email = emailEl.value.trim();
      let ok = true;
      if (name.length < 3) { $('nameError').textContent = 'Escriu el teu nom i cognoms (mínim 3 caràcters).'; nameEl.classList.add('is-invalid'); ok = false; }
      else { $('nameError').textContent = ''; nameEl.classList.remove('is-invalid'); }
      if (!validEmail(email)) { $('emailError').textContent = 'Escriu un correu electrònic vàlid (p. ex. nom@exemple.cat).'; emailEl.classList.add('is-invalid'); ok = false; }
      else { $('emailError').textContent = ''; emailEl.classList.remove('is-invalid'); }
      if (!ok) { U.shake($('btnStart')); (name.length < 3 ? nameEl : emailEl).focus(); return; }
      try { localStorage.setItem('corEnJoc.player', JSON.stringify({ name, email })); } catch (err) { /* res */ }
      CJ.audio.ok();
      startGame(name, email);
    });
    try {
      const p = JSON.parse(localStorage.getItem('corEnJoc.player'));
      if (p) { $('playerName').value = p.name || ''; $('playerEmail').value = p.email || ''; }
    } catch (e) { /* res */ }

    $('btnHelp').addEventListener('click', () => {
      if (!G || G.over) return;
      const active = document.querySelector('.screen.is-active').id;
      const m = active.match(/screen-p(\d)/);
      if (m) showInstructions(+m[1], false);
    });
    $('btnSound').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false');
      CJ.audio.setEnabled(on);
    });
    $('btnGoResults').addEventListener('click', showResults);
    $('btnPrint').addEventListener('click', () => window.print());
    $('btnDownload').addEventListener('click', () => G && G.result && U.download('cor-en-joc_' + slug(G.result.name) + '.txt', reportTxt(G.result)));
    $('btnCsv').addEventListener('click', () => G && G.result && U.download('cor-en-joc_' + slug(G.result.name) + '.csv', reportCsv(G.result), 'text/csv'));
    $('btnRestart').addEventListener('click', () => { const n = G.name, m = G.email; startGame(n, m); });

    // Avís en sortir a mitja partida
    window.addEventListener('beforeunload', e => { if (G && !G.over && G.status === 'playing') { e.preventDefault(); e.returnValue = ''; } });
  }

  window.CJ.game = game;
  window.CJ._state = () => G; // per a proves automatitzades
  boot();
})();
