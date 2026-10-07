/* Cor en Joc — Fase 2: sístole i diàstole (esquema 2D) */
window.CJ = window.CJ || {};

CJ.Phase2 = (function () {
  const $ = id => document.getElementById(id);
  const U = CJ.util;
  const NS = 'http://www.w3.org/2000/svg';
  const C = { blue: '#5b7bd5', blueDark: '#2f4aa8', red: '#e06666', redDark: '#b5302c', wall: '#f3b0a6', wallDark: '#d98a7f', o2: '#e5332a', co2: '#3b5bd6' };

  /* Vàlvules: centre, amplada, sentit del flux (+1 avall, −1 amunt) */
  const VALVES = {
    tricuspid: { name: 'Tricúspide', short: 'T', x: 255, y: 322, w: 92, dir: 1 },
    mitral:    { name: 'Mitral',     short: 'M', x: 545, y: 322, w: 92, dir: 1 },
    pulmonary: { name: 'Pulmonar',   short: 'P', x: 362, y: 300, w: 40, dir: -1 },
    aortic:    { name: 'Aòrtica',    short: 'Ao', x: 434, y: 300, w: 40, dir: -1 }
  };

  /* Recorreguts (polilínies) per a les partícules i la gota */
  const P = {
    body: [400, 585], vcEnd: [145, 420], ra: [255, 245], tv: [255, 322], rv: [290, 420], pv: [362, 300], pa: [362, 170],
    lung: [400, 45], pvn: [592, 160], la: [560, 245], mv: [545, 322], lv: [510, 420], av: [434, 300], ao: [560, 105]
  };
  const SEG = {
    vc:   [P.body, [300, 592], [165, 592], [145, 570], P.vcEnd],
    ra:   [P.vcEnd, [145, 300], [190, 258], P.ra],
    tv:   [P.ra, P.tv],
    rv:   [P.tv, P.rv],
    pv:   [P.rv, [345, 380], P.pv],
    pa:   [P.pv, P.pa],
    lung: [P.pa, [362, 75], P.lung],
    pvn:  [P.lung, [490, 58], [590, 62], P.pvn],
    la:   [P.pvn, P.la],
    mv:   [P.la, P.mv],
    lv:   [P.mv, P.lv],
    av:   [P.lv, [452, 380], P.av],
    ao:   [P.av, [434, 150], [455, 108], P.ao],
    body: [P.ao, [705, 105], [740, 140], [740, 560], [715, 592], [560, 592], P.body]
  };
  const SVC_IN = [[255, 70], [255, 200]];

  /* Fluxos per escenari: [polilínia, oxigenada?] */
  const FLOWS = {
    fillRA: [[SEG.vc.concat(SEG.ra.slice(1)), false], [SVC_IN, false]],
    fillLA: [[SEG.pvn.slice(1).concat(SEG.la.slice(1)), true]],
    raToRv: [[[P.ra, P.tv, P.rv], false]],
    laToLv: [[[P.la, P.mv, P.lv], true]],
    rvOut: [[[P.rv, [345, 380], P.pv, P.pa, [362, 75]], false]],
    lvOut: [[[P.lv, [452, 380], P.av, [434, 150], [455, 108], P.ao, [705, 105]], true]]
  };
  const SCEN_FLOWS = {
    diastole: ['fillRA', 'fillLA', 'raToRv', 'laToLv'],
    atrial: ['raToRv', 'laToLv', 'raToRv', 'laToLv'],
    isovol: ['fillRA', 'fillLA'],
    ejection: ['rvOut', 'lvOut', 'fillRA', 'fillLA'],
    relax: ['fillRA', 'fillLA']
  };

  let game, svg, st, anim = null;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const pathOf = pts => 'M' + pts.map(p => p.join(',')).join(' L');

  /* ---------------- Dibuix de l'esquema ---------------- */
  function draw() {
    svg = $('cycleSvg');
    while (svg.childNodes.length > 1) svg.removeChild(svg.lastChild); // conserva <title>
    const defs = el('defs', {}, svg);
    defs.innerHTML =
      '<linearGradient id="gLung" x1="0" x2="1"><stop offset="0" stop-color="#cfd9f7"/><stop offset="1" stop-color="#f7c9c6"/></linearGradient>' +
      '<linearGradient id="gBody" x1="0" x2="1"><stop offset="0" stop-color="#f7c9c6"/><stop offset="1" stop-color="#cfd9f7"/></linearGradient>' +
      '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".18"/></filter>' +
      '<marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#56685e"/></marker>';

    // Pulmons i teixits
    const lungs = el('g', { id: 'n-lung' }, svg);
    el('rect', { x: 290, y: 12, width: 220, height: 66, rx: 33, fill: 'url(#gLung)', stroke: '#b8c3e6', filter: 'url(#soft)' }, lungs);
    for (let i = 0; i < 9; i++) el('circle', { cx: 320 + i * 20, cy: 62, r: 6, fill: 'rgba(255,255,255,.55)' }, lungs);
    el('text', { x: 400, y: 40, 'text-anchor': 'middle', class: 'svg-label' }, lungs).textContent = 'Capil·lars pulmonars';
    el('text', { x: 400, y: 56, 'text-anchor': 'middle', class: 'svg-label svg-label--sm' }, lungs).textContent = 'CO₂ ⇄ O₂';
    const body = el('g', { id: 'n-body' }, svg);
    el('rect', { x: 250, y: 562, width: 300, height: 52, rx: 26, fill: 'url(#gBody)', stroke: '#e3b9b5', filter: 'url(#soft)' }, body);
    el('text', { x: 400, y: 586, 'text-anchor': 'middle', class: 'svg-label' }, body).textContent = 'Teixits del cos';
    el('text', { x: 400, y: 602, 'text-anchor': 'middle', class: 'svg-label svg-label--sm' }, body).textContent = 'O₂ i nutrients ⇄ CO₂';

    // Vasos (de darrere cap endavant)
    const vessels = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    el('path', { d: 'M492,58 C580,58 612,80 594,182', stroke: C.red, 'stroke-width': 18 }, vessels);           // venes pulmonars
    el('path', { d: 'M362,330 L362,76', stroke: C.blue, 'stroke-width': 32 }, vessels);                      // tronc pulmonar
    el('path', { d: 'M434,330 L434,150 C434,112 455,104 500,104 L700,104 C730,104 740,125 740,155 L740,560 C740,585 725,592 700,592 L552,592', stroke: C.red, 'stroke-width': 30 }, vessels); // aorta
    el('path', { d: 'M255,62 L255,200', stroke: C.blue, 'stroke-width': 28 }, vessels);                       // VCS
    el('path', { d: 'M250,592 L170,592 C152,592 145,578 145,560 L145,300 C145,272 160,258 190,252', stroke: C.blue, 'stroke-width': 28 }, vessels); // VCI
    const lab = (x, y, t, a) => { el('text', { x, y, 'text-anchor': a || 'middle', class: 'svg-label svg-label--sm' }, svg).textContent = t; };
    lab(282, 52, 'Vena cava superior', 'end'); lab(118, 440, 'Vena cava', 'end'); lab(118, 455, 'inferior', 'end');
    lab(343, 176, 'Tronc', 'end'); lab(343, 190, 'pulmonar', 'end'); lab(756, 360, 'Aorta', 'start');
    lab(690, 80, 'Arc aòrtic'); lab(625, 140, 'Venes', 'start'); lab(625, 154, 'pulmonars', 'start');

    // Paret miocàrdica
    el('path', { d: 'M168,250 C168,160 320,150 398,182 C478,150 632,160 632,250 L632,318 C630,450 500,548 432,552 C370,552 172,460 168,318 Z', fill: C.wall, stroke: C.wallDark, 'stroke-width': 3, filter: 'url(#soft)' }, svg);

    // Cavitats
    const ch = el('g', {}, svg);
    st.ch = {
      ra: el('ellipse', { cx: 255, cy: 248, rx: 72, ry: 64, fill: C.blue, class: 'chamber' }, ch),
      la: el('ellipse', { cx: 545, cy: 248, rx: 72, ry: 64, fill: C.red, class: 'chamber' }, ch),
      rv: el('path', { d: 'M196,330 L392,330 L392,500 C352,520 300,505 262,470 C222,432 198,390 196,330 Z', fill: C.blue, class: 'chamber' }, ch),
      lv: el('path', { d: 'M408,330 L604,330 C602,400 560,470 500,510 C470,528 440,530 408,512 Z', fill: C.red, class: 'chamber' }, ch)
    };
    // Tractes de sortida
    el('rect', { x: 344, y: 300, width: 36, height: 40, fill: C.blue }, ch);
    el('rect', { x: 416, y: 300, width: 36, height: 40, fill: C.red }, ch);
    const cl = (x, y, t) => { el('text', { x, y, 'text-anchor': 'middle', class: 'svg-label svg-label--light' }, svg).textContent = t; };
    cl(255, 244, 'Aurícula'); cl(255, 260, 'dreta'); cl(545, 244, 'Aurícula'); cl(545, 260, 'esquerra');
    cl(292, 408, 'Ventricle'); cl(292, 424, 'dret'); cl(510, 408, 'Ventricle'); cl(510, 424, 'esquerre');

    // Vàlvules
    st.valveEls = {};
    for (const id in VALVES) drawValve(id);

    st.particles = el('g', { class: 'blood' }, svg);
    st.drop = el('g', { class: 'blood', opacity: 0 }, svg);
    el('circle', { r: 13, fill: '#fff', opacity: .85 }, st.drop);
    st.dropCore = el('path', { d: 'M0,-11 C6,-3 9,1 9,5 A9,9 0 1 1 -9,5 C-9,1 -6,-3 0,-11 Z', fill: C.co2 }, st.drop);
  }

  function drawValve(id) {
    const v = VALVES[id];
    const g = el('g', { class: 'valve', tabindex: 0, role: 'button', 'aria-label': 'Vàlvula ' + v.name, transform: 'translate(' + v.x + ',' + v.y + ')' }, svg);
    el('title', {}, g).textContent = 'Vàlvula ' + v.name + ' — clica per obrir/tancar';
    el('rect', { class: 'hit', x: -v.w / 2 - 8, y: -26, width: v.w + 16, height: 52, rx: 10 }, g);
    const half = v.w / 2;
    const a = el('line', { class: 'leaf leaf-a', x1: -half, y1: 0, x2: -2, y2: 0 }, g);
    const b = el('line', { class: 'leaf leaf-b', x1: half, y1: 0, x2: 2, y2: 0 }, g);
    el('circle', { class: 'ring', cx: -half, cy: 0, r: 5 }, g);
    el('circle', { class: 'ring', cx: half, cy: 0, r: 5 }, g);
    const tagX = id === 'pulmonary' ? -half - 22 : id === 'aortic' ? half + 22 : id === 'tricuspid' ? -half - 24 : half + 24;
    el('circle', { cx: tagX, cy: 0, r: 13, fill: '#fff', stroke: '#2f3e36', 'stroke-width': 1.5 }, g);
    el('text', { x: tagX, y: 4, 'text-anchor': 'middle', class: 'svg-label', style: 'font-size:11px' }, g).textContent = v.short;
    st.valveEls[id] = { g, a, b, angle: 0 };
    const toggle = () => { if (!st.locked && !st.partB) { setValve(id, !st.valves[id]); CJ.audio.pop(); renderValveState(); } };
    g.addEventListener('click', toggle);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  }

  /* Anima l'angle de les valves (0 = tancada, 72° = oberta en el sentit del flux) */
  function setValve(id, open, instant) {
    st.valves[id] = open;
    const v = VALVES[id], ve = st.valveEls[id];
    ve.g.classList.toggle('is-open', open);
    const target = open ? 72 : 0, from = ve.angle, t0 = performance.now(), dur = instant ? 0 : 320;
    const half = v.w / 2;
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1;
      const ang = from + (target - from) * (1 - Math.pow(1 - k, 3));
      ve.angle = ang;
      ve.a.setAttribute('transform', 'rotate(' + (ang * v.dir) + ',' + (-half) + ',0)');
      ve.b.setAttribute('transform', 'rotate(' + (-ang * v.dir) + ',' + half + ',0)');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderValveState() {
    $('valveState').innerHTML = Object.keys(VALVES).map(id =>
      '<li data-v="' + id + '" class="' + (st.valves[id] ? 'is-open' : 'is-closed') + '" tabindex="0" role="button"><b>' + VALVES[id].name + '</b><span class="st">' + (st.valves[id] ? 'Oberta' : 'Tancada') + '</span></li>'
    ).join('');
  }

  /* ---------------- Animació de partícules ---------------- */
  function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  function pointAt(pts, t) {
    const L = polyLen(pts) * t; let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= L) { const k = d ? (L - acc) / d : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; }
      acc += d;
    }
    return pts[pts.length - 1];
  }

  function playFlows(keys, duration, done) {
    stopFlows();
    const flows = [];
    keys.forEach(k => FLOWS[k].forEach(f => flows.push(f)));
    const dots = [];
    flows.forEach(([pts, o2], fi) => {
      for (let i = 0; i < 7; i++) dots.push({ pts, offset: i / 7 + fi * 0.03, c: el('circle', { r: 5, fill: o2 ? C.o2 : C.co2, stroke: '#fff', 'stroke-width': 1.5 }, st.particles) });
    });
    const t0 = performance.now();
    const tick = now => {
      const t = (now - t0) / 1000;
      dots.forEach(d => { const p = pointAt(d.pts, (d.offset + t * 0.55) % 1); d.c.setAttribute('cx', p[0]); d.c.setAttribute('cy', p[1]); });
      if (t * 1000 < duration) anim = requestAnimationFrame(tick); else { stopFlows(); if (done) done(); }
    };
    anim = requestAnimationFrame(tick);
  }
  function stopFlows() { if (anim) cancelAnimationFrame(anim); anim = null; if (st && st.particles) st.particles.innerHTML = ''; }

  function setContract(which) {
    st.ch.ra.classList.toggle('is-contracting', which === 'atria');
    st.ch.la.classList.toggle('is-contracting', which === 'atria');
    st.ch.rv.classList.toggle('is-contracting', which === 'ventricles');
    st.ch.lv.classList.toggle('is-contracting', which === 'ventricles');
  }

  function timeline(seg, run) {
    document.querySelectorAll('.timeline__seg').forEach(s => s.classList.toggle('is-current', s.dataset.seg === seg));
    const cur = $('timelineCursor');
    if (!run) { cur.style.transition = 'none'; cur.style.opacity = 0; return; }
    const segEl = document.querySelector('.timeline__seg[data-seg="' + seg + '"]');
    cur.style.transition = 'none'; cur.style.opacity = 1; cur.style.left = segEl.offsetLeft + 'px';
    void cur.offsetWidth;
    cur.style.transition = 'left 2.4s linear'; cur.style.left = (segEl.offsetLeft + segEl.offsetWidth - 3) + 'px';
  }

  /* ---------------- Part A ---------------- */
  function init(g) {
    game = g;
    st = { idx: 0, valves: { tricuspid: false, mitral: false, pulmonary: false, aortic: false }, errors: {}, points: 0, pointsA: 0, partB: false, locked: false, routeIdx: 0, routeErrors: {}, done: false };
    draw();
    for (const id in VALVES) setValve(id, false, true);
    $('p2PartA').hidden = false; $('p2PartB').hidden = true;
    bindOnce();
    loadScenario();
  }

  let bound = false;
  function bindOnce() {
    if (bound) return; bound = true;
    $('valveState').addEventListener('click', e => {
      const li = e.target.closest('li[data-v]'); if (!li || st.locked) return;
      setValve(li.dataset.v, !st.valves[li.dataset.v]); CJ.audio.pop(); renderValveState();
    });
    $('valveState').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.v) { e.preventDefault(); e.target.click(); } });
    ['optContract', 'optVent'].forEach(gid => $(gid).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || st.locked) return;
      $(gid).querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
    }));
    $('btnPump').addEventListener('click', pump);
    $('btnP2Next').addEventListener('click', next);
  }

  function choice(gid) { const b = $(gid).querySelector('[aria-checked="true"]'); return b ? b.dataset.v : null; }

  function loadScenario() {
    const s = CJ.CYCLE[st.idx];
    st.locked = false;
    $('p2aStep').textContent = '· ' + (st.idx + 1) + '/' + CJ.CYCLE.length;
    $('p2Title').textContent = 'Escenari ' + (st.idx + 1) + ': què passa ara?';
    $('p2Scenario').textContent = s.scenario;
    ['optContract', 'optVent'].forEach(gid => $(gid).querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', 'false')));
    $('p2Feedback').className = 'feedback'; $('p2Feedback').innerHTML = '';
    $('btnP2Next').hidden = true; $('btnPump').disabled = false;
    setContract('none'); timeline(null);
    renderValveState();
  }

  function pump() {
    if (st.locked || game.isOver()) return;
    const s = CJ.CYCLE[st.idx];
    const contract = choice('optContract'), vent = choice('optVent');
    if (!contract || !vent) {
      U.feedback($('p2Feedback'), 'info', 'Falta alguna resposta', 'Indica quines cavitats es contrauen i si els ventricles són en sístole o en diàstole.');
      return;
    }
    const issues = [], keys = [];
    if (st.valves.tricuspid !== s.valves.tricuspid || st.valves.mitral !== s.valves.mitral) { issues.push('Revisa les vàlvules <b>auriculoventriculars</b> (tricúspide i mitral).'); keys.push('vàlvules AV'); }
    if (st.valves.pulmonary !== s.valves.pulmonary || st.valves.aortic !== s.valves.aortic) { issues.push('Revisa les vàlvules <b>semilunars</b> (pulmonar i aòrtica).'); keys.push('vàlvules semilunars'); }
    if (contract !== s.contract) { issues.push('Revisa <b>quines cavitats es contrauen</b>.'); keys.push('cavitats que es contrauen'); }
    if (vent !== s.ventricles) { issues.push('Revisa si els ventricles són en <b>sístole o diàstole</b>.'); keys.push('sístole/diàstole'); }

    if (!issues.length) {
      const first = !st.errors[s.id];
      const pts = first ? CJ.POINTS.p2a : CJ.POINTS.p2a / 2;
      st.points += pts; st.pointsA += pts;
      game.addPoints(pts, 2); game.correct();
      U.feedback($('p2Feedback'), 'ok', 'Correcte! ' + s.title + ' · +' + pts, s.explain);
      runScenario(s);
    } else {
      st.errors[s.id] = (st.errors[s.id] || 0) + 1;
      game.logError(2, 'Cicle: ' + s.title, 'error a ' + keys.join(', '));
      const alive = game.wrong($('btnPump'));
      if (!alive) return;
      if (st.errors[s.id] >= 3) {
        for (const id in VALVES) setValve(id, s.valves[id]);
        renderValveState();
        $('optContract').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x.dataset.v === s.contract ? 'true' : 'false'));
        $('optVent').querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', x.dataset.v === s.ventricles ? 'true' : 'false'));
        U.feedback($('p2Feedback'), 'ko', 'Solució: ' + s.title, s.explain + ' <em>(0 punts)</em>');
        runScenario(s);
      } else {
        U.feedback($('p2Feedback'), 'ko', 'Encara no bombeja bé · −1 ❤', '<ul><li>' + issues.join('</li><li>') + '</li></ul>');
      }
    }
  }

  function runScenario(s) {
    st.locked = true;
    $('btnPump').disabled = true;
    setContract(s.contract);
    timeline(s.timeline, true);
    if (s.sound === 'S1') CJ.audio.lub(); else if (s.sound === 'S2') CJ.audio.dub();
    else if (s.contract !== 'none') CJ.audio.lub(0.05);
    playFlows(SCEN_FLOWS[s.id], 2600, () => setContract('none'));
    $('btnP2Next').hidden = false;
    $('btnP2Next').textContent = st.idx < CJ.CYCLE.length - 1 ? 'Següent escenari →' : 'Passa a la Part B →';
    $('btnP2Next').focus({ preventScroll: true });
  }

  function next() {
    if (st.done) return;
    if (!st.partB) {
      stopFlows(); setContract('none');
      if (st.idx < CJ.CYCLE.length - 1) { st.idx++; loadScenario(); }
      else startPartB();
    } else {
      finish();
    }
  }

  /* ---------------- Part B ---------------- */
  function startPartB() {
    st.partB = true; st.locked = false; st.routeIdx = 0;
    timeline(null);
    for (const id in VALVES) setValve(id, true);
    $('p2PartA').hidden = true; $('p2PartB').hidden = false;
    $('p2Feedback').className = 'feedback'; $('p2Feedback').innerHTML = '';
    $('btnP2Next').hidden = true;
    $('routeLog').innerHTML = '';
    const btns = $('routeBtns');
    btns.innerHTML = U.shuffle(CJ.ROUTE).map(r => '<button type="button" data-r="' + r.id + '">' + U.esc(r.label) + '</button>').join('');
    btns.onclick = e => { const b = e.target.closest('button[data-r]'); if (b && !b.disabled) routeClick(b); };
    placeDrop(P.body, false);
    st.drop.setAttribute('opacity', 1);
    U.toast('Part B: guia la gota de sang!', null);
  }

  function placeDrop(p, o2) {
    st.drop.setAttribute('transform', 'translate(' + p[0] + ',' + p[1] + ')');
    st.dropCore.setAttribute('fill', o2 ? C.o2 : C.co2);
  }

  function moveDrop(pts, o2From, o2To, done) {
    const t0 = performance.now(), dur = Math.max(450, polyLen(pts) * 3.2);
    const tick = now => {
      const k = Math.min(1, (now - t0) / dur);
      placeDrop(pointAt(pts, k), k > 0.5 ? o2To : o2From);
      if (k < 1) requestAnimationFrame(tick); else if (done) done();
    };
    requestAnimationFrame(tick);
  }

  function routeClick(btn) {
    if (st.locked || game.isOver()) return;
    const step = CJ.ROUTE[st.routeIdx];
    if (btn.dataset.r === step.id) {
      const first = !st.routeErrors[step.id];
      const pts = first ? CJ.POINTS.p2b : CJ.POINTS.p2b / 2;
      st.points += pts; game.addPoints(pts, 2); game.correct();
      btn.disabled = true;
      st.locked = true;
      const prevO2 = st.routeIdx ? CJ.ROUTE[st.routeIdx - 1].o2 : false;
      moveDrop(SEG[step.node], prevO2, step.o2, () => { st.locked = false; });
      const li = document.createElement('li');
      li.innerHTML = '<b>' + U.esc(step.label) + '.</b> ' + U.esc(step.log);
      $('routeLog').appendChild(li); li.scrollIntoView({ block: 'nearest' });
      U.feedback($('p2Feedback'), 'ok', 'Correcte · +' + pts, '');
      st.routeIdx++;
      if (st.routeIdx >= CJ.ROUTE.length) {
        st.locked = true;
        setTimeout(() => {
          U.feedback($('p2Feedback'), 'ok', 'Circuit complet! 🎉', 'La gota ha fet la circulació menor (pulmonar) i la major (sistèmica). Recorda: les artèries pulmonars porten sang desoxigenada i les venes pulmonars, oxigenada.');
          $('btnP2Next').hidden = false; $('btnP2Next').textContent = 'Acaba la fase 2 →';
        }, 900);
      }
    } else {
      st.routeErrors[step.id] = (st.routeErrors[step.id] || 0) + 1;
      game.logError(2, 'Recorregut: després de «' + (st.routeIdx ? CJ.ROUTE[st.routeIdx - 1].label : 'Teixits del cos') + '»', btn.textContent);
      const alive = game.wrong(btn);
      if (!alive) return;
      U.feedback($('p2Feedback'), 'ko', 'No hi va encara · −1 ❤', 'On anirà la sang just després de <b>' + U.esc(st.routeIdx ? CJ.ROUTE[st.routeIdx - 1].label : 'els teixits del cos') + '</b>?');
    }
  }

  function finish() {
    if (st.done) return;
    st.done = true;
    stopFlows();
    const errs = Object.values(st.errors).reduce((a, b) => a + b, 0) + Object.values(st.routeErrors).reduce((a, b) => a + b, 0);
    const maxA = CJ.CYCLE.length * CJ.POINTS.p2a, maxB = CJ.ROUTE.length * CJ.POINTS.p2b;
    game.phaseDone(2, {
      points: st.points, max: maxA + maxB, errors: errs,
      correct: CJ.CYCLE.filter(s => (st.errors[s.id] || 0) < 3).length + CJ.ROUTE.length,
      total: CJ.CYCLE.length + CJ.ROUTE.length,
      firstTry: CJ.CYCLE.filter(s => !st.errors[s.id]).length + CJ.ROUTE.filter(r => !st.routeErrors[r.id]).length
    });
  }

  function stop() { stopFlows(); }

  return { init, stop, _debug: () => st };
})();
