import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns the directory used for storing MCP files.
 * Defaults to the 'mcp_files' directory in the Socialcalc-MCP project root,
 * or can be overridden with the MCP_FILES_DIR environment variable.
 */
export function getMcpFilesDir(): string {
  if (process.env.MCP_FILES_DIR) {
    return path.resolve(process.env.MCP_FILES_DIR);
  }
  return path.resolve(__dirname, "../../mcp_files");
}

/**
 * Resolves a file path for workbooks, CSVs, and XLSX files:
 * 1. Absolute paths are preserved as-is.
 * 2. Bare filenames (e.g. "budget.json", "sales.csv", "report.xlsx") are routed into `mcp_files/`.
 * 3. Paths starting with "mcp_files/" or "./mcp_files/" are routed into `mcp_files/`.
 * 4. Other relative paths (e.g. "./data/foo.json") are resolved to absolute paths.
 */
export function resolveTargetFilePath(rawPath: string): string {
  if (!rawPath) return rawPath;
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  const mcpFilesDir = getMcpFilesDir();

  // If path explicitly starts with mcp_files/ or ./mcp_files/
  if (
    rawPath.startsWith("mcp_files/") ||
    rawPath.startsWith("./mcp_files/") ||
    rawPath.startsWith("mcp_files\\") ||
    rawPath.startsWith(".\\mcp_files\\")
  ) {
    const sub = rawPath.replace(/^(\.\/)?[mcp_files[\\\/]]+/, "");
    return path.resolve(mcpFilesDir, sub);
  }

  // If bare filename without directory separators
  const basename = path.basename(rawPath);
  if (basename === rawPath) {
    return path.resolve(mcpFilesDir, rawPath);
  }

  return path.resolve(rawPath);
}
