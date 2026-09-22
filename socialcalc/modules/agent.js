/**
 * SocialCalc AI Agent Plugin (Text Editor Agent)
 * 
 * Provides an extensible architecture for integrating AI agents and LLM APIs (Gemini,
 * OpenAI, Anthropic, or custom backends like Node.js / Python Tornado) directly with SocialCalc.
 * 
 * Capabilities:
 * 1. Context Extraction: Introspects active sheets, dimensions, cell contents, and app mappings.
 * 2. Prompt & Tool Schema Generation: Provides battle-tested system prompts and function definitions.
 * 3. Command Execution: Dispatches atomic SocialCalc sheet commands (set, erase, formula, mapping sets).
 * 4. Extensible Registry: Ready for future agent expansion (styling, formatting, borders, merge/unmerge).
 */

import { registerPlugin, getActiveEditor, getActiveSpreadsheet } from "./plugin-manager.js";
import { getAppMapping } from "./editable-cells.js";

import { SocialCalcRef } from "./runtime.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

function getSocialCalc() {
  if (typeof window !== "undefined" && window.SocialCalc) return window.SocialCalc;
  if (typeof global !== "undefined" && global.SocialCalc) return global.SocialCalc;
  return SocialCalc || {};
}

let _agentEnabled = true; // Enabled by default
let _agentConfig = {
  agentType: "text_editor", // Future: "styler", "analyst", "full"
  autoRecalc: true,
  saveUndo: true,
  maxContextCells: 500,
};

// Extensible action handlers registry
const _actionHandlers = new Map();

/**
 * Clean and encode cell string for SocialCalc command line
 */
function encodeCellValue(sc, rawStr) {
  if (sc && typeof sc.encodeForSave === "function") {
    return sc.encodeForSave(rawStr);
  }
  return String(rawStr)
    .replace(/\\/g, "\\b")
    .replace(/:/g, "\\c")
    .replace(/\n/g, "\\n");
}

/**
 * Enable the Agent Plugin
 */
export function enableAgent(options = {}) {
  _agentEnabled = true;
  if (options && typeof options === "object") {
    _agentConfig = { ..._agentConfig, ...options };
  }
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isAgentEnabled = () => true;
  }
}

/**
 * Disable the Agent Plugin
 */
export function disableAgent() {
  _agentEnabled = false;
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isAgentEnabled = () => false;
  }
}

/**
 * Check if the Agent Plugin is enabled
 */
export function isAgentEnabled() {
  return _agentEnabled;
}

/**
 * Toggle the Agent Plugin
 */
export function toggleAgent(forceState) {
  _agentEnabled = typeof forceState === "boolean" ? forceState : !_agentEnabled;
  if (typeof window !== "undefined") {
    window.SocialCalc = window.SocialCalc || {};
    window.SocialCalc.isAgentEnabled = () => _agentEnabled;
  }
  return _agentEnabled;
}

/**
 * Configure Agent Plugin settings
 */
export function configureAgent(config = {}) {
  _agentConfig = { ..._agentConfig, ...config };
}

/**
 * Get current active sheet ID from workbook control or editor
 */
export function getActiveSheetId() {
  const sc = getSocialCalc();
  if (sc.GetCurrentWorkBookControl) {
    const ctrl = sc.GetCurrentWorkBookControl();
    if (ctrl && ctrl.currentSheetButton && ctrl.currentSheetButton.id) {
      return ctrl.currentSheetButton.id;
    }
  }
  const editor = getActiveEditor();
  if (editor && editor.workingvalues && editor.workingvalues.currentsheet) {
    return editor.workingvalues.currentsheet;
  }
  return "sheet1";
}

/**
 * Extract active sheet object
 */
export function getActiveSheetObject(sheetId) {
  const sc = getSocialCalc();
  const targetId = sheetId || getActiveSheetId();
  if (sc.GetCurrentWorkBookControl) {
    const ctrl = sc.GetCurrentWorkBookControl();
    if (ctrl && ctrl.workbook && ctrl.workbook.sheetArr && ctrl.workbook.sheetArr[targetId]) {
      return ctrl.workbook.sheetArr[targetId].sheet;
    }
  }
  const spreadsheet = getActiveSpreadsheet();
  if (spreadsheet && spreadsheet.sheet) {
    return spreadsheet.sheet;
  }
  return null;
}

/**
 * Get list of all sheet names/IDs in the workbook
 */
export function getAllSheetIds() {
  const sc = getSocialCalc();
  if (sc.GetCurrentWorkBookControl) {
    const ctrl = sc.GetCurrentWorkBookControl();
    if (ctrl && ctrl.workbook && ctrl.workbook.sheetArr) {
      return Object.keys(ctrl.workbook.sheetArr);
    }
  }
  return ["sheet1"];
}

/**
 * Flatten appMapping for a specific sheet into an easily queryable structure
 */
