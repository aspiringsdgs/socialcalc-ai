---
name: socialcalc
description: Guidelines, architecture, workflows, and strict constraints for developing, extending, and testing the standalone SocialCalc package and its Ionic/React plugins without breaking downstream applications.
---

# SocialCalc Standalone Package & Plugin Development Skill

Use this skill when modifying, extending, debugging, or integrating the standalone `./socialcalc` package located in this repository.

## Critical Warning: Shared Standalone Dependency

`./socialcalc` is NOT just local application code; it is a **standalone package consumed across multiple web and mobile applications**.
- **NEVER** re-create `src/socialcalc`.
- **NEVER** break exported method signatures or change event payload shapes.
- **NEVER** import React/Ionic inside `./socialcalc/core/` or `./socialcalc/modules/`. React/Ionic code belongs exclusively in `./socialcalc/components/`.

---

## Architectural Map

```
socialcalc/
├── core/                  # Core spreadsheet engine & formula parser (vanilla JS, UMD)
│   ├── constants.js       # Default styles & configuration constants
│   ├── core.js            # Spreadsheet sheet model, cell evaluation, formula AST
│   ├── formula.js         # Built-in math, logical, string, financial formulas
│   ├── format-number.js   # Numeric and date formatting routines
│   ├── spreadsheet-control.js # Spreadsheet control lifecycle & pane management
│   ├── table-editor.js    # DOM table editor layout & cursor rendering
│   └── index.js           # Assembled core SocialCalc singleton export
├── modules/               # Vanilla JS modular features & plugins
│   ├── plugin-manager.js  # Dynamic plugin registration registry
│   ├── grid-lines.js      # Dynamic cell border grid-lines plugin
│   ├── row-col-headers.js # 123 Row & ABCD Col headers with resize handles & row selection
│   ├── touch-scroll.js    # Momentum/inertia mobile touch scroll
│   ├── horizontal-scroll.js # Viewport tracking & horizontal scrolling subscriptions
│   ├── editable-cells.js  # Cell lock & template permission plugin
│   ├── listeners.js       # Mouse, click, and custom event dispatches
│   ├── formatting.js      # Cell formatting, font colors, background colors, borders
│   ├── sheets.js          # Multi-sheet management, switching, renaming
│   ├── history.js         # Undo / Redo command history stacks
│   ├── init.js            # Workbook & table editor DOM initialization
│   ├── prompts.js         # Enhanced input dialogs & modal dispatchers
│   ├── exporters.js       # HTML, CSV, MSC export helpers
│   ├── device.js          # Device detection and responsive helpers
│   ├── logos.js           # Brand/logo helper utilities
│   ├── utils.js           # Coordinate conversions, DOM utilities
│   └── weight.js          # Cell weight/scoring utilities
├── components/            # React & Ionic UI Components
│   ├── CellEditModal/     # Rich bottom sheet editor (Text, Formula, Colors, Borders, Images)
│   ├── HorizontalScrollBar.tsx # Smooth horizontal navigation bar & track slider
│   ├── RowActionPopover/  # Context menu for row insertion & deletion
│   ├── EditableCellsModal/# Template mapping manager & cell lock editor
│   └── DemoVideosModal/   # Formula cheat sheet and interactive tutorials
├── utils/
│   ├── imageCompressor.ts # Client-side image compression for cell image inserts
│   └── scriptLoader.ts    # Dynamic script loader utility
└── index.js               # Main package entry point re-exporting all modules & components
```

---

## Plugin Development Workflow

When implementing a new plugin or feature in `./socialcalc`:

1. **Create the Plugin Module**:
   Place it in `socialcalc/modules/<my-plugin>.js`.
   ```javascript
   import { getActiveEditor, getActiveSpreadsheet, registerPlugin } from "./plugin-manager.js";

   let _enabled = false;

   export function enableMyPlugin() {
     _enabled = true;
     // Apply DOM or engine configuration
   }

   export function disableMyPlugin() {
     _enabled = false;
     // Revert configuration
   }

   export function toggleMyPlugin(show) {
     const next = typeof show === "boolean" ? show : !_enabled;
     if (next) enableMyPlugin(); else disableMyPlugin();
     return _enabled;
   }

   export function isMyPluginEnabled() {
     return _enabled;
   }

   registerPlugin("myPlugin", {
     metadata: { displayName: "My Plugin", description: "Does something great" },
     enable: enableMyPlugin,
     disable: disableMyPlugin,
     isEnabled: isMyPluginEnabled,
     toggle: toggleMyPlugin
   });
   ```

2. **Re-Export in `socialcalc/index.js`**:
   ```javascript
   export * from "./modules/<my-plugin>.js";
   ```

3. **Provide UI Controls in `src/App.tsx`**:
   Import the plugin functions and add a button or toggle in the tester toolbar to verify it works interactively.

4. **Add React Components if Required**:
   If the feature needs a UI modal, put it in `socialcalc/components/<ComponentName>/` and export it in `socialcalc/index.js`.
   - Ensure props are optional with safe fallbacks.
   - Keep styling in a sibling `.css` file using scoped class names (e.g. `.sc-*`).

5. **Synchronize Documentation**:
   Whenever you edit or improve anything in `./socialcalc` (new plugins, updated props, bug fixes, new APIs), you MUST update both `socialcalc/README.md` and `docs/src/docsData.ts` to keep the package docs and standalone documentation website in sync.

---

## Communicating with the Host Application

Always use decoupled custom window events for UI interactions:

- **Triggering a Modal**:
  ```javascript
  window.dispatchEvent(new CustomEvent("socialcalc:<event-name>", {
    detail: { ...payload }
  }));
  ```
- **React Host Consumption**:
  ```typescript
  useEffect(() => {
    const handler = (e: CustomEvent) => { ... };
    window.addEventListener("socialcalc:<event-name>", handler as EventListener);
    return () => window.removeEventListener("socialcalc:<event-name>", handler as EventListener);
  }, []);
  ```

---

## Verification Checklist

Before completing your turn:
1. `npm test -- --run` passes all Vitest unit tests.
2. `npm run build` succeeds without TypeScript or Vite errors.
3. `node test-socialcalc.js` passes with all checkmarks green.
4. `src/socialcalc` does not exist (`ls src/socialcalc` should fail).
5. Documentation updated: both `socialcalc/README.md` and `docs/src/docsData.ts` reflect all new or modified features.

