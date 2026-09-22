export interface DocChapter {
  id: string;
  category: string;
  title: string;
  description: string;
  content: string;
  badge?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export const DOC_CATEGORIES = [
  "Getting Started",
  "Architecture",
  "Core Engine",
  "Modular Plugins",
  "React & Ionic Components",
  "Data, Export & Sharing",
  "Formulas & Calculations",
  "Agent & Developer Guide",
] as const;

export const DOCS_DATA: DocChapter[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction to SocialCalc AI",
    description: "Overview of the modernized standalone SocialCalc spreadsheet engine and its ecosystem.",
    badge: "Live on npm",
    content: `
### What is SocialCalc AI?

**SocialCalc AI** (\`socialcalc-ai\`) is an ultra-fast, zero-heavy-dependency spreadsheet engine and modular plugin suite engineered for modern **React**, **Ionic**, **Vanilla JavaScript**, and **AI-driven** applications.

Originally developed by Dan Bricklin (the co-creator of VisiCalc), SocialCalc delivers enterprise-grade cell evaluation, formula parsing, and multi-sheet calculation within a compact footprint.

#### Key Highlights:
- **Standalone npm Package**: Published as \`socialcalc-ai\` with ES6 module exports, full TypeScript typings (\`index.d.ts\`), and zero global namespace pollution.
- **Modular Plugin Architecture**: Features like Dynamic Grid Lines, Mobile Momentum Touch-Scroll, Row/Column Headers, and Cell Permissions are decoupled plugins registered via a unified \`PluginManager\`.
- **Pre-Built Ionic & React Components**: Ready-to-use modern UI modules including \`CellEditModal\`, \`HorizontalScrollBar\`, \`RowActionPopover\`, and \`EditableCellsModal\`.
- **Standard MSC JSON Support**: Natively loads, parses, and serializes multi-sheet workbooks conforming to the canonical SocialCalc MSC JSON schema, ideal for LLM spreadsheet generation pipelines.
- **Bi-directional Theme Support**: First-class support for both high-contrast Light Mode and midnight Dark Mode.

![The SocialCalc showcase app (src/) running invoice template 100001](/screenshots/live/studio-overview.png "wide")

#### What's in the package

| Area | What you get | Chapter |
| :--- | :--- | :--- |
| Engine | 109 formula functions, command language, recalc, undo, multi-sheet workbooks | [Core Engine](/socialcalc#core-engine) |
| Plugins | Headers, grid lines, touch scroll, editable cells, cell edit modal, AI agent, PDF export, share | [Plugins](/socialcalc#modular-plugins) |
| React & Ionic UI | \`CellEditModal\`, \`HorizontalScrollBar\`, \`RowActionPopover\`, \`EditableCellsModal\`, \`DemoVideosModal\`, \`AgentModal\`, \`AgentPluginTest\` | [Components](/socialcalc#react-components) |
| Data | MSC workbooks, templates with \`appMapping\`, CSV/HTML/MSC export | [MSC templates](/socialcalc#standard-msc-data) |
| Output | Offline PDF, and save/share/email/print on web, iOS and Android | [Export, share & print](/socialcalc#export-share-print) |

Want AI agents like Claude to build these workbooks for you? See the [SocialCalc MCP server](/mcp). To see finished apps built on SocialCalc, [explore Aspiring Apps](http://aspiringapps.com/web/home/index.html).
    `,
    codeSnippet: {
      language: "bash",
      code: `npm install socialcalc-ai`,
    },
  },
  {
    id: "installation",
    category: "Getting Started",
    title: "Installation & Package Setup",
    description: "Install socialcalc-ai via npm, yarn, pnpm, or bun with optional peer dependencies.",
    badge: "npm v1.0.9",
    content: `
### Installing SocialCalc AI

**socialcalc-ai** is published on the official npm registry. You can install it into any modern web or mobile project using your package manager of choice:

\`\`\`bash
# Using npm
npm install socialcalc-ai

# Using Yarn
yarn add socialcalc-ai

# Using pnpm
pnpm add socialcalc-ai

# Using Bun
bun add socialcalc-ai
\`\`\`

#### Peer Dependencies (UI Components):
If you use the built-in React & Ionic UI components (\`CellEditModal\`, \`HorizontalScrollBar\`, \`RowActionPopover\`, \`EditableCellsModal\`), ensure peer dependencies are installed in your host app:

\`\`\`bash
npm install react react-dom @ionic/react ionicons
\`\`\`

> 💡 **Headless / Vanilla JS**: Peer dependencies are completely optional if you are consuming the core spreadsheet calculation engine or plugins in pure JavaScript, Node.js, or non-React web apps.

#### Optional plugins
The PDF export and share plugins are separate entry points, so their dependencies are only needed if you import them:

\`\`\`bash
# socialcalc-ai/pdf-export
npm install jspdf html2canvas

# socialcalc-ai/share on iOS / Android (nothing needed on the web)
npm install @capacitor/filesystem @capacitor/share capacitor-email-composer @bcyesil/capacitor-plugin-printer
\`\`\`

#### Links
- npm: [npmjs.com/package/socialcalc-ai](https://www.npmjs.com/package/socialcalc-ai)
- Source: [github.com/its-me-ani/Socialcalc-AI-JS-Framework](https://github.com/its-me-ani/Socialcalc-AI-JS-Framework)
    `,
    codeSnippet: {
      language: "bash",
      code: `# Install the published npm package
npm install socialcalc-ai

# Optional: React & Ionic peer dependencies for UI controls
npm install react react-dom @ionic/react ionicons`,
    },
  },
  {
    id: "quick-start",
    category: "Getting Started",
    title: "Quick Start Guide",
    description: "How to initialize and render SocialCalc in your React or Ionic application in minutes.",
    content: `
### Initializing SocialCalc in a React Application

SocialCalc can be mounted into any HTML container element (\`div\`) with just a few lines of code.

#### Initialization Steps:
1. Install the package via \`npm install socialcalc-ai\`.
2. Render the four mount targets the engine looks for: \`#container\`, \`#workbookControl\`, \`#tableeditor\` and \`#msg\`.
3. Call \`initializeApp()\` with a workbook (an MSC JSON string) or \`""\` for an empty one.
4. Enable the plugins you want: headers, grid lines, touch scroll, the cell edit modal.
5. Listen for \`socialcalc:*\` window events to open your own UI (see [Events](/socialcalc#events)).

The example below is a trimmed version of the showcase app in \`src/App.tsx\`, which renders like this:

![The same setup running in the showcase app on a phone-sized screen](/screenshots/live/studio-mobile.png "compact")
    `,
    codeSnippet: {
      language: "tsx",
      code: `import React, { useEffect, useState } from "react";
import * as SC from "socialcalc-ai";
import { CellEditModal, HorizontalScrollBar } from "socialcalc-ai";
import template from "./data/100001.json"; // { msc, appMapping, footers }

export const SpreadsheetView: React.FC = () => {
  const [cellData, setCellData] = useState<any>(null);

  useEffect(() => {
    // 1. Mount the engine with a workbook
    SC.initializeApp(JSON.stringify(template.msc));
    SC.setAppMapping(template.appMapping);

    // 2. Plugins (after the grid has rendered)
    setTimeout(() => {
      SC.enableRowColHeaders();
      SC.initGridLines();
      SC.initTouchScroll();
      SC.enableCellEditModal();   // cell taps fire socialcalc:cell-edit-request
      SC.setupMouseListener();
    }, 200);

    // 3. Open the edit modal when a cell is tapped
    const onEdit = (e: any) => setCellData(e.detail);
    window.addEventListener("socialcalc:cell-edit-request", onEdit);
    return () => window.removeEventListener("socialcalc:cell-edit-request", onEdit);
  }, []);

  return (
    <>
      <div id="container">
        <div id="workbookControl" />
        <div id="tableeditor" />
        <div id="msg" />
      </div>
      <HorizontalScrollBar />
      <CellEditModal
        isOpen={!!cellData}
        cellData={cellData}
        onClose={() => { cellData?.cleanup?.(); setCellData(null); }}
      />
    </>
  );
};`,
    },
  },
  {
    id: "architecture-overview",
    category: "Architecture",
    title: "Architectural Overview & Decoupling",
    description: "Understanding the layered architecture separating engine core, plugins, and UI components.",
    badge: "Architecture",
    content: `
### Layered Architecture

To guarantee strict stability across diverse host applications, the codebase is structured into four distinct, isolated layers:

\`\`\`
socialcalc/
├── core/                  # Layer 1: Low-level Engine & Calculation
├── modules/               # Layer 2: Modular Vanilla JS Plugins
├── components/            # Layer 3: React & Ionic Interactive Controls
└── utils/                 # Layer 4: Framework-agnostic Utilities
\`\`\`

#### Layer 1: Core Engine (\`socialcalc/core/\`)
- **Zero Framework Coupling**: Strictly pure JavaScript (UMD compatible). No React, No Ionic, No browser-specific assumptions where possible.
- **Responsibilities**: AST parsing, formula tokenizer, dependency graph tracking, cell value formatting, sheet serialization.

#### Layer 2: Modular Plugins (\`socialcalc/modules/\`)
- **Feature Isolation**: Each plugin (\`grid-lines\`, \`touch-scroll\`, \`row-col-headers\`, \`editable-cells\`) is isolated in its own file.
- **Unified Lifecycle**: Standardized \`enable()\`, \`disable()\`, \`toggle()\`, \`isEnabled()\` signatures registered via \`PluginManager\`.

#### Layer 3: UI Components (\`socialcalc/components/\`)
- **React & Ionic**: Rich mobile and desktop interactive interfaces (\`CellEditModal\`, \`HorizontalScrollBar\`, \`RowActionPopover\`).
- **Event-Driven Communication**: Decoupled from the engine via custom window events.

#### Layer 4: Utilities (\`socialcalc/utils/\`)
- Framework-agnostic utilities such as client-side image compression and script loading.
    `,
    codeSnippet: {
      language: "javascript",
      code: `// The engine never imports React. When a cell is tapped, the listeners
// module dispatches a window event, and your UI decides what to show.
window.addEventListener("socialcalc:cell-edit-request", (e) => {
  const { coord, text, okfn, cleanup } = e.detail;
  // coord: "C5", text: current cell text
  // okfn(newValue) commits the edit; cleanup() restores the grid if cancelled
  setCellData(e.detail);
});`,
    },
  },
  {
    id: "events",
    category: "Architecture",
    title: "Events",
    description: "The window events the engine and plugins fire, and what each one carries.",
    content: `
The engine talks to your UI through \`CustomEvent\`s on \`window\`, named \`socialcalc:<name>\`. Any framework can listen, and the engine never needs to know about your components.

| Event | \`event.detail\` | Fired when |
| :--- | :--- | :--- |
| \`socialcalc:cell-edit-request\` | \`{ coord, text, okfn, cleanup }\` | A cell is tapped with the Cell Edit Modal plugin on |
| \`socialcalc:row-header-click\` | \`{ rowNum, clientX, clientY }\` | A row number is clicked |
| \`socialcalc:cell-change\` | \`{ coord, value, range, sheetId, kind, cmdstr, changes, source }\` | A cell edit is committed |
| \`socialcalc:horizontal-scroll\` | \`{ currentFirstCol, currentLastCol, currentColName, lastColName, totalCols }\` | The first visible column changes |
| \`socialcalc:plugin-change\` | \`{ plugin, enabled }\` | A plugin is registered, enabled or disabled |
| \`socialcalc:agent-action\` | \`{ actions, commands, results, timestamp }\` | The AI agent applies actions |

For cell changes you can also use \`setupCellChangeListener(fn)\`, which returns an unsubscribe function.
    `,
    codeSnippet: {
      language: "typescript",
      code: `import * as SC from "socialcalc-ai";

const stop = SC.setupCellChangeListener((coord) => console.log("changed", coord));

window.addEventListener("socialcalc:agent-action", (e: any) => {
  console.log(\`Agent ran \${e.detail.commands.length} commands\`);
});`,
    },
  },
  {
    id: "core-engine",
    category: "Core Engine",
    title: "Core Calculation Engine & AST",
    description: "Deep dive into cell evaluation, formula parsing, dependency graphs, and AST evaluation.",
    content: `
### Engine Execution Flow

Every change to a sheet is a text command (for example \`set A1 value n 100\`), which is what makes undo, audit trails and AI-generated edits possible. Formulas are tokenized, converted to Reverse Polish Notation and evaluated on an operand stack. Recalculation follows cell dependencies and runs in time slices so large sheets don't block the UI.

#### Key Engine Files (\`socialcalc/core/\`):
1. \`sheet.js\`: Data model (\`Cell\`, \`Sheet\`), save format (\`ParseSheetSave\`, \`CreateSheetSave\`), the command language (\`ExecuteSheetCommand\`), recalc, undo and clipboard.
2. \`render.js\`: \`RenderContext\` (HTML table rendering), coordinate helpers, value display and CSV/HTML conversion.
3. \`formula.js\` and \`formula-functions.js\`: Formula tokenizer and evaluator, and the 109 built-in functions.
4. \`format-number.js\`: Excel-style number, currency, percentage and date format strings.
5. \`table-editor.js\`, \`editor-widgets.js\` and \`touch.js\`: The interactive grid: cursor, selection, input box, scrollbars, drag handles, keyboard and touch.
6. \`spreadsheet-control.js\` and \`workbook.js\`: The full spreadsheet UI and multi-sheet workbooks.
7. \`constants.js\`, \`popup.js\` and \`environment.js\`: Strings and defaults, popup widgets, and app overrides and shims (loaded last).

The full engine reference is in \`socialcalc/core/README.md\`.

#### Multi-Sheet Save Format (MSC):
\`SocialCalc.WorkBookControlSaveSheet()\` returns, and \`SocialCalc.WorkBookControlLoad()\` accepts, a JSON workbook whose sheets each hold a SocialCalc save string:
\`\`\`
{
  "numsheets": 2,
  "currentid": "sheet1",
  "currentname": "Invoice",
  "sheetArr": {
    "sheet1": { "sheetstr": { "savestr": "..." }, "name": "Invoice", "hidden": "0" },
    "sheet2": { "sheetstr": { "savestr": "..." }, "name": "Items", "hidden": "0" }
  }
}
\`\`\`
    `,
    codeSnippet: {
      language: "javascript",
      code: `import { SocialCalc } from "socialcalc-ai";

// Build a sheet with the command language
const sheet = new SocialCalc.Sheet();
SocialCalc.ExecuteSheetCommand(sheet, "set A1 value n 100", false);
SocialCalc.ExecuteSheetCommand(sheet, "set A2 value n 250", false);
SocialCalc.ExecuteSheetCommand(sheet, "set A3 formula SUM(A1:A2)", false);

// Recalc is asynchronous: wait for the "calcfinished" status
sheet.statuscallback = (data, status) => {
  if (status === "calcfinished") {
    console.log("Calculated A3:", sheet.cells.A3.datavalue); // Output: 350
  }
};
SocialCalc.RecalcSheet(sheet);`,
    },
  },
  {
    id: "modular-plugins",
    category: "Modular Plugins",
    title: "Modular Plugins Suite",
    description: "Switch spreadsheet features on and off at runtime, and register your own plugins.",
    badge: "Extensible",
    content: `
### Modular Plugins Architecture

Each feature lives in its own module under \`socialcalc/modules/\` and follows the same pattern: \`enableX()\`, \`disableX()\`, \`toggleX()\` and \`isXEnabled()\`. None of them touch the calculation engine, so you can turn them on and off at any time.

#### Plugins

| Plugin | Functions | What it does |
| :--- | :--- | :--- |
| **Row/Col Headers** | \`enableRowColHeaders\`, \`toggleRowColHeaders\` | 123 / ABCD headers, column resize handles, row click events |
| **Grid Lines** | \`initGridLines\`, \`enableGridLines\`, \`toggleGridLines\` | Cell borders across the grid |
| **Touch Scroll** | \`initTouchScroll\`, \`enableTouchScroll\`, \`configureTouchScroll\` | Momentum scrolling for iOS and Android web views |
| **Horizontal Scroll** | \`scrollHorizontalBy\`, \`scrollToColumn\`, \`subscribeHorizontalScroll\` | Column-by-column navigation, used by \`HorizontalScrollBar\` |
| **Cell Edit Modal** | \`enableCellEditModal\`, \`toggleCellEditModal\` | Routes cell taps to \`socialcalc:cell-edit-request\` instead of the inline editor |
| **Editable Cells** | \`enableEditableCellsOnly\`, \`setAppMapping\`, \`isCellEditable\` | Locks every cell except the ones mapped in \`appMapping\` |
| **AI Agent** | \`enableAgent\`, \`toggleAgent\`, \`executeAgentActions\` | Lets an LLM read the sheet and apply edits (see [AI Agent Plugin](/socialcalc#ai-agent-plugin)) |
| **PDF Export** | \`socialcalc-ai/pdf-export\` | Offline PDF export (see [Export, share & print](/socialcalc#export-share-print)) |
| **Share** | \`socialcalc-ai/share\` | Save, share, email and print per platform |

Supporting modules: \`formatting.js\` (colors, fonts, borders), \`history.js\` (\`undo\`, \`redo\`), \`listeners.js\` (mouse and cell change listeners), \`sheets.js\` and \`exporters.js\`.

#### Plugins on and off
![Headers and grid lines on: 123 / ABCD headers and cell borders](/screenshots/live/studio-overview.png "wide")

![The same sheet after toggleRowColHeaders() and toggleGridLines()](/screenshots/live/plugins-off.png "wide")

#### Column resizing
![Drag handle with a live column width indicator](/screenshots/col-resize-picker.png)

### Plugin Manager
Plugins that register with the Plugin Manager can be controlled by name: \`enablePlugin\`, \`disablePlugin\`, \`togglePlugin\`, \`configurePlugin\`, \`isPluginEnabled\` and \`getPlugin\`. The built-in names are \`rowColHeaders\`, \`gridLines\`, \`horizontalScroll\`, \`cellEditModal\`, \`editableCellsOnly\`, \`agent\`, \`pdfExport\` and \`share\`. Every change fires \`socialcalc:plugin-change\`.

To add your own, register an object with \`enable\`, \`disable\` and optionally \`isEnabled\`, \`configure\` and \`metadata\`. See \`AGENTS.md\` for the full checklist when adding a plugin to the package itself.
    `,
    codeSnippet: {
      language: "javascript",
      code: `import * as SC from "socialcalc-ai";

// Built-in plugins
SC.enableGridLines();
SC.isGridLinesEnabled();          // true
const on = SC.toggleRowColHeaders(); // returns the new state
SC.configureTouchScroll({ momentumFriction: 0.94, velocityMultiplier: 1.2 });

// Your own plugin
SC.registerPlugin("auditLog", {
  metadata: { displayName: "Audit log", description: "Sends cell changes to a server" },
  enable: () => window.addEventListener("socialcalc:cell-change", send),
  disable: () => window.removeEventListener("socialcalc:cell-change", send),
});
SC.enablePlugin("auditLog");

// Everything that is registered
SC.getRegisteredPlugins();
// [{ name: "gridLines", enabled: true, metadata: {...} }, ...]

const stop = SC.subscribePluginChanges((name, enabled) => console.log(name, enabled));`,
    },
  },
  {
    id: "ai-agent-plugin",
    category: "Modular Plugins",
    title: "AI Agent Plugin",
    description: "Give an LLM the sheet's context and tool schemas, then apply the edits it returns in one atomic step.",
    badge: "AI Powered",
    content: `
### How it works

The agent plugin (\`modules/agent.js\`) sits between an LLM and the spreadsheet. It has no React or Ionic code, so it works in the browser and can also prepare context for a backend.

1. **Context**: \`getAgentContext()\` describes the active sheet: used range, non-empty cells, and the template's \`appMapping\` fields (for example \`BillTo.Name\` → \`C5\`, \`Items\` → rows 21–33). With no mapping, the agent works with plain coordinates.
2. **Tools and prompt**: \`getAgentToolDefinitions({ format })\` returns tool schemas for Gemini (\`"gemini"\`) or OpenAI-style function calling, and \`generateAgentSystemPrompt()\` writes a matching system prompt.
3. **Apply**: \`executeAgentResponse(llmResponse)\` parses the model's function calls or JSON, and \`executeAgentActions(actions)\` runs a list of actions. Each batch becomes one SocialCalc command, so a single undo reverts it.

#### Actions

| Action | Fields | Example |
| :--- | :--- | :--- |
| \`SET_CELL\` | \`coord\` (or \`field\`), \`value\`, optional \`type\` | \`{ "action": "SET_CELL", "coord": "F21", "value": 500, "type": "number" }\` |
| \`SET_CELLS\` | \`updates\`: a list of SET_CELL items | Several cells at once |
| \`CLEAR_CELL\` / \`CLEAR_CELLS\` | \`coord\` / \`coords\` | \`{ "action": "CLEAR_CELLS", "coords": ["C21", "F21"] }\` |
| \`SET_MAPPING_FIELD\` | \`field\`, \`value\` | \`{ "action": "SET_MAPPING_FIELD", "field": "BillTo.Name", "value": "Acme" }\` |
| \`APPLY_MAPPING_DATA\` | \`data\`: an object keyed by mapping field | Fill a whole form at once |
| \`RAW_COMMAND\` | \`command\`: a SocialCalc command string | \`{ "action": "RAW_COMMAND", "command": "set F34 formula SUM(F21:F33)" }\` |

Custom actions: \`registerAgentActionHandler("HIGHLIGHT", (action, { sc, context, commands }) => …)\` adds a new action type. Push SocialCalc command strings onto \`commands\` and they run in the same batch.

After every run, the plugin fires \`socialcalc:agent-action\` with \`{ actions, commands, results, timestamp }\`.

### In the showcase app
The Agent Workbench (\`AgentModal\`) wraps all of this. Below, three quick actions filled the template's header fields, added three line items and set the total formula:

![Agent Workbench: prompt box, quick actions and a custom JSON action array](/screenshots/live/agent-workbench.png "wide")

![Result: the invoice template filled by the agent](/screenshots/live/agent-filled-invoice.png "compact")

![Console tab: the SocialCalc commands each action produced](/screenshots/live/agent-console-live.png "wide")

![Sheet Context tab: 127 editable targets and 10 template fields passed to the model](/screenshots/live/agent-context.png "wide")

![LLM Schemas tab: Gemini, OpenAI and system prompt output, ready to copy](/screenshots/live/agent-schemas.png "wide")
    `,
    codeSnippet: {
      language: "typescript",
      code: `import {
  getAgentContext,
  getAgentToolDefinitions,
  generateAgentSystemPrompt,
  executeAgentResponse,
  exportAgentContext,
  executeAgentActions,
} from "socialcalc-ai";

// A. Call the model from the browser (Gemini shown)
const tools = getAgentToolDefinitions({ format: "gemini" });
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Fill the invoice for Acme Corp with 2 consulting items",
  config: { systemInstruction: generateAgentSystemPrompt(), tools: [tools] },
});
const result = executeAgentResponse(response);
console.log(result.count, "actions applied");

// B. Or send the context to your backend and apply what it returns
const res = await fetch("/api/agent/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Set the total formula", context: exportAgentContext() }),
});
const { actions } = await res.json();
executeAgentActions(actions);`,
    },
  },
  {
    id: "react-components",
    category: "React & Ionic Components",
    title: "React & Ionic Components",
    description: "Props and usage for the seven UI components that ship with socialcalc-ai.",
    badge: "UI Suite",
    content: `
All components are exported from \`socialcalc-ai\` and need the React and Ionic peer dependencies. They don't hold spreadsheet state themselves: the engine fires window events, and you pass the event detail in as props.

### CellEditModal
A touch-first editor that opens when a cell is tapped (with the Cell Edit Modal plugin on). It edits text, numbers and formulas, and its **Options** panel sets text color, background color, number format and borders, and inserts a compressed image.

| Prop | Type | Description |
| :--- | :--- | :--- |
| \`isOpen\` | \`boolean\` | Shows the modal |
| \`cellData\` | \`{ coord, text, okfn, cleanup? }\` or \`null\` | The \`detail\` of \`socialcalc:cell-edit-request\` |
| \`onClose\` | \`() => void\` | Called on cancel or after apply. Call \`cellData.cleanup()\` here |
| \`title\` | \`string\` | Optional heading (default \`Edit Cell\`) |

![CellEditModal on cell C5](/screenshots/live/cell-edit.png "compact")

![Options panel: text color, background, format, borders and image](/screenshots/live/cell-edit-options.png "compact")

![Font colors](/screenshots/edit-cell-modal-text-color.png)

![Background colors](/screenshots/edit-cell-modal-background-color.png)

![Border controls](/screenshots/edit-cell-model-cell-borders.png)

The color palettes are exported as \`FONT_COLORS\` and \`BG_COLORS\` if you want to reuse them.

### HorizontalScrollBar
A column slider with step buttons and a \`Col A (1/26)\` indicator. It stays in sync with keyboard and touch scrolling.

| Prop | Type | Description |
| :--- | :--- | :--- |
| \`step\` | \`number\` | Columns per arrow click (default \`1\`) |
| \`className\` | \`string\` | Extra CSS class |
| \`onColumnChange\` | \`({ firstCol, colName, totalCols }) => void\` | Called when the first visible column changes |

### RowActionPopover
A menu for inserting and deleting rows, opened from \`socialcalc:row-header-click\`.

| Prop | Type | Description |
| :--- | :--- | :--- |
| \`isOpen\` | \`boolean\` | Shows the menu |
| \`rowNum\` | \`number\` or \`null\` | Row that was clicked |
| \`position\` | \`{ x, y }\` or \`null\` | Screen position, from the event's \`clientX\`/\`clientY\` |
| \`onClose\` | \`() => void\` | Dismiss |
| \`onInsertAbove\`, \`onInsertBelow\`, \`onDeleteRow\` | \`(rowNum) => void\` | Run the change with \`executeSheetCommand\`, e.g. the command \`insertrow A6\` |

![RowActionPopover on row 6](/screenshots/live/row-popover.png "compact")

### EditableCellsModal
Lists every mapped field of a template per sheet, with toggles to make each one editable or locked, search, and **Add cell**.

| Prop | Type | Description |
| :--- | :--- | :--- |
| \`isOpen\`, \`onClose\` | | Visibility |
| \`appMapping\` | \`object\` | The template's mapping (see [MSC templates](/socialcalc#standard-msc-data)) |
| \`currentSheet\` | \`string\` | Sheet id, default \`sheet1\` |
| \`onUpdateAppMapping\` | \`(mapping) => void\` | Receives the edited mapping. Pass it to \`setAppMapping\` |
| \`isStandalone\` | \`boolean\` | Render without the Ionic modal wrapper |

![EditableCellsModal listing the invoice template's fields](/screenshots/live/cell-mappings.png "compact")

### DemoVideosModal
A help modal with short how-to videos and a formula cheat sheet (\`FORMULA_GUIDES\`). Pass \`videos\` as \`[{ id, title, description, videoSrc }]\` to use your own clips.

### AgentModal
The AI Agent Workbench: a copilot prompt, one-click quick actions, a custom JSON action runner, the sheet context, LLM schemas and a live console. See the [AI Agent Plugin](/socialcalc#ai-agent-plugin) for screenshots.

| Prop | Type | Description |
| :--- | :--- | :--- |
| \`isOpen\`, \`onClose\` | | Visibility |
| \`appMapping\`, \`currentSheet\` | | Template mapping and sheet to work on |
| \`onExecute\` | \`(result) => void\` | Called after actions run; \`result.count\` is the number applied |
| \`apiEndpoint\` | \`string\` | Backend endpoint the copilot prompt is sent to |
| \`enabledTabs\` | \`("actions" or "context" or "schemas" or "console")[]\` | Which tabs to show; \`defaultTab\` picks the first one open |
| \`hideTabHeaders\` | \`boolean\` | Hide the tab bar (a plain chat view) |
| \`showPluginTest\` | \`boolean\` | Show the quick actions and JSON runner (default \`true\`) |
| \`suggestions\` | \`"generic"\`, \`"invoice"\`, or \`[{ label, prompt }]\` | Prompt chips above the input; \`suggestionsTitle\` labels them |
| \`theme\` | preset name or config object | \`default\`, \`dark\`, \`midnight\`, \`light\`, \`emerald\`, \`purple\`, \`slate\` and more, or \`{ mode, primaryColor, headerBackground, … }\` |
| \`title\`, \`headerIcon\`, \`headerColor\`, \`versionTag\` | | Header branding |
| \`promptPlaceholder\` | \`string\` | Placeholder for the prompt box |

### AgentPluginTest
The quick actions and JSON runner from \`AgentModal\` as a standalone component (also exported as \`Agentplugintest\`). Props: \`currentSheet\`, \`appMapping\`, \`onExecute\`, \`onLog\`, \`showCustomJson\`, \`title\`, \`subtitle\`, \`className\`, \`style\`.
    `,
    codeSnippet: {
      language: "tsx",
      code: `import { useEffect, useState } from "react";
import * as SC from "socialcalc-ai";
import { CellEditModal, RowActionPopover, AgentModal } from "socialcalc-ai";

export function EditorOverlays({ appMapping }: { appMapping: any }) {
  const [cellData, setCellData] = useState<any>(null);
  const [row, setRow] = useState<{ rowNum: number; position: { x: number; y: number } } | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);

  useEffect(() => {
    const onEdit = (e: any) => setCellData(e.detail);
    const onRow = (e: any) =>
      setRow({ rowNum: e.detail.rowNum, position: { x: e.detail.clientX, y: e.detail.clientY } });
    window.addEventListener("socialcalc:cell-edit-request", onEdit);
    window.addEventListener("socialcalc:row-header-click", onRow);
    return () => {
      window.removeEventListener("socialcalc:cell-edit-request", onEdit);
      window.removeEventListener("socialcalc:row-header-click", onRow);
    };
  }, []);

  return (
    <>
      <CellEditModal
        isOpen={!!cellData}
        cellData={cellData}
        onClose={() => { cellData?.cleanup?.(); setCellData(null); }}
      />
      <RowActionPopover
        isOpen={!!row}
        rowNum={row?.rowNum ?? null}
        position={row?.position ?? null}
        onClose={() => setRow(null)}
        onInsertAbove={(r) => SC.executeSheetCommand(\`insertrow A\${r}\`)}
        onInsertBelow={(r) => SC.executeSheetCommand(\`insertrow A\${r + 1}\`)}
        onDeleteRow={(r) => SC.executeSheetCommand(\`deleterow A\${r}\`)}
      />
      <button onClick={() => setAgentOpen(true)}>AI Agent</button>
      <AgentModal
        isOpen={agentOpen}
        onClose={() => setAgentOpen(false)}
        appMapping={appMapping}
        currentSheet="sheet1"
        suggestions="invoice"
        theme="default"
      />
    </>
  );
}`,
    },
  },
  {
    id: "standard-msc-data",
    category: "Data, Export & Sharing",
    title: "MSC Workbooks & Templates",
    description: "The multi-sheet workbook format, and the template file that adds sheet tabs and editable-field mappings.",
    content: `
### The workbook (MSC)
A SocialCalc workbook is a JSON object with one entry per sheet. Each sheet holds a SocialCalc save string: cell values, formulas, formats and layout. This is what \`initializeApp()\` and \`loadWorkbookData()\` accept, what \`getSpreadsheetContent()\` returns, and what the [MCP server](/mcp) reads and writes.

\`\`\`json
{
  "numsheets": 4,
  "currentid": "sheet1",
  "currentname": "sheet1",
  "sheetArr": {
    "sheet1": {
      "sheetstr": { "savestr": "version:1.5\\ncell:C2:t:INVOICE:f:2\\n..." },
      "name": "sheet1",
      "hidden": "0"
    }
  }
}
\`\`\`

![The serialized workbook, from the showcase app's View Save Data button](/screenshots/live/msc-save-data.png "compact")

### The template file
Templates such as \`src/data/100001.json\` wrap the workbook with what an app needs around it:

\`\`\`json
{
  "mainSheet": "sheet1",
  "msc": { "numsheets": 4, "currentid": "sheet1", "sheetArr": { "...": "..." } },
  "footers": [
    { "name": "Invoice 1", "index": 1, "isActive": true },
    { "name": "Invoice 2", "index": 2, "isActive": false }
  ],
  "appMapping": {
    "sheet1": {
      "Date": { "type": "text", "cell": "E18", "editable": true },
      "BillTo": {
        "type": "form",
        "editable": true,
        "formContent": {
          "Name":    { "type": "text", "cell": "C5", "editable": true },
          "Address": { "type": "text", "cell": "C6", "editable": true }
        }
      },
      "Items": {
        "type": "table",
        "editable": true,
        "unitname": "Item",
        "rows": { "start": 21, "end": 33 },
        "col": {
          "Description": { "name": "Description", "type": "text", "cell": "C", "editable": true },
          "Amount":      { "name": "Amount",      "type": "text", "cell": "F", "editable": true }
        }
      }
    }
  }
}
\`\`\`

| Key | Purpose |
| :--- | :--- |
| \`msc\` | The workbook above |
| \`footers\` | Sheet tabs to show; switch with \`activateFooterButton(index)\` |
| \`appMapping\` | Named fields per sheet. \`text\` maps one cell, \`form\` groups fields, \`table\` maps columns over a row range |

\`appMapping\` powers three things: the Editable Cells plugin (only mapped cells can be edited when it's on), \`EditableCellsModal\`, and the AI agent, which can write to \`BillTo.Name\` instead of guessing \`C5\`.
    `,
    codeSnippet: {
      language: "javascript",
      code: `import * as SC from "socialcalc-ai";
import template from "./data/100001.json";

// Load a template
SC.loadWorkbookData(template.msc);
SC.setAppMapping(template.appMapping);
SC.activateFooterButton(1);

// Lock everything except mapped fields
SC.enableEditableCellsOnly();

// Read the workbook back (e.g. to save it)
const saved = SC.getSpreadsheetContent();`,
    },
  },
  {
    id: "sheets-exporters",
    category: "Data, Export & Sharing",
    title: "Sheets, CSV & File Export",
    description: "Work with multiple sheets and export to CSV, HTML and MSC files from the main entry point.",
    content: `
These functions are in the main \`socialcalc-ai\` entry and need no extra dependencies.

#### Sheets
| Function | Description |
| :--- | :--- |
| \`activateFooterButton(index)\` | Switch to a sheet by its 1-based tab index |
| \`getAllSheetsData()\` | Every sheet's id, name and rendered HTML (used by PDF export) |
| \`executeSheetCommand(cmd)\` | Run a SocialCalc command on the active sheet, e.g. \`set A1 text t hello\` |
| \`undo()\`, \`redo()\` | Command history |

#### Content
| Function | Returns |
| :--- | :--- |
| \`getSpreadsheetContent()\` | The workbook as a string (save format) |
| \`getCSVContent()\` | The active sheet as CSV |
| \`getCurrentHTMLContent()\` | The active sheet as an HTML table |

#### Files
| Function | Description |
| :--- | :--- |
| \`exportCurrentSheetAsCSV({ filename, returnBlob })\` | CSV with a UTF-8 BOM so Excel reads it correctly |
| \`exportMSC({ filename, extension, includeAppMapping })\` | \`.msc\` workbook, or a \`.json\` template with \`{ msc, appMapping }\` |
| \`parseMSCFile(text)\` | Reads either form back: \`{ msc, appMapping }\` |
| \`cleanCSV(csv)\`, \`convertToCSV(rows)\` | CSV helpers |
| \`downloadBlob(blob, name)\`, \`blobToBase64(blob)\` | Save a file, or get base64 for Capacitor \`Filesystem.writeFile\` |
    `,
    codeSnippet: {
      language: "javascript",
      code: `import * as SC from "socialcalc-ai";

await SC.exportCurrentSheetAsCSV({ filename: "invoice" });          // downloads invoice.csv
const csvBlob = await SC.exportCurrentSheetAsCSV({ returnBlob: true });

await SC.exportMSC({ extension: "json", includeAppMapping: true });  // template file

// Import a file the user picked
const { msc, appMapping } = SC.parseMSCFile(await file.text());
SC.loadWorkbookData(msc);
if (appMapping) SC.setAppMapping(appMapping);`,
    },
  },
  {
    id: "export-share-print",
    category: "Data, Export & Sharing",
    title: "PDF Export, Share, Email & Print",
    description: "Two opt-in plugins: offline PDF generation, and platform-aware save, share, email and print.",
    badge: "Opt-in",
    content: `
### Offline PDF export (\`socialcalc-ai/pdf-export\`)
Makes PDFs on the device with jsPDF and html2canvas, with no server, so it works offline and in Capacitor apps. Pages break between rows, charts in the live editor are included, and each page gets a header, footer and \`Page X of Y\`.

\`\`\`bash
npm install jspdf html2canvas
\`\`\`

| Option | Default | Description |
| :--- | :--- | :--- |
| \`filename\` | \`document\` / \`all_sheets\` | Without \`.pdf\` |
| \`format\` | \`a4\` | \`a4\`, \`letter\` or \`legal\` |
| \`orientation\` | \`portrait\` | or \`landscape\` |
| \`margin\` | \`10\` | Millimetres |
| \`quality\` | \`4\` (one sheet), \`2\` (all) | html2canvas scale |
| \`headerText\` | \`null\` | \`null\` prints the date and time; \`""\` hides it |
| \`footerText\` | \`""\` | Bottom-left on every page |
| \`showPageNumbers\` | \`true\` | |
| \`returnBlob\` | \`false\` | Return a Blob instead of downloading |
| \`onProgress\` | none | Progress messages |

### Share, email & print (\`socialcalc-ai/share\`)
Picks the right method for the platform. On iOS and Android, pass in the Capacitor plugins your app already has with \`configureShare()\`; on the web nothing is needed.

| | Save / share | Email | Print |
| :--- | :--- | :--- | :--- |
| **iOS** | Share sheet | Share sheet with PDF | AirPrint |
| **Android** | Share sheet | Email composer with HTML | Print service |
| **Web** | Download / Web Share | Web Share, else \`mailto:\` + download | Browser print dialog |

Every call resolves to \`{ method, platform }\` so you can show the right message.

![Export, Share & Print panel in the showcase app (src/ExportSharePanel.tsx)](/screenshots/live/export-share.png "compact")
    `,
    codeSnippet: {
      language: "typescript",
      code: `import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { EmailComposer } from "capacitor-email-composer";
import { Printer } from "@bcyesil/capacitor-plugin-printer";
import { configurePdfExport, exportCurrentSheetAsPDF, exportWorkbookAsPDF } from "socialcalc-ai/pdf-export";
import { configureShare, saveFile, emailCurrentSheet, printCurrentSheet } from "socialcalc-ai/share";

configurePdfExport({ footerText: "Invoice", format: "a4" });
configureShare({ Filesystem, Directory, Encoding, Share, EmailComposer, Printer });

// Download (web) or share sheet (iOS/Android)
const pdf = await exportCurrentSheetAsPDF({ returnBlob: true });
await saveFile({ blob: pdf, filename: "INV-001.pdf" });

await exportWorkbookAsPDF({ filename: "all_invoices" });
await emailCurrentSheet({ filename: "INV-001", subject: "Your invoice" });
const { method, platform } = await printCurrentSheet({ name: "INV-001" });`,
    },
  },
  {
    id: "formulas-reference",
    category: "Formulas & Calculations",
    title: "Formulas & Functions",
    description: "All 109 built-in functions, operators, and the number, date and time formats.",
    badge: "109 functions",
    content: `
### Writing formulas
Formulas start with \`=\` and use the usual operators: \`+ - * / ^\`, comparisons \`= <> < > <= >=\`, and \`&\` to join text. Refer to other sheets without quotes: \`=sheet2!B5\`, \`=SUM(items!F2:F40)\`.

### Functions
This is the complete list registered in \`core/formula-functions.js\`.

| Category | Functions |
| :--- | :--- |
| Math & trig (27) | ABS, ACOS, ASIN, ATAN, ATAN2, COS, DEGREES, EVEN, EXP, FACT, INT, LN, LOG, LOG10, MOD, ODD, PI, POWER, PRODUCT, RADIANS, ROUND, SIN, SQRT, SUM, SUMIF, TAN, TRUNC |
| Statistical (11) | AVERAGE, COUNT, COUNTA, COUNTBLANK, COUNTIF, MAX, MIN, STDEV, STDEVP, VAR, VARP |
| Logical & information (16) | AND, OR, NOT, IF, TRUE, FALSE, ISBLANK, ISERR, ISERROR, ISLOGICAL, ISNA, ISNONTEXT, ISNUMBER, ISTEXT, N, NA |
| Text (15) | EXACT, FIND, LEFT, LEN, LOWER, MID, PROPER, REPLACE, REPT, RIGHT, SUBSTITUTE, T, TRIM, UPPER, VALUE |
| Date & time (11) | DATE, DAY, HOUR, MINUTE, MONTH, NOW, SECOND, TIME, TODAY, WEEKDAY, YEAR |
| Lookup & reference (7) | CHOOSE, COLUMNS, HLOOKUP, INDEX, MATCH, ROWS, VLOOKUP |
| Financial (10) | DDB, FV, IRR, NPER, NPV, PMT, PV, RATE, SLN, SYD |
| Database (12) | DAVERAGE, DCOUNT, DCOUNTA, DGET, DMAX, DMIN, DPRODUCT, DSTDEV, DSTDEVP, DSUM, DVAR, DVARP |

> Not available: \`CONCATENATE\`, \`TEXT\`, \`ROUNDUP\` and \`ROUNDDOWN\`. Use \`&\` to join text, and a cell format to control how a number is displayed.

### Number, date & time formats
Formats are Excel-style strings, set with the Cell Edit Modal, \`formatCurrentCell\`, or a \`format\` command.

| Format | Example output |
| :--- | :--- |
| \`#,##0.00\` | 12,345.60 |
| \`$#,##0.00\` | $12,345.60 |
| \`0.0%\` | 15.0% |
| \`yyyy-mm-dd\` | 2026-09-22 |
| \`h:mm AM/PM\` | 3:45 PM |

![Number formats](/screenshots/cell-format-numbers.png)

![Currency formats](/screenshots/cell-format-currency.png)

![Percentage formats](/screenshots/cell-format-percent.png)

![Date formats](/screenshots/cell-format-date.png)

![Time formats](/screenshots/cell-format-time.png)
    `,
    codeSnippet: {
      language: "excel",
      code: `=IF(F34 > 1000, F34 * 0.9, F34)
="Total: " & F34
=ROUND(PMT(0.05/12, 60, -25000), 2)
=IF(ISBLANK(C5), "Pending", "Completed")
=VLOOKUP(B2, rates!A2:C50, 3, FALSE)
=SUMIF(items!C2:C40, "Consulting", items!F2:F40)`,
    },
  },
  {
    id: "developer-agent-guide",
    category: "Agent & Developer Guide",
    title: "AI Agent & Contributor Workflow",
    description: "Strict development guidelines, zero-regression mandates, and documentation sync requirements.",
    badge: "Mandatory",
    content: `
### Developer & Coding Agent Guidelines

When modifying or improving any code in \`./socialcalc\`:

#### 1. Golden Rules
1. **Strict Backward Compatibility**: Never remove or rename existing exported functions. Always provide backwards-compatible aliases.
2. **Decoupled Architecture**: Keep \`core/\` and \`modules/\` completely free of React and Ionic dependencies.
3. **Event-Driven Integration**: Use custom window events for host application communication.

#### 2. Mandatory Documentation Synchronization Rule
> **CRITICAL RULE**: Whenever you edit, enhance, or fix anything in \`./socialcalc\` (new plugins, updated props, modified APIs, new formulas), you **MUST synchronously update the documentation**:
> - Update \`socialcalc/README.md\` in the package root.
> - Update \`docs/src/docsData.ts\` so this documentation website displays the new feature, props, and examples.
> - Never leave code changes undocumented.

#### 3. Verification Commands
Before completing any modification, always execute and pass:
\`\`\`bash
npm test -- --run        # Vitest unit test suite
npm run build            # TypeScript compilation & Vite bundle validation
node test-socialcalc.js  # Modularization integrity check
\`\`\`

### Showcase app & screenshots
\`src/\` is a test app that uses every feature of the package through the \`socialcalc\` alias (see \`vite.config.ts\`). Run it with \`npm run dev\` from the repo root and open http://localhost:5173. The toolbar opens every modal, and the pills toggle each plugin.

The screenshots in these docs (\`docs/public/screenshots/live/\`) are captured from that app with Playwright. After changing the UI, regenerate them:

\`\`\`bash
npm run dev                                  # repo root: start the showcase app
cd docs
npx playwright install chromium              # first time only
npm run screenshots                          # all shots
npm run screenshots -- agent                 # one shot: studio-overview, agent, cell-edit, ...
\`\`\`

### This documentation site
The site is in \`docs/\`. Content lives in data files, one per package:

| File | Route |
| :--- | :--- |
| \`docs/src/docsData.ts\` | \`/socialcalc\` (this page) |
| \`docs/src/mcpDocsData.ts\` | \`/mcp\` |
| \`docs/src/siteConfig.ts\` | Package versions, links and the dashboard video |
    `,
    codeSnippet: {
      language: "bash",
      code: `# Verify all tests and builds in ES6socialcalc-MVP-ionic-suite
npm test -- --run
npm run build
node test-socialcalc.js

# Verify documentation website build
cd docs
npm run build

# Preview the docs site
npm run dev   # http://localhost:5174`,
    },
  },
];
