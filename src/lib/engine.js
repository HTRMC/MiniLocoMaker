// @ts-check
// Mini-loco game engine: renders the board as SVG and handles play.
// Self-contained on purpose: exported .html games inline this file verbatim (see export.ts),
// so: no imports, and never write the closing script tag sequence anywhere in this file.

export const W = 790, H = 610;
const M = 20, IMG = 250;
const SRC = { x: 290, y: 75, s: 75 }; // small tiles (with labels)
const DST = { x: 20, y: 340, s: 125 }; // answer slots
// Board text stays Arial: PDF export (svg2pdf) only has Helvetica metrics.
const FONT = 'Arial, Helvetica, sans-serif', INK = '#1e293b', MUTED = '#64748b', LINE = '#cbd5e1', SOFT = '#f8fafc';
const RED = '#e03131', GREEN = '#2f9e44', PRIMARY = '#4263eb';
const BTN = 'font:700 15px system-ui,sans-serif;border:0;border-radius:12px;padding:9px 18px;cursor:pointer';

// Back sides of the real mini-loco tiles. Tile number n (0-11) shows pattern CONV[n]:
// colour = p >> 2 (blue, red, green), shape = p % 4 (a quadrilateral with one white corner triangle).
const COLORS = ['#009FE3', '#E3232A', '#00983F'];
const SHAPES = ['50,0 100,0 100,100 0,100', '0,0 50,0 100,100 0,100', '0,0 100,0 100,100 50,100', '0,0 100,0 50,100 0,100'];
const CONV = [10, 2, 7, 11, 5, 3, 9, 0, 6, 8, 4, 1];
// Solution figures of the physical box (tile numbers 1-12). Row r of every figure holds the same colour group.
const BASIS = [
  [[11, 5, 9, 3], [8, 12, 2, 6], [10, 7, 1, 4]],
  [[5, 11, 9, 3], [12, 8, 2, 6], [7, 10, 1, 4]],
  [[9, 5, 11, 3], [2, 12, 8, 6], [1, 7, 10, 4]],
  [[11, 3, 9, 5], [8, 6, 2, 12], [10, 4, 1, 7]],
  [[9, 3, 11, 5], [2, 6, 8, 12], [1, 4, 10, 7]],
  [[5, 11, 3, 9], [12, 8, 6, 2], [7, 10, 4, 1]],
  [[3, 9, 5, 11], [6, 2, 12, 8], [4, 1, 7, 10]],
  [[11, 5, 3, 9], [8, 12, 6, 2], [10, 7, 4, 1]],
  [[3, 9, 11, 5], [6, 2, 8, 12], [4, 1, 10, 7]],
  [[9, 3, 5, 11], [2, 6, 12, 8], [1, 4, 7, 10]],
  [[3, 11, 5, 9], [6, 8, 12, 2], [4, 10, 7, 1]],
];
const ORDER = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

const UI = {
  nl: {
    hint: '← Klik op de afbeelding om te vergroten. Sleep de vakjes naar het juiste antwoord.',
    check: 'Kijk na', back: '← terug', again: 'Nieuw spel', other: 'English',
    all: 'Geef eerst alle 12 vakjes een plek.', good: 'Goed gedaan!', bad: 'Nee, niet goed. Het patroon klopt niet.', key: 'Oplossing (loco)',
  },
  en: {
    hint: '← Click the image to enlarge. Drag the tiles onto the correct answer.',
    check: 'Check', back: '← back', again: 'New game', other: 'Nederlands',
    all: 'First give all 12 tiles a place.', good: 'Well done!', bad: 'No, not correct. The pattern is wrong.', key: 'Solution (loco)',
  },
};

/** Text in the requested language, falling back to the other one. @param {any} v @param {string} lang */
export const tr = (v, lang) => String((v && (v[lang] || v.nl || v.en)) || '');
/** @param {unknown} s */
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
/** @param {number} n */
const rnd = n => Math.floor(Math.random() * n);
/** @template T @param {T[]} a */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Back side of tile number n (0-11). @param {number} n */
export function backOf(n) {
  const p = CONV[n];
  return { color: COLORS[p >> 2], shape: SHAPES[p % 4] };
}

/**
 * New random game. items[n] = index of the item on tile n; solution[slot] = tile number that belongs in that slot.
 * @param {number} nItems
 */
