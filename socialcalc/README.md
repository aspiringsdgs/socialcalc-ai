# socialcalc-ai

[![npm version](https://img.shields.io/npm/v/socialcalc-ai.svg?color=cb3837&style=flat-square)](https://www.npmjs.com/package/socialcalc-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Module: ESM](https://img.shields.io/badge/Module-ESM-success.svg?style=flat-square)](https://nodejs.org/api/esm.html)

> **A modernized, modularized, high-performance spreadsheet engine with ES6 module exports, React/Ionic UI components, AI template capabilities, and an extensible plugin system.**

Derived from Dan Bricklin's proven, industrial-strength **SocialCalc** engine, `socialcalc-ai` has been re-architected for modern web, mobile, and AI-driven applications. It replaces legacy global variables with clean ES modules, provides full TypeScript definitions, adds smooth mobile touch physics, and includes a full suite of modern React/Ionic UI controls.

---

## 📑 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start in React / Ionic](#-quick-start-in-react--ionic)
- [Quick Start in Vanilla JavaScript](#-quick-start-in-vanilla-javascript)
- [Architecture Overview](#-architecture-overview)
- [UI Components](#-ui-components)
  - [CellEditModal](#1-celleditmodal)
  - [HorizontalScrollBar](#2-horizontalscrollbar)
  - [RowActionPopover](#3-rowactionpopover)
  - [EditableCellsModal](#4-editablecellsmodal)
  - [DemoVideosModal](#5-demovideosmodal)
- [Plugins & Modules API](#-plugins--modules-api)
  - [Row & Column Headers](#1-row--column-headers-modulesrow-col-headersjs)
  - [Grid Lines](#2-grid-lines-modulesgrid-linesjs)
  - [Smooth Touch Scroll](#3-smooth-touch-scroll-modulestouch-scrolljs)
  - [Horizontal Scroll](#4-horizontal-scroll-moduleshorizontal-scrolljs)
  - [Editable Cells & Template Locks](#5-editable-cells--template-locks-moduleseditable-cellsjs)
  - [Plugin Manager](#6-plugin-manager-modulesplugin-managerjs)
  - [History & Undo/Redo](#7-history-undo--redo-moduleshistoryjs)
  - [Exporters & Sheets](#8-exporters--sheets-modulesexportersjs-modulessheetsjs)
  - [Invoice Utilities](#9-invoice-utilities-modulesinvoicejs)
- [Event-Driven Architecture](#-event-driven-architecture)
- [AI & MultiSheet Calc (MSC) Integration](#-ai--multisheet-calc-msc-integration)
- [TypeScript Support](#-typescript-support)
- [Browser & Framework Compatibility](#-browser--framework-compatibility)
- [License & Acknowledgments](#-license--acknowledgments)

---

## ✨ Features

- **⚡ Modern ES6 Architecture**: Pure ES module exports replacing legacy global namespace pollution. Works with Vite, Next.js, Webpack, Rollup, and ES2020+ runtimes.
- **📱 Touch & Mobile Optimized**: Smooth momentum physics and inertia swipe scrolling without screen jumping or layout stutter.
- **🎨 Modern React & Ionic UI Suite**:
  - Full-featured **CellEditModal** (Formulas, rich formatting, custom color palettes, borders, and compressed image inserts).
  - Smooth **HorizontalScrollBar** with live column indicators and drag navigation.
  - Interactive **RowActionPopover** for dynamic row insertion and deletion.
  - **EditableCellsModal** to inspect and manage cell locks.
  - **DemoVideosModal** with an interactive formula cheat sheet.
- **🔌 Pluggable Architecture**: Dynamically enable, disable, or configure spreadsheet subsystems (headers, gridlines, momentum scroll, locks).
- **📐 Universal Calculation Engine**: Industrial-grade formula AST evaluator supporting standard math, statistics, string, logic, and financial functions.
- **🤖 AI-Ready MultiSheet Calc (MSC)**: Serialize and deserialize full spreadsheet workbooks as structured JSON or MSC strings, ideal for LLM spreadsheet generation pipelines.
- **🛡 Full TypeScript Definitions**: First-class `index.d.ts` definitions included out of the box.

---

## 📦 Installation

Install `socialcalc-ai` via npm:

```bash
npm install socialcalc-ai
```

Or using Yarn / pnpm:

```bash
# Using Yarn
yarn add socialcalc-ai

# Using pnpm
pnpm add socialcalc-ai
```

### Peer Dependencies

If you plan to use the pre-built React / Ionic components (`CellEditModal`, `HorizontalScrollBar`, etc.), ensure the peer dependencies are installed:

```bash
npm install react react-dom @ionic/react ionicons
```

*(Note: Peer dependencies are optional if you only consume the core calculation engine in headless Node.js or Vanilla JS environments).*

---

## 🚀 Quick Start in React / Ionic

Below is a complete, minimal working example showing how to mount the spreadsheet engine and hook up the interactive React UI suite:

```tsx
import React, { useEffect, useState } from "react";
import * as AppGeneral from "socialcalc-ai";
import {
  CellEditModal,
  HorizontalScrollBar,
  RowActionPopover,
  EditableCellsModal,
} from "socialcalc-ai";

// Optional: Ionic base styles if using Ionic framework
import "@ionic/react/css/core.css";

export const SpreadsheetEditor: React.FC = () => {
  const [cellEditData, setCellEditData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rowPopoverEvent, setRowPopoverEvent] = useState<{ event: any; rowNum: number } | null>(null);

  useEffect(() => {
    // 1. Initialize SocialCalc DOM container with initial data (or empty string)
    const initialMSC = ""; 
    AppGeneral.initializeApp(initialMSC);

    // 2. Activate desired plugins
    AppGeneral.enableRowColHeaders(); // 1, 2, 3... & A, B, C... headers with resize handles
    AppGeneral.enableGridLines();      // Modern cell border grid
    AppGeneral.enableTouchScroll();    // Smooth mobile inertia scroll

    // 3. Listen for Cell Edit Modal requests
    const handleCellEdit = (e: any) => {
      setCellEditData(e.detail);
      setShowEditModal(true);
    };

    // 4. Listen for Row Header clicks (context actions)
    const handleRowClick = (e: any) => {
      setRowPopoverEvent({
        event: e.detail.originalEvent || e.detail,
        rowNum: e.detail.rowNum,
      });
    };

    window.addEventListener("socialcalc:cell-edit-request", handleCellEdit);
    window.addEventListener("socialcalc:row-header-click", handleRowClick);

    return () => {
      window.removeEventListener("socialcalc:cell-edit-request", handleCellEdit);
      window.removeEventListener("socialcalc:row-header-click", handleRowClick);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* SocialCalc DOM Mounting Target Elements */}
      <div id="container" style={{ width: "100%", height: "calc(100% - 44px)" }}>
        <div id="workbookControl" style={{ display: "none" }}></div>
        <div id="tableeditor" style={{ width: "100%", height: "100%" }}></div>
        <div id="msg"></div>
      </div>

      {/* Horizontal Viewport Scrollbar */}
      <HorizontalScrollBar />

      {/* Rich Cell Editor Bottom Sheet */}
      <CellEditModal
        isOpen={showEditModal}
        cellData={cellEditData}
        onClose={() => setShowEditModal(false)}
      />

      {/* Row Insert / Delete Popover */}
      <RowActionPopover
        isOpen={!!rowPopoverEvent}
        event={rowPopoverEvent?.event}
        selectedRow={rowPopoverEvent?.rowNum}
        onDismiss={() => setRowPopoverEvent(null)}
      />
    </div>
  );
};

export default SpreadsheetEditor;
```

---

## 🌐 Quick Start in Vanilla JavaScript

`socialcalc-ai` can be used in plain HTML/JavaScript or non-React web apps without any framework overhead:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>SocialCalc AI Standalone</title>
</head>
<body>
  <div id="container">
    <div id="workbookControl" style="display: none;"></div>
    <div id="tableeditor"></div>
    <div id="msg"></div>
  </div>

  <script type="module">
    import * as SocialCalcApp from "socialcalc-ai";

    // Initialize spreadsheet
    SocialCalcApp.initializeApp("");

    // Enable modern features
    SocialCalcApp.enableGridLines();
    SocialCalcApp.enableRowColHeaders();
    SocialCalcApp.enableTouchScroll();

    // Listen for cell change events
    SocialCalcApp.setupCellChangeListener((coord, value) => {
      console.log(`Cell ${coord} updated:`, value);
    });
  </script>
</body>
</html>
```

---

## 📁 Architecture Overview

```text
socialcalc-ai/
├── index.js                      # Main entry point: aggregates core, modules & UI
├── index.d.ts                    # Complete TypeScript typings
├── package.json                  # Standalone package definition
├── core/                         # Core calculation engine & DOM table rendering
│   ├── constants.js              # Formatting codes, default styles & limits
│   ├── core.js                   # Spreadsheet sheet model, cell evaluation, formula AST
│   ├── formula.js                # Built-in math, logical, string, financial functions
│   ├── format-number.js          # Numeric and date formatting routines
│   ├── spreadsheet-control.js    # Spreadsheet control lifecycle & pane management
│   ├── table-editor.js           # DOM table editor layout & cursor rendering
│   └── index.js                  # Assembled core SocialCalc singleton export
├── modules/                      # Modular functional features & plugins
│   ├── plugin-manager.js         # Central registry for dynamic SocialCalc plugins
│   ├── grid-lines.js             # Cell border grid-lines plugin
│   ├── row-col-headers.js        # 123 / ABCD headers with resize handles & row selection
│   ├── touch-scroll.js           # Momentum/inertia mobile touch scroll
│   ├── horizontal-scroll.js      # Viewport tracking & horizontal scrolling subscriptions
│   ├── editable-cells.js         # Cell lock & template permission plugin
│   ├── listeners.js              # Mouse, click, and custom event dispatches
│   ├── formatting.js             # Cell formatting, font colors, background colors, borders
│   ├── sheets.js                 # Multi-sheet management, switching, renaming
│   ├── history.js                # Undo / Redo command history stacks
│   ├── init.js                   # Workbook & table editor DOM initialization
│   ├── prompts.js                # Enhanced input dialogs & modal dispatchers
│   ├── exporters.js              # HTML, CSV, MSC export helpers
│   ├── invoice.js                # Coordinate mapping & invoice utilities
│   ├── device.js                 # Device detection and responsive helpers
│   ├── logos.js                  # Brand/logo helper utilities
│   ├── utils.js                  # Coordinate conversions, DOM utilities
│   └── weight.js                 # Cell weight/scoring utilities
├── components/                   # React & Ionic UI Components
│   ├── CellEditModal/            # Rich editor sheet (Formulas, Text, Colors, Borders, Images)
│   ├── HorizontalScrollBar.tsx   # Smooth horizontal navigation bar & track slider
│   ├── RowActionPopover/         # Context menu for row insertion & deletion
│   ├── EditableCellsModal/       # Template mapping manager & cell lock editor
│   └── DemoVideosModal/          # Formula cheat sheet and interactive tutorials
└── utils/
    ├── imageCompressor.ts        # Client-side image compression for cell image inserts
    └── scriptLoader.ts           # Dynamic script loader utility
```

---

## 🎨 UI Components

### 1. `CellEditModal`
A modern, responsive bottom-sheet modal that replaces legacy browser `prompt()` dialogs with a rich spreadsheet formatting bar:
- **Formula & Text Editor**: Live input bar with syntax validation (e.g. `=SUM(A1:B10)`).
- **Styling**: Bold, Italic, Alignment (Left, Center, Right).
- **Curated Palette**: 8 font colors (`FONT_COLORS`) and 7 background colors (`BG_COLORS`).
- **Cell Borders**: Top, Bottom, Left, Right, and All borders with Solid, Dashed, or Dotted styles.
- **Image Insertion**: Embed images into cells with automatic client-side compression via `imageCompressor.ts`.
- **Fallback**: Automatically falls back to native inline input if modal mode is disabled.

```tsx
<CellEditModal
  isOpen={isOpen}
  cellData={cellData}
  onClose={() => setIsOpen(false)}
/>
```

### 2. `HorizontalScrollBar`
A smooth horizontal track controller designed specifically for wide spreadsheets on mobile and desktop:
- Step-by-step column advancement buttons (◀ / ▶).
- Responsive drag track with active column indicator (e.g., `Cols: A - J`).
- Synchronizes bi-directionally with keyboard arrow navigation and touch scrolling.

```tsx
<HorizontalScrollBar />
```

### 3. `RowActionPopover`
A context popup that appears when clicking any row header index:
- **Insert Row Above**: Inserts an empty row above the selected index.
- **Insert Row Below**: Inserts an empty row below the selected index.
- **Delete Row**: Removes the selected row and cascades formula references.

```tsx
<RowActionPopover
  isOpen={showPopover}
  event={clickEvent}
  selectedRow={rowNumber}
  onDismiss={() => setShowPopover(false)}
/>
```

### 4. `EditableCellsModal`
An administrative inspector for template creators:
- View all locked vs editable cells in the active sheet.
- Bind application field mappings (e.g., `vendor_name -> B4`) to spreadsheet coordinates.
- Test template locking permissions.

```tsx
<EditableCellsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

### 5. `DemoVideosModal`
An interactive help and reference modal containing:
- Built-in formula cheat sheets (`SUM`, `AVERAGE`, `IF`, `VLOOKUP`, `COUNT`, `CONCATENATE`, etc.).
- Embedded tutorial guides for spreadsheet operators.

```tsx
<DemoVideosModal
  isOpen={showHelp}
  onClose={() => setShowHelp(false)}
/>
```

---

## 🔌 Plugins & Modules API

### 1. Row & Column Headers (`modules/row-col-headers.js`)
Enables 123 row numbers and ABCD column headers with interactive column resizing:
```ts
// Enable row/col headers
AppGeneral.enableRowColHeaders();

// Disable row/col headers
AppGeneral.disableRowColHeaders();

// Toggle headers dynamically (returns boolean)
const isEnabled = AppGeneral.toggleRowColHeaders();

// Execute raw SocialCalc commands
AppGeneral.executeSheetCommand("set A1 text hello");
```

### 2. Grid Lines (`modules/grid-lines.js`)
Adds subtle, high-contrast borders between cells:
```ts
AppGeneral.enableGridLines();
AppGeneral.disableGridLines();
AppGeneral.toggleGridLines();
```

### 3. Smooth Touch Scroll (`modules/touch-scroll.js`)
Adds mobile touch inertia scrolling:
```ts
AppGeneral.enableTouchScroll();
AppGeneral.configureTouchScroll({
  momentumFriction: 0.94, // adjust friction
  velocityMultiplier: 1.2
});
AppGeneral.disableTouchScroll();
```

### 4. Horizontal Scroll (`modules/horizontal-scroll.js`)
Programmatic viewport scrolling:
```ts
// Scroll horizontally by a relative number of columns
AppGeneral.scrollHorizontalBy(3);

// Scroll to a specific target column index (1-based)
AppGeneral.scrollToColumn(5); // Scrolls to column E

// Subscribe to horizontal scroll events
const unsubscribe = AppGeneral.subscribeHorizontalScroll((info) => {
  console.log("Current first col:", info.currentFirstCol);
});
```

### 5. Editable Cells & Template Locks (`modules/editable-cells.js`)
Restricts user editing to designated cells while protecting formula and header cells:
```ts
// Enable template protection mode
AppGeneral.enableEditableCellsOnly();

// Define allowed mapping
AppGeneral.setAppMapping({
  sheet1: {
    customerName: "B3",
    itemsTotal: "D15"
  }
});

// Check if a specific cell coordinate is editable
const canEdit = AppGeneral.isCellEditable(editor, "B3"); // true
const isLocked = AppGeneral.isCellEditable(editor, "A1"); // false
```

### 6. Plugin Manager (`modules/plugin-manager.js`)
Allows registration of custom lifecycle plugins:
```ts
AppGeneral.registerPlugin("myCustomPlugin", {
  metadata: {
    displayName: "Audit Logger",
    description: "Logs cell updates to an external service"
  },
  enable: () => console.log("Plugin activated"),
  disable: () => console.log("Plugin deactivated"),
  isEnabled: () => true
});
```

### 7. History (Undo / Redo) (`modules/history.js`)
```ts
AppGeneral.undo();
AppGeneral.redo();
```

### 8. Exporters & Sheets (`modules/exporters.js`, `modules/sheets.js`)
```ts
// Export sheet as CSV string
const csvData = AppGeneral.getCSVContent();

// Export sheet as HTML string
const htmlContent = AppGeneral.getCurrentHTMLContent();

// Get full spreadsheet data (save format / MSC)
const mscData = AppGeneral.getSpreadsheetContent();

// Multi-sheet operations
AppGeneral.switchSheet("Sheet2");
AppGeneral.addNewSheet("Expenses");
AppGeneral.deleteSheet("Sheet3");
AppGeneral.renameSheet("Sheet1", "Overview");
```

### 9. Invoice Utilities (`modules/invoice.js`)
```ts
import { getInvoiceCoordinates } from "socialcalc-ai";

const coords = getInvoiceCoordinates();
// Returns standard coordinates for billTo, from, invoiceDetails, items, totals
```

---

## 📡 Event-Driven Architecture

`socialcalc-ai` broadcasts standard DOM CustomEvents on the `window` object. This allows any framework (React, Vue, Svelte, Angular, Vanilla JS) to react to spreadsheet changes:

| Event Name | `event.detail` Structure | Purpose |
| :--- | :--- | :--- |
| `socialcalc:cell-edit-request` | `{ coord: string, text: string, okfn: Function, cleanup: Function }` | Fired when a cell is clicked/tapped. Consumed by `CellEditModal`. |
| `socialcalc:row-header-click` | `{ rowNum: number, originalEvent: MouseEvent }` | Fired when a row number index is clicked. Consumed by `RowActionPopover`. |
| `socialcalc:cell-change` | `{ coord: string, value: string }` | Fired after a cell's value or formula is committed and recalculated. |
| `socialcalc:horizontal-scroll`| `{ currentFirstCol: number, currentColName: string, totalCols: number }` | Fired whenever the horizontal viewport column changes. |
| `socialcalc:plugin-change` | `{ pluginName: string, state: boolean, allStates: Record<string, boolean> }` | Fired whenever a plugin is registered, enabled, or disabled. |

### Event Listener Example:

```ts
window.addEventListener("socialcalc:cell-change", (e: CustomEvent) => {
  const { coord, value } = e.detail;
  console.log(`Cell ${coord} changed to: ${value}`);
});
```

---

## 🤖 AI & MultiSheet Calc (MSC) Integration

`socialcalc-ai` is built for automated and LLM-driven spreadsheet workflows:

### Generating Spreadsheets via LLMs
AI agents can generate spreadsheet structures in SocialCalc MSC format (MultiSheet Calc). An MSC document defines multiple named sheets with cell formulas, formats, and values:

```json
{
  "sheets": {
    "Summary": {
      "content": "cell:A1:t:Quarterly Revenue\ncell:A3:t:Q1\ncell:B3:v:12500\ncell:A4:t:Q2\ncell:B4:v:14200\ncell:A5:t:Total\ncell:B5:v#:=SUM(B3:B4)"
    }
  }
}
```

Load this directly into `socialcalc-ai`:

```ts
import * as AppGeneral from "socialcalc-ai";

AppGeneral.loadWorkbookData(aiGeneratedMscJson);
```

---

## 🛡 TypeScript Support

`socialcalc-ai` ships with full type definitions in `index.d.ts`:

```ts
import * as AppGeneral from "socialcalc-ai";
import {
  CellEditModal,
  CellEditModalProps,
  HorizontalScrollBarProps,
  RowActionPopoverProps
} from "socialcalc-ai";
```

---

## 💻 Browser & Framework Compatibility

- **Browsers**: Chrome, Edge, Safari, Firefox (Desktop & Mobile).
- **Frameworks**: React 18+, Ionic React 7+, Next.js (Client Component), Vite, Plain JavaScript.
- **Runtimes**: Node.js 18+ (for headless calculation & CSV/MSC transformation).

---

## 📦 Release Notes

### v1.0.2
- **Cell Edit Modal Fix**: Fixed cell click interceptor and mouse delegates so clicking any cell reliably triggers the `CellEditModal` bottom sheet.
- **Scroll Distortion Fix**: Resolved table border collapse and column misalignment when scrolling past multi-row (`rowspan`) and multi-column (`colspan`) blocks.
- **Formula Support**: Enhanced modal editing to support formula values (`=SUM(...)`) seamlessly alongside raw numbers, text, and HTML formatting.
- **Strict Column Sizing**: Enforced CSS pixel widths and `box-sizing: border-box` containment across `<colgroup>` and sizing rows to preserve layout integrity.
- **Safety Guards**: Added null guards and try/catch protection across SocialCalc workbook control callbacks.

---

## 📜 License & Acknowledgments

- **Original SocialCalc Engine**: Created by Dan Bricklin (co-creator of VisiCalc) and Socialtext.
- **Modernized `socialcalc-ai` Package**: Maintained and modernized for ES6 modules, React/Ionic UI components, touch physics, and AI workflows by **Anirudh Sharma** under the **MIT License**.

Feel free to open issues and pull requests to help enhance the modern spreadsheet engine!
