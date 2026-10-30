# SocialCalc documentation website

The documentation site for [`socialcalc-ai`](https://www.npmjs.com/package/socialcalc-ai) and [`socialcalc-mcp`](https://www.npmjs.com/package/socialcalc-mcp). It is a small, static React single-page app built with Vite and TypeScript.

The Markdown guides about the repository itself (setup, description, publishing) are in [`../docs/`](../docs/). This folder is only the website.

## Pages

| Route | Content | Data file |
| :--- | :--- | :--- |
| `/` | Dashboard: intro video, package cards with versions and install commands | `src/siteConfig.ts` |
| `/socialcalc` | Documentation for the `socialcalc-ai` engine, plugins and components | `src/docsData.ts` |
| `/mcp` | Documentation for the `socialcalc-mcp` server and its tools | `src/mcpDocsData.ts` |

A chapter is addressed by the URL hash, for example `/mcp#tools-editing`. Unknown paths fall back to `/`.

## Run locally

```bash
cd docs-site
npm install
npm run dev          # http://localhost:5174
```

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Dev server with hot reload on port 5174 |
| `npm run build` | Type-checks (`tsc -b`) and builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs Oxlint (`.oxlintrc.json`) |
| `npm run screenshots` | Re-captures the screenshots from the showcase app, see [Screenshots](#screenshots) |

## Folder layout

```
docs-site/
├── index.html
├── public/
│   ├── socialcalc-intro.mp4       dashboard intro video
│   └── screenshots/live/          screenshots used in the chapters
├── scripts/
│   └── capture-screenshots.mjs    Playwright script that produces them
└── src/
    ├── main.tsx, App.tsx, router.tsx
    ├── siteConfig.ts              package versions, links, hero video
    ├── docsData.ts                chapters for /socialcalc
    ├── mcpDocsData.ts             chapters for /mcp
    ├── pages/                     Dashboard.tsx, DocsPage.tsx
    └── components/                Markdown, CodeBlock, HeroVideo, icons
```

The router is a minimal History API router in `src/router.tsx`. There is no routing library.

## Editing the content

Content lives in the data files as plain objects, so adding or changing documentation does not need any component changes.

### Chapters

Each chapter has this shape (`DocChapter` in `src/docsData.ts`):

| Field | Required | Meaning |
| :--- | :--- | :--- |
| `id` | yes | URL hash and unique key, for example `"quick-start"` |
| `category` | yes | Must be one of the category names exported next to the data (`DOC_CATEGORIES`, `MCP_DOC_CATEGORIES`). The sidebar groups by this list, so a chapter with any other category is not shown |
| `title` | yes | Chapter heading and sidebar label |
| `description` | yes | One-line summary shown under the title and in search |
| `content` | yes | Body, in the Markdown subset below |
| `badge` | no | Small label next to the title, such as `"Live on npm"` |
| `codeSnippet` | no | `{ language, code }`, shown in the side code panel |

Chapters appear in array order, which also sets the previous and next links. Search matches the title, category, description, content and code snippet.

To add a chapter, append an object to `DOCS_DATA` or `MCP_DOCS_DATA`. To add a category, add its name to the matching categories array first.

### Markdown subset

Bodies are rendered by `src/components/Markdown.tsx`, which supports only:

- `###` and `####` headings, paragraphs
- `-` lists and `1.` lists, `>` quotes
- `| tables |`
- fenced code blocks
- images: `![caption](/screenshots/live/name.png "wide")` where the optional title is `wide`, `compact` or `small`
- inline `code`, `**bold**` and `[links](url)`

Links starting with `/` navigate inside the app (for example `[Core Engine](/socialcalc#core-engine)`). Other links open in a new tab.

Bodies are TypeScript template literals, so escape backticks as `` \` `` and `${` as `\${`.

### Versions, links and video

Edit `src/siteConfig.ts`:

| Export | Purpose |
| :--- | :--- |
| `PACKAGES` | Package name, version, npm and GitHub links, install command. Update the versions after each release |
| `ASPIRING_APPS` | Links to Aspiring Apps and the hosted MCP endpoint |
| `HERO_VIDEO` | Dashboard video. A YouTube link is embedded, any other URL or a file under `public/` plays in a `<video>`, an empty `src` shows a placeholder |

## Screenshots

The images in `public/screenshots/live/` are captured from the showcase app in the repository root (`../src`) with Playwright.

```bash
# 1. In the repository root, start the showcase app (http://localhost:5173)
npm run dev

# 2. In docs-site/, capture everything, or one shot by name
npx playwright install chromium     # first time only
npm run screenshots
npm run screenshots -- agent
```

| Variable | Purpose |
| :--- | :--- |
| `SHOWCASE_URL` | Capture from another address instead of `http://localhost:5173/` |
| `CHROMIUM_PATH` | Use an installed browser instead of downloading Chromium |

Regenerate the screenshots after you change the showcase UI, then commit the updated images.

## Build and deploy

`npm run build` writes a static site to `dist/`. Any static host works, with one requirement: because the router uses real paths (`/mcp`, `/socialcalc`), the host must serve `index.html` for unknown paths, otherwise opening `/mcp` directly returns 404.

The site is built with the default Vite `base` of `/`. If you host it under a sub-path, set `base` in `vite.config.ts` and update the absolute `/screenshots/...` and `/socialcalc-intro.mp4` references.

## Keeping it in sync

- `docsData.ts` documents the package in `../socialcalc`. When you change that package, update `../socialcalc/README.md` and this site together, as required by [`../AGENTS.md`](../AGENTS.md).
- `mcpDocsData.ts` documents the MCP server. Tool names and parameters must match `listTools()` in the server source, which is the source of truth.
- After publishing a new package version, update `PACKAGES` in `siteConfig.ts`. [`../docs/publish.md`](../docs/publish.md) lists this as a release step.
