# Especificació — «Cor en Joc»: anatomia del cor humà

Aplicació web interactiva per a l'alumnat de CFGM/CFGS de Sanitat.
Autor i professor: **Rubén Vallejo** · FP Sanitari Vall d'Hebron · 2026.
Font de continguts: presentació *Sistema Cardiovascular. 1. Anatomia del Cor* (31 diapositives) i la làmina
de referència «costat dret / costat esquerre».

> Metodologia: *spec-driven development*. Aquest document fixa els requisits (R), les regles de joc (G) i els
> criteris d'acceptació (CA) abans d'implementar. Qualsevol canvi de comportament s'ha de reflectir primer aquí.

---

## 1. Objectius d'aprenentatge

| Codi | Objectiu | Fase |
|------|----------|------|
| OA1 | Identificar en un model tridimensional les cavitats, els grans vasos i les vàlvules del cor. | 1 |
| OA2 | Relacionar l'estat de les vàlvules (AV i semilunars) i la contracció de les cavitats amb les fases del cicle cardíac (sístole/diàstole). | 2 |
| OA3 | Seqüenciar el recorregut de la sang per la circulació menor i major. | 2 |
| OA4 | Aplicar el vocabulari anatòmic (pericardi, capes de la paret, vàlvules, coronàries…) en un text expositiu. | 3 |

## 2. Requisits generals

- **R1 — Plataforma.** Web estàtica (HTML + CSS + JS) sense servidor ni dependències externes en temps
  d'execució. Ha de funcionar obrint `index.html` directament (`file://`) i des de GitHub Pages.
- **R2 — Idioma.** Interfície en català (llengua del material). Les respostes escrites de la fase 1 accepten
  també el castellà i abreviatures habituals (VE, AD, VCS…).
- **R3 — Dispositius.** Escriptori i tauleta (ratolí i tàctil). Amplada mínima útil: 360 px.
- **R4 — Registre.** Abans de jugar, l'alumne introdueix **nom i cognoms** (≥ 3 caràcters) i **correu
  electrònic** (format vàlid). Sense dades vàlides no es pot començar.
- **R5 — Presentació.** Pantalla inicial amb títol, objectius, les 3 fases, l'autor **Rubén Vallejo**, el seu
  càrrec de **professor a l'FP Sanitari Vall d'Hebron** i l'any **2026**.
- **R6 — Instruccions.** Cada fase comença amb una pantalla d'instruccions numerades pas a pas, que es pot
  tornar a consultar en qualsevol moment (botó «?»).
- **R7 — Retroalimentació.** Cada resposta rep feedback immediat (correcte/incorrecte + explicació breu).
  Cada fase acaba amb una pantalla de resum (punts, errors, cors restants).
- **R8 — Resultats finals.** Pantalla amb nom, correu, data, punts per fase, nota sobre 10, cors restants, temps
  i recomanacions de repàs segons els errors. Opcions: imprimir/desar PDF, descarregar informe (.txt i .csv),
  tornar a jugar. L'historial es desa al navegador (`localStorage`).
- **R9 — Enviament opcional.** Si a `js/config.js` es defineix `RESULTS_ENDPOINT`, el resultat s'envia per
  `POST` (JSON). Per defecte està desactivat.
- **R10 — Accessibilitat.** Contrast AA, focus visible, ús de teclat als formularis i a la fase 3
  (alternativa «toca l'etiqueta i després el buit» al drag & drop), `aria-live` per al feedback.

## 3. Regles de joc globals

- **G1 — Vides.** L'alumne comença amb **10 cors**. Les vides són compartides per les tres fases.
- **G2 — Error = vida.** Tota resposta incorrecta (fase 1, 2 o 3) resta **1 cor** amb animació.
- **G3 — Game over.** Amb 0 cors el joc s'atura i es mostra la pantalla de resultats (parcials).
- **G4 — Puntuació.** Encert al primer intent = puntuació completa de l'ítem; encert després d'algun error =
  meitat. Les pistes resten punts però no vides. La nota = 10 × punts / punts màxims (1 decimal).
- **G5 — Bonus.** Cada cor que queda en acabar suma +20 punts al total (no a la nota).

## 4. Fase 1 — Model 3D del cor (OA1)

- **F1.1** Model 3D del cor construït proceduralment, fidel a la làmina de referència (vista anterior,
  costat dret de l'alumne a l'esquerra de la pantalla): aurícules, ventricles, arc aòrtic amb els tres troncs
  supraaòrtics, tronc pulmonar i artèries pulmonars, venes caves, venes pulmonars, artèries coronàries i
  quatre vàlvules.
- **F1.2** Manipulació: girar (arrossegar), zoom (roda/pinça), desplaçar (botó dret / dos dits), girar
  automàticament, bategar (animació de sístole/diàstole), restaurar la vista.
- **F1.3** «Moldejable»: control lliscant de **tall frontal** que obre el cor per veure l'interior (cavitats
  i vàlvules) i control de **transparència** del miocardi.