export function extractMappingFields(appMapping, targetSheet = "sheet1") {
  const fields = {};
  const tables = {};
  let hasMappings = false;

  if (!appMapping || typeof appMapping !== "object") {
    return { hasMappings: false, fields, tables };
  }

  // Look for targetSheet, or case-insensitive match, or first sheet
  let sheetData = appMapping[targetSheet];
  if (!sheetData) {
    const lower = targetSheet.toLowerCase();
    const matchedKey = Object.keys(appMapping).find((k) => k.toLowerCase() === lower);
    if (matchedKey) sheetData = appMapping[matchedKey];
  }
  if (!sheetData && appMapping["sheet1"]) {
    sheetData = appMapping["sheet1"];
  }

  if (!sheetData || typeof sheetData !== "object" || Object.keys(sheetData).length === 0) {
    return { hasMappings: false, fields, tables };
  }

  hasMappings = true;

  for (const [topKey, topVal] of Object.entries(sheetData)) {
    if (!topVal || typeof topVal !== "object") continue;

    // Case 1: Form with nested formContent
    if (topVal.type === "form" && topVal.formContent && typeof topVal.formContent === "object") {
      for (const [fieldKey, fieldVal] of Object.entries(topVal.formContent)) {
        if (fieldVal && fieldVal.cell) {
          const coord = String(fieldVal.cell).toUpperCase().trim();
          const canonicalKey = `${topKey}.${fieldKey}`;
          fields[canonicalKey] = {
            section: topKey,
            fieldName: fieldKey,
            cell: coord,
            type: fieldVal.type || "text",
            editable: fieldVal.editable !== false,
          };
          // Also alias by short field name if unique
          if (!fields[fieldKey]) {
            fields[fieldKey] = fields[canonicalKey];
          }
        }
      }
    }
    // Case 2: Table with columns and row bounds
    else if (topVal.type === "table" && topVal.col && typeof topVal.col === "object") {
      const startRow = (topVal.rows && topVal.rows.start) || 1;
      const endRow = (topVal.rows && topVal.rows.end) || startRow + 10;
      const columns = {};

      for (const [colKey, colVal] of Object.entries(topVal.col)) {
        if (colVal && colVal.cell) {
          const colLetter = String(colVal.cell).toUpperCase().trim().replace(/[0-9]/g, "");
          columns[colKey] = {
            columnLetter: colLetter,
            name: colVal.name || colKey,
            type: colVal.type || "text",
            editable: colVal.editable !== false,
          };
        }
      }

      tables[topKey] = {
        name: topKey,
        unitName: topVal.unitname || "Item",
        startRow,
        endRow,
        rowCount: endRow - startRow + 1,
        columns,
      };
    }
    // Case 3: Direct cell item (e.g. InvoiceNumber, Date, Total)
    else if (topVal.cell) {
      const coord = String(topVal.cell).toUpperCase().trim();
      fields[topKey] = {
        section: "root",
        fieldName: topKey,
        cell: coord,
        type: topVal.type || "text",
        editable: topVal.editable !== false,
      };
    }
  }

  return { hasMappings, fields, tables };
}

/**
 * Helper to convert camelCase, PascalCase, or dot-separated keys to human-readable titles
 */
export function humanizeFieldTitle(str) {
  if (!str) return "";
  return String(str)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\./g, " - ")
    .replace(/_/g, " ")
    .trim();
}

/**
 * Extract all currently editable cells, their titles/labels, coordinates, and current cell values.
 * Traverses form fields, table columns/rows, and any restricted EditableCells configurations.
 */
