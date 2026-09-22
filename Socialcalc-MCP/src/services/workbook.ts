import * as fs from "fs/promises";
import * as path from "path";
import { Workbook } from "../models/workbook.js";
import { parseWorkbook } from "../adapters/socialcalc/parser.js";
import { serializeWorkbookJson, serializeSheetSaveStr } from "../adapters/socialcalc/serializer.js";
import SocialCalcValidator from "../utils/validator.js";
import { resolveTargetFilePath } from "../utils/paths.js";

/**
 * Service to manage Workbook lifecycle, file I/O, and sheet operations.
 */
export class WorkbookService {
  /**
   * Loads a workbook from an MSC file on disk.
   */
  static async loadWorkbook(filePath: string): Promise<Workbook> {
    const resolved = resolveTargetFilePath(filePath);
    const ext = path.extname(resolved).toLowerCase();
    if (ext !== ".json" && ext !== ".msc") {
      throw new Error(`Invalid file extension: '${filePath}'. Only .json and .msc files are supported.`);
    }
    try {
      const data = await fs.readFile(resolved, "utf-8");
      return parseWorkbook(data);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, return a fresh empty workbook
        const workbook = new Workbook();
        workbook.addSheet("sheet1", "sheet1");
        return workbook;
      }
      throw new Error(`Failed to load workbook at ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validates all sheet strings in a workbook. Throws detailed validation errors on failure.
   */
  static validateWorkbook(workbook: Workbook): void {
    const validator = new SocialCalcValidator({
      enableSyntaxLevel: true,
      enableSemanticLevel: true,
      enableLogicLevel: true,
      strictMode: false,
    });

    for (const [id, sheet] of workbook.sheets.entries()) {
      // Don't validate entirely empty sheets (they are trivial and default)
      if (sheet.cells.size === 0 && sheet.maxCol === 0 && sheet.maxRow === 0) {
        continue;
      }

      const savestr = serializeSheetSaveStr(sheet);
      const result = validator.validate(savestr);

      if (!result.valid || result.errorCount > 0) {
        const errorDetails = result.errors
          .map((e: any) => `  - Line ${e.line} [${e.level}]: ${e.message}`)
          .join("\n");
        throw new Error(
          `SocialCalc syntax validation failed for sheet '${sheet.name}' (ID: ${id}):\n${errorDetails}`
        );
      }
    }
  }

  /**
   * Saves a workbook as an MSC JSON file to disk.
   * Runs the validator first to prevent writing any invalid save strings.
   */
  static async saveWorkbook(workbook: Workbook, filePath: string): Promise<void> {
    const resolved = resolveTargetFilePath(filePath);
    const ext = path.extname(resolved).toLowerCase();
    if (ext !== ".json" && ext !== ".msc") {
      throw new Error(`Invalid file extension: '${filePath}'. Only .json and .msc files are supported.`);
    }
    // 1. Run strict validation first
    WorkbookService.validateWorkbook(workbook);

    // 2. Save only if validation passes
    try {
      // Ensure target directory exists
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      const serialized = serializeWorkbookJson(workbook);
      await fs.writeFile(resolved, serialized, "utf-8");
    } catch (error: any) {
      throw new Error(`Failed to save workbook to ${filePath}: ${error.message}`);
    }
  }

  /**
   * Creates a new in-memory Workbook with a default sheet.
   */
  static createWorkbook(): Workbook {
    const workbook = new Workbook();
    workbook.addSheet("sheet1", "sheet1");
    return workbook;
  }
}