export function deal(nItems) {
  const items = shuffle([...Array(nItems).keys()]).slice(0, 12);
  const fig = rnd(BASIS.length), fig2 = rnd(BASIS.length), order = ORDER[rnd(6)];
  /** @type {number[]} */
  const solution = [];
  for (let i = 0; i < 3; i++) { // middle colour column may use a different figure, like the original applets
    const [a, b, c, d] = BASIS[i === 1 ? fig : fig2][order[i]];
    solution[2 * i] = a - 1; solution[2 * i + 1] = b - 1; solution[2 * i + 6] = c - 1; solution[2 * i + 7] = d - 1;
  }
  return { items, solution };
}

/** @type {CanvasRenderingContext2D | null} */
let ctx = null;
/** @param {string} str @param {number} size */
function measure(str, size) {
  ctx ||= /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  ctx.font = `bold ${size}px ${FONT}`;
  return ctx.measureText(str).width;
}

/** Largest font size (<= max) at which the word-wrapped text fits in w x h. "|" forces a line break. */
function fit(/** @type {string} */ text, /** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ max) {
  for (let size = max; ; size--) {
    const lines = [];
    let tooWide = false;
    for (const para of text.split(/\||\n/)) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? `${line} ${word}` : word;
        if (!line || measure(test, size) <= w) line = test; else { lines.push(line); line = word; }
        if (measure(line, size) > w) tooWide = true;
      }
      lines.push(line);
    }
    if (size <= 6 || (!tooWide && lines.length * size * 1.15 <= h)) return { size, lines };
  }
}

/** Centered, wrapped text box. */
function block(/** @type {string} */ str, /** @type {number} */ cx, /** @type {number} */ cy, /** @type {number} */ w, /** @type {number} */ h, /** @type {number} */ max, /** @type {string} */ fill) {
  const { size, lines } = fit(str, w, h, max), lh = size * 1.15, y0 = cy - ((lines.length - 1) * lh) / 2 + size * 0.35;
  return `<text font-size="${size}" font-weight="bold" fill="${fill}" text-anchor="middle">` +
    lines.map((l, i) => `<tspan x="${cx}" y="${(y0 + i * lh).toFixed(1)}">${esc(l)}</tspan>`).join('') + '</text>';
}

/** Single left-aligned line, shrunk to fit width w. */
function line(/** @type {string} */ str, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ max, weight = 'bold', fill = INK) {
  const size = Math.max(6, Math.min(max, Math.floor((max * w) / Math.max(1, measure(str, max)))));
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(str)}</text>`;
}

/** @param {number} x @param {number} y @param {number} size */
const tf = (x, y, size) => `translate(${x} ${y}) scale(${size / 100})`;
/** @param {number} n */
const back = n => { const b = backOf(n); return `<rect width="100" height="100" fill="#FFF8DC"/><polygon points="${b.shape}" fill="${b.color}"/>`; };

/**
 * Board as an SVG string. sheet = printable worksheet (no hint, no back sides, with the solution pattern).
 * @param {any} game @param {{items: number[], solution: number[]}} d @param {string} lang
 */
export function render(game, d, lang, sheet = false) {
  const L = lang === 'nl' ? UI.nl : UI.en, img = esc(game.image || '');
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">`,
    `<defs><clipPath id="mlm-clip"><rect width="100" height="100" rx="10"/></clipPath></defs>`,
    `<rect width="${W}" height="${H}" fill="#fff"/>`, // square, opaque ground: JPEG has no transparency
    line(tr(game.title, lang), M, 32, W - 2 * M, 22),
    `<rect x="${M}" y="45" width="${IMG}" height="${IMG}" rx="12" fill="${SOFT}" stroke="${LINE}" stroke-width="2"/>`,
  ];
  if (img) out.push(`<image id="mlm-img" class="img" x="${M}" y="45" width="${IMG}" height="${IMG}" href="${img}" preserveAspectRatio="xMidYMid meet" style="cursor:zoom-in"/>`);
  if (!sheet) out.push(line(L.hint, SRC.x, 62, 6 * SRC.s, 12, 'normal', MUTED));
  for (let n = 0; n < 12; n++) out.push(`<rect x="${SRC.x + (n % 6) * SRC.s + 4}" y="${SRC.y + Math.floor(n / 6) * SRC.s + 4}" width="${SRC.s - 8}" height="${SRC.s - 8}" rx="8" fill="${SOFT}" stroke="${LINE}" stroke-width="2" stroke-dasharray="5 4"/>`);
  out.push(line(tr(game.question, lang), M, 328, W - 2 * M, 20));

  d.solution.forEach((n, s) => {
    const x = DST.x + (s % 6) * DST.s, y = DST.y + Math.floor(s / 6) * DST.s;
    out.push(`<rect x="${x + 3}" y="${y + 3}" width="${DST.s - 6}" height="${DST.s - 6}" rx="12" fill="#edf2ff" stroke="#bac8ff" stroke-width="2"/>`,
      block(tr(game.items[d.items[n]], lang), x + DST.s / 2, y + DST.s / 2, DST.s - 18, DST.s - 18, 26, INK));
  });

  if (sheet) { // solution pattern with rows swapped: the physical box is flipped over to check
    const kx = SRC.x + 6 * SRC.s - 108;
    out.push(line(L.key, kx, 246, 108, 11, 'normal'));
    d.solution.forEach((n, s) => {
      out.push(`<g transform="${tf(kx + (s % 6) * 18, 252 + (s < 6 ? 18 : 0), 18)}">${back(n)}<rect width="100" height="100" fill="none" stroke="${MUTED}" stroke-width="4"/></g>`);
    });
  }

  d.items.forEach((k, n) => {
    const label = String(game.items[k]?.label ?? '');
    out.push(`<g class="t" data-n="${n}" transform="${tf(SRC.x + (n % 6) * SRC.s, SRC.y + Math.floor(n / 6) * SRC.s, SRC.s)}" style="cursor:grab"><g clip-path="url(#mlm-clip)">`,
      `<g class="f"><rect width="100" height="100" fill="#fff8e6"/>${block(label, 50, 54, 86, 70, 64, RED)}`,
      `<text x="8" y="20" font-size="15" font-weight="bold" fill="${MUTED}">${n + 1}</text></g>`,
      sheet ? '' : `<g class="b" display="none">${back(n)}</g>`,
      `</g><rect x="1" y="1" width="98" height="98" rx="9" fill="none" stroke="#94a3b8" stroke-width="2"/></g>`);
  });

  if (!sheet && img) { // enlarged image overlay
    const s = 570 / IMG;
    out.push(`<g class="zoom" display="none" style="cursor:zoom-out"><rect width="${W}" height="${H}" fill="#000" fill-opacity="0.6"/>`,
      `<use href="#mlm-img" transform="translate(${(W - 570) / 2 - M * s} ${20 - 45 * s}) scale(${s})"/></g>`);
  }
  out.push('</svg>');
  return out.join('');
}

