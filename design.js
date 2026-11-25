// PDF Mate Design Studio: photo albums, collages and presentation-ready pages.
// Loaded on demand by app.js. Everything renders through one canvas painter, so the editor, thumbnails and the exported PDF match.

const PT = 72 / 25.4;
const SAMPLE_A = Math.sqrt(595.28 * 841.89);
let C = null;            // helpers from app.js
let D = null;            // the design
const PH = new Map();    // photo runtime: id -> { id, name, w, h, blob, url, img, prev }
let UI = null;
const ST = { sel: null, adj: null, edit: null, z: 1, fit: true, tab: 'layouts', hist: [], fut: [], last: '', drag: null, guides: [], all: true, lf: 'all', gfxCat: 'all', sheet: false, insp: true };

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
  ['ig45', 'Social post 4:5', 190.5, 238.13], ['igsq', 'Social square', 190.5, 190.5], ['igst', 'Story 9:16', 190.5, 338.67]
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
  { k: 'title', n: 'Title page', cat: 'Story', cells: [], texts: [['cover', [0.04, 0.4, 0.92, 0.12]], ['coversub', [0.04, 0.53, 0.92, 0.05]]] }
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
  { k: 'linen', n: 'Linen', bg: { t: 'pattern', p: 'linen', c: '#f4f1ea', c2: '#ddd5c4' }, gap: 10, margin: 16, ink: '#4a4237', accent: '#9c8a6e', head: 'garamond', body: 'garamond' }
];
const SMAP = Object.fromEntries(STYLES.map((s) => [s.k, s]));
const FILTERS = [['none', 'Original', 'none'], ['vivid', 'Vivid', 'saturate(1.45) contrast(1.08)'], ['warm', 'Warm', 'sepia(.22) saturate(1.25) hue-rotate(-6deg)'], ['cool', 'Cool', 'saturate(1.05) hue-rotate(10deg) brightness(1.03)'], ['bright', 'Bright', 'brightness(1.15) saturate(1.05)'], ['fade', 'Faded', 'contrast(.82) brightness(1.1) saturate(.75)'], ['vintage', 'Vintage', 'sepia(.45) contrast(.92) brightness(1.04) saturate(.85)'], ['drama', 'Dramatic', 'contrast(1.35) saturate(1.15) brightness(.95)'], ['bw', 'Black and white', 'grayscale(1)'], ['noir', 'Noir', 'grayscale(1) contrast(1.4) brightness(.95)'], ['sepia', 'Sepia', 'sepia(.85)'], ['soft', 'Soft', 'brightness(1.06) contrast(.88) saturate(.95)']];
const FMAP = Object.fromEntries(FILTERS.map((f) => [f[0], f[2]]));
const GFX = [
  ['line', 'Line', 'Lines', 'M0 50H100', 1, 8], ['dline', 'Double line', 'Lines', 'M0 42H100M0 58H100', 1, 8], ['swash', 'Flourish', 'Lines', 'M0 50C20 26 35 26 50 50C65 74 80 74 100 50', 1, 4],
  ['wave', 'Wave', 'Lines', 'M0 50Q12.5 25 25 50T50 50T75 50T100 50', 1, 4], ['scrib', 'Underline', 'Lines', 'M2 60C20 40 30 72 50 52S80 40 98 56', 1, 4], ['dots', 'Dot row', 'Lines', [0, 1, 2, 3, 4, 5, 6].map((i) => circD(7 + i * 14.3, 50, 4)).join(''), 0, 7],
  ['brackets', 'Brackets', 'Lines', 'M22 2H2V98H22M78 2H98V98H78', 1, 1.6], ['corner', 'Corner', 'Lines', 'M2 98V2H98M2 22C14 22 22 14 22 2', 1, 1], ['border', 'Border', 'Lines', 'M2 2H98V98H2Z', 1, 1.4],
  ['heart', 'Heart', 'Shapes', SHAPES.heart[1]], ['star', 'Star', 'Shapes', SHAPES.star[1]], ['spark', 'Sparkle', 'Shapes', 'M50 0C54 36 64 46 100 50C64 54 54 64 50 100C46 64 36 54 0 50C36 46 46 36 50 0Z'],
  ['circle', 'Circle', 'Shapes', circD(50, 50, 48)], ['ringg', 'Ring', 'Shapes', circD(50, 50, 46), 1], ['square', 'Square', 'Shapes', 'M4 4H96V96H4Z'], ['tri', 'Triangle', 'Shapes', SHAPES.tri[1]],
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
  plus: '<path d="M12 5v14M5 12h14"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8M8 21v-7h8v7"/>'
};
const ic = (n) => I[n] ? `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>` : C.icon(n);

/* ---------- Model helpers ---------- */
const cur = () => D.pages[D.cur];
const sc = () => Math.sqrt(D.w * D.h) / SAMPLE_A;
const styleOf = (pg) => SMAP[pg.style] || SMAP.clean;
function fontStack(k) { return (FONTS[k] || FONTS.sans)[1]; }
function newDoc() {
  D = { v: 1, name: 'Photo album', size: 'a4p', w: 210 * PT, h: 297 * PT, photos: [], pages: [], cur: 0 };
  const pg = blankPage('clean'); D.pages.push(pg); applyLayout(pg, 'cover');
}
function blankPage(styleKey, like) {
  const s = SMAP[styleKey] || SMAP.clean;
  return { id: uidd('p'), style: s.k, bg: clone(like ? like.bg : s.bg), gap: like ? like.gap : s.gap, margin: like ? like.margin : s.margin, layout: null, items: [] };
}
function frameStyle(pg) {
  const f = pg.items.find((i) => i.t === 'frame' && !i.polT);
  if (f) return { r: f.r || 0, stroke: f.stroke || 0, strokeCol: f.strokeCol || '#ffffff', shadow: f.shadow || 0, pad: f.pad || 0, padCol: f.padCol || '#ffffff', pol: !!f.pol };
  const s = styleOf(pg); return { r: s.r || 0, stroke: s.stroke || 0, strokeCol: s.strokeCol || '#ffffff', shadow: s.shadow || 0, pad: s.pad || 0, padCol: s.padCol || '#ffffff', pol: !!s.pol };
}
function textFor(role, s) {
  const R = TROLE[role] || TROLE.caption; const k = sc();
  return { t: 'text', id: uidd('t'), role, tpl: true, text: R.text, size: +(R.size * k).toFixed(1), font: R.font === 'hand' ? (s.head === 'script' ? 'script' : 'hand') : R.head ? s.head : s.body, col: s.ink, bold: !!R.bold, ital: !!R.ital, upper: !!R.upper, align: R.align, ls: R.ls || 0, lh: R.lh || 1.2, shadow: !!R.shadow, op: 1, rot: 0 };
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
  const texts = (L.texts || []).map(([role, r]) => { const t = textFor(role, s); const prev = oldTexts.find((o) => o.role === role); if (prev && prev.text !== TROLE[role].text) t.text = prev.text; t.cell = r; if (key === 'cover' || role === 'cover' || role === 'coversub') { if (L.cells.length) t.col = '#ffffff'; } return t; });
  pg.items = [...frames, ...texts, ...keep]; pg.layout = key; reflow(pg);
  return list.length - frames.length;
}
function reflow(pg) {
  const W = D.w, H = D.h, m = pg.margin, g = pg.gap;
  const X0 = m - g / 2, Y0 = m - g / 2, CW = W - 2 * m + g, CH = H - 2 * m + g;
  for (const it of pg.items) {
    if (!it.cell) continue; const c = it.cell;
    if (it.t === 'frame') { it.x = X0 + c[0] * CW + g / 2; it.y = Y0 + c[1] * CH + g / 2; it.w = Math.max(4, c[2] * CW - g); it.h = Math.max(4, c[3] * CH - g); }
    else { it.x = m + c[0] * (W - 2 * m); it.y = m + c[1] * (H - 2 * m); it.w = c[2] * (W - 2 * m); it.h = c[3] * (H - 2 * m); }
  }
}
function itemBy(id) { if (!id) return null; for (const pg of D.pages) for (const it of pg.items) if (it.id === id) return it; return null; }
const selItem = () => { const it = itemBy(ST.sel); return it && cur().items.includes(it) ? it : null; };
function usage() { const u = new Map(); for (const pg of D.pages) { for (const it of pg.items) if (it.t === 'frame' && it.ph) u.set(it.ph.id, (u.get(it.ph.id) || 0) + 1); if (pg.bg.t === 'photo' && pg.bg.ph) u.set(pg.bg.ph, (u.get(pg.bg.ph) || 0) + 1); } return u; }

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
function drawFrame(x, f, o) {
  const ph = f.ph && PH.get(f.ph.id);
  if (!ph && !o.ed) return;
  x.save(); x.translate(f.x + f.w / 2, f.y + f.h / 2); if (f.rot) x.rotate(f.rot * Math.PI / 180); x.translate(-f.w / 2, -f.h / 2); x.globalAlpha = f.op ?? 1;
  const outer = shapePath(f.shape, f.w, f.h, f.r || 0); const pad = Math.min(f.pad || 0, f.w / 3, f.h / 3);
  if (f.shadow > 0) { x.save(); x.shadowColor = `rgba(0,0,0,${0.18 + 0.25 * f.shadow})`; x.shadowBlur = 16 * f.shadow * o.k; x.shadowOffsetY = 5 * f.shadow * o.k; x.fillStyle = pad > 0 ? (f.padCol || '#ffffff') : '#888888'; x.fill(outer); x.restore(); }
  let ix = 0, iy = 0, iw = f.w, ih = f.h, inner = outer;
  if (pad > 0) { x.fillStyle = f.padCol || '#ffffff'; x.fill(outer); const pb = f.pol ? Math.min(pad * 3.4, f.h / 3) : pad; ix = pad; iy = pad; iw = Math.max(1, f.w - 2 * pad); ih = Math.max(1, f.h - pad - pb); inner = new Path2D(); inner.addPath(shapePath(f.shape, iw, ih, Math.max(0, (f.r || 0) - pad / 2)), new DOMMatrix().translate(ix, iy)); }
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
  if (G.s) { x.strokeStyle = g.col; x.lineWidth = g.sw || Math.max(0.8, Math.min(g.w, g.h) * 0.06); x.lineCap = 'round'; x.lineJoin = 'round'; if (G.ar >= 3) x.lineWidth = g.sw || Math.max(0.8, g.h * 0.2); x.stroke(p); }
  else { x.fillStyle = g.col; x.fill(p, G.ev ? 'evenodd' : 'nonzero'); }
  x.restore();
}
function drawPage(x, pg, o) {
  const b = o.bleed || 0; drawBg(x, pg.bg, -b, -b, D.w + 2 * b, D.h + 2 * b, o);
  for (const it0 of pg.items) {
    if (o.skip && it0.id === o.skip) continue;
    let it = it0;
    if (b && it.t === 'frame' && !it.rot) { it = { ...it0 }; const e = 0.8; if (it.x <= e) { it.w += it.x + b; it.x = -b; } if (it.y <= e) { it.h += it.y + b; it.y = -b; } if (it.x + it.w >= D.w - e) it.w = D.w + b - it.x; if (it.y + it.h >= D.h - e) it.h = D.h + b - it.y; }
    if (it.t === 'frame') drawFrame(x, it, o); else if (it.t === 'text') drawText(x, it, o); else drawGfx(x, it, o);
  }
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
  t.remove(); return ids;
}
const newPh = (id, pg) => { const s = styleOf(pg || cur()); return { id, z: 1, fx: 0.5, fy: 0.5, flt: s.flt || 'none' }; };

