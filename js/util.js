/* Cor en Joc — utilitats compartides */
window.CJ = window.CJ || {};

CJ.util = (function () {
  const STOP = new Set(['el', 'la', 'els', 'les', 'l', 'lo', 'los', 'las', 'de', 'del', 'dels', 'd', 'un', 'una', 'es', 'és', 'a']);

  /* Normalitza una resposta: minúscules, sense accents ni signes ni articles. */
  function normalize(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/l·l/g, 'll').replace(/[·•.]/g, '')
      .replace(/[^a-z0-9ñç ]+/g, ' ')
      .split(/\s+/).filter(w => w && !STOP.has(w))
      .join(' ');
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  /* Tolerància tipogràfica segons la llargada (les abreviatures han de ser exactes). */
  function tolerance(len) { return len < 5 ? 0 : len < 10 ? 1 : 2; }

  /* Avalua una resposta per a una estructura.
   * Retorna 'ok' | 'partial' | 'wrong' | 'empty'. */
  function judge(answer, structure) {
    const a = normalize(answer);
    if (!a) return 'empty';
    const accept = structure.accept.map(normalize);
    if (accept.includes(a)) return 'ok';
    const partial = (structure.partial || []).map(normalize);
    if (partial.includes(a)) return 'partial';
    // Si coincideix exactament amb una altra estructura, és un error (no un error tipogràfic).
    const others = CJ.STRUCTURES.filter(s => s !== structure);
    const otherAccept = [].concat(...others.map(s => s.accept.map(normalize)));
    if (otherAccept.includes(a)) return 'wrong';
    // Error tipogràfic: dins la tolerància i més a prop d'aquesta estructura que de cap altra.
    const mine = Math.min(...accept.map(x => levenshtein(a, x) - tolerance(x.length)));
    const theirs = Math.min(...otherAccept.map(x => levenshtein(a, x)));
    if (mine <= 0 && Math.min(...accept.map(x => levenshtein(a, x))) < theirs) return 'ok';
    return 'wrong';
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const HEART_PATH = 'M16 29s-12-7.4-12-16a7 7 0 0 1 12-4.9A7 7 0 0 1 28 13c0 8.6-12 16-12 16z';
  function heartSvg(cls) {
    return '<svg class="' + (cls || 'life') + '" viewBox="0 0 32 32" aria-hidden="true"><path d="' + HEART_PATH + '"/></svg>';
  }

  let toastTimer = null;
  function toast(msg, kind) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast is-on' + (kind ? ' is-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2200);
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }

  function feedback(el, kind, title, body) {
    el.className = 'feedback is-' + kind;
    el.innerHTML = (title ? '<strong>' + title + '</strong>' : '') + (body || '');
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return { normalize, levenshtein, tolerance, judge, shuffle, heartSvg, toast, shake, feedback, download, esc, HEART_PATH };
})();
