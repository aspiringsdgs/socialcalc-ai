import { Workbook } from "../models/workbook.js";
import { Sheet } from "../models/sheet.js";
import { Cell } from "../models/cell.js";
import { SocialCalcAdapter } from "../adapters/socialcalc/adapter.js";
import { serializeSheetSaveStr } from "../adapters/socialcalc/serializer.js";
import { StyleService } from "./styles.js";
import { SheetService } from "./sheet.js";
import SocialCalcValidator from "../utils/validator.js";
import {
  parseCoordinate,
  formatCoordinate,
  colIndexToLetter,
  colLetterToIndex,
  parseRange
} from "../utils/coordinate.js";

export interface SheetConfig {
  name: string;
  colWidths?: Record<string, number>;
  title?: string;
  subtitle?: string;
}

export interface CellUpdate {
  coord: string;
  value?: string | number | boolean | null;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: string; // e.g. "14pt", "10pt", "9pt", "16pt"
  fontFamily?: string;
  textColor?: string; // e.g. "rgb(15,23,42)" or "#0f172a"
  bgColor?: string; // e.g. "rgb(238,242,255)"
  align?: "left" | "center" | "right";
  valueFormat?: string; // e.g. "$#,##0", "0.0%", "#,##0", "$#,##0.00"
  colspan?: number;
  rowspan?: number;
  comment?: string;
}

export interface TableConfig {
  startCell: string; // e.g. "A4"
  title?: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
  columnFormats?: (string | null | undefined)[]; // e.g. ["text", "$#,##0", "0.0%"]
  columnAligns?: ("left" | "center" | "right")[];
  theme?: "indigo" | "emerald" | "slate" | "navy" | "rose" | "dark";
  zebra?: boolean;
  includeTotalRow?: boolean;
  totalRowLabel?: string;
  totalFormulas?: Record<number | string, "SUM" | "AVERAGE" | "COUNT" | "MIN" | "MAX" | string>;
}

export interface BannerConfig {
  title: string;
  subtitle?: string;
  startCell?: string;
  colspan?: number;
  bgTitle?: string;
  textTitle?: string;
  bgSubtitle?: string;
  textSubtitle?: string;
  align?: "left" | "center" | "right";
}

export interface BorderConfig {
  range: string;
  border?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export interface FormatConfig {
  range: string;
  format: string;
}

export interface AlignmentConfig {
  range: string;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}

export interface BuildSheetConfig {
  name?: string;
  sheetName?: string;
  colWidths?: Record<string, number>;
  banner?: BannerConfig;
  kpiCards?: {
    startCell: string;
    cardsPerRow?: number;
    cards: KpiCardConfig[];
  };
  tables?: TableConfig[];
  cells?: CellUpdate[];
  mergedRanges?: string[];
  borders?: BorderConfig[];
  formats?: FormatConfig[];
  alignments?: AlignmentConfig[];
}

export interface BuildWorkbookConfig {
  workbookPath: string;
  activeSheet?: string;
  sheets: BuildSheetConfig[];
}

export interface BatchExecuteOperation {
  tool: string;
  args: any;
}

export interface BatchExecuteConfig {
  workbookPath: string;
  operations: BatchExecuteOperation[];
}

export interface KpiCardConfig {
  title: string;
  value?: string | number;
  formula?: string;
  subtitle?: string;
  valueFormat?: string;
  theme?: "indigo" | "emerald" | "amber" | "rose" | "slate" | "purple";
  widthCols?: number;
}

export const THEME_PALETTES = {
  indigo: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(30,41,59)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(238,242,255)",
    accentText: "rgb(79,70,229)",
    border: "1px solid rgb(226,232,240)",
    zebraBg: "rgb(248,250,252)",
    totalBg: "rgb(226,232,240)"
  },
  emerald: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(6,78,59)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(236,253,245)",
    accentText: "rgb(5,150,105)",
    border: "1px solid rgb(209,250,229)",
    zebraBg: "rgb(240,253,244)",
    totalBg: "rgb(209,250,229)"
  },
  slate: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(51,65,85)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(241,245,249)",
    accentText: "rgb(71,85,105)",
    border: "1px solid rgb(226,232,240)",
    zebraBg: "rgb(248,250,252)",
    totalBg: "rgb(226,232,240)"
  },
  navy: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(23,37,84)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(239,246,255)",
    accentText: "rgb(37,99,235)",
    border: "1px solid rgb(219,234,254)",
    zebraBg: "rgb(248,250,252)",
    totalBg: "rgb(219,234,254)"
  },
  rose: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(136,19,55)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(255,241,242)",
    accentText: "rgb(225,29,72)",
    border: "1px solid rgb(254,205,211)",
    zebraBg: "rgb(255,245,245)",
    totalBg: "rgb(254,205,211)"
  },
  purple: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(88,28,135)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(245,243,255)",
    accentText: "rgb(124,58,237)",
    border: "1px solid rgb(233,213,255)",
    zebraBg: "rgb(250,245,255)",
    totalBg: "rgb(233,213,255)"
  },
  amber: {
    primaryText: "rgb(15,23,42)",
    headerBg: "rgb(120,53,15)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(254,243,199)",
    accentText: "rgb(217,119,6)",
    border: "1px solid rgb(253,230,138)",
    zebraBg: "rgb(255,251,235)",
    totalBg: "rgb(253,230,138)"
  },
  dark: {
    primaryText: "rgb(241,245,249)",
    headerBg: "rgb(15,23,42)",
    headerText: "rgb(255,255,255)",
    accentBg: "rgb(30,41,59)",
    accentText: "rgb(129,140,248)",
    border: "1px solid rgb(51,65,85)",
    zebraBg: "rgb(30,41,59)",
    totalBg: "rgb(51,65,85)"
  }
};

