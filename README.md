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

### Tests

`npm run test:run` runs the adapter unit tests. `scripts/e2e-tornado-storage.mjs` is a real-UI
Playwright script (Playwright is not a dependency of this repo; prerequisites are in the file header).

## Documentation

Guides in [`docs/`](docs/):

- [Setup](docs/setup.md): install the package, run the demo app and docs site, troubleshoot.
- [Description](docs/description.md): what the project is, its architecture, and how the pieces fit.
- [Publish](docs/publish.md): how to cut a new release to npm and GitHub Packages.

## Contributing

Open an [issue](https://github.com/aspiringsdgs/socialcalc-ai/issues) or a pull request. When you change anything in `socialcalc/`, also update `socialcalc/README.md` and `docs-site/src/docsData.ts`, and run the tests and the build; [`AGENTS.md`](AGENTS.md) has the full rules, including backward compatibility of exports.

## License

[MIT](LICENSE). SocialCalc was created by Dan Bricklin and Socialtext, Inc.
