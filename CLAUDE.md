# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

「採買口袋清單」— a mobile-first prototype for shopping abroad. Two modes: **匯入整理** (pre-trip: paste product links/screenshots, jot down store/category/target price) and **採買中** (in-store: filter by store/category, check items off, compare spot price vs. target price, share the list via a link). Pure static site — `index.html` + `script.js` + `styles.css`, no build tool, no package.json, no framework, no tests.

## Commands

There is no build/lint/test tooling. To preview locally:

```bash
python3 -m http.server
```

then open `http://localhost:8000/`. Editing `index.html`/`script.js`/`styles.css` and reloading the browser is the entire dev loop.

To deploy: commit and push to `main` — GitHub Pages is configured to serve directly from the repo root (see README.md).

## Architecture

Everything lives in three files with no modules. `script.js` runs top-to-bottom: constants/sample data → DOM ref cache → pure render/helper functions → event bindings → three bootstrap calls at the bottom (`loadState(); loadShareStateFromUrl(); render();`).

### State

- Single global `state` object (`items`, `activeStore`, `activeCategory`, `activeShareMode`, `view`, `readonly`), persisted to `localStorage` under `STORAGE_KEY = "pocket-shopping-list-v4"` via `saveState`/`loadState`.
- **No migration logic exists for the versioned key** — bumping `v4`→`v5` silently drops all local user data back to the sample set. Decide deliberately if you ever need to change the item schema.
- `state.activeStore` is intentionally *not* persisted across reloads (user re-picks a store each visit), but *is* set when loading a shared link — reload and shared-link entry behave differently on purpose.
- Search text and the "must-buy" toggle are read live from the DOM (`searchInput.value`, `mustToggle.checked`) inside `getFilteredItems`, not stored in `state` — they don't survive reload and aren't part of the share snapshot. If you need them to persist, that's a 3-place change (`state`, `saveState`/`loadState`, `encodeSnapshot`).
- Sharing works by base64-encoding a trimmed snapshot of state (items minus `imageDataUrl`, plus store/category/shareMode/view) into `?snapshot=` (`encodeSnapshot`/`decodeSnapshot`/`loadShareStateFromUrl`). `shareMode === "readonly"` is the only thing that sets `state.readonly = true`.
- Read-only mode is enforced by scattered `if (state.readonly) return;` guards at each write site (form submit, toggles, store switch, etc.) rather than one central check — add the guard yourself on any new write path. `renderReadonlyState` is the one place that reflects it back into the UI (disables inputs/buttons).

### Rendering

No `<template>` tags — `render()` and its children (`renderCards`, `renderDraftList`, `updateStoreCounts`, `updateSharePanel`, …) build cards via `innerHTML` template strings. Cards carry `data-action` attributes; a single delegated listener on the list container (`spot-price`/`done`/`help`/`preview-image`) handles all clicks/inputs via `.closest(".item-card")`. Follow this `data-action` + delegation pattern for new interactive elements rather than attaching per-card listeners.

All user-supplied text going into `innerHTML` is manually wrapped in `escapeHtml()` — it's the only XSS defense in the app (no framework auto-escaping). Any new field that gets rendered must be wrapped too.

### Adding a form field to items

Touches five places: `index.html` (input/select) → `makeNewItem` (read it from FormData) → `sampleItems` (keep every sample item consistent) → the render template string (display it) → `getFilteredItems`'s search-text array (if it should be searchable).

### CSS

`styles.css` is mobile-first with only two breakpoints (`min-width: 760px`, `max-width: 370px`), kebab-case semantic class names (not BEM), state via `.is-active`/`.is-done` classes or `data-*` attribute selectors.

**Important**: the stylesheet contains three near-complete stacked "skin" layers from successive design passes — base rules, then a block marked `/* Superdesign hi-fi skin */`, then a final block marked `/* Superdesign project alignment */` (including a second `:root` that overrides the first). Selectors like `.app-shell`, `.item-card`, and `:root` are each defined 2–3 times; due to CSS cascade order, **the last (`Superdesign project alignment`) definition is what's actually visible**. When changing a visual style, make sure you're editing the layer that's actually in effect, not an earlier one that's already overridden.

### Browser API surface

`navigator.clipboard.read()`, `navigator.share()`, `FileReader`+`<canvas>` (image compression to 900px/JPEG q0.78 before storing as dataURL), `URLSearchParams`/`btoa`/`atob` for the share snapshot. Two parallel clipboard-image code paths (`readClipboardImage` for button-triggered read, `usePastedImageFromTarget` for a `contenteditable` long-press-paste fallback) exist specifically to work around iOS Safari not allowing `navigator.clipboard.read()` from a plain button tap — test both if you touch image import.

`saveState` silently drops every item's `imageDataUrl` and retries if the `localStorage.setItem` write throws (usually because embedded images pushed it over quota), showing only a toast — images can vanish without an error. Shared links never include images at all (`encodeSnapshot` strips `imageDataUrl` unconditionally) — these are two separate "images get dropped" mechanisms, not one.
