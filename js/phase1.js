/* Cor en Joc — Fase 1: identificació d'estructures en el model 3D */
window.CJ = window.CJ || {};

CJ.Phase1 = (function () {
  const $ = id => document.getElementById(id);
  const U = CJ.util;
  let heart = null, game = null, state = null, current = null, labels = {};
  let downAt = null;

  function init(g) {
    game = g;
    state = { found: {}, errors: {}, hints: {}, points: 0, done: false };
    current = null;
    labels = {};
    $('p1Labels').innerHTML = '';
    $('p1Total').textContent = CJ.STRUCTURES.length;
    renderList();
    updateProgress();

    if (!heart) {
      try {
        heart = new CJ.Heart3D($('heartCanvas'));
      } catch (e) {
        $('p1Loading').textContent = 'El teu navegador no admet WebGL. Activa l\'acceleració gràfica o prova amb un altre navegador.';
        console.error(e);
        return;
      }
      heart.onFrame = updateLabels;
      bindControls();
    } else {
      Object.values(heart.structures).forEach(st => { st.found = false; st.materials.forEach(m => { if (m.emissive) { m.emissive.setHex(0); m.emissiveIntensity = 0; } }); });
      heart.resetView();
    }
    $('p1Loading').hidden = true;
    $('ctlCut').value = 0; $('ctlAlpha').value = 0; heart.setCut(0); heart.setAlpha(0);
    $('ctlBeat').checked = true; heart.setBeat(true);
    $('ctlRotate').checked = false; heart.setAutoRotate(false);
  }

  function bindControls() {
    const canvas = $('heartCanvas');
    $('ctlRotate').addEventListener('change', e => heart.setAutoRotate(e.target.checked));
    $('ctlBeat').addEventListener('change', e => heart.setBeat(e.target.checked));
    $('ctlLabels').addEventListener('change', updateLabels);
    $('ctlCut').addEventListener('input', e => heart.setCut(e.target.value / 100));
    $('ctlAlpha').addEventListener('input', e => heart.setAlpha(e.target.value / 100));
    $('ctlReset').addEventListener('click', () => { heart.resetView(); });

    // Diferenciem clic (seleccionar) d'arrossegar (girar)
    canvas.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    canvas.addEventListener('pointerup', e => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
      const dt = performance.now() - downAt.t;
      downAt = null;
      if (moved > 6 || dt > 600) return;
      const id = heart.pick(e.clientX, e.clientY);
      if (id) openModal(id);
    });
    const tip = $('p1Tip');
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const id = heart.pick(e.clientX, e.clientY);
      heart.setHover(id);
      canvas.classList.toggle('is-hover', !!id);
      if (id) {
        const r = canvas.getBoundingClientRect();
        tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px';
        tip.textContent = state.found[id] ? CJ.STRUCTURES.find(s => s.id === id).name : 'Clica per identificar';
        tip.classList.add('is-on');
      } else tip.classList.remove('is-on');
    });
    canvas.addEventListener('pointerleave', () => { heart.setHover(null); tip.classList.remove('is-on'); });

    // Modal
    $('identifyModal').addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('identifyModal').hidden) closeModal(); });
    $('identifyForm').addEventListener('submit', e => { e.preventDefault(); check(); });
    $('btnHint').addEventListener('click', hint);
  }

  function structure(id) { return CJ.STRUCTURES.find(s => s.id === id); }

  function openModal(id) {
    if (state.done || game.isOver()) return;
    const s = structure(id);
    current = id;
    const fb = $('identifyFeedback');
    const input = $('identifyInput');
    $('identifyHint').textContent = state.hints[id] ? hintText(s) : '';
    if (state.found[id]) {
      $('modalTitle').textContent = s.name;
      U.feedback(fb, 'ok', 'Ja l\'has identificada ✔', s.info);
      input.value = s.name; input.disabled = true;
      $('btnCheck').hidden = true; $('btnHint').hidden = true;
    } else {
      $('modalTitle').textContent = 'Què és aquesta estructura?';
      fb.className = 'feedback'; fb.innerHTML = '';
      input.value = ''; input.disabled = false;
      $('btnCheck').hidden = false; $('btnHint').hidden = !!state.hints[id];
      $('btnCheck').textContent = 'Comprova';
    }
    $('identifyModal').hidden = false;
    heart.setHover(id);
    setTimeout(() => { if (!input.disabled) input.focus(); }, 30);
  }

  function closeModal() {
    $('identifyModal').hidden = true;
    heart.setHover(null);
    current = null;
    if (!state.done && Object.keys(state.found).length === CJ.STRUCTURES.length) finish();
  }

  function hintText(s) {
    const n = s.name;
    return 'Pista: ' + n.split(' ').map(w => w[0].toUpperCase() + ' _'.repeat(w.length - 1)).join('   ') + '  (' + n.replace(/ /g, '').length + ' lletres)';
  }

  function hint() {
    const s = structure(current); if (!s || state.hints[current]) return;
    state.hints[current] = true;
    state.points -= CJ.POINTS.hint;
    game.addPoints(-CJ.POINTS.hint, 1);
    $('identifyHint').textContent = hintText(s);
    $('btnHint').hidden = true;
    $('identifyInput').focus();
  }

  function check() {
    const id = current; if (!id || state.found[id]) { closeModal(); return; }
    const s = structure(id);
    const input = $('identifyInput'), fb = $('identifyFeedback');
    const res = U.judge(input.value, s);
    if (res === 'empty') { U.shake(input); input.focus(); return; }
    if (res === 'partial') {
      U.feedback(fb, 'info', 'Gairebé!', 'La resposta és incompleta: concreta-la més (costat, tipus…). No perds cap cor.');
      input.focus(); input.select();
      return;
    }
    if (res === 'ok') {
      const first = !state.errors[id];
      const pts = first ? CJ.POINTS.p1 : CJ.POINTS.p1 / 2;
      state.found[id] = 'ok';
      state.points += pts;
      game.addPoints(pts, 1);
      game.correct();
      heart.markFound(id);
      addLabel(id);
      U.feedback(fb, 'ok', 'Correcte! ' + s.name + ' · +' + pts + ' punts', s.info);
      done(fb);
    } else {
      state.errors[id] = (state.errors[id] || 0) + 1;
      game.logError(1, s.name, input.value);
      const alive = game.wrong($('identifyModal').querySelector('.modal__dialog'));
      if (!alive) { $('identifyModal').hidden = true; return; }
      if (state.errors[id] >= 3) {
        state.found[id] = 'revealed';
        heart.markFound(id);
        addLabel(id);
        U.feedback(fb, 'ko', 'Era: ' + s.name, s.info + ' <em>(0 punts; queda marcada per seguir avançant.)</em>');
        done(fb);
      } else {
        U.feedback(fb, 'ko', 'Incorrecte · −1 ❤', 'Torna-ho a provar. Fixa\'t en la posició (dreta/esquerra) i en el color: blau = sang desoxigenada, vermell = oxigenada. Intents: ' + state.errors[id] + '/3.');
        input.select();
      }
    }
    renderList(); updateProgress();
  }

  function done(fb) {
    $('identifyInput').disabled = true;
    $('btnHint').hidden = true;
    $('btnCheck').textContent = 'Continua';
    $('btnCheck').hidden = false;
    $('btnCheck').focus();
    // El següent «Comprova» tanca el modal (vegeu check()).
  }

  function addLabel(id) {
    const el = document.createElement('div');
    el.className = 'label3d';
    el.textContent = structure(id).name;
    $('p1Labels').appendChild(el);
    labels[id] = el;
  }

  function updateLabels() {
    const show = $('ctlLabels').checked;
    for (const id in labels) {
      const el = labels[id];
      const p = heart.projectAnchor(id);
      if (!show || !p || !p.visible) { el.style.display = 'none'; continue; }
      el.style.display = '';
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      el.classList.toggle('is-back', !p.front);
    }
  }

  function renderList() {
    const ul = $('p1List');
    ul.innerHTML = CJ.STRUCTURES.map(s => {
      const st = state.found[s.id];
      const cls = st === 'ok' ? 'is-found' : st === 'revealed' ? 'is-revealed' : '';
      return '<li class="' + cls + '">' + (st ? (st === 'ok' ? '✓ ' : '✗ ') + U.esc(s.name) : '? ? ?') + '</li>';
    }).join('');
  }

  function updateProgress() {
    const n = Object.keys(state.found).length, total = CJ.STRUCTURES.length;
    $('p1Count').textContent = n;
    $('p1Bar').style.width = (100 * n / total) + '%';
  }

  function finish() {
    if (state.done) return;
    state.done = true;
    const ok = Object.values(state.found).filter(v => v === 'ok').length;
    const errs = Object.values(state.errors).reduce((a, b) => a + b, 0);
    game.phaseDone(1, {
      points: state.points,
      max: CJ.STRUCTURES.length * CJ.POINTS.p1,
      correct: ok, total: CJ.STRUCTURES.length, errors: errs,
      firstTry: CJ.STRUCTURES.filter(s => state.found[s.id] === 'ok' && !state.errors[s.id]).length
    });
  }

  function pause(on) { if (heart) heart.setBeat(on ? false : $('ctlBeat').checked); }

  return { init, pause, get heart() { return heart; }, _open: openModal };
})();
