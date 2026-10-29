# SocialCalc Modularization

## 📊 SocialCalc File Breakdown

The original SocialCalc spreadsheet engine was contained in a single monolithic file: `SocialCalc.js`. This large file has now been broken down into focused, modular files within `src/components/socialcalc/core/` for better maintainability and development experience.

## Core Module Structure

The `src/components/socialcalc/core/` directory contains the following modularized files:

| File | Purpose | Description |
|------|---------|-------------|
| **`constants.js`** | Configuration & Localization | Contains all constants, strings, and configuration values used throughout SocialCalc. This is the main place for localization and customization of labels and settings. |
| **`core.js`** | Core Spreadsheet Logic | Implements the core spreadsheet logic, including cell and sheet data structures, calculation engine, and essential functions for manipulating spreadsheet data. |
| **`format-number.js`** | Number Formatting | Handles number formatting, including currency, percentage, and custom formats. Ensures that spreadsheet values are displayed according to user preferences and locale. |
| **`formula.js`** | Formula Engine | Provides formula parsing and calculation capabilities. This module interprets spreadsheet formulas and computes their results, supporting a wide range of functions. |
| **`table-editor.js`** | Grid UI & Interactions | Manages the table/grid UI, including rendering, scrolling, and user interactions like keyboard and mouse input. Responsible for the spreadsheet's visual editing experience. |
| **`spreadsheet-control.js`** | High-level Controls | Offers high-level controls for embedding the spreadsheet in a web page, including toolbars and UI integration. Enables features like multi-sheet management and advanced controls. |
| **`index.js`** | Module Entry Point | Entry point that imports all the above modules in the correct order and exposes the global `SocialCalc` object for use throughout the app. |

## Modularization Benefits

> **📝 Legacy to Modern:**  
> The monolithic `SocialCalc.js` file has been modernized and split into these focused modules, providing:
> 
> - **Better Maintainability**: Each module handles a specific aspect of spreadsheet functionality
> - **Improved Scalability**: Easier to extend and modify individual components
> - **Enhanced Development Experience**: Clearer code organization and easier debugging
> - **Modular Loading**: Ability to load only required functionality
> - **Better Testing**: Individual modules can be tested in isolation

# socialcalc-ai

## Tornado storage (Save / Open)

The demo app can save and open sheets on the SocialCalc Tornado backend through its JSON
`/api/*` routes (`/api/login`, `/api/logout`, `/api/sheets`, `/api/sheets/<name>`). The client is
`src/storage/tornadoAdapter.ts`; the Login / Open / Save controls are in `src/StorageControls.tsx`.
Authentication is Tornado's signed `user` cookie (`credentials: "include"`), so no token is stored
in the browser.

### Setup

```bash
npm ci
cp .env.example .env.local     # optional, git-ignored
npm run dev                    # http://localhost:5173
```

Run Tornado (with its `/api` routes) on `http://127.0.0.1:8888`. In dev, Vite proxies `/api` there,
so browser and API share one origin and no CORS is needed.

### Environment variables (build time, public, never put secrets here)

| Variable | Default | Meaning |
|---|---|---|
| `VITE_STORAGE_BACKEND` | `tornado` | `tornado` shows Login / Open / Save; `none` hides them (in-memory only) |
| `VITE_API_BASE_URL` | *(empty)* | Tornado origin. Empty = relative `/api/...` URLs |
| `TORNADO_PROXY_TARGET` | `http://127.0.0.1:8888` | Dev only: where the Vite dev server forwards `/api` |

### Pointing it at Tornado

- **Dev:** leave `VITE_API_BASE_URL` empty and set `TORNADO_PROXY_TARGET` if Tornado is not on `:8888`.
- **Separate origin:** set `VITE_API_BASE_URL=https://sheets.example.com`, add this app's origin to
  `ALLOWED_ORIGINS` on Tornado, and for cross-site or Capacitor use also set `COOKIE_SAMESITE=None`
  and `COOKIE_SECURE=true` on Tornado.
- **Container:** the `feature/docker` image proxies `/api` to Tornado itself (see `docker/README.md`).

### Helia (IPFS) storage

The storage bar has a backend selector: **Tornado (server)** keeps the account-based save above;
**Helia (CID)** saves a sheet to IPFS through Tornado's `/meshkit-helia/{upload,retrieve/<cid>,list}`
routes and shows the CID so it can be shared. The app never runs Helia itself, it only talks HTTP to
Tornado. This lives entirely in the demo app (`src/storage/heliaAdapter.ts`, `src/storage/crypto.ts`,
`HeliaSaveModal` / `HeliaOpenModal` in `src/StorageControls.tsx`); nothing in `socialcalc/` changed.

- **Encryption:** the sheet (the raw `WorkBookControlSaveSheet()` string, UTF-8) is encrypted in the
  browser before upload with the passphrase you type: AES-256-GCM, key from PBKDF2-SHA256 (200,000
  iterations), in the EMSH wire format of `@ipfs-meshkit/meshkit`, so Helia and Tornado only see
  ciphertext. The passphrase is never stored and cannot be recovered; whoever opens the CID needs it.
  `src/storage/crypto.ts` is a WebCrypto port of ZKMedical-Billing's `src/services/storage/crypto.ts`
  (meshkit does not export `encrypt`/`decrypt`); a vendored copy of meshkit's own `crypto.ts`
  (`src/storage/fixtures/`) is used by a two-way cross-compat test.
- **Open:** paste a CID and the passphrase (the node's CIDs are listed to click on). A wrong passphrase
  or a corrupted object shows "wrong passphrase or corrupted data"; an unreachable Helia shows
  "Helia is unreachable".
- **Config:** `VITE_HELIA_BASE_URL` (default `http://localhost:8080`) is the Tornado origin serving
  `/meshkit-helia/*`. It is cross-origin, so Tornado must allow this app's origin in its CORS list
  (for `npm run dev`, `http://localhost:5173`). Set it to an empty string to use relative URLs, which
  the Vite dev proxy forwards to `TORNADO_HELIA_PROXY_TARGET` (default `http://127.0.0.1:8080`).
- **Note:** the `/meshkit-helia` routes have no user auth; that is acceptable here only because the
  payload is encrypted. Opening a sheet restores its content and formatting but, like Open/Upload JSON
  for Tornado, not the template's `EditableCells` metadata.

### Tests

`npm run test:run` runs the adapter unit tests. `scripts/e2e-tornado-storage.mjs` is a real-UI
Playwright script (Playwright is not a dependency of this repo; prerequisites are in the file header).

`src/storage/heliaAdapter.test.ts` and `src/storage/crypto.test.ts` cover Helia save/open, the
encryption round-trip, the meshkit cross-compat, and the unreachable-Helia errors with a mocked
`fetch`. `scripts/e2e-helia-storage.mjs` is a headless-Chromium check against a live stack (save, reload,
open by CID, verify the stored object is ciphertext and the restored content is identical).