export function extractEditableCells(options = {}) {
  const currentSheet = options.sheetName || getActiveSheetId();
  const activeMapping = options.appMapping || getAppMapping();
  const sheet = getActiveSheetObject(currentSheet);
  const mappingInfo = extractMappingFields(activeMapping, currentSheet);
  const sc = getSocialCalc();

  const editableList = [];
  const seenCoords = new Set();

  // 1. From template mapping form fields
  if (mappingInfo.hasMappings) {
    for (const [key, field] of Object.entries(mappingInfo.fields)) {
      if (!field || field.editable === false || !field.cell) continue;
      const coord = String(field.cell).toUpperCase().trim();
      if (seenCoords.has(coord)) continue;
      seenCoords.add(coord);

      const cellData = sheet?.cells?.[coord];
      const val = cellData ? (cellData.datavalue !== undefined ? cellData.datavalue : "") : "";
      const title = humanizeFieldTitle(key);

      editableList.push({
        cell: coord,
        title,
        fieldName: key,
        section: field.section || "root",
        currentValue: val,
        displayValue: cellData?.displaystring || String(val),
        type: field.type || "text",
        formula: cellData?.formula ? `=${cellData.formula}` : undefined,
      });
    }

    // 2. From template mapping tables (all editable columns across row range)
    for (const [tableName, table] of Object.entries(mappingInfo.tables)) {
      if (!table || !table.columns) continue;
      for (let r = table.startRow; r <= table.endRow; r++) {
        for (const [colKey, col] of Object.entries(table.columns)) {
          if (!col || col.editable === false) continue;
          const coord = `${col.columnLetter}${r}`;
          if (seenCoords.has(coord)) continue;
          seenCoords.add(coord);

          const cellData = sheet?.cells?.[coord];
          const val = cellData ? (cellData.datavalue !== undefined ? cellData.datavalue : "") : "";
          const colTitle = col.name || humanizeFieldTitle(colKey);
          const title = `${humanizeFieldTitle(tableName)} [Row ${r}] - ${colTitle}`;

          editableList.push({
            cell: coord,
            title,
            fieldName: `${tableName}.${colKey}`,
            table: tableName,
            row: r,
            currentValue: val,
            displayValue: cellData?.displaystring || String(val),
            type: col.type || "text",
            formula: cellData?.formula ? `=${cellData.formula}` : undefined,
          });
        }
      }
    }
  }

  // 3. From sc.EditableCells if explicitly configured
  if (sc.EditableCells && sc.EditableCells.allow && sc.EditableCells.cells) {
    const prefix1 = `${currentSheet}!`;
    const prefix2 = `${currentSheet.toLowerCase()}!`;
    for (const rawKey of Object.keys(sc.EditableCells.cells)) {
      let coord = rawKey;
      if (coord.startsWith(prefix1)) coord = coord.slice(prefix1.length);
      else if (coord.startsWith(prefix2)) coord = coord.slice(prefix2.length);
      else if (coord.startsWith("sheet1!")) coord = coord.slice(7);

      coord = coord.toUpperCase().trim();
      if (/^[A-Z]+[0-9]+$/.test(coord) && !seenCoords.has(coord)) {
        seenCoords.add(coord);
        const cellData = sheet?.cells?.[coord];
        const val = cellData ? (cellData.datavalue !== undefined ? cellData.datavalue : "") : "";
        editableList.push({
          cell: coord,
          title: `Cell ${coord}`,
          fieldName: coord,
          currentValue: val,
          displayValue: cellData?.displaystring || String(val),
          type: typeof val === "number" ? "number" : "text",
          formula: cellData?.formula ? `=${cellData.formula}` : undefined,
        });
      }
    }
  }

  // 4. Fallback for free-form spreadsheet mode (no template mappings or restrictions)
  if (editableList.length === 0 && sheet && sheet.cells) {
    const maxCells = options.maxCells || 60;
    let count = 0;
    for (const [coord, cellData] of Object.entries(sheet.cells)) {
      if (!cellData || count >= maxCells) break;
      const val = cellData.datavalue !== undefined ? cellData.datavalue : "";
      if (val !== "" || cellData.formula) {
        count++;
        editableList.push({
          cell: coord,
          title: `Cell ${coord}`,
          fieldName: coord,
          currentValue: val,
          displayValue: cellData?.displaystring || String(val),
          type: typeof val === "number" ? "number" : "text",
          formula: cellData?.formula ? `=${cellData.formula}` : undefined,
        });
      }
    }
  }

  return editableList;
}

/**
 * Format editable cells list into a Markdown summary for LLM prompt injection
 */
export function formatEditableCellsSummary(editableCells = []) {
  if (!editableCells || editableCells.length === 0) {
    return "No explicitly defined editable cells found. Operating in free-form mode.";
  }
  const lines = [
    `### Current Editable Cells & Values (${editableCells.length} cells):`,
    "| Cell | Title / Field Label | Current Cell Value | Type |",
    "| :--- | :--- | :--- | :--- |",
  ];
  for (const c of editableCells) {
    const valDisplay = c.currentValue !== "" ? String(c.currentValue).replace(/\|/g, "/") : "(empty)";
    lines.push(`| ${c.cell} | ${c.title} | ${valDisplay} | ${c.type} |`);
  }
  return lines.join("\n");
}

/**
 * Extract clean, structured context from the spreadsheet and app mappings
 * Suitable for LLM context injection (Gemini, Claude, GPT, or backend servers)
 */
