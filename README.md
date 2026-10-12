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
| [`docs/`](docs/) | The documentation website (Vite + React) and the Markdown guides listed below |
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
| `cd docs && npm install && npm run dev` | Runs the documentation website on port 5174 |

## Documentation

Guides in [`docs/`](docs/):

- [Setup](docs/setup.md): install the package, run the demo app and docs site, troubleshoot.
- [Description](docs/description.md): what the project is, its architecture, and how the pieces fit.
- [Publish](docs/publish.md): how to cut a new release to npm and GitHub Packages.

## Contributing

Open an [issue](https://github.com/aspiringsdgs/socialcalc-ai/issues) or a pull request. When you change anything in `socialcalc/`, also update `socialcalc/README.md` and `docs/src/docsData.ts`, and run the tests and the build; [`AGENTS.md`](AGENTS.md) has the full rules, including backward compatibility of exports.

## License

[MIT](LICENSE). SocialCalc was created by Dan Bricklin and Socialtext, Inc.
