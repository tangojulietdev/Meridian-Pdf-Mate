/* Meridian PDF Mate OCR worker: Tesseract LSTM engine, English, fully offline */
let Mod = null, api = null;
async function init() {
  if (api) return;
  importScripts('tesseract-core-lstm.js');
  Mod = await self.TesseractCore({ locateFile: (f) => f });
  const td = new Uint8Array(await (await fetch('eng.traineddata')).arrayBuffer());
  Mod.FS.writeFile('./eng.traineddata', td);
  api = new Mod.TessBaseAPI();
  const st = api.Init(null, 'eng', 1);
  if (st === -1) throw new Error('Could not start the text recogniser');
  api.SetVariable('tessedit_pageseg_mode', '3');
  api.SetVariable('preserve_interword_spaces', '1');
}
self.onmessage = async (e) => {
  const { id, cmd, data } = e.data;
  try {
    await init();
    if (cmd === 'init') { self.postMessage({ id, ok: true }); return; }
    Mod.FS.writeFile('/input', new Uint8Array(data));
    const r = api.SetImageFile(1, 0); if (r === 1) throw new Error('Could not read the page image');
    api.Recognize(null);
    const tsv = api.GetTSVText(0);
    api.Clear();
    self.postMessage({ id, ok: true, tsv });
  } catch (err) { self.postMessage({ id, ok: false, err: String((err && err.message) || err) }); }
};