- **F1.4** En passar per sobre d'una estructura es ressalta. En fer-hi clic s'obre un **modal** amb un camp de
  text «Quina estructura és?».
- **F1.5** Estructures avaluables (16): aurícula dreta, aurícula esquerra, ventricle dret, ventricle esquerre,
  arc aòrtic, tronc pulmonar, artèria pulmonar dreta, artèria pulmonar esquerra, vena cava superior, vena
  cava inferior, venes pulmonars dretes, venes pulmonars esquerres, vàlvula tricúspide, vàlvula mitral,
  vàlvula pulmonar, vàlvula aòrtica.
- **F1.6** Correcció tolerant: ignora majúscules, accents, articles i signes; accepta sinònims (català,
  castellà, abreviatures) i errors tipogràfics menors (distància d'edició ≤ 1 o ≤ 2 segons llargada).
  Una resposta **incompleta però no errònia** (p. ex. «ventricle» sense lateralitat) demana concreció i
  **no** resta vida.
- **F1.7** Encert: +100 (o +50), l'estructura queda verda amb una etiqueta 3D i es mostra una explicació.
  Error: −1 cor. Després de 3 errors a la mateixa estructura es revela la resposta (0 punts).
- **F1.8** Pista (opcional): mostra la inicial i el nombre de lletres; −30 punts.
- **F1.9** La fase acaba quan totes les estructures estan identificades.

## 5. Fase 2 — Sístole i diàstole (OA2, OA3)

Esquema 2D (tall coronal) del cor amb vàlvules interactives, partícules de sang animades i línia de temps del
cicle (0,8 s: sístole auricular 0,1 s · sístole ventricular 0,3 s · diàstole 0,4 s).

**Part A — «Pilota el cicle».** 5 escenaris en ordre: diàstole (ompliment passiu), sístole auricular,
contracció isovolumètrica (S1), ejecció ventricular, relaxació isovolumètrica (S2). Per a cada escenari l'alumne:
1. obre/tanca cada vàlvula fent-hi clic a l'esquema (tricúspide, mitral, pulmonar, aòrtica);
2. tria quines cavitats es contrauen (cap / aurícules / ventricles);
3. indica si els ventricles són en sístole o en diàstole;
4. prem **Bombeja!**

Correcte → animació del flux, so del batec (S1 «lub» / S2 «dub») i explicació; +100/+50.
Incorrecte → −1 cor i indicació de quin element falla (sense donar la solució); al 3r error es revela.

**Part B — «Segueix la gota».** Botons barrejats amb les 14 estacions del recorregut. L'alumne prem, en ordre,
on va la sang: venes caves → aurícula dreta → v. tricúspide → ventricle dret → v. pulmonar → tronc i artèries
pulmonars → capil·lars pulmonars → venes pulmonars → aurícula esquerra → v. mitral → ventricle esquerre →
v. aòrtica → aorta → teixits del cos. Cada encert mou la gota (blava → vermella als pulmons) i afegeix una
explicació al diari de ruta; +20/+10. Error → −1 cor.

## 6. Fase 3 — Text amb buits (OA4)

- **F3.1** Un text expositiu basat en la presentació, amb 18 buits; a la part superior, les etiquetes
  barrejades (amb 2 distractors).
- **F3.2** Arrossegar i deixar anar (ratolí i tàctil, Pointer Events). Alternativa: tocar etiqueta → tocar buit.
- **F3.3** Encert: l'etiqueta queda fixada en verd; +50/+25. Error: l'etiqueta torna al banc, el buit
  tremola i −1 cor.
- **F3.4** La fase acaba quan tots els buits són plens.

## 7. Criteris d'acceptació

- **CA1** Sense nom o amb correu invàlid, el botó «Comença» mostra l'error i no avança.
- **CA2** La presentació mostra «Rubén Vallejo», «FP Sanitari Vall d'Hebron» i «2026».
- **CA3** El marcador mostra 10 cors en començar; cada error en qualsevol fase en resta exactament 1.
- **CA4** A 0 cors apareix la pantalla de resultats amb l'estat «Sense vides».
- **CA5** Fase 1: clic sobre el ventricle esquerre → modal; «ventriculo izquierdo» i «VE» són correctes;
  «ventricle» demana concreció sense restar vida; «aorta» per al ventricle esquerre resta 1 cor.
- **CA6** Fase 1: amb el tall frontal activat es poden seleccionar les 4 vàlvules.
- **CA7** Fase 2: l'escenari «ejecció» només és correcte amb AV tancades, semilunars obertes, ventricles
  contraient-se i «sístole».
- **CA8** Fase 2B: prémer «Ventricle esquerre» just després de «Venes caves» resta 1 cor.
- **CA9** Fase 3: deixar una etiqueta en un buit incorrecte la retorna al banc i resta 1 cor.
- **CA10** Resultats: es poden descarregar l'informe i imprimir; es desa a l'historial local.
- **CA11** Sense errors a la consola en carregar i jugar les tres fases (Chromium).
