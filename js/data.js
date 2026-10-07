/* Cor en Joc — dades didàctiques (font: presentació «Anatomia del Cor», FP Sanitari Vall d'Hebron) */
window.CJ = window.CJ || {};

/* ------------------------------------------------------------------ */
/* FASE 1 — Estructures del model 3D                                   */
/* accept: respostes vàlides (català, castellà, abreviatures).         */
/* partial: respostes incompletes que demanen concreció (no resten).   */
/* ------------------------------------------------------------------ */
CJ.STRUCTURES = [
  {
    id: 'ra', name: 'Aurícula dreta',
    accept: ['auricula dreta', 'auricula derecha', 'atri dret', 'atrio derecho', 'ad', 'ar'],
    partial: ['auricula', 'atri', 'atrio', 'orelleta'],
    info: 'Cavitat receptora de parets primes. Rep la sang desoxigenada de les venes caves i del si coronari.'
  },
  {
    id: 'la', name: 'Aurícula esquerra',
    accept: ['auricula esquerra', 'auricula izquierda', 'atri esquerre', 'atrio izquierdo', 'ae', 'ai'],
    partial: ['auricula', 'atri', 'atrio', 'orelleta'],
    info: 'Forma la major part de la base posterior del cor. Rep la sang oxigenada de les quatre venes pulmonars.'
  },
  {
    id: 'rv', name: 'Ventricle dret',
    accept: ['ventricle dret', 'ventriculo derecho', 'vd'],
    partial: ['ventricle', 'ventriculo'],
    info: 'Forma la major part de la cara esternocostal. Impulsa la sang a baixa pressió cap a la circulació menor (pulmonar).'
  },
  {
    id: 'lv', name: 'Ventricle esquerre',
    accept: ['ventricle esquerre', 'ventriculo izquierdo', 've', 'vi'],
    partial: ['ventricle', 'ventriculo'],
    info: 'Paret unes tres vegades més gruixuda que la del dret: ha de vèncer l\'alta resistència sistèmica. Forma l\'àpex.'
  },
  {
    id: 'aorta', name: 'Arc aòrtic',
    accept: ['arc aortic', 'arco aortico', 'aorta', 'arteria aorta', 'cayado aortico', 'arc de l aorta', 'arco de la aorta', 'aorta ascendent', 'aorta ascendente'],
    partial: ['arc', 'arco'],
    info: 'L\'aorta surt del ventricle esquerre i forma l\'arc del qual neixen els troncs supraaòrtics. Porta sang oxigenada a la circulació major.'
  },
  {
    id: 'pt', name: 'Tronc pulmonar',
    accept: ['tronc pulmonar', 'tronco pulmonar', 'arteria pulmonar', 'tronc de l arteria pulmonar', 'tronco de la arteria pulmonar'],
    partial: ['tronc', 'tronco'],
    info: 'Surt del ventricle dret i es bifurca en les artèries pulmonars dreta i esquerra. Porta sang desoxigenada.'
  },
  {
    id: 'rpa', name: 'Artèria pulmonar dreta',
    accept: ['arteria pulmonar dreta', 'arteria pulmonar derecha', 'apd'],
    partial: ['arteria pulmonar', 'arteria'],
    info: 'Branca del tronc pulmonar que passa per sota de l\'arc aòrtic cap al pulmó dret.'
  },
  {
    id: 'lpa', name: 'Artèria pulmonar esquerra',
    accept: ['arteria pulmonar esquerra', 'arteria pulmonar izquierda', 'ape', 'api'],
    partial: ['arteria pulmonar', 'arteria'],
    info: 'Branca del tronc pulmonar que porta la sang desoxigenada cap al pulmó esquerre.'
  },
  {
    id: 'svc', name: 'Vena cava superior',
    accept: ['vena cava superior', 'cava superior', 'vcs'],
    partial: ['vena cava', 'cava', 'vena'],
    info: 'Retorna a l\'aurícula dreta la sang desoxigenada del cap, el coll i les extremitats superiors.'
  },
  {
    id: 'ivc', name: 'Vena cava inferior',
    accept: ['vena cava inferior', 'cava inferior', 'vci'],
    partial: ['vena cava', 'cava', 'vena'],
    info: 'Retorna a l\'aurícula dreta la sang desoxigenada de l\'abdomen i les extremitats inferiors.'
  },
  {
    id: 'rpv', name: 'Venes pulmonars dretes',
    accept: ['venes pulmonars dretes', 'vena pulmonar dreta', 'venas pulmonares derechas', 'vena pulmonar derecha', 'vpd'],
    partial: ['venes pulmonars', 'venas pulmonares', 'vena pulmonar', 'vena'],
    info: 'Porten la sang oxigenada del pulmó dret a l\'aurícula esquerra (són venes, però porten sang arterial!).'
  },
  {
    id: 'lpv', name: 'Venes pulmonars esquerres',
    accept: ['venes pulmonars esquerres', 'vena pulmonar esquerra', 'venas pulmonares izquierdas', 'vena pulmonar izquierda', 'vpe', 'vpi'],
    partial: ['venes pulmonars', 'venas pulmonares', 'vena pulmonar', 'vena'],
    info: 'Porten la sang oxigenada del pulmó esquerre a l\'aurícula esquerra.'
  },
  {
    id: 'tricuspid', name: 'Vàlvula tricúspide',
    accept: ['valvula tricuspide', 'tricuspide', 'valvula auriculoventricular dreta', 'valvula auriculoventricular derecha'],
    partial: ['valvula', 'valvula auriculoventricular', 'valvula av'],
    info: 'Vàlvula AV del costat dret (3 cúspides). Evita el reflux cap a l\'aurícula dreta durant la sístole.'
  },
  {
    id: 'mitral', name: 'Vàlvula mitral',
    accept: ['valvula mitral', 'mitral', 'valvula bicuspide', 'bicuspide', 'valvula auriculoventricular esquerra', 'valvula auriculoventricular izquierda'],
    partial: ['valvula', 'valvula auriculoventricular', 'valvula av'],
    info: 'Vàlvula AV esquerra o bicúspide (2 cúspides). Les cordes tendinoses i els músculs papil·lars n\'eviten l\'eversió.'
  },
  {
    id: 'pulmvalve', name: 'Vàlvula pulmonar',
    accept: ['valvula pulmonar', 'valvula semilunar pulmonar', 'pulmonar'],
    partial: ['valvula', 'valvula semilunar', 'semilunar', 'sigmoidea'],
    info: 'Vàlvula semilunar (3 valves en niu d\'oreneta) al tracte d\'ejecció del ventricle dret.'
  },
  {
    id: 'aorticvalve', name: 'Vàlvula aòrtica',
    accept: ['valvula aortica', 'valvula semilunar aortica', 'aortica', 'valvula sigmoidea aortica'],
    partial: ['valvula', 'valvula semilunar', 'semilunar', 'sigmoidea'],
    info: 'Vàlvula semilunar a la sortida del ventricle esquerre. Just per damunt neixen les artèries coronàries.'
  }
];

