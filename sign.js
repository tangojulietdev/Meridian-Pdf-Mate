// Digital IDs and certificate signatures (adbe.pkcs7.detached). Loaded on demand.
let F = null;
export async function loadForge() {
  if (F) return F;
  if (!window.forge) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/forge.min.js?v=1'; s.onload = res; s.onerror = () => rej(new Error('Could not load the signing library')); document.head.appendChild(s); });
  F = window.forge; return F;
}

/* ---------- storage ---------- */
const DB = 'pdfmate-ids';
function db() { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('ids', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function tx(mode, fn) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('ids', mode); const st = t.objectStore('ids'); const r = fn(st); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); }
export async function listIds() { const all = (await tx('readonly', (s) => s.getAll())) || []; return all.sort((a, b) => b.created - a.created); }
export async function deleteId(id) { await tx('readwrite', (s) => s.delete(id)); }
async function putId(rec) { await tx('readwrite', (s) => s.put(rec)); return rec; }

const bin = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return s; };
const u8 = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
const attr = (dn, k) => { const a = dn.getField(k); return a ? String(a.value) : ''; };

function certInfo(cert) {
  const s = cert.subject, i = cert.issuer;
  return {
    name: attr(s, 'CN') || attr(s, 'O') || 'Unnamed', email: attr(s, 'E') || attr(s, 'emailAddress') || '', org: attr(s, 'O'),
    issuer: attr(i, 'CN') || attr(i, 'O') || '', selfSigned: s.hash === i.hash,
    notBefore: +cert.validity.notBefore, notAfter: +cert.validity.notAfter, serial: cert.serialNumber
  };
}

function openP12(der, password) {
  const p12 = F.pkcs12.pkcs12FromAsn1(F.asn1.fromDer(der), false, password);
  const keys = [...(p12.getBags({ bagType: F.pki.oids.pkcs8ShroudedKeyBag })[F.pki.oids.pkcs8ShroudedKeyBag] || []), ...(p12.getBags({ bagType: F.pki.oids.keyBag })[F.pki.oids.keyBag] || [])];
  const certs = (p12.getBags({ bagType: F.pki.oids.certBag })[F.pki.oids.certBag] || []).map((b) => b.cert).filter(Boolean);
  const key = keys.map((b) => b.key).find(Boolean);
  if (!key) throw new Error('No private key in this file');
  if (!key.n) throw new Error('Only RSA digital IDs are supported');
  const cert = certs.find((c) => c.publicKey && c.publicKey.n && c.publicKey.n.equals(key.n)) || certs[0];
  if (!cert) throw new Error('No certificate in this file');
  return { key, cert, chain: certs.filter((c) => c !== cert) };
}

export async function createId({ name, org = '', email = '', password, years = 5 }) {
  await loadForge();
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const pk8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
  const pki = F.pki; const asn = F.asn1.fromDer(bin(pk8));
  const key = pki.privateKeyFromAsn1(asn);
  const cert = pki.createCertificate();
  cert.publicKey = pki.setRsaPublicKey(key.n, key.e);
  const sr = crypto.getRandomValues(new Uint8Array(16)); sr[0] &= 0x7f; cert.serialNumber = F.util.bytesToHex(bin(sr));
  const nb = new Date(Date.now() - 60000), na = new Date(nb); na.setFullYear(na.getFullYear() + years);
  cert.validity.notBefore = nb; cert.validity.notAfter = na;
  const dn = [{ name: 'commonName', value: name }]; if (org) dn.push({ name: 'organizationName', value: org }); if (email) dn.push({ name: 'emailAddress', value: email });
  cert.setSubject(dn); cert.setIssuer(dn);
  cert.setExtensions([{ name: 'basicConstraints', cA: false }, { name: 'keyUsage', digitalSignature: true, nonRepudiation: true }, { name: 'extKeyUsage', emailProtection: true, codeSigning: false }, { name: 'subjectKeyIdentifier' }]);
  cert.sign(key, F.md.sha256.create());
  const p12 = F.asn1.toDer(F.pkcs12.toPkcs12Asn1(key, [cert], password, { algorithm: 'aes256', friendlyName: name })).getBytes();
  return putId({ id: 'id' + Date.now().toString(36), created: Date.now(), p12: u8(p12), ...certInfo(cert) });
}

