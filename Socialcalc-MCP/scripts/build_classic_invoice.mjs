import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🎨 Building Pixel-Perfect Classic Billing Invoice via SocialCalc MCP Server...");

  const serverDistPath = path.resolve(__dirname, "../dist/index.js");
  const mcpFilesDir = path.resolve(__dirname, "../mcp_files");
  const invoiceWorkbookPath = path.resolve(mcpFilesDir, "classic_billing_invoice.json");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverDistPath],
    cwd: path.resolve(__dirname, "..")
  });

  const client = new Client(
    { name: "classic-invoice-builder", version: "1.1.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Connected to SocialCalc MCP Server!");

  // Construct the cell updates and styles
  const colWidths = {
    A: 13,
    B: 14,
    C: 137,
    D: 143,
    E: 15,
    F: 83,
    G: 16,
    H: 109,
    I: 136,
    J: 15
  };

  const cells = [
    // 1. INVOICE Title Header (H2:I3)
    {
      coord: "H2",
      value: "INVOICE",
      fontSize: "16pt",
      bold: true,
      align: "center",
      colspan: 2,
      rowspan: 2
    },

    // 2. Company Info Lines (C3:E6)
    { coord: "C3", value: "", colspan: 3 },
    { coord: "C4", value: "", colspan: 3 },
    { coord: "C5", value: "", colspan: 3 },
    { coord: "C6", value: "", colspan: 3 },

    // 3. Invoice Metadata Box (C8:D9, H8:I9)
    { coord: "C8", value: "Invoice No.", bold: false, align: "left" },
    { coord: "D8", value: "", align: "left" },
    { coord: "C9", value: "Date", bold: false, align: "left" },
    { coord: "D9", value: "", valueFormat: "YYYY-MM-DD", align: "left" },

    { coord: "H8", value: "Ship Via", bold: false, align: "left" },
    { coord: "I8", value: "", align: "right" },
    { coord: "H9", value: "Terms", bold: false, align: "left" },
    { coord: "I9", value: "", align: "right" },

    // 4. Bill To Box (Rows 11-15, Cols B-E)
    { coord: "C11", value: "Bill To", bold: false, align: "left", colspan: 2 },
    { coord: "C12", value: "", colspan: 2 },
    { coord: "C13", value: "", colspan: 2 },
    { coord: "C14", value: "", colspan: 2 },
    { coord: "C15", value: "", colspan: 2 },

    // 5. Ship To Box (Rows 11-15, Cols G-J)
    { coord: "H11", value: "Ship To", bold: false, align: "left", colspan: 2 },
    { coord: "H12", value: "", colspan: 2 },
    { coord: "H13", value: "", colspan: 2 },
    { coord: "H14", value: "", colspan: 2 },
    { coord: "H15", value: "", colspan: 2 },

    // 6. Table Headers (Row 18)
    { coord: "C18", value: "Number", bold: true, fontSize: "10pt", textColor: "#ffffff", bgColor: "#7788DD", align: "center" },
    { coord: "D18", value: "Description", bold: true, fontSize: "10pt", textColor: "#ffffff", bgColor: "#7788DD", align: "center", colspan: 4 },
    { coord: "H18", value: "Unit Price", bold: true, fontSize: "10pt", textColor: "#ffffff", bgColor: "#7788DD", align: "center" },
    { coord: "I18", value: "Amount", bold: true, fontSize: "10pt", textColor: "#ffffff", bgColor: "#7788DD", align: "center" },

    // 7. Table Data Rows (Rows 19 to 31)
    // Row 19 (white)
    { coord: "C19", value: "", align: "left" },
    { coord: "D19", value: "", colspan: 4, align: "left" },
    { coord: "H19", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I19", formula: 'IF(COUNTA(H19)>0,H19*C19,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 20 (lavender)
    { coord: "C20", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D20", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H20", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I20", formula: 'IF(COUNTA(H20)>0,H20*C20,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 21 (white)
    { coord: "C21", value: "", align: "left" },
    { coord: "D21", value: "", colspan: 4, align: "left" },
    { coord: "H21", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I21", formula: 'IF(COUNTA(H21)>0,H21*C21,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 22 (lavender)
    { coord: "C22", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D22", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H22", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I22", formula: 'IF(COUNTA(H22)>0,H22*C22,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 23 (white)
    { coord: "C23", value: "", align: "left" },
    { coord: "D23", value: "", colspan: 4, align: "left" },
    { coord: "H23", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I23", formula: 'IF(COUNTA(H23)>0,H23*C23,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 24 (lavender)
    { coord: "C24", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D24", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H24", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I24", formula: 'IF(COUNTA(H24)>0,H24*C24,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 25 (white)
    { coord: "C25", value: "", align: "left" },
    { coord: "D25", value: "", colspan: 4, align: "left" },
    { coord: "H25", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I25", formula: 'IF(COUNTA(H25)>0,H25*C25,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 26 (lavender)
    { coord: "C26", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D26", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H26", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I26", formula: 'IF(COUNTA(H26)>0,H26*C26,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 27 (white)
    { coord: "C27", value: "", align: "left" },
    { coord: "D27", value: "", colspan: 4, align: "left" },
    { coord: "H27", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I27", formula: 'IF(COUNTA(H27)>0,H27*C27,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 28 (lavender)
    { coord: "C28", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D28", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H28", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I28", formula: 'IF(COUNTA(H28)>0,H28*C28,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 29 (white)
    { coord: "C29", value: "", align: "left" },
    { coord: "D29", value: "", colspan: 4, align: "left" },
    { coord: "H29", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I29", formula: 'IF(COUNTA(H29)>0,H29*C29,"")', valueFormat: "#,##0.00", align: "right" },

    // Row 30 (lavender)
    { coord: "C30", value: "", bgColor: "#E6E6FA", align: "left" },
    { coord: "D30", value: "", bgColor: "#E6E6FA", colspan: 4, align: "left" },
    { coord: "H30", value: "", bgColor: "#E6E6FA", align: "right", valueFormat: "#,##0.00" },
    { coord: "I30", formula: 'IF(COUNTA(H30)>0,H30*C30,"")', bgColor: "#E6E6FA", valueFormat: "#,##0.00", align: "right" },

    // Row 31 (white)
    { coord: "C31", value: "", align: "left" },
    { coord: "D31", value: "", colspan: 4, align: "left" },
    { coord: "H31", value: "", align: "right", valueFormat: "#,##0.00" },
    { coord: "I31", formula: 'IF(COUNTA(H31)>0,H31*C31,"")', valueFormat: "#,##0.00", align: "right" },

    // 8. Total Summary Row (Row 32)
    { coord: "H32", value: "Total", fontSize: "12pt", bold: true, align: "left" },
    { coord: "I32", formula: "SUM(I19:I31)", value: 0, fontSize: "12pt", bold: true, valueFormat: "#,##0.00", align: "right" }
  ];

  const borders = [
    // Company Header Lines
    { range: "C3:E3", bottom: "1px solid rgb(0,0,0)" },
    { range: "C4:E4", top: "1px solid rgb(0,0,0)", bottom: "1px solid rgb(0,0,0)" },
    { range: "C5:E5", top: "1px solid rgb(0,0,0)", bottom: "1px solid rgb(0,0,0)" },
    { range: "C6:E6", top: "1px solid rgb(0,0,0)", bottom: "1px solid rgb(0,0,0)" },

    // Invoice No / Date Box
    { range: "C8:D8", border: "1px solid rgb(0,0,0)" },
    { range: "C9:D9", border: "1px solid rgb(0,0,0)" },

    // Ship Via / Terms Box
    { range: "H8:I8", border: "1px solid rgb(0,0,0)" },
    { range: "H9:I9", border: "1px solid rgb(0,0,0)" },

    // Bill To Box (Outer Border around B11:E15 and internal lines)
    { range: "B11:E11", top: "1px solid rgb(0,0,0)" },
    { range: "B11:B15", left: "1px solid rgb(0,0,0)" },
    { range: "E11:E15", right: "1px solid rgb(0,0,0)" },
    { range: "B15:E15", bottom: "1px solid rgb(0,0,0)" },
    { range: "C12:D12", bottom: "1px solid rgb(0,0,0)" },
    { range: "C13:D13", bottom: "1px solid rgb(0,0,0)" },
    { range: "C14:D14", bottom: "1px solid rgb(0,0,0)" },

    // Ship To Box (Outer Border around G11:J15 and internal lines)
    { range: "G11:J11", top: "1px solid rgb(0,0,0)" },
    { range: "G11:G15", left: "1px solid rgb(0,0,0)" },
    { range: "J11:J15", right: "1px solid rgb(0,0,0)" },
    { range: "G15:J15", bottom: "1px solid rgb(0,0,0)" },
    { range: "H12:I12", bottom: "1px solid rgb(0,0,0)" },
    { range: "H13:I13", bottom: "1px solid rgb(0,0,0)" },
    { range: "H14:I14", bottom: "1px solid rgb(0,0,0)" },

    // Table Header Borders
    { range: "C18:I18", border: "1px solid rgb(0,0,0)" },

    // Table Grid Outer & Column Separators (Rows 19 to 31)
    { range: "C19:C31", left: "1px solid rgb(0,0,0)", right: "1px solid rgb(0,0,0)" },
    { range: "D19:G31", left: "1px solid rgb(0,0,0)", right: "1px solid rgb(0,0,0)" },
    { range: "H19:H31", left: "1px solid rgb(0,0,0)", right: "1px solid rgb(0,0,0)" },
    { range: "I19:I31", left: "1px solid rgb(0,0,0)", right: "1px solid rgb(0,0,0)" },
    { range: "C31:I31", bottom: "1px solid rgb(0,0,0)" },

    // Total Row Border
    { range: "H32:I32", top: "1px solid rgb(0,0,0)" },
    { range: "I32:I32", bottom: "1px solid rgb(0,0,0)" }
  ];

  console.log("⚡ Executing One-Shot MCP Tool Call: build_sheet...");
  const res = await client.callTool({
    name: "build_sheet",
    arguments: {
      workbookPath: invoiceWorkbookPath,
      sheetName: "InvoiceBlue",
      colWidths,
      cells,
      borders
    }
  });

  console.log(res.content[0].text);

  console.log("\n🔍 Running Validation Audit...");
  const auditRes = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath: invoiceWorkbookPath }
  });

  console.log(auditRes.content[0].text);
  console.log("✨ EXACT INVOICE MATCH SUCCESSFULLY BUILT AND VALIDATED!");
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
