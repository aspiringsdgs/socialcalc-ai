import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { SocialCalcAdapter } from "./adapters/socialcalc/adapter.js";
import { sheetToMarkdownTable } from "./utils/markdown.js";
import { parseRange, colIndexToLetter, colLetterToIndex, formatCoordinate } from "./utils/coordinate.js";
import { StyleService } from "./services/styles.js";
import { SheetService } from "./services/sheet.js";
import { Workbook } from "./models/workbook.js";
import { serializeWorkbookJson } from "./adapters/socialcalc/serializer.js";
import { sheetToCsv, csvToSheet } from "./adapters/csv/index.js";
import { workbookToXlsx, xlsxToWorkbook } from "./adapters/xlsx/index.js";
import { FORMULAS } from "./utils/formulas.js";
import { SpreadsheetService } from "./services/spreadsheetService.js";
import { BatchSpreadsheetService } from "./services/batchService.js";
import { getMcpFilesDir, resolveTargetFilePath } from "./utils/paths.js";

const adapter = new SocialCalcAdapter();

// Helper to resolve sheet by number or name
function resolveSheet(workbook: any, args: any) {
  let sheet;
  if (args.sheetNumber !== undefined && args.sheetNumber !== null) {
    const meta = workbook.getSheetsMetadata();
    const idx = Number(args.sheetNumber) - 1;
    if (idx >= 0 && idx < meta.length) {
      sheet = workbook.getSheetById(meta[idx].id);
    }
  }
  if (!sheet && args.sheetName) {
    sheet = workbook.getSheetByName(args.sheetName);
  }
  if (!sheet) {
    sheet = workbook.getActiveSheet() || workbook.sheets.values().next().value;
  }
  return sheet;
}

// Helper to normalize format names to standard SocialCalc formats
function normalizeFormat(format: string): string {
  const normalized = format.trim().toLowerCase();
  switch (normalized) {
    case "html":
      return "text-html";
    case "plain text":
    case "text":
    case "plain":
      return "text-plain";
    case "wikitext":
    case "wiki":
      return "text-wiki";
    case "link":
      return "text-link";
    default:
      return format.trim();
  }
}

// Helper to update layout settings to match SocialCalc's layout regex strictly:
// /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/
function parseAndFormatLayout(layoutStr: string, updates: { padding?: string; top?: string; right?: string; bottom?: string; left?: string; verticalAlign?: string }): string {
  let top = "*";
  let right = "*";
  let bottom = "*";
  let left = "*";
  let verticalAlign = "*";

  const layoutre = /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/;
  const match = layoutStr.match(layoutre);
  if (match) {
    top = match[1];
    right = match[2];
    bottom = match[3];
    left = match[4];
    verticalAlign = match[5];
  }

  if (updates.padding !== undefined) {
    const p = updates.padding.trim().split(/\s+/);
    if (p.length === 1) {
      const val = isNaN(Number(p[0])) ? p[0] : `${p[0]}px`;
      top = right = bottom = left = val;
    } else if (p.length === 2) {
      const v = isNaN(Number(p[0])) ? p[0] : `${p[0]}px`;
      const h = isNaN(Number(p[1])) ? p[1] : `${p[1]}px`;
      top = bottom = v;
      right = left = h;
    } else if (p.length === 4) {
      top = isNaN(Number(p[0])) ? p[0] : `${p[0]}px`;
      right = isNaN(Number(p[1])) ? p[1] : `${p[1]}px`;
      bottom = isNaN(Number(p[2])) ? p[2] : `${p[2]}px`;
      left = isNaN(Number(p[3])) ? p[3] : `${p[3]}px`;
    }
  }

  if (updates.top !== undefined) {
    top = isNaN(Number(updates.top)) ? updates.top : `${updates.top}px`;
  }
  if (updates.right !== undefined) {
    right = isNaN(Number(updates.right)) ? updates.right : `${updates.right}px`;
  }
  if (updates.bottom !== undefined) {
    bottom = isNaN(Number(updates.bottom)) ? updates.bottom : `${updates.bottom}px`;
  }
  if (updates.left !== undefined) {
    left = isNaN(Number(updates.left)) ? updates.left : `${updates.left}px`;
  }

  if (updates.verticalAlign !== undefined) {
    verticalAlign = updates.verticalAlign;
  }

  return `padding:${top} ${right} ${bottom} ${left};vertical-align:${verticalAlign};`;
}

// Helper to update font properties (style, weight, size, family)
function updateFontProperty(fontStr: string, updates: { style?: string; weight?: string; size?: string; family?: string }): string {
  const parts = fontStr.split(" ");
  let style = "normal";
  let weight = "normal";
  let size = "10pt";
  let family = "Arial";
  
  if (parts.length === 4) {
    style = parts[0];
    weight = parts[1];
    size = parts[2];
    family = parts.slice(3).join(" ");
  } else if (parts.length === 3) {
    style = parts[0];
    weight = parts[1];
    size = parts[2];
  }
  
  if (updates.style !== undefined) style = updates.style;
  if (updates.weight !== undefined) weight = updates.weight;
  if (updates.size !== undefined) {
    const num = Number(updates.size);
    size = isNaN(num) ? updates.size : `${num}pt`;
  }
  if (updates.family !== undefined) family = updates.family;
  
  return `${style} ${weight} ${size} ${family}`;
}