export function getAgentContext(options = {}) {
  const currentSheet = options.sheetName || getActiveSheetId();
  const allSheets = getAllSheetIds();
  const activeMapping = options.appMapping || getAppMapping();
  const maxCells = options.maxCells || _agentConfig.maxContextCells || 500;

  const sheet = getActiveSheetObject(currentSheet);
  const mappingInfo = extractMappingFields(activeMapping, currentSheet);
  const editableCells = extractEditableCells({ sheetName: currentSheet, appMapping: activeMapping, maxCells });
  const editableCellsSummary = formatEditableCellsSummary(editableCells);

  const nonBlankCells = {};
  let totalNonBlank = 0;
  let minCol = Infinity;
  let maxCol = 1;
  let minRow = Infinity;
  let maxRow = 1;

  if (sheet && sheet.cells) {
    for (const [coord, cell] of Object.entries(sheet.cells)) {
      if (!cell) continue;
      const datavalue = cell.datavalue !== undefined ? cell.datavalue : "";
      const display = cell.displaystring || String(datavalue);
      const isBlank = datavalue === "" && !cell.formula;

      if (!isBlank) {
        totalNonBlank++;
        if (totalNonBlank <= maxCells) {
          nonBlankCells[coord] = {
            value: datavalue,
            datatype: cell.datatype || (typeof datavalue === "number" ? "v" : "t"),
            formula: cell.formula ? `=${cell.formula}` : undefined,
            display: display.trim(),
          };
        }

        // Bounding box calculation
        const match = coord.match(/^([A-Z]+)([0-9]+)$/i);
        if (match) {
          const colLetters = match[1].toUpperCase();
          const rowNum = parseInt(match[2], 10);
          let colNum = 0;
          for (let i = 0; i < colLetters.length; i++) {
            colNum = colNum * 26 + (colLetters.charCodeAt(i) - 64);
          }
          if (colNum < minCol) minCol = colNum;
          if (colNum > maxCol) maxCol = colNum;
          if (rowNum < minRow) minRow = rowNum;
          if (rowNum > maxRow) maxRow = rowNum;
        }
      }
    }
  }

  const dimensions = {
    currentSheet,
    lastCol: sheet?.attribs?.lastcol || maxCol,
    lastRow: sheet?.attribs?.lastrow || maxRow,
    usedRange:
      totalNonBlank > 0 && minCol !== Infinity
        ? `${numberToCol(minCol)}${minRow}:${numberToCol(maxCol)}${maxRow}`
        : "A1:A1",
    nonBlankCount: totalNonBlank,
  };

  // Attach current values to mapping fields
  const populatedFields = {};
  for (const [key, field] of Object.entries(mappingInfo.fields)) {
    const cellData = sheet?.cells?.[field.cell];
    populatedFields[key] = {
      ...field,
      currentValue: cellData ? cellData.datavalue ?? "" : "",
      formula: cellData?.formula ? `=${cellData.formula}` : undefined,
    };
  }

  // Attach current items to tables
  const populatedTables = {};
  for (const [tableName, table] of Object.entries(mappingInfo.tables)) {
    const rows = [];
    for (let r = table.startRow; r <= table.endRow; r++) {
      const rowItem = {};
      let hasData = false;
      for (const [colKey, col] of Object.entries(table.columns)) {
        const coord = `${col.columnLetter}${r}`;
        const cellData = sheet?.cells?.[coord];
        const val = cellData ? cellData.datavalue ?? "" : "";
        if (val !== "") hasData = true;
        rowItem[colKey] = {
          cell: coord,
          value: val,
        };
      }
      if (hasData) {
        rows.push({ rowNumber: r, data: rowItem });
      }
    }
    populatedTables[tableName] = {
      ...table,
      existingRows: rows,
    };
  }

  // Generate concise human-readable summary for prompt injection
  const summaryLines = [];
  summaryLines.push(`Sheet: "${currentSheet}" (Total sheets: ${allSheets.join(", ")})`);
  summaryLines.push(`Active Range: ${dimensions.usedRange}, Total non-empty cells: ${totalNonBlank}`);
  summaryLines.push("");
  summaryLines.push(editableCellsSummary);

  if (mappingInfo.hasMappings) {
    summaryLines.push("\n### Defined Template Mappings:");
    for (const [key, f] of Object.entries(populatedFields)) {
      if (key.includes(".")) {
        summaryLines.push(
          `- ${key} (Cell: ${f.cell}, Type: ${f.type}, Editable: ${f.editable}): "${f.currentValue}"`
        );
      }
    }
    for (const [tName, t] of Object.entries(populatedTables)) {
      summaryLines.push(
        `- Table "${tName}" (Rows ${t.startRow}-${t.endRow}, Columns: ${Object.keys(t.columns).join(
          ", "
        )}). Current populated rows: ${t.existingRows.length}`
      );
    }
  } else {
    summaryLines.push("\nNote: No template appMappings detected. Operating in free-form spreadsheet mode.");
  }

  return {
    sheetName: currentSheet,
    allSheets,
    dimensions,
    hasMappings: mappingInfo.hasMappings,
    mappings: {
      fields: populatedFields,
      tables: populatedTables,
    },
    editableCells,
    editableCellsSummary,
    cells: nonBlankCells,
    summary: summaryLines.join("\n"),
  };
}

/**
 * Export context as a JSON-serializable payload for backend transmission (Node.js / Python Tornado)
 */
export function exportAgentContext(options = {}) {
  const context = getAgentContext(options);
  return JSON.parse(JSON.stringify(context));
}

/**
 * Convert 1-based column number to column letter(s)
 */
function numberToCol(num) {
  let s = "";
  let n = num;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || "A";
}

/**
 * Generate a comprehensive System Prompt for Gemini / Claude / GPT
 */
export function generateAgentSystemPrompt(options = {}) {
  const context = getAgentContext(options);
  const prompt = `You are the SocialCalc Spreadsheet Text Editor Assistant.
You interact with the user's active spreadsheet workbook to fill invoices, update fields, set formulas, and modify cell contents.

### Current Sheet Context:
${context.summary}

### Instructions & Rules:
1. When asked to fill or update fields that match known template mappings (e.g. BillTo, From, InvoiceNumber, Date, or Items table), target those mapped cells or use the 'SET_MAPPING_FIELD' / 'APPLY_MAPPING_DATA' actions.
2. If template mappings exist, prioritize editing cells designated as 'editable: true'. Do not overwrite template labels or formula cells unless explicitly instructed.
3. For numeric values (amounts, quantities, rates), provide valid numbers. For formulas, start with '=' without spaces (e.g. "=SUM(F21:F33)").
4. When editing table items, start at the table's startRow and fill consecutive rows.
5. Return your actions in a structured format:
   - If using function calling: call the appropriate tool.
   - If responding in JSON: return a JSON object with an "actions" array:
     \`\`\`json
     {
       "message": "Friendly explanation of what was changed",
       "actions": [
         { "action": "SET_CELL", "coord": "C5", "value": "Acme Corp", "type": "text" },
         { "action": "SET_CELL", "coord": "F21", "value": 150.00, "type": "number" }
       ]
     }
     \`\`\`
`;
  return prompt;
}

