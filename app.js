// Meridian PDF Mate by Tango Juliet Dev. Offline PDF fill, sign, mark up and page editing.
import * as pdfjsLib from './vendor/pdf.min.mjs';

const VERSION = '2.6.1';
const PL = window.PDFLib;
const base = new URL('./vendor/', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
const PDFJS_OPTS = { cMapUrl: base + 'cmaps/', cMapPacked: true, standardFontDataUrl: base + 'standard_fonts/', wasmUrl: base + 'wasm/', iccUrl: base + 'iccs/', isEvalSupported: false };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const SVGNS = 'http://www.w3.org/2000/svg';
let uidN = 0;
const uid = (p = 'x') => p + Date.now().toString(36) + (uidN++).toString(36);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Icons (SF-style strokes) ---------- */
const IC = {
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  paste: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h4"/>',
  cut: '<circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M7.8 16 17 4M16.2 16 7 4"/>',
  front: '<rect x="9" y="9" width="11" height="11" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
  back: '<rect x="4" y="4" width="11" height="11" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M9 15v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-3"/>',
  al: '<path d="M4 3v18"/><rect x="7" y="6" width="12" height="4" rx="1"/><rect x="7" y="14" width="7" height="4" rx="1"/>',
  ac: '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  ar: '<path d="M20 3v18"/><rect x="5" y="6" width="12" height="4" rx="1"/><rect x="10" y="14" width="7" height="4" rx="1"/>',
  at: '<path d="M3 4h18"/><rect x="6" y="7" width="4" height="12" rx="1"/><rect x="14" y="7" width="4" height="7" rx="1"/>',
  am: '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
  ab: '<path d="M3 20h18"/><rect x="6" y="5" width="4" height="12" rx="1"/><rect x="14" y="10" width="4" height="7" rx="1"/>',
  kbd: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7 14h10"/>',
  tour: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  selall: '<rect x="4" y="4" width="16" height="16" rx="2.5" stroke-dasharray="3 2.4"/><path d="m9 12 2 2 4-4"/>',
  sidebar: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9.5 4v16"/><path d="M5.5 8h2M5.5 11h2"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  open: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v7M8.5 14.5h7"/>',
  more: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.6"/>',
  share: '<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
  zout: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
  select: '<path d="M5 3.5 18.5 10l-6 1.8-2.3 6.2z"/><path d="m13 12 5 5"/>',
  text: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  white: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h6M7 14h10" stroke-dasharray="2 2.2"/>',
  hl: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  rect: '<rect x="4" y="5" width="16" height="14" rx="1.5"/>',
  line: '<path d="M5 19 19 5"/>',
  arrow: '<path d="M5 19 19 5"/><path d="M10 5h9v9"/>',
  pen: '<path d="M3 20c3.5 0 4.5-3 6.5-7S14 5 16.5 5 19 8 17 11s-3 4-1 6 4 1 5 0"/>',
  tick: '<path d="m4.5 12.5 5 5L20 7"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  sign: '<path d="M3 16c2.5-.5 3.5-8 6-8s1 8 3.5 8 2.5-4 4-4 1.5 3 4.5 2.5"/><path d="M3 20.5h18"/>',
  rotl: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 3.5v4.8h4.8"/>',
  rotr: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 3.5v4.8h-4.8"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  blank: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="m6 7 1 13h10l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h4.5"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-8.5 8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  offline: '<path d="M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 10.7 5M5 12.6a10 10 0 0 1 5.2-2.6M19 12.6a10 10 0 0 0-1.9-1.4M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/>',
  dup: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>',
  theme: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
  merge: '<path d="M8 3v4a4 4 0 0 0 4 4 4 4 0 0 1 4 4v6"/><path d="M16 3v4a4 4 0 0 1-4 4"/><path d="m13 18 3 3 3-3"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 7 3 3"/>',
  download: '<path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>',
  extract: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 17v-6M9.5 13.5 12 11l2.5 2.5"/>',
  stamp: '<path d="M9 12.5V9.8a3 3 0 1 1 6 0v2.7"/><path d="M4.5 15.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V18h-15z"/><path d="M5 21h14"/>',
  install: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8v8M8.5 12.5 12 16l3.5-3.5"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2.5"/><path d="M7 14h10v6.5H7z"/><path d="M17.5 12h.01"/>',
  longedge: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 3v18" stroke-width="3"/><path d="M9 8h6M9 12h6"/>',
  shortedge: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M5 3h14" stroke-width="3"/><path d="M9 9h6M9 13h6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5V4.5a1.5 1.5 0 0 1 3 0V12"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v6"/><path d="M17 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.6 15.6a1.6 1.6 0 0 1 2.4-2.1L8 14.5"/>',
  note: '<path d="M5 4h14a1 1 0 0 1 1 1v10l-5 5H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M15 20v-4a1 1 0 0 1 1-1h4"/><path d="M8 9h8M8 12.5h5"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  redact: '<rect x="3" y="7" width="18" height="10" rx="1.5" fill="currentColor"/><path d="M3 4h7M14 20h7"/>',
  pagenum: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M10.5 15.5h3M12 13v5" stroke-width="1.5"/>',
  watermark: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m8.5 17 7-7" stroke-dasharray="2 2"/>',
  split: '<path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M12 2v20" stroke-dasharray="2 2.5"/>',
  compress: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9.5 11 2.5 2.5 2.5-2.5M9.5 17l2.5-2.5 2.5 2.5"/>',
  outline: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="2.6"/>',
  goto: '<path d="M5 12h12"/><path d="m13 7 5 5-5 5"/><path d="M20 4v16"/>',
  props: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  fitpage: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M7 12h10"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  ocr: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8.5 15.5 11 8.5h2l2.5 7M9.5 13h5"/>',
  compare: '<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/><path d="M5.5 9h3M5.5 12h3M15.5 9h3M15.5 12h3" /><path d="M15.5 15h3" stroke="#d70015"/>',
  xmark: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'
};
const icon = (n, extra = '') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${IC[n] || ''}</svg>`;

/* ---------- State ---------- */
const S = {
  docs: new Map(),      // id -> {id,name,bytes,pdf,fields,values,encrypted,widgets}
  imgs: new Map(),      // id -> {src,w,h,el}
  pages: [],            // {id,kind,docId,index,view,baseRot,rot,imgId,annots}
  tool: 'select',
  pendingImg: null,     // lib item for placing
  sel: null,            // {pageId, annId}
  selPages: new Set(),
  selecting: false,
  current: 0,
  zoom: 1,
  fit: true,
  dirty: false,
  hist: [], fut: [], last: '[]',
  style: lsGet('pdfmate.style', { ink: '#000000', hl: '#ffd60a', size: 12, width: 1.5 })
};
const INKS = [['Black', '#000000'], ['Blue', '#0040dd'], ['Red', '#d70015'], ['Green', '#1a7f37'], ['Orange', '#c93400']];
const HLS = [['Yellow', '#ffd60a'], ['Green', '#8be28b'], ['Pink', '#ff9ecf'], ['Blue', '#7cc7ff']];
const TOOLS = [
  ['select', 'Select text and objects (V)', 'select'], ['hand', 'Hand: drag to move around (H, or hold Space)', 'hand'], ['sep'],
  ['text', 'Add text (T)', 'text'], ['edittext', 'Edit existing text (D)', 'edit'], ['note', 'Sticky note (N)', 'note'], ['hl', 'Highlight area (U)', 'hl'], ['white', 'Whiteout (W)', 'white'], ['redact', 'Redact: remove content permanently (X)', 'redact'], ['sep'],
  ['g:shape', 'Shapes', 'rect'], ['pen', 'Pen (P)', 'pen'], ['g:mark', 'Tick or cross', 'tick'], ['sep'],
  ['g:sign', 'Sign, stamp or insert image', 'sign']
];
const GROUPS = {
  shape: [['rect', 'Rectangle', 'rect', 'R'], ['ellipse', 'Ellipse', 'ellipse', 'E'], ['line', 'Line', 'line', 'L'], ['arrow', 'Arrow', 'arrow', 'A']],
  mark: [['tick', 'Tick', 'tick'], ['cross', 'Cross', 'cross']]
};
const STAMPS = [['APPROVED', '#1a7f37'], ['RECEIVED', '#0040dd'], ['NOTED', '#0040dd'], ['CHECKED', '#1a7f37'], ['ORIGINAL', '#0040dd'], ['COPY', '#c93400'], ['REJECTED', '#d70015'], ['VOID', '#d70015'], ['CONFIDENTIAL', '#d70015'], ['URGENT', '#d70015']];
const NOTE_BGS = [['Yellow', '#fff3a6'], ['Green', '#d4f5c9'], ['Blue', '#d6ecff'], ['Pink', '#ffd9ec']];
const DRAW_TOOLS = new Set(['crop', 'text', 'note', 'white', 'hl', 'redact', 'rect', 'ellipse', 'line', 'arrow', 'pen', 'tick', 'cross', 'image', 'stamp']);
const toolGroup = (t) => Object.keys(GROUPS).find((g) => GROUPS[g].some((v) => v[0] === t));

/* ---------- Geometry ---------- */
function vpTransform(view, rot, scale = 1) {
  const [x0, y0, x1, y1] = view; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  rot = ((rot % 360) + 360) % 360;
  let A, B, C, D;
  switch (rot) { case 180: A = -1; B = 0; C = 0; D = 1; break; case 90: A = 0; B = 1; C = 1; D = 0; break; case 270: A = 0; B = -1; C = -1; D = 0; break; default: A = 1; B = 0; C = 0; D = -1; }
  let ox, oy, w, h;
  if (A === 0) { ox = Math.abs(cy - y0) * scale; oy = Math.abs(cx - x0) * scale; w = (y1 - y0) * scale; h = (x1 - x0) * scale; }
  else { ox = Math.abs(cx - x0) * scale; oy = Math.abs(cy - y0) * scale; w = (x1 - x0) * scale; h = (y1 - y0) * scale; }
  const t = [A * scale, B * scale, C * scale, D * scale, ox - A * scale * cx - C * scale * cy, oy - B * scale * cx - D * scale * cy];
  return { t, w, h };
}
const ap = (t, x, y) => [x * t[0] + y * t[2] + t[4], x * t[1] + y * t[3] + t[5]];
function inv(t) { const d = t[0] * t[3] - t[1] * t[2]; return [t[3] / d, -t[1] / d, -t[2] / d, t[0] / d, (t[2] * t[5] - t[3] * t[4]) / d, (t[1] * t[4] - t[0] * t[5]) / d]; }
const tr = (p) => (((p.baseRot || 0) + (p.rot || 0)) % 360 + 360) % 360;
function geo(p) { const g = vpTransform(p.view, tr(p), 1); g.i = inv(g.t); return g; }
const UV = (r) => { r = ((r % 360) + 360) % 360; const rd = r * Math.PI / 180; const k = (v) => { const q = Math.round(v * 1e9) / 1e9; return q === 0 ? 0 : q; }; const c = k(Math.cos(rd)), s = k(Math.sin(rd)); return { U: [c, s], V: [k(-s), c] }; };

/* ---------- Text metrics (Helvetica, same as export) ---------- */
let HELV = null, HELVB = null; const MET = {}; const encOK = new Map();
const FONT_KEYS = { helv: ['Helvetica', 'HelveticaBold'], times: ['TimesRoman', 'TimesRomanBold'], cour: ['Courier', 'CourierBold'] };
const FONT_CSS = { helv: 'Helvetica, Arial, "Liberation Sans", sans-serif', times: '"Times New Roman", Times, "Liberation Serif", serif', cour: '"Courier New", Courier, "Liberation Mono", monospace' };
async function initFont() { const d = await PL.PDFDocument.create(); for (const k in FONT_KEYS) MET[k] = [await d.embedFont(PL.StandardFonts[FONT_KEYS[k][0]]), await d.embedFont(PL.StandardFonts[FONT_KEYS[k][1]])]; HELV = MET.helv[0]; HELVB = MET.helv[1]; }
function sanitize(str) {
  let out = '';
  for (const ch of String(str)) {
    if (ch === '\n') { out += ch; continue; }
    let ok = encOK.get(ch);
    if (ok === undefined) { try { HELV.encodeText(ch); HELV.widthOfTextAtSize(ch, 10); ok = true; } catch (e) { ok = false; } encOK.set(ch, ok); }
    out += ok ? ch : (ch === '\u2014' || ch === '\u2013' ? '-' : '?');
  }
  return out;
}
const LH = 1.2, BASE = 0.9;
function needsUni(t) {
  for (const ch of String(t || '')) {
    if (ch === '\n') continue; let ok = encOK.get(ch);
    if (ok === undefined) { try { HELV.encodeText(ch); HELV.widthOfTextAtSize(ch, 10); ok = true; } catch (e) { ok = false; } encOK.set(ch, ok); }
    if (!ok) return true;
  }
  return false;
}
const UNI_FALLBACK = '"Noto Sans CJK KR", "Noto Sans", "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Hiragino Sans", "Microsoft YaHei", "Nirmala UI", "Kohinoor Devanagari", sans-serif';
const uniFont = (a, px) => `${a.bold ? '700' : '400'} ${px}px ${FONT_CSS[a.font || 'helv']}, ${UNI_FALLBACK}`;
let mctx = null;
function measureUni(a, line) { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = uniFont(a, a.size * 4); return mctx.measureText(line).width / 4; }
const tpad = (a) => (a.bg || a.border ? a.size * 0.4 : 0);
function textBox(a) {
  const lines = String(a.text || '').split('\n'); const f = MET[a.font || 'helv'] ? MET[a.font || 'helv'][a.bold ? 1 : 0] : (a.bold ? HELVB : HELV); const pad = tpad(a);
  let w = 0; for (const l of lines) w = Math.max(w, a.uni ? measureUni(a, l) : f ? f.widthOfTextAtSize(l, a.size) : l.length * a.size * 0.5);
  return { w: Math.max(w, a.size * 0.6) + 2 * pad, h: lines.length * LH * a.size + 2 * pad, lines, pad };
}
function setText(a, text, size) {
  const { U, V } = UV(a.r); const topX = a.ax + a.h * V[0], topY = a.ay + a.h * V[1];
  if (text != null) { if (needsUni(text)) { a.uni = true; a.text = String(text); } else { a.uni = false; a.text = sanitize(text); } }
  if (size != null) a.size = size;
  const b = textBox(a); a.w = b.w; a.h = b.h;
  a.ax = topX - a.h * V[0]; a.ay = topY - a.h * V[1];
}

/* ---------- Annotation geometry ---------- */
const ORIENTED = new Set(['text', 'image', 'tick', 'cross']);
const BOXES = new Set(['white', 'hl', 'rect', 'ellipse', 'redact']);
function corners(a) {
  if (BOXES.has(a.t)) return [[a.x, a.y], [a.x + a.w, a.y + a.h]];
  if (a.t === 'mark') return a.rects.flatMap(([x, y, w, h]) => [[x, y], [x + w, y + h]]);
  if (a.pts) return a.pts;
  const { U, V } = UV(a.r);
  return [[a.ax, a.ay], [a.ax + a.w * U[0], a.ay + a.w * U[1]], [a.ax + a.h * V[0], a.ay + a.h * V[1]], [a.ax + a.w * U[0] + a.h * V[0], a.ay + a.w * U[1] + a.h * V[1]]];
}
function dispBox(a, g) {
  let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
  for (const [x, y] of corners(a)) { const [dx, dy] = ap(g.t, x, y); L = Math.min(L, dx); T = Math.min(T, dy); R = Math.max(R, dx); B = Math.max(B, dy); }
  const pad = a.pts ? (a.width || 1) / 2 : 0;
  return { L: L - pad, T: T - pad, R: R + pad, B: B + pad };
}
function pdfAffineFromDisplay(g, fn) {
  const m = (x, y) => { const [dx, dy] = ap(g.t, x, y); const [ex, ey] = fn(dx, dy); return ap(g.i, ex, ey); };
  const o = m(0, 0), px = m(1, 0), py = m(0, 1);
  return { kx: px[0] - o[0], ky: py[1] - o[1], tx: o[0], ty: o[1] };
}
function applyT(a, T, uniform) {
  const f = (x, y) => [T.kx * x + T.tx, T.ky * y + T.ty];
  if (BOXES.has(a.t)) { const [x, y] = f(a.x, a.y); a.x = x; a.y = y; a.w *= T.kx; a.h *= T.ky; return; }
  if (a.t === 'mark') { a.rects = a.rects.map(([x, y, w, h]) => { const [nx, ny] = f(x, y); return [nx, ny, w * T.kx, h * T.ky]; }); if (a.segs) a.segs = a.segs.map((sg) => sg.map(([x, y]) => f(x, y))); return; }
  if (a.pts) { a.pts = a.pts.map(([x, y]) => f(x, y)); return; }
  const { U } = UV(a.r); const alongX = U[0] !== 0;
  let su = alongX ? T.kx : T.ky, sv = alongX ? T.ky : T.kx;
  if (uniform) { const s = Math.abs(su - 1) > Math.abs(sv - 1) ? su : sv; su = sv = s; }
  // anchor: keep the corner that maps to the same relative position
  const [ax, ay] = f(a.ax, a.ay); a.ax = ax; a.ay = ay;
  if (a.t === 'text') { a.size = clamp(a.size * Math.abs(sv), 4, 300); const b = textBox(a); a.w = b.w; a.h = b.h; }
  else { a.w = Math.max(2, a.w * su); a.h = Math.max(2, a.h * sv); }
}
function arrowHead(a) {
  const [p0, p1] = a.pts; const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, hl = Math.max(7, (a.width || 1.5) * 4.5), ang = 0.5;
  const c = Math.cos(ang), s = Math.sin(ang);
  const l = [p1[0] - hl * (ux * c - uy * s), p1[1] - hl * (uy * c + ux * s)];
  const r = [p1[0] - hl * (ux * c + uy * s), p1[1] - hl * (uy * c - ux * s)];
  return [[l, p1], [r, p1]];
}
const TICK = [[0.08, 0.55], [0.38, 0.86], [0.94, 0.12]];
const CROSS = [[[0.14, 0.14], [0.86, 0.86]], [[0.86, 0.14], [0.14, 0.86]]];
function orientPt(a, p, q) { const { U, V } = UV(a.r); const u = p * a.w, v = (1 - q) * a.h; return [a.ax + u * U[0] + v * V[0], a.ay + u * U[1] + v * V[1]]; }
function markSegments(a) {
  if (a.t === 'tick') { const pts = TICK.map(([p, q]) => orientPt(a, p, q)); return [[pts[0], pts[1]], [pts[1], pts[2]]]; }
  return CROSS.map((s) => s.map(([p, q]) => orientPt(a, p, q)));
}

/* ---------- History ---------- */
const snap = () => JSON.stringify({ pages: S.pages, vals: [...S.docs.values()].map((d) => [d.id, d.values]) });
function restore(str) {
  const o = JSON.parse(str); S.pages = o.pages;
  for (const [id, v] of o.vals) { const d = S.docs.get(id); if (d) d.values = v; }
  S.sel = null; S.selPages.clear(); renderAll();
}
function commit() {
  const s = snap(); if (s === S.last) return; scheduleSave();
  S.hist.push(S.last); if (S.hist.length > 40) S.hist.shift(); S.fut = []; S.last = s; setDirty(true); updateChrome();
}
function undo() { if (!S.hist.length) return; closeEditor(true); S.fut.push(S.last); S.last = S.hist.pop(); restore(S.last); setDirty(true); updateChrome(); }
function redo() { if (!S.fut.length) return; closeEditor(true); S.hist.push(S.last); S.last = S.fut.pop(); restore(S.last); setDirty(true); updateChrome(); }
function resetHistory() { S.hist = []; S.fut = []; S.last = snap(); }
function setDirty(v) { S.dirty = v; updateMeta(); }

/* ---------- UI helpers ---------- */
let toastT;
function toast(msg, opts = {}) {
  const old = $('.toast'); if (old) old.remove(); clearTimeout(toastT);
  const t = document.createElement('div'); t.className = 'toast' + (opts.err ? ' err' : ''); t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
  t.innerHTML = (opts.spin ? '<span class="spin"></span>' : '') + `<span>${esc(msg)}</span>`;
  document.body.appendChild(t);
  if (!opts.sticky) toastT = setTimeout(() => t.remove(), opts.ms || 2600);
  return t;
}
function closeSheet() { const s = $('#layer .scrim'); if (s) { s.remove(); } document.removeEventListener('keydown', sheetKey); }
function sheetKey(e) { if (e.key === 'Escape') closeSheet(); }
function sheet(html, { wide = false, onMount } = {}) {
  closeSheet(); closeMenu();
  const sc = document.createElement('div'); sc.className = 'scrim';
  sc.innerHTML = `<div class="sheet${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  sc.addEventListener('pointerdown', (e) => { if (e.target === sc) closeSheet(); });
  $('#layer').appendChild(sc); document.addEventListener('keydown', sheetKey);
  const sh = sc.firstElementChild; if (onMount) onMount(sh);
  const f = sh.querySelector('[autofocus]') || sh.querySelector('button.primary,button'); if (f) setTimeout(() => f.focus(), 30);
  return sh;
}
function confirmSheet(title, text, okLabel, onOk, danger = true) {
  const sh = sheet(`<h2>${esc(title)}</h2><p class="sub">${esc(text)}</p><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button></div>`);
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-ok]').onclick = () => { closeSheet(); onOk(); };
}
let menuEl = null;
function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; document.removeEventListener('pointerdown', menuOutside, true); document.removeEventListener('keydown', menuKey); } }
function menuOutside(e) { if (menuEl && !menuEl.contains(e.target) && !e.target.closest('#btnMore')) closeMenu(); }
function menuKey(e) {
  if (!menuEl) return; const items = $$('button', menuEl); const i = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { closeMenu(); $('#btnMore').focus(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
}
function openMenu(anchor, items, at) {
  closeMenu();
  const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu');
  m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : it.h ? `<div class="mh">${esc(it.h)}</div>` : `<button role="menuitem" data-i="${i}" ${it.disabled ? 'disabled style="opacity:.4;pointer-events:none"' : ''}>${it.swatch ? `<span class="msw" style="--c:${it.swatch}"></span>` : icon(it.icon || 'info')}<span>${esc(it.label)}</span>${it.kbd ? `<kbd>${esc(it.kbd)}</kbd>` : ''}</button>`).join('');
  m.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i]; closeMenu(); it.run(); });
  document.body.appendChild(m); menuEl = m;
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  if (at) { m.style.left = clamp(at.x + mw > innerWidth - 8 ? at.x - mw : at.x, 8, innerWidth - mw - 8) + 'px'; m.style.top = clamp(at.y + mh > innerHeight - 8 ? at.y - mh : at.y, 8, innerHeight - mh - 8) + 'px'; }
  else m.style.left = clamp(r.right - mw, 8, innerWidth - mw - 8) + 'px';
  if (!at) m.style.top = (r.bottom + 6 + mh > innerHeight - 8 && r.top - mh - 6 > 8 ? r.top - mh - 6 : clamp(r.bottom + 6, 8, innerHeight - mh - 8)) + 'px';
  m.style.maxHeight = (innerHeight - 16) + 'px'; m.style.overflowY = 'auto';
  setTimeout(() => { document.addEventListener('pointerdown', menuOutside, true); document.addEventListener('keydown', menuKey); const f = m.querySelector('button'); if (f) f.focus(); }, 0);
}

