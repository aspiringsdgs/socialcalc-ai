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
  "Standard MSC Data",
  "Formulas & Calculations",
  "Agent & Developer Guide",
] as const;

export const DOCS_DATA: DocChapter[] = [
  {
    id: "introduction",
    category: "Getting Started",
    title: "Introduction to SocialCalc Modernized",
    description: "Overview of the modernized standalone SocialCalc spreadsheet engine and its ecosystem.",
    badge: "v2.0",
    content: `
### What is SocialCalc Modernized?

**SocialCalc Modernized** is an ultra-fast, zero-heavy-dependency spreadsheet engine and modular plugin suite engineered for modern **React**, **Ionic**, and **Vanilla JavaScript** applications.

Originally developed by Dan Bricklin (the co-creator of VisiCalc), SocialCalc delivers enterprise-grade cell evaluation, formula parsing, and multi-sheet calculation within a compact footprint.

#### Key Highlights:
- **Standalone Package Architecture**: The engine lives in an independent \`./socialcalc\` package consumed by web apps, hybrid mobile apps (iOS & Android), and backend services without tight coupling.
- **Modular Plugin Architecture**: Features like Dynamic Grid Lines, Mobile Momentum Touch-Scroll, Row/Column Headers, and Cell Permissions are decoupled plugins registered via a unified \`PluginManager\`.
- **Pre-Built Ionic & React Components**: Ready-to-use modern UI modules including \`CellEditModal\`, \`HorizontalScrollBar\`, \`RowActionPopover\`, and \`EditableCellsModal\`.
- **Standard MSC JSON Support**: Natively loads, parses, and serializes multi-sheet workbooks conforming to the canonical SocialCalc MSC JSON schema.
- **Bi-directional Theme Support**: First-class support for both high-contrast Light Mode and midnight Dark Mode.
    `,
    codeSnippet: {
      language: "bash",
      code: `# Quick Installation & Verification in your application
npm install socialcalc

# Run tests and bundle verification
npm test -- --run
npm run build
node test-socialcalc.js`,
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
1. Create a container element with an explicit ID in your component JSX.
2. Initialize the workbook using \`SocialCalc.InitializeSpreadsheetControl(containerId)\`.
3. Load workbook data using standard MSC JSON or raw SocialCalc save strings.
4. Enable desired plugins such as grid lines, touch scroll, and header controls.
    `,
    codeSnippet: {
      language: "tsx",
      code: `import React, { useEffect, useRef } from "react";
import * as AppGeneral from "socialcalc";
import template100001 from "./data/100001.json";

export const SpreadsheetView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initialize DOM editor
    const spreadsheet = AppGeneral.InitializeSpreadsheetControl("tableeditor");

    // 2. Load standard MSC template data
    if (template100001.msc) {
      AppGeneral.loadWorkbookData(template100001.msc);
    }

    // 3. Enable standard plugins
    AppGeneral.enableGridLines();
    AppGeneral.enableRowColHeaders();
    AppGeneral.enableTouchScroll();
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div id="tableeditor" ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
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
      code: `// Decoupled communication example: Engine dispatches event, React UI listens
// 1. Engine / TableEditor dispatches edit request
window.dispatchEvent(new CustomEvent("socialcalc:cell-edit-request", {
  detail: {
    cellCoord: "B12",
    cellValue: "$450.00",
    cellFormula: "=SUM(B2:B11)",
    cellFormat: "$#,##0.00"
  }
}));

// 2. React UI shell catches the event and opens the modal
window.addEventListener("socialcalc:cell-edit-request", (e) => {
  setEditingCell(e.detail);
  setModalOpen(true);
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

SocialCalc uses a compiled Abstract Syntax Tree (AST) architecture for rapid formula recalculation.

#### Key Engine Files:
1. \`core.js\`: Core data model. Defines \`Sheet\`, \`Cell\`, \`CellCache\`, and parsing functions (\`ParseSheetSave\`, \`CreateSheetSave\`).
2. \`formula.js\`: Mathematical, logical, string, financial, and lookup formula handlers.
3. \`format-number.js\`: Formats numbers into currency, percentages, scientific notation, and dates based on Excel format strings.
4. \`spreadsheet-control.js\`: Coordinates panes, table editors, scroll events, and sheet switching.
5. \`table-editor.js\`: Renders the virtualized DOM table, cursor highlighting, selection boxes, and drag handles.

#### Multi-Sheet Save Format (MSC):
A SocialCalc Multi-Sheet Calc (MSC) file or string encapsulates multiple sheets delimited by:
\`\`\`
version:1.5
name:Sheet1
[Sheet1 save content]
name:Sheet2
[Sheet2 save content]
\`\`\`
    `,
    codeSnippet: {
      language: "javascript",
      code: `import { SocialCalc } from "socialcalc/core/index.js";

// Evaluate a formula expression programmatically
const sheet = new SocialCalc.Sheet();
sheet.cells["A1"] = { datatype: "v", datavalue: 100 };
sheet.cells["A2"] = { datatype: "v", datavalue: 250 };
sheet.cells["A3"] = { datatype: "f", formula: "SUM(A1:A2)" };

// Recalculate sheet
sheet.RecalcSheet();
console.log("Calculated A3:", sheet.cells["A3"].datavalue); // Output: 350`,
    },
  },
  {
    id: "modular-plugins",
    category: "Modular Plugins",
    title: "Modular Plugins Suite",
    description: "Detailed documentation for all modular plugins and how to register custom extensions.",
    badge: "Extensible",
    content: `
### Modular Plugins Architecture

Plugins can be enabled, disabled, or toggled on demand without altering core spreadsheet calculation code.

#### Included Plugins:

| Plugin Name | File | Description |
| :--- | :--- | :--- |
| **Grid Lines** | \`modules/grid-lines.js\` | Toggles cell borders across all data panes. Supports customized border styling. |
| **Row/Col Headers** | \`modules/row-col-headers.js\` | ABCD column and 123 row headers with resize handles and row click events. |
| **Touch Scroll** | \`modules/touch-scroll.js\` | Momentum-based touch scrolling tailored for iOS and Android web views. |
| **Horizontal Scroll** | \`modules/horizontal-scroll.js\` | Viewport offset calculation and horizontal scroll synchronization. |
| **Editable Cells** | \`modules/editable-cells.js\` | Template permission system restricting cell edits to designated ranges. |
| **Listeners** | \`modules/listeners.js\` | Normalized cross-browser mouse and pointer interaction listeners. |
| **Formatting** | \`modules/formatting.js\` | Text color, background color, font family, font size, and border styling. |
| **History** | \`modules/history.js\` | Complete multi-step Undo and Redo command history stack. |
    `,
    codeSnippet: {
      language: "javascript",
      code: `import * as AppGeneral from "socialcalc";

// Controlling plugins programmatically:
AppGeneral.enableGridLines();
console.log("Grid lines active?", AppGeneral.isGridLinesEnabled()); // true

// Toggle mobile touch momentum scroll
AppGeneral.toggleTouchScroll(true);

// Toggle row and column headers
AppGeneral.toggleRowColHeaders();

// Inspect all registered plugins
const plugins = AppGeneral.PluginManager.getAllPlugins();
console.log("Registered plugins:", Object.keys(plugins));`,
    },
  },
  {
    id: "react-components",
    category: "React & Ionic Components",
    title: "Interactive React & Ionic Components",
    description: "Comprehensive API reference for pre-built React & Ionic UI components.",
    badge: "UI Suite",
    content: `
### Built-in UI Components

SocialCalc provides modern, touch-optimized UI components for hybrid apps and web dashboards.

#### 1. \`<CellEditModal />\`
A responsive bottom sheet and modal for editing cell contents, styles, formulas, and attachments.
- **Props**:
  - \`isOpen: boolean\` - Controls visibility.
  - \`cellCoord: string\` - Coordinates of the active cell (e.g. \`"B5"\`).
  - \`currentValue: string\` - Raw or formatted cell value.
  - \`formula?: string\` - Cell formula expression.
  - \`onSave: (payload) => void\` - Callback upon commit.
  - \`onClose: () => void\` - Dismiss callback.

#### 2. \`<HorizontalScrollBar />\`
A smooth, custom horizontal track slider for wide spreadsheets.
- **Props**:
  - \`currentCol: number\` - Active column index.
  - \`totalCols: number\` - Total columns in sheet.
  - \`onScroll: (newCol: number) => void\` - Scroll change callback.

#### 3. \`<RowActionPopover />\`
Context menu triggered when tapping or clicking row headers:
- Insert Row Above / Below
- Delete Selected Row
- Clear Row Contents

#### 4. \`<EditableCellsModal />\`
Template permission editor for configuring which cells end-users are allowed to modify.
    `,
    codeSnippet: {
      language: "tsx",
      code: `import React, { useState } from "react";
import { CellEditModal, HorizontalScrollBar, RowActionPopover } from "socialcalc";

export const EditorOverlay: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState("A1");

  return (
    <>
      <CellEditModal
        isOpen={modalOpen}
        cellCoord={activeCell}
        currentValue="Sample Text"
        onSave={(updated) => {
          console.log("Cell saved:", updated);
          setModalOpen(false);
        }}
        onClose={() => setModalOpen(false)}
      />

      <HorizontalScrollBar
        currentCol={1}
        totalCols={26}
        onScroll={(col) => console.log("Scrolled to column:", col)}
      />
    </>
  );
};`,
    },
  },
  {
    id: "standard-msc-data",
    category: "Standard MSC Data",
    title: "Standard MSC JSON Template Schema",
    description: "Specification for multi-sheet JSON templates, footers, appMapping, and sheet definitions.",
    content: `
### Standard MSC JSON Structure

The standard MSC JSON format allows entire multi-sheet workbooks, styling, formulas, sheet footers, and permissions to be persisted in a single JSON document.

#### Template Schema:
\`\`\`json
{
  "name": "Invoice 100001",
  "msc": "version:1.5\\nsheet:c:26:r:50:h:12.75\\ncell:A1:t:INVOICE:f:1...",
  "footers": [
    { "name": "Invoice 1", "index": 1, "isActive": true },
    { "name": "Invoice 2", "index": 2, "isActive": false },
    { "name": "Invoice 3", "index": 3, "isActive": false },
    { "name": "Invoice 4", "index": 4, "isActive": false }
  ],
  "appMapping": {
    "A1": { "editable": false, "label": "Title" },
    "B5": { "editable": true, "label": "Client Name" },
    "E20": { "editable": false, "label": "Total Amount", "formula": "=SUM(E5:E19)" }
  }
}
\`\`\`

#### Field Definitions:
- **\`name\`** (\`string\`): Human-readable title of the workbook or template.
- **\`msc\`** (\`string\`): Serialized SocialCalc Multi-Sheet Calc string containing sheet definitions and cell data.
- **\`footers\`** (\`Array\`): List of sheet tabs shown in the bottom bar with index and active status.
- **\`appMapping\`** (\`Record<string, CellMeta>\`): Permission and metadata map defining lock states and input constraints.
    `,
    codeSnippet: {
      language: "javascript",
      code: `import * as AppGeneral from "socialcalc";
import templateData from "./public/data/100001.json";

// Loading standard MSC JSON into the active editor:
export function loadTemplate(jsonTemplate) {
  // 1. Pass MSC string or unwrapped object to core loader
  AppGeneral.loadWorkbookData(jsonTemplate.msc || jsonTemplate);

  // 2. Configure editable permissions mapping
  if (jsonTemplate.appMapping) {
    AppGeneral.setAppMapping(jsonTemplate.appMapping);
  }

  // 3. Render sheet footers / tabs
  const activeFooter = jsonTemplate.footers?.find(f => f.isActive) || jsonTemplate.footers?.[0];
  if (activeFooter) {
    AppGeneral.activateFooterButton(activeFooter.index);
  }
}`,
    },
  },
  {
    id: "formulas-reference",
    category: "Formulas & Calculations",
    title: "Formulas & Calculation Functions",
    description: "Complete mathematical, statistical, logical, and string formulas supported by the engine.",
    badge: "Formulas",
    content: `
### Supported Formulas & Functions

SocialCalc provides over 80 built-in spreadsheet calculation functions.

#### 1. Mathematical & Arithmetic
- \`SUM(range...)\`: Calculates sum of values in range.
- \`AVERAGE(range...)\`: Arithmetic mean of numeric cells.
- \`MIN(range...)\` / \`MAX(range...)\`: Minimum and maximum values.
- \`ROUND(val, digits)\`: Rounds value to specified decimal places.
- \`ROUNDUP(val, digits)\` / \`ROUNDDOWN(val, digits)\`: Directional rounding.
- \`ABS(val)\`, \`MOD(n, d)\`, \`POWER(base, exp)\`, \`SQRT(val)\`.

#### 2. Logical
- \`IF(condition, true_val, false_val)\`: Conditional branch.
- \`AND(cond1, cond2...)\` / \`OR(cond1, cond2...)\`: Logical conjunction / disjunction.
- \`NOT(condition)\`: Boolean negation.
- \`ISBLANK(cell)\`, \`ISNUMBER(cell)\`, \`ISTEXT(cell)\`.

#### 3. String Manipulation
- \`CONCATENATE(str1, str2...)\`: Joins text values.
- \`LEFT(str, len)\` / \`RIGHT(str, len)\` / \`MID(str, start, len)\`: Substring extraction.
- \`UPPER(str)\` / \`LOWER(str)\` / \`PROPER(str)\`: Case conversion.
- \`TRIM(str)\`: Strips excess whitespace.

#### 4. Financial
- \`PMT(rate, nper, pv, [fv], [type])\`: Loan payment calculation.
- \`PV(rate, nper, pmt, [fv], [type])\`: Present value.
- \`FV(rate, nper, pmt, [pv], [type])\`: Future value.
- \`NPV(rate, val1, val2...)\`: Net present value.
    `,
    codeSnippet: {
      language: "excel",
      code: `=IF(E20 > 1000, E20 * 0.9, E20)
=CONCATENATE("Total: $", TEXT(SUM(B2:B20), "#,##0.00"))
=ROUND(PMT(0.05/12, 60, -25000), 2)
=IF(ISBLANK(C5), "Pending", "Completed")`,
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
    `,
    codeSnippet: {
      language: "bash",
      code: `# Verify all tests and builds in ES6socialcalc-MVP-ionic-suite
npm test -- --run
npm run build
node test-socialcalc.js

# Verify documentation website build
cd docs
npm run build`,
    },
  },
];