/* ---------- Storage (IndexedDB autosave) ---------- */
let dbP = null;
function idb() { if (!dbP) dbP = new Promise((res, rej) => { const r = indexedDB.open('pdfmate-design', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); return dbP; }
async function idbGet(k) { try { const db = await idb(); return await new Promise((res) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch (e) { return null; } }
async function idbPut(k, v) { try { const db = await idb(); await new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
async function idbDel(k) { try { const db = await idb(); await new Promise((res) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
let saveT = 0;
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(() => idbPut('doc', JSON.parse(JSON.stringify(D))), 900); }
async function restore() {
  const doc = await idbGet('doc'); if (!doc || !doc.pages || !doc.pages.length) return false;
  D = doc; D.cur = clamp(D.cur || 0, 0, D.pages.length - 1);
  const ok = [];
  for (const id of D.photos) { if (PH.has(id)) { ok.push(id); continue; } const rec = await idbGet('ph:' + id); if (rec && rec.blob) { try { await loadPhoto(rec); ok.push(id); } catch (e) {} } }
  D.photos = ok; return true;
}

/* ---------- History ---------- */
const snap = () => JSON.stringify({ w: D.w, h: D.h, size: D.size, name: D.name, pages: D.pages, cur: D.cur });
function commit() { const s = snap(); if (s === ST.last) return; ST.hist.push(ST.last); if (ST.hist.length > 80) ST.hist.shift(); ST.fut = []; ST.last = s; scheduleSave(); thumbsSoon(); markHist(); }
function loadSnap(s) { const o = JSON.parse(s); Object.assign(D, o); D.cur = clamp(D.cur, 0, D.pages.length - 1); if (!selItem()) ST.sel = null; ST.adj = null; ST.last = s; scheduleSave(); refreshAll(); }
function undo() { if (!ST.hist.length) return; endEdit(); ST.fut.push(ST.last); loadSnap(ST.hist.pop()); }
function redo() { if (!ST.fut.length) return; ST.hist.push(ST.last); loadSnap(ST.fut.pop()); }
function markHist() { if (!UI) return; const u = $('[data-a="undo"]'), r = $('[data-a="redo"]'); if (u) u.disabled = !ST.hist.length; if (r) r.disabled = !ST.fut.length; }

/* ---------- UI shell ---------- */
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
.ds-pages{display:flex;align-items:center;gap:8px;padding:8px 12px;padding-bottom:max(8px,env(safe-area-inset-bottom));border-top:.5px solid var(--sep);background:var(--glass-strong);overflow-x:auto;min-height:92px}
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
`;
const TABS = [['layouts', 'Layouts', 'layouts'], ['photos', 'Photos', 'photo'], ['styles', 'Styles', 'styles'], ['text', 'Text', 'text'], ['gfx', 'Graphics', 'gfx'], ['bg', 'Background', 'bgi']];
const isNarrow = () => innerWidth <= 900;

export async function openDesign(ctx, o = {}) {
  C = ctx;
  if (UI) { applyOpen(o); return; }
  if (!document.getElementById('dsCss')) { const s = document.createElement('style'); s.id = 'dsCss'; s.textContent = CSS; document.head.appendChild(s); }
  if (!D) { const ok = await restore(); if (!ok) newDoc(); }
  ST.last = snap(); ST.hist = []; ST.fut = []; if (!D.photos.length) ST.tab = 'photos';
  build(); applyOpen(o);
}
function build() {
  const root = document.createElement('div'); root.className = 'ds'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Design studio');
  root.innerHTML = `
  <div class="ds-top">
    <button class="tbtn" data-a="close" aria-label="Back to PDF Mate" title="Back to PDF Mate">${C.icon('close')}</button>
    <div class="ds-brand"><span>Design studio</span><small>Albums and collages</small></div>
    <input class="ds-name" data-a="name" aria-label="Design name" value="${esc(D.name)}">
    <button class="ds-sizebtn" data-a="size" title="Page size"></button>
    <span class="ds-sp"></span>
    <button class="tbtn" data-a="undo" aria-label="Undo" title="Undo (Ctrl+Z)">${C.icon('undo')}</button>
    <button class="tbtn" data-a="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)">${C.icon('redo')}</button>
    <span class="ds-hide-m" style="display:flex;align-items:center"><button class="tbtn" data-a="zout" aria-label="Zoom out">${C.icon('zout')}</button><button class="ds-zoom" data-a="fit" title="Fit page"></button><button class="tbtn" data-a="zin" aria-label="Zoom in">${C.icon('zin')}</button></span>
    <button class="tbtn" data-a="more" aria-label="More" title="New, open and save designs">${C.icon('more')}</button>
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
  requestAnimationFrame(() => { fitZoom(); paint(); });
}
function applyOpen(o) {
  if (!o || !UI) return;
  if (o.tab) { ST.tab = o.tab; if (isNarrow()) { ST.sheet = true; UI.panel.hidden = false; UI.insp.hidden = true; } renderPanel(); }
  if (o.action === 'photos') setTimeout(() => $('[data-file="photos"]').click(), 60);
  else if (o.action === 'export') setTimeout(openExport, 60);
  else if (o.action === 'new') setTimeout(() => moreMenuNew(), 60);
}
function close() {
  endEdit(); exitAdjust(false); commit();
  clearTimeout(saveT); idbPut('doc', JSON.parse(JSON.stringify(D)));
  document.removeEventListener('keydown', onKey, true); removeEventListener('resize', onResize); document.removeEventListener('touchmove', blockTouch, { passive: false });
  closeMenu(); UI.root.remove(); UI = null; ST.sel = null; ST.adj = null;
}
function refreshAll() { if (!UI) return; markSize(); renderPanel(); renderInsp(); renderPages(); paint(); }
function markSize() { const s = SIZES.find((z) => z[0] === D.size); $('[data-a="size"]').innerHTML = (s ? s[1] : `Custom ${Math.round(D.w / PT)} × ${Math.round(D.h / PT)} mm`) + ' ▾'; $('[data-a="fit"]').textContent = Math.round(ST.z * 100 / 1.333) + '%'; }

/* ---------- Painting the editor ---------- */
let rq = 0;
function render() { if (rq || !UI) return; rq = requestAnimationFrame(() => { rq = 0; paint(); }); }
function fitZoom() { if (!UI) return; const r = UI.stage.getBoundingClientRect(); const pad = isNarrow() ? 20 : 56; ST.z = Math.max(0.1, Math.min((r.width - pad) / D.w, (r.height - pad) / D.h)); ST.fit = true; }
function paint() {
  if (!UI) return; const pg = cur(); if (!pg) return;
  if (ST.fit) fitZoom();
  const z = ST.z, dpr = Math.min(2.5, devicePixelRatio || 1); const cw = Math.round(D.w * z), ch = Math.round(D.h * z);
  const cv = UI.cv; const pw = Math.round(cw * dpr), phh = Math.round(ch * dpr);
  if (cv.width !== pw || cv.height !== phh) { cv.width = pw; cv.height = phh; }
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; UI.box.style.width = cw + 'px'; UI.box.style.height = ch + 'px';
  const r = UI.stage.getBoundingClientRect(); const pad = isNarrow() ? 10 : 28; UI.board.style.width = Math.max(cw + 2 * pad, r.width) + 'px'; UI.board.style.height = Math.max(ch + 2 * pad, r.height) + 'px';
  UI.box.style.position = 'absolute'; UI.box.style.left = Math.max(pad, (Math.max(cw + 2 * pad, r.width) - cw) / 2) + 'px'; UI.box.style.top = Math.max(pad, (Math.max(ch + 2 * pad, r.height) - ch) / 2) + 'px';
  const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pw, phh); x.setTransform(z * dpr, 0, 0, z * dpr, 0, 0);
  drawPage(x, pg, { k: z * dpr, ed: true, skip: ST.edit, adj: ST.adj, drop: ST.drag && ST.drag.over });
  UI.ov.style.width = cw + 'px'; UI.ov.style.height = ch + 'px';
  overlay(); markSize();
}
function overlay() {
  const pg = cur(), z = ST.z; let h = '';
  const it = selItem();
  if (!ST.edit && !(ST.drag && (ST.drag.k === 'photo' || ST.drag.k === 'tray'))) {
    for (const g of gutters(pg)) h += g.ax === 'v' ? `<div class="ds-gut v" data-gut="${g.i}" style="left:${g.x * z}px;top:${g.y * z}px" title="Drag to resize the photos on both sides"></div>` : `<div class="ds-gut h" data-gut="${g.i}" style="left:${g.x * z}px;top:${g.y * z}px" title="Drag to resize the photos on both sides"></div>`;
  }
  if (it && !ST.edit) {
    const w = it.w * z, hh = (it.h || 10) * z; const adj = ST.adj === it.id;
    let hs = '';
    if (!adj) {
      const corners = [['nw', 0, 0], ['ne', 100, 0], ['sw', 0, 100], ['se', 100, 100]]; const sides = it.t === 'text' ? [['w', 0, 50], ['e', 100, 50]] : it.t === 'emoji' ? [] : [['n', 50, 0], ['s', 50, 100], ['w', 0, 50], ['e', 100, 50]];
      hs += corners.map(([d, l, t]) => `<div class="ds-h" data-h="${d}" style="left:${l}%;top:${t}%;cursor:${d}-resize"></div>`).join('');
      hs += sides.map(([d, l, t]) => `<div class="ds-h side${d === 'n' || d === 's' ? ' hz' : ''}" data-h="${d}" style="left:${l}%;top:${t}%;cursor:${d}-resize"></div>`).join('');
      hs += `<div class="ds-h rot" data-h="rot" title="Rotate"></div>`;
      if (it.t === 'frame' && it.ph) hs += `<div class="ds-h mv" data-h="move" style="left:50%;top:50%" title="Move this frame. Drag the photo itself to swap it with another frame">${ic('move')}</div>`;
    }
    h += `<div class="ds-sel${adj ? ' adj' : ''}" style="left:${it.x * z}px;top:${it.y * z}px;width:${w}px;height:${hh}px;transform:rotate(${it.rot || 0}deg)">${hs}</div>`;
    const bb = aabb(it); const below = bb.y * z < 44; const top = below ? (bb.y + bb.h) * z + 10 : bb.y * z - 36; const bx = clamp((bb.x + bb.w / 2) * z, 90, D.w * z - 90);
    let fb = '';
    if (adj) fb = `<button data-fa="done">${C.icon('check')} Done</button><button data-fa="zoomout">${C.icon('zout')}</button><button data-fa="zoomin">${C.icon('zin')}</button><button data-fa="reset">Reset</button>`;
    else if (it.t === 'frame') fb = `${it.ph ? `<button data-fa="adjust" title="Pan and zoom the photo inside the frame">${ic('adjust')} Adjust</button>` : ''}<button data-fa="replace" title="${it.ph ? 'Replace photo' : 'Choose a photo'}">${C.icon('photo')}</button><button data-fa="splith" title="Split into two side by side">${ic('splith')}</button><button data-fa="splitv" title="Split into two stacked">${ic('splitv')}</button><button data-fa="dup" title="Duplicate">${C.icon('dup')}</button><button data-fa="del" class="danger" title="Delete">${C.icon('trash')}</button>`;
    else fb = `${it.t === 'text' ? `<button data-fa="edit">${C.icon('edit')} Edit</button>` : ''}<button data-fa="front" title="Bring to front">${C.icon('front')}</button><button data-fa="dup" title="Duplicate">${C.icon('dup')}</button><button data-fa="del" class="danger" title="Delete">${C.icon('trash')}</button>`;
    if (!(ST.drag && ST.drag.k !== 'pan')) h += `<div class="ds-fbar" style="left:${bx}px;top:${top}px${below ? ';transform:translate(-50%,0)' : ''}">${fb}</div>`;
  }
  for (const g of ST.guides) h += g.v != null ? `<div class="ds-guide v" style="left:${g.v * z}px"></div>` : `<div class="ds-guide h" style="top:${g.h * z}px"></div>`;
  const ta = UI.ov.querySelector('.ds-ta'); UI.ov.innerHTML = h; if (ta) UI.ov.appendChild(ta);
}
function aabb(it) { const h = it.h || 10; const a = (it.rot || 0) * Math.PI / 180; const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); const W = it.w * c + h * s, H = it.w * s + h * c; const cx = it.x + it.w / 2, cy = it.y + h / 2; return { x: cx - W / 2, y: cy - H / 2, w: W, h: H }; }
function gutters(pg) {
  const fr = pg.items.filter((i) => i.t === 'frame' && i.cell && !i.rot); if (fr.length < 2) return [];
  const out = []; const E = 0.002; const m = pg.margin, g = pg.gap, X0 = m - g / 2, Y0 = m - g / 2, CW = D.w - 2 * m + g, CH = D.h - 2 * m + g;
  for (const ax of ['v', 'h']) {
    const a = ax === 'v' ? 0 : 1, b = 1 - a; const vals = new Set();
    for (const f of fr) { const e = f.cell[a] + f.cell[a + 2]; if (e > E && e < 1 - E && fr.some((o) => Math.abs(o.cell[a] - e) < E)) vals.add(Math.round(e * 1e4) / 1e4); }
    for (const v of vals) {
      const touch = fr.filter((f) => Math.abs(f.cell[a] + f.cell[a + 2] - v) < E || Math.abs(f.cell[a] - v) < E).map((f) => [f.cell[b], f.cell[b] + f.cell[b + 2], f]);
      touch.sort((p, q) => p[0] - q[0]); const segs = [];
      for (const t of touch) { const s = segs[segs.length - 1]; if (s && t[0] < s.e - E) { s.e = Math.max(s.e, t[1]); s.f.push(t[2]); } else segs.push({ s: t[0], e: t[1], f: [t[2]] }); }
      for (const s of segs) {
        const left = s.f.filter((f) => Math.abs(f.cell[a] + f.cell[a + 2] - v) < E), right = s.f.filter((f) => Math.abs(f.cell[a] - v) < E); if (!left.length || !right.length) continue;
        const mid = (s.s + s.e) / 2; const i = out.length;
        out.push({ i, ax, v, left, right, x: ax === 'v' ? X0 + v * CW : X0 + mid * CW, y: ax === 'v' ? Y0 + mid * CH : Y0 + v * CH });
      }
    }
  }
  return out;
}

/* ---------- Hit testing and geometry ---------- */
function toPage(e) { const r = UI.cv.getBoundingClientRect(); return [(e.clientX - r.left) / ST.z, (e.clientY - r.top) / ST.z]; }
function inItem(it, px, py, tol = 0) { const h = it.h || 10; const cx = it.x + it.w / 2, cy = it.y + h / 2; const a = -(it.rot || 0) * Math.PI / 180; const dx = px - cx, dy = py - cy; const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); return Math.abs(lx) <= it.w / 2 + tol && Math.abs(ly) <= h / 2 + tol; }
function hit(px, py, filter) { const its = cur().items; for (let i = its.length - 1; i >= 0; i--) { const it = its[i]; if (filter && !filter(it)) continue; if (inItem(it, px, py, 1.5 / ST.z)) return it; } return null; }
function overCanvas(e) { const r = UI.cv.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }

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
function select(id) { if (ST.sel === id) return; endEdit(); if (ST.adj && ST.adj !== id) exitAdjust(true); ST.sel = id; if (isNarrow()) { UI.insp.hidden = !id; if (id) { UI.panel.hidden = true; ST.sheet = false; markTabs(); } } renderInsp(); render(); }

function onDown(e) {
  if (e.button > 0) return;
  if (e.target.closest('.ds-fbar') || e.target.closest('.ds-ta')) return;
  const [px, py] = toPage(e);
  if (ST.edit) { endEdit(); }
  const hEl = e.target.closest('[data-h]'), gEl = e.target.closest('[data-gut]');
  const base = { x0: e.clientX, y0: e.clientY, px, py, id: e.pointerId, started: false };
  if (gEl) { const g = gutters(cur())[+gEl.dataset.gut]; if (!g) return; ST.drag = { ...base, k: 'gut', g, snap: g.left.concat(g.right).map((f) => ({ f, c: f.cell.slice() })), started: true }; capture(e); return; }
  const it = selItem();
  if (hEl && it) {
    const d = hEl.dataset.h; const h0 = it.h || 10;
    if (d === 'rot') ST.drag = { ...base, k: 'rot', it, cx: it.x + it.w / 2, cy: it.y + h0 / 2, r0: it.rot || 0, a0: Math.atan2(py - (it.y + h0 / 2), px - (it.x + it.w / 2)), started: true };
    else if (d === 'move') ST.drag = { ...base, k: 'move', it, ox: it.x, oy: it.y, started: true, detach: true };
    else ST.drag = { ...base, k: 'size', it, d, g0: { x: it.x, y: it.y, w: it.w, h: h0, size: it.size } , started: true };
    capture(e); return;
  }
  if (ST.adj) { const f = itemBy(ST.adj); if (f && inItem(f, px, py)) { ST.drag = { ...base, k: 'pan', it: f, fx: f.ph.fx ?? 0.5, fy: f.ph.fy ?? 0.5, z0: f.ph.z || 1, started: true }; capture(e); UI.stage.style.cursor = 'grabbing'; return; } exitAdjust(true); }
  const t = hit(px, py);
  if (!t) { if (overCanvas(e) || e.target === UI.stage || e.target === UI.board) { select(null); } return; }
  select(t.id);
  if (t.t === 'frame' && t.ph) ST.drag = { ...base, k: 'photo', it: t };
  else ST.drag = { ...base, k: 'move', it: t, ox: t.x, oy: t.y, detach: true };
  capture(e);
}
function capture(e) { try { UI.stage.setPointerCapture(e.pointerId); } catch (er) {} UI.stage.addEventListener('pointermove', onMove); UI.stage.addEventListener('pointerup', onUp); UI.stage.addEventListener('pointercancel', onUp); }
function release() { UI.stage.removeEventListener('pointermove', onMove); UI.stage.removeEventListener('pointerup', onUp); UI.stage.removeEventListener('pointercancel', onUp); UI.stage.style.cursor = ''; }
function onMove(e) {
  const d = ST.drag; if (!d) return; const [px, py] = toPage(e);
  if (!d.started) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return; d.started = true; if (d.k === 'photo') { ghost(PH.get(d.it.ph.id)); render(); } }
  const it = d.it; const dx = px - d.px, dy = py - d.py;
  if (d.k === 'move') {
    if (d.detach && it.cell) { delete it.cell; if (it.tpl) delete it.tpl; }
    let nx = d.ox + dx, ny = d.oy + dy; ST.guides = [];
    if (!it.rot && !e.altKey) { const s = snapMove(it, nx, ny); nx = s.x; ny = s.y; ST.guides = s.g; }
    it.x = nx; it.y = ny; render();
  } else if (d.k === 'size') { resizeTo(d, px, py, e.shiftKey); render(); }
  else if (d.k === 'rot') { let a = d.r0 + (Math.atan2(py - d.cy, px - d.cx) - d.a0) * 180 / Math.PI; a = ((a + 540) % 360) - 180; if (e.shiftKey) a = Math.round(a / 15) * 15; else for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(a - s) < 3) a = s; it.rot = Math.round(a * 10) / 10; if (it.cell && it.t === 'frame') delete it.cell; render(); }
  else if (d.k === 'pan') { const ph = PH.get(it.ph.id); const pad = it.pad || 0; const iw = it.w - 2 * pad, ih = it.h - pad - (it.pol ? pad * 3.4 : pad); const R = coverRect(iw, ih, ph.w, ph.h, it.ph.z); const a = -(it.rot || 0) * Math.PI / 180; const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); it.ph.fx = R.w - iw > 0.5 ? clamp(d.fx - lx / (R.w - iw), 0, 1) : 0.5; it.ph.fy = R.h - ih > 0.5 ? clamp(d.fy - ly / (R.h - ih), 0, 1) : 0.5; render(); }
  else if (d.k === 'gut') {
    const g = d.g; const m = cur().margin, gp = cur().gap; const X0 = m - gp / 2, CW = D.w - 2 * m + gp, CH = D.h - 2 * m + gp;
    const v = g.ax === 'v' ? (px - X0) / CW : (py - X0) / CH; const a = g.ax === 'v' ? 0 : 1; const MIN = 0.06;
    let lo = -Infinity, hi = Infinity; for (const s of d.snap) { if (g.left.includes(s.f)) lo = Math.max(lo, s.c[a] + MIN); if (g.right.includes(s.f)) hi = Math.min(hi, s.c[a] + s.c[a + 2] - MIN); }
    const nv = clamp(v, lo, hi);
    for (const s of d.snap) { const c = s.f.cell; if (g.left.includes(s.f)) c[a + 2] = nv - s.c[a]; if (g.right.includes(s.f)) { c[a] = nv; c[a + 2] = s.c[a] + s.c[a + 2] - nv; } }
    reflow(cur()); render();
  } else if (d.k === 'photo' || d.k === 'tray') { moveGhost(e); const over = overCanvas(e) ? hit(px, py, (i) => i.t === 'frame') : null; const oid = over && (d.k === 'tray' || over.id !== it.id) ? over.id : null; if (oid !== d.over) { d.over = oid; render(); } }
}
function onUp(e) {
  const d = ST.drag; release(); ST.drag = null; ST.guides = []; killGhost(); if (!d) return;
  if (d.k === 'photo') {
    if (!d.started) { render(); return; }
    const [px, py] = toPage(e); const tgt = overCanvas(e) ? hit(px, py, (i) => i.t === 'frame') : null;
    const overTray = !!document.elementFromPoint(e.clientX, e.clientY)?.closest('.ds-panel');
    if (tgt && tgt.id !== d.it.id) { const a = d.it.ph; d.it.ph = tgt.ph; tgt.ph = a; if (tgt.ph) { tgt.ph.fx = tgt.ph.fy = 0.5; tgt.ph.z = 1; } if (d.it.ph) { d.it.ph.fx = d.it.ph.fy = 0.5; d.it.ph.z = 1; } ST.sel = tgt.id; C.toast(d.it.ph ? 'Photos swapped' : 'Photo moved'); commit(); refreshLite(); }
    else if (overTray) { d.it.ph = null; commit(); refreshLite(); C.toast('Photo taken out of the frame'); }
    render(); return;
  }
  if (d.started) commit();
  if (d.k === 'gut' || d.k === 'move' || d.k === 'size' || d.k === 'rot') renderInsp();
  render();
}
function snapMove(it, nx, ny) {
  const T = 5 / ST.z; const W = D.w, H = D.h, m = cur().margin; const w = it.w, h = it.h || 10;
  const xs = [0, W / 2, W, m, W - m], ys = [0, H / 2, H, m, H - m];
  for (const o of cur().items) { if (o === it || o.rot) continue; xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + (o.h || 10) / 2, o.y + (o.h || 10)); }
  let bx = null, by = null; const g = [];
  for (const [off] of [[0], [w / 2], [w]]) for (const c of xs) { const dd = c - (nx + off); if (Math.abs(dd) < T && (bx == null || Math.abs(dd) < Math.abs(bx.d))) bx = { d: dd, c }; }
  for (const [off] of [[0], [h / 2], [h]]) for (const c of ys) { const dd = c - (ny + off); if (Math.abs(dd) < T && (by == null || Math.abs(dd) < Math.abs(by.d))) by = { d: dd, c }; }
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
function onDbl(e) { const [px, py] = toPage(e); const t = hit(px, py); if (!t) return; select(t.id); if (t.t === 'frame' && t.ph) enterAdjust(t); else if (t.t === 'frame') pickReplace(); else if (t.t === 'text') startEdit(t); }
function enterAdjust(f) { ST.adj = f.id; ST.sel = f.id; UI.stage.classList.add('adj'); renderInsp(); render(); C.toast('Drag to move the photo in its frame. Scroll or use the zoom buttons to zoom'); }
function exitAdjust(doCommit) { if (!ST.adj) return; ST.adj = null; if (UI) UI.stage.classList.remove('adj'); if (doCommit) commit(); if (UI) { renderInsp(); render(); } }

/* Text editing in place */
function startEdit(t) {
  endEdit(); ST.edit = t.id; ST.sel = t.id; const z = ST.z;
  const ta = document.createElement('textarea'); ta.className = 'ds-ta'; ta.value = t.text; ta.spellcheck = true;
  const h = Math.max(t.h || t.size * 1.3, t.size * 1.3);
  Object.assign(ta.style, { left: t.x * z + 'px', top: t.y * z + 'px', width: t.w * z + 'px', height: (h + t.size) * z + 'px', font: `${t.ital ? 'italic ' : ''}${t.bold ? 700 : 400} ${t.size * z}px ${fontStack(t.font)}`, lineHeight: (t.lh || 1.2), color: t.col, textAlign: t.align, letterSpacing: (t.ls || 0) * t.size * z + 'px', textTransform: t.upper ? 'uppercase' : 'none', transform: `rotate(${t.rot || 0}deg)` });
  ta.addEventListener('input', () => { t.text = ta.value; const ins = $('.ds-insp [data-p="text"]'); if (ins) ins.value = ta.value; });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endEdit(); } });
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
  const t = e.target.closest('.ds-ph'); if (!t || e.target.closest('.x') || e.button > 0) return;
  const id = t.dataset.ph; const d = { k: 'tray', phId: id, x0: e.clientX, y0: e.clientY, started: false, t0: Date.now(), touch: e.pointerType === 'touch' };
  let holdOk = !d.touch; const holdT = d.touch ? setTimeout(() => { holdOk = true; if (!d.started) { d.started = true; ST.drag = d; ghost(PH.get(id)); moveGhost(e); } }, 260) : 0;
  const move = (ev) => {
    if (!d.started) { if (Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0) < 6) return; if (!holdOk) { clearTimeout(holdT); cleanup(); return; } d.started = true; ST.drag = d; ghost(PH.get(id)); }
    moveGhost(ev); const [px, py] = toPage(ev); const over = overCanvas(ev) ? hit(px, py, (i) => i.t === 'frame') : null; const oid = over ? over.id : null; if (oid !== d.over) { d.over = oid; render(); }
  };
  const up = (ev) => {
    clearTimeout(holdT); cleanup(); killGhost(); ST.drag = null;
    if (!d.started) { if (ev.type === 'pointerup') placeSmart(id); return; }
    if (overCanvas(ev)) { const [px, py] = toPage(ev); const f = hit(px, py, (i) => i.t === 'frame'); if (f) { f.ph = newPh(id); select(f.id); } else addFrameAt(id, px, py); commit(); refreshLite(); }
    render();
  };
  const cleanup = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