export class BatchSpreadsheetService {
  private static adapter = new SocialCalcAdapter();

  /**
   * 1. Create a full multi-sheet workbook with initial configurations in 1 atomic step.
   */
  static createFullWorkbook(sheetConfigs: SheetConfig[], activeSheetName?: string): Workbook {
    const workbook = new Workbook();

    sheetConfigs.forEach((cfg, idx) => {
      const sheetId = `sheet${idx + 1}`;
      const sheet = workbook.addSheet(sheetId, cfg.name);

      // Set column widths
      if (cfg.colWidths) {
        for (const [col, width] of Object.entries(cfg.colWidths)) {
          sheet.colWidths.set(col.toUpperCase(), width);
        }
      }

      // Title Banner
      if (cfg.title) {
        const titleCell = sheet.getCell("A1", true)!;
        titleCell.text = cfg.title;
        titleCell.fontIndex = StyleService.registerFont(sheet, "normal bold 14pt Arial");
        titleCell.textColorIndex = StyleService.registerColor(sheet, "rgb(255,255,255)");
        titleCell.bgColorIndex = StyleService.registerColor(sheet, "rgb(15,23,42)");
        titleCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "left");
        titleCell.colspan = Math.max(6, cfg.colWidths ? Object.keys(cfg.colWidths).length : 6);
      }

      // Subtitle Banner
      if (cfg.subtitle) {
        const subCell = sheet.getCell("A2", true)!;
        subCell.text = cfg.subtitle;
        subCell.fontIndex = StyleService.registerFont(sheet, "normal bold 9pt Arial");
        subCell.textColorIndex = StyleService.registerColor(sheet, "rgb(15,23,42)");
        subCell.bgColorIndex = StyleService.registerColor(sheet, "rgb(241,245,249)");
        subCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "left");
        subCell.colspan = Math.max(6, cfg.colWidths ? Object.keys(cfg.colWidths).length : 6);
      }
    });

    if (activeSheetName && workbook.getSheetByName(activeSheetName)) {
      workbook.setActiveSheet(activeSheetName);
    } else if (sheetConfigs.length > 0) {
      workbook.setActiveSheet(sheetConfigs[0].name);
    }

    return workbook;
  }

  /**
   * 2. Apply a batch of cell updates (values, formulas, custom styling, spans) in 1 call.
   */
  static applyBatchCellUpdates(sheet: Sheet, updates: CellUpdate[]): number {
    let appliedCount = 0;

    for (const update of updates) {
      const coord = update.coord.toUpperCase();
      const cell = sheet.getCell(coord, true)!;
      const parsed = parseCoordinate(coord);
      if (parsed.colIndex > sheet.maxCol) sheet.maxCol = parsed.colIndex;
      if (parsed.row > sheet.maxRow) sheet.maxRow = parsed.row;

      // Handle value / formula
      if (update.formula !== undefined && update.formula !== null) {
        let f = update.formula.trim();
        if (f.startsWith("=")) f = f.substring(1);
        cell.formula = f;
        cell.valuetype = "n";
        if (update.value !== undefined && typeof update.value === "number") {
          cell.val = update.value;
        }
      } else if (update.value !== undefined && update.value !== null) {
        const val = update.value;
        if (typeof val === "string" && val.startsWith("=")) {
          cell.formula = val.substring(1);
          cell.valuetype = "n";
        } else if (typeof val === "number") {
          cell.val = val;
          cell.valuetype = "n";
        } else if (typeof val === "boolean") {
          cell.val = val ? 1 : 0;
          cell.valuetype = "b";
        } else {
          const numVal = Number(val);
          if (!isNaN(numVal) && String(val).trim() !== "") {
            cell.val = numVal;
            cell.valuetype = "n";
          } else {
            cell.text = String(val);
            cell.valuetype = "t";
          }
        }
      }

      // Handle fonts
      if (update.bold || update.italic || update.fontSize || update.fontFamily) {
        const style = update.italic ? "italic" : "normal";
        const weight = update.bold ? "bold" : "normal";
        const size = update.fontSize || "9pt";
        const family = update.fontFamily || "Arial";
        cell.fontIndex = StyleService.registerFont(sheet, `${style} ${weight} ${size} ${family}`);
      }

      // Handle colors (RGB format normalized without spaces)
      if (update.textColor) {
        const formattedColor = update.textColor.replace(/\s+/g, "");
        cell.textColorIndex = StyleService.registerColor(sheet, formattedColor);
      }
      if (update.bgColor) {
        const formattedBg = update.bgColor.replace(/\s+/g, "");
        cell.bgColorIndex = StyleService.registerColor(sheet, formattedBg);
      }

      // Handle alignment
      if (update.align) {
        cell.cellFormatIndex = StyleService.registerCellFormat(sheet, update.align);
      }

      // Handle value formatting (currency, %, decimals)
      if (update.valueFormat) {
        cell.nonTextValueFormatIndex = StyleService.registerValueFormat(sheet, update.valueFormat);
      }

      // Spans & Smart Span Protection
      let effectiveColspan = update.colspan || 1;
      
      // Auto-detect wide banner/footer/terms text in Col B that needs full width spanning
      if (effectiveColspan === 1 && parsed.colIndex === 2 && typeof cell.text === "string" && cell.text.trim().length > 18) {
        const textLower = cell.text.toLowerCase();
        if (
          textLower.includes("thank you") ||
          textLower.includes("payment") ||
          textLower.includes("remit") ||
          textLower.includes("terms") ||
          textLower.includes("bank") ||
          textLower.includes("payable") ||
          textLower.includes("wire") ||
          textLower.includes("questions") ||
          textLower.includes("bill to") ||
          cell.text.length > 30
        ) {
          effectiveColspan = Math.max(4, sheet.colWidths.size > 0 ? sheet.colWidths.size - 1 : 4);
        }
      }

      if (effectiveColspan > 1) {
        cell.colspan = effectiveColspan;
        // Clean up covered cells in the same row
        for (let c = parsed.colIndex + 1; c < parsed.colIndex + effectiveColspan; c++) {
          const coveredCoord = `${colIndexToLetter(c)}${parsed.row}`;
          sheet.deleteCell(coveredCoord);
        }
        const endCol = parsed.colIndex + effectiveColspan - 1;
        if (endCol > sheet.maxCol) sheet.maxCol = endCol;
      }

      if (update.rowspan && update.rowspan > 1) {
        cell.rowspan = update.rowspan;
        for (let r = parsed.row + 1; r < parsed.row + update.rowspan; r++) {
          const coveredCoord = `${colIndexToLetter(parsed.colIndex)}${r}`;
          sheet.deleteCell(coveredCoord);
        }
        const endRow = parsed.row + update.rowspan - 1;
        if (endRow > sheet.maxRow) sheet.maxRow = endRow;
      }

      if (update.comment) {
        cell.comment = update.comment;
      }

      appliedCount++;
    }

    return appliedCount;
  }

  /**
   * 3. Insert a structured data table with headers, 2D rows, auto-formats, zebra striping, and auto-totals.
   */
  static insertTable(sheet: Sheet, config: TableConfig): {
    startCell: string;
    endCell: string;
    rowCount: number;
    colCount: number;
  } {
    const start = parseCoordinate(config.startCell.toUpperCase());
    const theme = THEME_PALETTES[config.theme || "indigo"];
    const colCount = config.headers.length;
    let currentRow = start.row;

    // Optional Table Title
    if (config.title) {
      const titleCoord = formatCoordinate(start.colIndex, currentRow);
      const titleCell = sheet.getCell(titleCoord, true)!;
      titleCell.text = config.title;
      titleCell.fontIndex = StyleService.registerFont(sheet, "normal bold 11pt Arial");
      titleCell.textColorIndex = StyleService.registerColor(sheet, theme.headerText);
      titleCell.bgColorIndex = StyleService.registerColor(sheet, theme.headerBg);
      titleCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "left");
      titleCell.colspan = colCount;
      currentRow++;
    }

    const headerRow = currentRow;

    // Write Headers
    config.headers.forEach((h, idx) => {
      const c = start.colIndex + idx;
      const coord = formatCoordinate(c, headerRow);
      const cell = sheet.getCell(coord, true)!;
      cell.text = h;
      cell.fontIndex = StyleService.registerFont(sheet, "normal bold 10pt Arial");
      cell.textColorIndex = StyleService.registerColor(sheet, theme.headerText);
      cell.bgColorIndex = StyleService.registerColor(sheet, theme.headerBg);
      
      const align = (config.columnAligns && config.columnAligns[idx]) || (idx === 0 ? "left" : "right");
      cell.cellFormatIndex = StyleService.registerCellFormat(sheet, align);
    });

    currentRow++;
    const dataStartRow = currentRow;

    // Write Data Rows
    config.rows.forEach((rowValues, rIdx) => {
      const r = currentRow;
      const isZebra = config.zebra !== false && rIdx % 2 === 1;
      const rowBg = isZebra ? theme.zebraBg : undefined;

      rowValues.forEach((val, cIdx) => {
        if (cIdx >= colCount) return;
        const c = start.colIndex + cIdx;
        const coord = formatCoordinate(c, r);
        const cell = sheet.getCell(coord, true)!;

        // Alignment & format
        const align = (config.columnAligns && config.columnAligns[cIdx]) || (cIdx === 0 ? "left" : "right");
        cell.cellFormatIndex = StyleService.registerCellFormat(sheet, align);
        cell.fontIndex = StyleService.registerFont(sheet, "normal normal 9pt Arial");
        cell.textColorIndex = StyleService.registerColor(sheet, theme.primaryText);

        if (rowBg) {
          cell.bgColorIndex = StyleService.registerColor(sheet, rowBg);
        }

        const colFmt = config.columnFormats && config.columnFormats[cIdx];
        if (colFmt && colFmt !== "text") {
          cell.nonTextValueFormatIndex = StyleService.registerValueFormat(sheet, colFmt);
        }

        // Value / Formula detection
        if (val === null || val === undefined || val === "") {
          // empty
        } else if (typeof val === "string" && val.startsWith("=")) {
          cell.formula = val.substring(1);
          cell.valuetype = "n";
        } else if (typeof val === "number") {
          cell.val = val;
          cell.valuetype = "n";
        } else if (typeof val === "boolean") {
          cell.val = val ? 1 : 0;
          cell.valuetype = "b";
        } else {
          const numVal = Number(val);
          if (!isNaN(numVal) && String(val).trim() !== "" && colFmt !== "text") {
            cell.val = numVal;
            cell.valuetype = "n";
          } else {
            cell.text = String(val);
            cell.valuetype = "t";
          }
        }
      });

      currentRow++;
    });

    const dataEndRow = currentRow - 1;

    // Optional Total Row
    if (config.includeTotalRow && config.rows.length > 0) {
      const totalRow = currentRow;
      const firstColCoord = formatCoordinate(start.colIndex, totalRow);
      const firstCell = sheet.getCell(firstColCoord, true)!;
      firstCell.text = config.totalRowLabel || "Total";
      firstCell.fontIndex = StyleService.registerFont(sheet, "normal bold 10pt Arial");
      firstCell.textColorIndex = StyleService.registerColor(sheet, theme.primaryText);
      firstCell.bgColorIndex = StyleService.registerColor(sheet, theme.totalBg);
      firstCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "left");

      for (let cIdx = 1; cIdx < colCount; cIdx++) {
        const c = start.colIndex + cIdx;
        const colLetter = colIndexToLetter(c);
        const coord = formatCoordinate(c, totalRow);
        const cell = sheet.getCell(coord, true)!;
        cell.fontIndex = StyleService.registerFont(sheet, "normal bold 10pt Arial");
        cell.textColorIndex = StyleService.registerColor(sheet, theme.primaryText);
        cell.bgColorIndex = StyleService.registerColor(sheet, theme.totalBg);

        const align = (config.columnAligns && config.columnAligns[cIdx]) || "right";
        cell.cellFormatIndex = StyleService.registerCellFormat(sheet, align);

        const colFmt = config.columnFormats && config.columnFormats[cIdx];
        if (colFmt && colFmt !== "text") {
          cell.nonTextValueFormatIndex = StyleService.registerValueFormat(sheet, colFmt);
        }

        // Determine formula
        let formulaType: string | undefined;
        if (config.totalFormulas) {
          formulaType = config.totalFormulas[cIdx] || config.totalFormulas[config.headers[cIdx]];
        }
        if (!formulaType) {
          // Default to SUM if column has numeric format
          if (colFmt && (colFmt.includes("$") || colFmt.includes("#") || colFmt === "0.0%")) {
            formulaType = colFmt.includes("%") ? "AVERAGE" : "SUM";
          }
        }

        if (formulaType) {
          if (["SUM", "AVERAGE", "COUNT", "MIN", "MAX"].includes(formulaType.toUpperCase())) {
            cell.formula = `${formulaType.toUpperCase()}(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`;
          } else {
            let f = formulaType.trim();
            if (f.startsWith("=")) f = f.substring(1);
            cell.formula = f;
          }
          cell.valuetype = "n";
        }
      }

      currentRow++;
    }

    const endCol = start.colIndex + colCount - 1;
    const endRow = currentRow - 1;
    if (endCol > sheet.maxCol) sheet.maxCol = endCol;
    if (endRow > sheet.maxRow) sheet.maxRow = endRow;

    return {
      startCell: config.startCell.toUpperCase(),
      endCell: formatCoordinate(endCol, endRow),
      rowCount: endRow - start.row + 1,
      colCount
    };
  }

  /**
   * 4. Insert an Executive KPI Card Grid in 1 atomic tool call.
   */
  static insertKpiCards(
    sheet: Sheet,
    startCellCoord: string,
    cards: KpiCardConfig[],
    cardsPerRow: number = 4
  ): { count: number; endCell: string } {
    const start = parseCoordinate(startCellCoord.toUpperCase());
    let currentStartCol = start.colIndex;
    let currentRow = start.row;

    cards.forEach((card, idx) => {
      if (idx > 0 && idx % cardsPerRow === 0) {
        currentRow += 3; // Move down for next row of cards
        currentStartCol = start.colIndex;
      }

      const span = card.widthCols || 2;
      const themeName = card.theme || (["indigo", "emerald", "amber", "rose", "purple"][idx % 5] as any);
      const theme = (THEME_PALETTES as Record<string, any>)[themeName] || THEME_PALETTES.indigo;

      // Top Row: Card Title
      const titleCoord = formatCoordinate(currentStartCol, currentRow);
      const titleCell = sheet.getCell(titleCoord, true)!;
      titleCell.text = card.title;
      titleCell.fontIndex = StyleService.registerFont(sheet, "normal bold 9pt Arial");
      titleCell.textColorIndex = StyleService.registerColor(sheet, theme.accentText);
      titleCell.bgColorIndex = StyleService.registerColor(sheet, theme.accentBg);
      titleCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "center");
      titleCell.colspan = span;

      // Bottom Row: Card Metric / Value
      const valCoord = formatCoordinate(currentStartCol, currentRow + 1);
      const valCell = sheet.getCell(valCoord, true)!;
      valCell.fontIndex = StyleService.registerFont(sheet, "normal bold 16pt Arial");
      valCell.textColorIndex = StyleService.registerColor(sheet, theme.accentText);
      valCell.bgColorIndex = StyleService.registerColor(sheet, theme.accentBg);
      valCell.cellFormatIndex = StyleService.registerCellFormat(sheet, "center");
      valCell.colspan = span;

      if (card.valueFormat) {
        valCell.nonTextValueFormatIndex = StyleService.registerValueFormat(sheet, card.valueFormat);
      }

      if (card.formula) {
        let f = card.formula.trim();
        if (f.startsWith("=")) f = f.substring(1);
        valCell.formula = f;
        valCell.valuetype = "n";
        if (card.value !== undefined && typeof card.value === "number") {
          valCell.val = card.value;
        }
      } else if (card.value !== undefined) {
        if (typeof card.value === "number") {
          valCell.val = card.value;
          valCell.valuetype = "n";
        } else {
          valCell.text = String(card.value);
          valCell.valuetype = "t";
        }
      }

      currentStartCol += span;
    });

    const maxColUsed = currentStartCol - 1;
    const maxRowUsed = currentRow + 1;
    if (maxColUsed > sheet.maxCol) sheet.maxCol = maxColUsed;
    if (maxRowUsed > sheet.maxRow) sheet.maxRow = maxRowUsed;

    return {
      count: cards.length,
      endCell: formatCoordinate(maxColUsed, maxRowUsed)
    };
  }

  /**
   * 5. Validate full workbook syntax and semantic references.
   */
  static validateWorkbook(workbook: Workbook) {
    const validator = new SocialCalcValidator({
      enableSyntaxLevel: true,
      enableSemanticLevel: true,
      enableLogicLevel: true,
      strictMode: false,
    });

    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    for (const [, sheet] of workbook.sheets.entries()) {
      if (sheet.cells.size === 0 && sheet.maxCol === 0 && sheet.maxRow === 0) {
        continue;
      }
      const savestr = serializeSheetSaveStr(sheet);
      const res = validator.validate(savestr);
      if (res.errors) {
        res.errors.forEach((e: any) => allErrors.push({ sheet: sheet.name, ...e }));
      }
      if (res.warnings) {
        res.warnings.forEach((w: any) => allWarnings.push({ sheet: sheet.name, ...w }));
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Merges cells across a range on a sheet.
   */
  static mergeCellsOnSheet(sheet: Sheet, rangeStr: string): void {
    const range = parseRange(rangeStr);
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
  }

  /**
   * Unmerges cells across a range on a sheet.
   */
  static unmergeCellsOnSheet(sheet: Sheet, rangeStr: string): void {
    const range = parseRange(rangeStr);
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startColIndex; c <= range.endColIndex; c++) {
        const coord = `${colIndexToLetter(c)}${r}`;
        const cell = sheet.getCell(coord);
        if (cell) {
          delete cell.colspan;
          delete cell.rowspan;
        }
      }
    }
  }

  /**
   * 6. One-shot builder for an entire worksheet:
   * Sets colWidths, banner, KPI cards, tables, custom cells, merges, borders, formats, and alignments.
   */
  static buildSheet(sheet: Sheet, config: BuildSheetConfig): {
    sheetName: string;
    maxCol: number;
    maxRow: number;
  } {
    // 1. Column Widths
    if (config.colWidths) {
      for (const [col, width] of Object.entries(config.colWidths)) {
        sheet.colWidths.set(col.toUpperCase(), width);
      }
    }

    // 2. Banner
    if (config.banner) {
      const b = config.banner;
      const startCoord = (b.startCell || "A1").toUpperCase();
      const parsedStart = parseCoordinate(startCoord);
      const span = b.colspan || (config.colWidths ? Object.keys(config.colWidths).length : 6);

      const titleCell = sheet.getCell(startCoord, true)!;
      titleCell.text = b.title;
      titleCell.fontIndex = StyleService.registerFont(sheet, "normal bold 14pt Arial");
      titleCell.textColorIndex = StyleService.registerColor(sheet, (b.textTitle || "#ffffff").replace(/\s+/g, ""));
      titleCell.bgColorIndex = StyleService.registerColor(sheet, (b.bgTitle || "#4F46E5").replace(/\s+/g, ""));
      titleCell.cellFormatIndex = StyleService.registerCellFormat(sheet, b.align || "center");
      if (span > 1) titleCell.colspan = span;
      if (parsedStart.colIndex + span - 1 > sheet.maxCol) sheet.maxCol = parsedStart.colIndex + span - 1;
      if (parsedStart.row > sheet.maxRow) sheet.maxRow = parsedStart.row;

      if (b.subtitle) {
        const subCoord = formatCoordinate(parsedStart.colIndex, parsedStart.row + 1);
        const subCell = sheet.getCell(subCoord, true)!;
        subCell.text = b.subtitle;
        subCell.fontIndex = StyleService.registerFont(sheet, "normal normal 9pt Arial");
        subCell.textColorIndex = StyleService.registerColor(sheet, (b.textSubtitle || "#4F46E5").replace(/\s+/g, ""));
        subCell.bgColorIndex = StyleService.registerColor(sheet, (b.bgSubtitle || "#EEF2FF").replace(/\s+/g, ""));
        subCell.cellFormatIndex = StyleService.registerCellFormat(sheet, b.align || "center");
        if (span > 1) subCell.colspan = span;
        if (parsedStart.row + 1 > sheet.maxRow) sheet.maxRow = parsedStart.row + 1;
      }
    }

    // 3. KPI Cards
    if (config.kpiCards && config.kpiCards.cards && config.kpiCards.cards.length > 0) {
      this.insertKpiCards(
        sheet,
        config.kpiCards.startCell,
        config.kpiCards.cards,
        config.kpiCards.cardsPerRow || 4
      );
    }

    // 4. Tables
    if (config.tables && config.tables.length > 0) {
      for (const table of config.tables) {
        this.insertTable(sheet, table);
      }
    }

    // 5. Custom Cell Updates
    if (config.cells && config.cells.length > 0) {
      this.applyBatchCellUpdates(sheet, config.cells);
    }

    // 6. Merged Ranges
    if (config.mergedRanges && config.mergedRanges.length > 0) {
      for (const range of config.mergedRanges) {
        this.mergeCellsOnSheet(sheet, range);
      }
    }

    // 7. Borders
    if (config.borders && config.borders.length > 0) {
      for (const b of config.borders) {
        const rangeCells = SheetService.getRangeCells(sheet, b.range);
        let borderIdx: number | undefined;
        let topIdx: number | undefined;
        let bottomIdx: number | undefined;
        let leftIdx: number | undefined;
        let rightIdx: number | undefined;

        if (b.border) borderIdx = StyleService.registerBorder(sheet, b.border);
        if (b.top) topIdx = StyleService.registerBorder(sheet, b.top);
        if (b.bottom) bottomIdx = StyleService.registerBorder(sheet, b.bottom);
        if (b.left) leftIdx = StyleService.registerBorder(sheet, b.left);
        if (b.right) rightIdx = StyleService.registerBorder(sheet, b.right);

        for (const { cell } of rangeCells) {
          const current = cell.borders || { top: 0, right: 0, bottom: 0, left: 0 };
          cell.borders = {
            top: borderIdx !== undefined ? borderIdx : (topIdx !== undefined ? topIdx : current.top),
            right: borderIdx !== undefined ? borderIdx : (rightIdx !== undefined ? rightIdx : current.right),
            bottom: borderIdx !== undefined ? borderIdx : (bottomIdx !== undefined ? bottomIdx : current.bottom),
            left: borderIdx !== undefined ? borderIdx : (leftIdx !== undefined ? leftIdx : current.left)
          };
        }
      }
    }

    // 8. Value Formats
    if (config.formats && config.formats.length > 0) {
      for (const f of config.formats) {
        const rangeCells = SheetService.getRangeCells(sheet, f.range);
        const fmtIdx = StyleService.registerValueFormat(sheet, f.format);
        for (const { cell } of rangeCells) {
          cell.nonTextValueFormatIndex = fmtIdx;
        }
      }
    }

    // 9. Alignments
    if (config.alignments && config.alignments.length > 0) {
      for (const a of config.alignments) {
        const rangeCells = SheetService.getRangeCells(sheet, a.range);
        let formatIdx: number | undefined;
        if (a.align) {
          formatIdx = StyleService.registerCellFormat(sheet, a.align);
        }
        for (const { cell } of rangeCells) {
          if (formatIdx !== undefined) cell.cellFormatIndex = formatIdx;
        }
      }
    }

    return {
      sheetName: sheet.name,
      maxCol: sheet.maxCol,
      maxRow: sheet.maxRow
    };
  }

  /**
   * 7. Build an entire Multi-Sheet Workbook in 1 atomic call.
   */
  static buildWorkbook(config: BuildWorkbookConfig): Workbook {
    const workbook = new Workbook();

    config.sheets.forEach((sheetCfg, idx) => {
      const sheetName = sheetCfg.sheetName || sheetCfg.name || `sheet${idx + 1}`;
      const sheetId = `sheet${idx + 1}`;
      const sheet = workbook.addSheet(sheetId, sheetName);
      this.buildSheet(sheet, sheetCfg);
    });

    if (config.activeSheet && workbook.getSheetByName(config.activeSheet)) {
      workbook.setActiveSheet(config.activeSheet);
    } else if (config.sheets.length > 0) {
      const first = config.sheets[0].sheetName || config.sheets[0].name;
      if (first) workbook.setActiveSheet(first);
    }

    return workbook;
  }

  /**
   * 8. Master Batch Execution: Runs an arbitrary array of tool actions against a workbook in memory.
   */
  static executeBatch(
    workbook: Workbook,
    operations: Array<{ tool: string; args: any }>,
    adapter: SocialCalcAdapter
  ): { executed: number; results: string[] } {
    const results: string[] = [];

    const resolveTargetSheet = (args: any): Sheet => {
      if (args && args.sheetName) {
        const s = workbook.getSheetByName(args.sheetName);
        if (s) return s;
        // Auto-create if not found
        const newId = `sheet${workbook.sheets.size + 1}`;
        return workbook.addSheet(newId, args.sheetName);
      }
      if (args && args.sheetNumber) {
        const meta = workbook.getSheetsMetadata()[args.sheetNumber - 1];
        if (meta) {
          const s = workbook.getSheetById(meta.id);
          if (s) return s;
        }
      }
      const active = workbook.getActiveSheet();
      if (active) return active;
      if (workbook.sheets.size > 0) {
        return Array.from(workbook.sheets.values())[0];
      }
      return workbook.addSheet("sheet1", "sheet1");
    };

    operations.forEach((op, i) => {
      const toolName = op.tool;
      const args = op.args || {};

      switch (toolName) {
        case "set_col_width": {
          const sheet = resolveTargetSheet(args);
          sheet.colWidths.set(args.column.toUpperCase(), args.width);
          results.push(`Op ${i + 1} [set_col_width]: Col '${args.column}' = ${args.width}px in '${sheet.name}'`);
          break;
        }
        case "write_range": {
          const sheet = resolveTargetSheet(args);
          const data = args.data || [[args.value]];
          adapter.writeRange(sheet, args.range, data);
          results.push(`Op ${i + 1} [write_range]: Range ${args.range} in '${sheet.name}'`);
          break;
        }
        case "format_cells": {
          const sheet = resolveTargetSheet(args);
          const style: any = {};
          if (args.bold) style.font = "normal bold 10pt Arial";
          if (args.textColor) style.textColor = args.textColor;
          if (args.bgColor) style.bgColor = args.bgColor;
          if (args.align) style.align = args.align;
          adapter.applyStyle(sheet, args.range, style);
          results.push(`Op ${i + 1} [format_cells]: Range ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_format": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          const fmtIdx = StyleService.registerValueFormat(sheet, args.format);
          for (const { cell } of rangeCells) {
            cell.nonTextValueFormatIndex = fmtIdx;
          }
          results.push(`Op ${i + 1} [set_format]: Format '${args.format}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_border": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          let borderIdx: number | undefined;
          if (args.border) borderIdx = StyleService.registerBorder(sheet, args.border);
          let topIdx = args.top ? StyleService.registerBorder(sheet, args.top) : undefined;
          let bottomIdx = args.bottom ? StyleService.registerBorder(sheet, args.bottom) : undefined;
          let leftIdx = args.left ? StyleService.registerBorder(sheet, args.left) : undefined;
          let rightIdx = args.right ? StyleService.registerBorder(sheet, args.right) : undefined;

          for (const { cell } of rangeCells) {
            const current = cell.borders || { top: 0, right: 0, bottom: 0, left: 0 };
            cell.borders = {
              top: borderIdx !== undefined ? borderIdx : (topIdx !== undefined ? topIdx : current.top),
              right: borderIdx !== undefined ? borderIdx : (rightIdx !== undefined ? rightIdx : current.right),
              bottom: borderIdx !== undefined ? borderIdx : (bottomIdx !== undefined ? bottomIdx : current.bottom),
              left: borderIdx !== undefined ? borderIdx : (leftIdx !== undefined ? leftIdx : current.left)
            };
          }
          results.push(`Op ${i + 1} [set_border]: Range ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_alignment": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          const fmtIdx = StyleService.registerCellFormat(sheet, args.align);
          for (const { cell } of rangeCells) {
            cell.cellFormatIndex = fmtIdx;
          }
          results.push(`Op ${i + 1} [set_alignment]: Align '${args.align}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_font_size": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          for (const { cell } of rangeCells) {
            const currentFont = sheet.fonts.get(cell.fontIndex || 0) || "normal normal 10pt Arial";
            const parts = currentFont.split(" ");
            const style = parts[0] || "normal";
            const weight = parts[1] || "normal";
            const family = parts[3] || "Arial";
            cell.fontIndex = StyleService.registerFont(sheet, `${style} ${weight} ${args.size} ${family}`);
          }
          results.push(`Op ${i + 1} [set_font_size]: Size '${args.size}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_font_style": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          const styleStr = args.style || (args.bold ? "bold" : "normal");
          for (const { cell } of rangeCells) {
            cell.fontIndex = StyleService.registerFont(sheet, `normal ${styleStr} 10pt Arial`);
          }
          results.push(`Op ${i + 1} [set_font_style]: Style '${styleStr}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_font_color": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          const colIdx = StyleService.registerColor(sheet, args.color.replace(/\s+/g, ""));
          for (const { cell } of rangeCells) {
            cell.textColorIndex = colIdx;
          }
          results.push(`Op ${i + 1} [set_font_color]: Color '${args.color}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "set_cell_bg": {
          const sheet = resolveTargetSheet(args);
          const rangeCells = SheetService.getRangeCells(sheet, args.range);
          const colIdx = StyleService.registerColor(sheet, args.color.replace(/\s+/g, ""));
          for (const { cell } of rangeCells) {
            cell.bgColorIndex = colIdx;
          }
          results.push(`Op ${i + 1} [set_cell_bg]: Bg '${args.color}' on ${args.range} in '${sheet.name}'`);
          break;
        }
        case "merge_cells": {
          const sheet = resolveTargetSheet(args);
          this.mergeCellsOnSheet(sheet, args.range);
          results.push(`Op ${i + 1} [merge_cells]: Range ${args.range} in '${sheet.name}'`);
          break;
        }
        case "unmerge_cells": {
          const sheet = resolveTargetSheet(args);
          this.unmergeCellsOnSheet(sheet, args.range);
          results.push(`Op ${i + 1} [unmerge_cells]: Range ${args.range} in '${sheet.name}'`);
          break;
        }
        case "insert_table": {
          const sheet = resolveTargetSheet(args);
          const res = this.insertTable(sheet, args);
          results.push(`Op ${i + 1} [insert_table]: Table ${res.startCell}:${res.endCell} (${res.rowCount} rows) in '${sheet.name}'`);
          break;
        }
        case "insert_kpi_cards": {
          const sheet = resolveTargetSheet(args);
          const res = this.insertKpiCards(sheet, args.startCell, args.cards, args.cardsPerRow);
          results.push(`Op ${i + 1} [insert_kpi_cards]: ${res.count} cards (${args.startCell}:${res.endCell}) in '${sheet.name}'`);
          break;
        }
        case "batch_update_cells": {
          const sheet = resolveTargetSheet(args);
          const count = this.applyBatchCellUpdates(sheet, args.updates);
          results.push(`Op ${i + 1} [batch_update_cells]: Updated ${count} cells in '${sheet.name}'`);
          break;
        }
        case "new_sheet": {
          const newId = `sheet${workbook.sheets.size + 1}`;
          workbook.addSheet(newId, args.sheetName);
          results.push(`Op ${i + 1} [new_sheet]: Added sheet '${args.sheetName}'`);
          break;
        }
        case "build_sheet": {
          const sheet = resolveTargetSheet(args);
          const res = this.buildSheet(sheet, args);
          results.push(`Op ${i + 1} [build_sheet]: Built sheet '${res.sheetName}' (Bounds: Col ${res.maxCol}, Row ${res.maxRow})`);
          break;
        }
        default:
          results.push(`Op ${i + 1} [${toolName}]: Skipped unknown operation`);
      }
    });

    return {
      executed: operations.length,
      results
    };
  }
}