/* ---------- Loading files ---------- */
const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const isImg = (f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(f.name);
function loadImageEl(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Could not read this image.')); im.src = src; }); }
const readAsDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
async function normImage(src, maxSide = 2400, keepAlpha = false) {
  const im = await loadImageEl(src); let w = im.naturalWidth, h = im.naturalHeight; const k = Math.min(1, maxSide / Math.max(w, h));
  w = Math.round(w * k); h = Math.round(h * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (!keepAlpha) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
  x.drawImage(im, 0, 0, w, h);
  const out = keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.86);
  const el = await loadImageEl(out);
  return { src: out, w, h, el };
}
function askPassword(name, wrong) {
  return new Promise((res) => {
    const sh = sheet(`<h2>Password required</h2><p class="sub">${esc(name)} is protected${wrong ? '. That password did not work, try again.' : '. Enter its password to open it.'}</p>
      <div class="field"><label for="pw">Password</label><input id="pw" class="inp" type="password" autocomplete="off" autofocus></div>
      <div class="acts"><button class="btn" data-x>Skip file</button><button class="btn primary" data-ok>Open</button></div>`);
    const go = () => { const v = sh.querySelector('#pw').value; closeSheet(); res(v); };
    sh.querySelector('[data-x]').onclick = () => { closeSheet(); res(null); };
    sh.querySelector('[data-ok]').onclick = go;
    sh.querySelector('#pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });
}
async function readFields(doc) {
  doc.fields = []; doc.values = {}; doc.widgets = new Map();
  try {
    const ld = await PL.PDFDocument.load(doc.bytes, { ignoreEncryption: true, updateMetadata: false });
    doc.encrypted = !!ld.isEncrypted;
    if (doc.encrypted) return;
    const pageOf = new Map();
    ld.getPages().forEach((pg, i) => { const an = pg.node.Annots(); if (an) an.asArray().forEach((r) => pageOf.set(String(r), i)); });
    const form = ld.getForm();
    for (const f of form.getFields()) {
      let type = null, value = '', options = null;
      if (f instanceof PL.PDFTextField) { type = 'text'; value = f.getText() || ''; }
      else if (f instanceof PL.PDFCheckBox) { type = 'check'; value = f.isChecked(); }
      else if (f instanceof PL.PDFDropdown) { type = 'drop'; options = f.getOptions(); value = f.getSelected()[0] || ''; }
      else if (f instanceof PL.PDFOptionList) { type = 'drop'; options = f.getOptions(); value = f.getSelected()[0] || ''; }
      else if (f instanceof PL.PDFRadioGroup) { type = 'radio'; options = f.getOptions(); value = f.getSelected() || ''; }
      if (!type) continue;
      const name = f.getName();
      let multiline = false; try { multiline = type === 'text' && f.isMultiline(); } catch (e) {}
      const widgets = f.acroField.getWidgets().map((w, wi) => {
        const ref = ld.context.getObjectRef(w.dict); const r = w.getRectangle();
        return { page: ref ? pageOf.get(String(ref)) : undefined, x: r.x, y: r.y, w: r.width, h: r.height, opt: options ? options[wi] : null };
      }).filter((w) => w.page !== undefined && w.w > 0 && w.h > 0);
      const fld = { name, type, value, options, readOnly: f.isReadOnly(), multiline, widgets };
      doc.fields.push(fld);
      for (const w of widgets) { if (!doc.widgets.has(w.page)) doc.widgets.set(w.page, []); doc.widgets.get(w.page).push({ ...w, field: fld }); }
    }
  } catch (e) { /* not fatal: no form support for this file */ }
}
async function addFiles(files, at = S.pages.length) {
  files = [...files]; if (!files.length) return;
  const t = toast(files.length > 1 ? `Opening ${files.length} files` : `Opening ${files[0].name}`, { spin: true, sticky: true });
  const newPages = []; let firstName = null, formCount = 0;
  for (const f of files) {
    try {
      if (isPdf(f)) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        let pdf = null, pw = undefined, wrong = false;
        for (;;) {
          try { pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice(), password: pw }).promise; break; }
          catch (e) {
            if (e && e.name === 'PasswordException') { t.remove(); pw = await askPassword(f.name, wrong); wrong = true; if (pw == null) break; continue; }
            throw e;
          }
        }
        if (!pdf) continue;
        const doc = { id: uid('d'), name: f.name, bytes, pdf, password: pw, fields: [], values: {}, widgets: new Map() };
        await readFields(doc); if (pw) doc.encrypted = true;
        formCount += doc.fields.length;
        S.docs.set(doc.id, doc);
        for (let i = 0; i < pdf.numPages; i++) {
          const pg = await pdf.getPage(i + 1);
          newPages.push({ id: uid('p'), kind: 'pdf', docId: doc.id, index: i, view: pg.view.slice(), baseRot: pg.rotate || 0, rot: 0, annots: [] });
        }
        if (!S.meta) { try { const md = await pdf.getMetadata(); const inf = (md && md.info) || {}; S.meta = { title: inf.Title || '', author: inf.Author || '', subject: inf.Subject || '', keywords: inf.Keywords || '' }; } catch (e) { S.meta = {}; } }
        firstName = firstName || f.name.replace(/\.pdf$/i, '');
      } else if (isImg(f)) {
        const im = await normImage(await readAsDataURL(f));
        const id = uid('i'); S.imgs.set(id, im);
        const L = 842, k = L / Math.max(im.w, im.h);
        newPages.push({ id: uid('p'), kind: 'img', imgId: id, view: [0, 0, Math.round(im.w * k * 100) / 100, Math.round(im.h * k * 100) / 100], baseRot: 0, rot: 0, annots: [] });
        firstName = firstName || f.name.replace(/\.[^.]+$/, '');
      } else { toast(`${f.name} is not a PDF or image`, { err: true }); }
    } catch (e) { console.error(e); toast(`Could not open ${f.name}. The file may be damaged.`, { err: true, ms: 4000 }); }
  }
  t.remove();
  if (!newPages.length) return;
  const wasEmpty = !S.pages.length;
  S.pages.splice(at, 0, ...newPages);
  if (wasEmpty) { $('#docName').value = firstName || 'Untitled'; if (innerWidth > 760) setSidebar(true); }
  renderAll(); commit();
  if (wasEmpty) { setDirty(false); resetHistory(); updateChrome(); }
  else { toast(`Added ${newPages.length} page${newPages.length > 1 ? 's' : ''}`); scrollToPage(at); }
  scheduleSave();
  if (formCount) toast(`This PDF has ${formCount} form field${formCount > 1 ? 's' : ''}. Tap a field to fill it.`, { ms: 4200 });
}
function newBlank(at = S.pages.length, like) {
  const view = like ? (tr(like) % 180 ? [0, 0, like.view[3] - like.view[1], like.view[2] - like.view[0]] : [0, 0, like.view[2] - like.view[0], like.view[3] - like.view[1]]) : [0, 0, 595.28, 841.89];
  S.pages.splice(at, 0, { id: uid('p'), kind: 'blank', view, baseRot: 0, rot: 0, annots: [] });
  if (S.pages.length === 1) { $('#docName').value = 'Untitled'; if (innerWidth > 760) setSidebar(true); }
  renderAll(); commit(); scrollToPage(at);
}
/* ---------- Document tabs ---------- */
const WS = { list: [], active: 0 };
function blankTab() { return { id: uid('t'), name: 'Untitled', pages: [], hist: [], fut: [], last: JSON.stringify({ pages: [], vals: [] }), sel: null, selPages: new Set(), current: 0, zoom: 1, fit: true, dirty: false, meta: null, scroll: 0, sbView: 'pages' }; }
function saveTab() {
  const t = WS.list[WS.active]; if (!t) return;
  Object.assign(t, { pages: S.pages, hist: S.hist, fut: S.fut, last: S.last, sel: S.sel, selPages: S.selPages, current: S.current, zoom: S.zoom, fit: S.fit, dirty: S.dirty, meta: S.meta, name: $('#docName').value || 'Untitled', scroll: viewer.scrollTop, sbView: S.sbView || 'pages' });
}
function loadTab(i) {
  closeEditor(true); closeFind(); hideBubble(); closeMenu(); closeCompare();
  WS.active = i; const t = WS.list[i];
  Object.assign(S, { pages: t.pages, hist: t.hist, fut: t.fut, last: t.last, sel: t.sel, selPages: t.selPages, current: t.current, zoom: t.zoom, fit: t.fit, dirty: t.dirty, meta: t.meta });
  $('#docName').value = t.name;
  renderAll(); setSbView(t.sbView || 'pages');
  requestAnimationFrame(() => { viewer.scrollTop = t.scroll || 0; onScroll(); });
  if (S.selecting) { S.selecting = false; $('#sidebar').classList.remove('selecting'); $('#btnSelPages').textContent = 'Select'; }
  updateChrome(); renderTabs(); refreshFormatBar();
}
function switchTab(i) { if (i === WS.active || !WS.list[i]) return; saveTab(); loadTab(i); scheduleSave(); }
function newTab() { saveTab(); WS.list.push(blankTab()); loadTab(WS.list.length - 1); }
function releaseUnused() {
  const used = new Set(); const imgsUsed = new Set();
  const scan = (pages) => { for (const p of pages) { if (p.docId) used.add(p.docId); if (p.imgId) imgsUsed.add(p.imgId); for (const a of p.annots) if (a.imgId) imgsUsed.add(a.imgId); } };
  WS.list.forEach((t, k) => { scan(k === WS.active ? S.pages : t.pages); for (const h of [...t.hist, ...t.fut, t.last]) { try { scan(JSON.parse(h).pages); } catch (e) {} } });
  for (const [id, d] of S.docs) if (!used.has(id)) { try { d.pdf.loadingTask.destroy(); } catch (e) {} S.docs.delete(id); }
  for (const id of [...S.imgs.keys()]) if (!imgsUsed.has(id) && !libItems().some((x) => x.id === id)) S.imgs.delete(id);
}
function closeTab(i, force) {
  saveTab(); const t = WS.list[i]; if (!t) return;
  if (t.dirty && !force) { confirmSheet(`Close ${t.name}?`, 'Your changes to this document will be lost.', 'Close without saving', () => closeTab(i, true)); return; }
  WS.list.splice(i, 1);
  if (!WS.list.length) WS.list.push(blankTab());
  let next = WS.active; if (i < WS.active) next--; else if (i === WS.active) next = Math.min(i, WS.list.length - 1);
  WS.active = -1; loadTab(next); releaseUnused(); scheduleSave();
  if (!S.pages.length) setSidebar(false);
}
function closeDoc() { closeTab(WS.active, true); }
function renderTabs() {
  const bar = $('#tabbar'); const list = $('#tabList'); if (!bar) return;
  const show = WS.list.length > 1 || S.pages.length > 0; bar.hidden = !show; document.body.classList.toggle('has-tabs', show);
  list.innerHTML = WS.list.map((t, k) => {
    const on = k === WS.active; const name = on ? ($('#docName').value || 'Untitled') : t.name; const dirty = on ? S.dirty : t.dirty; const n = on ? S.pages.length : t.pages.length;
    return `<div class="dtab${on ? ' on' : ''}${dirty ? ' dirty' : ''}" role="tab" aria-selected="${on}" tabindex="${on ? 0 : -1}" data-k="${k}" title="${esc(name)}${n ? ` (${n} page${n > 1 ? 's' : ''})` : ''}">${icon('blank')}<span class="dt-name">${esc(name)}</span><button class="dt-x" data-x="${k}" aria-label="Close ${esc(name)}" tabindex="-1">${icon('close')}</button><i class="dt-dot" aria-hidden="true"></i></div>`;
  }).join('');
  const on = list.querySelector('.dtab.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
/* ---------- Auto-save and recent files (stored on this device in IndexedDB) ---------- */
let dbp = null;
function idb() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => { let r; try { r = indexedDB.open('meridian-pdf-mate', 1); } catch (e) { rej(e); return; }
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs'); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return dbp;
}
function tx(store, mode, fn) { return idb().then((d) => new Promise((res, rej) => { const t = d.transaction(store, mode); const st = t.objectStore(store); const rq = fn(st); t.oncomplete = () => res(rq && 'result' in rq ? rq.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })); }
const kvGet = (k) => tx('kv', 'readonly', (st) => st.get(k)).catch(() => null);
const kvSet = (k, v) => tx('kv', 'readwrite', (st) => st.put(v, k));
const blobGet = (k) => tx('blobs', 'readonly', (st) => st.get(k)).catch(() => null);
const blobKeys = () => tx('blobs', 'readonly', (st) => st.getAllKeys()).catch(() => []);
const stored = new Set();
let saveT = null, saving = false, restoring = false;
function scheduleSave() { if (restoring) return; clearTimeout(saveT); saveT = setTimeout(saveSession, 900); }
function refsOf(pages, docs, imgs) { for (const p of pages) { if (p.docId) docs.add(p.docId); if (p.imgId) imgs.add(p.imgId); for (const a of p.annots) if (a.imgId) imgs.add(a.imgId); } }
async function tabThumb(t) {
  const p = t.pages[0]; if (!p) return null; const c = thumbCache.get(p.id + '|' + tr(p)); if (!c) return null;
  try { const k = Math.min(1, 160 / c.width); const o = document.createElement('canvas'); o.width = Math.round(c.width * k); o.height = Math.round(c.height * k); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); return o.toDataURL('image/jpeg', 0.7); } catch (e) { return null; }
}
async function saveSession() {
  if (saving || restoring) { scheduleSave(); return; } saving = true;
  try {
    saveTab();
    const open = WS.list.filter((t) => t.pages.length);
    const docs = new Set(), imgs = new Set();
    open.forEach((t) => refsOf(t.pages, docs, imgs));
    let recent = (await kvGet('recent')) || [];
    for (const t of open) {
      const old = recent.find((r) => r.id === t.id);
      const ent = { id: t.id, name: t.name, pages: t.pages, meta: t.meta, n: t.pages.length, at: Date.now(), vals: [], thumb: (await tabThumb(t)) || (old && old.thumb) || null };
      const dd = new Set(), ii = new Set(); refsOf(t.pages, dd, ii); ent.vals = [...dd].map((id) => [id, (S.docs.get(id) || {}).values || {}]);
      recent = [ent, ...recent.filter((r) => r.id !== t.id)];
    }
    recent = recent.slice(0, 12); recent.forEach((r) => refsOf(r.pages, docs, imgs));
    const toPut = [];
    for (const id of docs) { if (stored.has(id)) continue; const d = S.docs.get(id); if (d) toPut.push([id, { kind: 'pdf', name: d.name, bytes: d.bytes, password: d.password || null }]); }
    for (const id of imgs) { if (stored.has(id)) continue; const im = S.imgs.get(id); if (im) toPut.push([id, { kind: 'img', src: im.src, w: im.w, h: im.h }]); }
    if (toPut.length) { await tx('blobs', 'readwrite', (st) => { for (const [k, v] of toPut) st.put(v, k); }); toPut.forEach(([k]) => stored.add(k)); }
    const active = open.indexOf(WS.list[WS.active]);
    await kvSet('session', { tabs: open.map((t) => ({ id: t.id, name: t.name, pages: t.pages, meta: t.meta, dirty: t.dirty, zoom: t.zoom, fit: t.fit, current: t.current, sbView: t.sbView })), active: Math.max(0, active), vals: [...docs].map((id) => [id, (S.docs.get(id) || {}).values || {}]) });
    await kvSet('recent', recent);
    const keep = new Set([...docs, ...imgs]); const all = await blobKeys(); const drop = all.filter((k) => !keep.has(k));
    if (drop.length) { await tx('blobs', 'readwrite', (st) => { for (const k of drop) st.delete(k); }); drop.forEach((k) => stored.delete(k)); }
    renderRecents(recent);
  } catch (e) { console.warn('auto-save', e); }
  saving = false;
}
async function ensureDoc(id, vals) {
  if (S.docs.has(id)) return true; const b = await blobGet(id); if (!b || b.kind !== 'pdf') return false;
  try {
    const bytes = b.bytes instanceof Uint8Array ? b.bytes : new Uint8Array(b.bytes);
    const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice(), password: b.password || undefined }).promise;
    const doc = { id, name: b.name, bytes, pdf, password: b.password || undefined, fields: [], values: {}, widgets: new Map() };
    await readFields(doc); if (b.password) doc.encrypted = true; if (vals) doc.values = vals;
    S.docs.set(id, doc); stored.add(id); return true;
  } catch (e) { console.warn('restore doc', e); return false; }
}
async function ensureImg(id) {
  if (S.imgs.has(id) && S.imgs.get(id).el) return true;
  let src = null, w = 0, h = 0; const b = await blobGet(id);
  if (b && b.kind === 'img') { src = b.src; w = b.w; h = b.h; stored.add(id); } else { const it = libItems().find((x) => x.id === id); if (it) { src = it.src; w = it.w; h = it.h; } }
  if (!src) return false; try { S.imgs.set(id, { src, w, h, el: await loadImageEl(src) }); return true; } catch (e) { return false; }
}
async function hydrate(pages, valsList) {
  const vals = new Map(valsList || []); const docs = new Set(), imgs = new Set(); refsOf(pages, docs, imgs);
  const okD = new Set(); for (const id of docs) if (await ensureDoc(id, vals.get(id))) okD.add(id); else if (S.docs.has(id) && vals.get(id)) S.docs.get(id).values = vals.get(id);
  for (const id of imgs) await ensureImg(id);
  return pages.filter((p) => (p.kind !== 'pdf' || okD.has(p.docId) || S.docs.has(p.docId)) && (p.kind !== 'img' || S.imgs.has(p.imgId)));
}
async function restoreSession() {
  const ses = await kvGet('session'); if (!ses || !ses.tabs || !ses.tabs.length) { renderRecents(); return false; }
  restoring = true; const t0 = toast('Restoring your documents', { spin: true, sticky: true });
  try {
    const tabs = [];
    for (const st of ses.tabs) {
      const pages = await hydrate(st.pages, ses.vals); if (!pages.length) continue;
      const t = blankTab(); Object.assign(t, { id: st.id, name: st.name, pages, meta: st.meta, dirty: !!st.dirty, zoom: st.zoom || 1, fit: st.fit !== false, current: st.current || 0, sbView: st.sbView || 'pages' });
      tabs.push(t);
    }
    if (tabs.length) {
      WS.list = tabs; WS.active = -1; loadTab(Math.min(ses.active || 0, tabs.length - 1));
      for (const t of WS.list) { const keep = { pages: S.pages }; t.last = JSON.stringify({ pages: t.pages, vals: [...S.docs.values()].map((d) => [d.id, d.values]) }); }
      S.last = WS.list[WS.active].last; if (innerWidth > 760) setSidebar(true);
      toast(`Restored ${tabs.length} document${tabs.length > 1 ? 's' : ''}`);
    }
  } catch (e) { console.warn('restore', e); }
  t0.remove(); restoring = false; renderRecents(); return true;
}
async function openRecent(id) {
  const recent = (await kvGet('recent')) || []; const r = recent.find((x) => x.id === id); if (!r) return;
  const open = WS.list.findIndex((t) => t.id === id); if (open >= 0) { switchTab(open); return; }
  const t0 = toast(`Opening ${r.name}`, { spin: true, sticky: true });
  const pages = await hydrate(JSON.parse(JSON.stringify(r.pages)), r.vals); t0.remove();
  if (!pages.length) { toast('That file is no longer stored on this device', { err: true }); return; }
  if (S.pages.length) newTab();
  const t = WS.list[WS.active]; t.id = r.id;
  S.pages = pages; S.meta = r.meta || null; $('#docName').value = r.name; resetHistory(); setDirty(false);
  renderAll(); if (innerWidth > 760) setSidebar(true); renderTabs(); scheduleSave();
}
async function forgetRecent(id) { const recent = ((await kvGet('recent')) || []).filter((r) => r.id !== id); await kvSet('recent', recent); renderRecents(recent); scheduleSave(); }
async function renderRecents(list) {
  const box = $('#recents'); if (!box) return; if (!list) list = (await kvGet('recent')) || [];
  if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
  const fmt = (ms) => { const d = new Date(ms), now = new Date(); return d.toDateString() === now.toDateString() ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { day: 'numeric', month: 'short' }); };
  box.hidden = false;
  box.innerHTML = `<div class="rc-h">Recent</div><div class="rc-grid">${list.slice(0, 8).map((r) => `<div class="rc" role="button" tabindex="0" data-rid="${r.id}" aria-label="Open ${esc(r.name)}"><div class="rc-th">${r.thumb ? `<img src="${r.thumb}" alt="">` : icon('blank')}</div><div class="rc-t">${esc(r.name)}</div><div class="rc-m">${r.n} page${r.n > 1 ? 's' : ''} · ${fmt(r.at)}</div><button class="rc-x" data-forget="${r.id}" aria-label="Remove ${esc(r.name)} from recent">${icon('close')}</button></div>`).join('')}</div>`;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveT); saveSession(); } });
addEventListener('pagehide', () => { clearTimeout(saveT); saveSession(); });

async function openFilesInTabs(files) {
  files = [...files]; if (!files.length) return;
  const pdfs = files.filter(isPdf), imgs = files.filter((f) => !isPdf(f) && isImg(f));
  const groups = [...pdfs.map((f) => [f]), ...(imgs.length ? [imgs] : [])];
  if (!groups.length) { toast('Choose a PDF or an image', { err: true }); return; }
  for (const g of groups) {
    if (S.pages.length) newTab();
    await addFiles(g);
    if (!S.pages.length && WS.list.length > 1) { WS.list.splice(WS.active, 1); WS.active = -1; loadTab(WS.list.length - 1); }
  }
  renderTabs();
}

/* ---------- Rendering: pages ---------- */
const pagesEl = $('#pages'), viewer = $('#viewer');
let io = null;
function fitZoom() {
  if (!S.pages.length) return 1;
  const avail = Math.max(200, viewer.clientWidth - (innerWidth <= 760 ? 24 : 64));
  const ws = S.pages.map((p) => geo(p).w).sort((a, b) => a - b);
  const target = ws[ws.length - 1];
  return clamp(avail / target, 0.25, innerWidth <= 760 ? 3 : 1.6);
}
function renderAll() {
  closeEditor(true);
  if (S.fit) S.zoom = fitZoom();
  pagesEl.innerHTML = '';
  if (io) io.disconnect();
  io = new IntersectionObserver((ents) => { for (const e of ents) { const el = e.target; el._vis = e.isIntersecting; if (e.isIntersecting) { if (!el._ov) { const pp = pageById(el.dataset.id); if (pp) { el._ov = true; drawOverlay(pp, el); drawForm(pp, el); } } paintCanvas(el); } else freeCanvas(el); } }, { root: viewer, rootMargin: '900px 0px' });
  S.pages.forEach((p, i) => {
    const g = geo(p);
    const el = document.createElement('div'); el.className = 'page'; el.dataset.id = p.id;
    el.style.width = g.w * S.zoom + 'px'; el.style.height = g.h * S.zoom + 'px';
    el.style.setProperty('--total-scale-factor', S.zoom); el.style.setProperty('--scale-factor', S.zoom);
    el.innerHTML = `<canvas></canvas><div class="textLayer"></div><div class="findlayer"></div><div class="formlayer"></div><svg class="ov" viewBox="0 0 ${g.w} ${g.h}" xmlns="${SVGNS}" aria-label="Page ${i + 1}"></svg><span class="pnum">${i + 1}</span>`;
    pagesEl.appendChild(el); io.observe(el);
  });
  $('#empty').hidden = S.pages.length > 0;
  $('#pageInd').hidden = S.pages.length === 0;
  renderThumbs(); updateChrome(); updateZoomLbl(); onScroll();
  if (S.sbView === 'outline') loadOutline();
  if (FIND.q) { textCache.clear(); }
}
function pageEl(id) { return pagesEl.querySelector(`.page[data-id="${id}"]`); }
const pageById = (id) => S.pages.find((p) => p.id === id);
function freeCanvas(el) { const c = el.querySelector('canvas'); if (el._task) { try { el._task.cancel(); } catch (e) {} el._task = null; } c.width = 0; c.height = 0; el._key = null; }
async function paintCanvas(el) {
  const p = pageById(el.dataset.id); if (!p) return;
  const key = S.zoom.toFixed(3) + '|' + tr(p);
  if (el._key === key) return; el._key = key;
  const g = geo(p); const c = el.querySelector('canvas');
  let dpr = Math.min(window.devicePixelRatio || 1, 2.5); const W = g.w * S.zoom, H = g.h * S.zoom;
  while (W * H * dpr * dpr > 14e6 && dpr > 0.6) dpr -= 0.25;
  if (el._task) { try { el._task.cancel(); } catch (e) {} el._task = null; }
  const off = document.createElement('canvas'); off.width = Math.round(W * dpr); off.height = Math.round(H * dpr);
  const ctx = off.getContext('2d');
  try {
    if (p.kind === 'pdf') {
      const doc = S.docs.get(p.docId); const pg = await doc.pdf.getPage(p.index + 1);
      if (el._key !== key) return;
      const vp = pg.getViewport({ scale: S.zoom * dpr, rotation: tr(p) });
      off.width = Math.round(vp.width); off.height = Math.round(vp.height);
      const task = pg.render({ canvasContext: off.getContext('2d'), viewport: vp, annotationMode: doc.fields.length ? pdfjsLib.AnnotationMode.ENABLE_FORMS : pdfjsLib.AnnotationMode.ENABLE });
      el._task = task; await task.promise; el._task = null;
      if (!el._tl) { el._tl = true; renderTextLayer(el, p, pg); }
    } else {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, off.width, off.height);
      if (p.kind === 'img') {
        const im = S.imgs.get(p.imgId); const s = S.zoom * dpr; const t = g.t;
        ctx.setTransform(t[0] * s, t[1] * s, t[2] * s, t[3] * s, t[4] * s, t[5] * s);
        const [x0, y0, x1, y1] = p.view; ctx.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1);
        ctx.drawImage(im.el, 0, 0, 1, 1);
      }
    }
    if (el._key !== key) return;
    if (p.kind !== 'pdf' && p.ocr && p.ocr.length && !el._ocrDone) { buildOcrLayer(el, p); el._tlReady = true; }
    c.width = off.width; c.height = off.height; c.getContext('2d').drawImage(off, 0, 0);
  } catch (e) { if (e && e.name !== 'RenderingCancelledException') console.error(e); el._key = null; }
}
function rerenderVisible() { for (const el of $$('.page', pagesEl)) { el._key = null; if (el._vis) paintCanvas(el); } }

/* ---------- Overlay SVG ---------- */
const sv = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
function annNode(a) {
  const g = sv('g', { 'data-id': a.id });
  const w = a.width || 1.5;
  if (a.t === 'white') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: a.fill || '#ffffff' }));
  else if (a.t === 'hl') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: a.color, 'fill-opacity': 0.4, style: 'mix-blend-mode:multiply' }));
  else if (a.t === 'rect') g.appendChild(sv('rect', { x: a.x + w / 2, y: a.y + w / 2, width: Math.max(0, a.w - w), height: Math.max(0, a.h - w), fill: 'none', stroke: a.color, 'stroke-width': w }));
  else if (a.t === 'ellipse') g.appendChild(sv('ellipse', { cx: a.x + a.w / 2, cy: a.y + a.h / 2, rx: Math.max(0, a.w / 2 - w / 2), ry: Math.max(0, a.h / 2 - w / 2), fill: 'none', stroke: a.color, 'stroke-width': w }));
  else if (a.t === 'redact') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: '#000000' }));
  else if (a.t === 'mark') {
    if (a.kind === 'hl') for (const [x, y, rw, rh] of a.rects) g.appendChild(sv('rect', { x, y, width: rw, height: rh, fill: a.color, 'fill-opacity': 0.4, style: 'mix-blend-mode:multiply' }));
    else for (const [s0, s1] of a.segs || []) g.appendChild(sv('line', { x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1], stroke: a.color, 'stroke-width': a.width || 1 }));
  }
  else if (a.t === 'line' || a.t === 'arrow') {
    const [p0, p1] = a.pts; g.appendChild(sv('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round' }));
    if (a.t === 'arrow') for (const [s, e] of arrowHead(a)) g.appendChild(sv('line', { x1: s[0], y1: s[1], x2: e[0], y2: e[1], stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round' }));
  } else if (a.t === 'pen') g.appendChild(sv('polyline', { points: a.pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  else if (ORIENTED.has(a.t)) {
    const { U, V } = UV(a.r);
    const fr = sv('g', { transform: `matrix(${U[0]} ${U[1]} ${-V[0]} ${-V[1]} ${a.ax + a.h * V[0]} ${a.ay + a.h * V[1]})` });
    if (a.t === 'image') { const im = S.imgs.get(a.imgId); if (im) fr.appendChild(sv('image', { href: im.src, x: 0, y: 0, width: a.w, height: a.h, preserveAspectRatio: 'none' })); }
    else if (a.t === 'text') {
      const lines = String(a.text || '').split('\n'); const pad = tpad(a); const op = a.opacity == null ? 1 : a.opacity;
      if (a.bg) fr.appendChild(sv('rect', { x: 0, y: 0, width: a.w, height: a.h, fill: a.bg, 'fill-opacity': op }));
      if (a.border) { const bw = Math.max(1, a.size * 0.09); fr.appendChild(sv('rect', { x: bw / 2, y: bw / 2, width: Math.max(0, a.w - bw), height: Math.max(0, a.h - bw), fill: 'none', stroke: a.color, 'stroke-width': bw, 'stroke-opacity': op })); }
      lines.forEach((l, i) => { const t = sv('text', { x: pad, y: pad + BASE * a.size + i * LH * a.size, 'font-family': FONT_CSS[a.font || 'helv'] + ', ' + UNI_FALLBACK, 'font-weight': a.bold ? 700 : 400, 'font-size': a.size, fill: a.color, 'fill-opacity': op, 'xml:space': 'preserve' }); t.textContent = l; fr.appendChild(t); });
    } else {
      const segs = a.t === 'tick' ? [TICK] : CROSS;
      for (const s of segs) fr.appendChild(sv('polyline', { points: s.map(([p, q]) => `${p * a.w},${q * a.h}`).join(' '), fill: 'none', stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    g.appendChild(fr);
  }
  return g;
}
let GUIDES = null, MARQ = null, CLIP = null;
function selIds() { return S.sel ? (S.sel.ids && S.sel.ids.length ? S.sel.ids : [S.sel.annId]) : []; }
function selAnns() { if (!S.sel) return null; const p = pageById(S.sel.pageId); if (!p) return null; const ids = new Set(selIds()); const as = p.annots.filter((a) => ids.has(a.id)); return as.length ? { p, as } : null; }
function unionBox(list, g) { let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity; for (const a of list) { const b = dispBox(a, g); L = Math.min(L, b.L); T = Math.min(T, b.T); R = Math.max(R, b.R); B = Math.max(B, b.B); } return { L, T, R, B }; }
function snapTargets(p, g, ids) { const xs = [0, g.w / 2, g.w], ys = [0, g.h / 2, g.h]; for (const z of p.annots) { if (ids.includes(z.id)) continue; const b = dispBox(z, g); xs.push(b.L, (b.L + b.R) / 2, b.R); ys.push(b.T, (b.T + b.B) / 2, b.B); } return { xs, ys }; }
function snapMove(b, dx, dy, t, th) {
  const out = { dx, dy, gx: null, gy: null };
  const best = (vals, cands) => { let m = null; for (const v of vals) for (const c of cands) { const d = c - v; if (Math.abs(d) <= th && (!m || Math.abs(d) < Math.abs(m.d))) m = { d, c }; } return m; };
  const mx = best([b.L + dx, (b.L + b.R) / 2 + dx, b.R + dx], t.xs); if (mx) { out.dx += mx.d; out.gx = mx.c; }
  const my = best([b.T + dy, (b.T + b.B) / 2 + dy, b.B + dy], t.ys); if (my) { out.dy += my.d; out.gy = my.c; }
  return out;
}
function drawOverlay(p, el = pageEl(p.id)) {
  if (!el) return;
  const svg = el.querySelector('svg.ov'); const g = geo(p);
  svg.setAttribute('viewBox', `0 0 ${g.w} ${g.h}`);
  svg.innerHTML = '';
  const content = sv('g', { transform: `matrix(${g.t.join(' ')})` });
  const ui = sv('g', { class: 'ui' });
  for (const a of p.annots) {
    if (S.editing && S.editing.annId === a.id) continue;
    content.appendChild(annNode(a));
    const b = dispBox(a, g), pad = 6 / S.zoom;
    ui.appendChild(sv('rect', { class: 'ann hit', 'data-id': a.id, x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad, fill: 'transparent' }));
  }
  if (p.crop) {
    const c = p.crop; const d1 = ap(g.t, c[0], c[1]), d2 = ap(g.t, c[2], c[3]); const L = Math.min(d1[0], d2[0]), T = Math.min(d1[1], d2[1]), Rr = Math.max(d1[0], d2[0]), B = Math.max(d1[1], d2[1]);
    ui.appendChild(sv('path', { d: `M0 0H${g.w}V${g.h}H0Z M${L} ${T}V${B}H${Rr}V${T}Z`, fill: 'rgba(20,20,24,.55)', 'fill-rule': 'evenodd', style: 'pointer-events:none' }));
    ui.appendChild(sv('rect', { x: L, y: T, width: Rr - L, height: B - T, fill: 'none', stroke: '#0a84ff', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'stroke-dasharray': '6 4', style: 'pointer-events:none' }));
  }
  if (S.sel && S.sel.pageId === p.id && selIds().length > 1) {
    const ids = new Set(selIds()); const list = p.annots.filter((z) => ids.has(z.id)); const pad = 4 / S.zoom;
    for (const a of list) { const b = dispBox(a, g); ui.appendChild(sv('rect', { class: 'selbox', x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad })); }
    if (list.length) { const u = unionBox(list, g); ui.appendChild(sv('rect', { class: 'selgroup', x: u.L - pad * 2, y: u.T - pad * 2, width: u.R - u.L + 4 * pad, height: u.B - u.T + 4 * pad })); }
  } else if (S.sel && S.sel.pageId === p.id) {
    const a = p.annots.find((z) => z.id === S.sel.annId);
    if (a && !(S.editing && S.editing.annId === a.id)) {
      const b = dispBox(a, g), pad = 4 / S.zoom, r = 7 / S.zoom;
      ui.appendChild(sv('rect', { class: 'selbox', x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad }));
      ui.appendChild(sv('circle', { class: 'handle-hit', 'data-h': 'se', cx: b.R + pad, cy: b.B + pad, r: r * 2.4 }));
      ui.appendChild(sv('circle', { class: 'handle', 'data-h': 'se', cx: b.R + pad, cy: b.B + pad, r }));
    }
  }
  if (GUIDES && GUIDES.pageId === p.id) {
    if (GUIDES.gx != null) ui.appendChild(sv('line', { class: 'guide', x1: GUIDES.gx, y1: 0, x2: GUIDES.gx, y2: g.h }));
    if (GUIDES.gy != null) ui.appendChild(sv('line', { class: 'guide', x1: 0, y1: GUIDES.gy, x2: g.w, y2: GUIDES.gy }));
  }
  if (MARQ && MARQ.pageId === p.id) ui.appendChild(sv('rect', { class: 'marq', x: MARQ.L, y: MARQ.T, width: MARQ.R - MARQ.L, height: MARQ.B - MARQ.T }));
  svg.appendChild(content); svg.appendChild(ui);
  scheduleThumb(p.id);
}

/* ---------- Inline form fields ---------- */
function fieldValue(doc, f) { return Object.prototype.hasOwnProperty.call(doc.values, f.name) ? doc.values[f.name] : f.value; }
function drawForm(p, el = pageEl(p.id)) {
  if (!el) return; const lay = el.querySelector('.formlayer'); lay.innerHTML = '';
  if (p.kind !== 'pdf') return;
  const doc = S.docs.get(p.docId); const ws = doc && doc.widgets.get(p.index); if (!ws || !ws.length) return;
  const g = geo(p); const Z = S.zoom;
  lay.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none';
  for (const w of ws) {
    const f = w.field; const pts = [ap(g.t, w.x, w.y), ap(g.t, w.x + w.w, w.y + w.h)];
    const L = Math.min(pts[0][0], pts[1][0]) * Z, T = Math.min(pts[0][1], pts[1][1]) * Z, W = Math.abs(pts[0][0] - pts[1][0]) * Z, H = Math.abs(pts[0][1] - pts[1][1]) * Z;
    let node;
    const val = fieldValue(doc, f);
    if (f.type === 'text') {
      node = document.createElement(f.multiline ? 'textarea' : 'input'); node.value = val || '';
      node.addEventListener('input', () => { doc.values[f.name] = node.value; syncField(doc, f, node); });
      node.addEventListener('change', commit);
      node.style.fontSize = Math.max(8, Math.min(H * 0.62, 12 * Z)) + 'px';
    } else if (f.type === 'check' || f.type === 'radio') {
      node = document.createElement('button'); node.type = 'button';
      const on = f.type === 'check' ? !!val : val === w.opt;
      node.setAttribute('aria-pressed', on); node.setAttribute('role', f.type === 'check' ? 'checkbox' : 'radio'); node.setAttribute('aria-checked', on);
      node.innerHTML = on ? icon(f.type === 'check' ? 'check' : 'check') : '';
      node.addEventListener('click', () => {
        if (f.readOnly) return;
        doc.values[f.name] = f.type === 'check' ? !fieldValue(doc, f) : (fieldValue(doc, f) === w.opt ? '' : w.opt);
        refreshForms(doc); commit();
      });
    } else if (f.type === 'drop') {
      node = document.createElement('select');
      node.innerHTML = '<option value=""></option>' + (f.options || []).map((o) => `<option${o === val ? ' selected' : ''}>${esc(o)}</option>`).join('');
      node.addEventListener('change', () => { doc.values[f.name] = node.value; refreshForms(doc); commit(); });
      node.style.fontSize = Math.max(8, Math.min(H * 0.6, 12 * Z)) + 'px';
    }
    if (!node) continue;
    node.className = 'ff ff-' + f.type; node.dataset.field = f.name; node.title = f.name; node.setAttribute('aria-label', f.name);
    if (f.readOnly) node.disabled = true;
    Object.assign(node.style, { position: 'absolute', left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px', pointerEvents: 'auto' });
    lay.appendChild(node);
  }
}
function syncField(doc, f, src) { scheduleSave(); for (const n of $$(`.ff[data-field="${CSS.escape(f.name)}"]`)) if (n !== src && n.tagName !== 'BUTTON') n.value = doc.values[f.name]; }
function refreshForms(doc) { for (const p of S.pages) if (p.docId === doc.id) drawForm(p); }

/* ---------- Thumbnails ---------- */
const sbList = $('#sbList');
const thumbCache = new Map();
let thumbQ = new Set(), thumbBusy = false;
const thumbIO = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) { thumbIO.unobserve(e.target); scheduleThumb(e.target.dataset.id); } }, { root: document.getElementById('sbList'), rootMargin: '400px 0px' });
function renderThumbs() {
  thumbIO.disconnect();
  sbList.innerHTML = '';
  S.pages.forEach((p, i) => {
    const b = document.createElement('button'); b.className = 'thumb'; b.dataset.id = p.id; b.draggable = true;
    b.setAttribute('aria-label', `Page ${i + 1}`);
    b.innerHTML = `<div class="tw"><canvas width="1" height="1"></canvas></div><span class="tn">${i + 1}</span><span class="chk">${icon('check', 'style="width:13px;height:13px;stroke-width:2.6"')}</span>`;
    sbList.appendChild(b); thumbIO.observe(b);
  });
  markThumbs();
  $('#sbTitle').textContent = S.pages.length ? `${S.pages.length} page${S.pages.length > 1 ? 's' : ''}` : 'Pages';
}
function markThumbs() {
  $$('.thumb', sbList).forEach((b, i) => { b.classList.toggle('current', i === S.current); b.classList.toggle('sel', S.selPages.has(b.dataset.id)); });
}
function scheduleThumb(id) { const tb = sbList.querySelector(`.thumb[data-id="${id}"]`); if (tb && !tb._seen) { const r = tb.getBoundingClientRect(), lr = sbList.getBoundingClientRect(); if (!sbList.offsetParent || r.bottom < lr.top - 400 || r.top > lr.bottom + 400) { return; } tb._seen = true; } thumbQ.add(id); if (!thumbBusy) setTimeout(runThumbs, 60); }
async function runThumbs() {
  if (thumbBusy) return; thumbBusy = true;
  while (thumbQ.size) {
    const id = thumbQ.values().next().value; thumbQ.delete(id);
    const p = pageById(id); const b = sbList.querySelector(`.thumb[data-id="${id}"]`); if (!p || !b) continue;
    try { await paintThumb(p, b.querySelector('canvas')); } catch (e) { console.error(e); }
  }
  thumbBusy = false;
}
async function basePageBitmap(p, s) {
  const key = p.id + '|' + tr(p);
  if (thumbCache.has(key)) return thumbCache.get(key);
  const g = geo(p); const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(g.w * s)); c.height = Math.max(1, Math.round(g.h * s));
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  if (p.kind === 'pdf') { const pg = await S.docs.get(p.docId).pdf.getPage(p.index + 1); await pg.render({ canvasContext: x, viewport: pg.getViewport({ scale: s, rotation: tr(p) }) }).promise; }
  else if (p.kind === 'img') { const t = g.t; x.setTransform(t[0] * s, t[1] * s, t[2] * s, t[3] * s, t[4] * s, t[5] * s); const [x0, y0, x1, y1] = p.view; x.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1); x.drawImage(S.imgs.get(p.imgId).el, 0, 0, 1, 1); }
  thumbCache.set(key, c); return c;
}
async function paintThumb(p, cv) {
  const g = geo(p); const dpr = Math.min(devicePixelRatio || 1, 2); const s = Math.min(150 / g.w, 196 / g.h) * dpr;
  const basec = await basePageBitmap(p, s);
  cv.width = basec.width; cv.height = basec.height; cv.style.width = basec.width / dpr + 'px'; cv.style.height = basec.height / dpr + 'px';
  const x = cv.getContext('2d'); x.drawImage(basec, 0, 0);
  if (p.annots.length) {
    const svg = sv('svg', { xmlns: SVGNS, viewBox: `0 0 ${g.w} ${g.h}`, width: basec.width, height: basec.height });
    const content = sv('g', { transform: `matrix(${g.t.join(' ')})` }); p.annots.forEach((a) => content.appendChild(annNode(a))); svg.appendChild(content);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
    try { const im = await loadImageEl(url); x.drawImage(im, 0, 0); } catch (e) {}
  }
}

/* ---------- Scroll, zoom ---------- */
let scrollRaf = 0;
function onScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0; if (!S.pages.length) return;
    const mid = viewer.scrollTop + viewer.clientHeight * 0.35; let cur = 0;
    $$('.page', pagesEl).forEach((el, i) => { if (el.offsetTop <= mid) cur = i; });
    if (cur !== S.current) { S.current = cur; markThumbs(); const tb = sbList.children[cur]; if (tb && !sbList.matches(':hover')) tb.scrollIntoView({ block: 'nearest' }); }
    $('#pageInd').textContent = `${S.current + 1} / ${S.pages.length}`;
  });
}
viewer.addEventListener('scroll', onScroll, { passive: true });
function scrollToPage(i, smooth = true) { const el = $$('.page', pagesEl)[i]; if (el) viewer.scrollTo({ top: el.offsetTop - 18, behavior: smooth ? 'smooth' : 'auto' }); }
function setZoom(z, fit = false) {
  if (!S.pages.length) return;
  const ratio = viewer.scrollTop / Math.max(1, viewer.scrollHeight);
  S.fit = fit; S.zoom = fit ? fitZoom() : clamp(z, 0.25, 5);
  closeEditor(false);
  S.pages.forEach((p) => { const el = pageEl(p.id); const g = geo(p); el.style.width = g.w * S.zoom + 'px'; el.style.height = g.h * S.zoom + 'px'; el.style.setProperty('--total-scale-factor', S.zoom); el.style.setProperty('--scale-factor', S.zoom); if (el._vis) { el._ov = true; drawOverlay(p, el); drawForm(p, el); } else el._ov = false; });
  if (FIND.q) paintFind();
  viewer.scrollTop = ratio * viewer.scrollHeight; rerenderVisible(); updateZoomLbl();
  if (CMP.marks.size) setTimeout(paintCmp, 60);
}
function updateZoomLbl() { $('#zoomLbl').textContent = Math.round(S.zoom * 75) + '%'; }
let resizeT; addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (S.fit && S.pages.length) setZoom(0, true); }, 150); });
viewer.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey) || !S.pages.length) return; e.preventDefault(); setZoom(S.zoom * Math.exp(-e.deltaY * 0.0025)); }, { passive: false });

