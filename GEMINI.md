# Gemini & Antigravity Agent Guidelines for SocialCalc Codebase

> **CORE PRINCIPLE**: The `./socialcalc` directory contains the **canonical standalone SocialCalc engine and plugin suite**.
> Multiple production applications rely on this exact package structure.
> Do NOT create or re-introduce `src/socialcalc`. The host application in `src/` serves as the test and demonstration workbench for `./socialcalc`.

---

## Operating Instructions for Gemini / Antigravity Agents

### 1. Package Identity
- **Package Root**: `./socialcalc`
- **Package Alias**: `"socialcalc"` (configured in `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`).
- **Target Environments**: React, Ionic React (Web + iOS + Android), and plain JavaScript/ES6.

### 2. Modification Rules (Zero Regressions)
- When requested to add, fix, or improve a spreadsheet feature:
  1. Inspect `./socialcalc/core/` for formula and calculation logic.
  2. Inspect `./socialcalc/modules/` for DOM, touch, headers, grid lines, or listener behavior.
  3. Inspect `./socialcalc/components/` for React/Ionic modals, popovers, or scrollbars.
- **Never break existing function signatures**. Always provide backwards-compatible aliases if refactoring function names (e.g. `export const initGridLines = enableGridLines;`).
- Always check that any new React component can be rendered safely even if optional props are not passed.
- **Mandatory Documentation Update**: Whenever you edit anything in `./socialcalc` for improvements, bug fixes, or new features, you MUST update both `socialcalc/README.md` and `docs/src/docsData.ts` (the dedicated documentation web app) to keep the documentation site and package documentation completely accurate and up-to-date.

### 3. Verification Commands
Always execute and verify the following commands before reporting completion:
```bash
npm test -- --run        # Runs vitest test suite
npm run build            # Runs tsc & vite build
node test-socialcalc.js  # Verifies core module loading in Node
```

### 4. Agent Skill Reference
Consult the agent skill located at `.agents/skills/socialcalc/SKILL.md` for in-depth workflows, plugin development, and architectural schemas.
