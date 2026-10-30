# Description

What `socialcalc-ai` is, how the repository is organised, and how the engine, plugins and UI fit together.

## What it is

`socialcalc-ai` is a modernised build of **SocialCalc**, the JavaScript spreadsheet engine Dan Bricklin wrote for Socialtext (built on his wikiCalc). It keeps the proven calculation engine and save format, and adds:

- ES module exports and bundled TypeScript definitions in place of a single global script
- Touch and mobile behaviour: momentum scrolling, row and column headers with resize handles
- React and Ionic UI components for cell editing, row actions and navigation
- A plugin system so features can be switched on and off at runtime
- Offline PDF export, and save, share, email and print flows for web, iOS and Android
- MultiSheet Calc (MSC) workbooks as JSON, which LLMs can generate and edit

| Item | Value |
| :--- | :--- |
| npm package | [`socialcalc-ai`](https://www.npmjs.com/package/socialcalc-ai) |
| GitHub Packages | `@aspiringsdgs/socialcalc-ai` |
| License | MIT |
| Language | JavaScript engine with `.d.ts` typings, TypeScript/React components |
| Companion | [`socialcalc-mcp`](https://github.com/aspiringsdgs/socialcalc-mcp), an MCP server that edits the same workbooks |

## Repository layout

```
socialcalc-ai/
├── socialcalc/        the published package
│   ├── core/          engine: model, formulas, rendering, table editor, workbook
│   ├── modules/       plugins and feature modules
│   ├── components/    React / Ionic UI components
│   ├── utils/         image compression, script loader
│   ├── index.js       public entry (re-exports the above)
│   ├── pdf-export.js  opt-in entry: PDF export
│   └── share.js       opt-in entry: save, share, email, print
├── src/               demo and test app that consumes ./socialcalc
├── docs/              Markdown guides: setup, description, publish
├── docs-site/         documentation website (Vite + React)
├── Socialcalc-MCP/    working copy of the MCP server
└── public/data/       sample workbooks
```

`socialcalc/` is a standalone package. The demo app imports from it exactly as a consumer would, and nothing in `socialcalc/` may depend on the demo app.

## Architecture

```
          host app (React / Ionic / vanilla)
                 │   window events  ▲
                 ▼                  │
        components/  ◀──────  modules/ (plugins)
                                  │
                                  ▼
                              core/  (engine)
```

| Layer | Responsibility | Rules |
| :--- | :--- | :--- |
| `core/` | Cell and sheet model, command language, recalculation, formula parser and 100+ functions, number formats, rendering, grid editor, spreadsheet control, multi-sheet workbooks | No React or Ionic. Plain JavaScript that extends one shared `SocialCalc` object. Runs headless in Node apart from the editor UI |
| `modules/` | Independent features built on the core: grid lines, headers, touch scroll, editable cells, history, exporters, formatting, AI agent, plugin manager | Vanilla JavaScript that works in any DOM environment. Registered through the plugin manager |
| `components/` | React and Ionic UI: cell editor sheet, horizontal scrollbar, row popover, editable-cells manager, demo videos, agent modal | Props are optional with sensible defaults. CSS classes are scoped |
| `utils/` | Framework-agnostic helpers | |

The engine is documented in depth in [`socialcalc/core/README.md`](../socialcalc/core/README.md): file map, data model, save format, command language, formula engine and known gotchas.

### Plugin system

Features are plugins registered with the plugin manager (`modules/plugin-manager.js`). Each one exposes `enable`, `disable`, `toggle` and `isEnabled`, and can be controlled by name:

```ts
import { enablePlugin, disablePlugin, getPlugin } from "socialcalc-ai";

disablePlugin("pdfExport");
enablePlugin("pdfExport", { footerText: "Invoice" });
```

The opt-in entries `socialcalc-ai/pdf-export` and `socialcalc-ai/share` register themselves (as `"pdfExport"` and `"share"`) when imported, and keep their heavy dependencies out of apps that do not use them.

### Events

The engine never holds application state. It talks to the UI through `window` events:

| Event | Meaning |
| :--- | :--- |
| `socialcalc:cell-edit-request` | A cell should be edited; open `CellEditModal` |
| `socialcalc:row-header-click` | A row header was clicked; open `RowActionPopover` |
| `socialcalc:cell-change` | A cell value changed |
| `socialcalc:horizontal-scroll` | The viewport scrolled horizontally |
| `socialcalc:plugin-change` | A plugin was enabled or disabled |

## Workbook data

Workbooks are SocialCalc MSC documents: JSON with named sheets whose `content` is the SocialCalc sheet save format.

```json
{
  "sheets": {
    "Summary": {
      "content": "cell:A1:t:Quarterly Revenue\ncell:A3:t:Q1\ncell:B3:v:12500\ncell:B5:v#:=SUM(B3:B4)"
    }
  }
}
```

Load one with `loadWorkbookData(...)`. Sample workbooks are in `public/data/`. Exporters in `modules/exporters.js` produce CSV, HTML and MSC.

## AI integration

There are two routes:

1. **In the app.** The AI agent plugin (`modules/agent.js`) extracts the sheet context, builds tool schemas and prompts for Gemini or OpenAI-style models, and applies the model's actions (`SET_CELL`, `SET_CELLS`, `CLEAR_CELL` and others) to the open sheet. The host app makes the model call, from the client or through its own backend.
2. **On files.** The [`socialcalc-mcp`](https://github.com/aspiringsdgs/socialcalc-mcp) server exposes workbook inspection, editing and styling as MCP tools, so assistants such as Claude, Cursor or Windsurf can build and modify the same MSC files.

## How the parts are released

| Artifact | Source | Released from |
| :--- | :--- | :--- |
| `socialcalc-ai` (npm and GitHub Packages) | `socialcalc/` | This repository, see [publish.md](publish.md) |
| `socialcalc-mcp` | `Socialcalc-MCP/` copy here, standalone repository | [aspiringsdgs/socialcalc-mcp](https://github.com/aspiringsdgs/socialcalc-mcp) |
| Documentation website | `docs-site/` | Built from this repository |

## Engineering rules

[`AGENTS.md`](../AGENTS.md) holds the working rules for this repo. In short:

- Exports from `socialcalc/index.js` and `socialcalc/core/index.js` are a public contract: add, do not rename or remove.
- Never recreate `src/socialcalc`. Features belong in `socialcalc/`.
- Any change to `socialcalc/` needs the tests, the build, and updates to `socialcalc/README.md` and `docs-site/src/docsData.ts`.