/* ---------- Pointer interaction ---------- */
function ptFromEvent(e, el) { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom]; }
let drag = null, lastTap = { t: 0, id: null };
function addTextAt(p, pt, note) {
  const g = geo(p); const size = note ? Math.min(S.style.size, 11) : S.style.size; const r = tr(p);
  const a = { id: uid('a'), t: 'text', r, text: '', size, color: note ? '#000000' : S.style.ink, w: 1, h: 1, ax: 0, ay: 0 };
  if (note) a.bg = S.style.noteBg || '#fff3a6';
  const bx = textBox(a); a.w = bx.w; a.h = bx.h;
  const topLeftDisp = [pt[0], pt[1] - size * 0.6 - bx.pad];
  const [ax, ay] = ap(g.i, topLeftDisp[0], topLeftDisp[1] + a.h); a.ax = ax; a.ay = ay;
  p.annots.push(a); openEditor(p, a, true);
}
pagesEl.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.page'); if (!el || e.button > 0) return;
  if (e.target.closest('.ff')) return;
  const p = pageById(el.dataset.id); const g = geo(p); const pt = ptFromEvent(e, el);
  const pdfPt = ap(g.i, pt[0], pt[1]);
  closeMenu();
  if (S.editing) { closeEditor(false); if (S.tool === 'text') { return; } }
  const tool = S.tool;
  if (tool === 'edittext') {
    const hit = e.target.closest('.ann'); if (hit) { const a = p.annots.find((z) => z.id === hit.dataset.id); if (a && a.t === 'text') { e.preventDefault(); openEditor(p, a); } return; }
    const span = e.target.closest('.textLayer span'); e.preventDefault();
    if (!span) { if (!el._tlReady) toast('Text is still loading on this page'); else if (!el.querySelector('.textLayer span')) toast('This page has no editable text. It may be a scan. Use Whiteout and Text instead.'); return; }
    editExistingLine(p, el, span); return;
  }
  if (tool === 'select') {
    const h = e.target.closest('.handle, .handle-hit');
    const hit = e.target.closest('.ann');
    if (h && S.sel && S.sel.pageId === p.id) {
      const a = p.annots.find((z) => z.id === S.sel.annId); if (!a) return;
      drag = { mode: 'resize', p, el, g, a, orig: JSON.parse(JSON.stringify(a)), box: dispBox(a, g), start: pt, id: e.pointerId };
    } else if (hit) {
      const a = p.annots.find((z) => z.id === hit.dataset.id); if (!a) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) { e.preventDefault(); select(p.id, a.id, { add: true }); return; }
      const now = Date.now();
      if (a.t === 'text' && lastTap.id === a.id && now - lastTap.t < 380) { lastTap = { t: 0, id: null }; e.preventDefault(); openEditor(p, a); return; }
      lastTap = { t: now, id: a.id };
      if (!(S.sel && S.sel.pageId === p.id && selIds().includes(a.id))) select(p.id, a.id);
      const ids = selIds(); const list = p.annots.filter((z) => ids.includes(z.id));
      drag = { mode: 'move', p, el, g, a, orig: JSON.parse(JSON.stringify(a)), group: list.map((z) => ({ id: z.id, orig: JSON.parse(JSON.stringify(z)) })), box: unionBox(list, g), targets: snapTargets(p, g, ids), start: pt, id: e.pointerId };
    } else if (e.shiftKey && !e.target.closest('.textLayer span')) {
      drag = { mode: 'marquee', p, el, g, start: pt, base: S.sel && S.sel.pageId === p.id ? selIds().slice() : [], id: e.pointerId };
    } else { if (S.sel) { select(null); } return; }
    e.preventDefault(); el.querySelector('svg.ov').setPointerCapture(e.pointerId); return;
  }
  e.preventDefault();
  const c = (k) => (k === 'hl' ? S.style.hl : S.style.ink);
  if (tool === 'text' || tool === 'note') {
    const hitText = [...p.annots].reverse().find((a) => a.t === 'text' && (() => { const b = dispBox(a, g); return pt[0] >= b.L && pt[0] <= b.R && pt[1] >= b.T && pt[1] <= b.B; })());
    if (hitText) { openEditor(p, hitText); return; }
    addTextAt(p, pt, tool === 'note'); return;
  }
  if (tool === 'stamp') {
    const st = S.pendingStamp; if (!st) return; const r = tr(p);
    const a = { id: uid('a'), t: 'text', r, text: st.text, size: st.plain ? 11 : 16, color: st.color, bold: !st.plain, border: !st.plain, w: 1, h: 1, ax: 0, ay: 0 };
    const bx = textBox(a); a.w = bx.w; a.h = bx.h;
    const [ax, ay] = ap(g.i, pt[0] - a.w / 2, pt[1] + a.h / 2); a.ax = ax; a.ay = ay;
    p.annots.push(a); drawOverlay(p, el); commit(); setTool('select'); select(p.id, a.id); return;
  }
  if (tool === 'tick' || tool === 'cross' || tool === 'image') {
    let w, h, imgId;
    if (tool === 'image') { const it = S.pendingImg; if (!it) return; imgId = it.big ? it.id : ensureLibImg(it); const gw = geo(p).w; const maxW = it.big ? Math.min(gw * 0.6, 320) : 150, maxH = it.big ? 320 : 90; w = maxW; h = w * it.h / it.w; if (h > maxH) { h = maxH; w = h * it.w / it.h; } }
    else { w = h = Math.max(8, S.style.size * 1.2); }
    const r = tr(p); const [ax, ay] = ap(g.i, pt[0] - w / 2, pt[1] + h / 2);
    const a = { id: uid('a'), t: tool, r, w, h, ax, ay, color: S.style.ink, width: Math.max(1.2, S.style.width * 1.2), imgId };
    p.annots.push(a); drawOverlay(p, el); commit();
    if (tool === 'image') { setTool('select'); select(p.id, a.id); toast('Placed. Drag to move, use the corner to resize.'); }
    return;
  }
  if (tool === 'crop') { drag = { mode: 'crop', p, el, g, start: pt, startPdf: pdfPt, id: e.pointerId, cur: pdfPt }; el.querySelector('svg.ov').setPointerCapture(e.pointerId); return; }
  // drag-to-create tools
  let a;
  if (BOXES.has(tool)) a = { id: uid('a'), t: tool, x: pdfPt[0], y: pdfPt[1], w: 0, h: 0, color: c(tool), width: S.style.width };
  else if (tool === 'line' || tool === 'arrow') a = { id: uid('a'), t: tool, pts: [pdfPt, pdfPt.slice()], color: S.style.ink, width: S.style.width };
  else if (tool === 'pen') a = { id: uid('a'), t: 'pen', pts: [pdfPt], color: S.style.ink, width: S.style.width };
  if (!a) return;
  p.annots.push(a);
  drag = { mode: 'create', p, el, g, a, start: pt, startPdf: pdfPt, id: e.pointerId };
  el.querySelector('svg.ov').setPointerCapture(e.pointerId);
});
pagesEl.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const { p, el, g, a } = drag; const pt = ptFromEvent(e, el); const pdfPt = ap(g.i, pt[0], pt[1]);
  if (drag.mode === 'crop') { drag.cur = pdfPt; const [x0, y0] = drag.startPdf; p.crop = [Math.min(x0, pdfPt[0]), Math.min(y0, pdfPt[1]), Math.max(x0, pdfPt[0]), Math.max(y0, pdfPt[1])]; drawOverlay(p, el); return; }
  if (drag.mode === 'create') {
    if (BOXES.has(a.t)) { const [x0, y0] = drag.startPdf; a.x = Math.min(x0, pdfPt[0]); a.y = Math.min(y0, pdfPt[1]); a.w = Math.abs(pdfPt[0] - x0); a.h = Math.abs(pdfPt[1] - y0); }
    else if (a.t === 'pen') { const lp = a.pts[a.pts.length - 1]; if (Math.hypot(lp[0] - pdfPt[0], lp[1] - pdfPt[1]) > 0.6 / S.zoom + 0.3) a.pts.push(pdfPt); }
    else { let q = pdfPt; if (e.shiftKey) { const [x0, y0] = a.pts[0]; const dx = q[0] - x0, dy = q[1] - y0, an = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, L = Math.hypot(dx, dy); q = [x0 + L * Math.cos(an), y0 + L * Math.sin(an)]; } a.pts[1] = q; }
    drawOverlay(p, el); return;
  }
  const dx = pt[0] - drag.start[0], dy = pt[1] - drag.start[1];
  if (!drag.moved && Math.hypot(dx, dy) * S.zoom < 3) return;
  drag.moved = true;
  if (drag.mode === 'marquee') {
    MARQ = { pageId: p.id, L: Math.min(pt[0], drag.start[0]), T: Math.min(pt[1], drag.start[1]), R: Math.max(pt[0], drag.start[0]), B: Math.max(pt[1], drag.start[1]) };
    const hits = p.annots.filter((z) => { const b = dispBox(z, g); return b.R >= MARQ.L && b.L <= MARQ.R && b.B >= MARQ.T && b.T <= MARQ.B; }).map((z) => z.id);
    const ids = [...new Set([...drag.base, ...hits])]; if (ids.length) select(p.id, null, { ids }); else { S.sel = null; drawOverlay(p, el); refreshFormatBar(); }
    return;
  }
  if (drag.mode === 'move' && drag.group) {
    let mdx = dx, mdy = dy; GUIDES = null;
    if (!e.altKey) { const sn = snapMove(drag.box, dx, dy, drag.targets, 5 / S.zoom); mdx = sn.dx; mdy = sn.dy; if (sn.gx != null || sn.gy != null) GUIDES = { pageId: p.id, gx: sn.gx, gy: sn.gy }; }
    const T = pdfAffineFromDisplay(g, (x, y) => [x + mdx, y + mdy]);
    for (const it of drag.group) { const f = JSON.parse(JSON.stringify(it.orig)); applyT(f, T); const i = p.annots.findIndex((z) => z.id === it.id); if (i >= 0) p.annots[i] = f; if (it.id === a.id) drag.a = f; }
    drawOverlay(p, el); return;
  }
  const fresh = JSON.parse(JSON.stringify(drag.orig)); const idx = p.annots.findIndex((z) => z.id === a.id);
  if (drag.mode === 'move') applyT(fresh, pdfAffineFromDisplay(g, (x, y) => [x + dx, y + dy]));
  else {
    const b = drag.box; const W0 = Math.max(1e-3, b.R - b.L), H0 = Math.max(1e-3, b.B - b.T);
    let sx = Math.max(0.05, (W0 + dx) / W0), sy = Math.max(0.05, (H0 + dy) / H0);
    const uniform = ORIENTED.has(a.t) || e.shiftKey; if (uniform && !ORIENTED.has(a.t)) { const s = Math.max(sx, sy); sx = sy = s; }
    applyT(fresh, pdfAffineFromDisplay(g, (x, y) => [b.L + (x - b.L) * sx, b.T + (y - b.T) * sy]), uniform);
    if (ORIENTED.has(a.t)) { const nb = dispBox(fresh, g); applyT(fresh, pdfAffineFromDisplay(g, (x, y) => [x + b.L - nb.L, y + b.T - nb.T])); }
  }
  p.annots[idx] = fresh; drag.a = fresh; drawOverlay(p, el);
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { p, el, a, mode, moved, group } = drag; drag = null;
  if (mode === 'marquee') { MARQ = null; drawOverlay(p, el); refreshFormatBar(); return; }
  if (mode === 'move') { GUIDES = null; if (!moved && group && group.length > 1) { S.sel = { pageId: p.id, annId: a.id }; } }
  if (mode === 'crop') { const c = p.crop; const g = geo(p); if (c) { const d1 = ap(g.t, c[0], c[1]), d2 = ap(g.t, c[2], c[3]); if (Math.abs(d2[0] - d1[0]) * S.zoom < 20 || Math.abs(d2[1] - d1[1]) * S.zoom < 20) p.crop = null; } drawOverlay(p, el); commit(); refreshFormatBar(); return; }
  if (mode === 'create') {
    let keep = true; const g = geo(p); const b = dispBox(a, g); const big = Math.max(b.R - b.L, b.B - b.T) * S.zoom;
    if (BOXES.has(a.t) && big < 6) {
      if (a.t === 'white' || a.t === 'hl' || a.t === 'redact') { const [ax, ay] = ap(g.i, b.L - 50, b.T + 8); const [bx, by] = ap(g.i, b.L + 50, b.T - 8); a.x = Math.min(ax, bx); a.y = Math.min(ay, by); a.w = Math.abs(bx - ax); a.h = Math.abs(by - ay); }
      else keep = false;
    } else if ((a.t === 'line' || a.t === 'arrow') && big < 6) keep = false;
    else if (a.t === 'pen' && a.pts.length < 2) { a.pts.push([a.pts[0][0] + 0.01, a.pts[0][1]]); }
    if (!keep) p.annots = p.annots.filter((z) => z.id !== a.id);
    drawOverlay(p, el); commit(); return;
  }
  drawOverlay(p, el); commit(); refreshFormatBar();
}
pagesEl.addEventListener('pointerup', endDrag);
pagesEl.addEventListener('pointercancel', endDrag);
pagesEl.addEventListener('dblclick', (e) => {
  const hit = e.target.closest('.ann'); const el = e.target.closest('.page'); if (!hit || !el) return;
  const p = pageById(el.dataset.id); const a = p.annots.find((z) => z.id === hit.dataset.id); if (a && a.t === 'text') openEditor(p, a);
});

