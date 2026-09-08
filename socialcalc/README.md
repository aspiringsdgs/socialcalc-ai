# SocialCalc Modernized Standalone Package

> **A modernized, modularized, high-performance spreadsheet engine with ES6 module exports, React/Ionic UI components, and an extensible plugin system.**

---

## 📌 Overview

This package (`./socialcalc`) is a **standalone, framework-agnostic core** with first-class React & Ionic bindings. It takes Dan Bricklin's proven, industrial-strength SocialCalc engine and modernizes it for modern web and mobile applications:
- **Clean ES6 module structure** replacing legacy globals.
- **Pluggable Architecture**: Dynamically toggle features like Grid Lines, 123/ABCD Row-Col Headers, Touch Scroll with momentum, and Editable Cell Locking.
- **Modern Touch & Mobile Support**: Smooth inertia swipe scrolling without jumping.
- **Modern Ionic / React Components**: High-fidelity modal editors, responsive horizontal scroll controls, context popovers for row operations, and cell mapping inspectors.
- **Universal Spreadsheet Commands**: Full support for SocialCalc formulas, cell formatting, font styling, borders, multi-sheet workbooks, and CSV/MSC serialization.

> ⚠️ **CRITICAL FOR DEVELOPERS & AGENTS**:  
> This package is consumed as a shared standalone dependency across multiple downstream apps. Any breaking changes to public APIs, event signatures, or file paths will impact all applications using it. Always preserve backward compatibility.

---

## 📁 Package Architecture

```text
socialcalc/
├── index.js                      # Main entry point: re-exports core, all modules & React components
├── package.json                  # Standalone package definition
├── core/                         # Core calculation engine & table rendering
│   ├── constants.js              # SocialCalc constant definitions & default styles
│   ├── core.js                   # Spreadsheet sheet model, cell evaluation, formula AST
│   ├── formula.js                # Built-in math, logical, string, financial formulas
│   ├── format-number.js          # Numeric and date formatting routines
│   ├── spreadsheet-control.js    # Spreadsheet control lifecycle & pane management
│   ├── table-editor.js           # DOM table editor layout & cursor rendering
│   └── index.js                  # Assembled core SocialCalc singleton export
├── modules/                      # Modularized functional features & plugins
│   ├── plugin-manager.js         # Central registry for dynamic SocialCalc plugins
│   ├── grid-lines.js             # Dynamic cell border grid-lines plugin
│   ├── row-col-headers.js        # 123 Row & ABCD Col headers with resize handles & row selection
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
│   ├── device.js                 # Device detection and responsive helpers
│   ├── logos.js                  # Brand/logo helper utilities
│   ├── utils.js                  # Coordinate conversions, DOM utilities
│   └── weight.js                 # Cell weight/scoring utilities
├── components/                   # React & Ionic UI Components
│   ├── CellEditModal/            # Rich bottom sheet editor (Text, Formula, Colors, Borders, Images)
│   ├── HorizontalScrollBar.tsx   # Smooth horizontal navigation bar & track slider
│   ├── RowActionPopover/         # Context menu for row insertion & deletion
│   ├── EditableCellsModal/       # Template mapping manager & cell lock editor
│   └── DemoVideosModal/          # Formula cheat sheet and interactive tutorials
└── utils/
    ├── imageCompressor.ts        # Client-side image compression for cell image inserts
    └── scriptLoader.ts           # Dynamic script loader utility
```

---

## 🚀 Quick Start in React / Ionic

### 1. Installation / Path Resolution
In your application's `tsconfig.json` or `vite.config.ts`:

```ts
// vite.config.ts
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      socialcalc: path.resolve(__dirname, "./socialcalc"),
    },
  },
});
```

### 2. Initialization in React Component

```tsx
import React, { useEffect, useState } from "react";
import * as AppGeneral from "socialcalc";
import {
  CellEditModal,
  HorizontalScrollBar,
  RowActionPopover,
} from "socialcalc";

const MySpreadsheet: React.FC = () => {
  const [cellEditData, setCellEditData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Initialize DOM workbook container
    const initialMSC = { /* SocialCalc MSC json or save string */ };
    AppGeneral.initializeApp(JSON.stringify(initialMSC));

    // 2. Enable desired plugins
    AppGeneral.enableRowColHeaders(); // 123 / ABCD headers
    AppGeneral.enableGridLines();      // Cell grid borders
    AppGeneral.enableTouchScroll();    // Smooth touch scrolling

    // 3. Listen for Cell Edit Modal request events
    const handleCellEdit = (e: any) => {
      setCellEditData(e.detail);
      setShowModal(true);
    };
    window.addEventListener("socialcalc:cell-edit-request", handleCellEdit);

    return () => {
      window.removeEventListener("socialcalc:cell-edit-request", handleCellEdit);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* SocialCalc mounting targets */}
      <div id="container">
        <div id="workbookControl" style={{ display: "none" }}></div>
        <div id="tableeditor"></div>
        <div id="msg"></div>
      </div>

      {/* Horizontal Scroll Bar */}
      <HorizontalScrollBar />

      {/* Modern Cell Edit Modal */}
      <CellEditModal
        isOpen={showModal}
        cellData={cellEditData}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};
```

---

## 🛠 Features & Plugins Deep Dive

