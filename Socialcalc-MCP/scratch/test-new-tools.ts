import { SocialcalcMcpServer } from "../src/server.js";
import * as fs from "fs/promises";
import * as path from "path";

async function runTests() {
  console.log("Starting verification of new MCP tools...");
  const server = new SocialcalcMcpServer();
  const testWbPath = path.resolve("./test-output/new_tools_test.json");

  // Make sure clean state
  try {
    await fs.unlink(testWbPath);
  } catch {}

  // 1. Test new_workbook
  console.log("\n1. Testing 'new_workbook'...");
  let res = await server.executeTool("new_workbook", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet"
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("new_workbook failed");

  // 2. Test new_sheet
  console.log("\n2. Testing 'new_sheet'...");
  res = await server.executeTool("new_sheet", {
    workbookPath: testWbPath,
    sheetName: "sheet_two"
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("new_sheet failed");

  // 3. Test rename_sheet
  console.log("\n3. Testing 'rename_sheet'...");
  res = await server.executeTool("rename_sheet", {
    workbookPath: testWbPath,
    oldName: "sheet_two",
    newName: "sheet_renamed"
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("rename_sheet failed");

  // 4. Test insert_row (before/after)
  console.log("\n4. Testing 'insert_row'...");
  res = await server.executeTool("insert_row", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet",
    row: 1,
    count: 2,
    position: "after"
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("insert_row failed");

  // 5. Test insert_col (before/after)
  console.log("\n5. Testing 'insert_col'...");
  res = await server.executeTool("insert_col", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet",
    column: "B",
    count: 1,
    position: "before"
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("insert_col failed");

  // 6. Test set_col_width
  console.log("\n6. Testing 'set_col_width'...");
  res = await server.executeTool("set_col_width", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet",
    column: "C",
    width: 250
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("set_col_width failed");

  // 7. Test delete_row
  console.log("\n7. Testing 'delete_row'...");
  res = await server.executeTool("delete_row", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet",
    row: 2,
    count: 1
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("delete_row failed");

  // 8. Test delete_col
  console.log("\n8. Testing 'delete_col'...");
  res = await server.executeTool("delete_col", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet",
    column: "B",
    count: 1
  });
  console.log("Response:", JSON.stringify(res));
  if (res.isError) throw new Error("delete_col failed");

  console.log("\nAll tool execution checks complete. Loading saved file to verify final structure...");
  const content = await fs.readFile(testWbPath, "utf-8");
  const wb = JSON.parse(content);

  console.log("Workbook Sheets:", Object.keys(wb.sheetArr));
  const initialSheetStr = wb.sheetArr.sheet1.sheetstr.savestr;
  console.log("initial_sheet savestr:\n" + initialSheetStr);

  const hasRenamedSheet = wb.sheetArr.sheet2 && wb.sheetArr.sheet2.name === "sheet_renamed";
  const hasWidth = initialSheetStr.includes("col:B:w:250");

  console.log("\nVerification assertions:");
  console.log("- Sheet name renamed successfully:", hasRenamedSheet);
  console.log("- Column B width shifted/applied correctly:", hasWidth);

  if (hasRenamedSheet && hasWidth) {
    console.log("\nSUCCESS: All new MCP tools verified successfully!");
  } else {
    console.error("\nFAILURE: Final workbook structure validation failed!");
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
