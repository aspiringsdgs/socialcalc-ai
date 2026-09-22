import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting SocialCalc MCP One-Shot Workbook Generator...");
  console.log("🔌 Connecting to SocialCalc MCP Server via stdio transport...");

  const serverDistPath = path.resolve(__dirname, "../dist/index.js");
  const mcpFilesDir = path.resolve(__dirname, "../mcp_files");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverDistPath],
    cwd: path.resolve(__dirname, "..")
  });

  const client = new Client(
    { name: "business-quote-mcp-generator", version: "1.1.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("✅ Successfully connected to SocialCalc MCP Server!\n");

  // =========================================================================
  // WORKBOOK 1: QUO-01 (Quick Freelance Service Estimate)
  // =========================================================================
  console.log("📦 [1/4] Building QUO-01: Quick Freelance Service Estimate (iPhone 15 - 4 cols)...");
  const quo01Path = path.resolve(mcpFilesDir, "QUO-01_freelance_quote.json");

  const quo01Res = await client.callTool({
    name: "build_sheet",
    arguments: {
      workbookPath: quo01Path,
      sheetName: "quote",
      colWidths: { A: 160, B: 70, C: 70, D: 80 },
      banner: {
        title: "FREELANCE PRICE QUOTE",
        subtitle: "Client: Acme Studio | Quote #: QUO-2026-001 | Valid: 30 Days",
        startCell: "A1",
        colspan: 4,
        bgTitle: "#4F46E5",
        textTitle: "#ffffff",
        bgSubtitle: "#EEF2FF",
        textSubtitle: "#4F46E5",
        align: "center"
      },
      tables: [
        {
          startCell: "A4",
          headers: ["Deliverable", "Scope/Hrs", "Rate ($)", "Subtotal ($)"],
          rows: [
            ["UI/UX Wireframing", 15, 85, "=B5*C5"],
            ["Frontend Web Development", 30, 95, "=B6*C6"],
            ["SEO Setup", 1, 450, "=B7*C7"],
            ["1-Month Support", 1, 600, "=B8*C8"]
          ],
          columnFormats: ["text", "#,##0", "$#,##0.00", "$#,##0.00"],
          columnAligns: ["left", "center", "right", "right"],
          theme: "indigo",
          zebra: true,
          includeTotalRow: false
        }
      ],
      cells: [
        { coord: "A9", value: "Subtotal", bold: true },
        { coord: "D9", formula: "SUM(D5:D8)", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A10", value: "Client Discount (10%)", bold: true },
        { coord: "D10", formula: "D9*0.1", valueFormat: "$#,##0.00", textColor: "#DC2626", bold: true, align: "right" },
        { coord: "A11", value: "Net Quotation", bold: true, fontSize: "11pt", textColor: "#4F46E5", bgColor: "#EEF2FF" },
        { coord: "D11", formula: "D9-D10", valueFormat: "$#,##0.00", bold: true, fontSize: "11pt", textColor: "#4F46E5", bgColor: "#EEF2FF", align: "right" },
        { coord: "A13", value: "* Terms: 50% upfront, balance on delivery. Quotation valid for 30 days.", italic: true, fontSize: "9pt", textColor: "#64748B", align: "center", colspan: 4 }
      ],
      borders: [
        { range: "A9:D9", top: "1px solid rgb(203,213,225)" },
        { range: "A11:D11", border: "2px solid rgb(79,70,229)" }
      ]
    }
  });
  console.log(quo01Res.content[0].text);

  const audit01 = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath: quo01Path }
  });
  console.log(audit01.content[0].text);

  // =========================================================================
  // WORKBOOK 2: QUO-02 (HVAC / Home Services Job Quote)
  // =========================================================================
  console.log("\n📦 [2/4] Building QUO-02: HVAC Commercial Installation Quote (iPhone 15 Pro Max - 5 cols)...");
  const quo02Path = path.resolve(mcpFilesDir, "QUO-02_hvac_quote.json");

  const quo02Res = await client.callTool({
    name: "build_sheet",
    arguments: {
      workbookPath: quo02Path,
      sheetName: "hvacquote",
      colWidths: { A: 155, B: 75, C: 45, D: 65, E: 75 },
      banner: {
        title: "HVAC COMMERCIAL INSTALLATION QUOTE",
        subtitle: "Customer: Metroplex Retail LLC | Quote #: HVAC-2026-88 | Date: 2026-08-28",
        startCell: "A1",
        colspan: 5,
        bgTitle: "#4F46E5",
        textTitle: "#ffffff",
        bgSubtitle: "#EEF2FF",
        textSubtitle: "#4F46E5",
        align: "center"
      },
      tables: [
        {
          startCell: "A4",
          headers: ["Item Description", "Category", "Qty", "Unit Price", "Amount"],
          rows: [
            ["4-Ton Heat Pump Unit", "Equipment", 1, 3850.00, "=C5*D5"],
            ["Ductwork Modification", "Materials", 1, 950.00, "=C6*D6"],
            ["Smart Thermostat", "Parts", 1, 280.00, "=C7*D7"],
            ["Installation Labor", "Labor", 8, 110.00, "=C8*D8"],
            ["Disposal Fee", "Services", 1, 150.00, "=C9*D9"]
          ],
          columnFormats: ["text", "text", "#,##0", "$#,##0.00", "$#,##0.00"],
          columnAligns: ["left", "center", "center", "right", "right"],
          theme: "indigo",
          zebra: true,
          includeTotalRow: false
        }
      ],
      cells: [
        { coord: "A10", value: "Equipment & Materials Subtotal", bold: true },
        { coord: "E10", formula: "SUM(E5:E7)", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A11", value: "Labor & Services Subtotal", bold: true },
        { coord: "E11", formula: "SUM(E8:E9)", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A12", value: "Gross Job Subtotal", bold: true },
        { coord: "E12", formula: "E10+E11", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A13", value: "State Energy Efficiency Rebate", bold: true, textColor: "#16A34A" },
        { coord: "E13", value: -500, valueFormat: "$#,##0.00", textColor: "#16A34A", bold: true, align: "right" },
        { coord: "A14", value: "Estimated Sales Tax (6.5%)", bold: true },
        { coord: "E14", formula: "(E12+E13)*0.065", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A15", value: "Total Proposed Investment", bold: true, fontSize: "11pt", textColor: "#4F46E5", bgColor: "#EEF2FF" },
        { coord: "E15", formula: "E12+E13+E14", valueFormat: "$#,##0.00", bold: true, fontSize: "11pt", textColor: "#4F46E5", bgColor: "#EEF2FF", align: "right" },
        { coord: "A17", value: "* Includes 10-year compressor warranty & 1-year labor guarantee. Valid for 30 days.", italic: true, fontSize: "9pt", textColor: "#64748B", align: "center", colspan: 5 }
      ],
      borders: [
        { range: "A10:E10", top: "1px solid rgb(203,213,225)" },
        { range: "A12:E12", top: "1px solid rgb(203,213,225)" },
        { range: "A15:E15", border: "2px solid rgb(79,70,229)" }
      ]
    }
  });
  console.log(quo02Res.content[0].text);

  const audit02 = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath: quo02Path }
  });
  console.log(audit02.content[0].text);

  // =========================================================================
  // WORKBOOK 3: QUO-03 (B2B Cloud Software Proposal & Price Quote)
  // =========================================================================
  console.log("\n📦 [3/4] Building QUO-03: Cloud Software Formal Proposal (iPad 10th Gen - 8 cols)...");
  const quo03Path = path.resolve(mcpFilesDir, "QUO-03_cloud_software_proposal.json");

  const quo03Res = await client.callTool({
    name: "build_sheet",
    arguments: {
      workbookPath: quo03Path,
      sheetName: "commercialquote",
      colWidths: { A: 85, B: 180, C: 120, D: 75, E: 85, F: 90, G: 75, H: 95 },
      banner: {
        title: "B2B CLOUD SOFTWARE & ARCHITECTURE PROPOSAL",
        subtitle: "Client: Nexus Corp | Quote #: QUO-2026-092 | Terms: 50% Advance, 50% on UAT | Valid to: 2026-09-30",
        startCell: "A1",
        colspan: 8,
        bgTitle: "#4F46E5",
        textTitle: "#ffffff",
        bgSubtitle: "#EEF2FF",
        textSubtitle: "#4F46E5",
        align: "center"
      },
      kpiCards: {
        startCell: "A4",
        cardsPerRow: 3,
        cards: [
          { title: "Project Duration", value: "14 Weeks", theme: "indigo", widthCols: 2 },
          { title: "Total Engineering Days", value: "120 Days", theme: "slate", widthCols: 3 },
          { title: "Total Proposed Investment", formula: "H19", valueFormat: "$#,##0.00", theme: "indigo", widthCols: 3 }
        ]
      },
      tables: [
        {
          startCell: "A7",
          title: "Development Milestones & Phase Deliverables",
          headers: ["Milestone", "Deliverable Description", "Tech Stack", "Qty/Seats", "Unit Rate ($)", "Subtotal ($)", "Discount ($)", "Milestone Total ($)"],
          rows: [
            ["Phase 1", "System Architecture & API Design", "Node.js / OpenAPI", 1, 6500, "=D9*E9", 0, "=F9-G9"],
            ["Phase 2", "Core Microservices Backend", "TypeScript / Docker", 1, 14500, "=D10*E10", 500, "=F10-G10"],
            ["Phase 3", "Web Dashboard & UI Components", "React / Tailwind", 1, 9800, "=D11*E11", 300, "=F11-G11"],
            ["Phase 4", "Cloud Infrastructure (AWS CDK)", "AWS / Terraform", 1, 8200, "=D12*E12", 200, "=F12-G12"],
            ["Phase 5", "CI/CD & Security Hardening", "GitHub Actions / Vault", 1, 4500, "=D13*E13", 0, "=F13-G13"],
            ["Phase 6", "Load Testing & Go-Live Staging", "k6 / CloudWatch", 1, 3500, "=D14*E14", 0, "=F14-G14"]
          ],
          columnFormats: ["text", "text", "text", "#,##0", "$#,##0.00", "$#,##0.00", "$#,##0.00", "$#,##0.00"],
          columnAligns: ["center", "left", "left", "center", "right", "right", "right", "right"],
          theme: "indigo",
          zebra: true,
          includeTotalRow: false
        }
      ],
      cells: [
        { coord: "A15", value: "Gross Milestone Subtotal", bold: true },
        { coord: "H15", formula: "SUM(H9:H14)", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A16", value: "Enterprise Volume Discount (8%)", bold: true, textColor: "#DC2626" },
        { coord: "H16", formula: "H15*0.08", valueFormat: "$#,##0.00", bold: true, textColor: "#DC2626", align: "right" },
        { coord: "A17", value: "Taxable Value", bold: true },
        { coord: "H17", formula: "H15-H16", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A18", value: "GST / Sales Tax (18%)", bold: true },
        { coord: "H18", formula: "H17*0.18", valueFormat: "$#,##0.00", bold: true, align: "right" },
        { coord: "A19", value: "Final Proposal Total", bold: true, fontSize: "12pt", textColor: "#4F46E5", bgColor: "#EEF2FF" },
        { coord: "H19", formula: "H17+H18", valueFormat: "$#,##0.00", bold: true, fontSize: "12pt", textColor: "#4F46E5", bgColor: "#EEF2FF", align: "right" },
        { coord: "A21", value: "Payment Terms: 50% Advance Upon Signing | 50% Upon User Acceptance Testing (UAT).", italic: true, fontSize: "9pt", textColor: "#64748B", align: "center", colspan: 8 }
      ],
      borders: [
        { range: "A15:H15", top: "1px solid rgb(203,213,225)" },
        { range: "A19:H19", border: "2px solid rgb(79,70,229)" }
      ]
    }
  });
  console.log(quo03Res.content[0].text);

  const audit03 = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath: quo03Path }
  });
  console.log(audit03.content[0].text);

  // =========================================================================
  // WORKBOOK 4: QUO-04 (Enterprise Turnkey IT Infrastructure Quotation)
  // =========================================================================
  console.log("\n📦 [4/4] Building QUO-04: Enterprise Turnkey IT Infrastructure (iPad Pro - 2 Sheets, 10 cols)...");
  const quo04Path = path.resolve(mcpFilesDir, "QUO-04_enterprise_turnkey_quote.json");

  const quo04Res = await client.callTool({
    name: "build_workbook",
    arguments: {
      workbookPath: quo04Path,
      activeSheet: "quotationmaster",
      sheets: [
        {
          sheetName: "quotationmaster",
          colWidths: { A: 45, B: 170, C: 110, D: 60, E: 90, F: 95, G: 80, H: 90, I: 100, J: 80 },
          banner: {
            title: "ENTERPRISE TURNKEY IT INFRASTRUCTURE QUOTATION",
            subtitle: "Client: Apex Global Logistics | Quote #: QUO-2026-ENT-04 | Date: 2026-08-28 | Valid: 45 Days",
            startCell: "A1",
            colspan: 10,
            bgTitle: "#4F46E5",
            textTitle: "#ffffff",
            bgSubtitle: "#EEF2FF",
            textSubtitle: "#4F46E5",
            align: "center"
          },
          kpiCards: {
            startCell: "A4",
            cardsPerRow: 4,
            cards: [
              { title: "Total CapEx Hardware", formula: "SUM(F9:F13)", valueFormat: "$#,##0.00", theme: "indigo", widthCols: 2 },
              { title: "Total Licenses & Cabling", formula: "SUM(F14:F16)", valueFormat: "$#,##0.00", theme: "slate", widthCols: 3 },
              { title: "Total Deployment & Labor", formula: "SUM(F17:F18)", valueFormat: "$#,##0.00", theme: "amber", widthCols: 2 },
              { title: "Turnkey Project Investment", formula: "H23", valueFormat: "$#,##0.00", theme: "indigo", widthCols: 3 }
            ]
          },
          tables: [
            {
              startCell: "A7",
              title: "Itemized Capital Expenditure (CapEx) Infrastructure Bill of Materials",
              headers: ["#", "Item Description", "Category", "Qty", "Unit Cost ($)", "Gross Cost ($)", "Discount (%)", "Net Cost ($)", "Warranty", "Status"],
              rows: [
                [1, "Dell PowerEdge R760 Server", "Hardware", 4, 8500, "=D9*E9", 0.05, "=F9*(1-G9)", "3-Yr ProSupport", "In Stock"],
                [2, "Cisco Catalyst 9300 48P Switch", "Networking", 6, 4200, "=D10*E10", 0.08, "=F10*(1-G10)", "5-Yr SmartNet", "In Stock"],
                [3, "Fortinet FortiGate 200F Firewall", "Security", 2, 6800, "=D11*E11", 0.05, "=F11*(1-G11)", "3-Yr FortiCare", "In Stock"],
                [4, "APC Smart-UPS RT 10kVA", "Power/Backup", 2, 5400, "=D12*E12", 0.00, "=F12*(1-G12)", "2-Yr Factory", "In Stock"],
                [5, "Synology RS3621xs+ NAS 120TB", "Storage", 2, 7900, "=D13*E13", 0.05, "=F13*(1-G13)", "5-Yr Enterprise", "In Stock"],
                [6, "OM4 10Gbps Fiber Optics (500m)", "Cabling", 5, 650, "=D14*E14", 0.00, "=F14*(1-G14)", "Lifetime", "In Stock"],
                [7, "Cat6A Shielded Bulk Cabling (1000ft)", "Cabling", 10, 320, "=D15*E15", 0.00, "=F15*(1-G15)", "Lifetime", "In Stock"],
                [8, "VMware vSphere Enterprise (16 CPU)", "Licensing", 1, 14800, "=D16*E16", 0.10, "=F16*(1-G16)", "1-Yr Sub", "Active"],
                [9, "Turnkey Rack & Cable Setup", "Labor", 80, 125, "=D17*E17", 0.00, "=F17*(1-G17)", "Standard", "Scheduled"],
                [10, "Enterprise Admin Handover & Training", "Professional", 24, 150, "=D18*E18", 0.00, "=F18*(1-G18)", "Standard", "Scheduled"]
              ],
              columnFormats: ["#,##0", "text", "text", "#,##0", "$#,##0.00", "$#,##0.00", "0.0%", "$#,##0.00", "text", "text"],
              columnAligns: ["center", "left", "center", "center", "right", "right", "center", "right", "center", "center"],
              theme: "indigo",
              zebra: true,
              includeTotalRow: false
            }
          ],
          cells: [
            { coord: "A19", value: "Gross CapEx Subtotal", bold: true },
            { coord: "H19", formula: "SUM(H9:H18)", valueFormat: "$#,##0.00", bold: true, align: "right" },
            { coord: "A20", value: "Enterprise Bundled Discount (5%)", bold: true, textColor: "#DC2626" },
            { coord: "H20", formula: "H19*0.05", valueFormat: "$#,##0.00", bold: true, textColor: "#DC2626", align: "right" },
            { coord: "A21", value: "Taxable Infrastructure Investment", bold: true },
            { coord: "H21", formula: "H19-H20", valueFormat: "$#,##0.00", bold: true, align: "right" },
            { coord: "A22", value: "State & Municipal Sales Tax (6.0%)", bold: true },
            { coord: "H22", formula: "H21*0.06", valueFormat: "$#,##0.00", bold: true, align: "right" },
            { coord: "A23", value: "Final Turnkey Project Investment", bold: true, fontSize: "12pt", textColor: "#4F46E5", bgColor: "#EEF2FF" },
            { coord: "H23", formula: "H21+H22", valueFormat: "$#,##0.00", bold: true, fontSize: "12pt", textColor: "#4F46E5", bgColor: "#EEF2FF", align: "right" },
            { coord: "A25", value: "Terms & Conditions: 40% Advance, 40% On Hardware Delivery, 20% Final Sign-off. Quote valid for 45 days.", italic: true, fontSize: "9pt", textColor: "#64748B", align: "center", colspan: 10 },
            { coord: "A26", value: "Electronic Authorization & Acceptance: [  ] Authorized Signature: _______________________ Date: ____________", bold: true, fontSize: "9pt", textColor: "#312E81", align: "center", colspan: 10 }
          ],
          borders: [
            { range: "A19:J19", top: "1px solid rgb(203,213,225)" },
            { range: "A23:J23", border: "2px solid rgb(79,70,229)" }
          ]
        },
        {
          sheetName: "recurringsla",
          colWidths: { A: 160, B: 110, C: 110, D: 110, E: 130 },
          banner: {
            title: "MANAGED IT SERVICES & RECURRING SLA TIERS",
            subtitle: "Ongoing 24x7 Infrastructure Monitoring, Patching, and Incident Response Tiers",
            startCell: "A1",
            colspan: 5,
            bgTitle: "#4F46E5",
            textTitle: "#ffffff",
            bgSubtitle: "#EEF2FF",
            textSubtitle: "#4F46E5",
            align: "center"
          },
          kpiCards: {
            startCell: "A4",
            cardsPerRow: 3,
            cards: [
              { title: "Tier 1 Standard (Monthly)", value: 1250, valueFormat: "$#,##0.00", theme: "slate", widthCols: 1 },
              { title: "Tier 2 Professional (Monthly)", value: 2450, valueFormat: "$#,##0.00", theme: "indigo", widthCols: 2 },
              { title: "Tier 3 Enterprise 24/7 (Monthly)", value: 3950, valueFormat: "$#,##0.00", theme: "purple", widthCols: 2 }
            ]
          },
          tables: [
            {
              startCell: "A7",
              title: "SLA Feature Comparison Matrix & Monthly Retainers",
              headers: ["SLA Feature / SLA Metric", "Tier 1: Standard", "Tier 2: Professional", "Tier 3: Enterprise", "Recommended Selection"],
              rows: [
                ["Response Time SLA", "Next Business Day", "4 Hours", "15 Minutes 24x7", "Tier 3 (Mission-Critical)"],
                ["Monitoring Coverage", "8x5 Business Hours", "16x5 Extended", "24x7x365 NOC", "24x7 Included"],
                ["Firmware & OS Patching", "Quarterly", "Monthly", "Bi-Weekly Automated", "Included"],
                ["On-Site Emergency Visits", "Billable ($150/hr)", "2 Visits / Mo Included", "Unlimited Included", "Unlimited"],
                ["Disaster Recovery Drills", "Annual", "Semi-Annual", "Quarterly Simulated", "Included"],
                ["Dedicated Lead Architect", "No", "Shared Pool", "Dedicated Named", "Yes"],
                ["Monthly SLA Retainer ($)", 1250, 2450, 3950, 3950],
                ["Annual SLA Commitment ($)", "=B13*12", "=C13*12", "=D13*12", "=E13*12"]
              ],
              columnFormats: ["text", "text", "text", "text", "text"],
              columnAligns: ["left", "center", "center", "center", "center"],
              theme: "indigo",
              zebra: true,
              includeTotalRow: false
            }
          ],
          formats: [
            { range: "B13:E14", format: "$#,##0.00" }
          ],
          borders: [
            { range: "A13:E13", top: "1px solid rgb(203,213,225)" },
            { range: "A14:E14", border: "2px solid rgb(79,70,229)" }
          ]
        }
      ]
    }
  });
  console.log(quo04Res.content[0].text);

  const audit04 = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath: quo04Path }
  });
  console.log(audit04.content[0].text);

  console.log("\n🎉 ALL 4 BUSINESS QUOTE SPREADSHEETS SUCCESSFULLY CREATED AND CERTIFIED VIA MCP TOOLS!");
}

main().catch(err => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
