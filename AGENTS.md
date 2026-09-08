# Guidelines for AI Coding Agents Operating in this Codebase

> **CRITICAL ARCHITECTURAL DIRECTIVE**  
> The directory `./socialcalc` is a **standalone, shared package** used across multiple different applications and platforms (web apps, Ionic hybrid apps, React dashboards).  
> **NEVER re-create `src/socialcalc`**. All SocialCalc features belong in `./socialcalc` or must be consumed from `./socialcalc`.

---

## 1. Golden Rules for Modifying `./socialcalc`

1. **Strict Backward Compatibility**:
   - Any function, method, or constant exported from `socialcalc/index.js` or `socialcalc/core/index.js` is part of a public contract.
   - Do NOT remove or rename existing exports. If introducing new behavior, use optional parameters or additive helper functions.
   - Core files (`socialcalc/core/*`) utilize UMD patterns (`root.SocialCalcConstants = factory()`). Do not add `"type": "module"` to `socialcalc/package.json` unless all UMD wrappers are verified.

2. **Decoupled Architecture**:
   - `socialcalc/core/`: Pure engine, formula calculation, AST, table editor. Never import React or Ionic inside `core/`.
   - `socialcalc/modules/`: Vanilla JS plugins (grid-lines, touch-scroll, row-col-headers, listeners). Must work in any DOM environment.
   - `socialcalc/components/`: React & Ionic UI components (`CellEditModal`, `HorizontalScrollBar`, `RowActionPopover`). When modifying these, keep CSS classes scoped (`.sc-*` or component-specific).
   - `socialcalc/utils/`: Framework-agnostic utility functions (e.g. image compression).

3. **Event-Driven UI Integration**:
   - The engine communicates with UI shells through custom `window` events:
     - `socialcalc:cell-edit-request` -> triggers cell editing UI (`CellEditModal`).
     - `socialcalc:row-header-click` -> triggers row operation popovers (`RowActionPopover`).
     - `socialcalc:cell-change` -> notifies host application of cell mutations.
     - `socialcalc:horizontal-scroll` -> notifies navigation controls.
     - `socialcalc:plugin-change` -> notifies state managers of plugin toggles.
   - NEVER hardcode application-specific state inside the engine. Always dispatch events.

4. **Testing is Mandatory Before Completing Any Task**:
   - Any modification to `socialcalc/` MUST pass:
     ```bash
     npm test -- --run     # Vitest unit tests
     npm run build         # TypeScript compilation & Vite bundle validation
     node test-socialcalc.js # Node engine integrity check
     ```

5. **Mandatory Documentation Synchronization**:
   - Whenever you edit, enhance, or add anything in `./socialcalc` (new plugins, updated component props, modified APIs, new event types, or formula behaviors), you **MUST synchronously update the documentation**:
     - Update `socialcalc/README.md` to document the new API, parameters, or plugin behavior.
     - Update `docs/src/docsData.ts` (the dedicated documentation web app) so the documentation website displays the new feature, props, and code examples.
     - Never leave new features undocumented or allow documentation to fall out of sync with code changes.

---

## 2. Directory Map & Component Responsibilities

| Path | Description | Rules & Constraints |
| :--- | :--- | :--- |
| `socialcalc/core/` | Low-level spreadsheet engine & formula parser | **No React/Ionic**. Preserve global/window compatibility. |
| `socialcalc/modules/` | Independent modular features | Register new plugins via `plugin-manager.js`. Provide `enable()`, `disable()`, `toggle()`, `isEnabled()`. |
| `socialcalc/components/` | React/Ionic interactive UI modals & controls | Keep props flexible and optional with sensible defaults. |
| `socialcalc/index.js` | Main package public export barrel | Re-export all modules and components. |
| `src/` | Testing & showcase application | Use this app to test and demo any new feature before publishing. |

---

## 3. How to Add a New Plugin to `socialcalc`

1. Create `socialcalc/modules/<plugin-name>.js`.
2. Implement `enable<Plugin>()`, `disable<Plugin>()`, `toggle<Plugin>()`, `is<Plugin>Enabled()`.
3. Register the plugin with `registerPlugin("<plugin-name>", { metadata, enable, disable, isEnabled, toggle })`.
4. Export the functions from `socialcalc/modules/<plugin-name>.js` and re-export in `socialcalc/index.js`.
5. Add interactive toggle controls in `src/App.tsx` to verify in the testing application.
6. Document the plugin in `socialcalc/README.md`.
