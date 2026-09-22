# SocialCalc Core Engine (`socialcalc/core`)

This folder is the spreadsheet engine behind `socialcalc-ai`: the data model, the command language, formula parsing and recalculation, number formatting, rendering, the interactive grid editor, the spreadsheet toolbar UI, and multi-sheet workbooks.

It is the SocialCalc JavaScript engine, originally written by Dan Bricklin (Software Garden, Inc.) for Socialtext, Inc., based on wikiCalc and SocialCalc 1.1.0. This fork adds ES-module loading, touch and mobile support, editable-cell templates, and hooks for the React/Ionic components in `../components`.

- Everything here is plain JavaScript with no dependencies. There is no React or Ionic inside `core/`.
- All files extend **one shared global object, `SocialCalc`**. There are no per-file exports.
- Most of the engine runs headless in Node. The editor, control and workbook UI need a DOM.

---

## Contents

1. [Quick start](#1-quick-start)
2. [How the core loads](#2-how-the-core-loads)
3. [File map](#3-file-map)
4. [Data model](#4-data-model)
5. [Sheet save format](#5-sheet-save-format)
6. [Command language](#6-command-language)
7. [Recalculation](#7-recalculation)
8. [Formula engine](#8-formula-engine)
9. [Number formatting](#9-number-formatting)
10. [Rendering and value display](#10-rendering-and-value-display)
11. [Table editor (interactive grid)](#11-table-editor-interactive-grid)
12. [Spreadsheet control](#12-spreadsheet-control)
13. [Workbooks (multi-sheet)](#13-workbooks-multi-sheet)
14. [Popup widgets](#14-popup-widgets)
15. [Constants and localization](#15-constants-and-localization)
16. [Extension points and callbacks](#16-extension-points-and-callbacks)
17. [Environment overrides and shims](#17-environment-overrides-and-shims)
18. [What the rest of the package uses](#18-what-the-rest-of-the-package-uses)
19. [Recipes](#19-recipes)
20. [Known issues and gotchas](#20-known-issues-and-gotchas)
21. [Working on the core](#21-working-on-the-core)

---

## 1. Quick start

**In an app** (Vite, React, Ionic), import the singleton from the package:

```js
import { SocialCalc } from "socialcalc-ai";
```

**Headless in Node**, from this repository. The package `exports` map only exposes `"."`, so this deep import only works in-repo:

```js
import SocialCalc from "./socialcalc/core/index.js";

// Recalc schedules its time slices with window.setTimeout; give plain Node a window.
globalThis.window ??= globalThis;

const sheet = new SocialCalc.Sheet();
for (const cmd of [
  "set A1 value n 100",
  "set A2 value n 250",
  "set A3 formula SUM(A1:A2)",
  "set A3 nontextvalueformat #,##0.00",
  "set B1 text t Total",
]) {
  SocialCalc.ExecuteSheetCommand(sheet, cmd, false);
}

// Recalc is asynchronous: wait for the "calcfinished" status.
await new Promise((resolve) => {
  sheet.statuscallback = (data, status) => {
    if (status === "calcfinished") resolve();
  };
  SocialCalc.RecalcSheet(sheet);
});

console.log(sheet.cells.A3.datavalue); // 350
console.log(SocialCalc.FormatNumber.formatNumberWithFormat(sheet.cells.A3.datavalue, "#,##0.00", "")); // "350.00"

const save = SocialCalc.CreateSheetSave(sheet);
console.log(SocialCalc.ConvertSaveToOtherFormat(save, "csv")); // "100,Total\n250,\n350,\n"
```

To embed the full interactive spreadsheet in a page, see [Recipe: embed the spreadsheet UI](#embed-the-spreadsheet-ui), or call `initializeApp()` from `../modules/init.js`.

---

## 2. How the core loads

Every file in this folder has the same shape:

```js
// Simplified
(function (root, factory) {           // UMD wrapper (AMD / CommonJS / global)
  ...
  root.SocialCalcCore = factory();    // each file also exposes itself under a root name (sheet.js uses SocialCalcCore)
})(globalThis, function () {
  var SocialCalc = window.SocialCalc || global.SocialCalc || {};   // find the shared object
  SocialCalc.Something = function () { ... };                       // extend it
  window.SocialCalc = SocialCalc;                                   // write it back
  return SocialCalc;
});
```

[`index.js`](index.js) imports the files **for their side effects, in a fixed order**, then exports the finished object as both `default` and `SocialCalc`. Order matters for two reasons:

- **Load-time reads:** some files read what earlier files defined while they load. For example, `formula-functions.js` registers function objects into the registry that `formula.js` creates.
- **Overrides:** `environment.js` overrides values set by earlier files, so it must be last.

```
constants → sheet → render → touch → format-number → formula → formula-functions
         → popup → table-editor → editor-widgets → spreadsheet-control → workbook → environment
```

Consequences:

- **One instance per page.** Importing the core twice still yields the same object, because `window.SocialCalc` is reused.
- **Variables declared at the top of a file are private to that file.** Anything shared between files must be a property of `SocialCalc`.
- **Name-only availability checks.** Everything is attached by name, so `typeof SocialCalc.RecalcSheet === "function"` is a valid way to check availability.

---

## 3. File map

| File | Lines | What it provides | Key APIs |
|---|---:|---|---|
| [`constants.js`](constants.js) | ~1,040 | All user-visible strings (`s_*`), default styles, sizes and CSS class names | `Constants`, `ConstantsDefaultClasses`, `ConstantsSetClasses(prefix)` |
| [`sheet.js`](sheet.js) | ~4,550 | Data model, save format, command language, undo/redo, formula coordinate adjusting, recalc loop, command parser, clipboard | `Cell`, `Sheet`, `ResetSheet`, `ParseSheetSave`, `CreateSheetSave`, `ScheduleSheetCommands`, `ExecuteSheetCommand`, `SheetUndo`/`SheetRedo`, `RecalcSheet`, `RecalcInfo`, `Parse`, `UndoStack`, `Clipboard`, `Callbacks` |
| [`render.js`](render.js) | ~2,290 | HTML table rendering, coordinate helpers, DOM position helpers, value display, format conversion | `RenderContext`, `RenderSheet`, `rcColname`, `crToCoord`, `coordToCr`, `ParseRange`, `encodeForSave`/`decodeFromSave`, `GetViewportInfo`, `GetElementPosition`, `GetCellContents`, `FormatValueForDisplay`, `format_text_for_display`, `DetermineValueType`, `ConvertSaveToOtherFormat`, `ConvertOtherFormatToSave`, `SetConvertedCell` |
| [`touch.js`](touch.js) | ~420 | Touch detection; converts touch gestures to the editor's mouse handlers | `HasTouch`, `TouchInfo`, `TouchRegister`, `ProcessTouchStart/Move/End/Cancel`, `EditorProcessSwipe`, `EditorProcessSingleTap`, `EditorProcessDoubleTap` |
| [`format-number.js`](format-number.js) | ~1,090 | Excel-style number/date format strings, date serial conversion | `FormatNumber.formatNumberWithFormat`, `FormatNumber.parse_format_string`, `FormatNumber.convert_date_*`, `intFunc` |
| [`formula.js`](formula.js) | ~2,100 | Formula tokenizer, infix→RPN conversion, stack evaluator, operand helpers, names, function registry | `Formula.ParseFormulaIntoTokens`, `Formula.evaluate_parsed_formula`, `Formula.EvaluatePolish`, `Formula.Operand*`, `Formula.LookupName`, `Formula.FunctionList`, `Formula.CalculateFunction`, `Formula.FillFunctionInfo` |
| [`formula-functions.js`](formula-functions.js) | ~3,910 | The 109 built-in functions, plus cross-sheet cache and criteria helpers | `Formula.SeriesFunctions`, `Formula.LookupFunctions`, … `Formula.SheetCache`, `Formula.FreshnessInfo`, `Formula.TestCriteria` |
| [`popup.js`](popup.js) | ~1,680 | Dropdown list and color chooser widgets used by the settings panels | `Popup.Create/Initialize/SetValue/GetValue/Close`, `Popup.Types.List`, `Popup.Types.ColorChooser` |
| [`table-editor.js`](table-editor.js) | ~4,920 | The interactive grid: layout, panes, rendering schedule, mouse handling, cursor and range movement, scrolling, the input box, and cell color/font/cut actions | `TableEditor`, `EditorScheduleSheetCommands`, `EditorSheetStatusCallback`, `MoveECell`, `RangeAnchor/Extend/Remove`, `ScrollRelative(Both)`, `GridMousePosition`, `InputBox`, `InputEcho`, `EditorChangecolorFromWidget`, `EditorCut` |
| [`editor-widgets.js`](editor-widgets.js) | ~3,320 | Parts of the editor UI: fill/move handles, scrollbars and pane sliders, drag/tooltip/button/mouse-wheel registries, keyboard handling | `CellHandles`, `TableControl`, `DragRegister`, `TooltipRegister`, `ButtonRegister`, `MouseWheelRegister`, `keyboardTables`, `KeyboardSetFocus`, `ProcessKey` |
| [`spreadsheet-control.js`](spreadsheet-control.js) | ~4,370 | The full spreadsheet UI: toolbar tabs, formula bar, Sort/Audit/Comment/Names/Clipboard/Settings panels, save/load | `SpreadsheetControl`, `InitializeSpreadsheetControl`, `SpreadsheetControlExecuteCommand`, `LocalizeString`, `LocalizeSubstrings`, `DoOnResize`, `SetTab`, `SpreadsheetControlCreateSpreadsheetSave`, `SettingsControls` |
| [`workbook.js`](workbook.js) | ~2,770 | Multi-sheet workbooks: sheet add/delete/rename/hide/move/copy, sheet bar, workbook save/load, recalc-all, user scripts, editable-cell callbacks | `WorkBook`, `WorkBookControl`, `GetCurrentWorkBookControl`, `ExecuteWorkBookControlCommand`, `WorkBookControlLoad`, `WorkBookControlSaveSheet`, `WorkBookControlActivateSheet`, `SheetBar`, `GetCellDataValue`, `EditableCells` |
| [`environment.js`](environment.js) | ~580 | **Loads last.** JSON polyfill, app-specific overrides, server (no-DOM) stubs, web-worker timer shim | see [§17](#17-environment-overrides-and-shims) |
| [`index.js`](index.js) | ~40 | Imports everything in order; exports `SocialCalc` | `default`, `SocialCalc` |

### Where things used to live

The core was previously 6 larger files, and three of them had misleading names. The code was moved verbatim.

| Old file | Now |
|---|---|
| `core.js` | `sheet.js`, `render.js`, `touch.js` |
| `format-number.js` | `format-number.js` (FormatNumber only), `formula.js`, `formula-functions.js` |
| `formula.js` (actually the popup widgets) | `popup.js` |
| `table-editor.js` | `table-editor.js`, `editor-widgets.js` |
| `spreadsheet-control.js` | `spreadsheet-control.js`, `workbook.js`, `environment.js` |

Line numbers are unchanged for code in the first file of each group, so old line references still work there:
- `sheet.js` (was `core.js`)
- `format-number.js`
- `popup.js` (was `formula.js`)
- `table-editor.js`, up to `InputEcho`
- `spreadsheet-control.js`

---

## 4. Data model

### Coordinates

Cells use A1 notation. Columns run `A`…`ZZ` (702 columns maximum).

```js
SocialCalc.rcColname(28);        // "AB"
SocialCalc.crToCoord(3, 7);      // "C7"   (col, row)
SocialCalc.coordToCr("AB12");    // { row: 12, col: 28 }
SocialCalc.ParseRange("B2:C5");  // { cr1: {row:2,col:2,coord:"B2"}, cr2: {row:5,col:3,coord:"C5"} }
```

### `SocialCalc.Cell`

`new SocialCalc.Cell(coord)`. Cells live in `sheet.cells[coord]`, and only non-blank cells exist.

| Property | Meaning |
|---|---|
| `coord` | `"A1"` |
| `datavalue` | Value used for computation and display (number or string) |
| `datatype` | `v` numeric value, `t` text, `f` formula, `c` constant that is not a plain number (e.g. `"$1.20"`) |
| `formula` | Formula text **without** the leading `=`, or the source text of a constant |
| `valuetype` | First char: `b` blank, `n` number, `t` text, `e` error. Sub-types follow: `n$` currency, `n%` percent, `nd` date, `nt` time, `nl` logical, `th` HTML text, `tw` wiki text, `tl` link, `e#VALUE!`, `e#DIV/0!`, … |
| `errors` | Error text from parsing or calculation |
| `comment` | Cell comment |
| `bt br bb bl` | Border style numbers (index into `sheet.borderstyles`) |
| `layout`, `font`, `color`, `bgcolor`, `cellformat` | Style numbers (indexes into `sheet.layouts`, `fonts`, `colors`, `cellformats`) |
| `nontextvalueformat`, `textvalueformat` | Value-format numbers (index into `sheet.valueformats`) |
| `colspan`, `rowspan` | Merge size, on the top-left cell only |
| `cssc`, `csss` | Custom CSS class / style |
| `mod` | `"y"` allows modification in live "view" recalc |
| `displaystring`, `parseinfo` | Caches (rendered HTML, parsed formula); not saved |

Styles are **interned**. A cell stores a number, and the sheet keeps the list plus a hash for reverse lookup:
- `sheet.fonts` / `sheet.fonthash`
- `sheet.colors` / `sheet.colorhash`

Use `SocialCalc.GetStyleNum(sheet, "font", "italic bold 12pt Arial")` and `GetStyleString(sheet, "font", n)` to convert between the two.

### `SocialCalc.Sheet`

`new SocialCalc.Sheet()` calls `ResetSheet`, which sets up:

| Property | Meaning |
|---|---|
| `cells` | `{ coord: Cell }` |
| `attribs` | Sheet attributes: `lastcol`, `lastrow`, `defaultcolwidth`, `defaultfont`, `defaultcolor`, `recalc`, `needsrecalc`, `circularreferencecell`, … |
| `colattribs` | `{ width: { B: "120" }, hide: {} }` (keyed by column letter) |
| `rowattribs` | `{ height: {}, hide: {} }` (keyed by row number) |
| `names` | `{ NAME: { desc, definition } }`. `definition` is `"B5"`, `"A1:B7"` or `"=formula"` |
| `layouts`, `fonts`, `colors`, `borderstyles`, `cellformats`, `valueformats` | Interned style lists (plus `*hash` lookups) |
| `changes` | `UndoStack` |
| `copiedfrom` | Set when the sheet is clipboard contents |
| `statuscallback(data, status, arg, params)`, `statuscallbackparams` | Progress callback for commands and recalc (see [§6](#6-command-language), [§7](#7-recalculation)) |

The `Sheet.prototype` methods are thin wrappers around the `SocialCalc.*` functions, e.g. `sheet.CreateSheetSave()` → `SocialCalc.CreateSheetSave(sheet)`. The wrapped functions are:
- `ParseSheetSave`, `CreateSheetSave`, `CellToString`, `CanonicalizeSheet`
- `EncodeCellAttributes`, `DecodeCellAttributes`, `EncodeSheetAttributes`, `DecodeSheetAttributes`
- `ScheduleSheetCommands`, `SheetUndo`, `SheetRedo`, `RecalcSheet`
- `GetStyleNum`, `GetStyleString`, `CreateAuditString`

`EncodeCellAttributes` / `DecodeCellAttributes` convert a cell's styles to and from a flat attribute object. This is the easiest way to build a formatting UI.

### `SocialCalc.UndoStack` and `SocialCalc.Clipboard`

- **`UndoStack`**: the undo/redo history.
  - Each change is pushed with `PushChange(type)`, then filled with `AddDo(...)` and `AddUndo(...)` command strings.
  - `Undo()` and `Redo()` move a top-of-stack pointer (`tos`).
  - The "did" stack doubles as an audit trail.
- **`Clipboard.clipboard`**: one clipboard shared by every sheet on the page. It holds a sheet save string with a `copiedfrom:` line.

---

## 5. Sheet save format

`CreateSheetSave(sheet, range?, canonicalize?)` produces a line-based text format; `ParseSheetSave(str, sheet)` loads it.

```
version:1.5
cell:A1:v:100
cell:B1:t:Total
cell:A2:v:250
cell:A3:vtf:n:350:SUM(A1\cA2):ntvf:1
sheet:c:2:r:3
valueformat:1:#,##0.00
```

Values are escaped with `SocialCalc.encodeForSave`: `:` → `\c`, `\` → `\b`, newline → `\n`. `decodeFromSave` reverses it.

| Line | Fields |
|---|---|
| `version:` | Format version (the writer emits `1.5`) |
| `cell:coord:…` | Pairs of `type:value`. Value types:<br>• `v:number`<br>• `t:text`<br>• `vt:type:value`<br>• `vtf:type:value:formula`<br>• `vtc:type:value:sourcetext`<br>• `e:errortext`<br><br>Style references:<br>• `b:top:right:bottom:left`<br>• `l:layout`, `f:font`, `c:color`, `bg:color`<br>• `cf:cellformat`, `tvf:valueformat`, `ntvf:valueformat`<br><br>Other:<br>• `colspan:n`, `rowspan:n`<br>• `cssc:class`, `csss:style`<br>• `mod:y`, `comment:text` |
| `col:B:…` | `w:width` (number, `auto`, `n%`, or blank), `hide:yes` |
| `row:12:…` | `hide:yes` |
| `sheet:…` | Sizes: `c:lastcol`, `r:lastrow`, `w:defaultcolwidth`<br>Default styles: `tf`, `ntf`, `layout`, `font`, `tvf`, `ntvf`, `color`, `bgcolor`<br>Recalc state: `circularreferencecell:coord`, `recalc:off`, `needsrecalc:yes` |
| `name:NAME:desc:value` | Named range or formula (`B5`, `A1:B7`, `=formula`) |
| `font:n:style weight size family` | `*` means default for that part |
| `color:n:rgb(r,g,b)` | |
| `border:n:thickness style color` | |
| `layout:n:padding:…;vertical-align:…;` | |
| `cellformat:n:left\|center\|right` | |
| `valueformat:n:format` | Number format string or text format (`text-wiki`, …) |
| `copiedfrom:A1:B2` | Only in clipboard contents |

### Other formats

```js
SocialCalc.ConvertSaveToOtherFormat(save, "csv");   // also "tab", "html" (html needs a DOM), "scsave"
SocialCalc.ConvertOtherFormatToSave("Item,Qty\nPen,3\n", "csv");
// "version:1.5\ncell:A1:t:Item\ncell:B1:t:Qty\ncell:A2:t:Pen\ncell:B2:v:3\nsheet:c:2:r:2\ncopiedfrom:A1:B2\n"
```

The spreadsheet control and workbook add two more layers on top of the sheet format:
- **Spreadsheet save:** multi-part MIME with `sheet`, `editor` and `audit` parts. See [§12](#12-spreadsheet-control).
- **Workbook save (MSC):** a JSON document of several sheets. See [§13](#13-workbooks-multi-sheet).

---

## 6. Command language

Every change to a sheet is expressed as a text command. This is what makes undo, audit trails, collaboration broadcasts and AI-generated edits possible.

### Four ways to run commands

| Call | Behaviour |
|---|---|
| `SocialCalc.ExecuteSheetCommand(sheet, cmd, saveundo)` | **Synchronous**, one command. `cmd` is a string or a `SocialCalc.Parse`. Returns error text, or nothing on success. Does not recalc. |
| `SocialCalc.ScheduleSheetCommands(sheet, cmds, saveundo, isRemote)` | **Asynchronous**, time-sliced. `cmds` may contain several commands separated by `\n`, recorded as **one** undo step. Calls `sheet.statuscallback` with `cmdstart` and `cmdend`, and broadcasts via `SocialCalc.Callbacks.broadcast` unless `isRemote`. Does **not** recalc by itself. |
| `editor.EditorScheduleSheetCommands(cmds, saveundo, ignorebusy)` | What the UI uses. Ignored while a cell is being typed in, queued while the editor is busy. Also accepts `undo` and `redo`. Triggers recalc and re-render when needed. |
| `spreadsheet.ExecuteCommand(template, sstr)` | Toolbar helper. Replaces `%C` (cell or range), `%R` (range), `%W` (column range), `%S` (`sstr`), `%N` (newline) and `%P` (`%`), then calls the editor. |

### Commands

| Command | Example |
|---|---|
| `set <cell\|range> value n <number>` | `set A1 value n 100` |
| `set <cell\|range> text <type> <text>` | `set B1 text t Hello` (text is save-encoded) |
| `set <cell\|range> formula <formula>` | `set A3 formula SUM(A1:A2)` (no `=`) |
| `set <cell\|range> constant <type> <value> <source>` | `set C1 constant n$ 1.2 $1.20` |
| `set <cell\|range> empty` | `set A1 empty` |
| `set <cell\|range> bt\|br\|bb\|bl <thickness style color>` | `set A2 bt 1px solid rgb(0,0,0)` |
| `set <cell\|range> color\|bgcolor <color>` | `set A1 bgcolor rgb(255,0,0)` |
| `set <cell\|range> font <style weight size family>` | `set B1 font italic bold 12pt Arial` (`*` = default) |
| `set <cell\|range> cellformat left\|center\|right` | `set B1 cellformat center` |
| `set <cell\|range> layout <css>` | padding and vertical-align |
| `set <cell\|range> nontextvalueformat <format>` | `set A1 nontextvalueformat #,##0.00` |
| `set <cell\|range> textvalueformat <format>` | `set A1 textvalueformat text-wiki` |
| `set <cell\|range> cssc\|csss\|mod\|comment <value>` | `set A1 comment Check this` |
| `set <cell\|range> all <cell-save-string>` | Restores a whole cell |
| `set <col\|col:col> width <n\|auto\|blank>` | `set B width 120` |
| `set sheet <attr> <value>` | Attributes:<br>• `defaultcolwidth`, `defaultcolor`, `defaultbgcolor`<br>• `defaultlayout`, `defaultfont`<br>• `defaulttextformat`, `defaultnontextformat`<br>• `defaulttextvalueformat`, `defaultnontextvalueformat`<br>• `lastcol`, `lastrow`, `recalc on\|off` |
| `erase\|cut\|copy <range> all\|formulas\|formats` | `copy A1:A4 formulas` |
| `paste <cell\|range> all\|formulas\|formats` | `paste H1 formulas` |
| `fillright\|filldown <range> all\|formulas\|formats` | `filldown A1:A10 all` |
| `loadclipboard <save-encoded data>` / `clearclipboard` | |
| `insertrow\|insertcol <cell>` | `insertrow A2` (formulas are adjusted) |
| `deleterow\|deletecol <range>` | `deletecol C5:E7` |
| `movepaste\|moveinsert <range> <dest> all\|formulas\|formats` | `movepaste A1:B5 A8 all` |
| `merge <range>` / `unmerge <cell>` | `merge C3:F3` |
| `sort <range> <col> up\|down [<col> up\|down …]` | See [known issues](#20-known-issues-and-gotchas) |
| `name define\|desc\|delete <NAME> [value]` | `name define TOTAL A3` |
| `recalc`, `redisplay`, `changedrendervalues` | |
| `startcmdextension <name> <rest>` | Runs a registered extension (see [§16](#16-extension-points-and-callbacks)) |

Row attributes (height, hide) are not settable through `set`; the source marks them as unimplemented.

### Undo and redo

Pass `saveundo = true`, then call `SocialCalc.SheetUndo(sheet)` / `SheetRedo(sheet)`. In the UI, call `editor.EditorScheduleSheetCommands("undo")`. Undo entries are themselves command strings.

---

## 7. Recalculation

`SocialCalc.RecalcSheet(sheet)` recalculates asynchronously, in time slices, so large sheets do not freeze the page. `SocialCalc.RecalcInfo` controls the slicing:
- `maxtimeslice`: 100 ms of work per slice
- `timeslicedelay`: 1 ms pause between slices

The steps:

1. `RecalcCheckCell` walks every formula, building a calc order from its dependencies.
   - If it finds a circular reference, it sets `sheet.attribs.circularreferencecell`.
2. Cells are evaluated in that order.
3. If a formula references another sheet that isn't loaded, recalc pauses. `RecalcInfo.LoadSheet(sheetname)` is called:
   - Return `true` if you started loading it.
   - When the data arrives, call `SocialCalc.RecalcLoadedSheet(sheetname, saveString, recalcNeeded)`.
   - Loaded sheets are kept in `SocialCalc.Formula.SheetCache`.

`sheet.statuscallback(data, status, arg)` reports progress:

| `status` | `arg` |
|---|---|
| `calcstart` | — |
| `calcorder` | `{ coord, total, count }` |
| `calccheckdone` | number of cells to calculate |
| `calcstep` | `{ coord, total, count }` |
| `calcloading` | `{ sheetname }` |
| `calcserverfunc` | `{ funcname, coord, total, count }` |
| `calcfinished` | elapsed milliseconds |
| `cmdstart` / `cmdend` | (from `ScheduleSheetCommands`) command string / — |

Timers go through `window.setTimeout`. In plain Node, set `globalThis.window ??= globalThis` before recalculating.

`SocialCalc.WorkBookRecalculateAll()` (in `workbook.js`) recalculates every sheet in a workbook, from last to first, in two passes.

---

## 8. Formula engine

### Pipeline

```
"SUM(A1:A3)*2"
   └─ Formula.ParseFormulaIntoTokens(text)      → [{ text, type, opcode }, …]
       └─ Formula.ConvertInfixToPolish(tokens)  → RPN token order
           └─ Formula.EvaluatePolish(...)       → { value, type, error }
```

`Formula.evaluate_parsed_formula(tokens, sheet, allowrangereturn)` runs the last two steps:

```js
const tokens = SocialCalc.Formula.ParseFormulaIntoTokens("SUM(A1:A2)*2");
SocialCalc.Formula.evaluate_parsed_formula(tokens, sheet, false); // { value: 700, type: "n", error: null }
```

### Syntax

| Element | Notes |
|---|---|
| Numbers, `"strings"`, `TRUE`/`FALSE` | |
| References | `A1`, `$A$1`, ranges `A1:B7` |
| Other sheets | `Sheet2!A1`. Quoted names like `'My Sheet'!A1` are **not** supported. |
| Names | Defined with `name define TOTAL A3`, used as `TOTAL*2` |
| Operators, by precedence | `!` › `:` `,` › unary `-` `+` › `%` (postfix) › `^` › `*` `/` › `+` `-` › `&` (concatenate) › `=` `<>` `<` `>` `<=` `>=` |
| Errors | `#VALUE!`, `#DIV/0!`, `#NAME?`, `#N/A`, … (valuetype `e#…`). Unknown functions give the error text `Unknown function NAME.` |

### Built-in functions (109)

| Class | Functions |
|---|---|
| Statistics (`stat`) | AVERAGE, COUNT, COUNTA, COUNTBLANK, COUNTIF, DAVERAGE, DCOUNT, DCOUNTA, DGET, DMAX, DMIN, DPRODUCT, DSTDEV, DSTDEVP, DSUM, DVAR, DVARP, MAX, MIN, PRODUCT, STDEV, STDEVP, SUM, SUMIF, VAR, VARP |
| Math (`math`) | ABS, ACOS, ASIN, ATAN, ATAN2, COS, DEGREES, EVEN, EXP, FACT, INT, LN, LOG, LOG10, MOD, N, ODD, PI, POWER, RADIANS, ROUND, SIN, SQRT, TAN, TRUNC |
| Test (`test`) | AND, FALSE, IF, ISBLANK, ISERR, ISERROR, ISLOGICAL, ISNA, ISNONTEXT, ISNUMBER, ISTEXT, NA, NOT, OR, TRUE |
| Text (`text`) | EXACT, FIND, LEFT, LEN, LOWER, MID, PROPER, REPLACE, REPT, RIGHT, SUBSTITUTE, T, TRIM, UPPER, VALUE |
| Date & Time (`datetime`) | DATE, DAY, HOUR, MINUTE, MONTH, NOW, SECOND, TIME, TODAY, WEEKDAY, YEAR |
| Financial (`financial`) | DDB, FV, IRR, NPER, NPV, PMT, PV, RATE, SLN, SYD |
| Lookup (`lookup`) | CHOOSE, COLUMNS, HLOOKUP, INDEX, MATCH, ROWS, VLOOKUP |

Not built in: `CONCATENATE` (use `&`), `TEXT`, `IFERROR`, `SUMIFS`/`COUNTIFS`, `SUMPRODUCT`. You can add them; see [Recipe: add a function](#add-a-spreadsheet-function).

### Function registry

```js
SocialCalc.Formula.FunctionList["NAME"] = [subroutine, nargs, argdef, description, classes];
```

| Slot | Meaning |
|---|---|
| `subroutine(fname, operand, foperand, sheet)` | Pop arguments from `foperand` (first argument first). Push the result with `Formula.PushOperand(operand, type, value)`. Return `null`, or error text. |
| `nargs` | `0` none, `n > 0` exactly n, `n < 0` at least \|n\|, `100` unchecked. The engine checks this before calling you. |
| `argdef` | Key into `Formula.FunctionArgDefs` (e.g. `"v"` → `"value"`, `"pmt"` → `"rate, n, pv, [fv, [paytype]]"`) |
| `description` | Help text. If empty, `Constants["s_fdef_" + NAME]` is used. |
| `classes` | Comma-separated class names for the function picker |

Helpers for writing functions:
- `OperandValueAndType(sheet, stack)`, `OperandAsNumber`, `OperandAsText`, `OperandAsCoord`, `OperandsAsRangeOnSheet`
- `FunctionArgsError(fname, operand)`, `FunctionSpecificError(...)`, `CheckForErrorValue(...)`

`Formula.FillFunctionInfo()` builds `FunctionClasses` and the argument help strings for the UI. It only runs once, so register custom functions before the function picker is first used.

---

## 9. Number formatting

```js
SocialCalc.FormatNumber.formatNumberWithFormat(rawvalue, formatString, currencyChar);
```

| Value | Format | Result |
|---|---|---|
| `1234.567` | `#,##0.00` | `1,234.57` |
| `0.256` | `0.0%` | `25.6%` |
| `1234567` | `$#,##0` | `$1,234,567` |
| `43831` | `yyyy-mm-dd` | `2020-01-01` |
| `-5` | `[red]#,##0;[blue](#,##0)` | `<span style="color:#0000FF;">(5)</span>` |
| `45` | `[>=100]0;[<100]0.0` | `45.0` |
| `12.3456` | `General` | `12.3456` |

**Format syntax:**

- **Digit placeholders and grouping:** `0`, `#` and `?` are digit placeholders; `.` is the decimal point; `,` is the thousands separator; `%` multiplies by 100.
- **Sections:** separated by `;` (positive; negative; zero; text). Conditions such as `[>100]` or `[<=0]` pick the section.
- **Colors:** `[BLACK]`, `[BLUE]`, `[CYAN]`, `[GREEN]`, `[MAGENTA]`, `[RED]`, `[WHITE]`, `[YELLOW]`, or `[style=css]`.
- **Currency:** `$` or `[$€]`. `Constants.FormatNumber_defaultCurrency` sets the default.
- **Dates:** `yy` or `yyyy` for the year; `m`, `mm`, `mmm` (Jan), `mmmm` (January) or `mmmmm` (J) for the month; `d`, `dd`, `ddd` (Sun) or `dddd` (Sunday) for the day.
- **Times:** `h`, `hh`, `m`, `mm`, `s`, `ss`, and `AM/PM` or `A/P`. In a time, `m` and `mm` are read as minutes. Elapsed time uses `[h]`, `[mm]` and `[ss]`.
- **Escapes and padding:** `\x` is a literal character; `*` and `_` are fill and padding markers.

Dates are **serial day numbers**, Excel-compatible: `43831` = 2020-01-01, and `DATE(2024,2,29)` = `45351`. Conversion is done by `FormatNumber.convert_date_gregorian_to_julian` / `convert_date_julian_to_gregorian` with `datevalues.julian_offset = 2415019`.

For localization, change the separators, day names and month names:
- `FormatNumber.separatorchar`, `decimalchar`
- `daynames`, `monthnames`
- the matching `Constants` entries

`SocialCalc.DetermineValueType(text)` does the reverse: it recognises typed input.

```js
DetermineValueType("$1,234.50") // { value: 1234.5, type: "n$" }
DetermineValueType("12%")       // { value: 0.12,  type: "n%" }
DetermineValueType("1/2/2020")  // { value: 43832, type: "nd" }
DetermineValueType("TRUE")      // { value: 1,     type: "nl" }
```

---

## 10. Rendering and value display

`new SocialCalc.RenderContext(sheet)` turns a sheet into an HTML `<table>`:

```js
const context = new SocialCalc.RenderContext(sheet);
context.showGrid = true;
context.showRCHeaders = true;
const table = context.RenderSheet(null, { type: "html" }); // HTMLTableElement (needs a DOM)
```

| Property / method | Purpose |
|---|---|
| `rowpanes`, `colpanes` | `[{ first, last }]` frozen and scrolling panes |
| `highlights` | `{ coord: "cursor" \| "range" \| … }` |
| `cellskip`, `coordToCR` | Merged-cell bookkeeping (`CalculateCellSkipData`) |
| `colwidth`, `totalwidth` | Column sizes (`CalculateColWidthData`) |
| `PrecomputeSheetFontsAndLayouts()` | Resolves interned styles to CSS |
| `RenderSheet`, `RenderRow`, `RenderCell`, `RenderColHeaders`, `RenderSizingRow`, `RenderSpacingRow`, `RenderColGroup` | Produce the DOM |

Cell text goes through two functions:
- `SocialCalc.FormatValueForDisplay(sheet, value, coord, linkstyle)` formats a cell value using the cell's formats.
- `format_text_for_display(raw, valuetype, valueformat, sheet, linkstyle)` formats text values.

Text value formats:

| Format | Rendering |
|---|---|
| `text-plain` | Escaped plain text (default) |
| `text-html` | Raw HTML |
| `text-wiki` | Wiki markup, via `Callbacks.expand_wiki` / `expand_markup` |
| `text-link`, `text-url` | Links (`ParseCellLinkText` understands `desc<url>` and `[page]` forms) |
| `text-image` | `<img>` from the URL |
| `text-custom:<template>` | Custom HTML: `@r` = raw text, `@s` = HTML-escaped text, `@u` = URL-encoded text |
| `hidden` | Nothing |
| `formula` | Shows what was typed (the formula with `=`) instead of the value |
| `forcetext` | Shows what was typed as plain text: the formula with `=`, a constant's source text, or the value |

When a cell has no text format, its valuetype picks one: `th` → `text-html`, `tw` or `tr` → `text-wiki`, `tl` → `text-link`, otherwise `text-plain`.

Other DOM helpers live here too:
- `GetViewportInfo`, `GetElementPosition`, `GetElementPositionWithScroll`
- `LookupElement`, `AssignID`, `setStyles`

---

## 11. Table editor (interactive grid)

`new SocialCalc.TableEditor(context)` wraps a `RenderContext` with editing. `editor.CreateTableEditor(width, height)` returns its DOM element. The spreadsheet control does this for you.

**State**

| Property | Meaning |
|---|---|
| `ecell` | `{ coord, row, col }` cursor cell |
| `range`, `range2` | Selection (`hasrange`, `top`, `left`, `bottom`, `right`) |
| `state` | Keyboard state: `start` (navigating), `input` (typing into a cell), `inputboxdirect` (typing in the formula bar) |
| `busy`, `deferredCommands` | Command queue while recalculating |
| `workingvalues` | Scratch values during edits (`ecoord`, `currentsheet`, …) |
| `rowpositions`, `colpositions`, `firstscrollingrow`, … | Layout, from `CalculateEditorPositions` |
| `noEdit` | Read-only mode |

**Callbacks you can set:**
- `recalcFunction(editor)`
- `ctrlkeyFunction(editor, charname)` for ctrl-C/V/X/Z handling
- `StatusCallback[name] = { func, params }`
- `MoveECellCallback[name] = fn(editor)`

**Main methods:**
- **Rendering:** `EditorRenderSheet`, `ScheduleRender`, `SchedulePositionCalculations`, `FitToEditTable`, `ResizeTableEditor`
- **Commands:** `EditorScheduleSheetCommands`
- **Cursor and selection:** `MoveECell(coord)`, `MoveECellWithKey`, `RangeAnchor`, `RangeExtend`, `RangeRemove`, `EnsureECellVisible`
- **Scrolling:** `ScrollRelative`, `ScrollRelativeBoth`, `PageRelative`, `ScrollTableUpOneRow` (and the matching Down/Left/Right functions)
- **Editing:** `EditorSaveEdit`, `EditorProcessKey`, `EditorApplySetCommandsToRange`
- **Settings:** `SaveEditorSettings`, `LoadEditorSettings`

**Input flow**

- **Mouse:**
  - `EditorMouseRegister` attaches `ProcessEditorMouseDown/Move/Up/DblClick` to the grid.
  - `GridMousePosition(editor, x, y)` maps the pointer to a cell, header or footer.
  - Dragging into the borders auto-scrolls.
- **Touch** (`touch.js`): touch events become synthetic mouse events on `editor.fullgrid`. Swipes scroll, and taps select or edit.
- **Keyboard** (`editor-widgets.js`):
  - `KeyboardSetFocus(editor)` makes that editor receive keys.
  - Key events are normalised through `keyboardTables` to names like `[enter]` or `[ctrl-c]`.
  - They are dispatched with `ProcessKey(ch, e)` → `editor.EditorProcessKey`.
- **InputBox / InputEcho:** the formula-bar text box and the floating echo that appears while typing.
  - `InputBoxDisplayCellContents` fills the box for the current cell.
  - If `SocialCalc.isCellEditModalEnabled()` returns true (set by `CellEditModal` integration), the built-in input box and formula bar are hidden, so the React modal can take over.
- **Editor actions** used by the app's formatting UI act on the cell last shown in the input box:
  - `EditorChangecolorFromWidget(editor, color)`
  - `EditorChangefontFromWidget(editor, "a"|"b"|"c"|"d")` for 12/14/16/18px
  - `EditorCut(editor, "a"|"b"|"c"|"d")` for cut/copy/paste/erase
  - `EditorChangeSheetcolor`, `EditorChangeSheetfont`, `EditorClearSheet`

**Widgets** (`editor-widgets.js`):
- **`CellHandles`:** fill and move handles around the cursor.
- **`TableControl`:** scrollbars and pane sliders.
- **Registries** (a registry maps a DOM element to handler functions):
  - `DragRegister` / `DragUnregister`
  - `TooltipRegister`
  - `ButtonRegister` (hover, press and auto-repeat)
  - `MouseWheelRegister`

---

## 12. Spreadsheet control

`SocialCalc.SpreadsheetControl` is the complete spreadsheet UI: toolbar tabs, formula bar, grid and status line.

```js
const spreadsheet = new SocialCalc.SpreadsheetControl();         // creates sheet, context and editor
spreadsheet.InitializeSpreadsheetControl(node, height, width, spacebelow); // 0 = fit to window
spreadsheet.ExecuteCommand("set %C bgcolor %S", "rgb(255,255,0)");
```

| Member | Purpose |
|---|---|
| `sheet`, `context`, `editor` | The `Sheet`, `RenderContext` and `TableEditor` |
| `tabs`, `tabnums`, `currentTab` | Toolbar tabs. Built in: `edit`, `settings`, `sort`, `audit`, `comment`, `names`, `clipboard`. Push objects `{ name, text, html, view, oncreate, onclick, onunclick }` to add tabs. |
| `views` | Named panels shown by tabs (`sheet` is always present) |
| `idPrefix` | DOM id prefix, `"SocialCalc-"` |
| `DoOnResize()`, `SizeSSDiv()` | Resize handling |
| `CreateSheetHTML()`, `CreateCellHTML(coord)` | HTML export |
| `CreateSpreadsheetSave(otherparts)` / `DecodeSpreadsheetSave(str)` | Multi-part save of `sheet`, `editor` settings and `audit` trail |
| `ExportCallback` | Called by the Clipboard tab's export button |

Other pieces in this file:
- **`SocialCalc.GetSpreadsheetControlObject()`:** returns the active control. Only one is active at a time (`CurrentSpreadsheetControlObject`).
- **`SettingsControls`:** the Format panel's controls. `SettingsControls.Controls` maps the control types `PopupList`, `ColorChooser` and `BorderSide` to their functions (e.g. `SettingsControls.PopupListInitialize`), and `CurrentPanel` is the open panel. `SettingsControlSave(target)` reads the panel and applies it as `set` commands, through `DecodeCellAttributes` or `DecodeSheetAttributes`.
- **Tab handlers:** Sort (`SpreadsheetControlSort*`), Comment, Names and Clipboard each have their own group of functions.

---

## 13. Workbooks (multi-sheet)

A workbook ties several sheets to one `SpreadsheetControl`. Formulas can reference other sheets by name.

```js
const workbook = new SocialCalc.WorkBook(spreadsheet);
workbook.InitializeWorkBook("sheet1");
const control = new SocialCalc.WorkBookControl(workbook, "workbookControl", "sheet1");
control.InitializeWorkBookControl();                // adds the sheet bar
SocialCalc.GetCurrentWorkBookControl();             // the active control (singleton)
```

### Workbook commands

```js
control.ExecuteWorkBookControlCommand({ cmdtype: "wcmd", id: "0", cmdstr: "activatesheet sheet2" }, false);
```

- **Workbook commands (`wcmd`):** `activatesheet`, `addsheet`, `addsheetstr`, `delsheet`, `rensheet`, `hidesheet`, `unhidesheet`.
- **Sheet commands (`scmd`):** `{ cmdtype: "scmd", id: sheetid, cmdstr }` sends a sheet command to a specific sheet.

**UI entry points:**
- **Sheet operations:** `WorkBookControlAddSheet`, `WorkBookControlDelSheet`, `WorkBookControlRenameSheet`, `WorkBookControlHideSheet`, `WorkBookControlUnhideSheet`, `WorkBookControlActivateSheet(sheetid)`
- **Reordering and duplication:** `WorkBookControlMoveLeft` / `MoveRight`, `WorkBookControlCopySheet` / `PasteSheet`
- **Workbooks:** `WorkBookControlNewBook`
- **Sheet bar:** `SheetBar*` functions draw the tabs and their menus.

### Workbook save format (MSC)

```js
const json = SocialCalc.WorkBookControlSaveSheet();   // JSON string
SocialCalc.WorkBookControlLoad(data);                 // data: { msc: {...} }, the msc object, or a JSON string
```

```json
{
  "numsheets": 2,
  "currentid": "sheet1",
  "currentname": "Invoice",
  "sheetArr": {
    "sheet1": { "sheetstr": { "savestr": "<spreadsheet save>" }, "name": "Invoice", "hidden": "0" },
    "sheet2": { "sheetstr": { "savestr": "<spreadsheet save>" }, "name": "Items", "hidden": "0" }
  },
  "EditableCells": { "allow": true, "cells": { "sheet1!B2": true }, "constraints": {} },
  "timestamp": "…"
}
```

`WorkBookControlInsertWorkbook(savestr)` merges another workbook in. Sheets with the same name are overwritten.

### Other workbook services

- **Recalc:** `WorkBookRecalculateAll()` recalculates every sheet. `SpinnerWaitCreate()` / `SpinnerWaitHide()` show a loading spinner (`/assets/images/spinner.gif`).
- **User scripts:** `ScriptInfo`, `EvalUserScripts`, `CallOutOnRenderCell`.
- **Data access:** `GetCellDataValue(coord)` / `GetCellDataArray(...)` read values across sheets.
- **HTML export:** `WorkbookControlCreateSheetHTML()` renders every sheet to HTML with print page breaks.
- **Editable-cell templates:** `SocialCalc.EditableCells` (see [§16](#16-extension-points-and-callbacks)).

---

## 14. Popup widgets

`SocialCalc.Popup` is a small framework for dropdown controls used by the settings panels.

```js
// Same pattern the Format panel uses (spreadsheet-control.js)
SocialCalc.Popup.Create("ColorChooser", "my-element-id", {});
SocialCalc.Popup.Initialize("my-element-id", {
  attribs: {
    title: "Background",
    moveable: true,
    width: "106px",
    changedcallback: (attribs, id, newvalue) => console.log(id, newvalue),
  },
});
SocialCalc.Popup.SetValue("my-element-id", "rgb(255,0,0)"); // also calls changedcallback
SocialCalc.Popup.GetValue("my-element-id");

// Lists take options: [{ o: "display text", v: "value" }, ...] plus the same attribs
```

- **Types:** `Popup.Types.List` and `Popup.Types.ColorChooser`. Each implements `Create`, `Initialize`, `SetValue`, `GetValue`, `SetDisabled`, `Show`, `Hide`, `Cancel` and `Reset`.
- **State:** `Popup.Controls[id]` holds each control's `{ type, value, data }`. `Popup.Current.id` is the open one.
- **Customization:** `Popup.imagePrefix` sets where images load from. `Popup.LocalizeString` is the override for translation.
- **Color helpers:** `RGBToHex`, `HexToRGB`, `makeRGB`, `splitRGB`.

---

## 15. Constants and localization

`SocialCalc.Constants` (`constants.js`) holds about 360 user-visible strings (`s_*`) and the visual defaults, grouped by the module that uses them:
- main engine
- table editor
- spreadsheet control and Format panel
- viewer
- FormatNumber
- formulas

**Change constants before the objects that use them are created.** The exceptions are `TooltipOffsetX` and `TooltipOffsetY`, which are read when the code loads.

Constant name prefixes:

| Prefix | Used for |
|---|---|
| `s_loc_*` (~130) | UI strings looked up by `LocalizeString` |
| `s_fdef_NAME`, `s_farg_*`, `s_fclass_*` | Function descriptions, argument help and class names |
| `s_calcerr*`, `s_escUnknownCmd`, … | Error messages |
| `default*Style` / `default*Class` | CSS for cursor, headers, comments, panes |
| `SC*` | Spreadsheet control sizes and CSS (toolbar, tabs, formula bar, status line) |

Localization helpers (`spreadsheet-control.js`):

```js
SocialCalc.LocalizeString("Sort");   // looks up Constants.s_loc_sort, else returns "Sort"
SocialCalc.LocalizeSubstrings("%loc!Sort! %ssc!defaultImagePrefix!");
// %loc!text! → localized text, %ssc!name! → Constants[name]
```

Two helpers switch styling:
- `SocialCalc.ConstantsSetClasses(prefix)` moves from inline styles to CSS classes. It sets each `xyzClass` from `ConstantsDefaultClasses` and clears the matching `xyzStyle`.
- `Constants.defaultImagePrefix` is the URL prefix for toolbar and grid images.

---

## 16. Extension points and callbacks

### `SocialCalc.Callbacks`

| Callback | Defined in | Purpose |
|---|---|---|
| `expand_wiki(value, sheet, linkstyle, valueformat)` | `sheet.js` (null) | Render `text-wiki` cells |
| `expand_markup(value, sheet, linkstyle)` | `sheet.js` | Default markup expansion |
| `MakePageLink(page, workspace, linkstyle, valueformat)` | `sheet.js` (null) | Build hrefs for page links |
| `NormalizeSheetName(name)` | `sheet.js` (null → lowercase) | Share cache entries between spellings of a sheet name |
| `IsCellEditable(editor)` | `workbook.js` | Blocks editing and cutting of locked template cells |
| `IsCoordEditable("sheet!coord")` | `workbook.js` | Same check by coordinate |
| `ToggleCell(coord)` | `workbook.js` | Toggles a checkmark in cells with a `tc` constraint |
| `broadcast(type, data)` | `environment.js` (no-op) | Receives every scheduled command, for collaboration or sync |

### Editable-cell templates

```js
SocialCalc.EditableCells = {
  allow: true,                              // false (default) = everything editable
  cells: { "sheet1!B2": true, "B3": true }, // editable cells when allow is true
  constraints: { "sheet1!C4": ["tc"] },     // per-cell constraints ("tc" = toggle checkmark)
};
```

`IsCellEditable` accepts four key forms:
- `currentsheet!COORD`
- `lowercase-sheet!COORD`
- `sheet1!COORD`
- a bare `COORD`

`EditableCells` is saved and loaded with the workbook. If `allow` is true but no cells are listed, loading falls back to fully editable. The plugin in `../modules/editable-cells.js` manages this object.

### Custom sheet commands

Register a handler, then send `startcmdextension name rest-of-command`:

```js
SocialCalc.SheetCommandInfo.CmdExtensionCallbacks.mycmd = {
  func(cmdname, data, sheet, parseobj, saveundo) { /* read parseobj.RestOfString() */ },
  data: {},
};
```

While `SheetCommandInfo.cmdextensionbusy` is non-empty, the command loop waits. Call `SocialCalc.ResumeFromCmdExtension()` to continue.

### Other hooks

- **Editor callbacks:** `recalcFunction`, `ctrlkeyFunction`, `StatusCallback`, `MoveECellCallback` (see [§11](#11-table-editor-interactive-grid)).
- **Cross-sheet loading:** `RecalcInfo.LoadSheet` (see [§7](#7-recalculation)).
- **Functions:** add them through `Formula.FunctionList`.

---

## 17. Environment overrides and shims

`environment.js` loads last. It runs code that must come after everything else:

- **JSON polyfill** (json2.js, public domain): only installed if `JSON` is missing. The fork uses `JSON.parse` instead of `eval`.
- **App overrides:**
  - `SocialCalc.oldBtnActive = 1`
  - `Constants.defaultImagePrefix` and `Popup.imagePrefix` = `/assets/images/sc_`
  - `defaultGridCSS = ""`
  - `SCNoColNames` / `SCNoRowName = true`, which leave the built-in column letters and row numbers blank (the `row-col-headers` plugin can draw its own)
  - empty row-name styles
- **Helpers:**
  - `ToggleInputLineButtons(show)`
  - `InputLineClearText()`
  - `Callbacks.broadcast`, a no-op
- **Server stubs:** when `document` is undefined, these become no-ops so commands and recalc work headless:
  - `GetEditorCellElement`, `ReplaceCell`, `EditorRenderSheet`
  - `SpreadsheetControlSortSave`, `SpreadsheetControlStatuslineCallback`
  - `DoPositionCalculations`
- **webworker-threads shim:** maps `window.setTimeout` to `self.thread.nextTick`.

---

## 18. What the rest of the package uses

Most used from `../modules`, `../components` and the demo app:

| API | Uses | Defined in |
|---|---:|---|
| `GetCurrentWorkBookControl` | 44 | workbook.js |
| `rcColname` | 14 | render.js |
| `ScrollRelativeBoth` | 7 | table-editor.js |
| `Constants` | 7+ | constants.js |
| `GetCellDataValue` | 4 | workbook.js |
| `EditorSheetStatusCallback` | 4 | table-editor.js |
| `TouchInfo`, `ProcessTouchStart/Move/End/Cancel`, `HasTouch` | 3–4 | touch.js |
| `EditableCells` (`.constraints`) | 4+ | workbook.js |
| `WorkBookControlLoad`, `WorkBookControlActivateSheet`, `WorkBookControlSaveSheet` | 2–3 | workbook.js |
| `Sheet`, `Parse`, `ExecuteSheetCommand` | 2–3 | sheet.js |
| `RenderContext`, `GetCellContents`, `LookupElement`, `GetViewportInfo`, `encodeForSave` | 2–3 | render.js |
| `GridMousePosition`, `EditorMouseInfo`, `ProcessEditorMouseDown/Move/Up/DblClick`, `ScrollTableUpOneRow/DownOneRow` | 2–3 | table-editor.js |
| `ProcessKeyDown`, `ProcessKeyPress` | 2 | editor-widgets.js |

The modules also **add** properties that the core checks for:
- `SocialCalc.isCellEditModalEnabled`
- `isEditableCellsOnlyEnabled`
- `isAgentEnabled`
- `selectRow` / `selectColumn`
- `_activeEditor`

---

## 19. Recipes

### Embed the spreadsheet UI

This is the same sequence `initializeApp()` in `../modules/init.js` uses:

```js
const spreadsheet = new SocialCalc.SpreadsheetControl();
const workbook = new SocialCalc.WorkBook(spreadsheet);
workbook.InitializeWorkBook("sheet1");

spreadsheet.InitializeSpreadsheetControl(document.getElementById("tableeditor"), 0, 0, 0);
SocialCalc._activeEditor = spreadsheet.editor;
spreadsheet.ExecuteCommand("redisplay", "");

const control = new SocialCalc.WorkBookControl(workbook, "workbookControl", "sheet1");
control.InitializeWorkBookControl();
SocialCalc.WorkBookControlLoad(templateJson); // e.g. the contents of src/data/100001.json
```

### Edit through the UI path (undo, recalc, re-render)

```js
const control = SocialCalc.GetCurrentWorkBookControl();
const editor = control.workbook.spreadsheet.editor;
editor.EditorScheduleSheetCommands("set B2 value n 42\nset B3 formula B2*3", true, false);
editor.EditorScheduleSheetCommands("undo", true, false);
```

### Add a spreadsheet function

```js
const scf = SocialCalc.Formula;

scf.FunctionList.DOUBLE = [
  function (fname, operand, foperand, sheet) {
    const value = scf.OperandAsNumber(sheet, foperand);
    if (value.type.charAt(0) !== "n") return scf.FunctionArgsError(fname, operand);
    scf.PushOperand(operand, "n", value.value * 2);
    return null;
  },
  1,                          // exactly one argument (checked before the call)
  "v",                        // argument help: FunctionArgDefs.v → "value"
  "Returns twice the value.", // description
  "math",                     // shows up under Math in the function list
];

// =DOUBLE(A1) → 42 when A1 is 21; =DOUBLE("abc") → #VALUE!
```

### Localize a string

```js
// Before creating the SpreadsheetControl (results are cached after the first lookup):
SocialCalc.Constants.s_loc_sort = "Ordenar";
SocialCalc.LocalizeString("Sort"); // "Ordenar"
```

### Read and write cells headlessly

```js
SocialCalc.ExecuteSheetCommand(sheet, "set C1 formula PMT(0.05/12,360,200000)", false);
// …RecalcSheet as in the quick start…
SocialCalc.GetCellContents(sheet, "C1");   // "=PMT(0.05/12,360,200000)"
sheet.cells.C1.datavalue;                  // -1073.6432460242797
```

---

## 20. Known issues and gotchas

These exist in the engine today. They were found while documenting it and are **not** caused by the module split.

- **`sort` throws in ES-module builds.**
  - `ExecuteSheetCommand` assigns to an undeclared `slast` variable (`sheet.js`, `case "sort"`), which is a `ReferenceError` under strict mode.
  - All ES modules are strict, so this includes the Vite app.
  - Declaring `slast` in that block would fix it.
- **`EditorChangecontact`** (`table-editor.js`) uses the undeclared variables `cmdline`, `contactname`, etc., and throws the same way.
- **`InputLineClearText`** (`environment.js`) references a global `spreadsheet` variable that is not defined anywhere in the core.
- **`ToggleCell`** (`workbook.js`) inserts a hard-coded external checkmark image (`imageshack.com`).
- **Formatting quirks observed:**
  - `0.5` formatted with `h:mm AM/PM` gives `0:00 PM`.
  - Scientific formats (`0.00E+00`) mis-format small numbers.
- **Formula limits:**
  - No quoted sheet names in references.
  - Row height and hide can't be set with commands.
  - `1/0` stores `0` with valuetype `e#DIV/0!`, so check `valuetype`, not just `datavalue`.
- **Singletons:** one `SpreadsheetControl` and one `WorkBookControl` are "current" per page (`CurrentSpreadsheetControlObject`, `CurrentWorkbookControlObject`). Multiple independent spreadsheets on one page are not supported.
- **`alert()` calls** still exist for a missing module at load, a missing constant in `LocalizeSubstrings`, and "No active cell" in the color/font actions.
- **Timers:** recalc and command scheduling use `window.setTimeout`. In Node, provide `window` (see [§1](#1-quick-start)).
- **`FillFunctionInfo()` runs once.** Functions added afterwards still work in formulas, but won't appear in the function picker.

---

## 21. Working on the core

- **Keep the UMD wrapper and the shared-object pattern.** Do not add `import`/`export` inside these files; they are loaded as side-effect imports.
- **Private variables.** A variable declared at the top of a file (`var x` outside any function) is private to that file. Share state with other files through a `SocialCalc` property.
  - `CoordForColorChange` and `editCoord` are the only private variables shared by several functions, and they all live in `table-editor.js`.
- **New files.** Copy the wrapper from an existing file, give it a unique `root.SocialCalcXxx` name, and add it to `index.js` in the right position. It must come after anything it reads at load time, and before `environment.js`.
- **No React or Ionic in `core/`.** UI integration happens through `SocialCalc.*` hooks and `window` events from `../modules` and `../components`.
- **Checks before submitting a change**, from `AGENTS.md`:

  ```bash
  npm test -- --run
  npm run build
  node test-socialcalc.js
  ```

- Update this README, `../README.md` and `docs/src/docsData.ts` when public behaviour changes.

---

*Licensing:*
- The SocialCalc code is © Socialtext, Inc. and Software Garden, Inc., under the [Artistic License 2.0](http://socialcalc.org/licenses/al-20/). See the headers in each file.
- The JSON polyfill in `environment.js` is public domain (json2.js).
- Changes made in this package are covered by the package license.