function placeSmart(id) {
  const pg = cur(); const s = selItem();
  let f = s && s.t === 'frame' ? s : pg.items.find((i) => i.t === 'frame' && !i.ph);
  if (f) { f.ph = newPh(id); ST.sel = f.id; } else { const ph = PH.get(id); addFrameAt(id, D.w / 2, D.h / 2, ph); }
  commit(); refreshLite(); render();
}
function addFrameAt(id, px, py) {
  const ph = PH.get(id); const fs = frameStyle(cur()); const mx = Math.min(D.w, D.h) * 0.42; const ar = ph ? ph.w / ph.h : 1.3;
  const w = ar >= 1 ? mx : mx * ar, h = ar >= 1 ? mx / ar : mx;
  const f = { t: 'frame', id: uidd('f'), x: clamp(px - w / 2, 0, D.w - w), y: clamp(py - h / 2, 0, D.h - h), w, h, shape: 'rect', rot: 0, ...fs, op: 1, ph: id ? newPh(id) : null };
  cur().items.push(f); ST.sel = f.id; return f;
}
function refreshLite() { renderInsp(); if (ST.tab === 'photos' || ST.tab === 'bg') renderPanel(); }

/* Files */
async function onFileDrop(e) {
  const files = [...(e.dataTransfer?.files || [])]; if (!files.length) return; e.preventDefault(); const dz = $('.ds-drop'); if (dz) dz.classList.remove('hot');
  if (files.length === 1 && /json$/i.test(files[0].name)) { openProject(files[0]); return; }
  const ids = await addPhotoFiles(files); if (!ids.length) return;
  if (overCanvas(e)) { const [px, py] = toPage(e); const f = hit(px, py, (i) => i.t === 'frame'); if (f) { f.ph = newPh(ids[0]); ST.sel = f.id; ids.shift(); } }
  for (const id of ids) { const f = cur().items.find((i) => i.t === 'frame' && !i.ph); if (!f) break; f.ph = newPh(id); }
  commit(); ST.tab = 'photos'; refreshAll(); C.toast(`${files.length} photo${files.length > 1 ? 's' : ''} added. Drag them into frames or use Auto-fill`);
}
let replaceTarget = null;
function pickReplace() { const f = selItem(); replaceTarget = f && f.t === 'frame' ? f.id : null; $('[data-file="replace"]').click(); }
async function onFilePick(e) {
  const inp = e.target; const files = [...inp.files]; inp.value = ''; if (!files.length) return; const kind = inp.dataset.file;
  if (kind === 'project') { openProject(files[0]); return; }
  const ids = await addPhotoFiles(files); if (!ids.length) return;
  if (kind === 'replace') { const f = itemBy(replaceTarget); if (f) { f.ph = newPh(ids[0]); ST.sel = f.id; } commit(); refreshAll(); return; }
  for (const id of ids) { const f = cur().items.find((i) => i.t === 'frame' && !i.ph); if (!f) break; f.ph = newPh(id); }
  commit(); refreshAll(); C.toast(`${ids.length} photo${ids.length > 1 ? 's' : ''} added`);
}

