/* =========================================================
   VIVER DE FREELANCER — app.js
   1) UI interativa (typewriter, filtros, tabs, 3D em CSS…)
   2) Cena WebGL com Three.js (painel da foto original em 3D)
   ========================================================= */

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;

const REDUCE  = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = matchMedia('(pointer: coarse)').matches;
const MOBILE  = matchMedia('(max-width: 880px)').matches;
const REMOTE  = 'https://rickdigitalestudio.github.io/viverdefreelancer/';

/* estado compartilhado com a cena 3D */
const SCROLL = { y: 0, v: 0, n: 0, last: 0 };
const MOUSE  = { x: 0, y: 0, tx: 0, ty: 0, active: false };

/* ---------------- loader ---------------- */
let loaderHidden = false;
function hideLoader(){
  if (loaderHidden) return;
  loaderHidden = true;
  $('#loader').classList.add('hide');
}
setTimeout(hideLoader, 4500);            // teto de segurança
addEventListener('load', () => setTimeout(hideLoader, 500));

/* ---------------- cursor personalizado ---------------- */
if (!COARSE && matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.body.classList.add('has-cursor');
  const dot = $('#cursor'), ring = $('#cursorRing');
  let px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py;

  addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    dot.style.transform = `translate(${px}px,${py}px) translate(-50%,-50%)`;
    document.body.classList.add('cursor-on');
    MOUSE.tx = (e.clientX / innerWidth) * 2 - 1;
    MOUSE.ty = (e.clientY / innerHeight) * 2 - 1;
    MOUSE.active = true;
  }, { passive: true });

  (function follow(){
    rx = lerp(rx, px, .18); ry = lerp(ry, py, .18);
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(follow);
  })();

  const HOVER = 'a,button,label,.flip,.pcard,.tilt,.steps div,.dots button,[role="button"],input,textarea';
  addEventListener('pointerover', e => { if (e.target.closest(HOVER)) ring.classList.add('grow'); });
  addEventListener('pointerout',  e => { if (e.target.closest(HOVER)) ring.classList.remove('grow'); });
  addEventListener('pointerdown', () => ring.classList.add('press'));
  addEventListener('pointerup',   () => ring.classList.remove('press'));
}

/* ---------------- navegação / barra / topo / reveal ---------------- */
const nav = $('#nav'), burger = $('#burger'), navLinks = $('#navLinks'), topBtn = $('#top'), bar = $('#bar');
const sections = $$('main section[id], header[id]');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('.nav-links a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));

let ticking = false;
function onScroll(){
  const y = SCROLL.y = scrollY;
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  SCROLL.v  = y - SCROLL.last;
  SCROLL.last = y;
  SCROLL.n  = clamp(y / max, 0, 1);

  bar.style.width = (SCROLL.n * 100) + '%';
  nav.classList.toggle('scrolled', y > 24);
  topBtn.classList.toggle('show', y > 600);

  let current = '';
  sections.forEach(s => { if (s.getBoundingClientRect().top <= 140) current = s.id; });
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));

  ticking = false;
}
addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: REDUCE ? 'auto' : 'smooth' }));

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ e.target.classList.add('vis'); io.unobserve(e.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------------- tilt 3D ---------------- */
if (!COARSE && !REDUCE){
  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', ((.5 - py) * 14).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((px - .5) * 16).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------------- typewriter ---------------- */
const words = ['meu mundo!', 'sites que vendem!', 'branding forte!', 'UX que encanta!'];
const typeEl = $('#type');
if (REDUCE){
  typeEl.textContent = words[0];
} else {
  let wi = 0, ci = 0, del = false;
  (function tw(){
    const w = words[wi];
    typeEl.textContent = w.slice(0, ci);
    if (!del){ ci++; if (ci > w.length + 8) del = true; }
    else { ci--; if (ci === 0){ del = false; wi = (wi + 1) % words.length; } }
    setTimeout(tw, del ? 42 : 95);
  })();
}

/* palavra que gira em 3D */
const rot = ['Responsivo', 'Rápido', 'Otimizado', 'Criativo'];
const rotEl = $('#rot');
let ri = 0;
if (!REDUCE) setInterval(() => {
  rotEl.textContent = rot[ri++ % rot.length];
  rotEl.classList.add('swap');
  setTimeout(() => rotEl.classList.remove('swap'), 330);
}, 1900);

/* ---------------- contadores ---------------- */
const co = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  $$('b', e.target).forEach(b => {
    const t = +b.dataset.n; let c = 0;
    const iv = setInterval(() => {
      c += Math.max(1, Math.ceil(t / 40));
      if (c >= t){ c = t; clearInterval(iv); }
      b.textContent = c;
    }, 42);
  });
  co.unobserve(e.target);
}), { threshold: .4 });
if ($('.stats')) co.observe($('.stats'));

