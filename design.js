// PDF Mate Design Studio: photo albums, collages and presentation-ready pages.
// Loaded on demand by app.js. Everything renders through one canvas painter, so the editor, thumbnails and the exported PDF match.

const PT = 72 / 25.4;
const SAMPLE_A = Math.sqrt(595.28 * 841.89);
let C = null;            // helpers from app.js
let D = null;            // the design
const PH = new Map();    // photo runtime: id -> { id, name, w, h, blob, url, img, prev }
let UI = null;
const ST = { sel: null, ms: [], adj: null, edit: null, z: 1, fit: true, tab: 'templates', hist: [], fut: [], last: '', drag: null, guides: [], all: true, lf: 'all', gfxCat: 'all', tcat: 'all', sheet: false, insp: true, dpi: true, marq: null };
let CLIP = null;

const uidd = (p = 'd') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const $ = (s, r) => (r || UI.root).querySelector(s);
const $$ = (s, r) => [...(r || UI.root).querySelectorAll(s)];

/* ---------- Library: sizes, fonts, shapes, layouts, styles, graphics ---------- */
const SIZES = [
  ['a4p', 'A4 portrait', 210, 297], ['a4l', 'A4 landscape', 297, 210], ['a3p', 'A3 portrait', 297, 420], ['a3l', 'A3 landscape', 420, 297],
  ['a5p', 'A5 portrait', 148, 210], ['a5l', 'A5 landscape', 210, 148], ['ltp', 'Letter portrait', 215.9, 279.4], ['ltl', 'Letter landscape', 279.4, 215.9],
  ['sq20', 'Square 20 cm', 200, 200], ['sq30', 'Square photo book 30 cm', 305, 305], ['p810', 'Photo 8 × 10 in', 203.2, 254], ['p108', 'Photo 10 × 8 in', 254, 203.2],
  ['p46', 'Photo print 4 × 6 in', 101.6, 152.4], ['p64', 'Photo print 6 × 4 in', 152.4, 101.6], ['s169', 'Slide 16:9', 338.67, 190.5], ['s43', 'Slide 4:3', 254, 190.5],
  ['ig45', 'Social post 4:5', 190.5, 238.13], ['igsq', 'Social square', 190.5, 190.5], ['igst', 'Story 9:16', 190.5, 338.67],
  ['a6p', 'A6 card portrait', 105, 148], ['a6l', 'A6 postcard landscape', 148, 105], ['inv57', 'Invitation 5 × 7 in', 127, 177.8], ['dl', 'DL flyer', 99, 210], ['bc', 'Business card', 85, 55]
];
const FONTS = {
  serif: ['Classic serif', 'Georgia, "Times New Roman", serif'],
  elegant: ['Elegant', '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif'],
  didone: ['Didone', '"Bodoni MT", Didot, "Bodoni 72", Georgia, serif'],
  garamond: ['Book', 'Garamond, "EB Garamond", "Times New Roman", serif'],
  copper: ['Engraved', 'Copperplate, "Copperplate Gothic Light", "Perpetua Titling MT", Georgia, serif'],
  sans: ['Modern sans', '"Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif'],
  clean: ['Clean', '"Helvetica Neue", Helvetica, Arial, sans-serif'],
  geo: ['Geometric', '"Century Gothic", Futura, "Avenir Next", "Trebuchet MS", sans-serif'],
  round: ['Friendly', '"Trebuchet MS", Verdana, sans-serif'],
  display: ['Bold display', 'Impact, "Arial Black", Haettenschweiler, sans-serif'],
  script: ['Script', '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive'],
  hand: ['Handwritten', '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'],
  type: ['Typewriter', '"Courier New", Courier, monospace']
};
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const starD = (n, r2, r1 = 50) => { let d = ''; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = -Math.PI / 2 + i * Math.PI / n; d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(2) + ' ' + (50 + r * Math.sin(a)).toFixed(2); } return d + 'Z'; };
const circD = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const SHAPES = {
  rect: ['Rectangle'], circle: ['Circle'], oval: ['Oval'], pill: ['Pill'],
  arch: ['Arch', 'M0 100V45A50 45 0 0 1 100 45V100Z'],
  heart: ['Heart', 'M50 94C20 72 2 54 2 31C2 15 14 4 28 4C38 4 46 10 50 19C54 10 62 4 72 4C86 4 98 15 98 31C98 54 80 72 50 94Z'],
  star: ['Star', starD(5, 22)],
  hex: ['Hexagon', 'M25 0H75L100 50L75 100H25L0 50Z'],
  oct: ['Octagon', 'M29 0H71L100 29V71L71 100H29L0 71V29Z'],
  diamond: ['Diamond', 'M50 0L100 50L50 100L0 50Z'],
  tri: ['Triangle', 'M50 0L100 100H0Z'],
  blob: ['Blob', 'M53 2C77 3 97 20 98 45C99 72 80 97 51 98C23 99 2 80 2 53C2 25 27 1 53 2Z'],
  leaf: ['Leaf', 'M0 100C0 40 40 0 100 0C100 60 60 100 0 100Z'],
  para: ['Slant', 'M18 0H100L82 100H0Z'],
  shield: ['Shield', 'M50 0L100 12V46C100 76 78 92 50 100C22 92 0 76 0 46V12Z'],
  badge: ['Badge', starD(16, 45)],
  cloud: ['Cloud', 'M25 85C10 85 2 74 2 62C2 49 12 41 23 41C24 24 37 12 53 12C68 12 79 22 82 35C93 37 98 47 98 58C98 73 87 85 72 85Z'],
  ticket: ['Ticket', 'M0 0H100V38A12 12 0 0 0 100 62V100H0V62A12 12 0 0 0 0 38Z']
};
const grid = (r, c) => { const a = []; for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) a.push([j / c, i / r, 1 / c, 1 / r]); return a; };
const ring = () => { const a = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if ((i === 1 || i === 2) && (j === 1 || j === 2)) continue; a.push([j / 4, i / 4, 1 / 4, 1 / 4]); } a.splice(5, 0, [0.25, 0.25, 0.5, 0.5]); return a; };
const LAYOUTS = [
  { k: 'one', n: 'Full page', cat: 'Single', cells: [[0, 0, 1, 1]] },
  { k: 'cover', n: 'Album cover', cat: 'Single', cells: [[0, 0, 1, 1]], texts: [['cover', [0.04, 0.4, 0.92, 0.12]], ['coversub', [0.04, 0.53, 0.92, 0.05]]] },
  { k: 'hero', n: 'Photo and title', cat: 'Single', cells: [[0, 0, 1, 0.8]], texts: [['title', [0, 0.83, 1, 0.09]], ['sub', [0, 0.93, 1, 0.05]]] },
  { k: 'framed', n: 'Centred with caption', cat: 'Single', cells: [[0.1, 0.08, 0.8, 0.7]], texts: [['caption', [0.1, 0.82, 0.8, 0.06]]] },
  { k: 'circle1', n: 'Circle portrait', cat: 'Single', cells: [[0.15, 0.06, 0.7, 0.62, 'circle']], texts: [['title', [0, 0.72, 1, 0.1]], ['sub', [0, 0.84, 1, 0.05]]] },
  { k: 'pol1', n: 'Single print', cat: 'Single', cells: [[0.14, 0.1, 0.72, 0.66, 0, -3, 1]], texts: [['hand', [0.1, 0.82, 0.8, 0.08]]] },
  { k: '2h', n: 'Two side by side', cat: 'Grid', cells: grid(1, 2) },
  { k: '2v', n: 'Two stacked', cat: 'Grid', cells: grid(2, 1) },
  { k: '3c', n: 'Three columns', cat: 'Grid', cells: grid(1, 3) },
  { k: '3r', n: 'Three rows', cat: 'Grid', cells: grid(3, 1) },
  { k: '4g', n: 'Grid of four', cat: 'Grid', cells: grid(2, 2) },
  { k: '6a', n: 'Grid of six', cat: 'Grid', cells: grid(3, 2) },
  { k: '6b', n: 'Six wide', cat: 'Grid', cells: grid(2, 3) },
  { k: '8', n: 'Grid of eight', cat: 'Grid', cells: grid(4, 2) },
  { k: '9', n: 'Grid of nine', cat: 'Grid', cells: grid(3, 3) },
  { k: '12', n: 'Grid of twelve', cat: 'Grid', cells: grid(4, 3) },
  { k: '16', n: 'Grid of sixteen', cat: 'Grid', cells: grid(4, 4) },
  { k: '20', n: 'Contact sheet', cat: 'Grid', cells: grid(5, 4) },
  { k: 'l2r', n: 'Feature left', cat: 'Collage', cells: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]] },
  { k: 't2b', n: 'Feature top', cat: 'Collage', cells: [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]] },
  { k: 't3b', n: 'Feature and three', cat: 'Collage', cells: [[0, 0, 1, 0.62], [0, 0.62, 1 / 3, 0.38], [1 / 3, 0.62, 1 / 3, 0.38], [2 / 3, 0.62, 1 / 3, 0.38]] },
  { k: 'strip', n: 'Feature and strip', cat: 'Collage', cells: [[0, 0, 1, 0.7], [0, 0.7, 0.25, 0.3], [0.25, 0.7, 0.25, 0.3], [0.5, 0.7, 0.25, 0.3], [0.75, 0.7, 0.25, 0.3]] },
  { k: 'l4', n: 'Feature and four', cat: 'Collage', cells: [[0, 0, 0.5, 1], [0.5, 0, 0.25, 0.5], [0.75, 0, 0.25, 0.5], [0.5, 0.5, 0.25, 0.5], [0.75, 0.5, 0.25, 0.5]] },
  { k: 'm5', n: 'Mosaic five', cat: 'Collage', cells: [[0, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0, 0.5, 0.34], [0.5, 0.34, 0.5, 0.33], [0.5, 0.67, 0.5, 0.33]] },
  { k: 'm6', n: 'Mosaic six', cat: 'Collage', cells: [[0, 0, 0.66, 0.5], [0.66, 0, 0.34, 0.25], [0.66, 0.25, 0.34, 0.25], [0, 0.5, 0.34, 0.5], [0.34, 0.5, 0.66, 0.25], [0.34, 0.75, 0.66, 0.25]] },
  { k: 'lsh', n: 'Corner feature', cat: 'Collage', cells: [[0, 0, 0.65, 0.65], [0.65, 0, 0.35, 0.325], [0.65, 0.325, 0.35, 0.325], [0.65, 0.65, 0.35, 0.35], [0, 0.65, 0.325, 0.35], [0.325, 0.65, 0.325, 0.35]] },
  { k: 'ring', n: 'Centre stage', cat: 'Collage', cells: ring() },
  { k: 'mag1', n: 'Magazine', cat: 'Story', cells: [[0, 0, 0.6, 0.58], [0.6, 0, 0.4, 0.29], [0.6, 0.29, 0.4, 0.29], [0.45, 0.6, 0.55, 0.4]], texts: [['title', [0, 0.62, 0.42, 0.1]], ['body', [0, 0.74, 0.42, 0.26]]] },
  { k: 'mag2', n: 'Editorial', cat: 'Story', cells: [[0, 0, 1, 0.55], [0.5, 0.58, 0.5, 0.42]], texts: [['title', [0, 0.6, 0.46, 0.1]], ['body', [0, 0.72, 0.46, 0.28]]] },
  { k: 'journal', n: 'Travel journal', cat: 'Story', cells: [[0.03, 0.04, 0.5, 0.38, 0, -4, 1], [0.48, 0.17, 0.48, 0.36, 0, 5, 1], [0.05, 0.54, 0.46, 0.36, 0, 3, 1]], texts: [['hand', [0.55, 0.62, 0.42, 0.18]]] },
  { k: 'scatter', n: 'Scattered prints', cat: 'Story', cells: [[0.03, 0.03, 0.5, 0.42, 0, -6, 1], [0.47, 0.07, 0.5, 0.42, 0, 5, 1], [0.05, 0.52, 0.5, 0.42, 0, 4, 1], [0.45, 0.54, 0.5, 0.42, 0, -4, 1]] },
  { k: 'bubbles', n: 'Bubbles', cat: 'Story', cells: [[0, 0, 0.62, 0.55, 'circle'], [0.48, 0.4, 0.52, 0.45, 'circle'], [0.02, 0.6, 0.42, 0.4, 'circle']] },
  { k: 'arches', n: 'Arches', cat: 'Story', cells: [[0, 0.14, 1 / 3, 0.72, 'arch'], [1 / 3, 0.14, 1 / 3, 0.72, 'arch'], [2 / 3, 0.14, 1 / 3, 0.72, 'arch']], texts: [['title', [0, 0.01, 1, 0.1]], ['caption', [0, 0.9, 1, 0.06]]] },
  { k: 'quote', n: 'Quote page', cat: 'Story', cells: [[0.25, 0.06, 0.5, 0.42, 'circle']], texts: [['quote', [0.06, 0.54, 0.88, 0.22]], ['caption', [0.06, 0.8, 0.88, 0.05]]] },
  { k: 'title', n: 'Title page', cat: 'Story', cells: [], texts: [['cover', [0.04, 0.4, 0.92, 0.12]], ['coversub', [0.04, 0.53, 0.92, 0.05]]] },
  { k: 'sp-bleed', n: 'Full bleed spread', cat: 'Spread', spread: 1, bleed: 1, cells: [[0, 0, 1, 1]] },
  { k: 'sp-pano', n: 'Panorama', cat: 'Spread', spread: 1, cells: [[0, 0, 1, 1]] },
  { k: 'sp-strip', n: 'Cinema strip', cat: 'Spread', spread: 1, cells: [[0, 0.2, 1, 0.6]] },
  { k: 'sp-pano4', n: 'Panorama and four', cat: 'Spread', spread: 1, cells: [[0, 0, 1, 0.62], [0, 0.62, 0.25, 0.38], [0.25, 0.62, 0.25, 0.38], [0.5, 0.62, 0.25, 0.38], [0.75, 0.62, 0.25, 0.38]] },
  { k: 'sp-hero', n: 'Across the fold', cat: 'Spread', spread: 1, cells: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]] },
  { k: 'sp-centre', n: 'Centre feature', cat: 'Spread', spread: 1, cells: [[0.25, 0, 0.5, 1], [0, 0, 0.25, 0.5], [0, 0.5, 0.25, 0.5], [0.75, 0, 0.25, 0.5], [0.75, 0.5, 0.25, 0.5]] },
  { k: 'sp-grid8', n: 'Eight across', cat: 'Spread', spread: 1, cells: grid(2, 4) }
];
const LMAP = Object.fromEntries(LAYOUTS.map((l) => [l.k, l]));
const MIX = ['l2r', '4g', 't3b', 'm5', '2h', 'strip', 'lsh', 't2b', 'm6', 'hero', '3c', 'l4'];
const TROLE = {
  title: { text: 'Your title here', size: 26, head: true, bold: true, align: 'center' },
  sub: { text: 'A short line about this page', size: 10, align: 'center', ls: 0.12, upper: true },
  caption: { text: 'Add a caption', size: 11, align: 'center', ital: true },
  hand: { text: 'Write a note here', size: 18, font: 'hand', align: 'center' },
  cover: { text: 'Our Voyage', size: 46, head: true, bold: true, align: 'center', shadow: true },
  coversub: { text: '2026', size: 13, align: 'center', ls: 0.35, upper: true, shadow: true },
  body: { text: 'Tell the story behind these photos: where you were, who was there and what made the day.', size: 10.5, align: 'left', lh: 1.45 },
  quote: { text: '“Collect moments, not things.”', size: 22, head: true, ital: true, align: 'center', lh: 1.25 }
};
const STYLES = [
  { k: 'clean', n: 'Clean white', bg: { t: 'color', c: '#ffffff' }, gap: 8, margin: 12, ink: '#1d1d1f', accent: '#1d1d1f', head: 'serif', body: 'sans' },
  { k: 'gallery', n: 'Gallery black', bg: { t: 'color', c: '#111111' }, gap: 10, margin: 16, ink: '#f5f5f5', accent: '#f5f5f5', head: 'didone', body: 'clean' },
  { k: 'polaroid', n: 'Instant prints', bg: { t: 'pattern', p: 'linen', c: '#efe9df', c2: '#d9d0bf' }, gap: 18, margin: 16, pad: 8, pol: true, padCol: '#ffffff', shadow: 0.6, ink: '#333333', accent: '#c0392b', head: 'hand', body: 'hand' },
  { k: 'kraft', n: 'Kraft scrapbook', bg: { t: 'pattern', p: 'linen', c: '#c9a77c', c2: '#a8875c' }, gap: 14, margin: 14, pad: 5, padCol: '#fffaf0', shadow: 0.5, ink: '#3b2a1a', accent: '#6b4a2b', head: 'script', body: 'type' },
  { k: 'voyage', n: 'Navy voyage', bg: { t: 'color', c: '#0b1f3a' }, gap: 8, margin: 14, stroke: 1.2, strokeCol: '#d4b46a', ink: '#e9d8a6', accent: '#d4b46a', head: 'copper', body: 'elegant' },
  { k: 'blush', n: 'Blush', bg: { t: 'color', c: '#f7e8e4' }, gap: 10, margin: 16, r: 8, ink: '#8a5a5a', accent: '#c98b8b', head: 'script', body: 'elegant' },
  { k: 'minimal', n: 'Minimal grey', bg: { t: 'color', c: '#ececec' }, gap: 4, margin: 8, ink: '#222222', accent: '#222222', head: 'clean', body: 'clean' },
  { k: 'vintage', n: 'Vintage', bg: { t: 'pattern', p: 'linen', c: '#efe4cf', c2: '#d8c7a6' }, gap: 12, margin: 16, pad: 6, padCol: '#fbf7ee', shadow: 0.4, flt: 'vintage', ink: '#5b4636', accent: '#8b6b4a', head: 'elegant', body: 'type' },
  { k: 'pop', n: 'Pop colour', bg: { t: 'color', c: '#ffd23f' }, gap: 10, margin: 14, stroke: 5, strokeCol: '#ffffff', r: 4, ink: '#1a1a1a', accent: '#ee4266', head: 'display', body: 'geo' },
  { k: 'ocean', n: 'Ocean', bg: { t: 'grad', c: '#1e3c72', c2: '#2a9d8f', a: 135 }, gap: 10, margin: 14, r: 6, ink: '#ffffff', accent: '#ffffff', head: 'geo', body: 'geo' },
  { k: 'sunset', n: 'Sunset', bg: { t: 'grad', c: '#ff9a8b', c2: '#ff6a88', a: 160 }, gap: 10, margin: 14, stroke: 4, strokeCol: '#ffffff', ink: '#ffffff', accent: '#ffffff', head: 'script', body: 'geo' },
  { k: 'mono', n: 'Monochrome', bg: { t: 'color', c: '#ffffff' }, gap: 6, margin: 12, flt: 'noir', ink: '#000000', accent: '#000000', head: 'display', body: 'clean' },
  { k: 'magazine', n: 'Magazine', bg: { t: 'color', c: '#fbfaf7' }, gap: 6, margin: 14, ink: '#111111', accent: '#c1121f', head: 'didone', body: 'garamond' },
  { k: 'soft', n: 'Soft rounded', bg: { t: 'color', c: '#f2f4f8' }, gap: 12, margin: 16, r: 14, shadow: 0.5, ink: '#2d3142', accent: '#4f5d75', head: 'geo', body: 'round' },
  { k: 'night', n: 'Night sky', bg: { t: 'grad', c: '#141e30', c2: '#243b55', a: 180 }, gap: 8, margin: 14, r: 4, ink: '#f1e3b5', accent: '#f1e3b5', head: 'elegant', body: 'clean' },
  { k: 'mint', n: 'Mint', bg: { t: 'pattern', p: 'dots', c: '#e8f6ef', c2: '#bfe5d1' }, gap: 10, margin: 16, r: 10, ink: '#1b5e4a', accent: '#1b5e4a', head: 'round', body: 'round' },
  { k: 'notebook', n: 'Notebook', bg: { t: 'pattern', p: 'grid', c: '#ffffff', c2: '#cfdcec' }, gap: 16, margin: 18, pad: 4, padCol: '#ffffff', shadow: 0.35, ink: '#24324a', accent: '#e76f51', head: 'hand', body: 'hand' },
  { k: 'linen', n: 'Linen', bg: { t: 'pattern', p: 'linen', c: '#f4f1ea', c2: '#ddd5c4' }, gap: 10, margin: 16, ink: '#4a4237', accent: '#9c8a6e', head: 'garamond', body: 'garamond' },
  { k: 'corporate', n: 'Corporate', bg: { t: 'color', c: '#ffffff' }, gap: 8, margin: 14, r: 4, ink: '#13233f', accent: '#1f6feb', head: 'clean', body: 'clean' },
  { k: 'royal', n: 'Royal', bg: { t: 'color', c: '#1e0f33' }, gap: 10, margin: 16, stroke: 1.2, strokeCol: '#d4af37', ink: '#f3e3b0', accent: '#d4af37', head: 'elegant', body: 'clean' },
  { k: 'festive', n: 'Festive', bg: { t: 'grad', c: '#7a0010', c2: '#c1121f', a: 160 }, gap: 10, margin: 16, stroke: 3, strokeCol: '#ffd166', ink: '#ffe8a3', accent: '#ffd166', head: 'script', body: 'elegant' },
  { k: 'kids', n: 'Playful', bg: { t: 'pattern', p: 'confetti', c: '#e8f7ff', c2: '#ff9ec0', s: 16 }, gap: 12, margin: 16, r: 14, stroke: 4, strokeCol: '#ffffff', ink: '#1b3a5c', accent: '#ff7a00', head: 'round', body: 'round' },
  { k: 'forest', n: 'Forest', bg: { t: 'color', c: '#f3f1e7' }, gap: 10, margin: 16, r: 6, ink: '#2f4a3a', accent: '#5a8f5a', head: 'garamond', body: 'sans' },
  { k: 'onam', n: 'Kasavu', bg: { t: 'color', c: '#fffbea' }, gap: 10, margin: 16, stroke: 2, strokeCol: '#d4a017', ink: '#5b3a00', accent: '#c58a00', head: 'elegant', body: 'sans' }
];
const SMAP = Object.fromEntries(STYLES.map((s) => [s.k, s]));
const FILTERS = [['none', 'Original', 'none'], ['vivid', 'Vivid', 'saturate(1.45) contrast(1.08)'], ['warm', 'Warm', 'sepia(.22) saturate(1.25) hue-rotate(-6deg)'], ['cool', 'Cool', 'saturate(1.05) hue-rotate(10deg) brightness(1.03)'], ['bright', 'Bright', 'brightness(1.15) saturate(1.05)'], ['fade', 'Faded', 'contrast(.82) brightness(1.1) saturate(.75)'], ['vintage', 'Vintage', 'sepia(.45) contrast(.92) brightness(1.04) saturate(.85)'], ['drama', 'Dramatic', 'contrast(1.35) saturate(1.15) brightness(.95)'], ['bw', 'Black and white', 'grayscale(1)'], ['noir', 'Noir', 'grayscale(1) contrast(1.4) brightness(.95)'], ['sepia', 'Sepia', 'sepia(.85)'], ['soft', 'Soft', 'brightness(1.06) contrast(.88) saturate(.95)']];
const FMAP = Object.fromEntries(FILTERS.map((f) => [f[0], f[2]]));
const GFX = [
  ['line', 'Line', 'Lines', 'M0 50H100', 1, 8], ['dline', 'Double line', 'Lines', 'M0 42H100M0 58H100', 1, 8], ['swash', 'Flourish', 'Lines', 'M0 50C20 26 35 26 50 50C65 74 80 74 100 50', 1, 4],
  ['wave', 'Wave', 'Lines', 'M0 50Q12.5 25 25 50T50 50T75 50T100 50', 1, 4], ['scrib', 'Underline', 'Lines', 'M2 60C20 40 30 72 50 52S80 40 98 56', 1, 4], ['dots', 'Dot row', 'Lines', [0, 1, 2, 3, 4, 5, 6].map((i) => circD(7 + i * 14.3, 50, 4)).join(''), 0, 7],
  ['brackets', 'Brackets', 'Lines', 'M22 2H2V98H22M78 2H98V98H78', 1, 1.6], ['corner', 'Corner', 'Lines', 'M2 98V2H98M2 22C14 22 22 14 22 2', 1, 1], ['border', 'Border', 'Lines', 'M2 2H98V98H2Z', 1, 1.4],
  ['heart', 'Heart', 'Shapes', SHAPES.heart[1]], ['star', 'Star', 'Shapes', SHAPES.star[1]], ['spark', 'Sparkle', 'Shapes', 'M50 0C54 36 64 46 100 50C64 54 54 64 50 100C46 64 36 54 0 50C36 46 46 36 50 0Z'],
  ['block', 'Block', 'Shapes', 'M0 0H100V100H0Z', 0, 3], ['circle', 'Circle', 'Shapes', circD(50, 50, 48)], ['ringg', 'Ring', 'Shapes', circD(50, 50, 46), 1], ['square', 'Square', 'Shapes', 'M4 4H96V96H4Z'], ['tri', 'Triangle', 'Shapes', SHAPES.tri[1]],
  ['burst', 'Burst', 'Shapes', starD(16, 38)], ['seal', 'Seal', 'Shapes', starD(24, 44)], ['blob', 'Blob', 'Shapes', SHAPES.blob[1]], ['hexg', 'Hexagon', 'Shapes', SHAPES.hex[1]],
  ['ribbon', 'Ribbon', 'Labels', 'M0 22H100L88 50L100 78H0L12 50Z', 0, 2.6], ['tag', 'Tag', 'Labels', 'M0 20H74L100 50L74 80H0Z', 0, 2.2], ['pillg', 'Label', 'Labels', 'M20 20H80A30 30 0 0 1 80 80H20A30 30 0 0 1 20 20Z', 0, 2.4],
  ['bubble', 'Speech', 'Labels', 'M10 8H90Q98 8 98 16V60Q98 68 90 68H44L24 92L30 68H10Q2 68 2 60V16Q2 8 10 8Z'], ['quoteg', 'Quote marks', 'Labels', 'M8 62C8 32 22 16 42 10L44 18C33 23 27 32 27 44H42V86H8ZM56 62C56 32 70 16 90 10L92 18C81 23 75 32 75 44H90V86H56Z'],
  ['tape', 'Tape', 'Scrapbook', 'M0 0H100L96 25L100 50L96 75L100 100H0L4 75L0 50L4 25Z', 0, 3.2, 0.55], ['tape2', 'Tape corner', 'Scrapbook', 'M0 0H100L96 33L100 66L96 100H0L4 66L0 33Z', 0, 2.2, 0.55], ['pin', 'Pin', 'Scrapbook', circD(50, 50, 30) + circD(42, 42, 8)],
  ['clip', 'Paper clip', 'Scrapbook', 'M60 20V70A12 12 0 0 1 36 70V14A8 8 0 0 1 52 14V66A4 4 0 0 1 44 66V26', 1, 0.5], ['arrow', 'Arrow', 'Scrapbook', 'M0 40H68V18L100 50L68 82V60H0Z', 0, 1.8], ['curve', 'Curved arrow', 'Scrapbook', 'M10 82C20 32 58 20 86 30M74 16L88 31L72 42', 1, 1.2],
  ['anchor', 'Anchor', 'Travel', 'M50 18V92M34 32H66M14 64C14 84 34 92 50 92C66 92 86 84 86 64M8 70L14 60L22 68M92 70L86 60L78 68' + circD(50, 11, 7), 1], ['compass', 'Compass', 'Travel', starD(8, 14) + circD(50, 50, 6)], ['plane', 'Plane', 'Travel', 'M50 4C54 4 56 9 56 17V40L96 60V68L56 56V80L68 88V95L50 90L32 95V88L44 80V56L4 68V60L44 40V17C44 9 46 4 50 4Z'],
  ['mappin', 'Map pin', 'Travel', 'M50 98C30 70 15 56 15 35A35 35 0 0 1 85 35C85 56 70 70 50 98Z' + circD(50, 35, 12), 0, 0.8, 1, 1], ['camera', 'Camera', 'Travel', 'M8 30H30L38 18H62L70 30H92V84H8Z' + circD(50, 56, 16), 1, 1.2], ['sun', 'Sun', 'Travel', circD(50, 50, 18) + 'M50 2V20M50 80V98M2 50H20M80 50H98M16 16L29 29M71 71L84 84M84 16L71 29M29 71L16 84', 1],
  ['leaf', 'Leaf', 'Nature', SHAPES.leaf[1]], ['flower', 'Flower', 'Nature', [0, 1, 2, 3, 4, 5].map((i) => circD(50 + 26 * Math.cos(i * Math.PI / 3), 50 + 26 * Math.sin(i * Math.PI / 3), 20)).join('') + circD(50, 50, 14)], ['moon', 'Moon', 'Nature', 'M62 4A46 46 0 1 0 96 70A38 38 0 1 1 62 4Z'],
  ['cloudg', 'Cloud', 'Nature', SHAPES.cloud[1], 0, 1.5], ['mount', 'Mountains', 'Nature', 'M0 90L32 34L50 60L66 40L100 90Z', 0, 1.6], ['drop', 'Drop', 'Nature', 'M50 4C50 4 16 46 16 66A34 34 0 0 0 84 66C84 46 50 4 50 4Z', 0, 0.8]
].map(([k, n, cat, d, s, ar, op, ev]) => ({ k, n, cat, d, s: !!s, ar: ar || 1, op: op || 1, ev: !!ev }));
const GMAP = Object.fromEntries(GFX.map((g) => [g.k, g]));
/* ---------- Generated artwork: botanicals, ornaments, frames, abstract, hand-drawn, maritime ---------- */
const GX = (() => {
  const f = (v) => (Math.round(v * 100) / 100).toString();
  const P = (p) => f(p[0]) + ' ' + f(p[1]);
  const poly = (pts, close = true) => 'M' + pts.map(P).join('L') + (close ? 'Z' : '');
  const qpt = (S, C, E, t) => { const u = 1 - t; return [u * u * S[0] + 2 * u * t * C[0] + t * t * E[0], u * u * S[1] + 2 * u * t * C[1] + t * t * E[1]]; };
  const qtan = (S, C, E, t) => { const x = 2 * (1 - t) * (C[0] - S[0]) + 2 * t * (E[0] - C[0]), y = 2 * (1 - t) * (C[1] - S[1]) + 2 * t * (E[1] - C[1]); const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const leaf = (b, len, wid, ang, bend = 0) => { const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx; const at = (t, o) => [b[0] + dx * len * t + nx * o, b[1] + dy * len * t + ny * o]; const k = bend * len; return `M${P(b)}C${P(at(0.28, wid + k * 0.25))} ${P(at(0.72, wid * 0.72 + k * 0.7))} ${P(at(1, k))}C${P(at(0.72, -wid * 0.72 + k * 0.7))} ${P(at(0.28, -wid + k * 0.25))} ${P(b)}Z`; };
  const leafLine = (b, len, wid, ang, bend = 0) => leaf(b, len, wid, ang, bend) + `M${P(b)}L${P([b[0] + Math.cos(ang) * len * 0.85, b[1] + Math.sin(ang) * len * 0.85])}`;
  const stem = (S, C, E, w0, w1 = 0.3, n = 28) => { const L = [], R = []; for (let i = 0; i <= n; i++) { const t = i / n; const p = qpt(S, C, E, t), tg = qtan(S, C, E, t); const w = (w0 + (w1 - w0) * t) / 2; L.push([p[0] - tg[1] * w, p[1] + tg[0] * w]); R.push([p[0] + tg[1] * w, p[1] - tg[0] * w]); } return poly(L.concat(R.reverse())); };
  const sprig = (S, C, E, n, len, wid, o = {}) => { let d = stem(S, C, E, o.sw ?? 1.4, 0.35); const spread = o.spread ?? 0.75; for (let i = 0; i < n; i++) { const t = (o.t0 ?? 0.14) + (1 - (o.t0 ?? 0.14) - 0.06) * i / Math.max(1, n - 1); const p = qpt(S, C, E, t), tg = qtan(S, C, E, t); const a = Math.atan2(tg[1], tg[0]); const L = len * (1 - (o.taper ?? 0.45) * t); const sides = o.pairs ? [1, -1] : [i % 2 ? 1 : -1]; for (const sd of sides) d += (o.shape || leaf)(p, L, wid * (1 - (o.taper ?? 0.45) * t * 0.6), a + sd * spread, sd * (o.bend ?? 0.08)); } const tg = qtan(S, C, E, 1); d += (o.shape || leaf)(E, len * 0.55, wid * 0.6, Math.atan2(tg[1], tg[0]), 0); return d; };
  const arcPts = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a), a]; });
  const arcStem = (cx, cy, r, a0, a1, w) => { const A = arcPts(cx, cy, r - w / 2, a0, a1, 40), B = arcPts(cx, cy, r + w / 2, a0, a1, 40); return poly(A.concat(B.reverse())); };
  const wreathSide = (cx, cy, r, a0, a1, n, len, wid, shape = leaf) => { let d = arcStem(cx, cy, r, a0, a1, 1.2); const dir = Math.sign(a1 - a0); arcPts(cx, cy, r, a0, a1, n).slice(1).forEach(([x, y, a], i) => { const tg = a + dir * Math.PI / 2; const sz = 1 - 0.35 * (i / n); d += shape([x, y], len * sz, wid * sz, tg - 0.62 * dir, 0.06) + shape([x, y], len * sz, wid * sz, tg + 0.62 * dir, -0.06); }); return d; };
  const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  const ell = (cx, cy, rx, ry, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot); const p1 = [cx - rx * c, cy - rx * s], p2 = [cx + rx * c, cy + rx * s]; const deg = rot * 180 / Math.PI; return `M${P(p1)}A${f(rx)} ${f(ry)} ${f(deg)} 1 0 ${P(p2)}A${f(rx)} ${f(ry)} ${f(deg)} 1 0 ${P(p1)}Z`; };
  let seed = 11; const rnd = (s) => { if (s != null) seed = s; seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const blob = (cx, cy, r, n, j, s) => { rnd(s); const pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const rr = r * (1 - j / 2 + j * rnd()); return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; }); let d = `M${P(pts[0])}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]; d += `C${P(c1)} ${P(c2)} ${P(p2)}`; } return d + 'Z'; };
  const smooth = (pts, close) => { const n = pts.length; let d = `M${P(pts[0])}`; const g = (i) => pts[close ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]; for (let i = 0; i < (close ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`; } return d + (close ? 'Z' : ''); };
  const spiral = (cx, cy, r0, r1, turns, a0 = 0, dir = 1, n = 60) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; const a = a0 + dir * t * turns * Math.PI * 2; const r = r0 + (r1 - r0) * t; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const mirror = (pts) => pts.map(([x, y]) => [100 - x, y]);
  const scroll = (side) => { const s = side; const curl = spiral(50 + s * 38, 44, 7, 0.6, 1.15, s > 0 ? Math.PI / 2 : Math.PI / 2, s > 0 ? -1 : 1, 50); const base = [[50 + s * 6, 50], [50 + s * 14, 54], [50 + s * 22, 55], [50 + s * 30, 53], [50 + s * 36, 50.5]]; return smooth(base.concat(curl.map((p, i) => p)), false); };
  const petals = (cx, cy, r0, len, wid, n, a0 = 0, line = false) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * Math.PI * 2; return (line ? leafLine : leaf)([cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)], len, wid, a); }).join('');
  const rays = (cx, cy, r0, r1, n, w, a0 = Math.PI, a1 = 2 * Math.PI) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * (i + 0.5) / n; const da = w / 2; return poly([[cx + r0 * Math.cos(a - da), cy + r0 * Math.sin(a - da)], [cx + r1 * Math.cos(a - da * 0.4), cy + r1 * Math.sin(a - da * 0.4)], [cx + r1 * Math.cos(a + da * 0.4), cy + r1 * Math.sin(a + da * 0.4)], [cx + r0 * Math.cos(a + da), cy + r0 * Math.sin(a + da)]]); }).join('');
  const wave = (y, amp, per, x0 = 0, x1 = 100) => { let d = `M${f(x0)} ${f(y)}`; for (let x = x0; x < x1; x += per) d += `Q${f(x + per / 4)} ${f(y - amp)} ${f(x + per / 2)} ${f(y)}T${f(x + per)} ${f(y)}`; return d; };
  const star5 = (cx, cy, R, r, rot = -Math.PI / 2) => poly(Array.from({ length: 10 }, (_, i) => { const a = rot + i * Math.PI / 5; const rr = i % 2 ? r : R; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; }));
  const spark = (cx, cy, r) => `M${f(cx)} ${f(cy - r)}C${f(cx + r * 0.08)} ${f(cy - r * 0.28)} ${f(cx + r * 0.28)} ${f(cy - r * 0.08)} ${f(cx + r)} ${f(cy)}C${f(cx + r * 0.28)} ${f(cy + r * 0.08)} ${f(cx + r * 0.08)} ${f(cy + r * 0.28)} ${f(cx)} ${f(cy + r)}C${f(cx - r * 0.08)} ${f(cy + r * 0.28)} ${f(cx - r * 0.28)} ${f(cy + r * 0.08)} ${f(cx - r)} ${f(cy)}C${f(cx - r * 0.28)} ${f(cy - r * 0.08)} ${f(cx - r * 0.08)} ${f(cy - r * 0.28)} ${f(cx)} ${f(cy - r)}Z`;
  const out = [];
  const add = (k, n, cat, d, s = 0, ar = 1, op, ev) => out.push([k, n, cat, d, s, ar, op, ev]);
  /* Botanical */
  add('b-sprig', 'Leafy sprig', 'Botanical', sprig([50, 96], [44, 50], [52, 6], 9, 22, 6.5, { spread: 0.8 }), 0, 0.55);
  add('b-olive', 'Olive branch', 'Botanical', sprig([4, 70], [50, 40], [96, 46], 10, 20, 4.2, { spread: 0.55, bend: 0.12 }), 0, 2.2);
  add('b-fern', 'Fern', 'Botanical', sprig([50, 98], [56, 50], [48, 4], 15, 30, 3.4, { pairs: true, spread: 1.15, taper: 0.75, t0: 0.08 }), 0, 0.6);
  add('b-euca', 'Eucalyptus', 'Botanical', (() => { const S = [48, 98], C = [62, 48], E = [44, 4]; let d = stem(S, C, E, 1.3); for (let i = 0; i < 9; i++) { const t = 0.12 + 0.8 * i / 8; const p = qpt(S, C, E, t), tg = qtan(S, C, E, t); const sd = i % 2 ? 1 : -1; const r = 8.5 * (1 - 0.45 * t); d += ell(p[0] - tg[1] * sd * r * 1.05, p[1] + tg[0] * sd * r * 1.05, r, r * 0.82, Math.atan2(tg[1], tg[0])); } return d; })(), 0, 0.6, 1, 0);
  add('b-laurel', 'Laurel wreath', 'Botanical', wreathSide(50, 50, 40, Math.PI * 0.6, Math.PI * 1.45, 11, 12, 3.6) + wreathSide(50, 50, 40, Math.PI * 0.4, -Math.PI * 0.45, 11, 12, 3.6), 0, 1);
  add('b-wreath', 'Leaf wreath', 'Botanical', wreathSide(50, 50, 38, Math.PI * 0.55, Math.PI * 2.45, 30, 10, 3.2), 0, 1);
  add('b-crescent', 'Crescent wreath', 'Botanical', wreathSide(50, 50, 40, Math.PI * 0.3, Math.PI * 1.25, 16, 13, 4.2) + petals(30, 84, 0, 0, 0, 0) + circ(22, 77, 4) + circ(28, 85, 3), 0, 1);
  add('b-corner', 'Botanical corner', 'Botanical', sprig([2, 98], [10, 30], [70, 6], 8, 20, 5.5, { spread: 0.7 }) + sprig([2, 98], [40, 80], [96, 72], 6, 16, 4.5, { spread: 0.7 }), 0, 1);
  add('b-ginkgo', 'Ginkgo leaf', 'Botanical', 'M50 96C49 80 49 66 50 56C38 54 14 46 6 22C20 10 36 6 46 8L50 26L54 8C64 6 80 10 94 22C86 46 62 54 50 56' + stem([50, 98], [50, 76], [50, 56], 1.6, 1), 0, 1);
  add('b-monstera', 'Tropical leaf', 'Botanical', (() => { let d = blob(50, 46, 40, 14, 0.12, 5); for (let i = 0; i < 4; i++) { d += ell(30 + i * 2, 24 + i * 14, 9 - i, 2.4, 0.5); d += ell(70 - i * 2, 24 + i * 14, 9 - i, 2.4, -0.5); } return d + stem([50, 99], [50, 80], [50, 46], 2.2, 1); })(), 0, 0.95, 1, 1);
  add('b-palm', 'Palm leaf', 'Botanical', sprig([20, 98], [30, 40], [90, 10], 22, 30, 2.6, { pairs: true, spread: 0.55, taper: 0.6, t0: 0.12 }), 0, 1);
  add('b-wildflower', 'Wild flowers', 'Botanical', (() => { let d = stem([50, 98], [46, 60], [40, 22], 1.3) + stem([50, 98], [56, 66], [66, 34], 1.2) + stem([50, 98], [50, 70], [52, 44], 1.1); d += petals(40, 18, 2, 8, 3, 7) + circ(40, 18, 2) + petals(66, 30, 2, 7, 2.6, 6, 0.3) + leaf([52, 40], 9, 3, -Math.PI / 2) + leaf([52, 40], 9, 3, -Math.PI / 2 - 0.6) + leaf([52, 40], 9, 3, -Math.PI / 2 + 0.6) + leaf([47, 72], 14, 4, Math.PI * 1.15) + leaf([54, 76], 14, 4, -0.2); return d; })(), 0, 0.75);
  /* Flowers */
  add('fl-daisy', 'Daisy', 'Flowers', petals(50, 50, 13, 34, 6.5, 14) + circ(50, 50, 10), 0, 1);
  add('fl-blossom', 'Blossom', 'Flowers', petals(50, 50, 6, 40, 16, 5, -Math.PI / 2) + circ(50, 50, 5), 0, 1);
  add('fl-rose', 'Line rose', 'Flowers', smooth(spiral(50, 50, 1.5, 9, 1.6, 0, 1, 40), false) + [[16, 5, 0.3], [27, 6, 0.9], [38, 7, 0.2], [47, 8, 0.7]].map(([r, n, a0]) => { let d = ''; for (let i = 0; i < n; i++) { const a = a0 + i * 2 * Math.PI / n, b = a + 2 * Math.PI / n * 1.08, m = (a + b) / 2; d += `M${P([50 + r * 0.8 * Math.cos(a), 50 + r * 0.8 * Math.sin(a)])}Q${P([50 + r * 1.22 * Math.cos(m), 50 + r * 1.22 * Math.sin(m)])} ${P([50 + r * 0.8 * Math.cos(b), 50 + r * 0.8 * Math.sin(b)])}`; } return d; }).join(''), 1, 1);
  add('fl-lotus', 'Lotus', 'Flowers', [[-1.57, 44, 13], [-2.15, 38, 12], [-1, 38, 12], [-2.7, 30, 10], [-0.45, 30, 10]].map(([a, l, w]) => leafLine([50, 82], l, w, a)).join('') + 'M8 84H92', 1, 1.4);
  add('fl-tulip', 'Tulip', 'Flowers', 'M50 52C36 52 28 40 28 24L36 30L42 14L50 26L58 14L64 30L72 24C72 40 64 52 50 52Z' + stem([50, 98], [50, 76], [50, 52], 2.2, 1.6) + leaf([50, 92], 30, 8, -2.3, 0.1) + leaf([50, 86], 24, 7, -0.85, -0.1), 0, 0.6);
  add('fl-sunflower', 'Sunflower', 'Flowers', petals(50, 50, 18, 30, 7, 20) + circD(50, 50, 16), 0, 1);
  add('fl-cluster', 'Flower cluster', 'Flowers', [[30, 40, 14], [62, 30, 12], [56, 62, 15], [80, 58, 9], [24, 70, 9]].map(([x, y, r]) => petals(x, y, r * 0.2, r * 0.85, r * 0.42, 5, x) + circ(x, y, r * 0.22)).join('') + leaf([40, 52], 16, 5, 2.4) + leaf([70, 46], 14, 4.5, -0.6), 0, 1.3);
  /* Ornaments */
  add('or-divider', 'Scroll divider', 'Ornaments', scroll(-1) + scroll(1) + 'M44 50L50 44L56 50L50 56Z', 1, 4);
  add('or-divider2', 'Leaf divider', 'Ornaments', 'M4 50H38M62 50H96' + leafLine([48, 50], 14, 4, Math.PI) + leafLine([52, 50], 14, 4, 0) + circ(50, 50, 2.5), 1, 5);
  add('or-dots', 'Dot divider', 'Ornaments', [10, 26, 42, 50, 58, 74, 90].map((x, i) => circ(x, 50, [1.5, 2.5, 3.5, 6, 3.5, 2.5, 1.5][i])).join(''), 0, 6);
  add('or-flourish', 'Corner flourish', 'Ornaments', smooth([[4, 96], [6, 60], [16, 32], [36, 16], [62, 8], [96, 4]], false) + smooth(spiral(30, 30, 10, 1, 1.1, Math.PI * 0.75, 1, 40), false) + smooth([[12, 54], [22, 44], [30, 46], [30, 54], [22, 56]], false) + smooth([[54, 12], [44, 22], [46, 30], [54, 30], [56, 22]], false), 1, 1);
  add('or-fan', 'Art deco fan', 'Ornaments', rays(50, 96, 10, 90, 13, 0.13) + 'M50 96m-8 0a8 8 0 0 1 16 0Z', 0, 1.6);
  add('or-deco', 'Art deco corner', 'Ornaments', 'M4 96V4H96M12 96V12H96M20 96V30A10 10 0 0 1 30 20H96M4 4L20 20', 1, 1);
  add('or-mandala', 'Mandala', 'Ornaments', petals(50, 50, 6, 16, 5, 8, 0, true) + petals(50, 50, 20, 18, 6, 12, Math.PI / 12, true) + circ(50, 50, 5) + circ(50, 50, 39) + circ(50, 50, 44) + Array.from({ length: 24 }, (_, i) => circ(50 + 47 * Math.cos(i * Math.PI / 12), 50 + 47 * Math.sin(i * Math.PI / 12), 1)).join(''), 1, 1);
  add('or-rosette', 'Rosette', 'Ornaments', petals(50, 50, 0, 46, 14, 12, 0, true) + circ(50, 50, 10) + circ(50, 50, 22), 1, 1);
  add('or-sunburst', 'Sunburst', 'Ornaments', rays(50, 50, 16, 49, 24, 0.12, 0, Math.PI * 2) + circ(50, 50, 12), 0, 1);
  add('or-monogram', 'Monogram ring', 'Ornaments', circ(50, 50, 34) + circ(50, 50, 30) + wreathSide(50, 50, 42, Math.PI * 0.62, Math.PI * 1.32, 7, 7, 2.2) + wreathSide(50, 50, 42, Math.PI * 0.38, -Math.PI * 0.32, 7, 7, 2.2), 1, 1);
  /* Frames */
  add('fr-arch', 'Arch frame', 'Frames', 'M8 98V46A42 42 0 0 1 92 46V98ZM15 98V47A35 35 0 0 1 85 47V98', 1, 0.75);
  add('fr-notch', 'Notched frame', 'Frames', 'M12 2H88L98 12V88L88 98H12L2 88V12ZM10 8H90L92 10V90L90 92H10L8 90V10Z', 1, 0.75);
  add('fr-scallop', 'Classic frame', 'Frames', 'M12 2H88A10 10 0 0 0 98 12V88A10 10 0 0 0 88 98H12A10 10 0 0 0 2 88V12A10 10 0 0 0 12 2ZM8 8H92V92H8Z', 1, 0.75);
  add('fr-deco', 'Deco frame', 'Frames', 'M2 14H8V8H14V2H86V8H92V14H98V86H92V92H86V98H14V92H8V86H2ZM12 12H88V88H12Z', 1, 0.75);
  add('fr-circle', 'Beaded circle', 'Frames', circ(50, 50, 46) + circ(50, 50, 38) + Array.from({ length: 36 }, (_, i) => circ(50 + 42 * Math.cos(i * Math.PI / 18), 50 + 42 * Math.sin(i * Math.PI / 18), 0.9)).join(''), 1, 1);
  add('fr-oval', 'Oval frame', 'Frames', ell(50, 50, 46, 48) + ell(50, 50, 40, 42), 1, 0.75);
  add('fr-bracket', 'Ticket frame', 'Frames', 'M10 2H90A8 8 0 0 0 98 10V40A10 10 0 0 0 98 60V90A8 8 0 0 0 90 98H10A8 8 0 0 0 2 90V60A10 10 0 0 0 2 40V10A8 8 0 0 0 10 2Z', 1, 1.6);
  /* Abstract */
  add('ab-blob1', 'Organic shape', 'Abstract', blob(50, 50, 45, 7, 0.35, 3), 0, 1);
  add('ab-blob2', 'Pebble', 'Abstract', blob(50, 50, 46, 6, 0.25, 21), 0, 1.3);
  add('ab-blob3', 'Splash', 'Abstract', blob(50, 50, 44, 11, 0.45, 9), 0, 1);
  add('ab-arch', 'Arch', 'Abstract', 'M10 98V50A40 40 0 0 1 90 50V98Z', 0, 0.8);
  add('ab-half', 'Half circle', 'Abstract', 'M2 98A48 48 0 0 1 98 98Z', 0, 2);
  add('ab-quarter', 'Quarter circle', 'Abstract', 'M2 2H98A96 96 0 0 1 2 98Z', 0, 1);
  add('ab-rainbow', 'Boho rainbow', 'Abstract', [44, 34, 24].map((r) => `M${50 - r} 92A${r} ${r} 0 0 1 ${50 + r} 92`).join(''), 1, 1.6);
  add('ab-sun', 'Boho sun', 'Abstract', 'M28 80A22 22 0 0 1 72 80Z' + rays(50, 80, 28, 46, 9, 0.16) + 'M6 86H94', 0, 1.4);
  add('ab-brush', 'Brush stroke', 'Abstract', (() => { rnd(4); const top = [], bot = []; for (let i = 0; i <= 20; i++) { const x = 2 + i * 4.8; top.push([x, 30 + rnd() * 6 + (i < 2 || i > 18 ? 8 : 0)]); bot.push([x, 70 - rnd() * 6 - (i < 2 || i > 18 ? 8 : 0)]); } return poly(top.concat(bot.reverse())); })(), 0, 4, 0.9);
  add('ab-terrazzo', 'Terrazzo', 'Abstract', Array.from({ length: 22 }, (_, i) => { rnd(100 + i); const x = 6 + rnd() * 88, y = 6 + rnd() * 88, r = 2 + rnd() * 4; return blob(x, y, r, 5, 0.6, 200 + i); }).join(''), 0, 1);
  add('ab-confetti', 'Confetti', 'Abstract', Array.from({ length: 26 }, (_, i) => { rnd(300 + i); const x = 4 + rnd() * 92, y = 4 + rnd() * 92, s = 1.5 + rnd() * 2.5; return i % 3 === 0 ? circ(x, y, s) : i % 3 === 1 ? poly([[x - s, y - s * 0.4], [x + s, y - s * 0.4 + 1], [x + s, y + s * 0.4 + 1], [x - s, y + s * 0.4]]) : star5(x, y, s * 1.3, s * 0.55); }).join(''), 0, 1);
  add('ab-halftone', 'Halftone', 'Abstract', Array.from({ length: 100 }, (_, i) => { const c = i % 10, r = Math.floor(i / 10); const rr = 4.2 * (1 - (c + r) / 20); return rr > 0.4 ? circ(5 + c * 10, 5 + r * 10, rr) : ''; }).join(''), 0, 1);
  add('ab-waves', 'Wave lines', 'Abstract', wave(30, 10, 25) + wave(50, 10, 25) + wave(70, 10, 25), 1, 2);
  add('ab-squiggle', 'Squiggle', 'Abstract', smooth(Array.from({ length: 11 }, (_, i) => [4 + i * 9.2, i % 2 ? 30 : 70]), false), 1, 4);
  add('ab-grid', 'Dot grid', 'Abstract', Array.from({ length: 36 }, (_, i) => circ(9 + (i % 6) * 16.4, 9 + Math.floor(i / 6) * 16.4, 2.2)).join(''), 0, 1);
  add('ab-stripes', 'Diagonal stripes', 'Abstract', Array.from({ length: 9 }, (_, i) => poly([[i * 12 - 4, 100], [i * 12 + 4, 100], [i * 12 + 56, 0], [i * 12 + 48, 0]])).join(''), 0, 1);
  add('ab-circles', 'Circle trio', 'Abstract', circ(32, 50, 28) + 'M60 50m-28 0a28 28 0 1 0 56 0a28 28 0 1 0 -56 0', 1, 1.6);
  /* Hand-drawn */
  add('hd-circle', 'Hand circle', 'Hand-drawn', smooth([[50, 8], [86, 16], [96, 50], [80, 86], [44, 94], [10, 76], [6, 40], [24, 14], [56, 6], [80, 12]], false), 1, 1.6);
  add('hd-underline', 'Swoosh', 'Hand-drawn', smooth([[2, 70], [30, 52], [60, 44], [98, 40]], false) + smooth([[14, 76], [44, 62], [80, 56]], false), 1, 5);
  add('hd-arrow', 'Loop arrow', 'Hand-drawn', smooth([[4, 80], [24, 70], [36, 50], [30, 34], [18, 38], [20, 54], [40, 62], [66, 54], [90, 30]], false) + 'M78 28L91 29L88 42', 1, 1.4);
  add('hd-heart', 'Doodle heart', 'Hand-drawn', 'M50 88C30 72 8 56 10 34C12 16 34 12 46 30C50 36 50 36 52 30C62 10 88 14 90 34C92 56 70 72 50 88C49 86 48 84 47 83', 1, 1);
  add('hd-star', 'Doodle star', 'Hand-drawn', 'M50 6L61 38L95 38L68 58L78 92L50 72L22 92L32 58L5 38L39 38L50 7', 1, 1);
  add('hd-spark', 'Doodle sparkles', 'Hand-drawn', spark(36, 56, 30) + spark(76, 22, 14) + spark(80, 78, 8), 1, 1);
  add('hd-crown', 'Doodle crown', 'Hand-drawn', 'M10 78L6 26L30 52L50 16L70 52L94 26L90 78Z' + 'M14 90H86' + circ(6, 24, 3) + circ(50, 13, 3) + circ(94, 24, 3), 1, 1.3);
  add('hd-highlight', 'Marker highlight', 'Hand-drawn', 'M3 34C30 28 70 30 97 32L96 70C68 72 32 70 4 74Z', 0, 4.5, 0.55);
  add('hd-burst', 'Doodle burst', 'Hand-drawn', Array.from({ length: 9 }, (_, i) => { const a = Math.PI + i * Math.PI / 8; return `M${f(50 + 22 * Math.cos(a))} ${f(90 + 22 * Math.sin(a))}L${f(50 + 46 * Math.cos(a))} ${f(90 + 46 * Math.sin(a))}`; }).join(''), 1, 1.8);
  /* Maritime */
  add('mr-ship', 'Open hatch bulk carrier', 'Maritime', 'M1 58H99L94 78Q50 82 9 78Z' + 'M78 58V36H96V58ZM76 36V33H98V36ZM88 33V24H93V33Z' + 'M8 58V53H22V58ZM25 58V53H39V58ZM42 58V53H56V58ZM59 58V53H73V58Z' + 'M14 53V34H36V53H33V38H17V53ZM44 53V34H66V53H63V38H47V53Z' + 'M2 58L1 52H5V58Z', 0, 3.4);
  add('mr-light', 'Lighthouse', 'Maritime', 'M40 30H60L66 94H34Z' + 'M38 18H62V30H38ZM44 8H56V18H44ZM50 2L58 8H42Z' + 'M4 94H96V98H4Z' + 'M64 22L96 10V34ZM36 22L4 10V34Z', 0, 0.75, 1, 0);
  add('mr-wheel', 'Ship wheel', 'Maritime', circ(50, 50, 32) + circ(50, 50, 24) + circ(50, 50, 8) + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `M${f(50 + 8 * Math.cos(a))} ${f(50 + 8 * Math.sin(a))}L${f(50 + 42 * Math.cos(a))} ${f(50 + 42 * Math.sin(a))}` + ell(50 + 45 * Math.cos(a), 50 + 45 * Math.sin(a), 4, 2.4, a); }).join(''), 1, 1);
  add('mr-rope', 'Rope ring', 'Maritime', Array.from({ length: 30 }, (_, i) => { const a = i * Math.PI / 15; const b = a + Math.PI / 15; return `M${f(50 + 38 * Math.cos(a))} ${f(50 + 38 * Math.sin(a))}Q${f(50 + 48 * Math.cos((a + b) / 2))} ${f(50 + 48 * Math.sin((a + b) / 2))} ${f(50 + 44 * Math.cos(b))} ${f(50 + 44 * Math.sin(b))}`; }).join('') + circ(50, 50, 36) + circ(50, 50, 46), 1, 1);
  add('mr-gulls', 'Seagulls', 'Maritime', 'M10 50Q20 38 30 50Q40 38 50 50M56 30Q63 22 70 30Q77 22 84 30M64 66Q69 60 74 66Q79 60 84 66', 1, 2);
  add('mr-waves', 'Sea waves', 'Maritime', 'M0 70C12 56 22 56 30 66C36 54 30 42 18 44C30 30 50 36 52 54C54 64 66 66 72 58C78 48 88 50 100 58V100H0Z', 0, 2);
  add('mr-fish', 'Fish', 'Maritime', 'M8 50C24 26 62 24 80 50C62 76 24 74 8 50ZM78 50L98 32V68Z' + circ(26, 46, 3), 0, 1.8, 1, 1);
  add('mr-shell', 'Shell', 'Maritime', 'M50 92L10 40C20 14 80 14 90 40Z' + [20, 32, 44, 56, 68, 80].map((x) => `M50 92L${x} ${x < 50 ? 26 - (50 - x) * 0.1 : 26 - (x - 50) * 0.1}`).join(''), 1, 1.1);
  add('mr-star', 'Starfish', 'Maritime', smooth(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 17 : 46; return [50 + r * Math.cos(a), 52 + r * Math.sin(a)]; }), true), 0, 1);
  add('mr-knot', 'Rope knot', 'Maritime', smooth([[2, 50], [26, 50], [40, 30], [56, 30], [60, 50], [44, 66], [34, 50], [50, 36], [66, 50], [74, 50], [98, 50]], false), 1, 3);
  /* Badges */
  add('bd-rosette', 'Award rosette', 'Badges', starD(20, 40, 46).replace(/(\d+(\.\d+)?) (\d+(\.\d+)?)/g, (m, a, _, b) => `${(+a * 0.7 + 15).toFixed(2)} ${(+b * 0.7 + 1).toFixed(2)}`) + 'M34 62L24 98L38 90L46 98L50 66ZM66 62L76 98L62 90L54 98L50 66Z', 0, 0.75);
  add('bd-banner', 'Folded banner', 'Badges', 'M14 24H86V64H14ZM14 34H2L8 46L2 58H14ZM86 34H98L92 46L98 58H86Z', 0, 3);
  add('bd-sticker', 'Round sticker', 'Badges', circ(50, 50, 48) + circ(50, 50, 40), 0, 1, 1, 1);
  add('bd-label', 'Vintage label', 'Badges', 'M14 10H86C86 18 92 24 98 24V76C92 76 86 82 86 90H14C14 82 8 76 2 76V24C8 24 14 18 14 10ZM18 18H82C83 24 88 29 92 30V70C88 71 83 76 82 82H18C17 76 12 71 8 70V30C12 29 17 24 18 18Z', 0, 1.6, 1, 1);
  return out;
})();
GFX.push(...GX.map(([k, n, cat, d, s, ar, op, ev]) => ({ k, n, cat, d, s: !!s, ar: ar || 1, op: op || 1, ev: !!ev })));
for (const g of GFX) GMAP[g.k] = g;
const EMOJI = '❤️ 💙 ⭐ ✨ 🌟 🌸 🌺 🌻 🌿 🍃 🌊 ⚓ 🚢 ⛵ 🧭 🗺️ ✈️ 🌍 🏝️ 🌅 🌙 ☀️ 🌈 ❄️ 🎉 🎈 🎂 🎁 💍 👶 🐶 🐱 📸 🎵 ☕ 🍰 🏖️ 🏔️ 🚗 🏠 🎓 🏆 💐 🦋 🐚 🐠 🐬 🎄 🎃 🥂 😊 😍 😂 🥰 👍 🙏'.split(' ');
const PALETTE = ['#000000', '#ffffff', '#1d1d1f', '#6e6e73', '#c1121f', '#ee4266', '#ff8c42', '#ffd23f', '#2a9d8f', '#1b5e4a', '#0b1f3a', '#1e3c72', '#4f5d75', '#8a5a5a', '#c98b8b', '#d4b46a', '#8b6b4a', '#efe4cf'];
const GRADS = [['#1e3c72', '#2a9d8f'], ['#ff9a8b', '#ff6a88'], ['#141e30', '#243b55'], ['#fbc2eb', '#a6c1ee'], ['#f6d365', '#fda085'], ['#a1c4fd', '#c2e9fb'], ['#d4fc79', '#96e6a1'], ['#0f2027', '#2c5364'], ['#ffecd2', '#fcb69f'], ['#e0c3fc', '#8ec5fc'], ['#434343', '#000000'], ['#fdfbfb', '#ebedee']];
const PATTERNS = [['dots', 'Dots'], ['grid', 'Grid'], ['lines', 'Ruled'], ['stripes', 'Stripes'], ['diag', 'Diagonal'], ['checks', 'Checks'], ['linen', 'Linen'], ['confetti', 'Confetti']];
const I = {
  layouts: '<rect x="3" y="3" width="8" height="18" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
  styles: '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.3 1.3-2.4-.8-1.2 0-2.6 1.4-2.6H17a4 4 0 0 0 4-4c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  gfx: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/>',
  bgi: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  adjust: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16" stroke-opacity=".5"/>',
  splith: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>', splitv: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/>',
  shuffle: '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3"/>', magic: '<path d="M4 20 16 8M14 4v3M18 6h3M19 10v3M11 3h2"/><path d="m15 7 2 2"/>',
  tpl: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  lib: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  play: '<path d="M7 4v16l13-8z"/>', pause: '<path d="M8 4v16M16 4v16"/>',
  book: '<path d="M12 6C10 4.5 7 4 4 4v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chk: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
  disth: '<path d="M4 4v16M20 4v16"/><rect x="9" y="7" width="6" height="10" rx="1"/>', distv: '<path d="M4 4h16M4 20h16"/><rect x="7" y="9" width="10" height="6" rx="1"/>',
  group: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M11 7h4a2 2 0 0 1 2 2v4"/>',
  ungroup: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>', resize: '<rect x="3" y="7" width="12" height="14" rx="2"/><path d="M14 3h7v7M21 3l-8 8"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8M8 21v-7h8v7"/>'
};
const ic = (n) => I[n] ? `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>` : C.icon(n);

/* ---------- Model helpers ---------- */
const cur = () => D.pages[D.cur];
const sc = () => Math.sqrt(D.w * D.h) / SAMPLE_A;
const styleOf = (pg) => SMAP[pg.style] || SMAP.clean;
function fontStack(k) { return (FONTS[k] || FONTS.sans)[1]; }
function sizeLabel(d = D) { const s = SIZES.find((z) => z[0] === d.size); return s ? s[1] : `Custom ${Math.round(d.w / PT)} × ${Math.round(d.h / PT)} mm`; }
function makeDoc(sizeKey = 'a4p', name = 'Photo album', w, h) {
  const z = SIZES.find((x) => x[0] === sizeKey);
  return { id: uidd('ds'), v: 2, name, size: z ? sizeKey : 'custom', w: w || (z ? z[2] : 210) * PT, h: h || (z ? z[3] : 297) * PT, photos: [], pages: [], cur: 0, spread: false, cover: true, events: [] };
}
function newDoc(sizeKey, name, w, h) { D = makeDoc(sizeKey, name, w, h); const pg = blankPage('clean'); D.pages.push(pg); applyLayout(pg, 'cover'); }
function blankPage(styleKey, like) {
  const s = SMAP[styleKey] || SMAP.clean;
  return { id: uidd('p'), style: s.k, bg: clone(like ? like.bg : s.bg), gap: like ? like.gap : s.gap, margin: like ? like.margin : s.margin, layout: null, items: [] };
}
function frameStyle(pg) {
  const f = pg.items.find((i) => i.t === 'frame');
  if (f) return { r: f.r || 0, stroke: f.stroke || 0, strokeCol: f.strokeCol || '#ffffff', shadow: f.shadow || 0, pad: f.pad || 0, padCol: f.padCol || '#ffffff', pol: !!f.pol };
  const s = styleOf(pg); return { r: s.r || 0, stroke: s.stroke || 0, strokeCol: s.strokeCol || '#ffffff', shadow: s.shadow || 0, pad: s.pad || 0, padCol: s.padCol || '#ffffff', pol: !!s.pol };
}
function textFor(role, s) {
  const R = TROLE[role] || TROLE.caption; const k = sc();
  return { t: 'text', id: uidd('t'), role, tpl: true, text: R.text, orig: R.text, size: +(R.size * k).toFixed(1), font: R.font === 'hand' ? (s.head === 'script' ? 'script' : 'hand') : R.head ? s.head : s.body, col: s.ink, bold: !!R.bold, ital: !!R.ital, upper: !!R.upper, align: R.align, ls: R.ls || 0, lh: R.lh || 1.2, shadow: !!R.shadow, op: 1, rot: 0 };
}
function applyLayout(pg, key, photos) {
  const L = LMAP[key] || LMAP.one; const s = styleOf(pg); const fs = frameStyle(pg);
  const olds = pg.items.filter((i) => i.t === 'frame' && i.ph).map((i) => i.ph);
  const list = photos || olds; const oldTexts = pg.items.filter((i) => i.t === 'text' && i.tpl);
  const keep = pg.items.filter((i) => i.t !== 'frame' && !i.tpl);
  const frames = L.cells.map((c, i) => {
    const f = { t: 'frame', id: uidd('f'), cell: c.slice(0, 4), shape: c[4] || 'rect', rot: c[5] || 0, r: fs.r, stroke: fs.stroke, strokeCol: fs.strokeCol, shadow: fs.shadow, pad: fs.pad, padCol: fs.padCol, pol: fs.pol, op: 1, ph: list[i] ? clone(list[i]) : null };
    if (c[6]) { f.pad = Math.max(fs.pad, 7 * sc()); f.pol = true; f.padCol = fs.padCol || '#ffffff'; f.shadow = Math.max(fs.shadow, 0.55); }
    if (f.ph && !f.ph.flt && s.flt) f.ph.flt = s.flt;
    return f;
  });
  const texts = (L.texts || []).map(([role, r]) => { const t = textFor(role, s); const prev = oldTexts.find((o) => o.role === role); if (prev && prev.text !== TROLE[role].text) t.text = prev.text; t.cell = r; if ((role === 'cover' || role === 'coversub') && L.cells.length) t.col = '#ffffff'; return t; });
  pg.items = [...frames, ...texts, ...keep]; pg.layout = key; reflow(pg);
  return list.length - frames.length;
}
function applySpreadLayout(key) {
  const [l, r] = pairOf(D.cur); if (r == null) { C.toast('Spread layouts need two facing pages. Pick a pair of pages or add a page first'); return false; }
  const L = LMAP[key]; const A = D.pages[l], B = D.pages[r]; const s = styleOf(A); const fs = frameStyle(A);
  const photos = [...A.items, ...B.items].filter((i) => i.t === 'frame' && i.ph).map((i) => i.ph);
  A.items = A.items.filter((i) => i.t !== 'frame' && !i.tpl); B.items = B.items.filter((i) => i.t !== 'frame' && !i.tpl);
  const frames = L.cells.map((c, i) => ({ t: 'frame', id: uidd('f'), cell: c.slice(0, 4), sp: 1, shape: 'rect', rot: 0, ...fs, op: 1, ph: photos[i] ? { ...clone(photos[i]), fx: 0.5, fy: 0.5, z: 1 } : null }));
  for (const f of frames) if (f.ph && !f.ph.flt && s.flt) f.ph.flt = s.flt;
  if (L.bleed) { A.margin = 0; A.gap = 0; Object.assign(frames[0], { pad: 0, stroke: 0, shadow: 0, r: 0 }); }
  A.items = [...frames, ...A.items]; A.layout = key; B.layout = null; reflow(A); D.cur = l;
  const left = photos.length - frames.length; if (left > 0) C.toast(`${left} photo${left > 1 ? 's' : ''} did not fit and stay in Photos`);
  return true;
}
function reflow(pg) {
  const W = D.w, H = D.h, m = pg.margin, g = pg.gap;
  const X0 = m - g / 2, Y0 = m - g / 2, CH = H - 2 * m + g;
  for (const it of pg.items) {
    if (!it.cell) continue; const c = it.cell;
    if (it.t === 'frame') { const CW = (it.sp ? 2 * W : W) - 2 * m + g; it.x = X0 + c[0] * CW + g / 2; it.y = Y0 + c[1] * CH + g / 2; it.w = Math.max(4, c[2] * CW - g); it.h = Math.max(4, c[3] * CH - g); }
    else { it.x = m + c[0] * (W - 2 * m); it.y = m + c[1] * (H - 2 * m); it.w = c[2] * (W - 2 * m); it.h = c[3] * (H - 2 * m); }
  }
}
function pageIdxOf(it) { return D.pages.findIndex((p) => p.items.includes(it)); }
function itemBy(id) { if (!id) return null; for (const pg of D.pages) for (const it of pg.items) if (it.id === id) return it; return null; }
const selIds = () => (ST.ms.length > 1 ? ST.ms : ST.sel ? [ST.sel] : []);
const selItems = () => selIds().map(itemBy).filter((it) => it && cur().items.includes(it));
const selItem = () => { if (ST.ms.length > 1) return null; const it = itemBy(ST.sel); return it && cur().items.includes(it) ? it : null; };
function usage() { const u = new Map(); for (const pg of D.pages) { for (const it of pg.items) if (it.t === 'frame' && it.ph) u.set(it.ph.id, (u.get(it.ph.id) || 0) + 1); if (pg.bg.t === 'photo' && pg.bg.ph) u.set(pg.bg.ph, (u.get(pg.bg.ph) || 0) + 1); } return u; }
function aabb(it) { const h = it.h || 10; const a = (it.rot || 0) * Math.PI / 180; const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); const W = it.w * c + h * s, H = it.w * s + h * c; const cx = it.x + it.w / 2, cy = it.y + h / 2; return { x: cx - W / 2, y: cy - H / 2, w: W, h: H }; }
function unionBox(bs) { const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y)), x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }

/* Spreads: page pairs as in a printed book. With a cover, page 1 stands alone on the right. */
function pairOf(i) { const n = D.pages.length; if (!D.spread) return [i, null]; if (D.cover && i === 0) return [0, null]; const l = D.cover ? (i % 2 ? i : i - 1) : i - (i % 2); return [l, l + 1 < n ? l + 1 : null]; }
function partner(i) { if (!D.spread) return null; const [l, r] = pairOf(i); if (r == null) return null; return i === l ? { j: r, dx: D.w } : { j: l, dx: -D.w }; }
function viewList() { if (!D.spread) return [{ i: D.cur, ox: 0 }]; const [l, r] = pairOf(D.cur); return r == null ? [{ i: l, ox: 0 }] : [{ i: l, ox: 0 }, { i: r, ox: D.w }]; }
const oxOf = (i) => { const v = viewList().find((x) => x.i === i); return v ? v.ox : 0; };

/* ---------- Painter ---------- */
function shapePath(sh, w, h, r) {
  const p = new Path2D();
  if (!sh || sh === 'rect') { if (r > 0) p.roundRect(0, 0, w, h, Math.min(r, w / 2, h / 2)); else p.rect(0, 0, w, h); return p; }
  if (sh === 'circle') { const d = Math.min(w, h); p.ellipse(w / 2, h / 2, d / 2, d / 2, 0, 0, Math.PI * 2); return p; }
  if (sh === 'oval') { p.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return p; }
  if (sh === 'pill') { p.roundRect(0, 0, w, h, Math.min(w, h) / 2); return p; }
  p.addPath(new Path2D(SHAPES[sh] ? SHAPES[sh][1] : 'M0 0H100V100H0Z'), new DOMMatrix().scale(w / 100, h / 100)); return p;
}
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function drawPattern(x, bg, X, Y, w, h) {
  const c = bg.c2 || '#dddddd'; const s = (bg.s || 14); x.save(); x.fillStyle = c; x.strokeStyle = c;
  const p = bg.p;
  if (p === 'dots') { for (let yy = Y + s / 2; yy < Y + h; yy += s) for (let xx = X + s / 2; xx < X + w; xx += s) { x.beginPath(); x.arc(xx, yy, s * 0.11, 0, 7); x.fill(); } }
  else if (p === 'grid' || p === 'lines') { x.lineWidth = 0.5; x.beginPath(); const st = p === 'lines' ? s * 1.4 : s; if (p === 'grid') for (let xx = X; xx < X + w; xx += st) { x.moveTo(xx, Y); x.lineTo(xx, Y + h); } for (let yy = Y + st; yy < Y + h; yy += st) { x.moveTo(X, yy); x.lineTo(X + w, yy); } x.stroke(); }
  else if (p === 'stripes') { for (let xx = X; xx < X + w; xx += s * 1.6) x.fillRect(xx, Y, s * 0.8, h); }
  else if (p === 'diag') { x.lineWidth = s * 0.2; x.beginPath(); for (let d = -h; d < w + h; d += s) { x.moveTo(X + d, Y); x.lineTo(X + d + h, Y + h); } x.stroke(); }
  else if (p === 'checks') { x.globalAlpha = 0.6; for (let yy = Y, i = 0; yy < Y + h; yy += s, i++) for (let xx = X + (i % 2) * s; xx < X + w; xx += 2 * s) x.fillRect(xx, yy, s, s); }
  else if (p === 'linen') { const r = rng(7); const n = Math.min(26000, w * h / 14); for (let i = 0; i < n; i++) { x.globalAlpha = 0.12 + r() * 0.28; const horiz = r() < 0.5; x.fillRect(X + r() * w, Y + r() * h, horiz ? 1 + r() * 3 : 0.35, horiz ? 0.35 : 1 + r() * 3); } }
  else if (p === 'confetti') { const r = rng(11); const n = w * h / (s * s * 1.6); for (let i = 0; i < n; i++) { x.globalAlpha = 0.5 + r() * 0.5; x.save(); x.translate(X + r() * w, Y + r() * h); x.rotate(r() * 3); x.fillRect(-s * 0.18, -s * 0.06, s * 0.36, s * 0.12); x.restore(); } }
  x.restore();
}
function coverRect(iw, ih, pw, ph, z, fx, fy) { const k = Math.max(iw / pw, ih / ph) * (z || 1); const w = pw * k, h = ph * k; return { x: -(w - iw) * (fx ?? 0.5), y: -(h - ih) * (fy ?? 0.5), w, h }; }
function drawBg(x, bg, X, Y, w, h, o) {
  x.save(); const c1 = bg.c || '#ffffff';
  if (bg.t === 'grad') { const a = (bg.a ?? 135) * Math.PI / 180; const cx = X + w / 2, cy = Y + h / 2; const L = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)); const dx = Math.sin(a) * L / 2, dy = -Math.cos(a) * L / 2; const g = x.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy); g.addColorStop(0, c1); g.addColorStop(1, bg.c2 || c1); x.fillStyle = g; }
  else x.fillStyle = c1;
  x.fillRect(X, Y, w, h);
  if (bg.t === 'pattern') drawPattern(x, bg, X, Y, w, h);
  if (bg.t === 'photo') { const ph = PH.get(bg.ph); if (ph) { x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); const R = coverRect(w, h, ph.w, ph.h, 1); const bl = (bg.blur || 0) * o.k; if (bl) x.filter = `blur(${bl}px)`; const ex = bl ? (bg.blur || 0) * 2 : 0; x.drawImage(o.full ? ph.img : ph.prev, X + R.x - ex, Y + R.y - ex, R.w + 2 * ex, R.h + 2 * ex); x.filter = 'none'; const dm = bg.dim || 0; if (dm) { x.fillStyle = dm > 0 ? `rgba(0,0,0,${dm})` : `rgba(255,255,255,${-dm})`; x.fillRect(X, Y, w, h); } x.restore(); } }
  x.restore();
}
function phSrc(ph, o) { return o.full ? ph.img : ph.prev; }
function innerBox(f) { const pad = Math.min(f.pad || 0, f.w / 3, f.h / 3); const pb = pad > 0 ? (f.pol ? Math.min(pad * 3.4, f.h / 3) : pad) : 0; return { pad, ix: pad, iy: pad, iw: Math.max(1, f.w - 2 * pad), ih: Math.max(1, f.h - pad - pb) }; }
function photoDpi(f) { const ph = f.ph && PH.get(f.ph.id); if (!ph) return null; const { iw, ih } = innerBox(f); const k = Math.max(iw / ph.w, ih / ph.h) * (f.ph.z || 1); return Math.round(72 / k); }
function drawFrame(x, f, o) {
  const ph = f.ph && PH.get(f.ph.id);
  if (!ph && !o.ed) return;
  x.save(); x.translate(f.x + f.w / 2, f.y + f.h / 2); if (f.rot) x.rotate(f.rot * Math.PI / 180); x.translate(-f.w / 2, -f.h / 2); x.globalAlpha = f.op ?? 1;
  const outer = shapePath(f.shape, f.w, f.h, f.r || 0); const { pad, ix, iy, iw, ih } = innerBox(f);
  if (f.shadow > 0) { x.save(); x.shadowColor = `rgba(0,0,0,${0.18 + 0.25 * f.shadow})`; x.shadowBlur = 16 * f.shadow * o.k; x.shadowOffsetY = 5 * f.shadow * o.k; x.fillStyle = pad > 0 ? (f.padCol || '#ffffff') : '#888888'; x.fill(outer); x.restore(); }
  let inner = outer;
  if (pad > 0) { x.fillStyle = f.padCol || '#ffffff'; x.fill(outer); inner = new Path2D(); inner.addPath(shapePath(f.shape, iw, ih, Math.max(0, (f.r || 0) - pad / 2)), new DOMMatrix().translate(ix, iy)); }
  const R = ph ? coverRect(iw, ih, ph.w, ph.h, f.ph.z, f.ph.fx, f.ph.fy) : null;
  const paint = () => { const flt = FMAP[f.ph.flt] || 'none'; if (flt !== 'none') x.filter = flt; if (f.ph.flip) { x.save(); x.translate(ix + R.x + R.w, iy + R.y); x.scale(-1, 1); x.drawImage(phSrc(ph, o), 0, 0, R.w, R.h); x.restore(); } else x.drawImage(phSrc(ph, o), ix + R.x, iy + R.y, R.w, R.h); x.filter = 'none'; };
  if (ph && o.adj === f.id) { x.save(); x.globalAlpha = 0.35; paint(); x.restore(); }
  x.save(); x.clip(inner);
  if (ph) paint();
  else { x.fillStyle = o.drop === f.id ? 'rgba(10,132,255,.28)' : 'rgba(128,138,155,.22)'; x.fill(inner); if (!o.thumb) { const s = Math.min(iw, ih) * 0.16; x.translate(ix + iw / 2, iy + ih / 2 - (iw > 70 ? s * 0.35 : 0)); x.strokeStyle = 'rgba(110,118,132,.85)'; x.lineWidth = Math.max(0.8, s * 0.07); x.lineJoin = 'round'; x.strokeRect(-s, -s * 0.72, 2 * s, 1.44 * s); x.beginPath(); x.moveTo(-s, s * 0.5); x.lineTo(-s * 0.3, -s * 0.1); x.lineTo(s * 0.2, s * 0.35); x.lineTo(s * 0.5, s * 0.1); x.lineTo(s, s * 0.55); x.stroke(); x.beginPath(); x.arc(s * 0.45, -s * 0.32, s * 0.15, 0, 7); x.stroke(); if (iw > 70 && ih > 50) { x.fillStyle = 'rgba(95,103,118,.95)'; x.font = `600 ${clamp(Math.min(iw, ih) * 0.07, 6, 11)}px ${fontStack('sans')}`; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText('Drop a photo', 0, s * 1.05); } } }
  if (ph && o.drop === f.id) { x.fillStyle = 'rgba(10,132,255,.32)'; x.fill(inner); }
  x.restore();
  if (f.stroke > 0) { x.save(); x.clip(outer); x.lineWidth = f.stroke * 2; x.strokeStyle = f.strokeCol || '#ffffff'; x.stroke(outer); x.restore(); }
  x.restore();
}
function fontStr(t) { return `${t.ital ? 'italic ' : ''}${t.bold ? 700 : 400} ${t.size}px ${fontStack(t.font)}`; }
function textLines(x, t) {
  x.font = fontStr(t); try { x.letterSpacing = ((t.ls || 0) * t.size) + 'px'; } catch (e) {}
  const out = []; const src = t.upper ? String(t.text).toUpperCase() : String(t.text);
  for (const para of src.split('\n')) { const words = para.split(/(\s+)/); let line = ''; for (const w of words) { const test = line + w; if (line.trim() && x.measureText(test).width > t.w + 0.5) { out.push(line.trimEnd()); line = w.trimStart(); } else line = test; } out.push(line); }
  return out;
}
function drawText(x, t, o) {
  x.save(); const lines = textLines(x, t); const lh = t.size * (t.lh || 1.2); const th = Math.max(lh, lines.length * lh); t.h = th;
  x.translate(t.x + t.w / 2, t.y + th / 2); if (t.rot) x.rotate(t.rot * Math.PI / 180); x.translate(-t.w / 2, -th / 2); x.globalAlpha = t.op ?? 1;
  if (t.bgc) { x.fillStyle = t.bgc; const p = t.size * 0.35; const bp = new Path2D(); bp.roundRect(-p, -p * 0.6, t.w + 2 * p, th + p * 1.2, p * 0.8); x.fill(bp); }
  x.fillStyle = t.col || '#000000'; x.textBaseline = 'middle'; x.textAlign = t.align === 'center' ? 'center' : t.align === 'right' ? 'right' : 'left';
  if (t.shadow) { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 6 * o.k; x.shadowOffsetY = 1.5 * o.k; }
  const ax = t.align === 'center' ? t.w / 2 : t.align === 'right' ? t.w : 0;
  lines.forEach((ln, i) => x.fillText(ln, ax, (i + 0.5) * lh + t.size * 0.04));
  x.restore();
}
function drawGfx(x, g, o) {
  x.save(); x.translate(g.x + g.w / 2, g.y + g.h / 2); if (g.rot) x.rotate(g.rot * Math.PI / 180); if (g.flip) x.scale(-1, 1); x.translate(-g.w / 2, -g.h / 2); x.globalAlpha = g.op ?? 1;
  if (g.t === 'emoji') { x.font = `${g.h * 0.84}px ${EMOJI_FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(g.ch, g.w / 2, g.h * 0.54); x.restore(); return; }
  const G = GMAP[g.g]; if (!G) { x.restore(); return; }
  const p = new Path2D(); p.addPath(new Path2D(G.d), new DOMMatrix().scale(g.w / 100, g.h / 100));
  if (G.s) { x.strokeStyle = g.col; x.lineWidth = g.sw || Math.max(0.8, Math.min(g.w, g.h) * 0.06); x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(p); }
  else { x.fillStyle = g.col; x.fill(p, G.ev ? 'evenodd' : 'nonzero'); }
  x.restore();
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function eventsOn(y, m, d) { return (D.events || []).filter((e) => e.m === m && e.d === d && (e.y == null || e.y === y)); }
function drawCal(x, c, o) {
  x.save(); x.translate(c.x + c.w / 2, c.y + c.h / 2); if (c.rot) x.rotate(c.rot * Math.PI / 180); x.translate(-c.w / 2, -c.h / 2); x.globalAlpha = c.op ?? 1;
  const fam = fontStack(c.font || 'sans'), bfam = fontStack(c.bfont || c.font || 'sans'); const ink = c.col || '#1d1d1f', acc = c.acc || '#c1121f'; const W = c.w, H = c.h;
  let y = 0; x.textBaseline = 'middle';
  if (c.head !== false) { const ht = H * 0.15; const fs = Math.min(ht * 0.62, W * 0.085); x.fillStyle = ink; x.font = `700 ${fs}px ${fam}`; x.textAlign = c.align === 'center' ? 'center' : 'left'; const tx = c.align === 'center' ? W / 2 : 0; const mt = MONTHS[c.month]; if (c.align === 'center') x.fillText(`${mt} ${c.year}`, tx, ht * 0.45); else { x.fillText(mt, 0, ht * 0.45); const mw = x.measureText(mt).width; x.fillStyle = acc; x.font = `400 ${fs * 0.62}px ${bfam}`; x.fillText('  ' + c.year, mw, ht * 0.45 + fs * 0.06); } y = ht; }
  const ws = c.ws ?? 1; const first = new Date(c.year, c.month, 1).getDay(); const off = (first - ws + 7) % 7; const days = new Date(c.year, c.month + 1, 0).getDate(); const rows = Math.ceil((off + days) / 7);
  const cw = W / 7; const hd = Math.min(H * 0.075, cw * 0.5); const gy = y + hd; const rh = (H - gy) / rows;
  x.font = `700 ${Math.min(hd * 0.55, cw * 0.24)}px ${bfam}`; x.textAlign = 'center'; x.fillStyle = acc;
  for (let k = 0; k < 7; k++) x.fillText(WDAYS[(k + ws) % 7].toUpperCase(), (k + 0.5) * cw, y + hd / 2);
  const weekend = (col) => { const wd = (col + ws) % 7; return wd === 0 || wd === 6; };
  if (c.style !== 'minimal') { x.save(); x.globalAlpha = 0.07; x.fillStyle = acc; for (let k = 0; k < 7; k++) if (weekend(k)) x.fillRect(k * cw, gy, cw, rows * rh); x.restore(); }
  x.strokeStyle = ink; x.lineWidth = 0.5; x.save(); x.globalAlpha = 0.28; x.beginPath();
  if (c.style === 'grid') { for (let r = 0; r <= rows; r++) { x.moveTo(0, gy + r * rh); x.lineTo(W, gy + r * rh); } for (let k = 0; k <= 7; k++) { x.moveTo(k * cw, gy); x.lineTo(k * cw, gy + rows * rh); } }
  else if (c.style === 'lines') { for (let r = 0; r <= rows; r++) { x.moveTo(0, gy + r * rh); x.lineTo(W, gy + r * rh); } }
  x.stroke(); x.restore();
  const nfs = Math.min(rh * 0.34, cw * 0.3); const efs = Math.min(rh * 0.2, cw * 0.15);
  for (let d = 1; d <= days; d++) {
    const idx = off + d - 1, col = idx % 7, row = Math.floor(idx / 7); const cx0 = col * cw, cy0 = gy + row * rh;
    const evs = c.ev === false ? [] : eventsOn(c.year, c.month, d);
    x.fillStyle = weekend(col) || evs.length ? acc : ink; x.font = `${evs.length ? 700 : 500} ${nfs}px ${bfam}`;
    if (c.style === 'minimal') { x.textAlign = 'center'; x.fillText(String(d), cx0 + cw / 2, cy0 + rh * (evs.length ? 0.38 : 0.5)); }
    else { x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText(String(d), cx0 + cw * 0.08, cy0 + rh * 0.08); x.textBaseline = 'middle'; }
    if (evs.length) { x.font = `600 ${efs}px ${bfam}`; x.fillStyle = acc; x.textAlign = c.style === 'minimal' ? 'center' : 'left'; let lab = evs.map((e) => e.label).join(', '); const mw = cw * 0.86; while (lab.length > 1 && x.measureText(lab).width > mw) lab = lab.slice(0, -2) + '…'; x.fillText(lab, c.style === 'minimal' ? cx0 + cw / 2 : cx0 + cw * 0.08, cy0 + rh * (c.style === 'minimal' ? 0.72 : 0.78)); }
  }
  x.restore();
}
function drawItems(x, items, o, b) {
  for (const it0 of items) {
    if (o.skip && it0.id === o.skip) continue;
    let it = it0;
    if (b && it.t === 'frame' && !it.rot) { it = { ...it0 }; const e = 0.8; if (it.x <= e) { it.w += it.x + b; it.x = -b; } if (it.y <= e) { it.h += it.y + b; it.y = -b; } if (it.x + it.w >= D.w - e) it.w = D.w + b - it.x; if (it.y + it.h >= D.h - e) it.h = D.h + b - it.y; }
    if (it.t === 'frame') drawFrame(x, it, o); else if (it.t === 'text') drawText(x, it, o); else if (it.t === 'cal') drawCal(x, it, o); else drawGfx(x, it, o);
  }
}
function drawPage(x, pg, o) {
  const b = o.bleed || 0; drawBg(x, pg.bg, -b, -b, D.w + 2 * b, D.h + 2 * b, o);
  drawItems(x, pg.items, o, b);
  if (D.spread && !o.solo) { const p = partner(D.pages.indexOf(pg)); if (p) { const cross = D.pages[p.j].items.filter((it) => { const bb = aabb(it); return p.dx > 0 ? bb.x < 0 : bb.x + bb.w > D.w; }); if (cross.length) { x.save(); x.translate(p.dx, 0); drawItems(x, cross, o, 0); x.restore(); } } }
}

/* ---------- Photos ---------- */
async function loadPhoto(rec) {
  const url = URL.createObjectURL(rec.blob); const img = new Image(); img.decoding = 'async'; img.src = url; await img.decode();
  const w = img.naturalWidth, h = img.naturalHeight; const k = Math.min(1, 1600 / Math.max(w, h)); const prev = document.createElement('canvas'); prev.width = Math.max(1, Math.round(w * k)); prev.height = Math.max(1, Math.round(h * k));
  const px = prev.getContext('2d'); px.imageSmoothingQuality = 'high'; px.drawImage(img, 0, 0, prev.width, prev.height);
  const ph = { id: rec.id, name: rec.name, w, h, blob: rec.blob, url, img, prev }; PH.set(rec.id, ph); return ph;
}
async function addPhotoFiles(files) {
  const ids = []; const list = [...files].filter((f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name || ''));
  if (!list.length) return ids;
  const t = C.toast(list.length > 1 ? `Adding ${list.length} photos` : 'Adding photo', { spin: true, sticky: true });
  for (const f of list) {
    try {
      let blob = f; const probe = new Image(); const u = URL.createObjectURL(f); probe.src = u; await probe.decode();
      const mx = Math.max(probe.naturalWidth, probe.naturalHeight);
      if (mx > 4200 || !/jpe?g|png|webp/i.test(f.type)) { const k = Math.min(1, 4200 / mx); const c = document.createElement('canvas'); c.width = Math.round(probe.naturalWidth * k); c.height = Math.round(probe.naturalHeight * k); const cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(probe, 0, 0, c.width, c.height); blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92)); }
      URL.revokeObjectURL(u);
      const rec = { id: uidd('ph'), name: f.name || 'photo', blob }; await loadPhoto(rec); D.photos.push(rec.id); ids.push(rec.id); idbPut('ph:' + rec.id, { id: rec.id, name: rec.name, blob });
    } catch (e) { C.toast(`${f.name || 'A file'} could not be read as a photo`, { err: true }); }
  }
  t.remove(); scheduleSave(); return ids;
}
const newPh = (id, pg) => { const s = styleOf(pg || cur()); return { id, z: 1, fx: 0.5, fy: 0.5, flt: s.flt || 'none' }; };
async function ensurePhotos(ids) { const ok = []; for (const id of ids) { if (PH.has(id)) { ok.push(id); continue; } const rec = await idbGet('ph:' + id); if (rec && rec.blob) { try { await loadPhoto(rec); ok.push(id); } catch (e) {} } } return ok; }

/* ---------- Storage: a library of designs in IndexedDB ---------- */
let dbP = null;
function idb() { if (!dbP) dbP = new Promise((res, rej) => { const r = indexedDB.open('pdfmate-design', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); return dbP; }
async function idbGet(k) { try { const db = await idb(); return await new Promise((res) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
async function idbPut(k, v) { try { const db = await idb(); await new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
async function idbDel(k) { try { const db = await idb(); await new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
const lastKey = 'pdfmate.dsLast';
async function getIndex() { return (await idbGet('index')) || []; }
function thumbOf(d) { try { const c = document.createElement('canvas'); const k = 220 / Math.max(d.w, d.h); c.width = Math.round(d.w * k); c.height = Math.round(d.h * k); const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); const keep = D; D = d; drawPage(x, d.pages[0], { k, ed: true, thumb: true }); D = keep; return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; } }
let saveT = 0;
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(saveNow, 900); }
async function saveNow() {
  clearTimeout(saveT); if (!D) return; const d = JSON.parse(JSON.stringify(D));
  await idbPut('doc:' + d.id, d);
  const idx = await getIndex(); const e = { id: d.id, name: d.name, size: d.size, w: d.w, h: d.h, n: d.pages.length, at: Date.now(), photos: d.photos.slice(), thumb: thumbOf(d) };
  const i = idx.findIndex((x) => x.id === d.id); if (i >= 0) idx[i] = e; else idx.unshift(e);
  idx.sort((a, b) => b.at - a.at); await idbPut('index', idx); try { localStorage.setItem(lastKey, d.id); } catch (er) {}
}
async function loadDoc(id) {
  const d = await idbGet('doc:' + id); if (!d || !d.pages || !d.pages.length) return false;
  D = Object.assign(makeDoc(), d); D.cur = clamp(D.cur || 0, 0, D.pages.length - 1); D.events = D.events || [];
  D.photos = await ensurePhotos(D.photos || []); try { localStorage.setItem(lastKey, D.id); } catch (e) {} return true;
}
async function restore() {
  const old = await idbGet('doc');
  if (old && old.pages) { const d = Object.assign(makeDoc(), old); if (!old.id) d.id = uidd('ds'); D = d; D.photos = await ensurePhotos(D.photos || []); await saveNow(); await idbDel('doc'); return true; }
  let last = null; try { last = localStorage.getItem(lastKey); } catch (e) {}
  if (last && await loadDoc(last)) return true;
  const idx = await getIndex(); for (const e of idx) if (await loadDoc(e.id)) return true;
  return false;
}
async function photoStillUsed(id, exceptDoc) { const idx = await getIndex(); return idx.some((e) => e.id !== exceptDoc && (e.photos || []).includes(id)); }

/* ---------- History ---------- */
const snap = () => JSON.stringify({ w: D.w, h: D.h, size: D.size, name: D.name, pages: D.pages, cur: D.cur, spread: D.spread, cover: D.cover, events: D.events });
function commit() { const s = snap(); if (s === ST.last) return; ST.hist.push(ST.last); if (ST.hist.length > 80) ST.hist.shift(); ST.fut = []; ST.last = s; scheduleSave(); thumbsSoon(); markHist(); }
function loadSnap(s) { const o = JSON.parse(s); Object.assign(D, o); D.cur = clamp(D.cur, 0, D.pages.length - 1); ST.ms = ST.ms.filter((id) => itemBy(id)); if (!itemBy(ST.sel)) ST.sel = null; ST.adj = null; ST.last = s; scheduleSave(); refreshAll(); }
function undo() { if (!ST.hist.length) return; endEdit(); ST.fut.push(ST.last); loadSnap(ST.hist.pop()); }
function redo() { if (!ST.fut.length) return; ST.hist.push(ST.last); loadSnap(ST.fut.pop()); }
function markHist() { if (!UI) return; const u = $('[data-a="undo"]'), r = $('[data-a="redo"]'); if (u) u.disabled = !ST.hist.length; if (r) r.disabled = !ST.fut.length; }
function resetHist() { ST.hist = []; ST.fut = []; ST.last = snap(); ST.sel = null; ST.ms = []; ST.adj = null; markHist(); }

const CSS = `
.ds{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;background:var(--canvas);color:var(--label);font-family:var(--font);user-select:none;-webkit-user-select:none}
.ds .i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ds button{font:inherit;color:inherit;cursor:pointer}
.ds-top{display:flex;align-items:center;gap:6px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top));border-bottom:.5px solid var(--sep-strong);background:var(--glass-strong);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);flex-wrap:nowrap;min-height:52px}
.ds-top .tbtn{height:32px}
.ds-top .tbtn:disabled{opacity:.35;pointer-events:none}
.ds-brand{font-weight:700;font-size:14px;white-space:nowrap;display:flex;align-items:center;gap:8px}
.ds-brand small{font-weight:600;color:var(--accent);background:var(--accent-soft);padding:2px 8px;border-radius:999px;font-size:11px}
.ds-name{height:32px;border:0;background:var(--fill);border-radius:8px;padding:0 10px;color:var(--label);font:inherit;font-weight:600;width:180px;min-width:80px}
.ds-sizebtn{height:32px;border:0;background:var(--fill);border-radius:8px;padding:0 10px;font-size:13px;white-space:nowrap}
.ds-sp{flex:1}
.ds-zoom{font-size:12px;font-variant-numeric:tabular-nums;min-width:44px;text-align:center;border:0;background:none;height:32px}
.ds-top .btn{height:34px;padding:0 14px}
.ds-main{flex:1;display:flex;min-height:0}
.ds-rail{width:72px;flex:none;display:flex;flex-direction:column;gap:2px;padding:8px 6px;border-right:.5px solid var(--sep);background:var(--sidebar)}
.ds-rail button{border:0;background:none;border-radius:10px;padding:8px 2px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:var(--label-2)}
.ds-rail button .i{width:22px;height:22px}
.ds-rail button[aria-selected="true"]{background:var(--accent-soft);color:var(--accent)}
.ds-panel{width:296px;flex:none;overflow:auto;padding:14px;border-right:.5px solid var(--sep);background:var(--win)}
.ds-panel h3,.ds-insp h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--label-3);margin:14px 0 8px;font-weight:700}
.ds-panel h3:first-child,.ds-insp h3:first-child{margin-top:0}
.ds-panel p.hint,.ds-insp p.hint{font-size:12px;color:var(--label-3);margin:6px 0 10px;line-height:1.4}
.ds-stagewrap{flex:1;position:relative;min-width:0;display:flex;flex-direction:column}
.ds-stage{flex:1;overflow:auto;position:relative;touch-action:none}
.ds-stage.adj{cursor:grab}
.ds-board{position:relative;margin:auto;flex:none}
.ds-canvasbox{position:relative;box-shadow:var(--page-shadow);background:#fff}
.ds-cv{display:block}
.ds-ov{position:absolute;left:0;top:0;pointer-events:none}
.ds-ov>*{pointer-events:auto}
.ds-sel{position:absolute;border:1.5px solid var(--accent);box-sizing:border-box;pointer-events:none}
.ds-sel.adj{border-style:dashed}
.ds-h{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:1.5px solid var(--accent);box-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:auto;touch-action:none}
.ds-h.side{width:8px;height:18px;margin:-9px 0 0 -4px;border-radius:4px}
.ds-h.side.hz{width:18px;height:8px;margin:-4px 0 0 -9px}
.ds-h.rot{top:-28px;left:50%;cursor:grab}
.ds-h.rot::after{content:'';position:absolute;left:50%;top:10px;width:1px;height:16px;background:var(--accent)}
.ds-h.mv{width:26px;height:26px;margin:-13px 0 0 -13px;display:flex;align-items:center;justify-content:center;color:var(--accent);cursor:move}
.ds-h.mv .i{width:15px;height:15px}
.ds-gut{position:absolute;background:#fff;border:1.5px solid var(--accent);border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.25);touch-action:none;opacity:.92}
.ds-gut.v{width:8px;height:30px;margin:-15px 0 0 -4px;cursor:col-resize}
.ds-gut.h{width:30px;height:8px;margin:-4px 0 0 -15px;cursor:row-resize}
.ds-guide{position:absolute;background:#ff2d78;pointer-events:none}
.ds-guide.v{width:1px;top:0;bottom:0}
.ds-guide.h{height:1px;left:0;right:0}
.ds-fbar{position:absolute;display:flex;gap:2px;padding:3px;border-radius:12px;background:var(--glass-strong);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:var(--pop-shadow);transform:translate(-50%,-100%);white-space:nowrap;z-index:2}
.ds-fbar button{border:0;background:none;height:30px;min-width:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 7px;font-size:12px;font-weight:600}
.ds-fbar button:hover{background:var(--fill-hover)}
.ds-fbar button.danger{color:var(--danger)}
.ds-ta{position:absolute;border:1.5px dashed var(--accent);background:rgba(255,255,255,.04);outline:none;resize:none;overflow:hidden;padding:0;margin:0;transform-origin:center;white-space:pre-wrap;word-wrap:break-word;user-select:text;-webkit-user-select:text}
.ds-insp{width:280px;flex:none;overflow:auto;padding:14px;border-left:.5px solid var(--sep);background:var(--win)}
.ds-row{display:flex;align-items:center;gap:8px;margin:6px 0}
.ds-row label{font-size:12px;color:var(--label-2);width:86px;flex:none}
.ds-row input[type=range]{flex:1;min-width:0;accent-color:var(--accent)}
.ds-row .val{font-size:11px;color:var(--label-3);width:34px;text-align:right;font-variant-numeric:tabular-nums}
.ds-row select,.ds-row input[type=number]{flex:1;height:30px;border-radius:8px;border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);color:var(--label);padding:0 8px;font:inherit;font-size:13px;min-width:0}
.ds-row input[type=color]{width:30px;height:30px;border:0;padding:0;background:none;border-radius:8px;flex:none}
.ds-chk{display:flex;align-items:center;gap:8px;font-size:13px;margin:8px 0;cursor:pointer}
.ds-btns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.ds-b{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 11px;border-radius:9px;border:0;background:var(--fill-2);font-size:12.5px;font-weight:600}
.ds-b:hover{background:var(--fill-hover)}
.ds-b.pri{background:var(--accent);color:var(--accent-ink)}
.ds-b.danger{color:var(--danger)}
.ds-b.on{background:var(--accent-soft);color:var(--accent)}
.ds-b .i{width:16px;height:16px}
.ds-b.full{width:100%;justify-content:center}
.ds-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.ds-chip{border:0;background:var(--fill-2);border-radius:999px;height:26px;padding:0 10px;font-size:12px;font-weight:600}
.ds-chip[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
.ds-lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ds-lcard{border:0;background:none;padding:0;display:flex;flex-direction:column;gap:4px;align-items:center;font-size:10.5px;color:var(--label-2)}
.ds-lcard svg{width:100%;height:auto;border-radius:6px;background:var(--control);box-shadow:0 0 0 .5px var(--sep-strong);display:block}
.ds-lcard[aria-current="true"] svg{box-shadow:0 0 0 2px var(--accent)}
.ds-lcard:hover svg{box-shadow:0 0 0 1.5px var(--accent)}
.ds-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.ds-ph{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:var(--fill-2);cursor:grab;touch-action:pan-y}
.ds-ph img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;-webkit-user-drag:none}
.ds-ph .used{position:absolute;right:4px;bottom:4px;min-width:18px;height:18px;border-radius:9px;background:var(--accent);color:#fff;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 4px}
.ds-ph .x{position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.55);color:#fff;display:none;align-items:center;justify-content:center;padding:0}
.ds-ph .x .i{width:13px;height:13px}
.ds-ph:hover .x{display:flex}
.ds-drop{border:1.5px dashed var(--sep-strong);border-radius:12px;padding:22px 12px;text-align:center;color:var(--label-3);font-size:13px;line-height:1.5;margin-bottom:10px}
.ds-drop.hot{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.ds-sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.ds-scard{border:0;padding:0;background:none;display:flex;flex-direction:column;gap:5px;font-size:11.5px;font-weight:600;color:var(--label-2);text-align:left}
.ds-sprev{height:84px;border-radius:9px;box-shadow:0 0 0 .5px var(--sep-strong);position:relative;overflow:hidden;display:grid;grid-template-columns:1.3fr 1fr;grid-template-rows:1fr 1fr;padding:8px;gap:5px}
.ds-sprev i{display:block;background:linear-gradient(135deg,#8fb3d9,#4f7fae)}
.ds-sprev i:first-child{grid-row:span 2}
.ds-sprev b{position:absolute;left:8px;bottom:5px;font-size:15px;font-weight:700}
.ds-scard[aria-current="true"] .ds-sprev{box-shadow:0 0 0 2px var(--accent)}
.ds-tp{display:flex;flex-direction:column;gap:6px}
.ds-tp button{border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);border-radius:10px;padding:10px 12px;text-align:left;color:var(--label)}
.ds-tp button:hover{box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-ggrid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.ds-g{border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);border-radius:9px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:8px;color:var(--label)}
.ds-g:hover{box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-g svg{width:100%;height:100%;overflow:visible}
.ds-emo{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.ds-emo button{border:0;background:none;font-size:24px;aspect-ratio:1;border-radius:8px;font-family:${EMOJI_FONT}}
.ds-emo button:hover{background:var(--fill-hover)}
.ds-sw{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin:6px 0 10px}
.ds-sw button{aspect-ratio:1;border-radius:50%;border:0;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.25);padding:0}
.ds-sw button[aria-pressed="true"]{box-shadow:0 0 0 2px var(--win),0 0 0 3.5px var(--accent)}
.ds-gr{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}
.ds-gr button{height:44px;border-radius:9px;border:0;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.2)}
.ds-pat{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}
.ds-pat button{border:0;padding:0;background:none;font-size:10.5px;color:var(--label-2);display:flex;flex-direction:column;gap:3px;align-items:center}
.ds-pat canvas{width:100%;aspect-ratio:1;border-radius:8px;box-shadow:inset 0 0 0 .5px var(--sep-strong);display:block}
.ds-shapes{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:6px 0 10px}
.ds-shapes button{border:0;background:var(--fill);border-radius:8px;aspect-ratio:1;padding:6px;display:flex;align-items:center;justify-content:center;color:var(--label-2)}
.ds-shapes button[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-shapes svg{width:100%;height:100%}
.ds-flt{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 10px}
.ds-flt button{border:0;padding:0;background:none;font-size:10px;color:var(--label-2);display:flex;flex-direction:column;gap:3px;align-items:center}
.ds-flt img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block}
.ds-flt button[aria-pressed="true"] img{box-shadow:0 0 0 2px var(--accent)}
.ds-seg{display:flex;background:var(--fill-2);border-radius:9px;padding:2px;gap:2px;flex:1}
.ds-seg button{flex:1;height:28px;border:0;border-radius:7px;background:none;display:flex;align-items:center;justify-content:center}
.ds-seg button[aria-pressed="true"]{background:var(--control);box-shadow:var(--ctrl-shadow)}
.ds-seg .i{width:16px;height:16px}
.ds-ta2{width:100%;min-height:80px;border-radius:9px;border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);color:var(--label);padding:8px 10px;font:inherit;font-size:13px;resize:vertical;user-select:text;-webkit-user-select:text}
.ds-pages{display:flex;align-items:center;gap:8px;padding:8px 12px;padding-bottom:max(8px,env(safe-area-inset-bottom));border-top:.5px solid var(--sep);background:var(--glass-strong);min-height:92px}
.ds-pgscroll{flex:1;min-width:0;display:flex;align-items:center;gap:8px;overflow-x:auto;padding:2px}
.ds-pg{flex:none;border:0;padding:0;background:none;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:var(--label-3);font-weight:600}
.ds-pg canvas{display:block;border-radius:3px;box-shadow:0 0 0 .5px var(--sep-strong),0 1px 3px rgba(0,0,0,.12);background:#fff}
.ds-pg[aria-current="true"] canvas{box-shadow:0 0 0 2px var(--accent)}
.ds-pg[aria-current="true"]{color:var(--accent)}
.ds-pgact{display:flex;gap:2px;flex:none;margin-left:6px}
.ds-pgact button{border:0;background:var(--fill);border-radius:8px;width:34px;height:34px;display:flex;align-items:center;justify-content:center}
.ds-pgact button:disabled{opacity:.35}
.ds-pgadd{flex:none;width:54px;height:64px;border-radius:6px;border:1.5px dashed var(--sep-strong);background:none;display:flex;align-items:center;justify-content:center;color:var(--label-3)}
.ds-ghost{position:fixed;z-index:120;width:84px;height:84px;border-radius:10px;overflow:hidden;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.35);transform:translate(-50%,-50%) rotate(-4deg);opacity:.92}
.ds-ghost img{width:100%;height:100%;object-fit:cover}
.ds-modal{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.ds-mbox{background:var(--win);border-radius:16px;box-shadow:var(--pop-shadow);padding:20px;width:min(440px,100%);max-height:90vh;overflow:auto}
.ds-mbox h2{margin:0 0 4px;font-size:18px}
.ds-mbox .sub{color:var(--label-3);font-size:13px;margin:0 0 14px;line-height:1.45}
.ds-mbox .acts{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px}
.ds-opt{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:6px 0 12px}
.ds-opt button{border:0;background:var(--fill);border-radius:10px;padding:9px 10px;text-align:left;font-size:12.5px;line-height:1.3}
.ds-opt button small{display:block;color:var(--label-3);font-size:11px}
.ds-opt button[aria-pressed="true"]{background:var(--accent-soft);box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-prog{height:6px;border-radius:3px;background:var(--fill-2);overflow:hidden;margin-top:12px}
.ds-prog i{display:block;height:100%;background:var(--accent);width:0;transition:width .2s}
.ds-menu{position:fixed;z-index:95;background:var(--glass-strong);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border-radius:12px;box-shadow:var(--pop-shadow);padding:5px;min-width:220px;max-height:70vh;overflow:auto}
.ds-menu button{display:flex;width:100%;align-items:center;gap:10px;border:0;background:none;border-radius:8px;padding:8px 10px;text-align:left;font-size:13px}
.ds-menu button:hover{background:var(--accent);color:var(--accent-ink)}
.ds-menu button[aria-current="true"]{font-weight:700}
.ds-menu hr{border:0;border-top:.5px solid var(--sep-strong);margin:4px 6px}
.ds-mtabs{display:none}
.ds-close-sheet{display:none}
@media (max-width:900px){
  .ds-insp{position:absolute;right:0;left:0;bottom:0;width:auto;max-height:48%;z-index:5;border:0;border-top:.5px solid var(--sep-strong);border-radius:16px 16px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.18)}
  .ds-insp[hidden]{display:none}
  .ds-panel{position:absolute;left:0;right:0;bottom:0;width:auto;max-height:55%;z-index:6;border:0;border-top:.5px solid var(--sep-strong);border-radius:16px 16px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.18)}
  .ds-panel[hidden]{display:none}
  .ds-rail{display:none}
  .ds-mtabs{display:flex;gap:2px;padding:4px 6px;border-top:.5px solid var(--sep);background:var(--glass-strong);overflow-x:auto}
  .ds-mtabs button{flex:1;border:0;background:none;border-radius:10px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:600;color:var(--label-2);min-width:56px}
  .ds-mtabs button[aria-selected="true"]{color:var(--accent)}
  .ds-close-sheet{display:flex;position:sticky;top:-14px;margin:-14px -14px 8px;padding:8px 14px;justify-content:space-between;align-items:center;background:var(--win);z-index:2;font-weight:700;font-size:14px}
  .ds-close-sheet button{border:0;background:var(--fill-2);border-radius:999px;height:28px;padding:0 12px;font-weight:600;font-size:12px}
  .ds-name{width:84px}.ds-brand,.ds-hide-m{display:none!important}.ds-sizebtn{max-width:92px;overflow:hidden;text-overflow:ellipsis;font-size:12px}.ds-top{gap:4px;padding-left:8px;padding-right:8px}
  .ds-pages{min-height:72px}
}
.ds-msel{position:absolute;border:1.5px dashed var(--accent);box-sizing:border-box;pointer-events:none}
.ds-mbb{position:absolute;border:1px solid var(--accent);box-sizing:border-box;pointer-events:none;background:rgba(10,132,255,.05)}
.ds-marq{position:absolute;border:1px solid var(--accent);background:rgba(10,132,255,.12);pointer-events:none}
.ds-sel.locked{border-color:var(--label-3)}
.ds-lockb{position:absolute;right:-10px;top:-10px;width:22px;height:22px;border-radius:50%;background:var(--label-2);color:#fff;display:flex;align-items:center;justify-content:center}
.ds-lockb .i{width:13px;height:13px}
.ds-fcount{font-size:12px;font-weight:700;padding:0 8px;align-self:center;color:var(--label-2)}
.ds-dpi{position:absolute;display:flex;align-items:center;gap:3px;padding:2px 7px 2px 5px;border-radius:999px;font-size:10.5px;font-weight:700;color:#fff;pointer-events:auto;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.ds-dpi .i{width:12px;height:12px}
.ds-dpi.bad{background:#d70015}.ds-dpi.meh{background:#c77c02}
.ds-q{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:9px;font-size:12px;margin-bottom:8px}
.ds-q .i{width:16px;height:16px}
.ds-q.good{background:rgba(36,138,61,.12);color:var(--ok)}.ds-q.meh{background:rgba(199,124,2,.14);color:#a86500}.ds-q.bad{background:var(--danger-soft);color:var(--danger)}
.ds-abar{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:6px 0}
.ds-abar button{border:0;background:var(--fill);border-radius:8px;height:32px;display:flex;align-items:center;justify-content:center}
.ds-abar button:hover{background:var(--fill-hover)}
.ds-spr{display:flex;gap:1px;flex:none;padding:3px;border-radius:7px}
.ds-spr.cover{padding-left:3px}
.ds-spr:has([aria-current="true"]){background:var(--accent-soft)}
.ds-spmode{flex:none;width:auto}
.ds-spmode button{padding:0 10px;gap:5px;font-size:12px;font-weight:600}
.ds-lgrid.sp{grid-template-columns:repeat(2,1fr)}
.ds-calcta{display:flex;align-items:center;gap:12px;width:100%;border:0;border-radius:12px;padding:12px;margin-bottom:12px;background:linear-gradient(135deg,var(--accent-soft),transparent);box-shadow:inset 0 0 0 .5px var(--sep-strong);text-align:left}
.ds-calcta .i{width:26px;height:26px;color:var(--accent)}
.ds-calcta b{display:block;font-size:13.5px}.ds-calcta small{color:var(--label-3);font-size:11.5px}
.ds-tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.ds-tcard{border:0;background:none;padding:0;display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--label-2);text-align:center}
.ds-tth{display:block;border-radius:7px;overflow:hidden;box-shadow:0 0 0 .5px var(--sep-strong),0 1px 4px rgba(0,0,0,.08);background:var(--control);min-height:60px}
.ds-tth canvas{width:100%;height:auto;display:block}
.ds-tcard:hover .ds-tth{box-shadow:0 0 0 1.5px var(--accent)}
.ds-tgrid.small{grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 10px;max-height:260px;overflow:auto}
.ds-tgrid.small .ds-tcard{background:var(--fill);border-radius:9px;padding:8px;text-align:left}
.ds-tgrid.small .ds-tcard[aria-pressed="true"]{background:var(--accent-soft);box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-tname{font-weight:600;color:var(--label);font-size:12px}
.ds-tgh{grid-column:1/-1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--label-3);margin-top:6px}
.ds-mbox.wide{width:min(720px,100%)}
.ds-fl{font-size:12px;font-weight:600;color:var(--label-2);margin-top:4px}
.ds-libhead{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ds-lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-top:6px}
.ds-lcard2{position:relative;display:flex;flex-direction:column;gap:6px}
.ds-lth{border:0;padding:0;background:var(--fill-2);border-radius:8px;overflow:hidden;box-shadow:0 0 0 .5px var(--sep-strong),0 2px 8px rgba(0,0,0,.12);display:block;width:100%;max-height:200px}
.ds-lth img{width:100%;height:100%;object-fit:cover;display:block}
.ds-lcard2.on .ds-lth{box-shadow:0 0 0 2px var(--accent)}
.ds-lrow{display:flex;align-items:flex-start;gap:4px}.ds-lmeta{flex:1;min-width:0}
.ds-lmeta b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ds-lmeta small{color:var(--label-3);font-size:11px}
.ds-ldots{flex:none;border:0;background:none;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.ds-ldots:hover{background:var(--fill-hover)}
.ds-sizes{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin:6px 0 10px}
.ds-sizes button{border:0;background:var(--fill);border-radius:10px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:10.5px;line-height:1.2;text-align:center}
.ds-sizes button i{display:block;border:1.5px solid var(--label-3);border-radius:2px;background:var(--control)}
.ds-sizes button[aria-pressed="true"]{background:var(--accent-soft);box-shadow:inset 0 0 0 1.5px var(--accent)}
.ds-sizes button[aria-pressed="true"] i{border-color:var(--accent)}
.ds-evs{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto}
.ds-evrow{display:flex;align-items:center;gap:6px}
.ds-evrow input[type=date],.ds-evrow input[type=text]{height:32px;border-radius:8px;border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);color:var(--label);padding:0 8px;font:inherit;font-size:13px}
.ds-evrow input[type=text]{flex:1;min-width:0}
.ds-evrow label{font-size:12px;display:flex;align-items:center;gap:4px;white-space:nowrap}
.ds-chkhead{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;margin-bottom:10px}
.ds-chkhead .i{width:28px;height:28px}
.ds-chkhead.good{background:rgba(36,138,61,.12);color:var(--ok)}.ds-chkhead.meh{background:rgba(199,124,2,.14);color:#a86500}.ds-chkhead.bad{background:var(--danger-soft);color:var(--danger)}
.ds-chkhead h2{color:var(--label)}
.ds-issues{display:flex;flex-direction:column;gap:4px;max-height:46vh;overflow:auto}
.ds-issue{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:9px;background:var(--fill);font-size:12.5px;line-height:1.35}
.ds-issue i{width:9px;height:9px;border-radius:50%;flex:none;background:var(--label-3)}
.ds-issue.lv2 i{background:var(--danger)}.ds-issue.lv1 i{background:#e09a00}
.ds-issue span{flex:1}
.ds-issue .ds-b{height:28px}
.ds-warnbar{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;font-size:12.5px;font-weight:600;margin-bottom:12px}
.ds-warnbar span{flex:1}.ds-warnbar .i{width:16px;height:16px}
.ds-warnbar.good{background:rgba(36,138,61,.12);color:var(--ok)}.ds-warnbar.meh{background:rgba(199,124,2,.14);color:#a86500}.ds-warnbar.bad{background:var(--danger-soft);color:var(--danger)}
.ds-proof{display:flex;flex-direction:column;gap:10px;max-height:58vh;overflow:auto}
.ds-proof label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--label-3)}
.ds-proof textarea{border-radius:9px;border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);color:var(--label);padding:8px 10px;font:inherit;font-size:13.5px;resize:vertical;user-select:text;-webkit-user-select:text}
.ds-pv{position:fixed;inset:0;z-index:100;background:#141416;color:#fff;display:flex;flex-direction:column;user-select:none}
.ds-pv .i{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.ds-pvbar{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top))}
.ds-pv .ds-seg{background:rgba(255,255,255,.1);flex:none}
.ds-pv .ds-seg button{color:#fff;padding:0 12px;gap:6px;font-weight:600;font-size:12.5px}
.ds-pv .ds-seg button[aria-pressed="true"]{background:rgba(255,255,255,.2);box-shadow:none}
.ds-pvn{font-size:13px;color:rgba(255,255,255,.7);font-variant-numeric:tabular-nums}
.ds-pvb{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:999px;height:32px;padding:0 12px;display:flex;align-items:center;gap:6px;font-weight:600;font-size:12.5px}
.ds-pvstage{flex:1;display:flex;align-items:center;justify-content:center;perspective:2400px}
.ds-pvnav{position:absolute;top:50%;width:46px;height:46px;margin-top:-23px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center}
.ds-pvnav.l{left:16px}.ds-pvnav.r{right:16px}
.ds-pvnav .i{width:22px;height:22px}
.ds-book{position:relative;display:flex;width:calc(var(--pw) * 2);height:var(--ph);transform-style:preserve-3d;filter:drop-shadow(0 20px 40px rgba(0,0,0,.5))}
.ds-pvpage{width:var(--pw);height:var(--ph);background:#fff;overflow:hidden;flex:none}
.ds-pvpage img{width:100%;height:100%;display:block;-webkit-user-drag:none}
.ds-pvpage.empty{background:transparent}
.ds-fold{position:absolute;left:50%;top:0;bottom:0;width:60px;margin-left:-30px;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.18) 45%,rgba(0,0,0,.28) 50%,rgba(0,0,0,.12) 55%,rgba(0,0,0,0));pointer-events:none;z-index:3}
.ds-leaf{position:absolute;top:0;width:var(--pw);height:var(--ph);transform-style:preserve-3d;transition:transform .75s cubic-bezier(.45,.05,.25,1);z-index:4}
.ds-leaf.fwd{left:var(--pw);transform-origin:left center}
.ds-leaf.back{left:0;transform-origin:right center}
.ds-leaf.fwd.go{transform:rotateY(-180deg)}
.ds-leaf.back.go{transform:rotateY(180deg)}
.ds-leaf .ds-pvpage{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.ds-leaf .backface{transform:rotateY(180deg)}
.ds-leaf .ds-pvpage.empty{background:#fff}
.ds-slide{position:relative;width:var(--pw);height:var(--ph);filter:drop-shadow(0 20px 40px rgba(0,0,0,.5))}
.ds-slide .ds-pvpage{position:absolute;inset:0}
.ds-slide .fadein{animation:dsfade .5s ease both}
@keyframes dsfade{from{opacity:0}to{opacity:1}}
@media (max-width:900px){.ds-spmode button{padding:0 7px}.ds-pvnav{display:none}.ds-pvbar{flex-wrap:wrap;gap:6px}.ds-pvn{display:none}.ds-pv .ds-seg button,.ds-pvb{font-size:12px;padding:0 9px}.ds-lib{grid-template-columns:repeat(2,1fr)}}
`;

const TABS = [['templates', 'Templates', 'tpl'], ['layouts', 'Layouts', 'layouts'], ['photos', 'Photos', 'photo'], ['styles', 'Styles', 'styles'], ['text', 'Text', 'text'], ['gfx', 'Graphics', 'gfx'], ['bg', 'Background', 'bgi']];
const isNarrow = () => innerWidth <= 900;

export async function openDesign(ctx, o = {}) {
  C = ctx;
  if (UI) { applyOpen(o); return; }
  if (!document.getElementById('dsCss')) { const s = document.createElement('style'); s.id = 'dsCss'; s.textContent = CSS; document.head.appendChild(s); }
  if (!D) { const ok = await restore(); if (!ok) { newDoc(); await saveNow(); } }
  resetHist(); ST.tab = D.photos.length ? 'layouts' : 'photos';
  build(); applyOpen(o);
}
function applyOpen(o) {
  if (!o || !UI) return;
  if (o.tab) { ST.tab = o.tab; if (isNarrow()) { ST.sheet = true; UI.panel.hidden = false; UI.insp.hidden = true; } renderPanel(); }
  const a = o.action; if (!a) return;
  setTimeout(() => { if (a === 'photos') $('[data-file="photos"]').click(); else if (a === 'export') openExport(); else if (a === 'new') openNewDesign(); else if (a === 'library') openLibrary(); else if (a === 'calendar') openCalendarMaker(); else if (a === 'preview') openPreview(); else if (a === 'check') openCheck(); }, 60);
}
function build() {
  const root = document.createElement('div'); root.className = 'ds'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Design studio');
  root.innerHTML = `
  <div class="ds-top">
    <button class="tbtn" data-a="close" aria-label="Back to PDF Mate" title="Back to PDF Mate">${C.icon('close')}</button>
    <button class="tbtn ds-hide-m" data-a="library" title="All your designs">${ic('lib')}<span>Designs</span></button>
    <input class="ds-name" data-a="name" aria-label="Design name" value="${esc(D.name)}">
    <button class="ds-sizebtn" data-a="size" title="Page size"></button>
    <span class="ds-sp"></span>
    <button class="tbtn" data-a="undo" aria-label="Undo" title="Undo (Ctrl+Z)">${C.icon('undo')}</button>
    <button class="tbtn" data-a="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)">${C.icon('redo')}</button>
    <span class="ds-hide-m" style="display:flex;align-items:center"><button class="tbtn" data-a="zout" aria-label="Zoom out">${C.icon('zout')}</button><button class="ds-zoom" data-a="fit" title="Fit page"></button><button class="tbtn" data-a="zin" aria-label="Zoom in">${C.icon('zin')}</button></span>
    <button class="tbtn ds-hide-m" data-a="check" title="Check the design before printing">${ic('chk')}<span>Check</span></button>
    <button class="tbtn ds-hide-m" data-a="preview" title="Preview as a book or slideshow">${ic('eye')}<span>Preview</span></button>
    <button class="tbtn" data-a="more" aria-label="More" title="More">${C.icon('more')}</button>
    <button class="btn primary" data-a="export">${C.icon('download')}<span class="ds-hide-m">Export</span></button>
  </div>
  <div class="ds-main">
    <nav class="ds-rail" role="tablist">${TABS.map(([k, n, i]) => `<button role="tab" data-tab="${k}">${ic(i)}<span>${n}</span></button>`).join('')}</nav>
    <aside class="ds-panel"></aside>
    <div class="ds-stagewrap">
      <div class="ds-stage"><div class="ds-board"><div class="ds-canvasbox"><canvas class="ds-cv"></canvas><div class="ds-ov"></div></div></div></div>
      <div class="ds-mtabs" role="tablist">${TABS.map(([k, n, i]) => `<button role="tab" data-tab="${k}">${ic(i)}<span>${n}</span></button>`).join('')}</div>
    </div>
    <aside class="ds-insp"></aside>
  </div>
  <div class="ds-pages"></div>
  <input type="file" accept="image/*" multiple hidden data-file="photos">
  <input type="file" accept="image/*" hidden data-file="replace">
  <input type="file" accept=".json,application/json" hidden data-file="project">`;
  document.body.appendChild(root);
  UI = { root, stage: $('.ds-stage', root), board: $('.ds-board', root), box: $('.ds-canvasbox', root), cv: $('.ds-cv', root), ov: $('.ds-ov', root), panel: $('.ds-panel', root), insp: $('.ds-insp', root), pages: $('.ds-pages', root) };
  if (isNarrow()) { ST.sheet = false; UI.panel.hidden = true; }
  wire(); refreshAll(); markHist();
  requestAnimationFrame(() => { ST.fit = true; paint(); });
}
function close() {
  endEdit(); exitAdjust(false); commit(); saveNow();
  document.removeEventListener('keydown', onKey, true); removeEventListener('resize', onResize); document.removeEventListener('touchmove', blockTouch, { passive: false });
  closeMenu(); closePreview(); document.querySelectorAll('.ds-modal').forEach((m) => m.remove()); UI.root.remove(); UI = null; ST.sel = null; ST.ms = []; ST.adj = null;
}
function refreshAll() { if (!UI) return; $('[data-a="name"]').value = D.name; markSize(); renderPanel(); renderInsp(); renderPages(); paint(); }
function markSize() { $('[data-a="size"]').innerHTML = esc(sizeLabel()) + ' ▾'; $('[data-a="fit"]').textContent = Math.round(ST.z * 100 / 1.333) + '%'; }

/* ---------- Painting the editor ---------- */
let rq = 0;
function render() { if (rq || !UI) return; rq = requestAnimationFrame(() => { rq = 0; paint(); }); }
function fitZoom() { if (!UI) return; const r = UI.stage.getBoundingClientRect(); const pad = isNarrow() ? 20 : 56; const TW = D.w * viewList().length; ST.z = Math.max(0.1, Math.min((r.width - pad) / TW, (r.height - pad) / D.h)); ST.fit = true; }
function paint() {
  if (!UI || !cur()) return;
  if (ST.fit) fitZoom();
  const vs = viewList(); const TW = D.w * vs.length;
  const z = ST.z, dpr = Math.min(2.5, devicePixelRatio || 1); const cw = Math.round(TW * z), ch = Math.round(D.h * z);
  const cv = UI.cv; const pw = Math.round(cw * dpr), phh = Math.round(ch * dpr);
  if (cv.width !== pw || cv.height !== phh) { cv.width = pw; cv.height = phh; }
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; UI.box.style.width = cw + 'px'; UI.box.style.height = ch + 'px';
  const r = UI.stage.getBoundingClientRect(); const pad = isNarrow() ? 10 : 28; const bw = Math.max(cw + 2 * pad, r.width), bh = Math.max(ch + 2 * pad, r.height);
  UI.board.style.width = bw + 'px'; UI.board.style.height = bh + 'px'; UI.box.style.position = 'absolute'; UI.box.style.left = Math.max(pad, (bw - cw) / 2) + 'px'; UI.box.style.top = Math.max(pad, (bh - ch) / 2) + 'px';
  const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pw, phh);
  const o = { k: z * dpr, ed: true, skip: ST.edit, adj: ST.adj, drop: ST.drag && ST.drag.over };
  for (const v of vs) { x.save(); x.setTransform(z * dpr, 0, 0, z * dpr, v.ox * z * dpr, 0); x.beginPath(); x.rect(0, 0, D.w, D.h); x.clip(); drawPage(x, D.pages[v.i], o); x.restore(); }
  if (vs.length === 2) { x.save(); x.setTransform(z * dpr, 0, 0, z * dpr, 0, 0); const g = x.createLinearGradient(D.w - 14, 0, D.w + 14, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(D.w - 14, 0, 28, D.h); x.restore(); }
  UI.ov.style.width = cw + 'px'; UI.ov.style.height = ch + 'px';
  overlay(); markSize();
}
function overlay() {
  const z = ST.z; let h = ''; const ox = oxOf(D.cur); const vs = viewList();
  const dragging = ST.drag && ST.drag.started && ST.drag.k !== 'pan';
  if (ST.dpi && !ST.edit) for (const v of vs) for (const f of D.pages[v.i].items) { if (f.t !== 'frame' || !f.ph) continue; const d = photoDpi(f); if (d == null || d >= 200) continue; const bb = aabb(f); h += `<div class="ds-dpi ${d < 150 ? 'bad' : 'meh'}" style="left:${(bb.x + v.ox) * z + 4}px;top:${bb.y * z + 4}px" title="${d < 150 ? 'This photo will look blurry when printed at this size' : 'This photo may look a little soft when printed at this size'}">${ic('warn')}${d} dpi</div>`; }
  if (!ST.edit && !(ST.drag && (ST.drag.k === 'photo' || ST.drag.k === 'tray'))) {
    for (const g of gutters(cur())) h += `<div class="ds-gut ${g.ax}" data-gut="${g.i}" style="left:${(g.x + ox) * z}px;top:${g.y * z}px" title="Drag to resize the photos on both sides"></div>`;
  }
  const its = selItems();
  if (its.length > 1 && !ST.edit) {
    for (const it of its) h += `<div class="ds-msel" style="left:${(it.x + ox) * z}px;top:${it.y * z}px;width:${it.w * z}px;height:${(it.h || 10) * z}px;transform:rotate(${it.rot || 0}deg)"></div>`;
    const bb = unionBox(its.map(aabb)); h += `<div class="ds-mbb" style="left:${(bb.x + ox) * z}px;top:${bb.y * z}px;width:${bb.w * z}px;height:${bb.h * z}px"></div>`;
    const grouped = its.every((i) => i.grp && i.grp === its[0].grp); const below = bb.y * z < 44;
    if (!dragging) h += `<div class="ds-fbar" style="left:${clamp((bb.x + ox + bb.w / 2) * z, 120, D.w * vs.length * z - 120)}px;top:${below ? (bb.y + bb.h) * z + 10 : bb.y * z - 36}px${below ? ';transform:translate(-50%,0)' : ''}"><span class="ds-fcount">${its.length} selected</span><button data-fa="${grouped ? 'ungroup' : 'group'}" title="${grouped ? 'Ungroup' : 'Group'} (Ctrl+G)">${ic(grouped ? 'ungroup' : 'group')}</button><button data-fa="alignl" title="Align left">${C.icon('al')}</button><button data-fa="alignc" title="Align centres">${C.icon('ac')}</button><button data-fa="alignt" title="Align tops">${C.icon('at')}</button><button data-fa="dup" title="Duplicate">${C.icon('dup')}</button><button data-fa="del" class="danger" title="Delete">${C.icon('trash')}</button></div>`;
  }
  const it = its.length === 1 ? its[0] : null;
  if (it && !ST.edit) {
    const w = it.w * z, hh = (it.h || 10) * z; const adj = ST.adj === it.id; let hs = '';
    if (!adj && !it.lock) {
      const corners = [['nw', 0, 0], ['ne', 100, 0], ['sw', 0, 100], ['se', 100, 100]]; const sides = it.t === 'text' ? [['w', 0, 50], ['e', 100, 50]] : it.t === 'emoji' ? [] : [['n', 50, 0], ['s', 50, 100], ['w', 0, 50], ['e', 100, 50]];
      hs += corners.map(([d, l, t]) => `<div class="ds-h" data-h="${d}" style="left:${l}%;top:${t}%;cursor:${d}-resize"></div>`).join('');
      hs += sides.map(([d, l, t]) => `<div class="ds-h side${d === 'n' || d === 's' ? ' hz' : ''}" data-h="${d}" style="left:${l}%;top:${t}%;cursor:${d}-resize"></div>`).join('');
      hs += `<div class="ds-h rot" data-h="rot" title="Rotate"></div>`;
      if (it.t === 'frame' && it.ph) hs += `<div class="ds-h mv" data-h="move" style="left:50%;top:50%" title="Move this frame. Drag the photo itself to swap it with another frame">${ic('move')}</div>`;
    }
    if (it.lock) hs += `<div class="ds-lockb">${C.icon('lock')}</div>`;
    h += `<div class="ds-sel${adj ? ' adj' : ''}${it.lock ? ' locked' : ''}" style="left:${(it.x + ox) * z}px;top:${it.y * z}px;width:${w}px;height:${hh}px;transform:rotate(${it.rot || 0}deg)">${hs}</div>`;
    const bb = aabb(it); const below = bb.y * z < 44; const top = below ? (bb.y + bb.h) * z + 10 : bb.y * z - 36; const bx = clamp((bb.x + ox + bb.w / 2) * z, 100, D.w * vs.length * z - 100);
    let fb = '';
    if (adj) fb = `<button data-fa="done">${C.icon('check')} Done</button><button data-fa="zoomout">${C.icon('zout')}</button><button data-fa="zoomin">${C.icon('zin')}</button><button data-fa="reset">Reset</button>`;
    else if (it.lock) fb = `<button data-fa="unlock">${ic('unlock')} Unlock</button>`;
    else if (it.t === 'frame') fb = `${it.ph ? `<button data-fa="adjust" title="Pan and zoom the photo inside the frame">${ic('adjust')} Adjust</button>` : ''}<button data-fa="replace" title="${it.ph ? 'Replace photo' : 'Choose a photo'}">${C.icon('photo')}</button><button data-fa="splith" title="Split into two side by side">${ic('splith')}</button><button data-fa="splitv" title="Split into two stacked">${ic('splitv')}</button><button data-fa="dup" title="Duplicate">${C.icon('dup')}</button><button data-fa="del" class="danger" title="Delete">${C.icon('trash')}</button>`;
    else fb = `${it.t === 'text' ? `<button data-fa="edit">${C.icon('edit')} Edit</button>` : ''}<button data-fa="front" title="Bring to front">${C.icon('front')}</button><button data-fa="dup" title="Duplicate">${C.icon('dup')}</button><button data-fa="del" class="danger" title="Delete">${C.icon('trash')}</button>`;
    if (!dragging) h += `<div class="ds-fbar" style="left:${bx}px;top:${top}px${below ? ';transform:translate(-50%,0)' : ''}">${fb}</div>`;
  }
  if (ST.marq) { const m = ST.marq; h += `<div class="ds-marq" style="left:${Math.min(m.x0, m.x1) * z}px;top:${Math.min(m.y0, m.y1) * z}px;width:${Math.abs(m.x1 - m.x0) * z}px;height:${Math.abs(m.y1 - m.y0) * z}px"></div>`; }
  for (const g of ST.guides) h += g.v != null ? `<div class="ds-guide v" style="left:${(g.v + ox) * z}px"></div>` : `<div class="ds-guide h" style="top:${g.h * z}px"></div>`;
  const ta = UI.ov.querySelector('.ds-ta'); UI.ov.innerHTML = h; if (ta) UI.ov.appendChild(ta);
}
function gutters(pg) {
  const fr = pg.items.filter((i) => i.t === 'frame' && i.cell && !i.rot); if (fr.length < 2) return [];
  const out = []; const E = 0.002; const m = pg.margin, g = pg.gap, X0 = m - g / 2, Y0 = m - g / 2, CH = D.h - 2 * m + g;
  for (const ax of ['v', 'h']) {
    const a = ax === 'v' ? 0 : 1, b = 1 - a; const vals = new Set();
    for (const f of fr) { const e = f.cell[a] + f.cell[a + 2]; if (e > E && e < 1 - E && fr.some((o) => Math.abs(o.cell[a] - e) < E && !!o.sp === !!f.sp)) vals.add(Math.round(e * 1e4) / 1e4); }
    for (const v of vals) {
      const touch = fr.filter((f) => Math.abs(f.cell[a] + f.cell[a + 2] - v) < E || Math.abs(f.cell[a] - v) < E).map((f) => [f.cell[b], f.cell[b] + f.cell[b + 2], f]);
      touch.sort((p, q) => p[0] - q[0]); const segs = [];
      for (const t of touch) { const s = segs[segs.length - 1]; if (s && t[0] < s.e - E) { s.e = Math.max(s.e, t[1]); s.f.push(t[2]); } else segs.push({ s: t[0], e: t[1], f: [t[2]] }); }
      for (const s of segs) {
        const left = s.f.filter((f) => Math.abs(f.cell[a] + f.cell[a + 2] - v) < E), right = s.f.filter((f) => Math.abs(f.cell[a] - v) < E); if (!left.length || !right.length) continue;
        const sp = !!s.f[0].sp; const CW = (sp ? 2 * D.w : D.w) - 2 * m + g; const mid = (s.s + s.e) / 2; const i = out.length;
        out.push({ i, ax, v, sp, left, right, x: ax === 'v' ? X0 + v * CW : X0 + mid * CW, y: ax === 'v' ? Y0 + mid * CH : Y0 + v * CH });
      }
    }
  }
  return out;
}

/* ---------- Hit testing ---------- */
function toCanvas(e) { const r = UI.cv.getBoundingClientRect(); return [(e.clientX - r.left) / ST.z, (e.clientY - r.top) / ST.z]; }
function inItem(it, px, py, tol = 0) { const h = it.h || 10; const cx = it.x + it.w / 2, cy = it.y + h / 2; const a = -(it.rot || 0) * Math.PI / 180; const dx = px - cx, dy = py - cy; const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); return Math.abs(lx) <= it.w / 2 + tol && Math.abs(ly) <= h / 2 + tol; }
function hitAt(cx, cy, filter) {
  const vs = viewList();
  for (let k = vs.length - 1; k >= 0; k--) { const v = vs[k]; const its = D.pages[v.i].items; for (let i = its.length - 1; i >= 0; i--) { const it = its[i]; if (filter && !filter(it)) continue; if (inItem(it, cx - v.ox, cy, 1.5 / ST.z)) return { it, i: v.i, ox: v.ox }; } }
  return null;
}
function pageAt(cx) { const vs = viewList(); return cx >= D.w && vs.length > 1 ? vs[1] : vs[0]; }
function overCanvas(e) { const r = UI.cv.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
function setCur(i) { if (D.cur === i) return; D.cur = i; renderPagesMark(); if (ST.tab === 'layouts' || ST.tab === 'bg') renderPanel(); }

/* ---------- Interaction ---------- */
function wire() {
  const root = UI.root;
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onChange);
  UI.stage.addEventListener('pointerdown', onDown);
  UI.stage.addEventListener('dblclick', onDbl);
  UI.stage.addEventListener('wheel', onWheel, { passive: false });
  UI.panel.addEventListener('pointerdown', onTrayDown);
  root.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); const dz = $('.ds-drop'); if (dz) dz.classList.add('hot'); } });
  root.addEventListener('dragleave', () => { const dz = $('.ds-drop'); if (dz) dz.classList.remove('hot'); });
  root.addEventListener('drop', onFileDrop);
  for (const inp of $$('[data-file]')) inp.addEventListener('change', onFilePick);
  document.addEventListener('keydown', onKey, true); addEventListener('resize', onResize);
  document.addEventListener('touchmove', blockTouch, { passive: false });
}
function blockTouch(e) { if (ST.drag && ST.drag.started) e.preventDefault(); }
let rzT = 0;
function onResize() { clearTimeout(rzT); rzT = setTimeout(() => { if (!UI) return; if (isNarrow() && !ST.sheet) UI.panel.hidden = true; else if (!isNarrow()) { UI.panel.hidden = false; UI.insp.hidden = false; } render(); }, 80); }
function onWheel(e) {
  if (ST.adj) { e.preventDefault(); const f = itemBy(ST.adj); if (f && f.ph) { f.ph.z = clamp((f.ph.z || 1) * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, 6); render(); clearTimeout(ST.wt); ST.wt = setTimeout(commit, 400); } return; }
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(ST.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }
}
function setZoom(z) { ST.fit = false; ST.z = clamp(z, 0.15, 8); paint(); }
function showInsp() { if (isNarrow()) { const any = selIds().length > 0; UI.insp.hidden = !any; if (any) { UI.panel.hidden = true; ST.sheet = false; markTabs(); } } renderInsp(); }
function select(id) { endEdit(); if (ST.adj && ST.adj !== id) exitAdjust(true); ST.sel = id; ST.ms = []; showInsp(); render(); }
function selectMany(ids, primary) { endEdit(); if (ST.adj) exitAdjust(true); ids = [...new Set(ids)]; if (ids.length <= 1) { select(ids[0] || null); return; } ST.ms = ids; ST.sel = primary || ids[0]; showInsp(); render(); }
const groupIds = (pg, g) => pg.items.filter((i) => i.grp === g).map((i) => i.id);
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function onDown(e) {
  if (e.button > 0) return;
  if (e.target.closest('.ds-fbar') || e.target.closest('.ds-ta')) return;
  const [cx, cy] = toCanvas(e);
  if (ST.edit) endEdit();
  const hEl = e.target.closest('[data-h]'), gEl = e.target.closest('[data-gut]');
  const base = { x0: e.clientX, y0: e.clientY, px: cx, py: cy, started: false };
  if (gEl) { const g = gutters(cur())[+gEl.dataset.gut]; if (!g) return; ST.drag = { ...base, k: 'gut', g, ox: oxOf(D.cur), snap: g.left.concat(g.right).map((f) => ({ f, c: f.cell.slice() })), started: true }; capture(e); return; }
  const it = selItem();
  if (hEl && it && !it.lock) {
    const d = hEl.dataset.h; const h0 = it.h || 10; const ox = oxOf(D.cur);
    if (d === 'rot') ST.drag = { ...base, k: 'rot', it, cx: it.x + ox + it.w / 2, cy: it.y + h0 / 2, r0: it.rot || 0, a0: Math.atan2(cy - (it.y + h0 / 2), cx - (it.x + ox + it.w / 2)), started: true };
    else if (d === 'move') ST.drag = { ...base, k: 'move', its: [it], org: [[it.x, it.y]], started: true };
    else ST.drag = { ...base, k: 'size', it, d, g0: { x: it.x, y: it.y, w: it.w, h: h0, size: it.size }, started: true };
    capture(e); return;
  }
  if (ST.adj) { const f = itemBy(ST.adj); const ox = f ? oxOf(pageIdxOf(f)) : 0; if (f && inItem(f, cx - ox, cy)) { ST.drag = { ...base, k: 'pan', it: f, fx: f.ph.fx ?? 0.5, fy: f.ph.fy ?? 0.5, started: true }; capture(e); UI.stage.style.cursor = 'grabbing'; return; } exitAdjust(true); }
  const h = hitAt(cx, cy); const add = e.shiftKey || e.ctrlKey || e.metaKey;
  if (!h) {
    if (overCanvas(e)) { const v = pageAt(cx); if (!add) { setCur(v.i); select(null); } ST.drag = { ...base, k: 'marq', ox: v.ox, page: v.i, add, prev: add ? selIds().slice() : [] }; ST.marq = null; capture(e); }
    else if (!add) select(null);
    return;
  }
  const t = h.it; const pg = D.pages[h.i];
  if (add) { if (h.i !== D.cur && selIds().length) { C.toast('Select items on one page at a time'); return; } setCur(h.i); const ids = selIds().slice(); const tg = t.grp ? groupIds(pg, t.grp) : [t.id]; const on = tg.every((id) => ids.includes(id)); selectMany(on ? ids.filter((id) => !tg.includes(id)) : ids.concat(tg), t.id); return; }
  setCur(h.i);
  const cs = selIds(); const grp = t.grp ? groupIds(pg, t.grp) : null;
  if (cs.length > 1 && cs.includes(t.id) && !(grp && sameSet(cs, grp))) { /* keep the current multi selection and drag it */ }
  else if (grp && cs.length > 1 && sameSet(cs, grp)) { select(t.id); }
  else if (grp) { selectMany(grp, t.id); }
  else if (ST.sel !== t.id || cs.length > 1) select(t.id);
  const sel = selItems();
  if (sel.length > 1) ST.drag = { ...base, k: 'move', its: sel.filter((i) => !i.lock), org: sel.filter((i) => !i.lock).map((i) => [i.x, i.y]), multi: true };
  else if (t.lock) ST.drag = null;
  else if (t.t === 'frame' && t.ph) ST.drag = { ...base, k: 'photo', it: t };
  else ST.drag = { ...base, k: 'move', its: [t], org: [[t.x, t.y]] };
  if (ST.drag) capture(e); else C.toast('This item is locked. Unlock it in the panel to move it');
}
function capture(e) { try { UI.stage.setPointerCapture(e.pointerId); } catch (er) {} UI.stage.addEventListener('pointermove', onMove); UI.stage.addEventListener('pointerup', onUp); UI.stage.addEventListener('pointercancel', onUp); }
function release() { UI.stage.removeEventListener('pointermove', onMove); UI.stage.removeEventListener('pointerup', onUp); UI.stage.removeEventListener('pointercancel', onUp); UI.stage.style.cursor = ''; }
function onMove(e) {
  const d = ST.drag; if (!d) return; const [px, py] = toCanvas(e);
  if (!d.started) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return; d.started = true; if (d.k === 'photo') { ghost(PH.get(d.it.ph.id)); render(); } }
  const it = d.it; const dx = px - d.px, dy = py - d.py;
  if (d.k === 'move') {
    for (const i of d.its) { if (i.cell) delete i.cell; if (i.tpl) delete i.tpl; }
    let mx = dx, my = dy; ST.guides = [];
    if (!e.altKey && d.its.every((i) => !i.rot)) { const bb = unionBox(d.its.map((i, k) => ({ x: d.org[k][0], y: d.org[k][1], w: i.w, h: i.h || 10 }))); const s = snapMove(d.its, bb.x + dx, bb.y + dy, bb.w, bb.h); mx = s.x - bb.x; my = s.y - bb.y; ST.guides = s.g; }
    d.its.forEach((i, k) => { i.x = d.org[k][0] + mx; i.y = d.org[k][1] + my; }); render();
  } else if (d.k === 'size') { resizeTo(d, px, py, e.shiftKey); render(); }
  else if (d.k === 'rot') { let a = d.r0 + (Math.atan2(py - d.cy, px - d.cx) - d.a0) * 180 / Math.PI; a = ((a + 540) % 360) - 180; if (e.shiftKey) a = Math.round(a / 15) * 15; else for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(a - s) < 3) a = s; it.rot = Math.round(a * 10) / 10; if (it.cell && it.t === 'frame') delete it.cell; render(); }
  else if (d.k === 'pan') { const ph = PH.get(it.ph.id); const { iw, ih } = innerBox(it); const R = coverRect(iw, ih, ph.w, ph.h, it.ph.z); const a = -(it.rot || 0) * Math.PI / 180; const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); it.ph.fx = R.w - iw > 0.5 ? clamp(d.fx - lx / (R.w - iw), 0, 1) : 0.5; it.ph.fy = R.h - ih > 0.5 ? clamp(d.fy - ly / (R.h - ih), 0, 1) : 0.5; render(); }
  else if (d.k === 'gut') {
    const g = d.g; const pg = cur(); const m = pg.margin, gp = pg.gap; const X0 = m - gp / 2, CW = (g.sp ? 2 * D.w : D.w) - 2 * m + gp, CH = D.h - 2 * m + gp;
    const v = g.ax === 'v' ? (px - d.ox - X0) / CW : (py - X0) / CH; const a = g.ax === 'v' ? 0 : 1; const MIN = 0.06;
    let lo = -Infinity, hi = Infinity; for (const s of d.snap) { if (g.left.includes(s.f)) lo = Math.max(lo, s.c[a] + MIN); if (g.right.includes(s.f)) hi = Math.min(hi, s.c[a] + s.c[a + 2] - MIN); }
    const nv = clamp(v, lo, hi);
    for (const s of d.snap) { const c = s.f.cell; if (g.left.includes(s.f)) c[a + 2] = nv - s.c[a]; if (g.right.includes(s.f)) { c[a] = nv; c[a + 2] = s.c[a] + s.c[a + 2] - nv; } }
    reflow(pg); render();
  } else if (d.k === 'marq') { ST.marq = { x0: d.px - d.ox, y0: d.py, x1: px - d.ox, y1: py }; render(); }
  else if (d.k === 'photo') { moveGhost(e); const h = overCanvas(e) ? hitAt(px, py, (i) => i.t === 'frame') : null; const oid = h && h.it.id !== it.id ? h.it.id : null; if (oid !== d.over) { d.over = oid; render(); } }
}
function onUp(e) {
  const d = ST.drag; release(); ST.drag = null; ST.guides = []; killGhost(); if (!d) return;
  if (d.k === 'marq') { const m = ST.marq; ST.marq = null; if (m && d.started) { const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1), y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1); const pg = D.pages[d.page]; const ids = []; for (const it of pg.items) { const b = aabb(it); if (b.x < x1 && b.x + b.w > x0 && b.y < y1 && b.y + b.h > y0) ids.push(...(it.grp ? groupIds(pg, it.grp) : [it.id])); } setCur(d.page); selectMany(d.prev.concat(ids)); } render(); return; }
  if (d.k === 'photo') {
    if (!d.started) { render(); return; }
    const [px, py] = toCanvas(e); const h = overCanvas(e) ? hitAt(px, py, (i) => i.t === 'frame') : null; const tgt = h && h.it;
    const overTray = !!document.elementFromPoint(e.clientX, e.clientY)?.closest('.ds-panel');
    if (tgt && tgt.id !== d.it.id) { const a = d.it.ph; d.it.ph = tgt.ph; tgt.ph = a; for (const f of [tgt, d.it]) if (f.ph) Object.assign(f.ph, { fx: 0.5, fy: 0.5, z: 1 }); setCur(h.i); ST.sel = tgt.id; ST.ms = []; C.toast(d.it.ph ? 'Photos swapped' : 'Photo moved'); commit(); refreshLite(); }
    else if (overTray) { d.it.ph = null; commit(); refreshLite(); C.toast('Photo taken out of the frame'); }
    render(); return;
  }
  if (d.k === 'move' && d.started && D.spread) rehome(d.its);
  if (d.started) commit();
  renderInsp(); render();
}
// In spreads, an item dragged mostly onto the facing page moves to that page.
function rehome(its) {
  for (const it of its) { const i = pageIdxOf(it); const p = partner(i); if (!p) continue; const c = it.x + it.w / 2; if ((p.dx > 0 && c > D.w) || (p.dx < 0 && c < 0)) { const pg = D.pages[i]; pg.items.splice(pg.items.indexOf(it), 1); it.x -= p.dx; delete it.cell; D.pages[p.j].items.push(it); if (selIds().includes(it.id)) D.cur = p.j; } }
}
function snapMove(its, nx, ny, w, h) {
  const T = 5 / ST.z; const W = D.w, H = D.h, m = cur().margin;
  const xs = [0, W / 2, W, m, W - m], ys = [0, H / 2, H, m, H - m];
  for (const o of cur().items) { if (its.includes(o) || o.rot) continue; xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + (o.h || 10) / 2, o.y + (o.h || 10)); }
  let bx = null, by = null; const g = [];
  for (const off of [0, w / 2, w]) for (const c of xs) { const dd = c - (nx + off); if (Math.abs(dd) < T && (bx == null || Math.abs(dd) < Math.abs(bx.d))) bx = { d: dd, c }; }
  for (const off of [0, h / 2, h]) for (const c of ys) { const dd = c - (ny + off); if (Math.abs(dd) < T && (by == null || Math.abs(dd) < Math.abs(by.d))) by = { d: dd, c }; }
  if (bx) { nx += bx.d; g.push({ v: bx.c }); } if (by) { ny += by.d; g.push({ h: by.c }); }
  return { x: nx, y: ny, g };
}
function resizeTo(d, px, py, shift) {
  const it = d.it, g0 = d.g0; const dir = d.d; const hx = dir.includes('e') ? 1 : dir.includes('w') ? -1 : 0, hy = dir.includes('s') ? 1 : dir.includes('n') ? -1 : 0;
  const a = (it.rot || 0) * Math.PI / 180; const dx = px - d.px, dy = py - d.py; const lx = dx * Math.cos(-a) - dy * Math.sin(-a), ly = dx * Math.sin(-a) + dy * Math.cos(-a);
  let w = g0.w + hx * lx, h = g0.h + hy * ly; const MIN = 8;
  const keep = it.t === 'emoji' || (it.t === 'gfx' && !shift && hx && hy) || (it.t === 'frame' && shift && hx && hy) || (it.t === 'text' && hx && hy);
  if (keep) { const k = Math.max(MIN / g0.w, Math.abs(hx) ? w / g0.w : h / g0.h); w = g0.w * k; h = g0.h * k; }
  w = Math.max(MIN, w); h = Math.max(MIN, h);
  if (it.t === 'text') { if (hx && hy) it.size = Math.max(4, +(g0.size * w / g0.w).toFixed(1)); h = g0.h * (hx && hy ? w / g0.w : 1); }
  const cx0 = g0.x + g0.w / 2, cy0 = g0.y + g0.h / 2; const sx = hx * (w - g0.w) / 2, sy = hy * (h - g0.h) / 2;
  const cx = cx0 + sx * Math.cos(a) - sy * Math.sin(a), cy = cy0 + sx * Math.sin(a) + sy * Math.cos(a);
  it.w = w; if (it.t !== 'text') it.h = h; it.x = cx - w / 2; it.y = cy - h / 2;
  if (it.cell) delete it.cell; if (it.tpl) delete it.tpl;
}
function onDbl(e) { const [cx, cy] = toCanvas(e); const h = hitAt(cx, cy); if (!h) return; const t = h.it; setCur(h.i); select(t.id); if (t.lock) return; if (t.t === 'frame' && t.ph) enterAdjust(t); else if (t.t === 'frame') pickReplace(); else if (t.t === 'text') startEdit(t); else if (t.t === 'cal') openEvents(); }
function enterAdjust(f) { ST.adj = f.id; ST.sel = f.id; ST.ms = []; UI.stage.classList.add('adj'); renderInsp(); render(); C.toast('Drag to move the photo in its frame. Scroll or use the zoom buttons to zoom'); }
function exitAdjust(doCommit) { if (!ST.adj) return; ST.adj = null; if (UI) UI.stage.classList.remove('adj'); if (doCommit) commit(); if (UI) { renderInsp(); render(); } }

/* Text editing in place */
function startEdit(t) {
  endEdit(); ST.edit = t.id; ST.sel = t.id; ST.ms = []; const z = ST.z; const ox = oxOf(pageIdxOf(t));
  const ta = document.createElement('textarea'); ta.className = 'ds-ta'; ta.value = t.text; ta.spellcheck = true; ta.lang = 'en';
  const h = Math.max(t.h || t.size * 1.3, t.size * 1.3);
  Object.assign(ta.style, { left: (t.x + ox) * z + 'px', top: t.y * z + 'px', width: t.w * z + 'px', height: (h + t.size) * z + 'px', font: `${t.ital ? 'italic ' : ''}${t.bold ? 700 : 400} ${t.size * z}px ${fontStack(t.font)}`, lineHeight: (t.lh || 1.2), color: t.col, textAlign: t.align, letterSpacing: (t.ls || 0) * t.size * z + 'px', textTransform: t.upper ? 'uppercase' : 'none', transform: `rotate(${t.rot || 0}deg)` });
  ta.addEventListener('input', () => { t.text = ta.value; const ins = $('.ds-insp [data-p="text"]'); if (ins) ins.value = ta.value; });
  UI.ov.appendChild(ta); render(); setTimeout(() => { ta.focus(); ta.select(); }, 20);
}
function endEdit() { if (!ST.edit) return; ST.edit = null; const ta = UI && UI.ov.querySelector('.ds-ta'); if (ta) ta.remove(); commit(); if (UI) render(); }

/* Ghost for photo drags */
let ghostEl = null;
function ghost(ph) { killGhost(); if (!ph) return; ghostEl = document.createElement('div'); ghostEl.className = 'ds-ghost'; ghostEl.innerHTML = `<img src="${ph.url}" alt="">`; document.body.appendChild(ghostEl); }
function moveGhost(e) { if (ghostEl) { ghostEl.style.left = e.clientX + 'px'; ghostEl.style.top = e.clientY + 'px'; } }
function killGhost() { if (ghostEl) { ghostEl.remove(); ghostEl = null; } }

/* Dragging from the photo tray */
function onTrayDown(e) {
  const t = e.target.closest('.ds-ph[data-ph]'); if (!t || e.target.closest('.x') || e.button > 0) return;
  const id = t.dataset.ph; const d = { k: 'tray', phId: id, x0: e.clientX, y0: e.clientY, started: false, touch: e.pointerType === 'touch' };
  let holdOk = !d.touch; const holdT = d.touch ? setTimeout(() => { holdOk = true; if (!d.started) { d.started = true; ST.drag = d; ghost(PH.get(id)); moveGhost(e); } }, 260) : 0;
  const move = (ev) => {
    if (!d.started) { if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 6) return; if (!holdOk) { clearTimeout(holdT); cleanup(); return; } d.started = true; ST.drag = d; ghost(PH.get(id)); }
    moveGhost(ev); const [px, py] = toCanvas(ev); const h = overCanvas(ev) ? hitAt(px, py, (i) => i.t === 'frame') : null; const oid = h ? h.it.id : null; if (oid !== d.over) { d.over = oid; render(); }
  };
  const up = (ev) => {
    clearTimeout(holdT); cleanup(); killGhost(); ST.drag = null;
    if (!d.started) { if (ev.type === 'pointerup') placeSmart(id); return; }
    if (overCanvas(ev)) { const [px, py] = toCanvas(ev); const h = hitAt(px, py, (i) => i.t === 'frame'); if (h) { setCur(h.i); h.it.ph = newPh(id); select(h.it.id); } else { const v = pageAt(px); setCur(v.i); addFrameAt(id, px - v.ox, py); } commit(); refreshLite(); }
    render();
  };
  const cleanup = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
function placeSmart(id) {
  const pg = cur(); const s = selItem();
  const f = s && s.t === 'frame' ? s : pg.items.find((i) => i.t === 'frame' && !i.ph);
  if (f) { f.ph = newPh(id); ST.sel = f.id; ST.ms = []; } else addFrameAt(id, D.w / 2, D.h / 2);
  commit(); refreshLite(); render();
}
function addFrameAt(id, px, py) {
  const ph = PH.get(id); const fs = frameStyle(cur()); const mx = Math.min(D.w, D.h) * 0.42; const ar = ph ? ph.w / ph.h : 1.3;
  const w = ar >= 1 ? mx : mx * ar, h = ar >= 1 ? mx / ar : mx;
  const f = { t: 'frame', id: uidd('f'), x: clamp(px - w / 2, 0, D.w - w), y: clamp(py - h / 2, 0, D.h - h), w, h, shape: 'rect', rot: 0, ...fs, op: 1, ph: id ? newPh(id) : null };
  cur().items.push(f); ST.sel = f.id; ST.ms = []; return f;
}
function refreshLite() { renderInsp(); if (ST.tab === 'photos' || ST.tab === 'bg') renderPanel(); }

/* Files */
async function onFileDrop(e) {
  const files = [...(e.dataTransfer?.files || [])]; if (!files.length) return; e.preventDefault(); const dz = $('.ds-drop'); if (dz) dz.classList.remove('hot');
  if (files.length === 1 && /json$/i.test(files[0].name)) { openProject(files[0]); return; }
  const ids = await addPhotoFiles(files); if (!ids.length) return;
  if (overCanvas(e)) { const [px, py] = toCanvas(e); const h = hitAt(px, py, (i) => i.t === 'frame'); if (h) { setCur(h.i); h.it.ph = newPh(ids[0]); ST.sel = h.it.id; ids.shift(); } }
  for (const id of ids) { const f = cur().items.find((i) => i.t === 'frame' && !i.ph); if (!f) break; f.ph = newPh(id); }
  commit(); ST.tab = 'photos'; refreshAll(); C.toast(`${files.length} photo${files.length > 1 ? 's' : ''} added. Drag them into frames or use Auto-fill`);
}
let replaceTarget = null;
function pickReplace() { const f = selItem(); replaceTarget = f && f.t === 'frame' ? f.id : null; $('[data-file="replace"]').click(); }
async function onFilePick(e) {
  const inp = e.target; const files = [...inp.files]; inp.value = ''; if (!files.length) return; const kind = inp.dataset.file;
  if (kind === 'project') { openProject(files[0]); return; }
  const ids = await addPhotoFiles(files); if (!ids.length) return;
  if (kind === 'replace') { const f = itemBy(replaceTarget); if (f) { f.ph = newPh(ids[0]); ST.sel = f.id; ST.ms = []; } commit(); refreshAll(); return; }
  for (const id of ids) { const f = cur().items.find((i) => i.t === 'frame' && !i.ph); if (!f) break; f.ph = newPh(id); }
  commit(); refreshAll(); C.toast(`${ids.length} photo${ids.length > 1 ? 's' : ''} added`);
}

/* Keyboard */
function onKey(e) {
  if (!UI) return;
  if (document.querySelector('.ds-pv')) return;
  if (document.querySelector('.ds-modal')) { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.stopPropagation(); return; }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (menuEl) closeMenu(); else if (ST.edit) endEdit(); else if (ST.adj) exitAdjust(true); else if (selIds().length) select(null); else close(); return; }
  if (typing) return;
  e.stopPropagation();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 'a') { e.preventDefault(); selectMany(cur().items.map((i) => i.id)); return; }
  if (mod && k === 'c') { if (copySel()) e.preventDefault(); return; }
  if (mod && k === 'x') { if (copySel()) { e.preventDefault(); act('del'); } return; }
  if (mod && k === 'v') { e.preventDefault(); pasteClip(); return; }
  if (mod && k === 'g') { e.preventDefault(); act(e.shiftKey ? 'ungroup' : 'group'); return; }
  if (mod && k === 'l') { e.preventDefault(); act('lock'); return; }
  const its = selItems(); const it = selItem();
  if (mod && k === 'd' && its.length) { e.preventDefault(); act('dup'); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && its.length) { e.preventDefault(); act('del'); return; }
  if (e.key === 'Enter' && it) { e.preventDefault(); if (ST.adj) exitAdjust(true); else if (it.t === 'text') startEdit(it); else if (it.t === 'frame' && it.ph) enterAdjust(it); return; }
  if (its.length && e.key.startsWith('Arrow')) { e.preventDefault(); const s = e.shiftKey ? 10 : 1; for (const i of its) { if (i.lock) continue; if (i.cell) delete i.cell; if (e.key === 'ArrowLeft') i.x -= s; if (e.key === 'ArrowRight') i.x += s; if (e.key === 'ArrowUp') i.y -= s; if (e.key === 'ArrowDown') i.y += s; } render(); clearTimeout(ST.kt); ST.kt = setTimeout(commit, 350); return; }
  if (e.key === 'PageDown') { e.preventDefault(); goPage(viewList().slice(-1)[0].i + 1); } else if (e.key === 'PageUp') { e.preventDefault(); goPage(viewList()[0].i - 1); }
  else if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(ST.z * 1.2); } else if (mod && e.key === '-') { e.preventDefault(); setZoom(ST.z / 1.2); } else if (mod && e.key === '0') { e.preventDefault(); ST.fit = true; paint(); }
}
function copySel() { const its = selItems(); if (!its.length) return false; CLIP = clone(its); C.toast(`Copied ${its.length} item${its.length > 1 ? 's' : ''}. Paste on any page with Ctrl+V`); return true; }
function pasteClip() {
  if (!CLIP || !CLIP.length) { C.toast('Nothing copied yet'); return; }
  const pg = cur(); const gm = {}; const ids = []; const same = CLIP.some((c) => pg.items.some((i) => Math.abs(i.x - c.x) < 0.5 && Math.abs(i.y - c.y) < 0.5));
  for (const c0 of CLIP) { const c = clone(c0); c.id = uidd(c.t[0]); delete c.cell; delete c.tpl; if (c.grp) c.grp = gm[c.grp] || (gm[c.grp] = uidd('g')); if (same) { c.x += 12; c.y += 12; } pg.items.push(c); ids.push(c.id); }
  CLIP = CLIP.map((c) => same ? { ...c, x: c.x + 12, y: c.y + 12 } : c);
  selectMany(ids); commit(); C.toast(`Pasted ${ids.length} item${ids.length > 1 ? 's' : ''}`);
}

/* ---------- Clicks and inputs ---------- */
function onClick(e) {
  const b = e.target.closest('button,[data-tab]'); if (!b || !UI.root.contains(b)) return;
  if (b.dataset.tab) { const k = b.dataset.tab; if (isNarrow()) { if (ST.tab === k && ST.sheet) { ST.sheet = false; UI.panel.hidden = true; } else { ST.tab = k; ST.sheet = true; UI.panel.hidden = false; UI.insp.hidden = true; } } else ST.tab = k; renderPanel(); markTabs(); return; }
  const a = b.dataset.a; if (a) { topAct(a, b); return; }
  if (b.dataset.fa) { fbarAct(b.dataset.fa); return; }
  if (b.dataset.act) { act(b.dataset.act, b); return; }
  if (b.dataset.lay) { const L = LMAP[b.dataset.lay]; if (L.spread) { if (applySpreadLayout(L.k)) { ST.sel = null; ST.ms = []; commit(); refreshAll(); C.toast(L.n); } return; } const left = applyLayout(cur(), L.k); ST.sel = null; ST.ms = []; commit(); refreshAll(); C.toast(left > 0 ? `${L.n}. ${left} photo${left > 1 ? 's' : ''} did not fit and stay in Photos` : L.n); return; }
  if (b.dataset.lf) { ST.lf = b.dataset.lf; renderPanel(); return; }
  if (b.dataset.tc) { ST.tcat = b.dataset.tc; renderPanel(); return; }
  if (b.dataset.tplk) { useTemplate(b.dataset.tplk); return; }
  if (b.dataset.style) { applyStyle(SMAP[b.dataset.style], ST.all ? D.pages : [cur()]); commit(); refreshAll(); C.toast(`${SMAP[b.dataset.style].n} on ${ST.all ? 'all pages' : 'this page'}`); return; }
  if (b.dataset.tpre) { addText(b.dataset.tpre); return; }
  if (b.dataset.gfx) { addGfx(b.dataset.gfx); return; }
  if (b.dataset.gcat) { ST.gfxCat = b.dataset.gcat; renderPanel(); return; }
  if (b.dataset.emo) { addEmoji(b.dataset.emo); return; }
  if (b.dataset.bgc) { setBg({ t: 'color', c: b.dataset.bgc }); return; }
  if (b.dataset.grad) { const [c1, c2] = b.dataset.grad.split(','); setBg({ t: 'grad', c: c1, c2, a: cur().bg.t === 'grad' ? cur().bg.a ?? 135 : 135 }); return; }
  if (b.dataset.pat) { const bg = cur().bg; setBg({ t: 'pattern', p: b.dataset.pat, c: bg.t === 'pattern' || bg.t === 'color' ? bg.c : '#ffffff', c2: bg.t === 'pattern' ? bg.c2 : '#d8dde6', s: bg.s || 14 }); return; }
  if (b.dataset.bgph) { setBg({ t: 'photo', ph: b.dataset.bgph, blur: 0, dim: 0.15, c: '#000000' }); return; }
  if (b.dataset.shape) { const f = selItem(); if (f) { f.shape = b.dataset.shape; commit(); renderInsp(); render(); } return; }
  if (b.dataset.flt) { const f = selItem(); if (f && f.ph) { f.ph.flt = b.dataset.flt; commit(); renderInsp(); render(); } return; }
  if (b.dataset.col) { const p = b.dataset.colp; for (const it of selItems()) it[p] = b.dataset.col; commit(); renderInsp(); render(); return; }
  if (b.dataset.align) { const it = selItem(); if (it) { it.align = b.dataset.align; commit(); renderInsp(); render(); } return; }
  if (b.dataset.tog) { const it = selItem(); if (it) { it[b.dataset.tog] = !it[b.dataset.tog]; commit(); renderInsp(); render(); } return; }
  if (b.dataset.setv) { const it = selItem(); if (it) { const [k, v] = b.dataset.setv.split(':'); it[k] = isNaN(+v) ? v : +v; commit(); renderInsp(); render(); } return; }
  if (b.dataset.pg != null) { goPage(+b.dataset.pg); return; }
  if (b.dataset.phx) { removePhoto(b.dataset.phx); return; }
}
function markTabs() { for (const t of $$('[data-tab]')) t.setAttribute('aria-selected', String(t.dataset.tab === ST.tab && (!isNarrow() || ST.sheet))); }
function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
function onInput(e) {
  const el = e.target; const it = selItem();
  if (el.dataset.a === 'name') { D.name = el.value; scheduleSave(); return; }
  if (el.dataset.p && it) { const p = el.dataset.p; it[p] = el.type === 'range' || el.type === 'number' ? num(el.value) : el.value; if (p === 'text' && ST.edit) { const ta = UI.ov.querySelector('.ds-ta'); if (ta) ta.value = el.value; } const v = el.parentElement.querySelector('.val'); if (v) v.textContent = fmtVal(p, it[p]); render(); return; }
  if (el.dataset.p && ST.ms.length > 1) { const p = el.dataset.p; for (const i of selItems()) i[p] = el.type === 'range' ? num(el.value) : el.value; render(); return; }
  if (el.dataset.php && it && it.ph) { it.ph[el.dataset.php] = num(el.value); render(); return; }
  if (el.dataset.pp) { const pg = cur(); const p = el.dataset.pp; pg[p] = num(el.value); reflow(pg); const v = el.parentElement.querySelector('.val'); if (v) v.textContent = Math.round(pg[p] / PT * 10) / 10 + ' mm'; render(); return; }
  if (el.dataset.bgp) { const bg = cur().bg; bg[el.dataset.bgp] = el.type === 'range' ? num(el.value) : el.value; render(); return; }
}
function onChange(e) {
  const el = e.target;
  if (el.dataset.p || el.dataset.php || el.dataset.pp || el.dataset.bgp) { commit(); if (el.tagName === 'SELECT' || el.type === 'color' || el.type === 'number') renderInsp(); if (el.dataset.bgp && el.type === 'color') renderPanel(); thumbsSoon(); return; }
  if (el.dataset.all != null) { ST.all = el.checked; return; }
  if (el.dataset.dpi != null) { ST.dpi = el.checked; render(); return; }
  if (el.dataset.a === 'name') commit();
}
function fmtVal(p, v) { if (p === 'rot') return Math.round(v) + '°'; if (p === 'op' || p === 'shadow') return Math.round(v * 100) + '%'; if (p === 'ls') return Math.round(v * 100) / 100; if (p === 'lh') return (+v).toFixed(2); return Math.round(v * 10) / 10; }

function topAct(a, b) {
  if (a === 'close') close(); else if (a === 'undo') undo(); else if (a === 'redo') redo();
  else if (a === 'zin') setZoom(ST.z * 1.2); else if (a === 'zout') setZoom(ST.z / 1.2); else if (a === 'fit') { ST.fit = true; paint(); }
  else if (a === 'size') sizeMenu(b); else if (a === 'more') moreMenu(b); else if (a === 'export') openExport();
  else if (a === 'library') openLibrary(); else if (a === 'preview') openPreview(); else if (a === 'check') openCheck();
}
function fbarAct(k) {
  const it = selItem();
  if (['group', 'ungroup', 'alignl', 'alignc', 'alignt', 'dup', 'del', 'unlock'].includes(k)) { if (k.startsWith('align')) alignSel({ alignl: 'l', alignc: 'c', alignt: 't' }[k]); else act(k === 'unlock' ? 'lock' : k); return; }
  if (!it) return;
  if (k === 'adjust') enterAdjust(it); else if (k === 'done') exitAdjust(true);
  else if (k === 'zoomin' || k === 'zoomout') { it.ph.z = clamp((it.ph.z || 1) * (k === 'zoomin' ? 1.15 : 1 / 1.15), 1, 6); commit(); render(); }
  else if (k === 'reset') { Object.assign(it.ph, { z: 1, fx: 0.5, fy: 0.5 }); commit(); render(); }
  else if (k === 'replace') pickReplace(); else if (k === 'edit') startEdit(it);
  else act(k);
}
function alignSel(mode) {
  const its = selItems().filter((i) => !i.lock); if (!its.length) return;
  const box = its.length > 1 ? unionBox(its.map(aabb)) : { x: 0, y: 0, w: D.w, h: D.h };
  for (const it of its) { const b = aabb(it); let dx = 0, dy = 0; if (mode === 'l') dx = box.x - b.x; if (mode === 'c') dx = box.x + box.w / 2 - (b.x + b.w / 2); if (mode === 'r') dx = box.x + box.w - (b.x + b.w); if (mode === 't') dy = box.y - b.y; if (mode === 'm') dy = box.y + box.h / 2 - (b.y + b.h / 2); if (mode === 'b') dy = box.y + box.h - (b.y + b.h); it.x += dx; it.y += dy; delete it.cell; delete it.tpl; }
  commit(); render(); C.toast(its.length > 1 ? 'Aligned' : 'Aligned to the page');
}
function distribute(ax) {
  const its = selItems().filter((i) => !i.lock); if (its.length < 3) { C.toast('Select three or more items to space them evenly'); return; }
  const k = ax === 'h' ? ['x', 'w'] : ['y', 'h']; const bs = its.map((it) => ({ it, b: aabb(it) })).sort((p, q) => p.b[k[0]] - q.b[k[0]]);
  const start = bs[0].b[k[0]], end = bs[bs.length - 1].b[k[0]] + bs[bs.length - 1].b[k[1]]; const sum = bs.reduce((s, p) => s + p.b[k[1]], 0); const gap = (end - start - sum) / (bs.length - 1);
  let pos = start; for (const p of bs) { p.it[k[0]] += pos - p.b[k[0]]; delete p.it.cell; pos += p.b[k[1]] + gap; }
  commit(); render(); C.toast('Spaced evenly');
}
function act(k, b) {
  const pg = cur(); const it = selItem(); const its = selItems();
  if (k === 'dup' && its.length) { const gm = {}; const ids = []; for (const s of its) { const c = clone(s); c.id = uidd(s.t[0]); delete c.cell; delete c.tpl; if (c.grp) c.grp = gm[c.grp] || (gm[c.grp] = uidd('g')); c.x += 12; c.y += 12; pg.items.push(c); ids.push(c.id); } selectMany(ids); commit(); return; }
  if (k === 'del' && its.length) { const lockd = its.filter((i) => i.lock).length; for (const s of its) if (!s.lock) pg.items.splice(pg.items.indexOf(s), 1); ST.sel = null; ST.ms = []; ST.adj = null; commit(); refreshLite(); render(); if (lockd) C.toast('Locked items were kept. Unlock them first'); return; }
  if (k === 'front' && its.length) { for (const s of its) { pg.items.splice(pg.items.indexOf(s), 1); pg.items.push(s); } commit(); render(); return; }
  if (k === 'back' && its.length) { for (const s of its.slice().reverse()) { pg.items.splice(pg.items.indexOf(s), 1); pg.items.unshift(s); } commit(); render(); return; }
  if (k === 'group') { if (its.length < 2) { C.toast('Select two or more items to group them'); return; } const g = uidd('g'); for (const s of its) s.grp = g; commit(); renderInsp(); render(); C.toast('Grouped. Click once to pick the group, again to pick one item'); return; }
  if (k === 'ungroup') { if (!its.some((s) => s.grp)) return; for (const s of its) delete s.grp; commit(); renderInsp(); render(); C.toast('Ungrouped'); return; }
  if (k === 'lock' && its.length) { const on = !its.every((s) => s.lock); for (const s of its) { if (on) s.lock = true; else delete s.lock; } commit(); renderInsp(); render(); C.toast(on ? 'Locked in place' : 'Unlocked'); return; }
  if (k.startsWith('al-')) { alignSel(k.slice(3)); return; }
  if (k === 'dist-h' || k === 'dist-v') { distribute(k.slice(5)); return; }
  if ((k === 'splith' || k === 'splitv') && it && it.t === 'frame') { splitFrame(it, k === 'splith'); return; }
  if (k === 'rmphoto' && it && it.ph) { it.ph = null; commit(); refreshLite(); render(); return; }
  if (k === 'flip' && it) { if (it.ph && it.t === 'frame') it.ph.flip = !it.ph.flip; else it.flip = !it.flip; commit(); render(); return; }
  if (k === 'adjust' && it) { enterAdjust(it); return; }
  if (k === 'replace') { pickReplace(); return; }
  if (k === 'framestyle' && it) { const src = it; const all = b && b.dataset.scope === 'all' ? D.pages : [pg]; let n = 0; for (const p of all) for (const f of p.items) if (f.t === 'frame' && f !== src) { Object.assign(f, { r: src.r, stroke: src.stroke, strokeCol: src.strokeCol, shadow: src.shadow, pad: src.pad, padCol: src.padCol, pol: src.pol, op: src.op }); n++; } commit(); render(); thumbsSoon(); C.toast(`Frame style copied to ${n} frame${n === 1 ? '' : 's'}`); return; }
  if (k === 'textstyle' && it) { let n = 0; for (const p of D.pages) for (const t of p.items) if (t.t === 'text' && t !== it && (t.role || 'x') === (it.role || 'x')) { Object.assign(t, { font: it.font, col: it.col, bold: it.bold, ital: it.ital, upper: it.upper, ls: it.ls, lh: it.lh, shadow: it.shadow }); n++; } commit(); thumbsSoon(); C.toast(n ? `Applied to ${n} matching text${n > 1 ? 's' : ''}` : 'No other matching text to update'); return; }
  if (k === 'calall' && it && it.t === 'cal') { let n = 0; for (const p of D.pages) for (const c of p.items) if (c.t === 'cal' && c !== it) { Object.assign(c, { ws: it.ws, style: it.style, head: it.head, align: it.align, font: it.font, bfont: it.bfont, col: it.col, acc: it.acc }); n++; } commit(); thumbsSoon(); C.toast(`Applied to ${n} other month${n === 1 ? '' : 's'}`); return; }
  if (k === 'events') { openEvents(); return; }
  if (k === 'addframe') { addFrameAt(null, D.w / 2, D.h / 2); commit(); renderInsp(); render(); return; }
  if (k === 'addcal') { const now = new Date(); const s = styleOf(pg); const c = { t: 'cal', id: uidd('c'), x: D.w * 0.08, y: D.h * 0.55, w: D.w * 0.84, h: D.h * 0.38, month: now.getMonth(), year: now.getFullYear(), ws: 1, style: 'grid', head: true, align: 'left', font: s.head, bfont: s.body, col: s.ink, acc: s.accent === s.ink ? '#c1121f' : s.accent, op: 1, rot: 0 }; pg.items.push(c); select(c.id); commit(); return; }
  if (k === 'shuffle') { const fr = pg.items.filter((i) => i.t === 'frame' && i.ph); const phs = fr.map((f) => f.ph); for (let i = phs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [phs[i], phs[j]] = [phs[j], phs[i]]; } fr.forEach((f, i) => { f.ph = { ...phs[i], fx: 0.5, fy: 0.5, z: 1 }; }); commit(); render(); C.toast('Photos shuffled'); return; }
  if (k === 'clearph') { for (const f of pg.items) if (f.t === 'frame') f.ph = null; commit(); refreshLite(); render(); return; }
  if (k === 'spacingall') { for (const p of D.pages) { p.gap = pg.gap; p.margin = pg.margin; reflow(p); } commit(); thumbsSoon(); C.toast('Spacing and margins applied to all pages'); return; }
  if (k === 'bgall') { for (const p of D.pages) p.bg = clone(pg.bg); commit(); thumbsSoon(); C.toast('Background applied to all pages'); return; }
  if (k === 'addphotos') { $('[data-file="photos"]').click(); return; }
  if (k === 'autofill') { openAutofill(); return; }
  if (k === 'calendar') { openCalendarMaker(); return; }
  if (k === 'unused') { const u = usage(); const rm = D.photos.filter((id) => !u.has(id)); for (const id of rm) removePhoto(id, true); renderPanel(); C.toast(rm.length ? `Removed ${rm.length} unused photo${rm.length > 1 ? 's' : ''}` : 'Every photo is in use'); return; }
  if (k === 'pgadd') { addPage(); return; }
  if (k === 'pgdup') { const c = clone(pg); c.id = uidd('p'); for (const i of c.items) i.id = uidd(i.t[0]); D.pages.splice(D.cur + 1, 0, c); D.cur++; ST.sel = null; ST.ms = []; commit(); refreshAll(); return; }
  if (k === 'pgdel') { if (D.pages.length === 1) { C.toast('A design needs at least one page'); return; } D.pages.splice(D.cur, 1); D.cur = clamp(D.cur, 0, D.pages.length - 1); ST.sel = null; ST.ms = []; commit(); refreshAll(); return; }
  if (k === 'pgl' || k === 'pgr') { const j = D.cur + (k === 'pgl' ? -1 : 1); if (j < 0 || j >= D.pages.length) return; const [p] = D.pages.splice(D.cur, 1); D.pages.splice(j, 0, p); D.cur = j; commit(); refreshAll(); return; }
  if (k === 'single' || k === 'spreads') { setSpread(k === 'spreads'); return; }
  if (k === 'closesheet') { ST.sheet = false; UI.panel.hidden = true; markTabs(); return; }
  if (k === 'closeinsp') { select(null); return; }
}
function setSpread(on) {
  if (D.spread === on) return; D.spread = on; ST.sel = null; ST.ms = []; ST.fit = true;
  if (on && D.pages.length < 3) C.toast('Spreads show facing pages like an open book. Add pages to see more spreads');
  if (!on && D.pages.some((p) => p.items.some((i) => i.sp))) C.toast('Photos laid across the fold are cut at the page edge in single page view');
  commit(); refreshAll();
}
function splitFrame(f, side) {
  const pg = cur(); const n = clone(f); n.id = uidd('f'); n.ph = null; const g = pg.gap;
  if (f.cell && !f.rot) { const c = f.cell; if (side) { const w = c[2] / 2; f.cell = [c[0], c[1], w, c[3]]; n.cell = [c[0] + w, c[1], w, c[3]]; } else { const h = c[3] / 2; f.cell = [c[0], c[1], c[2], h]; n.cell = [c[0], c[1] + h, c[2], h]; } reflow(pg); }
  else { delete f.cell; delete n.cell; if (side) { const w = (f.w - g) / 2; f.w = w; n.w = w; n.x = f.x + w + g; } else { const h = (f.h - g) / 2; f.h = h; n.h = h; n.y = f.y + h + g; } }
  pg.items.splice(pg.items.indexOf(f) + 1, 0, n); ST.sel = n.id; ST.ms = []; commit(); renderInsp(); render();
}
async function removePhoto(id, quiet) {
  for (const p of D.pages) { for (const f of p.items) if (f.t === 'frame' && f.ph && f.ph.id === id) f.ph = null; if (p.bg.t === 'photo' && p.bg.ph === id) p.bg = { t: 'color', c: '#ffffff' }; }
  D.photos = D.photos.filter((x) => x !== id); resetHist(); await saveNow();
  if (!(await photoStillUsed(id, D.id))) { const ph = PH.get(id); if (ph) URL.revokeObjectURL(ph.url); PH.delete(id); idbDel('ph:' + id); }
  if (!quiet) { renderPanel(); renderInsp(); render(); thumbsSoon(); }
}
function applyStyle(s, pages) {
  for (const pg of pages) {
    pg.style = s.k; pg.bg = clone(s.bg); if (!(LMAP[pg.layout] && LMAP[pg.layout].bleed)) { pg.gap = s.gap; pg.margin = s.margin; }
    for (const it of pg.items) {
      if (it.t === 'frame') { const pol = it.pol && !s.pol && LMAP[pg.layout] && LMAP[pg.layout].cells.some((c) => c[6]); Object.assign(it, { r: s.r || 0, stroke: s.stroke || 0, strokeCol: s.strokeCol || '#ffffff', shadow: s.shadow || 0, pad: s.pad || 0, padCol: s.padCol || '#ffffff', pol: !!s.pol }); if (pol) { it.pad = Math.max(it.pad, 7 * sc()); it.pol = true; it.shadow = Math.max(it.shadow, 0.55); } if (it.ph) it.ph.flt = s.flt || 'none'; }
      else if (it.t === 'text') { const R = TROLE[it.role]; const head = R ? !!R.head : it.size > 20 * sc(); it.font = R && R.font === 'hand' ? (s.head === 'script' ? 'script' : 'hand') : head ? s.head : s.body; const onPhoto = it.onPhoto || ((it.role === 'cover' || it.role === 'coversub') && pg.items.some((f) => f.t === 'frame' && f.ph)); if (!it.keepCol) it.col = onPhoto ? '#ffffff' : s.ink; }
      else if (it.t === 'gfx') { if (!it.keepCol) it.col = s.accent; }
      else if (it.t === 'cal') { it.font = s.head; it.bfont = s.body; it.col = s.ink; it.acc = s.accent === s.ink ? '#c1121f' : s.accent; }
    }
    reflow(pg);
  }
}
function setBg(bg) { const pg = cur(); pg.bg = bg; commit(); render(); renderPanel(); }
function addText(k) {
  const s = styleOf(cur()); const P = { heading: ['title', 34], sub: ['sub', 12], body: ['body', 11], caption: ['caption', 11], script: ['hand', 28], quote: ['quote', 22], date: ['coversub', 12], label: ['sub', 10] }[k] || ['caption', 12];
  const t = textFor(P[0], s); delete t.tpl; t.size = +(P[1] * sc()).toFixed(1);
  if (k === 'heading') { t.text = 'Add a heading'; t.font = s.head; } if (k === 'sub') t.text = 'Add a subheading'; if (k === 'script') { t.font = 'script'; t.text = 'Summer memories'; }
  if (k === 'date') { t.text = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); t.shadow = false; t.font = 'type'; t.upper = false; t.ls = 0.05; }
  if (k === 'label') { t.text = 'LABEL'; t.bgc = s.accent; t.bold = true; t.ls = 0.15; }
  t.orig = t.text; const w = k === 'body' ? D.w * 0.6 : D.w * 0.8; t.w = w; t.x = (D.w - w) / 2; t.y = D.h * 0.42; t.shadow = false; t.col = k === 'label' ? (isDark(s.accent) ? '#ffffff' : '#111111') : s.ink;
  cur().items.push(t); ST.sel = t.id; ST.ms = []; commit(); renderInsp(); render(); setTimeout(() => startEdit(t), 30);
}
function isDark(hex) { const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) < 140; }
function addGfx(k) { const G = GMAP[k]; const s = styleOf(cur()); const base = Math.min(D.w, D.h) * (G.ar >= 3 ? 0.5 : 0.2); const w = G.ar >= 1 ? base : base * G.ar, h = G.ar >= 1 ? base / G.ar : base; const g = { t: 'gfx', id: uidd('g'), g: k, x: (D.w - w) / 2, y: (D.h - h) / 2, w, h, rot: 0, col: s.accent, op: G.op, flip: false }; if (G.s) g.sw = +(G.ar >= 3 ? Math.max(1, h * 0.25) : Math.max(1, Math.min(w, h) * 0.05)).toFixed(1); cur().items.push(g); ST.sel = g.id; ST.ms = []; commit(); renderInsp(); render(); }
function addEmoji(ch) { const s = Math.min(D.w, D.h) * 0.14; const g = { t: 'emoji', id: uidd('e'), ch, x: (D.w - s) / 2, y: (D.h - s) / 2, w: s, h: s, rot: 0, op: 1 }; cur().items.push(g); ST.sel = g.id; ST.ms = []; commit(); renderInsp(); render(); }
function addPage() {
  const pg = cur(); const n = blankPage(pg.style, pg); D.pages.splice(D.cur + 1, 0, n); const fs = frameStyle(pg);
  const lay = pg.layout && LMAP[pg.layout] && LMAP[pg.layout].cells.length && !LMAP[pg.layout].spread ? pg.layout : '4g';
  applyLayout(n, lay, []); for (const f of n.items) if (f.t === 'frame' && !f.pol) Object.assign(f, fs);
  if (n.margin === 0 && !LMAP[lay].bleed) { const s = styleOf(pg); n.margin = s.margin; n.gap = s.gap; reflow(n); }
  D.cur++; ST.sel = null; ST.ms = []; commit(); refreshAll();
}
function goPage(i) { if (i < 0 || i >= D.pages.length) return; endEdit(); exitAdjust(true); D.cur = i; ST.sel = null; ST.ms = []; if (D.spread) ST.fit = true; renderInsp(); renderPagesMark(); render(); if (ST.tab === 'layouts' || ST.tab === 'bg') renderPanel(); const el = UI.pages.querySelector(`[data-pg="${i}"]`); if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }

/* ---------- Templates: complete pages ready to fill ---------- */
function TB(pg) {
  const W = D.w, H = D.h, k = sc(), s = styleOf(pg), mn = Math.min(W, H);
  const T = (text, x, y, w, size, o = {}) => { const { head, ...rest } = o; return { t: 'text', id: uidd('t'), text, orig: text, x: x * W, y: y * H, w: w * W, h: size * k * 1.2, size: +(size * k).toFixed(1), font: head ? s.head : s.body, col: s.ink, bold: false, ital: false, upper: false, align: 'center', ls: 0, lh: 1.25, shadow: false, op: 1, rot: 0, ...rest }; };
  const F = (x, y, w, h, o = {}) => ({ t: 'frame', id: uidd('f'), x: x * W, y: y * H, w: w * W, h: h * H, shape: 'rect', rot: 0, r: 0, stroke: 0, strokeCol: '#ffffff', shadow: 0, pad: 0, padCol: '#ffffff', pol: false, op: 1, ph: null, ...o });
  const Fc = (cx, cy, d, o = {}) => { const S = d * mn; return F((cx * W - S / 2) / W, (cy * H - S / 2) / H, S / W, S / H, { shape: 'circle', ...o }); };
  const G = (g, x, y, w, h, o = {}) => ({ t: 'gfx', id: uidd('g'), g, x: x * W, y: y * H, w: w * W, h: h * H, rot: 0, col: s.accent, op: 1, flip: false, ...o });
  const Sq = (g, cx, cy, d, o = {}) => { const S = d * mn; return G(g, (cx * W - S / 2) / W, (cy * H - S / 2) / H, S / W, S / H, o); };
  const E = (ch, cx, cy, d) => { const S = d * mn; return { t: 'emoji', id: uidd('e'), ch, x: cx * W - S / 2, y: cy * H - S / 2, w: S, h: S, rot: 0, op: 1 }; };
  const Ln = (x, y, w, o = {}) => G('line', x, y, w, 0.012, { sw: 0.8, col: s.ink, keepCol: false, ...o });
  return { T, F, Fc, G, Sq, E, Ln, s, k };
}
const TEMPLATES = [
  { k: 'crewboard', n: 'Crew photo board', cat: 'At sea', style: 'voyage', build: (b) => { const { T, Fc, Sq, s } = b; const out = [T('CREW OF MV ________', 0.05, 0.045, 0.9, 24, { head: 1, bold: 1, ls: 0.06 }), T('Voyage 2026 · Port to port', 0.05, 0.1, 0.9, 10, { upper: 1, ls: 0.2 })]; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const cx = 0.14 + c * 0.24, cy = 0.27 + r * 0.24; out.push(Fc(cx, cy, 0.17, { stroke: 1.5, strokeCol: s.accent })); out.push(T('Name · Rank', cx - 0.11, cy + 0.075, 0.22, 8.5)); } out.push(Sq('anchor', 0.5, 0.95, 0.045, { sw: 1.4 })); return out; } },
  { k: 'signoff', n: 'Sign-off memories', cat: 'At sea', style: 'clean', build: (b) => { const { T, F, Sq } = b; return [F(0, 0, 1, 0.52), T('Signing off', 0.06, 0.55, 0.88, 36, { font: 'script' }), T('MV ________', 0.06, 0.645, 0.88, 13, { upper: 1, ls: 0.25, bold: 1 }), T('Joined  ___ / ___ / ____      Signed off  ___ / ___ / ____', 0.06, 0.69, 0.88, 10), F(0.06, 0.76, 0.28, 0.19), F(0.36, 0.76, 0.28, 0.19), F(0.66, 0.76, 0.28, 0.19), Sq('anchor', 0.5, 0.735, 0.03, { sw: 1 })]; } },
  { k: 'portvisit', n: 'Port visit', cat: 'At sea', style: 'magazine', build: (b) => { const { T, F, Sq } = b; return [T('PORT OF ________', 0.06, 0.035, 0.8, 26, { head: 1, bold: 1, align: 'left' }), T("38°42'N 009°08'W · " + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), 0.06, 0.095, 0.8, 9.5, { font: 'type', align: 'left' }), Sq('mappin', 0.92, 0.065, 0.06), F(0.06, 0.14, 0.56, 0.45), F(0.64, 0.14, 0.3, 0.22), F(0.64, 0.37, 0.3, 0.22), F(0.06, 0.61, 0.29, 0.25), F(0.37, 0.61, 0.57, 0.25), T('Notes from the visit: where we berthed, what we saw ashore and who came along.', 0.06, 0.885, 0.88, 10, { ital: 1, align: 'left' })]; } },
  { k: 'cotm', n: 'Crew of the month', cat: 'At sea', style: 'linen', build: (b) => { const { T, Fc, G, Sq, Ln, s } = b; return [G('border', 0.04, 0.03, 0.92, 0.94, { sw: 2 }), G('border', 0.06, 0.045, 0.88, 0.91, { sw: 0.6 }), T('CERTIFICATE OF RECOGNITION', 0.1, 0.1, 0.8, 11, { upper: 1, ls: 0.3, bold: 1, col: s.accent, keepCol: 1 }), T('Crew of the Month', 0.1, 0.14, 0.8, 34, { font: 'script' }), Fc(0.5, 0.35, 0.22, { stroke: 2, strokeCol: s.accent }), T('presented to', 0.1, 0.49, 0.8, 11, { ital: 1 }), T('Name Surname', 0.1, 0.525, 0.8, 26, { head: 1, bold: 1 }), T('Rank · MV ________', 0.1, 0.585, 0.8, 10.5, { upper: 1, ls: 0.15 }), T('For outstanding commitment to safety, teamwork and good seamanship this month.', 0.17, 0.64, 0.66, 11, { lh: 1.45 }), Ln(0.12, 0.83, 0.28), Ln(0.6, 0.83, 0.28), T('Master', 0.12, 0.845, 0.28, 10), T('Chief Officer', 0.6, 0.845, 0.28, 10), Sq('seal', 0.5, 0.84, 0.1)]; } },
  { k: 'drill', n: 'Safety drill poster', cat: 'At sea', style: 'clean', build: (b) => { const { T, F, G } = b; return [G('block', 0, 0, 1, 0.14, { col: '#c1121f', keepCol: 1 }), T('SAFETY DRILL', 0.05, 0.025, 0.9, 40, { font: 'display', col: '#ffffff', keepCol: 1 }), T('Abandon ship · Fire · Enclosed space entry', 0.05, 0.098, 0.9, 10, { col: '#ffffff', keepCol: 1, upper: 1, ls: 0.12 }), F(0.05, 0.17, 0.9, 0.34, { r: 8 }), T('Date:  ____________      Time:  ______', 0.05, 0.54, 0.9, 15, { align: 'left', bold: 1 }), T('Muster station:  ____________', 0.05, 0.595, 0.9, 15, { align: 'left', bold: 1 }), T('Bring with you:\n• Lifejacket and immersion suit\n• Hard hat, gloves and safety shoes\n• Torch and whistle', 0.05, 0.66, 0.9, 13, { align: 'left', lh: 1.5 }), G('block', 0, 0.91, 1, 0.09, { col: '#1d1d1f', keepCol: 1 }), T('General alarm: seven short blasts and one long blast. Go to your muster station.', 0.05, 0.935, 0.9, 10, { col: '#ffffff', keepCol: 1 })]; } },
  { k: 'notice', n: 'Notice board sheet', cat: 'At sea', style: 'clean', build: (b) => { const { T, G, Ln, s } = b; return [G('block', 0, 0, 1, 0.12, { col: s.accent === '#1d1d1f' ? '#0b1f3a' : s.accent, keepCol: 1 }), T('NOTICE', 0.05, 0.022, 0.9, 44, { font: 'display', col: '#ffffff', keepCol: 1 }), T('Subject of the notice', 0.06, 0.17, 0.88, 22, { head: 1, bold: 1, align: 'left' }), T('Write the details here. Keep it short and clear so everyone on board can read it from a distance.', 0.06, 0.25, 0.88, 16, { align: 'left', lh: 1.5 }), Ln(0.06, 0.87, 0.36), T('Issued by: Chief Officer', 0.06, 0.885, 0.5, 11, { align: 'left' }), T('Date: ___ / ___ / ____', 0.55, 0.885, 0.39, 11, { align: 'right' })]; } },
  { k: 'farewell', n: 'Farewell card', cat: 'At sea', style: 'night', build: (b) => { const { T, F, Ln } = b; return [F(0.12, 0.05, 0.76, 0.5, { shape: 'arch' }), T('Fair winds and following seas', 0.06, 0.585, 0.88, 28, { font: 'script' }), T('Farewell, Name', 0.06, 0.68, 0.88, 17, { head: 1, bold: 1 }), T('From all of us on MV ________', 0.06, 0.73, 0.88, 11, { ital: 1 }), Ln(0.15, 0.82, 0.32), Ln(0.53, 0.82, 0.32), Ln(0.15, 0.88, 0.32), Ln(0.53, 0.88, 0.32), Ln(0.15, 0.94, 0.32), Ln(0.53, 0.94, 0.32)]; } },
  { k: 'crewbday', n: 'Crew birthday card', cat: 'At sea', style: 'pop', bg: { t: 'pattern', p: 'confetti', c: '#ffd23f', c2: '#ee4266', s: 16 }, build: (b) => { const { T, Fc, E } = b; return [T('Happy Birthday', 0.06, 0.07, 0.88, 46, { font: 'script' }), Fc(0.5, 0.41, 0.46, { stroke: 6, strokeCol: '#ffffff' }), T('Name', 0.06, 0.66, 0.88, 28, { head: 1, bold: 1 }), T('From your shipmates on MV ________', 0.06, 0.725, 0.88, 12, { ital: 1 }), E('🎂', 0.22, 0.85, 0.13), E('🎉', 0.5, 0.87, 0.11), E('🎈', 0.78, 0.85, 0.13)]; } },
  { k: 'welcome', n: 'Welcome aboard', cat: 'At sea', style: 'ocean', build: (b) => { const { T, F, Sq } = b; return [F(0, 0, 1, 0.44), T('Welcome aboard', 0.06, 0.48, 0.88, 40, { font: 'script' }), T('Name · Rank', 0.06, 0.58, 0.88, 15, { upper: 1, ls: 0.15, bold: 1 }), T('Good to know:\n• Muster station: ______\n• Cabin: ______\n• Meal times: 0730 · 1200 · 1800\n• Safety familiarisation with the Second Officer', 0.12, 0.65, 0.76, 12.5, { align: 'left', lh: 1.55 }), Sq('anchor', 0.5, 0.94, 0.05, { sw: 1.4 })]; } },
  { k: 'bbq', n: 'Deck BBQ poster', cat: 'At sea', style: 'gallery', build: (b) => { const { T, F, E, s } = b; return [T('DECK BBQ', 0.06, 0.045, 0.88, 50, { font: 'display', col: '#ff8c42', keepCol: 1 }), T('Saturday · 1800 · Poop deck', 0.06, 0.145, 0.88, 13, { upper: 1, ls: 0.18, bold: 1 }), F(0.06, 0.21, 0.88, 0.4, { r: 12 }), T('On the grill\n• Ribs and chicken\n• Grilled fish\n• Corn, salads and fresh bread\n\nMusic, games and a cold drink after work', 0.12, 0.64, 0.76, 14, { lh: 1.5 }), E('🔥', 0.88, 0.07, 0.1), E('🍖', 0.12, 0.07, 0.09)]; } },
  { k: 'savedate', n: 'Save the date', cat: 'Celebrations', style: 'blush', build: (b) => { const { T, F, Sq } = b; return [F(0, 0, 1, 0.6), T('Save the date', 0.06, 0.635, 0.88, 40, { font: 'script' }), T('Anna & Rahul', 0.06, 0.735, 0.88, 22, { head: 1 }), T('14 · 02 · 2027 · Kochi', 0.06, 0.8, 0.88, 13, { upper: 1, ls: 0.25 }), Sq('heart', 0.5, 0.9, 0.05)]; } },
  { k: 'baby', n: 'New baby', cat: 'Celebrations', style: 'mint', build: (b) => { const { T, Fc, E } = b; return [Fc(0.5, 0.3, 0.5, { stroke: 5, strokeCol: '#ffffff' }), T('Hello, world', 0.06, 0.58, 0.88, 40, { font: 'script' }), T('Baby name', 0.06, 0.68, 0.88, 22, { head: 1, bold: 1 }), T('Born 12 March 2027 · 3.2 kg · 50 cm', 0.06, 0.74, 0.88, 11, { upper: 1, ls: 0.12 }), E('👶', 0.5, 0.86, 0.1)]; } },
  { k: 'anniv', n: 'Anniversary', cat: 'Celebrations', style: 'polaroid', build: (b) => { const { T, F } = b; return [F(0.08, 0.08, 0.4, 0.42, { pad: 7, pol: true, shadow: 0.6, rot: -4 }), F(0.52, 0.11, 0.4, 0.42, { pad: 7, pol: true, shadow: 0.6, rot: 4 }), T('10 years', 0.06, 0.6, 0.88, 48, { head: 1, bold: 1 }), T('of adventures together', 0.06, 0.7, 0.88, 22, { font: 'script' }), T('2017 to 2027', 0.06, 0.79, 0.88, 12, { upper: 1, ls: 0.3 })]; } },
  { k: 'season', n: "Season's greetings", cat: 'Celebrations', style: 'night', build: (b) => { const { T, F, E } = b; return [T("Season's greetings", 0.06, 0.06, 0.88, 40, { font: 'script' }), F(0.1, 0.19, 0.8, 0.52, { r: 10, stroke: 2, strokeCol: '#f1e3b5' }), T('Warm wishes from everyone on board MV ________', 0.08, 0.76, 0.84, 14), E('🎄', 0.5, 0.88, 0.09)]; } },
  { k: 'postcard', n: 'Postcard', cat: 'Travel', style: 'pop', build: (b) => { const { T, F } = b; return [F(0, 0, 1, 0.72), T('Greetings from', 0.06, 0.755, 0.88, 13, { upper: 1, ls: 0.3 }), T('LISBON', 0.06, 0.8, 0.88, 54, { font: 'display' })]; } },
  { k: 'journal', n: 'Travel journal page', cat: 'Travel', style: 'notebook', build: (b) => { const { T, F, G } = b; return [T('Day 1', 0.06, 0.04, 0.5, 32, { font: 'hand', align: 'left' }), T('Place · date', 0.06, 0.105, 0.5, 11, { font: 'type', align: 'left' }), F(0.06, 0.16, 0.48, 0.36, { pad: 6, pol: true, shadow: 0.5, rot: -3 }), F(0.5, 0.22, 0.44, 0.3, { pad: 6, pol: true, shadow: 0.5, rot: 4 }), G('tape', 0.17, 0.145, 0.16, 0.035, { rot: -8, op: 0.6 }), G('tape', 0.64, 0.205, 0.16, 0.035, { rot: 6, op: 0.6 }), T('What happened today, what we ate, who we met and what made us laugh.', 0.08, 0.6, 0.84, 14, { font: 'hand', align: 'left', lh: 1.7 })]; } },
  { k: 's-title', n: 'Title slide', cat: 'Slides', size: 's169', style: 'clean', build: (b) => { const { T, F, G, s } = b; return [F(0.5, 0, 0.5, 1), G('block', 0.06, 0.33, 0.06, 0.012, { col: s.accent }), T('Presentation title', 0.06, 0.37, 0.4, 30, { head: 1, bold: 1, align: 'left' }), T('Presenter name · date', 0.06, 0.6, 0.4, 12, { align: 'left' })]; } },
  { k: 's-agenda', n: 'Agenda slide', cat: 'Slides', size: 's169', style: 'clean', build: (b) => { const { T, Sq, s } = b; const out = [T('Agenda', 0.07, 0.08, 0.86, 28, { head: 1, bold: 1, align: 'left' })]; ['Safety moment', 'Last month in review', 'Cargo and port plan', 'Questions'].forEach((t, i) => { const y = 0.3 + i * 0.16; out.push(Sq('circle', 0.1, y + 0.04, 0.09)); out.push(T(String(i + 1), 0.07, y + 0.012, 0.06, 15, { bold: 1, col: isDark(s.accent) ? '#ffffff' : '#111111', keepCol: 1 })); out.push(T(t, 0.16, y + 0.012, 0.7, 17, { align: 'left' })); }); return out; } },
  { k: 's-three', n: 'Three points', cat: 'Slides', size: 's169', style: 'soft', build: (b) => { const { T, Sq } = b; const out = [T('Three things to remember', 0.06, 0.08, 0.88, 26, { head: 1, bold: 1 })]; [['compass', 'Plan ahead'], ['anchor', 'Stay secure'], ['star', 'Look after each other']].forEach(([g, t], i) => { const cx = 0.2 + i * 0.3; out.push(Sq(g, cx, 0.42, 0.16, { sw: 2 })); out.push(T(t, cx - 0.13, 0.6, 0.26, 15, { bold: 1 })); out.push(T('A short line that explains the point.', cx - 0.13, 0.68, 0.26, 10.5, { lh: 1.4 })); }); return out; } },
  { k: 's-photo', n: 'Photo and points', cat: 'Slides', size: 's169', style: 'clean', build: (b) => { const { T, F } = b; return [F(0, 0, 0.5, 1), T('Slide heading', 0.55, 0.14, 0.4, 24, { head: 1, bold: 1, align: 'left' }), T('• First point\n• Second point\n• Third point', 0.55, 0.36, 0.4, 15, { align: 'left', lh: 1.7 })]; } },
  { k: 's-stats', n: 'Big numbers', cat: 'Slides', size: 's169', style: 'voyage', build: (b) => { const { T, s } = b; const out = [T('Voyage in numbers', 0.06, 0.08, 0.88, 24, { head: 1, bold: 1 })]; [['12,450', 'nautical miles'], ['38', 'days at sea'], ['0', 'lost time injuries']].forEach(([n, l], i) => { const x = 0.06 + i * 0.3; out.push(T(n, x, 0.36, 0.28, 46, { font: 'display', col: s.accent, keepCol: 1 })); out.push(T(l, x, 0.62, 0.28, 12, { upper: 1, ls: 0.15 })); }); return out; } },
  { k: 's-thanks', n: 'Thank you slide', cat: 'Slides', size: 's169', style: 'gallery', build: (b) => { const { T, F } = b; return [F(0, 0, 1, 1, { op: 1 }), T('Thank you', 0.05, 0.36, 0.9, 50, { head: 1, bold: 1, col: '#ffffff', keepCol: 1, shadow: true, onPhoto: true }), T('Questions?', 0.05, 0.56, 0.9, 18, { col: '#ffffff', keepCol: 1, shadow: true, onPhoto: true })]; } }
];
/* ---------- More templates: school, college, portfolio, business, invitations, events, cards, food, social, property, travel ---------- */
const TPL2 = (() => {
  const det = (T, lines, y, o = {}) => lines.map((l, i) => T(l, o.x ?? 0.08, y + i * (o.step ?? 0.045), o.w ?? 0.84, o.size ?? 13, { align: o.align || 'center', bold: !!o.bold, ...(o.extra || {}) }));
  const grid = (G, s, x0, y0, w, h, rows, cols, o = {}) => { const out = []; for (let r = 0; r <= rows; r++) out.push(G('block', x0, y0 + r * h / rows, w, o.t || 0.0022, { col: s.ink, op: 0.35 })); for (let c = 0; c <= cols; c++) out.push(G('block', x0 + c * w / cols, y0, o.tv || 0.0022, h, { col: s.ink, op: 0.35 })); return out; };
  return [
    /* School */
    { k: 'sch-cert', n: 'Certificate of achievement', cat: 'School', style: 'linen', build: ({ T, G, Sq, Ln, s }) => [G('border', 0.04, 0.03, 0.92, 0.94, { sw: 3 }), G('border', 0.065, 0.05, 0.87, 0.9, { sw: 0.8 }), Sq('badge', 0.5, 0.15, 0.12), T('CERTIFICATE', 0.1, 0.235, 0.8, 32, { head: 1, bold: 1, ls: 0.15 }), T('OF ACHIEVEMENT', 0.1, 0.3, 0.8, 12, { ls: 0.4, col: s.accent, keepCol: 1 }), T('This certificate is proudly presented to', 0.1, 0.39, 0.8, 12, { ital: 1 }), T('Student Name', 0.1, 0.435, 0.8, 34, { font: 'script' }), Ln(0.25, 0.52, 0.5), T('for outstanding performance in ________ during the academic year 2026-27.', 0.15, 0.56, 0.7, 12, { lh: 1.5 }), Ln(0.12, 0.82, 0.28), Ln(0.6, 0.82, 0.28), T('Class Teacher', 0.12, 0.835, 0.28, 10), T('Principal', 0.6, 0.835, 0.28, 10), Sq('seal', 0.5, 0.83, 0.1)] },
    { k: 'sch-project', n: 'School project cover', cat: 'School', style: 'clean', build: ({ T, F, G }) => [G('block', 0, 0, 1, 0.3, { col: '#1e3c72', keepCol: 1 }), T('SCIENCE PROJECT', 0.08, 0.08, 0.84, 13, { ls: 0.3, col: '#ffffff', keepCol: 1, align: 'left' }), T('Project title goes here', 0.08, 0.125, 0.84, 32, { head: 1, bold: 1, col: '#ffffff', keepCol: 1, align: 'left', lh: 1.15 }), F(0.08, 0.35, 0.84, 0.34, { r: 10 }), ...det(T, ['Name: ____________________', 'Class and section: __________', 'Roll number: __________', 'School: ____________________', 'Guided by: ____________________'], 0.73, { align: 'left', size: 14 })] },
    { k: 'sch-timetable', n: 'Class timetable', cat: 'School', style: 'kids', build: ({ T, G, s }) => { const x0 = 0.05, y0 = 0.17, w = 0.9, h = 0.76, rows = 6, cols = 7; const out = [T('Class Timetable', 0.05, 0.04, 0.9, 32, { head: 1, bold: 1 }), T('Class ____ · Section ____ · 2026-27', 0.05, 0.11, 0.9, 12, { ls: 0.1 }), G('block', x0, y0, w, h / rows, { col: s.accent, op: 0.18 }), ...grid(G, s, x0, y0, w, h, rows, cols)]; ['Day', '1', '2', '3', '4', '5', '6'].forEach((t, c) => out.push(T(t, x0 + c * w / cols, y0 + h / rows * 0.32, w / cols, 13, { bold: 1 }))); ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach((t, r) => out.push(T(t, x0, y0 + (r + 1) * h / rows + h / rows * 0.35, w / cols, 12, { bold: 1 }))); return out; } },
    { k: 'sch-science', n: 'Science fair poster', cat: 'School', style: 'mint', build: ({ T, F, G }) => { const box = (x, y, t, b) => [G('block', x, y, 0.43, 0.24, { col: '#ffffff', op: 0.85, keepCol: 1 }), T(t, x + 0.02, y + 0.015, 0.39, 14, { bold: 1, align: 'left' }), T(b, x + 0.02, y + 0.06, 0.39, 10.5, { align: 'left', lh: 1.45 })]; return [T('SCIENCE FAIR 2027', 0.05, 0.035, 0.9, 34, { font: 'display' }), T('Project title · Team names', 0.05, 0.1, 0.9, 13), F(0.05, 0.15, 0.9, 0.27, { r: 10 }), ...box(0.05, 0.45, 'Question', 'What did you want to find out?'), ...box(0.52, 0.45, 'Hypothesis', 'What did you think would happen, and why?'), ...box(0.05, 0.72, 'Method and results', 'How you tested it and what you measured.'), ...box(0.52, 0.72, 'Conclusion', 'What you learned and what you would try next.')]; } },
    { k: 'sch-class', n: 'Class photo page', cat: 'School', style: 'soft', build: ({ T, Fc }) => { const out = [T('Class of 2027', 0.05, 0.035, 0.9, 38, { font: 'script' }), T('Grade 10 · Section A', 0.05, 0.11, 0.9, 12, { upper: 1, ls: 0.2 })]; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cx = 0.14 + c * 0.24, cy = 0.24 + r * 0.19; out.push(Fc(cx, cy, 0.14, { stroke: 2, strokeCol: '#ffffff', shadow: 0.4 })); out.push(T('Name', cx - 0.11, cy + 0.065, 0.22, 10)); } return out; } },
    { k: 'sch-sports', n: 'Sports day poster', cat: 'School', style: 'pop', build: ({ T, F, E }) => [T('SPORTS DAY', 0.05, 0.035, 0.9, 54, { font: 'display' }), T('Annual athletics meet 2027', 0.05, 0.13, 0.9, 14, { upper: 1, ls: 0.15, bold: 1 }), F(0.06, 0.19, 0.88, 0.36, { r: 14, stroke: 5, strokeCol: '#ffffff' }), T('Track · Relay · Long jump · Tug of war', 0.06, 0.585, 0.88, 15, { bold: 1 }), ...det(T, ['Friday 16 January · 8:00 AM', 'School ground', 'Parents are welcome'], 0.65, { size: 14 }), E('🏆', 0.2, 0.88, 0.12), E('🏃', 0.5, 0.88, 0.12), E('🥇', 0.8, 0.88, 0.12)] },
    { k: 'sch-annual', n: 'Annual day invitation', cat: 'School', style: 'royal', build: ({ T, G, Sq }) => [G('border', 0.05, 0.035, 0.9, 0.93, { sw: 1.5 }), Sq('star', 0.5, 0.11, 0.07), T('Annual Day', 0.08, 0.17, 0.84, 50, { font: 'script' }), T('2026-27 CELEBRATIONS', 0.08, 0.28, 0.84, 12, { ls: 0.3 }), T('The Principal, staff and students cordially invite you and your family to an evening of music, dance and drama.', 0.12, 0.36, 0.76, 13, { ital: 1, lh: 1.5 }), ...det(T, ['SATURDAY · 20 FEBRUARY 2027', '5:30 PM onwards', 'School auditorium'], 0.55, { size: 14, extra: { ls: 0.08 } }), T('Chief guest: ________________', 0.08, 0.72, 0.84, 13), T('School Name', 0.08, 0.86, 0.84, 16, { head: 1, bold: 1 })] },
    { k: 'sch-star', n: 'Student of the month', cat: 'School', style: 'kids', build: ({ T, Fc, E, Sq }) => [T('Star Student', 0.05, 0.05, 0.9, 46, { font: 'script' }), T('OF THE MONTH', 0.05, 0.155, 0.9, 13, { ls: 0.35, bold: 1 }), Fc(0.5, 0.4, 0.38, { stroke: 6, strokeCol: '#ffffff', shadow: 0.4 }), Sq('star', 0.73, 0.27, 0.1), T('Student Name', 0.05, 0.62, 0.9, 30, { head: 1, bold: 1 }), T('Class ____ · Month ________', 0.05, 0.68, 0.9, 13), T('For kindness, hard work and always helping others.', 0.12, 0.74, 0.76, 13, { ital: 1, lh: 1.45 }), E('⭐', 0.2, 0.9, 0.09), E('🌟', 0.8, 0.9, 0.09)] },
    /* College */
    { k: 'col-fest', n: 'College fest poster', cat: 'College', style: 'night', build: ({ T, F, s }) => [T('TECHFEST', 0.05, 0.04, 0.9, 64, { font: 'display', col: '#ffd23f', keepCol: 1 }), T('2027', 0.05, 0.155, 0.9, 30, { font: 'display', ls: 0.4 }), T('Three days of code, robots, music and food', 0.05, 0.225, 0.9, 14, { ital: 1 }), F(0.06, 0.28, 0.88, 0.36, { r: 12 }), T('Hackathon · Robo war · Quiz · Band night · Gaming', 0.06, 0.67, 0.88, 14, { bold: 1, col: s.accent, keepCol: 1 }), ...det(T, ['12 to 14 March 2027', 'Main campus', 'Register at the student office'], 0.73, { size: 14 })] },
    { k: 'col-thesis', n: 'Thesis cover page', cat: 'College', style: 'clean', build: ({ T, Sq }) => [T('UNIVERSITY NAME', 0.08, 0.06, 0.84, 18, { head: 1, bold: 1, ls: 0.1 }), T('Department of ________', 0.08, 0.1, 0.84, 13), Sq('seal', 0.5, 0.21, 0.13), T('Title of the Thesis Written Over One or Two Lines', 0.1, 0.33, 0.8, 26, { head: 1, bold: 1, lh: 1.25 }), T('A thesis submitted in partial fulfilment of the requirements for the degree of', 0.15, 0.48, 0.7, 12, { ital: 1, lh: 1.5 }), T('Master of Business Administration', 0.1, 0.56, 0.8, 16, { bold: 1 }), T('by', 0.1, 0.63, 0.8, 12, { ital: 1 }), T('Student Name', 0.1, 0.66, 0.8, 18, { bold: 1 }), T('Register number: __________', 0.1, 0.705, 0.8, 12), T('Under the guidance of\nGuide Name, Designation', 0.1, 0.78, 0.8, 12, { lh: 1.5 }), T('Month Year', 0.1, 0.9, 0.8, 13, { bold: 1 })] },
    { k: 'col-seminar', n: 'Guest lecture poster', cat: 'College', style: 'corporate', build: ({ T, Fc, G }) => [G('block', 0, 0, 1, 0.2, { col: '#13233f', keepCol: 1 }), T('GUEST LECTURE', 0.06, 0.05, 0.88, 14, { ls: 0.35, col: '#ffffff', keepCol: 1 }), T('Talk title that tells people why they should come', 0.06, 0.09, 0.88, 24, { head: 1, bold: 1, col: '#ffffff', keepCol: 1, lh: 1.2 }), Fc(0.5, 0.38, 0.26, { stroke: 4, strokeCol: '#ffffff', shadow: 0.4 }), T('Speaker Name', 0.06, 0.53, 0.88, 24, { head: 1, bold: 1 }), T('Designation, Organisation', 0.06, 0.58, 0.88, 13), ...det(T, ['Wednesday 18 February · 2:00 PM', 'Seminar Hall 2', 'Open to all students and faculty'], 0.67, { size: 14 }), G('block', 0, 0.94, 1, 0.06, { col: '#1f6feb', keepCol: 1 })] },
    { k: 'col-club', n: 'Club recruitment', cat: 'College', style: 'pop', build: ({ T, F }) => [T('JOIN THE', 0.06, 0.04, 0.88, 22, { font: 'display', ls: 0.2 }), T('Photography Club', 0.06, 0.09, 0.88, 44, { font: 'script' }), F(0.06, 0.2, 0.88, 0.4, { r: 14, stroke: 5, strokeCol: '#ffffff' }), T('What we do\n• Weekly photo walks\n• Editing workshops\n• Exhibitions every semester', 0.12, 0.63, 0.76, 14, { align: 'left', lh: 1.55 }), T('Sign up: ________________', 0.06, 0.88, 0.88, 15, { bold: 1 })] },
    { k: 'col-grad', n: 'Graduation announcement', cat: 'College', style: 'royal', build: ({ T, Fc, E }) => [T('Class of 2027', 0.06, 0.05, 0.88, 44, { font: 'script' }), Fc(0.5, 0.33, 0.4, { stroke: 4, strokeCol: '#d4af37' }), T('Graduate Name', 0.06, 0.56, 0.88, 28, { head: 1, bold: 1 }), T('Bachelor of Science in Nautical Science', 0.06, 0.62, 0.88, 13, { ls: 0.05 }), T('College Name', 0.06, 0.665, 0.88, 12, { ital: 1 }), ...det(T, ['Ceremony · 25 April 2027 · 10:00 AM', 'Convocation hall'], 0.74, { size: 13 }), E('🎓', 0.5, 0.9, 0.09)] },
    { k: 'col-research', n: 'Research poster', cat: 'College', style: 'corporate', build: ({ T, F, G }) => { const col = (x, t, b) => [T(t, x, 0.2, 0.28, 15, { bold: 1, align: 'left', col: '#1f6feb', keepCol: 1 }), T(b, x, 0.245, 0.28, 10.5, { align: 'left', lh: 1.5 })]; return [G('block', 0, 0, 1, 0.16, { col: '#13233f', keepCol: 1 }), T('Research Title Goes Here', 0.04, 0.035, 0.92, 28, { head: 1, bold: 1, col: '#ffffff', keepCol: 1 }), T('Author Name, Author Name · Department, University', 0.04, 0.1, 0.92, 12, { col: '#ffffff', keepCol: 1 }), ...col(0.04, 'Introduction', 'Why this question matters, what is already known and the gap this work fills.'), F(0.04, 0.4, 0.28, 0.22), ...col(0.36, 'Method', 'Who or what was studied, how data was collected and how it was analysed.'), F(0.36, 0.4, 0.28, 0.22), ...col(0.68, 'Results', 'The main findings with numbers. Charts and photos go in the frames.'), F(0.68, 0.4, 0.28, 0.22), G('block', 0.04, 0.68, 0.92, 0.2, { col: '#1f6feb', op: 0.1 }), T('Conclusion', 0.06, 0.7, 0.88, 16, { bold: 1, align: 'left' }), T('One or two sentences on what this means and what should happen next.', 0.06, 0.75, 0.88, 12, { align: 'left', lh: 1.5 }), T('References · Contact: you@university.edu', 0.04, 0.92, 0.92, 9.5, { align: 'left' })]; } },
    /* Portfolio */
    { k: 'pf-cover', n: 'Portfolio cover', cat: 'Portfolio', style: 'minimal', build: ({ T, F }) => [F(0, 0, 1, 0.7), T('PORTFOLIO', 0.06, 0.75, 0.88, 46, { font: 'display', ls: 0.15, align: 'left' }), T('Your Name · Designer and Photographer', 0.06, 0.85, 0.88, 13, { align: 'left' }), T('2027', 0.06, 0.885, 0.88, 12, { align: 'left', ls: 0.3 })] },
    { k: 'pf-about', n: 'About me', cat: 'Portfolio', style: 'minimal', build: ({ T, Fc, G, s }) => { const out = [Fc(0.27, 0.2, 0.36), T('About me', 0.52, 0.08, 0.42, 30, { head: 1, bold: 1, align: 'left' }), T('A short introduction: who you are, what you do best and what you are looking for next.', 0.52, 0.15, 0.42, 11.5, { align: 'left', lh: 1.55 }), T('SKILLS', 0.06, 0.42, 0.88, 12, { bold: 1, ls: 0.25, align: 'left' })]; [['Photography', 0.9], ['Layout and design', 0.8], ['Editing', 0.75], ['Writing', 0.6], ['Presenting', 0.7]].forEach(([t, l], i) => { const y = 0.47 + i * 0.05; out.push(T(t, 0.06, y, 0.3, 11, { align: 'left' }), G('block', 0.38, y + 0.008, 0.56, 0.01, { col: s.ink, op: 0.12 }), G('block', 0.38, y + 0.008, 0.56 * l, 0.01, { col: '#1f6feb', keepCol: 1 })); }); out.push(T('EXPERIENCE', 0.06, 0.75, 0.88, 12, { bold: 1, ls: 0.25, align: 'left' }), T('2024 to now · Role, Company\n2021 to 2024 · Role, Company\n2019 to 2021 · Role, Company', 0.06, 0.79, 0.88, 11.5, { align: 'left', lh: 1.7 })); return out; } },
    { k: 'pf-project', n: 'Project case study', cat: 'Portfolio', style: 'magazine', build: ({ T, F }) => [T('Project name', 0.06, 0.04, 0.88, 32, { head: 1, bold: 1, align: 'left' }), T('Client · Year · My role', 0.06, 0.105, 0.88, 11, { align: 'left', ls: 0.1 }), F(0.06, 0.15, 0.88, 0.38), T('The brief', 0.06, 0.56, 0.42, 14, { bold: 1, align: 'left' }), T('What the client needed and what made it hard.', 0.06, 0.6, 0.42, 11, { align: 'left', lh: 1.5 }), T('What I did', 0.52, 0.56, 0.42, 14, { bold: 1, align: 'left' }), T('The approach, the key decisions and the result in numbers.', 0.52, 0.6, 0.42, 11, { align: 'left', lh: 1.5 }), F(0.06, 0.72, 0.43, 0.23), F(0.51, 0.72, 0.43, 0.23)] },
    { k: 'pf-gallery', n: 'Gallery page', cat: 'Portfolio', style: 'gallery', build: ({ T, F }) => [T('Selected work', 0.06, 0.04, 0.88, 26, { head: 1, align: 'left' }), F(0.06, 0.1, 0.43, 0.32), F(0.51, 0.1, 0.43, 0.2), F(0.51, 0.32, 0.43, 0.3), F(0.06, 0.44, 0.43, 0.2), F(0.06, 0.66, 0.43, 0.29), F(0.51, 0.64, 0.43, 0.31)] },
    { k: 'pf-resume', n: 'Resume', cat: 'Portfolio', style: 'clean', build: ({ T, Fc, G }) => { const side = { col: '#ffffff', keepCol: 1, align: 'left' }; const h = (t, y) => T(t, 0.37, y, 0.58, 11, { bold: 1, ls: 0.22, align: 'left', col: '#1f6feb', keepCol: 1 }); return [G('block', 0, 0, 0.32, 1, { col: '#13233f', keepCol: 1 }), Fc(0.16, 0.13, 0.2, { stroke: 3, strokeCol: '#ffffff' }), T('CONTACT', 0.04, 0.27, 0.25, 10, { ...side, bold: 1, ls: 0.2 }), T('+91 00000 00000\nyou@email.com\nKochi, Kerala\nlinkedin.com/in/you', 0.04, 0.3, 0.25, 9.5, { ...side, lh: 1.7 }), T('SKILLS', 0.04, 0.45, 0.25, 10, { ...side, bold: 1, ls: 0.2 }), T('Leadership\nPlanning\nTeam training\nReport writing\nMS Office', 0.04, 0.48, 0.25, 9.5, { ...side, lh: 1.7 }), T('LANGUAGES', 0.04, 0.66, 0.25, 10, { ...side, bold: 1, ls: 0.2 }), T('English\nMalayalam\nHindi', 0.04, 0.69, 0.25, 9.5, { ...side, lh: 1.7 }), T('Your Name', 0.37, 0.05, 0.58, 30, { head: 1, bold: 1, align: 'left' }), T('Job title', 0.37, 0.11, 0.58, 13, { align: 'left', ls: 0.15, upper: 1 }), h('PROFILE', 0.17), T('Two or three lines about your experience, strengths and the role you want next.', 0.37, 0.2, 0.58, 10.5, { align: 'left', lh: 1.5 }), h('EXPERIENCE', 0.31), T('Job title · Company\n2023 to present\nWhat you achieved, with a number if you can.\n\nJob title · Company\n2019 to 2023\nWhat you achieved, with a number if you can.', 0.37, 0.34, 0.58, 10.5, { align: 'left', lh: 1.5 }), h('EDUCATION', 0.62), T('Degree · Institution · Year\nDegree · Institution · Year', 0.37, 0.65, 0.58, 10.5, { align: 'left', lh: 1.6 }), h('CERTIFICATES', 0.75), T('Certificate name · Issued by · Year\nCertificate name · Issued by · Year', 0.37, 0.78, 0.58, 10.5, { align: 'left', lh: 1.6 })]; } },
    { k: 'pf-contact', n: 'Contact page', cat: 'Portfolio', style: 'minimal', build: ({ T, F }) => [F(0, 0, 0.5, 1), T("Let's work together", 0.55, 0.3, 0.4, 30, { head: 1, bold: 1, align: 'left', lh: 1.15 }), T('you@email.com\n+91 00000 00000\nyourwebsite.com\nKochi, Kerala', 0.55, 0.48, 0.4, 13, { align: 'left', lh: 1.8 })] },
    /* Business */
    { k: 'co-letter', n: 'Letterhead', cat: 'Business', style: 'corporate', build: ({ T, G, Sq, Ln }) => [G('block', 0, 0, 1, 0.012, { col: '#1f6feb', keepCol: 1 }), Sq('hexg', 0.09, 0.065, 0.07, { col: '#1f6feb', keepCol: 1 }), T('Company Name', 0.15, 0.045, 0.45, 18, { bold: 1, align: 'left', head: 1 }), T('Address line · City · Country\n+91 00000 00000 · mail@company.com', 0.5, 0.04, 0.44, 8.5, { align: 'right', lh: 1.5 }), Ln(0.06, 0.11, 0.88, { sw: 0.5 }), T('Date: ____________', 0.06, 0.14, 0.4, 11, { align: 'left' }), T('Dear ____________,', 0.06, 0.2, 0.5, 11, { align: 'left' }), T('Write your letter here.', 0.06, 0.25, 0.88, 11, { align: 'left', lh: 1.6 }), T('Yours sincerely,\n\n\nName\nDesignation', 0.06, 0.72, 0.4, 11, { align: 'left', lh: 1.5 }), G('block', 0, 0.965, 1, 0.035, { col: '#13233f', keepCol: 1 })] },
    { k: 'co-report', n: 'Annual report cover', cat: 'Business', style: 'corporate', build: ({ T, F, G }) => [F(0, 0, 1, 0.55), G('block', 0, 0.55, 1, 0.45, { col: '#13233f', keepCol: 1 }), T('ANNUAL REPORT', 0.07, 0.6, 0.86, 14, { ls: 0.35, col: '#ffffff', keepCol: 1, align: 'left' }), T('2026', 0.07, 0.635, 0.86, 80, { font: 'display', col: '#ffffff', keepCol: 1, align: 'left' }), T('Company Name', 0.07, 0.82, 0.86, 18, { col: '#ffffff', keepCol: 1, align: 'left', bold: 1 }), T('Growing together', 0.07, 0.865, 0.86, 13, { col: '#9fc3ff', keepCol: 1, align: 'left', ital: 1 })] },
    { k: 'co-flyer', n: 'Business flyer', cat: 'Business', style: 'corporate', build: ({ T, F, G, Sq }) => { const out = [T('Your business headline in a few words', 0.06, 0.04, 0.88, 30, { head: 1, bold: 1, align: 'left', lh: 1.15 }), T('One line that says who you help and how.', 0.06, 0.16, 0.88, 13, { align: 'left' }), F(0.06, 0.21, 0.88, 0.33, { r: 12 })]; [['anchor', 'Reliable'], ['compass', 'Experienced'], ['star', 'Rated 5 stars']].forEach(([g, t], i) => { const cx = 0.2 + i * 0.3; out.push(Sq(g, cx, 0.62, 0.09, { sw: 2, col: '#1f6feb', keepCol: 1 }), T(t, cx - 0.13, 0.68, 0.26, 13, { bold: 1 }), T('A short line about it.', cx - 0.13, 0.715, 0.26, 10)); }); out.push(G('pillg', 0.2, 0.8, 0.6, 0.08, { col: '#1f6feb', keepCol: 1 }), T('Call +91 00000 00000', 0.2, 0.822, 0.6, 16, { bold: 1, col: '#ffffff', keepCol: 1 }), T('company.com · Kochi', 0.06, 0.92, 0.88, 11)); return out; } },
    { k: 'co-proposal', n: 'Proposal cover', cat: 'Business', style: 'corporate', build: ({ T, F, G }) => [G('block', 0.06, 0.08, 0.012, 0.28, { col: '#1f6feb', keepCol: 1 }), T('PROPOSAL', 0.1, 0.08, 0.8, 12, { ls: 0.35, align: 'left' }), T('Project title for the client', 0.1, 0.12, 0.8, 36, { head: 1, bold: 1, align: 'left', lh: 1.12 }), T('Prepared for: Client Name\nPrepared by: Your Name\nDate: ____________', 0.1, 0.39, 0.8, 12, { align: 'left', lh: 1.7 }), F(0.1, 0.53, 0.8, 0.36, { r: 8 })] },
    { k: 'co-team', n: 'Meet the team', cat: 'Business', style: 'corporate', build: ({ T, Fc }) => { const out = [T('Meet the team', 0.05, 0.05, 0.9, 32, { head: 1, bold: 1 }), T('The people behind the work', 0.05, 0.11, 0.9, 13)]; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const cx = 0.2 + c * 0.3, cy = 0.3 + r * 0.33; out.push(Fc(cx, cy, 0.2, { stroke: 3, strokeCol: '#1f6feb' }), T('Name', cx - 0.14, cy + 0.09, 0.28, 15, { bold: 1 }), T('Role', cx - 0.14, cy + 0.125, 0.28, 11)); } return out; } },
    { k: 'co-invoice', n: 'Invoice', cat: 'Business', style: 'corporate', build: ({ T, G, Ln, s }) => { const cols = [[0.06, 0.46, 'Description', 'left'], [0.52, 0.1, 'Qty', 'center'], [0.62, 0.15, 'Rate', 'right'], [0.79, 0.15, 'Amount', 'right']]; const out = [T('INVOICE', 0.06, 0.05, 0.5, 40, { font: 'display', align: 'left' }), T('Invoice no: ______\nDate: ______\nDue: ______', 0.55, 0.05, 0.39, 11, { align: 'right', lh: 1.6 }), T('Company Name\nAddress line\nPhone · Email', 0.06, 0.15, 0.4, 11, { align: 'left', lh: 1.5 }), T('BILL TO', 0.55, 0.15, 0.39, 10, { bold: 1, ls: 0.2, align: 'right' }), T('Client Name\nAddress line', 0.55, 0.18, 0.39, 11, { align: 'right', lh: 1.5 }), G('block', 0.06, 0.29, 0.88, 0.04, { col: '#13233f', keepCol: 1 })]; for (const [x, w, t, a] of cols) out.push(T(t, x + 0.01, 0.3, w - 0.02, 11, { bold: 1, col: '#ffffff', keepCol: 1, align: a })); for (let r = 1; r <= 8; r++) out.push(Ln(0.06, 0.33 + r * 0.05, 0.88, { sw: 0.4, op: 0.5 })); out.push(T('Subtotal\nTax\nTotal', 0.6, 0.78, 0.17, 12, { align: 'right', lh: 1.7, bold: 1 }), T('______\n______\n______', 0.79, 0.78, 0.15, 12, { align: 'right', lh: 1.7 }), T('Bank: ______ · Account: ______ · IFSC: ______', 0.06, 0.92, 0.88, 9.5, { align: 'left' }), T('Thank you for your business.', 0.06, 0.78, 0.45, 12, { align: 'left', ital: 1, col: s.accent })); return out; } },
    { k: 'co-memo', n: 'Memo', cat: 'Business', style: 'corporate', build: ({ T, Ln }) => [T('MEMO', 0.06, 0.05, 0.88, 46, { font: 'display', align: 'left' }), ...det(T, ['To: ____________________', 'From: ____________________', 'Date: ____________________', 'Subject: ____________________'], 0.16, { align: 'left', x: 0.06, w: 0.88, size: 13, step: 0.04 }), Ln(0.06, 0.33, 0.88, { sw: 1 }), T('Write the message here. Keep it short: what is happening, what you need and by when.', 0.06, 0.36, 0.88, 12, { align: 'left', lh: 1.6 })] },
    { k: 'co-card', n: 'Business card', cat: 'Business', size: 'bc', style: 'corporate', build: ({ T, G, Sq }) => [G('block', 0, 0, 0.36, 1, { col: '#13233f', keepCol: 1 }), Sq('hexg', 0.18, 0.45, 0.42, { col: '#ffffff', keepCol: 1, op: 0.9 }), T('Your Name', 0.42, 0.16, 0.55, 52, { head: 1, bold: 1, align: 'left' }), T('Job title', 0.42, 0.33, 0.55, 30, { align: 'left', col: '#1f6feb', keepCol: 1 }), T('+91 00000 00000\nyou@company.com\ncompany.com', 0.42, 0.55, 0.55, 28, { align: 'left', lh: 1.5 })] },
    { k: 'co-quarter', n: 'Results slide', cat: 'Business', size: 's169', style: 'corporate', build: ({ T, G }) => { const out = [T('Quarterly results', 0.05, 0.07, 0.6, 28, { head: 1, bold: 1, align: 'left' }), T('Q3 2026', 0.05, 0.17, 0.6, 13, { align: 'left', ls: 0.2 })]; [['₹4.2 Cr', 'Revenue'], ['+18%', 'Growth'], ['96%', 'On time']].forEach(([n, l], i) => { const y = 0.3 + i * 0.22; out.push(T(n, 0.05, y, 0.35, 34, { font: 'display', align: 'left', col: '#1f6feb', keepCol: 1 }), T(l, 0.05, y + 0.12, 0.35, 11, { align: 'left', upper: 1, ls: 0.15 })); }); [0.35, 0.5, 0.45, 0.7, 0.85].forEach((v, i) => { out.push(G('block', 0.48 + i * 0.095, 0.88 - v * 0.65, 0.065, v * 0.65, { col: i === 4 ? '#1f6feb' : '#9fc3ff', keepCol: 1 }), T(['Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26'][i], 0.48 + i * 0.095 - 0.01, 0.9, 0.085, 9)); }); return out; } },
    { k: 'co-timeline', n: 'Timeline slide', cat: 'Business', size: 's169', style: 'corporate', build: ({ T, G, Sq }) => { const out = [T('Our journey', 0.05, 0.08, 0.9, 28, { head: 1, bold: 1 }), G('block', 0.08, 0.52, 0.84, 0.008, { col: '#9fc3ff', keepCol: 1 })]; ['2019', '2021', '2023', '2025', '2027'].forEach((y, i) => { const cx = 0.12 + i * 0.19; out.push(Sq('circle', cx, 0.524, 0.07, { col: '#1f6feb', keepCol: 1 }), T(y, cx - 0.08, i % 2 ? 0.6 : 0.3, 0.16, 18, { bold: 1 }), T('Milestone', cx - 0.08, i % 2 ? 0.67 : 0.37, 0.16, 10.5)); }); return out; } },
    /* Invitations */
    { k: 'inv-wedding', n: 'Wedding invitation', cat: 'Invitations', size: 'inv57', style: 'blush', build: ({ T, G }) => [G('swash', 0.25, 0.06, 0.5, 0.06, { sw: 1.2 }), T('TOGETHER WITH THEIR FAMILIES', 0.06, 0.15, 0.88, 11, { ls: 0.25 }), T('Anna', 0.06, 0.2, 0.88, 52, { font: 'script' }), T('&', 0.06, 0.31, 0.88, 26, { font: 'script' }), T('Rahul', 0.06, 0.36, 0.88, 52, { font: 'script' }), T('request the pleasure of your company\nat the celebration of their marriage', 0.08, 0.48, 0.84, 12.5, { ital: 1, lh: 1.5 }), T('SATURDAY · 14 FEBRUARY 2027', 0.06, 0.6, 0.88, 13, { bold: 1, ls: 0.15 }), T('11:00 in the morning', 0.06, 0.645, 0.88, 12), T("St. Mary's Church, Kochi", 0.06, 0.69, 0.88, 13), T('Reception to follow', 0.06, 0.76, 0.88, 11, { ital: 1 }), T('RSVP by 1 February · +91 00000 00000', 0.06, 0.82, 0.88, 10, { ls: 0.08 }), G('swash', 0.25, 0.89, 0.5, 0.06, { sw: 1.2, flip: true })] },
    { k: 'inv-bday', n: 'Birthday invitation', cat: 'Invitations', size: 'inv57', style: 'kids', build: ({ T, E }) => [T("You're invited!", 0.06, 0.06, 0.88, 40, { font: 'script' }), T('AARAV IS TURNING', 0.06, 0.18, 0.88, 14, { bold: 1, ls: 0.2 }), T('7', 0.06, 0.22, 0.88, 140, { font: 'display' }), ...det(T, ['Sunday · 10 January 2027', '4:00 to 7:00 PM', 'Fun Zone, Lulu Mall, Kochi'], 0.56, { size: 14 }), T('Games, cake and lots of fun. Please RSVP to Mom: +91 00000 00000', 0.1, 0.72, 0.8, 11.5, { lh: 1.45 }), E('🎈', 0.15, 0.12, 0.13), E('🎂', 0.5, 0.88, 0.12), E('🎁', 0.85, 0.12, 0.12)] },
    { k: 'inv-babyshower', n: 'Baby shower', cat: 'Invitations', size: 'inv57', style: 'mint', build: ({ T, E }) => [E('🍼', 0.5, 0.11, 0.14), T('Baby Shower', 0.06, 0.2, 0.88, 46, { font: 'script' }), T('IN HONOUR OF', 0.06, 0.32, 0.88, 11, { ls: 0.3 }), T('Priya', 0.06, 0.36, 0.88, 30, { head: 1, bold: 1 }), ...det(T, ['Saturday · 6 March 2027', '11:00 AM', 'Our home, Kakkanad'], 0.5, { size: 14 }), T('Light lunch and games. Gifts are optional, your blessings are not.', 0.1, 0.69, 0.8, 11.5, { ital: 1, lh: 1.45 }), E('🎀', 0.3, 0.88, 0.09), E('👶', 0.7, 0.88, 0.09)] },
    { k: 'inv-house', n: 'Housewarming', cat: 'Invitations', size: 'inv57', style: 'forest', build: ({ T, F, E }) => [F(0.08, 0.05, 0.84, 0.36, { r: 10 }), E('🏠', 0.5, 0.47, 0.1), T('Housewarming', 0.06, 0.52, 0.88, 40, { font: 'script' }), T('Come celebrate our new home with us', 0.06, 0.62, 0.88, 13, { ital: 1 }), ...det(T, ['Sunday · 21 March 2027 · 6:00 PM', 'House name, street, city'], 0.7, { size: 13 }), T('The Menon family', 0.06, 0.86, 0.88, 15, { head: 1, bold: 1 })] },
    { k: 'inv-engage', n: 'Engagement', cat: 'Invitations', size: 'inv57', style: 'royal', build: ({ T, E, G }) => [G('border', 0.05, 0.035, 0.9, 0.93, { sw: 1.2 }), E('💍', 0.5, 0.13, 0.13), T("We're engaged", 0.06, 0.22, 0.88, 42, { font: 'script' }), T('Meera & Arjun', 0.06, 0.34, 0.88, 26, { head: 1 }), T('Join us for the engagement ceremony', 0.06, 0.43, 0.88, 13, { ital: 1 }), ...det(T, ['SUNDAY · 7 MARCH 2027', '10:30 AM', 'Hotel name, city'], 0.52, { size: 13, extra: { ls: 0.08 } }), T('Lunch to follow', 0.06, 0.72, 0.88, 12, { ital: 1 })] },
    { k: 'inv-party', n: 'Party night', cat: 'Invitations', size: 'inv57', style: 'night', build: ({ T, E, s }) => [T('COCKTAIL', 0.06, 0.1, 0.88, 52, { font: 'display', col: '#ffd23f', keepCol: 1 }), T('NIGHT', 0.06, 0.2, 0.88, 52, { font: 'display' }), E('🥂', 0.5, 0.39, 0.15), ...det(T, ['Friday · 19 March 2027', '8:00 PM till late', 'Rooftop, Marine Drive'], 0.5, { size: 14 }), T('Dress code: smart casual', 0.06, 0.68, 0.88, 12, { ital: 1, col: s.accent, keepCol: 1 }), T('RSVP · +91 00000 00000', 0.06, 0.85, 0.88, 11, { ls: 0.15 })] },
    { k: 'inv-onam', n: 'Onam sadhya', cat: 'Invitations', size: 'inv57', style: 'onam', build: ({ T, G, E }) => [G('border', 0.04, 0.03, 0.92, 0.94, { sw: 3, col: '#d4a017', keepCol: 1 }), G('border', 0.065, 0.048, 0.87, 0.904, { sw: 0.8, col: '#d4a017', keepCol: 1 }), E('🌸', 0.5, 0.12, 0.1), T('Onam Sadhya', 0.06, 0.2, 0.88, 46, { font: 'script' }), T('Happy Onam to you and your family', 0.06, 0.32, 0.88, 13, { ital: 1 }), T('Join us for a traditional feast on a banana leaf, with pookalam, games and songs.', 0.12, 0.39, 0.76, 12, { lh: 1.5 }), ...det(T, ['THIRUVONAM · 26 AUGUST 2027', '12:00 noon', 'Our home, Thrissur'], 0.55, { size: 13, extra: { ls: 0.06 } }), E('🍃', 0.3, 0.84, 0.08), E('🪔', 0.7, 0.84, 0.08)] },
    { k: 'inv-diwali', n: 'Diwali celebration', cat: 'Invitations', size: 'inv57', style: 'festive', build: ({ T, E }) => [E('🪔', 0.5, 0.12, 0.14), T('Happy Diwali', 0.06, 0.22, 0.88, 46, { font: 'script' }), T('Join us for an evening of lights, sweets and fireworks', 0.1, 0.34, 0.8, 13, { ital: 1, lh: 1.45 }), ...det(T, ['Sunday · 7 November 2027', '7:00 PM', 'Our home, Kochi'], 0.48, { size: 14 }), T('With love, the Nair family', 0.06, 0.75, 0.88, 14, { head: 1 }), E('✨', 0.2, 0.88, 0.08), E('✨', 0.8, 0.88, 0.08)] },
    { k: 'inv-eid', n: 'Eid dinner', cat: 'Invitations', size: 'inv57', style: 'royal', build: ({ T, Sq, E }) => [Sq('moon', 0.5, 0.13, 0.16), T('Eid Mubarak', 0.06, 0.24, 0.88, 46, { font: 'script' }), T('Please join us for Eid dinner', 0.06, 0.36, 0.88, 14, { ital: 1 }), ...det(T, ['Saturday · 20 March 2027', '7:30 PM', 'Our home, Kozhikode'], 0.46, { size: 14 }), T('With warm wishes, the Rahman family', 0.06, 0.72, 0.88, 13, { head: 1 }), E('✨', 0.5, 0.86, 0.08)] },
    { k: 'inv-xmas', n: 'Christmas party', cat: 'Invitations', size: 'inv57', style: 'festive', build: ({ T, E }) => [E('🎄', 0.5, 0.13, 0.16), T('Christmas Party', 0.06, 0.25, 0.88, 42, { font: 'script' }), T('Carols, cake and good company', 0.06, 0.36, 0.88, 13, { ital: 1 }), ...det(T, ['Friday · 24 December 2027', '7:00 PM', 'Community hall, Kochi'], 0.46, { size: 14 }), T('Bring a small gift for the gift exchange', 0.06, 0.68, 0.88, 12, { ital: 1 }), E('🎁', 0.25, 0.86, 0.09), E('⭐', 0.75, 0.86, 0.09)] },
    { k: 'inv-dinner', n: 'Dinner invitation', cat: 'Invitations', size: 'inv57', style: 'vintage', build: ({ T, G }) => [G('border', 0.06, 0.045, 0.88, 0.91, { sw: 1 }), T('You are invited to', 0.06, 0.16, 0.88, 13, { ital: 1 }), T('Dinner', 0.06, 0.21, 0.88, 56, { font: 'script' }), T('at our place', 0.06, 0.33, 0.88, 13, { ital: 1 }), ...det(T, ['SATURDAY · 13 MARCH 2027', '8:00 PM', 'Address line, city'], 0.43, { size: 13, extra: { ls: 0.08 } }), T('Kindly reply by 6 March', 0.06, 0.68, 0.88, 11, { ital: 1 })] },
    /* Events and posters */
    { k: 'ev-concert', n: 'Concert poster', cat: 'Events', style: 'night', build: ({ T, F, s }) => [T('LIVE MUSIC', 0.05, 0.035, 0.9, 58, { font: 'display', col: '#ffd23f', keepCol: 1 }), F(0.06, 0.15, 0.88, 0.45, { r: 6 }), T('Band Name', 0.05, 0.63, 0.9, 40, { font: 'script' }), ...det(T, ['Saturday 27 March · Doors 7:00 PM', 'Venue name, city', 'Tickets ₹499 at the door'], 0.73, { size: 14 }), T('Bookings: +91 00000 00000', 0.05, 0.9, 0.9, 11, { ls: 0.15, col: s.accent, keepCol: 1 })] },
    { k: 'ev-sale', n: 'Sale poster', cat: 'Events', style: 'pop', build: ({ T, F, Sq }) => [T('BIG', 0.05, 0.04, 0.6, 64, { font: 'display', align: 'left' }), T('SALE', 0.05, 0.135, 0.6, 64, { font: 'display', align: 'left' }), Sq('burst', 0.76, 0.15, 0.36, { col: '#ee4266', keepCol: 1 }), T('50%\nOFF', 0.6, 0.1, 0.32, 30, { font: 'display', col: '#ffffff', keepCol: 1, lh: 1 }), F(0.05, 0.3, 0.9, 0.38, { r: 12, stroke: 5, strokeCol: '#ffffff' }), T('This weekend only', 0.05, 0.71, 0.9, 22, { bold: 1 }), ...det(T, ['Friday to Sunday · 10 AM to 9 PM', 'Shop name, street, city'], 0.78, { size: 14 })] },
    { k: 'ev-workshop', n: 'Workshop poster', cat: 'Events', style: 'corporate', build: ({ T, F, G }) => [G('pillg', 0.06, 0.05, 0.3, 0.045, { col: '#1f6feb', keepCol: 1 }), T('FREE WORKSHOP', 0.06, 0.06, 0.3, 11, { bold: 1, ls: 0.15, col: '#ffffff', keepCol: 1 }), T('Learn to edit photos on your phone', 0.06, 0.12, 0.88, 32, { head: 1, bold: 1, align: 'left', lh: 1.15 }), F(0.06, 0.28, 0.88, 0.3, { r: 10 }), T("What you'll learn\n• Light, colour and cropping\n• Making old photos look new\n• Sharing in the best quality", 0.06, 0.61, 0.55, 13, { align: 'left', lh: 1.6 }), T('Saturday 6 March\n10:00 AM to 1:00 PM\nCommunity hall', 0.63, 0.61, 0.31, 13, { align: 'right', lh: 1.6, bold: 1 }), T('Seats are limited. Register: +91 00000 00000', 0.06, 0.9, 0.88, 12, { align: 'left' })] },
    { k: 'ev-charity', n: 'Charity event', cat: 'Events', style: 'soft', build: ({ T, F, E }) => [T('Run for a cause', 0.05, 0.05, 0.9, 40, { font: 'script' }), T('5 KM CHARITY RUN', 0.05, 0.14, 0.9, 15, { bold: 1, ls: 0.2 }), F(0.06, 0.2, 0.88, 0.38, { r: 14 }), ...det(T, ['Sunday 14 March · 6:00 AM', 'Marine Drive walkway', 'Entry ₹300 · T-shirt included'], 0.62, { size: 14 }), T('All proceeds go to ____________', 0.05, 0.79, 0.9, 14, { ital: 1 }), E('❤️', 0.5, 0.9, 0.08)] },
    { k: 'ev-opening', n: 'Grand opening', cat: 'Events', style: 'royal', build: ({ T, F, E }) => [T('GRAND', 0.05, 0.05, 0.9, 48, { font: 'display', ls: 0.2 }), T('OPENING', 0.05, 0.13, 0.9, 48, { font: 'display', ls: 0.2 }), F(0.08, 0.24, 0.84, 0.34, { r: 10, stroke: 2, strokeCol: '#d4af37' }), T('Business Name', 0.05, 0.61, 0.9, 32, { font: 'script' }), ...det(T, ['Monday 1 March 2027 · 10:00 AM', 'Shop address, city', 'Opening day offers for every visitor'], 0.71, { size: 13 }), E('🎉', 0.5, 0.9, 0.08)] },
    { k: 'ev-missing', n: 'Missing pet poster', cat: 'Events', style: 'clean', build: ({ T, F, G }) => [G('block', 0, 0, 1, 0.14, { col: '#c1121f', keepCol: 1 }), T('MISSING', 0.05, 0.025, 0.9, 58, { font: 'display', col: '#ffffff', keepCol: 1 }), F(0.08, 0.17, 0.84, 0.42, { r: 8 }), T('Name', 0.05, 0.62, 0.9, 34, { head: 1, bold: 1 }), T('Breed · colour · age · wearing a red collar', 0.08, 0.69, 0.84, 13), T('Last seen near ____________ on ____________', 0.08, 0.74, 0.84, 13), G('block', 0.08, 0.81, 0.84, 0.1, { col: '#c1121f', keepCol: 1, op: 0.1 }), T('Please call +91 00000 00000', 0.08, 0.835, 0.84, 22, { bold: 1 })] },
    /* Cards */
    { k: 'cd-thanks', n: 'Thank you card', cat: 'Cards', size: 'a6p', style: 'blush', build: ({ T, F }) => [F(0.08, 0.06, 0.84, 0.48, { r: 8 }), T('Thank you', 0.06, 0.58, 0.88, 56, { font: 'script' }), T('for being part of our special day', 0.06, 0.73, 0.88, 14, { ital: 1 }), T('With love, Anna & Rahul', 0.06, 0.84, 0.88, 14, { head: 1 })] },
    { k: 'cd-congrats', n: 'Congratulations card', cat: 'Cards', size: 'a6p', style: 'pop', build: ({ T, E }) => [E('🎉', 0.5, 0.18, 0.22), T('Congratulations!', 0.06, 0.38, 0.88, 44, { font: 'script' }), T('So proud of everything you have achieved. Here is to the next adventure.', 0.1, 0.52, 0.8, 14, { lh: 1.5 }), T('From ____________', 0.06, 0.8, 0.88, 14, { ital: 1 })] },
    { k: 'cd-getwell', n: 'Get well soon', cat: 'Cards', size: 'a6p', style: 'mint', build: ({ T, E }) => [E('💐', 0.5, 0.2, 0.24), T('Get well soon', 0.06, 0.42, 0.88, 46, { font: 'script' }), T('Sending you rest, strength and warm wishes for a quick recovery.', 0.1, 0.56, 0.8, 14, { lh: 1.5 }), T('From ____________', 0.06, 0.82, 0.88, 14, { ital: 1 })] },
    { k: 'cd-retire', n: 'Happy retirement', cat: 'Cards', size: 'a6p', style: 'voyage', build: ({ T, E }) => [E('⛵', 0.5, 0.17, 0.2), T('Happy Retirement', 0.06, 0.36, 0.88, 40, { font: 'script' }), T('After years at sea and countless miles, may every day now be calm water and a gentle breeze.', 0.1, 0.5, 0.8, 13, { lh: 1.5, ital: 1 }), T('With respect, all of us on MV ________', 0.06, 0.8, 0.88, 12)] },
    { k: 'cd-grad', n: 'Graduation card', cat: 'Cards', size: 'a6p', style: 'royal', build: ({ T, E }) => [E('🎓', 0.5, 0.18, 0.22), T('Congratulations, Graduate', 0.06, 0.38, 0.88, 34, { font: 'script', lh: 1.15 }), T('The tassel was worth the hassle. The world is ready for you.', 0.1, 0.56, 0.8, 14, { lh: 1.5 }), T('From ____________', 0.06, 0.82, 0.88, 14, { ital: 1 })] },
    { k: 'cd-newhome', n: 'New home card', cat: 'Cards', size: 'a6p', style: 'forest', build: ({ T, E }) => [E('🏡', 0.5, 0.2, 0.22), T('Welcome home', 0.06, 0.4, 0.88, 46, { font: 'script' }), T('May your new home be full of laughter, good food and long chats.', 0.1, 0.55, 0.8, 14, { lh: 1.5 }), T('From ____________', 0.06, 0.82, 0.88, 14, { ital: 1 })] },
    { k: 'cd-postcard', n: 'Photo postcard', cat: 'Cards', size: 'a6l', style: 'clean', build: ({ T, F, G, Ln }) => [F(0, 0, 0.5, 1), G('block', 0.75, 0.08, 0.002, 0.84, { col: '#999999', keepCol: 1 }), T('Greetings from Lisbon. Write your note here.', 0.53, 0.1, 0.2, 16, { font: 'hand', align: 'left', lh: 1.5 }), G('border', 0.86, 0.07, 0.1, 0.17, { sw: 0.8 }), Ln(0.78, 0.45, 0.18), Ln(0.78, 0.58, 0.18), Ln(0.78, 0.71, 0.18), Ln(0.78, 0.84, 0.18)] },
    /* Food */
    { k: 'fd-menu', n: 'Restaurant menu', cat: 'Food', style: 'vintage', build: ({ T, G }) => { const out = [T('Restaurant Name', 0.06, 0.04, 0.88, 40, { font: 'script' }), T('MENU', 0.06, 0.13, 0.88, 14, { ls: 0.5, bold: 1 }), G('swash', 0.35, 0.16, 0.3, 0.03, { sw: 1 })]; let y = 0.22; for (const [sec, items] of [['Starters', ['Prawn fry', 'Chicken 65', 'Veg cutlet']], ['Mains', ['Karimeen pollichathu', 'Beef roast with appam', 'Kerala sadhya', 'Fish curry meals']], ['Desserts', ['Palada payasam', 'Caramel pudding']]]) { out.push(T(sec.toUpperCase(), 0.1, y, 0.8, 14, { bold: 1, ls: 0.25 })); y += 0.05; for (const it of items) { out.push(T(it, 0.12, y, 0.6, 12.5, { align: 'left' }), T('₹ ___', 0.72, y, 0.16, 12.5, { align: 'right' })); y += 0.038; } y += 0.03; } return out; } },
    { k: 'fd-recipe', n: 'Recipe card', cat: 'Food', style: 'notebook', build: ({ T, F }) => [T('Recipe title', 0.06, 0.04, 0.88, 34, { font: 'hand', align: 'left' }), T('Serves 4 · Prep 15 min · Cook 30 min', 0.06, 0.105, 0.88, 11, { align: 'left', font: 'type' }), F(0.06, 0.15, 0.88, 0.3, { r: 8, pad: 5, shadow: 0.4 }), T('INGREDIENTS', 0.06, 0.48, 0.38, 12, { bold: 1, ls: 0.2, align: 'left' }), T('• 500 g ____\n• 2 onions\n• 1 tsp turmeric\n• Salt to taste\n• ____', 0.06, 0.52, 0.38, 12, { align: 'left', lh: 1.6, font: 'hand' }), T('METHOD', 0.48, 0.48, 0.46, 12, { bold: 1, ls: 0.2, align: 'left' }), T('1. First step.\n2. Second step.\n3. Third step.\n4. Serve hot.', 0.48, 0.52, 0.46, 12, { align: 'left', lh: 1.6, font: 'hand' })] },
    { k: 'fd-cafe', n: 'Cafe price board', cat: 'Food', style: 'kraft', build: ({ T, E }) => { const out = [T('Coffee', 0.06, 0.05, 0.88, 56, { font: 'script' }), T('& GOOD COMPANY', 0.06, 0.16, 0.88, 13, { ls: 0.3, bold: 1 }), E('☕', 0.5, 0.25, 0.1)]; ['Espresso', 'Cappuccino', 'Cafe latte', 'Filter coffee', 'Cold brew', 'Masala chai', 'Banana cake'].forEach((t, i) => { const y = 0.34 + i * 0.075; out.push(T(t, 0.14, y, 0.5, 17, { align: 'left', font: 'type' }), T('₹ ___', 0.66, y, 0.2, 17, { align: 'right', font: 'type' })); }); return out; } },
    /* Social media */
    { k: 'so-quote', n: 'Quote post', cat: 'Social', size: 'igsq', style: 'sunset', build: ({ T, Sq }) => [Sq('quoteg', 0.5, 0.2, 0.16, { col: '#ffffff', keepCol: 1, op: 0.6 }), T('A smooth sea never made a skilled sailor.', 0.1, 0.33, 0.8, 42, { head: 1, bold: 1, lh: 1.2 }), T('OLD SAYING', 0.1, 0.8, 0.8, 14, { ls: 0.3 })] },
    { k: 'so-news', n: 'Announcement post', cat: 'Social', size: 'igsq', style: 'ocean', build: ({ T, F }) => [T('BIG NEWS', 0.06, 0.06, 0.88, 56, { font: 'display' }), F(0.1, 0.24, 0.8, 0.46, { r: 16, stroke: 4, strokeCol: '#ffffff' }), T('Say what is new in one short line', 0.08, 0.75, 0.84, 22, { bold: 1 }), T('Link in bio', 0.08, 0.86, 0.84, 14, { ls: 0.2, upper: 1 })] },
    { k: 'so-story', n: 'Photo story', cat: 'Social', size: 'igst', style: 'gallery', build: ({ T, F }) => [F(0, 0, 1, 1), T('NEW POST', 0.06, 0.06, 0.88, 16, { ls: 0.35, bold: 1, col: '#ffffff', keepCol: 1, shadow: true, onPhoto: true }), T('Sunset at the anchorage', 0.06, 0.78, 0.88, 40, { font: 'script', col: '#ffffff', keepCol: 1, shadow: true, onPhoto: true }), T('Tap to see more', 0.06, 0.9, 0.88, 14, { col: '#ffffff', keepCol: 1, shadow: true, onPhoto: true })] },
    { k: 'so-sale', n: 'Sale post', cat: 'Social', size: 'ig45', style: 'pop', build: ({ T, F, Sq }) => [T('FLASH SALE', 0.06, 0.05, 0.88, 54, { font: 'display' }), F(0.08, 0.2, 0.84, 0.46, { r: 14, stroke: 6, strokeCol: '#ffffff' }), Sq('burst', 0.8, 0.22, 0.26, { col: '#ee4266', keepCol: 1 }), T('30%', 0.67, 0.2, 0.26, 30, { font: 'display', col: '#ffffff', keepCol: 1 }), T('Use code SEA30 at checkout', 0.06, 0.72, 0.88, 22, { bold: 1 }), T('Ends Sunday midnight', 0.06, 0.8, 0.88, 14, { ital: 1 })] },
    /* Property */
    { k: 're-flyer', n: 'Property for sale', cat: 'Property', style: 'corporate', build: ({ T, F, G }) => [G('block', 0, 0, 1, 0.1, { col: '#13233f', keepCol: 1 }), T('FOR SALE', 0.05, 0.025, 0.6, 30, { font: 'display', col: '#ffffff', keepCol: 1, align: 'left' }), T('₹ 85 Lakh', 0.5, 0.03, 0.45, 26, { bold: 1, col: '#ffd23f', keepCol: 1, align: 'right' }), F(0.05, 0.13, 0.9, 0.4), F(0.05, 0.55, 0.29, 0.17), F(0.355, 0.55, 0.29, 0.17), F(0.66, 0.55, 0.29, 0.17), T('3 BHK villa in Kakkanad', 0.05, 0.75, 0.9, 24, { head: 1, bold: 1, align: 'left' }), T('3 bedrooms · 3 bathrooms · 1,850 sq ft · Car parking · Close to Infopark', 0.05, 0.81, 0.9, 12, { align: 'left' }), G('block', 0.05, 0.87, 0.9, 0.08, { col: '#1f6feb', keepCol: 1, op: 0.1 }), T('Agent Name · +91 00000 00000', 0.07, 0.892, 0.86, 15, { bold: 1, align: 'left' })] },
    { k: 're-open', n: 'Open house', cat: 'Property', style: 'minimal', build: ({ T, F }) => [T('OPEN', 0.06, 0.05, 0.88, 70, { font: 'display', align: 'left' }), T('HOUSE', 0.06, 0.16, 0.88, 70, { font: 'display', align: 'left' }), F(0.06, 0.3, 0.88, 0.42), T('Sunday 14 March · 11:00 AM to 4:00 PM', 0.06, 0.76, 0.88, 16, { bold: 1, align: 'left' }), T('Address line, city · All welcome', 0.06, 0.81, 0.88, 13, { align: 'left' })] },
    /* Travel */
    { k: 'tr-itin', n: 'Trip itinerary', cat: 'Travel', style: 'ocean', build: ({ T, F }) => { const out = [T('Trip to Munnar', 0.06, 0.04, 0.88, 36, { font: 'script', align: 'left' }), T('3 days · 2 nights · April 2027', 0.06, 0.12, 0.88, 12, { align: 'left', ls: 0.1 }), F(0.06, 0.17, 0.88, 0.25, { r: 10 })]; ['Day 1 · Drive up, tea gardens, check in', 'Day 2 · Eravikulam park, Mattupetty dam, Echo point', 'Day 3 · Tea museum, shopping, drive back'].forEach((t, i) => out.push(T(t.split(' · ')[0], 0.06, 0.46 + i * 0.15, 0.2, 18, { bold: 1, align: 'left' }), T(t.split(' · ').slice(1).join(' · '), 0.27, 0.465 + i * 0.15, 0.67, 13, { align: 'left', lh: 1.5 }))); return out; } },
    { k: 'tr-pack', n: 'Packing list', cat: 'Travel', style: 'notebook', build: ({ T }) => { const out = [T('Packing list', 0.06, 0.04, 0.88, 38, { font: 'hand', align: 'left' }), T('Trip: ____________ · Dates: ____________', 0.06, 0.12, 0.88, 12, { align: 'left', font: 'type' })]; [['Documents', '☐ Passport\n☐ CDC and certificates\n☐ Tickets\n☐ Cards and cash'], ['Clothes', '☐ Shirts\n☐ Trousers\n☐ Jacket\n☐ Shoes'], ['Toiletries', '☐ Toothbrush\n☐ Medicines\n☐ Sunscreen\n☐ Razor'], ['Gadgets', '☐ Phone and charger\n☐ Power bank\n☐ Earphones\n☐ Adapter']].forEach(([h, b], i) => { const x = 0.06 + (i % 2) * 0.46, y = 0.2 + Math.floor(i / 2) * 0.36; out.push(T(h, x, y, 0.42, 18, { bold: 1, align: 'left', font: 'hand' }), T(b, x, y + 0.05, 0.42, 14, { align: 'left', lh: 1.7, font: 'hand' })); }); return out; } },
    /* At sea, extra */
    { k: 'sea-cv', n: 'Seafarer CV', cat: 'At sea', style: 'corporate', build: ({ T, Fc, G }) => { const out = [G('block', 0, 0, 1, 0.15, { col: '#0b1f3a', keepCol: 1 }), Fc(0.13, 0.075, 0.12, { stroke: 2, strokeCol: '#ffffff' }), T('Your Name', 0.22, 0.03, 0.72, 26, { head: 1, bold: 1, align: 'left', col: '#ffffff', keepCol: 1 }), T('Chief Officer · Bulk carriers', 0.22, 0.085, 0.72, 13, { align: 'left', col: '#9fc3ff', keepCol: 1 }), T('Nationality: Indian · Date of birth: __________ · Phone: +91 00000 00000 · Email: you@email.com', 0.05, 0.17, 0.9, 9.5, { align: 'left' }), T('DOCUMENTS', 0.05, 0.215, 0.9, 11, { bold: 1, ls: 0.2, align: 'left', col: '#1f6feb', keepCol: 1 }), T('Passport no: ________ valid to ________    CDC no: ________ valid to ________\nCOC: ________ issued ________    US visa: ________    Yellow fever: ________', 0.05, 0.24, 0.9, 9.5, { align: 'left', lh: 1.6 }), T('STCW CERTIFICATES', 0.05, 0.31, 0.9, 11, { bold: 1, ls: 0.2, align: 'left', col: '#1f6feb', keepCol: 1 }), T('BST · AFF · MFA · PSCRB · SSO · ECDIS · BRM · HV · GMDSS', 0.05, 0.335, 0.9, 9.5, { align: 'left' }), T('SEA SERVICE', 0.05, 0.38, 0.9, 11, { bold: 1, ls: 0.2, align: 'left', col: '#1f6feb', keepCol: 1 }), G('block', 0.05, 0.405, 0.9, 0.03, { col: '#0b1f3a', keepCol: 1 })]; const cols = [[0.05, 0.22, 'Vessel'], [0.27, 0.15, 'Type'], [0.42, 0.11, 'DWT'], [0.53, 0.14, 'Rank'], [0.67, 0.14, 'From'], [0.81, 0.14, 'To']]; for (const [x, w, t] of cols) out.push(T(t, x + 0.005, 0.411, w - 0.01, 9.5, { bold: 1, col: '#ffffff', keepCol: 1, align: 'left' })); for (let r = 1; r <= 10; r++) out.push(G('block', 0.05, 0.435 + r * 0.04, 0.9, 0.0015, { col: '#999999', keepCol: 1 })); out.push(T('REFERENCES', 0.05, 0.9, 0.9, 11, { bold: 1, ls: 0.2, align: 'left', col: '#1f6feb', keepCol: 1 }), T('Name, rank, company, phone', 0.05, 0.925, 0.9, 9.5, { align: 'left' })); return out; } },
    { k: 'sea-handover', n: 'Handover notes', cat: 'At sea', style: 'clean', build: ({ T, G }) => { const out = [T('Handover notes', 0.05, 0.035, 0.9, 30, { head: 1, bold: 1, align: 'left' }), T('Vessel: ________   Port: ________   Date: ________   Off-signer: ________   On-signer: ________', 0.05, 0.095, 0.9, 9.5, { align: 'left' })]; ['Cargo and stowage', 'Ballast and stability', 'Deck maintenance', 'Safety equipment and drills', 'Pending jobs and defects', 'Inspections and certificates'].forEach((h, i) => { const x = 0.05 + (i % 2) * 0.46, y = 0.14 + Math.floor(i / 2) * 0.28; out.push(G('block', x, y, 0.44, 0.035, { col: '#0b1f3a', keepCol: 1 }), T(h, x + 0.01, y + 0.007, 0.42, 11, { bold: 1, col: '#ffffff', keepCol: 1, align: 'left' })); for (let l = 1; l <= 6; l++) out.push(G('block', x, y + 0.035 + l * 0.038, 0.44, 0.0015, { col: '#aaaaaa', keepCol: 1 })); }); return out; } },
    { k: 'sea-menu', n: 'Weekly galley menu', cat: 'At sea', style: 'kraft', build: ({ T, G, s }) => { const out = [T('Galley menu', 0.05, 0.035, 0.9, 38, { font: 'script' }), T('Week of ____________ · MV ____________', 0.05, 0.12, 0.9, 12, { font: 'type' })]; const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const x0 = 0.05, y0 = 0.18, w = 0.9, rh = 0.105; out.push(...['', 'Breakfast', 'Lunch', 'Dinner'].map((t, c) => T(t, x0 + (c ? 0.12 + (c - 1) * 0.26 : 0), y0, c ? 0.26 : 0.12, 12, { bold: 1, ls: 0.1 }))); days.forEach((d, r) => { const y = y0 + 0.04 + r * rh; out.push(G('block', x0, y, w, 0.0015, { col: s.ink, op: 0.4 }), T(d, x0, y + 0.035, 0.12, 13, { bold: 1, font: 'type' })); for (let c = 0; c < 3; c++) out.push(T('____', x0 + 0.12 + c * 0.26, y + 0.035, 0.26, 11, { font: 'type' })); }); return out; } }
  ];
})();

TEMPLATES.push(...TPL2);
/* ---------- 100 more templates: planners, business, social, events, wedding, albums, editorial, kids, festivals, at sea, school, food ---------- */
STYLES.push(
  { k: 'sage', n: 'Sage', bg: { t: 'color', c: '#eef1ea' }, gap: 10, margin: 16, r: 6, ink: '#2f3a2f', accent: '#7d9471', head: 'elegant', body: 'sans' },
  { k: 'terra', n: 'Terracotta', bg: { t: 'color', c: '#f6ede4' }, gap: 10, margin: 16, ink: '#4a2c20', accent: '#c0623b', head: 'didone', body: 'clean' },
  { k: 'noirgold', n: 'Noir and gold', bg: { t: 'color', c: '#111112' }, gap: 10, margin: 16, stroke: 1, strokeCol: '#c9a45c', ink: '#f2e6c9', accent: '#c9a45c', head: 'didone', body: 'clean' },
  { k: 'lavender', n: 'Lavender', bg: { t: 'grad', c: '#f5f0ff', c2: '#e2d6fb', a: 160 }, gap: 10, margin: 16, r: 10, ink: '#3d2c6b', accent: '#7c5cd6', head: 'elegant', body: 'geo' },
  { k: 'peach', n: 'Peach', bg: { t: 'color', c: '#ffeadf' }, gap: 12, margin: 16, r: 14, ink: '#5a2e1d', accent: '#ff7a59', head: 'geo', body: 'geo' },
  { k: 'cobalt', n: 'Cobalt', bg: { t: 'color', c: '#1736a8' }, gap: 10, margin: 14, r: 4, ink: '#ffffff', accent: '#ffd23f', head: 'display', body: 'geo' },
  { k: 'sand', n: 'Sand', bg: { t: 'color', c: '#f2e8d5' }, gap: 10, margin: 16, ink: '#3f3426', accent: '#b08d57', head: 'garamond', body: 'clean' },
  { k: 'emerald', n: 'Emerald', bg: { t: 'color', c: '#0f3b2e' }, gap: 10, margin: 16, stroke: 1.2, strokeCol: '#d8b86a', ink: '#f1ead8', accent: '#d8b86a', head: 'elegant', body: 'clean' },
  { k: 'coral', n: 'Coral', bg: { t: 'color', c: '#fff5f2' }, gap: 10, margin: 14, r: 10, ink: '#2b2b2b', accent: '#ff5a5f', head: 'clean', body: 'clean' },
  { k: 'dusk', n: 'Dusk', bg: { t: 'grad', c: '#2b1055', c2: '#d53369', a: 160 }, gap: 10, margin: 14, r: 8, ink: '#ffffff', accent: '#ffd1dc', head: 'script', body: 'geo' },
  { k: 'planner', n: 'Planner', bg: { t: 'color', c: '#fbfaf6' }, gap: 8, margin: 14, r: 6, ink: '#33302b', accent: '#e07a5f', head: 'geo', body: 'clean' },
  { k: 'swiss', n: 'Swiss', bg: { t: 'color', c: '#f4f1ea' }, gap: 6, margin: 12, ink: '#111111', accent: '#e63946', head: 'clean', body: 'clean' }
);
for (const s of STYLES.slice(-12)) SMAP[s.k] = s;
const TPL3 = (() => {
  const W = '#ffffff';
  const det = (T, lines, y, o = {}) => lines.map((l, i) => T(l, o.x ?? 0.08, y + i * (o.step ?? 0.045), o.w ?? 0.84, o.size ?? 13, { align: o.align || 'center', bold: !!o.bold, ...(o.extra || {}) }));
  const rule = (G, s, x, y, w, o = {}) => G('block', x, y, w, o.t || 0.0016, { col: o.col || s.ink, op: o.op ?? 0.3, keepCol: !!o.col });
  const writeLines = (G, s, x, y, w, n, step) => Array.from({ length: n }, (_, i) => rule(G, s, x, y + i * step, w, { op: 0.22 }));
  const box = (G, x, y, w, h, o = {}) => G('block', x, y, w, h, { col: o.col || '#ffffff', op: o.op ?? 1, keepCol: true });
  const tick = (T, items, x, y, w, size, step) => items.map((t, i) => T('☐  ' + t, x, y + i * step, w, size, { align: 'left' }));
  const table = (G, s, x0, y0, w, h, rows, cols, o = {}) => { const out = []; for (let r = 0; r <= rows; r++) out.push(G('block', x0, y0 + r * h / rows, w, 0.0016, { col: s.ink, op: r === 0 || r === rows ? 0.5 : 0.22 })); for (let c = 0; c <= cols; c++) if (o.vert !== false) out.push(G('block', x0 + c * w / cols, y0, 0.0016, h, { col: s.ink, op: 0.22 })); return out; };
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return [
    /* Planners */
    { k: 'pl-week', n: 'Weekly planner', cat: 'Planners', style: 'planner', build: ({ T, G, s }) => { const out = [T('This week', 0.06, 0.035, 0.6, 34, { head: 1, bold: 1, align: 'left' }), T('Week of ______________', 0.6, 0.05, 0.34, 11, { align: 'right' })]; DAYS.forEach((d, i) => { const c = i % 2, r = Math.floor(i / 2); const x = 0.06 + c * 0.455, y = 0.12 + r * 0.205; out.push(box(G, x, y, 0.425, 0.185, { col: i === 6 ? s.accent : '#ffffff', op: i === 6 ? 0.12 : 1 }), T(d.toUpperCase(), x + 0.02, y + 0.012, 0.3, 10, { bold: 1, ls: 0.2, align: 'left', col: s.accent, keepCol: 1 }), ...writeLines(G, s, x + 0.02, y + 0.06, 0.385, 4, 0.03)); }); out.push(T('NOTES', 0.535, 0.735, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' })); return out; } },
    { k: 'pl-day', n: 'Daily planner', cat: 'Planners', style: 'sage', build: ({ T, G, s }) => { const out = [T('Today', 0.06, 0.035, 0.5, 44, { font: 'script', align: 'left' }), T('Date ____ / ____ / ______', 0.5, 0.06, 0.44, 11, { align: 'right' }), T('SCHEDULE', 0.06, 0.13, 0.5, 10, { bold: 1, ls: 0.25, align: 'left' })]; for (let h = 6; h <= 21; h++) { const y = 0.165 + (h - 6) * 0.048; out.push(T(String(h).padStart(2, '0') + ':00', 0.06, y, 0.1, 10, { align: 'left', col: s.accent, keepCol: 1 }), rule(G, s, 0.15, y + 0.025, 0.4)); } out.push(box(G, 0.6, 0.13, 0.34, 0.25), T('TOP 3 PRIORITIES', 0.62, 0.145, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' }), ...tick(T, ['', '', ''], 0.62, 0.19, 0.3, 13, 0.055), box(G, 0.6, 0.4, 0.34, 0.3), T('TO DO', 0.62, 0.415, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' }), ...tick(T, ['', '', '', '', ''], 0.62, 0.455, 0.3, 12, 0.045), box(G, 0.6, 0.72, 0.34, 0.2), T('WATER', 0.62, 0.735, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' }), T('○ ○ ○ ○ ○ ○ ○ ○', 0.62, 0.77, 0.3, 16, { align: 'left', col: s.accent, keepCol: 1 }), T('NOTE TO SELF', 0.62, 0.83, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' })); return out; } },
    { k: 'pl-month', n: 'Monthly goals', cat: 'Planners', style: 'lavender', build: ({ T, G, s }) => { const q = (x, y, t) => [box(G, x, y, 0.42, 0.34, { op: 0.75 }), T(t, x + 0.025, y + 0.02, 0.37, 15, { head: 1, bold: 1, align: 'left' }), ...writeLines(G, s, x + 0.025, y + 0.09, 0.37, 7, 0.033)]; return [T('Monthly goals', 0.06, 0.04, 0.88, 44, { font: 'script' }), T('MONTH ______________', 0.06, 0.12, 0.88, 11, { ls: 0.3 }), ...q(0.06, 0.18, 'Work'), ...q(0.52, 0.18, 'Health'), ...q(0.06, 0.55, 'Money'), ...q(0.52, 0.55, 'Me time'), T('One word for this month: ______________', 0.06, 0.92, 0.88, 12, { ital: 1 })]; } },
    { k: 'pl-habit', n: 'Habit tracker', cat: 'Planners', style: 'planner', build: ({ T, G, s }) => { const out = [T('Habit tracker', 0.05, 0.035, 0.9, 36, { head: 1, bold: 1, align: 'left' }), T('Month ______________', 0.05, 0.1, 0.9, 11, { align: 'left' })]; const x0 = 0.3, y0 = 0.16, cw = 0.65 / 31, rh = 0.075; for (let d = 1; d <= 31; d++) out.push(T(String(d), x0 + (d - 1) * cw, y0, cw, 7, { col: s.accent, keepCol: 1 })); ['Wake up early', 'Exercise', 'Read 20 min', 'Drink water', 'No sugar', 'Walk 10k steps', 'Meditate', 'Call family', 'Sleep by 11', 'Journal'].forEach((h, i) => { const y = y0 + 0.03 + i * rh; out.push(T(h, 0.05, y + 0.02, 0.24, 11, { align: 'left' })); for (let d = 0; d < 31; d++) out.push(G('ringg', x0 + d * cw + cw * 0.12, y + 0.022, cw * 0.76, cw * 0.76 * 0.707, { sw: 0.6, col: s.ink, op: 0.35 })); out.push(rule(G, s, 0.05, y + rh - 0.005, 0.9, { op: 0.12 })); }); return out; } },
    { k: 'pl-budget', n: 'Monthly budget', cat: 'Planners', style: 'sand', build: ({ T, G, s }) => { const sec = (y, t, rows) => { const out = [T(t, 0.06, y, 0.4, 14, { head: 1, bold: 1, align: 'left' }), T('Planned', 0.56, y + 0.004, 0.17, 10, { bold: 1, align: 'right', ls: 0.1 }), T('Actual', 0.77, y + 0.004, 0.17, 10, { bold: 1, align: 'right', ls: 0.1 })]; rows.forEach((r, i) => { const yy = y + 0.04 + i * 0.033; out.push(T(r, 0.06, yy, 0.45, 11, { align: 'left' }), rule(G, s, 0.06, yy + 0.027, 0.88, { op: 0.15 })); }); return out; }; return [T('Monthly budget', 0.06, 0.035, 0.88, 38, { head: 1, align: 'left' }), T('Month ____________   Year ______', 0.06, 0.1, 0.88, 11, { align: 'left' }), box(G, 0.06, 0.14, 0.88, 0.07, { col: s.accent, op: 0.15 }), T('Income ₹ ________        Spent ₹ ________        Saved ₹ ________', 0.08, 0.162, 0.84, 12, { bold: 1 }), ...sec(0.24, 'Income', ['Salary', 'Other']), ...sec(0.38, 'Home', ['Rent or EMI', 'Electricity and water', 'Internet and phone', 'Groceries']), ...sec(0.6, 'Life', ['Transport', 'Eating out', 'Health', 'Shopping', 'Gifts']), ...sec(0.85, 'Savings', ['Investments'])]; } },
    { k: 'pl-meal', n: 'Meal planner', cat: 'Planners', style: 'peach', build: ({ T, G, s }) => { const out = [T('Meal plan', 0.05, 0.035, 0.9, 42, { font: 'script' }), T('WEEK OF ______________', 0.05, 0.11, 0.9, 11, { ls: 0.3 })]; const x0 = 0.05, y0 = 0.17, cw = [0.16, 0.26, 0.26, 0.22]; ['', 'Breakfast', 'Lunch', 'Dinner'].forEach((h, i) => out.push(T(h.toUpperCase(), x0 + cw.slice(0, i).reduce((a, b) => a + b, 0), y0, cw[i], 10, { bold: 1, ls: 0.15 }))); DAYS.forEach((d, r) => { const y = y0 + 0.035 + r * 0.075; out.push(box(G, x0, y, 0.9, 0.068, { op: 0.65 }), T(d.slice(0, 3).toUpperCase(), x0, y + 0.022, 0.16, 12, { bold: 1, col: s.accent, keepCol: 1 })); }); out.push(T('SHOPPING LIST', 0.05, 0.75, 0.4, 10, { bold: 1, ls: 0.2, align: 'left' }), ...tick(T, ['', '', '', ''], 0.05, 0.785, 0.42, 12, 0.042), ...tick(T, ['', '', '', ''], 0.52, 0.785, 0.42, 12, 0.042)); return out; } },
    { k: 'pl-todo', n: 'To-do list', cat: 'Planners', style: 'coral', build: ({ T, G, s }) => [G('block', 0, 0, 0.035, 1, { col: s.accent }), T('To do', 0.1, 0.04, 0.8, 54, { head: 1, bold: 1, align: 'left' }), T('Date ______________', 0.1, 0.13, 0.8, 12, { align: 'left' }), ...Array.from({ length: 16 }, (_, i) => [T('☐', 0.1, 0.19 + i * 0.047, 0.05, 16, { align: 'left', col: s.accent, keepCol: 1 }), rule(G, s, 0.16, 0.215 + i * 0.047, 0.76, { op: 0.18 })]).flat()] },
    { k: 'pl-reading', n: 'Reading log', cat: 'Planners', style: 'terra', build: ({ T, G, s }) => { const out = [T('Reading log', 0.06, 0.035, 0.88, 40, { head: 1, align: 'left' }), T('Books I read this year', 0.06, 0.105, 0.88, 12, { ital: 1, align: 'left' })]; const cols = [['Title', 0.06, 0.36], ['Author', 0.43, 0.24], ['Finished', 0.68, 0.13], ['Rating', 0.82, 0.12]]; cols.forEach(([t, x, w]) => out.push(T(t.toUpperCase(), x, 0.16, w, 9.5, { bold: 1, ls: 0.18, align: 'left', col: s.accent, keepCol: 1 }))); for (let i = 0; i < 18; i++) { const y = 0.19 + i * 0.042; out.push(rule(G, s, 0.06, y + 0.034, 0.88, { op: 0.18 }), T('☆☆☆☆☆', 0.82, y + 0.008, 0.12, 10, { align: 'left', col: s.accent, keepCol: 1 })); } return out; } },
    { k: 'pl-workout', n: 'Workout log', cat: 'Planners', style: 'swiss', build: ({ T, G, s }) => { const out = [G('block', 0, 0, 1, 0.13, { col: '#111111', keepCol: 1 }), T('WORKOUT', 0.06, 0.03, 0.6, 46, { font: 'display', col: W, keepCol: 1, align: 'left' }), T('Date ________  Body weight ______', 0.5, 0.065, 0.44, 11, { col: W, keepCol: 1, align: 'right' })]; ['Exercise', 'Set 1', 'Set 2', 'Set 3', 'Set 4'].forEach((h, i) => out.push(T(h.toUpperCase(), i ? 0.42 + (i - 1) * 0.13 : 0.06, 0.16, i ? 0.13 : 0.34, 9.5, { bold: 1, ls: 0.15, align: i ? 'center' : 'left', col: s.accent, keepCol: 1 }))); out.push(...table(G, s, 0.06, 0.19, 0.88, 0.56, 10, 1, { vert: false })); for (let i = 0; i < 4; i++) out.push(G('block', 0.42 + i * 0.13, 0.19, 0.0016, 0.56, { col: s.ink, op: 0.2 })); out.push(T('CARDIO', 0.06, 0.79, 0.4, 10, { bold: 1, ls: 0.2, align: 'left' }), T('Type ______   Minutes ______   Distance ______', 0.06, 0.82, 0.88, 12, { align: 'left' }), T('HOW I FELT  ☹  😐  🙂  😀  💪', 0.06, 0.88, 0.88, 13, { align: 'left' })); return out; } },
    { k: 'pl-gratitude', n: 'Gratitude journal', cat: 'Planners', style: 'blush', build: ({ T, G, s }) => [G('flower', 0.42, 0.04, 0.16, 0.1), T('Grateful', 0.06, 0.15, 0.88, 50, { font: 'script' }), T('Date ______________', 0.06, 0.25, 0.88, 11, { ls: 0.1 }), T('Three good things today', 0.08, 0.31, 0.84, 14, { head: 1, bold: 1, align: 'left' }), ...[0, 1, 2].map((i) => T(`${i + 1}.`, 0.08, 0.36 + i * 0.07, 0.05, 14, { align: 'left', col: s.accent, keepCol: 1 })), ...[0, 1, 2].map((i) => rule(G, s, 0.13, 0.39 + i * 0.07, 0.79)), T('Someone I am thankful for', 0.08, 0.6, 0.84, 14, { head: 1, bold: 1, align: 'left' }), ...writeLines(G, s, 0.08, 0.67, 0.84, 2, 0.05), T('Tomorrow I will', 0.08, 0.79, 0.84, 14, { head: 1, bold: 1, align: 'left' }), ...writeLines(G, s, 0.08, 0.86, 0.84, 2, 0.05)] },
    { k: 'pl-year', n: 'Year at a glance', cat: 'Planners', style: 'clean', build: ({ T, G, s }) => { const out = [T('2027', 0.06, 0.03, 0.88, 60, { font: 'display', align: 'left' }), T('YEAR AT A GLANCE', 0.06, 0.12, 0.88, 11, { ls: 0.35, align: 'left' })]; MONTHS.forEach((m, i) => { const c = i % 3, r = Math.floor(i / 3); const x = 0.06 + c * 0.3, y = 0.18 + r * 0.2; out.push(G('block', x, y, 0.27, 0.004, { col: s.accent === '#1d1d1f' ? '#e63946' : s.accent, keepCol: 1 }), T(m.toUpperCase(), x, y + 0.01, 0.27, 11, { bold: 1, ls: 0.2, align: 'left' }), ...writeLines(G, s, x, y + 0.07, 0.27, 4, 0.03)); }); return out; } },
    { k: 'pl-exam', n: 'Exam study plan', cat: 'Planners', style: 'cobalt', build: ({ T, G, s }) => { const out = [T('EXAM PLAN', 0.06, 0.035, 0.88, 50, { font: 'display', align: 'left' }), T('Exam ______________   Date ______________', 0.06, 0.12, 0.88, 12, { align: 'left' }), box(G, 0.06, 0.17, 0.88, 0.1, { col: '#ffd23f' }), T('DAYS LEFT', 0.08, 0.19, 0.3, 11, { bold: 1, ls: 0.2, align: 'left', col: '#1736a8', keepCol: 1 }), T('30', 0.66, 0.175, 0.26, 50, { font: 'display', align: 'right', col: '#1736a8', keepCol: 1 })]; ['Subject', 'Topic', 'Done'].forEach((h, i) => out.push(T(h.toUpperCase(), [0.06, 0.36, 0.82][i], 0.31, [0.28, 0.44, 0.12][i], 10, { bold: 1, ls: 0.15, align: 'left' }))); for (let i = 0; i < 13; i++) { const y = 0.345 + i * 0.047; out.push(G('block', 0.06, y + 0.04, 0.88, 0.0016, { col: W, op: 0.35, keepCol: 1 }), T('☐', 0.82, y + 0.008, 0.1, 14, { align: 'left' })); } return out; } },
    /* Business */
    { k: 'bz-price', n: 'Price list', cat: 'Business', style: 'noirgold', build: ({ T, G, s }) => { const out = [T('Price list', 0.06, 0.05, 0.88, 50, { font: 'script' }), T('STUDIO NAME', 0.06, 0.15, 0.88, 12, { ls: 0.4 }), G('swash', 0.35, 0.185, 0.3, 0.03, { sw: 1 })]; [['Haircut', '₹ 400'], ['Hair spa', '₹ 900'], ['Colour, global', '₹ 2,500'], ['Facial', '₹ 1,200'], ['Manicure', '₹ 500'], ['Pedicure', '₹ 600'], ['Bridal package', 'on request']].forEach(([a, b], i) => { const y = 0.26 + i * 0.075; out.push(T(a, 0.12, y, 0.5, 16, { head: 1, align: 'left' }), T(b, 0.56, y, 0.32, 16, { align: 'right', col: s.accent, keepCol: 1 }), G('dots', 0.12, y + 0.04, 0.76, 0.01, { op: 0.4 })); }); out.push(T('Book: +91 00000 00000 · @studioname', 0.06, 0.9, 0.88, 12, { ls: 0.1 })); return out; } },
    { k: 'bz-voucher', n: 'Gift voucher', cat: 'Business', size: 'a6l', style: 'emerald', build: ({ T, G }) => [G('border', 0.03, 0.05, 0.94, 0.9, { sw: 1.2 }), G('block', 0.68, 0, 0.002, 1, { op: 0.6 }), T('GIFT VOUCHER', 0.06, 0.15, 0.6, 12, { ls: 0.4 }), T('A treat for you', 0.06, 0.28, 0.6, 30, { font: 'script' }), T('To ______________\nFrom ______________', 0.06, 0.58, 0.6, 11, { lh: 1.7 }), T('₹ 2,000', 0.69, 0.3, 0.28, 26, { head: 1, bold: 1 }), T('Valid till\n__ / __ / ____\nNo. 0001', 0.69, 0.55, 0.28, 9, { lh: 1.5 })] },
    { k: 'bz-coupon', n: 'Discount coupon', cat: 'Business', size: 'a6l', style: 'coral', build: ({ T, G, s }) => [G('block', 0, 0, 0.36, 1, { col: s.accent }), T('20%', 0.02, 0.24, 0.32, 54, { font: 'display', col: W, keepCol: 1 }), T('OFF', 0.02, 0.56, 0.32, 20, { font: 'display', ls: 0.3, col: W, keepCol: 1 }), G('dline', 0.36, 0.06, 0.01, 0.88, { op: 0.5 }), T('Your next visit', 0.42, 0.18, 0.54, 20, { head: 1, bold: 1, align: 'left' }), T('Show this coupon at the counter. One per customer.', 0.42, 0.42, 0.52, 10, { align: 'left', lh: 1.45 }), T('CODE: SAVE20  ·  Valid till 31 Dec', 0.42, 0.78, 0.54, 9, { bold: 1, ls: 0.1, align: 'left' })] },
    { k: 'bz-product', n: 'Product sheet', cat: 'Business', style: 'swiss', build: ({ T, F, G, s }) => [T('NEW', 0.06, 0.04, 0.2, 12, { bold: 1, ls: 0.3, align: 'left', col: s.accent, keepCol: 1 }), T('Product name', 0.06, 0.07, 0.88, 46, { head: 1, bold: 1, align: 'left' }), T('One line that says what it is and who it is for.', 0.06, 0.15, 0.88, 14, { align: 'left' }), F(0.06, 0.2, 0.88, 0.42), ...[['Feature one', 'Short explanation of why it matters.'], ['Feature two', 'Short explanation of why it matters.'], ['Feature three', 'Short explanation of why it matters.']].flatMap(([a, b], i) => [G('block', 0.06 + i * 0.3, 0.66, 0.26, 0.004, { col: s.accent }), T(a, 0.06 + i * 0.3, 0.675, 0.26, 14, { bold: 1, align: 'left' }), T(b, 0.06 + i * 0.3, 0.71, 0.26, 10.5, { align: 'left', lh: 1.45 })]), G('block', 0, 0.86, 1, 0.14, { col: '#111111', keepCol: 1 }), T('₹ 1,999', 0.06, 0.895, 0.4, 30, { font: 'display', align: 'left', col: W, keepCol: 1 }), T('yourwebsite.com', 0.5, 0.91, 0.44, 13, { align: 'right', col: W, keepCol: 1 })] },
    { k: 'bz-appreciate', n: 'Certificate of appreciation', cat: 'Business', size: 'a4l', style: 'noirgold', build: ({ T, G, Sq }) => [G('border', 0.03, 0.045, 0.94, 0.91, { sw: 2 }), G('border', 0.045, 0.066, 0.91, 0.868, { sw: 0.6 }), G('corner', 0.06, 0.09, 0.06, 0.08, { sw: 1 }), G('corner', 0.88, 0.09, 0.06, 0.08, { sw: 1, flip: true }), T('CERTIFICATE', 0.1, 0.13, 0.8, 40, { head: 1, ls: 0.15 }), T('OF APPRECIATION', 0.1, 0.25, 0.8, 13, { ls: 0.5 }), T('This is proudly presented to', 0.1, 0.35, 0.8, 13, { ital: 1 }), T('Recipient Name', 0.1, 0.42, 0.8, 46, { font: 'script' }), T('In recognition of outstanding dedication, teamwork and the extra mile, every day.', 0.2, 0.58, 0.6, 12, { lh: 1.5 }), Sq('seal', 0.5, 0.79, 0.13), G('block', 0.12, 0.84, 0.22, 0.0018, { op: 0.6 }), G('block', 0.66, 0.84, 0.22, 0.0018, { op: 0.6 }), T('Manager', 0.12, 0.855, 0.22, 10, { ls: 0.2 }), T('Date', 0.66, 0.855, 0.22, 10, { ls: 0.2 })] },
    { k: 'bz-idcard', n: 'ID card', cat: 'Business', size: 'bc', style: 'corporate', build: ({ T, F, G }) => [G('block', 0, 0, 1, 0.26, { col: '#13233f', keepCol: 1 }), T('COMPANY NAME', 0.05, 0.07, 0.9, 30, { bold: 1, ls: 0.25, col: W, keepCol: 1 }), F(0.06, 0.34, 0.27, 0.56, { r: 4 }), T('Full Name', 0.38, 0.36, 0.58, 46, { head: 1, bold: 1, align: 'left' }), T('Designation', 0.38, 0.55, 0.58, 30, { align: 'left' }), T('ID  00123\nValid to 12/2028', 0.38, 0.7, 0.58, 24, { align: 'left', lh: 1.35 })] },
    { k: 'bz-quote', n: 'Quotation', cat: 'Business', style: 'swiss', build: ({ T, G, s }) => { const out = [T('Quotation', 0.06, 0.05, 0.5, 40, { head: 1, bold: 1, align: 'left' }), T('Your Company\nAddress line\nphone · email', 0.55, 0.05, 0.39, 10.5, { align: 'right', lh: 1.5 }), G('block', 0.06, 0.16, 0.88, 0.004, { col: s.accent }), T('PREPARED FOR\nClient name\nClient address', 0.06, 0.19, 0.4, 10.5, { align: 'left', lh: 1.55 }), T('Quote no.  Q-0012\nDate  __ / __ / ____\nValid for  30 days', 0.55, 0.19, 0.39, 10.5, { align: 'right', lh: 1.55 })]; [['Item', 0.06, 0.46, 'left'], ['Qty', 0.52, 0.1, 'center'], ['Price', 0.62, 0.15, 'right'], ['Total', 0.79, 0.15, 'right']].forEach(([t, x, w, a]) => out.push(T(t.toUpperCase(), x, 0.33, w, 9.5, { bold: 1, ls: 0.18, align: a }))); out.push(...table(G, s, 0.06, 0.36, 0.88, 0.36, 8, 1, { vert: false }), T('Subtotal\nTax\nTOTAL', 0.6, 0.75, 0.18, 11, { align: 'right', lh: 1.7, bold: 1 }), T('₹ ______\n₹ ______\n₹ ______', 0.79, 0.75, 0.15, 11, { align: 'right', lh: 1.7 }), T('Terms: 50% advance, balance on delivery. Thank you for the opportunity.', 0.06, 0.9, 0.88, 10, { align: 'left', ital: 1 })); return out; } },
    { k: 'bz-brochure', n: 'Brochure page', cat: 'Business', size: 'a4l', style: 'sage', build: ({ T, F, G, s }) => [F(0, 0, 0.333, 1), T('About us', 0.36, 0.08, 0.28, 24, { head: 1, bold: 1, align: 'left' }), T('Tell people who you are, what you stand for and why they can trust you. Keep it to a short paragraph.', 0.36, 0.17, 0.28, 11, { align: 'left', lh: 1.55 }), F(0.36, 0.42, 0.28, 0.3, { r: 6 }), T('Our promise: quality, on time, every time.', 0.36, 0.77, 0.28, 13, { ital: 1, align: 'left', head: 1 }), G('block', 0.667, 0, 0.333, 1, { col: s.accent, op: 0.18 }), T('Services', 0.69, 0.08, 0.28, 24, { head: 1, bold: 1, align: 'left' }), T('• Service one\n• Service two\n• Service three\n• Service four\n• Service five', 0.69, 0.17, 0.28, 12, { align: 'left', lh: 1.9 }), T('Contact\n+91 00000 00000\nhello@company.com\ncompany.com', 0.69, 0.66, 0.28, 12, { align: 'left', lh: 1.7, bold: 1 })] },
    { k: 'bz-hiring', n: 'We are hiring', cat: 'Business', style: 'cobalt', build: ({ T, G, Sq }) => [T('WE ARE', 0.06, 0.06, 0.88, 40, { font: 'display', ls: 0.15, align: 'left' }), T('HIRING', 0.06, 0.12, 0.88, 96, { font: 'display', align: 'left', col: '#ffd23f', keepCol: 1 }), Sq('burst', 0.8, 0.12, 0.2, { col: W, keepCol: 1, op: 0.15 }), T('Job title', 0.06, 0.33, 0.88, 30, { bold: 1, align: 'left' }), T('Location · Full time · 2+ years', 0.06, 0.39, 0.88, 14, { align: 'left' }), G('block', 0.06, 0.45, 0.2, 0.004, { col: '#ffd23f', keepCol: 1 }), T("What you'll do\n• First responsibility\n• Second responsibility\n• Third responsibility\n\nWhat you bring\n• Skill or experience\n• Skill or experience", 0.06, 0.48, 0.88, 14, { align: 'left', lh: 1.65 }), T('Apply: jobs@company.com', 0.06, 0.88, 0.88, 18, { bold: 1, align: 'left' })] },
    { k: 'bz-menuboard', n: 'Opening hours sign', cat: 'Business', style: 'terra', build: ({ T, G, s }) => [T('Open', 0.06, 0.08, 0.88, 80, { font: 'script' }), T('COME IN, WE ARE', 0.06, 0.05, 0.88, 12, { ls: 0.35 }), G('swash', 0.3, 0.22, 0.4, 0.03), ...DAYS.flatMap((d, i) => [T(d, 0.16, 0.3 + i * 0.07, 0.4, 18, { head: 1, align: 'left' }), T(i < 6 ? '9:00 to 7:00' : 'Closed', 0.5, 0.3 + i * 0.07, 0.34, 18, { align: 'right', col: i < 6 ? s.ink : s.accent, keepCol: i === 6 })]), T('Shop name · Street · City', 0.06, 0.88, 0.88, 12, { ls: 0.15 })] },
    { k: 'bz-thanksbiz', n: 'Thank you for your order', cat: 'Business', size: 'a6p', style: 'peach', build: ({ T, G, E }) => [E('📦', 0.5, 0.16, 0.18), T('Thank you', 0.06, 0.3, 0.88, 48, { font: 'script' }), T('FOR YOUR ORDER', 0.06, 0.45, 0.88, 13, { ls: 0.3, bold: 1 }), T('Every order supports a small business and a big dream. We hope you love it.', 0.1, 0.53, 0.8, 13, { lh: 1.5 }), T('Tag us @shopname for 10% off next time', 0.06, 0.8, 0.88, 11, { ital: 1 })] },
    { k: 'bz-ticket', n: 'Event ticket', cat: 'Business', size: 'dl', style: 'dusk', build: ({ T, G }) => [T('ADMIT ONE', 0.06, 0.05, 0.88, 16, { bold: 1, ls: 0.35 }), T('Summer Gala', 0.04, 0.12, 0.92, 34, { font: 'script' }), T('Saturday 12 June 2027\n7:00 PM\nGrand Hall, Kochi', 0.06, 0.32, 0.88, 16, { lh: 1.6 }), G('dline', 0.08, 0.6, 0.84, 0.01, { op: 0.6 }), T('SEAT', 0.06, 0.66, 0.42, 11, { ls: 0.3 }), T('ROW', 0.52, 0.66, 0.42, 11, { ls: 0.3 }), T('A 12', 0.06, 0.7, 0.42, 30, { font: 'display' }), T('F', 0.52, 0.7, 0.42, 30, { font: 'display' }), T('No. 000123', 0.06, 0.9, 0.88, 11, { ls: 0.2 })] },
    /* Social */
    { k: 'sc-carousel', n: 'Carousel cover', cat: 'Social', size: 'ig45', style: 'swiss', build: ({ T, G, s }) => [T('5 THINGS', 0.08, 0.1, 0.84, 30, { font: 'display', align: 'left', col: s.accent, keepCol: 1 }), T('I wish I knew before my first contract', 0.08, 0.17, 0.84, 52, { head: 1, bold: 1, align: 'left', lh: 1.05 }), G('arrow', 0.72, 0.82, 0.2, 0.07, { sw: 2, col: s.ink }), T('Swipe', 0.08, 0.83, 0.5, 18, { align: 'left', bold: 1 })] },
    { k: 'sc-tip', n: 'Carousel tip', cat: 'Social', size: 'ig45', style: 'swiss', build: ({ T, G, s }) => [T('01', 0.08, 0.08, 0.84, 120, { font: 'display', align: 'left', col: s.accent, keepCol: 1 }), T('Pack light, but never skip the warm jacket.', 0.08, 0.38, 0.84, 40, { head: 1, bold: 1, align: 'left', lh: 1.1 }), T('Engine rooms are hot, but bridge wings at 3 AM in the North Atlantic are not.', 0.08, 0.66, 0.84, 18, { align: 'left', lh: 1.4 }), G('block', 0.08, 0.92, 0.84, 0.003, { col: s.ink, op: 0.3 }), G('block', 0.08, 0.92, 0.17, 0.003, { col: s.accent })] },
    { k: 'sc-testimonial', n: 'Testimonial post', cat: 'Social', size: 'igsq', style: 'lavender', build: ({ T, Fc, Sq }) => [Sq('quoteg', 0.15, 0.15, 0.14, { op: 0.6 }), T('They delivered on time and the quality was better than we expected. Highly recommended.', 0.1, 0.25, 0.8, 28, { head: 1, lh: 1.3, align: 'left' }), Fc(0.18, 0.8, 0.14), T('Customer Name', 0.29, 0.765, 0.6, 18, { bold: 1, align: 'left' }), T('★★★★★  Company, City', 0.29, 0.81, 0.6, 14, { align: 'left' })] },
    { k: 'sc-launch', n: 'Product launch', cat: 'Social', size: 'igsq', style: 'noirgold', build: ({ T, F }) => [T('INTRODUCING', 0.06, 0.07, 0.88, 16, { ls: 0.5 }), F(0.15, 0.15, 0.7, 0.55, { r: 4 }), T('Product Name', 0.06, 0.74, 0.88, 46, { font: 'script' }), T('Available now · link in bio', 0.06, 0.87, 0.88, 14, { ls: 0.15 })] },
    { k: 'sc-beforeafter', n: 'Before and after', cat: 'Social', size: 'igsq', style: 'clean', build: ({ T, F, G }) => [F(0, 0, 0.5, 1), F(0.5, 0, 0.5, 1), G('block', 0.4985, 0, 0.003, 1, { col: W, keepCol: 1 }), G('pillg', 0.04, 0.04, 0.2, 0.08, { col: '#000000', op: 0.55, keepCol: 1 }), T('BEFORE', 0.04, 0.062, 0.2, 13, { bold: 1, ls: 0.15, col: W, keepCol: 1 }), G('pillg', 0.76, 0.04, 0.2, 0.08, { col: '#000000', op: 0.55, keepCol: 1 }), T('AFTER', 0.76, 0.062, 0.2, 13, { bold: 1, ls: 0.15, col: W, keepCol: 1 })] },
    { k: 'sc-thisorthat', n: 'This or that', cat: 'Social', size: 'igsq', style: 'peach', build: ({ T, F, Fc }) => [T('This or that?', 0.06, 0.06, 0.88, 46, { font: 'script' }), F(0.06, 0.22, 0.42, 0.56, { r: 16 }), F(0.52, 0.22, 0.42, 0.56, { r: 16 }), Fc(0.5, 0.5, 0.13, { stroke: 4, strokeCol: W }), T('OR', 0.44, 0.48, 0.12, 20, { font: 'display', col: '#5a2e1d', keepCol: 1 }), T('Sunrise', 0.06, 0.81, 0.42, 22, { bold: 1 }), T('Sunset', 0.52, 0.81, 0.42, 22, { bold: 1 }), T('Tell us in the comments', 0.06, 0.9, 0.88, 13, { ital: 1 })] },
    { k: 'sc-giveaway', n: 'Giveaway post', cat: 'Social', size: 'igsq', style: 'dusk', build: ({ T, F, E }) => [T('GIVEAWAY', 0.06, 0.06, 0.88, 64, { font: 'display' }), F(0.2, 0.2, 0.6, 0.4, { r: 14, stroke: 4, strokeCol: W }), E('🎁', 0.82, 0.22, 0.12), T('How to enter\n1. Follow us\n2. Like this post\n3. Tag two friends', 0.1, 0.64, 0.8, 18, { lh: 1.5, bold: 1 }), T('Winner announced Friday', 0.06, 0.92, 0.88, 13, { ital: 1 })] },
    { k: 'sc-event', n: 'Event announcement', cat: 'Social', size: 'ig45', style: 'emerald', build: ({ T, F, G }) => [F(0, 0, 1, 0.55), T('SAVE THE DATE', 0.06, 0.59, 0.88, 14, { ls: 0.45 }), T('Event Name', 0.06, 0.63, 0.88, 50, { font: 'script' }), G('swash', 0.3, 0.75, 0.4, 0.025), T('24 · 04 · 2027  ·  6 PM\nVenue, City', 0.06, 0.8, 0.88, 16, { lh: 1.6 })] },
    { k: 'sc-countdown', n: 'Countdown story', cat: 'Social', size: 'igst', style: 'cobalt', build: ({ T, G }) => [T('ONLY', 0.06, 0.18, 0.88, 40, { font: 'display', ls: 0.3 }), T('3', 0.06, 0.24, 0.88, 280, { font: 'display', col: '#ffd23f', keepCol: 1 }), T('DAYS LEFT', 0.06, 0.6, 0.88, 40, { font: 'display', ls: 0.15 }), G('block', 0.3, 0.7, 0.4, 0.003, { col: '#ffd23f', keepCol: 1 }), T('Until the big launch', 0.06, 0.73, 0.88, 22, { ital: 1 }), T('Turn on notifications', 0.06, 0.9, 0.88, 16, { bold: 1 })] },
    { k: 'sc-storyquote', n: 'Quote story', cat: 'Social', size: 'igst', style: 'sand', build: ({ T, G }) => [G('quoteg', 0.4, 0.25, 0.2, 0.08, { op: 0.6 }), T('The sea, once it casts its spell, holds one in its net of wonder forever.', 0.1, 0.37, 0.8, 38, { head: 1, lh: 1.3 }), G('block', 0.42, 0.68, 0.16, 0.002, { op: 0.7 }), T('JACQUES COUSTEAU', 0.06, 0.7, 0.88, 14, { ls: 0.35 })] },
    { k: 'sc-list', n: 'Tips list post', cat: 'Social', size: 'ig45', style: 'coral', build: ({ T, G, s }) => [T('Morning routine', 0.08, 0.07, 0.84, 40, { head: 1, bold: 1, align: 'left' }), T('that actually works', 0.08, 0.14, 0.84, 26, { font: 'script', align: 'left', col: s.accent, keepCol: 1 }), ...['Wake at the same time', 'Water before coffee', '10 minutes of stretching', 'Plan three priorities', 'No phone for 30 minutes'].flatMap((t, i) => [G('circle', 0.08, 0.27 + i * 0.12, 0.08, 0.064), T(String(i + 1), 0.08, 0.282 + i * 0.12, 0.08, 18, { bold: 1, col: W, keepCol: 1 }), T(t, 0.2, 0.282 + i * 0.12, 0.72, 20, { align: 'left' })]), T('Save this for tomorrow', 0.08, 0.91, 0.84, 14, { ital: 1, align: 'left' })] },
    { k: 'sc-hiring', n: 'Hiring post', cat: 'Social', size: 'igsq', style: 'swiss', build: ({ T, G, s }) => [G('block', 0, 0, 1, 0.5, { col: s.accent }), T("WE'RE", 0.07, 0.08, 0.86, 40, { font: 'display', align: 'left', col: W, keepCol: 1 }), T('HIRING', 0.07, 0.17, 0.86, 96, { font: 'display', align: 'left', col: W, keepCol: 1 }), T('Graphic Designer', 0.07, 0.56, 0.86, 34, { head: 1, bold: 1, align: 'left' }), T('Remote · Full time', 0.07, 0.65, 0.86, 18, { align: 'left' }), T('Send your portfolio to\njobs@company.com', 0.07, 0.77, 0.86, 18, { align: 'left', lh: 1.4, bold: 1 })] },
    /* Events */
    { k: 'ev2-festival', n: 'Music festival', cat: 'Events', style: 'dusk', build: ({ T, G, Sq }) => [Sq('sun', 0.5, 0.25, 0.42, { col: '#ffd1dc', op: 0.35 }), T('SUNSET', 0.05, 0.08, 0.9, 80, { font: 'display' }), T('SOUNDS', 0.05, 0.2, 0.9, 80, { font: 'display', col: '#ffd1dc', keepCol: 1 }), T('Music festival 2027', 0.05, 0.36, 0.9, 30, { font: 'script' }), G('block', 0.1, 0.47, 0.8, 0.002, { op: 0.7 }), T('ARTIST ONE · ARTIST TWO · ARTIST THREE\nARTIST FOUR · ARTIST FIVE · DJ SIX', 0.05, 0.5, 0.9, 18, { bold: 1, lh: 1.7, ls: 0.08 }), T('12 to 14 MARCH  ·  BEACH GROUNDS, KOVALAM', 0.05, 0.75, 0.9, 15, { ls: 0.15 }), T('Tickets at yourlink.com', 0.05, 0.88, 0.9, 13, { ital: 1 })] },
    { k: 'ev2-movie', n: 'Movie night', cat: 'Events', style: 'noirgold', build: ({ T, F, E }) => [T('MOVIE', 0.05, 0.05, 0.9, 70, { font: 'display', ls: 0.15 }), T('NIGHT', 0.05, 0.15, 0.9, 70, { font: 'display', ls: 0.15, col: '#c9a45c', keepCol: 1 }), F(0.1, 0.28, 0.8, 0.4, { r: 4, stroke: 2, strokeCol: '#c9a45c' }), E('🍿', 0.86, 0.66, 0.12), T('Friday · 8:00 PM · Crew lounge', 0.05, 0.73, 0.9, 18, { bold: 1 }), T('Popcorn provided · Bring a blanket', 0.05, 0.79, 0.9, 13, { ital: 1 })] },
    { k: 'ev2-conf', n: 'Conference poster', cat: 'Events', style: 'swiss', build: ({ T, G, s }) => [G('block', 0.06, 0.06, 0.88, 0.006, { col: s.accent }), T('MARITIME', 0.06, 0.09, 0.88, 64, { font: 'display', align: 'left' }), T('FUTURES', 0.06, 0.18, 0.88, 64, { font: 'display', align: 'left', col: s.accent, keepCol: 1 }), T('Annual conference 2027', 0.06, 0.29, 0.88, 18, { align: 'left' }), ...[['Day 1', 'Decarbonisation and new fuels'], ['Day 2', 'Digital ships and crews'], ['Day 3', 'Safety culture']].flatMap(([d, t], i) => [T(d.toUpperCase(), 0.06, 0.4 + i * 0.09, 0.2, 12, { bold: 1, ls: 0.2, align: 'left', col: s.accent, keepCol: 1 }), T(t, 0.26, 0.396 + i * 0.09, 0.68, 18, { align: 'left' })]), G('block', 0.06, 0.7, 0.88, 0.0016, { op: 0.4, col: s.ink }), T('14 to 16 May  ·  Convention Centre, Mumbai\nRegister at maritimefutures.org', 0.06, 0.73, 0.88, 14, { align: 'left', lh: 1.6 })] },
    { k: 'ev2-yoga', n: 'Yoga class', cat: 'Events', style: 'sage', build: ({ T, Fc, G }) => [Fc(0.5, 0.3, 0.5), G('leaf', 0.12, 0.08, 0.12, 0.08, { op: 0.6 }), G('leaf', 0.76, 0.46, 0.12, 0.08, { op: 0.6, flip: true }), T('Morning yoga', 0.06, 0.58, 0.88, 50, { font: 'script' }), T('BREATHE · STRETCH · RESET', 0.06, 0.69, 0.88, 13, { ls: 0.3 }), T('Every Saturday 6:30 AM\nBeach park · All levels welcome', 0.06, 0.76, 0.88, 15, { lh: 1.6 })] },
    { k: 'ev2-art', n: 'Art exhibition', cat: 'Events', style: 'clean', build: ({ T, F, G }) => [F(0.06, 0.05, 0.88, 0.58), T('Colours of the Coast', 0.06, 0.67, 0.88, 36, { head: 1, ital: 1, align: 'left' }), T('AN EXHIBITION OF WATERCOLOURS', 0.06, 0.74, 0.88, 12, { ls: 0.3, align: 'left' }), G('block', 0.06, 0.79, 0.88, 0.0016, { op: 0.4 }), T('Artist Name\n10 to 20 April · 11 AM to 7 PM\nDurbar Hall Art Gallery, Kochi', 0.06, 0.81, 0.88, 13, { align: 'left', lh: 1.6 })] },
    { k: 'ev2-book', n: 'Book launch', cat: 'Events', style: 'terra', build: ({ T, F, G }) => [T('BOOK LAUNCH', 0.06, 0.05, 0.88, 14, { ls: 0.45 }), F(0.28, 0.1, 0.44, 0.44, { shadow: 0.6 }), T('Title of the Book', 0.06, 0.58, 0.88, 36, { head: 1, ital: 1 }), T('by Author Name', 0.06, 0.65, 0.88, 16), G('swash', 0.35, 0.7, 0.3, 0.025), T('Reading, conversation and signing\nSunday 9 May · 5 PM · City Library', 0.06, 0.75, 0.88, 14, { lh: 1.6 })] },
    { k: 'ev2-food', n: 'Food festival', cat: 'Events', style: 'peach', build: ({ T, F, E }) => [T('Street food', 0.06, 0.05, 0.88, 56, { font: 'script' }), T('FESTIVAL', 0.06, 0.16, 0.88, 40, { font: 'display', ls: 0.3 }), F(0.06, 0.26, 0.42, 0.3, { r: 16 }), F(0.52, 0.26, 0.42, 0.3, { r: 16 }), E('🌮', 0.12, 0.6, 0.08), E('🍜', 0.5, 0.6, 0.08), E('🍡', 0.88, 0.6, 0.08), T('40 stalls · Live music · Kids zone', 0.06, 0.67, 0.88, 16, { bold: 1 }), T('Saturday and Sunday · 4 PM to 11 PM\nFort Kochi beach', 0.06, 0.74, 0.88, 14, { lh: 1.6 })] },
    { k: 'ev2-webinar', n: 'Webinar slide', cat: 'Events', size: 's169', style: 'lavender', build: ({ T, Fc, G }) => [T('FREE WEBINAR', 0.06, 0.12, 0.5, 12, { ls: 0.4, align: 'left' }), T('How to plan a safe cargo operation', 0.06, 0.2, 0.52, 32, { head: 1, bold: 1, align: 'left', lh: 1.15 }), T('Thursday 18 March · 7 PM IST · 45 minutes', 0.06, 0.58, 0.52, 13, { align: 'left' }), G('pillg', 0.06, 0.68, 0.2, 0.1), T('Register', 0.06, 0.7, 0.2, 13, { bold: 1, col: W, keepCol: 1 }), Fc(0.78, 0.48, 0.5), T('Speaker Name · Chief Officer', 0.58, 0.88, 0.4, 11)] },
    /* Wedding */
    { k: 'wd-welcome', n: 'Wedding welcome sign', cat: 'Wedding', style: 'sage', build: ({ T, G }) => [G('leaf', 0.08, 0.05, 0.2, 0.12, { op: 0.7 }), G('leaf', 0.72, 0.83, 0.2, 0.12, { op: 0.7, flip: true }), T('Welcome', 0.06, 0.2, 0.88, 80, { font: 'script' }), T('TO THE WEDDING OF', 0.06, 0.38, 0.88, 14, { ls: 0.4 }), T('Anna & Rahul', 0.06, 0.45, 0.88, 46, { head: 1 }), G('swash', 0.3, 0.57, 0.4, 0.03), T('14 FEBRUARY 2027', 0.06, 0.63, 0.88, 14, { ls: 0.35 })] },
    { k: 'wd-seating', n: 'Seating chart', cat: 'Wedding', style: 'emerald', build: ({ T, G }) => { const out = [T('Find your seat', 0.06, 0.04, 0.88, 48, { font: 'script' }), G('swash', 0.32, 0.135, 0.36, 0.025)]; for (let i = 0; i < 9; i++) { const c = i % 3, r = Math.floor(i / 3); const x = 0.06 + c * 0.3, y = 0.2 + r * 0.26; out.push(T('TABLE ' + (i + 1), x, y, 0.28, 13, { bold: 1, ls: 0.25, col: '#d8b86a', keepCol: 1 }), T('Guest name\nGuest name\nGuest name\nGuest name\nGuest name\nGuest name', x, y + 0.04, 0.28, 11, { lh: 1.55 })); } return out; } },
    { k: 'wd-order', n: 'Order of ceremony', cat: 'Wedding', size: 'a5p', style: 'blush', build: ({ T, G }) => [T('Order of ceremony', 0.06, 0.06, 0.88, 32, { font: 'script' }), G('swash', 0.32, 0.15, 0.36, 0.025), ...[['4:00 PM', 'Guests arrive'], ['4:30 PM', 'Processional'], ['4:45 PM', 'Vows and rings'], ['5:15 PM', 'Blessing'], ['5:30 PM', 'Photographs'], ['6:30 PM', 'Reception and dinner'], ['8:00 PM', 'First dance']].flatMap(([t, e], i) => [T(t, 0.06, 0.22 + i * 0.09, 0.36, 15, { bold: 1, ls: 0.05, align: 'right' }), G('circle', 0.475, 0.228 + i * 0.09, 0.05, 0.035, { op: 0.7 }), T(e, 0.56, 0.218 + i * 0.09, 0.42, 16, { head: 1, align: 'left' })]), G('block', 0.4985, 0.24, 0.003, 0.56, { op: 0.35 })] },
    { k: 'wd-menu', n: 'Wedding menu card', cat: 'Wedding', size: 'dl', style: 'noirgold', build: ({ T, G }) => [T('Menu', 0.06, 0.05, 0.88, 46, { font: 'script' }), G('swash', 0.25, 0.13, 0.5, 0.02), ...[['TO START', 'Tomato shorba\nCrispy corn salad'], ['MAIN', 'Kerala fish curry · Appam\nMalabar chicken biryani\nVegetable stew'], ['DESSERT', 'Palada payasam\nWedding cake']].flatMap(([h, b], i) => [T(h, 0.06, 0.2 + i * 0.25, 0.88, 11, { ls: 0.4, col: '#c9a45c', keepCol: 1 }), T(b, 0.06, 0.24 + i * 0.25, 0.88, 14, { head: 1, lh: 1.6 })]), T('Anna & Rahul · 14.02.2027', 0.06, 0.92, 0.88, 10, { ls: 0.2 })] },
    { k: 'wd-rsvp', n: 'RSVP card', cat: 'Wedding', size: 'a6l', style: 'blush', build: ({ T, G }) => [T('Kindly reply', 0.06, 0.08, 0.88, 30, { font: 'script' }), T('BY 10 JANUARY 2027', 0.06, 0.25, 0.88, 10, { ls: 0.35 }), T('Name(s) ______________________', 0.08, 0.38, 0.84, 14), T('☐ Joyfully accepts    ☐ Regretfully declines', 0.06, 0.52, 0.88, 14), T('Number of guests  ______', 0.08, 0.66, 0.84, 14), G('swash', 0.36, 0.82, 0.28, 0.04)] },
    { k: 'wd-table', n: 'Table number', cat: 'Wedding', size: 'a5p', style: 'sage', build: ({ T, G }) => [G('border', 0.06, 0.04, 0.88, 0.92, { sw: 0.8 }), G('leaf', 0.38, 0.12, 0.24, 0.1, { op: 0.7 }), T('Table', 0.06, 0.28, 0.88, 40, { font: 'script' }), T('1', 0.06, 0.38, 0.88, 160, { head: 1 }), T('ANNA & RAHUL', 0.06, 0.82, 0.88, 11, { ls: 0.4 })] },
    { k: 'wd-thanks', n: 'Wedding thank you', cat: 'Wedding', size: 'a6l', style: 'emerald', build: ({ T, F }) => [F(0, 0, 0.5, 1), T('Thank you', 0.52, 0.18, 0.44, 34, { font: 'script' }), T('for celebrating with us and for your kind gift. It means the world.', 0.55, 0.46, 0.38, 11, { lh: 1.55 }), T('Anna & Rahul', 0.52, 0.78, 0.44, 15, { head: 1 })] },
    { k: 'wd-spread', n: 'Wedding album page', cat: 'Wedding', style: 'clean', build: ({ T, F }) => [F(0.06, 0.05, 0.88, 0.5), F(0.06, 0.57, 0.43, 0.3), F(0.51, 0.57, 0.43, 0.3), T('The day we said yes', 0.06, 0.895, 0.88, 22, { font: 'script' })] },
    /* Photo albums */
    { k: 'al-cover', n: 'Album cover', cat: 'Photo albums', size: 'sq30', style: 'gallery', build: ({ T, F }) => [F(0, 0, 1, 1), T('Our Year', 0.06, 0.38, 0.88, 70, { font: 'script', col: W, keepCol: 1, shadow: true, onPhoto: true }), T('2027', 0.06, 0.55, 0.88, 20, { ls: 0.6, col: W, keepCol: 1, shadow: true, onPhoto: true })] },
    { k: 'al-bleed', n: 'Full photo with caption', cat: 'Photo albums', size: 'sq30', style: 'clean', build: ({ T, F, G }) => [F(0, 0, 1, 0.86), T('A caption that tells the story behind this photo.', 0.06, 0.895, 0.7, 14, { align: 'left', ital: 1 }), T('June 2027', 0.7, 0.9, 0.24, 11, { align: 'right', ls: 0.2 })] },
    { k: 'al-film', n: 'Film strip', cat: 'Photo albums', size: 'a4l', style: 'gallery', build: ({ T, F, G }) => { const out = [G('block', 0, 0.2, 1, 0.6, { col: '#000000', keepCol: 1 })]; for (let i = 0; i < 24; i++) { out.push(G('block', 0.01 + i * 0.042, 0.225, 0.022, 0.035, { col: '#f5f5f5', keepCol: 1, op: 0.85 }), G('block', 0.01 + i * 0.042, 0.74, 0.022, 0.035, { col: '#f5f5f5', keepCol: 1, op: 0.85 })); } for (let i = 0; i < 4; i++) out.push(F(0.025 + i * 0.245, 0.29, 0.215, 0.42)); out.push(T('Roll 01 · Summer', 0.04, 0.07, 0.92, 22, { font: 'type', align: 'left' }), T('KODAK 400', 0.04, 0.85, 0.92, 11, { font: 'type', ls: 0.3, align: 'right' })); return out; } },
    { k: 'al-nine', n: 'Nine photo grid', cat: 'Photo albums', size: 'sq30', style: 'minimal', build: ({ F }) => { const out = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(F(0.04 + c * 0.31, 0.04 + r * 0.31, 0.3, 0.3)); return out; } },
    { k: 'al-scrap', n: 'Scrapbook page', cat: 'Photo albums', style: 'kraft', build: ({ T, F, G }) => [F(0.07, 0.07, 0.48, 0.36, { pad: 7, pol: true, shadow: 0.6, rot: -3 }), G('tape', 0.24, 0.05, 0.14, 0.035, { rot: -8, col: '#f6e7b4', keepCol: 1, op: 0.85 }), F(0.5, 0.3, 0.42, 0.32, { pad: 7, pol: true, shadow: 0.6, rot: 4 }), G('tape', 0.66, 0.285, 0.14, 0.035, { rot: 6, col: '#cfe3d6', keepCol: 1, op: 0.85 }), F(0.1, 0.56, 0.4, 0.3, { pad: 7, pol: true, shadow: 0.6, rot: 2 }), G('pin', 0.27, 0.545, 0.05, 0.035), T('the best\nday ever', 0.56, 0.69, 0.36, 30, { font: 'hand', lh: 1.1 }), G('heart', 0.82, 0.86, 0.06, 0.045)] },
    { k: 'al-review', n: 'Year in review', cat: 'Photo albums', style: 'swiss', build: ({ T, F, s }) => { const out = [T('2027', 0.06, 0.03, 0.88, 64, { font: 'display', align: 'left' }), T('THE YEAR IN TWELVE PHOTOS', 0.06, 0.12, 0.88, 11, { ls: 0.3, align: 'left', col: s.accent, keepCol: 1 })]; MONTHS.forEach((m, i) => { const c = i % 3, r = Math.floor(i / 3); const x = 0.06 + c * 0.3, y = 0.17 + r * 0.205; out.push(F(x, y, 0.28, 0.16), T(m.slice(0, 3).toUpperCase(), x, y + 0.163, 0.28, 9, { ls: 0.2, bold: 1, align: 'left' })); }); return out; } },
    { k: 'al-baby', n: 'Baby first year', cat: 'Photo albums', style: 'mint', build: ({ T, Fc }) => { const out = [T('My first year', 0.06, 0.03, 0.88, 44, { font: 'script' })]; for (let i = 0; i < 12; i++) { const c = i % 4, r = Math.floor(i / 4); const cx = 0.17 + c * 0.22, cy = 0.24 + r * 0.25; out.push(Fc(cx, cy, 0.18, { stroke: 4, strokeCol: W }), T(`${i + 1} month${i ? 's' : ''}`, cx - 0.1, cy + 0.075, 0.2, 11, { bold: 1 })); } return out; } },
    { k: 'al-family', n: 'Family tree', cat: 'Photo albums', style: 'linen', build: ({ T, Fc, G }) => { const P = (cx, cy, d, t) => [Fc(cx, cy, d, { stroke: 3, strokeCol: W }), T(t, cx - 0.12, cy + d * 0.52 + 0.005, 0.24, 11, { bold: 1 })]; return [T('Our family tree', 0.06, 0.03, 0.88, 40, { font: 'script' }), G('block', 0.316, 0.2, 0.368, 0.002, { op: 0.5 }), G('block', 0.4985, 0.2, 0.003, 0.13, { op: 0.5 }), G('block', 0.15, 0.55, 0.7, 0.002, { op: 0.5 }), G('block', 0.4985, 0.485, 0.003, 0.065, { op: 0.5 }), ...P(0.25, 0.2, 0.13, 'Grandfather'), ...P(0.75, 0.2, 0.13, 'Grandmother'), ...P(0.5, 0.38, 0.14, 'Father & Mother'), ...[0.15, 0.38, 0.62, 0.85].flatMap((x) => [G('block', x - 0.0015, 0.55, 0.003, 0.05, { op: 0.5 }), ...P(x, 0.66, 0.13, 'Name')]), T('Est. 1965 · Kottayam', 0.06, 0.88, 0.88, 12, { ls: 0.2 })]; } },
    { k: 'al-pet', n: 'Pet album page', cat: 'Photo albums', style: 'peach', build: ({ T, F, E }) => [F(0.06, 0.05, 0.56, 0.5, { r: 20 }), F(0.66, 0.05, 0.28, 0.24, { r: 16 }), F(0.66, 0.31, 0.28, 0.24, { r: 16 }), T('Good boy', 0.06, 0.59, 0.88, 56, { font: 'script', align: 'left' }), T('Name · Breed · Age\nFavourite thing: belly rubs\nWorst habit: stealing socks', 0.06, 0.72, 0.6, 14, { align: 'left', lh: 1.6 }), E('🐾', 0.84, 0.8, 0.14)] },
    { k: 'al-trip', n: 'Trip photo page', cat: 'Photo albums', style: 'ocean', build: ({ T, F, G }) => [G('mappin', 0.06, 0.05, 0.05, 0.05, { col: W, keepCol: 1 }), T('Munnar', 0.13, 0.04, 0.6, 40, { font: 'script', align: 'left' }), T('APRIL 2027', 0.65, 0.07, 0.29, 12, { ls: 0.3, align: 'right' }), F(0.06, 0.15, 0.88, 0.42, { r: 8 }), F(0.06, 0.6, 0.28, 0.3, { r: 8 }), F(0.36, 0.6, 0.28, 0.3, { r: 8 }), F(0.66, 0.6, 0.28, 0.3, { r: 8 })] },
    /* Editorial */
    { k: 'ed-mag', n: 'Magazine cover', cat: 'Editorial', style: 'magazine', build: ({ T, F, s }) => [F(0, 0, 1, 1), T('HORIZON', 0.04, 0.02, 0.92, 96, { font: 'didone', bold: 1, col: W, keepCol: 1, shadow: true, onPhoto: true, ls: 0.05 }), T('ISSUE 07 · SPRING 2027', 0.04, 0.17, 0.92, 11, { ls: 0.35, col: W, keepCol: 1, onPhoto: true }), T('Life on the\nopen ocean', 0.05, 0.62, 0.5, 34, { head: 1, bold: 1, align: 'left', col: W, keepCol: 1, shadow: true, onPhoto: true, lh: 1.05 }), T('+ 12 ports worth the shore leave', 0.05, 0.78, 0.5, 14, { align: 'left', col: W, keepCol: 1, shadow: true, onPhoto: true }), T('THE NAVIGATION ISSUE', 0.05, 0.9, 0.9, 12, { ls: 0.3, bold: 1, align: 'left', col: '#ffd23f', keepCol: 1, onPhoto: true })] },
    { k: 'ed-feature', n: 'Feature article', cat: 'Editorial', style: 'magazine', build: ({ T, F, G, s }) => [T('FEATURE', 0.06, 0.04, 0.5, 11, { ls: 0.4, bold: 1, align: 'left', col: s.accent, keepCol: 1 }), T('Forty days between ports', 0.06, 0.07, 0.88, 44, { head: 1, align: 'left', lh: 1.05 }), T('What a long passage teaches you about patience, routine and the people you share it with.', 0.06, 0.19, 0.7, 14, { ital: 1, align: 'left', lh: 1.4 }), F(0.06, 0.27, 0.88, 0.34), T('Words by Name · Photos by Name', 0.06, 0.62, 0.88, 9, { ls: 0.15, align: 'left' }), T('T', 0.06, 0.66, 0.08, 64, { head: 1, col: s.accent, keepCol: 1 }), T('he first week is always the hardest. Your body still keeps shore hours and the horizon feels empty. Then the routine takes over: watches, meals, the gym, a film on Saturday. Phone calls home become short and precious, planned around time zones and the next patch of signal.', 0.15, 0.665, 0.37, 12.5, { align: 'left', lh: 1.55 }), T('By the third week the sea becomes a place rather than a gap between places. You learn the moods of the swell, the colour of the water before weather, and the sound of the engine when all is well. And when the pilot finally climbs aboard, part of you is sorry the passage is over.', 0.56, 0.665, 0.38, 12.5, { align: 'left', lh: 1.55 })] },
    { k: 'ed-news', n: 'Newsletter', cat: 'Editorial', style: 'corporate', build: ({ T, F, G, s }) => [T('The Monthly', 0.06, 0.035, 0.6, 40, { head: 1, bold: 1, align: 'left' }), T('ISSUE 12 · MARCH 2027', 0.6, 0.055, 0.34, 10, { ls: 0.25, align: 'right' }), G('block', 0.06, 0.11, 0.88, 0.004, { col: s.accent }), F(0.06, 0.13, 0.55, 0.3), T('Lead story headline that pulls readers in', 0.64, 0.13, 0.3, 18, { head: 1, bold: 1, align: 'left', lh: 1.15 }), T('A short summary of the main news this month. Two or three lines are enough to set the scene.', 0.64, 0.27, 0.3, 10.5, { align: 'left', lh: 1.5 }), ...[0, 1, 2].flatMap((i) => [G('block', 0.06 + i * 0.3, 0.47, 0.27, 0.002, { col: s.ink, op: 0.5 }), T(['In brief', 'People', 'Coming up'][i].toUpperCase(), 0.06 + i * 0.3, 0.485, 0.27, 10, { bold: 1, ls: 0.2, align: 'left', col: s.accent, keepCol: 1 }), T('Headline for this story', 0.06 + i * 0.3, 0.515, 0.27, 14, { head: 1, bold: 1, align: 'left' }), T('Two or three short sentences about this item, with the key facts first.', 0.06 + i * 0.3, 0.56, 0.27, 10, { align: 'left', lh: 1.5 })]), F(0.06, 0.68, 0.88, 0.22), T('Contact the editor: news@company.com', 0.06, 0.92, 0.88, 10, { align: 'left' })] },
    { k: 'ed-book', n: 'Book cover', cat: 'Editorial', size: 'a5p', style: 'emerald', build: ({ T, G, Sq }) => [G('border', 0.06, 0.04, 0.88, 0.92, { sw: 1 }), T('A NOVEL', 0.06, 0.1, 0.88, 11, { ls: 0.5 }), T('The Last\nLighthouse', 0.06, 0.2, 0.88, 44, { head: 1, lh: 1.1 }), Sq('compass', 0.5, 0.56, 0.3, { op: 0.8 }), T('AUTHOR NAME', 0.06, 0.85, 0.88, 14, { ls: 0.45 })] },
    { k: 'ed-zine', n: 'Zine page', cat: 'Editorial', style: 'swiss', build: ({ T, F, G, s }) => [T('NO.', 0.06, 0.05, 0.2, 14, { bold: 1, align: 'left' }), T('03', 0.06, 0.07, 0.4, 120, { font: 'display', align: 'left', col: s.accent, keepCol: 1 }), F(0.45, 0.05, 0.49, 0.45), T('Slow\nmornings', 0.06, 0.32, 0.38, 40, { head: 1, bold: 1, align: 'left', lh: 1 }), G('block', 0.06, 0.55, 0.88, 0.006, { col: s.ink }), T('Notes on coffee, quiet and the hour before the world wakes up. A small collection of thoughts and photos from the anchorage.', 0.06, 0.58, 0.42, 12, { align: 'left', lh: 1.55 }), F(0.52, 0.58, 0.42, 0.36)] },
    { k: 'ed-recipe', n: 'Recipe magazine page', cat: 'Editorial', style: 'terra', build: ({ T, F, G, s }) => [F(0, 0, 1, 0.45), T('Kerala fish curry', 0.06, 0.48, 0.88, 40, { head: 1, ital: 1, align: 'left' }), T('SERVES 4 · 40 MINUTES', 0.06, 0.56, 0.88, 11, { ls: 0.3, align: 'left', col: s.accent, keepCol: 1 }), G('block', 0.06, 0.6, 0.88, 0.0016, { op: 0.4, col: s.ink }), T('YOU NEED', 0.06, 0.62, 0.3, 10, { bold: 1, ls: 0.2, align: 'left' }), T('500 g kingfish\n2 tbsp kudampuli\n1 cup thick coconut milk\nShallots, ginger, garlic\nCurry leaves\nChilli powder, turmeric', 0.06, 0.655, 0.3, 11, { align: 'left', lh: 1.7 }), T('METHOD', 0.4, 0.62, 0.54, 10, { bold: 1, ls: 0.2, align: 'left' }), T('1. Soak the kudampuli in warm water.\n2. Sauté shallots, ginger and garlic in coconut oil.\n3. Add the spices, then the kudampuli and water.\n4. Slide in the fish and simmer gently.\n5. Finish with coconut milk and curry leaves.', 0.4, 0.655, 0.54, 11, { align: 'left', lh: 1.7 })] },
    /* Kids */
    { k: 'kd-bday', n: 'Kids birthday poster', cat: 'Kids', style: 'kids', build: ({ T, Fc, E }) => [T('Happy', 0.06, 0.04, 0.88, 50, { font: 'script' }), T('BIRTHDAY', 0.06, 0.12, 0.88, 54, { font: 'display' }), Fc(0.5, 0.42, 0.42, { stroke: 8, strokeCol: W, shadow: 0.4 }), E('🎈', 0.13, 0.3, 0.14), E('🎂', 0.87, 0.55, 0.14), E('🎉', 0.14, 0.62, 0.12), T('Aarav', 0.06, 0.66, 0.88, 50, { head: 1, bold: 1 }), T('IS 5 TODAY!', 0.06, 0.77, 0.88, 24, { font: 'display', ls: 0.1 })] },
    { k: 'kd-chores', n: 'Chore chart', cat: 'Kids', style: 'kids', build: ({ T, G, s }) => { const out = [T('My chores', 0.05, 0.035, 0.9, 46, { font: 'script' })]; const x0 = 0.3, cw = 0.65 / 7; DAYS.forEach((d, i) => out.push(T(d.slice(0, 3), x0 + i * cw, 0.14, cw, 11, { bold: 1 }))); ['🛏️ Make my bed', '🪥 Brush teeth', '🧸 Tidy toys', '🍽️ Clear my plate', '🌱 Water plants', '📚 Read a book', '🐶 Feed the dog'].forEach((c, r) => { const y = 0.18 + r * 0.1; out.push(box(G, 0.05, y, 0.9, 0.088, { op: 0.75 }), T(c, 0.07, y + 0.028, 0.24, 13, { align: 'left', bold: 1 })); for (let i = 0; i < 7; i++) out.push(T('☆', x0 + i * cw, y + 0.02, cw, 20, { col: s.accent, keepCol: 1 })); }); out.push(T('7 stars in a row = a treat!', 0.05, 0.9, 0.9, 14, { bold: 1 })); return out; } },
    { k: 'kd-alpha', n: 'Alphabet poster', cat: 'Kids', style: 'peach', build: ({ T, G, s }) => { const out = [T('A to Z', 0.05, 0.03, 0.9, 50, { font: 'script' })]; const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''); const cols = ['#ff7a59', '#2a9d8f', '#e9c46a', '#7c5cd6', '#ff5a5f', '#1f6feb']; L.forEach((ch, i) => { const c = i % 5, r = Math.floor(i / 5); const x = 0.06 + c * 0.18, y = 0.14 + r * 0.14; out.push(G('blob', x, y, 0.16, 0.12, { col: cols[i % 6], keepCol: 1, op: 0.9 }), T(ch + ch.toLowerCase(), x, y + 0.028, 0.16, 30, { font: 'round', bold: 1, col: W, keepCol: 1 })); }); return out; } },
    { k: 'kd-reward', n: 'Reward certificate', cat: 'Kids', size: 'a4l', style: 'kids', build: ({ T, Sq, E }) => [Sq('burst', 0.5, 0.18, 0.2, { col: '#ffd23f', keepCol: 1 }), E('⭐', 0.5, 0.18, 0.1), T('Super Star Award', 0.06, 0.32, 0.88, 50, { font: 'script' }), T('THIS AWARD GOES TO', 0.06, 0.47, 0.88, 13, { ls: 0.35, bold: 1 }), T('Name', 0.06, 0.53, 0.88, 46, { head: 1, bold: 1 }), T('for being kind, brave and trying really hard!', 0.06, 0.68, 0.88, 16, { ital: 1 }), T('Signed ______________        Date ______________', 0.06, 0.84, 0.88, 12)] },
    { k: 'kd-story', n: 'Story page', cat: 'Kids', style: 'notebook', build: ({ T, F, G, s }) => [T('My story', 0.06, 0.04, 0.88, 40, { font: 'hand' }), F(0.08, 0.12, 0.84, 0.4, { r: 10, stroke: 3, strokeCol: s.accent }), T('Draw or stick a picture here', 0.08, 0.3, 0.84, 12, { ital: 1, op: 0.6 }), ...writeLines(G, s, 0.08, 0.6, 0.84, 8, 0.045)] },
    { k: 'kd-name', n: 'Door name sign', cat: 'Kids', size: 'a4l', style: 'mint', build: ({ T, E, G }) => [G('cloudg', 0.06, 0.08, 0.2, 0.14, { col: W, keepCol: 1 }), G('cloudg', 0.74, 0.72, 0.2, 0.14, { col: W, keepCol: 1 }), E('🚀', 0.18, 0.7, 0.14), E('🌙', 0.84, 0.22, 0.12), T("Aarav's", 0.06, 0.24, 0.88, 50, { font: 'script' }), T('ROOM', 0.06, 0.42, 0.88, 110, { font: 'display', ls: 0.2 }), T('KNOCK BEFORE YOU ENTER', 0.06, 0.78, 0.88, 13, { ls: 0.35, bold: 1 })] },
    /* Festivals */
    { k: 'fs-vishu', n: 'Vishu greetings', cat: 'Festivals', size: 'a6p', style: 'onam', build: ({ T, G, E }) => [G('border', 0.04, 0.03, 0.92, 0.94, { sw: 2.5, col: '#d4a017', keepCol: 1 }), E('🌼', 0.3, 0.17, 0.14), E('🪔', 0.5, 0.14, 0.16), E('🌼', 0.7, 0.17, 0.14), T('Happy Vishu', 0.06, 0.32, 0.88, 42, { font: 'script' }), T('May the year ahead be golden like the konna flowers.', 0.1, 0.5, 0.8, 14, { lh: 1.5, ital: 1 }), T('With love, ____________', 0.06, 0.8, 0.88, 13)] },
    { k: 'fs-onam', n: 'Onam poster', cat: 'Festivals', style: 'onam', build: ({ T, G, Sq, E }) => [G('block', 0, 0, 1, 0.035, { col: '#d4a017', keepCol: 1 }), G('block', 0, 0.965, 1, 0.035, { col: '#d4a017', keepCol: 1 }), Sq('flower', 0.5, 0.3, 0.42, { col: '#e76f51', keepCol: 1, op: 0.9 }), Sq('flower', 0.5, 0.3, 0.26, { col: '#f4a261', keepCol: 1 }), Sq('circle', 0.5, 0.3, 0.1, { col: '#ffd23f', keepCol: 1 }), T('Happy Onam', 0.06, 0.55, 0.88, 60, { font: 'script' }), T('ONAM CELEBRATIONS 2027', 0.06, 0.68, 0.88, 14, { ls: 0.35, bold: 1 }), T('Pookalam · Sadhya · Thiruvathira · Vadamvali', 0.06, 0.74, 0.88, 14), T('Saturday 4 September · 10 AM onwards', 0.06, 0.82, 0.88, 14, { bold: 1 })] },
    { k: 'fs-xmascard', n: 'Christmas card', cat: 'Festivals', size: 'a6p', style: 'emerald', build: ({ T, G, Sq }) => [Sq('tri', 0.5, 0.26, 0.4, { col: '#2f6f4f', keepCol: 1 }), Sq('tri', 0.5, 0.2, 0.3, { col: '#3d8b63', keepCol: 1 }), Sq('star', 0.5, 0.06, 0.08), G('spark', 0.2, 0.1, 0.06, 0.04), G('spark', 0.78, 0.22, 0.05, 0.035), T('Merry Christmas', 0.04, 0.5, 0.92, 34, { font: 'script' }), T('and a happy new year', 0.06, 0.62, 0.88, 14, { ls: 0.1, ital: 1 }), T('From all of us, ____________', 0.06, 0.82, 0.88, 12)] },
    { k: 'fs-newyear', n: 'New year poster', cat: 'Festivals', style: 'noirgold', build: ({ T, G, Sq }) => [Sq('burst', 0.2, 0.15, 0.2, { op: 0.4 }), Sq('spark', 0.82, 0.12, 0.1), Sq('spark', 0.75, 0.3, 0.06), T('HAPPY', 0.06, 0.3, 0.88, 36, { ls: 0.5, head: 1 }), T('2028', 0.06, 0.37, 0.88, 140, { head: 1, bold: 1, col: '#c9a45c', keepCol: 1 }), T('New year eve party', 0.06, 0.6, 0.88, 36, { font: 'script' }), T('31 DECEMBER · 9 PM TILL LATE', 0.06, 0.72, 0.88, 14, { ls: 0.3 }), T('Music · Dinner · Countdown', 0.06, 0.78, 0.88, 14)] },
    { k: 'fs-holi', n: 'Holi celebration', cat: 'Festivals', style: 'clean', bg: { t: 'grad', c: '#ffe259', c2: '#ffa751', a: 135 }, build: ({ T, G }) => [G('blob', -0.08, -0.05, 0.5, 0.32, { col: '#ff4fa3', keepCol: 1, op: 0.85 }), G('blob', 0.62, 0.02, 0.45, 0.28, { col: '#00c2ff', keepCol: 1, op: 0.8 }), G('blob', 0.55, 0.72, 0.5, 0.33, { col: '#7cff6b', keepCol: 1, op: 0.75 }), G('blob', -0.1, 0.75, 0.45, 0.3, { col: '#8a4dff', keepCol: 1, op: 0.75 }), T('Happy', 0.06, 0.33, 0.88, 50, { font: 'script', col: '#3b0a45', keepCol: 1 }), T('HOLI', 0.06, 0.41, 0.88, 120, { font: 'display', col: '#3b0a45', keepCol: 1 }), T('Colours, music and sweets · Sunday 10 AM', 0.06, 0.62, 0.88, 15, { bold: 1, col: '#3b0a45', keepCol: 1 })] },
    { k: 'fs-ramadan', n: 'Ramadan Kareem', cat: 'Festivals', size: 'a6p', style: 'royal', build: ({ T, G, Sq }) => [Sq('moon', 0.5, 0.2, 0.3), G('spark', 0.68, 0.1, 0.06, 0.04), G('spark', 0.3, 0.28, 0.05, 0.035), T('Ramadan Kareem', 0.04, 0.42, 0.92, 27, { font: 'script' }), T('Wishing you a month of peace, reflection and blessings.', 0.1, 0.56, 0.8, 13, { lh: 1.5, ital: 1 }), T('____________', 0.06, 0.82, 0.88, 13)] },
    { k: 'fs-pongal', n: 'Pongal wishes', cat: 'Festivals', size: 'a6p', style: 'sand', build: ({ T, G, E }) => [E('🍚', 0.5, 0.16, 0.2), G('sun', 0.12, 0.05, 0.16, 0.11, { op: 0.6 }), T('Happy Pongal', 0.06, 0.32, 0.88, 38, { font: 'script' }), T('May the harvest bring joy and plenty to your home.', 0.1, 0.48, 0.8, 13, { lh: 1.5, ital: 1 }), T('With warm wishes, ____________', 0.06, 0.8, 0.88, 12)] },
    { k: 'fs-republic', n: 'Republic Day', cat: 'Festivals', style: 'clean', build: ({ T, G, Sq }) => [G('block', 0, 0, 1, 0.1, { col: '#ff9933', keepCol: 1 }), G('block', 0, 0.9, 1, 0.1, { col: '#138808', keepCol: 1 }), Sq('ringg', 0.5, 0.28, 0.22, { col: '#000080', keepCol: 1, sw: 1.5 }), Sq('spark', 0.5, 0.28, 0.12, { col: '#000080', keepCol: 1 }), T('Happy', 0.06, 0.45, 0.88, 40, { font: 'script' }), T('REPUBLIC DAY', 0.06, 0.53, 0.88, 54, { font: 'display', col: '#000080', keepCol: 1 }), T('26 January · Flag hoisting at 8:00 AM', 0.06, 0.67, 0.88, 16, { bold: 1 }), T('All crew and families are welcome', 0.06, 0.73, 0.88, 13, { ital: 1 })] },
    /* At sea */
    { k: 'sea2-watch', n: 'Watch schedule', cat: 'At sea', style: 'voyage', build: ({ T, G, s }) => { const out = [T('Watch schedule', 0.05, 0.04, 0.9, 36, { head: 1 }), T('MV ____________ · Effective ____________', 0.05, 0.105, 0.9, 11, { ls: 0.15 })]; ['Watch', 'Bridge', 'Engine room', 'Lookout'].forEach((h, i) => out.push(T(h.toUpperCase(), 0.05 + i * 0.225, 0.17, 0.225, 10, { bold: 1, ls: 0.2, col: s.accent, keepCol: 1 }))); ['0000 to 0400', '0400 to 0800', '0800 to 1200', '1200 to 1600', '1600 to 2000', '2000 to 2400'].forEach((w, r) => { const y = 0.2 + r * 0.1; out.push(G('block', 0.05, y, 0.9, 0.088, { col: '#ffffff', op: 0.06, keepCol: 1 }), T(w, 0.05, y + 0.03, 0.225, 13, { bold: 1 }), T(['2nd Officer', 'Chief Officer', '3rd Officer', '2nd Officer', 'Chief Officer', '3rd Officer'][r], 0.275, y + 0.03, 0.225, 12), T(['3/E', '2/E', '4/E', '3/E', '2/E', '4/E'][r], 0.5, y + 0.03, 0.225, 12), T('AB ______', 0.725, y + 0.03, 0.225, 12)); }); out.push(T('Master ______________        Chief Engineer ______________', 0.05, 0.85, 0.9, 12)); return out; } },
    { k: 'sea2-particulars', n: 'Ship particulars', cat: 'At sea', style: 'clean', build: ({ T, F, G, s }) => { const out = [G('block', 0, 0, 1, 0.12, { col: '#0b1f3a', keepCol: 1 }), T('SHIP PARTICULARS', 0.06, 0.035, 0.6, 14, { ls: 0.35, col: W, keepCol: 1, align: 'left' }), T('MV Vessel Name', 0.06, 0.06, 0.88, 26, { head: 1, bold: 1, col: W, keepCol: 1, align: 'left' }), F(0.06, 0.15, 0.88, 0.26, { r: 6 })]; [['IMO number', ''], ['Call sign', ''], ['Flag', ''], ['Port of registry', ''], ['Type', 'Open hatch bulk carrier'], ['Built', ''], ['Length overall', ' m'], ['Breadth', ' m'], ['Summer draught', ' m'], ['Deadweight', ' t'], ['Gross tonnage', ''], ['Holds and hatches', ''], ['Cranes', ''], ['Main engine', ''], ['Service speed', ' kn']].forEach(([a, b], i) => { const c = i % 2, r = Math.floor(i / 2); const x = 0.06 + c * 0.45, y = 0.44 + r * 0.06; out.push(T(a.toUpperCase(), x, y, 0.42, 9, { bold: 1, ls: 0.15, align: 'left', col: '#1f6feb', keepCol: 1 }), T(b && b[0] !== ' ' ? b : '________' + b, x, y + 0.02, 0.42, 13, { align: 'left' })); }); return out; } },
    { k: 'sea2-voyage', n: 'Voyage summary', cat: 'At sea', style: 'night', build: ({ T, G, Sq, s }) => { const out = [T('Voyage summary', 0.05, 0.04, 0.9, 40, { font: 'script' }), T('VOYAGE ____ · FROM ________ TO ________', 0.05, 0.12, 0.9, 11, { ls: 0.25 }), G('wave', 0.1, 0.17, 0.8, 0.03, { sw: 1.2 })]; [['Distance', '6,420', 'nm'], ['Days at sea', '21', ''], ['Average speed', '12.7', 'kn'], ['Fuel used', '486', 't'], ['Cargo carried', '38,200', 't'], ['Ports', '3', '']].forEach(([l, v, u], i) => { const c = i % 2, r = Math.floor(i / 2); const x = 0.07 + c * 0.45, y = 0.25 + r * 0.19; out.push(G('block', x, y, 0.41, 0.16, { col: '#ffffff', op: 0.07, keepCol: 1 }), T(v + (u ? ' ' + u : ''), x, y + 0.03, 0.41, 34, { head: 1, bold: 1 }), T(l.toUpperCase(), x, y + 0.105, 0.41, 10, { ls: 0.25 })); }); out.push(Sq('anchor', 0.5, 0.88, 0.07)); return out; } },
    { k: 'sea2-port', n: 'Port information sheet', cat: 'At sea', style: 'corporate', build: ({ T, G, s }) => { const out = [T('Port information', 0.06, 0.035, 0.88, 32, { head: 1, bold: 1, align: 'left' }), T('Port of ____________ · ETA ____________', 0.06, 0.095, 0.88, 12, { align: 'left' }), G('block', 0.06, 0.13, 0.88, 0.004, { col: '#1f6feb', keepCol: 1 })]; [['Agent', 'Name, phone, email'], ['Berth', 'Name and side to'], ['Pilot boarding', 'Position and time'], ['Shore leave', 'Rules and pass collection'], ['Seamen club', 'Address and transport'], ['Hospital', 'Address and phone'], ['Money exchange', 'Nearest place'], ['Local time and SIM', 'Offset and providers'], ['Local rules', 'Garbage, ballast, drones, photography']].forEach(([a, b], i) => { const y = 0.16 + i * 0.085; out.push(T(a, 0.06, y, 0.3, 13, { bold: 1, align: 'left' }), T(b, 0.38, y, 0.56, 11, { align: 'left', ital: 1, op: 0.7 }), rule(G, s, 0.38, y + 0.055, 0.56, { op: 0.25 })); }); return out; } },
    { k: 'sea2-contacts', n: 'Emergency contacts', cat: 'At sea', style: 'clean', build: ({ T, G }) => { const out = [G('block', 0, 0, 1, 0.12, { col: '#c1121f', keepCol: 1 }), T('EMERGENCY CONTACTS', 0.05, 0.035, 0.9, 30, { font: 'display', col: W, keepCol: 1 })]; [['Designated Person Ashore', ''], ['Company 24 h emergency', ''], ['Technical superintendent', ''], ['Marine superintendent', ''], ['P&I correspondent', ''], ['Flag state', ''], ['MRCC', ''], ['Medical advice (TMAS)', ''], ['Agent', '']].forEach(([a], i) => { const y = 0.16 + i * 0.085; out.push(T(a, 0.06, y, 0.46, 14, { bold: 1, align: 'left' }), T('Name ______________\nPhone ______________', 0.52, y - 0.005, 0.42, 11, { align: 'left', lh: 1.5 }), G('block', 0.06, y + 0.065, 0.88, 0.0016, { col: '#000000', op: 0.15, keepCol: 1 })); }); return out; } },
    { k: 'sea2-moment', n: 'Safety moment slide', cat: 'At sea', size: 's169', style: 'clean', build: ({ T, F, G }) => [G('block', 0, 0, 0.012, 1, { col: '#ff9500', keepCol: 1 }), T('SAFETY MOMENT', 0.05, 0.1, 0.5, 12, { ls: 0.4, bold: 1, align: 'left', col: '#ff9500', keepCol: 1 }), T('Three points of contact on every ladder', 0.05, 0.17, 0.48, 30, { head: 1, bold: 1, align: 'left', lh: 1.15 }), T('• Face the ladder\n• Hands free, tools in a bag\n• Check rungs and handrails first\n• Never rush, never jump the last steps', 0.05, 0.5, 0.48, 14, { align: 'left', lh: 1.7 }), F(0.58, 0.08, 0.38, 0.84, { r: 10 })] },
    { k: 'sea2-toolbox', n: 'Toolbox talk record', cat: 'At sea', style: 'clean', build: ({ T, G, s }) => { const out = [T('Toolbox talk', 0.05, 0.035, 0.6, 30, { head: 1, bold: 1, align: 'left' }), T('Date ________  Time ________  Location ________', 0.05, 0.09, 0.9, 11, { align: 'left' }), T('JOB', 0.05, 0.13, 0.9, 10, { bold: 1, ls: 0.2, align: 'left' }), ...writeLines(G, s, 0.05, 0.18, 0.9, 2, 0.035), T('HAZARDS AND CONTROLS', 0.05, 0.25, 0.9, 10, { bold: 1, ls: 0.2, align: 'left' }), ...writeLines(G, s, 0.05, 0.3, 0.9, 5, 0.035), T('PERMITS AND PPE', 0.05, 0.48, 0.9, 10, { bold: 1, ls: 0.2, align: 'left' }), T('☐ Permit to work  ☐ Enclosed space  ☐ Hot work  ☐ Work at height  ☐ Helmet  ☐ Harness  ☐ Gloves  ☐ Goggles', 0.05, 0.51, 0.9, 11, { align: 'left', lh: 1.6 }), T('ATTENDEES', 0.05, 0.6, 0.9, 10, { bold: 1, ls: 0.2, align: 'left' })]; ['Name', 'Rank', 'Signature'].forEach((h, i) => out.push(T(h.toUpperCase(), 0.05 + i * 0.3, 0.635, 0.3, 9, { bold: 1, ls: 0.15, align: 'left' }))); out.push(...table(G, s, 0.05, 0.66, 0.9, 0.28, 8, 3)); return out; } },
    { k: 'sea2-crossing', n: 'Crossing the line', cat: 'At sea', size: 'a4l', style: 'voyage', build: ({ T, G, Sq }) => [G('border', 0.03, 0.045, 0.94, 0.91, { sw: 2 }), G('wave', 0.1, 0.13, 0.8, 0.04, { sw: 1.2 }), Sq('compass', 0.13, 0.5, 0.16), Sq('anchor', 0.87, 0.5, 0.14), T('Domain of Neptunus Rex', 0.1, 0.2, 0.8, 36, { font: 'script' }), T('BE IT KNOWN THAT', 0.1, 0.33, 0.8, 12, { ls: 0.4 }), T('Seafarer Name', 0.1, 0.39, 0.8, 34, { head: 1, bold: 1 }), T('has crossed the Equator aboard MV ____________ at longitude ________ on __ / __ / ____ and is hereby a trusty Shellback.', 0.2, 0.52, 0.6, 13, { lh: 1.55 }), T('Davy Jones, Scribe', 0.1, 0.8, 0.35, 11, { ital: 1 }), T('Neptunus Rex', 0.55, 0.8, 0.35, 11, { ital: 1 })] },
    { k: 'sea2-newsletter', n: "Ship's newsletter", cat: 'At sea', style: 'voyage', build: ({ T, F, G, s }) => [T('The Bridge Log', 0.05, 0.03, 0.9, 42, { font: 'script' }), T('NEWS FROM MV ____________ · ISSUE 4', 0.05, 0.11, 0.9, 10, { ls: 0.3 }), G('block', 0.05, 0.14, 0.9, 0.003, { op: 0.6 }), F(0.05, 0.16, 0.9, 0.3, { r: 4 }), T('Where we are', 0.05, 0.48, 0.42, 18, { head: 1, bold: 1, align: 'left' }), T('Position, weather, next port and ETA in two or three lines.', 0.05, 0.52, 0.42, 11, { align: 'left', lh: 1.5 }), T('Birthdays', 0.53, 0.48, 0.42, 18, { head: 1, bold: 1, align: 'left' }), T('Name, rank and date. Cake in the mess at 1530.', 0.53, 0.52, 0.42, 11, { align: 'left', lh: 1.5 }), T('Safety corner', 0.05, 0.62, 0.42, 18, { head: 1, bold: 1, align: 'left' }), T('This week: hand safety. Report near misses, every one counts.', 0.05, 0.66, 0.42, 11, { align: 'left', lh: 1.5 }), T('Galley news', 0.53, 0.62, 0.42, 18, { head: 1, bold: 1, align: 'left' }), T('Sunday BBQ on the poop deck, weather permitting.', 0.53, 0.66, 0.42, 11, { align: 'left', lh: 1.5 }), F(0.05, 0.76, 0.42, 0.18, { r: 4 }), F(0.53, 0.76, 0.42, 0.18, { r: 4 })] },
    { k: 'sea2-mob', n: 'Man overboard poster', cat: 'At sea', style: 'clean', build: ({ T, G }) => [G('block', 0, 0, 1, 0.16, { col: '#ff9500', keepCol: 1 }), T('MAN OVERBOARD', 0.05, 0.04, 0.9, 50, { font: 'display', col: '#111111', keepCol: 1 }), ...[['1', 'Shout "Man overboard, starboard/port side"'], ['2', 'Throw a lifebuoy with light and smoke'], ['3', 'Keep pointing at the person, never lose sight'], ['4', 'Press MOB on GPS and ECDIS'], ['5', 'Raise the alarm: three long blasts'], ['6', 'Bridge starts the Williamson turn']].flatMap(([n, t], i) => [G('circle', 0.07, 0.21 + i * 0.12, 0.1, 0.07, { col: '#ff9500', keepCol: 1 }), T(n, 0.07, 0.225 + i * 0.12, 0.1, 26, { font: 'display', col: '#111111', keepCol: 1 }), T(t, 0.21, 0.225 + i * 0.12, 0.73, 17, { bold: 1, align: 'left' })])] },
    /* School, extra */
    { k: 'sc2-lesson', n: 'Lesson plan', cat: 'School', style: 'planner', build: ({ T, G, s }) => { const out = [T('Lesson plan', 0.06, 0.035, 0.6, 34, { head: 1, bold: 1, align: 'left' }), T('Subject ________  Class ________  Date ________  Period ____', 0.06, 0.1, 0.88, 11, { align: 'left' })]; [['Learning objectives', 3], ['Materials', 2], ['Starter (5 min)', 2], ['Main activity (25 min)', 4], ['Plenary (10 min)', 2], ['Homework', 2]].reduce((y, [t, n]) => { out.push(T(t.toUpperCase(), 0.06, y, 0.88, 10, { bold: 1, ls: 0.2, align: 'left', col: s.accent, keepCol: 1 }), ...writeLines(G, s, 0.06, y + 0.045, 0.88, n, 0.033)); return y + 0.045 + n * 0.033 + 0.02; }, 0.15); return out; } },
    { k: 'sc2-report', n: 'Report card', cat: 'School', style: 'linen', build: ({ T, G, s }) => { const out = [T('Progress report', 0.06, 0.04, 0.88, 40, { head: 1 }), T('Name ______________   Class ______   Term ______', 0.06, 0.115, 0.88, 12)]; ['Subject', 'Marks', 'Grade', 'Remarks'].forEach((h, i) => out.push(T(h.toUpperCase(), [0.06, 0.4, 0.55, 0.68][i], 0.18, [0.32, 0.13, 0.13, 0.26][i], 10, { bold: 1, ls: 0.15, align: i ? 'center' : 'left' }))); ['English', 'Malayalam', 'Hindi', 'Mathematics', 'Science', 'Social science', 'Computer', 'Art'].forEach((sub, i) => out.push(T(sub, 0.06, 0.225 + i * 0.055, 0.32, 13, { align: 'left' }))); out.push(...table(G, s, 0.06, 0.21, 0.88, 0.44, 8, 1, { vert: false }), T("Teacher's comments", 0.06, 0.69, 0.88, 13, { bold: 1, align: 'left' }), ...writeLines(G, s, 0.06, 0.75, 0.88, 3, 0.04), T('Class teacher ______________        Principal ______________', 0.06, 0.9, 0.88, 11)); return out; } },
    { k: 'sc2-flash', n: 'Flash cards', cat: 'School', style: 'peach', build: ({ T, G }) => { const out = []; for (let i = 0; i < 8; i++) { const c = i % 2, r = Math.floor(i / 2); const x = 0.05 + c * 0.47, y = 0.04 + r * 0.24; out.push(G('dline', x, y, 0.43, 0.005, { op: 0.35 }), box(G, x, y + 0.01, 0.43, 0.21, { op: 0.8 }), T('Word or question', x, y + 0.08, 0.43, 22, { head: 1, bold: 1 }), T(String(i + 1), x + 0.01, y + 0.02, 0.06, 10, { align: 'left', op: 0.5 })); } return out; } },
    { k: 'sc2-cornell', n: 'Cornell notes', cat: 'School', style: 'clean', build: ({ T, G, s }) => [T('Topic ______________________________', 0.05, 0.04, 0.6, 14, { bold: 1, align: 'left' }), T('Date ____________', 0.65, 0.04, 0.3, 12, { align: 'right' }), G('block', 0.05, 0.08, 0.9, 0.003, { col: '#1f6feb', keepCol: 1 }), G('block', 0.3, 0.08, 0.003, 0.7, { col: '#1f6feb', keepCol: 1 }), T('KEY POINTS\nQUESTIONS', 0.06, 0.1, 0.22, 10, { bold: 1, ls: 0.15, align: 'left', lh: 1.4 }), T('NOTES', 0.33, 0.1, 0.6, 10, { bold: 1, ls: 0.15, align: 'left' }), ...writeLines(G, s, 0.32, 0.16, 0.63, 18, 0.034), G('block', 0.05, 0.78, 0.9, 0.003, { col: '#1f6feb', keepCol: 1 }), T('SUMMARY', 0.06, 0.8, 0.9, 10, { bold: 1, ls: 0.15, align: 'left' }), ...writeLines(G, s, 0.05, 0.86, 0.9, 3, 0.034)] },
    /* Food, extra */
    { k: 'fd2-bakery', n: 'Bakery menu', cat: 'Food', style: 'blush', build: ({ T, G, E }) => { const out = [E('🧁', 0.5, 0.07, 0.1), T('Sweet Corner', 0.06, 0.13, 0.88, 46, { font: 'script' }), T('BAKERY · CAFE', 0.06, 0.22, 0.88, 12, { ls: 0.4 })]; [['Cakes', [['Red velvet slice', '120'], ['Chocolate truffle', '140'], ['Plum cake', '90']]], ['Breads', [['Sourdough loaf', '220'], ['Milk bread', '60'], ['Garlic buns', '80']]], ['Drinks', [['Cappuccino', '110'], ['Iced tea', '90'], ['Hot chocolate', '130']]]].forEach(([sec, items], i) => { const y = 0.29 + i * 0.21; out.push(T(sec, 0.12, y, 0.76, 22, { head: 1, ital: 1, align: 'left' })); items.forEach(([a, p], j) => out.push(T(a, 0.12, y + 0.05 + j * 0.045, 0.6, 13, { align: 'left' }), T('₹ ' + p, 0.6, y + 0.05 + j * 0.045, 0.28, 13, { align: 'right', bold: 1 }))); }); return out; } },
    { k: 'fd2-special', n: "Today's special", cat: 'Food', style: 'gallery', build: ({ T, Fc }) => [T("TODAY'S", 0.06, 0.05, 0.88, 22, { ls: 0.5 }), T('Special', 0.06, 0.09, 0.88, 70, { font: 'script', col: '#ffb703', keepCol: 1 }), Fc(0.5, 0.47, 0.6, { stroke: 3, strokeCol: '#ffb703' }), T('Malabar biryani', 0.06, 0.72, 0.88, 34, { head: 1 }), T('with raita, pickle and pappadam', 0.06, 0.8, 0.88, 14, { ital: 1 }), T('₹ 240', 0.06, 0.86, 0.88, 30, { font: 'display', col: '#ffb703', keepCol: 1 })] },
    { k: 'fd2-label', n: 'Jar labels', cat: 'Food', style: 'kraft', build: ({ T, Sq }) => { const out = []; ['Mango pickle', 'Banana chips', 'Coconut oil', 'Garam masala', 'Jaggery', 'Tea leaves'].forEach((n, i) => { const c = i % 2, r = Math.floor(i / 2); const cx = 0.28 + c * 0.44, cy = 0.18 + r * 0.31; out.push(Sq('circle', cx, cy, 0.36, { col: '#fffaf0', keepCol: 1 }), Sq('ringg', cx, cy, 0.33, { col: '#6b4a2b', keepCol: 1, sw: 0.8 }), T(n, cx - 0.17, cy - 0.035, 0.34, 18, { font: 'script', col: '#3b2a1a', keepCol: 1 }), T('HOMEMADE · 2027', cx - 0.17, cy + 0.03, 0.34, 8, { ls: 0.3, col: '#3b2a1a', keepCol: 1 })); }); return out; } },
    { k: 'fd2-recipecard', n: 'Recipe card, small', cat: 'Food', size: 'a6l', style: 'sage', build: ({ T, G, s }) => [T('Recipe', 0.05, 0.06, 0.5, 28, { font: 'script', align: 'left' }), T('From the kitchen of ____________', 0.5, 0.1, 0.45, 9, { align: 'right', ital: 1 }), G('block', 0.05, 0.25, 0.9, 0.004, { col: s.accent }), T('INGREDIENTS', 0.05, 0.3, 0.3, 8, { bold: 1, ls: 0.2, align: 'left' }), ...writeLines(G, s, 0.05, 0.42, 0.3, 6, 0.09), T('METHOD', 0.4, 0.3, 0.55, 8, { bold: 1, ls: 0.2, align: 'left' }), ...writeLines(G, s, 0.4, 0.42, 0.55, 6, 0.09)] }
  ];
})();
{ const BOOST = { a6p: 1.9, a6l: 1.9, dl: 1.75, a5p: 1.4 }; for (const t of TPL3) { const f = BOOST[t.size]; if (!f) continue; const b0 = t.build; t.build = (b) => b0(b).map((it) => it.t === 'text' ? { ...it, size: +(it.size * f).toFixed(1), h: it.h * f } : it); } }
TEMPLATES.push(...TPL3);
/* ---------- 110 more templates: CVs, cover letters, botanical and editorial sets ---------- */
const TPL4 = (() => {
  const W = '#ffffff';
  const EXP = [['Senior Designer', 'Studio Name · Kochi', '2022 to present', 'Led a team of four on brand and print work for 30+ clients.\nCut turnaround time by 25% with a shared template library.'], ['Designer', 'Agency Name · Bengaluru', '2019 to 2022', 'Designed campaigns for retail and hospitality brands.\nWon two regional design awards.'], ['Junior Designer', 'Company Name · Chennai', '2017 to 2019', 'Produced social, print and packaging artwork.\nLearned the craft from senior art directors.']];
  const EDU = [['B.Des, Communication Design', 'University Name · 2017'], ['Diploma, Photography', 'Institute Name · 2015']];
  const SKILLS = ['Brand identity', 'Typography', 'Layout and print', 'Photo editing', 'Illustration', 'Presentation'];
  const PROFILE = 'Designer with eight years of experience turning ideas into clear, beautiful work. Calm under deadlines, curious about people, and happiest when a design makes something easier to understand.';
  const CONTACT = ['+91 00000 00000', 'you@email.com', 'yourwebsite.com', 'Kochi, Kerala'];
  const cvH = (T, t, x, y, w, col, o = {}) => T(t.toUpperCase(), x, y, w, o.size || 10.5, { bold: 1, ls: 0.22, align: o.align || 'left', col, keepCol: !!col, font: o.font });
  const expBlock = (T, x, y, w, o = {}) => EXP.slice(0, o.n || 3).flatMap(([r, c, d, b], i) => { const yy = y + i * (o.step || 0.118); return [T(r, x, yy, w * 0.62, 12.5, { bold: 1, align: 'left' }), T(d, x + w * 0.62, yy + 0.002, w * 0.38, 9.5, { align: 'right', col: o.acc, keepCol: !!o.acc }), T(c, x, yy + 0.024, w, 10, { ital: 1, align: 'left' }), T(b, x, yy + 0.048, w, 9.5, { align: 'left', lh: 1.5 })]; });
  const eduBlock = (T, x, y, w, o = {}) => EDU.flatMap(([a, b], i) => [T(a, x, y + i * 0.05, w, 11, { bold: 1, align: 'left' }), T(b, x, y + i * 0.05 + 0.022, w, 9.5, { align: 'left' })]);
  const bars = (T, G, x, y, w, col, track, o = {}) => SKILLS.flatMap((sk, i) => { const yy = y + i * 0.042; const lv = [0.92, 0.85, 0.8, 0.72, 0.65, 0.78][i]; return [T(sk, x, yy, w, 9.5, { align: 'left', col: o.txt, keepCol: !!o.txt }), G('block', x, yy + 0.02, w, 0.005, { col: track, keepCol: 1, op: 0.35 }), G('block', x, yy + 0.02, w * lv, 0.005, { col, keepCol: 1 })]; });
  const pills = (T, G, x, y, w, col, txt, cols = 1) => SKILLS.flatMap((sk, i) => { const c = i % cols, r = Math.floor(i / cols); const xx = x + c * w / cols, yy = y + r * 0.03; return [G('circle', xx, yy + 0.006, 0.012, 0.0085, { col, keepCol: 1 }), T(sk, xx + 0.02, yy, w / cols - 0.02, 10, { align: 'left' })]; });
  const cv = {
    sidebar: (dark, acc) => ({ T, G, Fc }) => [G('block', 0, 0, 0.34, 1, { col: dark, keepCol: 1 }), Fc(0.17, 0.12, 0.2, { stroke: 4, strokeCol: W }), cvH(T, 'Contact', 0.05, 0.25, 0.25, acc), T(CONTACT.join('\n'), 0.05, 0.28, 0.25, 10, { align: 'left', lh: 1.9, col: W, keepCol: 1 }), cvH(T, 'Skills', 0.05, 0.42, 0.25, acc), ...bars(T, G, 0.05, 0.455, 0.24, acc, W, { txt: W }), cvH(T, 'Languages', 0.05, 0.75, 0.25, acc), T('English · fluent\nMalayalam · native\nHindi · good', 0.05, 0.78, 0.25, 10, { align: 'left', lh: 1.8, col: W, keepCol: 1 }), T('Your Name', 0.39, 0.05, 0.56, 34, { head: 1, bold: 1, align: 'left' }), T('Graphic Designer', 0.39, 0.115, 0.56, 13, { upper: 1, ls: 0.25, align: 'left', col: acc, keepCol: 1 }), G('block', 0.39, 0.16, 0.08, 0.004, { col: acc, keepCol: 1 }), cvH(T, 'Profile', 0.39, 0.19, 0.55), T(PROFILE, 0.39, 0.215, 0.55, 10.5, { align: 'left', lh: 1.55 }), cvH(T, 'Experience', 0.39, 0.32, 0.55), ...expBlock(T, 0.39, 0.35, 0.55, { acc }), cvH(T, 'Education', 0.39, 0.72, 0.55), ...eduBlock(T, 0.39, 0.75, 0.55), cvH(T, 'Interests', 0.39, 0.87, 0.55), T('Photography · Travel · Sailing · Cooking', 0.39, 0.895, 0.55, 10, { align: 'left' })],
    header: (dark, acc) => ({ T, G }) => [G('block', 0, 0, 1, 0.19, { col: dark, keepCol: 1 }), T('Your Name', 0.06, 0.045, 0.88, 38, { head: 1, bold: 1, align: 'left', col: W, keepCol: 1 }), T('Graphic Designer', 0.06, 0.115, 0.5, 13, { upper: 1, ls: 0.3, align: 'left', col: acc, keepCol: 1 }), T(CONTACT.slice(0, 3).join('   ·   '), 0.5, 0.12, 0.44, 9.5, { align: 'right', col: W, keepCol: 1 }), cvH(T, 'Profile', 0.06, 0.23, 0.56, acc), T(PROFILE, 0.06, 0.255, 0.56, 10.5, { align: 'left', lh: 1.55 }), cvH(T, 'Experience', 0.06, 0.36, 0.56, acc), ...expBlock(T, 0.06, 0.39, 0.56, { acc }), G('block', 0.655, 0.23, 0.0018, 0.7, { col: dark, keepCol: 1, op: 0.25 }), cvH(T, 'Skills', 0.69, 0.23, 0.25, acc), T(SKILLS.map((x) => '•  ' + x).join('\n'), 0.69, 0.26, 0.25, 10.5, { align: 'left', lh: 1.85 }), cvH(T, 'Education', 0.69, 0.47, 0.25, acc), ...eduBlock(T, 0.69, 0.5, 0.25), cvH(T, 'Languages', 0.69, 0.64, 0.25, acc), T('English\nMalayalam\nHindi', 0.69, 0.67, 0.25, 10.5, { align: 'left', lh: 1.8 }), cvH(T, 'Location', 0.69, 0.79, 0.25, acc), T('Kochi, Kerala\nOpen to relocation', 0.69, 0.82, 0.25, 10.5, { align: 'left', lh: 1.7 })],
    minimal: (dark, acc) => ({ T, G }) => { const sec = (t, y) => [T(t, 0.07, y, 0.2, 11, { head: 1, bold: 1, align: 'left' })]; return [T('Your Name', 0.07, 0.05, 0.86, 44, { head: 1, align: 'center' }), T('GRAPHIC DESIGNER', 0.07, 0.125, 0.86, 11, { ls: 0.5, align: 'center', col: acc, keepCol: 1 }), T(CONTACT.join('   |   '), 0.07, 0.16, 0.86, 9.5, { align: 'center' }), G('block', 0.07, 0.195, 0.86, 0.0016, { col: dark, keepCol: 1, op: 0.5 }), ...sec('Profile', 0.22), T(PROFILE, 0.28, 0.22, 0.65, 10.5, { align: 'left', lh: 1.55 }), G('block', 0.07, 0.31, 0.86, 0.0016, { col: dark, keepCol: 1, op: 0.2 }), ...sec('Experience', 0.33), ...expBlock(T, 0.28, 0.33, 0.65, { acc }), G('block', 0.07, 0.69, 0.86, 0.0016, { col: dark, keepCol: 1, op: 0.2 }), ...sec('Education', 0.71), ...eduBlock(T, 0.28, 0.71, 0.65), G('block', 0.07, 0.82, 0.86, 0.0016, { col: dark, keepCol: 1, op: 0.2 }), ...sec('Skills', 0.84), T(SKILLS.join('  ·  '), 0.28, 0.84, 0.65, 10.5, { align: 'left', lh: 1.6 })]; },
    timeline: (dark, acc) => ({ T, G, Fc }) => { const out = [Fc(0.13, 0.1, 0.15, { stroke: 3, strokeCol: acc }), T('Your Name', 0.25, 0.055, 0.7, 34, { head: 1, bold: 1, align: 'left' }), T('Graphic Designer  ·  Kochi', 0.25, 0.115, 0.7, 12, { align: 'left', col: acc, keepCol: 1 }), T(CONTACT.slice(0, 3).join('   ·   '), 0.25, 0.145, 0.7, 9.5, { align: 'left' }), cvH(T, 'About', 0.06, 0.22, 0.2, acc), T(PROFILE, 0.29, 0.22, 0.65, 10.5, { align: 'left', lh: 1.55 }), cvH(T, 'Experience', 0.06, 0.305, 0.2, acc), G('block', 0.2485, 0.35, 0.003, 0.34, { col: acc, keepCol: 1, op: 0.5 })]; EXP.forEach(([r, c, d, b], i) => { const y = 0.345 + i * 0.12; out.push(G('circle', 0.24, y + 0.004, 0.02, 0.014, { col: acc, keepCol: 1 }), T(d, 0.06, y, 0.17, 9.5, { align: 'right', bold: 1 }), T(r, 0.29, y, 0.65, 12.5, { bold: 1, align: 'left' }), T(c, 0.29, y + 0.024, 0.65, 10, { ital: 1, align: 'left' }), T(b, 0.29, y + 0.048, 0.65, 9.5, { align: 'left', lh: 1.5 })); }); out.push(cvH(T, 'Education', 0.06, 0.72, 0.2, acc), ...eduBlock(T, 0.29, 0.72, 0.65), cvH(T, 'Skills', 0.06, 0.84, 0.2, acc), ...pills(T, G, 0.29, 0.84, 0.65, acc, W, 3)); return out; },
    modern: (dark, acc) => ({ T, F, G }) => [G('block', 0, 0, 0.022, 1, { col: acc, keepCol: 1 }), F(0.7, 0.05, 0.24, 0.17, { r: 14 }), T('YOUR', 0.07, 0.05, 0.6, 46, { font: 'display', align: 'left' }), T('NAME', 0.07, 0.11, 0.6, 46, { font: 'display', align: 'left', col: acc, keepCol: 1 }), T('Graphic Designer · ' + CONTACT[1], 0.07, 0.185, 0.6, 11, { align: 'left' }), cvH(T, 'Profile', 0.07, 0.25, 0.87, acc), T(PROFILE, 0.07, 0.275, 0.87, 10.5, { align: 'left', lh: 1.55 }), cvH(T, 'Experience', 0.07, 0.36, 0.6, acc), ...expBlock(T, 0.07, 0.39, 0.56, { acc, step: 0.125 }), G('block', 0.66, 0.36, 0.28, 0.58, { col: acc, keepCol: 1, op: 0.08 }), cvH(T, 'Skills', 0.68, 0.38, 0.24, acc), ...pills(T, G, 0.68, 0.41, 0.24, acc, W), cvH(T, 'Education', 0.68, 0.56, 0.24, acc), ...eduBlock(T, 0.68, 0.59, 0.24), cvH(T, 'Contact', 0.68, 0.72, 0.24, acc), T(CONTACT.join('\n'), 0.68, 0.75, 0.24, 10, { align: 'left', lh: 1.9 })],
    elegant: (dark, acc) => ({ T, G }) => [G('or-monogram', 0.42, 0.03, 0.16, 0.113, { col: acc, keepCol: 1, sw: 0.8 }), T('YN', 0.42, 0.07, 0.16, 22, { head: 1, col: acc, keepCol: 1 }), T('Your Name', 0.06, 0.16, 0.88, 40, { font: 'script' }), T('GRAPHIC DESIGNER', 0.06, 0.23, 0.88, 11, { ls: 0.5 }), T(CONTACT.join('   ·   '), 0.06, 0.26, 0.88, 9.5), G('or-divider2', 0.3, 0.285, 0.4, 0.03, { col: acc, keepCol: 1, sw: 0.8 }), T('PROFILE', 0.06, 0.33, 0.88, 11, { ls: 0.4, head: 1 }), T(PROFILE, 0.12, 0.355, 0.76, 10.5, { lh: 1.6 }), T('EXPERIENCE', 0.06, 0.44, 0.56, 11, { ls: 0.4, head: 1, align: 'left' }), ...expBlock(T, 0.06, 0.47, 0.56, { acc }), T('EDUCATION', 0.67, 0.44, 0.27, 11, { ls: 0.4, head: 1, align: 'left' }), ...eduBlock(T, 0.67, 0.47, 0.27), T('SKILLS', 0.67, 0.6, 0.27, 11, { ls: 0.4, head: 1, align: 'left' }), T(SKILLS.join('\n'), 0.67, 0.63, 0.27, 10.5, { align: 'left', lh: 1.8 }), G('or-dots', 0.35, 0.93, 0.3, 0.02, { col: acc, keepCol: 1 })],
    creative: (dark, acc) => ({ T, G, Fc }) => [G('ab-blob1', 0.55, -0.06, 0.6, 0.38, { col: acc, keepCol: 1, op: 0.25 }), G('ab-blob3', -0.12, 0.8, 0.4, 0.26, { col: acc, keepCol: 1, op: 0.18 }), Fc(0.78, 0.15, 0.26, { stroke: 6, strokeCol: W }), T('Hello,\nI am Your Name', 0.07, 0.06, 0.55, 34, { head: 1, bold: 1, align: 'left', lh: 1.1 }), T('Graphic designer who loves bold colour and clear ideas.', 0.07, 0.19, 0.55, 12, { align: 'left', ital: 1 }), G('hd-underline', 0.07, 0.235, 0.2, 0.03, { col: acc, keepCol: 1 }), cvH(T, 'Experience', 0.07, 0.31, 0.56, acc), ...expBlock(T, 0.07, 0.34, 0.56, { acc }), cvH(T, 'Skills', 0.68, 0.33, 0.26, acc), ...bars(T, G, 0.68, 0.36, 0.26, acc, dark), cvH(T, 'Education', 0.68, 0.64, 0.26, acc), ...eduBlock(T, 0.68, 0.67, 0.26), cvH(T, 'Say hello', 0.07, 0.72, 0.56, acc), T(CONTACT.join('\n'), 0.07, 0.75, 0.56, 11, { align: 'left', lh: 1.8 })],
    seafarer: (dark, acc) => ({ T, G, Fc }) => { const out = [G('block', 0, 0, 1, 0.17, { col: dark, keepCol: 1 }), G('mr-ship', 0.62, 0.1, 0.34, 0.1, { col: W, keepCol: 1, op: 0.18 }), Fc(0.12, 0.085, 0.13, { stroke: 3, strokeCol: W }), T('Your Name', 0.22, 0.035, 0.72, 30, { head: 1, bold: 1, align: 'left', col: W, keepCol: 1 }), T('CHIEF OFFICER · UNLIMITED', 0.22, 0.09, 0.72, 12, { ls: 0.3, align: 'left', col: acc, keepCol: 1 }), T(CONTACT.slice(0, 2).join('   ·   ') + '   ·   Available from __ / __ / ____', 0.22, 0.125, 0.72, 9, { align: 'left', col: W, keepCol: 1 }), cvH(T, 'Particulars', 0.05, 0.2, 0.9, acc)]; [['Nationality', 'Indian'], ['Date of birth', '__ / __ / ____'], ['CDC no.', '________'], ['Passport no.', '________'], ['CoC', 'Chief Mate, unlimited'], ['US visa', 'C1/D, valid'], ['Medical', 'Valid to __ / ____'], ['Height / overall size', '___ cm / ___']].forEach(([a, b], i) => { const c = i % 4, r = Math.floor(i / 4); out.push(T(a.toUpperCase(), 0.05 + c * 0.225, 0.23 + r * 0.05, 0.22, 8, { bold: 1, ls: 0.12, align: 'left', col: acc, keepCol: 1 }), T(b, 0.05 + c * 0.225, 0.245 + r * 0.05, 0.22, 10.5, { align: 'left' })); }); out.push(cvH(T, 'Sea service', 0.05, 0.34, 0.9, acc)); const cols = [['Vessel', 0.05, 0.19], ['Type', 0.24, 0.16], ['GRT / DWT', 0.4, 0.13], ['Rank', 0.53, 0.14], ['Company', 0.67, 0.14], ['From to', 0.81, 0.14]]; cols.forEach(([h, x, w]) => out.push(T(h.toUpperCase(), x, 0.37, w, 8, { bold: 1, ls: 0.1, align: 'left' }))); for (let i = 0; i <= 7; i++) out.push(G('block', 0.05, 0.39 + i * 0.033, 0.9, 0.0015, { col: dark, keepCol: 1, op: i ? 0.2 : 0.6 })); [['MV Kite Arrow', 'Open hatch bulk', '46,000', 'Chief Officer', 'Gearbulk', '2026 to 2027'], ['MV Grebe Arrow', 'Open hatch bulk', '46,000', '2nd Officer', 'Gearbulk', '2025 to 2026']].forEach((row, r) => row.forEach((v, c) => out.push(T(v, cols[c][1], 0.396 + r * 0.033, cols[c][2], 9, { align: 'left' })))); out.push(cvH(T, 'Certificates', 0.05, 0.64, 0.9, acc)); ['Certificate', 'Number', 'Issued', 'Valid until'].forEach((h, i) => out.push(T(h.toUpperCase(), [0.05, 0.4, 0.6, 0.78][i], 0.67, 0.2, 8, { bold: 1, ls: 0.1, align: 'left' }))); for (let i = 0; i <= 6; i++) out.push(G('block', 0.05, 0.69 + i * 0.03, 0.9, 0.0015, { col: dark, keepCol: 1, op: i ? 0.2 : 0.6 })); ['Certificate of Competency', 'GMDSS GOC', 'Advanced fire fighting', 'Medical care', 'ECDIS generic', 'Ship security officer'].forEach((c, i) => out.push(T(c, 0.05, 0.695 + i * 0.03, 0.34, 9, { align: 'left' }))); out.push(T('References available on request', 0.05, 0.9, 0.9, 9.5, { ital: 1, align: 'left' })); return out; }
  };
  const CVS = [
    ['sidebar', 'Navy sidebar', 'corporate', '#13233f', '#ffb703'], ['sidebar', 'Emerald sidebar', 'clean', '#0f3b2e', '#d8b86a'], ['sidebar', 'Charcoal sidebar', 'minimal', '#2b2b2b', '#ff7a59'],
    ['header', 'Blue header', 'corporate', '#1f3c88', '#9fc3ff'], ['header', 'Plum header', 'lavender', '#3d2c6b', '#d9c8ff'], ['header', 'Black header', 'swiss', '#111111', '#e63946'],
    ['minimal', 'Minimal serif', 'clean', '#1d1d1f', '#8a6d3b'], ['minimal', 'Minimal sand', 'sand', '#3f3426', '#b08d57'], ['minimal', 'Minimal sage', 'sage', '#2f3a2f', '#7d9471'],
    ['timeline', 'Timeline teal', 'clean', '#134e4a', '#2a9d8f'], ['timeline', 'Timeline coral', 'coral', '#2b2b2b', '#ff5a5f'], ['timeline', 'Timeline indigo', 'corporate', '#1e1b4b', '#6366f1'],
    ['modern', 'Modern bold', 'swiss', '#111111', '#e63946'], ['modern', 'Modern cobalt', 'clean', '#111111', '#1736a8'], ['modern', 'Modern orange', 'peach', '#5a2e1d', '#ff7a59'],
    ['elegant', 'Elegant gold', 'linen', '#4a4237', '#b08d57'], ['elegant', 'Elegant rose', 'blush', '#8a5a5a', '#c98b8b'], ['elegant', 'Elegant noir', 'noirgold', '#f2e6c9', '#c9a45c'],
    ['creative', 'Creative pink', 'clean', '#2b2b2b', '#ff4fa3'], ['creative', 'Creative mint', 'mint', '#1b5e4a', '#2a9d8f'], ['creative', 'Creative violet', 'lavender', '#3d2c6b', '#7c5cd6'],
    ['seafarer', 'Seafarer navy', 'clean', '#0b1f3a', '#d4b46a'], ['seafarer', 'Seafarer teal', 'clean', '#0f3d47', '#7fd1c7'], ['seafarer', 'Seafarer charcoal', 'clean', '#222831', '#ff9500']
  ];
  const out = CVS.map(([lay, n, style, dark, acc], i) => ({ k: `cv-${lay}-${i}`, n: `CV, ${n}`, cat: 'CVs', style, build: cv[lay](dark, acc) }));
  const letter = (k, n, style, dark, acc, head) => ({ k, n, cat: 'CVs', style, build: ({ T, G }) => [...head(T, G, dark, acc), T('__ / __ / ____', 0.08, 0.22, 0.84, 10.5, { align: 'left' }), T('Hiring Manager\nCompany Name\nAddress line, City', 0.08, 0.25, 0.84, 10.5, { align: 'left', lh: 1.6 }), T('Dear Hiring Manager,', 0.08, 0.34, 0.84, 11.5, { align: 'left', bold: 1 }), T('I am writing to apply for the role of ________ at ________. In my current role I ________, and I would bring the same care and energy to your team.\n\nWhat I can offer:\n•  A result you are proud of, with a number\n•  A skill that matches their job advert\n•  A quality that makes you easy to work with\n\nI would welcome the chance to talk about how I can help. Thank you for your time.', 0.08, 0.375, 0.84, 11, { align: 'left', lh: 1.65 }), T('Kind regards,', 0.08, 0.72, 0.84, 11, { align: 'left' }), T('Your Name', 0.08, 0.75, 0.84, 26, { font: 'script', align: 'left', col: acc, keepCol: 1 })] });
  out.push(
    letter('cl-sidebar', 'Cover letter, Navy', 'corporate', '#13233f', '#ffb703', (T, G, d, a) => [G('block', 0, 0, 1, 0.15, { col: d, keepCol: 1 }), T('Your Name', 0.08, 0.04, 0.6, 30, { head: 1, bold: 1, align: 'left', col: W, keepCol: 1 }), T('GRAPHIC DESIGNER', 0.08, 0.1, 0.6, 11, { ls: 0.3, align: 'left', col: a, keepCol: 1 }), T(CONTACT.slice(0, 3).join('\n'), 0.6, 0.035, 0.32, 9.5, { align: 'right', lh: 1.6, col: W, keepCol: 1 })]),
    letter('cl-minimal', 'Cover letter, Minimal', 'clean', '#1d1d1f', '#8a6d3b', (T, G, d, a) => [T('Your Name', 0.08, 0.05, 0.84, 40, { head: 1 }), T(CONTACT.join('   |   '), 0.08, 0.12, 0.84, 9.5), G('block', 0.08, 0.16, 0.84, 0.0016, { col: d, keepCol: 1, op: 0.5 })]),
    letter('cl-elegant', 'Cover letter, Elegant', 'linen', '#4a4237', '#b08d57', (T, G, d, a) => [G('or-monogram', 0.42, 0.02, 0.16, 0.113, { col: a, keepCol: 1, sw: 0.8 }), T('YN', 0.42, 0.06, 0.16, 22, { head: 1, col: a, keepCol: 1 }), T(CONTACT.join('   ·   '), 0.08, 0.16, 0.84, 9.5)]),
    letter('cl-sea', 'Cover letter, Seafarer', 'clean', '#0b1f3a', '#d4b46a', (T, G, d, a) => [G('block', 0, 0, 1, 0.15, { col: d, keepCol: 1 }), G('mr-ship', 0.62, 0.08, 0.32, 0.09, { col: W, keepCol: 1, op: 0.2 }), T('Your Name', 0.08, 0.035, 0.6, 28, { head: 1, bold: 1, align: 'left', col: W, keepCol: 1 }), T('CHIEF OFFICER · CDC ________', 0.08, 0.095, 0.6, 11, { ls: 0.25, align: 'left', col: a, keepCol: 1 })])
  );
  /* Quote posters with botanical and ornament frames */
  const quotes = [['A smooth sea never made a skilled sailor.', 'Franklin D. Roosevelt'], ['Bloom where you are planted.', 'Old proverb'], ['Do small things with great love.', 'Mother Teresa'], ['The best is yet to come.', 'Robert Browning'], ['Stay close to anything that makes you glad you are alive.', 'Hafiz'], ['Slow progress is still progress.', ''], ['Collect moments, not things.', ''], ['Be the calm in the storm.', ''], ['Home is where the anchor drops.', ''], ['Make today beautiful.', '']];
  const qp = [
    ['sage', (G) => [G('b-laurel', 0.15, 0.12, 0.7, 0.495, { op: 0.9 })]], ['blush', (G) => [G('b-crescent', 0.1, 0.1, 0.8, 0.566)]], ['emerald', (G) => [G('fr-arch', 0.1, 0.06, 0.8, 0.85, { sw: 1 })]], ['noirgold', (G) => [G('fr-deco', 0.06, 0.04, 0.88, 0.92, { sw: 1 }), G('or-fan', 0.3, 0.08, 0.4, 0.17)]], ['terra', (G) => [G('ab-sun', 0.2, 0.06, 0.6, 0.3, { op: 0.9 }), G('ab-rainbow', 0.25, 0.68, 0.5, 0.22, { op: 0.6 })]],
    ['sand', (G) => [G('b-corner', 0, 0, 0.42, 0.3), G('b-corner', 0.58, 0.7, 0.42, 0.3, { rot: 180 })]], ['peach', (G) => [G('ab-blob1', -0.15, -0.08, 0.7, 0.5, { op: 0.35 }), G('ab-blob2', 0.55, 0.65, 0.6, 0.42, { op: 0.3 })]], ['lavender', (G) => [G('fl-cluster', 0.18, 0.06, 0.64, 0.35)]], ['voyage', (G) => [G('mr-rope', 0.12, 0.15, 0.76, 0.537, { sw: 1 }), G('mr-gulls', 0.6, 0.06, 0.3, 0.1)]], ['coral', (G) => [G('hd-spark', 0.7, 0.06, 0.24, 0.17), G('hd-highlight', 0.12, 0.375, 0.76, 0.11, { op: 0.3 })]]
  ];
  const QBOX = { 0: [0.28, 0.31, 0.44, 30], 1: [0.36, 0.3, 0.52, 44], 7: [0.12, 0.5, 0.76, 44], 8: [0.24, 0.36, 0.52, 32], 9: [0.12, 0.33, 0.76, 50] };
  quotes.forEach(([q, a], i) => { const [style, deco] = qp[i]; const qb = QBOX[i]; out.push({ k: `qt-${i}`, n: `Quote poster, ${['Laurel', 'Crescent', 'Arch', 'Art deco', 'Boho', 'Botanical corners', 'Organic', 'Floral', 'Rope', 'Sparkle'][i]}`, cat: 'Quotes', style, build: ({ T, G }) => [...deco(G), qb ? T(q, qb[0], qb[1], qb[2], qb[3], { head: 1, lh: 1.25, ital: i % 3 === 0 }) : T(q, 0.16, i === 4 ? 0.4 : 0.34, 0.68, q.length > 40 ? 32 : 40, { head: 1, lh: 1.25, ital: i % 3 === 0 }), a ? T(a.toUpperCase(), 0.16, 0.7, 0.68, 11, { ls: 0.4 }) : G('or-dots', 0.4, 0.7, 0.2, 0.02)] }); });
  /* Botanical wedding suite */
  const wed = [
    ['wd2-invite', 'Botanical invitation', 'sage', 'inv57', ({ T, G }) => [G('b-sprig', 0.4, 0.03, 0.2, 0.25, { rot: -10 }), T('TOGETHER WITH THEIR FAMILIES', 0.06, 0.29, 0.88, 10, { ls: 0.3 }), T('Anna', 0.06, 0.33, 0.88, 50, { font: 'script' }), T('and', 0.06, 0.44, 0.88, 14, { ital: 1, head: 1 }), T('Rahul', 0.06, 0.47, 0.88, 50, { font: 'script' }), T('REQUEST THE PLEASURE OF YOUR COMPANY', 0.06, 0.6, 0.88, 9, { ls: 0.25 }), T('Saturday, 14 February 2027\nat four in the afternoon', 0.06, 0.65, 0.88, 13, { head: 1, lh: 1.5 }), T('The Garden Pavilion, Kumarakom', 0.06, 0.76, 0.88, 11, { ls: 0.1 }), G('b-olive', 0.3, 0.86, 0.4, 0.06)]],
    ['wd2-wreath', 'Wreath invitation', 'linen', 'inv57', ({ T, G }) => [G('b-wreath', 0.18, 0.06, 0.64, 0.457), T('A & R', 0.18, 0.21, 0.64, 40, { font: 'script' }), T('ARE GETTING MARRIED', 0.06, 0.56, 0.88, 12, { ls: 0.35 }), T('14 · 02 · 2027', 0.06, 0.61, 0.88, 22, { head: 1 }), T('Kumarakom, Kerala', 0.06, 0.68, 0.88, 13, { ital: 1 }), T('Reception to follow', 0.06, 0.82, 0.88, 11, { ls: 0.15 })]],
    ['wd2-arch', 'Arch invitation', 'terra', 'inv57', ({ T, G, F }) => [G('fr-arch', 0.1, 0.05, 0.8, 0.86, { sw: 0.9 }), F(0.2, 0.1, 0.6, 0.3, { shape: 'arch' }), T('Anna & Rahul', 0.1, 0.45, 0.8, 34, { font: 'script' }), T('INVITE YOU TO CELEBRATE THEIR WEDDING', 0.14, 0.56, 0.72, 9, { ls: 0.25, lh: 1.5 }), T('14 February 2027 · 4 PM\nThe Garden Pavilion', 0.1, 0.65, 0.8, 12, { head: 1, lh: 1.5 })]],
    ['wd2-deco', 'Art deco invitation', 'noirgold', 'inv57', ({ T, G }) => [G('fr-deco', 0.05, 0.035, 0.9, 0.93, { sw: 1 }), G('or-fan', 0.3, 0.07, 0.4, 0.16), T('THE WEDDING OF', 0.06, 0.27, 0.88, 11, { ls: 0.5 }), T('ANNA', 0.06, 0.32, 0.88, 42, { head: 1, ls: 0.15 }), T('&', 0.06, 0.41, 0.88, 26, { font: 'script', col: '#c9a45c', keepCol: 1 }), T('RAHUL', 0.06, 0.46, 0.88, 42, { head: 1, ls: 0.15 }), G('or-divider', 0.25, 0.58, 0.5, 0.05, { sw: 0.8 }), T('SATURDAY · 14 · 02 · 2027\nEIGHT IN THE EVENING', 0.06, 0.66, 0.88, 11, { ls: 0.3, lh: 1.7 }), T('Black tie', 0.06, 0.8, 0.88, 14, { font: 'script' })]],
    ['wd2-details', 'Wedding details card', 'sage', 'a6p', ({ T, G }) => [G('b-sprig', 0.04, 0.04, 0.14, 0.24, { rot: 20 }), T('Details', 0.06, 0.08, 0.88, 32, { font: 'script' }), T('CEREMONY\n4 PM, The Garden Pavilion\n\nRECEPTION\n7 PM, Lake View Lawn\n\nSTAY\nRooms held at Lake Resort until 1 January\n\nRSVP\nanna.rahul@email.com', 0.08, 0.26, 0.84, 9.5, { lh: 1.5 })]],
    ['wd2-monogram', 'Monogram menu', 'emerald', 'dl', ({ T, G }) => [G('or-monogram', 0.3, 0.03, 0.4, 0.19, { sw: 0.8 }), T('A R', 0.3, 0.09, 0.4, 24, { head: 1 }), T('Dinner', 0.06, 0.25, 0.88, 32, { font: 'script' }), T('Tomato rasam\n\nKarimeen pollichathu\nAppam and stew\nMalabar biryani\n\nPalada payasam\nWedding cake', 0.06, 0.35, 0.88, 11, { head: 1, lh: 1.6 }), G('b-olive', 0.2, 0.9, 0.6, 0.04)]],
    ['wd2-welcome', 'Botanical welcome sign', 'sage', 'a3p', ({ T, G }) => [G('b-corner', 0, 0, 0.5, 0.35), G('b-corner', 0.5, 0.65, 0.5, 0.35, { rot: 180 }), T('Welcome', 0.06, 0.32, 0.88, 110, { font: 'script' }), T('TO THE WEDDING OF', 0.06, 0.5, 0.88, 18, { ls: 0.4 }), T('Anna & Rahul', 0.06, 0.55, 0.88, 50, { head: 1 })]],
    ['wd2-save', 'Save the date, wreath', 'blush', 'a6p', ({ T, G }) => [G('b-laurel', 0.15, 0.1, 0.7, 0.494), T('Save', 0.15, 0.2, 0.7, 40, { font: 'script' }), T('the date', 0.15, 0.3, 0.7, 22, { font: 'script' }), T('14.02.27', 0.06, 0.66, 0.88, 26, { head: 1, ls: 0.2 }), T('Anna & Rahul · Kerala', 0.06, 0.76, 0.88, 11, { ls: 0.2 })]]
  ];
  wed.forEach(([k, n, style, size, build]) => out.push({ k, n, cat: 'Wedding', size, style, build }));
  /* Aesthetic social posts */
  const soc = [
    ['so2-arch', 'Arch photo post', 'terra', 'ig45', ({ T, F, G }) => [F(0.15, 0.08, 0.7, 0.62, { shape: 'arch' }), G('fr-arch', 0.12, 0.06, 0.76, 0.66, { sw: 0.8 }), T('New collection', 0.06, 0.76, 0.88, 38, { font: 'script' }), T('AVAILABLE NOW', 0.06, 0.87, 0.88, 12, { ls: 0.5 })]],
    ['so2-boho', 'Boho quote', 'sand', 'igsq', ({ T, G }) => [G('ab-rainbow', 0.25, 0.08, 0.5, 0.22), T('Choose joy', 0.06, 0.38, 0.88, 64, { font: 'script' }), T('EVERY SINGLE DAY', 0.06, 0.56, 0.88, 14, { ls: 0.5 }), G('ab-sun', 0.35, 0.72, 0.3, 0.15, { op: 0.7 })]],
    ['so2-botanical', 'Botanical announcement', 'sage', 'igsq', ({ T, G }) => [G('b-euca', 0.03, 0.05, 0.22, 0.37), G('b-euca', 0.75, 0.58, 0.22, 0.37, { rot: 180 }), T('We are open', 0.1, 0.34, 0.8, 50, { font: 'script' }), T('MONDAY TO SATURDAY · 9 TO 7', 0.1, 0.5, 0.8, 12, { ls: 0.3 }), T('Visit us at Fort Kochi', 0.1, 0.57, 0.8, 16, { head: 1, ital: 1 })]],
    ['so2-minimal', 'Minimal statement', 'swiss', 'ig45', ({ T, G, s }) => [T('Less,\nbut\nbetter.', 0.08, 0.1, 0.84, 96, { font: 'display', align: 'left', lh: 0.95 }), G('block', 0.08, 0.78, 0.15, 0.008, { col: s.accent }), T('DESIGN NOTES · 01', 0.08, 0.82, 0.84, 12, { ls: 0.4, align: 'left' })]],
    ['so2-blob', 'Organic promo', 'peach', 'igsq', ({ T, F, G }) => [G('ab-blob1', 0.08, 0.06, 0.84, 0.84, { op: 0.35 }), F(0.18, 0.12, 0.64, 0.5, { shape: 'blob' }), T('Weekend sale', 0.06, 0.66, 0.88, 46, { font: 'script' }), T('UP TO 40% OFF · LINK IN BIO', 0.06, 0.79, 0.88, 13, { ls: 0.3, bold: 1 })]],
    ['so2-deco', 'Art deco announcement', 'noirgold', 'igsq', ({ T, G }) => [G('or-sunburst', 0.2, 0.08, 0.6, 0.6, { op: 0.25 }), T('GRAND', 0.06, 0.3, 0.88, 40, { head: 1, ls: 0.3 }), T('OPENING', 0.06, 0.39, 0.88, 40, { head: 1, ls: 0.3 }), G('or-divider', 0.25, 0.52, 0.5, 0.06, { sw: 0.8 }), T('Friday 7 PM · Champagne and live jazz', 0.06, 0.64, 0.88, 14, { ls: 0.1 })]],
    ['so2-sparkle', 'Sparkle news', 'dusk', 'igsq', ({ T, G }) => [G('hd-spark', 0.7, 0.08, 0.22, 0.22), G('hd-spark', 0.06, 0.66, 0.16, 0.16), T('Big news', 0.06, 0.3, 0.88, 64, { font: 'script' }), T('Something new is coming this Friday', 0.12, 0.5, 0.76, 18, { lh: 1.4 }), G('hd-underline', 0.3, 0.64, 0.4, 0.05, { col: '#ffd1dc', keepCol: 1 })]],
    ['so2-tips', 'Tips carousel, botanical', 'sage', 'ig45', ({ T, G, s }) => [G('b-sprig', 0.78, 0.02, 0.18, 0.3, { rot: 15 }), T('3 ways to', 0.08, 0.1, 0.84, 26, { head: 1, ital: 1, align: 'left' }), T('slow down', 0.08, 0.15, 0.84, 50, { font: 'script', align: 'left' }), ...['Start with ten quiet minutes', 'Leave your phone in another room', 'Walk somewhere green every day'].flatMap((t, i) => [T('0' + (i + 1), 0.08, 0.35 + i * 0.16, 0.15, 36, { head: 1, align: 'left', col: s.accent, keepCol: 1 }), T(t, 0.24, 0.36 + i * 0.16, 0.68, 18, { align: 'left' })])]],
    ['so2-photo', 'Polaroid stack', 'kraft', 'igsq', ({ T, F, G }) => [F(0.1, 0.1, 0.5, 0.55, { pad: 7, pol: true, shadow: 0.6, rot: -6 }), F(0.4, 0.2, 0.5, 0.55, { pad: 7, pol: true, shadow: 0.6, rot: 5 }), G('tape', 0.56, 0.17, 0.16, 0.04, { rot: 8, col: '#f6e7b4', keepCol: 1, op: 0.85 }), T('Summer diary', 0.06, 0.83, 0.88, 40, { font: 'hand' })]],
    ['so2-story', 'Botanical story', 'linen', 'igst', ({ T, F, G }) => [G('b-fern', 0.02, 0.02, 0.3, 0.3, { rot: 30, op: 0.6 }), F(0.12, 0.2, 0.76, 0.45, { shape: 'arch' }), T('Sunday edit', 0.06, 0.7, 0.88, 46, { font: 'script' }), T('LINK IN BIO', 0.06, 0.8, 0.88, 14, { ls: 0.5 })]],
    ['so2-quote2', 'Laurel quote', 'emerald', 'ig45', ({ T, G }) => [G('b-laurel', 0.12, 0.15, 0.76, 0.43), T('Strong women\nlift each other up', 0.15, 0.27, 0.7, 26, { head: 1, ital: 1, lh: 1.3 }), T('HAPPY WOMEN\'S DAY', 0.06, 0.8, 0.88, 13, { ls: 0.4 })]],
    ['so2-menu', 'Menu highlight', 'terra', 'ig45', ({ T, F, G }) => [F(0.08, 0.06, 0.84, 0.5, { r: 200, shape: 'circle' }), G('b-olive', 0.2, 0.6, 0.6, 0.05), T('Chef\'s special', 0.06, 0.66, 0.88, 40, { font: 'script' }), T('Karimeen pollichathu · ₹ 480', 0.06, 0.77, 0.88, 16, { head: 1 }), T('TONIGHT ONLY', 0.06, 0.84, 0.88, 12, { ls: 0.5 })]]
  ];
  soc.forEach(([k, n, style, size, build]) => out.push({ k, n, cat: 'Social', size, style, build }));
  /* Event posters, aesthetic */
  const ev = [
    ['ev3-gala', 'Art deco gala', 'noirgold', ({ T, G }) => [G('fr-deco', 0.05, 0.03, 0.9, 0.94, { sw: 1 }), G('or-fan', 0.25, 0.07, 0.5, 0.2), T('THE ANNUAL', 0.06, 0.32, 0.88, 14, { ls: 0.6 }), T('GALA', 0.06, 0.36, 0.88, 110, { head: 1, ls: 0.15 }), T('NIGHT', 0.06, 0.53, 0.88, 30, { head: 1, ls: 0.6 }), G('or-divider', 0.2, 0.62, 0.6, 0.05, { sw: 0.8 }), T('SATURDAY 20 MARCH · 8 PM\nTHE TAJ BALLROOM', 0.06, 0.7, 0.88, 14, { ls: 0.3, lh: 1.8 })]],
    ['ev3-brunch', 'Botanical brunch', 'sage', ({ T, G }) => [G('b-wreath', 0.2, 0.05, 0.6, 0.425), T('Sunday', 0.2, 0.16, 0.6, 34, { font: 'script' }), T('BRUNCH', 0.2, 0.24, 0.6, 22, { ls: 0.5 }), T('Fresh bakes, cold brew\nand slow conversations', 0.06, 0.55, 0.88, 22, { head: 1, ital: 1, lh: 1.35 }), T('EVERY SUNDAY · 10 AM TO 2 PM', 0.06, 0.72, 0.88, 13, { ls: 0.3 }), G('b-olive', 0.3, 0.84, 0.4, 0.06)]],
    ['ev3-boho', 'Boho market', 'terra', ({ T, G }) => [G('ab-sun', 0.15, 0.08, 0.7, 0.35), T('Sunset', 0.06, 0.45, 0.88, 64, { font: 'script' }), T('MAKERS MARKET', 0.06, 0.58, 0.88, 26, { ls: 0.4 }), T('Handmade · Vintage · Food · Music', 0.06, 0.66, 0.88, 15, { ital: 1, head: 1 }), T('Saturday 4 PM · Fort Kochi beach', 0.06, 0.74, 0.88, 14, { bold: 1 }), G('ab-rainbow', 0.38, 0.84, 0.24, 0.1, { op: 0.6 })]],
    ['ev3-jazz', 'Jazz night', 'cobalt', ({ T, G }) => [G('ab-circles', 0.1, 0.1, 0.8, 0.5, { col: '#ffd23f', keepCol: 1, sw: 2 }), T('JAZZ', 0.06, 0.6, 0.88, 120, { font: 'display', col: '#ffd23f', keepCol: 1 }), T('NIGHT', 0.06, 0.78, 0.88, 40, { font: 'display', ls: 0.5 }), T('Live quartet · Friday 9 PM', 0.06, 0.88, 0.88, 15)]],
    ['ev3-yoga', 'Retreat poster', 'lavender', ({ T, F, G }) => [G('ab-blob2', 0.1, 0.05, 0.8, 0.5, { op: 0.4 }), F(0.22, 0.1, 0.56, 0.4, { shape: 'arch' }), T('Weekend retreat', 0.06, 0.55, 0.88, 46, { font: 'script' }), T('YOGA · BREATH · REST', 0.06, 0.65, 0.88, 14, { ls: 0.4 }), T('12 to 14 April · Wayanad hills\nThree days, all meals, all levels', 0.06, 0.72, 0.88, 14, { lh: 1.6 })]],
    ['ev3-exhibit', 'Minimal exhibition', 'swiss', ({ T, F, G, s }) => [F(0.08, 0.06, 0.84, 0.5), T('Light &\nShadow', 0.08, 0.6, 0.6, 50, { head: 1, bold: 1, align: 'left', lh: 1 }), G('block', 0.7, 0.6, 0.22, 0.006, { col: s.accent }), T('PHOTOGRAPHY\nEXHIBITION\n\n10 to 20 MAY\nKOCHI BIENNALE\nPAVILION', 0.7, 0.62, 0.22, 10, { align: 'left', lh: 1.5, bold: 1 })]],
    ['ev3-kids', 'Kids fun day', 'peach', ({ T, G }) => [G('ab-confetti', 0.03, 0.02, 0.94, 0.3), T('Fun day', 0.06, 0.25, 0.88, 80, { font: 'script' }), T('GAMES · FACE PAINT · MAGIC SHOW', 0.06, 0.42, 0.88, 14, { ls: 0.2, bold: 1 }), G('ab-rainbow', 0.25, 0.52, 0.5, 0.2), T('Sunday 11 AM · Community hall', 0.06, 0.78, 0.88, 16, { bold: 1 })]],
    ['ev3-sea', 'Seafarers day', 'voyage', ({ T, G }) => [G('mr-wheel', 0.3, 0.06, 0.4, 0.283, { sw: 1.2 }), T('Day of the Seafarer', 0.06, 0.4, 0.88, 40, { font: 'script' }), T('25 JUNE', 0.06, 0.52, 0.88, 22, { ls: 0.5 }), G('mr-gulls', 0.38, 0.6, 0.24, 0.08), T('Thank you to everyone who keeps the world moving.', 0.12, 0.7, 0.76, 15, { ital: 1, head: 1, lh: 1.5 }), G('mr-waves', 0, 0.88, 1, 0.12, { op: 0.5 })]]
  ];
  ev.forEach(([k, n, style, build]) => out.push({ k, n, cat: 'Events', style, build }));
  /* Business cards */
  const bc = [
    ['bc2-botanical', 'Botanical card', 'sage', ({ T, G }) => [G('b-sprig', 0.04, 0.05, 0.16, 0.9, { rot: -8 }), T('Your Name', 0.26, 0.24, 0.7, 52, { font: 'script', align: 'left' }), T('FLORIST & EVENT STYLIST', 0.26, 0.5, 0.7, 20, { ls: 0.25, align: 'left' }), T('+91 00000 00000 · hello@studio.com', 0.26, 0.7, 0.7, 20, { align: 'left' })]],
    ['bc2-deco', 'Art deco card', 'noirgold', ({ T, G }) => [G('fr-deco', 0.03, 0.05, 0.94, 0.9, { sw: 0.8 }), G('or-fan', 0.38, 0.1, 0.24, 0.23), T('YOUR NAME', 0.06, 0.4, 0.88, 46, { head: 1, ls: 0.25 }), T('ARCHITECT', 0.06, 0.6, 0.88, 22, { ls: 0.5, col: '#c9a45c', keepCol: 1 }), T('+91 00000 00000', 0.06, 0.75, 0.88, 20)]],
    ['bc2-minimal', 'Minimal card', 'swiss', ({ T, G, s }) => [T('Your Name', 0.08, 0.18, 0.84, 54, { head: 1, bold: 1, align: 'left' }), T('Product Designer', 0.08, 0.42, 0.84, 26, { align: 'left' }), G('block', 0.08, 0.6, 0.12, 0.03, { col: s.accent }), T('you@email.com\nyourwebsite.com', 0.08, 0.68, 0.84, 20, { align: 'left', lh: 1.4 })]],
    ['bc2-blob', 'Organic card', 'peach', ({ T, G }) => [G('ab-blob1', 0.6, -0.2, 0.55, 0.85, { op: 0.45 }), G('ab-blob3', -0.1, 0.6, 0.35, 0.55, { op: 0.3 }), T('Your Name', 0.08, 0.28, 0.6, 50, { head: 1, bold: 1, align: 'left' }), T('Photographer', 0.08, 0.5, 0.6, 24, { font: 'script', align: 'left' }), T('@yourhandle', 0.08, 0.7, 0.6, 20, { align: 'left' })]],
    ['bc2-sea', 'Maritime card', 'voyage', ({ T, G }) => [G('mr-ship', 0.55, 0.55, 0.42, 0.13, { op: 0.5 }), G('mr-waves', 0, 0.78, 1, 0.22, { op: 0.35 }), T('Your Name', 0.07, 0.15, 0.86, 48, { head: 1, bold: 1, align: 'left' }), T('MARINE SURVEYOR', 0.07, 0.38, 0.86, 20, { ls: 0.35, align: 'left' }), T('+91 00000 00000\nsurvey@email.com', 0.07, 0.52, 0.5, 18, { align: 'left', lh: 1.4 })]],
    ['bc2-monogram', 'Monogram card', 'linen', ({ T, G }) => [G('or-monogram', 0.06, 0.27, 0.3, 0.464, { sw: 0.8 }), T('YN', 0.06, 0.42, 0.3, 40, { head: 1 }), T('Your Name', 0.42, 0.25, 0.54, 40, { head: 1, align: 'left' }), T('Wedding Planner', 0.42, 0.45, 0.54, 22, { ital: 1, align: 'left' }), T('+91 00000 00000\nhello@email.com', 0.42, 0.62, 0.54, 18, { align: 'left', lh: 1.4 })]],
    ['bc2-halftone', 'Halftone card', 'cobalt', ({ T, G }) => [G('ab-halftone', 0.6, 0, 0.4, 0.62, { col: '#ffd23f', keepCol: 1, op: 0.8 }), T('YOUR NAME', 0.07, 0.3, 0.6, 50, { font: 'display', align: 'left' }), T('Creative director', 0.07, 0.52, 0.6, 24, { align: 'left', col: '#ffd23f', keepCol: 1 }), T('you@email.com', 0.07, 0.72, 0.6, 20, { align: 'left' })]],
    ['bc2-terrazzo', 'Terrazzo card', 'terra', ({ T, G }) => [G('ab-terrazzo', 0.6, 0, 0.4, 1, { op: 0.5 }), T('Your Name', 0.07, 0.25, 0.52, 44, { head: 1, align: 'left' }), T('INTERIOR DESIGNER', 0.07, 0.48, 0.52, 18, { ls: 0.3, align: 'left' }), T('+91 00000 00000\nstudio@email.com', 0.07, 0.64, 0.52, 18, { align: 'left', lh: 1.4 })]]
  ];
  bc.forEach(([k, n, style, build]) => out.push({ k, n, cat: 'Business', size: 'bc', style, build }));
  /* Mood boards and collages */
  const mb = [
    ['mb-arches', 'Arch collage', 'sand', ({ T, F }) => [T('Mood board', 0.06, 0.03, 0.88, 40, { font: 'script' }), F(0.06, 0.12, 0.28, 0.4, { shape: 'arch' }), F(0.36, 0.12, 0.28, 0.4, { shape: 'arch' }), F(0.66, 0.12, 0.28, 0.4, { shape: 'arch' }), F(0.06, 0.55, 0.43, 0.38, { r: 8 }), F(0.51, 0.55, 0.43, 0.38, { r: 8 })]],
    ['mb-organic', 'Organic collage', 'peach', ({ T, F, G }) => [G('ab-blob2', 0.4, 0.4, 0.6, 0.5, { op: 0.3 }), F(0.06, 0.06, 0.5, 0.4, { shape: 'blob' }), F(0.5, 0.2, 0.44, 0.32, { shape: 'blob' }), F(0.1, 0.52, 0.4, 0.4, { shape: 'circle' }), F(0.54, 0.58, 0.38, 0.34, { r: 30 }), T('soft season', 0.06, 0.92, 0.88, 22, { font: 'hand' })]],
    ['mb-palette', 'Palette board', 'clean', ({ T, F, G }) => [T('Colour story', 0.06, 0.04, 0.88, 32, { head: 1, align: 'left' }), F(0.06, 0.11, 0.56, 0.5), F(0.64, 0.11, 0.3, 0.24), F(0.64, 0.37, 0.3, 0.24), ...['#e9d5c3', '#c89f7f', '#8c6a5d', '#4b3b36', '#a3b18a'].flatMap((c, i) => [G('circle', 0.06 + i * 0.18, 0.66, 0.14, 0.099, { col: c, keepCol: 1 }), T(c.toUpperCase(), 0.06 + i * 0.18, 0.77, 0.14, 9, { ls: 0.1 })]), T('Warm earth, linen and sage. Natural light, soft texture.', 0.06, 0.84, 0.88, 13, { ital: 1, align: 'left' })]],
    ['mb-scrap', 'Travel scrap page', 'kraft', ({ T, F, G }) => [F(0.06, 0.06, 0.52, 0.36, { pad: 7, pol: true, shadow: 0.6, rot: -3 }), G('tape2', 0.06, 0.04, 0.1, 0.04, { rot: -30, col: '#f6e7b4', keepCol: 1, op: 0.85 }), F(0.5, 0.36, 0.44, 0.3, { pad: 7, pol: true, shadow: 0.6, rot: 4 }), G('mappin', 0.8, 0.06, 0.08, 0.08, { col: '#c1121f', keepCol: 1 }), G('hd-arrow', 0.2, 0.46, 0.28, 0.2, { col: '#3b2a1a', keepCol: 1 }), T('Lisbon,\nwe love you', 0.06, 0.68, 0.5, 40, { font: 'hand', align: 'left', lh: 1.05 }), G('hd-heart', 0.6, 0.74, 0.12, 0.085, { col: '#c1121f', keepCol: 1 }), F(0.06, 0.82, 0.88, 0.14, { r: 4 })]],
    ['mb-grid', 'Editorial grid', 'swiss', ({ T, F, G, s }) => [F(0.06, 0.06, 0.58, 0.58), F(0.66, 0.06, 0.28, 0.28), F(0.66, 0.36, 0.28, 0.28), F(0.06, 0.66, 0.28, 0.28), F(0.36, 0.66, 0.28, 0.28), G('block', 0.66, 0.66, 0.28, 0.28, { col: s.accent }), T('ISSUE\n04', 0.68, 0.72, 0.24, 28, { font: 'display', col: '#ffffff', keepCol: 1, align: 'left', lh: 1 })]],
    ['mb-botanical', 'Botanical photo page', 'sage', ({ T, F, G }) => [G('b-fern', 0.74, 0.02, 0.24, 0.32, { rot: 20, op: 0.7 }), F(0.08, 0.08, 0.6, 0.5, { shape: 'arch' }), F(0.6, 0.42, 0.32, 0.32, { shape: 'circle', stroke: 6, strokeCol: '#ffffff' }), T('Garden days', 0.08, 0.66, 0.84, 46, { font: 'script', align: 'left' }), T('A slow afternoon among the ferns.', 0.08, 0.77, 0.84, 14, { ital: 1, align: 'left' })]]
  ];
  mb.forEach(([k, n, style, build]) => out.push({ k, n, cat: 'Photo albums', style, build }));
  /* Stationery */
  out.push(
    { k: 'st-botanical', n: 'Botanical letterhead', cat: 'Business', style: 'sage', build: ({ T, G }) => [G('b-sprig', 0.04, 0.02, 0.1, 0.17, { rot: -15 }), T('Your Name', 0.16, 0.04, 0.6, 32, { font: 'script', align: 'left' }), T('LANDSCAPE DESIGN STUDIO', 0.16, 0.1, 0.6, 10, { ls: 0.35, align: 'left' }), T('+91 00000 00000\nhello@studio.com\nstudio.com', 0.6, 0.04, 0.34, 9.5, { align: 'right', lh: 1.6 }), G('b-olive', 0.06, 0.92, 0.25, 0.04), G('block', 0.33, 0.94, 0.61, 0.0016, { op: 0.4 })] },
    { k: 'st-deco', n: 'Art deco letterhead', cat: 'Business', style: 'linen', build: ({ T, G }) => [G('or-fan', 0.42, 0.02, 0.16, 0.07), T('COMPANY NAME', 0.06, 0.1, 0.88, 22, { head: 1, ls: 0.4 }), G('or-divider', 0.3, 0.145, 0.4, 0.03, { sw: 0.8 }), T('Address line · City · +91 00000 00000 · company.com', 0.06, 0.95, 0.88, 9, { ls: 0.1 })] },
    { k: 'st-modern', n: 'Modern letterhead', cat: 'Business', style: 'swiss', build: ({ T, G, s }) => [G('block', 0, 0, 0.03, 0.2, { col: s.accent }), T('Company', 0.08, 0.04, 0.5, 30, { head: 1, bold: 1, align: 'left' }), T('Design & Build', 0.08, 0.1, 0.5, 12, { align: 'left' }), T('Street name 12\nKochi 682001\n+91 00000 00000\ncompany.com', 0.65, 0.04, 0.29, 9.5, { align: 'right', lh: 1.55 }), G('block', 0.08, 0.17, 0.86, 0.0016, { col: s.ink, op: 0.4 })] },
    { k: 'st-sea', n: 'Ship letterhead', cat: 'At sea', style: 'clean', build: ({ T, G }) => [G('block', 0, 0, 1, 0.1, { col: '#0b1f3a', keepCol: 1 }), G('mr-ship', 0.66, 0.025, 0.28, 0.08, { col: '#ffffff', keepCol: 1, op: 0.35 }), T('MV VESSEL NAME', 0.06, 0.025, 0.6, 20, { head: 1, bold: 1, align: 'left', col: '#ffffff', keepCol: 1, ls: 0.1 }), T('IMO 0000000 · Call sign XXXX · Flag ________', 0.06, 0.065, 0.6, 9, { align: 'left', col: '#ffffff', keepCol: 1 }), T('Ref: ________        Date: __ / __ / ____', 0.06, 0.13, 0.88, 10.5, { align: 'left' }), G('mr-waves', 0, 0.95, 1, 0.05, { col: '#0b1f3a', keepCol: 1, op: 0.25 })] },
    { k: 'st-notepad', n: 'Botanical notepad', cat: 'Planners', style: 'sage', build: ({ T, G, s }) => [G('b-corner', 0.68, 0, 0.32, 0.22, { rot: 90 }), T('Notes', 0.06, 0.05, 0.6, 46, { font: 'script', align: 'left' }), ...Array.from({ length: 22 }, (_, i) => G('block', 0.06, 0.16 + i * 0.036, 0.88, 0.0014, { col: s.ink, op: 0.2, keepCol: 1 }))] },
    { k: 'st-weekly', n: 'Boho weekly planner', cat: 'Planners', style: 'terra', build: ({ T, G, s }) => [G('ab-sun', 0.74, 0.02, 0.2, 0.1, { op: 0.8 }), T('Week ahead', 0.06, 0.03, 0.7, 40, { font: 'script', align: 'left' }), ...['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Weekend'].flatMap((d, i) => { const c = i % 2, r = Math.floor(i / 2); const x = 0.06 + c * 0.46, y = 0.13 + r * 0.27; return [G('fr-arch', x, y, 0.42, 0.25, { sw: 0.6, op: 0.6 }), T(d.toUpperCase(), x, y + 0.05, 0.42, 11, { ls: 0.3, bold: 1, col: s.accent, keepCol: 1 })]; })] }
  );
  /* Certificates */
  out.push(
    { k: 'ce-laurel', n: 'Laurel certificate', cat: 'Business', size: 'a4l', style: 'linen', build: ({ T, G }) => [G('fr-scallop', 0.03, 0.045, 0.94, 0.91, { sw: 1 }), G('b-laurel', 0.4, 0.08, 0.2, 0.2), G('star', 0.475, 0.14, 0.05, 0.07), T('CERTIFICATE', 0.1, 0.3, 0.8, 40, { head: 1, ls: 0.2 }), T('OF COMPLETION', 0.1, 0.41, 0.8, 13, { ls: 0.5 }), T('Recipient Name', 0.1, 0.5, 0.8, 46, { font: 'script' }), T('has successfully completed ________ on __ / __ / ____', 0.1, 0.66, 0.8, 13, { ital: 1 }), T('Signature', 0.12, 0.86, 0.25, 10, { ls: 0.3 }), T('Date', 0.63, 0.86, 0.25, 10, { ls: 0.3 }), G('block', 0.12, 0.84, 0.25, 0.002, { op: 0.6 }), G('block', 0.63, 0.84, 0.25, 0.002, { op: 0.6 })] },
    { k: 'ce-deco', n: 'Art deco certificate', cat: 'Business', size: 'a4l', style: 'noirgold', build: ({ T, G }) => [G('fr-deco', 0.03, 0.045, 0.94, 0.91, { sw: 1 }), G('or-fan', 0.4, 0.07, 0.2, 0.13), T('AWARD OF EXCELLENCE', 0.1, 0.25, 0.8, 32, { head: 1, ls: 0.25 }), G('or-divider', 0.3, 0.36, 0.4, 0.05, { sw: 0.8 }), T('Recipient Name', 0.1, 0.44, 0.8, 46, { font: 'script', col: '#c9a45c', keepCol: 1 }), T('For exceptional performance and leadership, 2027', 0.1, 0.6, 0.8, 13, { ital: 1 }), G('bd-rosette', 0.46, 0.7, 0.08, 0.16), T('Director', 0.12, 0.86, 0.25, 10, { ls: 0.3 }), T('Date', 0.63, 0.86, 0.25, 10, { ls: 0.3 })] },
    { k: 'ce-sea', n: 'Seamanship award', cat: 'At sea', size: 'a4l', style: 'voyage', build: ({ T, G }) => [G('mr-rope', 0.02, 0.03, 0.96, 0.94, { sw: 1, op: 0.5 }), G('mr-wheel', 0.44, 0.08, 0.12, 0.17, { sw: 1 }), T('Award for Seamanship', 0.1, 0.28, 0.8, 40, { font: 'script' }), T('PRESENTED TO', 0.1, 0.42, 0.8, 12, { ls: 0.5 }), T('Seafarer Name', 0.1, 0.48, 0.8, 36, { head: 1, bold: 1 }), T('For skill, care and good judgement on board MV ________, 2027', 0.15, 0.62, 0.7, 13, { ital: 1 }), T('Master', 0.15, 0.84, 0.25, 11, { ls: 0.3 }), T('Chief Engineer', 0.6, 0.84, 0.25, 11, { ls: 0.3 })] },
    { k: 'ce-kids', n: 'Kids rainbow certificate', cat: 'Kids', size: 'a4l', style: 'peach', build: ({ T, G }) => [G('ab-rainbow', 0.3, 0.06, 0.4, 0.25), G('ab-confetti', 0.03, 0.03, 0.25, 0.94, { op: 0.45 }), G('ab-confetti', 0.72, 0.03, 0.25, 0.94, { op: 0.45, rot: 180 }), T('Well done!', 0.1, 0.32, 0.8, 56, { font: 'script' }), T('THIS CERTIFICATE IS AWARDED TO', 0.1, 0.48, 0.8, 12, { ls: 0.3, bold: 1 }), T('Name', 0.1, 0.54, 0.8, 46, { head: 1, bold: 1 }), T('for amazing reading this term', 0.1, 0.7, 0.8, 16, { ital: 1 })] }
  );
  /* Menus */
  out.push(
    { k: 'mn-botanical', n: 'Botanical cafe menu', cat: 'Food', style: 'sage', build: ({ T, G }) => { const o = [G('b-wreath', 0.35, 0.02, 0.3, 0.212), T('Leaf & Bean', 0.06, 0.08, 0.88, 22, { head: 1, ital: 1 }), T('CAFE MENU', 0.06, 0.23, 0.88, 12, { ls: 0.5 })]; [['Coffee', [['Espresso', '120'], ['Flat white', '180'], ['Pour over', '220']]], ['Bakes', [['Banana bread', '140'], ['Almond croissant', '190']]], ['Plates', [['Avocado toast', '320'], ['Shakshuka', '360'], ['Kerala breakfast', '280']]]].forEach(([h, items], i) => { const y = 0.3 + i * 0.21; o.push(T(h, 0.12, y, 0.76, 22, { font: 'script', align: 'left' })); items.forEach(([a, p], j) => o.push(T(a, 0.12, y + 0.05 + j * 0.04, 0.6, 12.5, { align: 'left' }), T(p, 0.6, y + 0.05 + j * 0.04, 0.28, 12.5, { align: 'right' }))); }); o.push(G('b-olive', 0.3, 0.93, 0.4, 0.05)); return o; } },
    { k: 'mn-deco', n: 'Art deco bar menu', cat: 'Food', style: 'noirgold', build: ({ T, G }) => { const o = [G('fr-deco', 0.05, 0.03, 0.9, 0.94, { sw: 1 }), G('or-fan', 0.35, 0.06, 0.3, 0.13), T('COCKTAILS', 0.06, 0.21, 0.88, 32, { head: 1, ls: 0.3 }), G('or-divider', 0.3, 0.28, 0.4, 0.04, { sw: 0.8 })]; [['Old fashioned', 'Bourbon, bitters, orange', '650'], ['Negroni', 'Gin, Campari, vermouth', '620'], ['French 75', 'Gin, lemon, champagne', '700'], ['Spiced mule', 'Rum, ginger, lime', '580'], ['Coconut sour', 'Arrack, lime, coconut', '540']].forEach(([a, b, p], i) => { const y = 0.34 + i * 0.11; o.push(T(a.toUpperCase(), 0.14, y, 0.56, 14, { ls: 0.2, align: 'left' }), T(p, 0.7, y, 0.16, 14, { align: 'right', col: '#c9a45c', keepCol: 1 }), T(b, 0.14, y + 0.03, 0.72, 11, { ital: 1, align: 'left' })); }); return o; } },
    { k: 'mn-boho', n: 'Boho brunch menu', cat: 'Food', style: 'terra', build: ({ T, G }) => [G('ab-sun', 0.3, 0.02, 0.4, 0.2, { op: 0.8 }), T('Brunch', 0.06, 0.2, 0.88, 60, { font: 'script' }), T('SERVED 9 TO 2', 0.06, 0.3, 0.88, 12, { ls: 0.5 }), T('Buttermilk pancakes, berries, honey\n\nEggs Benedict, hollandaise, greens\n\nMasala omelette, toast, chutney\n\nGranola bowl, curd, seasonal fruit\n\nFresh juice of the day', 0.12, 0.38, 0.76, 15, { head: 1, ital: 1, lh: 1.45 }), G('ab-rainbow', 0.4, 0.86, 0.2, 0.08, { op: 0.6 })] },
    { k: 'mn-wine', n: 'Minimal wine list', cat: 'Food', style: 'clean', build: ({ T, G, s }) => { const o = [T('Wine', 0.08, 0.06, 0.84, 50, { head: 1, ital: 1, align: 'left' }), G('block', 0.08, 0.15, 0.84, 0.002, { col: s.ink, op: 0.6 })]; [['Sparkling', [['Prosecco, Veneto', '850 / 4,200']]], ['White', [['Sauvignon blanc, Nashik', '650 / 3,200'], ['Chardonnay, Burgundy', '1,200 / 6,000']]], ['Red', [['Shiraz, Nashik', '700 / 3,500'], ['Pinot noir, Otago', '1,400 / 7,000'], ['Rioja reserva', '1,100 / 5,500']]]].reduce((y, [h, items]) => { o.push(T(h.toUpperCase(), 0.08, y, 0.84, 11, { ls: 0.4, bold: 1, align: 'left' })); items.forEach(([a, p], j) => o.push(T(a, 0.08, y + 0.04 + j * 0.04, 0.55, 13, { align: 'left' }), T(p, 0.6, y + 0.04 + j * 0.04, 0.32, 12, { align: 'right' }))); return y + 0.06 + items.length * 0.04 + 0.04; }, 0.2); return o; } }
  );
  /* Invitations, aesthetic */
  const inv = [
    ['iv2-boho', 'Boho birthday', 'terra', ({ T, G }) => [G('ab-rainbow', 0.25, 0.06, 0.5, 0.2), T('Turning', 0.06, 0.28, 0.88, 30, { font: 'script' }), T('30', 0.06, 0.35, 0.88, 110, { head: 1 }), T('Join us for food, music and good company', 0.1, 0.56, 0.8, 13, { ital: 1, lh: 1.5 }), T('SATURDAY 6 MARCH · 7 PM\nTHE ROOFTOP, KOCHI', 0.06, 0.66, 0.88, 11, { ls: 0.3, lh: 1.8 }), T('RSVP to Meera · +91 00000 00000', 0.06, 0.84, 0.88, 10)]],
    ['iv2-babyshower', 'Botanical baby shower', 'sage', ({ T, G }) => [G('b-crescent', 0.2, 0.05, 0.6, 0.424), T('Oh baby', 0.2, 0.17, 0.6, 40, { font: 'script' }), T('A BABY SHOWER FOR', 0.06, 0.53, 0.88, 11, { ls: 0.4 }), T('Priya', 0.06, 0.57, 0.88, 40, { head: 1 }), T('Sunday 14 March · 11 AM\nHome of Anu, Kakkanad', 0.06, 0.68, 0.88, 13, { lh: 1.6 })]],
    ['iv2-gala', 'Deco anniversary', 'noirgold', ({ T, G }) => [G('fr-deco', 0.05, 0.035, 0.9, 0.93, { sw: 1 }), G('or-fan', 0.3, 0.07, 0.4, 0.14), T('25', 0.06, 0.24, 0.88, 110, { head: 1, col: '#c9a45c', keepCol: 1 }), T('YEARS TOGETHER', 0.06, 0.44, 0.88, 14, { ls: 0.5 }), T('Join us to celebrate\nRavi & Lakshmi', 0.06, 0.52, 0.88, 20, { head: 1, ital: 1, lh: 1.4 }), T('20 · 03 · 2027 · 7 PM', 0.06, 0.7, 0.88, 13, { ls: 0.3 })]],
    ['iv2-garden', 'Garden party', 'lavender', ({ T, G }) => [G('fl-cluster', 0.15, 0.04, 0.7, 0.38), T('Garden party', 0.06, 0.42, 0.88, 46, { font: 'script' }), T('Lemonade, cake and croquet on the lawn', 0.1, 0.54, 0.8, 13, { ital: 1, lh: 1.5 }), T('SUNDAY 2 MAY · 4 PM', 0.06, 0.64, 0.88, 12, { ls: 0.4 }), T('Rose Cottage, Munnar', 0.06, 0.69, 0.88, 13)]],
    ['iv2-dinner', 'Minimal dinner', 'swiss', ({ T, G, s }) => [T('Dinner\nat ours.', 0.08, 0.08, 0.84, 64, { head: 1, bold: 1, align: 'left', lh: 1 }), G('block', 0.08, 0.36, 0.2, 0.006, { col: s.accent }), T('Friday 12 March\n8 PM\n\n14 Marine Drive\nApartment 9B\n\nBring nothing but an appetite.', 0.08, 0.42, 0.84, 15, { align: 'left', lh: 1.5 })]],
    ['iv2-graduation', 'Graduation party', 'emerald', ({ T, G }) => [G('b-laurel', 0.25, 0.06, 0.5, 0.35), G('star', 0.47, 0.18, 0.06, 0.04), T('Class of 2027', 0.06, 0.45, 0.88, 40, { font: 'script' }), T('GRADUATION PARTY', 0.06, 0.55, 0.88, 13, { ls: 0.4 }), T('Celebrating Arjun\nSaturday 26 June · 6 PM', 0.06, 0.62, 0.88, 15, { head: 1, lh: 1.5 })]],
    ['iv2-housewarm', 'Boho housewarming', 'sand', ({ T, G }) => [G('ab-arch', 0.3, 0.05, 0.4, 0.3, { op: 0.35 }), G('b-palm', 0.55, 0.02, 0.35, 0.3, { op: 0.6 }), T('Home', 0.06, 0.3, 0.88, 64, { font: 'script' }), T('SWEET HOME', 0.06, 0.42, 0.88, 14, { ls: 0.5 }), T('Come see our new place\nSaturday 20 March · 6 PM\nFlat 4C, Palm Grove, Kochi', 0.06, 0.52, 0.88, 14, { lh: 1.6 })]],
    ['iv2-naming', 'Naming ceremony', 'blush', ({ T, G }) => [G('fl-blossom', 0.4, 0.06, 0.2, 0.14), T('Naming ceremony', 0.06, 0.24, 0.88, 36, { font: 'script' }), T('PLEASE JOIN US AS WE NAME OUR DAUGHTER', 0.1, 0.36, 0.8, 10, { ls: 0.25, lh: 1.5 }), T('Sunday 4 April · 10 AM\nOur home, Thrissur', 0.06, 0.46, 0.88, 14, { head: 1, lh: 1.6 }), G('b-olive', 0.3, 0.6, 0.4, 0.05)]]
  ];
  inv.forEach(([k, n, style, build]) => out.push({ k, n, cat: 'Invitations', size: 'inv57', style, build }));
  /* At sea, aesthetic */
  out.push(
    { k: 'sea3-welcome', n: 'Welcome on board poster', cat: 'At sea', style: 'voyage', build: ({ T, G }) => [G('mr-ship', 0.1, 0.12, 0.8, 0.235), G('mr-gulls', 0.6, 0.06, 0.25, 0.08), T('Welcome on board', 0.06, 0.4, 0.88, 44, { font: 'script' }), T('MV ____________', 0.06, 0.52, 0.88, 16, { ls: 0.4 }), T('We are glad you are here. Ask anyone, anytime.', 0.12, 0.6, 0.76, 14, { ital: 1, head: 1 }), G('mr-waves', 0, 0.85, 1, 0.15, { op: 0.4 })] },
    { k: 'sea3-quote', n: 'Sea quote poster', cat: 'At sea', style: 'sand', build: ({ T, G }) => [G('mr-light', 0.38, 0.06, 0.24, 0.32), T('Be a lighthouse,\nnot a storm.', 0.08, 0.45, 0.84, 34, { head: 1, ital: 1, lh: 1.3 }), G('mr-waves', 0, 0.84, 1, 0.16, { op: 0.35 })] },
    { k: 'sea3-safety', n: 'Safety first poster, deco', cat: 'At sea', style: 'cobalt', build: ({ T, G }) => [G('mr-wheel', 0.3, 0.06, 0.4, 0.283, { col: '#ffd23f', keepCol: 1, sw: 1.4 }), T('SAFETY', 0.06, 0.4, 0.88, 80, { font: 'display' }), T('IS NO ACCIDENT', 0.06, 0.53, 0.88, 26, { font: 'display', ls: 0.2, col: '#ffd23f', keepCol: 1 }), T('Stop. Think. Act. Review.', 0.06, 0.66, 0.88, 20, { head: 1 })] },
    { k: 'sea3-birthday', n: 'Crew birthday, nautical', cat: 'At sea', style: 'clean', build: ({ T, G, Fc }) => [G('mr-rope', 0.2, 0.04, 0.6, 0.424, { col: '#0b1f3a', keepCol: 1, sw: 1 }), Fc(0.5, 0.252, 0.36), T('Happy Birthday', 0.06, 0.52, 0.88, 46, { font: 'script', col: '#0b1f3a', keepCol: 1 }), T('NAME · RANK', 0.06, 0.63, 0.88, 14, { ls: 0.4 }), T('Cake in the mess at 1530', 0.06, 0.7, 0.88, 14, { ital: 1 }), G('mr-star', 0.12, 0.8, 0.08, 0.057, { col: '#ff7a59', keepCol: 1 }), G('mr-shell', 0.8, 0.8, 0.09, 0.064, { col: '#0b1f3a', keepCol: 1 })] }
  );
  out.push(
    { k: 'so2-cta', n: 'Carousel last slide', cat: 'Social', size: 'ig45', style: 'sage', build: ({ T, G }) => [G('b-laurel', 0.2, 0.12, 0.6, 0.38), T('Found this\nuseful?', 0.3, 0.24, 0.4, 22, { head: 1, ital: 1, lh: 1.2 }), T('Save it for later and share it with a friend who needs it.', 0.12, 0.6, 0.76, 16, { lh: 1.5 }), T('@yourhandle', 0.06, 0.8, 0.88, 18, { font: 'script' })] },
    { k: 'so2-thanks', n: 'Thank you post, floral', cat: 'Social', size: 'igsq', style: 'blush', build: ({ T, G }) => [G('fl-cluster', 0.05, 0.05, 0.4, 0.22), G('fl-cluster', 0.55, 0.73, 0.4, 0.22, { rot: 180 }), T('Thank you', 0.06, 0.34, 0.88, 64, { font: 'script' }), T('FOR 10,000 OF YOU', 0.06, 0.52, 0.88, 14, { ls: 0.5 })] },
    { k: 'pl2-gratitude', n: 'Botanical gratitude page', cat: 'Planners', style: 'sage', build: ({ T, G, s }) => [G('b-wreath', 0.38, 0.03, 0.24, 0.17), T('Today I am grateful for', 0.06, 0.22, 0.88, 24, { font: 'script' }), ...[0, 1, 2].flatMap((i) => [G('fl-blossom', 0.08, 0.3 + i * 0.1, 0.04, 0.028), G('block', 0.14, 0.33 + i * 0.1, 0.78, 0.0016, { col: s.ink, op: 0.3, keepCol: 1 })]), T('A small win', 0.06, 0.62, 0.88, 18, { head: 1, ital: 1, align: 'left' }), G('block', 0.06, 0.7, 0.88, 0.0016, { col: s.ink, op: 0.3, keepCol: 1 }), T('Tomorrow I will', 0.06, 0.76, 0.88, 18, { head: 1, ital: 1, align: 'left' }), G('block', 0.06, 0.84, 0.88, 0.0016, { col: s.ink, op: 0.3, keepCol: 1 })] },
    { k: 'pl2-habit', n: 'Boho habit tracker', cat: 'Planners', style: 'terra', build: ({ T, G, s }) => { const o = [G('ab-rainbow', 0.38, 0.02, 0.24, 0.1), T('Habits', 0.06, 0.12, 0.88, 40, { font: 'script' })]; ['Move', 'Read', 'Water', 'Sleep', 'Create', 'Rest'].forEach((h, r) => { o.push(T(h, 0.06, 0.25 + r * 0.11, 0.2, 16, { head: 1, ital: 1, align: 'left' })); for (let d = 0; d < 7; d++) o.push(G('ab-arch', 0.27 + d * 0.095, 0.24 + r * 0.11, 0.07, 0.06, { op: 0.25 })); }); return o; } }
  );
  return out;
})();

TEMPLATES.push(...TPL4);
{ const ORD = ['CVs', 'At sea', 'Quotes', 'Planners', 'School', 'College', 'Kids', 'Portfolio', 'Business', 'Social', 'Invitations', 'Wedding', 'Festivals', 'Events', 'Cards', 'Celebrations', 'Photo albums', 'Editorial', 'Food', 'Travel', 'Property', 'Slides']; TEMPLATES.sort((a, b) => ORD.indexOf(a.cat) - ORD.indexOf(b.cat)); }
const TMAP = Object.fromEntries(TEMPLATES.map((t) => [t.k, t]));
function buildTemplatePage(t, styleKey) { const pg = blankPage(styleKey || t.style); if (t.bg) pg.bg = clone(t.bg); pg.layout = null; pg.items = t.build(TB(pg)); pg.tplk = t.k; return pg; }
function pageIsBlank(pg) { return !pg.items.some((i) => (i.t === 'frame' && i.ph) || (!i.tpl && i.t !== 'frame') || (i.t === 'text' && i.orig && i.text !== i.orig)); }
function useTemplate(key) {
  const t = TMAP[key]; if (!t) return; const z = t.size && SIZES.find((x) => x[0] === t.size); let note = '';
  if (z && D.size !== t.size) { if (D.pages.length === 1 && pageIsBlank(cur())) { D.size = t.size; D.w = z[2] * PT; D.h = z[3] * PT; ST.fit = true; } else note = `. It is made for ${z[1]}: use New design to get that size`; }
  const pg = buildTemplatePage(t, null);
  if (pageIsBlank(cur())) { pg.id = cur().id; D.pages[D.cur] = pg; C.toast(`${t.n} on this page${note}`, { ms: note ? 5000 : 2600 }); }
  else { D.pages.splice(D.cur + 1, 0, pg); D.cur++; C.toast(`${t.n} added as a new page${note}`, { ms: note ? 5000 : 2600 }); }
  ST.sel = null; ST.ms = []; commit(); refreshAll();
}
function templateThumb(t, W = 120) {
  const keep = D; const z = t.size && SIZES.find((x) => x[0] === t.size); const d = { ...D, pages: [], spread: false, w: z ? z[2] * PT : keep.w, h: z ? z[3] * PT : keep.h }; D = d;
  const pg = buildTemplatePage(t, null); const c = document.createElement('canvas'); const k = W * 2 / D.w; c.width = Math.round(D.w * k); c.height = Math.round(D.h * k);
  const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); drawPage(x, pg, { k, ed: true, thumb: true }); D = keep; return c;
}

/* ---------- Left panels ---------- */
function layoutSvg(L) {
  const sp = !!L.spread; const W = sp ? 120 : 60, H = Math.round(60 * D.h / D.w); const m = 3, g = 2; let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  for (const c of L.cells) { const x = m + c[0] * (W - 2 * m) + g / 2, y = m + c[1] * (H - 2 * m) + g / 2, w = c[2] * (W - 2 * m) - g, h = c[3] * (H - 2 * m) - g; const sh = c[4]; const tf = c[5] ? ` transform="rotate(${c[5]} ${x + w / 2} ${y + h / 2})"` : ''; const fill = 'fill="var(--accent)" fill-opacity=".38"';
    if (sh === 'circle') s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" ${fill}/>`;
    else if (sh === 'arch') s += `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z" ${fill}/>`;
    else if (c[6]) s += `<g${tf}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="var(--sep-strong)" stroke-width=".5"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 6}" ${fill}/></g>`;
    else s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" ${fill}${tf}/>`; }
  if (sp) s += `<path d="M${W / 2} 0V${H}" stroke="var(--label-3)" stroke-width=".6" stroke-dasharray="2 1.5"/>`;
  for (const [role, r] of (L.texts || [])) { const x = m + r[0] * (W - 2 * m), y = m + r[1] * (H - 2 * m), w = r[2] * (W - 2 * m), h = Math.max(1.4, r[3] * (H - 2 * m) * 0.45); const big = role === 'cover' || role === 'title' || role === 'quote'; s += `<rect x="${x + w * (big ? 0.15 : 0.25)}" y="${y + r[3] * (H - 2 * m) * 0.3}" width="${w * (big ? 0.7 : 0.5)}" height="${big ? h : h * 0.6}" rx=".8" fill="${role === 'cover' || role === 'coversub' ? '#fff' : 'var(--label-2)'}" fill-opacity=".8"/>`; }
  return s + '</svg>';
}
function renderPanel() {
  if (!UI) return; markTabs(); const t = ST.tab; let h = `<div class="ds-close-sheet"><span>${TABS.find((x) => x[0] === t)[1]}</span><button data-act="closesheet">Done</button></div>`;
  if (t === 'templates') {
    const cats = ['all', ...new Set(TEMPLATES.map((x) => x.cat))];
    h += `<h3>Templates · ${TEMPLATES.length}</h3><p class="hint">Complete pages ready to fill. Tap one to use it on this page, or as a new page if this one already has work on it.</p>`;
    h += `<button class="ds-calcta" data-act="calendar">${ic('cal')}<span><b>Make a calendar</b><small>12 months with your photos, birthdays and port calls</small></span></button>`;
    h += `<div class="ds-chips">${cats.map((c) => `<button class="ds-chip" data-tc="${esc(c)}" aria-pressed="${ST.tcat === c}">${c === 'all' ? 'All' : esc(c)}</button>`).join('')}</div><div class="ds-tgrid">`;
    for (const x of TEMPLATES.filter((x) => ST.tcat === 'all' || x.cat === ST.tcat)) h += `<button class="ds-tcard" data-tplk="${x.k}" title="${esc(x.n)}"><span class="ds-tth" data-tth="${x.k}"></span><span>${esc(x.n)}</span></button>`;
    h += `</div>`;
  } else if (t === 'layouts') {
    const chips = [['all', 'All'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 to 6'], ['7', '7+'], ['txt', 'With text']];
    const fit = (L) => { const n = L.cells.length; const f = ST.lf; if (f === 'all') return true; if (f === 'txt') return !!(L.texts && L.texts.length); if (f === '5') return n === 5 || n === 6; if (f === '7') return n >= 7; return n === +f; };
    h += `<h3>Layouts</h3><p class="hint">Choose a layout for this page. Photos already on the page move into the new frames.</p><div class="ds-chips">${chips.map(([k, n]) => `<button class="ds-chip" data-lf="${k}" aria-pressed="${ST.lf === k}">${n}</button>`).join('')}</div>`;
    if (D.spread) { const ls = LAYOUTS.filter((L) => L.spread && fit(L)); if (ls.length) h += `<h3>Across both pages</h3><div class="ds-lgrid sp">${ls.map((L) => `<button class="ds-lcard" data-lay="${L.k}" aria-current="${D.pages[pairOf(D.cur)[0]].layout === L.k}" title="${esc(L.n)}">${layoutSvg(L)}<span>${esc(L.n)}</span></button>`).join('')}</div>`; }
    else h += `<p class="hint">Turn on Spreads under the pages strip for layouts that run across two facing pages.</p>`;
    for (const cat of ['Single', 'Grid', 'Collage', 'Story']) { const ls = LAYOUTS.filter((L) => L.cat === cat && fit(L)); if (!ls.length) continue; h += `<h3>${cat === 'Single' ? 'Single photo' : cat === 'Story' ? 'Story and creative' : cat}</h3><div class="ds-lgrid">${ls.map((L) => `<button class="ds-lcard" data-lay="${L.k}" aria-current="${cur().layout === L.k}" title="${esc(L.n)}">${layoutSvg(L)}<span>${esc(L.n)}</span></button>`).join('')}</div>`; }
  } else if (t === 'photos') {
    const u = usage(); const unused = D.photos.filter((id) => !u.has(id)).length;
    h += `<h3>Photos</h3><div class="ds-btns"><button class="ds-b pri" data-act="addphotos">${ic('plus')} Add photos</button><button class="ds-b" data-act="autofill" ${D.photos.length ? '' : 'disabled'}>${ic('magic')} Auto-fill</button></div>`;
    h += `<div class="ds-drop">Drop photos here or anywhere on the page.<br>Drag a photo into a frame, or tap it to fill the next empty frame.</div>`;
    if (D.photos.length) { h += `<p class="hint">${D.photos.length} photo${D.photos.length > 1 ? 's' : ''}${unused ? `, ${unused} not placed yet` : ', all placed'}. Drag a photo from a frame back here to take it out.</p><div class="ds-pgrid">${D.photos.map((id) => { const p = PH.get(id); if (!p) return ''; const n = u.get(id) || 0; return `<div class="ds-ph" data-ph="${id}" title="${esc(p.name)} · ${p.w} × ${p.h}"><img src="${p.url}" alt="" loading="lazy" draggable="false">${n ? `<span class="used">${n > 1 ? n : '✓'}</span>` : ''}<button class="x" data-phx="${id}" aria-label="Remove photo">${C.icon('close')}</button></div>`; }).join('')}</div>`; if (unused < D.photos.length) h += `<div class="ds-btns" style="margin-top:12px"><button class="ds-b" data-act="unused">${C.icon('trash')} Remove unused</button></div>`; }
  } else if (t === 'styles') {
    h += `<h3>Style presets</h3><p class="hint">One tap sets the background, frames, borders, fonts and photo look.</p><label class="ds-chk"><input type="checkbox" data-all ${ST.all ? 'checked' : ''}> Apply to all pages</label><div class="ds-sgrid">${STYLES.map((s) => { const bg = s.bg.t === 'grad' ? `linear-gradient(${s.bg.a}deg,${s.bg.c},${s.bg.c2})` : s.bg.c; const fr = `border-radius:${(s.r || 0) / 2}px;${s.pad ? `border:${s.pad / 2.4}px solid ${s.padCol};${s.pol ? `border-bottom-width:${s.pad * 1.2}px;` : ''}` : s.stroke ? `border:${Math.max(1, s.stroke / 2.4)}px solid ${s.strokeCol};` : ''}${s.shadow ? 'box-shadow:0 2px 6px rgba(0,0,0,.3);' : ''}${s.flt ? `filter:${FMAP[s.flt]};` : ''}`; return `<button class="ds-scard" data-style="${s.k}" aria-current="${cur().style === s.k}"><div class="ds-sprev" style="background:${bg}"><i style="${fr}"></i><i style="${fr}"></i><i style="${fr}"></i><b style="color:${s.ink};font-family:${esc(fontStack(s.head))}">Aa</b></div>${esc(s.n)}</button>`; }).join('')}</div>`;
  } else if (t === 'text') {
    const s = styleOf(cur()); const f = (k) => esc(fontStack(k));
    h += `<h3>Add text</h3><div class="ds-tp">
      <button data-tpre="heading" style="font:700 22px ${f(s.head)}">Add a heading</button>
      <button data-tpre="sub" style="font:600 13px ${f(s.body)};letter-spacing:.12em;text-transform:uppercase">Add a subheading</button>
      <button data-tpre="body" style="font:400 13px ${f(s.body)}">Add a paragraph of text</button>
      <button data-tpre="caption" style="font:italic 400 13px ${f(s.body)}">Add a caption</button>
      <button data-tpre="script" style="font:400 24px ${f('script')}">Script title</button>
      <button data-tpre="quote" style="font:italic 400 17px ${f(s.head)}">“A quote to remember”</button>
      <button data-tpre="date" style="font:400 13px ${f('type')}">${esc(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</button>
      <button data-tpre="label"><span style="background:${s.accent};color:${isDark(s.accent) ? '#fff' : '#111'};font:700 11px ${f(s.body)};letter-spacing:.15em;padding:3px 8px;border-radius:5px">LABEL</span></button>
      <button data-act="addcal">${ic('cal')} Add a month calendar</button></div>
      <p class="hint">Double-click any text on the page to type over it. Fonts and colours follow the page style until you change them.</p>`;
  } else if (t === 'gfx') {
    const cats = ['all', ...new Set(GFX.map((g) => g.cat))]; const list = GFX.filter((g) => ST.gfxCat === 'all' || g.cat === ST.gfxCat);
    h += `<h3>Graphics</h3><div class="ds-chips">${cats.map((c) => `<button class="ds-chip" data-gcat="${c}" aria-pressed="${ST.gfxCat === c}">${c === 'all' ? 'All' : c}</button>`).join('')}</div><div class="ds-ggrid">${list.map((g) => { const vb = g.ar >= 1 ? `0 ${50 - 50 / Math.min(g.ar, 3)} 100 ${100 / Math.min(g.ar, 3)}` : '0 0 100 100'; return `<button class="ds-g" data-gfx="${g.k}" title="${esc(g.n)}"><svg viewBox="${vb}" preserveAspectRatio="none" style="${g.ar >= 3 ? 'height:30%' : ''}"><path d="${g.d}" ${g.s ? 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:2px"' : `fill="currentColor" ${g.ev ? 'fill-rule="evenodd"' : ''} fill-opacity="${g.op}"`}/></svg></button>`; }).join('')}</div><h3>Stickers</h3><div class="ds-emo">${EMOJI.map((e) => `<button data-emo="${e}" aria-label="Sticker ${e}">${e}</button>`).join('')}</div>`;
  } else if (t === 'bg') {
    const bg = cur().bg;
    h += `<h3>Colour</h3><div class="ds-sw">${PALETTE.map((c) => `<button data-bgc="${c}" style="background:${c}" aria-label="${c}" aria-pressed="${bg.t === 'color' && bg.c === c}"></button>`).join('')}</div><div class="ds-row"><label>Custom</label><input type="color" data-bgp="c" value="${bg.c && /^#/.test(bg.c) ? bg.c : '#ffffff'}"></div>`;
    h += `<h3>Gradient</h3><div class="ds-gr">${GRADS.map(([a, b]) => `<button data-grad="${a},${b}" style="background:linear-gradient(135deg,${a},${b})" aria-label="Gradient"></button>`).join('')}</div>`;
    if (bg.t === 'grad') h += `<div class="ds-row"><label>Angle</label><input type="range" min="0" max="360" step="5" data-bgp="a" value="${bg.a ?? 135}"></div><div class="ds-row"><label>Colours</label><input type="color" data-bgp="c" value="${bg.c}"><input type="color" data-bgp="c2" value="${bg.c2}"></div>`;
    h += `<h3>Pattern</h3><div class="ds-pat">${PATTERNS.map(([k, n]) => `<button data-pat="${k}"><canvas data-patp="${k}" width="120" height="120"></canvas>${n}</button>`).join('')}</div>`;
    if (bg.t === 'pattern') h += `<div class="ds-row"><label>Colours</label><input type="color" data-bgp="c" value="${bg.c}"><input type="color" data-bgp="c2" value="${bg.c2}"></div><div class="ds-row"><label>Scale</label><input type="range" min="6" max="40" step="1" data-bgp="s" value="${bg.s || 14}"></div>`;
    h += `<h3>Photo background</h3>`;
    if (D.photos.length) h += `<div class="ds-pgrid">${D.photos.slice(0, 24).map((id) => { const p = PH.get(id); return p ? `<button class="ds-ph" data-bgph="${id}" style="border:0;padding:0"><img src="${p.url}" alt=""></button>` : ''; }).join('')}</div>`; else h += `<p class="hint">Add photos first, then use one as a full page background.</p>`;
    if (bg.t === 'photo') h += `<div class="ds-row"><label>Blur</label><input type="range" min="0" max="30" step="1" data-bgp="blur" value="${bg.blur || 0}"></div><div class="ds-row"><label>Darken</label><input type="range" min="-0.8" max="0.8" step="0.05" data-bgp="dim" value="${bg.dim || 0}"></div>`;
    h += `<div class="ds-btns" style="margin-top:14px"><button class="ds-b full" data-act="bgall">Use this background on all pages</button></div>`;
  }
  UI.panel.innerHTML = h;
  if (t === 'bg') for (const c of $$('[data-patp]', UI.panel)) { const x = c.getContext('2d'); const k = c.width / 60; x.scale(k, k); const b = cur().bg; drawBg(x, { t: 'pattern', p: c.dataset.patp, c: b.t === 'pattern' ? b.c : '#ffffff', c2: b.t === 'pattern' ? b.c2 : '#9aa7b8', s: 10 }, 0, 0, 60, 60, { k }); }
  if (t === 'templates') { const els = $$('[data-tth]', UI.panel); let i = 0; const step = () => { if (!UI || ST.tab !== 'templates') return; for (let n = 0; n < 4 && i < els.length; n++, i++) { const el = els[i]; if (!el.isConnected) continue; const cv = templateThumb(TMAP[el.dataset.tth]); el.appendChild(cv); } if (i < els.length) requestAnimationFrame(step); }; requestAnimationFrame(step); }
}

/* ---------- Right panel (inspector) ---------- */
const row = (label, inner) => `<div class="ds-row"><label>${label}</label>${inner}</div>`;
const rng2 = (p, v, min, max, step, kind = 'p') => `<input type="range" data-${kind}="${p}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val">${kind === 'p' ? fmtVal(p, v) : ''}</span>`;
const swatches = (p, curc) => `<div class="ds-sw">${PALETTE.map((c) => `<button data-col="${c}" data-colp="${p}" style="background:${c}" aria-label="${c}" aria-pressed="${curc === c}"></button>`).join('')}</div>`;
const arrange = (it) => `<h3>Arrange</h3><div class="ds-btns"><button class="ds-b" data-act="front">${C.icon('front')} Front</button><button class="ds-b" data-act="back">${C.icon('back')} Back</button><button class="ds-b" data-act="dup">${C.icon('dup')} Duplicate</button><button class="ds-b" data-act="lock">${it.lock ? ic('unlock') + ' Unlock' : C.icon('lock') + ' Lock'}</button><button class="ds-b danger" data-act="del">${C.icon('trash')} Delete</button></div><h3>Position on page</h3>${alignBtns()}`;
const alignBtns = () => `<div class="ds-abar">${[['l', 'al', 'Left'], ['c', 'ac', 'Centre'], ['r', 'ar', 'Right'], ['t', 'at', 'Top'], ['m', 'am', 'Middle'], ['b', 'ab', 'Bottom']].map(([k, i, n]) => `<button data-act="al-${k}" title="Align ${n.toLowerCase()}">${C.icon(i)}</button>`).join('')}</div>`;
function renderInsp() {
  if (!UI) return; const its = selItems(); const it = its.length === 1 ? its[0] : null; const pg = cur(); let h = '';
  if (isNarrow()) { UI.insp.hidden = !its.length; if (!its.length) { UI.insp.innerHTML = ''; return; } }
  const head = (t) => `<div class="ds-close-sheet"><span>${t}</span><button data-act="closeinsp">Done</button></div>`;
  if (its.length > 1) {
    const grouped = its.every((i) => i.grp && i.grp === its[0].grp); const locked = its.every((i) => i.lock);
    h += head(`${its.length} items`) + `<h3>${its.length} items selected</h3><p class="hint">Shift-click to add or remove items. Drag on an empty part of the page to select an area.</p>`;
    h += `<h3>Align</h3>${alignBtns()}<div class="ds-btns"><button class="ds-b" data-act="dist-h">${ic('disth')} Space across</button><button class="ds-b" data-act="dist-v">${ic('distv')} Space down</button></div>`;
    h += `<h3>Arrange</h3><div class="ds-btns"><button class="ds-b" data-act="${grouped ? 'ungroup' : 'group'}">${ic(grouped ? 'ungroup' : 'group')} ${grouped ? 'Ungroup' : 'Group'}</button><button class="ds-b" data-act="lock">${locked ? ic('unlock') + ' Unlock' : C.icon('lock') + ' Lock'}</button><button class="ds-b" data-act="front">${C.icon('front')} Front</button><button class="ds-b" data-act="back">${C.icon('back')} Back</button><button class="ds-b" data-act="dup">${C.icon('dup')} Duplicate</button><button class="ds-b danger" data-act="del">${C.icon('trash')} Delete</button></div>`;
    h += row('Opacity', `<input type="range" data-p="op" min="0.1" max="1" step="0.05" value="${its[0].op ?? 1}"><span class="val"></span>`);
    h += `<p class="hint">Copy with Ctrl+C and paste on any page with Ctrl+V.</p>`;
  } else if (!it) {
    const nFr = pg.items.filter((i) => i.t === 'frame').length, nPh = pg.items.filter((i) => i.t === 'frame' && i.ph).length;
    h += `<h3>Page ${D.cur + 1} of ${D.pages.length}</h3><p class="hint">${nFr ? `${nPh} of ${nFr} frame${nFr > 1 ? 's' : ''} filled. ` : ''}Drag the small handles between photos to resize the grid. Drag a photo onto another to swap them. Double-click a photo to pan and zoom it.</p>`;
    h += row('Spacing', `<input type="range" data-pp="gap" min="0" max="${Math.round(20 * PT)}" step="0.5" value="${pg.gap}"><span class="val">${Math.round(pg.gap / PT * 10) / 10} mm</span>`);
    h += row('Margin', `<input type="range" data-pp="margin" min="0" max="${Math.round(30 * PT)}" step="0.5" value="${pg.margin}"><span class="val">${Math.round(pg.margin / PT * 10) / 10} mm</span>`);
    h += `<div class="ds-btns"><button class="ds-b" data-act="spacingall">Same spacing on all pages</button></div>`;
    h += `<h3>Page</h3><div class="ds-btns"><button class="ds-b" data-act="addframe">${ic('plus')} Add frame</button><button class="ds-b" data-act="shuffle" ${nPh > 1 ? '' : 'disabled'}>${ic('shuffle')} Shuffle photos</button><button class="ds-b" data-act="clearph" ${nPh ? '' : 'disabled'}>Clear photos</button><button class="ds-b" data-act="autofill" ${D.photos.length ? '' : 'disabled'}>${ic('magic')} Auto-fill</button></div>`;
    h += `<label class="ds-chk"><input type="checkbox" data-dpi ${ST.dpi ? 'checked' : ''}> Warn about photos too small to print sharply</label>`;
    h += `<h3>Shortcuts</h3><p class="hint">Ctrl+Z undo · Ctrl+C, X and V copy, cut and paste · Ctrl+D duplicate · Ctrl+G group · Ctrl+L lock · Ctrl+A select all · Delete removes · arrows nudge (Shift for 10) · Enter edits · Page Up and Down change page.</p>`;
  } else if (it.t === 'frame') {
    h += head('Photo frame');
    if (it.ph && PH.get(it.ph.id)) {
      const p = PH.get(it.ph.id); const dpi = photoDpi(it); const q = dpi >= 250 ? ['good', 'Sharp in print'] : dpi >= 200 ? ['good', 'Good in print'] : dpi >= 150 ? ['meh', 'May look a little soft in print'] : ['bad', 'Will look blurry in print. Use a smaller frame or a larger photo'];
      h += `<h3>Photo</h3><div class="ds-q ${q[0]}">${ic(q[0] === 'good' ? 'chk' : 'warn')}<span><b>${dpi} dpi</b> · ${q[1]}</span></div><div class="ds-btns"><button class="ds-b${ST.adj === it.id ? ' on' : ''}" data-act="adjust">${ic('adjust')} Adjust position</button><button class="ds-b" data-act="flip">${C.icon('fliph')} Flip</button><button class="ds-b" data-act="replace">${C.icon('photo')} Replace</button><button class="ds-b danger" data-act="rmphoto">Remove</button></div>`;
      h += row('Zoom', `<input type="range" data-php="z" min="1" max="4" step="0.01" value="${it.ph.z || 1}">`);
      h += `<h3>Photo look</h3><div class="ds-flt">${FILTERS.map(([k, n, css]) => `<button data-flt="${k}" aria-pressed="${(it.ph.flt || 'none') === k}"><img src="${p.url}" style="filter:${css}" alt="">${n}</button>`).join('')}</div>`;
    } else h += `<h3>Empty frame</h3><p class="hint">Drag a photo here from Photos, drop a file on it, or choose one.</p><div class="ds-btns"><button class="ds-b pri" data-act="replace">${C.icon('photo')} Choose photo</button></div>`;
    h += `<h3>Shape</h3><div class="ds-shapes">${Object.entries(SHAPES).map(([k, v]) => `<button data-shape="${k}" aria-pressed="${(it.shape || 'rect') === k}" title="${v[0]}"><svg viewBox="-4 -4 108 108" fill="currentColor" fill-opacity=".45" stroke="currentColor" stroke-width="5">${k === 'rect' ? '<rect width="100" height="100" rx="6"/>' : k === 'circle' || k === 'oval' ? `<ellipse cx="50" cy="50" rx="50" ry="${k === 'circle' ? 50 : 34}"/>` : k === 'pill' ? '<rect y="20" width="100" height="60" rx="30"/>' : `<path d="${v[1]}"/>`}</svg></button>`).join('')}</div>`;
    if (!it.shape || it.shape === 'rect') h += row('Corners', rng2('r', it.r || 0, 0, 60, 0.5));
    h += `<h3>Border and print frame</h3>` + row('Border', rng2('stroke', it.stroke || 0, 0, 24, 0.5)) + row('Border colour', `<input type="color" data-p="strokeCol" value="${it.strokeCol || '#ffffff'}">`) + swatches('strokeCol', it.strokeCol);
    h += row('Mat', rng2('pad', it.pad || 0, 0, 40, 0.5)) + row('Mat colour', `<input type="color" data-p="padCol" value="${it.padCol || '#ffffff'}">`) + `<label class="ds-chk"><input type="checkbox" data-togc="pol" ${it.pol ? 'checked' : ''}> Instant print style (deeper bottom edge)</label>`;
    h += row('Shadow', rng2('shadow', it.shadow || 0, 0, 1, 0.05)) + row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1));
    h += `<div class="ds-btns"><button class="ds-b" data-act="framestyle" data-scope="page">Copy style to this page</button><button class="ds-b" data-act="framestyle" data-scope="all">Copy style to all pages</button></div>`;
    h += `<h3>Split</h3><div class="ds-btns"><button class="ds-b" data-act="splith">${ic('splith')} Side by side</button><button class="ds-b" data-act="splitv">${ic('splitv')} Stacked</button></div>` + arrange(it);
  } else if (it.t === 'text') {
    h += head('Text') + `<h3>Text</h3><textarea class="ds-ta2" data-p="text" spellcheck="true" lang="en">${esc(it.text)}</textarea>`;
    h += row('Font', `<select data-p="font">${Object.entries(FONTS).map(([k, v]) => `<option value="${k}" ${it.font === k ? 'selected' : ''} style="font-family:${esc(v[1])}">${v[0]}</option>`).join('')}</select>`);
    h += row('Size', rng2('size', it.size, 4, 160, 0.5));
    h += `<div class="ds-row"><label>Style</label><div class="ds-seg"><button data-tog="bold" aria-pressed="${!!it.bold}" title="Bold"><b>B</b></button><button data-tog="ital" aria-pressed="${!!it.ital}" title="Italic"><i>I</i></button><button data-tog="upper" aria-pressed="${!!it.upper}" title="Capitals">AA</button><button data-tog="shadow" aria-pressed="${!!it.shadow}" title="Shadow">S</button></div></div>`;
    h += `<div class="ds-row"><label>Align</label><div class="ds-seg">${[['left', 'tal'], ['center', 'tac'], ['right', 'tar']].map(([k, i]) => `<button data-align="${k}" aria-pressed="${it.align === k}">${C.icon(i)}</button>`).join('')}</div></div>`;
    h += row('Colour', `<input type="color" data-p="col" value="${it.col || '#000000'}">`) + swatches('col', it.col);
    h += row('Spacing', rng2('ls', it.ls || 0, -0.05, 0.6, 0.01)) + row('Line height', rng2('lh', it.lh || 1.2, 0.8, 2.4, 0.05));
    h += `<label class="ds-chk"><input type="checkbox" data-togc="bgc" ${it.bgc ? 'checked' : ''}> Highlight behind text</label>${it.bgc ? row('Highlight', `<input type="color" data-p="bgc" value="${it.bgc}">`) : ''}`;
    h += row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1));
    h += `<div class="ds-btns"><button class="ds-b" data-act="textstyle">Match similar text</button></div>` + arrange(it);
  } else if (it.t === 'cal') {
    const y0 = new Date().getFullYear();
    h += head('Calendar') + `<h3>Month</h3>` + row('Month', `<select data-p="month">${MONTHS.map((m, i) => `<option value="${i}" ${it.month === i ? 'selected' : ''}>${m}</option>`).join('')}</select>`) + row('Year', `<input type="number" data-p="year" value="${it.year}" min="${y0 - 50}" max="${y0 + 50}">`);
    h += `<div class="ds-row"><label>Week starts</label><div class="ds-seg"><button data-setv="ws:1" aria-pressed="${(it.ws ?? 1) === 1}">Monday</button><button data-setv="ws:0" aria-pressed="${it.ws === 0}">Sunday</button></div></div>`;
    h += `<div class="ds-row"><label>Look</label><div class="ds-seg"><button data-setv="style:grid" aria-pressed="${it.style === 'grid'}">Grid</button><button data-setv="style:lines" aria-pressed="${it.style === 'lines'}">Lines</button><button data-setv="style:minimal" aria-pressed="${it.style === 'minimal'}">Clean</button></div></div>`;
    h += `<div class="ds-row"><label>Title</label><div class="ds-seg"><button data-setv="align:left" aria-pressed="${it.align !== 'center' && it.head !== false}">Left</button><button data-setv="align:center" aria-pressed="${it.align === 'center' && it.head !== false}">Centre</button><button data-tog="head" aria-pressed="${it.head === false}">Hide</button></div></div>`;
    h += row('Title font', `<select data-p="font">${Object.entries(FONTS).map(([k, v]) => `<option value="${k}" ${it.font === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`) + row('Number font', `<select data-p="bfont">${Object.entries(FONTS).map(([k, v]) => `<option value="${k}" ${it.bfont === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`);
    h += row('Ink', `<input type="color" data-p="col" value="${it.col || '#1d1d1f'}">`) + row('Accent', `<input type="color" data-p="acc" value="${it.acc || '#c1121f'}">`) + swatches('acc', it.acc);
    h += `<h3>Dates</h3><p class="hint">${(D.events || []).length} birthday${(D.events || []).length === 1 ? '' : 's'} and dates marked across every month.</p><div class="ds-btns"><button class="ds-b pri" data-act="events">${ic('cal')} Birthdays and dates</button><button class="ds-b" data-act="calall">Same look on all months</button></div>` + arrange(it);
  } else {
    const G = GMAP[it.g];
    h += head(it.t === 'emoji' ? 'Sticker' : 'Graphic') + `<h3>${it.t === 'emoji' ? 'Sticker' : esc(G ? G.n : 'Graphic')}</h3>`;
    if (it.t === 'gfx') { h += row('Colour', `<input type="color" data-p="col" value="${it.col || '#000000'}">`) + swatches('col', it.col); if (G && G.s) h += row('Line weight', rng2('sw', it.sw || 2, 0.3, 14, 0.1)); }
    h += row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1)) + `<div class="ds-btns"><button class="ds-b" data-act="flip">${C.icon('fliph')} Flip</button></div>` + arrange(it);
  }
  UI.insp.innerHTML = h;
  for (const c of $$('[data-togc]', UI.insp)) c.addEventListener('change', () => { const t = selItem(); if (!t) return; const k = c.dataset.togc; if (k === 'bgc') t.bgc = c.checked ? (styleOf(cur()).accent || '#ffd23f') : null; else t[k] = c.checked; if (k === 'pol' && c.checked && !(t.pad > 0)) { t.pad = 7 * sc(); t.padCol = t.padCol || '#ffffff'; } commit(); renderInsp(); render(); });
}

/* ---------- Bottom page strip ---------- */
function renderPages() {
  if (!UI) return; const H = 64; const W = Math.round(H * D.w / D.h); let h = '';
  const btn = (i) => `<button class="ds-pg" data-pg="${i}"><canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px"></canvas>${i + 1}</button>`;
  if (D.spread) { let i = 0; while (i < D.pages.length) { const [l, r] = pairOf(i); h += `<div class="ds-spr${l === 0 && D.cover ? ' cover' : ''}">${btn(l)}${r != null ? btn(r) : ''}</div>`; i = (r != null ? r : l) + 1; } }
  else h = D.pages.map((p, i) => btn(i)).join('');
  UI.pages.innerHTML = `<div class="ds-pgscroll">${h}<button class="ds-pgadd" data-act="pgadd" title="Add a page with the same layout and style">${ic('plus')}</button></div><div class="ds-seg ds-spmode" title="Single pages or facing pages like an open book"><button data-act="single" aria-pressed="${!D.spread}">Pages</button><button data-act="spreads" aria-pressed="${D.spread}">${ic('book')} Spreads</button></div><div class="ds-pgact"><button data-act="pgl" title="Move page left">${ic('left')}</button><button data-act="pgr" title="Move page right">${ic('right')}</button><button data-act="pgdup" title="Duplicate page">${C.icon('dup')}</button><button data-act="pgdel" title="Delete page">${C.icon('trash')}</button></div>`;
  renderPagesMark(); thumbsNow();
}
function renderPagesMark() { if (!UI) return; const on = viewList().map((v) => v.i); for (const b of $$('.ds-pg', UI.pages)) b.setAttribute('aria-current', String(on.includes(+b.dataset.pg))); const l = $('[data-act="pgl"]', UI.pages), r = $('[data-act="pgr"]', UI.pages); if (l) l.disabled = !D.cur; if (r) r.disabled = D.cur >= D.pages.length - 1; }
let thT = 0;
function thumbsSoon() { clearTimeout(thT); thT = setTimeout(() => { if (!UI) return; if ($$('.ds-pg', UI.pages).length !== D.pages.length) renderPages(); else { thumbsNow(); renderPagesMark(); } }, 250); }
function thumbsNow() { if (!UI) return; for (const b of $$('.ds-pg', UI.pages)) { const pg = D.pages[+b.dataset.pg]; if (!pg) continue; const c = b.querySelector('canvas'); const x = c.getContext('2d'); const k = c.width / D.w; x.setTransform(k, 0, 0, k, 0, 0); x.save(); x.beginPath(); x.rect(0, 0, D.w, D.h); x.clip(); drawPage(x, pg, { k, ed: true, thumb: true }); x.restore(); } }

/* ---------- Menus and modals ---------- */
let menuEl = null;
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener('pointerdown', menuOut, true); } }
function menuOut(e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }
function menu(anchor, items) {
  closeMenu(); const m = document.createElement('div'); m.className = 'ds-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button role="menuitem" data-mi="${i}" ${it.cur ? 'aria-current="true"' : ''}>${it.cur ? C.icon('check') : '<span style="width:18px;flex:none"></span>'}${esc(it.label)}</button>`).join('');
  document.body.appendChild(m); const r = anchor.getBoundingClientRect(); const mw = m.offsetWidth; m.style.left = clamp(r.left, 8, innerWidth - mw - 8) + 'px'; m.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8)) + 'px';
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-mi]'); if (!b) return; const it = items[+b.dataset.mi]; closeMenu(); it.run(); });
  menuEl = m; setTimeout(() => document.addEventListener('pointerdown', menuOut, true), 0);
}
function sizeMenu(anchor) { menu(anchor, [{ label: 'Copy to another size…', run: () => openCopySize() }, '-', ...SIZES.map(([k, n, w, h]) => ({ label: `${n}  (${w} × ${h} mm)`, cur: D.size === k, run: () => { setSize(D, k, w * PT, h * PT, true); ST.fit = true; commit(); refreshAll(); } })), '-', { label: 'Custom size…', cur: D.size === 'custom', run: () => customSize((w, h) => { setSize(D, 'custom', w, h, true); ST.fit = true; commit(); refreshAll(); }) }]); }
// Resizes a design in place: frames keep their shape, layouts reflow, and grids turn sideways when the page changes from portrait to landscape.
function setSize(d, k, W, H, rearrange) {
  const keep = D; D = d; const sx = W / d.w, sy = H / d.h, s = Math.min(sx, sy), sg = Math.sqrt(sx * sy); const flip = rearrange && (d.w > d.h) !== (W > H) && Math.abs(W - H) > 1;
  for (const pg of d.pages) {
    const L = LMAP[pg.layout]; const canTurn = flip && L && !L.spread && !(L.texts && L.texts.length) && pg.items.every((i) => i.t !== 'frame' || (i.cell && !i.rot));
    for (const it of pg.items) {
      if (it.cell) { if (canTurn && it.t === 'frame') it.cell = [it.cell[1], it.cell[0], it.cell[3], it.cell[2]]; if (it.t === 'text') it.size = +(it.size * sg).toFixed(1); continue; }
      const h = it.h || 10; const cx = (it.x + it.w / 2) * sx, cy = (it.y + h / 2) * sy;
      if (it.t === 'text') { it.size = +(it.size * s).toFixed(1); it.w *= s; it.h = h * s; }
      else if (it.t === 'cal') { it.w *= sx; it.h *= sy; }
      else { it.w *= s; it.h = h * s; }
      it.x = cx - it.w / 2; it.y = cy - (it.h || 10) / 2;
    }
    pg.gap *= sg; pg.margin *= sg;
  }
  d.size = k; d.w = W; d.h = H; for (const pg of d.pages) reflow(pg); D = keep;
}
function customSize(done) {
  const m = modal(`<h2>Custom page size</h2><p class="sub">In millimetres. Frames and text scale to the new size.</p><div class="ds-row"><label>Width</label><input type="number" data-cw value="${Math.round(D.w / PT)}" min="30" max="2000"></div><div class="ds-row"><label>Height</label><input type="number" data-ch value="${Math.round(D.h / PT)}" min="30" max="2000"></div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Apply</button></div>`);
  m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-ok]').onclick = () => { const w = clamp(num(m.querySelector('[data-cw]').value), 30, 2000), h = clamp(num(m.querySelector('[data-ch]').value), 30, 2000); closeModal(); done(w * PT, h * PT); };
}
function moreMenu(anchor) {
  menu(anchor, [
    { label: 'All designs…', run: openLibrary }, { label: 'New design…', run: openNewDesign }, { label: 'Copy to another size…', run: openCopySize }, '-',
    { label: 'Make a calendar…', run: openCalendarMaker }, { label: 'Birthdays and dates…', run: openEvents }, '-',
    { label: 'Check before printing…', run: openCheck }, { label: 'Proofread all text…', run: openProof }, { label: 'Preview…', run: openPreview }, '-',
    { label: D.spread ? 'Show single pages' : 'Show facing pages (spreads)', run: () => setSpread(!D.spread) },
    { label: 'Save project file…', run: saveProject }, { label: 'Open project file…', run: () => $('[data-file="project"]').click() }, '-',
    { label: 'Fit page to screen', run: () => { ST.fit = true; paint(); } }, { label: 'Actual size', run: () => setZoom(96 / 72) }
  ]);
}
function modal(html, cls = '') { closeModal(); const m = document.createElement('div'); m.className = 'ds-modal'; m.innerHTML = `<div class="ds-mbox ${cls}" role="dialog" aria-modal="true">${html}</div>`; m.addEventListener('pointerdown', (e) => { if (e.target === m && !m.dataset.busy) closeModal(); }); document.body.appendChild(m); return m.firstElementChild; }
function closeModal() { const m = document.querySelector('.ds-modal'); if (m && !m.dataset.busy) { m.remove(); if (m._onclose) m._onclose(); } }
function confirmM(t, s, ok, run, danger) { const m = modal(`<h2>${esc(t)}</h2><p class="sub">${esc(s)}</p><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button></div>`); m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-ok]').onclick = () => { closeModal(); run(); }; }

/* ---------- Library of designs ---------- */
async function switchTo(fn) { endEdit(); exitAdjust(false); commit(); await saveNow(); await fn(); resetHist(); ST.fit = true; ST.tab = D.photos.length ? ST.tab : 'photos'; refreshAll(); }
async function openLibrary() {
  endEdit(); commit(); await saveNow(); const idx = await getIndex();
  const fmt = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const m = modal(`<div class="ds-libhead"><h2>Your designs</h2><button class="btn primary" data-new>${ic('plus')} New design</button></div><p class="sub">Albums, calendars, posters and slides are kept on this device and saved as you work.</p>
    <div class="ds-lib">${idx.map((e) => `<div class="ds-lcard2${e.id === D.id ? ' on' : ''}" data-id="${e.id}"><button class="ds-lth" data-open="${e.id}" style="aspect-ratio:${e.w}/${e.h}">${e.thumb ? `<img src="${e.thumb}" alt="">` : ''}</button><div class="ds-lrow"><div class="ds-lmeta"><b>${esc(e.name)}</b><small>${e.n} page${e.n > 1 ? 's' : ''} · ${esc(sizeLabel(e))}<br>${fmt(e.at)}</small></div><button class="ds-ldots" data-menu="${e.id}" aria-label="Design options">${C.icon('more')}</button></div></div>`).join('')}</div>`, 'wide');
  m.querySelector('[data-new]').onclick = () => { closeModal(); openNewDesign(); };
  m.addEventListener('click', async (e) => {
    const o = e.target.closest('[data-open]'); if (o) { const id = o.dataset.open; closeModal(); if (id !== D.id) await switchTo(async () => { await loadDoc(id); }); return; }
    const mb = e.target.closest('[data-menu]'); if (!mb) return; const id = mb.dataset.menu; const en = idx.find((x) => x.id === id);
    menu(mb, [
      { label: 'Open', run: async () => { closeModal(); if (id !== D.id) await switchTo(async () => { await loadDoc(id); }); } },
      { label: 'Rename…', run: () => { const nm = prompt('Name for this design', en.name); if (nm == null || !nm.trim()) return; (async () => { if (id === D.id) { D.name = nm.trim(); $('[data-a="name"]').value = D.name; await saveNow(); } else { const d = await idbGet('doc:' + id); d.name = nm.trim(); await idbPut('doc:' + id, d); const ix = await getIndex(); const r = ix.find((x) => x.id === id); if (r) r.name = d.name; await idbPut('index', ix); } openLibrary(); })(); } },
      { label: 'Duplicate', run: async () => { const d = id === D.id ? clone(D) : await idbGet('doc:' + id); if (!d) return; d.id = uidd('ds'); d.name = d.name + ' copy'; const keep = D; D = d; await saveNow(); D = keep; try { localStorage.setItem(lastKey, D.id); } catch (er) {} openLibrary(); C.toast('Duplicated'); } },
      { label: 'Copy to another size…', run: async () => { closeModal(); if (id !== D.id) await switchTo(async () => { await loadDoc(id); }); openCopySize(); } },
      '-', { label: 'Delete…', run: () => confirmM(`Delete “${en.name}”?`, 'The design is removed from this device. Photos used only by this design are removed too.', 'Delete', () => deleteDesign(id), true) }
    ]);
  });
}
async function deleteDesign(id) {
  const ix = await getIndex(); const en = ix.find((x) => x.id === id); const rest = ix.filter((x) => x.id !== id); await idbPut('index', rest); await idbDel('doc:' + id);
  for (const p of (en && en.photos) || []) if (!rest.some((x) => (x.photos || []).includes(p))) { await idbDel('ph:' + p); const ph = PH.get(p); if (ph && !(D.id !== id && D.photos.includes(p))) { URL.revokeObjectURL(ph.url); PH.delete(p); } }
  if (id === D.id) { if (rest.length) await loadDoc(rest[0].id); else { newDoc(); await saveNow(); } resetHist(); ST.fit = true; refreshAll(); }
  openLibrary(); C.toast('Design deleted');
}
function sizeGrid(sel) { return `<div class="ds-sizes">${SIZES.map(([k, n, w, h]) => { const r = 34 / Math.max(w, h); return `<button data-sz="${k}" aria-pressed="${sel === k}"><i style="width:${w * r}px;height:${h * r}px"></i><span>${esc(n)}</span></button>`; }).join('')}<button data-sz="custom" aria-pressed="${sel === 'custom'}"><i style="width:26px;height:26px;border-style:dashed"></i><span>Custom…</span></button></div>`; }
function openNewDesign() {
  const st = { size: D.size && D.size !== 'custom' ? D.size : 'a4p', start: 'album', tpl: null, w: D.w, h: D.h };
  const m = modal(`<h2>New design</h2><p class="sub">Your current design is saved and stays in Designs.</p>
    <div class="ds-row"><label>Name</label><input type="text" data-nm value="Photo album" style="flex:1;height:32px;border-radius:8px;border:0;background:var(--control);box-shadow:inset 0 0 0 .5px var(--sep-strong);padding:0 10px;color:var(--label)"></div>
    <div class="flabel ds-fl">Start with</div><div class="ds-opt" data-g="start"><button data-v="album">Photo album<small>A cover page, then add photos</small></button><button data-v="calendar">Calendar<small>12 months with photos and dates</small></button><button data-v="blank">Blank page<small>Start from nothing</small></button><button data-v="template">A template<small>Pick one below</small></button></div>
    <div data-tplbox hidden><div class="ds-tgrid small">${[...new Set(TEMPLATES.map((x) => x.cat))].map((c) => `<div class="ds-tgh">${esc(c)}</div>` + TEMPLATES.filter((x) => x.cat === c).map((x) => `<button class="ds-tcard" data-tk="${x.k}"><span class="ds-tname">${esc(x.n)}</span><small>${esc(x.size ? (SIZES.find((z) => z[0] === x.size) || [0, ''])[1] : 'Any size')}</small></button>`).join('')).join('')}</div></div>
    <div class="flabel ds-fl">Page size</div>${sizeGrid(st.size)}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Create</button></div>`, 'wide');
  const mark = () => { for (const b of m.querySelectorAll('[data-g="start"] [data-v]')) b.setAttribute('aria-pressed', String(b.dataset.v === st.start)); for (const b of m.querySelectorAll('[data-sz]')) b.setAttribute('aria-pressed', String(b.dataset.sz === st.size)); for (const b of m.querySelectorAll('[data-tk]')) b.setAttribute('aria-pressed', String(b.dataset.tk === st.tpl)); m.querySelector('[data-tplbox]').hidden = st.start !== 'template'; };
  m.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]'); if (v) { st.start = v.dataset.v; const nm = m.querySelector('[data-nm]'); if (['Photo album', 'Calendar', 'Untitled design'].includes(nm.value) || TEMPLATES.some((x) => x.n === nm.value)) nm.value = st.start === 'calendar' ? 'Calendar' : st.start === 'blank' ? 'Untitled design' : 'Photo album'; mark(); return; }
    const z = e.target.closest('[data-sz]'); if (z) { if (z.dataset.sz === 'custom') { const w = prompt('Width in mm', Math.round(st.w / PT)); const h = w && prompt('Height in mm', Math.round(st.h / PT)); if (!w || !h) return; st.w = clamp(num(w), 30, 2000) * PT; st.h = clamp(num(h), 30, 2000) * PT; } st.size = z.dataset.sz; mark(); return; }
    const tk = e.target.closest('[data-tk]'); if (tk) { st.tpl = tk.dataset.tk; const t = TMAP[st.tpl]; if (t.size) st.size = t.size; m.querySelector('[data-nm]').value = t.n; mark(); }
  });
  m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = async () => {
    if (st.start === 'template' && !st.tpl) { C.toast('Pick a template first'); return; }
    const name = m.querySelector('[data-nm]').value.trim() || 'Untitled design'; closeModal();
    await switchTo(async () => {
      newDoc(st.size, name, st.size === 'custom' ? st.w : undefined, st.size === 'custom' ? st.h : undefined); const pg = D.pages[0];
      if (st.start === 'blank') { pg.items = []; pg.layout = null; }
      if (st.start === 'template') { const t = TMAP[st.tpl]; const np = buildTemplatePage(t, null); np.id = pg.id; D.pages[0] = np; }
      if (st.start === 'calendar') { D.pages = []; buildCalendar({ m0: new Date().getMonth() + 1 > 11 ? 0 : new Date().getMonth() + 1, y0: new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(), n: 12, ws: 1, lay: D.w > D.h ? 'side' : 'top', cover: true, fill: false, style: 'clean' }); }
      await saveNow();
    });
    C.toast(`Created ${name}`); if (st.start === 'calendar') C.toast('Calendar ready. Add photos and fill it with Auto-fill');
  };
  mark();
}
function openCopySize() {
  let sel = D.w > D.h ? 'igsq' : 'a4l'; let cw = D.w, ch = D.h;
  const m = modal(`<h2>Copy to another size</h2><p class="sub">Makes a copy of “${esc(D.name)}” in a new size. The original stays as it is.</p>${sizeGrid(sel)}<label class="ds-chk"><input type="checkbox" data-re checked> Turn grids sideways when switching between portrait and landscape</label><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>${ic('resize')} Make copy</button></div>`, 'wide');
  const mark = () => { for (const b of m.querySelectorAll('[data-sz]')) b.setAttribute('aria-pressed', String(b.dataset.sz === sel)); };
  m.addEventListener('click', (e) => { const z = e.target.closest('[data-sz]'); if (!z) return; if (z.dataset.sz === 'custom') { const w = prompt('Width in mm', Math.round(D.w / PT)); const h = w && prompt('Height in mm', Math.round(D.h / PT)); if (!w || !h) return; cw = clamp(num(w), 30, 2000) * PT; ch = clamp(num(h), 30, 2000) * PT; } sel = z.dataset.sz; mark(); });
  m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = async () => {
    const z = SIZES.find((x) => x[0] === sel); const W = z ? z[2] * PT : cw, H = z ? z[3] * PT : ch; const re = m.querySelector('[data-re]').checked; closeModal();
    await switchTo(async () => { const d = clone(D); d.id = uidd('ds'); d.name = `${D.name} (${z ? z[1] : 'custom size'})`; for (const pg of d.pages) pg.id = uidd('p'); setSize(d, sel, W, H, re); D = d; await saveNow(); });
    C.toast(`Copy made at ${sizeLabel()}. The original is in Designs`);
  };
  mark();
}

/* ---------- Calendar maker and dates ---------- */
function buildCalendar(o) {
  const s = SMAP[o.style] || styleOf(D.pages[D.cur] || { style: 'clean' }); const pages = [];
  if (o.cover) { const pg = blankPage(s.k); applyLayout(pg, D.photos.length || o.fill ? 'cover' : 'title', []); const t = pg.items.find((i) => i.role === 'cover'); if (t) { t.text = 'Calendar'; t.orig = null; } const t2 = pg.items.find((i) => i.role === 'coversub'); if (t2) { const y1 = o.y0 + Math.floor((o.m0 + o.n - 1) / 12); t2.text = y1 > o.y0 ? `${o.y0} to ${y1}` : String(o.y0); t2.orig = null; } pages.push(pg); }
  const LAY = { top: [[0, 0, 1, 0.55], [0, 0.6, 1, 0.4]], side: [[0, 0, 0.52, 1], [0.56, 0, 0.44, 1]], strip: [[0, 0, 1, 0.3], [0, 0.35, 1, 0.65]], only: [null, [0, 0, 1, 1]] }[o.lay] || [[0, 0, 1, 0.55], [0, 0.6, 1, 0.4]];
  for (let k = 0; k < o.n; k++) {
    const mm = (o.m0 + k) % 12, yy = o.y0 + Math.floor((o.m0 + k) / 12); const pg = blankPage(s.k); const fs = frameStyle(pg);
    if (LAY[0]) pg.items.push({ t: 'frame', id: uidd('f'), cell: LAY[0], shape: 'rect', rot: 0, ...fs, op: 1, ph: null });
    pg.items.push({ t: 'cal', id: uidd('c'), cell: LAY[1], month: mm, year: yy, ws: o.ws, style: o.lay === 'only' ? 'grid' : 'grid', head: true, align: 'left', font: s.head, bfont: s.body, col: s.ink, acc: s.accent === s.ink ? '#c1121f' : s.accent, op: 1, rot: 0 });
    pg.layout = null; pages.push(pg);
  }
  for (const pg of pages) reflow(pg);
  if (o.fill) { const u = usage(); const pool = D.photos.filter((id) => !u.has(id)); const list = pool.length ? pool : D.photos.slice(); let i = 0; for (const pg of pages) for (const f of pg.items) if (f.t === 'frame' && !f.ph && list[i]) f.ph = newPh(list[i++], pg); }
  return pages;
}
function openCalendarMaker() {
  const now = new Date(); const st = { m0: now.getMonth() === 11 ? 0 : now.getMonth() + 1, y0: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), n: 12, ws: 1, lay: D.w > D.h ? 'side' : 'top', cover: true, fill: D.photos.length > 0, dest: 'new' };
  const m = modal(`<h2>Make a calendar</h2><p class="sub">One page per month with a photo, plus birthdays, sign-on dates and port calls marked on the days.</p>
    <div class="ds-row"><label>First month</label><select data-k="m0">${MONTHS.map((x, i) => `<option value="${i}" ${i === st.m0 ? 'selected' : ''}>${x}</option>`).join('')}</select><input type="number" data-k="y0" value="${st.y0}" style="max-width:90px"></div>
    <div class="ds-row"><label>Months</label><input type="number" data-k="n" value="12" min="1" max="24"></div>
    <div class="flabel ds-fl">Layout</div><div class="ds-opt" data-g="lay"><button data-v="top">Photo above<small>Classic wall calendar</small></button><button data-v="side">Photo beside<small>Best for landscape pages</small></button><button data-v="strip">Photo strip<small>Big grid to write in</small></button><button data-v="only">Calendar only<small>No photos</small></button></div>
    <div class="flabel ds-fl">Week starts on</div><div class="ds-opt" data-g="ws"><button data-v="1">Monday</button><button data-v="0">Sunday</button></div>
    <label class="ds-chk"><input type="checkbox" data-c="cover" checked> Add a cover page</label><label class="ds-chk"><input type="checkbox" data-c="fill" ${st.fill ? 'checked' : ''} ${D.photos.length ? '' : 'disabled'}> Fill with my photos${D.photos.length ? '' : ' (add photos first)'}</label>
    <div class="flabel ds-fl">Where</div><div class="ds-opt" data-g="dest"><button data-v="new">New calendar design<small>Keeps this design as it is</small></button><button data-v="add">Add to this design<small>After the current page</small></button></div>
    <div class="acts"><button class="btn" data-ev>${ic('cal')} Birthdays and dates</button><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Make calendar</button></div>`, 'wide');
  const mark = () => { for (const g of m.querySelectorAll('[data-g]')) for (const b of g.querySelectorAll('[data-v]')) b.setAttribute('aria-pressed', String(String(st[g.dataset.g]) === b.dataset.v)); };
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; const g = b.closest('[data-g]').dataset.g; st[g] = g === 'ws' ? +b.dataset.v : b.dataset.v; mark(); });
  m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-ev]').onclick = () => openEvents(() => openCalendarMaker());
  m.querySelector('[data-ok]').onclick = async () => {
    st.m0 = +m.querySelector('[data-k="m0"]').value; st.y0 = Math.round(num(m.querySelector('[data-k="y0"]').value)) || now.getFullYear(); st.n = clamp(Math.round(num(m.querySelector('[data-k="n"]').value)) || 12, 1, 24); st.cover = m.querySelector('[data-c="cover"]').checked; st.fill = m.querySelector('[data-c="fill"]').checked; st.style = cur().style; closeModal();
    if (st.dest === 'add') { const pages = buildCalendar(st); D.pages.splice(D.cur + 1, 0, ...pages); D.cur++; commit(); refreshAll(); C.toast(`Added ${st.n} month${st.n > 1 ? 's' : ''}`); return; }
    const photos = D.photos.slice(); const events = clone(D.events || []); const size = D.size, w = D.w, h = D.h;
    await switchTo(async () => { newDoc(size, `Calendar ${st.y0}`, w, h); D.photos = photos; D.events = events; D.pages = buildCalendar(st); await saveNow(); });
    C.toast(`Calendar ready: ${st.n} month${st.n > 1 ? 's' : ''}${st.fill ? ' with your photos' : ''}`);
  };
  mark();
}
function openEvents(after) {
  const list = clone(D.events || []); const y0 = new Date().getFullYear();
  const rowH = (e, i) => `<div class="ds-evrow" data-i="${i}"><input type="date" data-f="date" value="${e.y != null ? e.y : y0}-${String(e.m + 1).padStart(2, '0')}-${String(e.d).padStart(2, '0')}"><input type="text" data-f="label" value="${esc(e.label)}" placeholder="Birthday, sign on, port call…"><label title="Repeat every year"><input type="checkbox" data-f="yearly" ${e.y == null ? 'checked' : ''}> Yearly</label><button class="tbtn" data-del="${i}" aria-label="Remove">${C.icon('trash')}</button></div>`;
  const m = modal(`<h2>Birthdays and dates</h2><p class="sub">Shown on every calendar in this design. Yearly dates repeat, such as birthdays and anniversaries.</p><div class="ds-evs"></div><div class="ds-btns"><button class="ds-b" data-add>${ic('plus')} Add a date</button></div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`, 'wide');
  const box = m.querySelector('.ds-evs');
  const draw = () => { box.innerHTML = list.length ? list.map(rowH).join('') : '<p class="sub" style="margin:4px 0">No dates yet.</p>'; };
  const read = () => { for (const r of box.querySelectorAll('.ds-evrow')) { const e = list[+r.dataset.i]; const v = r.querySelector('[data-f="date"]').value; if (v) { const [Y, M, Dd] = v.split('-').map(Number); e.m = M - 1; e.d = Dd; e.y = r.querySelector('[data-f="yearly"]').checked ? null : Y; } e.label = r.querySelector('[data-f="label"]').value.trim(); } };
  m.addEventListener('click', (e) => { if (e.target.closest('[data-add]')) { read(); const t = new Date(); list.push({ m: t.getMonth(), d: t.getDate(), y: null, label: '' }); draw(); const ins = box.querySelectorAll('[data-f="label"]'); if (ins.length) ins[ins.length - 1].focus(); return; } const d = e.target.closest('[data-del]'); if (d) { read(); list.splice(+d.dataset.del, 1); draw(); } });
  m.querySelector('[data-x]').onclick = () => { closeModal(); if (after) after(); };
  m.querySelector('[data-ok]').onclick = () => { read(); D.events = list.filter((e) => e.label); closeModal(); commit(); render(); renderInsp(); C.toast(`${D.events.length} date${D.events.length === 1 ? '' : 's'} on the calendar`); if (after) after(); };
  draw();
}

/* ---------- Auto-fill ---------- */
function openAutofill() {
  const u = usage(); const unused = D.photos.filter((id) => !u.has(id)); const pool = unused.length ? unused : D.photos.slice();
  const m = modal(`<h2>Auto-fill</h2><p class="sub">${unused.length ? `${unused.length} photo${unused.length > 1 ? 's are' : ' is'} not placed yet.` : 'Every photo is placed. Auto-fill will place them all again.'} Empty frames are filled first, then new pages are added in the current style.</p>
    <div class="flabel ds-fl">New pages use</div>
    <div class="ds-opt" data-g="mode"><button data-v="mix" aria-pressed="true">Mixed layouts<small>Varied collages, like a real album</small></button><button data-v="same" aria-pressed="false">This page's layout<small>${esc((LMAP[cur().layout] || { n: 'Grid of four' }).n)}</small></button></div>
    <label class="ds-chk"><input type="checkbox" data-sort checked> Keep landscape photos in wide frames where possible</label>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Place ${pool.length} photo${pool.length > 1 ? 's' : ''}</button></div>`);
  let mode = 'mix';
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) { mode = b.dataset.v; for (const x of m.querySelectorAll('[data-v]')) x.setAttribute('aria-pressed', String(x === b)); } });
  m.querySelector('[data-x]').onclick = closeModal;
  m.querySelector('[data-ok]').onclick = () => { const sort = m.querySelector('[data-sort]').checked; closeModal(); autofill(pool, mode, sort); };
}
function autofill(pool, mode, sort) {
  const queue = pool.slice(); let placed = 0, pagesAdded = 0;
  const fill = (pg) => { const empties = pg.items.filter((i) => i.t === 'frame' && !i.ph); if (sort) empties.sort((a, b) => (b.w / b.h) - (a.w / a.h)); const take = queue.splice(0, empties.length); if (sort) take.sort((a, b) => (PH.get(b).w / PH.get(b).h) - (PH.get(a).w / PH.get(a).h)); empties.forEach((f, i) => { if (take[i]) { f.ph = newPh(take[i], pg); placed++; } }); };
  for (let i = D.cur; i < D.pages.length && queue.length; i++) fill(D.pages[i]);
  const base = cur(); let at = D.pages.length; let mi = 0; const fs = frameStyle(base);
  while (queue.length) {
    let key = mode === 'same' && base.layout && LMAP[base.layout] && LMAP[base.layout].cells.length > 0 && !LMAP[base.layout].spread ? base.layout : null;
    if (!key) { const rem = queue.length; let tries = 0; do { key = MIX[mi++ % MIX.length]; tries++; } while (LMAP[key].cells.length > rem && tries < MIX.length); if (LMAP[key].cells.length > rem) key = rem === 1 ? 'one' : rem === 2 ? '2h' : rem === 3 ? 'l2r' : rem === 4 ? '4g' : 'm5'; }
    const n = blankPage(base.style, base); if (n.margin === 0) { const s = styleOf(base); n.margin = s.margin; n.gap = s.gap; } D.pages.splice(at++, 0, n); applyLayout(n, key, []); for (const f of n.items) if (f.t === 'frame' && !f.pol) Object.assign(f, fs);
    fill(n); pagesAdded++; if (pagesAdded > 400) break;
  }
  commit(); refreshAll(); C.toast(`Placed ${placed} photo${placed === 1 ? '' : 's'}${pagesAdded ? ` and added ${pagesAdded} page${pagesAdded > 1 ? 's' : ''}` : ''}`);
}

/* ---------- Project files ---------- */
async function saveProject() {
  const t = C.toast('Packing project', { spin: true, sticky: true });
  const photos = []; for (const id of D.photos) { const p = PH.get(id); if (!p) continue; photos.push({ id, name: p.name, data: await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(p.blob); }) }); }
  const blob = new Blob([JSON.stringify({ kind: 'pdfmate-design', v: 2, doc: D, photos })], { type: 'application/json' }); t.remove();
  C.downloadBlob(blob, (D.name || 'Design').replace(/[\\/:*?"<>|]/g, '') + '.pdfmate-design.json'); C.toast('Project saved. Open it here later to keep editing');
}
async function openProject(file) {
  try {
    const o = JSON.parse(await file.text()); if (o.kind !== 'pdfmate-design' || !o.doc) throw new Error('kind');
    const t = C.toast('Opening project', { spin: true, sticky: true });
    await switchTo(async () => {
      for (const p of o.photos || []) { if (!PH.has(p.id)) { const blob = await (await fetch(p.data)).blob(); await loadPhoto({ id: p.id, name: p.name, blob }); } idbPut('ph:' + p.id, { id: p.id, name: p.name, blob: PH.get(p.id).blob }); }
      D = Object.assign(makeDoc(), o.doc); D.id = uidd('ds'); D.photos = (D.photos || []).filter((id) => PH.has(id)); D.cur = 0; await saveNow();
    });
    t.remove(); C.toast(`Opened ${D.name}`);
  } catch (e) { C.toast('That file is not a PDF Mate design project', { err: true }); }
}

/* ---------- Check before printing, and proofreading ---------- */
const PLACEHOLDER = /\bName\b|Your title|Add a |Write a|Subject of|Presentation title|Presenter|Slide heading|First point|A short line|Place · date|Baby name|Anna & Rahul|Tell the story|Notes from the visit|What happened today|Summer memories|Born 12 March|LISBON|caption/i;
function issues() {
  const out = []; const ph = new Set(Object.values(TROLE).map((r) => r.text)); const safe = 4 * PT;
  D.pages.forEach((pg, i) => {
    const p = partner(i); const minX = p && p.dx < 0 ? -D.w : 0, maxX = p && p.dx > 0 ? 2 * D.w : D.w;
    if (!pg.items.length && pg.bg.t === 'color') out.push({ lv: 1, i, msg: 'Blank page' });
    for (const it of pg.items) {
      const b = aabb(it);
      if (it.t === 'frame' && !it.ph) out.push({ lv: 1, i, id: it.id, msg: 'Empty frame. It is left out of the export' });
      if (it.t === 'frame' && it.ph) { const d = photoDpi(it); if (d != null && d < 150) out.push({ lv: 2, i, id: it.id, msg: `Photo will look blurry in print (${d} dpi). Make the frame smaller or use a larger photo` }); else if (d != null && d < 200) out.push({ lv: 1, i, id: it.id, msg: `Photo may look a little soft in print (${d} dpi)` }); }
      if (it.t === 'text') {
        const first = `“${it.text.split('\n')[0].slice(0, 40)}”`;
        if (/_{3,}/.test(it.text)) out.push({ lv: 2, i, id: it.id, msg: `Blank left to fill in: ${first}` });
        else if (((it.orig && it.text === it.orig) || ph.has(it.text)) && PLACEHOLDER.test(it.text)) out.push({ lv: 1, i, id: it.id, msg: `Sample text not changed: ${first}` });
        if (it.size < 6) out.push({ lv: 1, i, id: it.id, msg: `Text is very small (${Math.round(it.size * 10) / 10} pt) and may be hard to read` });
        if (!String(it.text).trim()) out.push({ lv: 1, i, id: it.id, msg: 'Empty text box' });
        else if (b.x >= minX && b.x + b.w <= maxX && (b.x < safe && minX === 0 || b.y < safe || b.y + b.h > D.h - safe || (b.x + b.w > D.w - safe && maxX === D.w))) out.push({ lv: 0, i, id: it.id, msg: 'Text is close to the edge and could be trimmed by a print shop' });
      }
      if (b.x + b.w < minX + 1 || b.x > maxX - 1 || b.y + b.h < 1 || b.y > D.h - 1) out.push({ lv: 1, i, id: it.id, msg: 'Item is outside the page and will not show' });
      else if (it.t !== 'frame' && (b.x < minX - 1 || b.x + b.w > maxX + 1 || b.y < -1 || b.y + b.h > D.h + 1)) out.push({ lv: 1, i, id: it.id, msg: 'Runs off the edge of the page' });
    }
  });
  return out;
}
function openCheck(fromExport) {
  endEdit(); const list = issues(); const n2 = list.filter((x) => x.lv === 2).length, n1 = list.filter((x) => x.lv === 1).length;
  const head = !list.length ? 'Ready to print' : n2 ? `${n2} thing${n2 > 1 ? 's' : ''} to fix` + (n1 ? `, ${n1} to check` : '') : `${list.length} thing${list.length > 1 ? 's' : ''} to check`;
  const m = modal(`<div class="ds-chkhead ${n2 ? 'bad' : list.length ? 'meh' : 'good'}">${ic(list.length ? 'warn' : 'chk')}<div><h2>${head}</h2><p class="sub" style="margin:0">${list.length ? 'Tap Show to jump to each one.' : 'No empty frames, blurry photos or leftover placeholder text.'}</p></div></div>
    ${list.length ? `<div class="ds-issues">${list.map((x, k) => `<div class="ds-issue lv${x.lv}"><i></i><span><b>Page ${x.i + 1}</b> ${esc(x.msg)}</span>${x.id || x.i != null ? `<button class="ds-b" data-show="${k}">Show</button>` : ''}</div>`).join('')}</div>` : ''}
    <p class="sub" style="margin-top:12px">Spelling: open Proofread to see every piece of text in one list with spelling mistakes underlined.</p>
    <div class="acts"><button class="btn" data-proof>Proofread text</button>${fromExport ? '<button class="btn" data-back>Back to export</button>' : ''}<button class="btn primary" data-x>Done</button></div>`, 'wide');
  m.addEventListener('click', (e) => { const s = e.target.closest('[data-show]'); if (!s) return; const x = list[+s.dataset.show]; closeModal(); goPage(x.i); if (x.id) { ST.sel = x.id; ST.ms = []; showInsp(); render(); } });
  m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-proof]').onclick = () => openProof();
  const bk = m.querySelector('[data-back]'); if (bk) bk.onclick = () => openExport();
}
function openProof() {
  const rows = []; D.pages.forEach((pg, i) => pg.items.forEach((it) => { if (it.t === 'text') rows.push({ i, it }); }));
  const m = modal(`<h2>Proofread</h2><p class="sub">Every piece of text in the design. Spelling mistakes are underlined. Fix them here and they change on the page.</p><div class="ds-proof">${rows.length ? rows.map((r, k) => `<label><span>Page ${r.i + 1}</span><textarea data-k="${k}" spellcheck="true" lang="en" rows="${Math.min(5, String(r.it.text).split('\n').length + 1)}">${esc(r.it.text)}</textarea></label>`).join('') : '<p class="sub">There is no text in this design yet.</p>'}</div><div class="acts"><button class="btn primary" data-x>Done</button></div>`, 'wide');
  m.addEventListener('input', (e) => { const t = e.target.closest('[data-k]'); if (!t) return; rows[+t.dataset.k].it.text = t.value; render(); });
  m.parentElement._onclose = () => { commit(); render(); thumbsSoon(); };
  m.querySelector('[data-x]').onclick = closeModal;
  setTimeout(() => { const f = m.querySelector('textarea'); if (f) { f.focus(); f.blur(); } }, 50);
}

/* ---------- Preview: book with page turns, or slideshow ---------- */
let PV = null;
function closePreview() { if (!PV) return; clearInterval(PV.timer); document.removeEventListener('keydown', PV.key, true); PV.el.remove(); PV = null; }
function openPreview(mode) {
  endEdit(); exitAdjust(true); closePreview();
  const el = document.createElement('div'); el.className = 'ds-pv'; document.body.appendChild(el);
  PV = { el, mode: mode || (D.pages.length > 1 && !isNarrow() ? 'book' : 'slides'), cache: new Map(), s: 0, i: D.cur, busy: false, timer: 0, play: false };
  el.innerHTML = `<div class="ds-pvbar"><div class="ds-seg"><button data-pm="book">${ic('book')} Book</button><button data-pm="slides">${ic('play')} Slideshow</button></div><span class="ds-pvn"></span><span class="ds-sp"></span><button class="ds-pvb" data-pv="play">${ic('play')} Play</button><button class="ds-pvb" data-pv="close">${C.icon('close')} Close</button></div><div class="ds-pvstage"></div><button class="ds-pvnav l" data-pv="prev" aria-label="Previous">${ic('left')}</button><button class="ds-pvnav r" data-pv="next" aria-label="Next">${ic('right')}</button>`;
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-pm],[data-pv]'); if (!b) return; if (b.dataset.pm) { PV.mode = b.dataset.pm; pvRender(); } else if (b.dataset.pv === 'close') closePreview(); else if (b.dataset.pv === 'prev') pvStep(-1); else if (b.dataset.pv === 'next') pvStep(1); else if (b.dataset.pv === 'play') pvPlay(!PV.play); });
  let sx = null; el.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) sx = e.clientX; }); el.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 40) pvStep(dx < 0 ? 1 : -1); else if (!e.target.closest('button')) pvStep(e.clientX > innerWidth / 2 ? 1 : -1); });
  PV.key = (e) => { if (!PV) return; e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); closePreview(); } else if (e.key === 'ArrowRight' || e.key === 'PageDown') pvStep(1); else if (e.key === 'ArrowLeft' || e.key === 'PageUp') pvStep(-1); else if (e.key === ' ') { e.preventDefault(); pvPlay(!PV.play); } };
  document.addEventListener('keydown', PV.key, true);
  const sp = spreadsList(); PV.s = Math.max(0, sp.findIndex((p) => p.includes(D.cur)));
  pvRender();
}
function spreadsList() { const n = D.pages.length; const out = [[null, 0]]; for (let i = 1; i < n; i += 2) out.push([i, i + 1 < n ? i + 1 : null]); return out; }
function pvSize() { const vw = innerWidth - (isNarrow() ? 24 : 160), vh = innerHeight - 120; const two = PV.mode === 'book'; const ph = Math.min(vh, vw / (two ? 2 : 1) * D.h / D.w); return { ph, pw: ph * D.w / D.h }; }
function pvImg(i) {
  if (i == null || i >= D.pages.length) return null; if (PV.cache.has(i)) return PV.cache.get(i);
  const { pw, ph } = pvSize(); const dpr = Math.min(2, devicePixelRatio || 1); const k = Math.min(1800 / Math.max(pw, ph), dpr) * pw / D.w; const c = document.createElement('canvas'); c.width = Math.round(D.w * k); c.height = Math.round(D.h * k); const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); drawPage(x, D.pages[i], { k }); const u = c.toDataURL('image/jpeg', 0.88); PV.cache.set(i, u); return u;
}
const pvFace = (i, cls = '') => { const u = pvImg(i); return `<div class="ds-pvpage ${cls}${u ? '' : ' empty'}">${u ? `<img src="${u}" alt="">` : ''}</div>`; };
function pvRender() {
  if (!PV) return; const st = PV.el.querySelector('.ds-pvstage'); const { pw, ph } = pvSize(); PV.el.style.setProperty('--pw', pw + 'px'); PV.el.style.setProperty('--ph', ph + 'px');
  for (const b of PV.el.querySelectorAll('[data-pm]')) b.setAttribute('aria-pressed', String(b.dataset.pm === PV.mode));
  if (PV.mode === 'book') { const sp = spreadsList(); PV.s = clamp(PV.s, 0, sp.length - 1); const [l, r] = sp[PV.s]; st.innerHTML = `<div class="ds-book">${pvFace(l, 'left')}${pvFace(r, 'right')}<div class="ds-fold"></div></div>`; PV.el.querySelector('.ds-pvn').textContent = l == null ? 'Cover' : r == null ? `Page ${l + 1}` : `Pages ${l + 1} and ${r + 1}`; }
  else { PV.i = clamp(PV.i, 0, D.pages.length - 1); st.innerHTML = `<div class="ds-slide">${pvFace(PV.i, 'one')}</div>`; PV.el.querySelector('.ds-pvn').textContent = `${PV.i + 1} of ${D.pages.length}`; }
}
function pvStep(dir) {
  if (!PV || PV.busy) return;
  if (PV.mode === 'slides') { const j = PV.i + dir; if (j < 0 || j >= D.pages.length) { if (PV.play) pvPlay(false); return; } PV.i = j; const st = PV.el.querySelector('.ds-slide'); const nx = document.createElement('div'); nx.innerHTML = pvFace(j, 'one fadein'); st.appendChild(nx.firstElementChild); PV.busy = true; setTimeout(() => { PV && (PV.busy = false); pvRender(); }, 520); PV.el.querySelector('.ds-pvn').textContent = `${j + 1} of ${D.pages.length}`; return; }
  const sp = spreadsList(); const j = PV.s + dir; if (j < 0 || j >= sp.length) { if (PV.play) pvPlay(false); return; }
  const [l, r] = sp[PV.s], [nl, nr] = sp[j]; const book = PV.el.querySelector('.ds-book'); PV.busy = true;
  const leaf = document.createElement('div'); leaf.className = 'ds-leaf ' + (dir > 0 ? 'fwd' : 'back');
  leaf.innerHTML = dir > 0 ? `${pvFace(r, 'front')}${pvFace(nl, 'backface')}` : `${pvFace(l, 'front')}${pvFace(nr, 'backface')}`;
  const under = book.querySelector(dir > 0 ? '.right' : '.left'); under.outerHTML = pvFace(dir > 0 ? nr : nl, dir > 0 ? 'right' : 'left');
  book.appendChild(leaf); requestAnimationFrame(() => requestAnimationFrame(() => leaf.classList.add('go')));
  setTimeout(() => { if (!PV) return; PV.s = j; PV.busy = false; pvRender(); }, 780);
}
function pvPlay(on) { if (!PV) return; PV.play = on; clearInterval(PV.timer); const b = PV.el.querySelector('[data-pv="play"]'); b.innerHTML = on ? `${ic('pause')} Pause` : `${ic('play')} Play`; if (on) PV.timer = setInterval(() => pvStep(1), PV.mode === 'book' ? 3200 : 3500); }

/* ---------- Export ---------- */
function openExport() {
  endEdit(); exitAdjust(true);
  const st = Object.assign({ pages: 'all', dpi: 300, bleed: 0, marks: false }, (() => { try { return JSON.parse(localStorage.getItem('pdfmate.dsExport')) || {}; } catch (e) { return {}; } })());
  const list = issues(); const n2 = list.filter((x) => x.lv === 2).length, n1 = list.filter((x) => x.lv === 1).length;
  const m = modal(`<h2>Export</h2><p class="sub">${D.pages.length} page${D.pages.length > 1 ? 's' : ''}, ${esc(sizeLabel())}${D.spread ? ', laid out as spreads' : ''}.</p>
    ${n2 + n1 ? `<div class="ds-warnbar ${n2 ? 'bad' : 'meh'}">${ic('warn')}<span>${n2 ? `${n2} thing${n2 > 1 ? 's' : ''} to fix` : ''}${n2 && n1 ? ', ' : ''}${n1 ? `${n1} to check` : ''} before printing</span><button class="ds-b" data-go="check">Review</button></div>` : `<div class="ds-warnbar good">${ic('chk')}<span>Checked: ready to print</span></div>`}
    <div class="flabel ds-fl">Pages</div><div class="ds-opt" data-g="pages"><button data-v="all">All pages</button><button data-v="cur">This page only</button></div>
    <div class="flabel ds-fl">Quality</div><div class="ds-opt" data-g="dpi"><button data-v="300">Print<small>300 dpi, sharp on paper</small></button><button data-v="200">High<small>200 dpi, smaller file</small></button><button data-v="150">Standard<small>150 dpi, good for sharing</small></button><button data-v="96">Screen<small>96 dpi, email and slides</small></button></div>
    <div class="flabel ds-fl">Print shop options</div><div class="ds-opt" data-g="bleed"><button data-v="0">No bleed<small>Home and office printing</small></button><button data-v="3">3 mm bleed<small>Professional printing</small></button><button data-v="5">5 mm bleed<small>Photo books</small></button></div>
    <label class="ds-chk"><input type="checkbox" data-marks ${st.marks ? 'checked' : ''}> Crop marks (with bleed)</label>
    <div class="ds-prog" hidden><i></i></div>
    <div class="acts"><button class="btn" data-go="img">Save page as JPG</button><button class="btn" data-go="dl">${C.icon('download')} Download PDF</button><button class="btn" data-go="print">${C.icon('print')} Print</button><button class="btn primary" data-go="open">Open in PDF Mate</button></div>`);
  const mark = () => { for (const g of m.querySelectorAll('[data-g]')) for (const b of g.querySelectorAll('[data-v]')) b.setAttribute('aria-pressed', String(String(st[g.dataset.g]) === b.dataset.v)); };
  m.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-v]'); if (b) { const g = b.closest('[data-g]').dataset.g; st[g] = g === 'pages' ? b.dataset.v : +b.dataset.v; mark(); return; }
    const go = e.target.closest('[data-go]'); if (!go) return;
    if (go.dataset.go === 'check') { openCheck(true); return; }
    st.marks = m.querySelector('[data-marks]').checked; try { localStorage.setItem('pdfmate.dsExport', JSON.stringify(st)); } catch (er) {}
    const prog = m.querySelector('.ds-prog'); prog.hidden = false; const bar = prog.firstElementChild; const btns = [...m.querySelectorAll('button')]; btns.forEach((x) => x.disabled = true); m.parentElement.dataset.busy = '1';
    try {
      if (go.dataset.go === 'img') { const blob = await renderPageBlob(cur(), st.dpi, 'image/jpeg'); C.downloadBlob(blob, `${D.name || 'Design'} page ${D.cur + 1}.jpg`); delete m.parentElement.dataset.busy; closeModal(); C.toast('Page saved as JPG'); return; }
      const bytes = await buildPdf(st, (f) => { bar.style.width = Math.round(f * 100) + '%'; });
      delete m.parentElement.dataset.busy; closeModal();
      const name = (D.name || 'Design').replace(/[\\/:*?"<>|]/g, '') || 'Design';
      if (go.dataset.go === 'dl') { C.downloadBlob(new Blob([bytes], { type: 'application/pdf' }), name + '.pdf'); C.toast('PDF downloaded'); }
      else { close(); await C.openPdf(bytes, name); if (go.dataset.go === 'print') setTimeout(() => C.print(), 300); }
    } catch (er) { console.error(er); delete m.parentElement.dataset.busy; btns.forEach((x) => x.disabled = false); prog.hidden = true; C.toast('Export failed. Try a lower quality or fewer pages', { err: true, ms: 4000 }); }
  });
  mark();
}
async function renderPageCanvas(pg, dpi, bleedPt) {
  let k = dpi / 72; const fw = D.w + 2 * bleedPt, fh = D.h + 2 * bleedPt; const mx = Math.max(fw, fh) * k; if (mx > 9000) k *= 9000 / mx;
  const c = document.createElement('canvas'); c.width = Math.round(fw * k); c.height = Math.round(fh * k); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  x.setTransform(k, 0, 0, k, bleedPt * k, bleedPt * k); drawPage(x, pg, { k, full: true, bleed: bleedPt }); return c;
}
async function renderPageBlob(pg, dpi, type) { const c = await renderPageCanvas(pg, dpi, 0); return new Promise((r) => c.toBlob(r, type, 0.93)); }
async function buildPdf(o, onProg = () => {}) {
  const PL = C.PL; const doc = await PL.PDFDocument.create(); doc.setTitle(D.name || 'Design'); doc.setCreator('PDF Mate Design Studio'); doc.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  const pages = o.pages === 'cur' ? [cur()] : D.pages; const b = (o.bleed || 0) * PT; const slug = b && o.marks ? 9 * PT : 0;
  for (let i = 0; i < pages.length; i++) {
    const c = await renderPageCanvas(pages[i], o.dpi, b); const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', o.dpi >= 200 ? 0.93 : 0.88)); c.width = c.height = 1;
    const img = await doc.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const pw = D.w + 2 * b + 2 * slug, phh = D.h + 2 * b + 2 * slug; const p = doc.addPage([pw, phh]);
    p.drawImage(img, { x: slug, y: slug, width: D.w + 2 * b, height: D.h + 2 * b });
    if (b) { p.setBleedBox(slug, slug, D.w + 2 * b, D.h + 2 * b); p.setTrimBox(slug + b, slug + b, D.w, D.h); }
    if (slug) { const L = slug - 2, k = PL.rgb(0, 0, 0); const x0 = slug + b, y0 = slug + b, x1 = x0 + D.w, y1 = y0 + D.h; const ln = (ax, ay, bx, by) => p.drawLine({ start: { x: ax, y: ay }, end: { x: bx, y: by }, thickness: 0.3, color: k });
      for (const [x, sx] of [[x0, -1], [x1, 1]]) for (const [y, sy] of [[y0, -1], [y1, 1]]) { ln(x + sx * (b + 2), y, x + sx * (b + 2 + L - 2), y); ln(x, y + sy * (b + 2), x, y + sy * (b + 2 + L - 2)); } }
    onProg((i + 1) / pages.length); await new Promise((r) => setTimeout(r, 0));
  }
  return doc.save();
}

// Test hook
export const __ds = { get D() { return D; }, templateThumb, TMAP, ST, PH, LAYOUTS, STYLES, TEMPLATES, applyLayout, applyStyle, autofill, addPhotoFiles, buildPdf, gutters, reflow, issues, render: () => paint(), setSize, commit, undo, redo, select, selectMany, act, useTemplate, setSpread, applySpreadLayout, getIndex, saveNow, buildCalendar, openPreview, pvStep, closePreview, newDoc: () => { newDoc(); refreshAll(); } };