/* Keyboard */
function onKey(e) {
  if (!UI) return; if (document.querySelector('.ds-modal')) { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } if (!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.stopPropagation(); return; }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (menuEl) closeMenu(); else if (ST.edit) endEdit(); else if (ST.adj) exitAdjust(true); else if (ST.sel) select(null); else close(); return; }
  if (typing) return;
  e.stopPropagation();
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  const it = selItem();
  if (mod && e.key.toLowerCase() === 'd' && it) { e.preventDefault(); act('dup'); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && it) { e.preventDefault(); act('del'); return; }
  if (e.key === 'Enter' && it) { e.preventDefault(); if (ST.adj) exitAdjust(true); else if (it.t === 'text') startEdit(it); else if (it.t === 'frame' && it.ph) enterAdjust(it); return; }
  if (it && e.key.startsWith('Arrow')) { e.preventDefault(); const s = e.shiftKey ? 10 : 1; if (it.cell) delete it.cell; if (e.key === 'ArrowLeft') it.x -= s; if (e.key === 'ArrowRight') it.x += s; if (e.key === 'ArrowUp') it.y -= s; if (e.key === 'ArrowDown') it.y += s; render(); clearTimeout(ST.kt); ST.kt = setTimeout(commit, 350); return; }
  if (e.key === 'PageDown') { e.preventDefault(); goPage(D.cur + 1); } else if (e.key === 'PageUp') { e.preventDefault(); goPage(D.cur - 1); }
  else if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(ST.z * 1.2); } else if (mod && e.key === '-') { e.preventDefault(); setZoom(ST.z / 1.2); } else if (mod && e.key === '0') { e.preventDefault(); ST.fit = true; paint(); }
}

