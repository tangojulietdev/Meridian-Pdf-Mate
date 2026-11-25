// Meridian PDF Mate by Tango Juliet Dev. Offline PDF fill, sign, mark up and page editing.
import * as pdfjsLib from './vendor/pdf.min.mjs';

const VERSION = '3.12.0';
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
  design: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 13h8V3M11 8h10"/><circle cx="16" cy="15.5" r="2.5"/>',
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
  pen_ballpoint: '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13.5 6.5l4 4"/>',
  pen_fountain: '<path d="M12 3l5 6-3 9h-4L7 9z"/><path d="M12 3v8"/><circle cx="12" cy="12" r="1.2"/><path d="M10 18h4v3h-4z"/>',
  pen_gel: '<path d="M17 3l4 4-11 11-4 1 1-4z"/><path d="M4 20l2-2"/>',
  pen_pencil: '<path d="M16 3.5l4.5 4.5L9 19.5H4.5V15z"/><path d="M14 5.5l4.5 4.5"/><path d="M4.5 15l4.5 4.5" opacity=".5"/>',
  pen_marker: '<path d="M14 4l6 6-7 7-6-6z"/><path d="M7 11l-3 6 3 3 6-3"/>',
  pen_brush: '<path d="M20 4c-4 1-8 5-10 9l2 2c4-2 8-6 8-11z"/><path d="M10 13c-2 0-4 1.5-4 4 0 1.5-1 2.5-2 3 3 .5 7-.5 8-5z"/>',
  pen_calligraphy: '<path d="M5 19l9-9"/><path d="M14 4l6 6-4 4-6-6z"/><path d="M4 20l2.5-.5L5 18z"/>',
  pen_highlighter: '<path d="M15 4l5 5-8 8H8v-4z"/><path d="M8 17l-3 3h6"/><path d="M4 21h16" opacity=".5"/>',
  eraser: '<path d="M8.5 20H20"/><path d="M14.5 4.5l5 5-9 9.5H7l-3-3z"/><path d="M9.5 9.5l5 5"/>',
  lasso: '<path d="M12 5c-4.4 0-8 2.2-8 5s3.6 5 8 5 8-2.2 8-5-3.6-5-8-5z" stroke-dasharray="2.5 2"/><path d="M8 14.5c-1 1.5-1 4 1.5 5.5"/><circle cx="9.5" cy="20.5" r="1"/>',
  eyedrop: '<path d="m14 7 3 3"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
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
  reading: '<path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z"/><path d="M12 6v13.5"/>',
  ruler: '<rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M3 5h18M3 19h18" opacity=".45"/>',
  navmap: '<rect x="4" y="3" width="16" height="18" rx="2"/><rect x="8" y="8" width="7" height="6" rx="1"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  split2: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M12 4v16"/>',
  shapes: '<circle cx="8" cy="8" r="5"/><path d="M13.5 13.5h7v7h-7z"/><path d="m8 14.5 4.2 6.5H3.8z"/>',
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
  objedit: '<path d="M4 4l6.5 16 2.3-6.7L19.5 11z"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke-dasharray="2 1.6"/>',
  measure: '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  area: '<path d="M4 8l7-5 9 5-3 11H6z"/><path d="M9 12h6M12 9v6" stroke-width="1.4"/>',
  cloud: '<path d="M7 18a3.5 3.5 0 0 1-.6-6.9 5 5 0 0 1 9.7-1.6A4 4 0 0 1 18 18z"/>',
  word: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M7.5 8.5 9 16l3-5.5 3 5.5 1.5-7.5"/>',
  ul: '<path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 20h14"/>',
  stk: '<path d="M16 6.5C15.3 5 13.9 4 12 4c-2.4 0-4 1.3-4 3.2C8 11 16 9.5 16 14c0 2-1.8 3.5-4.2 3.5-2 0-3.5-1-4.3-2.5"/><path d="M4 12h16"/>',
  hltext: '<path d="M4 20h16"/><path d="m8 16 1-4 7-7 3 3-7 7z"/>',
  reverse: '<path d="M7 4v16m0 0-3-3m3 3 3-3"/><path d="M17 20V4m0 0-3 3m3-3 3 3"/>',
  clean: '<path d="M3 21h18"/><path d="m14 4 6 6-8 8H6v-6z"/><path d="m9 9 6 6"/>',
  fliph: '<path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 7 4 12l5 5z"/><path d="M15 7l5 5-5 5z"/>',
  flipv: '<path d="M3 12h18" stroke-dasharray="2 2"/><path d="M7 9l5-5 5 5z"/><path d="M7 15l5 5 5-5z"/>',
  tbox: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7.5 8.5h9M12 8.5v8"/>',
  fmt: '<path d="M4 19 9.5 5h1L16 19M6.2 14h7.6"/><path d="M17 8h4M17 12h4M19 16h2"/>',
  tal: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  tac: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  tar: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  taj: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
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
  shapeKind: lsGet('pdfmate.shape', 'rrect'),
  style: lsGet('pdfmate.style', { ink: '#000000', hl: '#ffd60a', size: 12, width: 1.5 })
};
const INKS = [['Black', '#000000'], ['Blue', '#0040dd'], ['Red', '#d70015'], ['Green', '#1a7f37'], ['Orange', '#c93400']];
const HLS = [['Yellow', '#ffd60a'], ['Green', '#8be28b'], ['Pink', '#ff9ecf'], ['Blue', '#7cc7ff']];
const TOOLS = [
  ['select', 'Select text and objects (V)', 'select'], ['hand', 'Hand: drag to move around (H, or hold Space)', 'hand'], ['sep'],
  ['text', 'Add text (T)', 'text'], ['tbox', 'Text box (B)', 'tbox'], ['edittext', 'Edit existing text (D)', 'edit'], ['objedit', 'Edit PDF contents: text, shapes and images (O)', 'objedit'], ['note', 'Sticky note (N)', 'note'], ['hl', 'Highlight area (U)', 'hl'], ['white', 'Whiteout (W)', 'white'], ['redact', 'Redact: remove content permanently (X)', 'redact'], ['sep'],
  ['g:shape', 'Shapes', 'rect'], ['pen', 'Pen (P)', 'pen'], ['g:mark', 'Tick or cross', 'tick'], ['sep'],
  ['g:sign', 'Sign, stamp or insert image', 'sign']
];
const GROUPS = {
  shape: [['rect', 'Rectangle', 'rect', 'R'], ['ellipse', 'Ellipse', 'ellipse', 'E'], ['line', 'Line', 'line', 'L'], ['arrow', 'Arrow', 'arrow', 'A']],
  mark: [['tick', 'Tick', 'tick'], ['cross', 'Cross', 'cross']]
};
const STAMPS = [['APPROVED', '#1a7f37'], ['RECEIVED', '#0040dd'], ['NOTED', '#0040dd'], ['CHECKED', '#1a7f37'], ['ORIGINAL', '#0040dd'], ['COPY', '#c93400'], ['REJECTED', '#d70015'], ['VOID', '#d70015'], ['CONFIDENTIAL', '#d70015'], ['URGENT', '#d70015']];
const SHP_FILLS = [['No fill', 'none'], ['White', '#ffffff'], ['Light yellow', '#fff3a6'], ['Light blue', '#d6ecff'], ['Light green', '#d4f5c9'], ['Light pink', '#ffd9ec'], ['Light grey', '#e5e5ea'], ['See-through, line colour', 'tint']];
const c0eq = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const NOTE_BGS = [['Yellow', '#fff3a6'], ['Green', '#d4f5c9'], ['Blue', '#d6ecff'], ['Pink', '#ffd9ec']];
const DRAW_TOOLS = new Set(['crop', 'text', 'tbox', 'objedit', 'measure', 'area', 'cloud', 'note', 'white', 'hl', 'redact', 'rect', 'ellipse', 'line', 'arrow', 'darrow', 'shape', 'pen', 'eraser', 'lasso', 'tick', 'cross', 'image', 'stamp']);
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
const FONT_KEYS = { helv: ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'], times: ['TimesRoman', 'TimesRomanBold', 'TimesRomanItalic', 'TimesRomanBoldItalic'], cour: ['Courier', 'CourierBold', 'CourierOblique', 'CourierBoldOblique'] };
const FONT_CSS = { helv: 'Helvetica, Arial, "Liberation Sans", sans-serif', times: '"Times New Roman", Times, "Liberation Serif", serif', cour: '"Courier New", Courier, "Liberation Mono", monospace' };
const FONT_NAMES = [['helv', 'Arial / Helvetica'], ['times', 'Times New Roman'], ['cour', 'Courier New']];
async function initFont() { const d = await PL.PDFDocument.create(); for (const k in FONT_KEYS) { MET[k] = []; for (const n of FONT_KEYS[k]) MET[k].push(await d.embedFont(PL.StandardFonts[n])); } HELV = MET.helv[0]; HELVB = MET.helv[1]; }
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
const uniFont = (a, px) => `${a.italic ? 'italic ' : ''}${a.bold ? '700' : '400'} ${px}px ${FONT_CSS[a.font || 'helv']}, ${UNI_FALLBACK}`;
let mctx = null;
function measureUni(a, line) { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); mctx.font = uniFont(a, a.size * 4); return mctx.measureText(line).width / 4; }
const tpad = (a) => (a.pad != null && (a.box || a.bg || a.border || a.grad) ? a.pad : a.bg || a.border || a.grad || a.box ? a.size * 0.4 : 0);
const fsty = (a) => (a.bold ? 1 : 0) + (a.italic ? 2 : 0);
function tfont(a) { const m = MET[a.font || 'helv'] || MET.helv; return m ? m[fsty(a)] || m[0] : null; }
const lhOf = (a) => LH * a.size * (a.lh || 1);
function mw(a, s) { if (!s) return 0; const f = tfont(a); let w; try { w = a.uni ? measureUni(a, s) : f ? f.widthOfTextAtSize(s, a.size) : s.length * a.size * 0.5; } catch (e) { w = measureUni(a, s); } return w + (a.ls || 0) * [...s].length; }
function wrapPara(a, s, avail) {
  if (!isFinite(avail) || mw(a, s) <= avail) return [s];
  const out = []; let cur = '';
  const longWord = (w) => { let piece = ''; for (const ch of w) { if (piece && mw(a, piece + ch) > avail) { out.push(piece); piece = ''; } piece += ch; } return piece; };
  for (const w of s.split(/( +)/).filter(Boolean)) {
    if (/^ +$/.test(w)) { cur += w; continue; }
    if (mw(a, cur + w) <= avail) { cur += w; continue; }
    if (cur.trim()) { out.push(cur.replace(/ +$/, '')); cur = ''; }
    cur = mw(a, w) <= avail ? w : longWord(w);
  }
  out.push(cur.replace(/ +$/, '')); return out;
}
// One layout for screen, editor, export and print. Rows carry x/baseline in box space (top-left origin, y down).
function layoutText(a) {
  const pad = tpad(a); const lh = lhOf(a); const lineBox = LH * a.size;
  const ind = a.list ? (a.list === 'bullet' ? a.size * 1.1 : mw(a, '00.') + a.size * 0.45) : 0;
  const avail = a.box ? Math.max(a.size, (a.w || 0) - 2 * pad - ind) : Infinity;
  const rows = []; let n = 0;
  for (const para of String(a.text || '').split('\n')) {
    const has = para.trim().length > 0; if (has) n++;
    const parts = wrapPara(a, para, avail);
    parts.forEach((s, j) => rows.push({ s, w: mw(a, s), pre: j === 0 && has && a.list ? (a.list === 'bullet' ? '•' : n + '.') : '', last: j === parts.length - 1 }));
  }
  const maxW = rows.reduce((m, r) => Math.max(m, r.w), 0);
  const cw = a.box ? avail : Math.max(maxW, a.size * 0.6);
  const W = a.box ? a.w : cw + ind + 2 * pad;
  const ch = rows.length * lh; const H = Math.max(ch + 2 * pad, a.box ? (a.minH || 0) : 0);
  const free = H - ch - 2 * pad; const voff = free > 0 ? (a.valign === 'middle' ? free / 2 : a.valign === 'bottom' ? free : 0) : 0;
  const al = a.align || 'left';
  rows.forEach((r, i) => {
    let x = pad + ind; if (al === 'center') x += (cw - r.w) / 2; else if (al === 'right') x += cw - r.w;
    r.x = x; r.top = pad + voff + i * lh + (lh - lineBox) / 2; r.y = r.top + BASE * a.size;
    r.jw = al === 'justify' && !r.last && / /.test(r.s.trim()) && r.w < cw ? cw : 0;
  });
  return { w: W, h: H, rows, pad, ind, cw, lineBox };
}
// Words with x positions for a justified row.
function justWords(a, r) { const ws = r.s.trim().split(/ +/); const tot = ws.reduce((m, w) => m + mw(a, w), 0); const gap = (r.jw - tot) / Math.max(1, ws.length - 1); let x = r.x; return ws.map((w) => { const o = { w, x }; x += mw(a, w) + gap; return o; }); }
function textBox(a) { const L = layoutText(a); return { w: L.w, h: L.h, lines: L.rows.map((r) => r.s), pad: L.pad }; }
function setText(a, text, size) {
  const { V } = UV(a.r); const topX = a.ax + a.h * V[0], topY = a.ay + a.h * V[1];
  if (text != null) { if (needsUni(text)) { a.uni = true; a.text = String(text); } else { a.uni = false; a.text = sanitize(text); } }
  if (size != null) a.size = size;
  const b = textBox(a); a.w = b.w; a.h = b.h;
  a.ax = topX - a.h * V[0]; a.ay = topY - a.h * V[1];
}
// Box shape path in box space (y down), optional rounded corners.
function boxPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const k = r * 0.4477;
  return `M${x + r} ${y}H${x + w - r}C${x + w - k} ${y} ${x + w} ${y + k} ${x + w} ${y + r}V${y + h - r}C${x + w} ${y + h - k} ${x + w - k} ${y + h} ${x + w - r} ${y + h}H${x + r}C${x + k} ${y + h} ${x} ${y + h - k} ${x} ${y + h - r}V${y + r}C${x} ${y + k} ${x + k} ${y} ${x + r} ${y}Z`;
}
const bdW = (a) => (a.bdw != null ? a.bdw : Math.max(1, a.size * 0.09));
const bdDash = (a, bw) => (a.bds === 'dash' ? [bw * 3, bw * 2] : a.bds === 'dot' ? [0.01, bw * 2] : null);
const shOff = (a) => Math.max(1.5, a.size * 0.2);
const GRAD_DIR = { v: [0, 0, 0, 1], h: [0, 0, 1, 0], d: [0, 0, 1, 1] };
function hexA(hex, op) { const h = String(hex || '#000').replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${op})`; }
function gradCanvas(a, k = 4) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(a.w * k)); c.height = Math.max(1, Math.ceil(a.h * k));
  const x = c.getContext('2d'); x.scale(k, k); const d = GRAD_DIR[a.grad[2]] || GRAD_DIR.v;
  const gr = x.createLinearGradient(d[0] * a.w, d[1] * a.h, d[2] * a.w, d[3] * a.h); gr.addColorStop(0, a.grad[0]); gr.addColorStop(1, a.grad[1]);
  x.fillStyle = gr; x.fill(new Path2D(boxPath(0, 0, a.w, a.h, a.rad))); return c;
}

/* ---------- Annotation geometry ---------- */
const ORIENTED = new Set(['text', 'image', 'tick', 'cross']);
const BOXES = new Set(['white', 'hl', 'rect', 'ellipse', 'redact', 'cloud', 'shape']);
function rotPt(x, y, cx, cy, deg) { const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); const dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; }
const normDeg = (d) => { d = ((d % 360) + 360) % 360; d = Math.round(d * 1000) / 1000; return d >= 360 ? 0 : d; };
const ROTATABLE = (a) => a.t !== 'mark';
function annCenter(a) { let L = Infinity, B = Infinity, R = -Infinity, T = -Infinity; for (const [x, y] of corners(a)) { L = Math.min(L, x); R = Math.max(R, x); B = Math.min(B, y); T = Math.max(T, y); } return [(L + R) / 2, (B + T) / 2]; }
// Rotate an annotation by deg (PDF space, positive is anticlockwise) about a pivot point.
function rotateAnn(a, deg, pivot) {
  if (!ROTATABLE(a) || !deg) return;
  if (a.pts) { a.pts = a.pts.map(([x, y]) => rotPt(x, y, pivot[0], pivot[1], deg)); return; }
  if (BOXES.has(a.t)) { const [cx, cy] = rotPt(a.x + a.w / 2, a.y + a.h / 2, pivot[0], pivot[1], deg); a.rot = normDeg((a.rot || 0) + deg); if (!a.rot) delete a.rot; a.x = cx - a.w / 2; a.y = cy - a.h / 2; return; }
  if (ORIENTED.has(a.t)) {
    const c0 = annCenter(a); const [cx, cy] = rotPt(c0[0], c0[1], pivot[0], pivot[1], deg);
    a.r = normDeg((a.r || 0) + deg); const { U, V } = UV(a.r);
    a.ax = cx - (a.w / 2) * U[0] - (a.h / 2) * V[0]; a.ay = cy - (a.w / 2) * U[1] - (a.h / 2) * V[1];
  }
}
function corners(a) {
  if (BOXES.has(a.t)) { if (!a.rot) return [[a.x, a.y], [a.x + a.w, a.y + a.h]]; const cx = a.x + a.w / 2, cy = a.y + a.h / 2; return [[a.x, a.y], [a.x + a.w, a.y], [a.x, a.y + a.h], [a.x + a.w, a.y + a.h]].map(([x, y]) => rotPt(x, y, cx, cy, a.rot)); }
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
  if (BOXES.has(a.t) && a.rot) { const [cx, cy] = f(a.x + a.w / 2, a.y + a.h / 2); const k = Math.abs(Math.abs(T.kx) - 1) > Math.abs(Math.abs(T.ky) - 1) ? Math.abs(T.kx) : Math.abs(T.ky); a.w *= k; a.h *= k; a.x = cx - a.w / 2; a.y = cy - a.h / 2; return; }
  if (BOXES.has(a.t)) { const [x, y] = f(a.x, a.y); a.x = x; a.y = y; a.w *= T.kx; a.h *= T.ky; return; }
  if (a.t === 'mark') { a.rects = a.rects.map(([x, y, w, h]) => { const [nx, ny] = f(x, y); return [nx, ny, w * T.kx, h * T.ky]; }); if (a.segs) a.segs = a.segs.map((sg) => sg.map(([x, y]) => f(x, y))); return; }
  if (a.pts) { a.pts = a.pts.map(([x, y]) => f(x, y)); return; }
  const { U } = UV(a.r); const alongX = U[0] !== 0;
  let su = alongX ? T.kx : T.ky, sv = alongX ? T.ky : T.kx;
  if (uniform) { const s = Math.abs(su - 1) > Math.abs(sv - 1) ? su : sv; su = sv = s; }
  // anchor: keep the corner that maps to the same relative position
  const [ax, ay] = f(a.ax, a.ay); a.ax = ax; a.ay = ay;
  if (a.t === 'text' && a.box) { if (Math.abs(su - 1) > 1e-6) a.w = Math.max(a.size * 2, a.w * Math.abs(su)); if (Math.abs(sv - 1) > 1e-6) a.minH = Math.max(0, a.h * Math.abs(sv)); const b = textBox(a); a.h = b.h; }
  else if (a.t === 'text') { a.size = clamp(a.size * Math.abs(sv), 0.25, 300); const b = textBox(a); a.w = b.w; a.h = b.h; }
  else { a.w = Math.max(2, a.w * su); a.h = Math.max(2, a.h * sv); }
}
function arrowHead(a) { const r = arrowHead1(a, a.pts[0], a.pts[1]); return a.both ? r.concat(arrowHead1(a, a.pts[1], a.pts[0])) : r; }
function arrowHead1(a, p0, p1) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, hl = Math.max(7, (a.width || 1.5) * 4.5), ang = 0.5;
  const c = Math.cos(ang), s = Math.sin(ang);
  const l = [p1[0] - hl * (ux * c - uy * s), p1[1] - hl * (uy * c + ux * s)];
  const r = [p1[0] - hl * (ux * c + uy * s), p1[1] - hl * (uy * c - ux * s)];
  return [[l, p1], [r, p1]];
}
/* ---------- Shapes gallery (3.5) ---------- */
// Each shape is drawn in its own box: x to the right and y down from the top left corner, w wide and h high.
function SP() {
  const subs = []; let cur = null, px = 0, py = 0;
  const o = {
    subs,
    M(x, y) { cur = { c: [['M', x, y]], open: true }; subs.push(cur); px = x; py = y; return o; },
    L(x, y) { if (!cur) return o.M(x, y); if (Math.abs(x - px) > 1e-9 || Math.abs(y - py) > 1e-9) cur.c.push(['L', x, y]); px = x; py = y; return o; },
    C(a, b, c, d, x, y) { cur.c.push(['C', a, b, c, d, x, y]); px = x; py = y; return o; },
    Q(cx, cy, x, y) { return o.C(px + 2 / 3 * (cx - px), py + 2 / 3 * (cy - py), x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), x, y); },
    // Elliptical arc between two angles in degrees (y down, so 90 is the bottom).
    A(cx, cy, rx, ry, t0, t1) {
      const R = Math.PI / 180; o.L(cx + rx * Math.cos(t0 * R), cy + ry * Math.sin(t0 * R));
      const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 90)); const d = (t1 - t0) / n * R; const k = 4 / 3 * Math.tan(d / 4); let t = t0 * R;
      for (let i = 0; i < n; i++) { const t2 = t + d, c1 = Math.cos(t), s1 = Math.sin(t), c2 = Math.cos(t2), s2 = Math.sin(t2); o.C(cx + rx * (c1 - k * s1), cy + ry * (s1 + k * c1), cx + rx * (c2 + k * s2), cy + ry * (s2 - k * c2), cx + rx * c2, cy + ry * s2); t = t2; }
      return o;
    },
    P(pts) { pts.forEach(([x, y], i) => (i ? o.L(x, y) : o.M(x, y))); return o.Z(); },
    Z() { if (cur) { cur.c.push(['Z']); cur.open = false; } cur = null; return o; },
    O() { cur = null; return o; }
  };
  return o;
}
const rrPath = (p, x, y, w, h, r) => { r = Math.max(0, Math.min(r, w / 2, h / 2)); return p.A(x + w - r, y + r, r, r, -90, 0).A(x + w - r, y + h - r, r, r, 0, 90).A(x + r, y + h - r, r, r, 90, 180).A(x + r, y + r, r, r, 180, 270).Z(); };
function fitPts(pts, w, h) { const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); return pts.map(([x, y]) => [(x - x0) / ((x1 - x0) || 1) * w, (y - y0) / ((y1 - y0) || 1) * h]); }
function regPts(n, w, h, start = -90, inner = 0) { const m = inner ? 2 * n : n, pts = []; for (let i = 0; i < m; i++) { const t = (start + i * 360 / m) * Math.PI / 180, r = inner && i % 2 ? inner : 1; pts.push([r * Math.cos(t), r * Math.sin(t)]); } return fitPts(pts, w, h); }
const unitPts = (pts, w, h) => pts.map(([x, y]) => [x * w, y * h]);
// Block arrow pointing right, u along the arrow (length L) and v across it (thickness T).
const arrowPts = (L, T, both) => { const hl = Math.min(both ? L * 0.32 : L * 0.5, T * 0.5); return both ? [[0, T / 2], [hl, 0], [hl, T / 4], [L - hl, T / 4], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, T * 0.75], [hl, T * 0.75], [hl, T]] : [[0, T / 4], [L - hl, T / 4], [L - hl, 0], [L, T / 2], [L - hl, T], [L - hl, T * 0.75], [0, T * 0.75]]; };
const SHAPE_DEFS = {
  rrect: ['Rounded rectangle', (p, w, h) => rrPath(p, 0, 0, w, h, Math.min(w, h) * 0.16)],
  snip: ['Snipped rectangle', (p, w, h) => { const c = Math.min(w, h) * 0.22; p.P([[0, 0], [w - c, 0], [w, c], [w, h], [0, h]]); }],
  snip2: ['Snipped corners', (p, w, h) => { const c = Math.min(w, h) * 0.2; p.P([[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]); }],
  frame: ['Frame', (p, w, h) => { const t = Math.min(w, h) * 0.12; p.P([[0, 0], [w, 0], [w, h], [0, h]]); p.P([[t, t], [t, h - t], [w - t, h - t], [w - t, t]]); }],
  triangle: ['Triangle', (p, w, h) => p.P([[w / 2, 0], [w, h], [0, h]])],
  rtriangle: ['Right triangle', (p, w, h) => p.P([[0, 0], [w, h], [0, h]])],
  diamond: ['Diamond', (p, w, h) => p.P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])],
  para: ['Parallelogram', (p, w, h) => { const o = Math.min(w * 0.25, h * 0.6); p.P([[o, 0], [w, 0], [w - o, h], [0, h]]); }],
  trap: ['Trapezoid', (p, w, h) => { const o = Math.min(w * 0.22, h * 0.6); p.P([[o, 0], [w - o, 0], [w, h], [0, h]]); }],
  pentagon: ['Pentagon', (p, w, h) => p.P(regPts(5, w, h))],
  hexagon: ['Hexagon', (p, w, h) => { const o = Math.min(w * 0.25, h * 0.29); p.P([[o, 0], [w - o, 0], [w, h / 2], [w - o, h], [o, h], [0, h / 2]]); }],
  heptagon: ['Heptagon', (p, w, h) => p.P(regPts(7, w, h))],
  octagon: ['Octagon', (p, w, h) => { const c = Math.min(w, h) * 0.29; p.P([[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]); }],
  decagon: ['Decagon', (p, w, h) => p.P(regPts(10, w, h, 0))],
  plus: ['Plus', (p, w, h) => { const a = w * 0.33, b = h * 0.33; p.P([[a, 0], [w - a, 0], [w - a, b], [w, b], [w, h - b], [w - a, h - b], [w - a, h], [a, h], [a, h - b], [0, h - b], [0, b], [a, b]]); }],
  donut: ['Ring', (p, w, h) => { const t = Math.min(w, h) * 0.22; p.A(w / 2, h / 2, w / 2, h / 2, 0, 360).Z(); p.A(w / 2, h / 2, w / 2 - t, h / 2 - t, 360, 0).Z(); }],
  noentry: ['No symbol', (p, w, h) => { const t = Math.min(w, h) * 0.17; p.A(w / 2, h / 2, w / 2, h / 2, 0, 360).Z(); p.A(w / 2, h / 2, w / 2 - t, h / 2 - t, 360, 0).Z(); const r1 = w / 2 - t, r2 = h / 2 - t, k = 0.35; p.P([[w / 2 - r1 * 0.62, h / 2 - r2 * 0.62 + k * t], [w / 2 - r1 * 0.62 + k * t, h / 2 - r2 * 0.62], [w / 2 + r1 * 0.62, h / 2 + r2 * 0.62 - k * t], [w / 2 + r1 * 0.62 - k * t, h / 2 + r2 * 0.62]]); }],
  cylinder: ['Cylinder', (p, w, h) => { const r = Math.min(h * 0.14, w * 0.3); p.M(0, r).A(w / 2, r, w / 2, r, 180, 360).L(w, h - r).A(w / 2, h - r, w / 2, r, 0, 180).Z(); p.O().A(w / 2, r, w / 2, r, 180, 0).O(); }],
  cube: ['Cube', (p, w, h) => { const d = Math.min(w, h) * 0.25; p.P([[d, 0], [w, 0], [w, h - d], [w - d, h], [0, h], [0, d]]); p.M(0, d).L(w - d, d).L(w, 0).O(); p.M(w - d, d).L(w - d, h).O(); }],
  heart: ['Heart', (p, w, h) => { p.M(0.5 * w, 0.27 * h).C(0.5 * w, 0.1 * h, 0.36 * w, 0, 0.24 * w, 0).C(0.08 * w, 0, 0, 0.13 * h, 0, 0.3 * h).C(0, 0.58 * h, 0.3 * w, 0.76 * h, 0.5 * w, h).C(0.7 * w, 0.76 * h, w, 0.58 * h, w, 0.3 * h).C(w, 0.13 * h, 0.92 * w, 0, 0.76 * w, 0).C(0.64 * w, 0, 0.5 * w, 0.1 * h, 0.5 * w, 0.27 * h).Z(); }],
  lightning: ['Lightning bolt', (p, w, h) => p.P(unitPts([[0.38, 0], [0.62, 0.29], [0.53, 0.33], [0.8, 0.58], [0.71, 0.62], [1, 1], [0.37, 0.69], [0.47, 0.65], [0.2, 0.44], [0.31, 0.4], [0, 0.13]], w, h))],
  moon: ['Moon', (p, w, h) => { p.M(w, 0).C(0.45 * w, 0, 0, 0.22 * h, 0, 0.5 * h).C(0, 0.78 * h, 0.45 * w, h, w, h).C(0.62 * w, 0.86 * h, 0.4 * w, 0.7 * h, 0.4 * w, 0.5 * h).C(0.4 * w, 0.3 * h, 0.62 * w, 0.14 * h, w, 0).Z(); }],
  smiley: ['Smiley face', (p, w, h) => { p.A(w / 2, h / 2, w / 2, h / 2, 0, 360).Z(); const ex = w * 0.06, ey = h * 0.08; p.A(w * 0.34, h * 0.36, ex, ey, 0, 360).Z(); p.A(w * 0.66, h * 0.36, ex, ey, 0, 360).Z(); p.O().A(w / 2, h * 0.5, w * 0.28, h * 0.24, 30, 150).O(); }],
  teardrop: ['Teardrop', (p, w, h) => { p.M(w, 0).L(w, h / 2).A(w / 2, h / 2, w / 2, h / 2, 0, 270).Z(); }],
  pie: ['Pie', (p, w, h) => { p.M(w / 2, h / 2).A(w / 2, h / 2, w / 2, h / 2, 0, 270).Z(); }],
  lbracket: ['Left bracket', (p, w, h) => { const r = Math.min(w, h * 0.1); p.M(w, 0).Q(0, 0, 0, r).L(0, h - r).Q(0, h, w, h).O(); }],
  rbracket: ['Right bracket', 'lbracket'],
  lbrace: ['Left brace', (p, w, h) => { p.M(w, 0).Q(w / 2, 0, w / 2, h * 0.08).L(w / 2, h * 0.42).Q(w / 2, h / 2, 0, h / 2).Q(w / 2, h / 2, w / 2, h * 0.58).L(w / 2, h * 0.92).Q(w / 2, h, w, h).O(); }],
  rbrace: ['Right brace', 'lbrace'],
  arrR: ['Right arrow', (p, w, h) => p.P(arrowPts(w, h))],
  arrL: ['Left arrow', (p, w, h) => p.P(arrowPts(w, h).map(([u, v]) => [w - u, v]))],
  arrU: ['Up arrow', (p, w, h) => p.P(arrowPts(h, w).map(([u, v]) => [v, h - u]))],
  arrD: ['Down arrow', (p, w, h) => p.P(arrowPts(h, w).map(([u, v]) => [v, u]))],
  arrLR: ['Left and right arrow', (p, w, h) => p.P(arrowPts(w, h, true))],
  arrUD: ['Up and down arrow', (p, w, h) => p.P(arrowPts(h, w, true).map(([u, v]) => [v, u]))],
  arr4: ['Four way arrow', (p, w, h) => { const m = Math.min(w, h), cx = w / 2, cy = h / 2, s = m * 0.09, hh = m * 0.19, hl = m * 0.2; p.P([[cx, 0], [cx + hh, hl], [cx + s, hl], [cx + s, cy - s], [w - hl, cy - s], [w - hl, cy - hh], [w, cy], [w - hl, cy + hh], [w - hl, cy + s], [cx + s, cy + s], [cx + s, h - hl], [cx + hh, h - hl], [cx, h], [cx - hh, h - hl], [cx - s, h - hl], [cx - s, cy + s], [hl, cy + s], [hl, cy + hh], [0, cy], [hl, cy - hh], [hl, cy - s], [cx - s, cy - s], [cx - s, hl], [cx - hh, hl]]); }],
  notched: ['Notched right arrow', (p, w, h) => { const q = arrowPts(w, h); const n = Math.min(w * 0.18, h * 0.3); p.P([...q, [n, h / 2]]); }],
  chevron: ['Chevron', (p, w, h) => { const d = Math.min(w * 0.45, h * 0.5); p.P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]); }],
  homeplate: ['Pentagon arrow', (p, w, h) => { const d = Math.min(w * 0.45, h * 0.5); p.P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h]]); }],
  uturn: ['U-turn arrow', (p, w, h) => { const t = Math.min(w, h) * 0.2, hw = Math.min(w * 0.22, h * 0.2), r = Math.min(w * 0.4, h * 0.42); const xr = w - hw - t / 2; p.M(0, h).L(0, r).A(r, r, r, r, 180, 270).L(xr - r + t / 2, 0).A(xr - r + t / 2, r, r, r, 270, 360).L(xr + t / 2, h * 0.62).L(w, h * 0.62).L(xr, h * 0.98).L(xr - hw - t / 2, h * 0.62).L(xr - t / 2, h * 0.62).L(xr - t / 2, r).A(xr - r + t / 2, r, r - t, r - t, 360, 270).L(r, t).A(r, r, r - t, r - t, 270, 180).L(t, h).Z(); }],
  circArrow: ['Curved arrow', (p, w, h) => { const t = Math.min(w, h) * 0.16, cx = w / 2, cy = h * 0.58, rx = w / 2 - t * 0.9, ry = h * 0.58 - t; p.A(cx, cy, rx + t / 2, ry + t / 2, 180, 335).L(cx + (rx + t * 1.4) * Math.cos(335 * Math.PI / 180), cy + (ry + t * 1.4) * Math.sin(335 * Math.PI / 180)).L(w, cy).L(cx + (rx - t * 1.4) * Math.cos(335 * Math.PI / 180), cy + (ry - t * 1.4) * Math.sin(335 * Math.PI / 180)).L(cx + (rx - t / 2) * Math.cos(335 * Math.PI / 180), cy + (ry - t / 2) * Math.sin(335 * Math.PI / 180)).A(cx, cy, rx - t / 2, ry - t / 2, 335, 180).Z(); }],
  fdecision: ['Decision', 'diamond'], fdata: ['Data', 'para'], fterm: ['Terminator', (p, w, h) => rrPath(p, 0, 0, w, h, Math.min(w, h) / 2)],
  falt: ['Alternate process', (p, w, h) => rrPath(p, 0, 0, w, h, Math.min(w, h) * 0.12)],
  fpredef: ['Predefined process', (p, w, h) => { p.P([[0, 0], [w, 0], [w, h], [0, h]]); const a = Math.min(w * 0.12, h * 0.3); p.M(a, 0).L(a, h).O(); p.M(w - a, 0).L(w - a, h).O(); }],
  fdoc: ['Document', (p, w, h) => { p.M(0, 0).L(w, 0).L(w, h * 0.8).C(w * 0.72, h * 0.62, w * 0.3, h * 1.06, 0, h * 0.86).Z(); }],
  fprep: ['Preparation', (p, w, h) => { const o = Math.min(w * 0.2, h * 0.5); p.P([[o, 0], [w - o, 0], [w, h / 2], [w - o, h], [o, h], [0, h / 2]]); }],
  finput: ['Manual input', (p, w, h) => p.P([[0, h * 0.25], [w, 0], [w, h], [0, h]])],
  fmanual: ['Manual operation', (p, w, h) => p.P([[0, 0], [w, 0], [w * 0.8, h], [w * 0.2, h]])],
  foffpage: ['Off-page connector', (p, w, h) => p.P([[0, 0], [w, 0], [w, h * 0.78], [w / 2, h], [0, h * 0.78]])],
  fcard: ['Card', (p, w, h) => { const c = Math.min(w, h) * 0.25; p.P([[c, 0], [w, 0], [w, h], [0, h], [0, c]]); }],
  fdelay: ['Delay', (p, w, h) => { p.M(0, 0).L(w / 2, 0).A(w / 2, h / 2, w / 2, h / 2, -90, 90).L(0, h).Z(); }],
  fmerge: ['Merge', (p, w, h) => p.P([[0, 0], [w, 0], [w / 2, h]])],
  fextract: ['Extract', 'triangle'], fdb: ['Database', 'cylinder'],
  fdisplay: ['Display', (p, w, h) => { const a = w * 0.16; p.M(a, 0).L(w * 0.82, 0).A(w * 0.82, h / 2, w * 0.18, h / 2, -90, 90).L(a, h).L(0, h / 2).Z(); }],
  fsum: ['Summing junction', (p, w, h) => { p.A(w / 2, h / 2, w / 2, h / 2, 0, 360).Z(); const k = 0.7071; p.M(w / 2 - w / 2 * k, h / 2 - h / 2 * k).L(w / 2 + w / 2 * k, h / 2 + h / 2 * k).O(); p.M(w / 2 + w / 2 * k, h / 2 - h / 2 * k).L(w / 2 - w / 2 * k, h / 2 + h / 2 * k).O(); }],
  star4: ['4-point star', (p, w, h) => p.P(regPts(4, w, h, -90, 0.34))],
  star5: ['5-point star', (p, w, h) => p.P(regPts(5, w, h, -90, 0.382))],
  star6: ['6-point star', (p, w, h) => p.P(regPts(6, w, h, -90, 0.577))],
  star7: ['7-point star', (p, w, h) => p.P(regPts(7, w, h, -90, 0.56))],
  star8: ['8-point star', (p, w, h) => p.P(regPts(8, w, h, -90, 0.7))],
  star10: ['10-point star', (p, w, h) => p.P(regPts(10, w, h, -90, 0.75))],
  star12: ['12-point star', (p, w, h) => p.P(regPts(12, w, h, -90, 0.78))],
  star16: ['16-point star', (p, w, h) => p.P(regPts(16, w, h, -90, 0.82))],
  burst: ['Explosion', (p, w, h) => p.P(unitPts([[0.5, 0], [0.6, 0.24], [0.83, 0.1], [0.76, 0.34], [1, 0.36], [0.82, 0.52], [0.98, 0.72], [0.72, 0.66], [0.7, 0.93], [0.56, 0.75], [0.42, 1], [0.37, 0.75], [0.13, 0.87], [0.22, 0.62], [0, 0.56], [0.19, 0.44], [0.03, 0.23], [0.29, 0.29], [0.29, 0.05], [0.43, 0.23]], w, h))],
  wave: ['Wave banner', (p, w, h) => { const a = h * 0.14; p.M(0, a).C(w * 0.3, -a, w * 0.6, a * 3, w, a).L(w, h - a).C(w * 0.7, h + a, w * 0.4, h - a * 3, 0, h - a).Z(); }],
  ribbon: ['Ribbon', (p, w, h) => { const e = w * 0.16, n = w * 0.06, t = h * 0.2; p.P([[0, t], [e, t], [e, 0], [w - e, 0], [w - e, t], [w, t], [w - n, (h + t) / 2], [w, h], [w - e * 1.4, h], [w - e, h - t], [e, h - t], [e * 1.4, h], [0, h], [n, (h + t) / 2]]); }],
  plaque: ['Plaque', (p, w, h) => { const r = Math.min(w, h) * 0.18; p.M(r, 0).L(w - r, 0).A(w, 0, r, r, 180, 90).L(w, h - r).A(w, h, r, r, 270, 180).L(r, h).A(0, h, r, r, 360, 270).L(0, r).A(0, 0, r, r, 90, 0).Z(); }],
  callRect: ['Rectangle callout', (p, w, h) => p.P([[0, 0], [w, 0], [w, h * 0.72], [w * 0.42, h * 0.72], [w * 0.16, h], [w * 0.24, h * 0.72], [0, h * 0.72]])],
  callRound: ['Rounded callout', (p, w, h) => { const b = h * 0.72, r = Math.min(w, b) * 0.18; p.A(w - r, r, r, r, -90, 0).A(w - r, b - r, r, r, 0, 90).L(w * 0.42, b).L(w * 0.16, h).L(w * 0.25, b).A(r, b - r, r, r, 90, 180).A(r, r, r, r, 180, 270).Z(); }],
  callOval: ['Oval callout', (p, w, h) => { const cx = w / 2, cy = h * 0.38; p.A(cx, cy, w / 2, h * 0.38, 128, 460).L(w * 0.1, h).Z(); }],
  callCloud: ['Thought bubble', (p, w, h) => { const cx = w / 2, cy = h * 0.4, rx = w * 0.44, ry = h * 0.33, N = 11, R = Math.PI / 180; const pt = (k) => { const t = (-90 + k * 360 / N) * R; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)]; }; p.M(...pt(0)); for (let k = 0; k < N; k++) { const a = pt(k), b = pt(k + 1); const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; p.Q(cx + (mx - cx) * 1.38, cy + (my - cy) * 1.38, b[0], b[1]); } p.Z(); p.A(w * 0.22, h * 0.86, w * 0.065, h * 0.055, 0, 360).Z(); p.A(w * 0.1, h * 0.96, w * 0.035, h * 0.035, 0, 360).Z(); }],
  callLine: ['Line callout', (p, w, h) => { p.P([[w * 0.3, 0], [w, 0], [w, h * 0.55], [w * 0.3, h * 0.55]]); p.M(w * 0.3, h * 0.42).L(0, h).O(); }]
};
const MIRROR_X = new Set(['rbracket', 'rbrace']);
function shapeSubs(kind, w, h) {
  let def = SHAPE_DEFS[kind] || SHAPE_DEFS.rrect; let fn = def[1]; while (typeof fn === 'string') fn = (SHAPE_DEFS[fn] || SHAPE_DEFS.rrect)[1];
  const p = SP(); fn(p, Math.max(w, 0.01), Math.max(h, 0.01)); p.Z();
  if (MIRROR_X.has(kind)) for (const s of p.subs) for (const c of s.c) for (let i = 1; i < c.length; i += 2) c[i] = w - c[i];
  return p.subs;
}
function subD(sub, map) { let d = ''; for (const c of sub.c) { if (c[0] === 'Z') { d += 'Z'; continue; } d += c[0]; for (let i = 1; i < c.length; i += 2) { const q = map(c[i], c[i + 1]); d += (i > 1 ? ' ' : '') + (Math.round(q[0] * 1000) / 1000) + ' ' + (Math.round(q[1] * 1000) / 1000); } } return d; }
const shapeLabel = (k) => (SHAPE_DEFS[k] || ['Shape'])[0];
function shapeSvgNodes(g, a) {
  const w = a.width || 1.5; const fill = a.fill || 'none';
  for (const s of shapeSubs(a.kind, a.w, a.h)) g.appendChild(sv('path', { d: subD(s, (x, y) => [a.x + x, a.y + a.h - y]), fill: s.open ? 'none' : fill, 'fill-opacity': a.fop == null ? 1 : a.fop, stroke: a.color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
}
// Gallery: [header, [[label, tool, kind, thumbW, thumbH], ...]]
const SHAPE_GALLERY = [
  ['Lines', [['Line', 'line'], ['Arrow', 'arrow'], ['Double arrow', 'darrow'], ['Freehand', 'pen']]],
  ['Rectangles', [['Rectangle', 'rect'], ['Rounded rectangle', 'shape', 'rrect'], ['Snipped rectangle', 'shape', 'snip'], ['Snipped corners', 'shape', 'snip2'], ['Frame', 'shape', 'frame']]],
  ['Basic shapes', [['Ellipse', 'ellipse'], ['Triangle', 'shape', 'triangle', 18, 16], ['Right triangle', 'shape', 'rtriangle', 18, 16], ['Diamond', 'shape', 'diamond', 18, 18], ['Parallelogram', 'shape', 'para'], ['Trapezoid', 'shape', 'trap'], ['Pentagon', 'shape', 'pentagon', 18, 18], ['Hexagon', 'shape', 'hexagon', 20, 17], ['Heptagon', 'shape', 'heptagon', 18, 18], ['Octagon', 'shape', 'octagon', 18, 18], ['Decagon', 'shape', 'decagon', 18, 18], ['Plus', 'shape', 'plus', 18, 18], ['Ring', 'shape', 'donut', 18, 18], ['No symbol', 'shape', 'noentry', 18, 18], ['Cylinder', 'shape', 'cylinder', 14, 19], ['Cube', 'shape', 'cube', 18, 18], ['Heart', 'shape', 'heart', 19, 17], ['Lightning bolt', 'shape', 'lightning', 16, 20], ['Moon', 'shape', 'moon', 12, 19], ['Smiley face', 'shape', 'smiley', 18, 18], ['Teardrop', 'shape', 'teardrop', 18, 18], ['Pie', 'shape', 'pie', 18, 18], ['Revision cloud', 'cloud'], ['Left bracket', 'shape', 'lbracket', 6, 19], ['Right bracket', 'shape', 'rbracket', 6, 19], ['Left brace', 'shape', 'lbrace', 7, 19], ['Right brace', 'shape', 'rbrace', 7, 19]]],
  ['Block arrows', [['Right arrow', 'shape', 'arrR', 20, 14], ['Left arrow', 'shape', 'arrL', 20, 14], ['Up arrow', 'shape', 'arrU', 14, 20], ['Down arrow', 'shape', 'arrD', 14, 20], ['Left and right arrow', 'shape', 'arrLR', 20, 12], ['Up and down arrow', 'shape', 'arrUD', 12, 20], ['Four way arrow', 'shape', 'arr4', 19, 19], ['Notched right arrow', 'shape', 'notched', 20, 14], ['Chevron', 'shape', 'chevron', 18, 14], ['Pentagon arrow', 'shape', 'homeplate', 20, 13], ['U-turn arrow', 'shape', 'uturn', 18, 18], ['Curved arrow', 'shape', 'circArrow', 20, 14]]],
  ['Flowchart', [['Process', 'rect'], ['Alternate process', 'shape', 'falt'], ['Decision', 'shape', 'fdecision', 20, 16], ['Data', 'shape', 'fdata'], ['Predefined process', 'shape', 'fpredef'], ['Document', 'shape', 'fdoc'], ['Terminator', 'shape', 'fterm', 20, 11], ['Preparation', 'shape', 'fprep', 20, 13], ['Manual input', 'shape', 'finput'], ['Manual operation', 'shape', 'fmanual'], ['Connector', 'ellipse', null, 16, 16], ['Off-page connector', 'shape', 'foffpage', 16, 18], ['Card', 'shape', 'fcard'], ['Delay', 'shape', 'fdelay'], ['Merge', 'shape', 'fmerge', 18, 15], ['Extract', 'shape', 'fextract', 18, 15], ['Database', 'shape', 'fdb', 14, 19], ['Display', 'shape', 'fdisplay'], ['Summing junction', 'shape', 'fsum', 18, 18]]],
  ['Stars and banners', [['4-point star', 'shape', 'star4', 19, 19], ['5-point star', 'shape', 'star5', 20, 19], ['6-point star', 'shape', 'star6', 19, 19], ['7-point star', 'shape', 'star7', 19, 19], ['8-point star', 'shape', 'star8', 19, 19], ['10-point star', 'shape', 'star10', 19, 19], ['12-point star', 'shape', 'star12', 19, 19], ['16-point star', 'shape', 'star16', 19, 19], ['Explosion', 'shape', 'burst', 20, 19], ['Wave banner', 'shape', 'wave', 20, 14], ['Ribbon', 'shape', 'ribbon', 21, 13], ['Plaque', 'shape', 'plaque', 20, 15]]],
  ['Callouts', [['Rectangle callout', 'shape', 'callRect', 20, 18], ['Rounded callout', 'shape', 'callRound', 20, 18], ['Oval callout', 'shape', 'callOval', 20, 18], ['Thought bubble', 'shape', 'callCloud', 20, 18], ['Line callout', 'shape', 'callLine', 20, 16]]]
];
const FILLABLE = new Set(['rect', 'ellipse', 'shape']);
const SHAPE_TOOLS = new Set(['rect', 'ellipse', 'line', 'arrow', 'darrow', 'cloud', 'shape']);
function shapeThumb(it) {
  const [, tool, kind, tw = 20, th = 15] = it; const ox = (24 - tw) / 2, oy = (24 - th) / 2;
  const S1 = (d) => `<path d="${d}"/>`;
  let body = '';
  if (tool === 'shape') body = shapeSubs(kind, tw, th).map((s) => S1(subD(s, (x, y) => [ox + x, oy + y]))).join('');
  else if (tool === 'rect') body = `<rect x="2" y="4.5" width="20" height="15" rx="0.5"/>`;
  else if (tool === 'ellipse') body = `<ellipse cx="12" cy="12" rx="${tw / 2}" ry="${th / 2}"/>`;
  else if (tool === 'line') body = S1('M4 20 20 4');
  else if (tool === 'arrow') body = S1('M4 20 20 4M12 4h8v8');
  else if (tool === 'darrow') body = S1('M4 20 20 4M13 4h7v7M11 20H4v-7');
  else return icon(tool === 'pen' ? 'pen' : 'cloud');
  return `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
const recentShapes = () => { const r = lsGet('pdfmate.shapesRecent', []); return Array.isArray(r) ? r : []; };
const galleryItem = (tool, kind) => { for (const [, list] of SHAPE_GALLERY) for (const it of list) if (it[1] === tool && (tool !== 'shape' || it[2] === kind)) return it; return null; };
// Opens the shape gallery under a button. onPick(item) runs on a choice; replace mode only lists closed shapes.
function openShapes(anchor, onPick, replace) {
  closeMenu();
  const m = document.createElement('div'); m.className = 'menu shapegal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', replace ? 'Change shape' : 'Insert shape');
  const items = []; const btn = (it) => { items.push(it); return `<button class="sg" data-i="${items.length - 1}" title="${esc(it[0])}" aria-label="${esc(it[0])}">${shapeThumb(it)}</button>`; };
  let html = `<div class="sg-head"><b>${replace ? 'Change shape' : 'Insert shape'}</b><span>${replace ? 'Pick the new outline' : 'Pick one, then drag on the page. Shift keeps it in proportion'}</span></div>`;
  const rec = replace ? [] : recentShapes().map(([t, k]) => galleryItem(t, k)).filter(Boolean);
  if (rec.length) html += `<div class="mh">Recently used</div><div class="sg-grid">${rec.map(btn).join('')}</div>`;
  for (const [hd, list] of SHAPE_GALLERY) { const l2 = replace ? list.filter((it) => it[1] === 'shape' || it[1] === 'rect' || it[1] === 'ellipse').filter((it) => !(it[1] === 'shape' && shapeSubs(it[2], 10, 10).every((s) => s.open))) : list; if (l2.length) html += `<div class="mh">${hd}</div><div class="sg-grid">${l2.map(btn).join('')}</div>`; }
  m.innerHTML = html;
  m.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i]; closeMenu(); if (!replace) { const r = recentShapes().filter(([t, k]) => !(t === it[1] && (k || null) === (it[2] || null))); r.unshift([it[1], it[2] || null]); lsSet('pdfmate.shapesRecent', r.slice(0, 10)); } onPick(it); });
  document.body.appendChild(m); menuEl = m;
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = Math.min(m.offsetHeight, innerHeight - 16);
  m.style.left = clamp(r.left, 8, innerWidth - mw - 8) + 'px';
  m.style.top = (r.bottom + 6 + mh > innerHeight - 8 && r.top - mh - 6 > 8 ? r.top - mh - 6 : clamp(r.bottom + 6, 8, innerHeight - mh - 8)) + 'px';
  m.style.maxHeight = (innerHeight - 16) + 'px'; m.style.overflowY = 'auto';
  setTimeout(() => { document.addEventListener('pointerdown', menuOutside, true); document.addEventListener('keydown', menuKey); const f = m.querySelector('button'); if (f) f.focus(); }, 0);
}
function pickShape(it) {
  const [, tool, kind] = it;
  if (tool === 'shape') { S.shapeKind = kind; lsSet('pdfmate.shape', kind); }
  setTool(tool); toast(`${it[0]}: drag on the page, or tap for a standard size`);
}
function changeShape(anchor) {
  const s = selectedAnn(); if (!s) return;
  openShapes(anchor, (it) => { applyStyleToSel((a) => { if (!['rect', 'ellipse', 'shape'].includes(a.t)) return; a.t = it[1]; if (it[1] === 'shape') a.kind = it[2]; else delete a.kind; }); refreshFormatBar(); }, true);
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
  S.sel = null; S.selPages.clear(); renderAll(); syncEditsAfterRestore();
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
  const np = { id: uid('p'), kind: 'blank', view, baseRot: 0, rot: 0, annots: [] }; if (defPaper() !== 'plain') np.paper = defPaper(); S.pages.splice(at, 0, np);
  if (S.pages.length === 1) { $('#docName').value = 'Untitled'; if (innerWidth > 760) setSidebar(true); }
  renderAll(); commit(); scrollToPage(at);
}

/* ---------- 3.11: Draw toolbar, pens, eraser, lasso ---------- */
const PENS = [
  ['ballpoint', 'Ballpoint', 'Even line, like a ballpoint pen', { color: '#0b3d91', width: 1.2, op: 1 }],
  ['fountain', 'Fountain pen', 'Line swells and thins with speed and pressure', { color: '#111111', width: 1.8, op: 1 }],
  ['gel', 'Fineliner', 'Crisp, thin technical line', { color: '#000000', width: 0.6, op: 1 }],
  ['pencil', 'Pencil', 'Soft graphite, slightly see-through', { color: '#4a4a4a', width: 1, op: 0.8 }],
  ['marker', 'Marker', 'Bold felt tip', { color: '#d70015', width: 4, op: 0.95 }],
  ['brush', 'Brush pen', 'Tapered strokes for signatures and lettering', { color: '#111111', width: 5, op: 1 }],
  ['calligraphy', 'Calligraphy', 'Angled nib, thick and thin by direction', { color: '#1c1c1e', width: 4, op: 1 }],
  ['highlighter', 'Highlighter', 'See-through, never hides the text', { color: '#ffd60a', width: 14, op: 0.4 }]
];
const INK_COLS = ['#000000', '#0b3d91', '#0a84ff', '#d70015', '#1a7f37', '#ff9500', '#8e44ad', '#8b5a2b', '#8e8e93', '#ffffff'];
const HL_COLS = ['#ffd60a', '#8be28b', '#ff9ecf', '#7cc7ff', '#ffb35c', '#c7a6ff'];
const INK_SIZES = { ballpoint: [0.5, 0.8, 1.2, 1.8, 2.5], fountain: [1, 1.5, 2, 3, 4.5], gel: [0.3, 0.45, 0.6, 0.9, 1.3], pencil: [0.5, 0.8, 1.2, 1.8, 2.8], marker: [2, 3, 4, 6, 9], brush: [2.5, 4, 5.5, 8, 12], calligraphy: [2, 3, 4, 6, 9], highlighter: [6, 10, 14, 20, 28] };
const INK = Object.assign({ pen: 'ballpoint', set: {}, smooth: 2, pressure: true, snap: true, stylus: false, nib: 45, recent: [], favs: null, esz: 16, emode: 'ink' }, lsGet('pdfmate.ink', {}));
if (!INK.favs) INK.favs = [['ballpoint', '#0b3d91', 1.2], ['ballpoint', '#000000', 0.8], ['fountain', '#111111', 1.8], ['ballpoint', '#d70015', 1.2], ['pencil', '#4a4a4a', 1], ['highlighter', '#ffd60a', 14]];
const saveInk = () => lsSet('pdfmate.ink', INK);
const penDef = (k) => PENS.find((x) => x[0] === k) || PENS[0];
const inkCfg = (k = INK.pen) => Object.assign({}, penDef(k)[3], INK.set[k] || {});
function setInkCfg(o, k = INK.pen) { INK.set[k] = Object.assign(inkCfg(k), o); if (o.color) { INK.recent = [o.color, ...INK.recent.filter((c) => c !== o.color)].slice(0, 6); } saveInk(); }
const INK_TOOLS = new Set(['pen', 'eraser', 'lasso']);
// Width at each point for pens whose line varies.
function inkWidths(a) {
  const n = a.pts.length, b = a.width || 1.5, k = a.pen; const pr = a.pr || []; const w = new Array(n);
  let len = 0; const cum = [0]; for (let i = 1; i < n; i++) { len += Math.hypot(a.pts[i][0] - a.pts[i - 1][0], a.pts[i][1] - a.pts[i - 1][1]); cum.push(len); }
  const taper = (i, frac) => { const t = Math.min(len * frac, b * 6); if (t <= 0) return 1; const s = Math.min(cum[i] / t, (len - cum[i]) / t, 1); return 0.25 + 0.75 * Math.sin(Math.max(0, s) * Math.PI / 2); };
  for (let i = 0; i < n; i++) { const p = pr[i] == null ? 0.5 : pr[i];
    if (k === 'fountain') w[i] = b * (0.45 + 0.9 * p) * taper(i, 0.12);
    else if (k === 'brush') w[i] = b * (0.12 + 1.15 * p) * taper(i, 0.2);
    else w[i] = b; }
  for (let r = 0; r < 2; r++) for (let i = 1; i < n - 1; i++) w[i] = (w[i - 1] + w[i] * 2 + w[i + 1]) / 4;
  return w;
}
const VARIABLE = new Set(['fountain', 'brush', 'calligraphy']);
// Filled outline for variable pens, as an SVG path in page units. ymul -1 flips for PDF export.
function inkOutline(a, ymul = 1) {
  const P = a.pts, n = P.length; if (n < 2) { const [x, y] = P[0]; const r = (a.width || 1.5) / 2; return `M${x - r} ${y * ymul}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`; }
  const L = [], R = [];
  if (a.pen === 'calligraphy') { const ph = (a.nib == null ? 45 : a.nib) * Math.PI / 180; const nx = Math.cos(ph), ny = Math.sin(ph); const h = (a.width || 4) / 2, m = Math.max(0.35, h * 0.12); for (let i = 0; i < n; i++) { const [x, y] = P[i]; let tx = (P[Math.min(n - 1, i + 1)][0] - P[Math.max(0, i - 1)][0]), ty = (P[Math.min(n - 1, i + 1)][1] - P[Math.max(0, i - 1)][1]); const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const ex = nx * h - ty * m, ey = ny * h + tx * m; L.push([x + ex, y + ey]); R.push([x - nx * h + ty * m, y - ny * h - tx * m]); } }
  else { const w = inkWidths(a); for (let i = 0; i < n; i++) { const [x, y] = P[i]; let tx = P[Math.min(n - 1, i + 1)][0] - P[Math.max(0, i - 1)][0], ty = P[Math.min(n - 1, i + 1)][1] - P[Math.max(0, i - 1)][1]; const tl = Math.hypot(tx, ty) || 1; const ox = -ty / tl * w[i] / 2, oy = tx / tl * w[i] / 2; L.push([x + ox, y + oy]); R.push([x - ox, y - oy]); } }
  const f = (q) => `${Math.round(q[0] * 100) / 100} ${Math.round(q[1] * ymul * 100) / 100}`; const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const side = (S2) => { let d = ''; for (let i = 1; i < S2.length - 1; i++) d += `Q${f(S2[i])} ${f(mid(S2[i], S2[i + 1]))}`; return d + `L${f(S2[S2.length - 1])}`; };
  const Rr = R.slice().reverse(); const end = P[n - 1], st = P[0];
  return `M${f(L[0])}${side(L)}Q${f([end[0] + (L[n - 1][0] - R[n - 1][0]) * 0 + (end[0] - P[n - 2][0]) * 0.6, end[1] + (end[1] - P[n - 2][1]) * 0.6])} ${f(Rr[0])}${side(Rr)}Q${f([st[0] - (P[1][0] - st[0]) * 0.6, st[1] - (P[1][1] - st[1]) * 0.6])} ${f(L[0])}Z`;
}
function inkSvg(g, a) {
  const op = a.op == null ? 1 : a.op; const w = a.width || 1.5;
  if (a.pen && VARIABLE.has(a.pen)) { g.appendChild(sv('path', { d: inkOutline(a), fill: a.color, 'fill-opacity': op, stroke: a.color, 'stroke-width': 0.15, 'stroke-opacity': op })); return; }
  const pts = a.pts.length === 1 ? [a.pts[0], [a.pts[0][0] + 0.01, a.pts[0][1]]] : a.pts;
  const at = { points: pts.map((p) => p[0] + ',' + p[1]).join(' '), fill: 'none', stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (op < 1) at['stroke-opacity'] = op;
  if (a.pen === 'highlighter') { at['stroke-linecap'] = 'butt'; at.style = 'mix-blend-mode:multiply'; }
  g.appendChild(sv('polyline', at));
}
async function inkPdf(page, a, col) {
  const op = a.op == null ? 1 : a.op;
  if (a.pen && VARIABLE.has(a.pen)) { page.drawSvgPath(inkOutline(a, -1), { x: 0, y: 0, color: col, opacity: op, borderColor: col, borderWidth: 0.15, borderOpacity: op }); return; }
  const pts = a.pts.length === 1 ? [a.pts[0], [a.pts[0][0] + 0.01, a.pts[0][1]]] : a.pts;
  const d = 'M' + pts.map(([x, y]) => `${x} ${-y}`).join(' L');
  const o = { x: 0, y: 0, borderColor: col, borderWidth: a.width || 1.5, borderOpacity: op, borderLineCap: a.pen === 'highlighter' ? PL.LineCapStyle.Butt : PL.LineCapStyle.Round };
  if (a.pen === 'highlighter') o.blendMode = PL.BlendMode.Multiply;
  page.pushOperators(PL.pushGraphicsState(), PL.setLineJoin(PL.LineJoinStyle.Round)); page.drawSvgPath(d, o); page.pushOperators(PL.popGraphicsState());
}
function newInk(pdfPt, e) {
  const k = INK.pen; const c = inkCfg(k); const a = { id: uid('a'), t: 'pen', pts: [pdfPt], color: c.color, width: c.width };
  if (k !== 'ballpoint') a.pen = k; if (c.op != null && c.op < 1) a.op = c.op; if (k === 'calligraphy') a.nib = INK.nib;
  if (VARIABLE.has(k)) a.pr = [inkPressure(e, 0)];
  return a;
}
function inkPressure(e, speed) { if (INK.pressure && e.pointerType === 'pen' && e.pressure > 0) return clamp(e.pressure, 0.05, 1); return clamp(1 - speed * 0.9, 0.3, 1); }
// Add points from a move, with the stabiliser and pressure.
function inkMove(d, e, el, g) {
  const a = d.a; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; const list = evs.length ? evs : [e]; const k = [0, 0.35, 0.55, 0.72, 0.84][INK.smooth] || 0;
  for (const ev of list) {
    const q = ap(g.i, ...ptFromEvent(ev, el)); const lp = a.pts[a.pts.length - 1];
    const nx = lp[0] + (q[0] - lp[0]) * (1 - k), ny = lp[1] + (q[1] - lp[1]) * (1 - k);
    const dist = Math.hypot(nx - lp[0], ny - lp[1]); if (dist <= 0.6 / S.zoom + 0.25) continue;
    const now = ev.timeStamp || performance.now(); const dt = Math.max(1, now - (d.lt || now - 16)); d.lt = now; const sp = clamp(dist * S.zoom / dt / 2.2, 0, 1); d.sp = d.sp == null ? sp : d.sp * 0.7 + sp * 0.3;
    a.pts.push([nx, ny]); if (a.pr) a.pr.push(inkPressure(ev, d.sp));
  }
  d.raw = ap(g.i, ...ptFromEvent(e, el));
}
function inkFinish(d) { const a = d.a; if (!a || a.t !== 'pen') return; if (d.raw && INK.smooth) { const lp = a.pts[a.pts.length - 1]; if (Math.hypot(d.raw[0] - lp[0], d.raw[1] - lp[1]) > 0.5) { a.pts.push(d.raw); if (a.pr) a.pr.push(a.pr[a.pr.length - 1]); } } }

/* Eraser */
function inkSegDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const L = dx * dx + dy * dy; let t = L ? ((px - a[0]) * dx + (py - a[1]) * dy) / L : 0; t = clamp(t, 0, 1); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); }
function eraseAt(d, pt) {
  const p = d.p, g = d.g; const q = ap(g.i, pt[0], pt[1]); const r = INK.esz / 2 / S.zoom; const gone = [];
  for (const a of p.annots) {
    if (a.pts && (a.t === 'pen' || INK.emode === 'all')) { const w = (a.width || 1.5) / 2 + r; let hit = false; if (a.pts.length === 1) hit = Math.hypot(q[0] - a.pts[0][0], q[1] - a.pts[0][1]) < w; for (let i = 1; i < a.pts.length && !hit; i++) if (inkSegDist(q[0], q[1], a.pts[i - 1], a.pts[i]) < w) hit = true; if (hit) gone.push(a.id); }
    else if (INK.emode === 'all' && !a.pts) { const b = dispBox(a, g); const rr = INK.esz / 2; if (pt[0] > b.L - rr && pt[0] < b.R + rr && pt[1] > b.T - rr && pt[1] < b.B + rr) gone.push(a.id); }
  }
  if (gone.length) { const s = new Set(gone); p.annots = p.annots.filter((a) => !s.has(a.id)); d.n = (d.n || 0) + gone.length; drawOverlay(p, d.el); }
}
function eraserCursor() { const s = clamp(INK.esz, 6, 64), h = s / 2; const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s + 2}' height='${s + 2}'><circle cx='${h + 1}' cy='${h + 1}' r='${h}' fill='rgba(255,255,255,.35)' stroke='%23555' stroke-width='1'/></svg>`; viewer.style.setProperty('--erase-cur', `url("data:image/svg+xml;utf8,${svg}") ${h + 1} ${h + 1}, crosshair`); }

/* Lasso */
let LASSO = null;
function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi || 1e-9) + xi) c = !c; } return c; }
function lassoSelect(d) {
  const p = d.p, g = d.g; const poly = LASSO ? LASSO.pts : []; LASSO = null; if (poly.length < 3) { drawOverlay(p, d.el); return; }
  const ids = p.annots.filter((a) => { if (a.pts && a.pts.length) { const dp = a.pts.map(([x, y]) => ap(g.t, x, y)); const inside = dp.filter(([x, y]) => inPoly(x, y, poly)).length; return inside >= Math.max(1, dp.length * 0.5); } const b = dispBox(a, g); return inPoly((b.L + b.R) / 2, (b.T + b.B) / 2, poly); }).map((a) => a.id);
  if (!ids.length) { drawOverlay(p, d.el); toast('Nothing inside the loop'); return; }
  setTool('select'); select(p.id, null, { ids }); toast(`${ids.length} item${ids.length > 1 ? 's' : ''} selected. Drag to move${p.annots.filter((a) => ids.includes(a.id)).every((a) => a.t === 'pen') ? ', or change pen, colour and size in the bar' : ', align or delete from the bar'}`);
}

/* The Draw bar: shown in the format bar while a drawing tool is active or ink is selected. */
function inkBarHtml(sel) {
  const tool = S.tool; const selA = sel && sel.a.t === 'pen' ? sel.a : null;
  if (tool === 'eraser' && !selA) return `<span class="fb-label">${icon('eraser')} Eraser</span><div class="seg ink-seg" role="group" aria-label="Erase">${[['ink', 'Ink only'], ['all', 'All markup']].map(([k, l]) => `<button data-emode="${k}" aria-pressed="${INK.emode === k}">${l}</button>`).join('')}</div><div class="ink-sizes">${[8, 16, 28, 48].map((v) => `<button class="ink-sz" data-esz="${v}" aria-pressed="${INK.esz === v}" title="${v} px"><i style="width:${Math.min(22, v / 2 + 4)}px;height:${Math.min(22, v / 2 + 4)}px"></i></button>`).join('')}</div><span class="fb-spacer"></span><button class="tbtn" data-ink="clearpage" style="color:var(--danger)">${icon('trash')}<span class="tb-hide-m">Clear ink on page</span></button><span class="fb-hint">Drag over strokes to rub them out.</span><button class="tbtn" data-act="done">Done</button>`;
  if (tool === 'lasso' && !selA) return `<span class="fb-label">${icon('lasso')} Lasso</span><span class="fb-hint">Draw a loop around strokes or any markup to select them, then move, recolour or delete.</span><span class="fb-spacer"></span><button class="tbtn" data-act="done">Done</button>`;
  const k = selA ? (selA.pen || 'ballpoint') : INK.pen; const c = selA ? { color: selA.color, width: selA.width, op: selA.op == null ? 1 : selA.op } : inkCfg(k); const hl = k === 'highlighter';
  const cols = hl ? HL_COLS : INK_COLS; const rec = INK.recent.filter((x) => !cols.includes(x)).slice(0, 3);
  const favs = INK.favs.map((f, i) => `<button class="ink-fav" data-fav="${i}" title="${penDef(f[0])[1]}, ${f[2]} pt. Right-click to save the current pen here" aria-pressed="${!selA && f[0] === k && f[1].toLowerCase() === String(c.color).toLowerCase() && Math.abs(f[2] - c.width) < 0.01}">${icon('pen_' + f[0])}<i style="background:${f[1]}"></i></button>`).join('');
  return `<div class="ink-favs" role="group" aria-label="Favourite pens">${favs}</div><span class="fb-sep"></span>
    <button class="tbtn ink-pen" data-ink="pens" title="Choose pen type">${icon('pen_' + k)}<span>${penDef(k)[1]}</span>${CHEV}</button>
    <div class="swatches ink-cols" role="group" aria-label="Ink colour">${[...cols, ...rec].map((x) => `<button class="sw" data-inkc="${x}" style="background:${x}" title="${x}" aria-pressed="${x.toLowerCase() === String(c.color).toLowerCase()}"></button>`).join('')}<label class="sw sw-pick" title="Any colour"><input type="color" data-inkpick value="${c.color}"></label></div>
    <div class="ink-sizes" role="group" aria-label="Nib size">${INK_SIZES[k].map((v) => `<button class="ink-sz" data-inksz="${v}" aria-pressed="${Math.abs(v - c.width) < 0.01}" title="${v} pt"><i style="width:${Math.max(3, Math.min(20, v * (hl ? 0.7 : 2.6)))}px;height:${Math.max(3, Math.min(20, v * (hl ? 0.7 : 2.6)))}px;background:${c.color};${hl ? 'border-radius:2px;opacity:.7' : ''}"></i></button>`).join('')}</div>
    <label class="ink-range" title="Nib thickness"><input type="range" data-inkw min="0.2" max="${hl ? 40 : 24}" step="0.1" value="${c.width}"><output>${Math.round(c.width * 10) / 10} pt</output></label>
    <label class="ink-range ink-op" title="Opacity"><span>${icon('theme')}</span><input type="range" data-inkop min="0.1" max="1" step="0.05" value="${c.op}"><output>${Math.round(c.op * 100)}%</output></label>
    <button class="tbtn" data-ink="more" title="Smoothing, pressure, nib angle, stylus only, shape snapping">${icon('props')}<span class="tb-hide-m">Pen options</span></button>
    <span class="fb-spacer"></span>${selA ? '' : '<button class="tbtn" data-act="done">Done</button>'}`;
}
function inkApply(o, quiet) {
  const s = selectedAnn(); const ids = selIds ? selIds() : [];
  if (s && s.a.t === 'pen') { const p = s.p; const set = new Set(ids.length ? ids : [s.a.id]); for (const a of p.annots) if (set.has(a.id) && a.t === 'pen') { if (o.color) a.color = o.color; if (o.width != null) a.width = o.width; if (o.op != null) { if (o.op < 1) a.op = o.op; else delete a.op; } if (o.pen) { if (o.pen === 'ballpoint') delete a.pen; else a.pen = o.pen; if (VARIABLE.has(o.pen) && !a.pr) a.pr = a.pts.map(() => 0.6); if (o.pen === 'calligraphy') a.nib = INK.nib; const d = penDef(o.pen)[3]; if (o.color == null && o.pen === 'highlighter') a.color = inkCfg('highlighter').color; if (o.width == null) a.width = inkCfg(o.pen).width; if (o.op == null) { const op = inkCfg(o.pen).op; if (op < 1) a.op = op; else delete a.op; } void d; } } drawOverlay(p); clearTimeout(styleCommitT); styleCommitT = setTimeout(commit, 350); }
  else { if (o.pen) { INK.pen = o.pen; saveInk(); } const r = Object.assign({}, o); delete r.pen; if (Object.keys(r).length) setInkCfg(r); }
  refreshFormatBar();
}
function inkApplyQuiet(o) { inkApply(o, true); }
function inkClick(e) {
  const b = e.target.closest('button,[data-inkpick]'); if (!b) return false; const fb = $('#formatBar');
  if (b.dataset.inkc) { inkApply({ color: b.dataset.inkc }); return true; }
  if (b.dataset.inksz) { inkApply({ width: +b.dataset.inksz }); return true; }
  if (b.dataset.fav != null) { const f = INK.favs[+b.dataset.fav]; if (selectedAnn() && selectedAnn().a.t === 'pen') inkApply({ pen: f[0], color: f[1], width: f[2] }); else { INK.pen = f[0]; setInkCfg({ color: f[1], width: f[2] }, f[0]); if (S.tool !== 'pen') setTool('pen'); else refreshFormatBar(); buildToolsPressed(); } return true; }
  if (b.dataset.emode) { INK.emode = b.dataset.emode; saveInk(); refreshFormatBar(); return true; }
  if (b.dataset.esz) { INK.esz = +b.dataset.esz; saveInk(); eraserCursor(); refreshFormatBar(); return true; }
  const k = b.dataset.ink; if (!k) return false;
  if (k === 'pens') { openMenu(b, PENS.map(([p, l, d]) => ({ label: `${l}`, icon: 'pen_' + p, kbd: '', run: () => { inkApply({ pen: p }); if (!selectedAnn() && S.tool !== 'pen') setTool('pen'); buildToolsPressed(); } }))); return true; }
  if (k === 'more') { const on = (v) => (v ? 'check' : 'blank'); openMenu(b, [{ h: 'Smoothing' }, ...['Off', 'Light', 'Medium', 'Strong', 'Strongest'].map((l, i) => ({ label: l, icon: on(INK.smooth === i), run: () => { INK.smooth = i; saveInk(); } })), '-', { label: 'Use stylus pressure', icon: on(INK.pressure), run: () => { INK.pressure = !INK.pressure; saveInk(); } }, { label: 'Stylus only, finger scrolls', icon: on(INK.stylus), run: () => { INK.stylus = !INK.stylus; saveInk(); viewer.classList.toggle('stylus-only', INK.stylus); toast(INK.stylus ? 'Only the stylus draws. Fingers scroll and zoom' : 'Fingers and stylus both draw'); } }, { label: 'Hold to snap shapes', icon: on(INK.snap), run: () => { INK.snap = !INK.snap; lsSet('pdfmate.snap', INK.snap); saveInk(); } }, '-', { h: 'Opacity' }, ...[1, 0.8, 0.6, 0.4].map((v) => ({ label: Math.round(v * 100) + '%', icon: on(Math.abs((inkCfg().op == null ? 1 : inkCfg().op) - v) < 0.01), run: () => inkApply({ op: v }) })), '-', { h: 'Calligraphy nib angle' }, ...[30, 45, 60, 90].map((v) => ({ label: v + '°', icon: on(INK.nib === v), run: () => { INK.nib = v; saveInk(); } }))]); return true; }
  if (k === 'clearpage') { const p = S.pages[S.current]; if (!p) return true; const n = p.annots.filter((a) => a.t === 'pen').length; if (!n) { toast('No ink on this page'); return true; } confirmSheet(`Clear ${n} ink stroke${n > 1 ? 's' : ''} on this page?`, 'Undo can bring them back.', 'Clear ink', () => { p.annots = p.annots.filter((a) => a.t !== 'pen'); drawOverlay(p); commit(); }); return true; }
  void fb; return false;
}
function inkContext(e) { const b = e.target.closest('[data-fav]'); if (!b) return; e.preventDefault(); const i = +b.dataset.fav; const c = inkCfg(); INK.favs[i] = [INK.pen, c.color, c.width]; saveInk(); refreshFormatBar(); toast('Saved this pen to the favourite slot'); }
function buildToolsPressed() { $$('#tools [data-pen]').forEach((b) => b.setAttribute('aria-pressed', S.tool === 'pen' && b.dataset.pen === INK.pen)); }

/* ---------- 3.10: paper templates for blank pages ---------- */
const PAPERS_T = [['plain', 'Plain'], ['narrow', 'Lined, narrow (6 mm)'], ['lined', 'Lined (8 mm)'], ['wide', 'Lined, wide (10 mm)'], ['grid5', 'Grid 5 mm'], ['grid10', 'Grid 1 cm'], ['graph', 'Graph paper (mm)'], ['dots', 'Dots 5 mm'], ['cornell', 'Cornell notes'], ['checklist', 'Checklist'], ['log', 'Log sheet'], ['meeting', 'Meeting notes'], ['music', 'Music staves']];
const paperName = (k) => (PAPERS_T.find((x) => x[0] === k) || PAPERS_T[0])[1];
const defPaper = () => lsGet('pdfmate.paper', 'plain');
// Drawing instructions in page units (points, y up from the bottom left of the page box).
function paperPrims(kind, W, H) {
  const mm = 72 / 25.4, o = []; const L = [0.78, 0.82, 0.88], M = [0.62, 0.69, 0.78], D = [0.58, 0.62, 0.68], R = [0.93, 0.6, 0.6], T = [0.42, 0.47, 0.55];
  const ln = (x1, y1, x2, y2, w = 0.5, c = L) => o.push({ l: [x1, y1, x2, y2], w, c }); const tx = (s, x, y, size = 8, b = false, c = T) => o.push({ t: s, x, y, s: size, b, c });
  const rule = (x1, x2, top, bot, step, c = L) => { for (let y = top; y > bot - 0.1; y -= step) ln(x1, y, x2, y, 0.5, c); };
  const grid = (x0, y0, x1, y1, step, majorEvery, cMinor = L, cMajor = M, wMin = 0.3, wMaj = 0.6) => { let i = 0; for (let x = x0; x <= x1 + 0.1; x += step, i++) ln(x, y0, x, y1, majorEvery && i % majorEvery === 0 ? wMaj : wMin, majorEvery && i % majorEvery === 0 ? cMajor : cMinor); i = 0; for (let y = y0; y <= y1 + 0.1; y += step, i++) ln(x0, y, x1, y, majorEvery && i % majorEvery === 0 ? wMaj : wMin, majorEvery && i % majorEvery === 0 ? cMajor : cMinor); };
  if (kind === 'narrow' || kind === 'lined' || kind === 'wide') { const st = { narrow: 6, lined: 8, wide: 10 }[kind] * mm; rule(12 * mm, W - 12 * mm, H - 25 * mm, 15 * mm, st); ln(28 * mm, 10 * mm, 28 * mm, H - 10 * mm, 0.6, R); }
  else if (kind === 'grid5') { const s = 5 * mm; const nx = Math.floor((W - 20 * mm) / s), ny = Math.floor((H - 20 * mm) / s); const x0 = (W - nx * s) / 2, y0 = (H - ny * s) / 2; grid(x0, y0, x0 + nx * s, y0 + ny * s, s, 5); }
  else if (kind === 'grid10') { const s = 10 * mm; const nx = Math.floor((W - 20 * mm) / s), ny = Math.floor((H - 20 * mm) / s); const x0 = (W - nx * s) / 2, y0 = (H - ny * s) / 2; grid(x0, y0, x0 + nx * s, y0 + ny * s, s, 0, M, M, 0.45); }
  else if (kind === 'graph') { const s = mm; const nx = Math.floor((W - 20 * mm) / (10 * mm)) * 10, ny = Math.floor((H - 20 * mm) / (10 * mm)) * 10; const x0 = (W - nx * s) / 2, y0 = (H - ny * s) / 2; for (let i = 0; i <= nx; i++) { const x = x0 + i * s; ln(x, y0, x, y0 + ny * s, i % 10 === 0 ? 0.7 : i % 5 === 0 ? 0.4 : 0.2, i % 10 === 0 ? [0.55, 0.72, 0.62] : i % 5 === 0 ? [0.68, 0.82, 0.72] : [0.84, 0.92, 0.86]); } for (let j = 0; j <= ny; j++) { const y = y0 + j * s; ln(x0, y, x0 + nx * s, y, j % 10 === 0 ? 0.7 : j % 5 === 0 ? 0.4 : 0.2, j % 10 === 0 ? [0.55, 0.72, 0.62] : j % 5 === 0 ? [0.68, 0.82, 0.72] : [0.84, 0.92, 0.86]); } }
  else if (kind === 'dots') { const s = 5 * mm; for (let x = s; x < W - 1; x += s) for (let y = s; y < H - 1; y += s) o.push({ d: [x, y, 0.5], c: D }); }
  else if (kind === 'cornell') { const top = H - 32 * mm, cue = 62 * mm, sum = 52 * mm; tx('TOPIC', 12 * mm, H - 16 * mm, 7, true); tx('DATE', W - 60 * mm, H - 16 * mm, 7, true); ln(12 * mm, H - 22 * mm, W - 70 * mm, H - 22 * mm, 0.5, M); ln(W - 60 * mm, H - 22 * mm, W - 12 * mm, H - 22 * mm, 0.5, M); ln(10 * mm, top, W - 10 * mm, top, 1, M); ln(cue, top, cue, sum, 1, M); ln(10 * mm, sum, W - 10 * mm, sum, 1, M); tx('CUES', 12 * mm, top - 5 * mm, 7, true); tx('NOTES', cue + 3 * mm, top - 5 * mm, 7, true); tx('SUMMARY', 12 * mm, sum - 6 * mm, 7, true); rule(cue + 3 * mm, W - 10 * mm, top - 10 * mm, sum + 6 * mm, 8 * mm); rule(12 * mm, W - 10 * mm, sum - 14 * mm, 12 * mm, 8 * mm); }
  else if (kind === 'checklist') { tx('CHECKLIST', 14 * mm, H - 18 * mm, 9, true); tx('DATE', W - 62 * mm, H - 18 * mm, 7, true); ln(W - 50 * mm, H - 18 * mm, W - 14 * mm, H - 18 * mm, 0.5, M); ln(14 * mm, H - 24 * mm, W - 14 * mm, H - 24 * mm, 1, M); for (let y = H - 36 * mm; y > 16 * mm; y -= 10 * mm) { o.push({ r: [14 * mm, y, 4.2 * mm, 4.2 * mm], w: 0.8, c: M }); ln(22 * mm, y, W - 14 * mm, y, 0.5, L); } }
  else if (kind === 'log') { const x0 = 12 * mm, x1 = W - 12 * mm; const cols = [[x0, 'DATE'], [x0 + 24 * mm, 'TIME'], [x0 + 42 * mm, 'DETAILS'], [x1 - 26 * mm, 'SIGN']]; tx('LOG SHEET', x0, H - 16 * mm, 9, true); const top = H - 22 * mm, hh = 8 * mm, rh = 8.5 * mm; o.push({ r: [x0, top - hh, x1 - x0, hh], w: 0, c: [0.93, 0.95, 0.98], fill: true }); for (const [x, l] of cols) tx(l, x + 2 * mm, top - 5.4 * mm, 7, true); let y = top - hh; const bottom = 14 * mm; while (y - rh >= bottom) y -= rh; for (let yy = top; yy >= y - 0.1; yy -= (yy === top ? hh : rh)) ln(x0, yy, x1, yy, yy === top || yy === top - hh ? 0.8 : 0.45, yy === top || yy === top - hh ? M : L); for (const [x] of cols.slice(1)) ln(x, top, x, y, 0.45, L); ln(x0, top, x0, y, 0.8, M); ln(x1, top, x1, y, 0.8, M); ln(x0, y, x1, y, 0.8, M); }
  else if (kind === 'meeting') { const x0 = 14 * mm, x1 = W - 14 * mm; let y = H - 18 * mm; tx('MEETING NOTES', x0, y, 10, true); y -= 10 * mm; for (const [a, b] of [['DATE', 'TIME'], ['PLACE', 'CHAIR']]) { tx(a, x0, y, 7, true); ln(x0 + 16 * mm, y, (x0 + x1) / 2 - 6 * mm, y, 0.5, M); tx(b, (x0 + x1) / 2, y, 7, true); ln((x0 + x1) / 2 + 16 * mm, y, x1, y, 0.5, M); y -= 8 * mm; } tx('ATTENDEES', x0, y, 7, true); ln(x0 + 24 * mm, y, x1, y, 0.5, M); y -= 7 * mm; ln(x0, y, x1, y, 0.5, L); y -= 10 * mm; tx('AGENDA', x0, y, 7, true); y -= 2 * mm; for (let k = 0; k < 4; k++) { y -= 7 * mm; ln(x0, y, x1, y, 0.5, L); } y -= 10 * mm; tx('NOTES', x0, y, 7, true); y -= 2 * mm; const act = 62 * mm; while (y - 8 * mm > act + 10 * mm) { y -= 8 * mm; ln(x0, y, x1, y, 0.5, L); } tx('ACTIONS', x0, act, 7, true); const ty = act - 3 * mm; const c2 = x1 - 60 * mm, c3 = x1 - 26 * mm; tx('ACTION', x0 + 2 * mm, ty - 5 * mm, 6.5, true); tx('BY', c2 + 2 * mm, ty - 5 * mm, 6.5, true); tx('DUE', c3 + 2 * mm, ty - 5 * mm, 6.5, true); let yy = ty; ln(x0, yy, x1, yy, 0.8, M); yy -= 7 * mm; ln(x0, yy, x1, yy, 0.8, M); while (yy - 8 * mm > 12 * mm) { yy -= 8 * mm; ln(x0, yy, x1, yy, 0.45, L); } ln(c2, ty, c2, yy, 0.45, L); ln(c3, ty, c3, yy, 0.45, L); }
  else if (kind === 'music') { const x0 = 15 * mm, x1 = W - 15 * mm, gap = 2 * mm; let y = H - 25 * mm; while (y - 4 * gap > 15 * mm) { for (let k = 0; k < 5; k++) ln(x0, y - k * gap, x1, y - k * gap, 0.5, M); y -= 4 * gap + 13 * mm; } }
  return o;
}
function drawPaperCanvas(ctx, p, s) {
  const k = p.paper; if (!k || k === 'plain' || p.kind !== 'blank') return; const g = geo(p); const t = g.t; const [vx, vy, vx1, vy1] = p.view;
  ctx.save(); ctx.setTransform(t[0] * s, t[1] * s, t[2] * s, t[3] * s, t[4] * s, t[5] * s); ctx.translate(vx, vy); ctx.lineCap = 'butt';
  const col = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
  for (const q of paperPrims(k, vx1 - vx, vy1 - vy)) {
    if (q.l) { ctx.strokeStyle = col(q.c); ctx.lineWidth = Math.max(q.w, 0.6 / s); ctx.beginPath(); ctx.moveTo(q.l[0], q.l[1]); ctx.lineTo(q.l[2], q.l[3]); ctx.stroke(); }
    else if (q.d) { ctx.fillStyle = col(q.c); ctx.beginPath(); ctx.arc(q.d[0], q.d[1], Math.max(q.d[2], 0.7 / s), 0, Math.PI * 2); ctx.fill(); }
    else if (q.r) { if (q.fill) { ctx.fillStyle = col(q.c); ctx.fillRect(...q.r); } else { ctx.strokeStyle = col(q.c); ctx.lineWidth = q.w; ctx.strokeRect(...q.r); } }
    else if (q.t) { ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, -1); ctx.fillStyle = col(q.c); ctx.font = `${q.b ? 700 : 400} ${q.s}px Helvetica, Arial, sans-serif`; ctx.fillText(q.t, 0, 0); ctx.restore(); }
  }
  ctx.restore();
}
async function drawPaperPdf(page, p, font) {
  const k = p.paper; if (!k || k === 'plain' || p.kind !== 'blank') return; const [vx, vy, vx1, vy1] = p.view; const C = (c) => PL.rgb(c[0], c[1], c[2]);
  for (const q of paperPrims(k, vx1 - vx, vy1 - vy)) {
    if (q.l) page.drawLine({ start: { x: vx + q.l[0], y: vy + q.l[1] }, end: { x: vx + q.l[2], y: vy + q.l[3] }, thickness: q.w, color: C(q.c) });
    else if (q.d) page.drawCircle({ x: vx + q.d[0], y: vy + q.d[1], size: q.d[2], color: C(q.c) });
    else if (q.r) { if (q.fill) page.drawRectangle({ x: vx + q.r[0], y: vy + q.r[1], width: q.r[2], height: q.r[3], color: C(q.c) }); else page.drawRectangle({ x: vx + q.r[0], y: vy + q.r[1], width: q.r[2], height: q.r[3], borderColor: C(q.c), borderWidth: q.w }); }
    else if (q.t) page.drawText(q.t, { x: vx + q.x, y: vy + q.y, size: q.s, font: await font('helv', q.b ? 1 : 0), color: C(q.c) });
  }
}
function setPaper(pages, k) {
  const bl = pages.filter((p) => p.kind === 'blank'); if (!bl.length) { toast('Paper styles apply to blank pages. Insert a blank page or create a new PDF first.', { ms: 4500 }); return; }
  for (const p of bl) { if (k === 'plain') delete p.paper; else p.paper = k; for (const key of [...thumbCache.keys()]) if (key.startsWith(p.id + '|')) thumbCache.delete(key); const el = pageEl(p.id); if (el) el._key = null; }
  renderAll(); commit(); toast(`${paperName(k)} on ${bl.length} page${bl.length > 1 ? 's' : ''}${bl.length < pages.length ? '. Other pages are not blank and stay as they are' : ''}`);
}
function paperMenu(anchor) {
  const tps = targetPages(); const cur = tps.length && tps[0].kind === 'blank' ? tps[0].paper || 'plain' : null; const d = defPaper();
  openMenu(anchor, [{ h: tps.length > 1 ? `Paper for ${tps.length} selected pages` : 'Paper for this page' }, ...PAPERS_T.map(([k, l]) => ({ label: l, icon: k === cur ? 'check' : 'blank', run: () => setPaper(tps, k) })), '-', { label: `Default for new blank pages: ${paperName(d)}…`, icon: 'props', run: () => setTimeout(() => defaultPaperMenu(anchor), 0) }, { label: 'Use on every blank page', icon: 'dup', run: () => { if (!cur) { toast('Choose a blank page first', { err: true }); return; } setPaper(S.pages, cur); } }]);
}
function defaultPaperMenu(anchor) { const d = defPaper(); openMenu(anchor, [{ h: 'Default paper for new blank pages' }, ...PAPERS_T.map(([k, l]) => ({ label: l, icon: k === d ? 'check' : 'blank', run: () => { lsSet('pdfmate.paper', k); toast(`New blank pages will use ${paperName(k)}`); } }))]); }
function createBlankDoc(name, W, H, n, paper) {
  if (S.pages.length) newTab();
  const pages = []; for (let i = 0; i < n; i++) { const p = { id: uid('p'), kind: 'blank', view: [0, 0, W, H], baseRot: 0, rot: 0, annots: [] }; if (paper && paper !== 'plain') p.paper = paper; pages.push(p); }
  S.pages = pages; $('#docName').value = name; S.current = 0; if (innerWidth > 760) setSidebar(true); renderAll(); resetHistory(); setDirty(true); renderTabs(); updateChrome(); scheduleSave();
}

/* ---------- 3.12: Design studio (loaded on demand) ---------- */
async function openDesign() {
  closeMenu(); closeSheet();
  try {
    const m = await import('./design.js?v=1');
    await m.openDesign({ PL, icon, toast, downloadBlob, print: () => openPrint(), openPdf: async (bytes, name) => { if (S.pages.length) newTab(); await addFiles([new File([bytes], name + '.pdf', { type: 'application/pdf' })]); } });
  } catch (e) { console.error(e); toast('The design studio could not open. Reload the app and try again', { err: true }); }
}

/* ---------- 3.9: new blank PDF ---------- */
const NEW_SIZES = { a4: ['A4', 210, 297], a3: ['A3', 297, 420], a5: ['A5', 148, 210], letter: ['Letter', 215.9, 279.4], legal: ['Legal', 215.9, 355.6], custom: ['Custom'] };
function openNewPdf() {
  const st = Object.assign({ size: 'a4', land: false, n: 1, cw: 210, ch: 297 }, lsGet('pdfmate.newpdf', {}), { paper: defPaper() }); if (!PAPERS_T.some((x) => x[0] === st.paper)) st.paper = 'plain';
  const sh = sheet(`<h2>New blank PDF</h2><p class="sub">Opens in a new tab, ready to fill, sign or draw on.</p>
    <div class="field"><span class="flabel">Name</span><input id="npName" class="inp" value="Untitled" autocomplete="off"></div>
    <div class="field"><span class="flabel">Page size</span><select id="npSize" class="inp">${Object.entries(NEW_SIZES).map(([k, v]) => `<option value="${k}" ${k === st.size ? 'selected' : ''}>${v[0]}${v[1] ? ` (${v[1]} × ${v[2]} mm)` : ''}</option>`).join('')}</select>
      <div class="pr-row" id="npCustom"><input id="npW" class="inp" inputmode="decimal" value="${st.cw}" aria-label="Width in mm" style="width:90px"> × <input id="npH" class="inp" inputmode="decimal" value="${st.ch}" aria-label="Height in mm" style="width:90px"> mm</div></div>
    <div class="field"><span class="flabel">Orientation</span><div class="seg" role="group"><button data-or="p">Portrait</button><button data-or="l">Landscape</button></div></div>
    <div class="field"><span class="flabel">Paper</span><select id="npPaper" class="inp">${PAPERS_T.map(([k, l]) => `<option value="${k}" ${k === st.paper ? 'selected' : ''}>${l}</option>`).join('')}</select><label class="chkrow"><input type="checkbox" id="npDef"> Also use for blank pages I insert later</label></div>
    <div class="field"><span class="flabel">Pages</span><div class="stepper pr-step"><button type="button" data-np="-1">−</button><input id="npN" class="inp" value="${st.n}" inputmode="numeric" aria-label="Number of pages"><button type="button" data-np="1">+</button></div></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('blank')} Create</button></div>`);
  const $s = (q) => sh.querySelector(q);
  const paint = () => { $s('#npCustom').hidden = $s('#npSize').value !== 'custom'; sh.querySelectorAll('[data-or]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.or === 'l') === st.land)); };
  sh.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.or) { st.land = b.dataset.or === 'l'; paint(); return; }
    if (b.dataset.np) { $s('#npN').value = clamp((parseInt($s('#npN').value, 10) || 1) + +b.dataset.np, 1, 500); return; }
    if (b.hasAttribute('data-x')) { closeSheet(); return; }
    if (b.hasAttribute('data-go')) {
      st.size = $s('#npSize').value; st.n = clamp(parseInt($s('#npN').value, 10) || 1, 1, 500); st.cw = parseFloat(String($s('#npW').value).replace(',', '.')) || 210; st.ch = parseFloat(String($s('#npH').value).replace(',', '.')) || 297; lsSet('pdfmate.newpdf', st);
      let [wmm, hmm] = st.size === 'custom' ? [clamp(st.cw, 20, 5000), clamp(st.ch, 20, 5000)] : NEW_SIZES[st.size].slice(1); if (st.land !== wmm > hmm) [wmm, hmm] = [hmm, wmm];
      const name = ($s('#npName').value || 'Untitled').trim().replace(/[\\/:*?"<>|]/g, '') || 'Untitled';
      st.paper = $s('#npPaper').value; if ($s('#npDef').checked) lsSet('pdfmate.paper', st.paper); lsSet('pdfmate.newpdf', st);
      closeSheet(); const mm = 72 / 25.4; createBlankDoc(name, wmm * mm, hmm * mm, st.n, st.paper); toast(`Created ${name}: ${st.n} page${st.n > 1 ? 's' : ''}, ${paperName(st.paper)} paper. Change it any time under Pages, Paper`);
    }
  });
  $s('#npSize').addEventListener('change', paint); paint(); setTimeout(() => { const i = $s('#npName'); i.focus(); i.select(); }, 60);
}
async function blankPdfBytes(wmm, hmm, n, paper) {
  const mm = 72 / 25.4; const W = wmm * mm, H = hmm * mm; const d = await PL.PDFDocument.create(); d.setProducer('Meridian PDF Mate by Tango Juliet Dev'); d.setCreator('Meridian PDF Mate');
  const line = PL.rgb(0.78, 0.82, 0.88), dot = PL.rgb(0.62, 0.66, 0.72), red = PL.rgb(0.93, 0.6, 0.6);
  for (let k = 0; k < n; k++) {
    const p = d.addPage([W, H]);
    if (paper === 'lined') { const top = H - 25 * mm; for (let y = top; y > 15 * mm; y -= 8 * mm) p.drawLine({ start: { x: 12 * mm, y }, end: { x: W - 12 * mm, y }, thickness: 0.5, color: line }); p.drawLine({ start: { x: 28 * mm, y: 10 * mm }, end: { x: 28 * mm, y: H - 10 * mm }, thickness: 0.6, color: red }); }
    else if (paper === 'grid') { const s = 5 * mm; for (let x = 0; x <= W + 0.1; x += s) p.drawLine({ start: { x, y: 0 }, end: { x, y: H }, thickness: Math.round(x / s) % 5 === 0 ? 0.6 : 0.3, color: line }); for (let y = 0; y <= H + 0.1; y += s) p.drawLine({ start: { x: 0, y }, end: { x: W, y }, thickness: Math.round(y / s) % 5 === 0 ? 0.6 : 0.3, color: line }); }
    else if (paper === 'dots') { const s = 5 * mm; for (let x = s; x < W; x += s) for (let y = s; y < H; y += s) p.drawCircle({ x, y, size: 0.45, color: dot }); }
  }
  return d.save();
}

/* ---------- 3.9: image editor ---------- */
const IE_DEF = { rot: 0, flipH: false, flipV: false, straight: 0, crop: null, ratio: 'free', bright: 0, contrast: 0, sat: 0, warm: 0, tint: 0, expo: 0, hi: 0, shad: 0, sharp: 0, blur: 0, vign: 0, filter: 'none', fstr: 100, bg: false, bgCol: '#ffffff', bgTol: 22, bgFeather: 10, radius: 0, border: 0, borderCol: '#000000', op: 1 };
const IE_FILTERS = [['none', 'Original'], ['scan', 'Clean scan'], ['bw', 'Black and white'], ['gray', 'Greyscale'], ['vivid', 'Vivid'], ['warmf', 'Warm'], ['coolf', 'Cool'], ['sepia', 'Sepia'], ['fade', 'Faded'], ['dramatic', 'Dramatic'], ['invert', 'Negative']];
const hex2 = (h) => { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// Geometry: quarter turns, flips and straightening (zoomed so no empty corners).
function ieGeom(el, P, maxSide) {
  const nw = el.naturalWidth || el.width, nh = el.naturalHeight || el.height; const k0 = Math.min(1, maxSide / Math.max(nw, nh)); const w0 = Math.max(1, Math.round(nw * k0)), h0 = Math.max(1, Math.round(nh * k0));
  const q = ((P.rot % 360) + 360) % 360; const W = q % 180 ? h0 : w0, H = q % 180 ? w0 : h0;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  const th = P.straight * Math.PI / 180; const cs = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th)); const k = P.straight ? Math.max((W * cs + H * sn) / W, (W * sn + H * cs) / H) : 1;
  x.translate(W / 2, H / 2); x.rotate(q * Math.PI / 180 + th); x.scale((P.flipH ? -1 : 1) * k, (P.flipV ? -1 : 1) * k); x.drawImage(el, -w0 / 2, -h0 / 2, w0, h0);
  return c;
}
function ieCrop(c, cr) { if (!cr) return c; const x0 = Math.round(cr.x * c.width), y0 = Math.round(cr.y * c.height), w = Math.max(1, Math.round(cr.w * c.width)), h = Math.max(1, Math.round(cr.h * c.height)); const o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h); return o; }
function ieConvolve(d, w, h, kern, mix) {
  const src = new Uint8ClampedArray(d); const k = kern; const n = Math.sqrt(k.length) | 0, r = n >> 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let R = 0, G = 0, B = 0; for (let j = -r; j <= r; j++) { const yy = Math.min(h - 1, Math.max(0, y + j)); for (let i = -r; i <= r; i++) { const xx = Math.min(w - 1, Math.max(0, x + i)); const o = (yy * w + xx) * 4, kv = k[(j + r) * n + i + r]; R += src[o] * kv; G += src[o + 1] * kv; B += src[o + 2] * kv; } } const o = (y * w + x) * 4; d[o] = src[o] + (R - src[o]) * mix; d[o + 1] = src[o + 1] + (G - src[o + 1]) * mix; d[o + 2] = src[o + 2] + (B - src[o + 2]) * mix; }
}
function ieBoxBlur(c, rad) { if (rad <= 0) return c; const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const x = o.getContext('2d'); if ('filter' in x) { x.filter = `blur(${rad}px)`; x.drawImage(c, 0, 0); x.filter = 'none'; return o; } return c; }
// Colour, tone, filter, sharpening, vignette and background removal on the pixels.
function iePixels(c, P, scale, pickOnly) {
  const x = c.getContext('2d', { willReadFrequently: true }); const w = c.width, h = c.height; const id = x.getImageData(0, 0, w, h); const d = id.data;
  const br = P.bright * 1.28, ct = (P.contrast + 100) / 100, cf = ct * ct, sat = (P.sat + 100) / 100, warm = P.warm * 0.6, tint = P.tint * 0.5, gam = Math.pow(2, -P.expo / 50), hi = P.hi / 100, sh = P.shad / 100;
  const f = P.filter, fs = P.fstr / 100;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (P.expo) { r = 255 * Math.pow(r / 255, gam); g = 255 * Math.pow(g / 255, gam); b = 255 * Math.pow(b / 255, gam); }
    if (hi || sh) { const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255; const adj = (L > 0.5 ? hi * (L - 0.5) * 2 : -sh * (0.5 - L) * 2) * -60; r += adj; g += adj; b += adj; }
    r += br; g += br; b += br;
    if (P.contrast) { r = (r - 128) * cf + 128; g = (g - 128) * cf + 128; b = (b - 128) * cf + 128; }
    if (warm) { r += warm; b -= warm; } if (tint) { g -= tint; r += tint * 0.5; b += tint * 0.5; }
    if (P.sat) { const L = 0.299 * r + 0.587 * g + 0.114 * b; r = L + (r - L) * sat; g = L + (g - L) * sat; b = L + (b - L) * sat; }
    if (f !== 'none') {
      let R = r, G = g, B = b; const L = 0.299 * r + 0.587 * g + 0.114 * b;
      if (f === 'gray') { R = G = B = L; }
      else if (f === 'bw') { R = G = B = L > 140 ? 255 : L < 100 ? 0 : (L - 100) / 40 * 255; }
      else if (f === 'scan') { const t = (v) => Math.max(0, Math.min(255, (v - 40) * 255 / 165)); R = t(r); G = t(g); B = t(b); const L2 = 0.299 * R + 0.587 * G + 0.114 * B; if (L2 > 205) { R = G = B = 255; } }
      else if (f === 'sepia') { R = L * 1.07 + 30; G = L * 0.95 + 12; B = L * 0.75; }
      else if (f === 'vivid') { R = L + (r - L) * 1.5; G = L + (g - L) * 1.5; B = L + (b - L) * 1.5; R = (R - 128) * 1.12 + 128; G = (G - 128) * 1.12 + 128; B = (B - 128) * 1.12 + 128; }
      else if (f === 'warmf') { R = r + 22; G = g + 6; B = b - 22; }
      else if (f === 'coolf') { R = r - 18; G = g + 2; B = b + 24; }
      else if (f === 'fade') { R = r * 0.82 + 40; G = g * 0.82 + 38; B = b * 0.82 + 44; }
      else if (f === 'dramatic') { const s2 = 0.7; R = L + (r - L) * s2; G = L + (g - L) * s2; B = L + (b - L) * s2; R = (R - 128) * 1.45 + 120; G = (G - 128) * 1.45 + 120; B = (B - 128) * 1.45 + 124; }
      else if (f === 'invert') { R = 255 - r; G = 255 - g; B = 255 - b; }
      r += (R - r) * fs; g += (G - g) * fs; b += (B - b) * fs;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  if (P.sharp && !pickOnly) { const s = P.sharp / 100 * 1.6; ieConvolve(d, w, h, [0, -1, 0, -1, 5, -1, 0, -1, 0], s); }
  if (P.vign && !pickOnly) { const cx = w / 2, cy = h / 2, R0 = Math.hypot(cx, cy), v = P.vign / 100; for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { const t = Math.hypot(xx - cx, y - cy) / R0; const m = 1 - v * Math.max(0, t - 0.35) * 1.4; const o = (y * w + xx) * 4; d[o] *= m; d[o + 1] *= m; d[o + 2] *= m; } }
  if (P.bg && !pickOnly) { const [kr, kg, kb] = hex2(P.bgCol); const tol = P.bgTol / 100 * 441, fe = Math.max(1, P.bgFeather / 100 * 441); for (let i = 0; i < d.length; i += 4) { const dist = Math.hypot(d[i] - kr, d[i + 1] - kg, d[i + 2] - kb); if (dist < tol) d[i + 3] = 0; else if (dist < tol + fe) d[i + 3] = Math.min(d[i + 3], 255 * (dist - tol) / fe); } }
  x.putImageData(id, 0, 0);
  let out = c; if (P.blur && !pickOnly) out = ieBoxBlur(c, P.blur * scale);
  return out;
}
function ieFrame(c, P, scale) {
  if (!P.radius && !P.border) return c; const w = c.width, h = c.height; const o = document.createElement('canvas'); o.width = w; o.height = h; const x = o.getContext('2d');
  const r = Math.min(w, h) / 2 * P.radius / 100; const bw = P.border * scale * 2;
  const path = () => { x.beginPath(); if (x.roundRect) x.roundRect(bw / 2, bw / 2, w - bw, h - bw, Math.max(0, r - bw / 2)); else x.rect(bw / 2, bw / 2, w - bw, h - bw); };
  x.save(); if (r) { x.beginPath(); if (x.roundRect) x.roundRect(0, 0, w, h, r); else x.rect(0, 0, w, h); x.clip(); } x.drawImage(c, 0, 0); x.restore();
  if (bw) { x.lineWidth = bw; x.strokeStyle = P.borderCol; path(); x.stroke(); }
  return o;
}
function ieRender(el, P, maxSide, noCrop) { const g = ieGeom(el, P, maxSide); const sc = g.width / Math.max(1, el.naturalWidth || el.width); const c = noCrop ? g : ieCrop(g, P.crop); const px = iePixels(c, P, Math.max(0.25, Math.max(c.width, c.height) / 1000)); return ieFrame(px, P, Math.max(0.25, Math.max(c.width, c.height) / 1000)); }
const ieNeedsAlpha = (P, el) => P.bg || P.radius > 0 || /^data:image\/(png|gif|webp)/.test(el.src || '');

async function openImageEditor(p, a) {
  if (!a || !a.imgId) return; const origId = (a.edit && a.edit.orig) || a.imgId; let orig = S.imgs.get(origId); if (!orig) { toast('Image not found', { err: true }); return; }
  if (!orig.el) orig.el = await loadImageEl(orig.src);
  const P = Object.assign({}, IE_DEF, (a.edit && a.edit.P) || {}, { op: a.op == null ? 1 : a.op }); const P0 = JSON.stringify(P);
  let tab = 'adjust', cropMode = false, pick = false, raf = 0;
  const SL = (k, l, min, max, step = 1, unit = '') => `<label class="ie-sl"><span>${l}<output data-o="${k}"></output></span><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"${unit ? ` data-u="${unit}"` : ''}></label>`;
  const fv = fullView('imgedit', `<b class="fv-title">${icon('photo')} Edit image</b><span class="fv-sp"></span>
    <button class="tbtn" data-a="reset" title="Undo every change">${icon('undo')}<span>Reset</span></button><button class="tbtn" data-a="replace" title="Choose another picture, keep size and place">${icon('photo')}<span>Replace</span></button><button class="tbtn" data-a="download" title="Save the edited image as a PNG file">${icon('download')}<span>Save image</span></button>
    <button class="tbtn" data-a="cancel">Cancel</button><button class="tbtn primary" data-a="apply">Apply</button>`);
  const body = fv.querySelector('.fv-body'); body.classList.add('ie-body');
  body.innerHTML = `<div class="ie-stage"><div class="ie-canwrap"><canvas class="ie-cv"></canvas><div class="ie-crop" hidden><div class="ie-cr"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i><i data-h="n"></i><i data-h="s"></i><i data-h="w"></i><i data-h="e"></i></div></div></div><div class="ie-hint" hidden></div></div>
    <aside class="ie-panel"><div class="seg ie-tabs" role="tablist"><button data-t="adjust">Adjust</button><button data-t="filters">Filters</button><button data-t="crop">Crop</button><button data-t="bg">Background</button><button data-t="frame">Frame</button></div>
    <div class="ie-pane" data-p="adjust">${SL('bright', 'Brightness', -100, 100)}${SL('contrast', 'Contrast', -100, 100)}${SL('expo', 'Exposure', -100, 100)}${SL('hi', 'Highlights', -100, 100)}${SL('shad', 'Shadows', -100, 100)}${SL('sat', 'Saturation', -100, 100)}${SL('warm', 'Warmth', -100, 100)}${SL('tint', 'Tint', -100, 100)}${SL('sharp', 'Sharpen', 0, 100)}${SL('blur', 'Blur', 0, 20, 0.5)}${SL('vign', 'Vignette', 0, 100)}${SL('op', 'Opacity on the page', 0.05, 1, 0.05, '%')}<button class="btn ie-auto" data-a="auto">${icon('fit')} Auto fix</button></div>
    <div class="ie-pane" data-p="filters"><div class="ie-fgrid">${IE_FILTERS.map(([k, l]) => `<button class="ie-f" data-f="${k}"><canvas></canvas><span>${l}</span></button>`).join('')}</div>${SL('fstr', 'Filter strength', 0, 100)}</div>
    <div class="ie-pane" data-p="crop"><div class="ie-row">${['free', '1:1', '4:3', '3:4', '3:2', '16:9', 'orig'].map((r) => `<button class="ie-chip" data-r="${r}">${r === 'free' ? 'Free' : r === 'orig' ? 'Original' : r}</button>`).join('')}</div>
      <div class="ie-row"><button class="btn" data-a="rotl">${icon('rotl')} Left</button><button class="btn" data-a="rotr">${icon('rotr')} Right</button><button class="btn" data-a="fliph">${icon('fliph')} Flip</button><button class="btn" data-a="flipv">${icon('flipv')} Flip</button></div>
      ${SL('straight', 'Straighten', -45, 45, 0.5, '°')}<div class="ie-row"><button class="btn" data-a="cropreset">Remove crop</button></div><p class="ie-note">Drag the corners or edges on the picture. Drag inside to move the crop.</p></div>
    <div class="ie-pane" data-p="bg"><label class="chkrow"><input type="checkbox" data-c="bg"> Remove background colour</label><div class="ie-row"><span class="ie-lbl">Colour</span><input type="color" data-col="bgCol" class="ie-color"><button class="btn" data-a="pick">${icon('eyedrop')} Pick from picture</button><button class="btn" data-a="white">White</button></div>${SL('bgTol', 'Tolerance', 0, 100)}${SL('bgFeather', 'Soft edge', 0, 60)}<p class="ie-note">Good for signatures and stamps photographed on white paper. The removed area becomes see-through.</p></div>
    <div class="ie-pane" data-p="frame">${SL('radius', 'Rounded corners', 0, 100)}${SL('border', 'Border', 0, 20, 0.5)}<div class="ie-row"><span class="ie-lbl">Border colour</span><input type="color" data-col="borderCol" class="ie-color">${['#000000', '#ffffff', '#0040dd', '#d70015', '#1a7f37', '#8e8e93'].map((c) => `<button class="sw" data-bc="${c}" style="background:${c}"></button>`).join('')}</div></div>
    </aside><input type="file" accept="image/*" hidden class="ie-file">`;
  const cv = body.querySelector('.ie-cv'), wrap = body.querySelector('.ie-canwrap'), cropEl = body.querySelector('.ie-crop'), crR = body.querySelector('.ie-cr'), hint = body.querySelector('.ie-hint');
  const fit = () => { const st = body.querySelector('.ie-stage'); const mw = st.clientWidth - 48, mh = st.clientHeight - 48; const k = Math.min(mw / cv.width, mh / cv.height, 2); cv.style.width = cv.width * k + 'px'; cv.style.height = cv.height * k + 'px'; };
  let geomCache = null, geomKey = '';
  const draw = () => {
    raf = 0; let c;
    if (cropMode) { const k = JSON.stringify([P.rot, P.flipH, P.flipV, P.straight]); if (k !== geomKey) { geomCache = ieGeom(orig.el, P, 1100); geomKey = k; } const t = document.createElement('canvas'); t.width = geomCache.width; t.height = geomCache.height; t.getContext('2d').drawImage(geomCache, 0, 0); c = iePixels(t, Object.assign({}, P, { bg: false }), 1.1); }
    else c = ieRender(orig.el, P, 1100);
    cv.width = c.width; cv.height = c.height; const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(c, 0, 0); cv.style.opacity = P.op; fit(); placeCrop();
  };
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const sync = () => {
    body.querySelectorAll('input[type=range]').forEach((i) => { i.value = P[i.dataset.k]; const o = body.querySelector(`output[data-o="${i.dataset.k}"]`); if (o) o.textContent = i.dataset.u === '%' ? Math.round(P[i.dataset.k] * 100) + '%' : (P[i.dataset.k] > 0 && i.min < 0 ? '+' : '') + P[i.dataset.k] + (i.dataset.u || ''); });
    body.querySelectorAll('[data-c]').forEach((i) => { i.checked = !!P[i.dataset.c]; }); body.querySelectorAll('[data-col]').forEach((i) => { i.value = P[i.dataset.col]; });
    body.querySelectorAll('[data-t]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === tab)); body.querySelectorAll('.ie-pane').forEach((p2) => { p2.hidden = p2.dataset.p !== tab; });
    body.querySelectorAll('[data-f]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.f === P.filter)); body.querySelectorAll('[data-r]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.r === P.ratio));
  };
  // Filter thumbnails
  const thumbs = () => { const base = ieGeom(orig.el, Object.assign({}, IE_DEF, { rot: P.rot, flipH: P.flipH, flipV: P.flipV }), 160); body.querySelectorAll('.ie-f').forEach((b) => { const t = document.createElement('canvas'); t.width = base.width; t.height = base.height; t.getContext('2d').drawImage(base, 0, 0); const r = iePixels(t, Object.assign({}, IE_DEF, { filter: b.dataset.f }), 0.2); const c2 = b.querySelector('canvas'); c2.width = r.width; c2.height = r.height; c2.getContext('2d').drawImage(r, 0, 0); }); };
  // Crop overlay
  const ratioVal = () => { if (P.ratio === 'free') return 0; if (P.ratio === 'orig') { const g = geomCache || ieGeom(orig.el, P, 300); return g.width / g.height; } const [x, y] = P.ratio.split(':').map(Number); return x / y; };
  const curCrop = () => P.crop || { x: 0, y: 0, w: 1, h: 1 };
  function placeCrop() { cropEl.hidden = !cropMode; if (!cropMode) return; const r = cv.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); const c = curCrop(); Object.assign(cropEl.style, { left: r.left - wr.left + 'px', top: r.top - wr.top + 'px', width: r.width + 'px', height: r.height + 'px' }); Object.assign(crR.style, { left: c.x * 100 + '%', top: c.y * 100 + '%', width: c.w * 100 + '%', height: c.h * 100 + '%' }); }
  const applyRatio = () => { const k = ratioVal(); if (!k) return; const g = geomCache || ieGeom(orig.el, P, 300); const ar = g.width / g.height; let c = curCrop(); let w = c.w, h = c.w * ar / k; if (h > 1) { h = 1; w = k / ar; } if (w > 1) { w = 1; h = ar / k; } P.crop = { x: clamp(c.x + (c.w - w) / 2, 0, 1 - w), y: clamp(c.y + (c.h - h) / 2, 0, 1 - h), w, h }; };
  let cd = null;
  cropEl.addEventListener('pointerdown', (e) => { const r = cropEl.getBoundingClientRect(); const hnd = e.target.dataset.h || (e.target === crR ? 'move' : null); if (!hnd) return; e.preventDefault(); cropEl.setPointerCapture(e.pointerId); cd = { h: hnd, x: e.clientX, y: e.clientY, c: Object.assign({}, curCrop()), W: r.width, H: r.height }; });
  cropEl.addEventListener('pointermove', (e) => {
    if (!cd) return; const dx = (e.clientX - cd.x) / cd.W, dy = (e.clientY - cd.y) / cd.H; let { x, y, w, h } = cd.c; const m = 0.04;
    if (cd.h === 'move') { x = clamp(x + dx, 0, 1 - w); y = clamp(y + dy, 0, 1 - h); }
    else { if (cd.h.includes('w')) { const nx = clamp(x + dx, 0, x + w - m); w += x - nx; x = nx; } if (cd.h.includes('e')) w = clamp(w + dx, m, 1 - x); if (cd.h.includes('n')) { const ny = clamp(y + dy, 0, y + h - m); h += y - ny; y = ny; } if (cd.h.includes('s')) h = clamp(h + dy, m, 1 - y);
      const k = ratioVal(); if (k) { const ar = cd.W / cd.H; const want = w * ar / k; if (cd.h === 'n' || cd.h === 's') { const nw = h * k / ar; w = Math.min(nw, 1 - x); } else { h = Math.min(want, 1 - y); if (cd.h.includes('n')) y = cd.c.y + cd.c.h - h; } } }
    P.crop = { x, y, w, h }; placeCrop();
  });
  cropEl.addEventListener('pointerup', () => { cd = null; }); cropEl.addEventListener('pointercancel', () => { cd = null; });
  // Pick colour from the picture
  cv.addEventListener('click', (e) => { if (!pick) return; const r = cv.getBoundingClientRect(); const px = Math.floor((e.clientX - r.left) / r.width * cv.width), py = Math.floor((e.clientY - r.top) / r.height * cv.height); const t = ieRender(orig.el, Object.assign({}, P, { bg: false }), 1100); const dd = t.getContext('2d').getImageData(clamp(px, 0, t.width - 1), clamp(py, 0, t.height - 1), 1, 1).data; P.bgCol = '#' + [dd[0], dd[1], dd[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); P.bg = true; pick = false; hint.hidden = true; cv.style.cursor = ''; sync(); redraw(); });
  body.addEventListener('input', (e) => { const i = e.target; if (i.dataset.k) { P[i.dataset.k] = +i.value; sync(); redraw(); } else if (i.dataset.col) { P[i.dataset.col] = i.value; if (i.dataset.col === 'bgCol') P.bg = true; sync(); redraw(); } });
  body.addEventListener('change', (e) => { const i = e.target; if (i.dataset.c) { P[i.dataset.c] = i.checked; sync(); redraw(); } });
  const setTab = (t) => { tab = t; cropMode = t === 'crop'; if (cropMode) geomKey = ''; sync(); redraw(); };
  body.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.t) { setTab(b.dataset.t); return; }
    if (b.dataset.f) { P.filter = b.dataset.f; sync(); redraw(); return; }
    if (b.dataset.r) { P.ratio = b.dataset.r; applyRatio(); sync(); redraw(); return; }
    if (b.dataset.bc) { P.borderCol = b.dataset.bc; if (!P.border) P.border = 2; sync(); redraw(); return; }
    const k = b.dataset.a; if (!k) return;
    if (k === 'rotl' || k === 'rotr') { P.rot = (P.rot + (k === 'rotl' ? -90 : 90) + 360) % 360; if (P.crop) { const c = P.crop; P.crop = k === 'rotr' ? { x: 1 - c.y - c.h, y: c.x, w: c.h, h: c.w } : { x: c.y, y: 1 - c.x - c.w, w: c.h, h: c.w }; } thumbs(); }
    else if (k === 'fliph') { P.flipH = !P.flipH; if (P.crop) P.crop.x = 1 - P.crop.x - P.crop.w; thumbs(); }
    else if (k === 'flipv') { P.flipV = !P.flipV; if (P.crop) P.crop.y = 1 - P.crop.y - P.crop.h; thumbs(); }
    else if (k === 'cropreset') { P.crop = null; P.ratio = 'free'; }
    else if (k === 'pick') { pick = true; hint.textContent = 'Click the colour to remove on the picture'; hint.hidden = false; cv.style.cursor = 'crosshair'; if (cropMode) setTab('bg'); return; }
    else if (k === 'white') { P.bgCol = '#ffffff'; P.bg = true; }
    else if (k === 'auto') { const t = ieGeom(orig.el, Object.assign({}, IE_DEF), 300); const dd = t.getContext('2d').getImageData(0, 0, t.width, t.height).data; let lo = 255, hi2 = 0, sum = 0, n = 0; const hist = new Array(256).fill(0); for (let i = 0; i < dd.length; i += 16) { const L = Math.round(0.299 * dd[i] + 0.587 * dd[i + 1] + 0.114 * dd[i + 2]); hist[L]++; n++; sum += L; } let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.02) { hi2 = v; break; } } const mean = sum / n; P.contrast = clamp(Math.round((255 / Math.max(40, hi2 - lo) - 1) * 40), 0, 45); P.bright = clamp(Math.round((128 - mean) / 3), -30, 30); P.sat = 10; P.sharp = 20; }
    else if (k === 'reset') { Object.assign(P, IE_DEF); }
    else if (k === 'replace') { body.querySelector('.ie-file').click(); return; }
    else if (k === 'download') { const c = ieRender(orig.el, P, 4000); c.toBlob((bl) => downloadBlob(bl, (($('#docName').value || 'image') + ' image.png').replace(/[\\/:*?"<>|]/g, '')), 'image/png'); return; }
    sync(); redraw();
  });
  body.querySelector('.ie-file').addEventListener('change', async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { const im = await normImage(await readAsDataURL(f), 2400, true); const id = uid('i'); S.imgs.set(id, im); orig = S.imgs.get(id); if (!orig.el) orig.el = await loadImageEl(orig.src); fv._origId = id; Object.assign(P, IE_DEF, { op: P.op }); thumbs(); sync(); redraw(); } catch (err) { toast('Could not read that image', { err: true }); } });
  fv.querySelector('.fv-head').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = b.dataset.a;
    if (k === 'cancel') { fv._close(); return; }
    if (k === 'apply') {
      const oid = fv._origId || origId; const isDef = JSON.stringify(Object.assign({}, P, { op: 1 })) === JSON.stringify(Object.assign({}, IE_DEF, { op: 1 }));
      let newId = oid, nw = orig.el.naturalWidth, nh = orig.el.naturalHeight;
      if (!isDef) { const c = ieRender(orig.el, P, 2400); const src = ieNeedsAlpha(P, orig.el) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92); newId = uid('i'); const el = await loadImageEl(src); S.imgs.set(newId, { src, w: c.width, h: c.height, el }); nw = c.width; nh = c.height; }
      const ctr = orientPt(a, 0.5, 0.5); const { U, V } = UV(a.r); const w = a.w, h = w * nh / nw;
      a.imgId = newId; a.w = w; a.h = h; a.ax = ctr[0] - w / 2 * U[0] - h / 2 * V[0]; a.ay = ctr[1] - w / 2 * U[1] - h / 2 * V[1];
      if (isDef) delete a.edit; else a.edit = { orig: oid, P: Object.assign({}, P, { op: undefined }) };
      if (P.op < 1) a.op = P.op; else delete a.op;
      drawOverlay(p); commit(); refreshFormatBar(); fv._close(); toast('Image updated. Undo is available'); return;
    }
  });
  fv._key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') fv.querySelector('[data-a="apply"]').click(); };
  addEventListener('resize', () => { if (fv.isConnected) { fit(); placeCrop(); } });
  if (P.crop || P.ratio !== 'free') tab = 'adjust';
  sync(); thumbs(); draw(); requestAnimationFrame(draw);
}
function imgZ(dir) { const s = selectedAnn(); if (!s) return; const arr = s.p.annots; const i = arr.indexOf(s.a); arr.splice(i, 1); if (dir === 'front') arr.push(s.a); else if (dir === 'back') arr.unshift(s.a); else if (dir === 'fwd') arr.splice(Math.min(arr.length, i + 1), 0, s.a); else arr.splice(Math.max(0, i - 1), 0, s.a); drawOverlay(s.p); commit(); toast({ front: 'Brought to front', back: 'Sent to back', fwd: 'Brought forward', bwd: 'Sent backward' }[dir]); }
function imgNatural() { const s = selectedAnn(); if (!s || !s.a.imgId) return; const im = S.imgs.get(s.a.imgId); if (!im) return; const a = s.a; const ctr = orientPt(a, 0.5, 0.5); const { U, V } = UV(a.r); const h = a.w * im.h / im.w; a.h = h; a.ax = ctr[0] - a.w / 2 * U[0] - h / 2 * V[0]; a.ay = ctr[1] - a.w / 2 * U[1] - h / 2 * V[1]; drawOverlay(s.p); commit(); toast('Original proportions restored'); }
function imgFitPage(mode) { const s = selectedAnn(); if (!s || !s.a.imgId) return; const a = s.a, p = s.p; const g = geo(p); const im = S.imgs.get(a.imgId); const ar = a.h / a.w; const m = mode === 'full' ? 0 : 36; let w = g.w - 2 * m, h = w * ar; if (h > g.h - 2 * m) { h = g.h - 2 * m; w = h / ar; } a.r = tr(p); const { U, V } = UV(a.r); const cx = (p.view[0] + p.view[2]) / 2, cy = (p.view[1] + p.view[3]) / 2; a.w = w; a.h = h; a.ax = cx - w / 2 * U[0] - h / 2 * V[0]; a.ay = cy - w / 2 * U[1] - h / 2 * V[1]; void im; drawOverlay(p); commit(); toast(mode === 'full' ? 'Fills the page' : 'Fitted to the page'); }

/* ---------- 3.8: navigator, shape snapping, reading ruler, reading mode, page organiser ---------- */
// Full screen views (reading mode, page organiser) live in #layer so the main shortcuts stand aside while they are open.
function fullView(cls, head) {
  closeMenu(); const sc = document.createElement('div'); sc.className = 'scrim fv-scrim';
  sc.innerHTML = `<div class="fullview ${cls}" role="dialog" aria-modal="true"><div class="fv-head">${head}</div><div class="fv-body"></div></div>`;
  $('#layer').appendChild(sc); const fv = sc.firstElementChild;
  const close = () => { sc.remove(); document.removeEventListener('keydown', key, true); if (fv._onclose) fv._onclose(); };
  const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; } if (fv._key) fv._key(e); };
  document.addEventListener('keydown', key, true); fv._close = close; return fv;
}

/* Navigator: a small map of the page with the visible area, shown when zoomed in past the screen. */
const NAV = { on: lsGet('pdfmate.nav', true), key: '', raf: 0, el: null };
function navPage() {
  const vr = viewer.getBoundingClientRect(); const cy = vr.top + chromeH() + (vr.height - chromeH()) / 2;
  let best = null, bd = 1e9; for (const el of $$('.page', pagesEl)) { if (!el._vis) continue; const r = el.getBoundingClientRect(); const d = cy < r.top ? r.top - cy : cy > r.bottom ? cy - r.bottom : 0; if (d < bd) { bd = d; best = el; } }
  return best;
}
function navUpdate() { if (NAV.raf) return; NAV.raf = requestAnimationFrame(navPaint); }
async function navPaint() {
  NAV.raf = 0; const box = NAV.el; if (!box) return;
  const el = NAV.on && S.pages.length ? navPage() : null; if (!el) { box.hidden = true; return; }
  const vr = viewer.getBoundingClientRect(); const top = vr.top + chromeH(); const r = el.getBoundingClientRect();
  const fx0 = clamp((vr.left - r.left) / r.width, 0, 1), fx1 = clamp((vr.right - r.left) / r.width, 0, 1), fy0 = clamp((top - r.top) / r.height, 0, 1), fy1 = clamp((vr.bottom - r.top) / r.height, 0, 1);
  if (fx0 <= 0.001 && fx1 >= 0.999 && fy0 <= 0.001 && fy1 >= 0.999 || (r.width <= vr.width * 1.02 && S.zoom <= fitZoom() * 1.25)) { box.hidden = true; return; }
  box.hidden = false; const p = pageById(el.dataset.id); if (!p) return; const g = geo(p);
  const W = 168, H = Math.min(220, W * g.h / g.w), w = H < 220 ? W : 220 * g.w / g.h; const cv = box.querySelector('canvas');
  cv.style.width = w + 'px'; cv.style.height = H + 'px'; box.style.width = w + 'px';
  const k = p.id + '|' + tr(p) + '|' + p.annots.length; if (NAV.key !== k) { NAV.key = k; try { await paintThumb(p, cv); cv.style.width = w + 'px'; cv.style.height = H + 'px'; } catch (e) {} }
  const b = box.querySelector('.nv-box'); Object.assign(b.style, { left: fx0 * w + 'px', top: fy0 * H + 'px', width: Math.max(4, (fx1 - fx0) * w) + 'px', height: Math.max(4, (fy1 - fy0) * H) + 'px' });
  box.dataset.id = p.id; box.querySelector('.nv-pn').textContent = `Page ${S.pages.indexOf(p) + 1} · ${Math.round(S.zoom * 75)}%`;
}
function navGo(e) {
  const box = NAV.el; const el = pageEl(box.dataset.id); if (!el) return; const cv = box.querySelector('canvas').getBoundingClientRect();
  const fx = clamp((e.clientX - cv.left) / cv.width, 0, 1), fy = clamp((e.clientY - cv.top) / cv.height, 0, 1);
  viewer.scrollLeft = el.offsetLeft + fx * el.offsetWidth - viewer.clientWidth / 2;
  viewer.scrollTop = el.offsetTop + fy * el.offsetHeight - chromeH() - (viewer.clientHeight - chromeH()) / 2; navUpdate();
}
function initNav() {
  const box = document.createElement('div'); box.className = 'navmap'; box.id = 'navmap'; box.hidden = true; box.title = 'Drag to move around the page';
  box.innerHTML = '<div class="nv-wrap"><canvas></canvas><div class="nv-box"></div></div><div class="nv-foot"><span class="nv-pn"></span><button class="nv-x" aria-label="Hide navigator" title="Hide navigator (turn back on in View)">×</button></div>';
  $('.stage').appendChild(box); NAV.el = box;
  let down = false; const wrap = box.querySelector('.nv-wrap');
  wrap.addEventListener('pointerdown', (e) => { down = true; wrap.setPointerCapture(e.pointerId); navGo(e); e.preventDefault(); });
  wrap.addEventListener('pointermove', (e) => { if (down) navGo(e); });
  wrap.addEventListener('pointerup', () => { down = false; }); wrap.addEventListener('pointercancel', () => { down = false; });
  box.querySelector('.nv-x').onclick = () => { NAV.on = false; lsSet('pdfmate.nav', false); navUpdate(); markViewBtns(); toast('Navigator hidden. Turn it on again in View'); };
  viewer.addEventListener('scroll', navUpdate, { passive: true }); addEventListener('resize', navUpdate);
}
function toggleNav() { NAV.on = !NAV.on; lsSet('pdfmate.nav', NAV.on); NAV.key = ''; navUpdate(); markViewBtns(); toast(NAV.on ? 'Navigator on. It shows when you zoom in past the screen' : 'Navigator off'); }

/* Shape snapping for the pen: hold still at the end of a stroke and it becomes a clean shape. */
function rdp(pts, eps) {
  if (pts.length < 3) return pts.slice(); let dmax = 0, idx = 0; const [a, b] = [pts[0], pts[pts.length - 1]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((b[1] - a[1]) * pts[i][0] - (b[0] - a[0]) * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); } return [a, b];
}
function recogniseStroke(pts) {
  if (pts.length < 6) return null;
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const w = x1 - x0, h = y1 - y0, diag = Math.hypot(w, h);
  if (diag < 8) return null; let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const a = pts[0], z = pts[pts.length - 1]; const gap = Math.hypot(z[0] - a[0], z[1] - a[1]);
  if (gap / len > 0.9) return { t: 'line', pts: [a, z], label: 'straight line' };
  if (gap > Math.max(w, h) * 0.3) {
    // Open stroke with a hook at the end: an arrow. Find the shaft as the longest straight run from the start.
    const s = rdp(pts, diag * 0.06); if (s.length >= 3 && s.length <= 5) { const tip = s[1]; const shaft = Math.hypot(tip[0] - a[0], tip[1] - a[1]); if (shaft > len * 0.55) return { t: 'arrow', pts: [a, tip], label: 'arrow' }; }
    return null;
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = w / 2 || 1, ry = h / 2 || 1;
  let dev = 0; for (const [x, y] of pts) dev += Math.abs(Math.hypot((x - cx) / rx, (y - cy) / ry) - 1); dev /= pts.length;
  // A closed loop starts and ends at the same point, so split it at the point farthest from the start before simplifying.
  let far = 0, fd = -1; pts.forEach((q, i) => { const d = Math.hypot(q[0] - a[0], q[1] - a[1]); if (d > fd) { fd = d; far = i; } });
  const closed = pts.concat([pts[0]]); let s = rdp(closed.slice(0, far + 1), diag * 0.07).concat(rdp(closed.slice(far), diag * 0.07).slice(1)); if (s.length > 2 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < diag * 0.12) s = s.slice(0, -1);
  // Merge vertices that sit very close together.
  const v = []; for (const q of s) if (!v.length || Math.hypot(q[0] - v[v.length - 1][0], q[1] - v[v.length - 1][1]) > diag * 0.12) v.push(q);
  if (v.length > 3 && Math.hypot(v[0][0] - v[v.length - 1][0], v[0][1] - v[v.length - 1][1]) < diag * 0.12) v.pop();
  const box = { x: x0, y: y0, w, h };
  if (v.length === 3 && dev > 0.12) { const top = v.reduce((m, q) => (q[1] > m[1] ? q : m)); const midx = Math.abs(top[0] - cx) < w * 0.25; return Object.assign(box, { t: 'shape', kind: midx ? 'triangle' : 'rtriangle', label: 'triangle' }); }
  if (v.length === 4 && dev > 0.1) {
    const nearCorner = v.filter(([x, y]) => (Math.abs(x - x0) < w * 0.25 || Math.abs(x - x1) < w * 0.25) && (Math.abs(y - y0) < h * 0.25 || Math.abs(y - y1) < h * 0.25)).length;
    return Object.assign(box, nearCorner >= 3 ? { t: 'rect', label: 'rectangle' } : { t: 'shape', kind: 'diamond', label: 'diamond' });
  }
  if (dev < 0.16) return Object.assign(box, { t: 'ellipse', label: Math.abs(w - h) < Math.max(w, h) * 0.15 ? 'circle' : 'ellipse' });
  if (v.length >= 5 && v.length <= 6) return Object.assign(box, { t: 'shape', kind: v.length === 5 ? 'pentagon' : 'hexagon', label: v.length === 5 ? 'pentagon' : 'hexagon' });
  if (v.length === 10) return Object.assign(box, { t: 'shape', kind: 'star5', label: 'star' });
  return null;
}
function trySnapPen(d) {
  if (!d || d.mode !== 'create' || d.a.t !== 'pen' || d.snapped) return;
  if (d.a.pen === 'highlighter' || d.a.pen === 'marker') { const a = d.a; if (a.pts.length < 4) return; const z = a.pts[a.pts.length - 1], s0 = a.pts[0]; let len = 0; for (let i = 1; i < a.pts.length; i++) len += Math.hypot(a.pts[i][0] - a.pts[i - 1][0], a.pts[i][1] - a.pts[i - 1][1]); if (Math.hypot(z[0] - s0[0], z[1] - s0[1]) / len < 0.8) return; d.freehand = JSON.parse(JSON.stringify(a)); a.pts = [s0, z]; delete a.pr; d.snapped = true; drawOverlay(d.p, d.el); toast('Straightened'); return; }
  const r = recogniseStroke(d.a.pts); if (!r) return;
  const a0 = d.a; const n = { id: a0.id, color: a0.color, width: a0.width };
  if (r.t === 'line' || r.t === 'arrow') Object.assign(n, { t: r.t, pts: r.pts });
  else { Object.assign(n, { t: r.t, x: r.x, y: r.y, w: r.w, h: r.h }); if (r.kind) n.kind = r.kind; }
  const i = d.p.annots.findIndex((z) => z.id === a0.id); if (i < 0) return; d.p.annots[i] = n; d.a = n; d.snapped = true;
  drawOverlay(d.p, d.el); toast(`Snapped to a ${r.label}. Undo keeps it freehand`);
  d.freehand = a0;
}

/* Reading ruler: a band that highlights the line being read and dims the rest. */
const RUL = { on: false, pageId: null, top: 0, h: 18, el: null };
function pageLines(el) {
  const out = []; const r = el.getBoundingClientRect(); const z = S.zoom;
  for (const sp of $$('.textLayer span', el)) { if (!sp.textContent.trim()) continue; const b = sp.getBoundingClientRect(); if (b.height < 2 || b.width < 1) continue; if (b.height > b.width * 2.5 && sp.textContent.length > 2) continue; const t = (b.top - r.top) / z, hh = b.height / z; const L = out.find((l) => Math.abs(l.t - t) < Math.min(l.h, hh) * 0.5); if (L) { L.t = Math.min(L.t, t); L.h = Math.max(L.h, hh); } else out.push({ t, h: hh }); }
  return out.sort((a, b) => a.t - b.t);
}
function rulPlace() {
  const b = RUL.el; if (!b) return; const el = RUL.on && pageEl(RUL.pageId); if (!el) { b.hidden = true; return; }
  b.hidden = false; const wr = b.getBoundingClientRect(); const r = el.getBoundingClientRect(); const pad = 3;
  b.firstElementChild.style.top = (r.top - wr.top + RUL.top * S.zoom - pad) + 'px'; b.firstElementChild.style.height = (RUL.h * S.zoom + pad * 2) + 'px';
}
function rulSetAt(el, clientY) {
  const r = el.getBoundingClientRect(); const y = (clientY - r.top) / S.zoom; const lines = pageLines(el);
  let best = null; for (const l of lines) { if (y >= l.t - l.h * 0.4 && y <= l.t + l.h * 1.4) { best = l; break; } }
  if (!best && lines.length) best = lines.reduce((m, l) => (Math.abs(l.t + l.h / 2 - y) < Math.abs(m.t + m.h / 2 - y) ? l : m));
  RUL.pageId = el.dataset.id; if (best && Math.abs(best.t + best.h / 2 - y) < 40) { RUL.top = best.t; RUL.h = best.h; } else { RUL.h = 16; RUL.top = y - 8; }
  rulPlace();
}
function rulStep(dir) {
  const els = $$('.page', pagesEl); let el = pageEl(RUL.pageId); if (!el) { el = navPage() || els[0]; if (!el) return; const vr = viewer.getBoundingClientRect(); rulSetAt(el, vr.top + chromeH() + 60); return; }
  const lines = pageLines(el); let nx = null;
  if (dir > 0) nx = lines.find((l) => l.t > RUL.top + RUL.h * 0.6); else nx = [...lines].reverse().find((l) => l.t < RUL.top - RUL.h * 0.4);
  if (nx) { RUL.top = nx.t; RUL.h = nx.h; }
  else if (!lines.length) { RUL.top += dir * RUL.h * 1.4; const g = geo(pageById(RUL.pageId)); if (RUL.top < 0 || RUL.top > g.h) { const i = els.indexOf(el) + dir; if (els[i]) { RUL.pageId = els[i].dataset.id; RUL.top = dir > 0 ? 20 : geo(pageById(RUL.pageId)).h - 40; } else RUL.top = clamp(RUL.top, 0, g.h - RUL.h); } }
  else { const i = els.indexOf(el) + dir; const ne = els[i]; if (ne) { RUL.pageId = ne.dataset.id; if (!ne._vis) scrollToPage(i, false); requestAnimationFrame(() => { const l2 = pageLines(ne); const L = dir > 0 ? l2[0] : l2[l2.length - 1]; if (L) { RUL.top = L.t; RUL.h = L.h; } else RUL.top = dir > 0 ? 20 : geo(pageById(ne.dataset.id)).h - 40; rulPlace(); rulKeepVisible(); }); return; } }
  rulPlace(); rulKeepVisible();
}
function rulKeepVisible() {
  const band = RUL.el && RUL.el.firstElementChild; if (!band || RUL.el.hidden) return; const br = band.getBoundingClientRect(), vr = viewer.getBoundingClientRect(); const top = vr.top + chromeH();
  if (br.bottom > vr.bottom - 90) viewer.scrollBy({ top: br.bottom - vr.bottom + (vr.height - chromeH()) * 0.45, behavior: 'smooth' });
  else if (br.top < top + 40) viewer.scrollBy({ top: br.top - top - (vr.height - chromeH()) * 0.3, behavior: 'smooth' });
}
function toggleRuler() {
  RUL.on = !RUL.on; markViewBtns();
  if (RUL.on) { const el = navPage(); if (el) { const vr = viewer.getBoundingClientRect(); rulSetAt(el, vr.top + chromeH() + (vr.height - chromeH()) * 0.3); } toast('Reading ruler on. Click a line, or use the Up and Down arrow keys'); }
  else rulPlace();
}
function initRuler() {
  const w = document.createElement('div'); w.className = 'rruler'; w.hidden = true; w.innerHTML = '<div class="rr-band"></div>'; $('.stage').appendChild(w); RUL.el = w;
  viewer.addEventListener('scroll', () => { if (RUL.on) rulPlace(); }, { passive: true }); addEventListener('resize', () => { if (RUL.on) rulPlace(); });
  pagesEl.addEventListener('click', (e) => { if (!RUL.on || !['select', 'hand'].includes(S.tool) || e.target.closest('.ann,.formlayer input,.formlayer select,.formlayer textarea')) return; const sel = getSelection(); if (sel && String(sel).trim()) return; const el = e.target.closest('.page'); if (el) rulSetAt(el, e.clientY); });
}

/* Reading mode: the text as one clean column with adjustable size. */
async function openReading() {
  if (!S.pages.length) return; closeEditor(false);
  const st = Object.assign({ fs: 18, lh: 1.6, wide: false, serif: false }, lsGet('pdfmate.reading', {}));
  const fv = fullView('reading', `<b class="fv-title">${icon('reading')} Reading mode</b><span class="fv-sub">${esc($('#docName').value || 'Document')}</span><span class="fv-sp"></span>
    <div class="seg fv-seg" role="group" aria-label="Typeface"><button data-ff="sans">Sans</button><button data-ff="serif">Serif</button></div>
    <button class="tbtn" data-fs="-1" aria-label="Smaller text" title="Smaller text">A−</button><span class="fv-fs" id="rdFs"></span><button class="tbtn" data-fs="1" aria-label="Larger text" title="Larger text">A+</button>
    <button class="tbtn" data-lh="1" title="Line spacing">${icon('tal')}<span>Spacing</span></button><button class="tbtn" data-wd="1" title="Column width">${icon('fitpage')}<span>Width</span></button>
    <button class="tbtn primary" data-close="1">Done</button>`);
  const body = fv.querySelector('.fv-body'); const art = document.createElement('article'); art.className = 'rd-art'; body.appendChild(art);
  const apply = () => { art.style.fontSize = st.fs + 'px'; art.style.lineHeight = st.lh; art.classList.toggle('wide', st.wide); art.classList.toggle('serif', st.serif); fv.querySelector('#rdFs').textContent = st.fs + ' px'; fv.querySelectorAll('[data-ff]').forEach((b) => b.setAttribute('aria-pressed', (b.dataset.ff === 'serif') === st.serif)); lsSet('pdfmate.reading', st); };
  fv.querySelector('.fv-head').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.close) fv._close(); else if (b.dataset.fs) st.fs = clamp(st.fs + (+b.dataset.fs) * 2, 12, 40); else if (b.dataset.lh) st.lh = st.lh >= 1.9 ? 1.35 : Math.round((st.lh + 0.25) * 100) / 100; else if (b.dataset.wd) st.wide = !st.wide; else if (b.dataset.ff) st.serif = b.dataset.ff === 'serif';
    apply();
  });
  fv._key = (e) => { if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); st.fs = clamp(st.fs + 2, 12, 40); apply(); } else if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); st.fs = clamp(st.fs - 2, 12, 40); apply(); } };
  apply();
  art.addEventListener('click', (e) => { const n = e.target.closest('[data-go]'); if (n) { const i = +n.dataset.go; fv._close(); scrollToPage(i); } });
  let alive = true; fv._onclose = () => { alive = false; };
  for (let i = 0; i < S.pages.length && alive; i++) {
    const p = S.pages[i]; const sec = document.createElement('section'); sec.className = 'rd-pg'; sec.innerHTML = `<button class="rd-num" data-go="${i}" title="Go to this page">Page ${i + 1}</button>`; art.appendChild(sec);
    let paras = []; try { if (p.kind === 'pdf') { const d = S.docs.get(p.docId); if (d && d.pdf && !d.encrypted) { const pg = await d.pdf.getPage(p.index + 1); paras = (await pageParagraphs(pg)).paras; } } } catch (err) { console.warn(err); }
    if (!alive) break;
    const sizes = paras.map((q) => q.size).sort((a, b) => a - b); const med = sizes[Math.floor(sizes.length / 2)] || 10;
    let html = '';
    for (const q of paras) {
      const txt = q.runs.map((r) => { let t = esc(r.t.replace(/\t+/g, '  ')); if (r.b) t = `<b>${t}</b>`; if (r.i) t = `<i>${t}</i>`; return t; }).join('').trim(); if (!txt) continue;
      const head = q.size > med * 1.22 && txt.length < 160; html += head ? `<h3${q.centred ? ' class="c"' : ''}>${txt}</h3>` : `<p${q.centred ? ' class="c"' : ''}>${txt}</p>`;
    }
    if (!html && p.ocr && p.ocr.length) html = `<p>${esc(p.ocr.map((w) => w.t).join(' '))}</p>`;
    const notes = p.annots.filter((a) => a.t === 'text' && a.text && a.text.trim());
    if (notes.length) html += `<aside class="rd-notes"><span>Added on this page</span>${notes.map((a) => `<p>${esc(a.text)}</p>`).join('')}</aside>`;
    if (!html) { html = `<p class="rd-none">No readable text on this page${p.kind === 'pdf' || p.kind === 'img' ? '. It may be a scan or a drawing: use Recognise text in Tools to make it readable here.' : '.'}</p>`; const cv = document.createElement('canvas'); cv.className = 'rd-thumb'; sec.insertAdjacentHTML('beforeend', html); sec.appendChild(cv); paintThumb(p, cv).catch(() => {}); continue; }
    sec.insertAdjacentHTML('beforeend', html);
    if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
  }
  if (alive && S.current > 0) { const t = art.querySelector(`[data-go="${S.current}"]`); if (t) t.closest('section').scrollIntoView({ block: 'start' }); }
}

/* Page organiser: a large grid to sort, rotate, copy, extract and delete pages. */
function openOrganiser() {
  if (!S.pages.length) return; closeEditor(false);
  const st = { size: lsGet('pdfmate.orgSize', 'm') }; let anchor = null; let dragId = null;
  const B = (k, ic, l, t, cls = '') => `<button class="tbtn ${cls}" data-o="${k}" title="${t}">${icon(ic)}<span>${l}</span></button>`;
  const fv = fullView('organiser', `<b class="fv-title">${icon('grid')} Organise pages</b><span class="fv-sub" id="orgInfo"></span><span class="fv-sp"></span>
    ${B('all', 'check', 'Select all', 'Select all pages (Ctrl+A)')}${B('rotl', 'rotl', 'Left', 'Rotate selected pages left')}${B('rotr', 'rotr', 'Right', 'Rotate selected pages right')}${B('dup', 'dup', 'Duplicate', 'Duplicate selected pages')}${B('blank', 'blank', 'Blank', 'Insert a blank page after the selection')}${B('extract', 'extract', 'Extract', 'Save selected pages as a new PDF')}${B('del', 'trash', 'Delete', 'Delete selected pages (Delete key)', 'danger')}
    <div class="seg fv-seg" role="group" aria-label="Thumbnail size"><button data-sz="s">S</button><button data-sz="m">M</button><button data-sz="l">L</button></div><button class="tbtn primary" data-close="1">Done</button>`);
  const body = fv.querySelector('.fv-body'); const grid = document.createElement('div'); grid.className = 'org-grid'; body.appendChild(grid);
  const info = () => { const n = S.selPages.size; fv.querySelector('#orgInfo').textContent = `${S.pages.length} page${S.pages.length > 1 ? 's' : ''}${n ? ` · ${n} selected` : ' · click to select, Shift or Ctrl for more, drag to reorder'}`; fv.querySelectorAll('[data-o]:not([data-o="all"]):not([data-o="blank"])').forEach((b) => { b.disabled = !n; }); fv.querySelectorAll('[data-sz]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sz === st.size)); };
  const mark = () => { $$('.org-tile', grid).forEach((t) => t.classList.toggle('sel', S.selPages.has(t.dataset.id))); info(); markThumbs(); };
  const fill = () => {
    grid.dataset.size = st.size; grid.innerHTML = '';
    S.pages.forEach((p, i) => { const t = document.createElement('div'); t.className = 'org-tile'; t.draggable = true; t.dataset.id = p.id; t.innerHTML = `<div class="org-cv"><canvas></canvas></div><span class="org-n">${i + 1}</span>`; grid.appendChild(t); paintThumb(p, t.querySelector('canvas')).catch(() => {}); });
    mark();
  };
  const sync = () => { const ids = new Set(S.pages.map((p) => p.id)); for (const id of [...S.selPages]) if (!ids.has(id)) S.selPages.delete(id); fill(); };
  grid.addEventListener('click', (e) => {
    const t = e.target.closest('.org-tile'); if (!t) { S.selPages.clear(); mark(); return; } const id = t.dataset.id; const i = S.pages.findIndex((p) => p.id === id);
    if (e.shiftKey && anchor != null) { const a = Math.min(anchor, i), b = Math.max(anchor, i); if (!(e.ctrlKey || e.metaKey)) S.selPages.clear(); for (let k = a; k <= b; k++) S.selPages.add(S.pages[k].id); }
    else if (e.ctrlKey || e.metaKey || e.pointerType === 'touch' || S.selPages.size && matchMedia('(hover:none)').matches) { S.selPages.has(id) ? S.selPages.delete(id) : S.selPages.add(id); anchor = i; }
    else { S.selPages.clear(); S.selPages.add(id); anchor = i; }
    S.current = i; mark();
  });
  grid.addEventListener('dblclick', (e) => { const t = e.target.closest('.org-tile'); if (!t) return; const i = S.pages.findIndex((p) => p.id === t.dataset.id); S.selPages.clear(); fv._close(); renderAll(); scrollToPage(i); });
  grid.addEventListener('dragstart', (e) => { const t = e.target.closest('.org-tile'); if (!t) return; dragId = t.dataset.id; if (!S.selPages.has(dragId)) { S.selPages.clear(); S.selPages.add(dragId); mark(); } e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'pages'); requestAnimationFrame(() => $$('.org-tile.sel', grid).forEach((x) => x.classList.add('dragging'))); });
  const slot = (e) => { const tiles = $$('.org-tile', grid); let best = null, bd = 1e9, after = false; for (const t of tiles) { const r = t.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const d = Math.hypot(e.clientX - cx, (e.clientY - cy) * 1.6); if (d < bd) { bd = d; best = t; after = e.clientX > cx; } } return { t: best, after }; };
  grid.addEventListener('dragover', (e) => { if (!dragId) return; e.preventDefault(); $$('.org-tile', grid).forEach((t) => t.classList.remove('ins-before', 'ins-after')); const s = slot(e); if (s.t) s.t.classList.add(s.after ? 'ins-after' : 'ins-before'); });
  grid.addEventListener('drop', (e) => {
    if (!dragId) return; e.preventDefault(); const s = slot(e); dragId = null; if (!s.t) return;
    const moving = S.pages.filter((p) => S.selPages.has(p.id)); const rest = S.pages.filter((p) => !S.selPages.has(p.id));
    let at = rest.findIndex((p) => p.id === s.t.dataset.id); if (at < 0) at = rest.length; else if (s.after) at++;
    if (S.selPages.has(s.t.dataset.id)) return fill();
    rest.splice(at, 0, ...moving); S.pages = rest; renderAll(); commit(); fill(); toast(`Moved ${moving.length} page${moving.length > 1 ? 's' : ''}`);
  });
  grid.addEventListener('dragend', () => { dragId = null; $$('.org-tile', grid).forEach((t) => t.classList.remove('ins-before', 'ins-after', 'dragging')); });
  fv.querySelector('.fv-head').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.close) { fv._close(); return; }
    if (b.dataset.sz) { st.size = b.dataset.sz; lsSet('pdfmate.orgSize', st.size); fill(); return; }
    const k = b.dataset.o; if (!k) return;
    if (k === 'all') { if (S.selPages.size === S.pages.length) S.selPages.clear(); else S.pages.forEach((p) => S.selPages.add(p.id)); mark(); return; }
    if (k === 'extract') { await extractPages(); return; }
    if (k === 'blank') { const tps = targetPages(); const last = tps[tps.length - 1]; const at = last ? S.pages.indexOf(last) + 1 : S.pages.length; newBlank(at, last || S.pages[0]); sync(); return; }
    if (k === 'del' && S.selPages.size >= S.pages.length) { toast('Keep at least one page. To start over, close the document.', { err: true }); return; }
    pageAction(k); if (k === 'dup' || k === 'del') { if (k === 'del') S.selPages.clear(); } sync();
  });
  fv._key = (e) => { if (e.target.closest('input,textarea,select')) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); S.pages.forEach((p) => S.selPages.add(p.id)); mark(); } else if ((e.key === 'Delete' || e.key === 'Backspace') && S.selPages.size) { e.preventDefault(); fv.querySelector('[data-o="del"]').click(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); sync(); } };
  fv._onclose = () => { renderThumbs(); markThumbs(); };
  fill();
}
function markViewBtns() { $$('#tools [data-act="nav"]').forEach((x) => x.setAttribute('aria-pressed', NAV.on)); $$('#tools [data-act="ruler"]').forEach((x) => x.setAttribute('aria-pressed', RUL.on)); }


/* Scrollbars for the page area. The pages scroll under the glass top bars, so the scrollbar is drawn
   by the app and starts below them instead of running up behind the toolbars. */
function initScrollbars() {
  const st = $('.stage'); const mk = (c) => { const d = document.createElement('div'); d.className = 'sbar ' + c; d.innerHTML = '<i></i>'; st.appendChild(d); return d; };
  const V = mk('v'), H = mk('h'); let raf = 0, hideT = 0;
  const upd = () => {
    raf = 0; const ch = chromeH(); const vis = viewer.clientHeight - ch, tot = viewer.scrollHeight - ch, maxY = viewer.scrollHeight - viewer.clientHeight;
    const canV = maxY > 2; V.hidden = !canV;
    if (canV) { const tr = V.clientHeight; const th = Math.max(28, tr * vis / tot); V.firstChild.style.height = th + 'px'; V.firstChild.style.transform = `translateY(${(tr - th) * viewer.scrollTop / maxY}px)`; }
    const maxX = viewer.scrollWidth - viewer.clientWidth; const canH = maxX > 2; H.hidden = !canH; V.classList.toggle('both', canH);
    if (canH) { const tr = H.clientWidth; const tw = Math.max(28, tr * viewer.clientWidth / viewer.scrollWidth); H.firstChild.style.width = tw + 'px'; H.firstChild.style.transform = `translateX(${(tr - tw) * viewer.scrollLeft / maxX}px)`; }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(upd); st.classList.add('sb-live'); clearTimeout(hideT); hideT = setTimeout(() => st.classList.remove('sb-live'), 1200); };
  viewer.addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); new ResizeObserver(kick).observe(pagesEl); new ResizeObserver(kick).observe(viewer);
  const drag = (bar, vert) => {
    let d = null;
    bar.addEventListener('pointerdown', (e) => {
      e.preventDefault(); bar.setPointerCapture(e.pointerId); const th = bar.firstChild.getBoundingClientRect(); const br = bar.getBoundingClientRect();
      const onThumb = vert ? e.clientY >= th.top && e.clientY <= th.bottom : e.clientX >= th.left && e.clientX <= th.right;
      if (!onThumb) { const f = vert ? (e.clientY - br.top - th.height / 2) / (br.height - th.height) : (e.clientX - br.left - th.width / 2) / (br.width - th.width); if (vert) viewer.scrollTop = clamp(f, 0, 1) * (viewer.scrollHeight - viewer.clientHeight); else viewer.scrollLeft = clamp(f, 0, 1) * (viewer.scrollWidth - viewer.clientWidth); }
      d = { p: vert ? e.clientY : e.clientX, s: vert ? viewer.scrollTop : viewer.scrollLeft, k: vert ? (viewer.scrollHeight - viewer.clientHeight) / Math.max(1, br.height - th.height) : (viewer.scrollWidth - viewer.clientWidth) / Math.max(1, br.width - th.width) };
      if (!onThumb) d.s = vert ? viewer.scrollTop : viewer.scrollLeft; bar.classList.add('drag');
    });
    bar.addEventListener('pointermove', (e) => { if (!d) return; const v = d.s + ((vert ? e.clientY : e.clientX) - d.p) * d.k; if (vert) viewer.scrollTop = v; else viewer.scrollLeft = v; });
    const end = () => { d = null; bar.classList.remove('drag'); }; bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  };
  drag(V, true); drag(H, false); kick();
}

/* ---------- Bridge night mode (3.7) ---------- */
const NIGHT_LEVELS = [[1, 'Brightest'], [0.8, 'Bright'], [0.6, 'Medium'], [0.42, 'Dim'], [0.28, 'Darkest']];
function applyNight() {
  const v = lsGet('pdfmate.night', 'off'); const root = document.documentElement; const on = v !== 'off';
  if (on) { root.dataset.night = 'on'; root.style.setProperty('--night-b', String(v)); root.setAttribute('data-theme', 'dark'); } else if (root.dataset.night) { delete root.dataset.night; root.style.removeProperty('--night-b'); root.setAttribute('data-theme', curTheme()); }
  $$('meta[name="theme-color"]').forEach((m) => { if (!m.dataset.orig) m.dataset.orig = m.content; m.content = on ? '#000000' : m.dataset.orig; });
  const b = $('#btnNight'); if (b) b.setAttribute('aria-pressed', on);
  $$('#tools [data-act="night"]').forEach((x) => x.setAttribute('aria-pressed', on));
}
function toggleNight(anchor) {
  const v = lsGet('pdfmate.night', 'off');
  if (v === 'off') { lsSet('pdfmate.night', lsGet('pdfmate.nightLast', 0.6)); applyNight(); toast('Night mode on. Tap the moon again for brightness'); return; }
  openMenu(anchor || $('#btnNight'), [{ h: 'Night brightness' }, ...NIGHT_LEVELS.map(([k, l]) => ({ label: l, icon: Math.abs(k - v) < 0.01 ? 'check' : 'moon', run: () => { lsSet('pdfmate.night', k); lsSet('pdfmate.nightLast', k); applyNight(); } })), '-', { label: 'Turn night mode off', icon: 'close', run: () => { lsSet('pdfmate.night', 'off'); applyNight(); } }]);
}

/* ---------- Split screen (3.7) ---------- */
const SPL = { open: false, tabId: null, zoom: 0, link: lsGet('pdfmate.splitLink', false), io: null, z: 1, lock: 0 };
let DRAGX = null; // a page drag that started in the split pane: {tabId, ids}
const splitTab = () => WS.list.find((t) => t.id === SPL.tabId);
const activeTab = () => WS.list[WS.active];
const splitEl = () => $('#split');
function clonePage(p) { const c = JSON.parse(JSON.stringify(p)); c.id = uid('p'); for (const a of c.annots || []) a.id = uid('a'); return c; }
function pickSplitTab() {
  const t = splitTab(); if (t && t !== activeTab()) return t;
  const other = WS.list.filter((x) => x !== activeTab() && x.pages.length); SPL.tabId = other.length ? other[other.length - 1].id : null; return splitTab();
}
function openSplitView() {
  if (innerWidth < 760) { toast('Split screen needs a wider screen. Turn the tablet sideways or use a computer.'); return; }
  if (SPL.open) { closeSplitView(); return; }
  saveTab(); SPL.open = true; pickSplitTab();
  splitEl().hidden = false; $('#splitter').hidden = false; document.body.classList.add('has-split');
  renderSplit(); refitMain(); markSplitBtn();
  if (!splitTab()) toast('Choose a document for the right side, or open one from a file');
}
function closeSplitView() { document.body.classList.remove('split-swap'); SPL.open = false; splitEl().hidden = true; $('#splitter').hidden = true; document.body.classList.remove('has-split'); if (SPL.io) SPL.io.disconnect(); $('#spPages').innerHTML = ''; refitMain(); markSplitBtn(); }
function markSplitBtn() { $$('#tools [data-act="sview"]').forEach((x) => x.setAttribute('aria-pressed', SPL.open)); }
function refitMain() { setTimeout(() => { if (S.fit && S.pages.length) setZoom(0, true); if (SPL.open && !SPL.zoom) renderSplit(); }, 60); }
function splitOptions() {
  const sel = $('#spDoc'); if (!sel) return; const cur = splitTab();
  const opts = WS.list.map((t) => (t === activeTab() ? '' : `<option value="${t.id}" ${t === cur ? 'selected' : ''}>${esc(t.name)}${t.pages.length ? ` (${t.pages.length} p)` : ''}</option>`)).join('');
  sel.innerHTML = (cur ? '' : '<option value="" selected>Choose a document</option>') + opts + '<option value="__open">Open a file…</option>';
}
function splitFitZoom(t) { const w = $('#spView').clientWidth - 36; const mw = Math.max(...t.pages.map((p) => geo(p).w), 1); return clamp(w / mw, 0.1, 4); }
function renderSplit() {
  if (!SPL.open) return; splitOptions();
  const t = pickSplitTab(); const box = $('#spPages'); const view = $('#spView');
  $('#spEmpty').hidden = !!(t && t.pages.length); $('#spSwap').disabled = !t; $('#spLink').setAttribute('aria-pressed', SPL.link);
  if (SPL.io) SPL.io.disconnect(); box.innerHTML = '';
  if (!t || !t.pages.length) return;
  const z = SPL.zoom || splitFitZoom(t); SPL.z = z; $('#spZoom').textContent = Math.round(z * 100) + '%';
  SPL.io = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting && !e.target._done) { e.target._done = true; paintSplitPage(e.target); } }, { root: view, rootMargin: '600px 0px' });
  t.pages.forEach((p, i) => {
    const g = geo(p); const el = document.createElement('div'); el.className = 'sp-page'; el.draggable = true; el.dataset.id = p.id; el.dataset.i = i;
    el.style.width = g.w * z + 'px'; el.style.height = g.h * z + 'px'; el.title = 'Drag onto the left document, or onto its pages panel, to copy this page';
    el.innerHTML = `<canvas></canvas><svg class="sp-ov" viewBox="0 0 ${g.w} ${g.h}" xmlns="${SVGNS}"></svg><span class="pnum">${i + 1}</span>`;
    const svg = el.querySelector('svg'); const content = sv('g', { transform: `matrix(${g.t.join(' ')})` }); for (const a of p.annots) { try { content.appendChild(annNode(a)); } catch (err) {} } svg.appendChild(content);
    box.appendChild(el); SPL.io.observe(el);
  });
  updateSplitInd();
}
async function paintSplitPage(el) {
  const t = splitTab(); if (!t) return; const p = t.pages.find((x) => x.id === el.dataset.id); if (!p) return;
  const g = geo(p); const dpr = Math.min(devicePixelRatio || 1, 2); const s = SPL.z * dpr; const cv = el.querySelector('canvas');
  const W = Math.max(1, Math.round(g.w * s)), H = Math.max(1, Math.round(g.h * s)); const k = Math.min(1, Math.sqrt(16e6 / (W * H)));
  cv.width = Math.round(W * k); cv.height = Math.round(H * k); const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
  try {
    if (p.kind === 'pdf') { const d = S.docs.get(p.docId); if (!d || !d.pdf) return; const pg = await d.pdf.getPage(p.index + 1); await pg.render({ canvasContext: x, viewport: pg.getViewport({ scale: s * k, rotation: tr(p) }) }).promise; }
    else if (p.kind === 'blank') drawPaperCanvas(x, p, s * k);
    else if (p.kind === 'img') { const im = S.imgs.get(p.imgId); if (!im) return; const tt = g.t, sk = s * k; x.setTransform(tt[0] * sk, tt[1] * sk, tt[2] * sk, tt[3] * sk, tt[4] * sk, tt[5] * sk); const [x0, y0, x1, y1] = p.view; x.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1); x.drawImage(im.el, 0, 0, 1, 1); }
  } catch (err) { console.warn('split render', err); }
}
function updateSplitInd() {
  const v = $('#spView'), t = splitTab(); if (!t || !t.pages.length) { $('#spInd').textContent = ''; return; }
  const mid = v.getBoundingClientRect().top + v.clientHeight / 3; let n = 1; for (const el of $$('.sp-page', v)) { if (el.getBoundingClientRect().top <= mid) n = +el.dataset.i + 1; }
  $('#spInd').textContent = `${n} / ${t.pages.length}`;
}
// Where a scroller is: which page is at the top and how far into it.
function scrollPos(box, sel, off) { const top = box.getBoundingClientRect().top + off; const els = $$(sel, box); for (let i = 0; i < els.length; i++) { const r = els[i].getBoundingClientRect(); if (r.bottom > top) return { i, f: clamp((top - r.top) / r.height, 0, 1) }; } return { i: Math.max(0, els.length - 1), f: 0 }; }
function scrollToPos(box, sel, pos, off) { const el = $$(sel, box)[pos.i]; if (!el) return; const r = el.getBoundingClientRect(); box.scrollTop += r.top + pos.f * r.height - (box.getBoundingClientRect().top + off); }
// Make the other side the one being edited. The two documents stay where they are on screen.
function splitSwap() {
  const t = splitTab(); if (!t) return; const cur = activeTab(); const i = WS.list.indexOf(t);
  const v = $('#spView'); const pPos = scrollPos(v, '.sp-page', 0), mPos = scrollPos(viewer, '.page', chromeH()); const mZoom = S.zoom;
  switchTab(i); SPL.tabId = cur.id; SPL.zoom = mZoom; document.body.classList.toggle('split-swap'); renderSplit(); refitMain(); markSplitSides();
  setTimeout(() => { scrollToPos(viewer, '.page', pPos, chromeH()); scrollToPos(v, '.sp-page', mPos, 0); }, 140);
}
function markSplitSides() { const t = splitTab(); const b = $('#spBadge'); if (b) b.hidden = !t; }
function splitAfterTabChange() { if (!SPL.open) return; if (splitTab() === activeTab() || !splitTab()) { SPL.tabId = null; } renderSplit(); }
function snapOf(pages) { return JSON.stringify({ pages, vals: [...S.docs.values()].map((d) => [d.id, d.values]) }); }
// Copy pages into another (not active) tab, with an undo step in that tab.
function addPagesToTab(t, pages, at) {
  t.hist.push(t.last); if (t.hist.length > 40) t.hist.shift(); t.fut = [];
  t.pages.splice(clamp(at, 0, t.pages.length), 0, ...pages.map(clonePage)); t.last = snapOf(t.pages); t.dirty = true;
  renderTabs(); renderSplit(); scheduleSave();
}
function dropIndexIn(container, sel, y, attr = 'i') {
  const els = $$(sel, container); for (const el of els) { const r = el.getBoundingClientRect(); if (y < r.top + r.height / 2) return { at: +el.dataset[attr], el, before: true }; }
  const last = els[els.length - 1]; return { at: els.length, el: last, before: false };
}
function clearDropMarks() { $$('.drop-before,.drop-after').forEach((e) => e.classList.remove('drop-before', 'drop-after')); }
function initSplit() {
  const v = $('#spView');
  $('#spDoc').addEventListener('change', (e) => { const val = e.target.value; if (val === '__open') { splitOptions(); $('#fileSplit').click(); return; } SPL.tabId = val || null; SPL.zoom = 0; renderSplit(); });
  $('#spZin').onclick = () => { SPL.zoom = clamp((SPL.zoom || SPL.z) * 1.25, 0.1, 6); renderSplit(); };
  $('#spZout').onclick = () => { SPL.zoom = clamp((SPL.zoom || SPL.z) / 1.25, 0.1, 6); renderSplit(); };
  $('#spZoom').onclick = () => { SPL.zoom = 0; renderSplit(); };
  $('#spLink').onclick = () => { SPL.link = !SPL.link; lsSet('pdfmate.splitLink', SPL.link); $('#spLink').setAttribute('aria-pressed', SPL.link); toast(SPL.link ? 'Scrolling together' : 'Scrolling separately'); };
  $('#spSwap').onclick = splitSwap; $('#spClose').onclick = closeSplitView; $('#spOpen').onclick = () => $('#fileSplit').click();
  $('#fileSplit').addEventListener('change', async (e) => {
    const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
    const keep = activeTab(); const before = new Set(WS.list.map((t) => t.id));
    await openFilesInTabs(files); const added = WS.list.filter((t) => !before.has(t.id));
    const back = WS.list.indexOf(keep); if (back >= 0 && WS.list[WS.active] !== keep) switchTab(back);
    if (added.length) SPL.tabId = added[added.length - 1].id; else if (keep && WS.list[WS.active] !== keep) SPL.tabId = activeTab().id;
    renderTabs(); renderSplit();
  });
  // Scroll: page indicator and optional linked scrolling.
  const ratio = (el) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
  v.addEventListener('scroll', () => { updateSplitInd(); if (SPL.link && SPL.lock !== 1) { SPL.lock = 2; viewer.scrollTop = ratio(v) * (viewer.scrollHeight - viewer.clientHeight); requestAnimationFrame(() => { SPL.lock = 0; }); } }, { passive: true });
  viewer.addEventListener('scroll', () => { if (SPL.open && SPL.link && SPL.lock !== 2) { SPL.lock = 1; v.scrollTop = ratio(viewer) * (v.scrollHeight - v.clientHeight); requestAnimationFrame(() => { SPL.lock = 0; }); } }, { passive: true });
  v.addEventListener('click', (e) => { if (e.target.closest('.sp-empty,button,select,input')) return; if (splitTab()) splitSwap(); });
  // Drag pages out of the split pane.
  v.addEventListener('dragstart', (e) => { const el = e.target.closest('.sp-page'); if (!el) return; const t = splitTab(); DRAGX = { tabId: t.id, ids: [el.dataset.id] }; e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', 'page'); el.classList.add('dragging'); });
  v.addEventListener('dragend', (e) => { DRAGX = null; clearDropMarks(); $$('.sp-page.dragging').forEach((x) => x.classList.remove('dragging')); $('#pages').classList.remove('drop-on'); });
  // Drop pages from the left pages panel into the split pane.
  v.addEventListener('dragover', (e) => { if (!dragThumb || !splitTab()) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; clearDropMarks(); const d = dropIndexIn(v, '.sp-page', e.clientY); if (d.el) d.el.classList.add(d.before ? 'drop-before' : 'drop-after'); v.classList.add('drop-on'); });
  v.addEventListener('dragleave', (e) => { if (!v.contains(e.relatedTarget)) { v.classList.remove('drop-on'); clearDropMarks(); } });
  v.addEventListener('drop', (e) => {
    if (!dragThumb) return; const t = splitTab(); if (!t) return; e.preventDefault(); e.stopPropagation();
    const moving = S.selPages.has(dragThumb) ? S.pages.filter((p) => S.selPages.has(p.id)) : [pageById(dragThumb)];
    const d = dropIndexIn(v, '.sp-page', e.clientY); dragThumb = null; v.classList.remove('drop-on'); clearDropMarks();
    saveTab(); addPagesToTab(t, moving.filter(Boolean), d.at); toast(`Copied ${moving.length} page${moving.length > 1 ? 's' : ''} into ${t.name}`);
  });
  // Drop split pages into the left document, on its pages or its pages panel.
  const dropInto = (at) => {
    const src = WS.list.find((t) => t.id === DRAGX.tabId); if (!src) return; const pages = DRAGX.ids.map((id) => src.pages.find((p) => p.id === id)).filter(Boolean);
    S.pages.splice(clamp(at, 0, S.pages.length), 0, ...pages.map(clonePage)); DRAGX = null; clearDropMarks();
    if (S.pages.length === pages.length && !$('#docName').value) $('#docName').value = src.name;
    renderAll(); commit(); renderTabs(); scrollToPage(clamp(at, 0, S.pages.length - 1)); toast(`Copied ${pages.length} page${pages.length > 1 ? 's' : ''} from ${src.name}`);
  };
  viewer.addEventListener('dragover', (e) => { if (!DRAGX) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; clearDropMarks(); const els = $$('.page', pagesEl); let hit = null, before = true; for (const el of els) { const r = el.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { hit = el; break; } } if (!hit && els.length) { hit = els[els.length - 1]; before = false; } if (hit) hit.classList.add(before ? 'drop-before' : 'drop-after'); pagesEl.classList.add('drop-on'); });
  viewer.addEventListener('dragleave', (e) => { if (DRAGX && !viewer.contains(e.relatedTarget)) { pagesEl.classList.remove('drop-on'); clearDropMarks(); } });
  viewer.addEventListener('drop', (e) => { if (!DRAGX) return; e.preventDefault(); e.stopPropagation(); pagesEl.classList.remove('drop-on'); const els = $$('.page', pagesEl); let at = els.length; for (let k = 0; k < els.length; k++) { const r = els[k].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { at = k; break; } } dropInto(at); });
  sbList.addEventListener('dragover', (e) => { if (!DRAGX) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; clearDropMarks(); const b = e.target.closest('.thumb'); if (b) { const r = b.getBoundingClientRect(); const target = e.clientY > r.top + r.height / 2 ? b.nextElementSibling : b; if (target) target.classList.add('drop-before'); } });
  sbList.addEventListener('drop', (e) => { if (!DRAGX) return; e.preventDefault(); e.stopPropagation(); const before = sbList.querySelector('.drop-before'); let at = before ? S.pages.findIndex((p) => p.id === before.dataset.id) : S.pages.length; if (at < 0) at = S.pages.length; dropInto(at); });
  // Resize the split.
  const sp = $('#splitter'); let drag = null;
  sp.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, w: splitEl().offsetWidth }; sp.setPointerCapture(e.pointerId); document.body.classList.add('split-resizing'); });
  sp.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; const w = clamp(drag.w + (document.body.classList.contains('split-swap') ? dx : -dx), 280, innerWidth * 0.72); document.documentElement.style.setProperty('--split-w', w + 'px'); });
  const end = () => { if (!drag) return; drag = null; document.body.classList.remove('split-resizing'); lsSet('pdfmate.splitW', splitEl().offsetWidth); refitMain(); if (!SPL.zoom) renderSplit(); };
  sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
  sp.addEventListener('dblclick', () => { document.documentElement.style.removeProperty('--split-w'); lsSet('pdfmate.splitW', 0); refitMain(); });
  const w0 = lsGet('pdfmate.splitW', 0); if (w0) document.documentElement.style.setProperty('--split-w', w0 + 'px');
  let rt = 0; addEventListener('resize', () => { if (!SPL.open) return; clearTimeout(rt); rt = setTimeout(() => { if (innerWidth < 760) closeSplitView(); else if (!SPL.zoom) renderSplit(); }, 200); });
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
  updateChrome(); renderTabs(); refreshFormatBar(); splitAfterTabChange();
}
function switchTab(i) { if (i === WS.active || !WS.list[i]) return; saveTab(); loadTab(i); scheduleSave(); }
function newTab() { saveTab(); WS.list.push(blankTab()); loadTab(WS.list.length - 1); }
function releaseUnused() {
  const used = new Set(); const imgsUsed = new Set();
  const scan = (pages) => { for (const p of pages) { if (p.docId) used.add(p.docId); if (p.imgId) imgsUsed.add(p.imgId); for (const a of p.annots) { if (a.imgId) imgsUsed.add(a.imgId); if (a.edit && a.edit.orig) imgsUsed.add(a.edit.orig); } } };
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
  WS.active = -1; loadTab(next); releaseUnused(); scheduleSave(); splitAfterTabChange();
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
function refsOf(pages, docs, imgs) { for (const p of pages) { if (p.docId) docs.add(p.docId); if (p.imgId) imgs.add(p.imgId); for (const a of p.annots) { if (a.imgId) imgs.add(a.imgId); if (a.edit && a.edit.orig) imgs.add(a.edit.orig); } } }
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
    S.docs.set(id, doc); stored.add(id);
    if (doc.values[EDK] && Object.keys(doc.values[EDK]).length) await rebuildDoc(doc);
    return true;
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
  io = new IntersectionObserver((ents) => { for (const e of ents) { const el = e.target; el._vis = e.isIntersecting; if (e.isIntersecting) { if (!el._ov) { const pp = pageById(el.dataset.id); if (pp) { el._ov = true; drawOverlay(pp, el); drawForm(pp, el); } } queueRender(); } } }, { root: viewer, rootMargin: '900px 0px' });
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
/* ---------- Render pipeline: queued, cached, detail layer for zoomed drawings ---------- */
const isPhone = () => innerWidth <= 760 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const BASE_MAX = () => (isPhone() ? 5e6 : 9e6);     // pixels for one whole-page canvas
const DETAIL_MAX = () => (isPhone() ? 6e6 : 14e6);  // pixels for the sharp on-screen part
const MEM_MAX = () => (isPhone() ? 32e6 : 96e6);    // pixels kept across all page canvases
const HEAVY_MS = 800;
const RQ = { busy: false, t: 0, again: false, dtask: null, lru: 0, idle: [] };
const SNAP = new Map(); // heavy page snapshots: id|rot -> { blob, scale }
const PSTAT = new Map(); // runtime render stats per page id, kept out of undo history
const pst = (p) => { let o = PSTAT.get(p.id); if (!o) { o = {}; PSTAT.set(p.id, o); } return o; };
function scales(p) { const g = geo(p); const full = S.zoom * Math.min(devicePixelRatio || 1, 2.5); const px = g.w * g.h * full * full; const cap = BASE_MAX(); return { full, base: px > cap ? full * Math.sqrt(cap / px) : full }; }
const baseKey = (p, base) => tr(p) + '|' + base.toFixed(4);
function needsPaint(el) { const p = pageById(el.dataset.id); if (!p) return false; const k = baseKey(p, scales(p).base); return el._key !== k && el._err !== k; }
function pageDist(el, vr) { const r = el.getBoundingClientRect(); return r.bottom < vr.top ? vr.top - r.bottom : r.top > vr.bottom ? r.top - vr.bottom : 0; }
function nearPages(ahead) { const vr = viewer.getBoundingClientRect(); const out = []; for (const el of $$('.page', pagesEl)) { if (!el._vis) continue; const d = pageDist(el, vr); if (d <= ahead) out.push([d, el]); } return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]); }
function queueRender(delay = 0) { clearTimeout(RQ.t); RQ.t = setTimeout(pumpRender, delay); }
function renderIdle() { return RQ.busy || RQ.t ? new Promise((r) => RQ.idle.push(r)) : Promise.resolve(); }
async function pumpRender() {
  RQ.t = 0; if (RQ.busy) { RQ.again = true; return; } RQ.busy = true;
  try {
    for (let guard = 0; guard < 400; guard++) { const el = nearPages(viewer.clientHeight).find(needsPaint); if (!el) break; await paintCanvas(el); await new Promise((r) => setTimeout(r, 0)); }
    for (const el of nearPages(0)) if (el._needDetail && !RQ.again) await paintDetail(el);
  } catch (e) { console.error(e); }
  RQ.busy = false;
  if (RQ.again) { RQ.again = false; queueRender(); return; }
  if (!RQ.t) { const w = RQ.idle; RQ.idle = []; w.forEach((r) => r()); }
}
function touchMem(el) {
  el._lru = ++RQ.lru; let total = 0; const list = [];
  for (const e of $$('.page', pagesEl)) { const c = e.firstElementChild; if (c && c.width) { total += c.width * c.height + (e._dc ? e._dc.width * e._dc.height : 0); list.push(e); } }
  list.sort((a, b) => (a._lru || 0) - (b._lru || 0));
  for (const e of list) { if (total <= MEM_MAX()) break; if (e._vis || e === el) continue; const c = e.firstElementChild; total -= c.width * c.height; freeCanvas(e); }
}
function freeCanvas(el) { const c = el.querySelector('canvas'); if (el._task) { try { el._task.cancel(); } catch (e) {} el._task = null; } c.width = 0; c.height = 0; el._key = null; el._scale = 0; hideDetail(el, true); }
function hideDetail(el, free) { const d = el._dc; if (!d) return; d.hidden = true; d._key = null; if (free) { d.width = d.height = 0; } }
async function paintCanvas(el) {
  const p = pageById(el.dataset.id); if (!p) return;
  const { full, base } = scales(p); const rot = tr(p); const key = baseKey(p, base);
  el._needDetail = p.kind === 'pdf' && base < full * 0.97;
  if (el._key === key) return;
  const c = el.querySelector('canvas'); el._lru = ++RQ.lru;
  // Already sharp enough: exact match, or a heavy page whose image is close enough (fast view)
  if (c.width && el._rot === rot && el._scale && (pst(p).heavy ? el._scale >= base * 0.8 : Math.abs(el._scale - base) / base < 0.02)) { el._key = key; el._needDetail = p.kind === 'pdf' && el._scale < full * 0.97; return; }
  const sn = SNAP.get(p.id + '|' + rot);
  if (sn && sn.scale >= base * 0.8 && (!c.width || el._scale < sn.scale)) {
    try { const bmp = await createImageBitmap(sn.blob); c.width = bmp.width; c.height = bmp.height; c.getContext('2d').drawImage(bmp, 0, 0); if (bmp.close) bmp.close(); el._scale = sn.scale; el._rot = rot; el._key = key; el._needDetail = el._scale < full * 0.97; touchMem(el); return; } catch (e) {}
  }
  el._key = key;
  if (el._task) { try { el._task.cancel(); } catch (e) {} el._task = null; }
  const g = geo(p); const off = document.createElement('canvas'); off.width = Math.max(1, Math.round(g.w * base)); off.height = Math.max(1, Math.round(g.h * base));
  const ctx = off.getContext('2d'); const t0 = performance.now();
  try {
    if (p.kind === 'pdf') {
      const doc = S.docs.get(p.docId); const pdfRef = doc.pdf; el._pdfRef = pdfRef; const pg = await pdfRef.getPage(p.index + 1);
      if (el._key !== key) return;
      const vp = pg.getViewport({ scale: base, rotation: rot });
      off.width = Math.round(vp.width); off.height = Math.round(vp.height);
      const task = pg.render({ canvasContext: off.getContext('2d'), viewport: vp, annotationMode: doc.fields.length ? pdfjsLib.AnnotationMode.ENABLE_FORMS : pdfjsLib.AnnotationMode.ENABLE });
      el._task = task; await task.promise; el._task = null;
      const ms = performance.now() - t0; pst(p).ms = Math.max(pst(p).ms || 0, ms);
      if (ms > HEAVY_MS && !pst(p).heavy) markHeavy(p);
      if (pst(p).heavy) off.toBlob((b) => { if (b) { const k2 = p.id + '|' + rot; const o = SNAP.get(k2); if (!o || o.scale <= base) SNAP.set(k2, { blob: b, scale: base }); } }, 'image/webp', 0.92);
      if (!el._tl) { el._tl = true; renderIdle().then(() => renderTextLayer(el, p, pg)); }
    } else {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, off.width, off.height);
      if (p.kind === 'img') {
        const im = S.imgs.get(p.imgId); const s = base; const t = g.t;
        ctx.setTransform(t[0] * s, t[1] * s, t[2] * s, t[3] * s, t[4] * s, t[5] * s);
        const [x0, y0, x1, y1] = p.view; ctx.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1);
        ctx.drawImage(im.el, 0, 0, 1, 1);
      } else drawPaperCanvas(ctx, p, base);
    }
    if (el._key !== key) return;
    if (p.kind !== 'pdf' && p.ocr && p.ocr.length && !el._ocrDone) { buildOcrLayer(el, p); el._tlReady = true; }
    c.width = off.width; c.height = off.height; c.getContext('2d').drawImage(off, 0, 0); off.width = off.height = 0;
    el._scale = base; el._rot = rot; touchMem(el);
  } catch (e) { const swapped = p.kind === 'pdf' && S.docs.get(p.docId) && el._pdfRef !== S.docs.get(p.docId).pdf; if (e && e.name !== 'RenderingCancelledException' && !swapped) { console.error(e); el._err = key; } el._key = null; if (swapped) queueRender(50); }
}
const heavyToldDoc = new Set();
function markHeavy(p) { pst(p).heavy = true; if (!heavyToldDoc.has(p.docId)) { heavyToldDoc.add(p.docId); toast('Large drawing. Fast view is on: zoom in for full detail.', { ms: 3200 }); } }
// Sharp layer for the part of the page on screen, used when the whole page would be too big to draw at full resolution.
async function paintDetail(el) {
  const p = pageById(el.dataset.id); if (!p || p.kind !== 'pdf') return;
  const z = S.zoom; const { full } = scales(p); const vr = viewer.getBoundingClientRect(), r = el.getBoundingClientRect();
  const vis = { L: Math.max(0, vr.left - r.left), T: Math.max(0, vr.top - r.top), R: Math.min(r.width, vr.right - r.left), B: Math.min(r.height, vr.bottom - r.top) };
  if (vis.R <= vis.L || vis.B <= vis.T) return;
  const d0 = el._dc; const rot = tr(p);
  if (d0 && !d0.hidden && d0._z === z && d0._rot === rot && d0._L <= vis.L + 1 && d0._T <= vis.T + 1 && d0._R >= vis.R - 1 && d0._B >= vis.B - 1) return;
  const mx = (vis.R - vis.L) * 0.3, my = (vis.B - vis.T) * 0.3;
  const L = Math.max(0, vis.L - mx), T = Math.max(0, vis.T - my), R = Math.min(r.width, vis.R + mx), B = Math.min(r.height, vis.B + my);
  let dpr = full / z; while ((R - L) * (B - T) * dpr * dpr > DETAIL_MAX() && dpr > 1) dpr -= 0.25;
  const doc = S.docs.get(p.docId); const pg = await doc.pdf.getPage(p.index + 1);
  const off = document.createElement('canvas'); off.width = Math.max(1, Math.round((R - L) * dpr)); off.height = Math.max(1, Math.round((B - T) * dpr));
  const vp = pg.getViewport({ scale: z * dpr, rotation: rot });
  const task = pg.render({ canvasContext: off.getContext('2d'), viewport: vp, transform: [1, 0, 0, 1, -Math.round(L * dpr), -Math.round(T * dpr)], annotationMode: doc.fields.length ? pdfjsLib.AnnotationMode.ENABLE_FORMS : pdfjsLib.AnnotationMode.ENABLE });
  RQ.dtask = task;
  try { await task.promise; } catch (e) { if (e && e.name !== 'RenderingCancelledException') console.error(e); return; } finally { if (RQ.dtask === task) RQ.dtask = null; }
  if (S.zoom !== z || tr(p) !== rot || !el.isConnected) return;
  let d = el._dc; if (!d) { d = document.createElement('canvas'); d.className = 'detail'; d.setAttribute('aria-hidden', 'true'); el.firstElementChild.after(d); el._dc = d; }
  d.width = off.width; d.height = off.height; d.getContext('2d').drawImage(off, 0, 0); off.width = off.height = 0;
  Object.assign(d.style, { left: Math.round(L * dpr) / dpr + 'px', top: Math.round(T * dpr) / dpr + 'px', width: d.width / dpr + 'px', height: d.height / dpr + 'px' });
  Object.assign(d, { _z: z, _rot: rot, _L: L, _T: T, _R: R, _B: B }); d.hidden = false; touchMem(el);
}
function rerenderVisible() { if (RQ.dtask) { try { RQ.dtask.cancel(); } catch (e) {} } for (const el of $$('.page', pagesEl)) hideDetail(el); queueRender(220); }

/* ---------- Overlay SVG ---------- */
const sv = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
let gradN = 0;
function textSvg(fr, a) {
  const L = layoutText(a); const op = a.opacity == null ? 1 : a.opacity; const rad = a.rad || 0;
  if (a.shadow) { const o = shOff(a); fr.appendChild(sv('path', { d: boxPath(o, o, a.w, a.h, rad), fill: '#000', 'fill-opacity': 0.22 * op })); }
  if (a.grad) {
    const id = 'tg' + (gradN++); const d = GRAD_DIR[a.grad[2]] || GRAD_DIR.v; const defs = sv('defs', {}); const lg = sv('linearGradient', { id, x1: d[0], y1: d[1], x2: d[2], y2: d[3] });
    lg.appendChild(sv('stop', { offset: 0, 'stop-color': a.grad[0] })); lg.appendChild(sv('stop', { offset: 1, 'stop-color': a.grad[1] })); defs.appendChild(lg); fr.appendChild(defs);
    fr.appendChild(sv('path', { d: boxPath(0, 0, a.w, a.h, rad), fill: `url(#${id})`, 'fill-opacity': (a.bgop == null ? 1 : a.bgop) * op }));
  } else if (a.bg) fr.appendChild(sv('path', { d: boxPath(0, 0, a.w, a.h, rad), fill: a.bg, 'fill-opacity': (a.bgop == null ? 1 : a.bgop) * op }));
  if (a.border) { const bw = bdW(a); const da = bdDash(a, bw); const at = { d: boxPath(bw / 2, bw / 2, Math.max(0, a.w - bw), Math.max(0, a.h - bw), Math.max(0, rad - bw / 2)), fill: 'none', stroke: a.bc || a.color, 'stroke-width': bw, 'stroke-opacity': op }; if (da) { at['stroke-dasharray'] = da.join(' '); at['stroke-linecap'] = 'round'; } fr.appendChild(sv('path', at)); }
  const fam = FONT_CSS[a.font || 'helv'] + ', ' + UNI_FALLBACK;
  const tx = (str, x, y) => { const t = sv('text', { x, y, 'font-family': fam, 'font-weight': a.bold ? 700 : 400, 'font-style': a.italic ? 'italic' : 'normal', 'font-size': a.size, fill: a.color, 'fill-opacity': op, 'xml:space': 'preserve' }); if (a.ls) t.setAttribute('letter-spacing', a.ls); t.textContent = str; fr.appendChild(t); };
  const th = Math.max(0.5, a.size * 0.065);
  for (const r of L.rows) {
    const rw = r.jw || r.w;
    if (a.hlc && r.s) fr.appendChild(sv('rect', { x: r.x - a.size * 0.05, y: r.top, width: rw + a.size * 0.1, height: L.lineBox, fill: a.hlc, 'fill-opacity': op }));
    if (r.pre) tx(r.pre, L.pad, r.y);
    if (r.jw) for (const w of justWords(a, r)) tx(w.w, w.x, r.y); else if (r.s) tx(r.s, r.x, r.y);
    if (a.underline && r.s) fr.appendChild(sv('rect', { x: r.x, y: r.y + a.size * 0.1, width: rw, height: th, fill: a.color, 'fill-opacity': op }));
    if (a.strike && r.s) fr.appendChild(sv('rect', { x: r.x, y: r.y - a.size * 0.3 - th / 2, width: rw, height: th, fill: a.color, 'fill-opacity': op }));
  }
}
function annNode(a) {
  const g = sv('g', { 'data-id': a.id });
  const w = a.width || 1.5;
  if (a.rot && BOXES.has(a.t)) g.setAttribute('transform', `rotate(${a.rot} ${a.x + a.w / 2} ${a.y + a.h / 2})`);
  if (a.t === 'white') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: a.fill || '#ffffff' }));
  else if (a.t === 'hl') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: a.color, 'fill-opacity': 0.4, style: 'mix-blend-mode:multiply' }));
  else if (a.t === 'rect') g.appendChild(sv('rect', { x: a.x + w / 2, y: a.y + w / 2, width: Math.max(0, a.w - w), height: Math.max(0, a.h - w), fill: a.fill || 'none', 'fill-opacity': a.fop == null ? 1 : a.fop, stroke: a.color, 'stroke-width': w }));
  else if (a.t === 'ellipse') g.appendChild(sv('ellipse', { cx: a.x + a.w / 2, cy: a.y + a.h / 2, rx: Math.max(0, a.w / 2 - w / 2), ry: Math.max(0, a.h / 2 - w / 2), fill: a.fill || 'none', 'fill-opacity': a.fop == null ? 1 : a.fop, stroke: a.color, 'stroke-width': w }));
  else if (a.t === 'shape') shapeSvgNodes(g, a);
  else if (a.t === 'redact') g.appendChild(sv('rect', { x: a.x, y: a.y, width: a.w, height: a.h, fill: '#000000' }));
  else if (a.t === 'measure' || a.t === 'area' || a.t === 'cloud') measSvg(g, a);
  else if (a.t === 'mark') {
    if (a.kind === 'hl') for (const [x, y, rw, rh] of a.rects) g.appendChild(sv('rect', { x, y, width: rw, height: rh, fill: a.color, 'fill-opacity': 0.4, style: 'mix-blend-mode:multiply' }));
    else for (const [s0, s1] of a.segs || []) g.appendChild(sv('line', { x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1], stroke: a.color, 'stroke-width': a.width || 1 }));
  }
  else if (a.t === 'line' || a.t === 'arrow') {
    const [p0, p1] = a.pts; g.appendChild(sv('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round' }));
    if (a.t === 'arrow') for (const [s, e] of arrowHead(a)) g.appendChild(sv('line', { x1: s[0], y1: s[1], x2: e[0], y2: e[1], stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round' }));
  } else if (a.t === 'pen') inkSvg(g, a);
  else if (ORIENTED.has(a.t)) {
    const { U, V } = UV(a.r);
    const fr = sv('g', { transform: `matrix(${U[0]} ${U[1]} ${-V[0]} ${-V[1]} ${a.ax + a.h * V[0]} ${a.ay + a.h * V[1]})` });
    if (a.t === 'image') { const im = S.imgs.get(a.imgId); if (im) { const n = sv('image', { href: im.src, x: 0, y: 0, width: a.w, height: a.h, preserveAspectRatio: 'none' }); if (a.op != null && a.op < 1) n.setAttribute('opacity', a.op); fr.appendChild(n); } }
    else if (a.t === 'text') textSvg(fr, a);
    else {
      const segs = a.t === 'tick' ? [TICK] : CROSS;
      for (const s of segs) fr.appendChild(sv('polyline', { points: s.map(([p, q]) => `${p * a.w},${q * a.h}`).join(' '), fill: 'none', stroke: a.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    }
    g.appendChild(fr);
  }
  return g;
}
let GUIDES = null, MARQ = null, CLIP = null, ROTLBL = null;
function rotHandle(ui, b, pad, attr = 'data-h') {
  const cx = (b.L + b.R) / 2, top = b.T - pad, hy = top - 24 / S.zoom, r = 6 / S.zoom;
  ui.appendChild(sv('line', { class: 'rotline', x1: cx, y1: top, x2: cx, y2: hy + r }));
  ui.appendChild(sv('circle', { class: 'handle-hit', [attr]: 'rot', cx, cy: hy, r: r * 2.6 }));
  ui.appendChild(sv('circle', { class: 'handle rot', [attr]: 'rot', cx, cy: hy, r }));
}
const snapDeg = (deg, fine) => { if (fine) return Math.round(deg / 15) * 15; const r = Math.round(deg); const m = Math.round(r / 45) * 45; return Math.abs(r - m) <= 3 ? m : r; };
function selPivot(list) { let L = Infinity, B = Infinity, R = -Infinity, T = -Infinity; for (const a of list) for (const [x, y] of corners(a)) { L = Math.min(L, x); R = Math.max(R, x); B = Math.min(B, y); T = Math.max(T, y); } return [(L + R) / 2, (B + T) / 2]; }
// deg is clockwise as seen on screen
function rotateSelected(deg) {
  const ss = selAnns(); if (!ss) return; const list = ss.as.filter(ROTATABLE); if (!list.length) { toast('Text highlights cannot be rotated'); return; }
  const pv = list.length === 1 ? annCenter(list[0]) : selPivot(list);
  for (const a of list) { rotateAnn(a, -deg, pv); if (a.t === 'text') { const b = textBox(a); a.w = b.w; a.h = b.h; } }
  drawOverlay(ss.p); commit(); refreshFormatBar();
}
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
    if (list.length) { const u = unionBox(list, g); ui.appendChild(sv('rect', { class: 'selgroup', x: u.L - pad * 2, y: u.T - pad * 2, width: u.R - u.L + 4 * pad, height: u.B - u.T + 4 * pad })); if (list.every(ROTATABLE)) rotHandle(ui, u, pad * 2); }
  } else if (S.sel && S.sel.pageId === p.id) {
    const a = p.annots.find((z) => z.id === S.sel.annId);
    if (a && !(S.editing && S.editing.annId === a.id)) {
      const b = dispBox(a, g), pad = 4 / S.zoom, r = 7 / S.zoom;
      ui.appendChild(sv('rect', { class: 'selbox', x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad }));
      ui.appendChild(sv('circle', { class: 'handle-hit', 'data-h': 'se', cx: b.R + pad, cy: b.B + pad, r: r * 2.4 }));
      ui.appendChild(sv('circle', { class: 'handle', 'data-h': 'se', cx: b.R + pad, cy: b.B + pad, r }));
      if (ROTATABLE(a)) rotHandle(ui, b, pad);
    }
  }
  if (ROTLBL && ROTLBL.pageId === p.id) { const t = sv('text', { class: 'rotlbl', x: ROTLBL.x, y: ROTLBL.y, 'font-size': 12 / S.zoom }); t.textContent = ROTLBL.t; ui.appendChild(t); }
  drawObjUi(p, g, ui);
  if (GUIDES && GUIDES.pageId === p.id) {
    if (GUIDES.gx != null) ui.appendChild(sv('line', { class: 'guide', x1: GUIDES.gx, y1: 0, x2: GUIDES.gx, y2: g.h }));
    if (GUIDES.gy != null) ui.appendChild(sv('line', { class: 'guide', x1: 0, y1: GUIDES.gy, x2: g.w, y2: GUIDES.gy }));
  }
  if (LASSO && LASSO.pageId === p.id && LASSO.pts.length > 1) ui.appendChild(sv('path', { class: 'lasso', d: 'M' + LASSO.pts.map((q) => q[0] + ' ' + q[1]).join('L') + 'Z' }));
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
  if (p.kind === 'pdf') {
    await renderIdle(); const el = pageEl(p.id); const mc = el && el.firstElementChild;
    const sn = SNAP.get(p.id + '|' + tr(p));
    if (mc && mc.width && el._rot === tr(p)) { x.imageSmoothingQuality = 'high'; x.drawImage(mc, 0, 0, c.width, c.height); }
    else if (sn) { const bmp = await createImageBitmap(sn.blob); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, c.width, c.height); }
    else { const pg = await S.docs.get(p.docId).pdf.getPage(p.index + 1); await pg.render({ canvasContext: x, viewport: pg.getViewport({ scale: s, rotation: tr(p) }) }).promise; }
  }
  else drawPaperCanvas(x, p, s);
  if (p.kind === 'img') { const t = g.t; x.setTransform(t[0] * s, t[1] * s, t[2] * s, t[3] * s, t[4] * s, t[5] * s); const [x0, y0, x1, y1] = p.view; x.transform(x1 - x0, 0, 0, -(y1 - y0), x0, y1); x.drawImage(S.imgs.get(p.imgId).el, 0, 0, 1, 1); }
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
viewer.addEventListener('scroll', () => { if (!S.pages.length) return; if (RQ.dtask) { try { RQ.dtask.cancel(); } catch (e) {} } queueRender(140); }, { passive: true });
const chromeH = () => { const t = document.getElementById('topchrome'); return t && getComputedStyle(t).position === 'absolute' ? t.offsetHeight : 0; };
function scrollToPage(i, smooth = true) { const el = $$('.page', pagesEl)[i]; if (el) viewer.scrollTo({ top: el.offsetTop - 18 - chromeH(), behavior: smooth ? 'smooth' : 'auto' }); }
const ZMIN = 0.1, ZMAX = 48; // 7.5% to 3600%
// Page point under the anchor (client coords) stays put while zooming.
function zoomAnchor(ax, ay) {
  const vr = viewer.getBoundingClientRect(); if (ax == null) { ax = vr.left + vr.width / 2; ay = vr.top + vr.height / 2; }
  for (const el of $$('.page', pagesEl)) { if (!el._vis) continue; const r = el.getBoundingClientRect(); if (ay >= r.top - 12 && ay <= r.bottom + 12) return { el, ax, ay, fx: (ax - r.left) / r.width, fy: (ay - r.top) / r.height }; }
  return null;
}
function setZoom(z, fit = false, ax, ay) {
  if (!S.pages.length) return;
  const ratio = viewer.scrollTop / Math.max(1, viewer.scrollHeight); const anc = zoomAnchor(ax, ay);
  S.fit = fit; S.zoom = fit ? fitZoom() : clamp(z, ZMIN, ZMAX);
  closeEditor(false);
  S.pages.forEach((p) => { const el = pageEl(p.id); const g = geo(p); el.style.width = g.w * S.zoom + 'px'; el.style.height = g.h * S.zoom + 'px'; el.style.setProperty('--total-scale-factor', S.zoom); el.style.setProperty('--scale-factor', S.zoom); if (el._vis) { el._ov = true; drawOverlay(p, el); drawForm(p, el); } else el._ov = false; });
  if (FIND.q) paintFind();
  if (anc && anc.el.isConnected) { const r = anc.el.getBoundingClientRect(); viewer.scrollLeft += r.left + anc.fx * r.width - anc.ax; viewer.scrollTop += r.top + anc.fy * r.height - anc.ay; }
  else viewer.scrollTop = ratio * viewer.scrollHeight;
  rerenderVisible(); updateZoomLbl();
  if (CMP.marks.size) setTimeout(paintCmp, 60);
}
function updateZoomLbl() { $('#zoomLbl').textContent = Math.round(S.zoom * 75) + '%'; try { navUpdate(); if (RUL.on) requestAnimationFrame(rulPlace); } catch (e) {} }
let resizeT; addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (S.fit && S.pages.length) setZoom(0, true); }, 150); });
viewer.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey) || !S.pages.length) return; e.preventDefault(); setZoom(S.zoom * Math.exp(-clamp(e.deltaY, -120, 120) * 0.0035), false, e.clientX, e.clientY); }, { passive: false });

/* ---------- Pointer interaction ---------- */
function ptFromEvent(e, el) { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom]; }
let drag = null, lastTap = { t: 0, id: null };
function addTextAt(p, pt, note) {
  const g = geo(p); const size = note ? Math.min(S.style.size, 11) : S.style.size; const r = tr(p);
  const a = { id: uid('a'), t: 'text', r, text: '', size, color: note ? '#000000' : S.style.ink, w: 1, h: 1, ax: 0, ay: 0 };
  Object.assign(a, pick(txDefaults(), TX_KEYS)); if (a.align === 'justify') a.align = 'left';
  if (note) a.bg = S.style.noteBg || '#fff3a6';
  const bx = textBox(a); a.w = bx.w; a.h = bx.h;
  const topLeftDisp = [pt[0], pt[1] - size * 0.6 - bx.pad];
  const [ax, ay] = ap(g.i, topLeftDisp[0], topLeftDisp[1] + a.h); a.ax = ax; a.ay = ay;
  p.annots.push(a); openEditor(p, a, true);
}
function addTextBoxAt(p, g, L, T, W, H) {
  const size = S.style.size; const a = Object.assign({ id: uid('a'), t: 'text', r: tr(p), text: '', size, color: S.style.ink, box: true, w: 1, h: 1, ax: 0, ay: 0 }, pick(txDefaults(), TX_KEYS), pick(bxDefaults(), BX_KEYS));
  if (!a.bg && !a.grad) delete a.bg;
  a.w = W || Math.min(Math.max(180, size * 14), g.w - L - 8); a.w = Math.max(a.w, size * 3); if (H) a.minH = H;
  const bx = textBox(a); a.h = bx.h; const [ax, ay] = ap(g.i, L, T + a.h); a.ax = ax; a.ay = ay;
  p.annots.push(a); openEditor(p, a, true);
}
pagesEl.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.page'); if (!el || e.button > 0) return;
  if (e.target.closest('.ff')) return;
  const p = pageById(el.dataset.id); const g = geo(p); const pt = ptFromEvent(e, el);
  const pdfPt = ap(g.i, pt[0], pt[1]);
  closeMenu();
  if (S.editing) { closeEditor(false); if (S.tool === 'text' || S.tool === 'tbox') { return; } }
  const tool = S.tool;
  if (INK.stylus && e.pointerType === 'touch' && INK_TOOLS.has(tool)) return;
  if (tool === 'eraser') { e.preventDefault(); drag = { mode: 'erase', p, el, g, start: pt, id: e.pointerId }; el.querySelector('svg.ov').setPointerCapture(e.pointerId); eraseAt(drag, pt); return; }
  if (tool === 'lasso') { e.preventDefault(); LASSO = { pageId: p.id, pts: [pt] }; drag = { mode: 'lasso', p, el, g, start: pt, id: e.pointerId }; el.querySelector('svg.ov').setPointerCapture(e.pointerId); return; }
  if (tool === 'edittext') {
    const hit = e.target.closest('.ann'); if (hit) { const a = p.annots.find((z) => z.id === hit.dataset.id); if (a && a.t === 'text') { e.preventDefault(); openEditor(p, a); } return; }
    const span = e.target.closest('.textLayer span'); e.preventDefault();
    if (!span) { if (!el._tlReady) toast('Text is still loading on this page'); else if (!el.querySelector('.textLayer span')) toast('This page has no editable text. It may be a scan. Use Whiteout and Text instead.'); return; }
    editExistingLine(p, el, span); return;
  }
  if (tool === 'objedit') { e.preventDefault(); objPointerDown(e, p, el, g, pt); return; }
  if (tool === 'select') {
    const h = e.target.closest('.handle, .handle-hit');
    const hit = e.target.closest('.ann');
    if (h && h.dataset.h === 'rot' && S.sel && S.sel.pageId === p.id) {
      const ids = selIds(); const list = p.annots.filter((z) => ids.includes(z.id) && ROTATABLE(z)); if (!list.length) return;
      const pv = list.length === 1 ? annCenter(list[0]) : selPivot(list); const c = ap(g.t, pv[0], pv[1]);
      drag = { mode: 'rotate', p, el, g, a: list[0], pivot: pv, c, a0: Math.atan2(pt[1] - c[1], pt[0] - c[0]), group: list.map((z) => ({ id: z.id, orig: JSON.parse(JSON.stringify(z)) })), start: pt, id: e.pointerId };
      e.preventDefault(); el.querySelector('svg.ov').setPointerCapture(e.pointerId); return;
    }
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
  if (tool === 'area') { areaClick(p, el, g, pt, pdfPt); return; }
  if (tool === 'tbox') {
    const hitText = [...p.annots].reverse().find((a) => a.t === 'text' && (() => { const b = dispBox(a, g); return pt[0] >= b.L && pt[0] <= b.R && pt[1] >= b.T && pt[1] <= b.B; })());
    if (hitText) { openEditor(p, hitText); return; }
    drag = { mode: 'tbox', p, el, g, start: pt, id: e.pointerId }; el.querySelector('svg.ov').setPointerCapture(e.pointerId); return;
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
  if (BOXES.has(tool)) { a = { id: uid('a'), t: tool, x: pdfPt[0], y: pdfPt[1], w: 0, h: 0, color: c(tool), width: S.style.width }; if (tool === 'shape') a.kind = S.shapeKind; if (FILLABLE.has(tool) && S.style.fill && S.style.fill !== 'none') { a.fill = S.style.fill === 'tint' ? a.color : S.style.fill; if (S.style.fill === 'tint') a.fop = 0.25; } }
  else if (tool === 'line' || tool === 'arrow' || tool === 'darrow' || tool === 'measure') { a = { id: uid('a'), t: tool === 'darrow' ? 'arrow' : tool, pts: [pdfPt, pdfPt.slice()], color: tool === 'measure' && S.style.ink === '#000000' ? '#d70015' : S.style.ink, width: tool === 'measure' ? Math.min(S.style.width, 1.5) : S.style.width }; if (tool === 'measure') a.sc = Object.assign({}, mscOf({})); if (tool === 'darrow') a.both = true; }
  else if (tool === 'pen') a = newInk(pdfPt, e);
  if (!a) return;
  p.annots.push(a);
  drag = { mode: 'create', p, el, g, a, start: pt, startPdf: pdfPt, id: e.pointerId };
  el.querySelector('svg.ov').setPointerCapture(e.pointerId);
});
let hovRaf = 0;
pagesEl.addEventListener('pointermove', (e) => {
  if (objPointerMove(e)) return;
  if (S.poly && S.tool === 'area' && !drag) { const el = e.target.closest('.page'); const p = el && pageById(el.dataset.id); if (p && p.id === S.poly.pageId) { const a = p.annots.find((z) => z.id === S.poly.id); if (a) { const g = geo(p); a._h = ap(g.i, ...ptFromEvent(e, el)); drawOverlay(p, el); } } }
  if (S.tool === 'objedit' && !drag && e.pointerType !== 'touch' && !hovRaf) { const ev = e; hovRaf = requestAnimationFrame(() => { hovRaf = 0; const el = ev.target.closest && ev.target.closest('.page'); const p = el && pageById(el.dataset.id); const c = p && objCtx(p); let nh = null; if (c && !c.parsed.err) { const g = geo(p); const pt = ptFromEvent(ev, el); const q = ap(g.i, pt[0], pt[1]); const h = objHits(c.doc, c.pi, c.parsed, q[0], q[1], 4 / S.zoom); if (h.length) nh = { pageId: p.id, id: h[0] }; } const was = OHOV; if ((was && was.pageId + was.id) !== (nh && nh.pageId + nh.id)) { OHOV = nh; if (was) { const wp = pageById(was.pageId); if (wp) drawOverlay(wp); } if (nh && (!was || was.pageId !== nh.pageId)) drawOverlay(p); } }); }
  if (!drag || e.pointerId !== drag.id) return;
  const { p, el, g, a } = drag; const pt = ptFromEvent(e, el); const pdfPt = ap(g.i, pt[0], pt[1]);
  if (drag.mode === 'erase') { eraseAt(drag, pt); return; }
  if (drag.mode === 'lasso') { const lp = LASSO.pts[LASSO.pts.length - 1]; if (Math.hypot(pt[0] - lp[0], pt[1] - lp[1]) * S.zoom > 2) { LASSO.pts.push(pt); drawOverlay(p, el); } return; }
  if (drag.mode === 'tbox') { MARQ = { pageId: p.id, L: Math.min(pt[0], drag.start[0]), T: Math.min(pt[1], drag.start[1]), R: Math.max(pt[0], drag.start[0]), B: Math.max(pt[1], drag.start[1]) }; drawOverlay(p, el); return; }
  if (drag.mode === 'crop') { drag.cur = pdfPt; const [x0, y0] = drag.startPdf; p.crop = [Math.min(x0, pdfPt[0]), Math.min(y0, pdfPt[1]), Math.max(x0, pdfPt[0]), Math.max(y0, pdfPt[1])]; drawOverlay(p, el); return; }
  if (drag.mode === 'create') {
    if (drag.snapped) return;
    if (BOXES.has(a.t)) { const [x0, y0] = drag.startPdf; let dx = pdfPt[0] - x0, dy = pdfPt[1] - y0; if (e.shiftKey && FILLABLE.has(a.t)) { const m = Math.max(Math.abs(dx), Math.abs(dy)); dx = (dx < 0 ? -1 : 1) * m; dy = (dy < 0 ? -1 : 1) * m; } a.x = Math.min(x0, x0 + dx); a.y = Math.min(y0, y0 + dy); a.w = Math.abs(dx); a.h = Math.abs(dy); }
    else if (a.t === 'pen') { const n0 = a.pts.length; inkMove(drag, e, el, g); if (a.pts.length > n0) { const d = drag; clearTimeout(d.snapT); if (INK.snap) d.snapT = setTimeout(() => { if (drag === d) trySnapPen(d); }, 650); } }
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
  if (drag.mode === 'rotate') {
    let deg = (Math.atan2(pt[1] - drag.c[1], pt[0] - drag.c[0]) - drag.a0) * 180 / Math.PI; deg = snapDeg(((deg + 540) % 360) - 180, e.shiftKey);
    for (const it of drag.group) { const f = JSON.parse(JSON.stringify(it.orig)); rotateAnn(f, -deg, drag.pivot); const i = p.annots.findIndex((z) => z.id === it.id); if (i >= 0) p.annots[i] = f; if (it.id === drag.a.id) drag.a = f; }
    ROTLBL = { pageId: p.id, x: pt[0] + 14 / S.zoom, y: pt[1] - 10 / S.zoom, t: (deg > 0 ? '+' : '') + deg + '°' };
    drawOverlay(p, el); return;
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
    const uniform = (ORIENTED.has(a.t) && !(a.t === 'text' && a.box)) || e.shiftKey; if (uniform && !ORIENTED.has(a.t)) { const s = Math.max(sx, sy); sx = sy = s; }
    applyT(fresh, pdfAffineFromDisplay(g, (x, y) => [b.L + (x - b.L) * sx, b.T + (y - b.T) * sy]), uniform);
    if (ORIENTED.has(a.t)) { const nb = dispBox(fresh, g); applyT(fresh, pdfAffineFromDisplay(g, (x, y) => [x + b.L - nb.L, y + b.T - nb.T])); }
  }
  p.annots[idx] = fresh; drag.a = fresh; drawOverlay(p, el);
});
function endDrag(e) {
  if (objPointerUp(e)) return;
  if (!drag || e.pointerId !== drag.id) return;
  const drag0 = drag; clearTimeout(drag0.snapT); const { p, el, a, mode, moved, group } = drag; drag = null;
  if (mode === 'erase') { if (drag0.n) commit(); return; }
  if (mode === 'lasso') { lassoSelect(drag0); return; }
  if (mode === 'create' && a && a.t === 'pen' && !drag0.snapped) inkFinish(drag0);
  if (mode === 'marquee') { MARQ = null; drawOverlay(p, el); refreshFormatBar(); return; }
  if (mode === 'rotate') { ROTLBL = null; }
  if (mode === 'tbox') { const m = MARQ; MARQ = null; const g = geo(p); let L = drag0.start[0], T = drag0.start[1], W = 0, H = 0; if (m && (m.R - m.L) * S.zoom > 12) { L = m.L; T = m.T; W = m.R - m.L; H = (m.B - m.T) * S.zoom > 12 ? m.B - m.T : 0; } addTextBoxAt(p, g, L, T, W, H); return; }
  if (mode === 'move') { GUIDES = null; if (!moved && group && group.length > 1) { S.sel = { pageId: p.id, annId: a.id }; } }
  if (mode === 'crop') { const c = p.crop; const g = geo(p); if (c) { const d1 = ap(g.t, c[0], c[1]), d2 = ap(g.t, c[2], c[3]); if (Math.abs(d2[0] - d1[0]) * S.zoom < 20 || Math.abs(d2[1] - d1[1]) * S.zoom < 20) p.crop = null; } drawOverlay(p, el); commit(); refreshFormatBar(); return; }
  if (mode === 'create') {
    let keep = true; const g = geo(p); const b = dispBox(a, g); const big = Math.max(b.R - b.L, b.B - b.T) * S.zoom;
    if (BOXES.has(a.t) && big < 6) {
      if (FILLABLE.has(a.t) || a.t === 'cloud') { const sw2 = a.t === 'shape' && /^(arrR|arrL|arrLR|wave|ribbon|fterm|homeplate|chevron|notched)$/.test(a.kind) ? 96 : 72, sh2 = /^(arrU|arrD|arrUD|cylinder|fdb|lightning|moon)$/.test(a.kind || '') ? 96 : (sw2 === 96 ? 48 : (a.t === 'rect' || a.t === 'ellipse' || a.t === 'cloud' || /^(rrect|snip|snip2|frame|para|trap|fdata|falt|fpredef|fdoc|finput|fmanual|fcard|fdelay|fdisplay|callRect|callRound|callOval|callCloud|callLine|plaque)$/.test(a.kind) ? 54 : 72)); const [cx0, cy0] = ap(g.i, b.L, b.T); a.w = sw2; a.h = sh2; a.x = cx0 - sw2 / 2; a.y = cy0 - sh2 / 2; }
      else if (a.t === 'white' || a.t === 'hl' || a.t === 'redact') { const [ax, ay] = ap(g.i, b.L - 50, b.T + 8); const [bx, by] = ap(g.i, b.L + 50, b.T - 8); a.x = Math.min(ax, bx); a.y = Math.min(ay, by); a.w = Math.abs(bx - ax); a.h = Math.abs(by - ay); }
      else keep = false;
    } else if ((a.t === 'line' || a.t === 'arrow' || a.t === 'measure') && big < 6) { if (a.t === 'line' || a.t === 'arrow') { a.pts[1] = [a.pts[0][0] + 72, a.pts[0][1]]; } else keep = false; }
    else if (a.t === 'pen' && a.pts.length < 2) { a.pts.push([a.pts[0][0] + 0.01, a.pts[0][1]]); }
    if (!keep) p.annots = p.annots.filter((z) => z.id !== a.id);
    if (keep && drag0.snapped && drag0.freehand) { const k = p.annots.findIndex((z) => z.id === a.id); if (k >= 0) { p.annots[k] = drag0.freehand; commit(); p.annots[k] = a; } }
    drawOverlay(p, el); commit(); return;
  }
  drawOverlay(p, el); commit(); refreshFormatBar();
}
pagesEl.addEventListener('pointerup', endDrag);
pagesEl.addEventListener('pointercancel', endDrag);
pagesEl.addEventListener('dblclick', (e) => {
  if (S.poly) { e.preventDefault(); finishPoly(); return; }
  const hit = e.target.closest('.ann'); const el = e.target.closest('.page'); if (!hit || !el) return;
  const p = pageById(el.dataset.id); const a = p.annots.find((z) => z.id === hit.dataset.id); if (a && a.t === 'text') openEditor(p, a); else if (a && a.t === 'image') openImageEditor(p, a);
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
    if (n === 1 && a.t === 'image') items.push({ label: 'Edit image…', icon: 'photo', run: () => openImageEditor(p, a) }, { label: 'Bring to front', icon: 'up', run: () => imgZ('front') }, { label: 'Send to back', icon: 'down', run: () => imgZ('back') });
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
function annLabel(a) { return ({ measure: 'Measurement', area: 'Area', cloud: 'Revision cloud', text: a.box ? 'Text box' : a.bg ? 'Note' : a.border ? 'Stamp' : 'Text', white: 'Whiteout', hl: 'Highlight', redact: 'Redaction', rect: 'Rectangle', ellipse: 'Ellipse', shape: shapeLabel(a.kind), line: 'Line', arrow: a.both ? 'Double arrow' : 'Arrow', pen: a.pen ? penDef(a.pen)[1] : 'Drawing', image: 'Image', stamp: 'Stamp', sign: 'Signature', mark: a.kind === 'hl' ? 'Text highlight' : 'Text markup', tick: 'Tick', cross: 'Cross' })[a.t] || 'Item'; }

/* ---------- Edit PDF objects: text, shapes, lines and images inside the page content ---------- */
// The original content stream is parsed once per page. Edits are kept per object index and applied by
// rewriting that stream: deleted objects are cut out, changed ones are wrapped in q <matrix> cm <colour> ... Q.
// Duplicates are stored as extra records ('d1', 'd2' ...) that repeat the source object's operators under a new matrix.
const EDK = '\u0001objedits';
const OBJ = { cache: new Map(), loading: new Map(), lib: new Map(), opdf: new Map() };
let OSEL = null, OHOV = null, ODRAG = null, OBOX = false, OCLIP = null;
const docEdits = (d) => d.values[EDK] || (d.values[EDK] = {});
const I6 = [1, 0, 0, 1, 0, 0];
const mul6 = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
function latin1(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return s; }
function unlatin1(s) { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
async function origLib(doc) { if (!OBJ.lib.has(doc.id)) OBJ.lib.set(doc.id, PL.PDFDocument.load(doc.bytes, { updateMetadata: false })); return OBJ.lib.get(doc.id); }
// pdf.js copy of the untouched file, used to measure the original text positions
async function origPdf(doc) { if (!OBJ.opdf.has(doc.id)) OBJ.opdf.set(doc.id, doc.ebytes ? pdfjsLib.getDocument({ ...PDFJS_OPTS, data: doc.bytes.slice(), password: doc.password || undefined }).promise : Promise.resolve(doc.pdf)); return OBJ.opdf.get(doc.id); }
const bbOf = (pts) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let k = 0; k < pts.length; k += 2) { const x = pts[k], y = pts[k + 1]; if (x !== x) continue; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; };
const cutBB = (b, clip) => (clip ? [Math.max(b[0], clip[0]), Math.max(b[1], clip[1]), Math.min(b[2], clip[2]), Math.min(b[3], clip[3])] : b);
const okBB = (b) => isFinite(b[0]) && b[2] >= b[0] && b[3] >= b[1];
function pageObjs(doc, pi) {
  const key = doc.id + '|' + pi; if (OBJ.cache.has(key)) return OBJ.cache.get(key);
  if (!OBJ.loading.has(key)) OBJ.loading.set(key, (async () => {
    try {
      const ld = await origLib(doc); const node = ld.getPage(pi).node; const c = node.Contents(); const list = [];
      if (c instanceof PL.PDFArray) { for (let i = 0; i < c.size(); i++) list.push(c.lookup(i)); } else if (c) list.push(c);
      let src = ''; for (const st of list) { if (!st) continue; const b = st instanceof PL.PDFRawStream ? PL.decodePDFRawStream(st).decode() : st.getContents(); src += latin1(b) + '\n'; }
      const res = node.Resources(); const xo = res ? res.lookup(PL.PDFName.of('XObject')) : null;
      const parsed = parseContent(src, xo);
      if (parsed.objs.some((o) => o.k === 'text')) { try { await measureText(doc, pi, parsed); } catch (e) { console.warn('text bounds', e); } }
      for (const o of parsed.objs) if (o.k === 'text') o.bb = cutBB(o.bb, o.clip);
      parsed.objs = parsed.objs.filter((o) => okBB(o.bb));
      OBJ.cache.set(key, parsed);
    } catch (e) { console.warn('objects', e); OBJ.cache.set(key, { src: '', objs: [], err: true }); }
    OBJ.loading.delete(key); const p = S.pages.find((z) => z.docId === doc.id && z.index === pi); if (p) { drawOverlay(p); refreshFormatBar(); }
  })());
  return null;
}
// Tighten text block bounds with pdf.js' measured glyph runs from the original file
async function measureText(doc, pi, parsed) {
  const pdf = await origPdf(doc); const pg = await pdf.getPage(pi + 1); const tc = await pg.getTextContent({ disableNormalization: true });
  const items = tc.items.filter((it) => it.str && it.transform).map((it) => { const t = it.transform; const sx = Math.hypot(t[0], t[1]) || 1, sy = Math.hypot(t[2], t[3]) || 1; const ux = [t[0] / sx, t[1] / sx], uy = [t[2] / sy, t[3] / sy]; const w = it.width || 0, h = it.height || sy; const o = [t[4], t[5]]; const at = (u, v) => [o[0] + u * ux[0] + v * uy[0], o[1] + u * ux[1] + v * uy[1]]; const pts = [...at(0, -0.25 * h), ...at(w, -0.25 * h), ...at(0, h), ...at(w, h)]; return { x: o[0], y: o[1], h, pts, used: false }; });
  for (const o of parsed.objs) {
    if (o.k !== 'text') continue; const pts = [];
    for (const r of o.runs) { const tol = Math.max(1.5, r.fs * 0.45); let hit = false; for (const it of items) { if (Math.abs(it.x - r.x) <= tol && Math.abs(it.y - r.y) <= tol) { pts.push(...it.pts); hit = true; } } if (!hit) pts.push(...r.pts); }
    if (pts.length) o.bb = bbOf(pts);
  }
}
function parseContent(src, xo) {
  const n = src.length; let i = 0; const objs = []; let ctm = I6.slice(), lw = 1, clip = null; const stk = []; let ops = [], opStart = -1, path = null;
  // text state
  let fs = 10, TL = 0, Tz = 100, Ts = 0, Tm = I6, Tlm = I6, tb = null;
  const isWS = (c) => c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0;
  const isDel = (c) => c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37;
  const skipStr = () => { let d = 0; for (; i < n; i++) { const c = src.charCodeAt(i); if (c === 92) { i++; continue; } if (c === 40) d++; else if (c === 41) { d--; if (!d) { i++; return; } } } };
  const skipArr = () => { let d = 0, len = 0; while (i < n) { const c = src.charCodeAt(i); if (c === 40) { const a = i; skipStr(); len += Math.max(0, i - a - 2); continue; } if (c === 60 && src.charCodeAt(i + 1) !== 60) { const a = i; while (i < n && src.charCodeAt(i) !== 62) i++; i++; len += Math.max(0, (i - a - 2) / 2); continue; } if (c === 91) d++; else if (c === 93) { d--; if (!d) { i++; return len; } } i++; } return len; };
  const skipDict = () => { let d = 0; while (i < n) { if (src.charCodeAt(i) === 40) { skipStr(); continue; } if (src.startsWith('<<', i)) { d++; i += 2; continue; } if (src.startsWith('>>', i)) { d--; i += 2; if (!d) return; continue; } i++; } };
  const unit = (m) => { const pts = []; for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) pts.push(u * m[0] + v * m[2] + m[4], u * m[1] + v * m[3] + m[5]); return pts; };
  const addPt = (x, y) => { path.pts.push(x * ctm[0] + y * ctm[2] + ctm[4], x * ctm[1] + y * ctm[3] + ctm[5]); };
  const num = (k) => +ops[ops.length - k];
  const cut = (b) => cutBB(b, clip);
  const td = (tx, ty) => { Tlm = mul6([1, 0, 0, 1, tx, ty], Tlm); Tm = Tlm; };
  const show = (len) => {
    if (!tb) return; const M = mul6(mul6([fs * Tz / 100, 0, 0, fs, 0, Ts], Tm), ctm); const wE = Math.max(0.3, len * 0.52);
    const at = (u, v) => [u * M[0] + v * M[2] + M[4], u * M[1] + v * M[3] + M[5]];
    const scl = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) || fs;
    tb.runs.push({ x: M[4], y: M[5], fs: scl, pts: [...at(0, -0.22), ...at(wE, -0.22), ...at(0, 0.8), ...at(wE, 0.8)] });
    Tm = mul6([1, 0, 0, 1, wE * fs * Tz / 100, 0], Tm);
  };
  while (i < n) {
    const c = src.charCodeAt(i);
    if (isWS(c)) { i++; continue; }
    if (c === 37) { while (i < n && src.charCodeAt(i) !== 10 && src.charCodeAt(i) !== 13) i++; continue; }
    const t0 = i; if (opStart < 0) opStart = t0;
    if (c === 40) { skipStr(); ops.push({ len: Math.max(0, i - t0 - 2) }); continue; }
    if (c === 91) { const len = skipArr(); ops.push({ len }); continue; }
    if (c === 60) { if (src.charCodeAt(i + 1) === 60) { skipDict(); ops.push('<<>>'); } else { while (i < n && src.charCodeAt(i) !== 62) i++; i++; ops.push({ len: Math.max(0, (i - t0 - 2) / 2) }); } continue; }
    if (c === 47) { i++; while (i < n && !isWS(src.charCodeAt(i)) && !isDel(src.charCodeAt(i))) i++; ops.push(src.slice(t0, i)); continue; }
    if (c === 41 || c === 62 || c === 93 || c === 123 || c === 125) { i++; continue; }
    while (i < n && !isWS(src.charCodeAt(i)) && !isDel(src.charCodeAt(i))) i++;
    const tk = src.slice(t0, i);
    if (/^[+\-.\d]/.test(tk)) { ops.push(tk); continue; }
    const s = opStart, e = i; const last = ops[ops.length - 1];
    switch (tk) {
      case 'q': stk.push([ctm, lw, clip, fs, TL, Tz, Ts]); break;
      case 'Q': if (stk.length) [ctm, lw, clip, fs, TL, Tz, Ts] = stk.pop(); break;
      case 'cm': if (ops.length >= 6) ctm = mul6([num(6), num(5), num(4), num(3), num(2), num(1)], ctm); break;
      case 'w': lw = num(1) || 0; break;
      case 'm': case 'l': if (!path) path = { s, pts: [], lw, ctm }; if (tk === 'm' && path.pts.length) path.pts.push(NaN, NaN); addPt(num(2), num(1)); break;
      case 'c': if (!path) path = { s, pts: [], lw, ctm }; addPt(num(6), num(5)); addPt(num(4), num(3)); addPt(num(2), num(1)); break;
      case 'v': case 'y': if (!path) path = { s, pts: [], lw, ctm }; addPt(num(4), num(3)); addPt(num(2), num(1)); break;
      case 're': { if (!path) path = { s, pts: [], lw, ctm }; if (path.pts.length) path.pts.push(NaN, NaN); const x = num(4), y = num(3), w = num(2), h = num(1); addPt(x, y); addPt(x + w, y); addPt(x + w, y + h); addPt(x, y + h); addPt(x, y); break; }
      case 'h': break;
      case 'W': case 'W*': if (path) path.clip = true; break;
      case 'S': case 's': case 'f': case 'F': case 'f*': case 'B': case 'B*': case 'b': case 'b*': case 'n':
        if (path && path.clip && path.pts.length) clip = cut(bbOf(path.pts));
        if (path && !path.clip && tk !== 'n' && path.pts.length && okBB(cut(bbOf(path.pts)))) {
          const sc = Math.sqrt(Math.abs(ctm[0] * ctm[3] - ctm[1] * ctm[2])) || 1;
          objs.push({ k: 'path', s: path.s, e, bb: cut(bbOf(path.pts)), pts: Float32Array.from(path.pts), ctm: path.ctm, lw0: path.lw, lw: path.lw * sc, st: /^[SsBb]/.test(tk), fi: /^[fFBb]/.test(tk) });
        }
        path = null; break;
      case 'sh': if (clip) objs.push({ k: 'shade', s, e, bb: clip.slice(), ctm }); break;
      case 'Do': {
        const nm = last; let k = 'form', bb = null;
        try { const x = xo && nm ? xo.lookup(PL.PDFName.of(String(nm).slice(1))) : null; const dict = x && x.dict ? x.dict : x; const sub = dict && dict.get(PL.PDFName.of('Subtype')); if (sub && String(sub) === '/Image') { k = 'img'; bb = bbOf(unit(ctm)); } else if (dict) { const B = dict.lookup(PL.PDFName.of('BBox')); const M = dict.lookup(PL.PDFName.of('Matrix')); const m = M ? M.asArray().map((z) => z.asNumber()) : I6; const b = B ? B.asArray().map((z) => z.asNumber()) : [0, 0, 1, 1]; const mm = mul6(m, ctm); const pts = []; for (const [u, v] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) pts.push(u * mm[0] + v * mm[2] + mm[4], u * mm[1] + v * mm[3] + mm[5]); bb = bbOf(pts); } } catch (err) {}
        if (bb && okBB(cut(bb))) objs.push({ k, s, e, bb: cut(bb), ctm });
        break;
      }
      case 'BI': {
        const id = src.indexOf('ID', i); if (id < 0) { i = n; break; }
        const re = /\sEI(?=[\s%]|$)/g; re.lastIndex = id + 3; const m = re.exec(src); const end = m ? m.index + m[0].length : n; i = end;
        { const ib = cut(bbOf(unit(ctm))); if (okBB(ib)) objs.push({ k: 'img', s: t0, e: end, bb: ib, ctm, inl: true }); } break;
      }
      // text objects
      case 'BT': tb = { s: t0, runs: [], col: [], ctm, clip }; Tm = Tlm = I6; break;
      case 'ET': if (tb) { if (tb.runs.length) { const pts = []; tb.runs.forEach((r) => pts.push(...r.pts)); objs.push({ k: 'text', s: tb.s, e, bb: bbOf(pts), runs: tb.runs, col: tb.col, ctm: tb.ctm, clip: tb.clip }); } tb = null; } break;
      case 'Tf': fs = num(1) || fs; break;
      case 'TL': TL = num(1) || 0; break;
      case 'Tz': Tz = num(1) || 100; break;
      case 'Ts': Ts = num(1) || 0; break;
      case 'Td': td(num(2) || 0, num(1) || 0); break;
      case 'TD': TL = -(num(1) || 0); td(num(2) || 0, num(1) || 0); break;
      case 'Tm': if (ops.length >= 6) { Tlm = [num(6), num(5), num(4), num(3), num(2), num(1)]; Tm = Tlm; } break;
      case 'T*': td(0, -TL); break;
      case 'Tj': case 'TJ': show(last && last.len != null ? last.len : 1); break;
      case "'": td(0, -TL); show(last && last.len != null ? last.len : 1); break;
      case '"': td(0, -TL); show(last && last.len != null ? last.len : 1); break;
      case 'g': case 'rg': case 'k': case 'sc': case 'scn': case 'cs': if (tb) tb.col.push([s, e]); break;
      default: break;
    }
    ops = []; opStart = -1;
  }
  return { src, objs };
}
const objRec = (doc, pi, id) => { const ed = doc.values[EDK]; return ed && ed[pi] && ed[pi][id]; };
const isDupId = (id) => typeof id === 'string' && id[0] === 'd';
// Every live object on a page, originals and duplicates: [{ id, o, r }]
function objList(doc, pi, parsed) {
  const ed = (doc.values[EDK] || {})[pi] || {}; const out = [];
  parsed.objs.forEach((o, id) => { const r = ed[id]; if (!(r && r.del)) out.push({ id, o, r }); });
  for (const k in ed) { if (!isDupId(k)) continue; const r = ed[k]; const o = parsed.objs[r.src]; if (o && !r.del) out.push({ id: k, o, r }); }
  return out;
}
const objOf = (c, id) => (isDupId(id) ? c.parsed.objs[(objRec(c.doc, c.pi, id) || {}).src] : c.parsed.objs[id]);
function objBox(o, r) {
  const b = o.bb; if (!r || !r.A) return b; const A = r.A; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) { const X = x * A[0] + y * A[2] + A[4], Y = x * A[1] + y * A[3] + A[5]; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
  return [x0, y0, x1, y1];
}
function segDist(px, py, pts) {
  let best = Infinity;
  for (let k = 2; k < pts.length; k += 2) {
    const x0 = pts[k - 2], y0 = pts[k - 1], x1 = pts[k], y1 = pts[k + 1]; if (x0 !== x0 || x1 !== x1) continue;
    const dx = x1 - x0, dy = y1 - y0, L = dx * dx + dy * dy; let t = L ? ((px - x0) * dx + (py - y0) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = x0 + t * dx - px, ey = y0 + t * dy - py; const d = ex * ex + ey * ey; if (d < best) best = d;
  }
  return Math.sqrt(best);
}
// All objects under a PDF point, best match first.
function objHits(doc, pi, parsed, x, y, tol) {
  const out = [];
  for (const { id, o, r } of objList(doc, pi, parsed)) {
    let qx = x, qy = y; if (r && r.A) { const iv = inv(r.A); qx = x * iv[0] + y * iv[2] + iv[4]; qy = x * iv[1] + y * iv[3] + iv[5]; }
    const pad = tol + (o.lw || 0) / 2; const b = o.bb;
    if (qx < b[0] - pad || qx > b[2] + pad || qy < b[1] - pad || qy > b[3] + pad) continue;
    const area = Math.max(1, (b[2] - b[0]) * (b[3] - b[1]));
    if (o.k === 'path' && !o.fi) { if (segDist(qx, qy, o.pts) > pad) continue; out.push([area * 0.2, id]); }
    else if (o.k === 'text') out.push([area * 0.5, id]);
    else if (o.k === 'shade') out.push([area * 4, id]);
    else out.push([area, id]);
  }
  return out.sort((a, b) => a[0] - b[0]).map((z) => z[1]);
}
function editedContent(parsed, recs) {
  const src = parsed.src; const f = (v) => String(Math.round(v * 1e6) / 1e6);
  const rgb = (h) => { const c = hexRgb(h); return [c.red, c.green, c.blue].map(f).join(' '); };
  const dups = new Map(); for (const k in recs) { if (!isDupId(k)) continue; const r = recs[k]; if (r.del || !parsed.objs[r.src]) continue; if (!dups.has(r.src)) dups.set(r.src, []); dups.get(r.src).push(r); }
  const ids = [...new Set([...Object.keys(recs).filter((k) => !isDupId(k)).map(Number), ...dups.keys()])].filter((k) => parsed.objs[k]).sort((a, b) => a - b);
  const body = (o, r) => {
    let txt = src.slice(o.s, o.e);
    if (o.k === 'text' && r && r.fc) { let t = ''; let p = o.s; for (const [a, b] of o.col) { t += src.slice(p, a); p = b; } t += src.slice(p, o.e); txt = t.replace(/^BT/, 'BT ' + rgb(r.fc) + ' rg '); }
    return txt;
  };
  const wrap = (o, r) => {
    if (!r || (!r.A && !r.sc && !r.fc && !r.wm)) return ' q ' + body(o, r) + ' Q ';
    let pre = ' q ';
    if (r.A) { const M = mul6(mul6(o.ctm, r.A), inv(o.ctm)); pre += M.map(f).join(' ') + ' cm '; }
    if (r.sc && o.k === 'path') pre += rgb(r.sc) + ' RG ';
    if (r.fc && o.k === 'path') pre += rgb(r.fc) + ' rg ';
    if (r.wm && o.k === 'path') pre += f(Math.max(0.01, (o.lw0 || 1) * r.wm)) + ' w ';
    return pre + body(o, r) + ' Q ';
  };
  let out = '', pos = 0;
  for (const id of ids) {
    const o = parsed.objs[id], r = recs[id]; if (o.s < pos) continue;
    out += src.slice(pos, o.s); pos = o.e;
    if (r && r.del) out += ' '; else if (r) out += wrap(o, r); else out += src.slice(o.s, o.e);
    for (const d of dups.get(id) || []) out += wrap(o, d);
  }
  return out + src.slice(pos);
}
async function rebuildDoc(doc) {
  if (doc._rb) { doc._rbAgain = true; return doc._rb; }
  doc._rb = (async () => {
    let t = null; const tt = setTimeout(() => { t = toast('Updating page', { spin: true, sticky: true }); }, 350);
    try {
      do {
        doc._rbAgain = false; const ed = doc.values[EDK] || {}; const json = JSON.stringify(ed); doc._edJ = json;
        const pis = Object.keys(ed).filter((k) => Object.keys(ed[k]).length);
        let bytes = null;
        if (pis.length) {
          if (!OBJ.opdf.has(doc.id)) OBJ.opdf.set(doc.id, Promise.resolve(doc.pdf));
          const ld = await PL.PDFDocument.load(doc.bytes, { updateMetadata: false });
          for (const k of pis) { const pi = +k; let parsed = OBJ.cache.get(doc.id + '|' + pi); if (!parsed) { pageObjs(doc, pi); await OBJ.loading.get(doc.id + '|' + pi); parsed = OBJ.cache.get(doc.id + '|' + pi); } if (!parsed || parsed.err) continue; const st = ld.context.flateStream(unlatin1(editedContent(parsed, ed[k]))); ld.getPage(pi).node.set(PL.PDFName.of('Contents'), ld.context.register(st)); }
          bytes = await ld.save({ useObjectStreams: false });
        }
        if (doc._rbAgain) continue;
        const old = doc.pdf; doc.ebytes = bytes;
        doc.pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: (bytes || doc.bytes).slice(), password: doc.password || undefined }).promise;
        refreshDocPages(doc); const keep = OBJ.opdf.get(doc.id); setTimeout(() => { keep && keep.then((kp) => { if (kp === old) return; try { old.destroy(); } catch (e) {} }); if (!keep) { try { old.destroy(); } catch (e) {} } }, 4000);
      } while (doc._rbAgain);
    } catch (e) { console.error(e); toast('Could not apply that change to this PDF', { err: true }); }
    clearTimeout(tt); if (t) t.remove(); doc._rb = null;
  })();
  return doc._rb;
}
function refreshDocPages(doc) {
  for (const p of S.pages) {
    if (p.docId !== doc.id) continue;
    for (const k of [...thumbCache.keys()]) if (k.startsWith(p.id + '|')) thumbCache.delete(k);
    for (const k of [...SNAP.keys()]) if (k.startsWith(p.id + '|')) SNAP.delete(k);
    const el = pageEl(p.id); if (el) { el._key = null; el._scale = 0; el._err = null; hideDetail(el); drawOverlay(p, el); }
    const tb = sbList.querySelector(`.thumb[data-id="${p.id}"]`); if (tb) { tb._seen = false; scheduleThumb(p.id); }
  }
  queueRender();
}
function syncEditsAfterRestore() { for (const d of S.docs.values()) { const j = JSON.stringify(d.values[EDK] || {}); if (j !== (d._edJ || '{}')) rebuildDoc(d); } OSEL = null; }
function objCtx(p) { if (!p || p.kind !== 'pdf') return null; const doc = S.docs.get(p.docId); if (!doc || doc.encrypted) return null; const parsed = pageObjs(doc, p.index); return parsed ? { doc, parsed, pi: p.index } : null; }
function osel() { if (!OSEL) return null; const p = pageById(OSEL.pageId); const c = objCtx(p); if (!c) return null; return Object.assign({ p, ids: OSEL.ids }, c); }
function objDispBox(c, g, id) { const o = objOf(c, id); if (!o) return null; const b = objBox(o, objRec(c.doc, c.pi, id)); const d1 = ap(g.t, b[0], b[1]), d2 = ap(g.t, b[2], b[3]); return { L: Math.min(d1[0], d2[0]), T: Math.min(d1[1], d2[1]), R: Math.max(d1[0], d2[0]), B: Math.max(d1[1], d2[1]) }; }
function objSelBoxes(c, g) { return c.ids.map((id) => objDispBox(c, g, id)).filter(Boolean); }
function drawObjUi(p, g, ui) {
  if (S.tool !== 'objedit') return;
  const pad = 2 / S.zoom;
  if (OHOV && OHOV.pageId === p.id && !(OSEL && OSEL.pageId === p.id && OSEL.ids.includes(OHOV.id))) { const c = objCtx(p); const b = c && objDispBox(c, g, OHOV.id); if (b) ui.appendChild(sv('rect', { class: 'objhov', x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad })); }
  const c = osel(); if (!c || c.p.id !== p.id || !c.ids.length) return;
  const gr = sv('g', {}); if (ODRAG && ODRAG.D) gr.setAttribute('transform', `matrix(${ODRAG.D.join(' ')})`);
  const bs = objSelBoxes(c, g); if (!bs.length) return; let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
  for (const b of bs.length > 400 ? [] : bs) gr.appendChild(sv('rect', { class: 'objsel', x: b.L - pad, y: b.T - pad, width: b.R - b.L + 2 * pad, height: b.B - b.T + 2 * pad }));
  for (const b of bs) { L = Math.min(L, b.L); T = Math.min(T, b.T); R = Math.max(R, b.R); B = Math.max(B, b.B); }
  const p2 = 5 / S.zoom, r = 7 / S.zoom;
  gr.appendChild(sv('rect', { class: 'selgroup', x: L - p2, y: T - p2, width: R - L + 2 * p2, height: B - T + 2 * p2 }));
  gr.appendChild(sv('circle', { class: 'handle-hit', 'data-oh': 'se', cx: R + p2, cy: B + p2, r: r * 2.4 }));
  gr.appendChild(sv('circle', { class: 'handle', 'data-oh': 'se', cx: R + p2, cy: B + p2, r }));
  rotHandle(gr, { L, T, R, B }, p2, 'data-oh');
  ui.appendChild(gr); OSEL.box = { L, T, R, B };
  if (ROTLBL && ROTLBL.pageId === p.id) { const t = sv('text', { class: 'rotlbl', x: ROTLBL.x, y: ROTLBL.y, 'font-size': 12 / S.zoom }); t.textContent = ROTLBL.t; ui.appendChild(t); }
}
const rotD = (deg, cx, cy) => { const r = deg * Math.PI / 180, co = Math.cos(r), si = Math.sin(r); return [co, si, -si, co, cx - cx * co + cy * si, cy - cx * si - cy * co]; };
function objPointerDown(e, p, el, g, pt) {
  const c = objCtx(p);
  if (!c) { if (p.kind !== 'pdf') toast('This page is an image or blank page. Only PDF pages have contents to edit.'); else if (S.docs.get(p.docId).encrypted) toast('This PDF is protected, so its contents cannot be edited.'); else toast('Reading the contents of this page'); return; }
  if (c.parsed.err) { toast('This page could not be read for editing'); return; }
  const pdfPt = ap(g.i, pt[0], pt[1]); const tol = 4 / S.zoom;
  const onHandle = e.target.closest('[data-oh]'); const b = OSEL && OSEL.pageId === p.id && OSEL.box;
  if (onHandle && b && onHandle.dataset.oh === 'rot') { const cx = (b.L + b.R) / 2, cy = (b.T + b.B) / 2; ODRAG = { mode: 'rot', p, el, g, start: pt, c: [cx, cy], a0: Math.atan2(pt[1] - cy, pt[0] - cx), id: e.pointerId }; }
  else if (onHandle && b) { ODRAG = { mode: 'scale', p, el, g, start: pt, box: b, id: e.pointerId }; }
  else {
    const hits = OBOX && !(b && pt[0] >= b.L && pt[0] <= b.R && pt[1] >= b.T && pt[1] <= b.B) ? [] : objHits(c.doc, c.pi, c.parsed, pdfPt[0], pdfPt[1], tol);
    const inSel = b && pt[0] >= b.L && pt[0] <= b.R && pt[1] >= b.T && pt[1] <= b.B && OSEL.ids.length > 1;
    if (hits.length && (e.shiftKey || e.metaKey || e.ctrlKey)) { const id = hits[0]; const ids = OSEL && OSEL.pageId === p.id ? OSEL.ids.slice() : []; const k = ids.indexOf(id); if (k >= 0) ids.splice(k, 1); else ids.push(id); OSEL = { pageId: p.id, ids, hits }; drawOverlay(p, el); refreshFormatBar(); return; }
    if (inSel || (hits.length && OSEL && OSEL.pageId === p.id && OSEL.ids.includes(hits[0]))) { /* keep selection */ }
    else if (hits.length) OSEL = { pageId: p.id, ids: [hits[0]], hits, hi: 0 };
    else { const keep = (e.shiftKey || OBOX) && OSEL && OSEL.pageId === p.id ? OSEL.ids.slice() : []; OSEL = null; ODRAG = { mode: 'marq', p, el, g, start: pt, id: e.pointerId, base: keep }; el.querySelector('svg.ov').setPointerCapture(e.pointerId); drawOverlay(p, el); refreshFormatBar(); return; }
    ODRAG = { mode: 'move', p, el, g, start: pt, id: e.pointerId, alt: e.altKey };
  }
  el.querySelector('svg.ov').setPointerCapture(e.pointerId); drawOverlay(p, el); refreshFormatBar();
}
function objPointerMove(e) {
  if (!ODRAG || e.pointerId !== ODRAG.id) return false;
  const { p, el, start } = ODRAG; const pt = ptFromEvent(e, el); const dx = pt[0] - start[0], dy = pt[1] - start[1];
  if (!ODRAG.moved && Math.hypot(dx, dy) * S.zoom < 3) return true; ODRAG.moved = true;
  if (ODRAG.mode === 'marq') { MARQ = { pageId: p.id, L: Math.min(pt[0], start[0]), T: Math.min(pt[1], start[1]), R: Math.max(pt[0], start[0]), B: Math.max(pt[1], start[1]) }; }
  else if (ODRAG.mode === 'move') { let mx = dx, my = dy; if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) my = 0; else mx = 0; } ODRAG.D = [1, 0, 0, 1, mx, my]; }
  else if (ODRAG.mode === 'rot') { const [cx, cy] = ODRAG.c; let deg = (Math.atan2(pt[1] - cy, pt[0] - cx) - ODRAG.a0) * 180 / Math.PI; deg = snapDeg(((deg + 540) % 360) - 180, e.shiftKey); ODRAG.D = rotD(deg, cx, cy); ROTLBL = { pageId: p.id, x: pt[0] + 14 / S.zoom, y: pt[1] - 10 / S.zoom, t: (deg > 0 ? '+' : '') + deg + '°' }; }
  else { const b = ODRAG.box; const W0 = Math.max(1e-3, b.R - b.L), H0 = Math.max(1e-3, b.B - b.T); let sx = Math.max(0.05, (W0 + dx) / W0), sy = Math.max(0.05, (H0 + dy) / H0); const c = osel(); const uni = e.shiftKey || (c && c.ids.every((id) => { const o = objOf(c, id); return o && o.k !== 'path'; })); if (uni) sx = sy = Math.max(sx, sy); ODRAG.D = [sx, 0, 0, sy, b.L - b.L * sx, b.T - b.T * sy]; }
  drawOverlay(p, el); return true;
}
function objPointerUp(e) {
  if (!ODRAG || e.pointerId !== ODRAG.id) return false;
  const d = ODRAG; ODRAG = null; ROTLBL = null; const { p, el, g } = d;
  if (d.mode === 'marq') {
    const m = MARQ; MARQ = null; const c = objCtx(p);
    if (m && c) { const ids = []; for (const { id } of objList(c.doc, c.pi, c.parsed)) { const bb = objDispBox(c, g, id); if (bb && bb.L >= m.L && bb.R <= m.R && bb.T >= m.T && bb.B <= m.B) ids.push(id); } if (d.base && d.base.length) { const st = new Set(d.base); for (const id of ids) st.add(id); ids.length = 0; ids.push(...st); } OSEL = ids.length ? { pageId: p.id, ids } : null; if (ids.length > 1) toast(`${ids.length} objects selected`); }
    drawOverlay(p, el); refreshFormatBar(); return true;
  }
  if (d.D && d.moved) {
    const A = mul6(mul6(g.t, d.D), g.i);
    if (d.mode === 'move' && d.alt) objDuplicate(A); // Alt-drag leaves a copy behind
    else objEdit((r) => { r.A = mul6(r.A || I6, A); });
  } else drawOverlay(p, el);
  return true;
}
function objEdit(fn, keepSel = true) {
  const c = osel(); if (!c || !c.ids.length) return; const ed = docEdits(c.doc); const recs = ed[c.pi] || (ed[c.pi] = {});
  for (const id of c.ids) { const r = recs[id] || (recs[id] = {}); fn(r, objOf(c, id)); if (!Object.keys(r).length) delete recs[id]; }
  if (!Object.keys(recs).length) delete ed[c.pi];
  if (!keepSel) OSEL = null; drawOverlay(c.p); refreshFormatBar(); commit(); rebuildDoc(c.doc);
}
function objDelete() { const c = osel(); if (!c) return; const n = c.ids.length; objEdit((r) => { const src = r.src; for (const k in r) delete r[k]; r.del = true; if (src != null) r.src = src; }, false); toast(n > 1 ? `Deleted ${n} objects` : 'Deleted'); }
function objNudge(dx, dy) { const c = osel(); if (!c) return; const g = geo(c.p); objEdit((r) => { r.A = mul6(r.A || I6, mul6(mul6(g.t, [1, 0, 0, 1, dx, dy]), g.i)); }); }
// Display-space transform about the selection centre
function objTransformSel(D) { const c = osel(); if (!c || !OSEL.box) return; const g = geo(c.p); const A = mul6(mul6(g.t, D), g.i); objEdit((r) => { r.A = mul6(r.A || I6, A); }); }
function objRotate(deg) { const b = OSEL && OSEL.box; if (!b) return; objTransformSel(rotD(deg, (b.L + b.R) / 2, (b.T + b.B) / 2)); }
function objFlip(h) { const b = OSEL && OSEL.box; if (!b) return; const cx = (b.L + b.R) / 2, cy = (b.T + b.B) / 2; objTransformSel(h ? [-1, 0, 0, 1, 2 * cx, 0] : [1, 0, 0, -1, 0, 2 * cy]); }
// Copies of the selected objects on the same page, moved by A (page space)
function objDuplicate(A, items) {
  const c = osel(); if (!c) return; const ed = docEdits(c.doc); const recs = ed[c.pi] || (ed[c.pi] = {});
  let n = 1; while (recs['d' + n]) n++; const ids = [];
  const src = items || c.ids.map((id) => { const r = objRec(c.doc, c.pi, id) || {}; return { src: isDupId(id) ? r.src : id, A: r.A, sc: r.sc, fc: r.fc, wm: r.wm }; });
  for (const it of src) { if (!c.parsed.objs[it.src]) continue; while (recs['d' + n]) n++; const k = 'd' + n; const r = { src: it.src, A: mul6(it.A || I6, A) }; for (const q of ['sc', 'fc', 'wm']) if (it[q] != null) r[q] = it[q]; recs[k] = r; ids.push(k); }
  if (!ids.length) return; OSEL = { pageId: c.p.id, ids }; drawOverlay(c.p); refreshFormatBar(); commit(); rebuildDoc(c.doc);
  toast(ids.length > 1 ? `${ids.length} copies made` : 'Copy made');
}
function objDupOffset() { const c = osel(); if (!c) return; const g = geo(c.p); objDuplicate(mul6(mul6(g.t, [1, 0, 0, 1, 12, 12]), g.i)); }
function objCopy() { const c = osel(); if (!c) return; OCLIP = { key: c.doc.id + '|' + c.pi, items: c.ids.map((id) => { const r = objRec(c.doc, c.pi, id) || {}; return { src: isDupId(id) ? r.src : id, A: r.A, sc: r.sc, fc: r.fc, wm: r.wm }; }), n: 0 }; toast(c.ids.length > 1 ? `${c.ids.length} objects copied` : 'Copied'); }
function objPaste() {
  if (!OCLIP) return; const c = osel() || (() => { const p = S.pages[S.current]; const cc = objCtx(p); return cc ? Object.assign({ p, ids: [] }, cc) : null; })();
  if (!c || c.doc.id + '|' + c.pi !== OCLIP.key) { toast('PDF objects can be pasted on the page they came from. Use Duplicate, or the Select tool for your own markup.'); return; }
  OSEL = { pageId: c.p.id, ids: [] }; OCLIP.n++; const g = geo(c.p); objDuplicate(mul6(mul6(g.t, [1, 0, 0, 1, 12 * OCLIP.n, 12 * OCLIP.n]), g.i), OCLIP.items);
}
function objSelectAll(p, kind) { const c = objCtx(p); if (!c) return; const ids = objList(c.doc, c.pi, c.parsed).filter(({ o }) => !kind || o.k === kind || (kind === 'img' && o.k === 'form')).map((x) => x.id); OSEL = ids.length ? { pageId: p.id, ids } : null; drawOverlay(p); refreshFormatBar(); if (kind) toast(ids.length ? `${ids.length} selected` : 'None on this page'); }
function objSelectSimilar() { const c = osel(); if (!c) return; const o0 = objOf(c, c.ids[0]); const ids = objList(c.doc, c.pi, c.parsed).filter(({ o }) => o.k === o0.k && (o.k !== 'path' || (o.st === o0.st && o.fi === o0.fi && Math.abs((o.lw || 0) - (o0.lw || 0)) < 0.05))).map((x) => x.id); OSEL = { pageId: c.p.id, ids }; drawOverlay(c.p); refreshFormatBar(); toast(`${ids.length} similar objects selected`); }
function objRestorePage(p) { const c = objCtx(p); if (!c) return; const ed = c.doc.values[EDK]; if (!ed || !ed[c.pi]) { toast('Nothing changed on this page'); return; } delete ed[c.pi]; OSEL = null; drawOverlay(p); refreshFormatBar(); commit(); rebuildDoc(c.doc); toast('Page contents restored'); }
function objBarHtml() {
  const c = osel(); const parts = [];
  const sel = (k, t) => `<button class="tbtn" data-oa="${k}">${t}</button>`;
  if (!c || !c.ids.length) {
    parts.push('<span class="fb-label">Edit PDF contents</span><span class="fb-spacer"></span><span class="fb-hint">Click text, a line, shape or image. Box select or drag on empty space for many. Tab: next one underneath.</span>');
    parts.push(`<button class="tbtn" data-oa="box" aria-pressed="${OBOX}" title="Drag a box to select everything inside it, even over a dense drawing">Box select</button>${sel('all', 'Select all')}${sel('alltext', 'All text')}${sel('allimg', 'All images')}${OCLIP ? sel('paste', 'Paste') : ''}${sel('restore', 'Restore page')}${sel('done', 'Done')}`);
    return parts.join('');
  }
  const objs = c.ids.map((id) => objOf(c, id)).filter(Boolean); const kinds = new Set(objs.map((o) => o.k)); const paths = kinds.has('path'); const texts = kinds.has('text');
  const o0 = objs[0]; const nm = c.ids.length > 1 ? `${c.ids.length} objects` : ({ path: o0.fi ? 'Shape' : 'Line', img: 'Image', form: 'Graphic group', text: 'Text', shade: 'Gradient' })[o0.k];
  parts.push(`<span class="fb-label">${nm}</span>`);
  const sw = (attr, t) => `<div class="swatches" role="group" aria-label="${t}">${TEXT_INKS.slice(0, 10).filter((z) => z[1] !== '#3a3a3c').map(([n, col]) => `<button class="sw" ${attr}="${col}" style="background:${col}" title="${t}: ${n}" aria-label="${t} ${n}"></button>`).join('')}</div>`;
  if (texts && !paths) parts.push(`<span class="fb-label">Colour</span>${sw('data-ofc', 'Text colour')}`);
  if (paths) { parts.push(`<span class="fb-label">Line</span>${sw('data-osc', 'Line colour')}`); if (objs.some((o) => o.fi || o.k === 'text')) parts.push(`<span class="fb-label">Fill</span>${sw('data-ofc', 'Fill colour')}`); parts.push('<div class="stepper" role="group" aria-label="Line weight"><button data-ow="0.67" aria-label="Thinner">−</button><output>Weight</output><button data-ow="1.5" aria-label="Thicker">+</button></div>'); }
  parts.push('<span class="fb-spacer"></span>');
  const ib = (k, ic, t) => `<button class="tbtn" data-oa="${k}" title="${t}" aria-label="${t}">${icon(ic)}</button>`;
  parts.push(ib('rotl', 'rotl', 'Rotate 90° left') + ib('rotr', 'rotr', 'Rotate 90° right') + ib('fliph', 'fliph', 'Flip left to right') + ib('flipv', 'flipv', 'Flip top to bottom'));
  parts.push('<span class="fb-spacer"></span>');
  parts.push(`<button class="tbtn" data-oa="dup" title="Duplicate (Ctrl+D). Alt-drag also leaves a copy">${icon('dup')}<span class="tb-hide-m">Duplicate</span></button>${ib('copy', 'copy', 'Copy (Ctrl+C)')}${OCLIP ? ib('paste', 'paste', 'Paste (Ctrl+V)') : ''}`);
  parts.push(`<button class="tbtn" data-oa="box" aria-pressed="${OBOX}" title="Drag a box to add more objects">Box select</button>`);
  if (c.ids.length === 1) parts.push(sel('similar', 'Select similar'));
  if (c.ids.some((id) => { const r = objRec(c.doc, c.pi, id); return r && (r.A || r.sc || r.fc || r.wm); })) parts.push(`<button class="tbtn" data-oa="reset" title="Undo changes to the selected objects">Reset</button>`);
  parts.push(`<button class="tbtn" data-oa="del" style="color:var(--danger)">${icon('trash')}<span class="tb-hide-m">Delete</span></button>`);
  return parts.join('');
}
function objBarClick(e) {
  const b = e.target.closest('[data-osc],[data-ofc],[data-ow],[data-oa]'); if (!b) return false;
  if (b.dataset.osc) objEdit((r) => { r.sc = b.dataset.osc; });
  else if (b.dataset.ofc) objEdit((r) => { r.fc = b.dataset.ofc; });
  else if (b.dataset.ow) objEdit((r) => { r.wm = clamp((r.wm || 1) * +b.dataset.ow, 0.05, 40); });
  else {
    const k = b.dataset.oa; const p = OSEL ? pageById(OSEL.pageId) : S.pages[S.current];
    if (k === 'box') { OBOX = !OBOX; refreshFormatBar(); }
    else if (k === 'del') objDelete(); else if (k === 'all') objSelectAll(p); else if (k === 'alltext') objSelectAll(p, 'text'); else if (k === 'allimg') objSelectAll(p, 'img');
    else if (k === 'similar') objSelectSimilar(); else if (k === 'restore') objRestorePage(p); else if (k === 'done') { OSEL = null; setTool('select'); }
    else if (k === 'rotl') objRotate(-90); else if (k === 'rotr') objRotate(90); else if (k === 'fliph') objFlip(true); else if (k === 'flipv') objFlip(false);
    else if (k === 'dup') objDupOffset(); else if (k === 'copy') objCopy(); else if (k === 'paste') objPaste();
    else if (k === 'reset') objEdit((r) => { const src = r.src; for (const z in r) delete r[z]; if (src != null) r.src = src; });
  }
  return true;
}

/* ---------- Text editor ---------- */
function styleEditor(ta, a, el = pageEl(S.editing ? S.editing.pageId : ''), b) {
  if (!el) return; const p = pageById(el.dataset.id); if (!b) b = dispBox(a, geo(p));
  const z = S.zoom; const fs = a.size * z; const pz = tpad(a) * z; const L = layoutText(a); const bw = a.border ? bdW(a) * z : 0;
  const bgop = a.bgop == null ? 1 : a.bgop;
  const bg = a.grad ? `linear-gradient(${{ v: '180deg', h: '90deg', d: '135deg' }[a.grad[2]] || '180deg'}, ${hexA(a.grad[0], bgop)}, ${hexA(a.grad[1], bgop)})` : a.bg ? hexA(a.bg, bgop) : (a.cover ? 'rgba(255,255,255,.96)' : 'rgba(255,255,255,.85)');
  const dec = [a.underline ? 'underline' : '', a.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
  Object.assign(ta.style, { left: el.offsetLeft + b.L * z + 'px', top: el.offsetTop + b.T * z + 'px', fontSize: fs + 'px', color: a.color, minWidth: Math.max(40, fs * 2) + 'px', padding: Math.max(0, pz - bw) + 'px', paddingLeft: Math.max(0, pz - bw + L.ind * z) + 'px', fontWeight: a.bold ? '700' : '400', fontStyle: a.italic ? 'italic' : 'normal', textDecoration: dec, textAlign: a.align || 'left', lineHeight: String(LH * (a.lh || 1)), letterSpacing: (a.ls || 0) * z + 'px', fontFamily: FONT_CSS[a.font || 'helv'] + ', ' + UNI_FALLBACK, background: bg, borderRadius: (a.rad || 0) * z + 'px', border: a.border ? `${bw}px ${a.bds === 'dash' ? 'dashed' : a.bds === 'dot' ? 'dotted' : 'solid'} ${a.bc || a.color}` : '0', boxSizing: 'border-box', whiteSpace: a.box ? 'pre-wrap' : 'pre', overflowWrap: a.box ? 'anywhere' : 'normal', width: a.box ? a.w * z + 'px' : ta.style.width, boxShadow: a.shadow ? `${shOff(a) * z}px ${shOff(a) * z}px 0 rgba(0,0,0,.22)` : 'none' });
  { const g2 = geo(p); const { U: U2, V: V3 } = UV(a.r || 0); const o0 = ap(g2.t, a.ax + a.h * V3[0], a.ay + a.h * V3[1]); const o1 = ap(g2.t, a.ax + a.h * V3[0] + U2[0], a.ay + a.h * V3[1] + U2[1]); const phi = Math.atan2(o1[1] - o0[1], o1[0] - o0[0]);
    if (Math.abs(phi) > 0.004) Object.assign(ta.style, { left: el.offsetLeft + o0[0] * z + 'px', top: el.offsetTop + o0[1] * z + 'px', transform: `rotate(${phi}rad)`, transformOrigin: '0 0' }); else ta.style.transform = ''; }
  if (a.hlc) ta.style.textShadow = 'none';
  if (ta._fit) ta._fit();
}
function openEditor(p, a, isNew = false) {
  closeEditor(false); setTool(S.tool);
  const el = pageEl(p.id); const g = geo(p); S.editing = { pageId: p.id, annId: a.id, isNew }; S.sel = { pageId: p.id, annId: a.id };
  drawOverlay(p, el);
  const b = dispBox(a, g); const ta = document.createElement('textarea'); ta.className = 'textedit'; ta.id = 'textEditor';
  ta.value = a.text || ''; ta.spellcheck = true; ta.setAttribute('aria-label', 'Text');
  styleEditor(ta, a, el, b);
  const fitTa = () => { const fs = a.size * S.zoom; ta.style.height = '0px'; if (!a.box) { ta.style.width = '0px'; ta.style.width = Math.max(fs * 2, ta.scrollWidth + fs * 0.6) + 'px'; } ta.style.height = Math.max(ta.scrollHeight, a.box ? (a.minH || 0) * S.zoom : 0) + 'px'; };
  ta._fit = fitTa;
  ta.addEventListener('input', fitTa);
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); closeEditor(false); }
    else if ((e.metaKey || e.ctrlKey) && !e.altKey) { const k = e.key.toLowerCase(); const map = { b: 'bold', i: 'italic', u: 'underline' }; if (map[k]) { e.preventDefault(); fmtToggle(map[k]); } else if (e.shiftKey && k === 'x') { e.preventDefault(); fmtToggle('strike'); } else if (k === 'e' || k === 'l' || k === 'r' || k === 'j') { e.preventDefault(); fmtSet({ align: { e: 'center', l: 'left', r: 'right', j: 'justify' }[k] }); } }
    e.stopPropagation();
  });
  ta.addEventListener('blur', () => setTimeout(() => { const ae = document.activeElement; if (S.editing && ae !== ta && !(ae && ae.closest && ae.closest('#fmtPanel,#formatBar'))) closeEditor(false); }, 120));
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
  const str = tc.items.map((it) => (it.str || '') + (it.hasEOL ? '\n' : '')).join(''); textCache.set(k, str); return str;
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
  return { font, bold: /bold|black|heavy|semibold|demi/i.test(name), italic: /italic|oblique/i.test(name) };
}
function editExistingLine(p, el, span) {
  const divs = el._tl ? el._tl.textDivs : []; const strs = el._tl ? el._tl.textContentItemsStr : [];
  const g = geo(p); const pr = el.getBoundingClientRect(); const Z = S.zoom;
  const box = (sp) => { const r = sp.getBoundingClientRect(); return { L: (r.left - pr.left) / Z, T: (r.top - pr.top) / Z, R: (r.right - pr.left) / Z, B: (r.bottom - pr.top) / Z }; };
  const idx = divs.indexOf(span); if (idx < 0) return;
  const items = el._items; if (!items) { pageItems(el, p).then(() => editExistingLine(p, el, span)); return; }
  const it = items[idx]; if (!it) return;
  // Work in the text's own direction (PDF space), so vertical and angled lines work like horizontal ones
  const t0 = it.transform; const fs = Math.hypot(t0[2], t0[3]) || Math.hypot(t0[0], t0[1]);
  const ul = Math.hypot(t0[0], t0[1]) || 1; const u = [t0[0] / ul, t0[1] / ul]; const v = [-u[1], u[0]]; const o = [t0[4], t0[5]];
  const theta = normDeg(Math.atan2(u[1], u[0]) * 180 / Math.PI);
  const dot = (x, y, w) => x * w[0] + y * w[1];
  const cand = [];
  divs.forEach((d, i) => {
    const t = items[i]; if (!t || !t.str || !d.isConnected) return; const tl = Math.hypot(t.transform[0], t.transform[1]) || 1;
    if (Math.abs(t.transform[0] / tl * u[0] + t.transform[1] / tl * u[1] - 1) > 0.002) return;
    const f2 = Math.hypot(t.transform[2], t.transform[3]) || tl; if (Math.abs(f2 - fs) > fs * 0.25) return;
    const dx = t.transform[4] - o[0], dy = t.transform[5] - o[1]; if (Math.abs(dot(dx, dy, v)) > fs * 0.3) return;
    const s0 = dot(dx, dy, u); cand.push({ d, t, s: s0, e: s0 + Math.max(t.width || 0, 0.1) });
  });
  cand.sort((x, y) => x.s - y.s);
  const k0 = cand.findIndex((c) => c.d === span); if (k0 < 0) return;
  let lo = k0, hi = k0;
  while (lo > 0 && cand[lo].s - cand[lo - 1].e < fs * 1.2) lo--;
  while (hi < cand.length - 1 && cand[hi + 1].s - cand[hi].e < fs * 1.2) hi++;
  const parts = cand.slice(lo, hi + 1); let text = '';
  parts.forEach((c, i) => { if (i && c.s - parts[i - 1].e > fs * 0.18 && !/\s$/.test(text) && !/^\s/.test(c.t.str)) text += ' '; text += c.t.str; });
  text = text.replace(/\s+$/, '');
  const L = Math.min(...parts.map((c) => c.s)), R = Math.max(...parts.map((c) => c.e));
  const padX = fs * 0.06, padY = fs * 0.04; const lo2 = -0.28 * fs - padY, hi2 = 0.95 * fs + padY;
  const W = R - L + 2 * padX, H = hi2 - lo2; const mid = [(L + R) / 2, (lo2 + hi2) / 2];
  const cx = o[0] + u[0] * mid[0] + v[0] * mid[1], cy = o[1] + u[1] * mid[0] + v[1] * mid[1];
  // display box around the (possibly rotated) area, for colour sampling
  const wc = [[L - padX, lo2], [R + padX, lo2], [L - padX, hi2], [R + padX, hi2]].map(([s1, s2]) => ap(g.t, o[0] + u[0] * s1 + v[0] * s2, o[1] + u[1] * s1 + v[1] * s2));
  const rect = { L: Math.min(...wc.map((q) => q[0])), T: Math.min(...wc.map((q) => q[1])), R: Math.max(...wc.map((q) => q[0])), B: Math.max(...wc.map((q) => q[1])) };
  const { bg, fg } = sampleColors(el, rect);
  const cover = { id: uid('a'), t: 'white', fill: bg, x: cx - W / 2, y: cy - H / 2, w: W, h: H, edit: true }; if (theta) cover.rot = theta;
  const ff = fontOf(el, parts[0].t);
  const uni = needsUni(text); const a = { id: uid('a'), t: 'text', r: theta, text: uni ? text : sanitize(text), uni, size: Math.round(fs * 100) / 100, color: fg, font: ff.font, bold: ff.bold, italic: ff.italic || undefined, w: 1, h: 1, ax: 0, ay: 0, orig: uni ? text : sanitize(text), cover: cover.id };
  const bx = textBox(a); a.w = bx.w; a.h = bx.h;
  const { V: V2 } = UV(theta); const sx = o[0] + u[0] * L, sy = o[1] + u[1] * L; const up = BASE * a.size - a.h;
  a.ax = sx + V2[0] * up; a.ay = sy + V2[1] * up;
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
  pinch.s = clamp(tdist(e.touches) / pinch.d, ZMIN / pinch.z, ZMAX / pinch.z); pagesEl.style.transform = `scale(${pinch.s})`;
}, { passive: false });
viewer.addEventListener('touchend', (e) => {
  if (!pinch || e.touches.length >= 2) return; const { s, z, cx, cy, mx, my } = pinch; pinch = null;
  pagesEl.style.transform = ''; pagesEl.style.transformOrigin = '';
  if (Math.abs(s - 1) < 0.02) return;
  const nz = clamp(z * s, ZMIN, ZMAX); const k = nz / z; S.fit = false; S.zoom = nz;
  closeEditor(false);
  S.pages.forEach((p) => { const el = pageEl(p.id); const g = geo(p); el.style.width = g.w * S.zoom + 'px'; el.style.height = g.h * S.zoom + 'px'; el.style.setProperty('--total-scale-factor', S.zoom); el.style.setProperty('--scale-factor', S.zoom); drawOverlay(p, el); drawForm(p, el); });
  viewer.scrollLeft = cx * k - mx; viewer.scrollTop = cy * k - my; rerenderVisible(); updateZoomLbl(); if (FIND.q) paintFind();
});

/* ---------- Find in document ---------- */
const FIND = { q: '', hits: [], i: -1, re: null, cs: !!lsGet('pdfmate.find.cs', false), ww: !!lsGet('pdfmate.find.ww', false), sel: -1 };
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function findRe(q) { if (!q) return null; let src = escRe(q); if (FIND.ww) src = '(?<![\\p{L}\\p{N}_])' + src + '(?![\\p{L}\\p{N}_])'; try { return new RegExp(src, 'gu' + (FIND.cs ? '' : 'i')); } catch (e) { return new RegExp(escRe(q), 'g' + (FIND.cs ? '' : 'i')); } }
const tsEl = () => $('#tsearch');
function openFind() {
  if (!S.pages.length) return; const ts = tsEl(); ts.classList.add('open');
  const inp = $('#findInput'); inp.disabled = false; inp.focus(); inp.select(); if (FIND.hits.length) showResults(true);
}
function closeFind() { FIND.q = ''; FIND.hits = []; FIND.i = -1; FIND.re = null; FIND.sel = -1; const inp = $('#findInput'); if (inp) inp.value = ''; const ts = tsEl(); if (ts) ts.classList.remove('has-q'); const c = $('#findCount'); if (c) c.textContent = ''; showResults(false); $$('.findlayer', pagesEl).forEach((f) => f.innerHTML = ''); }
function showResults(on) {
  const box = $('#tsRes'); if (!box) return; if (!on || !FIND.q) { box.hidden = true; return; }
  const max = 300; const h = FIND.hits; const esc2 = (t) => esc(t);
  let html = `<div class="tr-h"><span>${h.length ? h.length + (h.length === 1 ? ' match' : ' matches') + ' in ' + new Set(h.map((x) => x.page)).size + (new Set(h.map((x) => x.page)).size === 1 ? ' page' : ' pages') : 'No matches'}</span><span>${[FIND.cs ? 'Match case' : '', FIND.ww ? 'Whole words' : ''].filter(Boolean).join(' · ')}</span></div>`;
  html += h.slice(0, max).map((x, k) => `<button class="tr${k === FIND.i ? ' on' : ''}" role="option" data-k="${k}" aria-selected="${k === FIND.i}"><b>p. ${x.page + 1}</b><span>${esc2(x.pre)}<mark>${esc2(x.m)}</mark>${esc2(x.post)}</span></button>`).join('');
  if (h.length > max) html += `<div class="tr-more">${h.length - max} more. Use Enter to keep going.</div>`;
  box.innerHTML = html; box.hidden = false;
  const on2 = box.querySelector('.tr.on'); if (on2) on2.scrollIntoView({ block: 'nearest' });
}
async function runFind(q) {
  q = q.trim(); FIND.q = q; FIND.hits = []; FIND.i = -1; FIND.re = findRe(q);
  const cnt = $('#findCount'); tsEl().classList.toggle('has-q', !!q);
  if (!q) { cnt.textContent = ''; showResults(false); $$('.findlayer', pagesEl).forEach((f) => f.innerHTML = ''); return; }
  cnt.textContent = '…'; const myRe = FIND.re;
  for (let i = 0; i < S.pages.length; i++) {
    const str = await pageText(S.pages[i]); if (FIND.re !== myRe) return;
    const re = new RegExp(myRe.source, myRe.flags); let m, n = 0;
    while ((m = re.exec(str))) { if (!m[0].length) { re.lastIndex++; continue; } const k = m.index; FIND.hits.push({ page: i, n: n++, m: m[0], pre: (k > 22 ? '…' : '') + str.slice(Math.max(0, k - 22), k).replace(/\s+/g, ' '), post: str.slice(k + m[0].length, k + m[0].length + 70).replace(/\s+/g, ' ') }); if (FIND.hits.length > 20000) break; }
  }
  if (!FIND.hits.length) { cnt.textContent = 'None'; paintFind(); if (document.activeElement === $('#findInput')) showResults(true); return; }
  const startAt = FIND.hits.findIndex((h) => h.page >= S.current); FIND.i = startAt < 0 ? 0 : startAt; showHit();
  if (document.activeElement === $('#findInput')) showResults(true);
}
(function initSearch() {
  const ts = tsEl(); if (!ts) return; const inp = $('#findInput'); let t;
  inp.addEventListener('input', () => { tsEl().classList.toggle('has-q', !!inp.value.trim()); clearTimeout(t); t = setTimeout(() => runFind(inp.value), 220); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (FIND.q !== inp.value.trim()) { clearTimeout(t); runFind(inp.value); } else stepFind(e.shiftKey ? -1 : 1); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (FIND.hits.length) { e.preventDefault(); stepFind(e.key === 'ArrowDown' ? 1 : -1); } }
    else if (e.key === 'Escape') { e.preventDefault(); if (!$('#tsRes').hidden) showResults(false); else { closeFind(); inp.blur(); ts.classList.remove('open'); } }
    e.stopPropagation();
  });
  inp.addEventListener('focus', () => { if (FIND.q) showResults(true); });
  ts.addEventListener('focusout', () => setTimeout(() => { if (!ts.contains(document.activeElement)) { showResults(false); if (!FIND.q) ts.classList.remove('open'); } }, 160));
  $('#tsIc').addEventListener('click', () => (ts.classList.contains('open') && document.activeElement === inp ? null : openFind()));
  $('#findPrev').onclick = () => { stepFind(-1); inp.focus(); }; $('#findNext').onclick = () => { stepFind(1); inp.focus(); };
  $('#findClose').onclick = () => { closeFind(); inp.focus(); };
  $('#findOpts').onclick = (e) => {
    const tog = (k, key) => { FIND[k] = !FIND[k]; lsSet(key, FIND[k]); $('#findOpts').classList.toggle('on', FIND.cs || FIND.ww); if (inp.value.trim()) runFind(inp.value); inp.focus(); };
    openMenu(e.currentTarget, [{ h: 'Search options' }, { label: 'Match case', icon: FIND.cs ? 'check' : 'none', run: () => tog('cs', 'pdfmate.find.cs') }, { label: 'Whole words only', icon: FIND.ww ? 'check' : 'none', run: () => tog('ww', 'pdfmate.find.ww') }]);
  };
  $('#findOpts').classList.toggle('on', FIND.cs || FIND.ww);
  $('#tsRes').addEventListener('pointerdown', (e) => e.preventDefault());
  $('#tsRes').addEventListener('click', (e) => { const b = e.target.closest('.tr'); if (!b) return; FIND.i = +b.dataset.k; showHit(); showResults(true); });
})();
function stepFind(d) { if (!FIND.hits.length) return; FIND.i = (FIND.i + d + FIND.hits.length) % FIND.hits.length; showHit(); if (!$('#tsRes').hidden) showResults(true); }
function showHit() {
  const h = FIND.hits[FIND.i]; $('#findCount').textContent = `${FIND.i + 1}/${FIND.hits.length}`;
  const el = $$('.page', pagesEl)[h.page]; if (!el) return;
  paintFind();
  const cur = el.querySelector('.findlayer .cur');
  if (cur) { const r = cur.getBoundingClientRect(), vr = viewer.getBoundingClientRect(); if (r.top < vr.top + chromeH() + 60 || r.bottom > vr.bottom - 40) viewer.scrollTo({ top: viewer.scrollTop + r.top - vr.top - vr.height / 3, behavior: 'smooth' }); }
  else { scrollToPage(h.page); setTimeout(paintFind, 700); }
}
function paintFind(only) {
  const els = only ? [only] : $$('.page', pagesEl);
  for (const el of els) {
    const fl = el.querySelector('.findlayer'); if (!fl) continue; fl.innerHTML = '';
    if (!FIND.q || !el._tlReady) continue;
    const idx = $$('.page', pagesEl).indexOf(el); const curN = FIND.hits[FIND.i] && FIND.hits[FIND.i].page === idx ? FIND.hits[FIND.i].n : -1;
    const tl = el.querySelector('.textLayer'); const nodes = []; let full = '';
    if (tl) { const w = document.createTreeWalker(tl, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT); for (let nd = w.nextNode(); nd; nd = w.nextNode()) { if (nd.nodeType === 3) { if (nd.parentElement && nd.parentElement.tagName === 'SPAN' && !nd.parentElement.classList.contains('markedContent')) { nodes.push({ node: nd, start: full.length }); full += nd.data; } } else if (nd.tagName === 'BR') full += '\n'; } }
    if (!FIND.re || !nodes.length) continue; const pr = el.getBoundingClientRect(); let n = 0;
    const locate = (off) => { let lo = 0; for (let i = 0; i < nodes.length; i++) if (nodes[i].start <= off) lo = i; else break; return [nodes[lo].node, off - nodes[lo].start]; };
    const re = new RegExp(FIND.re.source, FIND.re.flags); let m;
    while ((m = re.exec(full))) {
      if (!m[0].length) { re.lastIndex++; continue; } const k = m.index, L = m[0].length;
      try {
        const rg = document.createRange(); const [sn, so] = locate(k); const [en, eo] = locate(k + L - 1); rg.setStart(sn, so); rg.setEnd(en, Math.min(en.data.length, eo + 1));
        for (const r of rg.getClientRects()) { const d = document.createElement('i'); if (n === curN) d.className = 'cur'; Object.assign(d.style, { left: r.left - pr.left + 'px', top: r.top - pr.top + 'px', width: r.width + 'px', height: r.height + 'px' }); fl.appendChild(d); }
      } catch (e) {}
      n++;
    }
  }
}

/* ---------- Tools and format bar ---------- */
const lastInGroup = { shape: 'rect', mark: 'tick' };
const CHEV = '<svg class="i chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
// Tool categories: the bar shows the categories, the ribbon under it shows the tools of the chosen one.
const CATS = [
  ['view', 'View', 'fitpage', ['t:select', 't:hand', '|', 'a:find', 'a:goto', '|', 'a:zout', 'a:zin', 'a:fitw', 'a:fitp', 'a:actual', '|', 'a:sview', 'a:reading', 'a:ruler', 'a:nav', '|', 'a:sidebar']],
  ['comment', 'Comment', 'note', ['t:select', '|', 'a:hlt', 'a:ul', 'a:stk', '|', 't:note', 't:text', 't:hl', '|', 'g:shapes', 't:pen', '|', 't:tick', 't:cross', 'g:sign']],
  ['draw', 'Draw', 'pen', ['t:select', 't:hand', '|', 'p:ballpoint', 'p:fountain', 'p:gel', 'p:pencil', 'p:marker', 'p:brush', 'p:calligraphy', 'p:highlighter', '|', 't:eraser', 't:lasso', '|', 'a:undo', 'a:redo']],
  ['edit', 'Edit', 'edit', ['t:select', '|', 't:edittext', 't:objedit', '|', 't:text', 't:tbox', 'a:img', '|', 't:white', 't:crop', '|', 'a:design']],
  ['fill', 'Fill & Sign', 'sign', ['t:select', '|', 'a:forms', 't:text', 't:tick', 't:cross', 'a:date', '|', 'a:sigs', 'g:sign', 'a:templates']],
  ['pages', 'Pages', 'blank', ['a:newpdf', 'a:design', 'a:organise', '|', 'a:blank', 'a:paper', 'a:addfile', 'a:addphoto', 'a:scan', 'a:sview', '|', 'a:prot', 'a:dupp', 'a:delp', 'a:reverse', 't:crop', '|', 'a:extract', 'a:split', '|', 'a:pnum', 'a:wm']],
  ['tools', 'Tools', 'lock', ['t:measure', 't:area', '|', 't:redact', 'a:protect', 'a:clean', '|', 'a:ocr', 'a:compare', '|', 'a:word', 'a:export', 'a:print', 'a:props']]
];
const TOOL_SHORT = { measure: 'Measure', area: 'Area', cloud: 'Cloud', select: 'Select', hand: 'Hand', text: 'Add text', tbox: 'Text box', edittext: 'Edit text', objedit: 'Edit objects', note: 'Note', hl: 'Box highlight', white: 'Whiteout', redact: 'Redact', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', arrow: 'Arrow', darrow: 'Double arrow', shape: 'Shape', pen: 'Pen', eraser: 'Eraser', lasso: 'Lasso', tick: 'Tick', cross: 'Cross', crop: 'Crop' };
const TOOL_KEY = { measure: 'M', area: 'K', cloud: 'C', select: 'V', hand: 'H', text: 'T', tbox: 'B', edittext: 'D', objedit: 'O', note: 'N', hl: 'U', white: 'W', redact: 'X', rect: 'R', ellipse: 'E', line: 'L', arrow: 'A', pen: 'P' };
const TOOL_ICON = { eraser: 'eraser', lasso: 'lasso', measure: 'measure', area: 'area', cloud: 'cloud', select: 'select', hand: 'hand', text: 'text', tbox: 'tbox', edittext: 'edit', objedit: 'objedit', note: 'note', hl: 'hl', white: 'white', redact: 'redact', rect: 'rect', ellipse: 'ellipse', line: 'line', arrow: 'arrow', pen: 'pen', tick: 'tick', cross: 'cross', crop: 'crop' };
const RIB_ACT = {
  find: ['Search', 'search', 'Search text (Ctrl+F)', () => openFind()], goto: ['Go to page', 'goto', 'Go to page (Ctrl+G)', () => openGoto()],
  zin: ['Zoom in', 'zin', 'Zoom in (Ctrl +)', () => setZoom(S.zoom * 1.25)], zout: ['Zoom out', 'zout', 'Zoom out (Ctrl -)', () => setZoom(S.zoom / 1.25)],
  fitw: ['Fit width', 'fit', 'Fit width (Ctrl 0)', () => setZoom(0, true)], fitp: ['Whole page', 'fitpage', 'Fit whole page', () => fitPage()],
  sidebar: ['Pages panel', 'sidebar', 'Show or hide the pages panel', () => $('#btnSidebar').click(), true], theme: ['Appearance', 'theme', 'Light, dark or system', () => { cycleTheme(); toast('Appearance: ' + themeLabel()); }, true], keys: ['Shortcuts', 'kbd', 'Keyboard shortcuts (?)', () => openShortcuts(), true],
  img: ['Image', 'photo', 'Insert an image from a file', () => $('#fileInsertImg').click()],
  forms: ['Form fields', 'form', 'List and fill the form fields in this PDF', () => { const n = [...S.docs.values()].reduce((k, d) => k + d.fields.length, 0); if (!n) { toast('This PDF has no form fields. Use Add text, Tick and Cross to fill it.'); return; } openFormList(); }],
  date: ['Date', 'text', 'Place today\'s date', () => { const d = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(); pickStamp({ text: d, color: '#000000', plain: true }); }],
  sigs: ['Signature', 'sign', 'Signatures and saved stamps', () => openLibrary()], templates: ['Templates', 'form', 'Ready-made forms and templates', () => openTemplates(), true],
  blank: ['Blank page', 'blank', 'Insert a blank page after the current one', () => pageAction('blank')], addfile: ['Add file', 'merge', 'Add pages from another PDF or image', () => $('#fileAdd').click()], addphoto: ['Photos', 'photo', 'Add photos as pages', () => $('#fileImg').click(), true],
  scan: ['Scan', 'scan', 'Scan with the camera', () => startScan(), true], prot: ['Rotate', 'rotr', 'Rotate the current or selected pages', () => pageAction('rotr')], dupp: ['Duplicate', 'dup', 'Duplicate the current or selected pages', () => pageAction('dup')], delp: ['Delete', 'trash', 'Delete the current or selected pages', () => pageAction('del')],
  pnum: ['Page numbers', 'pagenum', 'Add page numbers', () => openPageNumbers()], wm: ['Watermark', 'watermark', 'Add a watermark', () => openWatermark()],
  split: ['Split', 'split', 'Split into separate PDFs', () => openSplit()], export: ['Export', 'download', 'Export pages as images or text', () => openExport()],
  ocr: ['Recognise text', 'ocr', 'Make scanned pages searchable (OCR)', () => openOcr()], compare: ['Compare', 'compare', 'Compare with another PDF', () => openCompare()],
  print: ['Print', 'print', 'Print (Ctrl+P)', () => openPrint()], props: ['Properties', 'props', 'Document title, author and details', () => openProps(), true],
  actual: ['Actual size', 'zin', 'Show at real paper size', () => setZoom(96 / 72), true], tour: ['Tour', 'tour', 'Show the quick tour', () => startTour(true), true],
  hlt: ['Highlight', 'hltext', 'Highlight the selected text', () => selMark('hl')], ul: ['Underline', 'ul', 'Underline the selected text', () => selMark('ul')], stk: ['Strikeout', 'stk', 'Strike through the selected text', () => selMark('st')],
  extract: ['Extract', 'extract', 'Save the current or selected pages as a new PDF', () => extractPages()], reverse: ['Reverse', 'reverse', 'Reverse the page order', () => reversePages(), true],
  protect: ['Password', 'lock', 'Protect with a password (AES-256)', () => openProtect()], clean: ['Remove info', 'clean', 'Leave out title, author and keywords when saving', () => removeInfo(), true],
  word: ['Word', 'word', 'Export to Word (.docx)', () => openWord()],
  reading: ['Reading', 'reading', 'Reading mode: the text as one clean column with adjustable size', () => openReading()],
  ruler: ['Ruler', 'ruler', 'Reading ruler: highlights the line you are reading. Click a line or use the arrow keys', () => toggleRuler()],
  nav: ['Navigator', 'navmap', 'Navigator: a small map of the page when zoomed in', () => toggleNav(), true],
  paper: ['Paper', 'grid', 'Lined, grid, dots and other paper for blank pages, and the default for new ones', () => paperMenu($('#tools [data-act="paper"]'))],
  undo: ['Undo', 'undo', 'Undo (Ctrl+Z)', () => undo()], redo: ['Redo', 'redo', 'Redo (Ctrl+Shift+Z)', () => redo()],
  design: ['Design', 'design', 'Design studio: photo albums, collages and presentation pages with layouts, styles and print-ready export', () => openDesign()],
  newpdf: ['New PDF', 'blank', 'Create a new blank PDF: size, orientation, pages, lined or grid paper', () => openNewPdf()],
  organise: ['Organise', 'grid', 'Organise pages in a large grid: sort, rotate, copy, extract, delete', () => openOrganiser()],
  sview: ['Split screen', 'split2', 'Two documents side by side. Drag pages across to copy them', () => openSplitView()],
  night: ['Night', 'moon', 'Bridge night mode: red light that keeps your night vision', () => toggleNight($('#tools [data-act="night"]')), true]
};
S.cat = lsGet('pdfmate.cat', 'comment'); if (!CATS.some((c) => c[0] === S.cat)) S.cat = 'comment';
const catOf = (k) => CATS.find((c) => c[0] === k) || CATS[1];
function buildCats() {
  $('#cats').innerHTML = CATS.map(([k, label, ic]) => `<button class="cat" role="tab" data-cat="${k}" aria-selected="${k === S.cat}" data-tip="${label}">${icon(ic)}<span>${label}</span></button>`).join('');
}
function buildTools() {
  const [ck, clabel, cic, items] = catOf(S.cat);
  let html = `<button class="tool catsw" data-catsw="1" aria-label="Change tool category" data-tip="Tool category">${icon(cic)}<span class="tl">${clabel}</span>${CHEV}</button><span class="rsep catsep"></span>`;
  for (const it of items) {
    if (it === '|') { html += '<span class="rsep" aria-hidden="true"></span>'; continue; }
    const [kind, k] = it.split(':');
    if (kind === 't') { const tip = ({ eraser: 'Eraser: rub out ink strokes', lasso: 'Lasso: loop around strokes to select them', measure: 'Measure distance, to scale', area: 'Measure area, to scale', cloud: 'Revision cloud' })[k] || (TOOLS.find((x) => x[0] === k) || Object.values(GROUPS).flat().find((x) => x[0] === k) || [k, TOOL_SHORT[k]])[1]; const key = TOOL_KEY[k]; html += `<button class="tool${['pen', 'rect', 'ellipse', 'line', 'arrow', 'cloud', 'tick', 'cross'].includes(k) && ck === 'comment' ? ' shp' : ''}" data-tool="${k}" aria-pressed="${k === S.tool}" aria-label="${TOOL_SHORT[k]}" data-tip="${tip.replace(/\s*\([A-Z]\)$/, '')}${key ? ' (' + key + ')' : ''}">${icon(TOOL_ICON[k])}<span class="tl">${TOOL_SHORT[k]}</span></button>`; }
    else if (kind === 'p') { const d = penDef(k); html += `<button class="tool" data-pen="${k}" aria-pressed="${S.tool === 'pen' && INK.pen === k}" aria-label="${d[1]}" data-tip="${d[1]}: ${d[2]}">${icon('pen_' + k)}<span class="tl">${{ ballpoint: 'Ballpoint', fountain: 'Fountain', gel: 'Fineliner', pencil: 'Pencil', marker: 'Marker', brush: 'Brush', calligraphy: 'Calligraphy', highlighter: 'Highlighter' }[k]}</span></button>`; }
    else if (kind === 'g' && k === 'shapes') html += `<button class="tool grp shapesbtn" data-group="shapes" aria-haspopup="dialog" aria-pressed="${SHAPE_TOOLS.has(S.tool)}" aria-label="Shapes" data-tip="Insert shapes: lines, arrows, stars, callouts, flowchart and more">${icon('shapes')}<span class="tl">Shapes</span>${CHEV}</button>`;
    else if (kind === 'g') html += `<button class="tool grp" data-group="sign" aria-haspopup="menu" aria-label="Stamps" data-tip="Stamps, signatures and images">${icon('stamp')}<span class="tl">Stamps</span>${CHEV}</button>`;
    else { const a = RIB_ACT[k]; if (a) html += `<button class="tool act${a[4] ? ' minor' : ''}" data-act="${k}" aria-label="${a[0]}" data-tip="${a[2]}">${icon(a[1])}<span class="tl">${a[0]}</span></button>`; }
  }
  $('#tools').innerHTML = html;
  $$('#cats .cat').forEach((b) => b.setAttribute('aria-selected', b.dataset.cat === S.cat));
  $('#tools').dataset.cat = S.cat;
  try { markSplitBtn(); markViewBtns(); $$('#tools [data-act="night"]').forEach((x) => x.setAttribute('aria-pressed', lsGet('pdfmate.night', 'off') !== 'off')); } catch (e) {}
}
function selMark(kind) { const s0 = selectionInPages(); if (!s0 || !String(s0.sel).trim()) { toast('Select some text on the page first (Select tool, drag over words), then tap this again'); return; } markSelection(kind); }
function setCat(k) { if (!CATS.some((c) => c[0] === k)) return; S.cat = k; lsSet('pdfmate.cat', k); buildTools(); const here = $(`#tools [data-tool="${S.tool}"]`); setTool(!here && $('#tools [data-tool="select"]') ? 'select' : S.tool, true); }
function setTool(t, keepCat) {
  if (S.poly && t !== 'area') finishPoly();
  if (t !== 'image') S.pendingImg = null;
  if (t !== 'stamp') S.pendingStamp = null;
  const g = toolGroup(t); if (g) { lastInGroup[g] = t; const gb = $(`#tools [data-group="${g}"]`); if (gb) gb.innerHTML = icon(GROUPS[g].find((v) => v[0] === t)[2]) + CHEV; }
  if (S.tool === 'objedit' && t !== 'objedit') { const op = OSEL && pageById(OSEL.pageId), hp = OHOV && pageById(OHOV.pageId); OSEL = null; OHOV = null; S.tool = t; if (op) drawOverlay(op); if (hp && hp !== op) drawOverlay(hp); }
  if (t === 'objedit') { for (const el of $$('.page', pagesEl)) { if (!el._vis) continue; const pp = pageById(el.dataset.id); if (pp && pp.kind === 'pdf') { const d = S.docs.get(pp.docId); if (d && !d.encrypted) pageObjs(d, pp.index); } } }
  if (!keepCat && !$(`#tools [data-tool="${t}"]`) && !(t === 'image' || t === 'stamp')) { const c = CATS.find((x) => x[3].includes(SHAPE_TOOLS.has(t) ? 'g:shapes' : 't:' + t)); if (c && c[0] !== S.cat) { S.cat = c[0]; lsSet('pdfmate.cat', S.cat); buildTools(); } }
  S.tool = t; viewer.classList.toggle('drawing', DRAW_TOOLS.has(t)); viewer.dataset.tool = t;
  $$('#tools .tool').forEach((b) => { if (!b.dataset.tool && !b.dataset.group) return; b.setAttribute('aria-pressed', b.dataset.tool ? b.dataset.tool === t : (b.dataset.group === 'sign' ? (t === 'image' || t === 'stamp') : b.dataset.group === 'shapes' ? SHAPE_TOOLS.has(t) : toolGroup(t) === b.dataset.group)); });
  if (t !== 'select' && S.sel && !S.editing) select(null);
  if (t === 'hand') { const sel = getSelection(); if (sel) sel.removeAllRanges(); }
  $$('#viewDock [data-dtool]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.dtool === t));
  try { buildToolsPressed(); } catch (e) {}
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
$('#tools').addEventListener('pointerdown', (e) => { if (e.target.closest('[data-act="hlt"],[data-act="ul"],[data-act="stk"]')) e.preventDefault(); });
$('#cats').addEventListener('click', (e) => { const b = e.target.closest('.cat'); if (b) setCat(b.dataset.cat); });
$('#tools').addEventListener('click', (e) => {
  const b = e.target.closest('.tool'); if (!b) return;
  if (b.dataset.pen) { if (!S.pages.length) { toast('Open a PDF first'); return; } closeEditor(false); INK.pen = b.dataset.pen; saveInk(); setTool('pen', true); buildToolsPressed(); return; }
  if (b.dataset.catsw) { openMenu(b, CATS.map(([k, label, ic]) => ({ label, icon: k === S.cat ? 'check' : ic, run: () => setCat(k) }))); return; }
  if (b.dataset.act) { const a = RIB_ACT[b.dataset.act]; const free = ['sidebar', 'theme', 'keys', 'templates', 'addphoto', 'scan', 'night', 'sview', 'newpdf'].includes(b.dataset.act); if (!S.pages.length && !free) { toast('Open a PDF first'); return; } closeEditor(false); a[3](); return; }
  if (!S.pages.length) { toast('Open a PDF first'); return; }
  closeEditor(false);
  if (b.dataset.group === 'sign') { signMenu(b); return; }
  if (b.dataset.group === 'shapes') { openShapes(b, pickShape); return; }
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
function applyStyleToSel(fn) { const s = selectedAnn(); if (!s) return; fn(s.a); drawOverlay(s.p); clearTimeout(styleCommitT); styleCommitT = setTimeout(commit, 350); if (S.editing && S.editing.annId === s.a.id) { const ta = $('#textEditor'); if (ta) styleEditor(ta, s.a); } }
function fmtBarHtml() {
  const c = fmtCur(); const B = (k, l, t) => `<button class="tbtn fbt" data-ftg="${k}" aria-pressed="${!!c[k]}" title="${t}" aria-label="${t}">${l}</button>`;
  return `<div class="fb-grp">${B('bold', '<b>B</b>', 'Bold')}${B('italic', '<i>I</i>', 'Italic')}${B('underline', '<u>U</u>', 'Underline')}${B('strike', '<s>S</s>', 'Strikethrough')}</div><select class="fb-font" id="fbFont" aria-label="Font">${FONT_NAMES.map(([k, n]) => `<option value="${k}" ${c.font === k ? 'selected' : ''}>${n.split(' / ')[0]}</option>`).join('')}</select>`;
}
function refreshFormatBar() {
  const fb = $('#formatBar');
  const allPen = (() => { if (!S.sel) return false; const pp = pageById(S.sel.pageId); const ids = new Set(selIds()); return !!pp && pp.annots.filter((z) => ids.has(z.id)).every((z) => z.t === 'pen'); })();
  if (S.sel && selIds().length > 1 && S.pages.length && !allPen) {
    const n = selIds().length; const B = (k, ic, t) => `<button class="tbtn" data-mal="${k}" title="${t}" aria-label="${t}">${icon(ic)}</button>`;
    fb.innerHTML = `<span class="fb-label">${n} selected</span><span class="fb-spacer"></span>${B('l', 'al', 'Align left')}${B('c', 'ac', 'Align centres')}${B('r', 'ar', 'Align right')}<span class="fb-spacer"></span>${B('t', 'at', 'Align top')}${B('m', 'am', 'Align middles')}${B('b', 'ab', 'Align bottom')}<span class="fb-spacer"></span>${B('rotl', 'rotl', 'Rotate 90° left')}${B('rotr', 'rotr', 'Rotate 90° right')}<span class="fb-spacer"></span>${B('dup', 'dup', 'Duplicate')}${B('del', 'trash', 'Delete')}`;
    fb.hidden = false;
    fb.querySelectorAll('[data-mal]').forEach((b) => b.onclick = () => { const k = b.dataset.mal; if (k === 'del') deleteSelected(); else if (k === 'dup') duplicateSelected(); else if (k === 'rotl') rotateSelected(-90); else if (k === 'rotr') rotateSelected(90); else alignSelected(k); });
    refreshFmtPanel(); return;
  }
  if (S.tool === 'objedit' && S.pages.length) { fb.innerHTML = objBarHtml(); fb.hidden = false; refreshFmtPanel(); return; }
  { const s0 = selectedAnn(); if (S.pages.length && ((INK_TOOLS.has(S.tool) && !s0) || (s0 && s0.a.t === 'pen'))) { fb.innerHTML = inkBarHtml(s0) + (s0 ? `<span class="fb-spacer"></span><button class="tbtn" data-act="rotl" aria-label="Rotate left">${icon('rotl')}</button><button class="tbtn" data-act="rotr" aria-label="Rotate right">${icon('rotr')}</button><button class="tbtn" data-act="dup" aria-label="Duplicate">${icon('dup')}</button><button class="tbtn" data-act="del" style="color:var(--danger)" aria-label="Delete">${icon('trash')}</button>` : ''); fb.hidden = false; fb.classList.add('inkbar'); refreshFmtPanel(); return; } fb.classList.remove('inkbar'); }
  const s = selectedAnn();
  let kind = s ? s.a.t : S.tool;
  if (s && s.a.t === 'text') kind = s.a.box ? 'tbox' : s.a.bg ? 'note' : s.a.border ? 'stampa' : 'text';
  if (s && s.a.t === 'mark') kind = s.a.kind === 'hl' ? 'markhl' : 'markline';
  const shpK = s ? s.a.kind : S.shapeKind;
  if (!S.pages.length || kind === 'select' || kind === 'hand') { fb.hidden = true; fb.innerHTML = ''; refreshFmtPanel(); return; }
  const parts = [];
  const isHl = kind === 'hl' || kind === 'markhl';
  const cur = s ? s.a.color : (isHl ? S.style.hl : S.style.ink);
  const label = { measure: 'Measure', area: 'Area', cloud: 'Cloud', crop: 'Crop', edittext: 'Edit text', text: 'Text', tbox: 'Text box', note: 'Sticky note', stampa: 'Stamp', stamp: 'Stamp', white: 'Whiteout', redact: 'Redact', hl: 'Highlight', markhl: 'Highlight', markline: s && s.a.kind === 'st' ? 'Strike through' : 'Underline', rect: 'Rectangle', ellipse: 'Ellipse', shape: shapeLabel(shpK), line: 'Line', arrow: s && s.a.both ? 'Double arrow' : 'Arrow', darrow: 'Double arrow', pen: 'Pen', tick: 'Tick', cross: 'Cross', image: s ? 'Image' : 'Place image' }[kind] || '';
  parts.push(`<span class="fb-label">${label}</span>`);
  const sw = (list, c0, attr = 'data-color') => `<div class="swatches" role="group" aria-label="Colour">${list.map(([n, c]) => `<button class="sw" ${attr}="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${c.toLowerCase() === String(c0).toLowerCase()}"></button>`).join('')}</div>`;
  if (!['white', 'image', 'redact', 'stamp', 'edittext', 'crop'].includes(kind)) parts.push(sw(isHl ? HLS : INKS, cur));
  if (kind === 'note') parts.push(sw(NOTE_BGS, s ? s.a.bg : (S.style.noteBg || '#fff3a6'), 'data-bg'));
  if (['text', 'tbox', 'note', 'stampa'].includes(kind)) parts.push(fmtBarHtml());
  if (['text', 'tbox', 'note', 'stampa'].includes(kind)) { const v = s ? s.a.size : S.style.size; parts.push(`<div class="stepper" role="group" aria-label="Font size"><button data-step="size" data-d="-1" aria-label="Smaller">−</button><output>${Math.round(v * 100) / 100} pt</output><button data-step="size" data-d="1" aria-label="Larger">+</button></div>`); }
  if (['measure', 'area'].includes(kind)) { const sc = s ? mscOf(s.a) : mscOf({}); parts.push(`<span class="fb-label">Scale 1:</span><input class="fb-num" data-msr value="${fmtNum(sc.r)}" inputmode="decimal" aria-label="Scale"><select class="fb-font" data-msu aria-label="Units">${Object.keys(MUNITS).map((u) => `<option ${u === sc.u ? 'selected' : ''}>${u}</option>`).join('')}</select>${s && s.a.t === 'measure' ? '<button class="tbtn" data-act="calib" title="Type the real length of this line to set the scale">Calibrate</button>' : ''}`); }
  if (FILLABLE.has(kind)) { const f0 = s ? (s.a.fill ? (s.a.fop != null && s.a.fop < 1 ? 'tint' : s.a.fill) : 'none') : (S.style.fill || 'none'); parts.push(`<span class="fb-label fb-sub">Fill</span><div class="swatches" role="group" aria-label="Fill">${SHP_FILLS.map(([n, c]) => `<button class="sw fillsw${c === 'none' ? ' nofill' : ''}" data-fill="${c}" style="background:${c === 'none' ? 'transparent' : c === 'tint' ? cur + '40' : c}" aria-label="${n}" title="${n}" aria-pressed="${String(c0eq(c, f0))}"></button>`).join('')}</div>`); }
  if (['rect', 'ellipse', 'shape', 'line', 'arrow', 'darrow', 'pen', 'tick', 'cross', 'measure', 'area', 'cloud'].includes(kind)) { const v = s ? s.a.width : S.style.width; parts.push(`<div class="stepper" role="group" aria-label="Line width"><button data-step="width" data-d="-1" aria-label="Thinner">−</button><output>${Math.round(v * 10) / 10} pt</output><button data-step="width" data-d="1" aria-label="Thicker">+</button></div>`); }
  const hints = { crop: 'Drag over the area to keep. The saved file shows only that area.', edittext: 'Click a line of text to change it, horizontal, vertical or angled. The original is covered, not deleted. Redact it first if it must be removed.', white: 'Covers what is underneath, but the hidden text stays in the file. Use Redact to remove it.', redact: 'Drag over content to remove it. It is deleted for good when you save or print.', hl: 'Drag a box to highlight. To highlight words, select them with the Select tool.', text: 'Click to type. Double-click text to edit.', measure: 'Drag along what you want to measure. Calibrate once on a known dimension.', area: 'Click each corner. Click the first point, double-click or press Enter to finish.', cloud: 'Drag a box to draw a revision cloud.', tbox: 'Drag to draw a text box, or tap for a standard width. Text wraps inside it.', note: 'Click to add a note.', stamp: 'Tap where the stamp goes.', image: 'Tap where it goes.', pen: 'Draw freehand.', line: 'Drag to draw. Hold Shift to snap.', arrow: 'Drag to draw. Hold Shift to snap.', rect: 'Drag to draw a box, or tap for a standard size. Shift makes a square.', ellipse: 'Drag to draw, or tap. Shift makes a circle.', shape: 'Drag to draw, or tap for a standard size. Shift keeps it in proportion.', darrow: 'Drag to draw. Hold Shift to snap.', tick: 'Tap to place.', cross: 'Tap to place.' };
  if (['text', 'tbox', 'note', 'stampa'].includes(kind)) { const al = (fmtCur().align || 'left'); parts.push(`<button class="tbtn" data-fa="1" title="Alignment: ${al}" aria-label="Alignment ${al}">${icon({ left: 'tal', center: 'tac', right: 'tar', justify: 'taj' }[al])}</button><button class="tbtn" data-fp="1" aria-pressed="${!!S.fmtOpen}" title="All text and box formatting">${icon('fmt')}<span class="tb-hide-m">Format</span></button>`); }
  parts.push('<span class="fb-spacer"></span>');
  if (s && !S.editing) {
    if (s.a.t === 'text') parts.push(`<button class="tbtn" data-act="edit">${icon('edit')}<span class="tb-hide-m">Edit</span></button>`);
    if (s.a.t === 'image') parts.push(`<button class="tbtn" data-act="imgedit" title="Crop, rotate, colours, filters, background removal, border (double-click the image)">${icon('photo')}<span class="tb-hide-m">Edit image</span></button><select class="fb-font" data-imgop aria-label="Opacity" title="Opacity">${[...new Set([1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, s.a.op == null ? 1 : Math.round(s.a.op * 100) / 100])].sort((x, y) => y - x).map((v) => `<option value="${v}" ${Math.abs((s.a.op == null ? 1 : s.a.op) - v) < 0.01 ? 'selected' : ''}>${Math.round(v * 100)}%</option>`).join('')}</select><button class="tbtn" data-act="imgmore" title="Arrange, fit to page, original proportions">${icon('more')}<span class="tb-hide-m">Arrange</span></button>`);
    if (FILLABLE.has(s.a.t)) parts.push(`<button class="tbtn" data-act="chshape" title="Change to another shape, keeping size and colours">${icon('shapes')}<span class="tb-hide-m">Change shape</span></button>`);
    if (ROTATABLE(s.a)) parts.push(`<button class="tbtn" data-act="rotl" title="Rotate 90° left" aria-label="Rotate left">${icon('rotl')}</button><button class="tbtn" data-act="rotr" title="Rotate 90° right" aria-label="Rotate right">${icon('rotr')}</button>`);
    parts.push(`<button class="tbtn" data-act="allpages" aria-label="Copy to other pages" title="Copy to other pages">${icon('dup')}<span class="tb-hide-m">All pages</span></button>`);
    parts.push(`<button class="tbtn" data-act="dup" aria-label="Duplicate">${icon('dup')}<span class="tb-hide-m">Duplicate</span></button><button class="tbtn" data-act="del" style="color:var(--danger)" aria-label="Delete">${icon('trash')}<span class="tb-hide-m">Delete</span></button>`);
  } else if (hints[kind]) parts.push(`<span class="fb-hint">${hints[kind]}</span>`);
  if (kind === 'crop') { const cp = S.pages[S.current]; parts.push(`<button class="tbtn" data-act="cropall" ${cp && cp.crop ? '' : 'disabled'}>Use on all pages</button><button class="tbtn" data-act="cropclear">Remove crop</button>`); }
  if (!s && SHAPE_TOOLS.has(kind)) parts.push(`<button class="tbtn" data-act="pickshape" title="Pick another shape">${icon('shapes')}<span class="tb-hide-m">Shapes</span></button>`);
  if (!s && kind !== 'select') parts.push(`<button class="tbtn" data-act="done">Done</button>`);
  fb.innerHTML = parts.join(''); fb.hidden = false;
  refreshFmtPanel();
}
$('#formatBar').addEventListener('pointerdown', (e) => { if (S.editing && e.target.closest('button')) e.preventDefault(); });
$('#formatBar').addEventListener('contextmenu', inkContext);
$('#formatBar').addEventListener('input', (e) => { const t = e.target; if (t.matches('[data-inkw]')) { const v = +t.value; t.nextElementSibling.textContent = Math.round(v * 10) / 10 + ' pt'; inkApplyQuiet({ width: v }); } else if (t.matches('[data-inkop]')) { const v = +t.value; t.nextElementSibling.textContent = Math.round(v * 100) + '%'; inkApplyQuiet({ op: v }); } });
$('#formatBar').addEventListener('change', (e) => {
  if (e.target.matches('[data-inkw],[data-inkop]')) { refreshFormatBar(); return; }
  if (e.target.matches('[data-inkpick]')) { inkApply({ color: e.target.value }); return; }
  if (e.target.id === 'fbFont') { fmtSet({ font: e.target.value }); return; }
  if (e.target.matches('[data-imgop]')) { const v = +e.target.value; applyStyleToSel((a) => { if (a.t !== 'image') return; if (v < 1) a.op = v; else delete a.op; }); return; }
  if (e.target.matches('[data-msr],[data-msu]')) { const fb = $('#formatBar'); const r = parseFloat(String(fb.querySelector('[data-msr]').value).replace(',', '.')); const u = fb.querySelector('[data-msu]').value; if (!(r > 0)) return; S.style.msc = { r, u }; saveStyle(); const s = selectedAnn(); if (s && (s.a.t === 'measure' || s.a.t === 'area')) { s.a.sc = { r, u }; drawOverlay(s.p); commit(); } refreshFormatBar(); }
});
$('#formatBar').addEventListener('click', (e) => {
  if (objBarClick(e)) return;
  if (inkClick(e)) return;
  const ft = e.target.closest('[data-ftg]'); if (ft) { fmtToggle(ft.dataset.ftg); return; }
  if (e.target.closest('[data-fp]')) { openFmtPanel(); return; }
  if (e.target.closest('[data-fa]')) { const o = ['left', 'center', 'right', 'justify']; const c = fmtCur().align || 'left'; fmtSet({ align: o[(o.indexOf(c) + 1) % 4] }); return; }
  const sw = e.target.closest('.sw'); const st = e.target.closest('[data-step]'); const act = e.target.closest('[data-act]');
  const s = selectedAnn();
  if (sw && sw.dataset.fill) { const f = sw.dataset.fill; S.style.fill = f; saveStyle(); if (s) applyStyleToSel((a) => { if (!FILLABLE.has(a.t)) return; delete a.fop; if (f === 'none') delete a.fill; else if (f === 'tint') { a.fill = a.color; a.fop = 0.25; } else a.fill = f; }); refreshFormatBar(); return; }
  if (sw && sw.dataset.bg) { const c = sw.dataset.bg; S.style.noteBg = c; saveStyle(); if (s) applyStyleToSel((a) => { a.bg = c; }); refreshFormatBar(); return; }
  if (sw) {
    const c = sw.dataset.color; const isHl = (s ? (s.a.t === 'mark' ? (s.a.kind === 'hl' ? 'hl' : 'x') : s.a.t) : S.tool) === 'hl';
    if (isHl) S.style.hl = c; else S.style.ink = c; saveStyle();
    if (s) applyStyleToSel((a) => { a.color = c; if (a.fill && a.fop != null && a.fop < 1) a.fill = c; });
    refreshFormatBar();
  } else if (st) {
    const d = +st.dataset.d;
    if (st.dataset.step === 'size') { const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96, 120, 160, 200, 300]; const v = s ? s.a.size : S.style.size; const i = steps.findIndex((x) => x >= v - 0.01); const ni = clamp((i < 0 ? steps.length - 1 : i) + d, 0, steps.length - 1); const nv = steps[ni]; if (!s) { S.style.size = nv; saveStyle(); } else applyStyleToSel((a) => setText(a, null, nv)); }
    else { const steps = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12]; const v = s ? s.a.width : S.style.width; const i = steps.findIndex((x) => x >= v - 0.01); const nv = steps[clamp((i < 0 ? steps.length - 1 : i) + d, 0, steps.length - 1)]; S.style.width = nv; saveStyle(); if (s) applyStyleToSel((a) => { a.width = nv; }); }
    refreshFormatBar();
  } else if (act) {
    const k = act.dataset.act;
    if (k === 'del') deleteSelected(); else if (k === 'dup') duplicateSelected(); else if (k === 'edit' && s) openEditor(s.p, s.a);
    else if (k === 'done') { closeEditor(false); setTool('select'); }
    else if (k === 'allpages') openCopyToPages();
    else if (k === 'rotl') rotateSelected(-90); else if (k === 'rotr') rotateSelected(90);
    else if (k === 'calib' && s) openCalibrate(s);
    else if (k === 'chshape' && s) changeShape(act);
    else if (k === 'imgedit' && s) openImageEditor(s.p, s.a);
    else if (k === 'imgmore' && s) openMenu(act, [{ label: 'Bring to front', icon: 'up', run: () => imgZ('front') }, { label: 'Bring forward', icon: 'up', run: () => imgZ('fwd') }, { label: 'Send backward', icon: 'down', run: () => imgZ('bwd') }, { label: 'Send to back', icon: 'down', run: () => imgZ('back') }, '-', { label: 'Fit to page with margins', icon: 'fitpage', run: () => imgFitPage('fit') }, { label: 'Fill the whole page', icon: 'fitpage', run: () => imgFitPage('full') }, { label: 'Original proportions', icon: 'fit', run: () => imgNatural() }]);
    else if (k === 'pickshape') openShapes(act, pickShape);
    else if (k === 'cropall') { const src = S.pages.find((p) => p.crop && p === S.pages[S.current]) || S.pages.find((p) => p.crop); if (!src) return; const g1 = geo(src); const c = src.crop; const d1 = ap(g1.t, c[0], c[1]), d2 = ap(g1.t, c[2], c[3]); const f = [Math.min(d1[0], d2[0]) / g1.w, Math.min(d1[1], d2[1]) / g1.h, Math.max(d1[0], d2[0]) / g1.w, Math.max(d1[1], d2[1]) / g1.h];
      for (const p2 of S.pages) { const g2 = geo(p2); const a1 = ap(g2.i, f[0] * g2.w, f[1] * g2.h), a2 = ap(g2.i, f[2] * g2.w, f[3] * g2.h); p2.crop = [Math.min(a1[0], a2[0]), Math.min(a1[1], a2[1]), Math.max(a1[0], a2[0]), Math.max(a1[1], a2[1])]; drawOverlay(p2); } commit(); toast(`Cropped ${S.pages.length} pages`); }
    else if (k === 'cropclear') { const cp = S.pages[S.current]; const any = S.pages.filter((p) => p.crop); if (!any.length) return; if (cp && cp.crop) cp.crop = null; else any.forEach((p) => { p.crop = null; }); S.pages.forEach((p) => drawOverlay(p)); commit(); refreshFormatBar(); }
  }
});

/* ---------- Word-style text formatting and text boxes ---------- */
const TX_KEYS = ['font', 'bold', 'italic', 'underline', 'strike', 'align', 'lh', 'ls', 'hlc', 'list'];
const BX_KEYS = ['bg', 'bgop', 'grad', 'border', 'bc', 'bdw', 'bds', 'rad', 'shadow', 'pad', 'valign'];
const TX_DEF = { font: 'helv', align: 'left', lh: 1, ls: 0 };
const BX_DEF = { bg: '#ffffff', border: true, bc: '#8e8e93', bdw: 1, bds: 'solid', rad: 4, pad: 6, valign: 'top' };
const TEXT_INKS = [['Black', '#000000'], ['Dark grey', '#3a3a3c'], ['Grey', '#8e8e93'], ['White', '#ffffff'], ['Navy', '#0b1a3a'], ['Blue', '#0040dd'], ['Teal', '#0e7c86'], ['Green', '#1a7f37'], ['Orange', '#c93400'], ['Red', '#d70015'], ['Purple', '#8944ab'], ['Brown', '#7a4b1e']];
const HL_INKS = [['Yellow', '#fff200'], ['Bright green', '#7cfc00'], ['Turquoise', '#40e0d0'], ['Pink', '#ff9ad5'], ['Orange', '#ffb340'], ['Blue', '#9ecbff'], ['Grey', '#d1d1d6']];
const FILLS = [['White', '#ffffff'], ['Paper', '#fbf8f1'], ['Yellow', '#fff3a6'], ['Green', '#d4f5c9'], ['Blue', '#d6ecff'], ['Pink', '#ffd9ec'], ['Lavender', '#e6e0ff'], ['Light grey', '#e5e5ea'], ['Amber', '#ffd60a'], ['Teal', '#0e7c86'], ['Navy', '#0b1a3a'], ['Black', '#1c1c1e'], ['Red', '#d70015'], ['Green dark', '#1a7f37']];
const GRADS = [['Ocean', '#0a84ff', '#64d2ff'], ['Sunset', '#ff9f0a', '#ff375f'], ['Mint', '#d4f5c9', '#a0e7e5'], ['Steel', '#f2f2f7', '#c7c7cc'], ['Night', '#1c1c3c', '#3a3a8c'], ['Sand', '#fff3d6', '#f4d7a1'], ['Rose', '#ffe1ec', '#ffb3c7'], ['Forest', '#1a7f37', '#34c759'], ['Gold', '#fff1b8', '#f5b700'], ['Sea', '#003a70', '#0e7c86']];
const BOX_STYLES = [
  ['Plain', { color: '#000000', bg: '#ffffff', grad: null, border: true, bc: '#8e8e93', bdw: 1, bds: 'solid', rad: 2, shadow: false }],
  ['Card', { color: '#000000', bg: '#ffffff', grad: null, border: false, rad: 8, shadow: true }],
  ['Info', { color: '#0b1a3a', bg: '#d6ecff', grad: null, border: true, bc: '#0040dd', bdw: 1, bds: 'solid', rad: 6, shadow: false }],
  ['Success', { color: '#0b3d1a', bg: '#d4f5c9', grad: null, border: true, bc: '#1a7f37', bdw: 1, bds: 'solid', rad: 6, shadow: false }],
  ['Warning', { color: '#7a2e00', bg: '#fff3d6', grad: null, border: true, bc: '#c93400', bdw: 1.5, bds: 'solid', rad: 6, shadow: false }],
  ['Danger', { color: '#8a0010', bg: '#ffe1e1', grad: null, border: true, bc: '#d70015', bdw: 1.5, bds: 'solid', rad: 6, shadow: false }],
  ['Dark', { color: '#ffffff', bg: '#1c1c1e', grad: null, border: false, rad: 6, shadow: false }],
  ['Ocean', { color: '#ffffff', bg: null, grad: ['#0a84ff', '#64d2ff', 'v'], border: false, rad: 8, shadow: false }],
  ['Sunset', { color: '#ffffff', bg: null, grad: ['#ff9f0a', '#ff375f', 'd'], border: false, rad: 8, shadow: false }],
  ['Sticky', { color: '#000000', bg: '#fff3a6', grad: null, border: false, rad: 0, shadow: true }],
  ['Dashed', { color: '#000000', bg: null, grad: null, border: true, bc: '#3a3a3c', bdw: 1.2, bds: 'dash', rad: 4, shadow: false }],
  ['Clear', { bg: null, grad: null, border: false, shadow: false, rad: 0 }]
];
const pick = (o, keys) => { const r = {}; for (const k of keys) if (o[k] != null) r[k] = o[k]; return r; };
function txDefaults() { return Object.assign({}, TX_DEF, S.style.tx || {}); }
function bxDefaults() { return Object.assign({}, BX_DEF, S.style.bx || {}); }
function fmtTarget() { const s = selectedAnn(); return s && s.a.t === 'text' ? s : null; }
function fmtCur() { const s = fmtTarget(); if (s) return Object.assign({ font: 'helv', align: 'left', lh: 1, ls: 0, size: s.a.size, color: s.a.color }, s.a); return Object.assign({ size: S.style.size, color: S.style.ink }, txDefaults(), S.tool === 'tbox' ? Object.assign({ box: true }, bxDefaults()) : {}); }
function fmtSet(o, quiet) {
  const s = fmtTarget(); S.style.tx = S.style.tx || {}; S.style.bx = S.style.bx || {};
  // With something selected only that item changes; with nothing selected the choice becomes the default for new text.
  if (!s) for (const k in o) {
    if (TX_KEYS.includes(k)) { if (o[k] == null || o[k] === false) delete S.style.tx[k]; else S.style.tx[k] = o[k]; }
    else if (BX_KEYS.includes(k)) S.style.bx[k] = o[k];
    else if (k === 'color' && o[k]) S.style.ink = o[k];
    else if (k === 'size') S.style.size = o[k];
  }
  if (!s) saveStyle();
  if (s) applyStyleToSel((a) => { for (const k in o) { if (o[k] == null || o[k] === false) delete a[k]; else a[k] = o[k]; } setText(a, null, null); });
  if (!quiet) refreshFormatBar();
}
function fmtToggle(k) { const c = fmtCur(); fmtSet({ [k]: !c[k] }); }
function fmtCase(mode) {
  const s = fmtTarget(); if (!s) { toast('Select some text first'); return; }
  const ta = S.editing && S.editing.annId === s.a.id ? $('#textEditor') : null; const src = ta ? ta.value : s.a.text || '';
  const title = (t) => t.toLowerCase().replace(/(^|[\s\-(/"'])(\p{L})/gu, (m, a1, b1) => a1 + b1.toUpperCase());
  const sent = (t) => t.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (m, a1, b1) => a1 + b1.toUpperCase());
  const out = mode === 'up' ? src.toUpperCase() : mode === 'low' ? src.toLowerCase() : mode === 'title' ? title(src) : sent(src);
  if (ta) { ta.value = out; if (ta._fit) ta._fit(); }
  applyStyleToSel((a) => { setText(a, out); }); refreshFormatBar();
}
function fmtBox(on) {
  const s = fmtTarget(); if (!s) { setTool(on ? 'tbox' : 'text'); return; }
  applyStyleToSel((a) => {
    if (on) { const w = a.w; Object.assign(a, pick(bxDefaults(), BX_KEYS), { box: true }); if (a.bg == null && !a.grad) delete a.bg; a.w = Math.max(w + 12, a.size * 6); delete a.minH; }
    else { delete a.box; delete a.minH; }
    setText(a, null, null);
  });
  refreshFormatBar();
}
function swRow(list, cur, attr, extra = '') { return `<div class="swatches wrap" role="group">${extra}${list.map(([n, c]) => `<button class="sw" ${attr}="${c}" style="background:${c}" title="${n}" aria-label="${n}" aria-pressed="${String(cur || '').toLowerCase() === c.toLowerCase()}"></button>`).join('')}</div>`; }
const segH = (key, opts, cur) => `<div class="seg" role="group">${opts.map(([v, l, t]) => `<button data-fk="${key}" data-fv="${v}" aria-pressed="${String(cur) === String(v)}" title="${t || ''}">${l}</button>`).join('')}</div>`;
function fmtPanelHtml() {
  const c = fmtCur(); const s = fmtTarget(); const isBox = !!c.box; const hasDeco = isBox || c.bg || c.grad || c.border;
  const tog = (k, l, t) => `<button class="fbx${c[k] ? ' on' : ''}" data-tg="${k}" aria-pressed="${!!c[k]}" title="${t}">${l}</button>`;
  const fontSel = `<select class="inp" id="fpFont" aria-label="Font">${FONT_NAMES.map(([k, n]) => `<option value="${k}" ${c.font === k ? 'selected' : ''} style="font-family:${FONT_CSS[k].replace(/"/g, "'")}">${n}</option>`).join('')}</select>`;
  const grads = `<div class="grads">${GRADS.map(([n, a1, b1]) => `<button class="gsw" data-grad="${a1},${b1}" title="${n}" aria-label="${n} gradient" aria-pressed="${!!(c.grad && c.grad[0] === a1 && c.grad[1] === b1)}" style="background:linear-gradient(135deg,${a1},${b1})"></button>`).join('')}</div>`;
  const styles = `<div class="bstyles">${BOX_STYLES.map(([n, st], i) => { const bg = st.grad ? `linear-gradient(135deg,${st.grad[0]},${st.grad[1]})` : st.bg || 'transparent'; const bd = st.border ? `${Math.max(1, st.bdw)}px ${st.bds === 'dash' ? 'dashed' : 'solid'} ${st.bc}` : '1px dashed var(--sep-strong)'; return `<button class="bst" data-bst="${i}" title="${n}" style="background:${bg};border:${st.border ? bd : st.bg || st.grad ? '0' : bd};border-radius:${Math.min(st.rad || 0, 8)}px;color:${st.color || 'var(--label)'};${st.shadow ? 'box-shadow:2px 2px 0 rgba(0,0,0,.2)' : ''}">Aa<small>${n}</small></button>`; }).join('')}</div>`;
  const ink = /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#000000';
  return `<div class="fp-head"><b>Format text</b><button class="tbtn" data-fp-close aria-label="Close">${icon('close')}</button></div><div class="fp-body">
  <div class="fp-sec"><h4>Font</h4>
    <div class="fp-row">${fontSel}<div class="stepper"><button data-fsz="-1" aria-label="Smaller">−</button><input id="fpSize" type="number" min="0.25" max="300" step="0.25" value="${Math.round(c.size * 100) / 100}" aria-label="Font size"><button data-fsz="1" aria-label="Larger">+</button></div></div>
    <div class="fp-row">${tog('bold', '<b>B</b>', 'Bold (Ctrl+B)')}${tog('italic', '<i>I</i>', 'Italic (Ctrl+I)')}${tog('underline', '<u>U</u>', 'Underline (Ctrl+U)')}${tog('strike', '<s>S</s>', 'Strikethrough (Ctrl+Shift+X)')}
      <span class="fp-gap"></span><button class="fbx" data-case="up" title="UPPERCASE">AB</button><button class="fbx" data-case="low" title="lowercase">ab</button><button class="fbx" data-case="title" title="Capitalise Each Word">Ab</button><button class="fbx" data-case="sent" title="Sentence case">A.</button></div>
    <label class="fp-lbl">Font colour</label>${swRow(TEXT_INKS, c.color, 'data-fc', `<label class="sw sw-pick" title="More colours" style="--c:${ink}"><input type="color" id="fpInk" value="${ink}" aria-label="Custom font colour"></label>`)}
    <label class="fp-lbl">Text highlight</label>${swRow(HL_INKS, c.hlc, 'data-fh', `<button class="sw sw-none" data-fh="" title="No highlight" aria-pressed="${!c.hlc}"></button>`)}
  </div>
  <div class="fp-sec"><h4>Paragraph</h4>
    ${segH('align', [['left', icon('tal'), 'Align left (Ctrl+L)'], ['center', icon('tac'), 'Centre (Ctrl+E)'], ['right', icon('tar'), 'Align right (Ctrl+R)'], ['justify', icon('taj'), 'Justify (Ctrl+J)']], c.align || 'left')}
    <label class="fp-lbl">Line spacing</label>${segH('lh', [[1, '1.0'], [1.15, '1.15'], [1.5, '1.5'], [2, '2.0'], [2.5, '2.5']], c.lh || 1)}
    <label class="fp-lbl">Character spacing</label>${segH('ls', [[-0.5, 'Tight'], [0, 'Normal'], [1, 'Wide'], [2.5, 'Wider']], c.ls || 0)}
    <label class="fp-lbl">List</label>${segH('list', [['', 'None'], ['bullet', '• Bullets'], ['number', '1. Numbers']], c.list || '')}
  </div>
  <div class="fp-sec"><h4>Text box</h4>
    <div class="fp-row"><button class="fbx wide${isBox ? ' on' : ''}" data-box="${isBox ? 0 : 1}" aria-pressed="${isBox}">${icon('tbox')} ${isBox ? 'Text box on (wraps to width)' : 'Make it a text box'}</button></div>
    ${isBox || s ? `<label class="fp-lbl">Quick styles</label>${styles}
    <label class="fp-lbl">Fill</label>${swRow(FILLS, c.grad ? '' : c.bg, 'data-fb', `<button class="sw sw-none" data-fb="" title="No fill" aria-pressed="${!c.bg && !c.grad}"></button><label class="sw sw-pick" title="More colours" style="--c:${/^#[0-9a-f]{6}$/i.test(c.bg || '') ? c.bg : '#ffffff'}"><input type="color" id="fpFill" value="${/^#[0-9a-f]{6}$/i.test(c.bg || '') ? c.bg : '#ffffff'}" aria-label="Custom fill"></label>`)}
    <label class="fp-lbl">Gradient</label>${grads}
    ${c.grad ? segH('gdir', [['v', '↓ Top to bottom'], ['h', '→ Left to right'], ['d', '↘ Diagonal']], c.grad[2]) : ''}
    <label class="fp-lbl">Fill transparency <output id="fpBgopV">${Math.round((1 - (c.bgop == null ? 1 : c.bgop)) * 100)}%</output></label><input type="range" id="fpBgop" min="0" max="90" step="5" value="${Math.round((1 - (c.bgop == null ? 1 : c.bgop)) * 100)}">
    <label class="fp-lbl">Border</label>${segH('bds', [['none', 'None'], ['solid', 'Solid'], ['dash', 'Dashed'], ['dot', 'Dotted']], c.border ? c.bds || 'solid' : 'none')}
    ${c.border ? `${swRow(TEXT_INKS, c.bc || c.color, 'data-fbc')}<div class="fp-row"><span class="fp-lbl" style="margin:0">Weight</span>${segH('bdw', [[0.5, '½'], [1, '1'], [1.5, '1½'], [2.25, '2¼'], [3, '3'], [4.5, '4½']], c.bdw != null ? c.bdw : '')}</div>` : ''}
    <label class="fp-lbl">Corners</label>${segH('rad', [[0, 'Square'], [4, 'Soft'], [10, 'Round'], [999, 'Pill']], c.rad || 0)}
    <div class="fp-row"><button class="fbx wide${c.shadow ? ' on' : ''}" data-tg="shadow" aria-pressed="${!!c.shadow}">Shadow</button></div>
    ${hasDeco ? `<label class="fp-lbl">Inner margin</label>${segH('pad', [[2, 'Narrow'], [6, 'Normal'], [12, 'Wide'], [20, 'Extra']], c.pad != null ? c.pad : '')}` : ''}
    ${isBox ? `<label class="fp-lbl">Vertical alignment</label>${segH('valign', [['top', 'Top'], ['middle', 'Middle'], ['bottom', 'Bottom']], c.valign || 'top')}` : ''}` : '<p class="fp-note">Pick the Text box tool, or select some text, to style its background and border.</p>'}
  </div>
  <div class="fp-sec"><h4>Transparency <output id="fpOpV">${Math.round((1 - (c.opacity == null ? 1 : c.opacity)) * 100)}%</output></h4><input type="range" id="fpOp" min="0" max="90" step="5" value="${Math.round((1 - (c.opacity == null ? 1 : c.opacity)) * 100)}" ${s ? '' : 'disabled'}></div></div>`;
}
function fmtPanelWanted() { return S.fmtOpen && S.pages.length && (fmtTarget() || ['text', 'tbox', 'note'].includes(S.tool)) && !(S.sel && selIds().length > 1); }
function refreshFmtPanel() {
  let pn = $('#fmtPanel');
  const stg = $('.stage'); if (stg) stg.classList.toggle('fp-open', !!fmtPanelWanted());
  if (!fmtPanelWanted()) { if (pn) pn.hidden = true; return; }
  if (!pn) { pn = document.createElement('div'); pn.id = 'fmtPanel'; pn.className = 'fmtpanel'; pn.setAttribute('role', 'dialog'); pn.setAttribute('aria-label', 'Format text'); ($('.stage') || document.body).appendChild(pn); bindFmtPanel(pn); }
  const ob = pn.querySelector('.fp-body'); const sc = ob ? ob.scrollTop : 0; pn.innerHTML = fmtPanelHtml(); pn.hidden = false; pn.querySelector('.fp-body').scrollTop = sc;
}
function openFmtPanel(on = !S.fmtOpen) { S.fmtOpen = on; refreshFmtPanel(); refreshFormatBar(); }
function bindFmtPanel(pn) {
  pn.addEventListener('pointerdown', (e) => { if (S.editing && e.target.closest('button')) e.preventDefault(); });
  pn.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-fp-close')) { openFmtPanel(false); return; }
    const c = fmtCur();
    if (b.dataset.tg) fmtToggle(b.dataset.tg);
    else if (b.dataset.case) fmtCase(b.dataset.case);
    else if (b.dataset.fsz) { const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96, 120, 160, 200, 300]; const v = c.size; const d = +b.dataset.fsz; let nv = d > 0 ? steps.find((x) => x > v + 0.01) : [...steps].reverse().find((x) => x < v - 0.01); if (nv == null) nv = v; fmtSize(nv); }
    else if (b.dataset.fc != null) fmtSet({ color: b.dataset.fc });
    else if (b.dataset.fh != null) fmtSet({ hlc: b.dataset.fh || null });
    else if (b.dataset.fb != null) fmtSet({ bg: b.dataset.fb || null, grad: null });
    else if (b.dataset.fbc != null) fmtSet({ bc: b.dataset.fbc });
    else if (b.dataset.grad) { const [g1, g2] = b.dataset.grad.split(','); fmtSet({ grad: [g1, g2, (c.grad && c.grad[2]) || 'v'], bg: null }); }
    else if (b.dataset.bst != null) { const st = BOX_STYLES[+b.dataset.bst][1]; const o = Object.assign({}, st); if (!o.border) o.border = false; fmtSet(o); }
    else if (b.dataset.box != null) fmtBox(b.dataset.box === '1');
    else if (b.dataset.fk) {
      const k = b.dataset.fk; let v = b.dataset.fv;
      if (k === 'bds') { if (v === 'none') fmtSet({ border: false }); else fmtSet({ border: true, bds: v, bc: c.bc || (c.color === '#ffffff' ? '#8e8e93' : c.color) }); return; }
      if (k === 'gdir') { if (c.grad) fmtSet({ grad: [c.grad[0], c.grad[1], v] }); return; }
      if (['lh', 'ls', 'bdw', 'rad', 'pad'].includes(k)) v = +v;
      fmtSet({ [k]: v === '' ? null : v });
    }
  });
  pn.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'fpFont') fmtSet({ font: t.value });
    else if (t.id === 'fpSize') { const v = clamp(Math.round((+t.value || 12) * 100) / 100, 0.25, 300); fmtSize(v); }
    else if (t.id === 'fpInk') fmtSet({ color: t.value });
    else if (t.id === 'fpFill') fmtSet({ bg: t.value, grad: null });
    else if (t.id === 'fpOp' || t.id === 'fpBgop') refreshFormatBar();
  });
  pn.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'fpOp') { const v = 1 - +t.value / 100; $('#fpOpV').textContent = t.value + '%'; const s = fmtTarget(); if (s) applyStyleToSel((a) => { if (v >= 1) delete a.opacity; else a.opacity = v; }); }
    else if (t.id === 'fpBgop') { const v = 1 - +t.value / 100; $('#fpBgopV').textContent = t.value + '%'; fmtSet({ bgop: v >= 1 ? null : v }, true); }
    else if (t.id === 'fpInk') { t.parentElement.style.setProperty('--c', t.value); fmtSet({ color: t.value }, true); }
    else if (t.id === 'fpFill') { t.parentElement.style.setProperty('--c', t.value); fmtSet({ bg: t.value, grad: null }, true); }
  });
  pn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { openFmtPanel(false); } e.stopPropagation(); });
  pn.addEventListener('focusout', () => setTimeout(() => { const ae = document.activeElement; const ta = $('#textEditor'); if (S.editing && ta && ae !== ta && !(ae && ae.closest && ae.closest('#fmtPanel,#formatBar'))) closeEditor(false); }, 150));
}
function fmtSize(v) { const s = fmtTarget(); if (!s) { S.style.size = v; saveStyle(); refreshFormatBar(); return; } applyStyleToSel((a) => setText(a, null, v)); refreshFormatBar(); }

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
sbList.addEventListener('dragstart', (e) => { const b = e.target.closest('.thumb'); if (!b) return; dragThumb = b.dataset.id; e.dataTransfer.effectAllowed = 'copyMove'; e.dataTransfer.setData('text/plain', dragThumb); });
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
async function rasterPage(doc, index, view, dpi = 158, q = 0.9) {
  const pg = await doc.pdf.getPage(index + 1); const v1 = pg.getViewport({ scale: 1, rotation: 0 }); const vp = pg.getViewport({ scale: Math.min(dpi / 72, Math.sqrt(40e6 / (v1.width * v1.height))), rotation: 0 });
  const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: x, viewport: vp }).promise;
  const out = dataUrlBytes(c.toDataURL('image/jpeg', q)); c.width = c.height = 0; return out;
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
// A page counts as heavy if it took long to draw on screen, or has a very large number of drawing operations.
async function isHeavyPage(p) {
  if (p.kind !== 'pdf') return false; if (pst(p).heavy) return true;
  const doc = S.docs.get(p.docId); if (doc.widgets && doc.widgets.has && doc.widgets.has(p.index)) return false;
  if (pst(p).ops == null) { try { const pg = await doc.pdf.getPage(p.index + 1); const ol = await pg.getOperatorList(); pst(p).ops = ol.fnArray.length; } catch (e) { pst(p).ops = 0; } }
  return pst(p).ops > 25000;
}
async function buildPdf(list, onProgress, opts = {}) {
  const out = await PL.PDFDocument.create();
  out.setProducer('Meridian PDF Mate by Tango Juliet Dev'); out.setCreator('Meridian PDF Mate');
  const fontCache = {}; const font = async (k = 'helv', b = 0) => { const i = +b || 0; const key = k + i; if (!fontCache[key]) fontCache[key] = await out.embedFont(PL.StandardFonts[(FONT_KEYS[k] || FONT_KEYS.helv)[i]]); return fontCache[key]; };
  const libs = new Map(); const imgCache = new Map();
  const libFor = async (doc) => {
    if (libs.has(doc.id)) return libs.get(doc.id); let ld = null;
    if (!doc.encrypted) {
      try { ld = await PL.PDFDocument.load(doc.ebytes || doc.bytes, { updateMetadata: false }); }
      catch (e) { ld = null; }
      if (ld && doc.fields.length) {
        try { fillForm(ld, doc); }
        catch (e) { console.warn('flatten failed', e); try { ld = await PL.PDFDocument.load(doc.ebytes || doc.bytes, { updateMetadata: false }); } catch (e2) { ld = null; } doc._flatFail = true; }
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
    if (p.kind === 'pdf' && opts.flatHeavy && await isHeavyPage(p)) {
      const doc = S.docs.get(p.docId); const jpg = await out.embedJpg(await rasterPage(doc, p.index, p.view, opts.flatDpi || 220, 0.9)); const [x0, y0, x1, y1] = p.view;
      page = out.addPage([x1 - x0, y1 - y0]); page.setMediaBox(x0, y0, x1 - x0, y1 - y0);
      page.drawImage(jpg, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }); page.setRotation(PL.degrees(tr(p)));
    } else if (p.kind === 'pdf') {
      const doc = S.docs.get(p.docId); const ld = await libFor(doc);
      if (ld) { try { [page] = await out.copyPages(ld, [p.index]); out.addPage(page); isolate(page); } catch (e) { console.warn(e); page = null; } }
      if (!page) {
        const jpg = await out.embedJpg(await rasterPage(doc, p.index)); const [x0, y0, x1, y1] = p.view;
        page = out.addPage([x1 - x0, y1 - y0]); page.setMediaBox(x0, y0, x1 - x0, y1 - y0);
        page.drawImage(jpg, { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
      }
      page.setRotation(PL.degrees(tr(p)));
    } else {
      const [x0, y0, x1, y1] = p.view; page = out.addPage([x1 - x0, y1 - y0]); if (x0 || y0) page.setMediaBox(x0, y0, x1 - x0, y1 - y0);
      if (p.kind === 'img') page.drawImage(await embedImg(p.imgId), { x: 0, y: 0, width: x1 - x0, height: y1 - y0 });
      else await drawPaperPdf(page, p, font);
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
const FILLO = (a) => (a.fill ? { color: hexRgb(a.fill), opacity: a.fop == null ? 1 : a.fop } : {});
async function drawAnn(page, a, font, embedImg) {
  const col = hexRgb(a.color); const w = a.width || 1.5; const RC = PL.LineCapStyle.Round;
  const seg = (s, e) => page.drawLine({ start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: w, color: col, lineCap: RC });
  const bc = BOXES.has(a.t) ? [a.x + a.w / 2, a.y + a.h / 2] : null; const brot = PL.degrees(a.rot || 0);
  const RB = (x, y) => { const [px, py] = a.rot ? rotPt(x, y, bc[0], bc[1], a.rot) : [x, y]; return { x: px, y: py, rotate: brot }; };
  if (a.t === 'white') page.drawRectangle({ ...RB(a.x, a.y), width: a.w, height: a.h, color: a.fill ? hexRgb(a.fill) : PL.rgb(1, 1, 1) });
  else if (a.t === 'hl') page.drawRectangle({ ...RB(a.x, a.y), width: a.w, height: a.h, color: col, opacity: 0.4, blendMode: PL.BlendMode.Multiply });
  else if (a.t === 'rect') page.drawRectangle({ ...RB(a.x + w / 2, a.y + w / 2), width: Math.max(0, a.w - w), height: Math.max(0, a.h - w), borderColor: col, borderWidth: w, ...FILLO(a) });
  else if (a.t === 'ellipse') page.drawEllipse({ x: bc[0], y: bc[1], rotate: brot, xScale: Math.max(0.1, a.w / 2 - w / 2), yScale: Math.max(0.1, a.h / 2 - w / 2), borderColor: col, borderWidth: w, ...FILLO(a) });
  else if (a.t === 'shape') {
    const map = (x, y) => { let q = [a.x + x, a.y + a.h - y]; if (a.rot) q = rotPt(q[0], q[1], bc[0], bc[1], a.rot); return [q[0], -q[1]]; };
    page.pushOperators(PL.pushGraphicsState(), PL.setLineJoin(PL.LineJoinStyle.Round), PL.setLineCap(PL.LineCapStyle.Round));
    for (const sb of shapeSubs(a.kind, a.w, a.h)) page.drawSvgPath(subD(sb, map), { x: 0, y: 0, borderColor: col, borderWidth: w, ...(sb.open ? {} : FILLO(a)) });
    page.pushOperators(PL.popGraphicsState());
  }
  else if (a.t === 'redact') page.drawRectangle({ ...RB(a.x, a.y), width: a.w, height: a.h, color: PL.rgb(0, 0, 0) });
  else if (a.t === 'measure' || a.t === 'area' || a.t === 'cloud') await measPdf(page, a, font);
  else if (a.t === 'mark') {
    if (a.kind === 'hl') for (const [x, y, rw, rh] of a.rects) page.drawRectangle({ x, y, width: rw, height: rh, color: col, opacity: 0.4, blendMode: PL.BlendMode.Multiply });
    else for (const [s0, s1] of a.segs || []) page.drawLine({ start: { x: s0[0], y: s0[1] }, end: { x: s1[0], y: s1[1] }, thickness: a.width || 1, color: col });
  }
  else if (a.t === 'line' || a.t === 'arrow') { seg(a.pts[0], a.pts[1]); if (a.t === 'arrow') for (const [s, e] of arrowHead(a)) seg(s, e); }
  else if (a.t === 'pen') await inkPdf(page, a, col);
  else if (a.t === 'tick' || a.t === 'cross') { for (const [s, e] of markSegments(a)) seg(s, e); }
  else if (a.t === 'image') { const im = S.imgs.get(a.imgId); if (!im) return; page.drawImage(await embedImg(a.imgId), { x: a.ax, y: a.ay, width: a.w, height: a.h, rotate: PL.degrees(a.r), opacity: a.op == null ? 1 : a.op }); }
  else if (a.t === 'text') {
    const { U, V } = UV(a.r); const L = layoutText(a); const op = a.opacity == null ? 1 : a.opacity; const rot = PL.degrees(a.r); const rad = a.rad || 0;
    const at = (u, v) => [a.ax + u * U[0] + v * V[0], a.ay + u * U[1] + v * V[1]];
    const top = at(0, a.h); const path = (d, o) => page.drawSvgPath(d, Object.assign({ x: top[0], y: top[1], rotate: rot }, o));
    const bgop = (a.bgop == null ? 1 : a.bgop) * op;
    if (a.shadow) path(boxPath(shOff(a), shOff(a), a.w, a.h, rad), { color: PL.rgb(0, 0, 0), opacity: 0.22 * op });
    if (a.grad) { const png = await page.doc.embedPng(dataUrlBytes(gradCanvas(a).toDataURL('image/png'))); const [x0, y0] = at(0, 0); page.drawImage(png, { x: x0, y: y0, width: a.w, height: a.h, rotate: rot, opacity: bgop }); }
    else if (a.bg) path(boxPath(0, 0, a.w, a.h, rad), { color: hexRgb(a.bg), opacity: bgop });
    if (a.border) { const bw = bdW(a); const da = bdDash(a, bw); const o = { borderColor: hexRgb(a.bc || a.color), borderWidth: bw, borderOpacity: op }; if (da) { o.borderDashArray = da; o.borderLineCap = PL.LineCapStyle.Round; } path(boxPath(bw / 2, bw / 2, Math.max(0, a.w - bw), Math.max(0, a.h - bw), Math.max(0, rad - bw / 2)), o); }
    const th = Math.max(0.5, a.size * 0.065); const bar = (x, y, w, h, c) => { const [px, py] = at(x, a.h - y - h); page.drawRectangle({ x: px, y: py, width: w, height: h, color: c, opacity: op, rotate: rot }); };
    for (const r of L.rows) { if (a.hlc && r.s) bar(r.x - a.size * 0.05, r.top, (r.jw || r.w) + a.size * 0.1, L.lineBox, hexRgb(a.hlc)); }
    // glyph runs: [text, x, baselineY]
    const runs = []; for (const r of L.rows) { if (r.pre) runs.push([r.pre, L.pad, r.y]); if (r.jw) for (const w of justWords(a, r)) runs.push([w.w, w.x, r.y]); else if (r.s) runs.push([r.s, r.x, r.y]); }
    if (a.uni) {
      const k = 300 / 72; const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(a.w * k)); c.height = Math.max(1, Math.ceil(a.h * k));
      const x = c.getContext('2d'); x.scale(k, k); x.globalAlpha = op; x.font = uniFont(a, a.size); x.fillStyle = a.color; x.textBaseline = 'alphabetic'; if (a.ls) try { x.letterSpacing = a.ls + 'px'; } catch (e) {}
      for (const [t, rx, ry] of runs) x.fillText(t, rx, ry);
      const png = await page.doc.embedPng(dataUrlBytes(c.toDataURL('image/png'))); const [x0, y0] = at(0, 0);
      page.drawImage(png, { x: x0, y: y0, width: a.w, height: a.h, rotate: rot });
    } else {
      const f = await font(a.font || 'helv', fsty(a)); const col2 = col;
      if (a.ls) page.pushOperators(PL.setCharacterSpacing(a.ls));
      for (const [t, rx, ry] of runs) { const [x, y] = at(rx, a.h - ry); page.drawText(t, { x, y, size: a.size, font: f, color: col2, opacity: op, rotate: rot }); }
      if (a.ls) page.pushOperators(PL.setCharacterSpacing(0));
    }
    for (const r of L.rows) { if (!r.s) continue; const rw = r.jw || r.w; if (a.underline) bar(r.x, r.y + a.size * 0.1, rw, th, col); if (a.strike) bar(r.x, r.y - a.size * 0.3 - th / 2, rw, th, col); }
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
    <div class="field"><span class="flabel">Drawings</span><div class="seg" role="group"><button aria-pressed="true" data-fh="0">Keep as is</button><button aria-pressed="false" data-fh="1">Flatten heavy pages</button></div>
      <small class="sub" id="fhNote" style="margin:6px 0 0;display:block">${S.pages.some((p) => pst(p).heavy) ? 'This file has heavy drawing pages. Flattening makes it open fast on any device.' : 'Heavy drawing pages stay as vector graphics.'}</small></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-print>${icon('print')} Print</button>${canShare ? `<button class="btn" data-share>${icon('share')} Share</button>` : ''}<button class="btn primary" data-dl>${icon('download')} Download</button></div>`);
  sh.querySelectorAll('[data-sc]').forEach((b) => b.onclick = () => { scope = b.dataset.sc; sh.querySelectorAll('[data-sc]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  let cz = 0, ps = '';
  sh.querySelectorAll('[data-ps]').forEach((b) => b.onclick = () => { ps = b.dataset.ps; sh.querySelectorAll('[data-ps]').forEach((z) => z.setAttribute('aria-pressed', z === b)); });
  let fh = false;
  sh.querySelectorAll('[data-fh]').forEach((b) => b.onclick = () => { fh = b.dataset.fh === '1'; sh.querySelectorAll('[data-fh]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#fhNote').textContent = fh ? 'Heavy drawing pages are saved as sharp 220 dpi images. They open instantly but text on them is no longer selectable. Your markup stays as vector.' : 'Heavy drawing pages stay as vector graphics.'; });
  sh.querySelectorAll('[data-cz]').forEach((b) => b.onclick = () => { cz = +b.dataset.cz; sh.querySelectorAll('[data-cz]').forEach((z) => z.setAttribute('aria-pressed', z === b)); sh.querySelector('#czNote').textContent = cz ? `Pages are saved as images at ${cz} dpi for email over slow connections. Text will no longer be selectable.` : 'Keeps text selectable and sharp.'; });
  const run = async (mode) => {
    const name = (() => { let n = sh.querySelector('#saveName').value.trim() || 'Untitled'; n = n.replace(/[\\/:*?"<>|]+/g, '-'); return /\.pdf$/i.test(n) ? n : n + '.pdf'; })();
    $('#docName').value = name.replace(/\.pdf$/i, '');
    const btns = sh.querySelectorAll('.acts .btn'); btns.forEach((b) => b.disabled = true);
    const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i');
    try {
      const list = scope === 'sel' ? S.pages.filter((p) => S.selPages.has(p.id)) : S.pages;
      let bytes = await buildPdf(list, (f) => { bar.style.width = Math.round(f * (cz ? 50 : 100)) + '%'; }, { pageSize: ps, flatHeavy: fh });
      let keptVec = false;
      if (fh) { const vec = await buildPdf(list, null, { pageSize: ps }); if (vec.length <= bytes.length) { bytes = vec; keptVec = true; } }
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
      toast(flat ? 'Saved. Some form fields could not be flattened.' : keptVec ? `Saved ${name} (${sz}). Drawings kept as vector, flattening would have made the file bigger.` : `Saved ${name} (${sz})`, { ms: keptVec ? 4200 : 2600 });
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
// ---------- Print layouts (3.6) ----------
const PAPERS = { doc: ['Same as document'], a4: ['A4', 595.28, 841.89], a3: ['A3', 841.89, 1190.55], a5: ['A5', 419.53, 595.28], letter: ['Letter', 612, 792], legal: ['Legal', 612, 1008] };
const NUP = { 2: [2, 1, true], 4: [2, 2, false], 6: [3, 2, true], 9: [3, 3, false], 16: [4, 4, false] };
// Draws one source page, with its rotation and crop, fitted and centred in a cell of the sheet.
async function placeInCell(out, sheet, pg, cell, border) {
  const cb = pg.getCropBox(); const r = ((pg.getRotation().angle % 360) + 360) % 360; const w = cb.width, h = cb.height;
  const dw = r % 180 ? h : w, dh = r % 180 ? w : h; const k = Math.min(cell.w / dw, cell.h / dh); const ox = cell.x + (cell.w - dw * k) / 2, oy = cell.y + (cell.h - dh * k) / 2;
  const emb = await out.embedPage(pg, { left: cb.x, bottom: cb.y, right: cb.x + w, top: cb.y + h });
  const pos = { 0: [ox, oy], 90: [ox, oy + w * k], 180: [ox + w * k, oy + h * k], 270: [ox + h * k, oy] }[r] || [ox, oy];
  sheet.drawPage(emb, { x: pos[0], y: pos[1], xScale: k, yScale: k, rotate: PL.degrees(-r) });
  if (border) sheet.drawRectangle({ x: ox, y: oy, width: dw * k, height: dh * k, borderColor: PL.rgb(0.55, 0.55, 0.58), borderWidth: 0.5 });
}
const pageDims = (pg) => { const cb = pg.getCropBox(); const r = ((pg.getRotation().angle % 360) + 360) % 360; return r % 180 ? [cb.height, cb.width] : [cb.width, cb.height]; };
async function layoutPdf(bytes, o) {
  const src = await PL.PDFDocument.load(bytes); const pages = src.getPages(); const n = pages.length;
  if (o.layout === 'normal' && o.paper === 'doc') return bytes;
  const out = await PL.PDFDocument.create(); out.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  const P = PAPERS[o.paper === 'doc' ? 'a4' : o.paper]; const pw = P[1], ph = P[2];
  if (o.layout === 'normal') {
    for (const pg of pages) { const [dw, dh] = pageDims(pg); const land = dw > dh; const W = land ? ph : pw, H = land ? pw : ph; const m = 0; const sh = out.addPage([W, H]); await placeInCell(out, sh, pg, { x: m, y: m, w: W - 2 * m, h: H - 2 * m }); }
  } else if (o.layout === 'nup') {
    const [cols, rows, landSheet] = NUP[o.nup] || NUP[2]; const W = landSheet ? ph : pw, H = landSheet ? pw : ph; const m = 18, gap = 8;
    const cw = (W - 2 * m - gap * (cols - 1)) / cols, ch = (H - 2 * m - gap * (rows - 1)) / rows; const per = cols * rows;
    for (let s = 0; s < n; s += per) { const sh = out.addPage([W, H]); for (let j = 0; j < per && s + j < n; j++) { const c = j % cols, rr = Math.floor(j / cols); await placeInCell(out, sh, pages[s + j], { x: m + c * (cw + gap), y: H - m - (rr + 1) * ch - rr * gap, w: cw, h: ch }, o.borders); } }
  } else if (o.layout === 'booklet') {
    const N = Math.ceil(n / 4) * 4 || 4; const W = ph, H = pw; const m = 14, half = W / 2;
    const put = async (sh, idx, left) => { if (idx < n) await placeInCell(out, sh, pages[idx], { x: left ? m : half + m, y: m, w: half - 2 * m, h: H - 2 * m }, o.borders); };
    for (let s = 0; s < N / 4; s++) {
      const f = out.addPage([W, H]); await put(f, N - 1 - 2 * s, true); await put(f, 2 * s, false);
      const b = out.addPage([W, H]); await put(b, 2 * s + 1, true); await put(b, N - 2 - 2 * s, false);
    }
  }
  return out.save();
}
// Copies, margin label, two-sided flag and the manual two-sided split, all on the finished sheets.
async function finishPrint(bytes, o) {
  const src = await PL.PDFDocument.load(bytes); let idx = src.getPageIndices();
  const duplexed = o.sides !== 'one';
  if (o.copies > 1) {
    const unit = duplexed ? 2 : 1; const units = []; for (let i = 0; i < idx.length; i += unit) units.push(idx.slice(i, i + unit));
    if (duplexed) units.forEach((u) => { if (u.length < 2) u.push(-1); });
    const rep = []; if (o.collate) for (let c = 0; c < o.copies; c++) units.forEach((u) => rep.push(...u)); else units.forEach((u) => { for (let c = 0; c < o.copies; c++) rep.push(...u); });
    idx = rep;
  }
  if (o.sides === 'manual') {
    if (idx.length % 2) idx.push(-1);
    const fronts = idx.filter((_, i) => i % 2 === 0), backs = idx.filter((_, i) => i % 2 === 1).reverse();
    idx = o.part === 'fronts' ? fronts : backs;
  }
  const out = await PL.PDFDocument.create(); out.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  const real = idx.filter((i) => i >= 0); const copied = real.length ? await out.copyPages(src, real) : []; let ci = 0;
  const first = src.getPage(0); const [fw, fh] = pageDims(first); const total = idx.length;
  const font = o.label ? await out.embedFont(PL.StandardFonts.Helvetica) : null;
  const name = String(o.name || '').replace(/[^\x20-\x7e\xa0-\xff]/g, '?').slice(0, 80); const stamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  for (let k = 0; k < idx.length; k++) {
    let pg; if (idx[k] < 0) { const cb = first.getCropBox(); pg = out.addPage([fw, fh]); void cb; } else { pg = copied[ci++]; out.addPage(pg); }
    if (o.sides === 'manual' && o.part === 'backs' && o.bind === 'short') pg.setRotation(PL.degrees((pg.getRotation().angle + 180) % 360));
    if (font && idx[k] >= 0) {
      const rot = ((pg.getRotation().angle % 360) + 360) % 360; const cb = pg.getCropBox(); const [dw] = rot % 180 ? [cb.height, cb.width] : [cb.width, cb.height];
      const txt = `${name}   ${stamp}   Page ${idx[k] + 1} of ${src.getPageCount()}`; const size = 7; const tw = font.widthOfTextAtSize(txt, size);
      // Write in the bottom margin of the page as it is seen, whatever its rotation.
      const at = (u, v) => ({ 0: [cb.x + u, cb.y + v], 90: [cb.x + cb.width - v, cb.y + u], 180: [cb.x + cb.width - u, cb.y + cb.height - v], 270: [cb.x + v, cb.y + cb.height - u] }[rot]);
      const [tx, ty] = at((dw - tw) / 2, 9); pg.drawText(txt, { x: tx, y: ty, size, font, color: PL.rgb(0.45, 0.45, 0.48), rotate: PL.degrees(rot) });
    }
  }
  if (duplexed && o.sides === 'two') { try { out.catalog.getOrCreateViewerPreferences().setDuplex(PL.Duplex[o.bind === 'short' ? 'DuplexFlipShortEdge' : 'DuplexFlipLongEdge']); } catch (e) {} }
  else { try { out.catalog.getOrCreateViewerPreferences().setDuplex(PL.Duplex.Simplex); } catch (e) {} }
  if (o.copies > 1 && o.sides === 'one') { try { out.catalog.getOrCreateViewerPreferences().setNumCopies(1); } catch (e) {} }
  void total; return out.save();
}
function openPrint() {
  if (!S.pages.length) return; closeEditor(false);
  const nSel = S.selPages.size; const st = Object.assign({ sides: 'one', bind: 'long', layout: 'normal', nup: 2, paper: 'doc', content: 'all', gray: false, label: false, borders: false, collate: true }, lsGet('pdfmate.print', {}));
  let scope = nSel ? 'sel' : 'all', sides = st.sides, bind = st.bind, layout = st.layout;
  const cur = Math.min(S.current, S.pages.length - 1) + 1;
  const desk = canIframePrint();
  const opt = (v, l, c) => `<option value="${v}" ${String(v) === String(c) ? 'selected' : ''}>${l}</option>`;
  const sh = sheet(`<h2>Print</h2><p class="sub">${S.pages.length} page${S.pages.length > 1 ? 's' : ''}. Markup, signatures and form entries print as shown.</p>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group" aria-label="Pages"><button data-sc="all">All</button><button data-sc="cur">Current (${cur})</button>${nSel ? `<button data-sc="sel">Selected ${nSel}</button>` : ''}<button data-sc="range">Range</button></div>
      <input id="prRange" class="inp" style="margin-top:8px" placeholder="For example 1-3, 6" inputmode="numeric" autocomplete="off" hidden>
      <div class="pr-row"><select id="prSub" class="inp" aria-label="Which pages">${opt('all', 'All pages in range', 'all')}${opt('odd', 'Odd pages only', '')}${opt('even', 'Even pages only', '')}</select><label class="chkrow"><input type="checkbox" id="prRev"> Reverse order</label></div></div>
    <div class="field"><span class="flabel">Copies</span><div class="pr-row"><div class="stepper pr-step"><button type="button" data-cp="-1" aria-label="Fewer copies">−</button><input id="prCopies" class="inp" value="1" inputmode="numeric" aria-label="Copies"><button type="button" data-cp="1" aria-label="More copies">+</button></div><label class="chkrow"><input type="checkbox" id="prCollate" ${st.collate ? 'checked' : ''}> Collate (1 2 3, 1 2 3)</label></div></div>
    <div class="field"><span class="flabel">Layout</span><div class="seg" role="group" aria-label="Layout"><button data-ly="normal">One per sheet</button><button data-ly="nup">Several per sheet</button><button data-ly="booklet">Booklet</button></div>
      <div class="pr-row" id="prNupRow"><select id="prNup" class="inp" aria-label="Pages per sheet">${[2, 4, 6, 9, 16].map((k) => opt(k, k + ' pages per sheet', st.nup)).join('')}</select><label class="chkrow"><input type="checkbox" id="prBorders" ${st.borders ? 'checked' : ''}> Page borders</label></div></div>
    <div class="field"><span class="flabel">Paper and scaling</span><select id="prPaper" class="inp" aria-label="Paper">${Object.entries(PAPERS).map(([k, v]) => opt(k, k === 'doc' ? 'Same as document, actual size' : `Fit to ${v[0]}`, st.paper)).join('')}</select></div>
    <div class="field"><span class="flabel">Sides</span><div class="seg" role="group" aria-label="Sides"><button data-sd="one">One-sided</button><button data-sd="two">Two-sided</button><button data-sd="manual">Manual two-sided</button></div></div>
    <div class="field" id="prBindF"><span class="flabel">Binding</span><div class="seg" role="group" aria-label="Binding" style="height:auto">
      <button data-bd="long" style="height:auto;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px">${icon('longedge', 'style="width:26px;height:26px"')}<span>Long edge</span><small style="color:var(--label-3);font-weight:400">Book style</small></button>
      <button data-bd="short" style="height:auto;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:4px">${icon('shortedge', 'style="width:26px;height:26px"')}<span>Short edge</span><small style="color:var(--label-3);font-weight:400">Flip up, calendar style</small></button></div></div>
    <div class="field"><span class="flabel">Print what</span><select id="prContent" class="inp" aria-label="Print what">${opt('all', 'Document and markup', st.content)}${opt('doc', 'Document only, without markup', st.content)}${opt('mark', 'Markup only, for pre-printed forms', st.content)}</select>
      <label class="chkrow"><input type="checkbox" id="prGray" ${st.gray ? 'checked' : ''}> Black and white (saves colour ink)</label>
      <label class="chkrow"><input type="checkbox" id="prLabel" ${st.label ? 'checked' : ''}> File name, date and time in the bottom margin</label></div>
    <p class="sub" id="prNote" style="margin:4px 0 0"></p>
    <p class="sub pr-sum" id="prSum"></p>
    <div class="progress" hidden><i></i></div>
    <div class="acts" id="prActs"></div>`);
  const $s = (q) => sh.querySelector(q); const range = $s('#prRange');
  if (sides !== 'one' && layout === 'booklet') bind = 'short';
  const copies = () => clamp(parseInt($s('#prCopies').value, 10) || 1, 1, 99);
  const pick = () => {
    let list;
    if (scope === 'all') list = S.pages; else if (scope === 'cur') list = [S.pages[cur - 1]];
    else if (scope === 'sel') list = S.pages.filter((p) => S.selPages.has(p.id));
    else { const idx = parseRange(range.value, S.pages.length); if (!idx) return null; list = idx.map((i) => S.pages[i]); }
    const sub = $s('#prSub').value; if (sub !== 'all') list = list.filter((p) => { const n = S.pages.indexOf(p) + 1; return sub === 'odd' ? n % 2 === 1 : n % 2 === 0; });
    if ($s('#prRev').checked) list = list.slice().reverse();
    return list;
  };
  const opts = () => ({ sides, bind: layout === 'booklet' ? 'short' : bind, layout, nup: +$s('#prNup').value, paper: $s('#prPaper').value, content: $s('#prContent').value, gray: $s('#prGray').checked, label: $s('#prLabel').checked, borders: $s('#prBorders').checked, collate: $s('#prCollate').checked, copies: copies(), name: $('#docName').value || 'Document' });
  const summary = () => {
    const l = pick(); if (!l) return 'Type a page range to see how much paper this takes.'; if (!l.length) return 'No pages match. Check the range and the odd or even choice.';
    const o = opts(); let sidesN = o.layout === 'nup' ? Math.ceil(l.length / o.nup) : o.layout === 'booklet' ? Math.ceil(l.length / 4) * 2 : l.length;
    const sheets = o.sides === 'one' ? sidesN : Math.ceil(sidesN / 2); const tot = sheets * o.copies;
    return `${l.length} page${l.length > 1 ? 's' : ''} on <b>${tot} sheet${tot > 1 ? 's' : ''}</b> of paper${o.copies > 1 ? ` (${o.copies} copies)` : ''}${o.layout === 'booklet' ? '. Fold the stack in half and staple on the fold.' : ''}`;
  };
  const paint = () => {
    sh.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sc === scope));
    sh.querySelectorAll('[data-sd]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sd === sides));
    sh.querySelectorAll('[data-bd]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.bd === (layout === 'booklet' ? 'short' : bind)));
    sh.querySelectorAll('[data-ly]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.ly === layout));
    range.hidden = scope !== 'range'; $s('#prBindF').hidden = sides === 'one' || layout === 'booklet'; $s('#prNupRow').hidden = layout === 'normal';
    $s('#prNup').hidden = layout !== 'nup'; $s('#prCollate').closest('label').hidden = copies() < 2;
    const edge = bind === 'long' || layout === 'booklet' ? (layout === 'booklet' ? 'short edge' : 'long edge') : 'short edge';
    let note = sides === 'one' ? (layout === 'booklet' ? 'A booklet needs both sides of each sheet. Choose Two-sided, or Manual two-sided if your printer cannot.' : 'Prints on one side of each sheet.')
      : sides === 'two' ? (desk ? `The print dialog opens with two-sided printing set to flip on the ${edge}. If it is not ticked, open <b>More settings</b> and tick <b>Print on both sides</b>.` : `In the print screen choose <b>Two-sided</b> and <b>${edge === 'long edge' ? 'Long edge' : 'Short edge'}</b>.`)
      : `For printers that cannot print both sides. Print the fronts, put the printed stack back in the paper tray so the blank sides will be printed, then print the backs. Try it with two sheets first, because trays differ between printers.`;
    if (layout !== 'normal' || $s('#prPaper').value !== 'doc') note += ' In the print dialog keep the scale at <b>Default</b> or <b>Fit</b>, and pick the same paper size.';
    $s('#prNote').innerHTML = note; $s('#prSum').innerHTML = summary();
    const acts = $s('#prActs');
    acts.innerHTML = `<button class="btn" data-x>Cancel</button><button class="btn" data-pv title="Open the pages exactly as they will print">${icon('search')} Preview</button>` + (sides === 'manual'
      ? `<button class="btn" data-go="fronts">1. Print fronts</button><button class="btn primary" data-go="backs">2. Print backs</button>`
      : `<button class="btn primary" data-go="all">${icon('print')} Print</button>`);
    acts.querySelector('[data-x]').onclick = closeSheet;
    acts.querySelector('[data-pv]').onclick = (e) => run('preview', e.currentTarget);
    acts.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => run(b.dataset.go, b));
  };
  const make = async (part, bar) => {
    const o = opts(); const list = pick();
    let pages = list;
    if (o.content === 'doc') pages = list.map((p) => ({ ...p, annots: p.annots.filter((a) => a.t === 'redact') }));
    else if (o.content === 'mark') pages = list.map((p) => ({ ...p, kind: 'blank', annots: p.annots.filter((a) => a.t !== 'redact'), ocr: null }));
    let bytes = await buildPdf(pages, (f) => { bar.style.width = Math.round(f * 70) + '%'; });
    bytes = await layoutPdf(bytes, o); bar.style.width = '78%';
    bytes = await finishPrint(bytes, Object.assign(o, { part })); bar.style.width = '85%';
    if (o.gray) bytes = await rasterizePdf(bytes, 200, 0.9, (f) => { bar.style.width = Math.round(85 + f * 15) + '%'; }, true);
    return bytes;
  };
  const run = async (what, btn) => {
    const o = opts(); lsSet('pdfmate.print', { sides, bind, layout, nup: o.nup, paper: o.paper, content: o.content, gray: o.gray, label: o.label, borders: o.borders, collate: o.collate });
    const list = pick(); if (!list) { toast('Enter a page range such as 1-3, 6', { err: true }); range.focus(); return; }
    if (!list.length) { toast('No pages match. Check the range and the odd or even choice.', { err: true }); return; }
    if (layout === 'booklet' && sides === 'one') { toast('Choose Two-sided or Manual two-sided for a booklet', { err: true }); return; }
    const btns = sh.querySelectorAll('.acts .btn'); btns.forEach((b) => b.disabled = true);
    const pr = $s('.progress'); pr.hidden = false; const bar = pr.querySelector('i'); bar.style.width = '0';
    try {
      const bytes = await make(what === 'preview' ? (sides === 'manual' ? 'all' : 'all') : what, bar);
      if (what === 'preview') { const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); const w = window.open(url, '_blank'); if (!w) downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'Print preview.pdf'); setTimeout(() => URL.revokeObjectURL(url), 120000); btns.forEach((b) => b.disabled = false); pr.hidden = true; return; }
      await printBytes(bytes);
      if (sides === 'manual' && what === 'fronts') { toast('Fronts sent. Turn the stack over, put it back in the tray, then tap Print backs.', { ms: 6000 }); btns.forEach((b) => b.disabled = false); pr.hidden = true; }
      else closeSheet();
    } catch (e) { console.error(e); btns.forEach((b) => b.disabled = false); pr.hidden = true; toast('Could not print. ' + (e && e.message ? e.message : ''), { err: true, ms: 5000 }); }
  };
  sh.addEventListener('click', (e) => {
    const sc = e.target.closest('[data-sc]'), sd = e.target.closest('[data-sd]'), bd = e.target.closest('[data-bd]'), ly = e.target.closest('[data-ly]'), cp = e.target.closest('[data-cp]');
    if (sc) { scope = sc.dataset.sc; paint(); if (scope === 'range') range.focus(); }
    if (sd) { sides = sd.dataset.sd; paint(); }
    if (bd) { bind = bd.dataset.bd; paint(); }
    if (ly) { layout = ly.dataset.ly; if (layout === 'booklet' && sides === 'one') sides = 'two'; paint(); }
    if (cp) { $s('#prCopies').value = clamp(copies() + +cp.dataset.cp, 1, 99); paint(); }
  });
  sh.addEventListener('input', () => { $s('#prSum').innerHTML = summary(); $s('#prCollate').closest('label').hidden = copies() < 2; });
  sh.addEventListener('change', paint);
  paint();
}

/* ---------- Raster, compress, split, page numbers, watermark ---------- */
async function rasterizePdf(bytes, dpi = 150, q = 0.85, onProgress, gray) {
  const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice() }).promise;
  const out = await PL.PDFDocument.create(); out.setProducer('Meridian PDF Mate by Tango Juliet Dev');
  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i); const v1 = pg.getViewport({ scale: 1 });
    const scale = Math.min(dpi / 72, 4200 / Math.max(v1.width, v1.height)); const vp = pg.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: x, viewport: vp }).promise;
    if (gray) { const d = x.getImageData(0, 0, c.width, c.height), a = d.data; for (let k = 0; k < a.length; k += 4) { const yv = 0.299 * a[k] + 0.587 * a[k + 1] + 0.114 * a[k + 2]; a[k] = a[k + 1] = a[k + 2] = yv; } x.putImageData(d, 0, 0); }
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
  const z = Math.min((viewer.clientWidth - 48) / g.w, (viewer.clientHeight - 110 - chromeH()) / g.h);
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


/* ---------- Password protection: PDF 2.0 standard security, AES-256 (V5 R6) ---------- */
const PERM = { print: 4, modify: 8, copy: 16, annot: 32, fill: 256, access: 512, assemble: 1024, printHi: 2048 };
const u8cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0); const o = new Uint8Array(n); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
const rnd = (n) => crypto.getRandomValues(new Uint8Array(n));
async function aesCbc(key, iv, data, pad = true) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt']);
  const out = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, k, data));
  return pad ? out : out.slice(0, data.length); // WebCrypto always pads; drop the extra block for block-aligned input
}
// ISO 32000-2 algorithm 2.B
async function hash2B(pwd, salt, udata) {
  let k = new Uint8Array(await crypto.subtle.digest('SHA-256', u8cat(pwd, salt, udata))); let e = new Uint8Array(0); let i = 0;
  while (i < 64 || e[e.length - 1] > i - 32) {
    const one = u8cat(pwd, k, udata); const k1 = new Uint8Array(one.length * 64); for (let j = 0; j < 64; j++) k1.set(one, j * one.length);
    e = await aesCbc(k.slice(0, 16), k.slice(16, 32), k1, false);
    let sum = 0; for (let j = 0; j < 16; j++) sum += e[j];
    k = new Uint8Array(await crypto.subtle.digest(['SHA-256', 'SHA-384', 'SHA-512'][sum % 3], e)); i++;
  }
  return k.slice(0, 32);
}
const pwBytes = (s) => new TextEncoder().encode(String(s || '').normalize('NFKC')).slice(0, 127);
const hexOf = (u) => [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
async function encryptPdf(bytes, { user = '', owner = '', allow = {} } = {}) {
  const doc = await PL.PDFDocument.load(bytes, { updateMetadata: false }); const ctx = doc.context;
  const upw = pwBytes(user), opw = pwBytes(owner || hexOf(rnd(16)));
  const fileKey = rnd(32);
  const uvs = rnd(8), uks = rnd(8), ovs = rnd(8), oks = rnd(8);
  const U = u8cat(await hash2B(upw, uvs, new Uint8Array(0)), uvs, uks);
  const UE = await aesCbc(await hash2B(upw, uks, new Uint8Array(0)), new Uint8Array(16), fileKey, false);
  const O = u8cat(await hash2B(opw, ovs, U), ovs, oks);
  const OE = await aesCbc(await hash2B(opw, oks, U), new Uint8Array(16), fileKey, false);
  let p = 0xfffff0c0 | 0; for (const k in PERM) if (allow[k] !== false) p |= PERM[k];
  const pb = new Uint8Array(16); new DataView(pb.buffer).setInt32(0, p, true); pb.set([0xff, 0xff, 0xff, 0xff, 0x54, 0x61, 0x64, 0x62], 4); pb.set(rnd(4), 12);
  const Perms = await aesCbc(fileKey, new Uint8Array(16), pb, false);
  // encrypt every string and stream
  const encBytes = async (u) => { const iv = rnd(16); return u8cat(iv, await aesCbc(fileKey, iv, u, true)); };
  const N = (n) => PL.PDFName.of(n);
  const walk = async (v) => {
    if (v instanceof PL.PDFString || v instanceof PL.PDFHexString) return PL.PDFHexString.of(hexOf(await encBytes(v.asBytes())));
    if (v instanceof PL.PDFArray) { for (let i = 0; i < v.size(); i++) v.set(i, await walk(v.get(i))); return v; }
    if (v instanceof PL.PDFDict) { for (const [k, x] of v.entries()) v.set(k, await walk(x)); return v; }
    return v;
  };
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PL.PDFStream) {
      const type = obj.dict.get(N('Type')); if (type === N('XRef') || type === N('ObjStm')) { ctx.delete(ref); continue; }
      await walk(obj.dict);
      const raw = obj instanceof PL.PDFRawStream ? obj.contents : obj.getContents();
      const enc = await encBytes(raw); obj.dict.set(N('Length'), PL.PDFNumber.of(enc.length));
      ctx.assign(ref, PL.PDFRawStream.of(obj.dict, enc));
    } else await walk(obj);
  }
  const cf = ctx.obj({ StdCF: { AuthEvent: 'DocOpen', CFM: 'AESV3', Length: 32 } });
  const encDict = ctx.obj({ Filter: 'Standard', V: 5, R: 6, Length: 256, CF: cf, StmF: 'StdCF', StrF: 'StdCF', P: p });
  encDict.set(N('O'), PL.PDFHexString.of(hexOf(O))); encDict.set(N('U'), PL.PDFHexString.of(hexOf(U)));
  encDict.set(N('OE'), PL.PDFHexString.of(hexOf(OE))); encDict.set(N('UE'), PL.PDFHexString.of(hexOf(UE)));
  encDict.set(N('Perms'), PL.PDFHexString.of(hexOf(Perms)));
  ctx.trailerInfo.Encrypt = ctx.register(encDict);
  const id = PL.PDFHexString.of(hexOf(rnd(16))); ctx.trailerInfo.ID = ctx.obj([id, id]);
  return doc.save({ useObjectStreams: false, updateFieldAppearances: false });
}

/* ---------- Export to Word (.docx) ---------- */
const xmlEsc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
// Rebuild lines and paragraphs from positioned text
async function pageParagraphs(pg) {
  const vp = pg.getViewport({ scale: 1 }); const W = vp.width, H = vp.height;
  const tc = await pg.getTextContent({ disableNormalization: false });
  let names = {}; try { await pg.getOperatorList(); for (const it of tc.items) { if (it.fontName && !(it.fontName in names)) { let n = ''; try { const f = pg.commonObjs.get(it.fontName); n = (f && (f.name || f.loadedName)) || ''; } catch (e) {} names[it.fontName] = n; } } } catch (e) {}
  const items = [];
  for (const it of tc.items) {
    if (!it.str || !it.transform) continue; const t = it.transform;
    const [x, y] = vp.convertToViewportPoint(t[4], t[5]); const size = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 10;
    if (Math.abs(t[1]) > Math.abs(t[0]) * 0.2) continue; // skip rotated text in flowing layout
    const nm = names[it.fontName] || ''; const st = (tc.styles && tc.styles[it.fontName]) || {};
    const fam = nm.replace(/^[A-Z]{6}\+/, '').split(/[-,]/)[0].replace(/(MT|PS|PSMT|Std|Pro)$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    items.push({ fam: /^[A-Za-z][A-Za-z ]{2,30}$/.test(fam) && !/^(Helvetica|Arial|Times|Courier|Symbol|Zapf)/i.test(fam) ? fam : '', x, y, w: it.width || 0, size, str: it.str, bold: /bold|black|heavy|semibold|demi/i.test(nm), italic: /italic|oblique/i.test(nm), mono: /courier|mono/i.test(nm + (st.fontFamily || '')), serif: /times|serif(?!.*sans)|georgia|garamond|cambria/i.test(nm) && !/sans/i.test(nm) });
  }
  items.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of items) { const L = lines.find((l) => Math.abs(l.y - it.y) < Math.min(l.size, it.size) * 0.45); if (L) { L.items.push(it); L.size = Math.max(L.size, it.size); } else lines.push({ y: it.y, size: it.size, items: [it] }); }
  lines.sort((a, b) => a.y - b.y);
  for (const L of lines) { L.items.sort((a, b) => a.x - b.x); L.x = L.items[0].x; L.r = Math.max(...L.items.map((i) => i.x + i.w)); }
  const minX = lines.length ? Math.min(...lines.map((l) => l.x)) : 50; const maxR = lines.length ? Math.max(...lines.map((l) => l.r)) : W - 50;
  const paras = []; let cur = null;
  for (const L of lines) {
    const runs = []; let prev = null;
    for (const it of L.items) { let txt = it.str; if (prev) { const gap = it.x - (prev.x + prev.w); if (gap > it.size * 2.2) txt = '\t' + txt; else if (gap > it.size * 0.18 && !/\s$/.test(prev.str) && !/^\s/.test(txt)) txt = ' ' + txt; } runs.push({ t: txt, b: it.bold, i: it.italic, size: it.size, mono: it.mono, serif: it.serif, fam: it.fam }); prev = it; }
    const mid = (L.x + L.r) / 2; const centred = Math.abs(mid - W / 2) < W * 0.04 && (L.r - L.x) < (maxR - minX) * 0.75 && L.x - minX > 20;
    const bullet = /^\s*([•●▪–\-*]|\d{1,3}[.)]|[a-z][.)])\s/i.test(L.items[0].str);
    const brk = !cur || L.y - cur.lastY > cur.size * 1.75 || Math.abs(L.size - cur.size) > cur.size * 0.18 || Math.abs(L.x - cur.lastX) > L.size * 1.5 && !(cur.lines === 1 && L.x < cur.lastX) || bullet || centred || cur.centred;
    if (brk) { cur = { runs: [], size: L.size, x: L.x, lastY: L.y, lastX: L.x, top: L.y, before: cur ? Math.max(0, L.y - cur.lastY - L.size * 1.25) : L.y, centred, lines: 1 }; paras.push(cur); }
    else { const last = cur.runs[cur.runs.length - 1]; if (last && /-$/.test(last.t) && /^[a-z]/.test(runs[0].t)) last.t = last.t.slice(0, -1); else if (last && !/\s$/.test(last.t)) runs[0] = Object.assign({}, runs[0], { t: ' ' + runs[0].t.replace(/^\t/, '') }); cur.lines++; }
    cur.runs.push(...runs); cur.lastY = L.y; cur.lastX = L.x;
  }
  return { paras, W, H, minX, maxR, top: lines.length ? lines[0].y - lines[0].size : 50 };
}
function docxRun(r) {
  const fonts = xmlEsc(r.fam || (r.mono ? 'Courier New' : r.serif ? 'Times New Roman' : 'Arial'));
  const sz = Math.max(2, Math.round(r.size * 2));
  const parts = r.t.split('\t'); let x = '';
  parts.forEach((t, i) => { if (i) x += '<w:tab/>'; if (t) x += `<w:t xml:space="preserve">${xmlEsc(t)}</w:t>`; });
  return `<w:r><w:rPr><w:rFonts w:ascii="${fonts}" w:hAnsi="${fonts}" w:cs="${fonts}"/>${r.b ? '<w:b/>' : ''}${r.i ? '<w:i/>' : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>${x}</w:r>`;
}
// mode: 'text' (editable), 'image' (exact look). Returns a Blob.
async function buildDocx(pdf, mode, onProgress) {
  const media = []; let body = ''; const n = pdf.numPages; let sect = null;
  for (let i = 1; i <= n; i++) {
    const pg = await pdf.getPage(i); const vp = pg.getViewport({ scale: 1 });
    const pgW = Math.round(vp.width * 20), pgH = Math.round(vp.height * 20);
    let info = mode === 'text' ? await pageParagraphs(pg) : null; const useImg = mode === 'image' || !info.paras.length;
    if (!sect) sect = { pgW, pgH, ml: useImg ? 360 : Math.round(Math.max(36, Math.min(info.minX, 90)) * 20), mr: useImg ? 360 : Math.round(Math.max(36, Math.min(vp.width - info.maxR, 90)) * 20) };
    if (i > 1) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    if (useImg) {
      const scale = Math.min(2.2, Math.sqrt(9e6 / (vp.width * vp.height))); const v2 = pg.getViewport({ scale }); const c = document.createElement('canvas'); c.width = Math.round(v2.width); c.height = Math.round(v2.height);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: x, viewport: v2 }).promise;
      const data = new Uint8Array(await (await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88))).arrayBuffer()); c.width = c.height = 0;
      const id = media.length + 1; media.push({ name: `image${id}.jpeg`, data });
      const availW = (sect.pgW - 720) / 20, availH = (sect.pgH - 720) / 20; const k = Math.min(availW / vp.width, availH / vp.height); const cx = Math.round(vp.width * k * 12700), cy = Math.round(vp.height * k * 12700);
      body += `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Page ${i}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="image${id}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    } else {
      for (const p of info.paras) {
        const ind = Math.max(0, Math.round((p.x - info.minX) * 20)); const before = Math.round(Math.min(p.before, 60) * 20);
        body += `<w:p><w:pPr><w:spacing w:before="${before}" w:after="0" w:line="${Math.round(p.size * 1.18 * 20)}" w:lineRule="atLeast"/>${p.centred ? '<w:jc w:val="center"/>' : ind > 30 ? `<w:ind w:left="${ind}"/>` : ''}</w:pPr>${p.runs.map(docxRun).join('')}</w:p>`;
      }
    }
    pg.cleanup(); if (onProgress) onProgress(i / n);
  }
  if (!sect) sect = { pgW: 11906, pgH: 16838, ml: 1134, mr: 1134 };
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}<w:sectPr><w:pgSz w:w="${sect.pgW}" w:h="${sect.pgH}"/><w:pgMar w:top="${mode === 'image' ? 360 : 1000}" w:right="${sect.mr}" w:bottom="${mode === 'image' ? 360 : 800}" w:left="${sect.ml}" w:header="400" w:footer="400" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${media.map((m, k) => `<Relationship Id="rIdImg${k + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const root = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Meridian PDF Mate</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
  const enc = new TextEncoder();
  const files = [{ name: '[Content_Types].xml', data: enc.encode(types) }, { name: '_rels/.rels', data: enc.encode(root) }, { name: 'docProps/core.xml', data: enc.encode(core) }, { name: 'word/document.xml', data: enc.encode(document) }, { name: 'word/styles.xml', data: enc.encode(styles) }, { name: 'word/_rels/document.xml.rels', data: enc.encode(rels) }, ...media.map((m) => ({ name: 'word/media/' + m.name, data: m.data }))];
  const z = makeZip(files); return new Blob([z], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

function openWord() {
  if (!S.pages.length) return; const nSel = S.selPages.size; let mode = 'text', scope = nSel ? 'sel' : 'all';
  const sh = sheet(`<h2>Export to Word</h2><p class="sub">Makes a .docx you can open in Microsoft Word, Google Docs, Pages or LibreOffice.</p>
    <div class="field"><span class="flabel">Layout</span><div class="seg" role="group"><button data-m="text">Editable text</button><button data-m="image">Exact look</button></div>
      <small class="sub" id="wNote" style="margin:6px 0 0;display:block"></small></div>
    <div class="field"><span class="flabel">Pages</span><div class="seg" role="group"><button data-s="all">All ${S.pages.length}</button>${nSel ? `<button data-s="sel">Selected ${nSel}</button>` : ''}<button data-s="cur">This page</button></div></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('download')} Export .docx</button></div>`);
  const paint = () => { sh.querySelectorAll('[data-m]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.m === mode)); sh.querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === scope)); sh.querySelector('#wNote').textContent = mode === 'text' ? 'Text, sizes, bold and centring are rebuilt as normal paragraphs you can edit. Drawings and complex tables are not carried over. Scanned pages come in as pictures; run Recognise text first to make them editable.' : 'Each page is placed as a sharp picture. Looks exactly like the PDF but the text cannot be edited.'; };
  sh.addEventListener('click', (e) => { const m = e.target.closest('[data-m]'), s2 = e.target.closest('[data-s]'); if (m) mode = m.dataset.m; if (s2) scope = s2.dataset.s; paint(); });
  paint(); sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-go]').onclick = async () => {
    const list = scope === 'sel' ? S.pages.filter((p) => S.selPages.has(p.id)) : scope === 'cur' ? [S.pages[S.current]] : S.pages;
    const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i'); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = true);
    try {
      const bytes = await buildPdf(list, (f) => { bar.style.width = Math.round(f * 25) + '%'; });
      const pdf = await pdfjsLib.getDocument({ ...PDFJS_OPTS, data: bytes.slice() }).promise;
      const blob = await buildDocx(pdf, mode, (f) => { bar.style.width = Math.round(25 + f * 75) + '%'; });
      try { pdf.loadingTask.destroy(); } catch (e) {}
      downloadBlob(blob, fileName().replace(/\.pdf$/i, '') + '.docx'); closeSheet(); toast('Word document exported');
    } catch (e) { console.error(e); toast('Could not export to Word', { err: true }); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = false); }
  };
}
function openProtect() {
  if (!S.pages.length) return;
  const sh = sheet(`<h2>Protect with password</h2><p class="sub">Saves a copy locked with AES-256, the strongest PDF encryption. It opens in Acrobat, Chrome, Edge, Preview and phone PDF apps. There is no way to recover a forgotten password.</p>
    <div class="field"><label for="pw1">Password to open</label><input id="pw1" class="inp" type="password" autocomplete="new-password" autofocus></div>
    <div class="field"><label for="pw2">Repeat password</label><input id="pw2" class="inp" type="password" autocomplete="new-password"></div>
    <div class="field"><span class="flabel">Allow people with the password to</span>
      <label class="chk"><input type="checkbox" data-al="print" checked> Print</label>
      <label class="chk"><input type="checkbox" data-al="copy" checked> Copy text</label>
      <label class="chk"><input type="checkbox" data-al="modify" checked> Change the document</label>
      <label class="chk"><input type="checkbox" data-al="annot" checked> Add comments and fill forms</label></div>
    <div class="field" id="ownF" hidden><label for="pw3">Permissions password (to change these limits later)</label><input id="pw3" class="inp" type="password" autocomplete="new-password"></div>
    <div class="progress" hidden><i></i></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-go>${icon('lock')} Save protected copy</button></div>`);
  const upd = () => { sh.querySelector('#ownF').hidden = [...sh.querySelectorAll('[data-al]')].every((c) => c.checked); };
  sh.addEventListener('change', upd); upd(); sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-go]').onclick = async () => {
    const p1 = sh.querySelector('#pw1').value, p2 = sh.querySelector('#pw2').value;
    if (!p1) { toast('Type a password', { err: true }); return; } if (p1 !== p2) { toast('The two passwords do not match', { err: true }); return; }
    const allow = {}; sh.querySelectorAll('[data-al]').forEach((c) => { const v = c.checked; if (c.dataset.al === 'print') { allow.print = v; allow.printHi = v; } else if (c.dataset.al === 'modify') { allow.modify = v; allow.assemble = v; } else if (c.dataset.al === 'annot') { allow.annot = v; allow.fill = v; } else allow.copy = v; });
    const own = sh.querySelector('#pw3').value || (Object.values(allow).every(Boolean) ? p1 : '');
    const pr = sh.querySelector('.progress'); pr.hidden = false; const bar = pr.querySelector('i'); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = true);
    try {
      const bytes = await buildPdf(S.pages, (f) => { bar.style.width = Math.round(f * 70) + '%'; });
      const enc = await encryptPdf(bytes, { user: p1, owner: own, allow }); bar.style.width = '100%';
      downloadBlob(new Blob([enc], { type: 'application/pdf' }), fileName().replace(/\.pdf$/i, '') + '-protected.pdf'); closeSheet(); toast('Protected copy saved');
    } catch (e) { console.error(e); toast('Could not protect this file', { err: true }); sh.querySelectorAll('.acts .btn').forEach((b) => b.disabled = false); }
  };
}
async function extractPages() {
  const list = targetPages(); if (!list.length) return;
  const t = toast('Extracting pages', { spin: true, sticky: true });
  try { const bytes = await buildPdf(list); const nums = list.map((p) => S.pages.indexOf(p) + 1); const rng = nums.length === 1 ? 'page-' + nums[0] : 'pages-' + nums[0] + '-' + nums[nums.length - 1]; downloadBlob(new Blob([bytes], { type: 'application/pdf' }), fileName().replace(/\.pdf$/i, '') + '-' + rng + '.pdf'); toast(`Saved ${list.length} page${list.length > 1 ? 's' : ''} as a new PDF`); }
  catch (e) { console.error(e); toast('Could not extract pages', { err: true }); } finally { t.remove(); }
}
function reversePages() { if (S.pages.length < 2) return; S.pages.reverse(); renderAll(); commit(); toast('Page order reversed'); }
function removeInfo() { S.meta = {}; for (const d of S.docs.values()) d._stripMeta = true; commit(); setDirty(true); toast('Title, author, subject and keywords will be left out when you save'); }

/* ---------- Measuring and revision clouds ---------- */
const MUNITS = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };
const mscOf = (a) => a.sc || S.style.msc || { r: 1, u: 'mm' };
const PT_MM = 25.4 / 72;
function measLen(a) { const [p0, p1] = a.pts; const s = mscOf(a); return Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * PT_MM * s.r / MUNITS[s.u]; }
function polyAreaPt(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; s += x0 * y1 - x1 * y0; } return Math.abs(s) / 2; }
function measArea(a) { const s = mscOf(a); const k = PT_MM * s.r / MUNITS[s.u]; return polyAreaPt(a.pts) * k * k; }
const fmtNum = (v) => (v >= 1000 ? v.toFixed(0) : v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3)).replace(/\.?0+$/, (m) => (m.includes('.') ? '' : m));
function measLabel(a) { const s = mscOf(a); return a.t === 'area' ? fmtNum(measArea(a)) + ' ' + s.u + '²' : fmtNum(measLen(a)) + ' ' + s.u; }
const measFs = (a) => a.fs || Math.max(7, Math.min(14, (a.width || 1.5) * 4 + 3));
function polyCentroid(pts) { let A = 0, cx = 0, cy = 0; for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; const f = x0 * y1 - x1 * y0; A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f; } if (Math.abs(A) < 1e-6) { const n = pts.length; return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n]; } return [cx / (3 * A), cy / (3 * A)]; }
// Label placement for a measure line: centre point and readable angle (degrees, PDF space)
function measLabelPos(a) { const [p0, p1] = a.pts; let ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180; const r = ang * Math.PI / 180; const off = measFs(a) * 0.45; return { x: (p0[0] + p1[0]) / 2 - Math.sin(r) * off, y: (p0[1] + p1[1]) / 2 + Math.cos(r) * off, ang }; }
function measTicks(a) { const [p0, p1] = a.pts; const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1; const nx = -(p1[1] - p0[1]) / L, ny = (p1[0] - p0[0]) / L; const t = Math.max(3, measFs(a) * 0.45); return [p0, p1].map(([x, y]) => [[x - nx * t, y - ny * t], [x + nx * t, y + ny * t]]); }
// Scalloped outline through the four corners [bl, tl, tr, br]; ymap lets the same code write SVG (y up) or PDF path (y down)
function cloudPath(cs, size, ymap = (y) => y, sweep = 1) {
  let d = `M${cs[0][0]} ${ymap(cs[0][1])}`;
  for (let i = 0; i < 4; i++) { const [x0, y0] = cs[i], [x1, y1] = cs[(i + 1) % 4]; const L = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.round(L / (size * 2))); const r = L / n / 2; for (let k = 1; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; d += ` A${r} ${r} 0 0 ${sweep} ${x} ${ymap(y)}`; } }
  return d + ' Z';
}
const cloudSize = (a) => Math.max(3, Math.min(12, Math.min(a.w, a.h) / 5));
function cloudCorners(a) { const c = [[a.x, a.y], [a.x, a.y + a.h], [a.x + a.w, a.y + a.h], [a.x + a.w, a.y]]; if (!a.rot) return c; const cx = a.x + a.w / 2, cy = a.y + a.h / 2; return c.map(([x, y]) => rotPt(x, y, cx, cy, a.rot)); }
function measSvg(g, a) {
  const w = a.width || 1.2; const col = a.color; const fs = measFs(a);
  if (a.t === 'measure') {
    const [p0, p1] = a.pts; g.appendChild(sv('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: col, 'stroke-width': w }));
    for (const [s, e] of measTicks(a)) g.appendChild(sv('line', { x1: s[0], y1: s[1], x2: e[0], y2: e[1], stroke: col, 'stroke-width': w }));
    const L = measLabelPos(a); const lab = measLabel(a); const tw = lab.length * fs * 0.56 + fs * 0.6;
    const gg = sv('g', { transform: `translate(${L.x} ${L.y}) rotate(${L.ang}) scale(1 -1)` });
    gg.appendChild(sv('rect', { x: -tw / 2, y: -fs * 0.95, width: tw, height: fs * 1.2, rx: fs * 0.25, fill: '#ffffff', 'fill-opacity': 0.92 }));
    const t = sv('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': fs, 'font-family': 'Helvetica, Arial, sans-serif', 'font-weight': 600, fill: col }); t.textContent = lab; gg.appendChild(t); g.appendChild(gg);
  } else if (a.t === 'area') {
    const pts = a._h ? [...a.pts, a._h] : a.pts; const ptsS = pts.map((p) => p.join(',')).join(' ');
    g.appendChild(sv(a._h ? 'polyline' : 'polygon', { points: ptsS, fill: a._h ? 'none' : col, 'fill-opacity': 0.12, stroke: col, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-dasharray': a._h ? `${4 * w} ${3 * w}` : 'none' }));
    if (a._h) for (const p of a.pts) g.appendChild(sv('circle', { cx: p[0], cy: p[1], r: Math.max(1.5, w * 1.6), fill: col }));
    if (!a._h && a.pts.length >= 3) { const [cx, cy] = polyCentroid(a.pts); const lab = measLabel(a); const tw = lab.length * fs * 0.56 + fs * 0.6; const gg = sv('g', { transform: `translate(${cx} ${cy}) scale(1 -1)` }); gg.appendChild(sv('rect', { x: -tw / 2, y: -fs * 0.95, width: tw, height: fs * 1.2, rx: fs * 0.25, fill: '#ffffff', 'fill-opacity': 0.92 })); const t = sv('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': fs, 'font-family': 'Helvetica, Arial, sans-serif', 'font-weight': 600, fill: col }); t.textContent = lab; gg.appendChild(t); g.appendChild(gg); }
  } else if (a.t === 'cloud') {
    g.appendChild(sv('path', { d: cloudPath([[a.x, a.y], [a.x, a.y + a.h], [a.x + a.w, a.y + a.h], [a.x + a.w, a.y]], cloudSize(a), (y) => y, 0), fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linejoin': 'round' }));
  }
}
async function measPdf(page, a, font) {
  const col = hexRgb(a.color); const w = a.width || 1.2; const fs = measFs(a);
  const line = (s, e) => page.drawLine({ start: { x: s[0], y: s[1] }, end: { x: e[0], y: e[1] }, thickness: w, color: col });
  const label = async (x, y, ang, lab) => {
    const f = await font('helv', 1); const tw = f.widthOfTextAtSize(lab.replace('²', '2'), fs); const r = ang * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const bw = tw + fs * 0.6, bh = fs * 1.2; const bx = -bw / 2, by = -fs * 0.25;
    page.drawRectangle({ x: x + bx * c - by * s, y: y + bx * s + by * c, width: bw, height: bh, color: PL.rgb(1, 1, 1), opacity: 0.92, rotate: PL.degrees(ang) });
    const sq = /²$/.test(lab); const main = sq ? lab.slice(0, -1) : lab; const mw = f.widthOfTextAtSize(main, fs); const tw2 = mw + (sq ? f.widthOfTextAtSize('2', fs * 0.62) : 0); const tx = -tw2 / 2;
    page.drawText(main, { x: x + tx * c, y: y + tx * s, size: fs, font: f, color: col, rotate: PL.degrees(ang) });
    if (sq) { const ux = tx + mw, uy = fs * 0.38; page.drawText('2', { x: x + ux * c - uy * s, y: y + ux * s + uy * c, size: fs * 0.62, font: f, color: col, rotate: PL.degrees(ang) }); }
  };
  if (a.t === 'measure') { line(a.pts[0], a.pts[1]); for (const [s, e] of measTicks(a)) line(s, e); const L = measLabelPos(a); await label(L.x, L.y, L.ang, measLabel(a)); }
  else if (a.t === 'area') { if (a.pts.length < 3) return; const d = 'M' + a.pts.map(([x, y]) => x + ' ' + (-y)).join(' L') + ' Z'; page.drawSvgPath(d, { x: 0, y: 0, color: col, opacity: 0.12, borderColor: col, borderWidth: w }); const [cx, cy] = polyCentroid(a.pts); await label(cx, cy, 0, measLabel(a)); }
  else if (a.t === 'cloud') { page.drawSvgPath(cloudPath(cloudCorners(a), cloudSize(a), (y) => -y, 1), { x: 0, y: 0, borderColor: col, borderWidth: w }); }
}
// Area tool: click points, click the first point, double-click or press Enter to finish
function finishPoly(cancel) {
  if (!S.poly) return; const p = pageById(S.poly.pageId); S.poly = null; if (!p) return; const a = p.annots.find((z) => z.t === 'area' && z._h !== undefined); if (!a) return;
  delete a._h; const pts = []; for (const q of a.pts) { const l = pts[pts.length - 1]; if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.5) pts.push(q); } a.pts = pts;
  if (cancel || a.pts.length < 3) { p.annots = p.annots.filter((z) => z !== a); drawOverlay(p); if (!cancel) toast('An area needs at least 3 points'); return; }
  drawOverlay(p); commit(); select(p.id, a.id); refreshFormatBar();
}
function areaClick(p, el, g, pt, pdfPt) {
  let a = S.poly && S.poly.pageId === p.id ? p.annots.find((z) => z.id === S.poly.id) : null;
  if (!a) { finishPoly(); a = { id: uid('a'), t: 'area', pts: [pdfPt], color: S.style.ink === '#000000' ? '#d70015' : S.style.ink, width: Math.min(S.style.width, 2), sc: Object.assign({}, mscOf({})), _h: pdfPt }; p.annots.push(a); S.poly = { pageId: p.id, id: a.id }; drawOverlay(p, el); return; }
  const f = ap(g.t, a.pts[0][0], a.pts[0][1]); if (a.pts.length >= 3 && Math.hypot(f[0] - pt[0], f[1] - pt[1]) * S.zoom < 10) { finishPoly(); return; }
  a.pts.push(pdfPt); a._h = pdfPt; drawOverlay(p, el);
}
function openCalibrate(s) {
  const a = s.a; const sc = mscOf(a); const paperMm = Math.hypot(a.pts[1][0] - a.pts[0][0], a.pts[1][1] - a.pts[0][1]) * PT_MM;
  const sh = sheet(`<h2>Set the drawing scale</h2><p class="sub">Draw a measure line over something whose real length you know, such as a dimension on the drawing, then type that length here.</p>
    <div class="field"><label for="calV">Real length of this line</label><div style="display:flex;gap:8px"><input id="calV" class="inp" inputmode="decimal" value="${fmtNum(measLen(a))}" autofocus><select id="calU" class="inp" style="width:90px">${Object.keys(MUNITS).map((u) => `<option ${u === sc.u ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div>
    <div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Set scale</button></div>`);
  sh.querySelector('[data-x]').onclick = closeSheet;
  sh.querySelector('[data-ok]').onclick = () => { const v = parseFloat(sh.querySelector('#calV').value.replace(',', '.')); const u = sh.querySelector('#calU').value; if (!(v > 0) || !(paperMm > 0)) { toast('Type a length', { err: true }); return; } const r = v * MUNITS[u] / paperMm; S.style.msc = { r: Math.round(r * 10000) / 10000, u }; saveStyle(); for (const z of s.p.annots) if ((z.t === 'measure' || z.t === 'area') && (z === a || !z.scLocked)) z.sc = Object.assign({}, S.style.msc); drawOverlay(s.p); commit(); closeSheet(); refreshFormatBar(); toast(`Scale set to 1:${fmtNum(S.style.msc.r)} (${u})`); };
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
  { const fi = $('#findInput'); if (fi) fi.disabled = !has; const vd = $('#viewDock'); if (vd) vd.classList.toggle('nodoc', !has); if (!has) { const ts = $('#tsearch'); if (ts) ts.classList.remove('open'); } }
  $$('#sbFoot .tbtn').forEach((b) => b.disabled = !has);
  updateMeta();
}
$('#btnSidebar').addEventListener('click', () => setSidebar($('#app').classList.contains('no-sidebar')));
$('#btnUndo').addEventListener('click', undo); $('#btnRedo').addEventListener('click', redo);
$('#zoomIn').addEventListener('click', () => setZoom(S.zoom * 1.25)); $('#zoomOut').addEventListener('click', () => setZoom(S.zoom / 1.25));
$('#zoomLbl').addEventListener('click', (e) => {
  const pct = (v) => ({ label: v + '%', icon: Math.abs(S.zoom * 75 - v) < 0.6 ? 'check' : 'zin', run: () => setZoom(v / 75) });
  openMenu(e.currentTarget, [{ label: 'Fit width', icon: 'fit', run: () => setZoom(0, true) }, { label: 'Whole page', icon: 'fitpage', run: () => { const p = S.pages[S.current]; if (!p) return; const g = geo(p); setZoom(Math.min((viewer.clientWidth - 40) / g.w, (viewer.clientHeight - 60 - chromeH()) / g.h)); scrollToPage(S.current, false); } }, '-', ...[50, 100, 150, 200, 400, 800, 1600, 3600].map(pct)]);
});
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
$('#eBlank').addEventListener('click', () => openNewPdf());
$('#eDesign').addEventListener('click', () => openDesign());
$('#eScan').addEventListener('click', startScan);
$('#fileOpen').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; openFilesInTabs(f); });
$('#fileImg').addEventListener('change', (e) => { const f = [...e.target.files]; e.target.value = ''; addFiles(f, S.pages.length ? S.current + 1 : 0); });
$('#docName').addEventListener('input', updateMeta);
$('#docName').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
const sysTheme = () => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function curTheme() { const t = lsGet('pdfmate.theme', null); return t === 'light' || t === 'dark' ? t : sysTheme(); }
function themeLabel() { return curTheme() === 'dark' ? 'Dark' : 'Light'; }
function markThemeBtn() { const b = $('#btnTheme'); if (!b) return; const d = curTheme() === 'dark'; b.innerHTML = icon(d ? 'sun' : 'theme'); b.title = d ? 'Switch to light mode' : 'Switch to dark mode'; b.setAttribute('aria-label', b.title); }
function cycleTheme() {
  if (lsGet('pdfmate.night', 'off') !== 'off') { lsSet('pdfmate.night', 'off'); applyNight(); }
  const n = curTheme() === 'dark' ? 'light' : 'dark'; lsSet('pdfmate.theme', n); document.documentElement.setAttribute('data-theme', n); markThemeBtn();
}
$('#btnMore').addEventListener('click', (e) => infoMenu(e.currentTarget));
$('#btnNight').addEventListener('click', (e) => toggleNight(e.currentTarget));
$('#btnTheme').addEventListener('click', () => cycleTheme());
$$('#viewDock [data-dtool]').forEach((b) => { b.innerHTML = icon(b.dataset.dtool); b.addEventListener('click', () => { if (!S.pages.length) return; closeEditor(false); setTool(b.dataset.dtool); }); });
function infoMenu(anchor) {
  if (menuEl && menuEl.classList.contains('infopop')) { closeMenu(); return; }
  closeMenu(); const m = document.createElement('div'); m.className = 'menu infopop'; m.setAttribute('role', 'menu');
  const T = (k, ic, t, d) => `<button class="ip-tile" role="menuitem" data-k="${k}"><span class="ip-ic">${icon(ic)}</span><span class="ip-tx"><b>${t}</b><small>${d}</small></span></button>`;
  m.innerHTML = T('keys', 'kbd', 'Keyboard shortcuts', 'Every tool has a key') + T('tour', 'tour', 'Quick tour', 'A one minute walk through') + T('about', 'info', 'About', `Version ${VERSION}, contact`);
  m.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; closeMenu(); const k = b.dataset.k; if (k === 'keys') openShortcuts(); else if (k === 'tour') { if (S.pages.length) startTour(true); else toast('Open a PDF first to take the tour'); } else about(); });
  document.body.appendChild(m); menuEl = m; const r = anchor.getBoundingClientRect();
  m.style.left = clamp(r.right - m.offsetWidth, 8, innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = (r.bottom + 8) + 'px';
  setTimeout(() => { document.addEventListener('pointerdown', menuOutside, true); document.addEventListener('keydown', menuKey); const f = m.querySelector('button'); if (f) f.focus(); }, 0);
}
function about() {
  const sh = sheet(`<div class="about-hero"><div class="about-ic">${icon('sign')}</div><div><h2 style="margin:0">Meridian PDF Mate</h2><p class="sub" style="margin:2px 0 0">Version ${VERSION} · Tango Juliet Dev</p></div></div>
    <p class="about-lead">PDF editor for seafarers. Fill, sign, mark up and organise ship's documents.</p>
    <div class="about-facts"><span>${icon('offline')} Works offline</span><span>${icon('open')} No installation</span><span>${icon('lock')} Files stay on this device</span></div>
    <div class="about-mail"><div><b>Suggestions or problems</b><span>tangojulietdev@gmail.com</span></div><a class="btn" href="mailto:tangojulietdev@gmail.com?subject=Meridian%20PDF%20Mate%20${VERSION}">${icon('mail')} Email</a></div>
    <p class="about-small">Uses pdf.js and Tesseract (Apache 2.0) and pdf-lib (MIT).</p>
    <div class="acts">${isStandalone() ? '' : `<button class="btn" data-k="install">${icon('install')} Install</button>`}<button class="btn primary" data-x>Done</button></div>`);
  sh.querySelector('[data-x]').onclick = closeSheet;
  const ib = sh.querySelector('[data-k="install"]'); if (ib) ib.onclick = () => { closeSheet(); doInstall(); };
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
  if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(S.zoom * 1.25); return; }
  if (mod && e.key === '-') { e.preventDefault(); setZoom(S.zoom / 1.25); return; }
  if (mod && e.key === '0') { e.preventDefault(); setZoom(0, true); return; }
  if (inField || $('#layer .scrim')) return;
  if (RUL.on && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !mod && !S.sel && S.tool !== 'objedit' && S.pages.length) { e.preventDefault(); rulStep(e.key === 'ArrowDown' ? 1 : -1); return; }
  if (S.poly && (e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); finishPoly(e.key === 'Escape' && false); return; }
  if (S.tool === 'objedit' && S.pages.length) {
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); objSelectAll(OSEL ? pageById(OSEL.pageId) : S.pages[S.current]); return; }
    if (mod && e.key.toLowerCase() === 'v' && OCLIP) { e.preventDefault(); objPaste(); return; }
    if (OSEL) {
      if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); objCopy(); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); objDupOffset(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); objDelete(); return; }
      if (e.key === 'Escape') { e.preventDefault(); const pp = pageById(OSEL.pageId); OSEL = null; if (pp) drawOverlay(pp); refreshFormatBar(); return; }
      const ar = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (ar) { e.preventDefault(); const k = e.shiftKey ? 10 : 1; objNudge(ar[0] * k, ar[1] * k); return; }
      if (e.key === 'Tab' && OSEL.hits && OSEL.hits.length > 1) { e.preventDefault(); OSEL.hi = ((OSEL.hi || 0) + (e.shiftKey ? -1 : 1) + OSEL.hits.length) % OSEL.hits.length; OSEL.ids = [OSEL.hits[OSEL.hi]]; drawOverlay(pageById(OSEL.pageId)); refreshFormatBar(); return; }
    }
  }
  if (mod && e.key.toLowerCase() === 'a' && S.pages.length && !String(getSelection() || '')) { e.preventDefault(); selectAllOnPage(); return; }
  if (mod && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x') && S.sel && !String(getSelection() || '')) { e.preventDefault(); copySelected(e.key.toLowerCase() === 'x'); return; }
  if (mod && e.key.toLowerCase() === 'v' && CLIP && S.pages.length) { e.preventDefault(); pasteClip(); return; }
  if (mod && e.key.toLowerCase() === 'd' && S.sel) { e.preventDefault(); duplicateSelected(); return; }
  if (mod && e.key === ']' && S.sel) { e.preventDefault(); reorderSelected(true); return; }
  if (mod && e.key === '[' && S.sel) { e.preventDefault(); reorderSelected(false); return; }
  if (mod && !e.altKey && fmtTarget()) { const k = e.key.toLowerCase(); const m2 = { b: 'bold', i: 'italic', u: 'underline' }; if (m2[k]) { e.preventDefault(); fmtToggle(m2[k]); return; } if (e.shiftKey && k === 'x') { e.preventDefault(); fmtToggle('strike'); return; } }
  if (e.key === '?' && !mod) { e.preventDefault(); openShortcuts(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); deleteSelected(); return; }
  if (e.key === 'Escape') { if (S.sel) select(null); else if (S.tool !== 'select') setTool('select'); return; }
  if (S.sel && e.key.startsWith('Arrow')) {
    e.preventDefault(); const s = selAnns(); if (!s) return; const st = e.shiftKey ? 10 : 1; const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    const T = pdfAffineFromDisplay(geo(s.p), (x, y) => [x + d[0], y + d[1]]); s.as.forEach((a) => applyT(a, T)); drawOverlay(s.p); clearTimeout(styleCommitT); styleCommitT = setTimeout(commit, 400); return;
  }
  if (!mod && S.pages.length) { const map = { v: 'select', h: 'hand', t: 'text', b: 'tbox', o: 'objedit', m: 'measure', k: 'area', c: 'cloud', d: 'edittext', n: 'note', u: 'hl', w: 'white', x: 'redact', r: 'rect', e: 'ellipse', l: 'line', a: 'arrow', p: 'pen' }; const k = map[e.key.toLowerCase()]; if (k) setTool(k); }
});

/* ---------- Shortcuts sheet ---------- */
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function openShortcuts() {
  const K = (k) => k.split(' ').map((x) => `<kbd>${esc(x === 'Ctrl' && MAC ? '⌘' : x === 'Alt' && MAC ? '⌥' : x)}</kbd>`).join('');
  const groups = [
    ['Tools', [['Select', 'V'], ['Hand (or hold Space)', 'H'], ['Add text', 'T'], ['Text box', 'B'], ['Edit existing text', 'D'], ['Edit PDF contents (text, shapes, images)', 'O'], ['Measure distance', 'M'], ['Measure area', 'K'], ['Revision cloud', 'C'], ['Note', 'N'], ['Highlight', 'U'], ['Whiteout', 'W'], ['Redact', 'X'], ['Rectangle', 'R'], ['Ellipse', 'E'], ['Line', 'L'], ['Arrow', 'A'], ['Pen', 'P']]],
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
  { sel: '#cats', t: 'Tool categories', d: 'Pick View, Comment, Edit, Fill & Sign, Pages or Protect & Tools. The row underneath shows that group\'s tools. Each tool has a one-letter shortcut that works from any group.' },
  { sel: '#tabbar', t: 'Tabs', d: 'Keep several PDFs open at once. Drop files anywhere to open them in new tabs.' },
  { sel: '#sidebar', t: 'Pages', d: 'Drag thumbnails to reorder. Shift-click to pick several, then rotate, duplicate or delete.' },
  { sel: '#viewer', t: 'Right-click for more', d: 'Right-click a page or a mark for copy, paste, layering and align. Shift-click or Shift-drag selects several marks, and they snap to edges and centres as you drag.' },
  { sel: '#btnMore', t: 'About and help', d: 'What the app can do, shortcuts, the tour and how to send suggestions.' },
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
  $('#btnOpen').innerHTML = icon('open'); $('#btnInstall').innerHTML = icon('install'); $('#btnPrint').innerHTML = icon('print'); $('#btnMore').innerHTML = icon('info'); $('#btnNight').innerHTML = icon('moon'); markThemeBtn(); $('#saveIc').outerHTML = icon('share');
  $('#zoomIn').innerHTML = icon('zin'); $('#zoomOut').innerHTML = icon('zout');
  for (const b of $$('.toolbar .tbtn[title], #tsIc[title]')) { b.dataset.tip = b.getAttribute('title'); b.removeAttribute('title'); }
  const fi = { rotl: 'rotl', rotr: 'rotr', up: 'up', down: 'down', blank: 'blank', del: 'trash' };
  $$('#sbFoot [data-pa]').forEach((b) => { if (fi[b.dataset.pa]) b.innerHTML = icon(fi[b.dataset.pa]); });
  $('#emptyIc').innerHTML = `<svg viewBox="0 0 76 92" width="76" height="92" aria-hidden="true"><defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef0f5"/></linearGradient></defs><path d="M10 2h40l24 24v58a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="url(#eg)" stroke="rgba(0,0,0,.14)"/><path d="M50 2v18a6 6 0 0 0 6 6h18" fill="#e3e6ee" stroke="rgba(0,0,0,.14)"/><rect x="14" y="40" width="40" height="4" rx="2" fill="#d1d5df"/><rect x="14" y="50" width="48" height="4" rx="2" fill="#d1d5df"/><rect x="14" y="60" width="30" height="4" rx="2" fill="#d1d5df"/><path d="M16 78c5 0 7-10 11-10s2 10 7 10 4-5 7-5 3 4 8 3" fill="none" stroke="#007aff" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10" width="26" height="14" rx="4" fill="#ff3b30"/><text x="17" y="20.5" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="-apple-system,Inter,sans-serif">PDF</text></svg>`;
  $('#feat').innerHTML = `<span>${icon('lock')} Stays on device</span><span>${icon('offline')} Works offline</span><span>${icon('sign')} Sign and stamp</span><span>${icon('merge')} Merge and reorder</span>`;
  $('#sbFoot [data-pa="dup"]').innerHTML = icon('dup');
  $$('#sbSeg button').forEach((b) => b.onclick = () => setSbView(b.dataset.v));
  $('#pageInd').addEventListener('click', openGoto);
  WS.list = [blankTab()]; WS.active = 0;
  buildCats(); buildTools(); setTool('select'); renderAll(); resetHistory(); updateChrome(); renderTabs();
  $('#recents').addEventListener('click', (e) => { const x = e.target.closest('[data-forget]'); if (x) { e.stopPropagation(); forgetRecent(x.dataset.forget); return; } const c = e.target.closest('[data-rid]'); if (c) openRecent(c.dataset.rid); });
  $('#recents').addEventListener('keydown', (e) => { const c = e.target.closest('[data-rid]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openRecent(c.dataset.rid); } });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  { const tc = document.getElementById('topchrome'); const setH = () => document.documentElement.style.setProperty('--chrome-h', tc.offsetHeight + 'px'); setH(); try { new ResizeObserver(setH).observe(tc); } catch (e) { addEventListener('resize', setH); } }
  try { localStorage.removeItem('pdfmate.glass'); } catch (e) {}
  const mq = matchMedia('(max-width: 760px)');
  const placeTools = () => { const t = $('#tools'); if (mq.matches) { if (t.parentElement !== document.body) document.body.appendChild(t); } else if (t.parentElement !== $('#ribbon')) $('#ribbon').appendChild(t); };
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
viewer.classList.toggle('stylus-only', INK.stylus); eraserCursor();
applyNight(); initSplit(); initNav(); initRuler(); initScrollbars();
window.__pdfmate = { openDesign, renderAll, WS, SPL, openSplitView, NAV, RUL, recogniseStroke, openReading, openOrganiser, S, buildPdf, geo, vpTransform, addFiles, PSTAT, SNAP, layoutPdf, finishPrint };