pagesEl.addEventListener('contextmenu', (e) => {
  const el = e.target.closest('.page'); if (!el || e.target.closest('.ff')) return;
  const hit = e.target.closest('.ann');
  if (!hit && String(getSelection() || '').trim()) return;
  e.preventDefault(); if (S.editing) closeEditor(false);
  const p = pageById(el.dataset.id); const pt = ptFromEvent(e, el); const pi = S.pages.indexOf(p);
  S.current = pi; if (!S.selPages.has(p.id)) S.selPages.clear(); markThumbs();
  const at = { x: e.clientX, y: e.clientY }; let items;
  if (hit) {
    const id = hit.dataset.id; if (S.tool !== 'select') setTool('select');
    if (!(S.sel && S.sel.pageId === p.id && selIds().includes(id))) select(p.id, id);
    const n = selIds().length; const a = p.annots.find((z) => z.id === id);
    items = [{ h: n > 1 ? `${n} items selected` : annLabel(a) }];
    if (n === 1 && a.t === 'text') items.push({ label: 'Edit text', icon: 'edit', run: () => openEditor(p, a) });
    items.push(
      { label: 'Copy', icon: 'copy', kbd: 'Ctrl C', run: () => copySelected(false) },
      { label: 'Cut', icon: 'cut', kbd: 'Ctrl X', run: () => copySelected(true) },
      { label: 'Duplicate', icon: 'dup', kbd: 'Ctrl D', run: duplicateSelected });
    if (n === 1) items.push({ label: 'Copy to other pages…', icon: 'pages', run: openCopyToPages });
    items.push('-', { label: 'Bring to front', icon: 'front', kbd: 'Ctrl ]', run: () => reorderSelected(true) }, { label: 'Send to back', icon: 'back', kbd: 'Ctrl [', run: () => reorderSelected(false) });
    if (n > 1) items.push('-', { h: 'Align' }, { label: 'Left edges', icon: 'al', run: () => alignSelected('l') }, { label: 'Centres', icon: 'ac', run: () => alignSelected('c') }, { label: 'Right edges', icon: 'ar', run: () => alignSelected('r') }, { label: 'Top edges', icon: 'at', run: () => alignSelected('t') }, { label: 'Middles', icon: 'am', run: () => alignSelected('m') }, { label: 'Bottom edges', icon: 'ab', run: () => alignSelected('b') });
    items.push('-', { label: n > 1 ? `Delete ${n} items` : 'Delete', icon: 'trash', kbd: 'Del', run: deleteSelected });
  } else {
    if (S.sel) select(null);
    items = [{ h: `Page ${pi + 1} of ${S.pages.length}` },
      { label: CLIP ? (CLIP.items.length > 1 ? `Paste ${CLIP.items.length} items here` : 'Paste here') : 'Paste', icon: 'paste', kbd: 'Ctrl V', run: () => pasteClip(p, pt), disabled: !CLIP },
      { label: 'Add text here', icon: 'text', run: () => { setTool('text'); addTextAt(p, pt, false); } },
      { label: 'Add note here', icon: 'note', run: () => { setTool('note'); addTextAt(p, pt, true); } },
      { label: 'Select all marks on page', icon: 'selall', kbd: 'Ctrl A', run: () => selectAllOnPage(p), disabled: !p.annots.length },
      '-', { h: 'Page' },
      { label: 'Rotate left', icon: 'rotl', run: () => pageAction('rotl') },
      { label: 'Rotate right', icon: 'rotr', run: () => pageAction('rotr') },
      { label: 'Duplicate page', icon: 'dup', run: () => pageAction('dup') },
      { label: 'Insert blank page after', icon: 'blank', run: () => pageAction('blank') },
      { label: 'Delete page', icon: 'trash', run: () => pageAction('del') }];
  }
  openMenu(el, items, at);
});
function select(pageId, annId, o = {}) {
  const prev = S.sel;
  if (o.ids) S.sel = o.ids.length ? { pageId, annId: o.ids[o.ids.length - 1], ids: o.ids.slice() } : null;
  else if (o.add && prev && prev.pageId === pageId) { const ids = selIds().slice(); const i = ids.indexOf(annId); if (i >= 0) ids.splice(i, 1); else ids.push(annId); S.sel = ids.length ? { pageId, annId: ids[ids.length - 1], ids } : null; }
  else S.sel = pageId ? { pageId, annId } : null;
  if (prev && prev.pageId !== pageId) { const pp = pageById(prev.pageId); if (pp) drawOverlay(pp); }
  if (pageId) drawOverlay(pageById(pageId));
  refreshFormatBar();
}
function selectedAnn() { if (!S.sel) return null; const p = pageById(S.sel.pageId); const a = p && p.annots.find((z) => z.id === S.sel.annId); return a ? { p, a } : null; }
function deleteSelected() { const s = selAnns(); if (!s) return; const ids = new Set(s.as.map((a) => a.id)); s.p.annots = s.p.annots.filter((z) => !ids.has(z.id)); S.sel = null; drawOverlay(s.p); commit(); refreshFormatBar(); }
function duplicateSelected() {
  const s = selAnns(); if (!s) return; const g = geo(s.p); const T = pdfAffineFromDisplay(g, (x, y) => [x + 12, y + 12]);
  const cs = s.as.map((a) => { const c = JSON.parse(JSON.stringify(a)); c.id = uid('a'); applyT(c, T); return c; });
  s.p.annots.push(...cs); select(s.p.id, null, { ids: cs.map((c) => c.id) }); commit();
}
function copySelected(cut) {
  const s = selAnns(); if (!s) return false; const g = geo(s.p);
  CLIP = { pageId: s.p.id, rot: tr(s.p), box: unionBox(s.as, g), items: s.as.map((a) => JSON.parse(JSON.stringify(a))) };
  if (cut) deleteSelected(); toast(`${cut ? 'Cut' : 'Copied'} ${s.as.length} item${s.as.length > 1 ? 's' : ''}`); return true;
}
function pasteClip(p, at) {
  if (!CLIP) return; p = p || S.pages[S.current]; if (!p) return; const g = geo(p);
  let items = CLIP.items.map((a) => { const c = JSON.parse(JSON.stringify(a)); c.id = uid('a'); return c; });
  const src = pageById(CLIP.pageId); if (CLIP.pageId !== p.id && src) { const g1 = geo(src), t1 = tr(src), t2 = tr(p); items = CLIP.items.map((a) => mapAnnot(a, g1, t1, g, t2)); }
  const u = unionBox(items, g); let dx = 0, dy = 0;
  if (at) { dx = at[0] - u.L; dy = at[1] - u.T; } else if (CLIP.pageId === p.id) { dx = 12; dy = 12; }
  if (dx || dy) { const T = pdfAffineFromDisplay(g, (x, y) => [x + dx, y + dy]); items.forEach((c) => applyT(c, T)); }
  if (CLIP.pageId === p.id && !at) CLIP.items = items.map((c) => JSON.parse(JSON.stringify(c)));
  p.annots.push(...items); select(p.id, null, { ids: items.map((c) => c.id) }); commit();
}
function reorderSelected(front) {
  const s = selAnns(); if (!s) return; const ids = new Set(s.as.map((a) => a.id)); const rest = s.p.annots.filter((z) => !ids.has(z.id));
  s.p.annots = front ? [...rest, ...s.as] : [...s.as, ...rest]; drawOverlay(s.p); commit();
}
function alignSelected(k) {
  const s = selAnns(); if (!s || s.as.length < 2) return; const g = geo(s.p); const u = unionBox(s.as, g);
  s.p.annots = s.p.annots.map((a) => {
    if (!s.as.includes(a)) return a; const b = dispBox(a, g); let dx = 0, dy = 0;
    if (k === 'l') dx = u.L - b.L; else if (k === 'r') dx = u.R - b.R; else if (k === 'c') dx = (u.L + u.R) / 2 - (b.L + b.R) / 2;
    else if (k === 't') dy = u.T - b.T; else if (k === 'b') dy = u.B - b.B; else if (k === 'm') dy = (u.T + u.B) / 2 - (b.T + b.B) / 2;
    const c = JSON.parse(JSON.stringify(a)); applyT(c, pdfAffineFromDisplay(g, (x, y) => [x + dx, y + dy])); return c;
  });
  drawOverlay(s.p); commit();
}
function selectAllOnPage(p) { p = p || S.pages[S.current]; if (!p || !p.annots.length) return; if (S.tool !== 'select') setTool('select'); select(p.id, null, { ids: p.annots.map((a) => a.id) }); }
function annLabel(a) { return ({ text: a.bg ? 'Note' : a.border ? 'Stamp' : 'Text', white: 'Whiteout', hl: 'Highlight', redact: 'Redaction', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', arrow: 'Arrow', pen: 'Drawing', image: 'Image', stamp: 'Stamp', sign: 'Signature', mark: a.kind === 'hl' ? 'Text highlight' : 'Text markup', tick: 'Tick', cross: 'Cross' })[a.t] || 'Item'; }

/* ---------- Text editor ---------- */
function openEditor(p, a, isNew = false) {
  closeEditor(false); setTool(S.tool);
  const el = pageEl(p.id); const g = geo(p); S.editing = { pageId: p.id, annId: a.id, isNew }; S.sel = { pageId: p.id, annId: a.id };
  drawOverlay(p, el);
  const b = dispBox(a, g); const ta = document.createElement('textarea'); ta.className = 'textedit'; ta.id = 'textEditor';
  ta.value = a.text || ''; ta.spellcheck = true; ta.setAttribute('aria-label', 'Text');
  const fs = a.size * S.zoom; const pz = tpad(a) * S.zoom;
  Object.assign(ta.style, { left: el.offsetLeft + b.L * S.zoom + 'px', top: el.offsetTop + b.T * S.zoom + 'px', fontSize: fs + 'px', color: a.color, minWidth: Math.max(40, fs * 2) + 'px', padding: pz + 'px', fontWeight: a.bold ? '700' : '400', fontFamily: FONT_CSS[a.font || 'helv'] + ', ' + UNI_FALLBACK, background: a.bg || (a.cover ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.85)') });
  const fitTa = () => { ta.style.width = '0px'; ta.style.height = '0px'; ta.style.width = Math.max(fs * 2, ta.scrollWidth + fs * 0.6) + 'px'; ta.style.height = ta.scrollHeight + 'px'; };
  ta.addEventListener('input', fitTa);
  ta.addEventListener('keydown', (e) => { if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); closeEditor(false); } e.stopPropagation(); });
  ta.addEventListener('blur', () => setTimeout(() => { if (S.editing && document.activeElement !== ta) closeEditor(false); }, 120));
  pagesEl.appendChild(ta); fitTa(); ta.focus({ preventScroll: true }); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  refreshFormatBar();
}
function closeEditor(silent) {
  const ta = $('#textEditor'); const ed = S.editing; if (!ed) { if (ta) ta.remove(); return; }
  S.editing = null; const p = pageById(ed.pageId); const a = p && p.annots.find((z) => z.id === ed.annId);
  if (ta) ta.remove();
  if (!p || !a) return;
  const txt = ta ? ta.value.replace(/\s+$/, '') : a.text;
  if (a.orig != null && txt === a.orig && !a.touched) { p.annots = p.annots.filter((z) => z !== a && z.id !== a.cover); S.sel = null; }
  else if (!txt.trim()) { p.annots = p.annots.filter((z) => z !== a); S.sel = null; if (a.cover) toast('Text removed'); }
  else { setText(a, txt); if (a.uni) toast('Saved with special characters. That line is stored as a sharp image in the PDF.', { ms: 3200 }); }
  drawOverlay(p); if (!silent) commit(); refreshFormatBar();
}

/* ---------- Text layer: select and copy text ---------- */
async function renderTextLayer(el, p, pg) {
  const div = el.querySelector('.textLayer'); if (!div) return;
  try {
    const tl = new pdfjsLib.TextLayer({ textContentSource: pg.streamTextContent({ includeMarkedContent: true, disableNormalization: true }), container: div, viewport: pg.getViewport({ scale: 1, rotation: tr(p) }) });
    await tl.render(); el._tl = tl; el._pg = pg; pageItems(el, p).catch(() => {});
    if (p.ocr && p.ocr.length) buildOcrLayer(el, p); el._tlReady = true;
    if (FIND.q) paintFind(el);
    if (CMP.marks.size) paintCmp();
  } catch (e) { console.warn('text layer', e); }
}
const textCache = new Map();
const ocrText = (p) => (p.ocr || []).map((w) => w.t + ' ').join('');
async function pageText(p) {
  if (p.ocr && p.ocr.length) return ocrText(p);
  if (p.kind !== 'pdf') return '';
  const k = p.docId + ':' + p.index; if (textCache.has(k)) return textCache.get(k);
  const pg = await S.docs.get(p.docId).pdf.getPage(p.index + 1);
  const tc = await pg.getTextContent({ disableNormalization: true });
  const str = tc.items.map((it) => it.str || '').join(''); textCache.set(k, str); return str;
}

/* Edit existing text: cover the original line and type a replacement in the same place and style */
function sampleColors(el, rect) {
  const c = el.querySelector('canvas'); const p = pageById(el.dataset.id); const g = geo(p);
  const k = c.width / g.w; if (!c.width) return { bg: '#ffffff', fg: '#000000' };
  const x0 = Math.max(0, Math.floor((rect.L - 2) * k)), y0 = Math.max(0, Math.floor((rect.T - 2) * k));
  const x1 = Math.min(c.width, Math.ceil((rect.R + 2) * k)), y1 = Math.min(c.height, Math.ceil((rect.B + 2) * k));
  if (x1 - x0 < 2 || y1 - y0 < 2) return { bg: '#ffffff', fg: '#000000' };
  let d; try { d = c.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0); } catch (e) { return { bg: '#ffffff', fg: '#000000' }; }
  const W = d.width, H = d.height, px = (x, y) => { const i = (y * W + x) * 4; return [d.data[i], d.data[i + 1], d.data[i + 2]]; };
  const counts = new Map(); const add = (c3) => { const q = c3.map((v) => v >> 4).join(','); const e = counts.get(q) || { n: 0, s: [0, 0, 0] }; e.n++; e.s = e.s.map((v, i) => v + c3[i]); counts.set(q, e); };
  for (let x = 0; x < W; x++) { add(px(x, 0)); add(px(x, H - 1)); } for (let y = 0; y < H; y++) { add(px(0, y)); add(px(W - 1, y)); }
  let best = null; for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  const bg = best.s.map((v) => Math.round(v / best.n));
  const far = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const q = px(x, y); const dist = Math.abs(q[0] - bg[0]) + Math.abs(q[1] - bg[1]) + Math.abs(q[2] - bg[2]); if (dist > 140) far.push([dist, q]); }
  far.sort((a, b) => b[0] - a[0]); const top = far.slice(0, Math.max(1, Math.floor(far.length * 0.3)));
  const fg = top.length ? [0, 1, 2].map((i) => Math.round(top.reduce((n, t) => n + t[1][i], 0) / top.length)) : [0, 0, 0];
  const hex = (c3) => '#' + c3.map((v) => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
  return { bg: hex(bg), fg: hex(fg) };
}
function fontOf(el, item) {
  let name = '', fam = '';
  try { const pg = el._pg; if (pg && pg.commonObjs.has(item.fontName)) { const f = pg.commonObjs.get(item.fontName); name = (f && (f.name || f.loadedName)) || ''; } } catch (e) {}
  try { const st = el._tl && el._tl._styles; fam = st && st[item.fontName] ? st[item.fontName].fontFamily : ''; } catch (e) {}
  const n = name + ' ' + fam;
  const font = /courier|mono|consol|typewriter/i.test(n) ? 'cour' : /times|serif(?!.*sans)|georgia|garamond|cambria|book ?antiqua|palatino|minion/i.test(n) && !/sans/i.test(n) ? 'times' : 'helv';
  return { font, bold: /bold|black|heavy|semibold|demi/i.test(name) };
}
function editExistingLine(p, el, span) {
  const divs = el._tl ? el._tl.textDivs : []; const strs = el._tl ? el._tl.textContentItemsStr : [];
  const g = geo(p); const pr = el.getBoundingClientRect(); const Z = S.zoom;
  const box = (sp) => { const r = sp.getBoundingClientRect(); return { L: (r.left - pr.left) / Z, T: (r.top - pr.top) / Z, R: (r.right - pr.left) / Z, B: (r.bottom - pr.top) / Z }; };
  const idx = divs.indexOf(span); if (idx < 0) return;
  const items = el._items; if (!items) { pageItems(el, p).then(() => editExistingLine(p, el, span)); return; }
  const it = items[idx]; if (!it) return;
  const fs = Math.hypot(it.transform[2], it.transform[3]);
  const ang = Math.atan2(...(() => { const t = it.transform; const a = ap(g.t, t[4] + t[0], t[5] + t[1]), o = ap(g.t, t[4], t[5]); return [a[1] - o[1], a[0] - o[0]]; })());
  if (Math.abs(ang) > 0.02) { toast('Only straight horizontal text can be edited. Use Whiteout and Text for this line.'); return; }
  const base = ap(g.t, it.transform[4], it.transform[5]);
  // gather the rest of the line: same baseline and size, side by side
  const cand = [];
  divs.forEach((d, i) => { const t = items[i]; if (!t || !t.str || !d.isConnected) return; const b0 = ap(g.t, t.transform[4], t.transform[5]); const f2 = Math.hypot(t.transform[2], t.transform[3]); if (Math.abs(b0[1] - base[1]) < fs * 0.3 && Math.abs(f2 - fs) < fs * 0.25) cand.push({ d, t, b: box(d), x: b0[0] }); });
  cand.sort((a, b) => a.b.L - b.b.L);
  const k0 = cand.findIndex((c) => c.d === span); if (k0 < 0) return;
  let lo = k0, hi = k0;
  while (lo > 0 && cand[lo].b.L - cand[lo - 1].b.R < fs * 1.2) lo--;
  while (hi < cand.length - 1 && cand[hi + 1].b.L - cand[hi].b.R < fs * 1.2) hi++;
  const parts = cand.slice(lo, hi + 1); let text = '';
  parts.forEach((c, i) => { if (i && c.b.L - parts[i - 1].b.R > fs * 0.18 && !/\s$/.test(text) && !/^\s/.test(c.t.str)) text += ' '; text += c.t.str; });
  text = text.replace(/\s+$/, '');
  const L = Math.min(...parts.map((c) => c.b.L)), R = Math.max(...parts.map((c) => c.b.R));
  const T = Math.min(base[1] - fs * 0.95, ...parts.map((c) => c.b.T)), B = Math.max(base[1] + fs * 0.28, ...parts.map((c) => c.b.B));
  const padX = fs * 0.06, padY = fs * 0.04;
  const rect = { L: L - padX, T: T - padY, R: R + padX, B: B + padY };
  const { bg, fg } = sampleColors(el, rect);
  const c1 = ap(g.i, rect.L, rect.T), c2 = ap(g.i, rect.R, rect.B);
  const cover = { id: uid('a'), t: 'white', fill: bg, x: Math.min(c1[0], c2[0]), y: Math.min(c1[1], c2[1]), w: Math.abs(c2[0] - c1[0]), h: Math.abs(c2[1] - c1[1]), edit: true };
  const ff = fontOf(el, parts[0].t);
  const uni = needsUni(text); const a = { id: uid('a'), t: 'text', r: tr(p), text: uni ? text : sanitize(text), uni, size: Math.round(fs * 100) / 100, color: fg, font: ff.font, bold: ff.bold, w: 1, h: 1, ax: 0, ay: 0, orig: uni ? text : sanitize(text), cover: cover.id };
  const bx = textBox(a); a.w = bx.w; a.h = bx.h;
  const left = Math.min(...parts.map((c) => ap(g.t, c.t.transform[4], c.t.transform[5])[0]));
  const [ax, ay] = ap(g.i, left, base[1] - BASE * a.size + a.h); a.ax = ax; a.ay = ay;
  p.annots.push(cover, a); openEditor(p, a, true);
  const ta = $('#textEditor'); if (ta) { ta.select(); ta.addEventListener('input', () => { a.touched = true; }, { once: true }); }
}
async function pageItems(el, p) {
  if (el._items) return el._items; const pg = el._pg || await S.docs.get(p.docId).pdf.getPage(p.index + 1);
  const tc = await pg.getTextContent({ includeMarkedContent: true, disableNormalization: true });
  el._items = tc.items.filter((x) => x.str !== undefined); if (el._tl && !el._tl._styles) el._tl._styles = tc.styles; return el._items;
}

/* OCR: recognise text on scanned pages (Tesseract, offline) */
function buildOcrLayer(el, p) {
  el._ocrDone = true; let lay = el.querySelector('.ocrLayer'); if (lay) lay.remove();
  if (!p.ocr || !p.ocr.length) return; const g = geo(p);
  lay = document.createElement('div'); lay.className = 'textLayer ocrLayer'; lay.style.inset = '0'; lay.style.width = '100%'; lay.style.height = '100%';
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  for (const w of p.ocr) {
    const { U, V } = UV(w.r); const pts = [[w.ax, w.ay], [w.ax + w.w * U[0], w.ay + w.w * U[1]], [w.ax + w.h * V[0], w.ay + w.h * V[1]]].map(([x, y]) => ap(g.t, x, y));
    const L = Math.min(...pts.map((q) => q[0])), T = Math.min(...pts.map((q) => q[1])), Rr = Math.max(...pts.map((q) => q[0])), B = Math.max(...pts.map((q) => q[1]));
    const fh = (B - T) * 0.92; mctx.font = `${fh}px sans-serif`; const mw = mctx.measureText(w.t).width || 1;
    const sp = document.createElement('span'); sp.textContent = w.t + ' ';
    sp.style.left = (100 * L / g.w).toFixed(3) + '%'; sp.style.top = (100 * T / g.h).toFixed(3) + '%'; sp.style.fontFamily = 'sans-serif';
    sp.style.setProperty('--font-height', fh.toFixed(2) + 'px'); sp.style.setProperty('--scale-x', ((Rr - L) / mw).toFixed(4));
    lay.appendChild(sp);
  }
  el.querySelector('.findlayer').before(lay);
}
let ocrW = null, ocrSeq = 0; const ocrWait = new Map();
function ocrCall(cmd, data) {
  if (!ocrW) { ocrW = new Worker(base + 'tesseract/ocr-worker.js'); ocrW.onmessage = (e) => { const f = ocrWait.get(e.data.id); if (f) { ocrWait.delete(e.data.id); f(e.data); } }; ocrW.onerror = (e) => { for (const f of ocrWait.values()) f({ ok: false, err: e.message || 'OCR failed to start' }); ocrWait.clear(); ocrW = null; }; }
  return new Promise((res) => { const id = ++ocrSeq; ocrWait.set(id, res); ocrW.postMessage({ id, cmd, data }, data ? [data] : []); });
}
async function pageImageForOcr(p) {
  const g = geo(p); const sc = Math.min(300 / 72, 3400 / Math.max(g.w, g.h)); const c = document.createElement('canvas'); c.width = Math.round(g.w * sc); c.height = Math.round(g.h * sc);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  if (p.kind === 'pdf') { const pg = await S.docs.get(p.docId).pdf.getPage(p.index + 1); await pg.render({ canvasContext: x, viewport: pg.getViewport({ scale: sc, rotation: tr(p) }) }).promise; }
  else if (p.kind === 'img') { const im = S.imgs.get(p.imgId); const t = g.t; x.setTransform(t[0] * sc, t[1] * sc, t[2] * sc, t[3] * sc, t[4] * sc, t[5] * sc); const [x0, y0, x1, y1] = p.view; x.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1); x.drawImage(im.el, 0, 0, 1, 1); }
  const blob = await new Promise((r) => c.toBlob(r, 'image/png')); const buf = await blob.arrayBuffer(); c.width = c.height = 0; return { buf, sc };
}
async function ocrPage(p) {
  const { buf, sc } = await pageImageForOcr(p); const r = await ocrCall('ocr', buf); if (!r.ok) throw new Error(r.err);
  const g = geo(p); const words = []; const rot = tr(p);
  for (const line of r.tsv.split('\n')) {
    const c = line.split('\t'); if (c[0] !== '5' || c.length < 12) continue; const t = (c[11] || '').trim(); const conf = +c[10]; if (!t || conf < 35) continue;
    const L = +c[6] / sc, T = +c[7] / sc, W = +c[8] / sc, H = +c[9] / sc; const [ax, ay] = ap(g.i, L, T + H);
    words.push({ t: needsUni(t) ? t : sanitize(t), r: rot, ax, ay, w: W, h: H });
  }
  return words;
}
async function openOcr() {
  if (!S.pages.length) return;
  const cur = S.pages[S.current]; const sh = sheet(`<h2>Recognise text (OCR)</h2><p class="sub">Reads scanned pages so their text can be selected, copied, searched and edited. Works offline. English.</p>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group"><button data-o="need" aria-pressed="true">Scanned pages</button><button data-o="cur" aria-pressed="false">This page</button><button data-o="all" aria-pressed="false">All pages</button></div></div>
    <p class="sub" id="ocrMsg" style="margin:0">Pages that already have real text are skipped.</p>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('search')} Recognise</button></div>`);
  let which = 'need'; let stop = false;
  sh.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => { which = b.dataset.o; sh.querySelectorAll('[data-o]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#ocrMsg').textContent = which === 'need' ? 'Pages that already have real text are skipped.' : which === 'cur' ? `Page ${S.current + 1} only.` : 'Every page, replacing earlier recognised text.'; });
  sh.querySelector('[data-x]').onclick = () => { stop = true; closeSheet(); };
  sh.querySelector('[data-go]').onclick = async () => {
    const btn = sh.querySelector('[data-go]'); btn.disabled = true; const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i'); const msg = sh.querySelector('#ocrMsg');
    let list = which === 'cur' ? [cur] : S.pages.slice();
    if (which === 'need') { const keep = []; for (const p of list) { if (p.ocr && p.ocr.length) continue; const tx = p.kind === 'pdf' ? (await pageText(p)).trim() : ''; if (tx.length < 20) keep.push(p); } list = keep; }
    if (!list.length) { msg.textContent = 'Every page already has text. Choose All pages to read them again.'; btn.disabled = false; pr.hidden = true; return; }
    try {
      msg.textContent = 'Starting the text recogniser…'; const ini = await ocrCall('init'); if (!ini.ok) throw new Error(ini.err);
      let n = 0, words = 0;
      for (const p of list) {
        if (stop) break; msg.textContent = `Reading page ${S.pages.indexOf(p) + 1} (${n + 1} of ${list.length})…`;
        p.ocr = await ocrPage(p); words += p.ocr.length; n++; bar.style.width = Math.round(n / list.length * 100) + '%';
        textCache.delete(p.docId + ':' + p.index); const el = pageEl(p.id); if (el) { el._ocrDone = false; buildOcrLayer(el, p); el._tlReady = true; }
      }
      commit(); closeSheet();
      toast(words ? `Recognised ${words} words on ${n} page${n > 1 ? 's' : ''}. You can now select, copy and search them.` : 'No readable text was found. Try a sharper scan.', { ms: 4500, err: !words });
    } catch (e) { console.error(e); toast('Text recognition failed: ' + e.message, { err: true, ms: 5000 }); btn.disabled = false; pr.hidden = true; }
  };
}

/* Compare two versions */
const CMP = { marks: new Map(), list: [], name: '' };
async function tokensOfPage(p, pdfOverride) {
  if (p && p.ocr && p.ocr.length) { const str = ocrText(p); const toks = []; const re = /\S+/g; let m; while ((m = re.exec(str))) toks.push({ w: m[0], s: m.index, e: m.index + m[0].length }); return { str, toks }; }
  let pg = null;
  if (pdfOverride) pg = pdfOverride; else if (p && p.kind === 'pdf') pg = await S.docs.get(p.docId).pdf.getPage(p.index + 1); else return { str: '', toks: [] };
  const tc = await pg.getTextContent({ disableNormalization: true }); let str = ''; const toks = [];
  for (const it of tc.items) { if (it.str === undefined) continue; const base = str.length; const re = /\S+/g; let m; while ((m = re.exec(it.str))) toks.push({ w: m[0], s: base + m.index, e: base + m.index + m[0].length }); str += it.str; }
  return { str, toks };
}
function diffWords(A, B) {
  const N = A.length, M = B.length, MAX = N + M; if (!MAX) return [];
  const off = MAX + 1; const v = new Int32Array(2 * MAX + 3); const trace = [];
  for (let d = 0; d <= MAX; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) ? v[off + k + 1] : v[off + k - 1] + 1; let y = x - k;
      while (x < N && y < M && A[x] === B[y]) { x++; y++; } v[off + k] = x;
      if (x >= N && y >= M) {
        const ops = []; let cx = N, cy = M;
        for (let dd = d; dd > 0; dd--) {
          const tv = trace[dd]; const at = (kk) => tv[kk + dd + 1]; const kk = cx - cy;
          const prevK = (kk === -dd || (kk !== dd && at(kk - 1) < at(kk + 1))) ? kk + 1 : kk - 1; const px = at(prevK), py = px - prevK;
          while (cx > px && cy > py) { ops.push(['eq', cx - 1, cy - 1]); cx--; cy--; }
          if (cx === px) { ops.push(['ins', cx, cy - 1]); cy--; } else { ops.push(['del', cx - 1, cy]); cx--; }
        }
        while (cx > 0 && cy > 0) { ops.push(['eq', cx - 1, cy - 1]); cx--; cy--; }
        return ops.reverse();
      }
    }
    if (d > 3000) return null;
  }
  return null;
}
function openCompare() {
  const others = WS.list.map((t, k) => ({ t, k })).filter((o) => o.k !== WS.active && o.t.pages.length);
  const sh = sheet(`<h2>Compare with another version</h2><p class="sub">Shows what changed between this document and another, word by word, page by page. Changes are marked on this document.</p>
    ${others.length ? `<div class="field"><span class="flabel">Open documents</span><div class="tpl-list">${others.map((o) => `<div class="tpl"><div><b>${esc(o.t.name)}</b><small>${o.t.pages.length} pages</small></div><span><button class="btn" data-tab="${o.k}">Compare</button></span></div>`).join('')}</div></div>` : ''}
    <div class="acts" style="justify-content:space-between"><button class="btn" data-x>Cancel</button><button class="btn primary" data-file>${icon('open')} Choose a file…</button></div>`, { wide: true });
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-file]').onclick = () => { closeSheet(); $('#fileCmp').click(); };
  sh.querySelectorAll('[data-tab]').forEach((b) => b.onclick = async () => { const o = WS.list[+b.dataset.tab]; closeSheet(); await runCompare(o.name, o.pages.map((pp) => () => tokensOfPage(pp))); });
}
$('#fileCmp').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: new Uint8Array(await f.arrayBuffer()) }).promise; const getters = []; for (let i = 1; i <= pdf.numPages; i++) getters.push(async () => tokensOfPage(null, await pdf.getPage(i)));
    await runCompare(f.name.replace(/\.pdf$/i, ''), getters); try { pdf.loadingTask.destroy(); } catch (er) {} }
  catch (er) { toast('Could not open that file for comparison', { err: true }); }
});
async function runCompare(name, otherGetters) {
  const t0 = toast('Comparing…', { spin: true, sticky: true }); CMP.marks.clear(); CMP.list = []; CMP.name = name;
  try {
    const n = Math.max(S.pages.length, otherGetters.length);
    for (let i = 0; i < n; i++) {
      const A = S.pages[i] ? await tokensOfPage(S.pages[i]) : { toks: [] }; const B = otherGetters[i] ? await otherGetters[i]() : { toks: [] };
      if (!S.pages[i]) { if (B.toks.length) CMP.list.push({ page: Math.max(0, S.pages.length - 1), type: 'ins', text: `Extra page ${i + 1} in ${name}: ` + B.toks.slice(0, 12).map((t) => t.w).join(' ') + (B.toks.length > 12 ? '…' : '') }); continue; }
      if (!otherGetters[i]) { if (A.toks.length) { CMP.list.push({ page: i, type: 'del', text: `Page ${i + 1} is not in ${name}` }); CMP.marks.set(i, [{ s: A.toks[0].s, e: A.toks[A.toks.length - 1].e, type: 'del' }]); } continue; }
      const ops = diffWords(A.toks.map((t) => t.w), B.toks.map((t) => t.w));
      if (!ops) { CMP.list.push({ page: i, type: 'del', text: `Page ${i + 1} is too different to compare word by word` }); continue; }
      const marks = []; let k = 0;
      while (k < ops.length) {
        if (ops[k][0] === 'eq') { k++; continue; }
        const dels = [], ins = []; while (k < ops.length && ops[k][0] !== 'eq') { if (ops[k][0] === 'del') dels.push(ops[k][1]); else ins.push(ops[k][2]); k++; }
        const delTxt = dels.map((j) => A.toks[j].w).join(' '), insTxt = ins.map((j) => B.toks[j].w).join(' ');
        if (dels.length) marks.push({ s: A.toks[dels[0]].s, e: A.toks[dels[dels.length - 1]].e, type: ins.length ? 'chg' : 'del' });
        else { let j = -1; for (let q = k - 1; q >= 0; q--) if (ops[q][0] === 'eq') { j = ops[q][1]; break; } if (j >= 0 && A.toks[j]) marks.push({ s: A.toks[j].s, e: A.toks[j].e, type: 'ins' }); }
        const clip = (x) => (x.length > 70 ? x.slice(0, 70) + '…' : x);
        CMP.list.push({ page: i, type: ins.length && dels.length ? 'chg' : dels.length ? 'del' : 'ins', text: ins.length && dels.length ? `“${clip(delTxt)}” → “${clip(insTxt)}”` : dels.length ? `Removed “${clip(delTxt)}”` : `Added “${clip(insTxt)}”` });
      }
      if (marks.length) CMP.marks.set(i, marks);
    }
  } catch (e) { console.error(e); t0.remove(); toast('Could not compare', { err: true }); return; }
  t0.remove(); showCmpPanel(); paintCmp();
}
function showCmpPanel() {
  let pn = $('#cmpPanel'); if (!pn) { pn = document.createElement('aside'); pn.id = 'cmpPanel'; pn.className = 'cmp-panel'; $('.stage').appendChild(pn); }
  pn.hidden = false; const n = CMP.list.length;
  pn.innerHTML = `<div class="cmp-h"><div><b>${n ? `${n} change${n > 1 ? 's' : ''}` : 'No differences'}</b><small>Compared with ${esc(CMP.name)}</small></div><button class="tbtn" id="cmpClose" aria-label="Close comparison">${icon('close')}</button></div>
    <div class="cmp-legend"><span><i class="lg del"></i>Removed or changed</span><span><i class="lg ins"></i>Added after</span></div>
    <div class="cmp-list">${n ? CMP.list.map((c, j) => `<button class="cmp-item ${c.type}" data-j="${j}"><span class="cmp-p">p.${c.page + 1}</span><span>${esc(c.text)}</span></button>`).join('') : '<p class="ol-empty">The text of both documents is the same.</p>'}</div>`;
  pn.querySelector('#cmpClose').onclick = closeCompare;
  pn.querySelectorAll('[data-j]').forEach((b) => b.onclick = () => { const c = CMP.list[+b.dataset.j]; scrollToPage(c.page); setTimeout(() => paintCmp(), 600); });
}
function closeCompare() { CMP.marks.clear(); CMP.list = []; const pn = $('#cmpPanel'); if (pn) pn.hidden = true; $$('.cmplayer', pagesEl).forEach((x) => x.remove()); }
function paintCmp() {
  $$('.page', pagesEl).forEach((el, idx) => {
    let lay = el.querySelector('.cmplayer'); const marks = CMP.marks.get(idx); if (!marks || !el._tlReady) { if (lay) lay.innerHTML = ''; return; }
    if (!lay) { lay = document.createElement('div'); lay.className = 'cmplayer'; el.querySelector('.findlayer').after(lay); } lay.innerHTML = '';
    const spans = $$('.textLayer span:not(.markedContent)', el).filter((sp) => sp.firstChild && sp.firstChild.nodeType === 3);
    const nodes = []; let full = ''; for (const sp of spans) { nodes.push({ node: sp.firstChild, start: full.length }); full += sp.firstChild.data; }
    if (!nodes.length) return; const pr = el.getBoundingClientRect();
    const locate = (o) => { let lo = 0; for (let i = 0; i < nodes.length; i++) if (nodes[i].start <= o) lo = i; else break; return [nodes[lo].node, Math.min(nodes[lo].node.data.length, o - nodes[lo].start)]; };
    for (const m of marks) { try { const rg = document.createRange(); const [sn, so] = locate(m.s); const [en, eo] = locate(Math.max(m.s, m.e - 1)); rg.setStart(sn, so); rg.setEnd(en, Math.min(en.data.length, eo + 1));
      for (const r of rg.getClientRects()) { const d = document.createElement('i'); d.className = m.type; Object.assign(d.style, { left: r.left - pr.left + 'px', top: r.top - pr.top + 'px', width: r.width + 'px', height: r.height + 'px' }); lay.appendChild(d); } } catch (e) {} }
  });
}

/* Selection bubble: copy, highlight, underline, strike through */
let bubble = null;
function hideBubble() { if (bubble) { bubble.remove(); bubble = null; } }
function selectionInPages() {
  const sel = getSelection(); if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0); const n = r.commonAncestorContainer; const elx = n.nodeType === 1 ? n : n.parentElement;
  if (!elx || !pagesEl.contains(elx) || !sel.toString().trim()) return null;
  return { sel, range: r };
}
function showBubble() {
  hideBubble(); if (!['select'].includes(S.tool)) return;
  const s0 = selectionInPages(); if (!s0) return;
  const rects = [...s0.range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5); if (!rects.length) return;
  const last = rects[rects.length - 1];
  const b = document.createElement('div'); b.className = 'bubble'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Selected text');
  b.innerHTML = `<button data-b="copy">${icon('dup')}<span>Copy</span></button><span class="bsep"></span><button data-b="hl" title="Highlight"><span class="bhl">A</span><span>Highlight</span></button><button data-b="ul" title="Underline"><span class="bul">U</span></button><button data-b="st" title="Strike through"><span class="bst">S</span></button>`;
  b.addEventListener('pointerdown', (e) => e.preventDefault());
  b.addEventListener('click', (e) => { const k = e.target.closest('[data-b]'); if (!k) return; const what = k.dataset.b; if (what === 'copy') copySelection(); else markSelection(what); });
  document.body.appendChild(b); bubble = b;
  const bw = b.offsetWidth, bh = b.offsetHeight; const top = rects[0].top - bh - 10 > 60 ? rects[0].top - bh - 10 : last.bottom + 10;
  b.style.left = clamp(rects[0].left, 8, innerWidth - bw - 8) + 'px'; b.style.top = clamp(top, 8, innerHeight - bh - 8) + 'px';
}
async function copySelection() {
  const s0 = selectionInPages(); if (!s0) return; const txt = s0.sel.toString().replace(/\s+\n/g, '\n');
  try { await navigator.clipboard.writeText(txt); toast('Copied'); } catch (e) { try { document.execCommand('copy'); toast('Copied'); } catch (e2) { toast('Press Ctrl+C to copy', { err: true }); } }
}
function markSelection(kind) {
  const s0 = selectionInPages(); if (!s0) return;
  const rects = [...s0.range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 1);
  const byPage = new Map();
  for (const r of rects) {
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const el = $$('.page', pagesEl).find((pe) => { const b = pe.getBoundingClientRect(); return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom; });
    if (!el) continue; const b = el.getBoundingClientRect();
    if (!byPage.has(el)) byPage.set(el, []);
    byPage.get(el).push([(r.left - b.left) / S.zoom, (r.top - b.top) / S.zoom, (r.right - b.left) / S.zoom, (r.bottom - b.top) / S.zoom]);
  }
  let n = 0;
  for (const [el, list] of byPage) {
    const p = pageById(el.dataset.id); const g = geo(p);
    // merge rects on the same line
    list.sort((a, b) => a[1] - b[1] || a[0] - b[0]); const lines = [];
    for (const r of list) {
      const L = lines.find((q) => Math.abs((q[1] + q[3]) / 2 - (r[1] + r[3]) / 2) < Math.min(q[3] - q[1], r[3] - r[1]) * 0.5 && r[0] <= q[2] + 6);
      if (L) { L[0] = Math.min(L[0], r[0]); L[1] = Math.min(L[1], r[1]); L[2] = Math.max(L[2], r[2]); L[3] = Math.max(L[3], r[3]); } else lines.push(r.slice());
    }
    const toPdfRect = ([l, t, r, b]) => { const a1 = ap(g.i, l, t), a2 = ap(g.i, r, b); return [Math.min(a1[0], a2[0]), Math.min(a1[1], a2[1]), Math.abs(a2[0] - a1[0]), Math.abs(a2[1] - a1[1])]; };
    const a = { id: uid('a'), t: 'mark', kind, color: kind === 'hl' ? S.style.hl : (kind === 'st' ? '#d70015' : S.style.ink === '#000000' ? '#0040dd' : S.style.ink), rects: lines.map(toPdfRect) };
    if (kind !== 'hl') {
      a.width = Math.max(0.6, Math.min(...lines.map((r) => r[3] - r[1])) * 0.075);
      a.segs = lines.map(([l, t, r, b]) => { const y = kind === 'ul' ? b - (b - t) * 0.06 : t + (b - t) * 0.55; return [ap(g.i, l, y), ap(g.i, r, y)]; });
    }
    p.annots.push(a); drawOverlay(p, el); n++;
  }
  if (n) { commit(); getSelection().removeAllRanges(); hideBubble(); toast({ hl: 'Highlighted', ul: 'Underlined', st: 'Struck through' }[kind]); }
}
let bubbleT;
document.addEventListener('selectionchange', () => { clearTimeout(bubbleT); bubbleT = setTimeout(() => { if (selectionInPages()) showBubble(); else hideBubble(); }, 250); });
viewer.addEventListener('scroll', hideBubble, { passive: true });

/* ---------- Hand tool, space to pan, pinch zoom ---------- */
let pan = null, spaceDown = false;
viewer.addEventListener('pointerdown', (e) => {
  if (!(S.tool === 'hand' || spaceDown) || e.button > 0) return;
  if (e.pointerType === 'touch') return;
  e.preventDefault(); pan = { x: e.clientX, y: e.clientY, sl: viewer.scrollLeft, st: viewer.scrollTop, id: e.pointerId };
  viewer.setPointerCapture(e.pointerId); viewer.classList.add('panning');
}, true);
viewer.addEventListener('pointermove', (e) => { if (!pan || e.pointerId !== pan.id) return; viewer.scrollLeft = pan.sl - (e.clientX - pan.x); viewer.scrollTop = pan.st - (e.clientY - pan.y); });
const endPan = (e) => { if (pan && e.pointerId === pan.id) { pan = null; viewer.classList.remove('panning'); } };
viewer.addEventListener('pointerup', endPan); viewer.addEventListener('pointercancel', endPan);
addEventListener('keydown', (e) => { if (e.code === 'Space' && !e.repeat && !e.target.closest('input,textarea,select,[contenteditable]') && S.pages.length && !$('#layer .scrim')) { e.preventDefault(); spaceDown = true; viewer.classList.add('spacepan'); } });
addEventListener('keyup', (e) => { if (e.code === 'Space') { spaceDown = false; viewer.classList.remove('spacepan'); } });
let pinch = null;
const tdist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
viewer.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 2 || !S.pages.length) return;
  if (drag) { const a = drag.a; if (drag.mode === 'create' && a) { const pp = drag.p; pp.annots = pp.annots.filter((z) => z !== a); drawOverlay(pp); } drag = null; }
  const r = viewer.getBoundingClientRect(); const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
  pinch = { d: tdist(e.touches), z: S.zoom, mx, my, cx: viewer.scrollLeft + mx, cy: viewer.scrollTop + my, s: 1 };
  pagesEl.style.transformOrigin = `${pinch.cx}px ${pinch.cy}px`;
}, { passive: true });
viewer.addEventListener('touchmove', (e) => {
  if (!pinch || e.touches.length !== 2) return; e.preventDefault();
  pinch.s = clamp(tdist(e.touches) / pinch.d, 0.25 / pinch.z, 5 / pinch.z); pagesEl.style.transform = `scale(${pinch.s})`;
}, { passive: false });
viewer.addEventListener('touchend', (e) => {
  if (!pinch || e.touches.length >= 2) return; const { s, z, cx, cy, mx, my } = pinch; pinch = null;
  pagesEl.style.transform = ''; pagesEl.style.transformOrigin = '';
  if (Math.abs(s - 1) < 0.02) return;
  const nz = clamp(z * s, 0.25, 5); const k = nz / z; S.fit = false; S.zoom = nz;
  closeEditor(false);
  S.pages.forEach((p) => { const el = pageEl(p.id); const g = geo(p); el.style.width = g.w * S.zoom + 'px'; el.style.height = g.h * S.zoom + 'px'; el.style.setProperty('--total-scale-factor', S.zoom); el.style.setProperty('--scale-factor', S.zoom); drawOverlay(p, el); drawForm(p, el); });
  viewer.scrollLeft = cx * k - mx; viewer.scrollTop = cy * k - my; rerenderVisible(); updateZoomLbl(); if (FIND.q) paintFind();
});

