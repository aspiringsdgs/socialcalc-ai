import { parseWorkbook } from "../src/adapters/socialcalc/parser.js";
import { serializeWorkbookJson } from "../src/adapters/socialcalc/serializer.js";
import { StyleService } from "../src/services/styles.js";

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

function runTest() {
  const initialMsc = `version:1.5
cell:A1:t:Hello World
cell:A2:v:123
`;

  console.log("Parsing initial sheet save string...");
  const workbook = parseWorkbook(initialMsc);
  const sheet = workbook.getSheetByName("sheet1") || workbook.getActiveSheet() || workbook.sheets.values().next().value;
  if (!sheet) {
    throw new Error("Sheet not found in parsed workbook");
  }

  console.log("Applying HTML format (should be tvf for text A1)...");
  const htmlFormat = normalizeFormat("HTML");
  console.log(`Normalized HTML format: ${htmlFormat}`);
  const htmlIdx = StyleService.registerValueFormat(sheet, htmlFormat);
  const cellA1 = sheet.getCell("A1", true)!;
  cellA1.textValueFormatIndex = htmlIdx;

  console.log("Applying numeric format (should be ntvf for number A2)...");
  const numFormat = "0.00%";
  const numIdx = StyleService.registerValueFormat(sheet, numFormat);
  const cellA2 = sheet.getCell("A2", true)!;
  cellA2.nonTextValueFormatIndex = numIdx;

  console.log("Serializing back to sheet save string...");
  const serialized = serializeWorkbookJson(workbook);
  console.log("Serialized Workbook JSON output:");
  console.log(JSON.stringify(JSON.parse(serialized), null, 2));

  // Also check direct savestr
  const sheetSaveStr = JSON.parse(serialized).sheetArr.sheet1.sheetstr.savestr;
  console.log("\nSerialized savestr:\n" + sheetSaveStr);

  const containsTvf = sheetSaveStr.includes("cell:A1:t:Hello World:tvf:1") || sheetSaveStr.includes("tvf:1");
  const containsNtvf = sheetSaveStr.includes("cell:A2:v:123:ntvf:2") || sheetSaveStr.includes("ntvf:2");

  console.log(`\nTest results:`);
  console.log(`- Contains tvf for A1 text cell: ${containsTvf}`);
  console.log(`- Contains ntvf for A2 numeric cell: ${containsNtvf}`);

  if (containsTvf && containsNtvf) {
    console.log("SUCCESS: Both tvf and ntvf are correctly separated and serialized!");
  } else {
    console.error("FAILURE: Separated formatting serialization failed!");
    process.exit(1);
  }
}

runTest();