/* ---------- Clicks and inputs ---------- */
function onClick(e) {
  const b = e.target.closest('button,[data-tab]'); if (!b || !UI.root.contains(b)) return;
  if (b.dataset.tab) { const k = b.dataset.tab; if (isNarrow()) { if (ST.tab === k && ST.sheet) { ST.sheet = false; UI.panel.hidden = true; } else { ST.tab = k; ST.sheet = true; UI.panel.hidden = false; UI.insp.hidden = true; } } else ST.tab = k; renderPanel(); markTabs(); return; }
  const a = b.dataset.a; if (a) { topAct(a, b); return; }
  if (b.dataset.fa) { fbarAct(b.dataset.fa); return; }
  if (b.dataset.act) { act(b.dataset.act, b); return; }
  if (b.dataset.lay) { const pg = cur(); const left = applyLayout(pg, b.dataset.lay); ST.sel = null; commit(); refreshAll(); C.toast(left > 0 ? `${LMAP[b.dataset.lay].n}. ${left} photo${left > 1 ? 's' : ''} did not fit and stay in Photos` : LMAP[b.dataset.lay].n); return; }
  if (b.dataset.lf) { ST.lf = b.dataset.lf; renderPanel(); return; }
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
  if (b.dataset.col) { const it = selItem(); const p = b.dataset.colp; if (it) { it[p] = b.dataset.col; commit(); renderInsp(); render(); } return; }
  if (b.dataset.align) { const it = selItem(); if (it) { it.align = b.dataset.align; commit(); renderInsp(); render(); } return; }
  if (b.dataset.tog) { const it = selItem(); if (it) { it[b.dataset.tog] = !it[b.dataset.tog]; commit(); renderInsp(); render(); } return; }
  if (b.dataset.pg != null) { goPage(+b.dataset.pg); return; }
  if (b.dataset.phx) { removePhoto(b.dataset.phx); return; }
}
function markTabs() { for (const t of $$('[data-tab]')) t.setAttribute('aria-selected', String(t.dataset.tab === ST.tab && (!isNarrow() || ST.sheet))); }
function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
function onInput(e) {
  const el = e.target; const it = selItem();
  if (el.dataset.a === 'name') { D.name = el.value; scheduleSave(); return; }
  if (el.dataset.p && it) { const p = el.dataset.p; it[p] = el.type === 'range' || el.type === 'number' ? num(el.value) : el.value; if (p === 'text' && ST.edit) { const ta = UI.ov.querySelector('.ds-ta'); if (ta) ta.value = el.value; } const v = el.parentElement.querySelector('.val'); if (v) v.textContent = fmtVal(p, it[p]); render(); return; }
  if (el.dataset.php && it && it.ph) { it.ph[el.dataset.php] = num(el.value); render(); return; }
  if (el.dataset.pp) { const pg = cur(); const p = el.dataset.pp; pg[p] = num(el.value); reflow(pg); const v = el.parentElement.querySelector('.val'); if (v) v.textContent = Math.round(pg[p] / PT * 10) / 10 + ' mm'; render(); return; }
  if (el.dataset.bgp) { const bg = cur().bg; bg[el.dataset.bgp] = el.type === 'range' ? num(el.value) : el.value; render(); return; }
}
function onChange(e) {
  const el = e.target;
  if (el.dataset.p || el.dataset.php || el.dataset.pp || el.dataset.bgp) { commit(); if (el.tagName === 'SELECT' || el.type === 'color') renderInsp(); if (el.dataset.bgp && el.type === 'color') renderPanel(); thumbsSoon(); return; }
  if (el.dataset.all != null) { ST.all = el.checked; return; }
  if (el.dataset.a === 'name') commit();
}
function fmtVal(p, v) { if (p === 'rot') return Math.round(v) + '°'; if (p === 'op' || p === 'shadow') return Math.round(v * 100) + '%'; if (p === 'ls') return Math.round(v * 100) / 100; if (p === 'lh') return (+v).toFixed(2); return Math.round(v * 10) / 10; }

function topAct(a, b) {
  if (a === 'close') close(); else if (a === 'undo') undo(); else if (a === 'redo') redo();
  else if (a === 'zin') setZoom(ST.z * 1.2); else if (a === 'zout') setZoom(ST.z / 1.2); else if (a === 'fit') { ST.fit = true; paint(); }
  else if (a === 'size') sizeMenu(b); else if (a === 'more') moreMenu(b); else if (a === 'export') openExport();
}
function fbarAct(k) {
  const it = selItem(); if (!it) return;
  if (k === 'adjust') enterAdjust(it); else if (k === 'done') exitAdjust(true);
  else if (k === 'zoomin' || k === 'zoomout') { it.ph.z = clamp((it.ph.z || 1) * (k === 'zoomin' ? 1.15 : 1 / 1.15), 1, 6); commit(); render(); }
  else if (k === 'reset') { Object.assign(it.ph, { z: 1, fx: 0.5, fy: 0.5 }); commit(); render(); }
  else if (k === 'replace') pickReplace(); else if (k === 'edit') startEdit(it);
  else act(k);
}
function act(k, b) {
  const pg = cur(); const it = selItem();
  if (k === 'dup' && it) { const c = clone(it); c.id = uidd(it.t[0]); delete c.cell; delete c.tpl; c.x += 12; c.y += 12; pg.items.push(c); ST.sel = c.id; commit(); renderInsp(); render(); return; }
  if (k === 'del' && it) { pg.items.splice(pg.items.indexOf(it), 1); ST.sel = null; ST.adj = null; commit(); refreshLite(); render(); return; }
  if (k === 'front' && it) { pg.items.splice(pg.items.indexOf(it), 1); pg.items.push(it); commit(); render(); return; }
  if (k === 'back' && it) { pg.items.splice(pg.items.indexOf(it), 1); pg.items.unshift(it); commit(); render(); return; }
  if ((k === 'splith' || k === 'splitv') && it && it.t === 'frame') { splitFrame(it, k === 'splith'); return; }
  if (k === 'rmphoto' && it && it.ph) { it.ph = null; commit(); refreshLite(); render(); return; }
  if (k === 'flip' && it) { if (it.ph && it.t === 'frame') it.ph.flip = !it.ph.flip; else it.flip = !it.flip; commit(); render(); return; }
  if (k === 'adjust' && it) { enterAdjust(it); return; }
  if (k === 'replace') { pickReplace(); return; }
  if (k === 'framestyle' && it) { const src = it; const all = b && b.dataset.scope === 'all' ? D.pages : [pg]; let n = 0; for (const p of all) for (const f of p.items) if (f.t === 'frame' && f !== src) { Object.assign(f, { r: src.r, stroke: src.stroke, strokeCol: src.strokeCol, shadow: src.shadow, pad: src.pad, padCol: src.padCol, pol: src.pol, op: src.op }); if (b.dataset.shape) f.shape = src.shape; n++; } commit(); render(); thumbsSoon(); C.toast(`Frame style copied to ${n} frame${n === 1 ? '' : 's'}`); return; }
  if (k === 'textstyle' && it) { let n = 0; for (const p of D.pages) for (const t of p.items) if (t.t === 'text' && t !== it && (t.role || 'x') === (it.role || 'x')) { Object.assign(t, { font: it.font, col: it.col, bold: it.bold, ital: it.ital, upper: it.upper, ls: it.ls, lh: it.lh, shadow: it.shadow }); n++; } commit(); thumbsSoon(); C.toast(n ? `Applied to ${n} matching text${n > 1 ? 's' : ''}` : 'No other matching text to update'); return; }
  if (k === 'addframe') { addFrameAt(null, D.w / 2, D.h / 2); commit(); renderInsp(); render(); return; }
  if (k === 'shuffle') { const fr = pg.items.filter((i) => i.t === 'frame' && i.ph); const phs = fr.map((f) => f.ph); for (let i = phs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [phs[i], phs[j]] = [phs[j], phs[i]]; } fr.forEach((f, i) => { f.ph = { ...phs[i], fx: 0.5, fy: 0.5, z: 1 }; }); commit(); render(); C.toast('Photos shuffled'); return; }
  if (k === 'clearph') { for (const f of pg.items) if (f.t === 'frame') f.ph = null; commit(); refreshLite(); render(); return; }
  if (k === 'spacingall') { for (const p of D.pages) { p.gap = pg.gap; p.margin = pg.margin; reflow(p); } commit(); thumbsSoon(); C.toast('Spacing and margins applied to all pages'); return; }
  if (k === 'bgall') { for (const p of D.pages) p.bg = clone(pg.bg); commit(); thumbsSoon(); C.toast('Background applied to all pages'); return; }
  if (k === 'addphotos') { $('[data-file="photos"]').click(); return; }
  if (k === 'autofill') { openAutofill(); return; }
  if (k === 'unused') { const u = usage(); const rm = D.photos.filter((id) => !u.has(id)); for (const id of rm) removePhoto(id, true); renderPanel(); C.toast(rm.length ? `Removed ${rm.length} unused photo${rm.length > 1 ? 's' : ''}` : 'Every photo is in use'); return; }
  if (k === 'pgadd') { addPage(); return; }
  if (k === 'pgdup') { const c = clone(pg); c.id = uidd('p'); for (const i of c.items) i.id = uidd(i.t[0]); D.pages.splice(D.cur + 1, 0, c); D.cur++; ST.sel = null; commit(); refreshAll(); return; }
  if (k === 'pgdel') { if (D.pages.length === 1) { C.toast('A design needs at least one page'); return; } D.pages.splice(D.cur, 1); D.cur = clamp(D.cur, 0, D.pages.length - 1); ST.sel = null; commit(); refreshAll(); return; }
  if (k === 'pgl' || k === 'pgr') { const j = D.cur + (k === 'pgl' ? -1 : 1); if (j < 0 || j >= D.pages.length) return; const [p] = D.pages.splice(D.cur, 1); D.pages.splice(j, 0, p); D.cur = j; commit(); refreshAll(); return; }
  if (k === 'closesheet') { ST.sheet = false; UI.panel.hidden = true; markTabs(); return; }
  if (k === 'closeinsp') { select(null); return; }
}
function splitFrame(f, side) {
  const pg = cur(); const n = clone(f); n.id = uidd('f'); n.ph = null; const g = pg.gap;
  if (f.cell && !f.rot) { const c = f.cell; if (side) { const w = c[2] / 2; f.cell = [c[0], c[1], w, c[3]]; n.cell = [c[0] + w, c[1], w, c[3]]; } else { const h = c[3] / 2; f.cell = [c[0], c[1], c[2], h]; n.cell = [c[0], c[1] + h, c[2], h]; } reflow(pg); }
  else { delete f.cell; delete n.cell; if (side) { const w = (f.w - g) / 2; f.w = w; n.w = w; n.x = f.x + w + g; } else { const h = (f.h - g) / 2; f.h = h; n.h = h; n.y = f.y + h + g; } }
  pg.items.splice(pg.items.indexOf(f) + 1, 0, n); ST.sel = n.id; commit(); renderInsp(); render();
}
function removePhoto(id, quiet) {
  for (const p of D.pages) { for (const f of p.items) if (f.t === 'frame' && f.ph && f.ph.id === id) f.ph = null; if (p.bg.t === 'photo' && p.bg.ph === id) p.bg = { t: 'color', c: '#ffffff' }; }
  D.photos = D.photos.filter((x) => x !== id); const ph = PH.get(id); if (ph) URL.revokeObjectURL(ph.url); PH.delete(id); idbDel('ph:' + id);
  ST.hist = []; ST.fut = []; ST.last = snap(); markHist(); scheduleSave(); if (!quiet) { renderPanel(); renderInsp(); render(); thumbsSoon(); }
}
function applyStyle(s, pages) {
  for (const pg of pages) {
    pg.style = s.k; pg.bg = clone(s.bg); pg.gap = s.gap; pg.margin = s.margin;
    for (const it of pg.items) {
      if (it.t === 'frame') { const pol = it.pol && !s.pol && LMAP[pg.layout] && LMAP[pg.layout].cells.some((c) => c[6]); Object.assign(it, { r: s.r || 0, stroke: s.stroke || 0, strokeCol: s.strokeCol || '#ffffff', shadow: s.shadow || 0, pad: s.pad || 0, padCol: s.padCol || '#ffffff', pol: !!s.pol }); if (pol) { it.pad = Math.max(it.pad, 7 * sc()); it.pol = true; it.shadow = Math.max(it.shadow, 0.55); } if (it.ph) it.ph.flt = s.flt || 'none'; }
      else if (it.t === 'text') { const R = TROLE[it.role]; const head = R ? !!R.head : it.size > 20; it.font = R && R.font === 'hand' ? (s.head === 'script' ? 'script' : 'hand') : head ? s.head : s.body; const onPhoto = (it.role === 'cover' || it.role === 'coversub') && pg.items.some((f) => f.t === 'frame' && f.ph); it.col = onPhoto ? '#ffffff' : s.ink; }
      else if (it.t === 'gfx') it.col = s.accent;
    }
    reflow(pg);
  }
}
function setBg(bg) { const pg = cur(); pg.bg = bg; commit(); render(); renderPanel(); }
function addText(k) {
  const s = styleOf(cur()); const P = { heading: ['title', 34], sub: ['sub', 12], body: ['body', 11], caption: ['caption', 11], script: ['hand', 28], quote: ['quote', 22], date: ['coversub', 12], label: ['sub', 10] }[k] || ['caption', 12];
  const t = textFor(P[0], s); delete t.tpl; t.size = +(P[1] * sc()).toFixed(1);
  if (k === 'heading') t.text = 'Add a heading'; if (k === 'sub') t.text = 'Add a subheading'; if (k === 'script') { t.font = 'script'; t.text = 'Summer memories'; }
  if (k === 'date') { t.text = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); t.shadow = false; t.font = 'type'; t.upper = false; t.ls = 0.05; }
  if (k === 'label') { t.text = 'LABEL'; t.bgc = s.accent; t.col = isDark(s.accent) ? '#ffffff' : '#111111'; t.bold = true; t.ls = 0.15; }
  if (k === 'heading') t.font = s.head;
  const w = Math.min(D.w * 0.8, k === 'body' ? D.w * 0.6 : D.w * 0.8); t.w = w; t.x = (D.w - w) / 2; t.y = D.h * 0.42; t.shadow = false; t.col = s.ink;
  if (k === 'label') t.col = isDark(s.accent) ? '#ffffff' : '#111111';
  cur().items.push(t); ST.sel = t.id; commit(); renderInsp(); render(); setTimeout(() => startEdit(t), 30);
}
function isDark(hex) { const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) < 140; }
function addGfx(k) { const G = GMAP[k]; const s = styleOf(cur()); const base = Math.min(D.w, D.h) * (G.ar >= 3 ? 0.5 : 0.2); const w = G.ar >= 1 ? base : base * G.ar, h = G.ar >= 1 ? base / G.ar : base; const g = { t: 'gfx', id: uidd('g'), g: k, x: (D.w - w) / 2, y: (D.h - h) / 2, w, h, rot: 0, col: s.accent, op: G.op, flip: false }; if (G.s) g.sw = +(G.ar >= 3 ? Math.max(1, h * 0.25) : Math.max(1, Math.min(w, h) * 0.05)).toFixed(1); cur().items.push(g); ST.sel = g.id; commit(); renderInsp(); render(); }
function addEmoji(ch) { const s = Math.min(D.w, D.h) * 0.14; const g = { t: 'emoji', id: uidd('e'), ch, x: (D.w - s) / 2, y: (D.h - s) / 2, w: s, h: s, rot: 0, op: 1 }; cur().items.push(g); ST.sel = g.id; commit(); renderInsp(); render(); }
function addPage() {
  const pg = cur(); const n = blankPage(pg.style, pg); n.style = pg.style; D.pages.splice(D.cur + 1, 0, n); const fs = frameStyle(pg);
  applyLayout(n, pg.layout && LMAP[pg.layout] && LMAP[pg.layout].cells.length ? pg.layout : '4g', []);
  for (const f of n.items) if (f.t === 'frame' && !f.pol) Object.assign(f, fs);
  D.cur++; ST.sel = null; commit(); refreshAll();
}
function goPage(i) { if (i < 0 || i >= D.pages.length) return; endEdit(); exitAdjust(true); D.cur = i; ST.sel = null; renderInsp(); renderPagesMark(); render(); if (ST.tab === 'layouts' || ST.tab === 'bg') renderPanel(); const el = UI.pages.querySelector(`[data-pg="${i}"]`); if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }

/* ---------- Left panels ---------- */
function layoutSvg(L, cur) {
  const W = 60, H = Math.round(60 * D.h / D.w); const m = 3, g = 2; let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  for (const c of L.cells) { const x = m + c[0] * (W - 2 * m) + g / 2, y = m + c[1] * (H - 2 * m) + g / 2, w = c[2] * (W - 2 * m) - g, h = c[3] * (H - 2 * m) - g; const sh = c[4]; const tf = c[5] ? ` transform="rotate(${c[5]} ${x + w / 2} ${y + h / 2})"` : ''; const fill = 'fill="var(--accent)" fill-opacity=".38"';
    if (sh === 'circle') s += `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 2}" ${fill}/>`;
    else if (sh === 'arch') s += `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z" ${fill}/>`;
    else if (c[6]) s += `<g${tf}><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="var(--sep-strong)" stroke-width=".5"/><rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 6}" ${fill}/></g>`;
    else s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" ${fill}${tf}/>`; }
  for (const [role, r] of (L.texts || [])) { const x = m + r[0] * (W - 2 * m), y = m + r[1] * (H - 2 * m), w = r[2] * (W - 2 * m), h = Math.max(1.4, r[3] * (H - 2 * m) * 0.45); const big = role === 'cover' || role === 'title' || role === 'quote'; s += `<rect x="${x + w * (big ? 0.15 : 0.25)}" y="${y + r[3] * (H - 2 * m) * 0.3}" width="${w * (big ? 0.7 : 0.5)}" height="${big ? h : h * 0.6}" rx=".8" fill="${role === 'cover' || role === 'coversub' ? '#fff' : 'var(--label-2)'}" fill-opacity=".8"/>`; }
  return s + '</svg>';
}
function renderPanel() {
  if (!UI) return; markTabs(); const t = ST.tab; let h = `<div class="ds-close-sheet"><span>${TABS.find((x) => x[0] === t)[1]}</span><button data-act="closesheet">Done</button></div>`;
  if (t === 'layouts') {
    const chips = [['all', 'All'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 to 6'], ['7', '7+'], ['txt', 'With text']];
    const fit = (L) => { const n = L.cells.length; const f = ST.lf; if (f === 'all') return true; if (f === 'txt') return !!(L.texts && L.texts.length); if (f === '5') return n === 5 || n === 6; if (f === '7') return n >= 7; return n === +f; };
    h += `<h3>Layouts</h3><p class="hint">Choose a layout for this page. Photos already on the page move into the new frames.</p><div class="ds-chips">${chips.map(([k, n]) => `<button class="ds-chip" data-lf="${k}" aria-pressed="${ST.lf === k}">${n}</button>`).join('')}</div>`;
    for (const cat of ['Single', 'Grid', 'Collage', 'Story']) { const ls = LAYOUTS.filter((L) => L.cat === cat && fit(L)); if (!ls.length) continue; h += `<h3>${cat === 'Single' ? 'Single photo' : cat === 'Story' ? 'Story and creative' : cat}</h3><div class="ds-lgrid">${ls.map((L) => `<button class="ds-lcard" data-lay="${L.k}" aria-current="${cur().layout === L.k}" title="${esc(L.n)}">${layoutSvg(L)}<span>${esc(L.n)}</span></button>`).join('')}</div>`; }
  } else if (t === 'photos') {
    const u = usage(); const unused = D.photos.filter((id) => !u.has(id)).length;
    h += `<h3>Photos</h3><div class="ds-btns"><button class="ds-b pri" data-act="addphotos">${ic('plus')} Add photos</button><button class="ds-b" data-act="autofill" ${D.photos.length ? '' : 'disabled'}>${ic('magic')} Auto-fill</button></div>`;
    h += `<div class="ds-drop">Drop photos here or anywhere on the page.<br>Drag a photo into a frame, or tap it to fill the next empty frame.</div>`;
    if (D.photos.length) { h += `<p class="hint">${D.photos.length} photo${D.photos.length > 1 ? 's' : ''}${unused ? `, ${unused} not placed yet` : ', all placed'}. Drag a photo from a frame back here to take it out.</p><div class="ds-pgrid">${D.photos.map((id) => { const p = PH.get(id); if (!p) return ''; const n = u.get(id) || 0; return `<div class="ds-ph" data-ph="${id}" title="${esc(p.name)}"><img src="${p.url}" alt="" loading="lazy" draggable="false">${n ? `<span class="used">${n > 1 ? n : '✓'}</span>` : ''}<button class="x" data-phx="${id}" aria-label="Remove photo">${C.icon('close')}</button></div>`; }).join('')}</div>`; if (unused < D.photos.length) h += `<div class="ds-btns" style="margin-top:12px"><button class="ds-b" data-act="unused">${C.icon('trash')} Remove unused</button></div>`; }
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
      <button data-tpre="label"><span style="background:${s.accent};color:${isDark(s.accent) ? '#fff' : '#111'};font:700 11px ${f(s.body)};letter-spacing:.15em;padding:3px 8px;border-radius:5px">LABEL</span></button></div>
      <p class="hint">Double-click any text on the page to type over it. Fonts and colours follow the page style until you change them.</p>`;
  } else if (t === 'gfx') {
    const cats = ['all', ...new Set(GFX.map((g) => g.cat))]; const list = GFX.filter((g) => ST.gfxCat === 'all' || g.cat === ST.gfxCat);
    h += `<h3>Graphics</h3><div class="ds-chips">${cats.map((c) => `<button class="ds-chip" data-gcat="${c}" aria-pressed="${ST.gfxCat === c}">${c === 'all' ? 'All' : c}</button>`).join('')}</div><div class="ds-ggrid">${list.map((g) => { const vb = g.ar >= 1 ? `0 ${50 - 50 / Math.min(g.ar, 3)} 100 ${100 / Math.min(g.ar, 3)}` : '0 0 100 100'; return `<button class="ds-g" data-gfx="${g.k}" title="${esc(g.n)}"><svg viewBox="${vb}" preserveAspectRatio="none" style="${g.ar >= 3 ? 'height:30%' : ''}"><path d="${g.d}" ${g.s ? 'fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:2px"' : `fill="currentColor" ${g.ev ? 'fill-rule="evenodd"' : ''} fill-opacity="${g.op}"`}/></svg></button>`; }).join('')}</div><h3>Stickers</h3><div class="ds-emo">${EMOJI.map((e) => `<button data-emo="${e}" aria-label="Sticker ${e}">${e}</button>`).join('')}</div>`;
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
}

/* ---------- Right panel (inspector) ---------- */
const row = (label, inner) => `<div class="ds-row"><label>${label}</label>${inner}</div>`;
const rng2 = (p, v, min, max, step, kind = 'p') => `<input type="range" data-${kind}="${p}" min="${min}" max="${max}" step="${step}" value="${v}"><span class="val">${kind === 'p' ? fmtVal(p, v) : ''}</span>`;
const swatches = (p, curc) => `<div class="ds-sw">${PALETTE.map((c) => `<button data-col="${c}" data-colp="${p}" style="background:${c}" aria-label="${c}" aria-pressed="${curc === c}"></button>`).join('')}</div>`;
function renderInsp() {
  if (!UI) return; const it = selItem(); const pg = cur(); let h = '';
  if (isNarrow()) { UI.insp.hidden = !it; if (!it) { UI.insp.innerHTML = ''; return; } }
  const head = (t) => `<div class="ds-close-sheet"><span>${t}</span><button data-act="closeinsp">Done</button></div>`;
  if (!it) {
    const nFr = pg.items.filter((i) => i.t === 'frame').length, nPh = pg.items.filter((i) => i.t === 'frame' && i.ph).length;
    h += `<h3>Page ${D.cur + 1} of ${D.pages.length}</h3><p class="hint">${nFr ? `${nPh} of ${nFr} frame${nFr > 1 ? 's' : ''} filled. ` : ''}Drag the small handles between photos to resize the grid. Drag a photo onto another to swap them. Double-click a photo to pan and zoom it.</p>`;
    h += row('Spacing', `<input type="range" data-pp="gap" min="0" max="${Math.round(20 * PT)}" step="0.5" value="${pg.gap}"><span class="val">${Math.round(pg.gap / PT * 10) / 10} mm</span>`);
    h += row('Margin', `<input type="range" data-pp="margin" min="0" max="${Math.round(30 * PT)}" step="0.5" value="${pg.margin}"><span class="val">${Math.round(pg.margin / PT * 10) / 10} mm</span>`);
    h += `<div class="ds-btns"><button class="ds-b" data-act="spacingall">Same spacing on all pages</button></div>`;
    h += `<h3>Page</h3><div class="ds-btns"><button class="ds-b" data-act="addframe">${ic('plus')} Add frame</button><button class="ds-b" data-act="shuffle" ${nPh > 1 ? '' : 'disabled'}>${ic('shuffle')} Shuffle photos</button><button class="ds-b" data-act="clearph" ${nPh ? '' : 'disabled'}>Clear photos</button><button class="ds-b" data-act="autofill" ${D.photos.length ? '' : 'disabled'}>${ic('magic')} Auto-fill</button></div>`;
    h += `<h3>Shortcuts</h3><p class="hint">Ctrl+Z undo, Ctrl+D duplicate, Delete removes, arrow keys nudge (Shift for 10), Enter edits, Page Up and Down change page, Ctrl and scroll zooms.</p>`;
  } else if (it.t === 'frame') {
    h += head('Photo frame');
    if (it.ph && PH.get(it.ph.id)) {
      const p = PH.get(it.ph.id);
      h += `<h3>Photo</h3><div class="ds-btns"><button class="ds-b${ST.adj === it.id ? ' on' : ''}" data-act="adjust">${ic('adjust')} Adjust position</button><button class="ds-b" data-act="flip">${C.icon('fliph')} Flip</button><button class="ds-b" data-act="replace">${C.icon('photo')} Replace</button><button class="ds-b danger" data-act="rmphoto">Remove</button></div>`;
      h += row('Zoom', `<input type="range" data-php="z" min="1" max="4" step="0.01" value="${it.ph.z || 1}">`);
      h += `<h3>Photo look</h3><div class="ds-flt">${FILTERS.map(([k, n, css]) => `<button data-flt="${k}" aria-pressed="${(it.ph.flt || 'none') === k}"><img src="${p.url}" style="filter:${css}" alt="">${n}</button>`).join('')}</div>`;
    } else h += `<h3>Empty frame</h3><p class="hint">Drag a photo here from Photos, drop a file on it, or choose one.</p><div class="ds-btns"><button class="ds-b pri" data-act="replace">${C.icon('photo')} Choose photo</button></div>`;
    h += `<h3>Shape</h3><div class="ds-shapes">${Object.entries(SHAPES).map(([k, v]) => `<button data-shape="${k}" aria-pressed="${(it.shape || 'rect') === k}" title="${v[0]}"><svg viewBox="-4 -4 108 108">${k === 'rect' ? '<rect width="100" height="100" rx="6"/>' : k === 'circle' || k === 'oval' ? `<ellipse cx="50" cy="50" rx="${k === 'circle' ? 50 : 50}" ry="${k === 'circle' ? 50 : 34}"/>` : k === 'pill' ? '<rect y="20" width="100" height="60" rx="30"/>' : `<path d="${v[1]}"/>`}</svg></button>`).join('').replace(/<svg([^>]*)>/g, '<svg$1 fill="currentColor" fill-opacity=".45" stroke="currentColor" stroke-width="5">')}</div>`;
    if (!it.shape || it.shape === 'rect') h += row('Corners', rng2('r', it.r || 0, 0, 60, 0.5));
    h += `<h3>Border and print frame</h3>` + row('Border', rng2('stroke', it.stroke || 0, 0, 24, 0.5)) + row('Border colour', `<input type="color" data-p="strokeCol" value="${it.strokeCol || '#ffffff'}">`) + swatches('strokeCol', it.strokeCol);
    h += row('Mat', rng2('pad', it.pad || 0, 0, 40, 0.5)) + row('Mat colour', `<input type="color" data-p="padCol" value="${it.padCol || '#ffffff'}">`) + `<label class="ds-chk"><input type="checkbox" data-togc="pol" ${it.pol ? 'checked' : ''}> Instant print style (deeper bottom edge)</label>`;
    h += row('Shadow', rng2('shadow', it.shadow || 0, 0, 1, 0.05)) + row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1));
    h += `<div class="ds-btns"><button class="ds-b" data-act="framestyle" data-scope="page">Copy style to this page</button><button class="ds-b" data-act="framestyle" data-scope="all">Copy style to all pages</button></div>`;
    h += `<h3>Arrange</h3><div class="ds-btns"><button class="ds-b" data-act="splith">${ic('splith')} Split</button><button class="ds-b" data-act="splitv">${ic('splitv')} Split</button><button class="ds-b" data-act="front">${C.icon('front')} Front</button><button class="ds-b" data-act="back">${C.icon('back')} Back</button><button class="ds-b" data-act="dup">${C.icon('dup')} Duplicate</button><button class="ds-b danger" data-act="del">${C.icon('trash')} Delete</button></div>`;
  } else if (it.t === 'text') {
    h += head('Text') + `<h3>Text</h3><textarea class="ds-ta2" data-p="text">${esc(it.text)}</textarea>`;
    h += row('Font', `<select data-p="font">${Object.entries(FONTS).map(([k, v]) => `<option value="${k}" ${it.font === k ? 'selected' : ''} style="font-family:${esc(v[1])}">${v[0]}</option>`).join('')}</select>`);
    h += row('Size', rng2('size', it.size, 4, 160, 0.5));
    h += `<div class="ds-row"><label>Style</label><div class="ds-seg"><button data-tog="bold" aria-pressed="${!!it.bold}" title="Bold"><b>B</b></button><button data-tog="ital" aria-pressed="${!!it.ital}" title="Italic"><i>I</i></button><button data-tog="upper" aria-pressed="${!!it.upper}" title="Capitals">AA</button><button data-tog="shadow" aria-pressed="${!!it.shadow}" title="Shadow">S</button></div></div>`;
    h += `<div class="ds-row"><label>Align</label><div class="ds-seg">${[['left', 'tal'], ['center', 'tac'], ['right', 'tar']].map(([k, i]) => `<button data-align="${k}" aria-pressed="${it.align === k}">${C.icon(i)}</button>`).join('')}</div></div>`;
    h += row('Colour', `<input type="color" data-p="col" value="${it.col || '#000000'}">`) + swatches('col', it.col);
    h += row('Spacing', rng2('ls', it.ls || 0, -0.05, 0.6, 0.01)) + row('Line height', rng2('lh', it.lh || 1.2, 0.8, 2.4, 0.05));
    h += `<label class="ds-chk"><input type="checkbox" data-togc="bgc" ${it.bgc ? 'checked' : ''}> Highlight behind text</label>${it.bgc ? row('Highlight', `<input type="color" data-p="bgc" value="${it.bgc}">`) : ''}`;
    h += row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1));
    h += `<div class="ds-btns"><button class="ds-b" data-act="textstyle">Match similar text</button></div><h3>Arrange</h3><div class="ds-btns"><button class="ds-b" data-act="front">${C.icon('front')} Front</button><button class="ds-b" data-act="back">${C.icon('back')} Back</button><button class="ds-b" data-act="dup">${C.icon('dup')} Duplicate</button><button class="ds-b danger" data-act="del">${C.icon('trash')} Delete</button></div>`;
  } else {
    const G = GMAP[it.g];
    h += head(it.t === 'emoji' ? 'Sticker' : 'Graphic') + `<h3>${it.t === 'emoji' ? 'Sticker' : esc(G ? G.n : 'Graphic')}</h3>`;
    if (it.t === 'gfx') { h += row('Colour', `<input type="color" data-p="col" value="${it.col || '#000000'}">`) + swatches('col', it.col); if (G && G.s) h += row('Line weight', rng2('sw', it.sw || 2, 0.3, 14, 0.1)); }
    h += row('Opacity', rng2('op', it.op ?? 1, 0.1, 1, 0.05)) + row('Rotation', rng2('rot', it.rot || 0, -180, 180, 1));
    h += `<h3>Arrange</h3><div class="ds-btns"><button class="ds-b" data-act="flip">${C.icon('fliph')} Flip</button><button class="ds-b" data-act="front">${C.icon('front')} Front</button><button class="ds-b" data-act="back">${C.icon('back')} Back</button><button class="ds-b" data-act="dup">${C.icon('dup')} Duplicate</button><button class="ds-b danger" data-act="del">${C.icon('trash')} Delete</button></div>`;
  }
  UI.insp.innerHTML = h;
  for (const c of $$('[data-togc]', UI.insp)) c.addEventListener('change', () => { const t = selItem(); if (!t) return; const k = c.dataset.togc; if (k === 'bgc') t.bgc = c.checked ? (styleOf(cur()).accent || '#ffd23f') : null; else t[k] = c.checked; if (k === 'pol' && c.checked && !(t.pad > 0)) { t.pad = 7 * sc(); t.padCol = t.padCol || '#ffffff'; } commit(); renderInsp(); render(); });
}

/* ---------- Bottom page strip ---------- */
function renderPages() {
  if (!UI) return; const H = 64; const W = Math.round(H * D.w / D.h);
  UI.pages.innerHTML = D.pages.map((p, i) => `<button class="ds-pg" data-pg="${i}" aria-current="${i === D.cur}"><canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px"></canvas>${i + 1}</button>`).join('') + `<button class="ds-pgadd" data-act="pgadd" title="Add a page with the same layout and style">${ic('plus')}</button><span class="ds-sp"></span><div class="ds-pgact"><button data-act="pgl" title="Move page left" ${D.cur ? '' : 'disabled'}>${ic('left')}</button><button data-act="pgr" title="Move page right" ${D.cur < D.pages.length - 1 ? '' : 'disabled'}>${ic('right')}</button><button data-act="pgdup" title="Duplicate page">${C.icon('dup')}</button><button data-act="pgdel" title="Delete page">${C.icon('trash')}</button></div>`;
  thumbsNow();
}
function renderPagesMark() { for (const b of $$('.ds-pg', UI.pages)) b.setAttribute('aria-current', String(+b.dataset.pg === D.cur)); const l = $('[data-act="pgl"]', UI.pages), r = $('[data-act="pgr"]', UI.pages); if (l) l.disabled = !D.cur; if (r) r.disabled = D.cur >= D.pages.length - 1; }
let thT = 0;
function thumbsSoon() { clearTimeout(thT); thT = setTimeout(() => { if (!UI) return; if ($$('.ds-pg', UI.pages).length !== D.pages.length) renderPages(); else { thumbsNow(); renderPagesMark(); } }, 250); }
function thumbsNow() { if (!UI) return; for (const b of $$('.ds-pg', UI.pages)) { const pg = D.pages[+b.dataset.pg]; if (!pg) continue; const c = b.querySelector('canvas'); const x = c.getContext('2d'); const k = c.width / D.w; x.setTransform(k, 0, 0, k, 0, 0); drawPage(x, pg, { k, ed: true, thumb: true }); } }

/* ---------- Menus and modals ---------- */
let menuEl = null;
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener('pointerdown', menuOut, true); } }
function menuOut(e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }
function menu(anchor, items) {
  closeMenu(); const m = document.createElement('div'); m.className = 'ds-menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button role="menuitem" data-mi="${i}" ${it.cur ? 'aria-current="true"' : ''}>${it.cur ? C.icon('check') : '<span style="width:18px"></span>'}${esc(it.label)}</button>`).join('');
  document.body.appendChild(m); const r = anchor.getBoundingClientRect(); const mw = m.offsetWidth; m.style.left = clamp(r.left, 8, innerWidth - mw - 8) + 'px'; m.style.top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8) + 'px';
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-mi]'); if (!b) return; const it = items[+b.dataset.mi]; closeMenu(); it.run(); });
  menuEl = m; setTimeout(() => document.addEventListener('pointerdown', menuOut, true), 0);
}
function sizeMenu(anchor) { menu(anchor, [...SIZES.map(([k, n, w, h]) => ({ label: `${n}  (${w} × ${h} mm)`, cur: D.size === k, run: () => setSize(k, w * PT, h * PT) })), '-', { label: 'Custom size…', cur: D.size === 'custom', run: customSize }]); }
function setSize(k, W, H) {
  const sx = W / D.w, sy = H / D.h, s = Math.sqrt(sx * sy);
  for (const pg of D.pages) { for (const it of pg.items) { if (it.cell) continue; it.x *= sx; it.y *= sy; it.w *= sx; if (it.t === 'text') it.size = +(it.size * s).toFixed(1); else if (it.t === 'emoji') { it.w = it.h * s; it.h = it.h * s; } else it.h *= sy; } for (const it of pg.items) if (it.cell && it.t === 'text') it.size = +(it.size * s).toFixed(1); pg.gap *= s; pg.margin *= s; }
  D.size = k; D.w = W; D.h = H; for (const pg of D.pages) reflow(pg); ST.fit = true; commit(); refreshAll();
}
function customSize() {
  const m = modal(`<h2>Custom page size</h2><p class="sub">In millimetres. Frames and text scale to the new size.</p><div class="ds-row"><label>Width</label><input type="number" data-cw value="${Math.round(D.w / PT)}" min="30" max="2000"></div><div class="ds-row"><label>Height</label><input type="number" data-ch value="${Math.round(D.h / PT)}" min="30" max="2000"></div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Apply</button></div>`);
  m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-ok]').onclick = () => { const w = clamp(num(m.querySelector('[data-cw]').value), 30, 2000), h = clamp(num(m.querySelector('[data-ch]').value), 30, 2000); closeModal(); setSize('custom', w * PT, h * PT); };
}
function moreMenu(anchor) {
  menu(anchor, [
    { label: 'New design', run: () => moreMenuNew() },
    { label: 'Save project file…', run: saveProject }, { label: 'Open project file…', run: () => $('[data-file="project"]').click() }, '-',
    { label: 'Fit page to screen', run: () => { ST.fit = true; paint(); } }, { label: 'Actual size', run: () => setZoom(96 / 72) }
  ]);
}
function moreMenuNew() { if (D.photos.length === 0 && D.pages.length === 1 && !D.pages[0].items.some((i) => i.ph)) { C.toast('This design is already empty'); return; } confirmM('Start a new design?', 'The current design and its photos will be cleared from this device. Save a project file first if you want to keep it.', 'Start new', () => { for (const id of D.photos) { const p = PH.get(id); if (p) URL.revokeObjectURL(p.url); idbDel('ph:' + id); } PH.clear(); newDoc(); ST.sel = null; ST.hist = []; ST.fut = []; ST.last = snap(); ST.fit = true; scheduleSave(); refreshAll(); markHist(); }); }
function modal(html) { closeModal(); const m = document.createElement('div'); m.className = 'ds-modal'; m.innerHTML = `<div class="ds-mbox" role="dialog" aria-modal="true">${html}</div>`; m.addEventListener('pointerdown', (e) => { if (e.target === m && !m.dataset.busy) closeModal(); }); document.body.appendChild(m); return m.firstElementChild; }
function closeModal() { const m = document.querySelector('.ds-modal'); if (m && !m.dataset.busy) m.remove(); }
function confirmM(t, s, ok, run) { const m = modal(`<h2>${esc(t)}</h2><p class="sub">${esc(s)}</p><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>${esc(ok)}</button></div>`); m.querySelector('[data-x]').onclick = closeModal; m.querySelector('[data-ok]').onclick = () => { closeModal(); run(); }; }