/**
 * Playable game inside root. Returns the current worksheet SVG for exports.
 * @param {HTMLElement} root @param {any} game @param {{lang?: string}} [opts]
 */
export function mount(root, game, opts = {}) {
  let lang = opts.lang || (/^nl/i.test(navigator.language) ? 'nl' : 'en');
  let d = deal(game.items.length), at = Array(12).fill(-1), checked = false;
  const soft = `${BTN};background:#edf2ff;color:${PRIMARY}`;
  root.innerHTML = `<div></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px">` +
    `<button style="${BTN};background:${PRIMARY};color:#fff"></button><button style="${soft}"></button><button style="${soft}"></button>` +
    `<span role="status" style="font:700 16px system-ui,sans-serif"></span></div>`;
  const board = /** @type {HTMLElement} */ (root.firstElementChild);
  const [bCheck, bNew, bLang] = root.querySelectorAll('button');
  const msg = /** @type {HTMLElement} */ (root.querySelector('[role=status]'));
  bLang.hidden = !game.items.some((/** @type {any} */ i) => i.nl && i.en);
  /** @type {SVGSVGElement} */
  let svg;

  const say = (s = '', color = INK) => { msg.textContent = s; msg.style.color = color; };
  const tile = (/** @type {number} */ n) => /** @type {SVGGElement} */ (svg.querySelector(`.t[data-n="${n}"]`));
  const toTop = (/** @type {Element} */ g) => svg.insertBefore(g, svg.querySelector('.zoom'));
  const home = (/** @type {number} */ n) => tile(n).setAttribute('transform', tf(SRC.x + (n % 6) * SRC.s, SRC.y + Math.floor(n / 6) * SRC.s, SRC.s));
  function put(/** @type {number} */ n, /** @type {number} */ s) {
    toTop(tile(n));
    tile(n).setAttribute('transform', tf(DST.x + (s % 6) * DST.s, DST.y + Math.floor(s / 6) * DST.s, DST.s));
    at[s] = n;
  }
  function flip(/** @type {boolean} */ on) {
    svg.querySelectorAll('.t').forEach(g => {
      g.querySelector('.f')?.setAttribute('display', on ? 'none' : 'inline');
      g.querySelector('.b')?.setAttribute('display', on ? 'inline' : 'none');
    });
  }
  function draw() {
    const L = lang === 'nl' ? UI.nl : UI.en;
    board.innerHTML = render(game, d, lang);
    svg = /** @type {SVGSVGElement} */ (board.firstElementChild);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.style.cssText = 'display:block;width:100%;height:auto;touch-action:none;user-select:none';
    at.forEach((n, s) => n >= 0 && put(n, s));
    flip(checked);
    bCheck.textContent = checked ? L.back : L.check; bNew.textContent = L.again; bLang.textContent = L.other;
  }
  const zoom = (/** @type {boolean} */ on) => svg.querySelector('.zoom')?.setAttribute('display', on ? 'inline' : 'none');

  board.addEventListener('pointerdown', e => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('.zoom')) return zoom(false);
    if (target.closest('.img')) return zoom(true);
    const g = /** @type {SVGGElement | null} */ (target.closest('.t'));
    if (!g || checked) return;
    e.preventDefault();
    const n = Number(g.dataset.n), prev = at.indexOf(n);
    if (prev >= 0) at[prev] = -1;
    const pt = (/** @type {PointerEvent} */ ev) => new DOMPoint(ev.clientX, ev.clientY).matrixTransform(/** @type {DOMMatrix} */ (svg.getScreenCTM()).inverse());
    const m = /** @type {SVGTransform} */ (g.transform.baseVal.consolidate()).matrix, p0 = pt(e);
    const grow = DST.s / (m.a * 100), ox = (p0.x - m.e) * grow, oy = (p0.y - m.f) * grow; // tile grows to slot size while dragging
    const move = (/** @type {PointerEvent} */ ev) => { const p = pt(ev); g.setAttribute('transform', tf(p.x - ox, p.y - oy, DST.s)); };
    const up = (/** @type {PointerEvent} */ ev) => {
      board.removeEventListener('pointermove', move); board.removeEventListener('pointerup', up); board.removeEventListener('pointercancel', up);
      const p = pt(ev), col = Math.floor((p.x - ox + DST.s / 2 - DST.x) / DST.s), row = Math.floor((p.y - oy + DST.s / 2 - DST.y) / DST.s);
      if (ev.type === 'pointerup' && col >= 0 && col < 6 && row >= 0 && row < 2) {
        const s = row * 6 + col;
        if (at[s] >= 0) home(at[s]);
        put(n, s);
      } else home(n);
    };
    toTop(g); move(e);
    board.setPointerCapture(e.pointerId);
    board.addEventListener('pointermove', move); board.addEventListener('pointerup', up); board.addEventListener('pointercancel', up);
  });

  bCheck.onclick = () => {
    const L = lang === 'nl' ? UI.nl : UI.en;
    if (checked) { // back to playing: wrong tiles go home
      checked = false; flip(false); say(); bCheck.textContent = L.check;
      at.forEach((n, s) => { if (n !== d.solution[s]) { at[s] = -1; home(n); } });
      return;
    }
    if (at.includes(-1)) return say(L.all, RED);
    checked = true; flip(true); bCheck.textContent = L.back;
    const ok = at.every((n, s) => n === d.solution[s]);
    say(ok ? L.good : L.bad, ok ? GREEN : RED);
  };
  bNew.onclick = () => { d = deal(game.items.length); at.fill(-1); checked = false; say(); draw(); };
  bLang.onclick = () => { lang = lang === 'nl' ? 'en' : 'nl'; say(); draw(); };
  draw();

  return { sheet: () => render(game, d, lang, true), lang: () => lang };
}
