# anatomia
Aplicación Práctica para Estudiantes de Ciclo Formativo de Grado Medio y Superior en Sanidad.

## Cor en Joc — Anatomia del cor humà

Activitat interactiva en tres fases sobre l'anatomia del cor humà.
**Autor i professor:** Rubén Vallejo · FP Sanitari Vall d'Hebron · 2026.

| Fase | Mecànica | Objectiu d'aprenentatge |
|------|----------|-------------------------|
| 1 · Model 3D | Cor 3D que es pot girar, fer bategar, obrir amb un tall frontal i fer transparent. Es clica una estructura i s'escriu el nom en una finestra modal. | Identificar 16 estructures: cavitats, grans vasos i vàlvules. |
| 2 · Sístole i diàstole | Esquema 2D: s'obren i es tanquen les vàlvules, es tria què es contrau i es prem «Bombeja!» (5 escenaris del cicle). Després, una gota de sang es guia pel circuit amb botons. | Relacionar la dinàmica valvular amb el cicle cardíac i seqüenciar la circulació menor i la major. |
| 3 · Text amb buits | Arrossegar i deixar anar etiquetes en un text (també funciona tocant l'etiqueta i després el buit). | Fer servir el vocabulari anatòmic en context. |

**Regles comunes:** 10 cors per a tota l'activitat; cada error en resta un. L'encert al primer intent dona la puntuació
sencera i, després d'un error, la meitat. La nota (sobre 10) es calcula amb els punts obtinguts. L'alumne s'ha de
registrar amb nom i correu; en acabar, pot imprimir o desar el resultat en PDF, o descarregar-lo (.txt / .csv).

L'especificació completa (requisits, regles i criteris d'acceptació) és a [`docs/SPEC.md`](docs/SPEC.md).

### Com fer-la servir

- **Sense instal·lar res:** obre `index.html` amb el navegador. Totes les llibreries són locals (`js/vendor`), i
  per això també funciona sense connexió.
- **Publicar-la amb GitHub Pages:** *Settings → Pages → Build and deployment → Source: «Deploy from a branch»*,
  branca `main`, carpeta `/ (root)` → *Save*. En 1-2 minuts queda disponible a
  <https://rvs78.github.io/anatomia/>. Cada canvi que arribi a `main` es republica sol.
  També es pot pujar la carpeta a qualsevol servidor web estàtic.
- **Recollir resultats (opcional):** a `js/config.js`, posa a `RESULTS_ENDPOINT` la URL d'un servei que accepti un
  `POST` amb JSON (per exemple, una aplicació web de Google Apps Script que escrigui en un full de càlcul). Si no
  s'hi posa res, els resultats només es desen al navegador de l'alumne.

### Personalitzar els continguts

Tots els textos didàctics són a `js/data.js`:

- `STRUCTURES`: estructures de la fase 1, amb les respostes acceptades (català, castellà, abreviatures), les
  respostes incompletes i l'explicació.
- `CYCLE`: escenaris del cicle cardíac (estat de les vàlvules, cavitats que es contrauen, explicació).
- `ROUTE`: estacions del recorregut de la sang.
- `CLOZE`: text de la fase 3. Els buits s'hi marquen amb `[[clau]]`.
- `POINTS` i `MAX_LIVES`: puntuació i nombre de cors.

### Estructura

```
index.html          Pantalles (presentació, instruccions, fases, resums, resultats)
css/styles.css      Estils (adaptats a mòbil i a impressió)
js/heart3d.js       Model 3D procedural del cor (three.js)
js/phase1.js        Fase 1: selecció 3D i modal de resposta
js/phase2.js        Fase 2: esquema SVG, vàlvules, partícules i recorregut
js/phase3.js        Fase 3: arrossegar i deixar anar (Pointer Events)
js/main.js          Registre, vides, puntuació, resums, resultats i informes
js/util.js          Correcció tolerant de respostes, utilitats
js/audio.js         Sons sintetitzats (batec S1/S2, encert, error)
js/vendor/          three.js r170 i OrbitControls (llicència MIT)
tests/              Proves (node tests/judge.js · node tests/e2e.js)
tools/              Previsualització del model 3D
```

### Proves

```bash
node tests/judge.js        # correcció de respostes de la fase 1
node tests/e2e.js out/     # recorregut complet amb Playwright + Chromium (desa captures a out/)
```