/* Auto-fill */
function openAutofill() {
  const u = usage(); const unused = D.photos.filter((id) => !u.has(id)); const pool = unused.length ? unused : D.photos.slice();
  const m = modal(`<h2>Auto-fill</h2><p class="sub">${unused.length ? `${unused.length} photo${unused.length > 1 ? 's are' : ' is'} not placed yet.` : 'Every photo is placed. Auto-fill will place them all again.'} Empty frames are filled first, then new pages are added in the current style.</p>
    <div class="flabel" style="font-size:12px;font-weight:600;color:var(--label-2)">New pages use</div>
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
    let key = mode === 'same' && base.layout && LMAP[base.layout].cells.length > 0 ? base.layout : null;
    if (!key) { const rem = queue.length; let tries = 0; do { key = MIX[mi++ % MIX.length]; tries++; } while (LMAP[key].cells.length > rem && tries < MIX.length); if (LMAP[key].cells.length > rem) key = rem === 1 ? 'one' : rem === 2 ? '2h' : rem === 3 ? 'l2r' : rem === 4 ? '4g' : 'm5'; }
    const n = blankPage(base.style, base); D.pages.splice(at++, 0, n); applyLayout(n, key, []); for (const f of n.items) if (f.t === 'frame' && !f.pol) Object.assign(f, fs);
    fill(n); pagesAdded++; if (pagesAdded > 400) break;
  }
  commit(); refreshAll(); C.toast(`Placed ${placed} photo${placed === 1 ? '' : 's'}${pagesAdded ? ` and added ${pagesAdded} page${pagesAdded > 1 ? 's' : ''}` : ''}`);
}

/* Project files */
async function saveProject() {
  const t = C.toast('Packing project', { spin: true, sticky: true });
  const photos = []; for (const id of D.photos) { const p = PH.get(id); if (!p) continue; photos.push({ id, name: p.name, data: await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(p.blob); }) }); }
  const blob = new Blob([JSON.stringify({ kind: 'pdfmate-design', v: 1, doc: D, photos })], { type: 'application/json' }); t.remove();
  C.downloadBlob(blob, (D.name || 'Design').replace(/[\\/:*?"<>|]/g, '') + '.pdfmate-design.json'); C.toast('Project saved. Open it here later to keep editing');
}
async function openProject(file) {
  try {
    const o = JSON.parse(await file.text()); if (o.kind !== 'pdfmate-design' || !o.doc) throw new Error('kind');
    const t = C.toast('Opening project', { spin: true, sticky: true });
    for (const id of D.photos) { const p = PH.get(id); if (p) URL.revokeObjectURL(p.url); idbDel('ph:' + id); } PH.clear();
    for (const p of o.photos || []) { const blob = await (await fetch(p.data)).blob(); await loadPhoto({ id: p.id, name: p.name, blob }); idbPut('ph:' + p.id, { id: p.id, name: p.name, blob }); }
    D = o.doc; D.photos = (D.photos || []).filter((id) => PH.has(id)); D.cur = 0; ST.sel = null; ST.hist = []; ST.fut = []; ST.last = snap(); ST.fit = true; t.remove(); scheduleSave();
    $('[data-a="name"]').value = D.name; refreshAll(); markHist(); C.toast(`Opened ${D.name}`);
  } catch (e) { C.toast('That file is not a PDF Mate design project', { err: true }); }
}

/* ---------- Export ---------- */
function openExport() {
  endEdit(); exitAdjust(true);
  const st = Object.assign({ pages: 'all', dpi: 300, bleed: 0, marks: false, fmt: 'pdf' }, (() => { try { return JSON.parse(localStorage.getItem('pdfmate.dsExport')) || {}; } catch (e) { return {}; } })());
  const empty = D.pages.reduce((n, p) => n + p.items.filter((i) => i.t === 'frame' && !i.ph).length, 0);
  const m = modal(`<h2>Export</h2><p class="sub">${D.pages.length} page${D.pages.length > 1 ? 's' : ''}, ${esc(($('[data-a="size"]').textContent || '').replace(' ▾', ''))}.${empty ? ` ${empty} empty frame${empty > 1 ? 's' : ''} will be left out.` : ''}</p>
    <div class="flabel" style="font-size:12px;font-weight:600;color:var(--label-2)">Pages</div><div class="ds-opt" data-g="pages"><button data-v="all">All pages</button><button data-v="cur">This page only</button></div>
    <div class="flabel" style="font-size:12px;font-weight:600;color:var(--label-2)">Quality</div><div class="ds-opt" data-g="dpi"><button data-v="300">Print<small>300 dpi, sharp on paper</small></button><button data-v="200">High<small>200 dpi, smaller file</small></button><button data-v="150">Standard<small>150 dpi, good for sharing</small></button><button data-v="96">Screen<small>96 dpi, email and slides</small></button></div>
    <div class="flabel" style="font-size:12px;font-weight:600;color:var(--label-2)">Print shop options</div><div class="ds-opt" data-g="bleed"><button data-v="0">No bleed<small>Home and office printing</small></button><button data-v="3">3 mm bleed<small>Professional printing</small></button><button data-v="5">5 mm bleed<small>Photo books</small></button></div>
    <label class="ds-chk"><input type="checkbox" data-marks ${st.marks ? 'checked' : ''}> Crop marks (with bleed)</label>
    <div class="ds-prog" hidden><i></i></div>
    <div class="acts"><button class="btn" data-go="img">Save page as JPG</button><button class="btn" data-go="dl">${C.icon('download')} Download PDF</button><button class="btn" data-go="print">${C.icon('print')} Print</button><button class="btn primary" data-go="open">Open in PDF Mate</button></div>`);
  const mark = () => { for (const g of m.querySelectorAll('[data-g]')) for (const b of g.querySelectorAll('[data-v]')) b.setAttribute('aria-pressed', String(String(st[g.dataset.g]) === b.dataset.v)); };
  m.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-v]'); if (b) { const g = b.closest('[data-g]').dataset.g; st[g] = g === 'pages' ? b.dataset.v : +b.dataset.v; mark(); return; }
    const go = e.target.closest('[data-go]'); if (!go) return;
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
async function buildPdf(o, onProg) {
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
export const __ds = { get D() { return D; }, ST, PH, LAYOUTS, STYLES, applyLayout, applyStyle, autofill, addPhotoFiles, buildPdf, gutters, reflow, render: () => paint(), setSize, commit, undo, redo, select, act, newDoc: () => { newDoc(); refreshAll(); } };