/* ---------------- cards que viram (serviços) ---------------- */
$$('.flip').forEach(f => {
  const toggle = () => {
    const on = f.classList.toggle('active');
    f.setAttribute('aria-pressed', String(on));
  };
  f.addEventListener('click', toggle);
  f.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
  });
});

/* ---------------- filtros do portfólio ---------------- */
const cardsP = $$('#gridP .pcard');
function buildGallery(){ gallery = cardsP.filter(c => !c.classList.contains('hidden')); }

$$('.filters button').forEach(b => b.addEventListener('click', () => {
  $$('.filters button').forEach(x => {
    x.classList.remove('on'); x.setAttribute('aria-selected', 'false');
  });
  b.classList.add('on'); b.setAttribute('aria-selected', 'true');
  const f = b.dataset.f;
  let i = 0;
  cardsP.forEach(d => {
    const show = f === 'all' || d.dataset.c === f;
    d.classList.toggle('hidden', !show);
    if (show){
      d.classList.remove('enter'); void d.offsetWidth;
      d.style.animationDelay = (i++ * 70) + 'ms';
      d.classList.add('enter');
    }
  });
  buildGallery();
}));

/* ---------------- lightbox 3D ---------------- */
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbTitle = $('#lbTitle'),
      lbDesc = $('#lbDesc'), lbTag = $('#lbTag');
let gallery = [], gi = 0, lastFocus = null;
buildGallery();

function renderLB(){
  const c = gallery[gi];
  if (!c) return;
  lbImg.src = c.dataset.src;
  lbImg.alt = c.querySelector('img').alt;
  lbTitle.textContent = c.dataset.title;
  lbDesc.textContent = c.dataset.desc;
  lbTag.textContent = c.dataset.c === 'site' ? 'site' : (c.dataset.c === 'ux' ? 'ux / ui' : 'branding');
  if (!REDUCE && lbImg.animate){
    lbImg.animate(
      [{ opacity: 0, transform: 'rotateY(-32deg) scale(.94)' }, { opacity: 1, transform: 'none' }],
      { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
  }
}
function openLB(card){
  buildGallery();
  gi = Math.max(0, gallery.indexOf(card));
  lastFocus = document.activeElement;
  renderLB();
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('.lb-close', lb).focus();
}
function closeLB(){
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
function stepLB(d){
  if (!gallery.length) return;
  gi = (gi + d + gallery.length) % gallery.length;
  renderLB();
}
cardsP.forEach(c => {
  c.addEventListener('click', () => openLB(c));
  c.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLB(c); }
  });
});
$$('[data-close]', lb).forEach(b => b.addEventListener('click', closeLB));
$('.lb-prev', lb).addEventListener('click', () => stepLB(-1));
$('.lb-next', lb).addEventListener('click', () => stepLB(1));
addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLB();
  if (e.key === 'ArrowLeft') stepLB(-1);
  if (e.key === 'ArrowRight') stepLB(1);
});

/* ---------------- abas de clientes (card gira em 3D) ---------------- */
const clientCard = $('#clientCard'), tInfo = $('#tInfo');
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.tabs button').forEach(x => {
    x.classList.remove('on'); x.setAttribute('aria-selected', 'false');
  });
  b.classList.add('on'); b.setAttribute('aria-selected', 'true');
  clientCard.classList.add('swap');
  setTimeout(() => {
    tInfo.textContent = b.dataset.t;
    clientCard.classList.remove('swap');
  }, 300);
}));

