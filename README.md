# Notepad

A fast, offline plain-text editor in a single HTML file. Built because Chromebooks
have no quick equivalent of Windows Notepad.

Open `index.html` in any browser — no build step, no dependencies, no network.

## Install as an app

Chrome refuses to install `file://` pages, so serve it over http(s) (e.g. GitHub
Pages), open the URL, then use **⋮ → Cast, save and share → Install page as app**.
The service worker caches the page, so it works offline after the first load.

## Features

- **File:** New (`Ctrl+N`), Open (`Ctrl+O`), Save (`Ctrl+S`), Save As (`Ctrl+Shift+S`).
  On an http(s) origin, Save writes back to the file you opened via the File System
  Access API; on `file://` it falls back to a download. Drag-and-drop opens a file.
- **Edit:** undo/redo, find & replace with match count (`Ctrl+F` / `Ctrl+H`),
  timestamp (`F5`), Tab inserts a tab character.
- **View:** word wrap, dark mode (follows the system setting initially), status bar,
  zoom (`Ctrl` `+` / `-` / `0`).
- Autosaves text, filename, caret position and preferences to `localStorage`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire editor — works standalone |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | Make it installable and offline-capable |
| `serve.js` | `node serve.js` → local test server on :8731 |
| `make-icons.js` | Regenerates the icons |

## Updating

After editing `index.html`, bump `CACHE` in `sw.js` so installed copies pick up the
new version.
