/* Cor en Joc — model 3D procedural del cor (three.js)
 * Convenció: vista anterior. x < 0 = costat dret del pacient (esquerra de la pantalla),
 * y = cranial, z > 0 = anterior (cap a l'observador). */
window.CJ = window.CJ || {};

CJ.Heart3D = (function () {
  const V3 = THREE.Vector3;

  /* ---------- Colors (esquema de la làmina de referència) ---------- */
  const COL = {
    rightHeart: 0x8d86c9,   // cor dret: sang desoxigenada (lila-blau)
    rightInner: 0x5b5fb0,
    leftHeart: 0xe8828a,    // cor esquerre: sang oxigenada (rosat)
    leftInner: 0xd9474f,
    artery: 0xd93a33,
    arteryInner: 0x8e1c18,
    vein: 0x3a4fb3,
    veinInner: 0x1f2c74,
    valve: 0xf4ead8,
    valveRing: 0xd8c39d,
    coronaryA: 0xc92a22,
    coronaryV: 0x3448a8,
    fat: 0xf2cf72,
    found: 0x2e8b57
  };

  /* ---------- Soroll suau per a superfícies orgàniques ---------- */
  function noise3(x, y, z) {
    return (Math.sin(x * 3.1 + y * 1.7) * Math.cos(z * 2.3 - x * 1.1) +
            Math.sin(y * 4.3 + z * 2.9) * 0.5 + Math.cos(x * 5.7 - z * 3.7 + y) * 0.25) / 1.75;
  }

  /* Cavitat: esfera deformada (radis, estrenyiment cap a l'àpex, soroll). */
  function chamberGeometry(o) {
    const g = new THREE.SphereGeometry(1, 72, 54);
    const p = g.attributes.position, v = new V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const down = Math.max(0, -v.y);
      const up = Math.max(0, v.y);
      const taper = 1 - (o.taper || 0) * Math.pow(down, o.taperPow || 1.4);
      const flatTop = 1 - (o.flatTop || 0) * up * up;
      v.x *= o.rx * taper; v.z *= o.rz * taper; v.y *= o.ry * flatTop;
      if (o.bulge) v.z += o.bulge * Math.max(0, v.z) * (1 - Math.abs(v.y) / o.ry);
      const n = noise3(v.x * 2, v.y * 2, v.z * 2) * (o.noise || 0.025);
      v.multiplyScalar(1 + n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }

  /* Massa ventricular única (con amb l'àpex desplaçat a l'esquerra del pacient i endavant). */
  const VM = { top: 0.45, dome: 0.42, len: 2.05, rx: 1.28, rz: 1.02, cx: 0.02, bendX: 0.8, bendZ: 0.28 };
  function bendAt(y) { const b = Math.max(0, (0.25 - y) / 2.3); return b * b; }
  function ventricularMassGeometry() {
    const g = new THREE.SphereGeometry(1, 96, 72);
    const p = g.attributes.position, v = new V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const sy = v.y;
      const y = sy >= 0 ? VM.top + sy * VM.dome : VM.top + sy * (VM.len + VM.top) * 0.98;
      const taper = sy < 0 ? 1 - 0.5 * Math.pow(-sy, 1.35) : 1 - 0.12 * sy * sy;
      let x = v.x * VM.rx * taper, z = v.z * VM.rz * taper;
      const n = 1 + noise3(x * 1.6, y * 1.6, z * 1.6) * 0.018;
      x *= n; z *= n;
      const b = bendAt(y);
      p.setXYZ(i, x + VM.cx + VM.bendX * b, y, z + VM.bendZ * b);
    }
    g.computeVertexNormals();
    return g;
  }
  /* Frontera del septe: > 0 → ventricle esquerre. A la cara anterior, el VD n'ocupa ~2/3. */
  function septumX(y, z) { return 0.2 + (0.3 - y) * 0.26 + VM.bendX * bendAt(y) * 0.35 - 0.62 * (1 - z); }
  function lvSide(x, y, z) { return x - septumX(y, z); }

  /* Divideix una geometria en dues segons una funció de costat (pel centre del triangle). */
  function splitGeometry(geo, sideFn) {
    const src = geo.toNonIndexed();
    const pos = src.attributes.position, nor = src.attributes.normal;
    const A = { p: [], n: [] }, B = { p: [], n: [] };
    for (let i = 0; i < pos.count; i += 3) {
      const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
      const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
      const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
      const T = sideFn(cx, cy, cz) > 0 ? A : B;
      for (let k = 0; k < 3; k++) {
        T.p.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
        T.n.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k));
      }
    }
    return [A, B].map(T => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(T.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(T.n, 3));
      return g;
    });
  }

  /* Septe interventricular: superfície interior que segueix la frontera i queda dins la massa. */
  function septumGeometry() {
    const rows = 40, cols = 24, P = [], idx = [];
    for (let r = 0; r <= rows; r++) {
      const y = VM.top + 0.25 - (r / rows) * (VM.len + VM.top + 0.05);
      const sy = Math.min(1, Math.max(-1, (y - VM.top) / ((VM.len + VM.top) * 0.98)));
      const taper = 1 - 0.5 * Math.pow(Math.max(0, -sy), 1.35);
      const ring = Math.sqrt(Math.max(0, 1 - sy * sy)) * 0.9;
      const a = VM.rx * taper * ring, c = VM.rz * taper * ring;
      const b = bendAt(y), ox = VM.cx + VM.bendX * b, oz = VM.bendZ * b;
      // Interseca la recta x = septumX(y,z) amb l'el·lipse (x-ox)²/a² + (z-oz)²/c² = 1
      let zs = [];
      for (let k = 0; k <= 200; k++) {
        const z = oz - c + (2 * c * k) / 200, x = septumX(y, z);
        if (a > 0.01 && Math.pow((x - ox) / a, 2) + Math.pow((z - oz) / c, 2) <= 1) zs.push(z);
      }
      const z0 = zs.length ? zs[0] : oz, z1 = zs.length ? zs[zs.length - 1] : oz;
      for (let k = 0; k <= cols; k++) {
        const z = z0 + (z1 - z0) * (k / cols);
        P.push(septumX(y, z), y, z);
      }
    }
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const i = r * (cols + 1) + k;
      idx.push(i, i + cols + 1, i + 1, i + 1, i + cols + 1, i + cols + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function tube(points, radius, radialSeg, opts) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new V3(p[0], p[1], p[2])), false, 'catmullrom', 0.35);
    const g = new THREE.TubeGeometry(curve, opts && opts.seg || 64, radius, radialSeg || 24, false);
    if (opts && opts.taperTo) {
      // Estrenyiment progressiu al llarg del tub.
      const p = g.attributes.position, v = new V3();
      const segs = (opts.seg || 64) + 1, rs = (radialSeg || 24) + 1;
      for (let s = 0; s < segs; s++) {
        const t = s / (segs - 1), c = curve.getPointAt(t), k = 1 - (1 - opts.taperTo) * t;
        for (let r = 0; r < rs; r++) {
          const i = s * rs + r; v.fromBufferAttribute(p, i).sub(c).multiplyScalar(k).add(c); p.setXYZ(i, v.x, v.y, v.z);
        }
      }
      g.computeVertexNormals();
    }
    g.userData.curve = curve;
    return g;
  }

  /* ---------- Classe principal ---------- */
  function Heart3D(canvas, opts) {
    this.canvas = canvas;
    this.opts = opts || {};
    this.structures = {};       // id -> { group, meshes[], materials[], anchor, found }
    this.pickables = [];
    this.valveProxies = [];
    this.tissueMaterials = [];
    this.hoverId = null;
    this.beat = true;
    this.cut = 0;
    this.alpha = 0;
    this.clock = new THREE.Clock();
    this._init();
  }

  Heart3D.prototype._init = function () {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.localClippingEnabled = true;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;

    const scene = this.scene = new THREE.Scene();
    const cam = this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.homePos = new V3(0.4, 0.5, 9.2);
    this.homeTarget = new V3(0.05, 0.35, 0);
    cam.position.copy(this.homePos);

    const ctl = this.controls = new THREE.OrbitControls(cam, this.canvas);
    ctl.target.copy(this.homeTarget);
    ctl.enableDamping = true; ctl.dampingFactor = 0.08;
    ctl.minDistance = 4; ctl.maxDistance = 16;
    ctl.autoRotateSpeed = 1.6;
    ctl.update();

    // Llums d'estudi
    scene.add(new THREE.HemisphereLight(0xfff6f0, 0xb7c9bd, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe0e0, 1.1); rim.position.set(-5, 2, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.6); fill.position.set(-3, -3, 5); scene.add(fill);

    // Pla de tall frontal: es conserven els punts amb z <= constant
    this.clipPlane = new THREE.Plane(new V3(0, 0, -1), 10);

    this.root = new THREE.Group();
    scene.add(this.root);
    this._build();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.canvas.parentElement);
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  };

  /* Material de teixit amb cara interna més fosca (per al tall). */
  Heart3D.prototype._tissue = function (color, inner, o) {
    o = o || {};
    const outer = new THREE.MeshPhysicalMaterial({
      color, roughness: o.rough != null ? o.rough : 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.35,
      sheen: 0.4, sheenColor: new THREE.Color(0xffd6d6), side: THREE.FrontSide,
      clippingPlanes: [this.clipPlane], transparent: true, opacity: 1
    });
    const back = new THREE.MeshStandardMaterial({
      color: inner, roughness: 0.7, side: THREE.BackSide, clippingPlanes: [this.clipPlane], transparent: true, opacity: 1
    });
    this.tissueMaterials.push(outer, back);
    return [outer, back];
  };

  Heart3D.prototype._addPart = function (id, geometry, mats, parent) {
    const m1 = new THREE.Mesh(geometry, mats[0]);
    const m2 = new THREE.Mesh(geometry, mats[1]);
    m1.userData.sid = id; m2.userData.sid = id;
    m2.raycast = function () {}; // la cara interna no es tria; la externa ja cobreix la geometria
    const st = this.structures[id] || (this.structures[id] = { id, meshes: [], materials: [], found: false });
    st.meshes.push(m1); st.materials.push(mats[0]);
    this.pickables.push(m1);
    m1.add(m2); // la cara interna hereta la posició de l'externa
    (parent || this.root).add(m1);
    return m1;
  };

  Heart3D.prototype._build = function () {
    const root = this.root;

    /* ===== Ventricles (subgrup inclinat: àpex avall, a l'esquerra i endavant) ===== */
    const vg = this.ventricles = new THREE.Group();
    vg.position.set(0, 0.25, 0);  // pivot del batec a la base
    root.add(vg);
    const inner = new THREE.Group(); inner.position.set(0, -0.25, 0); vg.add(inner);

    const [lvGeo, rvGeo] = splitGeometry(ventricularMassGeometry(), lvSide);
    this._addPart('lv', lvGeo, this._tissue(COL.leftHeart, COL.leftInner), inner);
    this._addPart('rv', rvGeo, this._tissue(COL.rightHeart, COL.rightInner), inner);
    // Septe: cara del VD (blava) i cara del VE (vermella)
    const septGeo = septumGeometry();
    [[COL.rightInner, THREE.FrontSide], [COL.leftInner, THREE.BackSide]].forEach(([c, side]) => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, side, clippingPlanes: [this.clipPlane], transparent: true });
      this.tissueMaterials.push(m);
      const sept = new THREE.Mesh(septGeo, m);
      sept.raycast = function () {};
      inner.add(sept);
    });

    /* ===== Aurícules ===== */
    const raGeo = chamberGeometry({ rx: 0.58, ry: 0.66, rz: 0.55, noise: 0.03 });
    const ra = this._addPart('ra', raGeo, this._tissue(COL.rightHeart, COL.rightInner));
    ra.position.set(-1.02, 0.62, 0.02);
    // Orelleta dreta
    const raa = this._addPart('ra', chamberGeometry({ rx: 0.36, ry: 0.22, rz: 0.24, noise: 0.08 }), this._tissue(COL.rightHeart, COL.rightInner));
    raa.position.set(-0.68, 1.08, 0.42); raa.rotation.set(0.4, 0.3, -0.5);

    const laGeo = chamberGeometry({ rx: 0.66, ry: 0.5, rz: 0.52, noise: 0.03 });
    const la = this._addPart('la', laGeo, this._tissue(COL.leftHeart, COL.leftInner));
    la.position.set(0.42, 0.88, -0.62);
    // Orelleta esquerra
    const laa = this._addPart('la', chamberGeometry({ rx: 0.34, ry: 0.2, rz: 0.24, noise: 0.08 }), this._tissue(COL.leftHeart, COL.leftInner));
    laa.position.set(0.98, 0.92, 0.05); laa.rotation.set(0.2, -0.5, 0.45);

    /* ===== Grans vasos ===== */
    const aortaPts = [[-0.2, 0.35, -0.1], [-0.2, 1.0, -0.02], [-0.12, 1.7, 0.02], [0.14, 2.18, -0.12], [0.55, 2.3, -0.42], [0.86, 2.0, -0.7], [0.92, 1.4, -0.92], [0.9, 0.4, -1.0], [0.86, -0.9, -1.0]];
    const aortaGeo = tube(aortaPts, 0.3, 32, { seg: 120 });
    this._addPart('aorta', aortaGeo, this._tissue(COL.artery, COL.arteryInner));
    // Troncs supraaòrtics
    [[[0.02, 2.1, -0.08], [-0.05, 2.55, -0.05], [-0.15, 2.95, 0.0]], [[0.42, 2.3, -0.3], [0.44, 2.7, -0.3], [0.46, 3.05, -0.3]], [[0.72, 2.2, -0.55], [0.82, 2.6, -0.6], [0.9, 2.95, -0.62]]]
      .forEach((pts, i) => this._addPart('aorta', tube(pts, i === 0 ? 0.14 : 0.11, 18, { seg: 24 }), this._tissue(COL.artery, COL.arteryInner)));

    const ptPts = [[0.02, 0.45, 0.45], [0.06, 1.0, 0.62], [0.24, 1.45, 0.5], [0.42, 1.68, 0.2]];
    this._addPart('pt', tube(ptPts, 0.3, 28, { seg: 48 }), this._tissue(COL.vein, COL.veinInner));
    this._addPart('lpa', tube([[0.38, 1.68, 0.22], [0.85, 1.78, 0.0], [1.35, 1.72, -0.15], [1.75, 1.6, -0.2]], 0.21, 22, { seg: 40, taperTo: 0.8 }), this._tissue(COL.vein, COL.veinInner));
    this._addPart('rpa', tube([[0.36, 1.62, 0.1], [0.1, 1.6, -0.35], [-0.5, 1.62, -0.42], [-1.15, 1.6, -0.38], [-1.75, 1.5, -0.3]], 0.2, 22, { seg: 48, taperTo: 0.8 }), this._tissue(COL.vein, COL.veinInner));

    this._addPart('svc', tube([[-1.02, 0.95, -0.02], [-1.0, 1.6, -0.06], [-0.98, 2.55, -0.08]], 0.26, 26, { seg: 32 }), this._tissue(COL.vein, COL.veinInner));
    this._addPart('ivc', tube([[-0.98, 0.25, -0.12], [-0.92, -0.5, -0.2], [-0.86, -1.6, -0.24]], 0.28, 26, { seg: 32 }), this._tissue(COL.vein, COL.veinInner));

    // Venes pulmonars (porten sang oxigenada: vermelles)
    this._addPart('rpv', tube([[0.0, 1.02, -0.72], [-0.7, 1.08, -0.85], [-1.55, 1.14, -0.8]], 0.12, 16, { seg: 28 }), this._tissue(COL.artery, COL.arteryInner));
    this._addPart('rpv', tube([[0.02, 0.74, -0.74], [-0.75, 0.62, -0.88], [-1.55, 0.58, -0.82]], 0.12, 16, { seg: 28 }), this._tissue(COL.artery, COL.arteryInner));
    this._addPart('lpv', tube([[0.8, 1.06, -0.68], [1.3, 1.16, -0.6], [1.72, 1.2, -0.52]], 0.12, 16, { seg: 28 }), this._tissue(COL.artery, COL.arteryInner));
    this._addPart('lpv', tube([[0.84, 0.78, -0.7], [1.3, 0.76, -0.62], [1.72, 0.72, -0.55]], 0.12, 16, { seg: 28 }), this._tissue(COL.artery, COL.arteryInner));

    /* ===== Vàlvules ===== */
    this._valve('tricuspid', 3, new V3(-0.56, 0.28, 0.2), new V3(0.55, -0.8, 0.15), 0.26);
    this._valve('mitral', 2, new V3(0.36, 0.42, -0.36), new V3(0.15, -0.95, 0.25), 0.24);
    this._valve('pulmvalve', 3, new V3(0.04, 0.66, 0.52), new V3(0.1, 1, 0.25), 0.21);
    this._valve('aorticvalve', 3, new V3(-0.21, 0.5, -0.06), new V3(0, 1, 0.05), 0.21);

    /* ===== Anclatges per a les etiquetes ===== */
    const A = (id, x, y, z) => { this.structures[id].anchor = new V3(x, y, z); };
    A('ra', -1.45, 0.65, 0.25); A('la', 0.62, 1.12, -0.2); A('rv', -0.35, -0.55, 0.85); A('lv', 1.15, -0.6, 0.35);
    A('aorta', 0.3, 2.45, -0.2); A('pt', -0.02, 1.15, 0.9); A('lpa', 1.7, 1.85, -0.15); A('rpa', -1.7, 1.75, -0.3);
    A('svc', -0.98, 2.35, 0.2); A('ivc', -0.88, -1.4, 0.05); A('rpv', -1.6, 0.85, -0.75); A('lpv', 1.75, 0.95, -0.5);
    A('tricuspid', -0.56, 0.28, 0.3); A('mitral', 0.36, 0.42, -0.25); A('pulmvalve', 0.04, 0.7, 0.62); A('aorticvalve', -0.21, 0.55, 0.02);

    this._coronaries();
  };

  /* Vàlvula: anell + valves; proxy invisible més gran per facilitar el clic. */
  Heart3D.prototype._valve = function (id, cusps, pos, normal, radius) {
    const g = new THREE.Group();
    g.position.copy(pos);
    g.quaternion.setFromUnitVectors(new V3(0, 1, 0), normal.clone().normalize());
    const ringMat = new THREE.MeshStandardMaterial({ color: COL.valveRing, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: COL.valve, roughness: 0.45, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.16, 12, 48), ringMat);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const leaves = [];
    for (let i = 0; i < cusps; i++) {
      const a0 = (i / cusps) * Math.PI * 2, a1 = ((i + 1) / cusps) * Math.PI * 2;
      const geo = new THREE.CircleGeometry(radius * 0.98, 20, a0 + 0.04, a1 - a0 - 0.08);
      const p = geo.attributes.position, v = new V3();
      for (let k = 0; k < p.count; k++) { // cúpula lleugera cap al flux
        v.fromBufferAttribute(p, k); const d = Math.hypot(v.x, v.y) / radius;
        p.setXYZ(k, v.x, v.y, -0.08 * (1 - d * d));
      }
      geo.computeVertexNormals();
      const leaf = new THREE.Mesh(geo, leafMat); leaf.rotation.x = -Math.PI / 2;
      g.add(leaf); leaves.push(leaf);
    }
    if (cusps === 2 || cusps === 3 && (id === 'tricuspid')) {
      // Cordes tendinoses cap als músculs papil·lars
      const chordMat = new THREE.MeshBasicMaterial({ color: 0xf6efe2 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const from = new V3(Math.cos(a) * radius * 0.6, -0.02, Math.sin(a) * radius * 0.6);
        const to = new V3(Math.cos(a) * radius * 0.25 + (i < 3 ? 0.08 : -0.08), -0.36, Math.sin(a) * radius * 0.2);
        const c = new THREE.Mesh(tube([[from.x, from.y, from.z], [to.x, to.y, to.z]], 0.008, 4, { seg: 2 }), chordMat);
        g.add(c);
      }
      [-1, 1].forEach(s => {
        const pm = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 12), new THREE.MeshStandardMaterial({ color: id === 'mitral' ? COL.leftInner : COL.rightInner }));
        pm.position.set(s * 0.09, -0.44, 0); pm.rotation.z = Math.PI; g.add(pm);
      });
    }
    const proxy = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.2, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.sid = id; proxy.userData.isValve = true;
    g.add(proxy);
    this.root.add(g);
    this.structures[id] = { id, meshes: [ring, ...leaves], materials: [ringMat, leafMat], found: false, valveGroup: g };
    this.valveProxies.push(proxy);
  };

  /* Artèries i venes coronàries seguint els solcs (trobats per raigs contra la superfície). */
  Heart3D.prototype._coronaries = function () {
    this.root.updateMatrixWorld(true);
    const rc = new THREE.Raycaster();
    const surf = this.pickables.filter(m => ['lv', 'rv', 'ra'].includes(m.userData.sid));
    const hitAt = (x, y) => {
      rc.set(new V3(x, y, 6), new V3(0, 0, -1));
      const h = rc.intersectObjects(surf, false)[0];
      return h ? { p: h.point, sid: h.object.userData.sid, n: h.face.normal.clone().transformDirection(h.object.matrixWorld) } : null;
    };
    // Solc interventricular anterior: frontera RV/LV per a cada alçada
    const lad = [], gcv = [];
    for (let y = 0.45; y >= -1.75; y -= 0.1) {
      let prev = null;
      for (let x = -0.6; x <= 1.6; x += 0.02) {
        const h = hitAt(x, y); if (!h) { prev = null; continue; }
        if (prev && prev.sid === 'rv' && h.sid === 'lv') {
          lad.push(h.p.clone().addScaledVector(h.n, 0.03));
          gcv.push(h.p.clone().addScaledVector(h.n, 0.03).add(new V3(0.07, 0, 0)));
          break;
        }
        prev = h;
      }
    }
    // Solc coronari dret: frontera RA/RV
    const rca = [];
    for (let x = -1.45; x <= -0.2; x += 0.05) {
      let prev = null;
      for (let y = 1.0; y >= -0.8; y -= 0.02) {
        const h = hitAt(x, y); if (!h) { prev = null; continue; }
        if (prev && prev.sid === 'ra' && h.sid === 'rv') { rca.push(h.p.clone().addScaledVector(h.n, 0.03)); break; }
        prev = h;
      }
    }
    const coronaryMat = new THREE.MeshStandardMaterial({ color: COL.coronaryA, roughness: 0.4, clippingPlanes: [this.clipPlane] });
    const veinMat = new THREE.MeshStandardMaterial({ color: COL.coronaryV, roughness: 0.4, clippingPlanes: [this.clipPlane] });
    const fatMat = new THREE.MeshStandardMaterial({ color: COL.fat, roughness: 0.8, clippingPlanes: [this.clipPlane] });
    this.decor = [];
    const addTube = (pts, r, mat) => {
      if (pts.length < 4) return;
      const smooth = pts.filter((_, i) => i % 2 === 0);
      const m = new THREE.Mesh(tube(smooth.map(p => [p.x, p.y, p.z]), r, 8, { seg: smooth.length * 4, taperTo: 0.5 }), mat);
      this.root.add(m); this.decor.push(m);
      this.tissueMaterials.push(mat);
    };
    addTube(lad, 0.055, fatMat);
    addTube(lad, 0.03, coronaryMat);
    addTube(gcv, 0.03, veinMat);
    addTube(rca, 0.055, fatMat);
    addTube(rca, 0.03, coronaryMat);
    this.ladPts = lad;
  };

  /* ---------- API ---------- */
  Heart3D.prototype.setCut = function (v) { // 0..1
    this.cut = v;
    this.clipPlane.constant = v <= 0.001 ? 10 : 1.3 - v * 1.05;
  };
  Heart3D.prototype.setAlpha = function (v) { // 0..0.85
    this.alpha = v;
    const op = 1 - v;
    this.tissueMaterials.forEach(m => { m.opacity = op; m.depthWrite = op > 0.95; m.needsUpdate = true; });
  };
  Heart3D.prototype.interiorVisible = function () { return this.cut > 0.12 || this.alpha > 0.3; };
  Heart3D.prototype.setBeat = function (b) { this.beat = !!b; };
  Heart3D.prototype.setAutoRotate = function (b) { this.controls.autoRotate = !!b; };
  Heart3D.prototype.resetView = function () {
    this.camera.position.copy(this.homePos); this.controls.target.copy(this.homeTarget); this.controls.update();
  };

  Heart3D.prototype.pick = function (clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interior = this.interiorVisible();
    const targets = interior ? this.pickables.concat(this.valveProxies) : this.pickables;
    const hits = this.raycaster.intersectObjects(targets, false).filter(h => {
      if (h.object.userData.isValve) return true;
      return this.clipPlane.distanceToPoint(h.point) >= 0;
    });
    if (!hits.length) return null;
    if (interior) {
      // Si el raig travessa diverses vàlvules, tria la que té el centre més a prop del raig
      const ray = this.raycaster.ray, c = new V3();
      const valve = hits.filter(h => h.object.userData.isValve)
        .sort((a, b) => ray.distanceToPoint(a.object.getWorldPosition(c)) - ray.distanceToPoint(b.object.getWorldPosition(c)))[0];
      // Amb transparència, les vàlvules tenen prioritat; amb tall, només si no hi ha teixit davant
      if (valve && (this.alpha > 0.3 || hits[0] === valve || hits[0].distance > valve.distance - 0.4)) return valve.object.userData.sid;
    }
    return hits[0].object.userData.sid;
  };

  Heart3D.prototype.setHover = function (id) {
    if (this.hoverId === id) return;
    const paint = (sid, on) => {
      const st = this.structures[sid]; if (!st) return;
      st.materials.forEach(m => {
        if (!m.emissive) return;
        m.emissive.setHex(on ? 0xffc93c : (st.found ? COL.found : 0x000000));
        m.emissiveIntensity = on ? 0.35 : (st.found ? 0.18 : 0);
      });
    };
    if (this.hoverId) paint(this.hoverId, false);
    this.hoverId = id;
    if (id) paint(id, true);
  };

  Heart3D.prototype.markFound = function (id) {
    const st = this.structures[id]; if (!st) return;
    st.found = true;
    st.materials.forEach(m => { if (m.emissive) { m.emissive.setHex(COL.found); m.emissiveIntensity = 0.18; } });
  };

  Heart3D.prototype.projectAnchor = function (id) {
    const st = this.structures[id]; if (!st || !st.anchor) return null;
    const v = st.anchor.clone().applyMatrix4(this.root.matrixWorld);
    const toCam = this.camera.position.clone().sub(v);
    const facing = toCam.dot(v.clone().sub(this.controls.target).setY(0)) >= -0.5;
    v.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: (v.x + 1) / 2 * rect.width, y: (1 - v.y) / 2 * rect.height, visible: v.z < 1, front: facing };
  };

  Heart3D.prototype._resize = function () {
    const el = this.canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // En pantalles estretes, allunya la càmera perquè el cor hi càpiga
    this.camera.fov = w / h < 0.8 ? 48 : 36;
    this.camera.updateProjectionMatrix();
  };

  Heart3D.prototype._loop = function () {
    if (this.disposed) return;
    requestAnimationFrame(this._loop);
    if (!this.canvas.offsetParent) return; // pantalla oculta: no renderitza
    const t = this.clock.getElapsedTime();
    if (this.beat) {
      // Cicle de 0,85 s: sístole auricular → sístole ventricular → diàstole
      const ph = (t % 0.85) / 0.85;
      const atr = ph < 0.12 ? Math.sin(ph / 0.12 * Math.PI) : 0;
      const ven = ph > 0.12 && ph < 0.5 ? Math.sin((ph - 0.12) / 0.38 * Math.PI) : 0;
      this.ventricles.scale.setScalar(1 - 0.045 * ven);
      this.root.children.forEach(c => {
        if (c.isMesh && (c.userData.sid === 'ra' || c.userData.sid === 'la')) {
          if (!c.userData.base) c.userData.base = c.scale.clone();
          c.scale.copy(c.userData.base).multiplyScalar(1 - 0.06 * atr);
        }
      });
      this.root.scale.setScalar(1 + 0.008 * ven);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    if (this.onFrame) this.onFrame();
  };

  Heart3D.prototype.dispose = function () {
    this.disposed = true;
    this._ro.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
  };

  return Heart3D;
})();