/* ---------- Find in document ---------- */
const FIND = { q: '', hits: [], i: -1 };
function openFind() {
  if (!S.pages.length) return;
  let bar = $('#findbar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'findbar'; bar.className = 'findbar'; bar.setAttribute('role', 'search');
    bar.innerHTML = `${icon('search')}<input id="findInput" type="search" placeholder="Find in document" aria-label="Find in document" autocomplete="off" spellcheck="false"><span id="findCount" class="fcount"></span><button class="tbtn" id="findPrev" aria-label="Previous match" title="Previous (Shift+Enter)">${icon('up')}</button><button class="tbtn" id="findNext" aria-label="Next match" title="Next (Enter)">${icon('down')}</button><button class="tbtn" id="findClose" aria-label="Close find" title="Close (Esc)">${icon('close')}</button>`;
    $('.stage').appendChild(bar);
    let t; const inp = bar.querySelector('#findInput');
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => runFind(inp.value), 220); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); stepFind(e.shiftKey ? -1 : 1); } else if (e.key === 'Escape') { e.preventDefault(); closeFind(); } e.stopPropagation(); });
    bar.querySelector('#findPrev').onclick = () => stepFind(-1); bar.querySelector('#findNext').onclick = () => stepFind(1); bar.querySelector('#findClose').onclick = closeFind;
  }
  bar.hidden = false; const inp = $('#findInput'); inp.focus(); inp.select();
}
function closeFind() { const bar = $('#findbar'); if (bar) bar.hidden = true; FIND.q = ''; FIND.hits = []; FIND.i = -1; $$('.findlayer', pagesEl).forEach((f) => f.innerHTML = ''); }
async function runFind(q) {
  q = q.trim(); FIND.q = q.toLowerCase(); FIND.hits = []; FIND.i = -1;
  const cnt = $('#findCount');
  if (!q) { cnt.textContent = ''; $$('.findlayer', pagesEl).forEach((f) => f.innerHTML = ''); return; }
  cnt.textContent = '…';
  for (let i = 0; i < S.pages.length; i++) {
    const str = (await pageText(S.pages[i])).toLowerCase(); if (FIND.q !== q.toLowerCase()) return;
    let k = 0, n = 0; while ((k = str.indexOf(FIND.q, k)) >= 0) { FIND.hits.push({ page: i, n: n++ }); k += FIND.q.length; }
  }
  if (!FIND.hits.length) { cnt.textContent = 'No matches'; paintFind(); return; }
  const startAt = FIND.hits.findIndex((h) => h.page >= S.current); FIND.i = startAt < 0 ? 0 : startAt; showHit();
}
function stepFind(d) { if (!FIND.hits.length) return; FIND.i = (FIND.i + d + FIND.hits.length) % FIND.hits.length; showHit(); }
function showHit() {
  const h = FIND.hits[FIND.i]; $('#findCount').textContent = `${FIND.i + 1} of ${FIND.hits.length}`;
  const el = $$('.page', pagesEl)[h.page]; if (!el) return;
  paintFind();
  const cur = el.querySelector('.findlayer .cur');
  if (cur) { const r = cur.getBoundingClientRect(), vr = viewer.getBoundingClientRect(); if (r.top < vr.top + 60 || r.bottom > vr.bottom - 40) viewer.scrollTo({ top: viewer.scrollTop + r.top - vr.top - vr.height / 3, behavior: 'smooth' }); }
  else { scrollToPage(h.page); setTimeout(paintFind, 700); }
}
function paintFind(only) {
  const els = only ? [only] : $$('.page', pagesEl);
  for (const el of els) {
    const fl = el.querySelector('.findlayer'); if (!fl) continue; fl.innerHTML = '';
    if (!FIND.q || !el._tlReady) continue;
    const idx = $$('.page', pagesEl).indexOf(el); const curN = FIND.hits[FIND.i] && FIND.hits[FIND.i].page === idx ? FIND.hits[FIND.i].n : -1;
    const spans = $$('.textLayer span:not(.markedContent)', el).filter((sp) => sp.firstChild && sp.firstChild.nodeType === 3);
    const nodes = []; let full = '';
    for (const sp of spans) { nodes.push({ node: sp.firstChild, start: full.length }); full += sp.firstChild.data; }
    const low = full.toLowerCase(); let k = 0, n = 0; const pr = el.getBoundingClientRect();
    const locate = (off) => { let lo = 0; for (let i = 0; i < nodes.length; i++) if (nodes[i].start <= off) lo = i; else break; return [nodes[lo].node, off - nodes[lo].start]; };
    while ((k = low.indexOf(FIND.q, k)) >= 0) {
      try {
        const rg = document.createRange(); const [sn, so] = locate(k); const [en, eo] = locate(k + FIND.q.length - 1); rg.setStart(sn, so); rg.setEnd(en, Math.min(en.data.length, eo + 1));
        for (const r of rg.getClientRects()) { const d = document.createElement('i'); if (n === curN) d.className = 'cur'; Object.assign(d.style, { left: r.left - pr.left + 'px', top: r.top - pr.top + 'px', width: r.width + 'px', height: r.height + 'px' }); fl.appendChild(d); }
      } catch (e) {}
      k += FIND.q.length; n++;
    }
  }
}

/* ---------- Tools and format bar ---------- */
const lastInGroup = { shape: 'rect', mark: 'tick' };
const CHEV = '<svg class="i chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
function buildTools() {
  $('#tools').innerHTML = '<div class="tgroup" role="group">' + TOOLS.map(([k, label, ic]) => {
    if (k === 'sep') return '</div><div class="tgroup" role="group">';
    if (k.startsWith('g:')) { const g = k.slice(2); const cur = g === 'sign' ? 'sign' : (GROUPS[g].find((v) => v[0] === lastInGroup[g]) || GROUPS[g][0])[2]; return `<button class="tool grp" data-group="${g}" aria-haspopup="menu" aria-label="${label}" title="${label}">${icon(cur)}${CHEV}</button>`; }
    return `<button class="tool" data-tool="${k}" aria-pressed="${k === S.tool}" aria-label="${label}" title="${label}">${icon(ic)}</button>`;
  }).join('') + '</div>';
}
function setTool(t) {
  if (t !== 'image') S.pendingImg = null;
  if (t !== 'stamp') S.pendingStamp = null;
  const g = toolGroup(t); if (g) { lastInGroup[g] = t; const gb = $(`#tools [data-group="${g}"]`); if (gb) gb.innerHTML = icon(GROUPS[g].find((v) => v[0] === t)[2]) + CHEV; }
  S.tool = t; viewer.classList.toggle('drawing', DRAW_TOOLS.has(t)); viewer.dataset.tool = t;
  $$('#tools .tool').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool ? b.dataset.tool === t : (b.dataset.group === 'sign' ? (t === 'image' || t === 'stamp') : toolGroup(t) === b.dataset.group)));
  if (t !== 'select' && S.sel && !S.editing) select(null);
  if (t === 'hand') { const sel = getSelection(); if (sel) sel.removeAllRanges(); }
  hideBubble(); refreshFormatBar();
}
function signMenu(anchor) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  openMenu(anchor, [
    { label: 'Signatures and saved stamps…', icon: 'sign', run: openLibrary },
    { label: 'Insert image from file…', icon: 'photo', run: () => $('#fileInsertImg').click() },
    '-', { h: 'Stamps' },
    ...STAMPS.map(([t, c]) => ({ label: t, icon: 'stamp', swatch: c, run: () => pickStamp({ text: t, color: c }) })),
    { label: `RECEIVED ${today}`, icon: 'stamp', swatch: '#0040dd', run: () => pickStamp({ text: `RECEIVED ${today}`, color: '#0040dd' }) },
    { label: `Date: ${today}`, icon: 'text', run: () => pickStamp({ text: today, color: '#000000', plain: true }) }
  ]);
}
function pickStamp(st) { S.pendingStamp = st; setTool('stamp'); S.pendingStamp = st; toast('Tap the page where the stamp goes'); refreshFormatBar(); }
$('#tools').addEventListener('click', (e) => {
  const b = e.target.closest('.tool'); if (!b) return;
  if (!S.pages.length) { toast('Open a PDF first'); return; }
  closeEditor(false);
  if (b.dataset.group === 'sign') { signMenu(b); return; }
  if (b.dataset.group) { const g = b.dataset.group; openMenu(b, GROUPS[g].map(([t, label, ic, k]) => ({ label, icon: ic, kbd: k, run: () => setTool(t) }))); return; }
  setTool(b.dataset.tool);
});
$('#fileInsertImg').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const im = await normImage(await readAsDataURL(f), 1800, true); placeImageItem({ id: uid('i'), src: im.src, w: im.w, h: im.h, el: im.el, big: true }); }
  catch (err) { toast('Could not read that image', { err: true }); }
});
function placeImageItem(it) { S.imgs.set(it.id, { src: it.src, w: it.w, h: it.h, el: it.el || null }); setTool('image'); S.pendingImg = it; toast('Tap the page where the image goes'); }
function saveStyle() { lsSet('pdfmate.style', S.style); }
let styleCommitT;
function applyStyleToSel(fn) { const s = selectedAnn(); if (!s) return; fn(s.a); drawOverlay(s.p); clearTimeout(styleCommitT); styleCommitT = setTimeout(commit, 350); if (S.editing) { const ta = $('#textEditor'); if (ta) { ta.style.color = s.a.color; ta.style.fontSize = s.a.size * S.zoom + 'px'; ta.dispatchEvent(new Event('input')); } } }
function refreshFormatBar() {
  const fb = $('#formatBar');
  if (S.sel && selIds().length > 1 && S.pages.length) {
    const n = selIds().length; const B = (k, ic, t) => `<button class="tbtn" data-mal="${k}" title="${t}" aria-label="${t}">${icon(ic)}</button>`;
    fb.innerHTML = `<span class="fb-label">${n} selected</span><span class="fb-spacer"></span>${B('l', 'al', 'Align left')}${B('c', 'ac', 'Align centres')}${B('r', 'ar', 'Align right')}<span class="fb-spacer"></span>${B('t', 'at', 'Align top')}${B('m', 'am', 'Align middles')}${B('b', 'ab', 'Align bottom')}<span class="fb-spacer"></span>${B('dup', 'dup', 'Duplicate')}${B('del', 'trash', 'Delete')}`;
    fb.hidden = false;
    fb.querySelectorAll('[data-mal]').forEach((b) => b.onclick = () => { const k = b.dataset.mal; if (k === 'del') deleteSelected(); else if (k === 'dup') duplicateSelected(); else alignSelected(k); });
    return;
  }
  const s = selectedAnn();
  let kind = s ? s.a.t : S.tool;
  if (s && s.a.t === 'text') kind = s.a.bg ? 'note' : s.a.border ? 'stampa' : 'text';
  if (s && s.a.t === 'mark') kind = s.a.kind === 'hl' ? 'markhl' : 'markline';
  if (!S.pages.length || kind === 'select' || kind === 'hand') { fb.hidden = true; fb.innerHTML = ''; return; }
  const parts = [];
  const isHl = kind === 'hl' || kind === 'markhl';
  const cur = s ? s.a.color : (isHl ? S.style.hl : S.style.ink);
  const label = { crop: 'Crop', edittext: 'Edit text', text: 'Text', note: 'Sticky note', stampa: 'Stamp', stamp: 'Stamp', white: 'Whiteout', redact: 'Redact', hl: 'Highlight', markhl: 'Highlight', markline: s && s.a.kind === 'st' ? 'Strike through' : 'Underline', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', arrow: 'Arrow', pen: 'Pen', tick: 'Tick', cross: 'Cross', image: s ? 'Image' : 'Place image' }[kind] || '';
  parts.push(`<span class="fb-label">${label}</span>`);
  const sw = (list, c0, attr = 'data-color') => `<div class="swatches" role="group" aria-label="Colour">${list.map(([n, c]) => `<button class="sw" ${attr}="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${c.toLowerCase() === String(c0).toLowerCase()}"></button>`).join('')}</div>`;
  if (!['white', 'image', 'redact', 'stamp', 'edittext', 'crop'].includes(kind)) parts.push(sw(isHl ? HLS : INKS, cur));
  if (kind === 'note') parts.push(sw(NOTE_BGS, s ? s.a.bg : (S.style.noteBg || '#fff3a6'), 'data-bg'));
  if (['text', 'note', 'stampa'].includes(kind)) { const v = s ? s.a.size : S.style.size; parts.push(`<div class="stepper" role="group" aria-label="Font size"><button data-step="size" data-d="-1" aria-label="Smaller">−</button><output>${Math.round(v * 10) / 10} pt</output><button data-step="size" data-d="1" aria-label="Larger">+</button></div>`); }
  if (['rect', 'ellipse', 'line', 'arrow', 'pen', 'tick', 'cross'].includes(kind)) { const v = s ? s.a.width : S.style.width; parts.push(`<div class="stepper" role="group" aria-label="Line width"><button data-step="width" data-d="-1" aria-label="Thinner">−</button><output>${Math.round(v * 10) / 10} pt</output><button data-step="width" data-d="1" aria-label="Thicker">+</button></div>`); }
  const hints = { crop: 'Drag over the area to keep. The saved file shows only that area.', edittext: 'Click a line of text to change it. The original is covered, not deleted. Redact it first if it must be removed.', white: 'Covers what is underneath, but the hidden text stays in the file. Use Redact to remove it.', redact: 'Drag over content to remove it. It is deleted for good when you save or print.', hl: 'Drag a box to highlight. To highlight words, select them with the Select tool.', text: 'Click to type. Double-click text to edit.', note: 'Click to add a note.', stamp: 'Tap where the stamp goes.', image: 'Tap where it goes.', pen: 'Draw freehand.', line: 'Drag to draw. Hold Shift to snap.', arrow: 'Drag to draw. Hold Shift to snap.', rect: 'Drag to draw a box.', ellipse: 'Drag to draw.', tick: 'Tap to place.', cross: 'Tap to place.' };
  parts.push('<span class="fb-spacer"></span>');
  if (s && !S.editing) {
    if (s.a.t === 'text') parts.push(`<button class="tbtn" data-act="edit">${icon('edit')}<span class="tb-hide-m">Edit</span></button>`);
    parts.push(`<button class="tbtn" data-act="allpages" aria-label="Copy to other pages" title="Copy to other pages">${icon('dup')}<span class="tb-hide-m">All pages</span></button>`);
    parts.push(`<button class="tbtn" data-act="dup" aria-label="Duplicate">${icon('dup')}<span class="tb-hide-m">Duplicate</span></button><button class="tbtn" data-act="del" style="color:var(--danger)" aria-label="Delete">${icon('trash')}<span class="tb-hide-m">Delete</span></button>`);
  } else if (hints[kind]) parts.push(`<span class="fb-hint">${hints[kind]}</span>`);
  if (kind === 'crop') { const cp = S.pages[S.current]; parts.push(`<button class="tbtn" data-act="cropall" ${cp && cp.crop ? '' : 'disabled'}>Use on all pages</button><button class="tbtn" data-act="cropclear">Remove crop</button>`); }
  if (!s && kind !== 'select') parts.push(`<button class="tbtn" data-act="done">Done</button>`);
  fb.innerHTML = parts.join(''); fb.hidden = false;
}
$('#formatBar').addEventListener('pointerdown', (e) => { if (S.editing && e.target.closest('button')) e.preventDefault(); });
$('#formatBar').addEventListener('click', (e) => {
  const sw = e.target.closest('.sw'); const st = e.target.closest('[data-step]'); const act = e.target.closest('[data-act]');
  const s = selectedAnn();
  if (sw && sw.dataset.bg) { const c = sw.dataset.bg; S.style.noteBg = c; saveStyle(); if (s) applyStyleToSel((a) => { a.bg = c; }); refreshFormatBar(); return; }
  if (sw) {
    const c = sw.dataset.color; const isHl = (s ? (s.a.t === 'mark' ? (s.a.kind === 'hl' ? 'hl' : 'x') : s.a.t) : S.tool) === 'hl';
    if (isHl) S.style.hl = c; else S.style.ink = c; saveStyle();
    if (s) applyStyleToSel((a) => { a.color = c; });
    refreshFormatBar();
  } else if (st) {
    const d = +st.dataset.d;
    if (st.dataset.step === 'size') { const steps = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72]; const v = s ? s.a.size : S.style.size; const i = steps.findIndex((x) => x >= v - 0.01); const ni = clamp((i < 0 ? steps.length - 1 : i) + d, 0, steps.length - 1); const nv = steps[ni]; if (!s) { S.style.size = nv; saveStyle(); } else applyStyleToSel((a) => setText(a, null, nv)); }
    else { const steps = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12]; const v = s ? s.a.width : S.style.width; const i = steps.findIndex((x) => x >= v - 0.01); const nv = steps[clamp((i < 0 ? steps.length - 1 : i) + d, 0, steps.length - 1)]; S.style.width = nv; saveStyle(); if (s) applyStyleToSel((a) => { a.width = nv; }); }
    refreshFormatBar();
  } else if (act) {
    const k = act.dataset.act;
    if (k === 'del') deleteSelected(); else if (k === 'dup') duplicateSelected(); else if (k === 'edit' && s) openEditor(s.p, s.a);
    else if (k === 'done') { closeEditor(false); setTool('select'); }
    else if (k === 'allpages') openCopyToPages();
    else if (k === 'cropall') { const src = S.pages.find((p) => p.crop && p === S.pages[S.current]) || S.pages.find((p) => p.crop); if (!src) return; const g1 = geo(src); const c = src.crop; const d1 = ap(g1.t, c[0], c[1]), d2 = ap(g1.t, c[2], c[3]); const f = [Math.min(d1[0], d2[0]) / g1.w, Math.min(d1[1], d2[1]) / g1.h, Math.max(d1[0], d2[0]) / g1.w, Math.max(d1[1], d2[1]) / g1.h];
      for (const p2 of S.pages) { const g2 = geo(p2); const a1 = ap(g2.i, f[0] * g2.w, f[1] * g2.h), a2 = ap(g2.i, f[2] * g2.w, f[3] * g2.h); p2.crop = [Math.min(a1[0], a2[0]), Math.min(a1[1], a2[1]), Math.max(a1[0], a2[0]), Math.max(a1[1], a2[1])]; drawOverlay(p2); } commit(); toast(`Cropped ${S.pages.length} pages`); }
    else if (k === 'cropclear') { const cp = S.pages[S.current]; const any = S.pages.filter((p) => p.crop); if (!any.length) return; if (cp && cp.crop) cp.crop = null; else any.forEach((p) => { p.crop = null; }); S.pages.forEach((p) => drawOverlay(p)); commit(); refreshFormatBar(); }
  }
});

/* ---------- Signatures and stamps ---------- */
function libItems() { return lsGet('pdfmate.lib', []); }
function ensureLibImg(it) { if (!S.imgs.has(it.id)) loadImageEl(it.src).then((el) => { const o = S.imgs.get(it.id); if (o) o.el = el; }); if (!S.imgs.has(it.id)) S.imgs.set(it.id, { src: it.src, w: it.w, h: it.h, el: null }); return it.id; }
function openLibrary() {
  const items = libItems();
  const sh = sheet(`<h2>Signatures and stamps</h2><p class="sub">Choose one to place on the page. They are saved on this device only.</p>
    ${items.length ? `<div class="lib">${items.map((it) => `<div class="libitem" role="button" tabindex="0" data-id="${it.id}" aria-label="Place ${esc(it.kind || 'item')}"><img src="${it.src}" alt=""><button class="del" data-del="${it.id}" aria-label="Delete">${icon('close')}</button></div>`).join('')}</div>` : '<div class="empty-lib">Nothing saved yet. Draw your signature or import a ship\'s stamp.</div>'}
    <div class="acts" style="justify-content:space-between"><button class="btn" data-x>Close</button><span style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-stamp>${icon('stamp')} Import stamp</button><button class="btn primary" data-new>${icon('sign')} New signature</button></span></div>`, { wide: true });
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-new]').onclick = openSigPad;
  sh.querySelector('[data-stamp]').onclick = () => $('#fileStamp').click();
  sh.addEventListener('click', (e) => {
    const d = e.target.closest('[data-del]'); if (d) { e.stopPropagation(); lsSet('pdfmate.lib', libItems().filter((x) => x.id !== d.dataset.del)); openLibrary(); return; }
    const it = e.target.closest('.libitem'); if (it) pickLib(it.dataset.id);
  });
  sh.addEventListener('keydown', (e) => { const it = e.target.closest('.libitem'); if (it && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickLib(it.dataset.id); } });
}
function pickLib(id) { const it = libItems().find((x) => x.id === id); if (!it) return; closeSheet(); S.pendingImg = it; ensureLibImg(it); setTool('image'); toast('Tap the page where it should go'); }
function trimCanvas(c) {
  const x = c.getContext('2d'); const { width: w, height: h } = c; const d = x.getImageData(0, 0, w, h).data;
  let L = w, T = h, R = -1, B = -1;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 8) { if (i < L) L = i; if (i > R) R = i; if (y < T) T = y; if (y > B) B = y; }
  if (R < 0) return null; const pad = 6; L = Math.max(0, L - pad); T = Math.max(0, T - pad); R = Math.min(w - 1, R + pad); B = Math.min(h - 1, B + pad);
  const o = document.createElement('canvas'); o.width = R - L + 1; o.height = B - T + 1; o.getContext('2d').drawImage(c, L, T, o.width, o.height, 0, 0, o.width, o.height); return o;
}
function addToLib(c, kind) {
  const it = { id: uid('s'), kind, src: c.toDataURL('image/png'), w: c.width, h: c.height };
  const list = libItems(); list.unshift(it);
  if (!lsSet('pdfmate.lib', list.slice(0, 24))) { toast('Storage is full. Delete an old signature or stamp first.', { err: true }); return null; }
  return it;
}
function openSigPad() {
  let color = '#0b1a3a';
  const sh = sheet(`<h2>New signature</h2><p class="sub">Sign with your finger, stylus or mouse.</p>
    <div class="seg tabs2" role="group" aria-label="Ink"><button aria-pressed="true" data-ink="#0b1a3a">Dark blue</button><button aria-pressed="false" data-ink="#000000">Black</button><button aria-pressed="false" data-ink="#0040dd">Blue</button></div>
    <div class="sigpad"><span class="ph">Sign here</span><span class="x">×</span><span class="line"></span><canvas></canvas></div>
    <div class="acts" style="justify-content:space-between"><button class="btn" data-clear>Clear</button><span style="display:flex;gap:10px"><button class="btn" data-x>Cancel</button><button class="btn primary" data-save>Save and place</button></span></div>`, { wide: true });
  const cv = sh.querySelector('canvas'); const pad = sh.querySelector('.sigpad'); const ph = sh.querySelector('.ph');
  const size = () => { const r = pad.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 3); cv.width = Math.round(r.width * d * 1.5); cv.height = Math.round(r.height * d * 1.5); };
  requestAnimationFrame(size);
  const ctx = () => cv.getContext('2d'); let drawing = false, last = null, lastW = 0, inked = false;
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height, e.timeStamp]; };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pt(e); lastW = cv.width / 160; ph.hidden = true; inked = true; const x = ctx(); x.fillStyle = color; x.beginPath(); x.arc(last[0], last[1], lastW / 2, 0, 7); x.fill(); });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const x = ctx(); x.strokeStyle = color; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const ev of evs) { const p = pt(ev); const dist = Math.hypot(p[0] - last[0], p[1] - last[1]); const dt = Math.max(1, p[2] - last[2]); const v = dist / dt; const base = cv.width / 150; const w = clamp(base * (1.6 - Math.min(1.2, v * 0.35)) * (ev.pressure && ev.pointerType === 'pen' ? 0.5 + ev.pressure : 1), base * 0.45, base * 1.8); const nw = lastW * 0.6 + w * 0.4; x.lineWidth = nw; x.beginPath(); x.moveTo(last[0], last[1]); x.lineTo(p[0], p[1]); x.stroke(); last = p; lastW = nw; }
  });
  const up = () => { drawing = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  sh.querySelector('[data-clear]').onclick = () => { ctx().clearRect(0, 0, cv.width, cv.height); ph.hidden = false; inked = false; };
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelectorAll('[data-ink]').forEach((b) => b.onclick = () => { color = b.dataset.ink; sh.querySelectorAll('[data-ink]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  sh.querySelector('[data-save]').onclick = () => {
    if (!inked) { toast('Draw your signature first'); return; }
    const t = trimCanvas(cv); if (!t) { toast('Draw your signature first'); return; }
    let o = t; const mx = 900; if (t.width > mx) { o = document.createElement('canvas'); o.width = mx; o.height = Math.round(t.height * mx / t.width); o.getContext('2d').drawImage(t, 0, 0, o.width, o.height); }
    const it = addToLib(o, 'signature'); if (!it) return; pickLib(it.id);
  };
}
$('#fileStamp').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const src = await readAsDataURL(f); const im = await loadImageEl(src);
    const k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const orig = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    const sh = sheet(`<h2>Import stamp</h2><p class="sub">Use a clear photo or scan of the stamp on white paper.</p>
      <div style="background:repeating-conic-gradient(#e5e5ea 0 25%,#fff 0 50%) 0 0/16px 16px;border-radius:12px;padding:12px;display:flex;justify-content:center;margin-bottom:10px"><canvas id="stPrev" style="max-width:100%;max-height:220px"></canvas></div>
      <label class="chkrow"><input type="checkbox" id="stWhite" checked> Remove white background</label>
      <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-save>Save and place</button></div>`, { wide: true });
    const pv = sh.querySelector('#stPrev'); pv.width = c.width; pv.height = c.height;
    const paint = () => {
      const d = new ImageData(new Uint8ClampedArray(orig.data), c.width, c.height);
      if (sh.querySelector('#stWhite').checked) for (let i = 0; i < d.data.length; i += 4) { const m = Math.min(d.data[i], d.data[i + 1], d.data[i + 2]); if (m > 225) d.data[i + 3] = 0; else if (m > 175) d.data[i + 3] = Math.round(d.data[i + 3] * (225 - m) / 50); }
      pv.getContext('2d').putImageData(d, 0, 0);
    };
    paint(); sh.querySelector('#stWhite').onchange = paint;
    sh.querySelector('[data-x]').onclick = closeSheet;
    sh.querySelector('[data-save]').onclick = () => { const t = trimCanvas(pv) || pv; const it = addToLib(t, 'stamp'); if (it) pickLib(it.id); };
  } catch (err) { toast('Could not read that image', { err: true }); }
});

/* ---------- Pages actions ---------- */
function targetPages() { if (S.selPages.size) return S.pages.filter((p) => S.selPages.has(p.id)); return S.pages[S.current] ? [S.pages[S.current]] : []; }
function pageAction(k) {
  if (!S.pages.length) return;
  const tps = targetPages(); if (!tps.length && k !== 'blank') return;
  if (k === 'rotl' || k === 'rotr') {
    const d = k === 'rotl' ? -90 : 90;
    for (const p of tps) { p.rot = (((p.rot || 0) + d) % 360 + 360) % 360; }
    S.sel = null; renderAll(); commit(); scrollToPage(S.pages.indexOf(tps[0]), false);
  } else if (k === 'del') {
    const n = tps.length;
    const go = () => { const ids = new Set(tps.map((p) => p.id)); S.pages = S.pages.filter((p) => !ids.has(p.id)); S.selPages.clear(); S.current = Math.min(S.current, Math.max(0, S.pages.length - 1)); renderAll(); commit(); toast(`Deleted ${n} page${n > 1 ? 's' : ''}. Undo is available.`); };
    if (n >= S.pages.length) { confirmSheet('Delete every page?', 'This leaves an empty document.', 'Delete all', go); } else go();
  } else if (k === 'up' || k === 'down') {
    const ids = new Set(tps.map((p) => p.id)); const arr = S.pages.slice();
    if (k === 'up') { for (let i = 1; i < arr.length; i++) if (ids.has(arr[i].id) && !ids.has(arr[i - 1].id)) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; }
    else { for (let i = arr.length - 2; i >= 0; i--) if (ids.has(arr[i].id) && !ids.has(arr[i + 1].id)) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; }
    S.pages = arr; S.current = S.pages.indexOf(tps[0]); renderAll(); commit(); scrollToPage(S.current, false);
  } else if (k === 'dup') {
    const last = tps[tps.length - 1]; const at = S.pages.indexOf(last) + 1;
    const clones = tps.map((p) => ({ ...JSON.parse(JSON.stringify(p)), id: uid('p'), annots: p.annots.map((a) => ({ ...JSON.parse(JSON.stringify(a)), id: uid('a') })) }));
    S.pages.splice(at, 0, ...clones); renderAll(); commit(); scrollToPage(at); toast(`Duplicated ${clones.length} page${clones.length > 1 ? 's' : ''}`);
  } else if (k === 'blank') { const at = (tps.length ? S.pages.indexOf(tps[tps.length - 1]) : S.current) + 1; newBlank(at, S.pages[at - 1]); }
}
sbList.addEventListener('contextmenu', (e) => {
  const t = e.target.closest('.thumb'); if (!t) return; e.preventDefault();
  const i = S.pages.findIndex((p) => p.id === t.dataset.id); if (i < 0) return;
  if (!S.selPages.has(t.dataset.id)) { S.selPages.clear(); } S.current = i; markThumbs();
  const n = S.selPages.size || 1; const s = n > 1 ? `${n} pages` : `Page ${i + 1}`;
  openMenu(t, [{ h: s }, { label: 'Go to page', icon: 'goto', run: () => scrollToPage(i) },
    { label: 'Rotate left', icon: 'rotl', run: () => pageAction('rotl') }, { label: 'Rotate right', icon: 'rotr', run: () => pageAction('rotr') },
    { label: 'Move up', icon: 'up', run: () => pageAction('up') }, { label: 'Move down', icon: 'down', run: () => pageAction('down') },
    { label: 'Duplicate', icon: 'dup', run: () => pageAction('dup') }, { label: 'Insert blank page after', icon: 'blank', run: () => pageAction('blank') },
    '-', { label: n > 1 ? `Delete ${n} pages` : 'Delete page', icon: 'trash', run: () => pageAction('del') }], { x: e.clientX, y: e.clientY });
});
$('#sbFoot').addEventListener('click', (e) => { const b = e.target.closest('[data-pa]'); if (b) pageAction(b.dataset.pa); });
$('#btnSelPages').addEventListener('click', () => { S.selecting = !S.selecting; if (!S.selecting) S.selPages.clear(); $('#sidebar').classList.toggle('selecting', S.selecting); $('#btnSelPages').textContent = S.selecting ? 'Done' : 'Select'; markThumbs(); updateChrome(); });
let lastThumbIdx = 0;
sbList.addEventListener('click', (e) => {
  const b = e.target.closest('.thumb'); if (!b) return; const i = $$('.thumb', sbList).indexOf(b);
  if (S.selecting || e.metaKey || e.ctrlKey) { S.selPages.has(b.dataset.id) ? S.selPages.delete(b.dataset.id) : S.selPages.add(b.dataset.id); }
  else if (e.shiftKey) { const [a, z] = [Math.min(lastThumbIdx, i), Math.max(lastThumbIdx, i)]; for (let k = a; k <= z; k++) S.selPages.add(S.pages[k].id); }
  else { S.selPages.clear(); S.current = i; scrollToPage(i); if (innerWidth <= 760) setSidebar(false); }
  lastThumbIdx = i; markThumbs(); updateChrome();
});
let dragThumb = null;
sbList.addEventListener('dragstart', (e) => { const b = e.target.closest('.thumb'); if (!b) return; dragThumb = b.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragThumb); });
sbList.addEventListener('dragover', (e) => {
  if (!dragThumb) return; e.preventDefault(); $$('.thumb', sbList).forEach((t) => t.classList.remove('drop-before'));
  const b = e.target.closest('.thumb'); if (b) { const r = b.getBoundingClientRect(); const target = e.clientY > r.top + r.height / 2 ? b.nextElementSibling : b; if (target) target.classList.add('drop-before'); }
});
sbList.addEventListener('drop', (e) => {
  if (!dragThumb) return; e.preventDefault(); e.stopPropagation();
  const before = sbList.querySelector('.drop-before'); const moving = S.selPages.has(dragThumb) ? S.pages.filter((p) => S.selPages.has(p.id)) : [pageById(dragThumb)];
  const ids = new Set(moving.map((p) => p.id)); const rest = S.pages.filter((p) => !ids.has(p.id));
  let at = before ? rest.findIndex((p) => p.id === before.dataset.id) : rest.length; if (at < 0) at = rest.length;
  rest.splice(at, 0, ...moving); S.pages = rest; dragThumb = null; renderAll(); commit();
});
sbList.addEventListener('dragend', () => { dragThumb = null; $$('.thumb', sbList).forEach((t) => t.classList.remove('drop-before')); });
function setSidebar(open) { $('#app').classList.toggle('no-sidebar', !open); $('#btnSidebar').setAttribute('aria-pressed', open); setTimeout(() => { if (S.fit && S.pages.length) setZoom(0, true); }, 260); }