/**
 * Get standard LLM Tool / Function Calling definitions
 * Supports formats: "gemini", "openai", "generic"
 */
export function getAgentToolDefinitions(options = {}) {
  const format = options.format || "gemini";

  const tools = [
    {
      name: "set_cell_value",
      description: "Set the value, text, or formula of an individual spreadsheet cell.",
      parameters: {
        type: "OBJECT",
        properties: {
          coord: { type: "STRING", description: "Cell coordinate, e.g. 'C5', 'F21'" },
          value: { type: "STRING", description: "Value to set (string, number string, or formula starting with '=')" },
          type: { type: "STRING", description: "'text', 'number', or 'formula' (optional, auto-detected if omitted)" },
        },
        required: ["coord", "value"],
      },
    },
    {
      name: "set_cell_values",
      description: "Batch update multiple cell coordinates simultaneously.",
      parameters: {
        type: "OBJECT",
        properties: {
          updates: {
            type: "ARRAY",
            description: "List of cell updates",
            items: {
              type: "OBJECT",
              properties: {
                coord: { type: "STRING", description: "Cell coordinate, e.g. 'A1'" },
                value: { type: "STRING", description: "Cell value" },
                type: { type: "STRING", description: "'text', 'number', or 'formula'" },
              },
              required: ["coord", "value"],
            },
          },
        },
        required: ["updates"],
      },
    },
    {
      name: "clear_cell",
      description: "Clear or erase the content and formula of a spreadsheet cell.",
      parameters: {
        type: "OBJECT",
        properties: {
          coord: { type: "STRING", description: "Cell coordinate to clear, e.g. 'C5'" },
        },
        required: ["coord"],
      },
    },
    {
      name: "clear_cells",
      description: "Clear or erase multiple cells at once.",
      parameters: {
        type: "OBJECT",
        properties: {
          coords: {
            type: "ARRAY",
            description: "Array of cell coordinates to clear",
            items: { type: "STRING" },
          },
        },
        required: ["coords"],
      },
    },
    {
      name: "set_mapping_field",
      description: "Set a value using its semantic template mapping field name (e.g. 'BillTo.Name', 'InvoiceNumber').",
      parameters: {
        type: "OBJECT",
        properties: {
          field: { type: "STRING", description: "Semantic mapping field name, e.g. 'BillTo.Name' or 'InvoiceNumber'" },
          value: { type: "STRING", description: "Value to set" },
        },
        required: ["field", "value"],
      },
    },
    {
      name: "apply_mapping_data",
      description: "Fill multiple mapped form fields and table rows in one structured operation.",
      parameters: {
        type: "OBJECT",
        properties: {
          data: {
            type: "OBJECT",
            description:
              "Structured mapping object, e.g. { 'BillTo': { 'Name': 'Acme', 'Email': 'a@b.com' }, 'Items': [{ 'Description': 'Widget', 'Amount': 50 }] }",
          },
        },
        required: ["data"],
      },
    },
    {
      name: "raw_command",
      description: "Execute raw SocialCalc command string directly (e.g. 'set C5 text t Acme').",
      parameters: {
        type: "OBJECT",
        properties: {
          command: { type: "STRING", description: "SocialCalc command line" },
        },
        required: ["command"],
      },
    },
  ];

  if (format === "gemini") {
    return {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: {
          type: "OBJECT",
          properties: t.parameters.properties,
          required: t.parameters.required,
        },
      })),
    };
  }

  if (format === "openai") {
    return tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(t.parameters.properties).map(([k, v]) => [
              k,
              {
                ...v,
                type: v.type.toLowerCase(),
                items: v.items ? { ...v.items, type: v.items.type.toLowerCase() } : undefined,
              },
            ])
          ),
          required: t.parameters.required,
        },
      },
    }));
  }

  return tools;
}

/**
 * Register a custom action handler for future agents (styling, merge, borders, dimensions)
 */
export function registerAgentActionHandler(actionType, handler) {
  if (!actionType || typeof handler !== "function") {
    throw new Error("Action type string and handler function required");
  }
  _actionHandlers.set(actionType.toUpperCase(), handler);
}

/**
 * Resolve a cell coordinate from a mapping field or return coordinate as-is
 */
export function resolveCoordinate(fieldOrCoord, context) {
  if (!fieldOrCoord) return null;
  const str = String(fieldOrCoord).trim();

  // If it's already a cell coordinate like A1, C23, AA10
  if (/^[A-Z]+[0-9]+$/i.test(str)) {
    return str.toUpperCase();
  }

  // Check mapping fields
  const ctx = context || getAgentContext();
  if (ctx.mappings && ctx.mappings.fields) {
    if (ctx.mappings.fields[str]) {
      return ctx.mappings.fields[str].cell;
    }
    // Try case-insensitive lookup
    const lower = str.toLowerCase();
    for (const [k, v] of Object.entries(ctx.mappings.fields)) {
      if (k.toLowerCase() === lower || k.split(".").pop().toLowerCase() === lower) {
        return v.cell;
      }
    }
  }

  return null;
}

/**
 * Generate native SocialCalc command for a single cell value update
 */
