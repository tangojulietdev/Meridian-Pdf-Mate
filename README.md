# Meridian PDF Mate

Offline PDF editor by Tango Juliet Dev. Fill, sign, stamp and mark up PDFs, then merge, reorder, rotate or delete pages. Installable PWA. Files are processed on the device and never uploaded.

## Features

- Open PDFs (password-protected too), photos as pages, or blank pages. Merge several files into one.
- Fill form fields directly on the page (text, checkboxes, dropdowns, radio buttons). Values are flattened into the saved file.
- Markup: text, whiteout, highlight, rectangle, line, arrow, freehand pen, tick, cross.
- Word-style text formatting: font (Arial/Helvetica, Times New Roman, Courier New), size, bold, italic, underline, strikethrough, font colour, text highlight, left/centre/right/justify, line spacing, character spacing, bullets and numbering, change case. Shortcuts Ctrl+B, I, U, Shift+X, E, L, R, J.
- Text boxes (B): drag to draw, text wraps to the box width. Quick styles, solid or custom fills, gradients, fill transparency, solid/dashed/dotted borders with colour and weight, square to pill corners, shadow, inner margin and vertical alignment. Saved as real vector text in the PDF.
- Signatures drawn on screen and imported stamp images (with white background removal), kept in a local library.
- Page sidebar: reorder by drag or buttons, rotate, delete, insert blank, multi-select, save selected pages only.
- Fast with heavy drawings: one page renders at a time (the one on screen first), zoom is instant and sharpens when you stop, rendered pages are cached for scrolling back, and at high zoom only the visible part is drawn at full resolution so large sheets stay crisp. Pages that take long to draw switch to fast view automatically.
- Save option to flatten heavy drawing pages to 220 dpi images so the file opens fast anywhere (markup stays vector; skipped if it would make the file bigger).
- Undo and redo, keyboard shortcuts, light and dark appearance.
- Print with page range, one-sided, two-sided (long or short edge binding, preset in the print dialog) or manual two-sided for printers without duplex.
- Save by download or share sheet (email, WhatsApp) on phones.

Editing the original text inside a PDF is not supported. Cover it with Whiteout and type over it.

## Structure

- `index.html` markup and styles
- `app.js` application (ES module)
- `vendor/` pdf.js 6.2 legacy build (Apache 2.0) with cmaps, standard fonts and wasm decoders, pdf-lib 1.17.1 (MIT)
- `sw.js` offline cache, `manifest.webmanifest`, `icons/`