/* ---------- Export ---------- */
const hexRgb = (h) => { const n = parseInt(String(h || '#000').slice(1), 16); return PL.rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
const dataUrlBytes = (u) => { const b = atob(u.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
async function rasterPage(doc, index, view) {
  const pg = await doc.pdf.getPage(index + 1); const vp = pg.getViewport({ scale: 2.2, rotation: 0 });
  const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: x, viewport: vp }).promise;
  return dataUrlBytes(c.toDataURL('image/jpeg', 0.9));
}
function fillForm(ld, doc) {
  const form = ld.getForm();
  try { form.deleteXFA(); } catch (e) {}
  for (const f of doc.fields) {
    if (!Object.prototype.hasOwnProperty.call(doc.values, f.name)) continue; const v = doc.values[f.name];
    try {
      const fs = Math.max(6, Math.min(11, Math.min(...(f.widgets.length ? f.widgets : [{ h: 18 }]).map((w) => w.h)) * 0.62));
      if (f.type === 'text') { const t = form.getTextField(f.name); if (!f.multiline) t.setFontSize(fs); else t.setFontSize(Math.min(fs, 10)); t.setText(sanitize(v || '')); }
      else if (f.type === 'check') { const c = form.getCheckBox(f.name); v ? c.check() : c.uncheck(); }
      else if (f.type === 'drop') { try { const d = form.getDropdown(f.name); try { d.setFontSize(fs); } catch (e) {} v ? d.select(v) : d.clear(); } catch (e) { const d = form.getOptionList(f.name); v ? d.select(v) : d.clear(); } }
      else if (f.type === 'radio') { const r = form.getRadioGroup(f.name); v ? r.select(v) : r.clear(); }
    } catch (e) { console.warn('field', f.name, e); }
  }
  form.flatten({ updateFieldAppearances: true });
}
async function buildPdf(list, onProgress, opts = {}) {
  const out = await PL.PDFDocument.create();
  out.setProducer('Meridian PDF Mate by Tango Juliet Dev'); out.setCreator('Meridian PDF Mate');
  const fontCache = {}; const font = async (k = 'helv', b = false) => { const key = k + (b ? 'b' : ''); if (!fontCache[key]) fontCache[key] = await out.embedFont(PL.StandardFonts[(FONT_KEYS[k] || FONT_KEYS.helv)[b ? 1 : 0]]); return fontCache[key]; };
  const libs = new Map(); const imgCache = new Map();
  const libFor = async (doc) => {
    if (libs.has(doc.id)) return libs.get(doc.id); let ld = null;
    if (!doc.encrypted) {
      try { ld = await PL.PDFDocument.load(doc.bytes, { updateMetadata: false }); }
      catch (e) { ld = null; }
      if (ld && doc.fields.length) {
        try { fillForm(ld, doc); }
        catch (e) { console.warn('flatten failed', e); try { ld = await PL.PDFDocument.load(doc.bytes, { updateMetadata: false }); } catch (e2) { ld = null; } doc._flatFail = true; }
      }
    }
    libs.set(doc.id, ld); return ld;
  };
  const embedImg = async (id) => {
    if (imgCache.has(id)) return imgCache.get(id); const im = S.imgs.get(id); const bytes = dataUrlBytes(im.src);
    const e = im.src.startsWith('data:image/png') ? await out.embedPng(bytes) : await out.embedJpg(bytes); imgCache.set(id, e); return e;
  };
  const isolate = (page) => { const ctx = out.context; const s = ctx.register(ctx.contentStream([PL.pushGraphicsState()])); const e = ctx.register(ctx.contentStream([PL.popGraphicsState()])); page.node.normalize(); page.node.wrapContentStreams(s, e); };
  for (let i = 0; i < list.length; i++) {
    const p = list[i]; let page = null;
    if (!opts.noRedact && p.annots.some((a) => a.t === 'redact')) {
      // True redaction: flatten the page to an image so content under black boxes is gone from the file
      const one = await buildPdf([p], null, { noRedact: true });
      const flat = await rasterizePdf(one, 200, 0.9); const fd = await PL.PDFDocument.load(flat);
      const [cp] = await out.copyPages(fd, [0]); out.addPage(cp);
      if (onProgress) onProgress((i + 1) / list.length); continue;
    }
    if (p.kind === 'pdf') {
      const doc = S.docs.get(p.docId); const ld = await libFor(doc);
      if (ld) { try { [page] = await out.copyPages(ld, [p.index]); out.addPage(page); isolate(page); } catch (e) { console.warn(e); page = null; } }
      if (!page) {
        const jpg = await out.embedJpg(await rasterPage(doc, p.index)); const [x0, y0, x1, y1] = p.view;
        page = out.addPage([x1 - x0, y1 - y0]); page.setMediaBox(x0, y0, x1 - x0, y1 - y0);
        page.drawImage(jpg, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
      }
      page.setRotation(PL.degrees(tr(p)));
    } else {
      const [x0, y0, x1, y1] = p.view; page = out.addPage([x1 - x0, y1 - y0]);
      if (p.kind === 'img') page.drawImage(await embedImg(p.imgId), { x: 0, y: 0, width: x1 - x0, height: y1 - y0 });
      page.setRotation(PL.degrees(tr(p)));
    }
    for (const a of p.annots) await drawAnn(page, a, font, embedImg);
    if (p.ocr && p.ocr.length) { const f = await font('helv', false); for (const w of p.ocr) { if (needsUni(w.t)) continue; const wd = f.widthOfTextAtSize(w.t, 1) || 1; const size = Math.max(1, Math.min(w.h * 0.95, w.w / wd)); const { V } = UV(w.r); const off = w.h * 0.18; try { page.drawText(w.t, { x: w.ax + off * V[0], y: w.ay + off * V[1], size, font: f, opacity: 0, rotate: PL.degrees(w.r) }); } catch (e) {} } }
    if (p.crop) { const [cx0, cy0, cx1, cy1] = p.crop; page.setCropBox(cx0, cy0, cx1 - cx0, cy1 - cy0); }
    if (onProgress) onProgress((i + 1) / list.length);
  }
  const md = S.meta || {};
  if (md.title) out.setTitle(md.title); if (md.author) out.setAuthor(md.author); if (md.subject) out.setSubject(md.subject);
  if (md.keywords) out.setKeywords(md.keywords.split(',').map((k) => k.trim()).filter(Boolean));
  if (opts.duplex) {
    try { const vp = out.catalog.getOrCreateViewerPreferences(); vp.setDuplex(PL.Duplex[{ simplex: 'Simplex', long: 'DuplexFlipLongEdge', short: 'DuplexFlipShortEdge' }[opts.duplex]]); } catch (e) { console.warn(e); }
  }
  if (opts.pageSize && PAGE_SIZES[opts.pageSize]) return fitPagesTo(out, PAGE_SIZES[opts.pageSize]);
  return out.save({ useObjectStreams: true });
}
const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
async function fitPagesTo(src, [TW0, TH0]) {
  const out = await PL.PDFDocument.create(); out.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  try { out.setTitle(src.getTitle() || ''); out.setAuthor(src.getAuthor() || ''); } catch (e) {}
  for (const pg of src.getPages()) {
    const cb = pg.getCropBox(); const r = ((pg.getRotation().angle % 360) + 360) % 360; const w = cb.width, h = cb.height;
    const dw = r % 180 ? h : w, dh = r % 180 ? w : h; const land = dw > dh; const TW = land ? TH0 : TW0, TH = land ? TW0 : TH0;
    const k = Math.min(TW / dw, TH / dh); const ox = (TW - dw * k) / 2, oy = (TH - dh * k) / 2;
    const emb = await out.embedPage(pg, { left: cb.x, bottom: cb.y, right: cb.x + w, top: cb.y + h });
    const np = out.addPage([TW, TH]);
    const pos = { 0: [ox, oy], 90: [ox, oy + w * k], 180: [ox + w * k, oy + h * k], 270: [ox + h * k, oy] }[r] || [ox, oy];
    np.drawPage(emb, { x: pos[0], y: pos[1], xScale: k, yScale: k, rotate: PL.degrees(-r) });
  }
  return out.save({ useObjectStreams: true });
}
async function drawAnn(page, a, font, embedImg) {
  const col = hexRgb(a.color); const w = a.width || 1.5; const RC = PL.LineCapStyle.Round;
  const seg = (s, e) => page.drawLine({ start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: w, color: col, lineCap: RC });
  if (a.t === 'white') page.drawRectangle({ x: a.x, y: a.y, width: a.w, height: a.h, color: a.fill ? hexRgb(a.fill) : PL.rgb(1, 1, 1) });
  else if (a.t === 'hl') page.drawRectangle({ x: a.x, y: a.y, width: a.w, height: a.h, color: col, opacity: 0.4, blendMode: PL.BlendMode.Multiply });
  else if (a.t === 'rect') page.drawRectangle({ x: a.x + w / 2, y: a.y + w / 2, width: Math.max(0, a.w - w), height: Math.max(0, a.h - w), borderColor: col, borderWidth: w });
  else if (a.t === 'ellipse') page.drawEllipse({ x: a.x + a.w / 2, y: a.y + a.h / 2, xScale: Math.max(0.1, a.w / 2 - w / 2), yScale: Math.max(0.1, a.h / 2 - w / 2), borderColor: col, borderWidth: w });
  else if (a.t === 'redact') page.drawRectangle({ x: a.x, y: a.y, width: a.w, height: a.h, color: PL.rgb(0, 0, 0) });
  else if (a.t === 'mark') {
    if (a.kind === 'hl') for (const [x, y, rw, rh] of a.rects) page.drawRectangle({ x, y, width: rw, height: rh, color: col, opacity: 0.4, blendMode: PL.BlendMode.Multiply });
    else for (const [s0, s1] of a.segs || []) page.drawLine({ start: { x: s0[0], y: s0[1] }, end: { x: s1[0], y: s1[1] }, thickness: a.width || 1, color: col });
  }
  else if (a.t === 'line' || a.t === 'arrow') { seg(a.pts[0], a.pts[1]); if (a.t === 'arrow') for (const [s, e] of arrowHead(a)) seg(s, e); }
  else if (a.t === 'pen') { if (a.pts.length === 1) seg(a.pts[0], a.pts[0]); for (let i = 1; i < a.pts.length; i++) seg(a.pts[i - 1], a.pts[i]); }
  else if (a.t === 'tick' || a.t === 'cross') { for (const [s, e] of markSegments(a)) seg(s, e); }
  else if (a.t === 'image') { const im = S.imgs.get(a.imgId); if (!im) return; page.drawImage(await embedImg(a.imgId), { x: a.ax, y: a.ay, width: a.w, height: a.h, rotate: PL.degrees(a.r) }); }
  else if (a.t === 'text') {
    const { U, V } = UV(a.r); const lines = String(a.text || '').split('\n'); const pad = tpad(a); const op = a.opacity == null ? 1 : a.opacity;
    const at = (u, v) => [a.ax + u * U[0] + v * V[0], a.ay + u * U[1] + v * V[1]];
    if (a.bg && !a.uni) { const [x, y] = at(0, 0); page.drawRectangle({ x, y, width: a.w, height: a.h, color: hexRgb(a.bg), opacity: op, rotate: PL.degrees(a.r) }); }
    if (a.border && !a.uni) { const bw = Math.max(1, a.size * 0.09); const [x, y] = at(bw / 2, bw / 2); page.drawRectangle({ x, y, width: Math.max(0, a.w - bw), height: Math.max(0, a.h - bw), borderColor: col, borderWidth: bw, borderOpacity: op, rotate: PL.degrees(a.r) }); }
    if (a.uni) {
      const k = 300 / 72; const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(a.w * k)); c.height = Math.max(1, Math.ceil(a.h * k));
      const x = c.getContext('2d'); x.scale(k, k); x.globalAlpha = op;
      if (a.bg) { x.fillStyle = a.bg; x.fillRect(0, 0, a.w, a.h); }
      if (a.border) { const bw = Math.max(1, a.size * 0.09); x.strokeStyle = a.color; x.lineWidth = bw; x.strokeRect(bw / 2, bw / 2, a.w - bw, a.h - bw); }
      x.font = uniFont(a, a.size); x.fillStyle = a.color; x.textBaseline = 'alphabetic';
      lines.forEach((l, i) => x.fillText(l, pad, pad + BASE * a.size + i * LH * a.size));
      const png = await page.doc.embedPng(dataUrlBytes(c.toDataURL('image/png'))); const [x0, y0] = at(0, 0);
      page.drawImage(png, { x: x0, y: y0, width: a.w, height: a.h, rotate: PL.degrees(a.r) }); return;
    }
    const f = await font(a.font || 'helv', !!a.bold);
    lines.forEach((l, i) => { if (!l) return; const [x, y] = at(pad, a.h - pad - (BASE * a.size + i * LH * a.size)); page.drawText(l, { x, y, size: a.size, font: f, color: col, opacity: op, rotate: PL.degrees(a.r) }); });
  }
}
function fileName() { let n = ($('#docName').value || 'Untitled').trim().replace(/[\\/:*?"<>|]+/g, '-'); if (!/\.pdf$/i.test(n)) n += '.pdf'; return n; }
function openSave() {
  if (!S.pages.length) return; closeEditor(false);
  const nSel = S.selPages.size; const canShare = !!(navigator.canShare && window.File);
  let scope = 'all';
  const sh = sheet(`<h2>Save PDF</h2><p class="sub">${S.pages.length} page${S.pages.length > 1 ? 's' : ''}. Markup, signatures and form entries are written into the file.</p>
    <div class="field"><label for="saveName">File name</label><input id="saveName" class="inp" value="${esc(fileName())}" autocomplete="off"></div>
    ${nSel ? `<div class="field"><span class="flabel">Pages</span><div class="seg" role="group"><button aria-pressed="true" data-sc="all">All ${S.pages.length}</button><button aria-pressed="false" data-sc="sel">Selected ${nSel}</button></div></div>` : ''}
    <div class="field"><span class="flabel">Page size</span><div class="seg" role="group"><button aria-pressed="true" data-ps="">Original</button><button aria-pressed="false" data-ps="a4">A4</button><button aria-pressed="false" data-ps="letter">Letter</button></div></div>
    <div class="field"><span class="flabel">File size</span><div class="seg" role="group"><button aria-pressed="true" data-cz="0">Original</button><button aria-pressed="false" data-cz="150">Smaller</button><button aria-pressed="false" data-cz="100">Smallest</button></div>
      <small class="sub" id="czNote" style="margin:6px 0 0;display:block">Keeps text selectable and sharp.</small></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-print>${icon('print')} Print</button>${canShare ? `<button class="btn" data-share>${icon('share')} Share</button>` : ''}<button class="btn primary" data-dl>${icon('download')} Download</button></div>`);
  sh.querySelectorAll('[data-sc]').forEach((b) => b.onclick = () => { scope = b.dataset.sc; sh.querySelectorAll('[data-sc]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  let cz = 0, ps = '';
  sh.querySelectorAll('[data-ps]').forEach((b) => b.onclick = () => { ps = b.dataset.ps; sh.querySelectorAll('[data-ps]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  sh.querySelectorAll('[data-cz]').forEach((b) => b.onclick = () => { cz = +b.dataset.cz; sh.querySelectorAll('[data-cz]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#czNote').textContent = cz ? `Pages are saved as images at ${cz} dpi for email over slow connections. Text will no longer be selectable.` : 'Keeps text selectable and sharp.'; });
  const run = async (mode) => {
    const name = (() => { let n = sh.querySelector('#saveName').value.trim() || 'Untitled'; n = n.replace(/[\\/:*?"<>|]+/g, '-'); return /\.pdf$/i.test(n) ? n : n + '.pdf'; })();
    $('#docName').value = name.replace(/\.pdf$/i, '');
    const btns = sh.querySelectorAll('.acts .btn'); btns.forEach((b) => b.disabled = true);
    const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i');
    try {
      const list = scope === 'sel' ? S.pages.filter((p) => S.selPages.has(p.id)) : S.pages;
      let bytes = await buildPdf(list, (f) => { bar.style.width = Math.round(f * (cz ? 50 : 100)) + '%'; }, { pageSize: ps });
      if (cz) { const smaller = await rasterizePdf(bytes, cz, cz >= 150 ? 0.8 : 0.68, (f) => { bar.style.width = Math.round(50 + f * 50) + '%'; }); if (smaller.length < bytes.length) bytes = smaller; else toast('This file is already as small as it gets'); }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      if (mode === 'share') {
        const file = new File([blob], name, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); } catch (e) { if (e.name !== 'AbortError') throw e; } }
        else { downloadBlob(blob, name); }
      } else downloadBlob(blob, name);
      closeSheet(); if (scope === 'all') { setDirty(false); scheduleSave(); }
      const flat = [...S.docs.values()].some((d) => d._flatFail);
      const sz = bytes.length >= 1048576 ? (bytes.length / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes.length / 1024)) + ' KB';
      toast(flat ? 'Saved. Some form fields could not be flattened.' : `Saved ${name} (${sz})`);
    } catch (e) { console.error(e); btns.forEach((b) => b.disabled = false); pr.hidden = true; toast('Could not save. ' + (e && e.message ? e.message : ''), { err: true, ms: 5000 }); }
  };
  sh.querySelector('[data-dl]').onclick = () => run('dl');
  sh.querySelector('[data-print]').onclick = () => { closeSheet(); openPrint(); };
  const s2 = sh.querySelector('[data-share]'); if (s2) s2.onclick = () => run('share');
}
function downloadBlob(blob, name) { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 30000); }

/* ---------- Print ---------- */
function parseRange(str, n) {
  const out = []; const seen = new Set();
  for (const part of String(str).split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d*)\s*-\s*(\d*)$/.exec(part); let a, b;
    if (m) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : n; } else if (/^\d+$/.test(part)) { a = b = +part; } else return null;
    if (a < 1 || b > n || a > b) return null;
    for (let i = a; i <= b; i++) if (!seen.has(i)) { seen.add(i); out.push(i - 1); }
  }
  return out.length ? out : null;
}
const flip = (p) => ({ ...p, rot: ((p.rot || 0) + 180) % 360 });
const blankLike = (p) => { const g = geo(p); return { id: uid('p'), kind: 'blank', view: [0, 0, g.w, g.h], baseRot: 0, rot: 0, annots: [] }; };
function manualSides(list, binding) {
  // Fronts: pages 1,3,5... Backs: pages 2,4,6... printed in reverse so the flipped stack lines up.
  const fronts = [], backs = [];
  for (let i = 0; i < list.length; i += 2) { fronts.push(list[i]); backs.push(list[i + 1] || blankLike(list[i])); }
  let b = backs.reverse();
  if (binding === 'short') b = b.map(flip);
  return { fronts, backs: b };
}
const canIframePrint = () => navigator.pdfViewerEnabled === true && !/android|iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
async function printBytes(bytes) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  if (canIframePrint()) {
    const old = $('#printFrame'); if (old) old.remove();
    const f = document.createElement('iframe'); f.id = 'printFrame'; f.title = 'Print';
    Object.assign(f.style, { position: 'fixed', right: '0', bottom: '0', width: '2px', height: '2px', border: '0', opacity: '0', pointerEvents: 'none' });
    const url = URL.createObjectURL(blob); f.src = url; document.body.appendChild(f);
    await new Promise((res) => { f.onload = res; setTimeout(res, 4000); });
    await new Promise((r) => setTimeout(r, 450));
    try { f.contentWindow.focus(); f.contentWindow.print(); return; }
    catch (e) { console.warn('iframe print failed, using page print', e); }
  }
  await printRaster(bytes);
}
async function printRaster(bytes) {
  const t = toast('Preparing pages for printing', { spin: true, sticky: true });
  const root = $('#printRoot') || Object.assign(document.createElement('div'), { id: 'printRoot' }); root.innerHTML = ''; document.body.appendChild(root);
  const urls = [];
  try {
    const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice() }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i); const v1 = pg.getViewport({ scale: 1 }); const land = v1.width > v1.height;
      const scale = Math.min(200 / 72, 3600 / Math.max(v1.width, v1.height));
      const vp = pg.getViewport({ scale }); const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: x, viewport: vp }).promise;
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92)); const u = URL.createObjectURL(blob); urls.push(u);
      const d = document.createElement('div'); d.className = 'pp ' + (land ? 'pl' : 'pt'); d.innerHTML = `<img src="${u}" alt="">`; root.appendChild(d);
    }
    await Promise.all([...root.querySelectorAll('img')].map((im) => im.decode().catch(() => {})));
    try { pdf.loadingTask.destroy(); } catch (e) {}
  } catch (e) { console.error('print raster', e); t.remove(); toast('Could not prepare the pages for printing', { err: true }); return; }
  t.remove();
  const clean = () => { root.innerHTML = ''; urls.forEach((u) => URL.revokeObjectURL(u)); removeEventListener('afterprint', clean); };
  addEventListener('afterprint', clean);
  window.print();
}
function openPrint() {
  if (!S.pages.length) return; closeEditor(false);
  const nSel = S.selPages.size; const st = lsGet('pdfmate.print', { sides: 'one', bind: 'long' });
  let scope = nSel ? 'sel' : 'all', sides = st.sides, bind = st.bind;
  const desk = canIframePrint();
  const sh = sheet(`<h2>Print</h2><p class="sub">${S.pages.length} page${S.pages.length > 1 ? 's' : ''}. Markup, signatures and form entries print as shown.</p>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group" aria-label="Pages"><button data-sc="all">All</button>${nSel ? `<button data-sc="sel">Selected ${nSel}</button>` : ''}<button data-sc="range">Range</button></div>
      <input id="prRange" class="inp" style="margin-top:8px" placeholder="For example 1-3, 6" inputmode="numeric" autocomplete="off" hidden></div>
    <div class="field"><span class="flabel">Sides</span><div class="seg" role="group" aria-label="Sides"><button data-sd="one">One-sided</button><button data-sd="two">Two-sided</button><button data-sd="manual">Manual two-sided</button></div></div>
    <div class="field" id="prBindF"><span class="flabel">Binding</span><div class="seg" role="group" aria-label="Binding" style="height:auto">
      <button data-bd="long" style="height:auto;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px">${icon('longedge', 'style="width:26px;height:26px"')}<span>Long edge</span><small style="color:var(--label-3);font-weight:400">Book style</small></button>
      <button data-bd="short" style="height:auto;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px">${icon('shortedge', 'style="width:26px;height:26px"')}<span>Short edge</span><small style="color:var(--label-3);font-weight:400">Flip up, calendar style</small></button></div></div>
    <p class="sub" id="prNote" style="margin:4px 0 0"></p>
    <div class="progress" hidden><i></i></div>
    <div class="acts" id="prActs"></div>`);
  const range = sh.querySelector('#prRange');
  const pick = () => {
    if (scope === 'all') return S.pages;
    if (scope === 'sel') return S.pages.filter((p) => S.selPages.has(p.id));
    const idx = parseRange(range.value, S.pages.length); return idx ? idx.map((i) => S.pages[i]) : null;
  };
  const paint = () => {
    sh.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sc === scope));
    sh.querySelectorAll('[data-sd]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sd === sides));
    sh.querySelectorAll('[data-bd]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.bd === bind));
    range.hidden = scope !== 'range'; sh.querySelector('#prBindF').hidden = sides === 'one';
    const edge = bind === 'long' ? 'long edge' : 'short edge';
    sh.querySelector('#prNote').innerHTML = sides === 'one' ? 'Prints on one side of each sheet.'
      : sides === 'two' ? (desk ? `The print dialog opens with two-sided printing set to flip on the ${edge}. If it is not ticked, open <b>More settings</b> and tick <b>Print on both sides</b>.` : `In the print screen choose <b>Two-sided</b> and <b>${bind === 'long' ? 'Long edge' : 'Short edge'}</b>.`)
      : `For printers that cannot print both sides. Print the fronts, put the printed stack back in the paper tray so the blank sides will be printed, then print the backs. Try it with two sheets first, because trays differ between printers.`;
    const acts = sh.querySelector('#prActs');
    acts.innerHTML = sides === 'manual'
      ? `<button class="btn" data-x>Cancel</button><button class="btn" data-go="fronts">1. Print fronts</button><button class="btn primary" data-go="backs">2. Print backs</button>`
      : `<button class="btn" data-x>Cancel</button><button class="btn primary" data-go="all">${icon('print')} Print</button>`;
    acts.querySelector('[data-x]').onclick = closeSheet;
    acts.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => run(b.dataset.go, b));
  };
  const run = async (what, btn) => {
    lsSet('pdfmate.print', { sides, bind });
    const list = pick(); if (!list || !list.length) { toast('Enter a page range such as 1-3, 6', { err: true }); range.focus(); return; }
    let pages = list, duplex = 'simplex';
    if (sides === 'two') duplex = bind;
    if (sides === 'manual') { const m = manualSides(list, bind); pages = what === 'fronts' ? m.fronts : m.backs; }
    const btns = sh.querySelectorAll('.acts .btn'); btns.forEach((b) => b.disabled = true);
    const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i'); bar.style.width = '0';
    try {
      const bytes = await buildPdf(pages, (f) => { bar.style.width = Math.round(f * 100) + '%'; }, { duplex });
      await printBytes(bytes);
      if (sides === 'manual' && what === 'fronts') { toast('Fronts sent. Turn the stack over, put it back in the tray, then tap Print backs.', { ms: 6000 }); btns.forEach((b) => b.disabled = false); pr.hidden = true; }
      else closeSheet();
    } catch (e) { console.error(e); btns.forEach((b) => b.disabled = false); pr.hidden = true; toast('Could not print. ' + (e && e.message ? e.message : ''), { err: true, ms: 5000 }); }
  };
  sh.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-sc]'), sd = e.target.closest('[data-sd]'), bd = e.target.closest('[data-bd]');
    if (sc) { scope = sc.dataset.sc; paint(); if (scope === 'range') range.focus(); }
    if (sd) { sides = sd.dataset.sd; paint(); }
    if (bd) { bind = bd.dataset.bd; paint(); }
  });
  paint();
}

/* ---------- Raster, compress, split, page numbers, watermark ---------- */
async function rasterizePdf(bytes, dpi = 150, q = 0.85, onProgress) {
  const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice() }).promise;
  const out = await PL.PDFDocument.create(); out.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i); const v1 = pg.getViewport({ scale: 1 });
    const scale = Math.min(dpi / 72, 4200 / Math.max(v1.width, v1.height)); const vp = pg.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: x, viewport: vp }).promise;
    const jpg = await out.embedJpg(dataUrlBytes(c.toDataURL('image/jpeg', q)));
    const page = out.addPage([v1.width, v1.height]); page.drawImage(jpg, { x: 0, y: 0, width: v1.width, height: v1.height });
    c.width = c.height = 0; if (onProgress) onProgress(i / pdf.numPages);
  }
  try { pdf.loadingTask.destroy(); } catch (e) {}
  return out.save();
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(); const parts = [], central = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
  }
  const csize = central.reduce((n, a) => n + a.length, 0);
  const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
