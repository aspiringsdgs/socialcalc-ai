# socialcalc-ai

[![npm version](https://img.shields.io/npm/v/socialcalc-ai.svg?color=cb3837&style=flat-square)](https://www.npmjs.com/package/socialcalc-ai)
[![npm downloads](https://img.shields.io/npm/dm/socialcalc-ai.svg?style=flat-square)](https://www.npmjs.com/package/socialcalc-ai)
[![License: MIT](https://img.shields.io/github/license/aspiringsdgs/socialcalc-ai.svg?style=flat-square)](LICENSE)
[![Issues](https://img.shields.io/github/issues/aspiringsdgs/socialcalc-ai.svg?style=flat-square)](https://github.com/aspiringsdgs/socialcalc-ai/issues)

A modernised, modular **SocialCalc spreadsheet engine** for web, mobile and AI workflows: ES module exports, TypeScript definitions, touch-friendly scrolling, React/Ionic UI components, an extensible plugin system, and MultiSheet Calc (MSC) workbooks that LLMs can generate and edit.

It is derived from SocialCalc, the JavaScript spreadsheet engine Dan Bricklin wrote for Socialtext, which builds on his wikiCalc.

## Packages

| Package | npm | GitHub Packages | Source |
| :--- | :--- | :--- | :--- |
| **socialcalc-ai**: engine, plugins and React/Ionic components | [`socialcalc-ai`](https://www.npmjs.com/package/socialcalc-ai) | [`@aspiringsdgs/socialcalc-ai`](https://github.com/aspiringsdgs/socialcalc-ai/pkgs/npm/socialcalc-ai) | [`socialcalc/`](socialcalc/) |
| **socialcalc-mcp**: MCP server so AI assistants can edit workbooks | [`socialcalc-mcp`](https://www.npmjs.com/package/socialcalc-mcp) | [`@aspiringsdgs/socialcalc-mcp`](https://github.com/aspiringsdgs/socialcalc-mcp/pkgs/npm/socialcalc-mcp) | [aspiringsdgs/socialcalc-mcp](https://github.com/aspiringsdgs/socialcalc-mcp) |

This repository publishes `socialcalc-ai`. The MCP server is released from its own repository, [aspiringsdgs/socialcalc-mcp](https://github.com/aspiringsdgs/socialcalc-mcp); the [`Socialcalc-MCP/`](Socialcalc-MCP/) folder here is a working copy that is developed next to the engine and can be ahead of the released package.

## Quick start

```bash
npm install socialcalc-ai
```

```ts
import * as AppGeneral from "socialcalc-ai";

AppGeneral.initializeApp("");        // mounts into #container, #workbookControl, #tableeditor
AppGeneral.enableRowColHeaders();
AppGeneral.enableGridLines();
AppGeneral.enableTouchScroll();
```

The full API, the React/Ionic components, the plugins (PDF export, share/email/print, editable cells, AI agent) and TypeScript usage are documented in the package README: **[`socialcalc/README.md`](socialcalc/README.md)**.

## What is in this repository

| Path | Contents |
| :--- | :--- |
| [`socialcalc/`](socialcalc/) | **The published package.** Engine (`core/`), plugins (`modules/`), React/Ionic components (`components/`), utilities, typings |
| [`src/`](src/) | Demo and test workbench app that exercises the package before release |
| [`docs/`](docs/) | Markdown guides: setup, description and publish (listed below) |
| [`docs-site/`](docs-site/) | The documentation website (Vite + React) |
| [`Socialcalc-MCP/`](Socialcalc-MCP/) | Working copy of the MCP server, with sample workbooks and prompts |
| [`public/data/`](public/data/) | Sample workbooks used by the demo app |
| [`.agents/`](.agents/), [`AGENTS.md`](AGENTS.md), [`GEMINI.md`](GEMINI.md) | Rules for AI coding agents working in this repo |

The engine itself is described in [`socialcalc/core/README.md`](socialcalc/core/README.md): file map, data model, command language, formula engine and extension points.

## Develop locally

```bash
git clone https://github.com/aspiringsdgs/socialcalc-ai.git
cd socialcalc-ai
npm install
npm run dev          # demo app (Vite)
```

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Starts the demo app that consumes `./socialcalc` |
| `npm run build` | Type-checks and builds the demo app |
| `npm run test:run` | Runs the Vitest suite once |
| `node test-socialcalc.js` | Smoke-tests that the core engine loads in Node |
| `cd docs-site && npm install && npm run dev` | Runs the documentation website on port 5174 |

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

## Documentation

Guides in [`docs/`](docs/):

- [Setup](docs/setup.md): install the package, run the demo app and docs site, troubleshoot.
- [Description](docs/description.md): what the project is, its architecture, and how the pieces fit.
- [Publish](docs/publish.md): how to cut a new release to npm and GitHub Packages.

## Contributing

Open an [issue](https://github.com/aspiringsdgs/socialcalc-ai/issues) or a pull request. When you change anything in `socialcalc/`, also update `socialcalc/README.md` and `docs-site/src/docsData.ts`, and run the tests and the build; [`AGENTS.md`](AGENTS.md) has the full rules, including backward compatibility of exports.

## License

[MIT](LICENSE). SocialCalc was created by Dan Bricklin and Socialtext, Inc.