export function buildSetCellCommand(sc, coord, rawValue, type) {
  const c = String(coord).toUpperCase().trim();
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return `erase ${c} formulas\nset ${c} empty`;
  }

  const valStr = String(rawValue);

  // 1. Formula
  if (type === "formula" || (valStr.startsWith("=") && valStr.indexOf("\n") === -1)) {
    const formulaText = valStr.startsWith("=") ? valStr.substring(1) : valStr;
    return `set ${c} formula ${formulaText}`;
  }

  // 2. Numeric
  const numVal = parseFloat(valStr);
  const isNumeric =
    type === "number" ||
    (typeof rawValue === "number" && !isNaN(rawValue)) ||
    (!isNaN(numVal) && isFinite(valStr) && valStr.trim() === numVal.toString());

  if (isNumeric && !isNaN(numVal)) {
    return `set ${c} value n ${numVal}`;
  }

  // 3. Text (with HTML check and SocialCalc escaping)
  const encoded = encodeCellValue(sc, valStr);
  const isHtml = /<[a-z][\s\S]*>/i.test(valStr);
  if (isHtml) {
    return `set ${c} text th ${encoded}\nset ${c} textvalueformat text-html`;
  }

  return `set ${c} text t ${encoded}`;
}

/**
 * Execute an array of normalized agent actions on SocialCalc
 */
export function executeAgentActions(actions, options = {}) {
  const actionList = Array.isArray(actions) ? actions : [actions];
  if (actionList.length === 0) {
    return { success: true, count: 0, commands: [] };
  }

  const sc = getSocialCalc();
  const context = getAgentContext(options);
  const currentSheet = options.sheetName || context.sheetName || "sheet1";
  const commands = [];
  const results = [];

  for (const item of actionList) {
    if (!item || typeof item !== "object") continue;
    const actionType = String(item.action || item.type || "").toUpperCase();

    // Check custom handler registry first (extensibility for future agents)
    if (_actionHandlers.has(actionType)) {
      try {
        const customRes = _actionHandlers.get(actionType)(item, { sc, context, commands });
        results.push({ action: actionType, success: true, detail: customRes });
        continue;
      } catch (handlerErr) {
        results.push({ action: actionType, success: false, error: handlerErr.message });
        continue;
      }
    }

    switch (actionType) {
      case "SET_CELL":
      case "SET_CELL_VALUE": {
        const coord = resolveCoordinate(item.coord || item.cell || item.field, context);
        if (coord) {
          commands.push(buildSetCellCommand(sc, coord, item.value, item.type));
          results.push({ action: "SET_CELL", coord, value: item.value, success: true });
        } else {
          results.push({
            action: "SET_CELL",
            success: false,
            error: `Could not resolve coordinate for "${item.coord || item.field}"`,
          });
        }
        break;
      }

      case "SET_CELLS":
      case "SET_CELL_VALUES": {
        const updates = item.updates || item.cells || [];
        for (const u of updates) {
          const coord = resolveCoordinate(u.coord || u.cell || u.field, context);
          if (coord) {
            commands.push(buildSetCellCommand(sc, coord, u.value, u.type));
            results.push({ action: "SET_CELL", coord, value: u.value, success: true });
          }
        }
        break;
      }

      case "CLEAR_CELL": {
        const coord = resolveCoordinate(item.coord || item.cell || item.field, context);
        if (coord) {
          commands.push(`erase ${coord} formulas`);
          commands.push(`set ${coord} empty`);
          results.push({ action: "CLEAR_CELL", coord, success: true });
        }
        break;
      }

      case "CLEAR_CELLS": {
        const coords = item.coords || item.cells || [];
        for (const c of coords) {
          const coord = resolveCoordinate(c, context);
          if (coord) {
            commands.push(`erase ${coord} formulas`);
            commands.push(`set ${coord} empty`);
            results.push({ action: "CLEAR_CELL", coord, success: true });
          }
        }
        break;
      }

      case "SET_MAPPING_FIELD": {
        const coord = resolveCoordinate(item.field || item.fieldName, context);
        if (coord) {
          commands.push(buildSetCellCommand(sc, coord, item.value, item.type));
          results.push({ action: "SET_MAPPING_FIELD", field: item.field, coord, success: true });
        } else {
          results.push({
            action: "SET_MAPPING_FIELD",
            success: false,
            error: `Mapping field "${item.field}" not found in current template.`,
          });
        }
        break;
      }

      case "APPLY_MAPPING_DATA": {
        const data = item.data || {};
        const mappingInfo = context.mappings;

        // Process direct fields or nested objects (e.g. BillTo: { Name: "..." })
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && !Array.isArray(v)) {
            // Nested form like BillTo: { Name: "...", Email: "..." }
            for (const [subK, subV] of Object.entries(v)) {
              const fullKey = `${k}.${subK}`;
              const coord = resolveCoordinate(fullKey, context);
              if (coord) {
                commands.push(buildSetCellCommand(sc, coord, subV));
                results.push({ action: "SET_MAPPING_FIELD", field: fullKey, coord, success: true });
              }
            }
          } else if (Array.isArray(v)) {
            // Table items array, e.g. Items: [ { Description: "...", Amount: 50 }, ... ]
            const table = mappingInfo.tables[k] || Object.values(mappingInfo.tables)[0];
            if (table) {
              v.forEach((rowObj, idx) => {
                const targetRow = table.startRow + idx;
                if (targetRow <= table.endRow) {
                  for (const [colName, colVal] of Object.entries(rowObj || {})) {
                    const colInfo =
                      table.columns[colName] ||
                      Object.values(table.columns).find(
                        (c) => c.name.toLowerCase() === colName.toLowerCase()
                      );
                    if (colInfo) {
                      const coord = `${colInfo.columnLetter}${targetRow}`;
                      commands.push(buildSetCellCommand(sc, coord, colVal, colInfo.type));
                      results.push({ action: "SET_TABLE_ROW", coord, colName, success: true });
                    }
                  }
                }
              });
            }
          } else {
            // Flat field
            const coord = resolveCoordinate(k, context);
            if (coord) {
              commands.push(buildSetCellCommand(sc, coord, v));
              results.push({ action: "SET_MAPPING_FIELD", field: k, coord, success: true });
            }
          }
        }
        break;
      }

      case "RAW_COMMAND": {
        if (item.command) {
          commands.push(item.command);
          results.push({ action: "RAW_COMMAND", command: item.command, success: true });
        }
        break;
      }

      default:
        console.warn(`[AgentPlugin] Unknown action type "${actionType}"`);
        results.push({ action: actionType, success: false, error: `Unknown action: ${actionType}` });
        break;
    }
  }

  // Execute commands on SocialCalc workbook control
  if (commands.length > 0) {
    const fullCmdStr = commands.join("\n") + "\n";
    let executed = false;

    if (sc.GetCurrentWorkBookControl) {
      const ctrl = sc.GetCurrentWorkBookControl();
      if (ctrl && ctrl.ExecuteWorkBookControlCommand) {
        try {
          const commandObj = {
            cmdtype: "scmd",
            id: currentSheet,
            cmdstr: fullCmdStr,
            saveundo: options.saveUndo !== undefined ? options.saveUndo : _agentConfig.saveUndo,
          };
          ctrl.ExecuteWorkBookControlCommand(commandObj, false);
          executed = true;
        } catch (execErr) {
          console.error("[AgentPlugin] ExecuteWorkBookControlCommand error:", execErr);
        }
      }
    }

    // Fallback: spreadsheet.ExecuteCommand or editor
    if (!executed) {
      const spreadsheet = getActiveSpreadsheet();
      if (spreadsheet && spreadsheet.ExecuteCommand) {
        try {
          spreadsheet.ExecuteCommand(fullCmdStr, "");
          executed = true;
        } catch (e) {
          // ignore
        }
      }
    }

    // Refresh display
    const editor = getActiveEditor();
    if (editor) {
      if (editor.FitToEditTable) editor.FitToEditTable();
      if (editor.ScheduleRender) editor.ScheduleRender();
    }
  }

  // Dispatch custom window event for host application reactivity
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("socialcalc:agent-action", {
        detail: {
          actions: actionList,
          commands,
          results,
          timestamp: Date.now(),
        },
      })
    );
  }

  return {
    success: true,
    count: results.filter((r) => r.success).length,
    total: results.length,
    commands,
    results,
  };
}

