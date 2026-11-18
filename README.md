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
- Tools grouped like a desktop PDF editor: View, Comment, Edit, Fill & Sign, Pages and Tools in the top bar, with the chosen group's tools and labels in the row underneath (a category switcher in the bottom dock on phones). Tool shortcut keys jump to the right group.
- Measure distance and area to scale on drawings (calibrate once on a known dimension), revision clouds, highlight, underline and strikeout of selected text.
- Password protection with AES-256 (PDF 2.0 standard), with print, copy and edit permissions. Export to Word (.docx) as editable text or exact-look pages. Extract pages, reverse order, remove document info.
- Search text from the top bar (Ctrl+F): live match count, results list with page and context, previous and next, match case and whole words.
- Print options: all, current page, selected pages or a range, odd or even only, reverse order, copies with collate, several pages per sheet (2, 4, 6, 9, 16) with optional borders, fold-and-staple booklets, fit to A4, A3, A5, Letter or Legal, one-sided, two-sided or manual two-sided, black and white, document only or markup only (for pre-printed forms), file name and date in the margin, a paper count and a preview.
- Shapes gallery like Word: one Shapes button opens 80+ shapes in groups (lines and arrows, rectangles, basic shapes, block arrows, flowchart, stars and banners, callouts). Drag to draw, tap for a standard size, Shift keeps proportions. Every shape can be filled, recoloured, resized, rotated and swapped for another with Change shape, and saves as real vector paths.
- Windows file icon: when Meridian PDF Mate is the default PDF app, PDF files show a Meridian PDF icon. For page thumbnails in File Explorer, turn on PDF thumbnails in Microsoft PowerToys, File Explorer add-ons.
- Frosted glass interface: the document scrolls under translucent top bars and side panel, with one clear glass material (Mac style blur and a fine edge) on every menu, sheet and floating bar. Can be turned off in View for older computers, and follows the system Reduce transparency setting.
- Undo and redo, keyboard shortcuts, light and dark appearance.
- Print with page range, one-sided, two-sided (long or short edge binding, preset in the print dialog) or manual two-sided for printers without duplex.
- Save by download or share sheet (email, WhatsApp) on phones.

- Edit PDF contents (O): select the original text, lines, shapes, curves and images inside a PDF and move, resize, rotate (handle or 90° steps), flip, duplicate (Ctrl+D or Alt-drag), copy and paste on the page, recolour text, lines and fills, change line weight or delete. Box select, Select all, All text, All images and Select similar for drawings, Tab to reach objects underneath, Reset or Restore page to undo. Changes are written into the page content itself.
- Free rotation for your own markup: text, text boxes, notes, stamps, images, signatures, shapes, lines and drawings, with a rotate handle (Shift snaps to 15°) and 90° buttons.
- Zoom from 7.5% to 3600%, anchored where you scroll or pinch, with a sharp detail layer for large drawings and a zoom presets menu.

Original text lines, horizontal, vertical or at any angle, can be replaced with Edit text (D); for anything else cover it with Whiteout and type over it.

## Structure

- `index.html` markup and styles
- `app.js` application (ES module)
- `vendor/` pdf.js 6.2 legacy build (Apache 2.0) with cmaps, standard fonts and wasm decoders, pdf-lib 1.17.1 (MIT)
- `sw.js` offline cache, `manifest.webmanifest`, `icons/`