export class SocialcalcMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "socialcalc-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  getServerInstance(): Server {
    return this.server;
  }

  /**
   * Public method to list available tools. Exposes metadata schema.
   */
  public listTools() {
    return [
      {
        name: "list_workbooks",
        description: "Lists all available workbook files in a target directory (defaults to 'mcp_files').",
        inputSchema: {
          type: "object",
          properties: {
            directoryPath: { type: "string", description: "Optional directory path to look in." }
          }
        }
      },
      {
        name: "list_sheets",
        description: "Lists all sheets inside a workbook file.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "read_range",
        description: "Reads a coordinate range (e.g. 'A1:C10') from a sheet and returns it as a Markdown table.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Range of cells, e.g. A1:D5." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "write_range",
        description: "Writes a single value or a 2D array of data starting at a cell or range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target range or starting cell, e.g., A1." },
            value: { type: "string", description: "A single text or numeric value to write." },
            data: { 
              type: "array", 
              items: { 
                type: "array", 
                items: { 
                  anyOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "null" }
                  ]
                }
              },
              description: "A 2D array of grid values (alternative to single value)."
            }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "format_cells",
        description: "Applies styles like bold, text color, alignment, or background color to a cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell range, e.g., A1:C5." },
            bold: { type: "boolean", description: "Set font weight to bold." },
            textColor: { type: "string", description: "Color value (e.g., 'rgb(255,0,0)' or hex)." },
            bgColor: { type: "string", description: "Background color value." },
            align: { type: "string", enum: ["left", "center", "right"], description: "Text alignment." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "list_tool",
        description: "Lists all available tools registered on this MCP server.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "describe_tool",
        description: "Explains how to use a specific tool and describes its parameters.",
        inputSchema: {
          type: "object",
          properties: {
            toolName: { type: "string", description: "The name of the tool to describe." }
          },
          required: ["toolName"]
        }
      },
      {
        name: "delete_text",
        description: "Clears cell content values/formulas within a cell or range while keeping styles.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_cell_to_default",
        description: "Clears both content and styles for a cell or range, resetting to default.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_font_color",
        description: "Sets text color for a cell or cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            color: { type: "string", description: "Color string, e.g. 'rgb(255,0,0)' or hex '#ff0000'." }
          },
          required: ["workbookPath", "range", "color"]
        }
      },
      {
        name: "set_cell_bg",
        description: "Sets background color for a cell or cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            color: { type: "string", description: "Color string, e.g. 'rgb(240,240,240)' or hex." }
          },
          required: ["workbookPath", "range", "color"]
        }
      },
      {
        name: "set_border",
        description: "Sets all borders or individual borders (top, right, bottom, left) for a cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            border: { type: "string", description: "Shorthand for all borders, formatted as '<thickness> <style> <color>' (e.g. '1px solid rgb(0,0,0)' or '2px dashed #ff0000'). Available styles: solid, dashed, dotted, double, groove, ridge, inset, outset, none." },
            top: { type: "string", description: "Top border specification, formatted as '<thickness> <style> <color>'." },
            right: { type: "string", description: "Right border specification, formatted as '<thickness> <style> <color>'." },
            bottom: { type: "string", description: "Bottom border specification, formatted as '<thickness> <style> <color>'." },
            left: { type: "string", description: "Left border specification, formatted as '<thickness> <style> <color>'." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_padding",
        description: "Sets padding style for a cell or cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            padding: { type: "string", description: "Shorthand padding value, e.g. '6px' or '4px 8px'." },
            top: { type: "string", description: "Top padding value." },
            right: { type: "string", description: "Right padding value." },
            bottom: { type: "string", description: "Bottom padding value." },
            left: { type: "string", description: "Left padding value." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_alignment",
        description: "Sets horizontal and vertical alignments for a cell or range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            align: { type: "string", enum: ["left", "center", "right"], description: "Horizontal alignment." },
            verticalAlign: { type: "string", enum: ["top", "middle", "bottom"], description: "Vertical alignment." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_font_size",
        description: "Sets font size for a cell or range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            size: { type: "string", description: "Font size value, e.g. '12pt', '14px', or '11'." }
          },
          required: ["workbookPath", "range", "size"]
        }
      },
      {
        name: "set_font_family",
        description: "Sets font family for a cell or range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            family: { type: "string", description: "Font family, e.g. 'Courier New', 'Arial', 'Verdana'." }
          },
          required: ["workbookPath", "range", "family"]
        }
      },
      {
        name: "set_font_style",
        description: "Sets font style (italic, normal) and weight (bold) for a cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            style: { type: "string", enum: ["default", "normal", "italic", "bold", "bold italic"], description: "Font style." },
            bold: { type: "boolean", description: "Set font weight to bold." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "set_format",
        description: "Applies cell value formats (plain text, html, percentages, currency, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates or range, e.g., A1:C5." },
            format: { type: "string", description: "Format definition (e.g. '0.00%', '$#,##0.00', 'Plain Text', 'HTML', 'Automatic')." }
          },
          required: ["workbookPath", "range", "format"]
        }
      },
      {
        name: "merge_cells",
        description: "Merges a cell range.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target range to merge, e.g., A1:C3." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "unmerge_cells",
        description: "Unmerges a previously merged cell.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            range: { type: "string", description: "Target cell coordinates to unmerge, e.g., A1." }
          },
          required: ["workbookPath", "range"]
        }
      },
      {
        name: "new_workbook",
        description: "Creates a new workbook file with a default sheet.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path where the new workbook file will be created." },
            sheetName: { type: "string", description: "Optional name of the default sheet (defaults to 'sheet1')." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "insert_row",
        description: "Inserts empty row(s) before or after a target row.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            row: { type: "number", description: "Target row number (1-based)." },
            count: { type: "number", description: "Optional number of rows to insert (default 1)." },
            position: { type: "string", enum: ["before", "after"], description: "Optional position relative to the target row (default 'before')." }
          },
          required: ["workbookPath", "row"]
        }
      },
      {
        name: "insert_col",
        description: "Inserts empty column(s) before or after a target column.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            column: { type: "string", description: "Target column letter (e.g. 'A')." },
            count: { type: "number", description: "Optional number of columns to insert (default 1)." },
            position: { type: "string", enum: ["before", "after"], description: "Optional position relative to the target column (default 'before')." }
          },
          required: ["workbookPath", "column"]
        }
      },
      {
        name: "delete_row",
        description: "Deletes row(s) starting from a target row.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            row: { type: "number", description: "Start row number (1-based) to delete." },
            count: { type: "number", description: "Optional number of rows to delete (default 1)." }
          },
          required: ["workbookPath", "row"]
        }
      },
      {
        name: "delete_col",
        description: "Deletes column(s) starting from a target column.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            column: { type: "string", description: "Start column letter (e.g. 'A') to delete." },
            count: { type: "number", description: "Optional number of columns to delete (default 1)." }
          },
          required: ["workbookPath", "column"]
        }
      },
      {
        name: "new_sheet",
        description: "Creates a new sheet in the workbook.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetName: { type: "string", description: "Name of the new sheet." }
          },
          required: ["workbookPath", "sheetName"]
        }
      },
      {
        name: "rename_sheet",
        description: "Renames a sheet in the workbook.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            oldName: { type: "string", description: "Current name of the sheet." },
            newName: { type: "string", description: "New name of the sheet." }
          },
          required: ["workbookPath", "oldName", "newName"]
        }
      },
      {
        name: "set_col_width",
        description: "Sets the width of a column.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            column: { type: "string", description: "Column letter (e.g. 'A') to resize." },
            width: { type: "number", description: "Width value in pixels." }
          },
          required: ["workbookPath", "column", "width"]
        }
      },
      {
        name: "get_formulas",
        description: "Lists all available spreadsheet formulas in SocialCalc, optionally filtered by category.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Optional category to filter by (e.g. 'Math & Trig', 'Statistical', 'Text', 'Date & Time', 'Logical', 'Lookup & Reference', 'Financial')." }
          }
        }
      },
      {
        name: "describe_formula",
        description: "Provides a detailed explanation and usage example for a specific SocialCalc formula function.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the formula function (e.g. 'SUM', 'VLOOKUP', 'IF')." }
          },
          required: ["name"]
        }
      },
      {
        name: "read_sheet",
        description: "Reads the entire content of a worksheet, returning a Markdown table and raw cell details.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "summarize_workbook",
        description: "Summarizes the entire workbook, listing all sheets, dimensions, hidden status, and cell counts.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "get_sheet_dimensions",
        description: "Returns the row and column dimensions (count) of a worksheet.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "describe_sheet",
        description: "Lists sheet details, column names, column headers contents, and size.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "summarize_sheet",
        description: "Provides a structured mathematical and textual summary of the sheet's populated cells.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "export_to_csv",
        description: "Exports a worksheet from a SocialCalc workbook (.json/.msc) to a CSV file.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the source SocialCalc workbook (.json or .msc)." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            csvPath: { type: "string", description: "Destination path for the exported CSV file (must end with .csv)." }
          },
          required: ["workbookPath", "csvPath"]
        }
      },
      {
        name: "import_from_csv",
        description: "Imports a CSV file into a worksheet of a SocialCalc workbook (.json/.msc).",
        inputSchema: {
          type: "object",
          properties: {
            csvPath: { type: "string", description: "Path to the source CSV file (must end with .csv)." },
            workbookPath: { type: "string", description: "Path to the target SocialCalc workbook (.json or .msc)." },
            sheetName: { type: "string", description: "Optional name of the worksheet to import into (created if it doesn't exist)." }
          },
          required: ["csvPath", "workbookPath"]
        }
      },
      {
        name: "export_to_xlsx",
        description: "Exports a SocialCalc workbook (.json/.msc) to an Excel XLSX file.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the source SocialCalc workbook (.json or .msc)." },
            xlsxPath: { type: "string", description: "Destination path for the exported XLSX file (must end with .xlsx)." }
          },
          required: ["workbookPath", "xlsxPath"]
        }
      },
      {
        name: "import_from_xlsx",
        description: "Imports an Excel XLSX file into a SocialCalc workbook (.json/.msc).",
        inputSchema: {
          type: "object",
          properties: {
            xlsxPath: { type: "string", description: "Path to the source XLSX file (must end with .xlsx)." },
            workbookPath: { type: "string", description: "Path to the target SocialCalc workbook (.json or .msc)." }
          },
          required: ["xlsxPath", "workbookPath"]
        }
      },
      {
        name: "create_full_workbook",
        description: "Creates a complete multi-sheet SocialCalc workbook from scratch with all sheets, column widths, title banners, and active sheet in a single atomic tool call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Target workbook file path (e.g., 'mcp_files/MyModel.json')." },
            sheets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name of the sheet." },
                  colWidths: { type: "object", description: "Column widths map (e.g. {'A': 180, 'B': 140})." },
                  title: { type: "string", description: "Optional title banner text on row 1." },
                  subtitle: { type: "string", description: "Optional subtitle text on row 2." }
                },
                required: ["name"]
              },
              description: "List of sheets to create with their initial configurations."
            },
            activeSheet: { type: "string", description: "Optional sheet name to set as the active initial view." }
          },
          required: ["workbookPath", "sheets"]
        }
      },
      {
        name: "batch_update_cells",
        description: "Atomically updates multiple cells across a sheet with values, formulas, typography, colors, borders, alignments, value formats, and spans in a single call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  coord: { type: "string", description: "Cell coordinate (e.g., 'A1')." },
                  value: { type: ["string", "number", "boolean", "null"], description: "Value to set." },
                  formula: { type: "string", description: "Formula string (e.g., 'SUM(B4:B15)' or '=B4*12')." },
                  bold: { type: "boolean", description: "Make text bold." },
                  italic: { type: "boolean", description: "Make text italic." },
                  fontSize: { type: "string", description: "Font size (e.g., '14pt', '10pt', '9pt', '16pt')." },
                  textColor: { type: "string", description: "Text color (e.g., 'rgb(15,23,42)')." },
                  bgColor: { type: "string", description: "Background color (e.g., 'rgb(238,242,255)')." },
                  align: { type: "string", enum: ["left", "center", "right"], description: "Alignment." },
                  valueFormat: { type: "string", description: "Format string (e.g., '$#,##0', '0.0%', '#,##0', '$#,##0.00')." },
                  colspan: { type: "number", description: "Columns to merge/span." },
                  rowspan: { type: "number", description: "Rows to merge/span." },
                  comment: { type: "string", description: "Cell comment/note." }
                },
                required: ["coord"]
              },
              description: "Array of cell updates to apply."
            }
          },
          required: ["workbookPath", "updates"]
        }
      },
      {
        name: "insert_table",
        description: "Inserts a structured data table with headers, 2D data rows, auto-formats, alignments, zebra striping, and an optional auto-computed summary/total row in 1 call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            startCell: { type: "string", description: "Top-left cell coordinate to place the table (e.g., 'A4')." },
            title: { type: "string", description: "Optional table title header." },
            headers: { type: "array", items: { type: "string" }, description: "Column header titles." },
            rows: { type: "array", items: { type: "array" }, description: "2D array of row data (supports numbers, strings, and formulas starting with '=')." },
            columnFormats: { type: "array", items: { type: "string" }, description: "Value formats per column (e.g. ['text', '$#,##0', '0.0%'])." },
            columnAligns: { type: "array", items: { type: "string", enum: ["left", "center", "right"] }, description: "Alignments per column." },
            theme: { type: "string", enum: ["indigo", "emerald", "slate", "navy", "rose", "purple", "amber", "dark"], description: "Color theme palette." },
            zebra: { type: "boolean", description: "Enable alternating row colors (default: true)." },
            includeTotalRow: { type: "boolean", description: "Add a summary/totals row at the bottom." },
            totalRowLabel: { type: "string", description: "Label for totals row (default: 'Total')." },
            totalFormulas: { type: "object", description: "Formulas per column index or header name (e.g. {'1': 'SUM', '2': 'AVERAGE'})." }
          },
          required: ["workbookPath", "startCell", "headers", "rows"]
        }
      },
      {
        name: "insert_kpi_cards",
        description: "Inserts an executive KPI card grid with titles, metrics (values or formulas), subtitles, and styled cards in 1 call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheetNumber: { type: "number", description: "Optional 1-based sheet index." },
            sheetName: { type: "string", description: "Optional sheet name." },
            startCell: { type: "string", description: "Top-left cell for the KPI cards grid (e.g., 'A4')." },
            cards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Card title / KPI label." },
                  value: { type: ["number", "string"], description: "Metric value." },
                  formula: { type: "string", description: "Formula to compute metric (e.g. 'Financials!B14')." },
                  valueFormat: { type: "string", description: "Format (e.g. '$#,##0', '0.0%', '#,##0')." },
                  theme: { type: "string", enum: ["indigo", "emerald", "amber", "rose", "purple", "slate"], description: "Card accent color theme." },
                  widthCols: { type: "number", description: "Number of columns to span per card (default: 2)." }
                },
                required: ["title"]
              },
              description: "Array of KPI cards to generate."
            },
            cardsPerRow: { type: "number", description: "Number of cards per row (default: 4)." }
          },
          required: ["workbookPath", "startCell", "cards"]
        }
      },
      {
        name: "batch_add_sheets",
        description: "Adds multiple new worksheets to an existing workbook in a single tool call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." },
            sheets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Sheet name." },
                  colWidths: { type: "object", description: "Optional column widths map (e.g. {'A': 150})." }
                },
                required: ["name"]
              },
              description: "Array of sheets to add."
            }
          },
          required: ["workbookPath", "sheets"]
        }
      },
      {
        name: "build_sheet",
        description: "One-shot worksheet builder: configures column widths, banner title/subtitle, KPI cards, structured data tables, custom cell overrides, merged ranges, borders, formats, and alignments in 1 single call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            sheetName: { type: "string", description: "Name of the sheet to build (creates if doesn't exist)." },
            colWidths: { type: "object", description: "Map of column letters to pixel widths (e.g. {'A': 160, 'B': 70, 'C': 70, 'D': 80})." },
            banner: {
              type: "object",
              properties: {
                title: { type: "string", description: "Main banner title text." },
                subtitle: { type: "string", description: "Subtitle/metadata text on row below title." },
                startCell: { type: "string", description: "Starting cell coordinate (default: 'A1')." },
                colspan: { type: "number", description: "Column span for banner (defaults to number of columns)." },
                bgTitle: { type: "string", description: "Background color for title (e.g. '#4F46E5')." },
                textTitle: { type: "string", description: "Text color for title (default: '#ffffff')." },
                bgSubtitle: { type: "string", description: "Background color for subtitle (e.g. '#EEF2FF')." },
                textSubtitle: { type: "string", description: "Text color for subtitle (e.g. '#4F46E5')." },
                align: { type: "string", enum: ["left", "center", "right"], description: "Text alignment." }
              },
              required: ["title"]
            },
            kpiCards: {
              type: "object",
              properties: {
                startCell: { type: "string", description: "Top-left cell for KPI cards (e.g. 'A4')." },
                cardsPerRow: { type: "number", description: "Cards per row (default: 4)." },
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Card title." },
                      value: { type: ["string", "number"], description: "Value." },
                      formula: { type: "string", description: "Formula." },
                      valueFormat: { type: "string", description: "Format (e.g. '$#,##0', '0.0%')." },
                      theme: { type: "string", enum: ["indigo", "emerald", "amber", "rose", "purple", "slate"], description: "Color theme." },
                      widthCols: { type: "number", description: "Colspan (default: 2)." }
                    },
                    required: ["title"]
                  }
                }
              },
              required: ["startCell", "cards"]
            },
            tables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  startCell: { type: "string", description: "Start cell (e.g. 'A4')." },
                  title: { type: "string", description: "Optional table title." },
                  headers: { type: "array", items: { type: "string" }, description: "Header labels." },
                  rows: { type: "array", items: { type: "array" }, description: "2D data rows." },
                  columnFormats: { type: "array", items: { type: "string" }, description: "Value formats per col." },
                  columnAligns: { type: "array", items: { type: "string", enum: ["left", "center", "right"] }, description: "Alignments per col." },
                  theme: { type: "string", enum: ["indigo", "emerald", "slate", "navy", "rose", "purple", "amber", "dark"], description: "Theme." },
                  zebra: { type: "boolean", description: "Zebra striping (default: true)." },
                  includeTotalRow: { type: "boolean", description: "Include total row." },
                  totalRowLabel: { type: "string", description: "Total label (default: 'Total')." },
                  totalFormulas: { type: "object", description: "Total formulas map." }
                },
                required: ["startCell", "headers", "rows"]
              },
              description: "Tables to insert on this sheet."
            },
            cells: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  coord: { type: "string", description: "Cell coord (e.g. 'A10')." },
                  value: { type: ["string", "number", "boolean", "null"], description: "Value." },
                  formula: { type: "string", description: "Formula." },
                  bold: { type: "boolean", description: "Bold." },
                  italic: { type: "boolean", description: "Italic." },
                  fontSize: { type: "string", description: "Font size (e.g. '14pt')." },
                  textColor: { type: "string", description: "Text color." },
                  bgColor: { type: "string", description: "Bg color." },
                  align: { type: "string", enum: ["left", "center", "right"], description: "Alignment." },
                  valueFormat: { type: "string", description: "Value format (e.g. '$#,##0.00')." },
                  colspan: { type: "number", description: "Colspan." },
                  rowspan: { type: "number", description: "Rowspan." },
                  comment: { type: "string", description: "Comment." }
                },
                required: ["coord"]
              },
              description: "Arbitrary cell updates."
            },
            mergedRanges: { type: "array", items: { type: "string" }, description: "List of cell ranges to merge (e.g. ['A1:D1', 'A13:D13'])." },
            borders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  range: { type: "string", description: "Range (e.g. 'A11:D11')." },
                  border: { type: "string", description: "Border style shorthand." },
                  top: { type: "string", description: "Top border." },
                  bottom: { type: "string", description: "Bottom border." },
                  left: { type: "string", description: "Left border." },
                  right: { type: "string", description: "Right border." }
                },
                required: ["range"]
              },
              description: "List of border specifications."
            },
            formats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  range: { type: "string", description: "Range (e.g. 'C5:D10')." },
                  format: { type: "string", description: "Format (e.g. '$#,##0.00')." }
                },
                required: ["range", "format"]
              },
              description: "Value formats to apply."
            },
            alignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  range: { type: "string", description: "Range." },
                  align: { type: "string", enum: ["left", "center", "right"], description: "Horizontal align." },
                  verticalAlign: { type: "string", enum: ["top", "middle", "bottom"], description: "Vertical align." }
                },
                required: ["range"]
              },
              description: "Alignments to apply."
            }
          },
          required: ["workbookPath"]
        }
      },
      {
        name: "build_workbook",
        description: "Builds a complete multi-sheet workbook with multiple fully-configured sheets in 1 single call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            activeSheet: { type: "string", description: "Optional name of active sheet." },
            sheets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sheetName: { type: "string", description: "Sheet name." },
                  name: { type: "string", description: "Alias for sheetName." },
                  colWidths: { type: "object", description: "Column widths map." },
                  banner: { type: "object", description: "Title/subtitle banner config." },
                  kpiCards: { type: "object", description: "KPI cards config." },
                  tables: { type: "array", description: "Structured tables." },
                  cells: { type: "array", description: "Cell updates." },
                  mergedRanges: { type: "array", items: { type: "string" }, description: "Merged ranges." },
                  borders: { type: "array", description: "Borders." },
                  formats: { type: "array", description: "Formats." },
                  alignments: { type: "array", description: "Alignments." }
                }
              },
              description: "Array of sheets to create and build."
            }
          },
          required: ["workbookPath", "sheets"]
        }
      },
      {
        name: "batch_execute",
        description: "Executes an arbitrary sequence of tool operations against an in-memory workbook, validates integrity, and saves to disk in 1 single call.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook file." },
            operations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tool: { type: "string", description: "Tool name to execute (e.g. 'set_col_width', 'write_range', 'format_cells', 'set_format', 'set_border', 'merge_cells', 'insert_table', 'insert_kpi_cards', 'batch_update_cells', 'build_sheet')." },
                  args: { type: "object", description: "Arguments for the tool." }
                },
                required: ["tool", "args"]
              },
              description: "Array of operations to execute in order."
            }
          },
          required: ["workbookPath", "operations"]
        }
      },
      {
        name: "validate_workbook_integrity",
        description: "Performs an automated audit of the workbook checking SocialCalc syntax, sheet references, cell boundaries, and format integrity.",
        inputSchema: {
          type: "object",
          properties: {
            workbookPath: { type: "string", description: "Path to the workbook." }
          },
          required: ["workbookPath"]
        }
      }
    ];
  }

  /**
   * Public execution handler to run an MCP tool.
   */
  public async executeTool(name: string, args: any) {
    try {
      // Validate required arguments based on tool schema
      const tool = this.listTools().find(t => t.name === name);
      if (tool && tool.inputSchema && tool.inputSchema.required) {
        for (const reqProp of tool.inputSchema.required) {
          if (args === undefined || args[reqProp] === undefined || args[reqProp] === null || args[reqProp] === "") {
            throw new Error(`Missing required argument '${reqProp}' for tool '${name}'`);
          }
        }
      }

      if (args && args.workbookPath) {
        args.workbookPath = resolveTargetFilePath(args.workbookPath);
        const ext = path.extname(args.workbookPath).toLowerCase();
        if (ext !== ".json" && ext !== ".msc") {
          throw new Error(`Invalid workbook format: '${ext}'. Core operations only support '.json' and '.msc' files. For CSV or XLSX, please use the import/export tools.`);
        }
      }

      if (args && args.csvPath) {
        args.csvPath = resolveTargetFilePath(args.csvPath);
        const ext = path.extname(args.csvPath).toLowerCase();
        if (ext !== ".csv") {
          throw new Error(`Invalid CSV path: '${args.csvPath}'. File extension must be '.csv'.`);
        }
      }

      if (args && args.xlsxPath) {
        args.xlsxPath = resolveTargetFilePath(args.xlsxPath);
        const ext = path.extname(args.xlsxPath).toLowerCase();
        if (ext !== ".xlsx") {
          throw new Error(`Invalid XLSX path: '${args.xlsxPath}'. File extension must be '.xlsx'.`);
        }
      }

      switch (name) {
        case "list_workbooks": {
          const dir = args.directoryPath ? path.resolve(args.directoryPath) : getMcpFilesDir();
          await fs.mkdir(dir, { recursive: true });
          const files = await fs.readdir(dir);
          const workbooks = files.filter(f => f.endsWith(".json") || f.endsWith(".msc"));
          return {
            content: [{ type: "text", text: `Found workbooks in ${dir}:\n${workbooks.map(w => `- ${w}`).join("\n") || "No workbooks found."}` }]
          };
        }

        case "list_sheets": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheets = workbook.getSheetsMetadata();
          const sheetList = sheets.map(s => `- **${s.name}** (ID: ${s.id}${s.hidden ? ", hidden" : ""})`).join("\n");
          return {
            content: [{ type: "text", text: `Workbook sheets:\n${sheetList}` }]
          };
        }

        case "read_range": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const range = parseRange(args.range);
          const markdown = sheetToMarkdownTable(sheet, range.startRow, range.endRow, range.startColIndex, range.endColIndex);
          return {
            content: [{ type: "text", text: `### Sheet: ${sheet.name} (Range: ${args.range})\n\n${markdown || "*No data in range*"}` }]
          };
        }

        case "write_range": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          let gridData: (string | number | null)[][] = [];

          if (args.data) {
            gridData = args.data;
          } else if (args.value !== undefined) {
            const num = Number(args.value);
            const val = isNaN(num) || args.value === "" ? args.value : num;
            
            const range = parseRange(args.range);
            const rows = range.endRow - range.startRow + 1;
            const cols = range.endColIndex - range.startColIndex + 1;
            
            gridData = Array.from({ length: rows }, () => Array(cols).fill(val));
          } else {
            throw new Error("Must provide either 'value' or 'data' for writing.");
          }

          adapter.writeRange(sheet, args.range, gridData);
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully wrote data to ${args.range} in sheet '${sheet.name}'.` }]
          };
        }

        case "format_cells": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const style: any = {};
          if (args.bold) style.font = "normal bold 10pt Arial";
          if (args.textColor) style.textColor = args.textColor;
          if (args.bgColor) style.bgColor = args.bgColor;
          if (args.align) style.align = args.align;

          adapter.applyStyle(sheet, args.range, style);
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully formatted cells ${args.range} in sheet '${sheet.name}'.` }]
          };
        }

        case "list_tool": {
          const tools = this.listTools();
          const toolSummary = tools.map(t => `- **${t.name}**: ${t.description}`).join("\n");
          return {
            content: [{ type: "text", text: `### Registered MCP Tools\n\n${toolSummary}` }]
          };
        }

        case "describe_tool": {
          const tool = this.listTools().find(t => t.name === args.toolName);
          if (!tool) throw new Error(`Tool '${args.toolName}' not found`);

          const props = tool.inputSchema?.properties || {};
          const required = tool.inputSchema?.required || [];
          let paramsHelp = "";
          for (const [propName, propSchema] of Object.entries(props) as any) {
            const req = required.includes(propName) ? " *(required)*" : "";
            paramsHelp += `- **${propName}** (${propSchema.type})${req}: ${propSchema.description || "No description provided."}\n`;
          }

          const helpText = `### Tool: ${tool.name}\n\n${tool.description}\n\n**Arguments:**\n${paramsHelp || "*No arguments required*"}`;
          return {
            content: [{ type: "text", text: helpText }]
          };
        }

        case "delete_text": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          for (const { cell } of rangeCells) {
            delete cell.val;
            delete cell.text;
            delete cell.formula;
            delete cell.valuetype;
          }
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully cleared cell content in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_cell_to_default": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const range = parseRange(args.range);
          for (let r = range.startRow; r <= range.endRow; r++) {
            for (let c = range.startColIndex; c <= range.endColIndex; c++) {
              sheet.deleteCell(formatCoordinate(c, r));
            }
          }
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully reset cells in range '${args.range}' to default in sheet '${sheet.name}'.` }]
          };
        }

        case "set_font_color": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          adapter.applyStyle(sheet, args.range, { textColor: args.color });
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set font color to '${args.color}' for range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_cell_bg": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          adapter.applyStyle(sheet, args.range, { bgColor: args.color });
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set background color to '${args.color}' for range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_border": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          if (args.border) {
            const borderIdx = StyleService.registerBorder(sheet, args.border);
            for (const { cell } of rangeCells) {
              cell.borders = { top: borderIdx, right: borderIdx, bottom: borderIdx, left: borderIdx };
            }
          } else if (args.top || args.right || args.bottom || args.left) {
            for (const { cell } of rangeCells) {
              const borders = cell.borders || { top: 0, right: 0, bottom: 0, left: 0 };
              if (args.top) borders.top = StyleService.registerBorder(sheet, args.top);
              if (args.right) borders.right = StyleService.registerBorder(sheet, args.right);
              if (args.bottom) borders.bottom = StyleService.registerBorder(sheet, args.bottom);
              if (args.left) borders.left = StyleService.registerBorder(sheet, args.left);
              cell.borders = borders;
            }
          } else {
            throw new Error("Must provide 'border' or at least one of 'top', 'right', 'bottom', 'left'.");
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully applied borders to range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_padding": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          const updates: any = {};
          if (args.padding !== undefined) updates.padding = String(args.padding);
          if (args.top !== undefined) updates.top = String(args.top);
          if (args.right !== undefined) updates.right = String(args.right);
          if (args.bottom !== undefined) updates.bottom = String(args.bottom);
          if (args.left !== undefined) updates.left = String(args.left);

          if (Object.keys(updates).length === 0) {
            throw new Error("Must provide 'padding' or at least one of 'top', 'right', 'bottom', 'left'.");
          }

          for (const { cell } of rangeCells) {
            const currentLayout = cell.layoutIndex ? (sheet.layouts.get(cell.layoutIndex) || "") : "";
            const newLayout = parseAndFormatLayout(currentLayout, updates);
            cell.layoutIndex = StyleService.registerLayout(sheet, newLayout);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set padding in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_alignment": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          for (const { cell } of rangeCells) {
            if (args.align) {
              cell.cellFormatIndex = StyleService.registerCellFormat(sheet, args.align);
            }
            if (args.verticalAlign) {
              const currentLayout = cell.layoutIndex ? (sheet.layouts.get(cell.layoutIndex) || "") : "";
              const newLayout = parseAndFormatLayout(currentLayout, { verticalAlign: args.verticalAlign });
              cell.layoutIndex = StyleService.registerLayout(sheet, newLayout);
            }
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set alignments in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_font_size": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          for (const { cell } of rangeCells) {
            const currentFont = cell.fontIndex ? (sheet.fonts.get(cell.fontIndex) || "normal normal 10pt Arial") : "normal normal 10pt Arial";
            const newFont = updateFontProperty(currentFont, { size: String(args.size) });
            cell.fontIndex = StyleService.registerFont(sheet, newFont);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set font size to '${args.size}' for range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_font_family": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          for (const { cell } of rangeCells) {
            const currentFont = cell.fontIndex ? (sheet.fonts.get(cell.fontIndex) || "normal normal 10pt Arial") : "normal normal 10pt Arial";
            const newFont = updateFontProperty(currentFont, { family: args.family });
            cell.fontIndex = StyleService.registerFont(sheet, newFont);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set font family to '${args.family}' for range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_font_style": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);

          const updates: any = {};
          if (args.style) {
            if (args.style === "bold") {
              updates.style = "normal";
              updates.weight = "bold";
            } else if (args.style === "bold italic") {
              updates.style = "italic";
              updates.weight = "bold";
            } else if (args.style === "italic") {
              updates.style = "italic";
              updates.weight = "normal";
            } else if (args.style === "normal") {
              updates.style = "normal";
              updates.weight = "normal";
            } else if (args.style === "default") {
              updates.style = "normal";
              updates.weight = "normal";
            }
          }
          if (args.bold !== undefined) {
            updates.weight = args.bold ? "bold" : "normal";
          }

          for (const { cell } of rangeCells) {
            const currentFont = cell.fontIndex ? (sheet.fonts.get(cell.fontIndex) || "normal normal 10pt Arial") : "normal normal 10pt Arial";
            const newFont = updateFontProperty(currentFont, updates);
            cell.fontIndex = StyleService.registerFont(sheet, newFont);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set font style in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "set_format": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const normalizedFormat = normalizeFormat(args.format);
          const vfIdx = StyleService.registerValueFormat(sheet, normalizedFormat);
          const isTextFormat = normalizedFormat.toLowerCase().startsWith("text-");

          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          for (const { cell } of rangeCells) {
            if (isTextFormat) {
              cell.textValueFormatIndex = vfIdx;
            } else {
              cell.nonTextValueFormatIndex = vfIdx;
            }
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully applied format '${args.format}' to range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "merge_cells": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const range = parseRange(args.range);
          const topLeftCoord = `${colIndexToLetter(range.startColIndex)}${range.startRow}`;
          const targetCell = sheet.getCell(topLeftCoord, true)!;

          const colspan = range.endColIndex - range.startColIndex + 1;
          const rowspan = range.endRow - range.startRow + 1;

          if (colspan > 1) targetCell.colspan = colspan;
          if (rowspan > 1) targetCell.rowspan = rowspan;

          for (let r = range.startRow; r <= range.endRow; r++) {
            for (let c = range.startColIndex; c <= range.endColIndex; c++) {
              const coord = `${colIndexToLetter(c)}${r}`;
              if (coord !== topLeftCoord) {
                sheet.deleteCell(coord);
              }
            }
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully merged cells in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "unmerge_cells": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const range = parseRange(args.range);
          const topLeftCoord = `${colIndexToLetter(range.startColIndex)}${range.startRow}`;
          const targetCell = sheet.getCell(topLeftCoord);
          if (!targetCell) throw new Error(`Top-left cell '${topLeftCoord}' not found`);

          delete targetCell.colspan;
          delete targetCell.rowspan;

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully unmerged cells in range '${args.range}' in sheet '${sheet.name}'.` }]
          };
        }

        case "new_workbook": {
          const workbook = new Workbook();
          const sheetName = args.sheetName || "sheet1";
          const sheet = workbook.addSheet("sheet1", sheetName, false);
          sheet.maxCol = 1;
          sheet.maxRow = 1;
          workbook.setActiveSheet("sheet1");

          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{ type: "text", text: `Successfully created workbook at '${args.workbookPath}' with sheet '${sheetName}'.` }]
          };
        }

        case "insert_row": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const count = args.count || 1;
          const atRow = Number(args.row);
          const position = args.position || "before";

          for (let i = 0; i < count; i++) {
            if (position === "after") {
              SheetService.insertRow(sheet, atRow);
            } else {
              SheetService.insertRow(sheet, atRow - 1);
            }
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully inserted ${count} row(s) ${position} row ${atRow} in sheet '${sheet.name}'.` }]
          };
        }

        case "insert_col": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const count = args.count || 1;
          const colLetter = args.column.toUpperCase();
          const position = args.position || "before";

          const colIdx = colLetterToIndex(colLetter);

          for (let i = 0; i < count; i++) {
            if (position === "after") {
              SheetService.insertCol(sheet, colLetter);
            } else {
              const beforeCol = colIdx > 1 ? colIndexToLetter(colIdx - 1) : "";
              SheetService.insertCol(sheet, beforeCol);
            }
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully inserted ${count} column(s) ${position} column '${colLetter}' in sheet '${sheet.name}'.` }]
          };
        }

        case "delete_row": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const count = args.count || 1;
          const startRow = Number(args.row);

          for (let i = 0; i < count; i++) {
            SheetService.deleteRow(sheet, startRow);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully deleted ${count} row(s) starting from row ${startRow} in sheet '${sheet.name}'.` }]
          };
        }

        case "delete_col": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const count = args.count || 1;
          const colLetter = args.column.toUpperCase();

          for (let i = 0; i < count; i++) {
            SheetService.deleteCol(sheet, colLetter);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully deleted ${count} column(s) starting from column '${colLetter}' in sheet '${sheet.name}'.` }]
          };
        }

        case "new_sheet": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          if (workbook.getSheetByName(args.sheetName)) {
            throw new Error(`Sheet with name '${args.sheetName}' already exists.`);
          }

          adapter.createSheet(workbook, args.sheetName);
          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully created sheet '${args.sheetName}' in workbook.` }]
          };
        }

        case "rename_sheet": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          if (workbook.getSheetByName(args.newName)) {
            throw new Error(`Sheet with name '${args.newName}' already exists.`);
          }

          const success = adapter.renameSheet(workbook, args.oldName, args.newName);
          if (!success) throw new Error(`Sheet '${args.oldName}' not found`);

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully renamed sheet '${args.oldName}' to '${args.newName}'.` }]
          };
        }

        case "set_col_width": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const colLetter = args.column.toUpperCase();
          const width = Number(args.width);

          sheet.colWidths.set(colLetter, width);

          await adapter.saveWorkbook(workbook, args.workbookPath);
          return {
            content: [{ type: "text", text: `Successfully set column '${colLetter}' width to ${width}px.` }]
          };
        }

        case "get_formulas": {
          const category = args.category;
          let list = FORMULAS;
          if (category) {
            list = FORMULAS.filter(f => f.category.toLowerCase() === category.toLowerCase());
          }
          const formatted = list.map(f => `- **${f.name}** (${f.category}): ${f.desc}`).join("\n");
          return {
            content: [{ type: "text", text: `Available formulas in SocialCalc${category ? ` (filtered by category: ${category})` : ""}:\n\n${formatted || "No formulas found matching category."}` }]
          };
        }

        case "describe_formula": {
          const name = args.name.toUpperCase().trim();
          const formula = FORMULAS.find(f => f.name === name);
          if (!formula) {
            throw new Error(`Formula function '${name}' not found.`);
          }
          const info = [
            `### Formula: ${formula.name}`,
            `- **Category**: ${formula.category}`,
            `- **Description**: ${formula.desc}`,
            `- **Usage Syntax**: \`${formula.usage}\``,
            `- **Usage Example**: \`${formula.example}\``
          ].join("\n");
          return {
            content: [{ type: "text", text: info }]
          };
        }

        case "read_sheet": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const startRow = 1;
          const endRow = sheet.maxRow || 1;
          const startColIdx = 1;
          const endColIdx = sheet.maxCol || 1;

          const markdownTable = sheetToMarkdownTable(sheet, startRow, endRow, startColIdx, endColIdx);

          const cellDetails: Record<string, any> = {};
          for (const [coord, cell] of sheet.cells.entries()) {
            cellDetails[coord] = {
              value: cell.val,
              text: cell.text,
              formula: cell.formula,
              valuetype: cell.valuetype,
              font: cell.fontIndex ? sheet.fonts.get(cell.fontIndex) : undefined,
              textColor: cell.textColorIndex ? sheet.colors.get(cell.textColorIndex) : undefined,
              bgColor: cell.bgColorIndex ? sheet.colors.get(cell.bgColorIndex) : undefined,
              border: cell.borders,
              colspan: cell.colspan,
              rowspan: cell.rowspan,
            };
          }

          const resultText = `### Sheet: ${sheet.name} (Full Sheet)\n\n${markdownTable || "*No data in sheet*"}\n\n#### Raw Cell Details:\n\`\`\`json\n${JSON.stringify(cellDetails, null, 2)}\n\`\`\``;

          return {
            content: [{ type: "text", text: resultText }]
          };
        }

        case "summarize_workbook": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const metadata = workbook.getSheetsMetadata();
          
          const summaryLines = [];
          for (const meta of metadata) {
            const sheet = workbook.getSheetById(meta.id);
            const rows = sheet ? (sheet.maxRow || 0) : 0;
            const cols = sheet ? (sheet.maxCol || 0) : 0;
            const cellCount = sheet ? sheet.cells.size : 0;
            summaryLines.push(
              `- **${meta.name}** (ID: ${meta.id}): ${rows} rows x ${cols} columns, ${cellCount} populated cells. Hidden: ${meta.hidden ? "Yes" : "No"}. ${meta.id === workbook.currentId ? "[Active]" : ""}`
            );
          }

          return {
            content: [{ type: "text", text: `### Workbook Summary: ${args.workbookPath}\nTotal Sheets: ${metadata.length}\n\n${summaryLines.join("\n")}` }]
          };
        }

        case "get_sheet_dimensions": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const maxRow = sheet.maxRow || 0;
          const maxCol = sheet.maxCol || 0;

          return {
            content: [{ type: "text", text: `Sheet '${sheet.name}' dimensions: ${maxRow} rows, ${maxCol} columns.` }]
          };
        }

        case "describe_sheet": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const colHeaders: { col: string; header: string }[] = [];
          const maxCol = sheet.maxCol || 1;
          for (let c = 1; c <= maxCol; c++) {
            const colLetter = colIndexToLetter(c);
            const cell = sheet.getCell(formatCoordinate(c, 1));
            const headerVal = cell ? (cell.text || cell.val?.toString() || "") : "";
            colHeaders.push({ col: colLetter, header: headerVal });
          }

          const descStr = `### Sheet: ${sheet.name}\n` +
            `- Dimensions: ${sheet.maxRow} Rows x ${sheet.maxCol} Columns\n` +
            `- Columns Schema:\n` +
            colHeaders.map(ch => `  - **${ch.col}**: ${ch.header || "*No Header*"}`).join("\n");

          return {
            content: [{ type: "text", text: descStr }]
          };
        }

        case "summarize_sheet": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const summary = SpreadsheetService.getSheetSummary(sheet);

          return {
            content: [{ type: "text", text: `### Sheet Summary: ${sheet.name}\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`` }]
          };
        }

        case "export_to_csv": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) throw new Error("Target sheet not found");

          const csvContent = sheetToCsv(sheet);
          const absoluteCsvPath = path.resolve(args.csvPath);
          await fs.mkdir(path.dirname(absoluteCsvPath), { recursive: true });
          await fs.writeFile(absoluteCsvPath, csvContent, "utf-8");

          return {
            content: [{ type: "text", text: `Successfully exported sheet '${sheet.name}' to CSV at '${args.csvPath}'.` }]
          };
        }

        case "import_from_csv": {
          const absoluteCsvPath = path.resolve(args.csvPath);
          let csvContent: string;
          try {
            csvContent = await fs.readFile(absoluteCsvPath, "utf-8");
          } catch (err: any) {
            throw new Error(`Failed to read CSV file at '${args.csvPath}': ${err.message}`);
          }

          const workbook = await adapter.openWorkbook(args.workbookPath);
          let sheet;
          if (args.sheetName) {
            sheet = workbook.getSheetByName(args.sheetName);
            if (!sheet) {
              // Create sheet if it doesn't exist
              sheet = adapter.createSheet(workbook, args.sheetName);
            }
          } else {
            sheet = resolveSheet(workbook, args);
          }

          if (!sheet) throw new Error("Could not resolve target sheet for import.");

          csvToSheet(sheet, csvContent);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{ type: "text", text: `Successfully imported CSV from '${args.csvPath}' into sheet '${sheet.name}' of workbook '${args.workbookPath}'.` }]
          };
        }

        case "export_to_xlsx": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const buffer = await workbookToXlsx(workbook);
          const absoluteXlsxPath = path.resolve(args.xlsxPath);
          await fs.mkdir(path.dirname(absoluteXlsxPath), { recursive: true });
          await fs.writeFile(absoluteXlsxPath, buffer);

          return {
            content: [{ type: "text", text: `Successfully exported workbook to Excel XLSX at '${args.xlsxPath}'.` }]
          };
        }

        case "import_from_xlsx": {
          const absoluteXlsxPath = path.resolve(args.xlsxPath);
          let buffer: Buffer;
          try {
            buffer = await fs.readFile(absoluteXlsxPath);
          } catch (err: any) {
            throw new Error(`Failed to read XLSX file at '${args.xlsxPath}': ${err.message}`);
          }

          const importedWorkbook = await xlsxToWorkbook(buffer);
          await adapter.saveWorkbook(importedWorkbook, args.workbookPath);

          return {
            content: [{ type: "text", text: `Successfully imported Excel XLSX from '${args.xlsxPath}' into SocialCalc workbook '${args.workbookPath}'.` }]
          };
        }

        case "create_full_workbook": {
          const workbook = BatchSpreadsheetService.createFullWorkbook(args.sheets, args.activeSheet);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          const sheetNames = Array.from(workbook.sheets.values()).map(s => s.name);
          return {
            content: [{
              type: "text",
              text: `Successfully created multi-sheet workbook '${args.workbookPath}' with ${sheetNames.length} sheets: [${sheetNames.join(", ")}].`
            }]
          };
        }

        case "batch_update_cells": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) {
            throw new Error(`Sheet not found in workbook '${args.workbookPath}'`);
          }

          const count = BatchSpreadsheetService.applyBatchCellUpdates(sheet, args.updates);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully updated ${count} cells in sheet '${sheet.name}' of workbook '${args.workbookPath}'.`
            }]
          };
        }

        case "insert_table": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) {
            throw new Error(`Sheet not found in workbook '${args.workbookPath}'`);
          }

          const result = BatchSpreadsheetService.insertTable(sheet, {
            startCell: args.startCell,
            title: args.title,
            headers: args.headers,
            rows: args.rows,
            columnFormats: args.columnFormats,
            columnAligns: args.columnAligns,
            theme: args.theme,
            zebra: args.zebra,
            includeTotalRow: args.includeTotalRow,
            totalRowLabel: args.totalRowLabel,
            totalFormulas: args.totalFormulas
          });

          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully inserted table (${result.rowCount} rows x ${result.colCount} columns) across range ${result.startCell}:${result.endCell} in sheet '${sheet.name}'.`
            }]
          };
        }

        case "insert_kpi_cards": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const sheet = resolveSheet(workbook, args);
          if (!sheet) {
            throw new Error(`Sheet not found in workbook '${args.workbookPath}'`);
          }

          const result = BatchSpreadsheetService.insertKpiCards(
            sheet,
            args.startCell,
            args.cards,
            args.cardsPerRow || 4
          );

          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully inserted ${result.count} KPI metric cards (range ${args.startCell.toUpperCase()}:${result.endCell}) in sheet '${sheet.name}'.`
            }]
          };
        }

        case "batch_add_sheets": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const addedNames: string[] = [];

          for (const s of args.sheets) {
            const sheetId = `sheet${workbook.sheets.size + 1}`;
            const sheet = workbook.addSheet(sheetId, s.name);
            if (s.colWidths) {
              for (const [col, width] of Object.entries(s.colWidths)) {
                sheet.colWidths.set(col.toUpperCase(), width as number);
              }
            }
            addedNames.push(s.name);
          }

          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully added ${addedNames.length} new sheets to workbook '${args.workbookPath}': [${addedNames.join(", ")}].`
            }]
          };
        }

        case "build_sheet": {
          let workbook: Workbook;
          try {
            workbook = await adapter.openWorkbook(args.workbookPath);
          } catch {
            workbook = new Workbook();
          }

          let sheet = resolveSheet(workbook, args);
          if (!sheet) {
            const sheetName = args.sheetName || (args.sheetNumber ? `sheet${args.sheetNumber}` : `sheet${workbook.sheets.size + 1}`);
            const sheetId = `sheet${workbook.sheets.size + 1}`;
            sheet = workbook.addSheet(sheetId, sheetName);
          }

          const result = BatchSpreadsheetService.buildSheet(sheet, args);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully built sheet '${result.sheetName}' in workbook '${args.workbookPath}' (Dimensions: ${result.maxCol} cols x ${result.maxRow} rows) in 1 atomic step.`
            }]
          };
        }

        case "build_workbook": {
          const workbook = BatchSpreadsheetService.buildWorkbook(args);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          const sheetNames = Array.from(workbook.sheets.values()).map(s => s.name);
          return {
            content: [{
              type: "text",
              text: `Successfully built complete multi-sheet workbook '${args.workbookPath}' with ${sheetNames.length} sheets: [${sheetNames.join(", ")}] in 1 atomic step.`
            }]
          };
        }

        case "batch_execute": {
          let workbook: Workbook;
          try {
            workbook = await adapter.openWorkbook(args.workbookPath);
          } catch {
            workbook = new Workbook();
          }

          const res = BatchSpreadsheetService.executeBatch(workbook, args.operations, adapter);
          await adapter.saveWorkbook(workbook, args.workbookPath);

          return {
            content: [{
              type: "text",
              text: `Successfully executed ${res.executed} batch operations on workbook '${args.workbookPath}':\n${res.results.join("\n")}`
            }]
          };
        }

        case "validate_workbook_integrity": {
          const workbook = await adapter.openWorkbook(args.workbookPath);
          const result = BatchSpreadsheetService.validateWorkbook(workbook);

          let output = `### Workbook Integrity Audit: ${args.workbookPath}\n`;
          output += `**Status**: ${result.isValid ? "✅ PASS" : "❌ ERRORS DETECTED"}\n`;
          output += `**Errors Count**: ${result.errors.length}\n`;
          output += `**Warnings Count**: ${result.warnings.length}\n\n`;

          if (result.errors.length > 0) {
            output += `#### Errors:\n`;
            result.errors.forEach((e: any) => {
              output += `- [Line ${e.line}] [${e.level}] ${e.message}\n`;
            });
          }

          if (result.warnings.length > 0) {
            output += `#### Warnings:\n`;
            result.warnings.slice(0, 10).forEach((w: any) => {
              output += `- [Line ${w.line}] [${w.level}] ${w.message}\n`;
            });
          }

          return {
            content: [{ type: "text", text: output }]
          };
        }

        default:
          throw new Error(`Tool not found: ${name}`);
      }
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${error.message}` }]
      };
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.listTools() };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      return await this.executeTool(name, args);
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}