/**
 * Parse an LLM response (Gemini function call, OpenAI tool call, JSON block, or string)
 * into an array of normalized agent action objects
 */
export function parseAgentResponse(response) {
  if (!response) return [];

  // 1. Direct array of actions
  if (Array.isArray(response)) {
    return response;
  }

  // 2. Object with "actions" array
  if (response.actions && Array.isArray(response.actions)) {
    return response.actions;
  }

  // 3. Single action object
  if (response.action && typeof response.action === "string") {
    return [response];
  }

  // 4. Gemini SDK functionCalls format
  if (response.functionCalls && Array.isArray(response.functionCalls)) {
    return response.functionCalls.map((fc) => mapToolCallToAction(fc.name, fc.args));
  }

  // 5. OpenAI tool_calls format
  if (response.tool_calls && Array.isArray(response.tool_calls)) {
    return response.tool_calls.map((tc) => {
      const args = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments;
      return mapToolCallToAction(tc.function.name, args);
    });
  }

  // 6. String with markdown code block or raw JSON
  if (typeof response === "string") {
    const trimmed = response.trim();
    // Check for ```json block
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const targetString = jsonMatch ? jsonMatch[1].trim() : trimmed;

    try {
      const parsed = JSON.parse(targetString);
      return parseAgentResponse(parsed);
    } catch (e) {
      console.warn("[AgentPlugin] Failed to parse string response as JSON:", e);
      return [];
    }
  }

  return [];
}

/**
 * Map function/tool name to normalized action
 */
function mapToolCallToAction(toolName, args = {}) {
  const normName = String(toolName).toLowerCase();
  switch (normName) {
    case "set_cell_value":
    case "setcellvalue":
      return { action: "SET_CELL", coord: args.coord, value: args.value, type: args.type };
    case "set_cell_values":
    case "setcellvalues":
      return { action: "SET_CELLS", updates: args.updates };
    case "clear_cell":
    case "clearcell":
      return { action: "CLEAR_CELL", coord: args.coord };
    case "clear_cells":
    case "clearcells":
      return { action: "CLEAR_CELLS", coords: args.coords };
    case "set_mapping_field":
    case "setmappingfield":
      return { action: "SET_MAPPING_FIELD", field: args.field, value: args.value };
    case "apply_mapping_data":
    case "applymappingdata":
      return { action: "APPLY_MAPPING_DATA", data: args.data };
    case "raw_command":
    case "rawcommand":
      return { action: "RAW_COMMAND", command: args.command };
    default:
      return { action: toolName, ...args };
  }
}

