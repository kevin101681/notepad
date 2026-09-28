# Notepad

A fast, offline plain-text editor in a single HTML file. Built because Chromebooks
have no quick equivalent of Windows Notepad.

Open `index.html` in any browser — no build step, no dependencies. The network is
only used if you turn on note sync.

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

## Synced notes

**File → Sync Settings…** connects a private GitHub repository. Notes are plain
files in it, and the **Notes panel** (`Ctrl+B`) shows its folders as a tree.

1. Create a private repo (e.g. `kevin101681/notes`).
2. Create a [fine-grained token](https://github.com/settings/personal-access-tokens/new)
   with access to only that repo and **Contents: Read and write**.
3. On each device, enter the repo, branch and token. The token stays in that
   browser's `localStorage`.

- Edits are committed about 2.5 s after you stop typing, when the tab is hidden,
  and on `Ctrl+S`. Offline edits are kept locally and pushed when you're back online.
- Changes from other devices are pulled when the tab regains focus and every minute.
- If a note changed on two devices, you choose: overwrite, or keep both (yours is
  saved as `name (conflict <date>).txt`).
- Panel: **+** new note (use `/` for folders), ✎ rename/move, ✕ delete. Every save
  is a commit, so the repo history holds old versions.
- **File → Save to Notes…** puts the current buffer (e.g. an opened local file)
  into the repo. **Save As** on a note exports a copy to disk.

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