export async function importId(bytes, password) {
  await loadForge();
  const { cert } = openP12(bin(bytes), password);
  return putId({ id: 'id' + Date.now().toString(36), created: Date.now(), p12: bytes, imported: true, ...certInfo(cert) });
}

export async function unlock(rec, password) { await loadForge(); return openP12(bin(rec.p12), password); }
export async function certDer(rec, password) { const { cert } = await unlock(rec, password); return u8(F.asn1.toDer(F.pki.certificateToAsn1(cert)).getBytes()); }

/* ---------- signing ---------- */
const WIN = /[^\x20-\x7e -ÿ]/g;
export async function signPdf(PL, bytes, id, o = {}) {
  await loadForge();
  const { key, cert, chain } = id; const info = certInfo(cert);
  const pdf = await PL.PDFDocument.load(bytes);
  const ctx = pdf.context, N = (n) => PL.PDFName.of(n);
  const LEN = 12288 + chain.length * 2048; const now = o.date || new Date();
  const br = PL.PDFArray.withContext(ctx); br.push(PL.PDFNumber.of(0)); for (let i = 0; i < 3; i++) br.push(N('**********'));
  const sig = ctx.obj({ Type: 'Sig', Filter: 'Adobe.PPKLite', SubFilter: 'adbe.pkcs7.detached' });
  sig.set(N('ByteRange'), br); sig.set(N('Contents'), PL.PDFHexString.of('0'.repeat(LEN * 2)));
  sig.set(N('M'), PL.PDFString.fromDate(now)); sig.set(N('Name'), PL.PDFHexString.fromText(info.name));
  if (o.reason) sig.set(N('Reason'), PL.PDFHexString.fromText(o.reason));
  if (o.location) sig.set(N('Location'), PL.PDFHexString.fromText(o.location));
  if (o.contact) sig.set(N('ContactInfo'), PL.PDFHexString.fromText(o.contact));
  sig.set(N('Prop_Build'), ctx.obj({ App: { Name: 'PDF_Mate' } }));
  const sigRef = ctx.register(sig);
  const form = pdf.getForm();
  let widget = null, page = null;
  if (o.useField !== false) for (const f of form.getFields()) {
    if (!(f instanceof PL.PDFSignature) || f.acroField.dict.get(N('V'))) continue;
    const ws = f.acroField.getWidgets(); if (!ws.length) continue;
    f.acroField.dict.set(N('V'), sigRef); widget = ws[0];
    const pr = widget.P(); page = pdf.getPages().find((p) => p.ref === pr) || pdf.getPages().find((p) => (p.node.Annots() || { asArray: () => [] }).asArray().some((r) => ctx.lookup(r) === widget.dict)) || pdf.getPage(0);
    break;
  }
  if (!widget) {
    page = pdf.getPage(Math.min(o.page || 0, pdf.getPageCount() - 1));
    const r = o.rect || [0, 0, 0, 0];
    const n = form.getFields().filter((f) => f instanceof PL.PDFSignature).length + 1;
    const wd = ctx.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Sig', Rect: [r[0], r[1], r[0] + r[2], r[1] + r[3]], F: 132, P: page.ref });
    wd.set(N('T'), PL.PDFString.of('Signature' + n)); wd.set(N('V'), sigRef);
    const wr = ctx.register(wd); page.node.addAnnot(wr); form.acroForm.addField(wr);
    widget = { dict: wd, getRectangle: () => ({ x: r[0], y: r[1], width: r[2], height: r[3] }) };
  }
  form.acroForm.dict.set(N('SigFlags'), PL.PDFNumber.of(3));
  const rc = widget.getRectangle();
  if (rc.width > 4 && rc.height > 4 && o.visible !== false) {
    const font = await pdf.embedFont(PL.StandardFonts.Helvetica), bold = await pdf.embedFont(PL.StandardFonts.HelveticaBold);
    const w = rc.width, h = rc.height; const d = now;
    const pad = (x) => String(x).padStart(2, '0');
    const when = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${(() => { const z = -d.getTimezoneOffset(); return (z >= 0 ? '+' : '-') + pad(Math.floor(Math.abs(z) / 60)) + "'" + pad(Math.abs(z) % 60) + "'"; })()}`;
    const L = [[bold, info.name.replace(WIN, '?')], [font, 'Digitally signed'], [font, 'Date: ' + when]];
    if (o.reason) L.push([font, 'Reason: ' + o.reason.replace(WIN, '?')]);
    if (o.location) L.push([font, 'Location: ' + o.location.replace(WIN, '?')]);
    const mw = Math.max(...L.map(([f, t]) => f.widthOfTextAtSize(t, 1)));
    const fs = Math.max(4, Math.min(11, (h - 6) / (L.length * 1.22), (w - 10) / mw));
    let ops = `q 0.94 0.96 1 rg 0 0 ${w} ${h} re f 0.16 0.42 0.86 RG 1 w 0.5 0.5 ${w - 1} ${h - 1} re S Q `;
    ops += `q 0.16 0.42 0.86 rg 0 0 3 ${h} re f Q BT 0.08 0.1 0.16 rg `;
    let y = h - 4 - fs;
    for (const [f, t] of L) { ops += `/${f === bold ? 'F2' : 'F1'} ${fs.toFixed(2)} Tf 1 0 0 1 7 ${y.toFixed(2)} Tm ${f.encodeText(t).toString()} Tj `; y -= fs * 1.22; }
    ops += 'ET';
    const ap = ctx.stream(ops, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, w, h], Resources: { Font: { F1: font.ref, F2: bold.ref } } });
    widget.dict.set(N('AP'), ctx.obj({ N: ctx.register(ap) }));
    widget.dict.set(N('F'), PL.PDFNumber.of(132));
  }
  const out = await pdf.save({ useObjectStreams: false, addDefaultPage: false });
  const s = new TextDecoder('latin1').decode(out);
  const ph = '[ 0 /********** /********** /********** ]';
  const bi = s.indexOf(ph); if (bi < 0) throw new Error('Signature placeholder not found');
  const zeros = '<' + '0'.repeat(LEN * 2) + '>';
  const ci = s.indexOf(zeros, bi); if (ci < 0) throw new Error('Signature placeholder not found');
  const a = ci, b = ci + zeros.length;
  const brs = `[0 ${a} ${b} ${out.length - b}]`.padEnd(ph.length, ' ');
  for (let i = 0; i < brs.length; i++) out[bi + i] = brs.charCodeAt(i);
  const data = new Uint8Array(a + out.length - b); data.set(out.subarray(0, a), 0); data.set(out.subarray(b), a);
  const p7 = F.pkcs7.createSignedData();
  p7.content = F.util.createBuffer(bin(data));
  p7.addCertificate(cert); chain.forEach((c) => p7.addCertificate(c));
  p7.addSigner({ key, certificate: cert, digestAlgorithm: F.pki.oids.sha256, authenticatedAttributes: [{ type: F.pki.oids.contentType, value: F.pki.oids.data }, { type: F.pki.oids.messageDigest }, { type: F.pki.oids.signingTime, value: now }] });
  p7.sign({ detached: true });
  const hex = F.util.bytesToHex(F.asn1.toDer(p7.toAsn1()).getBytes());
  if (hex.length > LEN * 2) throw new Error('Signature too large');
  for (let i = 0; i < hex.length; i++) out[a + 1 + i] = hex.charCodeAt(i);
  return out;
}

/* ---------- verification ---------- */
const OID = { md: '1.2.840.113549.1.9.4', time: '1.2.840.113549.1.9.5' };
function hexText(raw) {
  if (!raw) return '';
  if (raw[0] === '<') { const h = raw.slice(1, -1).replace(/\s/g, ''); let b = ''; for (let i = 0; i + 1 < h.length; i += 2) b += String.fromCharCode(parseInt(h.substr(i, 2), 16)); raw = b; } else raw = raw.slice(1, -1).replace(/\\([()\\])/g, '$1');
  if (raw.charCodeAt(0) === 0xfe && raw.charCodeAt(1) === 0xff) { let t = ''; for (let i = 2; i + 1 < raw.length; i += 2) t += String.fromCharCode((raw.charCodeAt(i) << 8) | raw.charCodeAt(i + 1)); return t; }
  return raw;
}
export function hasSignatures(bytes) { const n = Math.min(bytes.length, 64 * 1024 * 1024); const s = new TextDecoder('latin1').decode(bytes.subarray(0, n)); return /\/ByteRange\s*\[/.test(s); }

export async function verifyPdf(bytes) {
  await loadForge();
  const s = new TextDecoder('latin1').decode(bytes); const res = [];
  const re = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g; let m;
  while ((m = re.exec(s))) {
    const [a, b, c, d] = m.slice(1, 5).map(Number);
    const r = { valid: false, intact: false, whole: c + d === bytes.length, name: '', reason: '', location: '', when: null, issuer: '', selfSigned: false, error: '' };
    const near = s.slice(Math.max(0, Math.min(m.index, b) - 3000), Math.min(m.index, b)) + ' ' + s.slice(Math.max(m.index, c), Math.max(m.index, c) + 3000);
    const g = (k) => { const x = near.match(new RegExp('/' + k + '\\s*(<[0-9A-Fa-f\\s]*>|\\((?:\\\\.|[^\\\\)])*\\))')); return x ? hexText(x[1]) : ''; };
    r.reason = g('Reason'); r.location = g('Location'); r.name = g('Name');
    try {
      if (a !== 0 || b <= 0 || c <= b || c + d > bytes.length) throw new Error('Damaged signature');
      const hex = s.slice(b + 1, c - 1).replace(/[^0-9A-Fa-f]/g, '');
      const der = F.util.hexToBytes(hex);
      const ci = F.asn1.fromDer(der, { parseAllBytes: false });
      const sd = ci.value[1].value[0]; const parts = sd.value;
      const certNode = parts.find((p) => p.tagClass === F.asn1.Class.CONTEXT_SPECIFIC && p.type === 0);
      const certs = []; if (certNode) for (const cn of certNode.value) { try { certs.push(F.pki.certificateFromAsn1(cn)); } catch (e) { /* non RSA */ } }
      const si = parts[parts.length - 1].value[0]; const sv = si.value;
      const sid = sv[1]; const dOid = F.asn1.derToOid(sv[2].value[0].value); const mdName = F.pki.oids[dOid];
      if (!F.md[mdName]) throw new Error('Unsupported digest');
      const attrs = sv[3].tagClass === F.asn1.Class.CONTEXT_SPECIFIC ? sv[3] : null;
      const sigBytes = sv[sv.length - 1].value;
      let cert = certs[0];
      if (sid.type === F.asn1.Type.SEQUENCE) { const ser = F.util.bytesToHex(sid.value[1].value).replace(/^0+/, ''); cert = certs.find((x) => x.serialNumber.replace(/^0+/, '') === ser) || cert; }
      if (!cert) throw new Error('Signer certificate missing or not RSA');
      Object.assign(r, (() => { const i = certInfo(cert); return { signer: i.name, email: i.email, org: i.org, issuer: i.issuer, selfSigned: i.selfSigned, notBefore: i.notBefore, notAfter: i.notAfter }; })());
      if (!r.name) r.name = r.signer;
      const md = F.md[mdName].create(); md.update(bin(bytes.subarray(a, a + b))); md.update(bin(bytes.subarray(c, c + d))); const dig = md.digest().bytes();
      let signed = dig;
      if (attrs) {
        let mdv = null;
        for (const at of attrs.value) { const oid = F.asn1.derToOid(at.value[0].value); const v = at.value[1].value[0]; if (oid === OID.md) mdv = v.value; if (oid === OID.time) { try { r.when = +(v.type === F.asn1.Type.UTCTIME ? F.asn1.utcTimeToDate(v.value) : F.asn1.generalizedTimeToDate(v.value)); } catch (e) { /* ignore */ } } }
        r.intact = mdv === dig;
        const set = F.asn1.create(F.asn1.Class.UNIVERSAL, F.asn1.Type.SET, true, attrs.value);
        const m2 = F.md[mdName].create(); m2.update(F.asn1.toDer(set).getBytes()); signed = m2.digest().bytes();
      } else r.intact = true;
      r.valid = r.intact && cert.publicKey.verify(signed, sigBytes);
      if (!r.when) { const mm = near.match(/\/M\s*\(D:(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/); if (mm) r.when = +new Date(Date.UTC(+mm[1], mm[2] - 1, +mm[3], +mm[4], +mm[5], +mm[6])); }
      r.expiredAtSigning = r.when && (r.when > r.notAfter || r.when < r.notBefore);
    } catch (e) { r.error = e.message || 'Could not read this signature'; }
    res.push(r);
  }
  return res;
}
