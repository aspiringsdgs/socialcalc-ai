import { SocialcalcMcpServer } from "../src/server.js";
import * as path from "path";

async function runTests() {
  console.log("Starting verification of new discovery & reading tools...");
  const server = new SocialcalcMcpServer();
  const testWbPath = path.resolve("./test-output/new_tools_test.json");

  // 1. Test read_sheet
  console.log("\n1. Testing 'read_sheet'...");
  let res = await server.executeTool("read_sheet", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet"
  });
  console.log("Response text length:", res.content[0].text.length);
  if (res.isError || !res.content[0].text.includes("### Sheet: initial_sheet")) {
    throw new Error("read_sheet failed");
  }

  // 2. Test summarize_workbook
  console.log("\n2. Testing 'summarize_workbook'...");
  res = await server.executeTool("summarize_workbook", {
    workbookPath: testWbPath
  });
  console.log("Response:\n", res.content[0].text);
  if (res.isError || !res.content[0].text.includes("initial_sheet") || !res.content[0].text.includes("sheet_renamed")) {
    throw new Error("summarize_workbook failed");
  }

  // 3. Test get_sheet_dimensions
  console.log("\n3. Testing 'get_sheet_dimensions'...");
  res = await server.executeTool("get_sheet_dimensions", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet"
  });
  console.log("Response:\n", res.content[0].text);
  if (res.isError || !res.content[0].text.includes("dimensions")) {
    throw new Error("get_sheet_dimensions failed");
  }

  // 4. Test describe_sheet
  console.log("\n4. Testing 'describe_sheet'...");
  res = await server.executeTool("describe_sheet", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet"
  });
  console.log("Response:\n", res.content[0].text);
  if (res.isError || !res.content[0].text.includes("Columns Schema")) {
    throw new Error("describe_sheet failed");
  }

  // 5. Test summarize_sheet
  console.log("\n5. Testing 'summarize_sheet'...");
  res = await server.executeTool("summarize_sheet", {
    workbookPath: testWbPath,
    sheetName: "initial_sheet"
  });
  console.log("Response starts with:\n", res.content[0].text.substring(0, 300) + "...\n");
  if (res.isError || !res.content[0].text.includes("cellsCount")) {
    throw new Error("summarize_sheet failed");
  }

  console.log("\nSUCCESS: All 5 new discovery & reading tools verified successfully!");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