function openSplit() {
  if (!S.pages.length) return;
  let mode = 'each';
  const sh = sheet(`<h2>Split into separate PDFs</h2><p class="sub">${S.pages.length} pages. The files download together in one zip.</p>
    <div class="field"><span class="flabel">Split</span><div class="seg" role="group"><button data-m="each" aria-pressed="true">Every page</button><button data-m="n" aria-pressed="false">Every N pages</button><button data-m="ranges" aria-pressed="false">Custom ranges</button></div></div>
    <div class="field" id="spN" hidden><label for="spNv">Pages per file</label><input id="spNv" class="inp" type="number" min="1" value="2" inputmode="numeric"></div>
    <div class="field" id="spR" hidden><label for="spRv">Ranges, one file each</label><input id="spRv" class="inp" placeholder="For example 1-3; 4-6; 7" autocomplete="off"></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('split')} Split</button></div>`);
  sh.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { mode = b.dataset.m; sh.querySelectorAll('[data-m]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#spN').hidden = mode !== 'n'; sh.querySelector('#spR').hidden = mode !== 'ranges'; });
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-go]').onclick = async () => {
    const N = S.pages.length; let groups = [];
    if (mode === 'each') groups = S.pages.map((p) => [p]);
    else if (mode === 'n') { const k = Math.max(1, +sh.querySelector('#spNv').value || 1); for (let i = 0; i < N; i += k) groups.push(S.pages.slice(i, i + k)); }
    else { for (const part of sh.querySelector('#spRv').value.split(';').map((x) => x.trim()).filter(Boolean)) { const idx = parseRange(part, N); if (!idx) { toast(`"${part}" is not a valid range`, { err: true }); return; } groups.push(idx.map((i) => S.pages[i])); } }
    if (!groups.length) { toast('Enter at least one range', { err: true }); return; }
    const base = fileName().replace(/\.pdf$/i, ''); const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i');
    sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = true);
    try {
      const files = []; const w = String(groups.length).length;
      for (let i = 0; i < groups.length; i++) { const bytes = await buildPdf(groups[i]); files.push({ name: `${base}-${String(i + 1).padStart(Math.max(2, w), '0')}.pdf`, data: bytes }); bar.style.width = Math.round((i + 1) / groups.length * 100) + '%'; }
      downloadBlob(makeZip(files), `${base}-split.zip`); closeSheet(); toast(`Split into ${files.length} PDFs`);
    } catch (e) { console.error(e); toast('Could not split the document', { err: true }); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = false); }
  };
}
function placeGenerated(gen, makeFor) {
  for (const p of S.pages) p.annots = p.annots.filter((a) => a.gen !== gen);
  S.pages.forEach((p, i) => { const a = makeFor(p, i); if (a) { a.gen = gen; p.annots.push(a); } });
  S.sel = null; S.pages.forEach((p) => drawOverlay(p)); commit();
}
function openPageNumbers() {
  if (!S.pages.length) return; const st = lsGet('pdfmate.pn', { fmt: 'p', pos: 'bc', size: 10, start: 1, skip: false });
  const sh = sheet(`<h2>Page numbers</h2><p class="sub">Added as text you can still move or delete. Running this again replaces them.</p>
    <div class="field"><span class="flabel">Format</span><div class="seg" role="group">${[['n', '1'], ['p', 'Page 1'], ['pof', 'Page 1 of N'], ['slash', '1 / N']].map(([k, l]) => `<button data-f="${k}">${l}</button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Position</span><div class="seg" role="group">${[['bc', 'Bottom centre'], ['br', 'Bottom right'], ['tr', 'Top right']].map(([k, l]) => `<button data-p="${k}">${l}</button>`).join('')}</div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="field"><label for="pnStart">Start at</label><input id="pnStart" class="inp" type="number" min="0" value="${st.start}" inputmode="numeric"></div><div class="field"><label for="pnSize">Size (pt)</label><input id="pnSize" class="inp" type="number" min="6" max="24" value="${st.size}" inputmode="numeric"></div></div>
    <label class="chkrow"><input type="checkbox" id="pnSkip" ${st.skip ? 'checked' : ''}> Skip the first page (cover)</label>
    <div class="acts"><button class="btn danger" data-rm>Remove</button><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>Add numbers</button></div>`);
  const paint = () => { sh.querySelectorAll('[data-f]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === st.fmt)); sh.querySelectorAll('[data-p]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.p === st.pos)); };
  sh.addEventListener('click', (e) => { const f = e.target.closest('[data-f]'), q = e.target.closest('[data-p]'); if (f) st.fmt = f.dataset.f; if (q) st.pos = q.dataset.p; paint(); });
  paint(); sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-rm]').onclick = () => { placeGenerated('pn', () => null); closeSheet(); toast('Page numbers removed'); };
  sh.querySelector('[data-go]').onclick = () => {
    st.start = +sh.querySelector('#pnStart').value || 1; st.size = clamp(+sh.querySelector('#pnSize').value || 10, 6, 24); st.skip = sh.querySelector('#pnSkip').checked; lsSet('pdfmate.pn', st);
    const total = S.pages.length - (st.skip ? 1 : 0);
    placeGenerated('pn', (p, i) => {
      if (st.skip && i === 0) return null; const n = st.start + i - (st.skip ? 1 : 0);
      const text = { n: `${n}`, p: `Page ${n}`, pof: `Page ${n} of ${total + st.start - 1}`, slash: `${n} / ${total + st.start - 1}` }[st.fmt];
      const g = geo(p); const a = { id: uid('a'), t: 'text', r: tr(p), text, size: st.size, color: '#000000', w: 1, h: 1, ax: 0, ay: 0 }; const b = textBox(a); a.w = b.w; a.h = b.h;
      const m = 28; const L = st.pos === 'bc' ? (g.w - a.w) / 2 : g.w - m - a.w; const T = st.pos === 'tr' ? m : g.h - m - a.h;
      const [ax, ay] = ap(g.i, L, T + a.h); a.ax = ax; a.ay = ay; return a;
    });
    closeSheet(); toast(`Numbered ${total} pages`);
  };
}
function openWatermark() {
  if (!S.pages.length) return; const st = lsGet('pdfmate.wm', { text: 'COPY', color: '#d70015', op: 0.18, diag: true });
  const sh = sheet(`<h2>Watermark</h2><p class="sub">Placed across every page as text you can still move or delete.</p>
    <div class="field"><label for="wmText">Text</label><input id="wmText" class="inp" value="${esc(st.text)}" autocomplete="off"></div>
    <div class="field"><span class="flabel">Colour</span><div class="swatches" style="gap:10px">${[['Red', '#d70015'], ['Grey', '#6e6e73'], ['Blue', '#0040dd'], ['Black', '#000000']].map(([n, c]) => `<button class="sw" data-c="${c}" style="background:${c};width:28px;height:28px" aria-label="${n}"></button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Strength</span><div class="seg" role="group">${[[0.1, 'Light'], [0.18, 'Medium'], [0.3, 'Strong']].map(([v, l]) => `<button data-o="${v}">${l}</button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Direction</span><div class="seg" role="group"><button data-d="1">Diagonal</button><button data-d="0">Across</button></div></div>
    <div class="acts"><button class="btn danger" data-rm>Remove</button><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>Add watermark</button></div>`);
  const paint = () => { sh.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.c === st.color)); sh.querySelectorAll('[data-o]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.o === st.op)); sh.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.d === '1') === st.diag)); };
  sh.addEventListener('click', (e) => { const c = e.target.closest('[data-c]'), o = e.target.closest('[data-o]'), d = e.target.closest('[data-d]'); if (c) st.color = c.dataset.c; if (o) st.op = +o.dataset.o; if (d) st.diag = d.dataset.d === '1'; paint(); });
  paint(); sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-rm]').onclick = () => { placeGenerated('wm', () => null); closeSheet(); toast('Watermark removed'); };
  sh.querySelector('[data-go]').onclick = () => {
    st.text = sanitize(sh.querySelector('#wmText').value.trim() || 'COPY'); lsSet('pdfmate.wm', st);
    placeGenerated('wm', (p) => {
      const g = geo(p); const r = (tr(p) + (st.diag ? 45 : 0)) % 360; const a = { id: uid('a'), t: 'text', r, text: st.text, size: 10, bold: true, color: st.color, opacity: st.op, w: 1, h: 1, ax: 0, ay: 0 };
      const w10 = textBox(a).w; const span = st.diag ? Math.hypot(g.w, g.h) * 0.7 : g.w * 0.8; a.size = clamp(10 * span / w10, 12, 160); const b = textBox(a); a.w = b.w; a.h = b.h;
      const { U, V } = UV(r); const [cx, cy] = ap(g.i, g.w / 2, g.h / 2); a.ax = cx - (a.w / 2) * U[0] - (a.h / 2) * V[0]; a.ay = cy - (a.w / 2) * U[1] - (a.h / 2) * V[1]; return a;
    });
    closeSheet(); toast('Watermark added');
  };
}
function openProps() {
  const m = S.meta || (S.meta = {});
  const sh = sheet(`<h2>Document properties</h2><p class="sub">Saved into the PDF file.</p>
    ${[['title', 'Title'], ['author', 'Author'], ['subject', 'Subject'], ['keywords', 'Keywords (comma separated)']].map(([k, l]) => `<div class="field"><label for="pp_${k}">${l}</label><input id="pp_${k}" class="inp" value="${esc(m[k] || '')}" autocomplete="off"></div>`).join('')}
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>`);
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-ok]').onclick = () => { for (const k of ['title', 'author', 'subject', 'keywords']) m[k] = sh.querySelector('#pp_' + k).value.trim(); setDirty(true); closeSheet(); toast('Properties updated'); };
}
function openGoto() {
  if (!S.pages.length) return;
  const sh = sheet(`<h2>Go to page</h2><div class="field"><label for="gotoN">Page number (1 to ${S.pages.length})</label><input id="gotoN" class="inp" type="number" min="1" max="${S.pages.length}" value="${S.current + 1}" inputmode="numeric" autofocus></div><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Go</button></div>`);
  const go = () => { const n = clamp(Math.round(+sh.querySelector('#gotoN').value || 1), 1, S.pages.length); closeSheet(); scrollToPage(n - 1); };
  sh.querySelector('[data-x]').onclick = closeSheet; sh.querySelector('[data-ok]').onclick = go;
  sh.querySelector('#gotoN').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  setTimeout(() => sh.querySelector('#gotoN').select(), 40);
}
function fitPage() {
  const p = S.pages[S.current]; if (!p) return; const g = geo(p);
  const z = Math.min((viewer.clientWidth - 48) / g.w, (viewer.clientHeight - 110) / g.h);
  setZoom(z); scrollToPage(S.current, false);
}

/* Bookmarks (PDF outline) */
async function loadOutline() {
  const list = $('#olList'); if (!list) return; list.innerHTML = ''; let any = false;
  for (const d of S.docs.values()) {
    if (!S.pages.some((p) => p.docId === d.id)) continue;
    let ol = null; try { ol = await d.pdf.getOutline(); } catch (e) {}
    if (!ol || !ol.length) continue; any = true;
    if (S.docs.size > 1) list.insertAdjacentHTML('beforeend', `<div class="ol-doc">${esc(d.name)}</div>`);
    const walk = (items, lvl) => { for (const it of items) { const b = document.createElement('button'); b.className = 'ol-item'; b.style.paddingLeft = 10 + lvl * 14 + 'px'; b.textContent = it.title || 'Untitled'; b.onclick = () => gotoDest(d, it.dest); list.appendChild(b); if (it.items && it.items.length && lvl < 5) walk(it.items, lvl + 1); } };
    walk(ol, 0);
  }
  if (!any) list.innerHTML = '<p class="ol-empty">This document has no bookmarks.</p>';
}
async function gotoDest(d, dest) {
  try {
    if (typeof dest === 'string') dest = await d.pdf.getDestination(dest); if (!dest) return;
    const ref = dest[0]; const idx = typeof ref === 'number' ? ref : await d.pdf.getPageIndex(ref);
    const i = S.pages.findIndex((p) => p.docId === d.id && p.index === idx);
    if (i < 0) { toast('That page was removed from this document'); return; }
    scrollToPage(i); if (innerWidth <= 760) setSidebar(false);
  } catch (e) { toast('Could not open that bookmark', { err: true }); }
}
function setSbView(v) {
  S.sbView = v; $$('#sbSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
  $('#sbList').hidden = v !== 'pages'; $('#olList').hidden = v !== 'outline'; $('#sbFoot').hidden = v !== 'pages'; $('#btnSelPages').hidden = v !== 'pages';
  if (v === 'outline') loadOutline();
}

/* Copy and paste markup, paste images */
let clip = null;
document.addEventListener('copy', (e) => {
  if (e.target.closest && e.target.closest('input,textarea')) return; const tsel = getSelection(); if (tsel && !tsel.isCollapsed) return;
  const s = selectedAnn(); if (!s) return; clip = JSON.parse(JSON.stringify(s.a)); clip._img = s.a.imgId && S.imgs.get(s.a.imgId) ? S.imgs.get(s.a.imgId).src : null;
  e.preventDefault(); try { e.clipboardData.setData('text/plain', s.a.text || ''); } catch (err) {} toast('Copied');
});
document.addEventListener('paste', async (e) => {
  if (e.target.closest && e.target.closest('input,textarea,[contenteditable]')) return; if (!S.pages.length || $('#layer .scrim')) return;
  const p = S.pages[S.current]; if (!p) return; const g = geo(p);
  const file = [...(e.clipboardData ? e.clipboardData.files : [])].find((f) => /^image\//.test(f.type));
  if (file) {
    e.preventDefault(); const im = await normImage(await readAsDataURL(file), 1800, true); const id = uid('i'); S.imgs.set(id, im);
    let w = Math.min(g.w * 0.6, im.w * 0.75), h = w * im.h / im.w; if (h > g.h * 0.6) { h = g.h * 0.6; w = h * im.w / im.h; }
    const r = tr(p); const [ax, ay] = ap(g.i, (g.w - w) / 2, (g.h + h) / 2); const a = { id: uid('a'), t: 'image', r, w, h, ax, ay, imgId: id };
    p.annots.push(a); drawOverlay(p); commit(); setTool('select'); select(p.id, a.id); toast('Image pasted'); return;
  }
  if (clip) {
    e.preventDefault(); const c = JSON.parse(JSON.stringify(clip)); c.id = uid('a'); delete c._img; delete c.gen;
    applyT(c, pdfAffineFromDisplay(g, (x, y) => [x + 14, y + 14])); clip = JSON.parse(JSON.stringify(c)); clip._img = null;
    p.annots.push(c); drawOverlay(p); commit(); setTool('select'); select(p.id, c.id);
  }
});

/* ---------- Map markup between pages (copy to all pages, templates) ---------- */
function mapAnnot(a, g1, tr1, g2, tr2) {
  const c = JSON.parse(JSON.stringify(a)); c.id = uid('a'); delete c.gen; delete c.cover; delete c.orig;
  const b = dispBox(a, g1); const fx = b.L / g1.w, fy = b.T / g1.h; const L2 = fx * g2.w, T2 = fy * g2.h;
  const dx = L2 - b.L, dy = T2 - b.T; const mp = ([x, y]) => { const [u, v] = ap(g1.t, x, y); return ap(g2.i, u + dx, v + dy); };
  if (BOXES.has(c.t)) { const p1 = mp([a.x, a.y]), p2 = mp([a.x + a.w, a.y + a.h]); c.x = Math.min(p1[0], p2[0]); c.y = Math.min(p1[1], p2[1]); c.w = Math.abs(p2[0] - p1[0]); c.h = Math.abs(p2[1] - p1[1]); }
  else if (c.t === 'mark') { c.rects = a.rects.map(([x, y, w, h]) => { const p1 = mp([x, y]), p2 = mp([x + w, y + h]); return [Math.min(p1[0], p2[0]), Math.min(p1[1], p2[1]), Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1])]; }); if (a.segs) c.segs = a.segs.map((sg) => sg.map(mp)); }
  else if (c.pts) c.pts = a.pts.map(mp);
  else { c.r = (((a.r - tr1 + tr2) % 360) + 360) % 360; const [ax, ay] = ap(g2.i, L2, T2 + (b.B - b.T)); c.ax = ax; c.ay = ay; if (Math.abs(((a.r - tr1) % 90)) > 0.01) { const m = mp([a.ax, a.ay]); c.ax = m[0]; c.ay = m[1]; } }
  return c;
}
function openCopyToPages() {
  const s0 = selectedAnn(); if (!s0) { toast('Select a mark, stamp or signature first'); return; }
  const idx = S.pages.indexOf(s0.p);
  const sh = sheet(`<h2>Copy to other pages</h2><p class="sub">Places a copy in the same spot on each page, for initials, stamps or headers.</p>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group"><button data-w="all" aria-pressed="true">All</button><button data-w="odd" aria-pressed="false">Odd</button><button data-w="even" aria-pressed="false">Even</button><button data-w="range" aria-pressed="false">Range</button></div>
    <input id="cpRange" class="inp" style="margin-top:8px" placeholder="For example 2-5, 8" hidden autocomplete="off"></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>Copy</button></div>`);
  let w = 'all';
  sh.querySelectorAll('[data-w]').forEach((b) => b.onclick = () => { w = b.dataset.w; sh.querySelectorAll('[data-w]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#cpRange').hidden = w !== 'range'; });
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-go]').onclick = () => {
    let targets = S.pages.map((p, i) => i).filter((i) => i !== idx);
    if (w === 'odd') targets = targets.filter((i) => i % 2 === 0); else if (w === 'even') targets = targets.filter((i) => i % 2 === 1);
    else if (w === 'range') { const r = parseRange(sh.querySelector('#cpRange').value, S.pages.length); if (!r) { toast('Enter a page range such as 2-5, 8', { err: true }); return; } targets = r.filter((i) => i !== idx); }
    const g1 = geo(s0.p);
    for (const i of targets) { const p2 = S.pages[i]; p2.annots.push(mapAnnot(s0.a, g1, tr(s0.p), geo(p2), tr(p2))); drawOverlay(p2); }
    closeSheet(); commit(); toast(`Copied to ${targets.length} page${targets.length === 1 ? '' : 's'}`);
  };
}

/* ---------- Form templates ---------- */
const tplList = () => lsGet('pdfmate.tpl', []);
function openTemplates() {
  const list = tplList(); const marks = S.pages.reduce((n, p) => n + p.annots.filter((a) => !a.gen).length, 0);
  const sh = sheet(`<h2>Templates</h2><p class="sub">Save where you typed, ticked and signed on a recurring form. Next time, open the blank form and apply the template.</p>
    ${list.length ? `<div class="tpl-list">${list.map((t, i) => `<div class="tpl"><div><b>${esc(t.name)}</b><small>${t.count} item${t.count > 1 ? 's' : ''} · ${t.pages.length} page${t.pages.length > 1 ? 's' : ''} · ${new Date(t.at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><span><button class="btn" data-apply="${i}" ${S.pages.length ? '' : 'disabled'}>Apply</button><button class="tbtn" data-del="${i}" aria-label="Delete ${esc(t.name)}" style="color:var(--danger)">${icon('trash')}</button></span></div>`).join('')}</div>` : '<div class="empty-lib">No templates yet.</div>'}
    <div class="field" style="margin-top:14px"><label for="tplName">Save this document's markup as a template</label><input id="tplName" class="inp" placeholder="For example Crew list Gunsan" value="${esc(($('#docName').value || '').slice(0, 40))}" autocomplete="off"></div>
    <div class="acts"><button class="btn" data-x>Close</button><button class="btn primary" data-save ${marks ? '' : 'disabled'}>Save template (${marks})</button></div>`, { wide: true });
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-save]').onclick = () => {
    const name = sh.querySelector('#tplName').value.trim() || 'Template';
    const pages = S.pages.map((p) => ({ view: p.view, baseRot: p.baseRot, rot: p.rot, annots: p.annots.filter((a) => !a.gen && !(a.t === 'white' && a.edit)).map((a) => { const c = JSON.parse(JSON.stringify(a)); if (c.imgId) { const im = S.imgs.get(c.imgId); c._src = im ? im.src : null; c._w = im && im.w; c._h = im && im.h; } return c; }) }));
    while (pages.length && !pages[pages.length - 1].annots.length) pages.pop();
    const count = pages.reduce((n, p) => n + p.annots.length, 0); if (!count) { toast('Nothing to save yet', { err: true }); return; }
    const all = [{ name, at: Date.now(), count, pages }, ...tplList().filter((t) => t.name !== name)].slice(0, 30);
    if (!lsSet('pdfmate.tpl', all)) { toast('Storage is full. Delete an old template first.', { err: true }); return; }
    toast(`Template "${name}" saved`); openTemplates();
  };
  sh.addEventListener('click', (e) => {
    const d = e.target.closest('[data-del]'); if (d) { const l = tplList(); l.splice(+d.dataset.del, 1); lsSet('pdfmate.tpl', l); openTemplates(); return; }
    const a = e.target.closest('[data-apply]'); if (!a) return; const t = tplList()[+a.dataset.apply]; let n = 0;
    t.pages.forEach((tp, i) => { const p2 = S.pages[i]; if (!p2) return; const g1 = vpTransform(tp.view, (((tp.baseRot || 0) + (tp.rot || 0)) % 360 + 360) % 360, 1); g1.i = inv(g1.t);
      for (const an of tp.annots) { if (an.imgId && an._src) { S.imgs.set(an.imgId, { src: an._src, w: an._w, h: an._h, el: null }); loadImageEl(an._src).then((el) => { const o = S.imgs.get(an.imgId); if (o) o.el = el; }); }
        const src = { ...an }; delete src._src; delete src._w; delete src._h; p2.annots.push(mapAnnot(src, g1, (((tp.baseRot || 0) + (tp.rot || 0)) % 360 + 360) % 360, geo(p2), tr(p2))); n++; }
      drawOverlay(p2); });
    closeSheet(); commit(); toast(`Applied ${n} item${n === 1 ? '' : 's'} from "${t.name}". Edit the text where details differ.`, { ms: 4000 });
  });
}

/* ---------- Crop ---------- */
function setCrop(p, rect) { p.crop = rect; drawOverlay(p); commit(); refreshFormatBar(); }

/* ---------- Export pages as images or text ---------- */
function openExport() {
  if (!S.pages.length) return; const nSel = S.selPages.size;
  let fmt = 'jpg', dpi = 150, scope = nSel ? 'sel' : 'all';
  const sh = sheet(`<h2>Export</h2><p class="sub">Pages as pictures for WhatsApp or email, or all the text as a plain text file. Markup is included.</p>
    <div class="field"><span class="flabel">Format</span><div class="seg" role="group"><button data-f="jpg">JPG</button><button data-f="png">PNG</button><button data-f="txt">Text (.txt)</button></div></div>
    <div class="field" id="exDpi"><span class="flabel">Quality</span><div class="seg" role="group"><button data-d="100">Small</button><button data-d="150">Standard</button><button data-d="300">Print</button></div></div>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group"><button data-s="all">All ${S.pages.length}</button>${nSel ? `<button data-s="sel">Selected ${nSel}</button>` : ''}<button data-s="cur">This page</button></div></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('download')} Export</button></div>`);
  const paint = () => { sh.querySelectorAll('[data-f]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === fmt)); sh.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.d === dpi)); sh.querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === scope)); sh.querySelector('#exDpi').hidden = fmt === 'txt'; };
  sh.addEventListener('click', (e) => { const f = e.target.closest('[data-f]'), d = e.target.closest('[data-d]'), s2 = e.target.closest('[data-s]'); if (f) fmt = f.dataset.f; if (d) dpi = +d.dataset.d; if (s2) scope = s2.dataset.s; paint(); });
  paint(); sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-go]').onclick = async () => {
    const list = scope === 'sel' ? S.pages.filter((p) => S.selPages.has(p.id)) : scope === 'cur' ? [S.pages[S.current]] : S.pages;
    const base = fileName().replace(/\.pdf$/i, ''); const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i');
    sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = true);
    try {
      const bytes = await buildPdf(list, (f) => { bar.style.width = Math.round(f * 30) + '%'; });
      const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice() }).promise; const n = pdf.numPages; const files = [];
      const pad = (i) => String(i).padStart(Math.max(2, String(n).length), '0');
      if (fmt === 'txt') {
        let out = '';
        for (let i = 1; i <= n; i++) { const tc = await (await pdf.getPage(i)).getTextContent(); out += `--- Page ${i} ---\n` + tc.items.map((it) => (it.str || '') + (it.hasEOL ? '\n' : '')).join('').replace(/[ \t]+\n/g, '\n').trim() + '\n\n'; bar.style.width = Math.round(30 + i / n * 70) + '%'; }
        downloadBlob(new Blob([out], { type: 'text/plain;charset=utf-8' }), `${base}.txt`);
        if (!out.replace(/--- Page \d+ ---/g, '').trim()) toast('These pages have no text. They may be scans; try Recognise text (OCR).', { ms: 4500 });
      } else {
        for (let i = 1; i <= n; i++) {
          const pg = await pdf.getPage(i); const vp = pg.getViewport({ scale: dpi / 72 }); const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: x, viewport: vp }).promise;
          const blob = await new Promise((r) => c.toBlob(r, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.88)); files.push({ name: `${base}-p${pad(i)}.${fmt}`, data: new Uint8Array(await blob.arrayBuffer()) }); c.width = c.height = 0;
          bar.style.width = Math.round(30 + i / n * 70) + '%';
        }
        if (files.length === 1) downloadBlob(new Blob([files[0].data], { type: fmt === 'png' ? 'image/png' : 'image/jpeg' }), files[0].name); else downloadBlob(makeZip(files), `${base}-${fmt}.zip`);
      }
      try { pdf.loadingTask.destroy(); } catch (e) {}
      closeSheet(); toast(fmt === 'txt' ? 'Text exported' : `Exported ${files.length} image${files.length > 1 ? 's' : ''}`);
    } catch (e) { console.error(e); toast('Could not export', { err: true }); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = false); }
  };
}

/* ---------- Document scanner ---------- */
function otsu(gray) { const h = new Array(256).fill(0); for (const v of gray) h[v]++; const tot = gray.length; let sum = 0; for (let i = 0; i < 256; i++) sum += i * h[i]; let sB = 0, wB = 0, best = 0, th = 128; for (let i = 0; i < 256; i++) { wB += h[i]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += i * h[i]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) * (mB - mF); if (v > best) { best = v; th = i; } } return th; }
function detectCorners(img) {
  const S2 = 360, k = Math.min(1, S2 / Math.max(img.width, img.height)); const w = Math.max(8, Math.round(img.width * k)), h = Math.max(8, Math.round(img.height * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data; const g = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) g[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) | 0;
  const th = otsu(g); const fg = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) fg[i] = g[i] > th ? 1 : 0;
  const lab = new Int32Array(w * h).fill(-1); let bestN = 0, bestL = -1; const stack = [];
  for (let i = 0; i < w * h; i++) { if (!fg[i] || lab[i] >= 0) continue; let n = 0; stack.push(i); lab[i] = i; while (stack.length) { const q = stack.pop(); n++; const qx = q % w, qy = (q / w) | 0; for (const [nx, ny] of [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]]) { if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (fg[j] && lab[j] < 0) { lab[j] = i; stack.push(j); } } } if (n > bestN) { bestN = n; bestL = i; } }
  const frac = bestN / (w * h); const inset = (f) => [[img.width * f, img.height * f], [img.width * (1 - f), img.height * f], [img.width * (1 - f), img.height * (1 - f)], [img.width * f, img.height * (1 - f)]];
  if (frac < 0.15 || frac > 0.97) return inset(0.04);
  let tl = null, tr2 = null, br = null, bl = null, a = -1e9, b = -1e9, c2 = -1e9, d2 = -1e9;
  for (let i = 0; i < w * h; i++) { if (lab[i] !== bestL) continue; const px = i % w, py = (i / w) | 0; if (-px - py > a) { a = -px - py; tl = [px, py]; } if (px - py > b) { b = px - py; tr2 = [px, py]; } if (px + py > c2) { c2 = px + py; br = [px, py]; } if (py - px > d2) { d2 = py - px; bl = [px, py]; } }
  const pts = [tl, tr2, br, bl].map(([px, py]) => [px / k, py / k]); const cx = pts.reduce((n, q) => n + q[0], 0) / 4, cy = pts.reduce((n, q) => n + q[1], 0) / 4;
  return pts.map(([px, py]) => [clamp(px + (cx - px) * 0.012, 0, img.width), clamp(py + (cy - py) * 0.012, 0, img.height)]);
}
function homography(src, dst) {
  // solve dst = H * src for 4 point pairs (8x8 linear system)
  const A = [], B = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
  for (let c = 0; c < 8; c++) { let piv = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r; [A[c], A[piv]] = [A[piv], A[c]]; [B[c], B[piv]] = [B[piv], B[c]];
    for (let r = 0; r < 8; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
  const hh = B.map((v, i) => v / A[i][i]); return [...hh, 1];
}
function warp(img, q) {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let W = Math.max(dist(q[0], q[1]), dist(q[3], q[2])), H = Math.max(dist(q[0], q[3]), dist(q[1], q[2])); const k = Math.min(1, 2200 / Math.max(W, H)); W = Math.round(W * k); H = Math.round(H * k);
  const sc = document.createElement('canvas'); sc.width = img.width; sc.height = img.height; const sx = sc.getContext('2d'); sx.drawImage(img, 0, 0); const sd = sx.getImageData(0, 0, img.width, img.height).data;
  const Hm = homography([[0, 0], [W, 0], [W, H], [0, H]], q); const out = new ImageData(W, H); const od = out.data; const iw = img.width, ih = img.height;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const z = Hm[6] * x + Hm[7] * y + 1; const u = (Hm[0] * x + Hm[1] * y + Hm[2]) / z, v = (Hm[3] * x + Hm[4] * y + Hm[5]) / z;
    const x0 = Math.floor(u), y0 = Math.floor(v); if (x0 < 0 || y0 < 0 || x0 >= iw - 1 || y0 >= ih - 1) { const o = (y * W + x) * 4; od[o] = od[o + 1] = od[o + 2] = 255; od[o + 3] = 255; continue; }
    const fx = u - x0, fy = v - y0; const i00 = (y0 * iw + x0) * 4, i10 = i00 + 4, i01 = i00 + iw * 4, i11 = i01 + 4; const o = (y * W + x) * 4;
    for (let ch = 0; ch < 3; ch++) od[o + ch] = (sd[i00 + ch] * (1 - fx) + sd[i10 + ch] * fx) * (1 - fy) + (sd[i01 + ch] * (1 - fx) + sd[i11 + ch] * fx) * fy;
    od[o + 3] = 255;
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(out, 0, 0); return c;
}
function filterScan(c, mode) {
  if (mode === 'orig') return c; const x = c.getContext('2d'); const W = c.width, H = c.height; const id = x.getImageData(0, 0, W, H); const d = id.data;
  if (mode === 'enh') {
    const lo = [255, 255, 255], hi = [0, 0, 0]; const hist = [0, 1, 2].map(() => new Uint32Array(256)); for (let i = 0; i < d.length; i += 4) for (let ch = 0; ch < 3; ch++) hist[ch][d[i + ch]]++;
    const n = W * H; for (let ch = 0; ch < 3; ch++) { let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[ch][v]; if (acc > n * 0.01) { lo[ch] = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[ch][v]; if (acc > n * 0.08) { hi[ch] = v; break; } } }
    for (let i = 0; i < d.length; i += 4) for (let ch = 0; ch < 3; ch++) d[i + ch] = clamp(((d[i + ch] - lo[ch]) * 255) / Math.max(1, hi[ch] - lo[ch]), 0, 255);
  } else {
    const g = new Float32Array(W * H); for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    if (mode === 'grey') { for (let i = 0, j = 0; i < d.length; i += 4, j++) { const v = clamp((g[j] - 30) * 1.2, 0, 255); d[i] = d[i + 1] = d[i + 2] = v; } }
    else {
      const I = new Float64Array((W + 1) * (H + 1)); for (let y = 1; y <= H; y++) { let row = 0; for (let x = 1; x <= W; x++) { row += g[(y - 1) * W + x - 1]; I[y * (W + 1) + x] = I[(y - 1) * (W + 1) + x] + row; } }
      const r = Math.max(8, Math.round(Math.min(W, H) / 40)); const C = 12;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(W, x + r + 1), y1 = Math.min(H, y + r + 1); const sum = I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]; const m = sum / ((x1 - x0) * (y1 - y0)); const v = g[y * W + x] < m - C ? 0 : 255; const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; }
    }
  }
  x.putImageData(id, 0, 0); return c;
}
const SCAN = { shots: [], mode: lsGet('pdfmate.scanmode', 'enh') };
function startScan() { SCAN.shots = []; $('#fileScan').click(); }
$('#fileScan').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) { if (SCAN.shots.length) scanReview(); return; }
  try { const im = await normImage(await readAsDataURL(f), 2600); SCAN.shots.push({ img: im.el, q: detectCorners(im.el), rot: 0 }); scanEdit(SCAN.shots.length - 1); }
  catch (err) { toast('Could not read that photo', { err: true }); }
});
function scanEdit(i) {
  const shot = SCAN.shots[i]; const img = shot.img;
  const sh = sheet(`<h2>Adjust page ${i + 1}</h2><p class="sub">Drag the corners to the edges of the paper.</p>
    <div class="scan-wrap"><canvas id="scanCv"></canvas><svg id="scanSvg"></svg></div>
    <div class="field" style="margin-top:12px"><span class="flabel">Look</span><div class="seg" role="group">${[['orig', 'Original'], ['enh', 'Enhanced'], ['grey', 'Grey'], ['bw', 'Black & white']].map(([k, l]) => `<button data-m="${k}" aria-pressed="${k === SCAN.mode}">${l}</button>`).join('')}</div></div>
    <div class="acts" style="justify-content:space-between"><span style="display:flex;gap:8px"><button class="btn" data-x>Cancel</button><button class="btn" data-full>Whole photo</button></span><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-more>${icon('photo')} Next page</button><button class="btn primary" data-done>Done (${SCAN.shots.length})</button></span></div>`, { wide: true });
  const cv = sh.querySelector('#scanCv'), svgEl = sh.querySelector('#scanSvg'); const wrap = sh.querySelector('.scan-wrap');
  const maxW = Math.min(600, innerWidth - 72), maxH = Math.min(innerHeight * 0.52, 560); const k = Math.min(maxW / img.width, maxH / img.height); const W = Math.round(img.width * k), H = Math.round(img.height * k);
  cv.width = W * 2; cv.height = H * 2; cv.style.width = W + 'px'; cv.style.height = H + 'px'; wrap.style.width = W + 'px'; wrap.style.height = H + 'px'; cv.getContext('2d').drawImage(img, 0, 0, W * 2, H * 2);
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`); svgEl.setAttribute('width', W); svgEl.setAttribute('height', H);
  const draw = () => { const p = shot.q.map(([x, y]) => [x * k, y * k]); svgEl.innerHTML = `<path d="M0 0H${W}V${H}H0Z M${p.map((q) => q.join(' ')).join(' L')}Z" fill="rgba(0,0,0,.45)" fill-rule="evenodd"/><polygon points="${p.map((q) => q.join(',')).join(' ')}" fill="none" stroke="#0a84ff" stroke-width="2"/>${p.map(([x, y], j) => `<circle data-c="${j}" cx="${x}" cy="${y}" r="13" fill="rgba(10,132,255,.25)" stroke="#fff" stroke-width="2.5"/>`).join('')}`; };
  draw(); let dragC = -1;
  svgEl.addEventListener('pointerdown', (e) => { const c = e.target.closest('[data-c]'); if (!c) return; dragC = +c.dataset.c; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); });
  svgEl.addEventListener('pointermove', (e) => { if (dragC < 0) return; const r = svgEl.getBoundingClientRect(); shot.q[dragC] = [clamp((e.clientX - r.left) / k, 0, img.width), clamp((e.clientY - r.top) / k, 0, img.height)]; draw(); });
  svgEl.addEventListener('pointerup', () => { dragC = -1; });
  sh.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { SCAN.mode = b.dataset.m; lsSet('pdfmate.scanmode', SCAN.mode); sh.querySelectorAll('[data-m]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  sh.querySelector('[data-full]').onclick = () => { shot.q = [[0, 0], [img.width, 0], [img.width, img.height], [0, img.height]]; draw(); };
  sh.querySelector('[data-x]').onclick = () => { SCAN.shots.splice(i, 1); closeSheet(); if (SCAN.shots.length) scanReview(); };
  sh.querySelector('[data-more]').onclick = () => { closeSheet(); $('#fileScan').click(); };
  sh.querySelector('[data-done]').onclick = () => { closeSheet(); finishScan(); };
}
function scanReview() { finishScan(); }
async function finishScan() {
  if (!SCAN.shots.length) return; const t0 = toast('Straightening pages', { spin: true, sticky: true });
  try {
    const files = [];
    for (const sh of SCAN.shots) { const c = filterScan(warp(sh.img, sh.q), SCAN.mode); const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', SCAN.mode === 'bw' ? 0.8 : 0.86)); files.push(new File([blob], `Scan ${new Date().toLocaleDateString([], { day: '2-digit', month: 'short' })}.jpg`, { type: 'image/jpeg' })); }
    t0.remove(); const n = files.length; SCAN.shots = [];
    if (S.pages.length) await addFiles(files, S.current + 1); else await addFiles(files);
    toast(`Scanned ${n} page${n > 1 ? 's' : ''}`);
  } catch (e) { t0.remove(); console.error(e); toast('Could not process the scan', { err: true }); }
}

/* ---------- Form list sheet ---------- */
function openFormList() {
  const docs = [...S.docs.values()].filter((d) => d.fields.length && S.pages.some((p) => p.docId === d.id));
  if (!docs.length) { toast('No fillable form fields in this document'); return; }
  const rows = docs.map((d) => `<div class="mh" style="padding:10px 0 4px;font-size:12px;font-weight:700;color:var(--label-3)">${esc(d.name)}</div>` + d.fields.map((f, i) => {
    const v = fieldValue(d, f); const id = `f_${d.id}_${i}`;
    let inp;
    if (f.type === 'text') inp = `<input class="inp" id="${id}" value="${esc(v)}" ${f.readOnly ? 'disabled' : ''}>`;
    else if (f.type === 'check') inp = `<label class="chkrow"><input type="checkbox" id="${id}" ${v ? 'checked' : ''} ${f.readOnly ? 'disabled' : ''}> Checked</label>`;
    else inp = `<select class="inp" id="${id}" ${f.readOnly ? 'disabled' : ''}><option value=""></option>${(f.options || []).map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    return `<div class="frow"><label for="${id}">${esc(f.name)}</label>${inp}</div>`;
  }).join('')).join('');
  const sh = sheet(`<h2>Form fields</h2><p class="sub">You can also tap the fields directly on the page.</p><div class="formlist">${rows}</div><div class="acts"><button class="btn primary" data-x>Done</button></div>`, { wide: true });
  sh.querySelector('[data-x]').onclick = () => { closeSheet(); docs.forEach(refreshForms); commit(); };
  sh.addEventListener('input', (e) => {
    const m = /^f_(.+)_(\d+)$/.exec(e.target.id); if (!m) return; const d = S.docs.get(m[1]); const f = d.fields[+m[2]];
    d.values[f.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  });
}