/**
 * Parse LLM response and execute actions in one convenient step
 */
export function executeAgentResponse(response, options = {}) {
  const actions = parseAgentResponse(response);
  return executeAgentActions(actions, options);
}

/**
 * High-level Frontend SDK method to send instructions with current editable cells and values to the AI Agent.
 * Intelligently returns executable commands for spreadsheet tasks, or a polite message for generic prompts.
 * 
 * @param {string} prompt - User's instruction
 * @param {object} [options]
 * @param {string} [options.sheetName]
 * @param {object} [options.appMapping]
 * @param {string} [options.endpoint] - Defaults to '/agent/socialcalc/test'
 * @param {boolean} [options.autoExecute] - Whether to automatically apply returned actions (default: false)
 * @returns {Promise<{ success: boolean; type: "actions" | "message"; message: string | null; actions: any[]; executionResult?: any; error?: string }>}
 */
export async function callSocialCalcAgent(prompt, options = {}) {
  const currentSheet = options.sheetName || getActiveSheetId();
  const appMapping = options.appMapping || getAppMapping();
  const endpoint = options.endpoint || "/agent/socialcalc/test";

  const context = exportAgentContext({ sheetName: currentSheet, appMapping });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: JSON.stringify({
        prompt: String(prompt || "").trim(),
        context: {
          sheetName: context.sheetName,
          editableCells: context.editableCells,
          editableCellsSummary: context.editableCellsSummary,
          mappings: context.mappings,
          dimensions: context.dimensions,
          summary: context.summary,
        },
        modelName: options.modelName
      })
    });

    const data = await response.json();

    // Case 1: Sheet Context Explanation / Summary / Email drafting (Max 300 words)
    if (data.type === "explanation") {
      return {
        success: true,
        type: "explanation",
        message: data.message || "",
        actions: [],
        raw: data
      };
    }

    // Case 2: Off-topic / out of context prompt
    if (data.type === "off_topic" || (data.message && (!data.actions || data.actions.length === 0) && "only write values" in String(data.message).toLowerCase())) {
      return {
        success: true,
        type: "off_topic",
        message: data.message || "I can only write values to the spreadsheet cells, please give me input accordingly.",
        actions: [],
        raw: data
      };
    }

    // Case 3: Executable spreadsheet filling actions
    if (data.success && Array.isArray(data.actions) && data.actions.length > 0) {
      let executionResult = null;
      if (options.autoExecute === true && data.actions.length > 0) {
        executionResult = executeAgentActions(data.actions, { sheetName: currentSheet, appMapping });
      }
      return {
        success: true,
        type: "actions",
        message: null,
        actions: data.actions,
        executionResult,
        raw: data
      };
    }

    // Fallback message if message is present
    if (data.message) {
      return {
        success: true,
        type: "explanation",
        message: data.message,
        actions: [],
        raw: data
      };
    }

    return {
      success: false,
      type: "error",
      message: data.error || "Failed to process instruction",
      actions: [],
      raw: data
    };
  } catch (err) {
    return {
      success: false,
      type: "error",
      message: err.message || "Network error calling AI Agent",
      actions: [],
      error: err.message
    };
  }
}

// Register as a SocialCalc plugin
registerPlugin("agent", {
  metadata: {
    displayName: "AI Agent Plugin",
    description: "Connects LLMs (Gemini, Claude, GPT, backends) for automated spreadsheet text editing",
  },
  enable: enableAgent,
  disable: disableAgent,
  isEnabled: isAgentEnabled,
  toggle: toggleAgent,
  configure: configureAgent,
});

// Attach to window.SocialCalc if running in browser
if (typeof window !== "undefined") {
  window.SocialCalc = window.SocialCalc || {};
  window.SocialCalc.enableAgent = enableAgent;
  window.SocialCalc.disableAgent = disableAgent;
  window.SocialCalc.isAgentEnabled = isAgentEnabled;
  window.SocialCalc.getAgentContext = getAgentContext;
  window.SocialCalc.exportAgentContext = exportAgentContext;
  window.SocialCalc.extractEditableCells = extractEditableCells;
  window.SocialCalc.formatEditableCellsSummary = formatEditableCellsSummary;
  window.SocialCalc.callSocialCalcAgent = callSocialCalcAgent;
  window.SocialCalc.getAgentToolDefinitions = getAgentToolDefinitions;
  window.SocialCalc.generateAgentSystemPrompt = generateAgentSystemPrompt;
  window.SocialCalc.executeAgentActions = executeAgentActions;
  window.SocialCalc.parseAgentResponse = parseAgentResponse;
  window.SocialCalc.executeAgentResponse = executeAgentResponse;
  window.SocialCalc.registerAgentActionHandler = registerAgentActionHandler;
}

