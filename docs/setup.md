# Setup

How to use `socialcalc-ai` in an application, and how to run this repository locally.

## Requirements

| Requirement | Needed for |
| :--- | :--- |
| Node.js 18 or newer | Headless use (calculation, CSV/MSC transforms) and all local development |
| A bundler such as Vite, Webpack, Rollup or Next.js | Browser apps |
| React 18+, `react-dom`, `@ionic/react` 7+, `ionicons` | The React/Ionic components (optional) |
| `jspdf`, `html2canvas` | The `socialcalc-ai/pdf-export` plugin (optional) |
| Capacitor plugins | The `socialcalc-ai/share` plugin on iOS and Android (optional) |

All UI-related peer dependencies are optional, so the engine runs without them.

## Use the package in an app

```bash
npm install socialcalc-ai
```

Add the peer dependencies for the features you use:

```bash
# React / Ionic components
npm install react react-dom @ionic/react ionicons

# PDF export
npm install jspdf html2canvas

# Share, email and print on devices
npm install @capacitor/filesystem @capacitor/share capacitor-email-composer @bcyesil/capacitor-plugin-printer
```

### Entry points

| Import | Provides |
| :--- | :--- |
| `socialcalc-ai` | Engine, plugins, React/Ionic components, helpers |
| `socialcalc-ai/pdf-export` | Offline PDF export (opt-in) |
| `socialcalc-ai/share` | Save, share, email and print (opt-in) |

### Vanilla JavaScript

```html
<div id="container">
  <div id="workbookControl" style="display: none;"></div>
  <div id="tableeditor"></div>
  <div id="msg"></div>
</div>

<script type="module">
  import * as SocialCalcApp from "socialcalc-ai";

  SocialCalcApp.initializeApp("");
  SocialCalcApp.enableGridLines();
  SocialCalcApp.enableRowColHeaders();
  SocialCalcApp.enableTouchScroll();
</script>
```

### React / Ionic

Mount the same three elements, call `initializeApp` in an effect, and render the components from the package (`CellEditModal`, `HorizontalScrollBar`, `RowActionPopover`, `EditableCellsModal`). A complete example is in the [package README](../socialcalc/README.md#-quick-start-in-react--ionic).

## Install from GitHub Packages

The package is also mirrored to GitHub Packages as `@aspiringsdgs/socialcalc-ai`. GitHub's npm registry needs a token even for public packages.

1. Create a personal access token (classic) with the `read:packages` scope.
2. Add to your user `~/.npmrc`:

   ```ini
   @aspiringsdgs:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_TOKEN
   ```

3. Install and import using the scoped name:

   ```bash
   npm install @aspiringsdgs/socialcalc-ai
   ```

   ```ts
   import * as AppGeneral from "@aspiringsdgs/socialcalc-ai";
   ```

Unless you need GitHub Packages specifically, use the unscoped npm package.

## Run this repository locally

```bash
git clone https://github.com/aspiringsdgs/socialcalc-ai.git
cd socialcalc-ai
npm install
npm run dev
```

`.npmrc` sets `legacy-peer-deps=true`, so a plain `npm install` is enough.

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Starts the demo app in `src/`, which imports the package from `./socialcalc` |
| `npm run build` | Type-checks (`tsc`) and builds the demo app |
| `npm run preview` | Serves the production build |
| `npm test` | Runs Vitest in watch mode |
| `npm run test:run` | Runs Vitest once |
| `node test-socialcalc.js` | Checks that the core engine loads in Node |

### Documentation website

The site in `docs/` is a separate Vite app with its own dependencies:

```bash
cd docs
npm install
npm run dev          # http://localhost:5174
npm run build        # type-check and production build
```

Site content is in `docs/src/docsData.ts` (engine) and `docs/src/mcpDocsData.ts` (MCP server). Package versions and links shown on the site are in `docs/src/siteConfig.ts`.

### MCP server working copy

`Socialcalc-MCP/` is a self-contained package:

```bash
cd Socialcalc-MCP
npm install
npm run build
npm start
```

For normal use, install the released [`socialcalc-mcp`](https://github.com/aspiringsdgs/socialcalc-mcp) instead.

## Troubleshooting

| Symptom | Cause and fix |
| :--- | :--- |
| `ERESOLVE` or peer dependency errors on install | Use the repo's `.npmrc` (`legacy-peer-deps=true`), or run `npm install --legacy-peer-deps` |
| `Cannot find module 'jspdf'` or `'html2canvas'` | You imported `socialcalc-ai/pdf-export` without installing its optional peer dependencies |
| Share, email or print do nothing on a device | `configureShare()` must be called once with the Capacitor plugins your app installed |
| Spreadsheet area is blank | The page needs `#container`, `#workbookControl` and `#tableeditor` elements before `initializeApp` runs |
| Cell taps do nothing in React | Render `CellEditModal` and listen for the `socialcalc:cell-edit-request` window event |
| `window is not defined` in SSR | The editor needs a DOM. In Next.js, load it from a Client Component and only after mount |
| Package not found on GitHub Packages | The `@aspiringsdgs` registry line is missing from `.npmrc`, or the token lacks `read:packages` |