/* ------------------------------------------------------------------ */
/* FASE 2A — Escenaris del cicle cardíac                               */
/* valves: true = oberta. contract: 'none' | 'atria' | 'ventricles'   */
/* ------------------------------------------------------------------ */
CJ.CYCLE = [
  {
    id: 'diastole', title: 'Diàstole: ompliment ventricular passiu', timeline: 'diastole',
    scenario: 'Els ventricles s\'han relaxat i la seva pressió és inferior a la de les aurícules. La sang que arriba de les venes ha d\'omplir els ventricles, però no ha de tornar enrere des de les grans artèries.',
    valves: { tricuspid: true, mitral: true, pulmonary: false, aortic: false },
    contract: 'none', ventricles: 'diastole', sound: null,
    explain: 'Diàstole: vàlvules AV obertes i semilunars tancades. La sang passa passivament de les aurícules als ventricles (≈ 0,4 s). També és quan el miocardi rep més flux coronari.'
  },
  {
    id: 'atrial', title: 'Sístole auricular', timeline: 'atrial',
    scenario: 'El node sinoauricular dispara l\'impuls. Les aurícules es contrauen per acabar d\'omplir els ventricles (l\'últim 20-30 % del volum).',
    valves: { tricuspid: true, mitral: true, pulmonary: false, aortic: false },
    contract: 'atria', ventricles: 'diastole', sound: null,
    explain: 'Sístole auricular (0,1 s): es contrauen les aurícules amb les AV obertes. Els ventricles encara són en diàstole: s\'acaben d\'omplir.'
  },
  {
    id: 'isovol', title: 'Contracció isovolumètrica', timeline: 'ventricular',
    scenario: 'L\'impuls arriba als ventricles (His-Purkinje) i comencen a contraure\'s. La pressió ventricular puja per sobre de l\'auricular, però encara no supera la de l\'aorta ni la de l\'artèria pulmonar.',
    valves: { tricuspid: false, mitral: false, pulmonary: false, aortic: false },
    contract: 'ventricles', ventricles: 'systole', sound: 'S1',
    explain: 'Totes les vàlvules tancades: el volum no canvia. El tancament de les AV produeix el primer soroll cardíac (S1, «lub»).'
  },
  {
    id: 'ejection', title: 'Ejecció ventricular', timeline: 'ventricular',
    scenario: 'La pressió dels ventricles supera la de les grans artèries. La sang ha de sortir cap a la circulació menor i la major sense tornar a les aurícules.',
    valves: { tricuspid: false, mitral: false, pulmonary: true, aortic: true },
    contract: 'ventricles', ventricles: 'systole', sound: null,
    explain: 'Ejecció: semilunars obertes, AV tancades (les cordes tendinoses impedeixen el prolapse). Ambdós ventricles expulsen el mateix volum, però a pressions molt diferents.'
  },
  {
    id: 'relax', title: 'Relaxació isovolumètrica', timeline: 'diastole',
    scenario: 'Els ventricles deixen de contraure\'s i la seva pressió cau per sota de la de l\'aorta i l\'artèria pulmonar. La sang tendeix a refluir cap als ventricles, però la pressió ventricular encara és superior a l\'auricular.',
    valves: { tricuspid: false, mitral: false, pulmonary: false, aortic: false },
    contract: 'none', ventricles: 'diastole', sound: 'S2',
    explain: 'El tancament de les semilunars produeix el segon soroll (S2, «dub»). Comença la diàstole: quan la pressió ventricular baixi de l\'auricular, s\'obriran les AV i el cicle torna a començar.'
  }
];