### 1. Row and Column Headers (`modules/row-col-headers.js`)
Displays standard spreadsheet row numbers (`1, 2, 3...`) and column letters (`A, B, C...`).
- **Smooth Column Resizing**: Hover or drag right edge of any column header to resize. Live floating tooltip and guideline indicate new column width.
- **Corner Resize Handle**: Tap/click a column header to display a mobile-friendly corner drag handle (`#sc-col-resize-corner-handle`).
- **Row Selection**: Clicking a row header selects the full row and fires `socialcalc:row-header-click`.
- **API**:
  ```ts
  AppGeneral.enableRowColHeaders();
  AppGeneral.disableRowColHeaders();
  AppGeneral.toggleRowColHeaders(); // returns boolean
  AppGeneral.isRowColHeadersEnabled(); // returns boolean
  AppGeneral.executeSheetCommand(cmd); // runs SocialCalc sheet command synchronously
  ```

### 2. Grid Lines (`modules/grid-lines.js`)
Provides clean, modern cell grid lines across all table cells.
- **API**:
  ```ts
  AppGeneral.enableGridLines(customCss?: string);
  AppGeneral.disableGridLines();
  AppGeneral.toggleGridLines(); // returns boolean
  AppGeneral.isGridLinesEnabled(); // returns boolean
  ```

### 3. Smooth Touch Scroll (`modules/touch-scroll.js`)
Replaces clunky full-page jumping on mobile swipes with smooth continuous panning and physics-based inertia momentum.
- **API**:
  ```ts
  AppGeneral.enableTouchScroll();
  AppGeneral.disableTouchScroll();
  AppGeneral.toggleTouchScroll(); // returns boolean
  AppGeneral.isTouchScrollEnabled(); // returns boolean
  AppGeneral.configureTouchScroll({ momentumFriction: 0.94 });
  ```

### 4. Cell Edit Modal (`components/CellEditModal/`)
A responsive, high-feature editing sheet replacing legacy browser prompt popups:
- **Text & Numeric Inputs**: Edit formulas (e.g. `=SUM(B4:C4)`), raw values, or labels.
- **Formatting Presets**: Currency, Percent, Date, Time, Integer.
- **Styling**: Bold, Italic, Alignment (Left, Center, Right).
- **Colors**: 8 curated font colors and 7 cell background colors.
- **Borders**: All, Top, Bottom, Left, Right with Solid/Dashed/Dotted styles and custom widths.
- **Image Insertion**: Embed images into cells with automatic client-side compression (`imageCompressor.ts`).
- **Fallback**: Calling `toggleCellEditModal(false)` automatically falls back to native inline input.

### 5. Horizontal Scroll Bar (`components/HorizontalScrollBar.tsx`)
A dedicated, smooth horizontal control bar for navigating wide sheets:
- Step buttons for next/prev columns.
- Draggable slider track with live position indicator.
- Automatically syncs with spreadsheet viewport when user scrolls or uses keyboard navigation.

### 6. Row Action Popover (`components/RowActionPopover/`)
Context popup that triggers when user taps a row header:
- **Insert Above**: Calls `executeSheetCommand("insertrow A" + rowNum)`.
- **Insert Below**: Calls `executeSheetCommand("insertrow A" + (rowNum + 1))`.
- **Delete Row**: Calls `executeSheetCommand("deleterow A" + rowNum)`.

### 7. Editable Cells Mode & Template Mapping (`modules/editable-cells.js`)
Allows template authors to lock the spreadsheet so end-users can only edit designated cells:
- **API**:
  ```ts
  AppGeneral.enableEditableCellsOnly();
  AppGeneral.disableEditableCellsOnly();
  AppGeneral.toggleEditableCellsOnly();
  AppGeneral.setAppMapping(mappingObj);
  ```

### 8. Plugin Manager (`modules/plugin-manager.js`)
Allows developers to register custom plugins with lifecycle hooks:
- **API**:
  ```ts
  AppGeneral.registerPlugin("myPlugin", {
    metadata: { displayName: "My Plugin", description: "Custom feature" },
    enable: () => { ... },
    disable: () => { ... },
    isEnabled: () => true,
    toggle: () => { ... },
  });
  ```

### 9. Cell Change & Status Listeners (`modules/listeners.js`)
Safely intercepts cell updates and spreadsheet status cycles:
- **API**:
  ```ts
  const unsubscribe = AppGeneral.setupCellChangeListener((coord: string) => {
    console.log("Cell modified:", coord);
  });
  ```
- **Forwarding Safety**: Intercepts `SocialCalc.EditorSheetStatusCallback` while preserving all 4 internal parameters (`recalcdata, status, arg, editor`), avoiding undefined context dereference during render routines.

---

## 📡 Events Dispatched by SocialCalc

| Event Name | `detail` Payload | Description |
| :--- | :--- | :--- |
| `socialcalc:cell-edit-request` | `{ coord, text, okfn, cleanup }` | Dispatched when a cell is clicked/tapped (consumed by `CellEditModal`). |
| `socialcalc:row-header-click` | `{ rowNum, clientX, clientY }` | Dispatched when a row number is clicked (consumed by `RowActionPopover`). |
| `socialcalc:cell-change` | `{ coord, value }` | Dispatched when any cell value is successfully modified. |
| `socialcalc:horizontal-scroll`| `{ currentFirstCol, currentColName, totalCols }` | Dispatched when sheet column scrolls. |
| `socialcalc:plugin-change` | `{ pluginName, state, allStates }` | Dispatched when any plugin is enabled/disabled. |

---

## 🧪 Testing & Verification

Run tests anytime you modify the package:
```bash
# Run Vitest test suite
npm test -- --run

# Run TypeScript compilation & Vite build
npm run build

# Verify SocialCalc core modularization in Node
node test-socialcalc.js
```