/* ---------------- preços + Pix ---------------- */
function countTo(el, to){
  const from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
  const t0 = performance.now(), dur = REDUCE ? 1 : 650;
  (function step(now){
    const k = clamp((now - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = 'R$ ' + Math.round(lerp(from, to, e)).toLocaleString('pt-BR');
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
$('#pix').addEventListener('change', e => {
  $$('.pr').forEach(b => {
    const v = +b.dataset.v;
    if (!v){ b.textContent = 'Sob consulta'; return; }
    countTo(b, e.target.checked ? Math.round(v * .9) : v);
  });
});
$$('[data-goto]').forEach(b => b.addEventListener('click', () => {
  const t = $(b.dataset.goto);
  if (t) t.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
}));

/* ---------------- processo ---------------- */
const steps = $$('#steps div');
steps.forEach((d, i) => {
  const act = () => {
    steps.forEach(x => x.classList.remove('on'));
    d.classList.add('on');
    $('#prog i').style.width = ((i + 1) / steps.length * 100) + '%';
    const info = $('#sInfo');
    info.style.opacity = 0;
    setTimeout(() => { info.textContent = d.dataset.s; info.style.opacity = 1; }, 170);
  };
  d.addEventListener('click', act);
  d.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); act(); }
  });
});

/* ---------------- depoimentos: carrossel 3D em anel ---------------- */
const ring = $('#ring'), stage = $('#ringStage');
const slides = $$('#ring .slide'), dots = $$('#dots button');
let qi = 0, auto = null;

function show(i, instant){
  qi = ((i % slides.length) + slides.length) % slides.length;
  if (instant) ring.style.transition = 'none';
  ring.style.setProperty('--active', qi);
  slides.forEach((s, j) => s.classList.toggle('on', j === qi));
  dots.forEach((d, j) => d.classList.toggle('on', j === qi));
  if (instant) requestAnimationFrame(() => { ring.style.transition = ''; });
}
function startAuto(){
  if (REDUCE) return;
  stopAuto();
  auto = setInterval(() => show(qi + 1), 6000);
}
function stopAuto(){ if (auto) clearInterval(auto); auto = null; }

$('#next').addEventListener('click', () => { show(qi + 1); startAuto(); });
$('#prev').addEventListener('click', () => { show(qi - 1); startAuto(); });
dots.forEach((d, j) => d.addEventListener('click', () => { show(j); startAuto(); }));
stage.addEventListener('pointerenter', stopAuto);
stage.addEventListener('pointerleave', startAuto);
stage.addEventListener('focusin', stopAuto);

/* arrastar com o dedo / mouse */
let dragging = false, dragX = 0, dragD = 0;
stage.addEventListener('pointerdown', e => {
  dragging = true; dragX = e.clientX; dragD = 0;
  ring.style.transition = 'none';
  stage.setPointerCapture?.(e.pointerId);
});
stage.addEventListener('pointermove', e => {
  if (!dragging) return;
  dragD = e.clientX - dragX;
  ring.style.setProperty('--active', qi - dragD / 260);
});
function endDrag(){
  if (!dragging) return;
  dragging = false;
  ring.style.transition = '';
  if (Math.abs(dragD) > 55) show(qi + (dragD < 0 ? 1 : -1));
  else show(qi);
  startAuto();
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
show(0); startAuto();

/* ---------------- formulário / WhatsApp ---------------- */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#n').value.trim(), em = $('#e').value.trim(), m = $('#m').value.trim();
  const box = $('#msg');
  box.classList.add('show');
  if (!n || !em || !m){
    box.textContent = 'Preencha nome, e-mail e projeto.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){
    box.textContent = 'Informe um e-mail válido.';
    return;
  }
  box.textContent = 'Abrindo WhatsApp…';
  open('https://wa.me/5511989426415?text=' +
    encodeURIComponent('Olá! Sou ' + n + ' (' + em + '). Projeto: ' + m), '_blank', 'noopener');
});

/* =========================================================
   CENA 3D — Three.js
   ========================================================= */
const canvas = $('#webgl');
const heroEl = $('#hero3d');

