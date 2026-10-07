/* Cor en Joc — Fase 3: text amb buits (drag & drop amb Pointer Events) */
window.CJ = window.CJ || {};

CJ.Phase3 = (function () {
  const $ = id => document.getElementById(id);
  const U = CJ.util;
  let game, st, drag = null, bound = false;

  function init(g) {
    game = g;
    st = { filled: {}, errors: {}, points: 0, selected: null, done: false, total: 0 };
    const data = CJ.CLOZE;
    $('p3Title').textContent = data.title;
    let n = 0;
    $('clozeText').innerHTML = data.paragraphs.map(par =>
      '<p>' + U.esc(par).replace(/\[\[(\w+)\]\]/g, (_, key) => {
        n++;
        return '<button type="button" class="gap" data-key="' + key + '" data-n="' + n + '" aria-label="Buit ' + n + '"></button>';
      }) + '</p>'
    ).join('');
    st.total = n;
    const all = Object.assign({}, data.tags, data.distractors);
    $('tags').innerHTML = U.shuffle(Object.keys(all)).map(k =>
      '<button type="button" class="tag" data-key="' + k + '">' + U.esc(all[k]) + '</button>'
    ).join('');
    $('p3Feedback').className = 'feedback'; $('p3Feedback').innerHTML = '';
    if (!bound) bind();
  }

  function bind() {
    bound = true;
    const tags = $('tags');
    tags.addEventListener('pointerdown', onDown);
    tags.addEventListener('click', e => {
      const t = e.target.closest('.tag'); if (!t || st.done) return;
      if (t.dataset.dragged) { delete t.dataset.dragged; return; }
      select(st.selected === t ? null : t);
    });
    $('clozeText').addEventListener('click', e => {
      const gap = e.target.closest('.gap'); if (!gap || gap.classList.contains('is-filled')) return;
      if (st.selected) attempt(st.selected, gap);
      else U.toast('Primer tria una etiqueta de la part superior', null);
    });
  }

  function select(tag) {
    document.querySelectorAll('.tag.is-selected').forEach(t => t.classList.remove('is-selected'));
    st.selected = tag;
    if (tag) tag.classList.add('is-selected');
    document.querySelectorAll('.gap:not(.is-filled)').forEach(g => g.classList.toggle('is-target', !!tag));
  }

  function onDown(e) {
    const tag = e.target.closest('.tag');
    if (!tag || st.done || e.button > 0) return;
    drag = { tag, x0: e.clientX, y0: e.clientY, ghost: null, over: null, id: e.pointerId };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.ghost = drag.tag.cloneNode(true);
      drag.ghost.classList.add('tag-ghost');
      document.body.appendChild(drag.ghost);
      drag.tag.classList.add('is-dragging');
      select(null);
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const gap = under && under.closest ? under.closest('.gap:not(.is-filled)') : null;
    if (drag.over && drag.over !== gap) drag.over.classList.remove('is-target');
    if (gap) gap.classList.add('is-target');
    drag.over = gap;
    autoScroll(e.clientY);
  }

  function autoScroll(y) {
    const edge = 70;
    if (y > window.innerHeight - edge) window.scrollBy(0, 12);
    else if (y < edge + 60) window.scrollBy(0, -12);
  }

  function cleanup() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    if (drag) {
      if (drag.ghost) drag.ghost.remove();
      drag.tag.classList.remove('is-dragging');
      if (drag.over) drag.over.classList.remove('is-target');
    }
    drag = null;
  }
  function onCancel() { cleanup(); }

  function onUp(e) {
    if (!drag) return;
    const d = drag;
    if (d.ghost) {
      d.tag.dataset.dragged = '1'; // evita que el clic posterior seleccioni l'etiqueta
      setTimeout(() => { delete d.tag.dataset.dragged; }, 50);
      const gap = d.over;
      cleanup();
      if (gap) attempt(d.tag, gap);
    } else cleanup();
  }

  function attempt(tag, gap) {
    if (st.done || game.isOver()) return;
    const key = tag.dataset.key;
    select(null);
    if (key === gap.dataset.key) {
      const first = !st.errors[key];
      const pts = first ? CJ.POINTS.p3 : CJ.POINTS.p3 / 2;
      st.points += pts; game.addPoints(pts, 3); game.correct();
      gap.textContent = tag.textContent;
      gap.classList.add('is-filled'); gap.classList.remove('is-target');
      gap.setAttribute('aria-label', 'Buit ' + gap.dataset.n + ': ' + tag.textContent);
      tag.remove();
      st.filled[gap.dataset.n] = true;
      U.feedback($('p3Feedback'), 'ok', 'Correcte! «' + gap.textContent + '» · +' + pts, '');
      if (Object.keys(st.filled).length === st.total) finish();
    } else {
      st.errors[key] = (st.errors[key] || 0) + 1;
      game.logError(3, 'Buit ' + gap.dataset.n + ' (' + (CJ.CLOZE.tags[gap.dataset.key] || '') + ')', tag.textContent);
      gap.classList.add('is-wrong');
      setTimeout(() => gap.classList.remove('is-wrong'), 600);
      U.shake(gap); U.shake(tag);
      const alive = game.wrong(null);
      if (!alive) return;
      U.feedback($('p3Feedback'), 'ko', '«' + tag.textContent + '» no va al buit ' + gap.dataset.n + ' · −1 ❤', 'L\'etiqueta torna a la part superior. Rellegeix la frase sencera abans de tornar-ho a provar.');
    }
  }

  function finish() {
    if (st.done) return;
    st.done = true;
    const keys = Object.keys(CJ.CLOZE.tags);
    const errs = Object.values(st.errors).reduce((a, b) => a + b, 0);
    U.feedback($('p3Feedback'), 'ok', 'Text complet! 🎉', 'Has reconstruït tot el text.');
    setTimeout(() => game.phaseDone(3, {
      points: st.points, max: st.total * CJ.POINTS.p3, errors: errs,
      correct: st.total, total: st.total,
      firstTry: keys.filter(k => !st.errors[k]).length
    }), 900);
  }

  return { init };
})();