/* ------------------------------------------------------------------ */
/* FASE 2B — Recorregut de la sang                                     */
/* node: punt de l'esquema SVG per on passa la gota                    */
/* ------------------------------------------------------------------ */
CJ.ROUTE = [
  { id: 'vc',   label: 'Venes caves',              node: 'vc',   o2: false, log: 'La sang desoxigenada dels teixits torna al cor per les venes caves superior i inferior.' },
  { id: 'ra',   label: 'Aurícula dreta',           node: 'ra',   o2: false, log: 'Entra a l\'aurícula dreta, cavitat receptora de parets primes.' },
  { id: 'tv',   label: 'Vàlvula tricúspide',       node: 'tv',   o2: false, log: 'Travessa la vàlvula tricúspide (AV dreta, 3 cúspides).' },
  { id: 'rv',   label: 'Ventricle dret',           node: 'rv',   o2: false, log: 'Omple el ventricle dret, que la impulsarà a baixa pressió.' },
  { id: 'pv',   label: 'Vàlvula pulmonar',         node: 'pv',   o2: false, log: 'Surt per la vàlvula pulmonar (semilunar).' },
  { id: 'pa',   label: 'Tronc i artèries pulmonars', node: 'pa', o2: false, log: 'Circula pel tronc pulmonar i les artèries pulmonars: artèries amb sang desoxigenada!' },
  { id: 'lung', label: 'Capil·lars pulmonars',     node: 'lung', o2: true,  log: 'Als capil·lars alveolars cedeix CO₂ i capta O₂: ara és sang oxigenada.' },
  { id: 'pvn',  label: 'Venes pulmonars',          node: 'pvn',  o2: true,  log: 'Torna al cor per les quatre venes pulmonars: venes amb sang oxigenada!' },
  { id: 'la',   label: 'Aurícula esquerra',        node: 'la',   o2: true,  log: 'Arriba a l\'aurícula esquerra, a la base posterior del cor.' },
  { id: 'mv',   label: 'Vàlvula mitral',           node: 'mv',   o2: true,  log: 'Passa per la vàlvula mitral o bicúspide.' },
  { id: 'lv',   label: 'Ventricle esquerre',       node: 'lv',   o2: true,  log: 'Omple el ventricle esquerre, de paret gruixuda, que genera la pressió sistòlica.' },
  { id: 'av',   label: 'Vàlvula aòrtica',          node: 'av',   o2: true,  log: 'Surt per la vàlvula aòrtica (semilunar).' },
  { id: 'ao',   label: 'Aorta',                    node: 'ao',   o2: true,  log: 'Recorre l\'aorta, que distribueix la sang a tota la circulació major.' },
  { id: 'body', label: 'Teixits del cos',          node: 'body', o2: false, log: 'Als capil·lars sistèmics lliura O₂ i nutrients i recull CO₂. Torna a començar el cicle!' }
];

