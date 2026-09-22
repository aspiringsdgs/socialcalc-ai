#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SocialcalcMcpServer } from "./server.js";
import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { getMcpFilesDir } from "./utils/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the project root for safety checks
const PROJECT_ROOT = process.env.PROJECT_ROOT ? path.resolve(process.env.PROJECT_ROOT) : path.resolve(__dirname, "../../");
const MCP_ROOT = path.resolve(__dirname, "../");

function isSafePath(targetPath: string): boolean {
  try {
    const resolvedPath = path.resolve(targetPath);
    const mcpFilesDir = getMcpFilesDir();
    return (
      resolvedPath.startsWith(PROJECT_ROOT) ||
      resolvedPath.startsWith(MCP_ROOT) ||
      resolvedPath.startsWith(mcpFilesDir)
    );
  } catch {
    return false;
  }
}

async function main() {
  const mcpServer = new SocialcalcMcpServer();

  // Create an HTTP server on port 5002 for browser testing
  const PORT = process.env.SOCIALCALC_PORT ? parseInt(process.env.SOCIALCALC_PORT, 10) : 5002;
  const httpServer = http.createServer(async (req, res) => {
    // Add CORS headers for browser compatibility
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    // Health check and tools listing
    if (req.method === "GET" && req.url === "/tools") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ tools: mcpServer.listTools() }));
      return;
    }

    // Execute MCP tool via HTTP POST
    if (req.method === "POST" && req.url === "/call") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const payload = JSON.parse(body);
          const { name, arguments: args } = payload;
          
          if (!name) throw new Error("Missing tool name");
          
          const result = await mcpServer.executeTool(name, args);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ isError: true, content: [{ type: "text", text: `HTTP Call Error: ${err.message}` }] }));
        }
      });
      return;
    }

    // Sync browser-side spreadsheet data to local filesystem
    if (req.method === "POST" && req.url === "/sync") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const payload = JSON.parse(body);
          const { workbookPath, mscData } = payload;

          if (!workbookPath || !mscData) {
            throw new Error("Missing workbookPath or mscData in payload");
          }

          if (!isSafePath(workbookPath)) {
            throw new Error(`Access denied to path: ${workbookPath}`);
          }

          const ext = path.extname(workbookPath).toLowerCase();
          if (ext !== ".json" && ext !== ".msc") {
            throw new Error(`Invalid file extension: '${workbookPath}'. Only .json and .msc workbook files are supported for synchronization.`);
          }

          const resolvedPath = path.resolve(workbookPath);
          await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

          const dataToWrite = typeof mscData === "object" ? JSON.stringify(mscData, null, 2) : mscData;
          await fs.writeFile(resolvedPath, dataToWrite, "utf-8");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, message: "Workbook synchronized successfully." }));
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ isError: true, content: [{ type: "text", text: `Sync Error: ${err.message}` }] }));
        }
      });
      return;
    }

    // Read local workbook file data back to browser
    if (req.method === "GET" && req.url?.startsWith("/read-file")) {
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const filePath = urlObj.searchParams.get("path");

        if (!filePath) throw new Error("Missing path parameter");

        if (!isSafePath(filePath)) {
          throw new Error(`Access denied to path: ${filePath}`);
        }

        const ext = path.extname(filePath).toLowerCase();
        if (ext !== ".json" && ext !== ".msc") {
          throw new Error(`Invalid file extension: '${filePath}'. Only .json and .msc workbook files are supported.`);
        }

        const resolved = path.resolve(filePath);
        const data = await fs.readFile(resolved, "utf-8");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ isError: true, content: [{ type: "text", text: `Read File Error: ${err.message}` }] }));
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  httpServer.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`[Warning] HTTP server port ${PORT} is already in use. Local test HTTP server could not start, but stdio transport is active.`);
    } else {
      console.error(`[Warning] HTTP server failed to start: ${error.message}`);
    }
  });

  httpServer.listen(PORT, () => {
    console.error(`Local test HTTP server listening on http://localhost:${PORT}`);
  });

  // Stdio transport for AI clients
  const transport = new StdioServerTransport();
  await mcpServer.getServerInstance().connect(transport);
  console.error("Socialcalc MCP Server running on stdio transport");
}

main().catch((error) => {
  console.error("Fatal error starting Socialcalc MCP Server:", error);
  process.exit(1);
});