/* ---------- Chrome ---------- */
function updateMeta() {
  queueMicrotask(renderTabs);
  const n = S.pages.length;
  $('#docMeta').textContent = n ? `${n} page${n > 1 ? 's' : ''}${S.dirty ? ' · Edited' : ''}` : 'No document';
  document.title = n ? `${$('#docName').value || 'Untitled'}${S.dirty ? ' (edited)' : ''} · Meridian PDF Mate` : 'Meridian PDF Mate';
}
let tourQueued = false;
function updateChrome() {
  if (S.pages.length && !tourQueued && !tourSeen()) { tourQueued = true; setTimeout(() => startTour(false), 900); }
  const has = S.pages.length > 0;
  $('#btnSave').disabled = !has; $('#btnPrint').disabled = !has; $('#tools').hidden = !has; $('#btnUndo').disabled = !S.hist.length; $('#btnRedo').disabled = !S.fut.length;
  $('#zoomIn').disabled = $('#zoomOut').disabled = $('#zoomLbl').disabled = !has;
  $$('#sbFoot .tbtn').forEach((b) => b.disabled = !has);
  updateMeta();
}
$('#btnSidebar').addEventListener('click', () => setSidebar($('#app').classList.contains('no-sidebar')));
$('#btnUndo').addEventListener('click', undo); $('#btnRedo').addEventListener('click', redo);
$('#zoomIn').addEventListener('click', () => setZoom(S.zoom * 1.2)); $('#zoomOut').addEventListener('click', () => setZoom(S.zoom / 1.2));
$('#zoomLbl').addEventListener('click', () => setZoom(0, true));
$('#btnOpen').addEventListener('click', () => $('#fileOpen').click());
$('#tabNew').addEventListener('click', () => $('#fileOpen').click());
$('#tabList').addEventListener('click', (e) => { const x = e.target.closest('[data-x]'); if (x) { e.stopPropagation(); closeTab(+x.dataset.x); return; } const t = e.target.closest('.dtab'); if (t) switchTab(+t.dataset.k); });
$('#tabList').addEventListener('auxclick', (e) => { const t = e.target.closest('.dtab'); if (t && e.button === 1) { e.preventDefault(); closeTab(+t.dataset.k); } });
$('#tabList').addEventListener('keydown', (e) => { const t = e.target.closest('.dtab'); if (!t) return; const k = +t.dataset.k; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (k + (e.key === 'ArrowRight' ? 1 : -1) + WS.list.length) % WS.list.length; switchTab(n); const el = $(`#tabList .dtab[data-k="${n}"]`); if (el) el.focus(); } else if (e.key === 'Delete') closeTab(k); });
$('#fileAdd').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; addFiles(f, S.pages.length ? S.current + 1 : 0); });
$('#btnSave').addEventListener('click', openSave);
$('#btnPrint').addEventListener('click', openPrint);
$('#eOpen').addEventListener('click', () => $('#fileOpen').click());
$('#ePhotos').addEventListener('click', () => $('#fileImg').click());
$('#eBlank').addEventListener('click', () => newBlank());
$('#eScan').addEventListener('click', startScan);
$('#fileOpen').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; openFilesInTabs(f); });
$('#fileImg').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; addFiles(f, S.pages.length ? S.current + 1 : 0); });
$('#docName').addEventListener('input', updateMeta);
$('#docName').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
function themeLabel() { const t = lsGet('pdfmate.theme', 'system'); return t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'; }
function cycleTheme() { const order = ['system', 'light', 'dark']; const t = lsGet('pdfmate.theme', 'system'); const n = order[(order.indexOf(t) + 1) % 3]; lsSet('pdfmate.theme', n); if (n === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', n); toast(`Appearance: ${themeLabel()}`); }
$('#btnMore').addEventListener('click', (e) => {
  if (menuEl) { closeMenu(); return; }
  const has = S.pages.length > 0; const forms = [...S.docs.values()].reduce((n, d) => n + d.fields.length, 0);
  openMenu(e.currentTarget, [
    { label: 'Open in new tab…', icon: 'open', kbd: 'Ctrl O', run: () => $('#fileOpen').click() },
    { label: 'Add pages from file…', icon: 'merge', run: () => $('#fileAdd').click(), disabled: !has },
    { label: 'Add photos as pages…', icon: 'photo', run: () => $('#fileImg').click() },
    { label: 'Find…', icon: 'search', kbd: 'Ctrl F', run: openFind, disabled: !has },
    { label: 'Recognise text (OCR)…', icon: 'ocr', run: openOcr, disabled: !has },
    { label: 'Compare with…', icon: 'compare', run: openCompare, disabled: !has },
    { label: 'Print…', icon: 'print', kbd: 'Ctrl P', run: openPrint, disabled: !has },
    '-', { h: 'Pages' },
    { label: 'Scan with camera…', icon: 'scan', run: startScan },
    { label: 'Insert blank page', icon: 'blank', run: () => pageAction('blank'), disabled: !has },
    { label: 'Crop pages', icon: 'crop', run: () => setTool('crop'), disabled: !has },
    { label: 'Templates…', icon: 'form', run: openTemplates },
    { label: 'Duplicate page', icon: 'dup', run: () => pageAction('dup'), disabled: !has },
    { label: 'Page numbers…', icon: 'pagenum', run: openPageNumbers, disabled: !has },
    { label: 'Watermark…', icon: 'watermark', run: openWatermark, disabled: !has },
    { label: 'Split into separate PDFs…', icon: 'split', run: openSplit, disabled: !has },
    { label: 'Export as images or text…', icon: 'download', run: openExport, disabled: !has },
    { label: 'Go to page…', icon: 'goto', kbd: 'Ctrl G', run: openGoto, disabled: !has },
    '-',
    { label: forms ? `Fill form fields (${forms})` : 'Fill form fields', icon: 'form', run: openFormList, disabled: !forms },
    { label: 'Signatures and stamps…', icon: 'sign', run: () => { if (!has) { toast('Open a PDF first'); return; } openLibrary(); } },
    '-',
    { label: 'Zoom in', icon: 'zin', run: () => setZoom(S.zoom * 1.2), disabled: !has },
    { label: 'Zoom out', icon: 'zout', run: () => setZoom(S.zoom / 1.2), disabled: !has },
    { label: 'Fit to width', icon: 'fit', kbd: 'Ctrl 0', run: () => setZoom(0, true), disabled: !has },
    { label: 'Fit whole page', icon: 'fitpage', run: fitPage, disabled: !has },
    { label: 'Actual size', icon: 'zin', run: () => setZoom(96 / 72), disabled: !has },
    { label: 'Redo', icon: 'redo', kbd: 'Ctrl ⇧ Z', run: redo, disabled: !S.fut.length },
    '-',
    { label: 'Keyboard shortcuts', icon: 'kbd', kbd: '?', run: openShortcuts },
    { label: 'Show the tour', icon: 'tour', run: () => startTour(true), disabled: !has },
    ...(isStandalone() ? [] : [{ label: 'Install app', icon: 'install', run: doInstall }]),
    { label: `Appearance: ${themeLabel()}`, icon: 'theme', run: cycleTheme },
    { label: 'Document properties…', icon: 'props', run: openProps, disabled: !has },
    { label: 'About Meridian PDF Mate', icon: 'info', run: about },
    { label: 'Close tab', icon: 'xmark', run: () => closeTab(WS.active), disabled: !has }
  ]);
});
function about() {
  sheet(`<h2>Meridian PDF Mate</h2><p class="sub">Version ${VERSION} · by Tango Juliet Dev</p>
    <p style="margin:0 0 10px;color:var(--label-2)">Fill, sign, stamp and mark up PDFs, then merge, reorder, rotate or delete pages. Works fully offline once opened or installed. Files are processed on this device and are never uploaded.</p>
    <p style="margin:0;color:var(--label-3);font-size:12px">Edit text replaces a line by covering the original and typing over it in a matching style. The original stays in the file underneath. Use Redact where it must be removed. Built with pdf.js (Apache 2.0) and pdf-lib (MIT).</p>
    <div class="acts"><button class="btn primary" data-x>Done</button></div>`).querySelector('[data-x]').onclick = closeSheet;
}

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', (e) => {
  const inField = e.target.closest('input,textarea,select,[contenteditable]');
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z' && !inField) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !inField) { e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); openSave(); return; }
  if (mod && e.key.toLowerCase() === 'p') { e.preventDefault(); openPrint(); return; }
  if (mod && e.key.toLowerCase() === 'f') { e.preventDefault(); openFind(); return; }
  if (mod && e.key.toLowerCase() === 'g') { e.preventDefault(); openGoto(); return; }
  if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); $('#fileOpen').click(); return; }
  if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(S.zoom * 1.2); return; }
  if (mod && e.key === '-') { e.preventDefault(); setZoom(S.zoom / 1.2); return; }
  if (mod && e.key === '0') { e.preventDefault(); setZoom(0, true); return; }
  if (inField || $('#layer .scrim')) return;
  if (mod && e.key.toLowerCase() === 'a' && S.pages.length && !String(getSelection() || '')) { e.preventDefault(); selectAllOnPage(); return; }
  if (mod && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x') && S.sel && !String(getSelection() || '')) { e.preventDefault(); copySelected(e.key.toLowerCase() === 'x'); return; }
  if (mod && e.key.toLowerCase() === 'v' && CLIP && S.pages.length) { e.preventDefault(); pasteClip(); return; }
  if (mod && e.key.toLowerCase() === 'd' && S.sel) { e.preventDefault(); duplicateSelected(); return; }
  if (mod && e.key === ']' && S.sel) { e.preventDefault(); reorderSelected(true); return; }
  if (mod && e.key === '[' && S.sel) { e.preventDefault(); reorderSelected(false); return; }
  if (e.key === '?' && !mod) { e.preventDefault(); openShortcuts(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); deleteSelected(); return; }
  if (e.key === 'Escape') { if (S.sel) select(null); else if (S.tool !== 'select') setTool('select'); return; }
  if (S.sel && e.key.startsWith('Arrow')) {
    e.preventDefault(); const s = selAnns(); if (!s) return; const st = e.shiftKey ? 10 : 1; const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    const T = pdfAffineFromDisplay(geo(s.p), (x, y) => [x + d[0], y + d[1]]); s.as.forEach((a) => applyT(a, T)); drawOverlay(s.p); clearTimeout(styleCommitT); styleCommitT = setTimeout(commit, 400); return;
  }
  if (!mod && S.pages.length) { const map = { v: 'select', h: 'hand', t: 'text', d: 'edittext', n: 'note', u: 'hl', w: 'white', x: 'redact', r: 'rect', e: 'ellipse', l: 'line', a: 'arrow', p: 'pen' }; const k = map[e.key.toLowerCase()]; if (k) setTool(k); }
});

/* ---------- Shortcuts sheet ---------- */
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function openShortcuts() {
  const K = (k) => k.split(' ').map((x) => `<kbd>${esc(x === 'Ctrl' && MAC ? '⌘' : x === 'Alt' && MAC ? '⌥' : x)}</kbd>`).join('');
  const groups = [
    ['Tools', [['Select', 'V'], ['Hand (or hold Space)', 'H'], ['Add text', 'T'], ['Edit existing text', 'D'], ['Note', 'N'], ['Highlight', 'U'], ['Whiteout', 'W'], ['Redact', 'X'], ['Rectangle', 'R'], ['Ellipse', 'E'], ['Line', 'L'], ['Arrow', 'A'], ['Pen', 'P']]],
    ['Marks', [['Add to selection', 'Shift Click'], ['Box select', 'Shift Drag'], ['Select all on page', 'Ctrl A'], ['Copy / Cut / Paste', 'Ctrl C'], ['Duplicate', 'Ctrl D'], ['Bring to front / back', 'Ctrl ]'], ['Nudge (10 pt with Shift)', '← → ↑ ↓'], ['Move without snapping', 'Alt Drag'], ['Delete', 'Del'], ['Deselect', 'Esc'], ['More actions', 'Right-click']]],
    ['Document', [['Open', 'Ctrl O'], ['Save or share', 'Ctrl S'], ['Print', 'Ctrl P'], ['Find', 'Ctrl F'], ['Go to page', 'Ctrl G'], ['Undo', 'Ctrl Z'], ['Redo', 'Ctrl Shift Z'], ['Zoom in / out', 'Ctrl + −'], ['Fit to width', 'Ctrl 0'], ['This list', '?']]],
  ];
  const sh = sheet(`<h2>Keyboard shortcuts</h2><p class="sub">${MAC ? '⌘ is Command.' : 'On a Mac, use ⌘ in place of Ctrl.'}</p><div class="kgrid">${groups.map(([t, rows]) => `<section><h3>${t}</h3>${rows.map(([l, k]) => `<div class="krow"><span>${esc(l)}</span><span>${K(k)}</span></div>`).join('')}</section>`).join('')}</div>
    <div class="acts"><button class="btn" data-k="tour">${icon('tour')} Show the tour</button><button class="btn primary" data-k="ok">Done</button></div>`, { wide: true });
  sh.querySelector('[data-k="ok"]').onclick = closeSheet;
  sh.querySelector('[data-k="tour"]').onclick = () => { closeSheet(); startTour(true); };
}

/* ---------- First-run tour ---------- */
const TOUR = [
  { sel: '#tools', t: 'Tools', d: 'Select, hand, text, edit existing text, notes, highlight, shapes, pen and signatures. Each has a one-letter shortcut.' },
  { sel: '#tabbar', t: 'Tabs', d: 'Keep several PDFs open at once. Drop files anywhere to open them in new tabs.' },
  { sel: '#sidebar', t: 'Pages', d: 'Drag thumbnails to reorder. Shift-click to pick several, then rotate, duplicate or delete.' },
  { sel: '#viewer', t: 'Right-click for more', d: 'Right-click a page or a mark for copy, paste, layering and align. Shift-click or Shift-drag selects several marks, and they snap to edges and centres as you drag.' },
  { sel: '#btnMore', t: 'More', d: 'OCR, compare, scan, page numbers, watermark, split, export and templates live here.' },
  { sel: '#btnSave', t: 'Save', d: 'Save, share or print. Your files never leave this device, and the app works offline. Press ? for all shortcuts.' },
];
let tourEl = null, tourI = 0;
function tourSeen() { try { return localStorage.getItem('pdfmate.tour') === '1'; } catch (e) { return true; } }
function endTour() { if (tourEl) { tourEl.remove(); tourEl = null; } try { localStorage.setItem('pdfmate.tour', '1'); } catch (e) { } removeEventListener('resize', placeTour); document.removeEventListener('keydown', tourKey, true); }
function tourKey(e) { if (!tourEl) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endTour(); } else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); tourGo(tourI + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); tourGo(tourI - 1); } }
function tourSteps() { return TOUR.filter((st) => { const n = $(st.sel); if (!n) return false; const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); }
function startTour(force) {
  if (tourEl || (!force && tourSeen()) || !S.pages.length) return;
  tourEl = document.createElement('div'); tourEl.className = 'tour';
  tourEl.innerHTML = `<div class="tour-spot"></div><div class="tour-card" role="dialog" aria-live="polite"><div class="tour-n"></div><h3></h3><p></p><div class="tour-dots"></div><div class="tour-act"><button class="btn ghost" data-t="skip">Skip</button><span></span><button class="btn" data-t="back">Back</button><button class="btn primary" data-t="next">Next</button></div></div>`;
  document.body.appendChild(tourEl);
  tourEl.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const k = b.dataset.t; if (k === 'skip') endTour(); else tourGo(tourI + (k === 'next' ? 1 : -1)); });
  addEventListener('resize', placeTour); document.addEventListener('keydown', tourKey, true);
  tourGo(0);
}
function tourGo(i) {
  const steps = tourSteps(); if (i >= steps.length) { endTour(); return; } tourI = Math.max(0, i);
  const st = steps[tourI]; const c = tourEl.querySelector('.tour-card');
  c.querySelector('.tour-n').textContent = `${tourI + 1} of ${steps.length}`; c.querySelector('h3').textContent = st.t; c.querySelector('p').textContent = st.d;
  c.querySelector('.tour-dots').innerHTML = steps.map((_, k) => `<i class="${k === tourI ? 'on' : ''}"></i>`).join('');
  c.querySelector('[data-t="back"]').hidden = tourI === 0; c.querySelector('[data-t="next"]').textContent = tourI === steps.length - 1 ? 'Done' : 'Next';
  placeTour(); c.querySelector('[data-t="next"]').focus();
}
function placeTour() {
  if (!tourEl) return; const st = tourSteps()[tourI]; if (!st) return; const n = $(st.sel); const r = n.getBoundingClientRect(); const pad = 6;
  const big = r.width * r.height > innerWidth * innerHeight * 0.35;
  const L = Math.max(4, r.left - pad), T = Math.max(4, r.top - pad), W = Math.min(innerWidth - 8, r.width + pad * 2), H = Math.min(innerHeight - 8, r.height + pad * 2);
  const sp = tourEl.querySelector('.tour-spot'); Object.assign(sp.style, { left: L + 'px', top: T + 'px', width: W + 'px', height: H + 'px' });
  const c = tourEl.querySelector('.tour-card'); const cw = c.offsetWidth, ch = c.offsetHeight; let x, y;
  if (big) { x = r.left + r.width / 2 - cw / 2; y = r.top + r.height / 2 - ch / 2; }
  else if (T + H + 12 + ch < innerHeight - 8) { x = r.left + r.width / 2 - cw / 2; y = T + H + 12; }
  else if (T - 12 - ch > 8) { x = r.left + r.width / 2 - cw / 2; y = T - 12 - ch; }
  else if (L + W + 12 + cw < innerWidth - 8) { x = L + W + 12; y = r.top + r.height / 2 - ch / 2; }
  else { x = L - 12 - cw; y = r.top + r.height / 2 - ch / 2; }
  c.style.left = clamp(x, 8, innerWidth - cw - 8) + 'px'; c.style.top = clamp(y, 8, innerHeight - ch - 8) + 'px';
}

/* ---------- Drag and drop files ---------- */
let dragDepth = 0, mask = null;
const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; if (!mask) { mask = document.createElement('div'); mask.className = 'dropmask'; mask.textContent = S.pages.length ? 'Drop to open in a new tab' : 'Drop to open'; document.body.appendChild(mask); } });
addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dragDepth--; if (dragDepth <= 0 && mask) { mask.remove(); mask = null; dragDepth = 0; } });
addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
addEventListener('drop', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth = 0; if (mask) { mask.remove(); mask = null; } openFilesInTabs([...e.dataTransfer.files]); });
addEventListener('beforeunload', (e) => { saveTab(); if (WS.list.some((t) => t.dirty)) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Boot ---------- */
function boot() {
  $('#btnSidebar').innerHTML = icon('sidebar'); $('#btnUndo').innerHTML = icon('undo'); $('#btnRedo').innerHTML = icon('redo');
  $('#btnOpen').innerHTML = icon('open'); $('#btnInstall').innerHTML = icon('install'); $('#btnPrint').innerHTML = icon('print'); $('#btnMore').innerHTML = icon('more'); $('#saveIc').outerHTML = icon('share');
  $('#zoomIn').innerHTML = icon('zin'); $('#zoomOut').innerHTML = icon('zout');
  const fi = { rotl: 'rotl', rotr: 'rotr', up: 'up', down: 'down', blank: 'blank', del: 'trash' };
  $$('#sbFoot [data-pa]').forEach((b) => { if (fi[b.dataset.pa]) b.innerHTML = icon(fi[b.dataset.pa]); });
  $('#emptyIc').innerHTML = `<svg viewBox="0 0 76 92" width="76" height="92" aria-hidden="true"><defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef0f5"/></linearGradient></defs><path d="M10 2h40l24 24v58a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="url(#eg)" stroke="rgba(0,0,0,.14)"/><path d="M50 2v18a6 6 0 0 0 6 6h18" fill="#e3e6ee" stroke="rgba(0,0,0,.14)"/><rect x="14" y="40" width="40" height="4" rx="2" fill="#d1d5df"/><rect x="14" y="50" width="48" height="4" rx="2" fill="#d1d5df"/><rect x="14" y="60" width="30" height="4" rx="2" fill="#d1d5df"/><path d="M16 78c5 0 7-10 11-10s2 10 7 10 4-5 7-5 3 4 8 3" fill="none" stroke="#007aff" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10" width="26" height="14" rx="4" fill="#ff3b30"/><text x="17" y="20.5" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="-apple-system,Inter,sans-serif">PDF</text></svg>`;
  $('#feat').innerHTML = `<span>${icon('lock')} Stays on device</span><span>${icon('offline')} Works offline</span><span>${icon('sign')} Sign and stamp</span><span>${icon('merge')} Merge and reorder</span>`;
  $('#sbFoot [data-pa="dup"]').innerHTML = icon('dup');
  $$('#sbSeg button').forEach((b) => b.onclick = () => setSbView(b.dataset.v));
  $('#pageInd').addEventListener('click', openGoto);
  WS.list = [blankTab()]; WS.active = 0;
  buildTools(); setTool('select'); renderAll(); resetHistory(); updateChrome(); renderTabs();
  $('#recents').addEventListener('click', (e) => { const x = e.target.closest('[data-forget]'); if (x) { e.stopPropagation(); forgetRecent(x.dataset.forget); return; } const c = e.target.closest('[data-rid]'); if (c) openRecent(c.dataset.rid); });
  $('#recents').addEventListener('keydown', (e) => { const c = e.target.closest('[data-rid]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRecent(c.dataset.rid); } });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  const mq = matchMedia('(max-width: 760px)');
  const placeTools = () => { const t = $('#tools'); if (mq.matches) { if (t.parentElement !== document.body) document.body.appendChild(t); } else if (t.parentElement !== $('.toolbar')) $('.toolbar').insertBefore(t, $('.tb-right')); };
  placeTools(); mq.addEventListener('change', placeTools);
  return restoreSession().catch((e) => console.warn(e));
}
let readyRes; const ready = new Promise((r) => { readyRes = r; });
initFont().then(boot).catch((e) => { console.error(e); return boot(); }).then(() => readyRes(), () => readyRes());

/* ---------- PWA: offline, install, open from OS ---------- */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installEvt = null;
function showInstall(on) { $('#btnInstall').hidden = !on; $('#eInstall').hidden = !on; }
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; showInstall(true); });
addEventListener('appinstalled', () => { installEvt = null; showInstall(false); toast('Meridian PDF Mate installed. It works offline.'); });
async function doInstall() {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; showInstall(false); return; }
  if (isIOS) {
    sheet(`<h2>Install on iPhone or iPad</h2><p class="sub">Safari installs web apps from the Share menu.</p>
      <ol style="margin:0 0 4px;padding-left:20px;line-height:1.9;color:var(--label-2)"><li>Tap the Share button ${icon('share', 'style="vertical-align:-3px"')} in Safari</li><li>Choose <b>Add to Home Screen</b></li><li>Tap <b>Add</b></li></ol>
      <div class="acts"><button class="btn primary" data-x>Done</button></div>`).querySelector('[data-x]').onclick = closeSheet;
    return;
  }
  const edge = /Edg\//.test(navigator.userAgent), android = /android/i.test(navigator.userAgent);
  const steps = android ? '<li>Tap the <b>⋮</b> menu in Chrome</li><li>Tap <b>Add to Home screen</b>, then <b>Install</b></li>'
    : edge ? '<li>Click the <b>…</b> menu in Edge</li><li>Choose <b>Apps</b>, then <b>Install this site as an app</b></li>'
    : '<li>Click the <b>⋮</b> menu in Chrome</li><li>Choose <b>Cast, save, and share</b>, then <b>Install page as app</b></li>';
  sheet(`<h2>Install Meridian PDF Mate</h2><p class="sub">Your browser did not offer the install button. You can install from its menu instead.</p>
    <ol style="margin:0 0 10px;padding-left:20px;line-height:1.9;color:var(--label-2)">${steps}</ol>
    <p class="sub" style="margin:0">If the menu says <b>Open in Meridian Tools for Mate</b> or another app, that app is claiming this address. Uninstall it, reload this page, then install both again.</p>
    <div class="acts"><button class="btn primary" data-x>Done</button></div>`).querySelector('[data-x]').onclick = closeSheet;
}
$('#btnInstall').addEventListener('click', doInstall);
$('#eInstall').addEventListener('click', doInstall);
if (!isStandalone()) showInstall(true);
addEventListener('offline', () => toast('You are offline. Meridian PDF Mate keeps working.'));

if ('serviceWorker' in navigator && window.isSecureContext) {
  const firstInstall = !navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (firstInstall) navigator.serviceWorker.ready.then(() => { toast('Ready to work offline'); });
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w && !firstInstall) w.addEventListener('statechange', () => { if (w.state === 'activated') toast('Meridian PDF Mate updated. Reopen to use the new version.', { ms: 4500 }); }); });
  }).catch((e) => console.warn('SW', e));
}
// Files opened from the OS (installed desktop app: Open with PDF Mate)
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (params) => {
    if (!params.files || !params.files.length) return;
    const files = []; for (const h of params.files) { try { files.push(await h.getFile()); } catch (e) {} }
    if (files.length) { await ready; openFilesInTabs(files); }
  });
}
// Files shared to PDF Mate from other apps (Android share sheet)
async function takeShared() {
  if (!/[?&]share=1/.test(location.search) || !('caches' in window)) return;
  history.replaceState(null, '', location.pathname);
  try {
    const c = await caches.open('meridian-pdf-mate-share'); const keys = await c.keys(); const files = [];
    for (const k of keys) { const r = await c.match(k); const b = await r.blob(); files.push(new File([b], decodeURIComponent(r.headers.get('x-name') || 'shared.pdf'), { type: b.type })); await c.delete(k); }
    if (files.length) { await ready; openFilesInTabs(files); } else toast('Nothing was received from the share', { err: true });
  } catch (e) { toast('Could not read the shared file', { err: true }); }
}
takeShared();
if (/[?&]source=pwa/.test(location.search)) history.replaceState(null, '', location.pathname);
window.__pdfmate = { S, buildPdf, geo, vpTransform, addFiles };
