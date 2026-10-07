/* Proves unitàries de la correcció de respostes de la fase 1. Ús: node tests/judge.js */
global.window = global;
require('../js/data.js');
require('../js/util.js');
const U = CJ.util, g = id => CJ.STRUCTURES.find(s => s.id === id);
const cases = [
  ['ventriculo izquierdo', 'lv', 'ok'], ['VE', 'lv', 'ok'], ['ventricle', 'lv', 'partial'], ['aorta', 'lv', 'wrong'],
  ['Ventricle esquere', 'lv', 'ok'], ['el ventrícle esquerre', 'lv', 'ok'], ['bicuspide', 'tricuspid', 'wrong'],
  ['tricuspid', 'tricuspid', 'ok'], ['vena cava superor', 'svc', 'ok'], ['vena cava inferior', 'svc', 'wrong'],
  ['Aurícula dreta', 'ra', 'ok'], ['aurícula', 'la', 'partial'], ['arteria pulmonar', 'rpa', 'partial'],
  ['arteria pulmonar', 'pt', 'ok'], ['Vàlvula mitral', 'mitral', 'ok'], ['vàlvula', 'mitral', 'partial'],
  ['venas pulmonares derechas', 'rpv', 'ok'], ['arco de la aorta', 'aorta', 'ok'], ['', 'ra', 'empty']
];
let fails = 0;
for (const [a, id, exp] of cases) {
  const r = U.judge(a, g(id));
  if (r !== exp) { fails++; console.log('FAIL', JSON.stringify(a), id, '→', r, '(esperat', exp + ')'); }
}
// Cap sinònim d'una estructura pot coincidir exactament amb el d'una altra
const seen = {};
CJ.STRUCTURES.forEach(s => s.accept.forEach(a => { const k = U.normalize(a); if (seen[k] && seen[k] !== s.id) { fails++; console.log('DUPLICAT', k, seen[k], s.id); } seen[k] = s.id; }));
console.log((cases.length - fails) + '/' + cases.length + ' casos correctes');
process.exit(fails ? 1 : 0);