async function initScene(){
  const THREE = await import('three');

  /* ---------- renderer ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err){
    throw new Error('WebGL não suportado');
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x051514, 0.024);

  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, .1, 300);
  camera.position.set(0, 0, 10);

  /* ---------- céu com gradiente ---------- */
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(140, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x11453f) },
        bot: { value: new THREE.Color(0x03100f) },
        glow:{ value: new THREE.Color(0x0d7d66) }
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `
        varying vec3 vP; uniform vec3 top, bot, glow;
        void main(){
          vec3 n = normalize(vP);
          float h = n.y * .5 + .5;
          vec3 col = mix(bot, top, smoothstep(.02, .95, h));
          float g = smoothstep(.9, 0., length(vec2(n.x, n.y - .12)));
          col += glow * g * .30;
          gl_FragColor = vec4(col, 1.);
        }`
    })
  );
  scene.add(dome);

  /* ---------- sprites / texturas ---------- */
  function softSprite(){
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(.4, 'rgba(255,255,255,.55)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const SPRITE = softSprite();

  function placeholderTex(label){
    const c = document.createElement('canvas'); c.width = 640; c.height = 448;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 640, 448);
    grd.addColorStop(0, '#1b6b5e'); grd.addColorStop(1, '#0a2a27');
    g.fillStyle = grd; g.fillRect(0, 0, 640, 448);
    g.fillStyle = '#5dffc7'; g.font = '800 46px Inter, sans-serif';
    g.textAlign = 'center'; g.fillText(label, 320, 224);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 22px Inter, sans-serif';
    g.fillText('foto original', 320, 266);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function loadTex(local, remote, label){
    return new Promise(resolve => {
      const L = new THREE.TextureLoader();
      L.setCrossOrigin('anonymous');
      const ok = t => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        resolve({ tex: t, ok: true });
      };
      L.load(local, ok, undefined, () => {
        L.load(remote, ok, undefined, () =>
          resolve({ tex: placeholderTex(label || '3D'), ok: false }));
      });
    });
  }

  /* ---------- partículas ---------- */
  function makePoints({ count, size, color, opacity, span }){
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++){
      pos[i * 3]     = (Math.random() * 2 - 1) * span.x;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * span.y;
      pos[i * 3 + 2] = -Math.random() * span.z + span.front;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size, map: SPRITE, color, transparent: true, opacity,
      depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true, fog: true
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }

  const span = { x: 30, y: 18, z: 55, front: 5 };
  const dust = makePoints({
    count: MOBILE ? 420 : 1500, size: .10, color: 0xd6fff1, opacity: .6, span
  });
  const glow = makePoints({
    count: MOBILE ? 45 : 140, size: 1.35, color: 0x5dffc7, opacity: .10, span
  });

  /* ---------- malha de onda (chão 3D) ---------- */
  const gridMat = new THREE.ShaderMaterial({
    transparent: true, wireframe: true, side: THREE.DoubleSide,
    depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x46f0bb) } },
    vertexShader: `
      uniform float uTime; varying float vH; varying float vD;
      void main(){
        vec3 p = position;
        float w = sin(p.x * .17 + uTime * 1.05) * 1.15 + cos(p.y * .21 + uTime * .8) * .95;
        p.z += w; vH = w;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        vD = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vH; varying float vD;
      void main(){
        float a = clamp(.045 + abs(vH) * .045, .025, .18);
        a *= 1.0 - smoothstep(16.0, 72.0, vD);   /* some ao fundo */
        a *= smoothstep(5.0, 16.0, vD);          /* não gruda na câmera */
        gl_FragColor = vec4(uColor, a);
      }`
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(240, 150, 64, 36), gridMat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.set(0, -11, -32);
  scene.add(grid);

  /* ---------- sólidos flutuantes ---------- */
  const solids = [];
  const geos = [
    new THREE.IcosahedronGeometry(1.7, 0),
    new THREE.OctahedronGeometry(1.5),
    new THREE.TorusGeometry(1.5, .45, 10, 28),
    new THREE.TorusKnotGeometry(1.1, .32, 72, 10),
    new THREE.DodecahedronGeometry(1.6),
    new THREE.BoxGeometry(2.1, 2.1, 2.1),
    new THREE.ConeGeometry(1.5, 2.6, 7)
  ];
  const spots = [
    [-12.5,  5.5, -22], [ 13.5, -3.5, -26], [-9.5, -6.5, -18],
    [ 11.5,  7.5, -30], [-16.0, -1.5, -34], [ 17.0,  2.5, -20],
    [ -7.0,  9.5, -40], [  7.5, -10.0, -38], [-14.5,  9.0, -14],
    [ 15.5, -8.5, -12]
  ];
  spots.forEach((p, i) => {
    const geo = geos[i % geos.length];
    const g = new THREE.Group();
    const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x0c3b35, transparent: true, opacity: .55, side: THREE.DoubleSide, fog: true
    }));
    const lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 18),
      new THREE.LineBasicMaterial({ color: 0x5dffc7, transparent: true, opacity: .45, fog: true })
    );
    g.add(fill, lines);
    g.position.set(p[0], p[1], p[2]);
    const s = .8 + Math.random() * .9;
    g.scale.setScalar(s);
    g.userData = {
      rx: (Math.random() - .5) * .5,
      ry: (Math.random() - .5) * .6,
      baseY: p[1],
      ph: Math.random() * Math.PI * 2
    };
    scene.add(g);
    solids.push(g);
  });

  /* pontos "quentes" que realçam o bloom */
  const sparks = new THREE.Group();
  for (let i = 0; i < 14; i++){
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(.13, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xcaffef, fog: true })
    );
    m.position.set((Math.random() * 2 - 1) * 20, (Math.random() * 2 - 1) * 11, -Math.random() * 42 + 4);
    m.userData.ph = Math.random() * Math.PI * 2;
    sparks.add(m);
  }
  scene.add(sparks);

  /* ---------- PAINEL 3D DA FOTO ORIGINAL (hero) ---------- */
  const heroRes = await loadTex(heroEl.dataset.src, heroEl.dataset.remote, 'g1');
  const heroReady = heroRes.ok;
  const heroTex = heroRes.tex;
  const heroGroup = new THREE.Group();
  const side = new THREE.MeshBasicMaterial({ color: 0x0a2422, fog: false });
  const back = new THREE.MeshBasicMaterial({ color: 0x071a18, fog: false });
  const photoMat = new THREE.MeshBasicMaterial({ map: heroTex, toneMapped: false, fog: false });
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, .05),
    [side, side, side, side, photoMat, back]
  );
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.045, 1.055, .03),
    new THREE.MeshBasicMaterial({ color: 0xeffff9, fog: false })
  );
  frame.position.z = -.035;
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.9),
    new THREE.MeshBasicMaterial({
      color: 0x5dffc7, transparent: true, opacity: .12,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, map: SPRITE
    })
  );
  halo.position.z = -.14;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, .05)),
    new THREE.LineBasicMaterial({ color: 0x5dffc7, fog: false, transparent: true, opacity: .9 })
  );
  heroGroup.add(halo, frame, panel, edges);
  heroGroup.visible = false;
  scene.add(heroGroup);
  if (heroReady) heroEl.classList.add('gl-on');

  /* ---------- fotos originais orbitando o hero ---------- */
  const orbitDefs = [
    { file: 'img/g2.png', a0: 0.6,  rx: .92, ry: .95, sp:  .34, w: 1.15, h: .80 },
    { file: 'img/g4.png', a0: 2.5,  rx: .88, ry: 1.02, sp: -.28, w: 1.15, h: .80 },
    { file: 'img/g7.png', a0: 4.1,  rx: .96, ry: .90, sp:  .30, w: .78,  h: 1.12 },
    { file: 'img/g5.png', a0: 5.4,  rx: .85, ry: 1.05, sp: -.36, w: 1.15, h: .80 }
  ];
  const orbitCards = [];
  await Promise.all(orbitDefs.map(async d => {
    const r = await loadTex(d.file, REMOTE + d.file, d.file.split('/').pop());
    if (!r.ok) return;
    const tex = r.tex;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: .96, side: THREE.DoubleSide,
      toneMapped: false, fog: false, depthWrite: false
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), mat);
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(d.w, d.h)),
      new THREE.LineBasicMaterial({ color: 0x5dffc7, transparent: true, opacity: .8, fog: false })
    );
    e.position.z = .012;
    const g = new THREE.Group();
    g.add(m, e);
    g.userData = { ...d, mesh: m, line: e };
    scene.add(g);
    orbitCards.push(g);
  }));

  /* ---------- estouros de partículas no clique ---------- */
  const burstN = 46, bursts = [];
  for (let b = 0; b < 3; b++){
    const pos = new Float32Array(burstN * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: .2, map: SPRITE, color: 0x9dffe2, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    scene.add(pts);
    bursts.push({ pts, geo, mat, life: 0, vel: new Float32Array(burstN * 3), origin: new THREE.Vector3() });
  }
  const zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const rc = new THREE.Raycaster();
  const hit = new THREE.Vector3();

  function screenToWorld(cx, cy){
    rc.setFromCamera({ x: (cx / innerWidth) * 2 - 1, y: -(cy / innerHeight) * 2 + 1 }, camera);
    return rc.ray.intersectPlane(zPlane, hit) ? hit.clone() : null;
  }
  function spawnBurst(p){
    const b = bursts.find(x => x.life <= 0) || bursts[0];
    b.life = 1;
    b.origin.copy(p);
    const arr = b.geo.attributes.position.array;
    for (let i = 0; i < burstN; i++){
      arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
      const s = 1.8 + Math.random() * 3.4;
      b.vel[i * 3]     = Math.sin(ph) * Math.cos(th) * s;
      b.vel[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * s;
      b.vel[i * 3 + 2] = Math.cos(ph) * s * .5;
    }
    b.geo.attributes.position.needsUpdate = true;
    b.pts.visible = true;
  }
  addEventListener('pointerdown', e => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el.closest('#nav, .lightbox, #top, .flip, .pcard, .price, button, a, input, textarea'))
      return;
    const p = screenToWorld(e.clientX, e.clientY);
    if (p) spawnBurst(p);
  });

  /* ---------- pós-processamento (bloom) ---------- */
  let composer = null, bloom = null;
  try {
    const [EC, RP, UB, OP] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]);
    composer = new EC.EffectComposer(renderer);
    composer.addPass(new RP.RenderPass(scene, camera));
    bloom = new UB.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .58, .55, .9);
    composer.addPass(bloom);
    composer.addPass(new OP.OutputPass());
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(innerWidth, innerHeight);
  } catch (err){
    composer = null;
  }

  /* ---------- mapear DOM -> mundo 3D ---------- */
  function projectRect(rect){
    const a = { x: (rect.left / innerWidth) * 2 - 1, y: -((rect.top) / innerHeight) * 2 + 1 };
    const b = { x: (rect.right / innerWidth) * 2 - 1, y: -((rect.bottom) / innerHeight) * 2 + 1 };
    rc.setFromCamera(a, camera);
    if (!rc.ray.intersectPlane(zPlane, hit)) return null;
    const p1 = hit.clone();
    rc.setFromCamera(b, camera);
    if (!rc.ray.intersectPlane(zPlane, hit)) return null;
    const p2 = hit.clone();
    return {
      x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2,
      w: Math.abs(p2.x - p1.x), h: Math.abs(p1.y - p1.y)
    };
  }

  /* ---------- resize ---------- */
  function resize(){
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    if (composer){ composer.setSize(innerWidth, innerHeight); bloom?.setSize(innerWidth, innerHeight); }
  }
  addEventListener('resize', resize);

  /* ---------- qualidade adaptativa ---------- */
  let frames = 0, fpsT = performance.now(), lowPower = false, warmup = 0;
  function checkQuality(now){
    frames++;
    if (now - fpsT < 3000) return;
    const fps = frames / ((now - fpsT) / 1000);
    frames = 0; fpsT = now;
    if (warmup < 1){ warmup++; return; }   /* ignora a 1ª janela (compilação de shaders) */
    if (fps < 30 && !lowPower){
      lowPower = true;
      renderer.setPixelRatio(1);
      composer?.setPixelRatio(1);
      resize();
      if (bloom) bloom.strength = .3;
    }
  }

  /* ---------- contexto perdido ---------- */
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    heroEl.classList.remove('gl-on');
    canvas.style.display = 'none';
  });

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  let heroRX = 0, heroRY = 0;

  function tick(){
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    const speed = REDUCE ? .18 : 1;

    /* mouse suavizado + deriva automática quando não há ponteiro */
    if (!MOUSE.active || COARSE){
      MOUSE.tx = Math.sin(t * .35) * .55;
      MOUSE.ty = Math.cos(t * .27) * .4;
    }
    MOUSE.x = lerp(MOUSE.x, MOUSE.tx, .05);
    MOUSE.y = lerp(MOUSE.y, MOUSE.ty, .05);

    /* parallax da câmera com o scroll */
    const targetZ = 10 - SCROLL.n * 2.2;
    camera.position.x = lerp(camera.position.x, MOUSE.x * .9, .06);
    camera.position.y = lerp(camera.position.y, -MOUSE.y * .6 - SCROLL.n * .8, .06);
    camera.position.z = lerp(camera.position.z, targetZ, .05);
    camera.lookAt(camera.position.x * .35, camera.position.y * .4, 0);

    /* partículas */
    dust.rotation.y = t * .012 * speed + SCROLL.n * .5;
    dust.position.y = -SCROLL.n * 7;
    glow.rotation.y = -t * .008 * speed - SCROLL.n * .4;
    glow.position.y = -SCROLL.n * 5;

    /* ondas da malha */
    gridMat.uniforms.uTime.value = t * speed;

    /* sólidos */
    const vel = clamp(Math.abs(SCROLL.v) * .012, 0, 2.2);
    solids.forEach(g => {
      const u = g.userData;
      g.rotation.x += (u.rx + vel * .05) * .016 * speed;
      g.rotation.y += (u.ry + vel * .07) * .016 * speed;
      g.position.y = u.baseY + Math.sin(t * .55 + u.ph) * .8 - SCROLL.n * 6;
    });
    sparks.children.forEach(s => {
      const k = .7 + Math.sin(t * 2.4 + s.userData.ph) * .35;
      s.scale.setScalar(k);
    });

    /* painel do hero preso ao DOM */
    const rect = heroEl.getBoundingClientRect();
    const off = rect.bottom < -40 || rect.top > innerHeight + 40;
    const fade = 1 - clamp(SCROLL.y / (innerHeight * .75), 0, 1);
    if (!off && fade > .01){
      const p = projectRect(rect);
      if (p && p.w > .05){
        if (heroReady){
          heroGroup.visible = true;
          heroRX = lerp(heroRX, -MOUSE.y * .16, .07);
          heroRY = lerp(heroRY,  MOUSE.x * .24, .07);
          heroGroup.position.set(p.x, p.y + Math.sin(t * .9) * .045 * speed, 0);
          heroGroup.scale.set(p.w, p.h, p.w);
          heroGroup.rotation.set(heroRX, heroRY, Math.sin(t * .5) * .012 * speed);

          /* fade suave conforme a rolagem */
          photoMat.transparent = true;  photoMat.depthWrite = false;  photoMat.opacity = fade;
          side.transparent = true;      side.depthWrite = false;      side.opacity = fade;
          back.transparent = true;      back.depthWrite = false;      back.opacity = fade;
          frame.material.transparent = true; frame.material.depthWrite = false;
          frame.material.opacity = fade;
          halo.material.opacity = .12 * fade;
          edges.material.opacity = .9 * fade;
        } else {
          heroGroup.visible = false;
        }

        /* fotos originais orbitando o painel */
        orbitCards.forEach(g => {
          const d = g.userData;
          const ang = t * d.sp * speed + d.a0;
          g.visible = true;
          g.position.set(
            p.x + Math.cos(ang) * d.rx * p.w,
            p.y + Math.sin(ang) * d.ry * p.h * .95,
            -.9 + Math.sin(ang * 1.4) * 1.0
          );
          g.rotation.set(
            Math.sin(ang) * .16,
            -Math.cos(ang) * .5,
            Math.sin(ang * .7) * .05
          );
          g.scale.setScalar(p.w * .30);
          d.mesh.material.opacity = .95 * fade;
          d.line.material.opacity = .8 * fade;
        });
      }
    } else {
      heroGroup.visible = false;
      orbitCards.forEach(g => { g.visible = false; });
    }

    /* estouros */
    bursts.forEach(b => {
      if (b.life <= 0) return;
      b.life -= dt * 1.5;
      const arr = b.geo.attributes.position.array;
      for (let i = 0; i < burstN; i++){
        arr[i * 3]     += b.vel[i * 3] * dt;
        arr[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        arr[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
        b.vel[i * 3] *= .94; b.vel[i * 3 + 1] *= .94; b.vel[i * 3 + 2] *= .94;
      }
      b.geo.attributes.position.needsUpdate = true;
      b.mat.opacity = clamp(b.life, 0, 1);
      if (b.life <= 0) b.pts.visible = false;
    });

    /* bloom respira com a velocidade do scroll (decai sozinho) */
    if (bloom && !lowPower) bloom.strength = .5 + clamp(Math.abs(SCROLL.v) * .01, 0, .35);
    SCROLL.v *= .82;

    if (composer) composer.render();
    else renderer.render(scene, camera);

    checkQuality(performance.now());
  }
  tick();

  /* cena pronta: esconde o loader */
  setTimeout(hideLoader, 350);
}

initScene().catch(err => {
  console.warn('Cena 3D indisponível:', err);
  canvas.style.display = 'none';
  document.body.classList.add('no-webgl');
  hideLoader();
});