/* ------------------------------------------------------------------ */
/* FASE 3 — Text amb buits. [[clau]] = buit; la clau és a TAGS.        */
/* ------------------------------------------------------------------ */
CJ.CLOZE = {
  title: 'El cor: una doble bomba sincronitzada',
  paragraphs: [
    'El cor és una bomba muscular situada al [[mediasti]], recolzat sobre el diafragma i orientat cap a l\'esquerra. L\'envolta el [[pericardi]], un sac amb una capa fibrosa externa i una capa serosa; el líquid pericàrdic en redueix la fricció.',
    'La paret cardíaca té tres capes: l\'[[epicardi]] (la més externa, amb greix i vasos coronaris), el [[miocardi]] (capa muscular formada per cardiomiòcits) i l\'[[endocardi]] (endoteli que recobreix les cavitats i les vàlvules).',
    'El cor dret rep la sang desoxigenada per les [[venescaves]] a l\'aurícula dreta. Aquesta passa al ventricle dret a través de la vàlvula [[tricuspide]], i el ventricle dret la impulsa cap al [[troncpulmonar]] per iniciar la circulació menor.',
    'La sang oxigenada torna per les [[venespulmonars]] a l\'aurícula esquerra i travessa la vàlvula [[mitral]], que només té dues cúspides. El [[ventricleesquerre]], amb una paret unes tres vegades més gruixuda, l\'expulsa cap a l\'[[aorta]] i la circulació major.',
    'Les [[cordes]], ancorades als músculs papil·lars, impedeixen que les vàlvules auriculoventriculars s\'everteixin durant la contracció. Un cicle dura uns 0,8 s: la [[sistole]] ventricular (0,3 s) expulsa la sang i la [[diastole]] (0,4 s) permet l\'ompliment ventricular i la perfusió coronària.',
    'L\'[[apex]], format pel ventricle esquerre, es projecta al 5è espai intercostal esquerre. Les [[coronaries]] neixen de l\'arrel de l\'aorta i irriguen el miocardi, i el [[nodesa]] genera l\'impuls elèctric de cada batec.'
  ],
  tags: {
    mediasti: 'mediastí mitjà',
    pericardi: 'pericardi',
    epicardi: 'epicardi',
    miocardi: 'miocardi',
    endocardi: 'endocardi',
    venescaves: 'venes caves',
    tricuspide: 'tricúspide',
    troncpulmonar: 'tronc pulmonar',
    venespulmonars: 'venes pulmonars',
    mitral: 'mitral',
    ventricleesquerre: 'ventricle esquerre',
    aorta: 'aorta',
    cordes: 'cordes tendinoses',
    sistole: 'sístole',
    diastole: 'diàstole',
    apex: 'àpex',
    coronaries: 'artèries coronàries',
    nodesa: 'node sinoauricular'
  },
  distractors: { d1: 'vàlvula aòrtica', d2: 'septe interauricular' }
};

/* Puntuació (vegeu docs/SPEC.md, G4) */
CJ.POINTS = { p1: 100, p2a: 100, p2b: 20, p3: 50, hint: 30, lifeBonus: 20 };
CJ.MAX_LIVES = 10;
