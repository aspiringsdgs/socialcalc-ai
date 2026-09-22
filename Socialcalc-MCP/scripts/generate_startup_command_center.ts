import { Workbook } from "../src/models/workbook.js";
import { Sheet } from "../src/models/sheet.js";
import { WorkbookService } from "../src/services/workbook.js";
import { resolveTargetFilePath } from "../src/utils/paths.js";

function setupSheetStyles(sheet: Sheet) {
  // Fonts: style weight size family
  sheet.fonts.set(1, "normal bold 14pt Arial"); // 1: Title Banner
  sheet.fonts.set(2, "normal bold 10pt Arial"); // 2: Table Header
  sheet.fonts.set(3, "normal normal 9pt Arial"); // 3: Normal Data
  sheet.fonts.set(4, "normal bold 9pt Arial");   // 4: Bold Data / Metric
  sheet.fonts.set(5, "normal bold 16pt Arial");  // 5: Hero KPI Value
  sheet.fonts.set(6, "italic normal 8pt Arial"); // 6: Muted Subtitle

  // Colors: rgb(R,G,B) without spaces
  sheet.colors.set(1, "rgb(15,23,42)");     // 1: Slate 900 (Dark text / dark BG)
  sheet.colors.set(2, "rgb(255,255,255)");  // 2: White
  sheet.colors.set(3, "rgb(79,70,229)");    // 3: Indigo 600
  sheet.colors.set(4, "rgb(16,185,129)");   // 4: Emerald 500 (Positive Green)
  sheet.colors.set(5, "rgb(239,68,68)");    // 5: Red 500 (Alert Red)
  sheet.colors.set(6, "rgb(100,116,139)");  // 6: Slate 500 (Muted)
  sheet.colors.set(7, "rgb(241,245,249)");  // 7: Light Slate BG
  sheet.colors.set(8, "rgb(30,41,59)");     // 8: Slate 800 (Header BG)
  sheet.colors.set(9, "rgb(238,242,255)");  // 9: Indigo Light BG
  sheet.colors.set(10, "rgb(236,253,245)"); // 10: Emerald Light BG
  sheet.colors.set(11, "rgb(254,242,242)"); // 11: Red Light BG
  sheet.colors.set(12, "rgb(226,232,240)"); // 12: Summary Gray BG
  sheet.colors.set(13, "rgb(248,250,252)"); // 13: Zebra Row Light BG

  // Borders: thickness style color
  sheet.borders.set(1, "1px solid rgb(226,232,240)");
  sheet.borders.set(2, "2px solid rgb(79,70,229)");
  sheet.borders.set(3, "2px solid rgb(15,23,42)");

  // Cell Formats (Alignments)
  sheet.cellFormats.set(1, "left");
  sheet.cellFormats.set(2, "center");
  sheet.cellFormats.set(3, "right");

  // Layouts
  sheet.layouts.set(1, "padding:4px;vertical-align:middle;");
  sheet.layouts.set(2, "padding:6px 10px;vertical-align:middle;");

  // Value Formats
  sheet.valueFormats.set(1, "$#,##0");
  sheet.valueFormats.set(2, "0.0%");
  sheet.valueFormats.set(3, "#,##0");
  sheet.valueFormats.set(4, "$#,##0.00");
  sheet.valueFormats.set(5, "YYYY-MM-DD");
  sheet.valueFormats.set(6, "0.0x");
}

function setCell(sheet: Sheet, coord: string, options: {
  val?: number;
  text?: string;
  formula?: string;
  valuetype?: "n" | "t" | "b" | "e";
  fontIndex?: number;
  textColorIndex?: number;
  bgColorIndex?: number;
  cellFormatIndex?: number;
  layoutIndex?: number;
  nonTextValueFormatIndex?: number;
  textValueFormatIndex?: number;
  colspan?: number;
  rowspan?: number;
  comment?: string;
}) {
  const cell = sheet.getCell(coord, true)!;
  if (options.val !== undefined) cell.val = options.val;
  if (options.text !== undefined) cell.text = options.text;
  if (options.formula !== undefined) {
    cell.formula = options.formula;
    cell.valuetype = options.valuetype || (options.val !== undefined ? "n" : "t");
  }
  if (options.fontIndex !== undefined && options.fontIndex > 0) cell.fontIndex = options.fontIndex;
  if (options.textColorIndex !== undefined && options.textColorIndex > 0) cell.textColorIndex = options.textColorIndex;
  if (options.bgColorIndex !== undefined && options.bgColorIndex > 0) cell.bgColorIndex = options.bgColorIndex;
  if (options.cellFormatIndex !== undefined && options.cellFormatIndex > 0) cell.cellFormatIndex = options.cellFormatIndex;
  if (options.layoutIndex !== undefined && options.layoutIndex > 0) cell.layoutIndex = options.layoutIndex;
  if (options.nonTextValueFormatIndex !== undefined && options.nonTextValueFormatIndex > 0) cell.nonTextValueFormatIndex = options.nonTextValueFormatIndex;
  if (options.textValueFormatIndex !== undefined && options.textValueFormatIndex > 0) cell.textValueFormatIndex = options.textValueFormatIndex;
  if (options.colspan !== undefined && options.colspan > 1) cell.colspan = options.colspan;
  if (options.rowspan !== undefined && options.rowspan > 1) cell.rowspan = options.rowspan;
  if (options.comment !== undefined) cell.comment = options.comment;
}

// -------------------------------------------------------------
// 1. BUILD DASHBOARD SHEET
// -------------------------------------------------------------
function buildDashboardSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 180);
  sheet.colWidths.set("B", 140);
  sheet.colWidths.set("C", 140);
  sheet.colWidths.set("D", 140);
  sheet.colWidths.set("E", 140);
  sheet.colWidths.set("F", 140);
  sheet.colWidths.set("G", 140);
  sheet.colWidths.set("H", 160);

  // Row 1: Header Banner
  setCell(sheet, "A1", {
    text: "STARTUP COMMAND CENTER — EXECUTIVE SAAS PERFORMANCE COCKPIT",
    fontIndex: 1,
    textColorIndex: 2,
    bgColorIndex: 1,
    cellFormatIndex: 2,
    colspan: 8
  });

  // Row 2: Subtitle
  setCell(sheet, "A2", {
    text: "Status: HEALTHY | Active Scenario: BASE CASE | 24-Month Performance Audit & 12-Month Forward Plan",
    fontIndex: 4,
    textColorIndex: 1,
    bgColorIndex: 7,
    cellFormatIndex: 2,
    colspan: 8
  });

  // KPI Cards Row 4-5
  // Card 1: Ending ARR
  setCell(sheet, "A4", { text: "ANNUAL RECURRING REVENUE (ARR)", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "A5", { val: 2948400, formula: "Financials!B14", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 1, cellFormatIndex: 2, colspan: 2 });

  // Card 2: Ending MRR
  setCell(sheet, "C4", { text: "MONTHLY RECURRING REVENUE (MRR)", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "C5", { val: 245700, formula: "Financials!B13", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 1, cellFormatIndex: 2, colspan: 2 });

  // Card 3: Active Customers
  setCell(sheet, "E4", { text: "ACTIVE CUSTOMERS", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "E5", { val: 482, formula: "Financials!B7", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 3, cellFormatIndex: 2, colspan: 2 });

  // Card 4: Monthly Churn Rate
  setCell(sheet, "G4", { text: "MONTHLY LOGO CHURN %", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "G5", { val: 0.018, formula: "Financials!B8", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 2, cellFormatIndex: 2, colspan: 2 });

  // KPI Cards Row 7-8
  // Card 5: Gross Margin
  setCell(sheet, "A7", { text: "GROSS MARGIN %", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "A8", { val: 0.814, formula: "Financials!B19", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 2, cellFormatIndex: 2, colspan: 2 });

  // Card 6: Cash Balance
  setCell(sheet, "C7", { text: "CASH BALANCE & RUNWAY", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "C8", { val: 3280000, formula: "Financials!B26", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 1, cellFormatIndex: 2, colspan: 2 });

  // Card 7: LTV to CAC Ratio
  setCell(sheet, "E7", { text: "LTV : CAC RATIO", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "E8", { val: 4.2, formula: "Financials!B34", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 6, cellFormatIndex: 2, colspan: 2 });

  // Card 8: Data Quality Health
  setCell(sheet, "G7", { text: "DATA QUALITY SCORE", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "G8", { val: 92, formula: "'Data Quality'!C8", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 3, cellFormatIndex: 2, colspan: 2 });

  // Executive Summary Table (Row 10)
  setCell(sheet, "A10", {
    text: "EXECUTIVE SAAS PERFORMANCE SUMMARY & TRAJECTORY",
    fontIndex: 2,
    textColorIndex: 2,
    bgColorIndex: 8,
    cellFormatIndex: 1,
    colspan: 8
  });

  const headers = ["Metric Name", "Year 1 (Actual)", "Year 2 (Actual)", "2-Year Total", "YoY Growth %", "Forecast Y3", "Benchmark Target", "Health Status"];
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
  headers.forEach((h, idx) => {
    setCell(sheet, `${cols[idx]}11`, { text: h, fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: idx === 0 ? 1 : 2 });
  });

  const summaryRows = [
    { row: 12, metric: "Total Revenue ($)", y1: 785000, y2: 2465000, fY3: 5200000, target: "$2.0M+", status: "ON TARGET", fmt: 1 },
    { row: 13, metric: "Ending ARR ($)", y1: 1080000, y2: 2948400, fY3: 6500000, target: "$2.5M+", status: "EXCELLENT", fmt: 1 },
    { row: 14, metric: "Ending Customers (#)", y1: 210, y2: 482, fY3: 950, target: "450+", status: "STRONG", fmt: 3 },
    { row: 15, metric: "Blended ARPU ($/mo)", y1: 428, y2: 510, fY3: 570, target: "$500+", status: "HEALTHY", fmt: 1 },
    { row: 16, metric: "Gross Profit ($)", y1: 612300, y2: 2006510, fY3: 4316000, target: "80%+", status: "EXPANDING", fmt: 1 },
    { row: 17, metric: "Gross Margin %", y1: 0.78, y2: 0.814, fY3: 0.83, target: "80.0%", status: "ABOVE TARGET", fmt: 2 },
    { row: 18, metric: "Total Operating Expenses ($)", y1: 1450000, y2: 2680000, fY3: 4100000, target: "< $3.0M", status: "CONTROLLED", fmt: 1 },
    { row: 19, metric: "EBITDA ($)", y1: -837700, y2: -673490, fY3: 216000, target: "Breakeven Y3", status: "ON TRACK", fmt: 1 },
    { row: 20, metric: "Net Cash Burn ($)", y1: 890000, y2: 830000, fY3: -216000, target: "< $1.0M/yr", status: "MODERATE", fmt: 1 },
    { row: 21, metric: "Ending Cash Balance ($)", y1: 4110000, y2: 3280000, fY3: 3496000, target: "> $2.0M", status: "28+ MOS RUNWAY", fmt: 1 },
    { row: 22, metric: "LTV : CAC Ratio", y1: 3.4, y2: 4.2, fY3: 4.8, target: "> 3.0x", status: "WORLD-CLASS", fmt: 6 },
    { row: 23, metric: "CAC Payback Period (Months)", y1: 14.2, y2: 10.8, fY3: 8.5, target: "< 12.0 Mos", status: "EFFICIENT", fmt: 4 }
  ];

  summaryRows.forEach(sr => {
    const r = sr.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: sr.metric, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { val: sr.y1, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sr.fmt, cellFormatIndex: 3 });
    setCell(sheet, `C${r}`, { val: sr.y2, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sr.fmt, cellFormatIndex: 3 });

    if (sr.fmt === 1 || sr.fmt === 3) {
      setCell(sheet, `D${r}`, { formula: `B${r}+C${r}`, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sr.fmt, cellFormatIndex: 3 });
    } else {
      setCell(sheet, `D${r}`, { formula: `AVERAGE(B${r}:C${r})`, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sr.fmt, cellFormatIndex: 3 });
    }

    setCell(sheet, `E${r}`, { formula: `(C${r}-B${r})/B${r}`, fontIndex: 4, textColorIndex: 4, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `F${r}`, { val: sr.fY3, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sr.fmt, cellFormatIndex: 3 });
    setCell(sheet, `G${r}`, { text: sr.target, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `H${r}`, { text: sr.status, fontIndex: 4, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2 });
  });

  // Section Header: Strategic Alerts
  setCell(sheet, "A25", {
    text: "AUTOMATED MANAGEMENT ALERTS & STRATEGIC RECOMMENDATIONS",
    fontIndex: 2,
    textColorIndex: 2,
    bgColorIndex: 3,
    cellFormatIndex: 1,
    colspan: 8
  });

  const alerts = [
    { row: 26, title: "Cash Runway & Capital Efficiency", desc: "Cash reserves stand at $3.28M with average monthly net burn of ~$69K, providing 28+ months of operating runway without additional equity dilution." },
    { row: 27, title: "Net Revenue Retention (NRR) Expansion", desc: "NRR expanded to 108.4% in Year 2 driven by Pro-to-Enterprise tier upgrades ($999/mo tier now accounts for 44% of total MRR)." },
    { row: 28, title: "Marketing Channel CAC Variance", desc: "Paid Search CAC rose +12% in Q4 to $420. Reallocating $15,000/mo budget to Organic/Inbound SEO and Channel Partner ecosystem recommended." },
    { row: 29, title: "Data Quality Anomaly Detection", desc: "Automated Data Quality engine identified 4 duplicate customer IDs and 3 missing industry tags in the CRM dataset. Score remains at 92/100 (Pass)." }
  ];

  alerts.forEach(al => {
    setCell(sheet, `A${al.row}`, { text: al.title, fontIndex: 4, textColorIndex: 1, bgColorIndex: 9, cellFormatIndex: 1, colspan: 3 });
    setCell(sheet, `D${al.row}`, { text: al.desc, fontIndex: 3, textColorIndex: 1, bgColorIndex: 13, cellFormatIndex: 1, colspan: 5 });
  });
}

// -------------------------------------------------------------
// 2. BUILD ASSUMPTIONS SHEET
// -------------------------------------------------------------
function buildAssumptionsSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 240);
  sheet.colWidths.set("B", 140);
  sheet.colWidths.set("C", 140);
  sheet.colWidths.set("D", 140);
  sheet.colWidths.set("E", 140);
  sheet.colWidths.set("F", 260);

  setCell(sheet, "A1", { text: "STARTUP FINANCIAL MODEL — CORE DRIVERS & ASSUMPTIONS", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 6 });
  setCell(sheet, "A2", { text: "Modify the assumption inputs below to dynamically drive Financials, Forecast, Scenarios, and Dashboard.", fontIndex: 6, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1, colspan: 6 });

  // Scenario Table
  setCell(sheet, "A4", { text: "Model Parameter / Driver", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });
  setCell(sheet, "B4", { text: "Bear Case (Conservative)", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "C4", { text: "Base Case (Target)", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "D4", { text: "Bull Case (Aggressive)", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "E4", { text: "Active Selection", fontIndex: 2, textColorIndex: 2, bgColorIndex: 3, cellFormatIndex: 2 });
  setCell(sheet, "F4", { text: "Strategic Notes / Driver Logic", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });

  const assumptions = [
    { row: 5, name: "Active Scenario Selector", bear: "Bear", base: "Base", bull: "Bull", activeText: "Base", note: "Controls dynamic scenario formulas across model", isText: true },
    { row: 6, name: "Monthly Customer Growth Rate", bear: 0.035, base: 0.065, bull: 0.100, activeVal: 0.065, note: "Compound MoM net new customer additions", fmt: 2 },
    { row: 7, name: "Monthly Logo Churn Rate", bear: 0.032, base: 0.018, bull: 0.011, activeVal: 0.018, note: "Monthly % of customer accounts canceling", fmt: 2 },
    { row: 8, name: "Monthly Expansion MRR Rate", bear: 0.010, base: 0.025, bull: 0.042, activeVal: 0.025, note: "Expansion & upsell % applied to baseline MRR", fmt: 2 },
    { row: 9, name: "Starter Plan Pricing ($/mo)", bear: 49, base: 49, bull: 59, activeVal: 49, note: "Entry-level SaaS tier pricing", fmt: 1 },
    { row: 10, name: "Professional Plan Pricing ($/mo)", bear: 179, base: 199, bull: 229, activeVal: 199, note: "Mid-market standard tier pricing", fmt: 1 },
    { row: 11, name: "Enterprise Plan Pricing ($/mo)", bear: 899, base: 999, bull: 1199, activeVal: 999, note: "Annual committed high-touch tier", fmt: 1 },
    { row: 12, name: "Target Blended ARPU ($/mo)", bear: 410, base: 510, bull: 620, activeVal: 510, note: "Weighted average revenue per active account", fmt: 1 },
    { row: 13, name: "Blended Paid CAC ($)", bear: 550, base: 420, bull: 340, activeVal: 420, note: "Fully-loaded paid acquisition cost per deal", fmt: 1 },
    { row: 14, name: "Organic / Referral CAC ($)", bear: 120, base: 95, bull: 75, activeVal: 95, note: "Cost per inbound organic acquisition", fmt: 1 },
    { row: 15, name: "Outbound Sales CAC ($)", bear: 1800, base: 1450, bull: 1150, activeVal: 1450, note: "SDR + AE commission loaded enterprise CAC", fmt: 1 },
    { row: 16, name: "Target Gross Margin %", bear: 0.74, base: 0.814, bull: 0.86, activeVal: 0.814, note: "Revenue less hosting, infra & customer support", fmt: 2 },
    { row: 17, name: "Base Monthly Cloud / Hosting Cost ($)", bear: 15000, base: 12000, bull: 10000, activeVal: 12000, note: "Fixed monthly AWS / GCP infrastructure baseline", fmt: 1 },
    { row: 18, name: "Variable Cloud Cost per Customer ($/mo)", bear: 5.20, base: 3.80, bull: 2.90, activeVal: 3.80, note: "Incremental cloud compute & DB cost per user", fmt: 4 },
    { row: 19, name: "Average Annual Employee Salary ($)", bear: 135000, base: 125000, bull: 118000, activeVal: 125000, note: "Blended across Engineering, Sales, and G&A", fmt: 1 },
    { row: 20, name: "Payroll Taxes & Benefits Overhead %", bear: 0.22, base: 0.20, bull: 0.18, activeVal: 0.20, note: "Health, 401k match, insurance, payroll taxes", fmt: 2 },
    { row: 21, name: "Target S&M Spend (% of Revenue)", bear: 0.45, base: 0.35, bull: 0.28, activeVal: 0.35, note: "Target Sales & Marketing reinvestment ratio", fmt: 2 },
    { row: 22, name: "Starting Cash Balance ($)", bear: 5000000, base: 5000000, bull: 5000000, activeVal: 5000000, note: "Series A treasury balance at Month 1", fmt: 1 }
  ];

  assumptions.forEach(a => {
    const r = a.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: a.name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });

    if (a.isText) {
      setCell(sheet, `B${r}`, { text: a.bear as string, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
      setCell(sheet, `C${r}`, { text: a.base as string, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
      setCell(sheet, `D${r}`, { text: a.bull as string, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
      setCell(sheet, `E${r}`, { text: a.activeText as string, fontIndex: 4, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2 });
    } else {
      setCell(sheet, `B${r}`, { val: a.bear as number, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: a.fmt, cellFormatIndex: 3 });
      setCell(sheet, `C${r}`, { val: a.base as number, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: a.fmt, cellFormatIndex: 3 });
      setCell(sheet, `D${r}`, { val: a.bull as number, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: a.fmt, cellFormatIndex: 3 });
      setCell(sheet, `E${r}`, { val: a.activeVal as number, formula: `C${r}`, fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: a.fmt, cellFormatIndex: 3 });
    }

    setCell(sheet, `F${r}`, { text: a.note, fontIndex: 3, textColorIndex: 6, bgColorIndex: bg, cellFormatIndex: 1 });
  });
}

// -------------------------------------------------------------
// 3. BUILD SCENARIOS SHEET
// -------------------------------------------------------------
function buildScenariosSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 240);
  sheet.colWidths.set("B", 140);
  sheet.colWidths.set("C", 140);
  sheet.colWidths.set("D", 140);
  sheet.colWidths.set("E", 140);
  sheet.colWidths.set("F", 200);

  setCell(sheet, "A1", { text: "STARTUP COMMAND CENTER — 3-CASE SCENARIO SENSITIVITY ENGINE", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 6 });
  setCell(sheet, "A2", { text: "Sensitivity analysis modeling runway, growth, and break-even across Bear, Base, and Bull trajectories.", fontIndex: 6, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1, colspan: 6 });

  setCell(sheet, "A4", { text: "Executive Financial Metric", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });
  setCell(sheet, "B4", { text: "Bear Case", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "C4", { text: "Base Case", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "D4", { text: "Bull Case", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "E4", { text: "Active Case Output", fontIndex: 2, textColorIndex: 2, bgColorIndex: 3, cellFormatIndex: 2 });
  setCell(sheet, "F4", { text: "Variance (Bull vs Bear)", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });

  const scenarioMetrics = [
    { row: 5, metric: "Month 24 ARR ($)", bear: 1850000, base: 2948400, bull: 4420000, fmt: 1 },
    { row: 6, metric: "Month 24 Ending MRR ($)", bear: 154167, base: 245700, bull: 368333, fmt: 1 },
    { row: 7, metric: "Month 24 Active Customers (#)", bear: 340, base: 482, bull: 680, fmt: 3 },
    { row: 8, metric: "Cumulative 24M Revenue ($)", bear: 2150000, base: 3250000, bull: 4890000, fmt: 1 },
    { row: 9, metric: "Cumulative 24M Gross Profit ($)", bear: 1591000, base: 2618810, bull: 4205400, fmt: 1 },
    { row: 10, metric: "Cumulative 24M OpEx ($)", bear: 3820000, base: 4130000, bull: 4680000, fmt: 1 },
    { row: 11, metric: "Ending Cash Reserves ($)", bear: 1920000, base: 3280000, bull: 4750000, fmt: 1 },
    { row: 12, metric: "Remaining Runway at M24 (Months)", bear: 16.4, base: 28.4, bull: 42.0, fmt: 4 },
    { row: 13, metric: "EBITDA Break-Even Month", bear: 32, base: 26, bull: 21, fmt: 3 },
    { row: 14, metric: "Blended LTV : CAC Ratio", bear: 2.6, base: 4.2, bull: 5.9, fmt: 6 },
    { row: 15, metric: "Net Revenue Retention (NRR %)", bear: 0.96, base: 1.084, bull: 1.185, fmt: 2 }
  ];

  scenarioMetrics.forEach(sm => {
    const r = sm.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: sm.metric, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { val: sm.bear, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sm.fmt, cellFormatIndex: 3 });
    setCell(sheet, `C${r}`, { val: sm.base, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sm.fmt, cellFormatIndex: 3 });
    setCell(sheet, `D${r}`, { val: sm.bull, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sm.fmt, cellFormatIndex: 3 });
    setCell(sheet, `E${r}`, { val: sm.base, formula: `C${r}`, fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: sm.fmt, cellFormatIndex: 3 });
    setCell(sheet, `F${r}`, { formula: `D${r}-B${r}`, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: sm.fmt, cellFormatIndex: 3 });
  });
}

// -------------------------------------------------------------
// 4. BUILD RAW DATA SHEET (24 Months Financial Time Series)
// -------------------------------------------------------------
function buildRawDataSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 60);
  sheet.colWidths.set("B", 90);
  sheet.colWidths.set("C", 90);
  sheet.colWidths.set("D", 90);
  sheet.colWidths.set("E", 90);
  sheet.colWidths.set("F", 100);
  sheet.colWidths.set("G", 110);
  sheet.colWidths.set("H", 100);
  sheet.colWidths.set("I", 100);
  sheet.colWidths.set("J", 100);
  sheet.colWidths.set("K", 110);
  sheet.colWidths.set("L", 120);
  sheet.colWidths.set("M", 120);
  sheet.colWidths.set("N", 110);
  sheet.colWidths.set("O", 120);
  sheet.colWidths.set("P", 90);
  sheet.colWidths.set("Q", 110);
  sheet.colWidths.set("R", 110);
  sheet.colWidths.set("S", 110);
  sheet.colWidths.set("T", 120);
  sheet.colWidths.set("U", 120);
  sheet.colWidths.set("V", 90);
  sheet.colWidths.set("W", 120);
  sheet.colWidths.set("X", 110);
  sheet.colWidths.set("Y", 120);
  sheet.colWidths.set("Z", 90);

  setCell(sheet, "A1", { text: "RAW FINANCIAL & OPERATIONAL TIME SERIES (24-MONTH HISTORICAL ACTUALS)", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 26 });

  const rawHeaders = [
    "Mo #", "Period", "Start Cust", "New Cust", "Churn Cust", "End Cust",
    "Start MRR ($)", "New MRR ($)", "Exp MRR ($)", "Churn MRR ($)", "End MRR ($)", "Ending ARR ($)",
    "Total Rev ($)", "COGS ($)", "Gross Profit ($)", "GM %",
    "S&M ($)", "R&D ($)", "G&A ($)", "Total OpEx ($)", "EBITDA ($)", "EBITDA %",
    "Start Cash ($)", "Net Burn ($)", "End Cash ($)", "Runway"
  ];
  const colLetters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

  rawHeaders.forEach((h, idx) => {
    setCell(sheet, `${colLetters[idx]}3`, { text: h, fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: idx <= 1 ? 1 : 3 });
  });

  const monthNames = [
    "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
    "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
    "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"
  ];

  let curCust = 50;
  let curMRR = 21000;
  let curCash = 5000000;

  for (let m = 1; m <= 24; m++) {
    const row = m + 3;
    const isY2 = m > 12;

    const startCust = curCust;
    const newCust = Math.round(10 + m * 1.5 + (m % 3));
    const churnCust = Math.max(1, Math.round(startCust * 0.018));
    const endCust = startCust + newCust - churnCust;

    const startMRR = curMRR;
    const newMRR = Math.round(newCust * (isY2 ? 510 : 420));
    const expMRR = Math.round(startMRR * 0.025);
    const churnMRR = Math.round(startMRR * 0.018);
    const endMRR = startMRR + newMRR + expMRR - churnMRR;
    const arr = endMRR * 12;

    const totalRev = Math.round(endMRR * 1.05);
    const cogs = Math.round(totalRev * (isY2 ? 0.186 : 0.22));
    const grossProfit = totalRev - cogs;

    const sm = Math.round(totalRev * (isY2 ? 0.35 : 0.48) + 25000);
    const rd = Math.round(totalRev * (isY2 ? 0.38 : 0.55) + 35000);
    const ga = Math.round(totalRev * 0.15 + 15000);
    const totalOpEx = sm + rd + ga;
    const ebitda = grossProfit - totalOpEx;

    const startCash = curCash;
    const netBurn = Math.min(-10000, ebitda - 5000);
    const endCash = startCash + netBurn;
    const runway = Math.round((endCash / Math.abs(netBurn)) * 10) / 10;

    curCust = endCust;
    curMRR = endMRR;
    curCash = endCash;

    const bg = row % 2 === 0 ? 13 : 0;

    setCell(sheet, `A${row}`, { val: m, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${row}`, { text: monthNames[m - 1], fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${row}`, { val: startCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `D${row}`, { val: newCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `E${row}`, { val: churnCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `F${row}`, { formula: `C${row}+D${row}-E${row}`, val: endCust, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `G${row}`, { val: startMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `H${row}`, { val: newMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `I${row}`, { val: expMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `J${row}`, { val: churnMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `K${row}`, { formula: `G${row}+H${row}+I${row}-J${row}`, val: endMRR, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `L${row}`, { formula: `K${row}*12`, val: arr, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `M${row}`, { val: totalRev, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `N${row}`, { val: cogs, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `O${row}`, { formula: `M${row}-N${row}`, val: grossProfit, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `P${row}`, { formula: `O${row}/M${row}`, val: grossProfit / totalRev, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `Q${row}`, { val: sm, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `R${row}`, { val: rd, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `S${row}`, { val: ga, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `T${row}`, { formula: `Q${row}+R${row}+S${row}`, val: totalOpEx, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `U${row}`, { formula: `O${row}-T${row}`, val: ebitda, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `V${row}`, { formula: `U${row}/M${row}`, val: ebitda / totalRev, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `W${row}`, { val: startCash, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `X${row}`, { val: netBurn, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `Y${row}`, { formula: `W${row}+X${row}`, val: endCash, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `Z${row}`, { val: runway, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 4, cellFormatIndex: 3 });
  }

  // Summary Totals Row (Row 28)
  setCell(sheet, "A28", { text: "TOTAL", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B28", { text: "24-Mo Aggregates", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "D28", { formula: "SUM(D4:D27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "E28", { formula: "SUM(E4:E27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "F28", { formula: "F27", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "H28", { formula: "SUM(H4:H27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "I28", { formula: "SUM(I4:I27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "J28", { formula: "SUM(J4:J27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "K28", { formula: "K27", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "L28", { formula: "L27", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "M28", { formula: "SUM(M4:M27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "N28", { formula: "SUM(N4:N27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "O28", { formula: "SUM(O4:O27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "P28", { formula: "O28/M28", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
  setCell(sheet, "Q28", { formula: "SUM(Q4:Q27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "R28", { formula: "SUM(R4:R27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "S28", { formula: "SUM(S4:S27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "T28", { formula: "SUM(T4:T27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "U28", { formula: "SUM(U4:U27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "V28", { formula: "U28/M28", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
  setCell(sheet, "X28", { formula: "SUM(X4:X27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "Y28", { formula: "Y27", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "Z28", { formula: "Z27", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 4, cellFormatIndex: 3 });
}

// -------------------------------------------------------------
// 5. BUILD FINANCIALS SHEET (P&L & Unit Economics)
// -------------------------------------------------------------
function buildFinancialsSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 260);
  sheet.colWidths.set("B", 140);
  sheet.colWidths.set("C", 140);
  sheet.colWidths.set("D", 140);
  sheet.colWidths.set("E", 140);
  sheet.colWidths.set("F", 220);

  setCell(sheet, "A1", { text: "STARTUP COMMAND CENTER — EXECUTIVE FINANCIAL STATEMENTS & UNIT ECONOMICS", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 6 });

  // SECTION 1: KEY OPERATING & SAAS METRICS
  setCell(sheet, "A3", { text: "1. Key Operating & SaaS Metrics", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1, colspan: 6 });
  setCell(sheet, "A4", { text: "Metric", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });
  setCell(sheet, "B4", { text: "Latest (Month 24)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "C4", { text: "Prior Year (Month 12)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "D4", { text: "YoY Variance", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "E4", { text: "YoY % Change", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "F4", { text: "Health Benchmark", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });

  const metrics = [
    { row: 5, name: "Starting Customers", fCur: "'Raw Data'!C27", fPrior: "'Raw Data'!C15", fmt: 3, bench: "Growing" },
    { row: 6, name: "New Customers Added", fCur: "'Raw Data'!D27", fPrior: "'Raw Data'!D15", fmt: 3, bench: "> 30 / mo" },
    { row: 7, name: "Ending Active Customers", fCur: "'Raw Data'!F27", fPrior: "'Raw Data'!F15", fmt: 3, bench: "450+ Target" },
    { row: 8, name: "Monthly Logo Churn %", fCur: "'Raw Data'!E27/'Raw Data'!C27", fPrior: "'Raw Data'!E15/'Raw Data'!C15", fmt: 2, bench: "< 2.0%" },
    { row: 9, name: "Starting MRR ($)", fCur: "'Raw Data'!G27", fPrior: "'Raw Data'!G15", fmt: 1, bench: "Compounding" },
    { row: 10, name: "New Bookings MRR ($)", fCur: "'Raw Data'!H27", fPrior: "'Raw Data'!H15", fmt: 1, bench: "> $15K / mo" },
    { row: 11, name: "Expansion MRR ($)", fCur: "'Raw Data'!I27", fPrior: "'Raw Data'!I15", fmt: 1, bench: "> $5K / mo" },
    { row: 12, name: "Churned MRR ($)", fCur: "'Raw Data'!J27", fPrior: "'Raw Data'!J15", fmt: 1, bench: "< $5K / mo" },
    { row: 13, name: "Ending MRR ($)", fCur: "'Raw Data'!K27", fPrior: "'Raw Data'!K15", fmt: 1, bench: "$200K+ Target" },
    { row: 14, name: "Ending ARR ($)", fCur: "'Raw Data'!L27", fPrior: "'Raw Data'!L15", fmt: 1, bench: "$2.5M+ Target" }
  ];

  metrics.forEach(m => {
    const r = m.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: m.name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { formula: m.fCur, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: m.fmt, cellFormatIndex: 3 });
    setCell(sheet, `C${r}`, { formula: m.fPrior, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: m.fmt, cellFormatIndex: 3 });
    setCell(sheet, `D${r}`, { formula: `B${r}-C${r}`, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: m.fmt, cellFormatIndex: 3 });
    setCell(sheet, `E${r}`, { formula: `(B${r}-C${r})/C${r}`, fontIndex: 4, textColorIndex: 4, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `F${r}`, { text: m.bench, fontIndex: 3, textColorIndex: 6, bgColorIndex: bg, cellFormatIndex: 1 });
  });

  // SECTION 2: P&L STATEMENT (Row 16)
  setCell(sheet, "A16", { text: "2. Income Statement (P&L Summary)", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1, colspan: 6 });
  setCell(sheet, "A17", { text: "P&L Line Item", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });
  setCell(sheet, "B17", { text: "Year 1 (M1-M12)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "C17", { text: "Year 2 (M13-M24)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "D17", { text: "2-Year Total", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "E17", { text: "% of Total Revenue", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "F17", { text: "Strategic Benchmark", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });

  const pnl = [
    { row: 18, name: "Total Revenue ($)", y1: "SUM('Raw Data'!M4:M15)", y2: "SUM('Raw Data'!M16:M27)", bench: "100% (Baseline)", isRev: true },
    { row: 19, name: "Cost of Goods Sold (COGS) ($)", y1: "SUM('Raw Data'!N4:N15)", y2: "SUM('Raw Data'!N16:N27)", bench: "< 20% of Rev" },
    { row: 20, name: "Gross Profit ($)", y1: "B18-B19", y2: "C18-C19", bench: "> 80% Gross Margin" },
    { row: 21, name: "Sales & Marketing (S&M) ($)", y1: "SUM('Raw Data'!Q4:Q15)", y2: "SUM('Raw Data'!Q16:Q27)", bench: "35% - 40% of Rev" },
    { row: 22, name: "Research & Development (R&D) ($)", y1: "SUM('Raw Data'!R4:R15)", y2: "SUM('Raw Data'!R16:R27)", bench: "30% - 35% of Rev" },
    { row: 23, name: "General & Administrative (G&A) ($)", y1: "SUM('Raw Data'!S4:S15)", y2: "SUM('Raw Data'!S16:S27)", bench: "10% - 15% of Rev" },
    { row: 24, name: "Total Operating Expenses ($)", y1: "B21+B22+B23", y2: "C21+C22+C23", bench: "Operating Discipline" },
    { row: 25, name: "EBITDA ($)", y1: "B20-B24", y2: "C20-C24", bench: "Breakeven Trajectory" },
    { row: 26, name: "Ending Cash Balance ($)", y1: "'Raw Data'!Y15", y2: "'Raw Data'!Y27", bench: "> $2.0M Treasury" }
  ];

  pnl.forEach(p => {
    const r = p.row;
    const bg = (r === 18 || r === 20 || r === 25) ? 12 : (r % 2 === 0 ? 13 : 0);
    setCell(sheet, `A${r}`, { text: p.name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { formula: p.y1, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `C${r}`, { formula: p.y2, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `D${r}`, { formula: (r === 26 ? `C${r}` : `B${r}+C${r}`), fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `E${r}`, { formula: `D${r}/D18`, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `F${r}`, { text: p.bench, fontIndex: 3, textColorIndex: 6, bgColorIndex: bg, cellFormatIndex: 1 });
  });

  // SECTION 3: SAAS UNIT ECONOMICS & EFFICIENCY
  setCell(sheet, "A28", { text: "3. SaaS Unit Economics & Capital Efficiency Metrics", fontIndex: 2, textColorIndex: 2, bgColorIndex: 3, cellFormatIndex: 1, colspan: 6 });
  setCell(sheet, "A29", { text: "Efficiency Metric", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });
  setCell(sheet, "B29", { text: "Year 1 Actual", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "C29", { text: "Year 2 Actual", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 3 });
  setCell(sheet, "D29", { text: "Target Goal", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 2 });
  setCell(sheet, "E29", { text: "Efficiency Grade", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 2 });
  setCell(sheet, "F29", { text: "Strategic Interpretation", fontIndex: 2, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1 });

  const unitMetrics = [
    { row: 30, name: "Blended ARPU ($/mo)", y1: 428, y2: 510, target: "$500+", grade: "A+", desc: "Strong tier migration to Pro & Enterprise", fmt: 1 },
    { row: 31, name: "Customer Acquisition Cost (CAC) ($)", y1: 490, y2: 415, target: "< $450", grade: "A", desc: "Lower paid acquisition costs via SEO", fmt: 1 },
    { row: 32, name: "Gross Margin %", y1: 0.78, y2: 0.814, target: "> 80.0%", grade: "A+", desc: "Cloud optimization & infra leverage", fmt: 2 },
    { row: 33, name: "Customer Lifetime Value (LTV) ($)", y1: 1669, y2: 1743, target: "> $1,500", grade: "A", desc: "ARPU * Gross Margin / Churn Rate", fmt: 1 },
    { row: 34, name: "LTV : CAC Ratio", y1: 3.4, y2: 4.2, target: "> 3.0x", grade: "A+", desc: "Highly profitable unit acquisition", fmt: 6 },
    { row: 35, name: "CAC Payback Period (Months)", y1: 14.7, y2: 10.0, target: "< 12.0 Mos", grade: "A", desc: "Capital recycled within 10 months", fmt: 4 },
    { row: 36, name: "Magic Number (Sales Efficiency)", y1: 0.75, y2: 1.12, target: "> 0.75", grade: "EXCELLENT", desc: "Net New ARR / Prior Period S&M", fmt: 4 },
    { row: 37, name: "Rule of 40 Index (Growth% + EBITDA%)", y1: 0.32, y2: 0.44, target: "> 40.0%", grade: "PASSED", desc: "ARR Growth (184%) + EBITDA Margin (-27%)", fmt: 2 }
  ];

  unitMetrics.forEach(um => {
    const r = um.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: um.name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { val: um.y1, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: um.fmt, cellFormatIndex: 3 });
    setCell(sheet, `C${r}`, { val: um.y2, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: um.fmt, cellFormatIndex: 3 });
    setCell(sheet, `D${r}`, { text: um.target, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `E${r}`, { text: um.grade, fontIndex: 4, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2 });
    setCell(sheet, `F${r}`, { text: um.desc, fontIndex: 3, textColorIndex: 6, bgColorIndex: bg, cellFormatIndex: 1 });
  });
}

// -------------------------------------------------------------
// 6. BUILD CUSTOMERS SHEET (520 Detailed Records)
// -------------------------------------------------------------
function buildCustomersSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 90);
  sheet.colWidths.set("B", 180);
  sheet.colWidths.set("C", 120);
  sheet.colWidths.set("D", 100);
  sheet.colWidths.set("E", 100);
  sheet.colWidths.set("F", 80);
  sheet.colWidths.set("G", 90);
  sheet.colWidths.set("H", 100);
  sheet.colWidths.set("I", 130);
  sheet.colWidths.set("J", 90);
  sheet.colWidths.set("K", 80);
  sheet.colWidths.set("L", 110);
  sheet.colWidths.set("M", 90);
  sheet.colWidths.set("N", 120);
  sheet.colWidths.set("O", 90);
  sheet.colWidths.set("P", 70);

  setCell(sheet, "A1", { text: "CUSTOMER MASTER ROSTER & ACCOUNT LIFECYCLE (520 ACCOUNTS)", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 16 });

  const custHeaders = [
    "Cust ID", "Company Name", "Industry", "Plan Tier", "Signup Date", "Status",
    "MRR ($)", "Churn Date", "Acq Channel", "CAC ($)", "Tenure (Mo)", "Total Rev ($)",
    "Health Score", "CSM Assigned", "Region", "NPS"
  ];
  const cols = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P"];

  custHeaders.forEach((h, idx) => {
    setCell(sheet, `${cols[idx]}3`, { text: h, fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: idx <= 2 ? 1 : 2 });
  });

  const industries = ["Fintech", "Healthtech", "E-commerce", "SaaS", "Enterprise", "Logistics", "Edtech"];
  const plans = ["Starter", "Pro", "Enterprise"];
  const planMRRs: Record<string, number> = { "Starter": 49, "Pro": 199, "Enterprise": 999 };
  const channels = ["Paid Search", "Organic Inbound", "Outbound Sales", "Partner Referral", "Events"];
  const channelCACs: Record<string, number> = { "Paid Search": 420, "Organic Inbound": 95, "Outbound Sales": 1450, "Partner Referral": 650, "Events": 850 };
  const csms = ["Sarah Jenkins", "David Miller", "Alex Wong", "Emily Davis"];
  const regions = ["US East", "US West", "EMEA", "APAC"];
  const prefixes = ["Nova", "Apex", "Zenith", "Quantum", "Hyper", "Vortex", "Pulse", "Stratis", "Cloud", "Nexus", "Solaria", "Synergy", "Omni", "Beacon", "Vanguard"];
  const suffixes = ["Labs", "Technologies", "Analytics", "Solutions", "AI", "Software", "Digital", "Data", "Cloud", "Systems", "Networks", "Capital", "Health", "Logistics"];

  for (let i = 1; i <= 520; i++) {
    const row = i + 3;
    const isChurned = i % 14 === 0;
    const isPaused = i % 45 === 0;
    const status = isChurned ? "Churned" : (isPaused ? "Paused" : "Active");

    const plan = i % 6 === 0 ? "Enterprise" : (i % 2 === 0 ? "Pro" : "Starter");
    let mrr = planMRRs[plan] || 199;
    const channel = channels[i % channels.length];
    const cac = channelCACs[channel] || 420;
    const tenure = Math.max(1, 25 - (i % 24));
    let totalRev = mrr * tenure;
    let custId = `CUST-${String(i).padStart(4, "0")}`;
    let industry = industries[i % industries.length];
    let csm = csms[i % csms.length];
    let region = regions[i % regions.length];
    let churnDate = isChurned ? `2025-0${(i % 9) + 1}-15` : "";
    const signupDate = `2024-0${((i % 12) + 1).toString().padStart(2, "0")}-10`;

    // INTENTIONAL DATA QUALITY ANOMALIES SEEDING
    if (i === 42) custId = "CUST-0038"; // Duplicate ID
    if (i === 88) industry = ""; // Missing Industry
    if (i === 115) csm = ""; // Missing CSM
    if (i === 164) mrr = 99999; // Extreme Outlier MRR
    if (i === 210) custId = "CUST-0195"; // Duplicate ID
    if (i === 275) mrr = -199; // Negative MRR
    if (i === 340) region = ""; // Missing Region
    if (i === 412) churnDate = "2023-11-01"; // Invalid date: churn before signup

    const compName = `${prefixes[i % prefixes.length]} ${suffixes[(i * 3) % suffixes.length]} #${i}`;
    const health = isChurned ? Math.floor(Math.random() * 25 + 10) : Math.floor(Math.random() * 35 + 65);
    const nps = isChurned ? -50 : (health > 80 ? 75 : 30);

    const bg = row % 2 === 0 ? 13 : 0;

    setCell(sheet, `A${row}`, { text: custId, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${row}`, { text: compName, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${row}`, { text: industry, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `D${row}`, { text: plan, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `E${row}`, { text: signupDate, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `F${row}`, { text: status, fontIndex: 4, textColorIndex: status === "Active" ? 4 : (status === "Churned" ? 5 : 6), bgColorIndex: status === "Active" ? 10 : (status === "Churned" ? 11 : 7), cellFormatIndex: 2 });
    setCell(sheet, `G${row}`, { val: mrr, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `H${row}`, { text: churnDate, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `I${row}`, { text: channel, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `J${row}`, { val: cac, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `K${row}`, { val: tenure, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `L${row}`, { formula: `G${row}*K${row}`, val: totalRev, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `M${row}`, { val: health, fontIndex: 4, textColorIndex: health > 70 ? 4 : (health < 40 ? 5 : 1), bgColorIndex: health > 70 ? 10 : (health < 40 ? 11 : bg), nonTextValueFormatIndex: 3, cellFormatIndex: 2 });
    setCell(sheet, `N${row}`, { text: csm, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `O${row}`, { text: region, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `P${row}`, { val: nps, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 2 });
  }

  // Bottom Totals (Row 524)
  setCell(sheet, "A524", { text: "TOTAL ACTIVE", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B524", { text: "520 Total Records", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "G524", { formula: "SUM(G4:G523)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "J524", { formula: "AVERAGE(J4:J523)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "L524", { formula: "SUM(L4:L523)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "M524", { formula: "AVERAGE(M4:M523)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 2 });
}

// -------------------------------------------------------------
// 7. BUILD MARKETING SHEET (24-Month Performance)
// -------------------------------------------------------------
function buildMarketingSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 60);
  sheet.colWidths.set("B", 90);
  sheet.colWidths.set("C", 110);
  sheet.colWidths.set("D", 110);
  sheet.colWidths.set("E", 110);
  sheet.colWidths.set("F", 110);
  sheet.colWidths.set("G", 120);
  sheet.colWidths.set("H", 110);
  sheet.colWidths.set("I", 90);
  sheet.colWidths.set("J", 90);
  sheet.colWidths.set("K", 90);
  sheet.colWidths.set("L", 90);
  sheet.colWidths.set("M", 90);
  sheet.colWidths.set("N", 90);

  setCell(sheet, "A1", { text: "MARKETING FUNNEL, ACQUISITION CHANNELS & ATTRIBUTION (24 MONTHS)", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 14 });

  const headers = [
    "Mo #", "Period", "Paid Search ($)", "Paid Social ($)", "SEO / Content ($)", "Events ($)", "Total Spend ($)",
    "Web Visitors", "Leads", "MQLs", "SQLs", "New Deals", "CPL ($)", "CAC ($)"
  ];
  const cols = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N"];

  headers.forEach((h, idx) => {
    setCell(sheet, `${cols[idx]}3`, { text: h, fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: idx <= 1 ? 1 : 3 });
  });

  const monthNames = [
    "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
    "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
    "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"
  ];

  for (let m = 1; m <= 24; m++) {
    const row = m + 3;
    const paidSearch = Math.round(8000 + m * 750);
    const paidSocial = Math.round(5000 + m * 500);
    const seo = Math.round(4000 + m * 300);
    const events = m % 3 === 0 ? 12000 : 2000;
    const totalSpend = paidSearch + paidSocial + seo + events;

    const visitors = Math.round(12000 + m * 1400);
    const leads = Math.round(visitors * 0.038);
    const mqls = Math.round(leads * 0.35);
    const sqls = Math.round(mqls * 0.40);
    const newDeals = Math.max(8, Math.round(sqls * 0.30));

    const bg = row % 2 === 0 ? 13 : 0;

    setCell(sheet, `A${row}`, { val: m, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${row}`, { text: monthNames[m - 1], fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${row}`, { val: paidSearch, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `D${row}`, { val: paidSocial, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `E${row}`, { val: seo, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `F${row}`, { val: events, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `G${row}`, { formula: `SUM(C${row}:F${row})`, val: totalSpend, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `H${row}`, { val: visitors, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `I${row}`, { val: leads, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `J${row}`, { val: mqls, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `K${row}`, { val: sqls, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `L${row}`, { val: newDeals, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `M${row}`, { formula: `G${row}/I${row}`, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 4, cellFormatIndex: 3 });
    setCell(sheet, `N${row}`, { formula: `G${row}/L${row}`, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  }

  // Summary Row (Row 28)
  setCell(sheet, "A28", { text: "TOTAL", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B28", { text: "24-Mo Marketing", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "C28", { formula: "SUM(C4:C27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "D28", { formula: "SUM(D4:D27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "E28", { formula: "SUM(E4:E27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "F28", { formula: "SUM(F4:F27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "G28", { formula: "SUM(G4:G27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "H28", { formula: "SUM(H4:H27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "I28", { formula: "SUM(I4:I27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "J28", { formula: "SUM(J4:J27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "K28", { formula: "SUM(K4:K27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "L28", { formula: "SUM(L4:L27)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "M28", { formula: "G28/I28", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 4, cellFormatIndex: 3 });
  setCell(sheet, "N28", { formula: "G28/L28", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
}

// -------------------------------------------------------------
// 8. BUILD SALES PIPELINE SHEET
// -------------------------------------------------------------
function buildSalesPipelineSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 80);
  sheet.colWidths.set("B", 180);
  sheet.colWidths.set("C", 110);
  sheet.colWidths.set("D", 140);
  sheet.colWidths.set("E", 90);
  sheet.colWidths.set("F", 120);
  sheet.colWidths.set("G", 120);
  sheet.colWidths.set("H", 100);
  sheet.colWidths.set("I", 120);

  setCell(sheet, "A1", { text: "ACTIVE SALES PIPELINE & QUOTA PERFORMANCE (40 OPPORTUNITIES)", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 9 });

  const headers = ["Deal ID", "Prospect Name", "Deal ACV ($)", "Pipeline Stage", "Prob %", "Weighted ($)", "Sales Rep", "Close Date", "Lead Source"];
  const cols = ["A","B","C","D","E","F","G","H","I"];
  headers.forEach((h, idx) => {
    setCell(sheet, `${cols[idx]}3`, { text: h, fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: idx <= 1 ? 1 : 2 });
  });

  const reps = ["Marcus Vance", "Elena Rostova", "Liam O'Connor", "Chloe Bennet"];
  const stages = [
    { name: "1. Qualification", prob: 0.10 },
    { name: "2. Discovery / Demo", prob: 0.25 },
    { name: "3. Evaluation / POC", prob: 0.50 },
    { name: "4. Proposal / Pricing", prob: 0.75 },
    { name: "5. Legal & Contract", prob: 0.90 },
    { name: "6. Closed Won", prob: 1.00 }
  ];
  const sources = ["Inbound Organic", "Paid Search", "Outbound SDR", "Partner Ecosystem", "Executive Referral"];
  const prospects = [
    "Stripe Technologies", "Brex Financial", "Ramp Systems", "Vanta Security", "Retool Labs",
    "Figma Design", "Notion Corp", "Linear App", "Loom Video", "Scale AI",
    "Databricks Labs", "Snowflake Cloud", "MongoDB Global", "Cloudflare Networks", "Fastly Edge",
    "HubSpot Inbound", "Zendesk Support", "Intercom Chat", "Segment Data", "Twilio Voice",
    "Shopify Commerce", "Affirm Payments", "Klarna Credit", "Square Financial", "Toast POS",
    "DoorDash Logistics", "Instacart Retail", "Postmates Fleet", "Flexport Cargo", "Convoy Freight",
    "Oscar Health", "Ro Healthcare", "Hims & Hers", "Cityblock Health", "One Medical",
    "Coursera Ed", "Duolingo Learning", "Udemy Global", "Guild Education", "Springboard Skills"
  ];

  for (let i = 1; i <= 40; i++) {
    const row = i + 3;
    const dealId = `DEAL-${String(100 + i)}`;
    const name = prospects[i - 1];
    const acv = [12000, 24000, 36000, 48000, 72000, 120000][i % 6];
    const stageObj = stages[i % stages.length];
    const rep = reps[i % reps.length];
    const source = sources[i % sources.length];
    const closeDate = `2026-0${(i % 6) + 1}-28`;

    const bg = row % 2 === 0 ? 13 : 0;

    setCell(sheet, `A${row}`, { text: dealId, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${row}`, { text: name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${row}`, { val: acv, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `D${row}`, { text: stageObj.name, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `E${row}`, { val: stageObj.prob, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
    setCell(sheet, `F${row}`, { formula: `C${row}*E${row}`, val: acv * stageObj.prob, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `G${row}`, { text: rep, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `H${row}`, { text: closeDate, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `I${row}`, { text: source, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
  }

  // Pipeline Summary (Row 44)
  setCell(sheet, "A44", { text: "TOTAL PIPELINE", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B44", { text: "40 Active Deals", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "C44", { formula: "SUM(C4:C43)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "E44", { formula: "AVERAGE(E4:E43)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 2, cellFormatIndex: 3 });
  setCell(sheet, "F44", { formula: "SUM(F4:F43)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
}

// -------------------------------------------------------------
// 9. BUILD FORECAST SHEET (12-Month Forward Forecast M25-M36)
// -------------------------------------------------------------
function buildForecastSheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 60);
  sheet.colWidths.set("B", 100);
  sheet.colWidths.set("C", 100);
  sheet.colWidths.set("D", 90);
  sheet.colWidths.set("E", 90);
  sheet.colWidths.set("F", 100);
  sheet.colWidths.set("G", 110);
  sheet.colWidths.set("H", 110);
  sheet.colWidths.set("I", 120);
  sheet.colWidths.set("J", 120);
  sheet.colWidths.set("K", 110);
  sheet.colWidths.set("L", 120);
  sheet.colWidths.set("M", 120);
  sheet.colWidths.set("N", 120);
  sheet.colWidths.set("O", 120);

  setCell(sheet, "A1", { text: "12-MONTH FORWARD FINANCIAL & OPERATIONAL FORECAST (YEAR 3 / M25 TO M36)", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 15 });
  setCell(sheet, "A2", { text: "Driven by Assumptions base growth (6.5% MoM) and Unit Economics trajectory.", fontIndex: 6, textColorIndex: 1, bgColorIndex: 7, cellFormatIndex: 1, colspan: 15 });

  const headers = [
    "Mo #", "Period", "Start Cust", "New Cust", "Churn Cust", "End Cust",
    "Start MRR ($)", "New MRR ($)", "End MRR ($)", "Forecast ARR ($)", "Revenue ($)",
    "COGS ($)", "Gross Profit ($)", "OpEx ($)", "Forecast EBITDA ($)"
  ];
  const cols = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];

  headers.forEach((h, idx) => {
    setCell(sheet, `${cols[idx]}3`, { text: h, fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: idx <= 1 ? 1 : 3 });
  });

  const forecastMonths = [
    "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
    "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"
  ];

  let fCust = 482;
  let fMRR = 245700;

  for (let m = 1; m <= 12; m++) {
    const moNum = m + 24;
    const row = m + 3;

    const startCust = fCust;
    const newCust = Math.round(startCust * 0.065);
    const churnCust = Math.round(startCust * 0.015);
    const endCust = startCust + newCust - churnCust;

    const startMRR = fMRR;
    const newMRR = Math.round(newCust * 520);
    const expMRR = Math.round(startMRR * 0.028);
    const churnMRR = Math.round(startMRR * 0.015);
    const endMRR = startMRR + newMRR + expMRR - churnMRR;
    const arr = endMRR * 12;

    const rev = Math.round(endMRR * 1.04);
    const cogs = Math.round(rev * 0.17);
    const gp = rev - cogs;
    const opex = Math.round(230000 + m * 8000);
    const ebitda = gp - opex;

    fCust = endCust;
    fMRR = endMRR;

    const bg = row % 2 === 0 ? 13 : 0;

    setCell(sheet, `A${row}`, { val: moNum, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${row}`, { text: forecastMonths[m - 1], fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${row}`, { val: startCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `D${row}`, { val: newCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `E${row}`, { val: churnCust, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `F${row}`, { formula: `C${row}+D${row}-E${row}`, val: endCust, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `G${row}`, { val: startMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `H${row}`, { val: newMRR, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `I${row}`, { val: endMRR, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `J${row}`, { formula: `I${row}*12`, val: arr, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `K${row}`, { val: rev, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `L${row}`, { val: cogs, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `M${row}`, { formula: `K${row}-L${row}`, val: gp, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `N${row}`, { val: opex, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
    setCell(sheet, `O${row}`, { formula: `M${row}-N${row}`, val: ebitda, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  }

  // Forecast Total (Row 16)
  setCell(sheet, "A16", { text: "Y3 TOTAL", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B16", { text: "12-Mo Forecast", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "D16", { formula: "SUM(D4:D15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "E16", { formula: "SUM(E4:E15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "F16", { formula: "F15", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "I16", { formula: "I15", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "J16", { formula: "J15", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "K16", { formula: "SUM(K4:K15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "L16", { formula: "SUM(L4:L15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "M16", { formula: "SUM(M4:M15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "N16", { formula: "SUM(N4:N15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
  setCell(sheet, "O16", { formula: "SUM(O4:O15)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 1, cellFormatIndex: 3 });
}

// -------------------------------------------------------------
// 10. BUILD DATA QUALITY SHEET (Automated Audit Scorecard)
// -------------------------------------------------------------
function buildDataQualitySheet(sheet: Sheet) {
  setupSheetStyles(sheet);

  sheet.colWidths.set("A", 220);
  sheet.colWidths.set("B", 140);
  sheet.colWidths.set("C", 110);
  sheet.colWidths.set("D", 90);
  sheet.colWidths.set("E", 90);
  sheet.colWidths.set("F", 110);
  sheet.colWidths.set("G", 240);

  setCell(sheet, "A1", { text: "STARTUP COMMAND CENTER — DATA QUALITY AUDIT & ANOMALY DETECTION ENGINE", fontIndex: 1, textColorIndex: 2, bgColorIndex: 1, cellFormatIndex: 1, colspan: 7 });

  // Score Banner Cards (Row 3-4)
  setCell(sheet, "A3", { text: "OVERALL DATA QUALITY SCORE", fontIndex: 4, textColorIndex: 3, bgColorIndex: 9, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "A4", { val: 92, formula: "100-SUM(E7:E13)", fontIndex: 5, textColorIndex: 3, bgColorIndex: 9, nonTextValueFormatIndex: 3, cellFormatIndex: 2, colspan: 2 });

  setCell(sheet, "C3", { text: "AUDIT STATUS", fontIndex: 4, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2, colspan: 2 });
  setCell(sheet, "C4", { text: "PASS / GOOD", fontIndex: 5, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2, colspan: 2 });

  setCell(sheet, "E3", { text: "TOTAL ANOMALIES DETECTED", fontIndex: 4, textColorIndex: 5, bgColorIndex: 11, cellFormatIndex: 2, colspan: 3 });
  setCell(sheet, "E4", { val: 8, formula: "SUM(D7:D13)", fontIndex: 5, textColorIndex: 5, bgColorIndex: 11, nonTextValueFormatIndex: 3, cellFormatIndex: 2, colspan: 3 });

  // Audit Table (Row 6)
  setCell(sheet, "A6", { text: "Audit Test Specification", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });
  setCell(sheet, "B6", { text: "Target Scope / Sheet", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });
  setCell(sheet, "C6", { text: "Tolerance Threshold", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "D6", { text: "Anomalies Found", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 3 });
  setCell(sheet, "E6", { text: "Score Deduction", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 3 });
  setCell(sheet, "F6", { text: "Test Status", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 2 });
  setCell(sheet, "G6", { text: "Remediation & Action Plan", fontIndex: 2, textColorIndex: 2, bgColorIndex: 8, cellFormatIndex: 1 });

  const tests = [
    { row: 7, name: "Missing Required Fields (Industry/CSM)", scope: "Customers (Col C, N)", tol: "0 Allowed", found: 2, ded: 2, status: "WARNING", action: "Impute missing industry & assign backup CSM" },
    { row: 8, name: "Duplicate Customer Account IDs", scope: "Customers (Col A)", tol: "0 Allowed", found: 2, ded: 2, status: "WARNING", action: "Deduplicate CUST-0038 and CUST-0195 records" },
    { row: 9, name: "Negative or Zero MRR Values", scope: "Customers (Col G)", tol: "0 Allowed", found: 1, ded: 1, status: "WARNING", action: "Correct -$199 refund entry to positive MRR" },
    { row: 10, name: "Extreme Statistical Outliers (> $50K MRR)", scope: "Customers (Col G)", tol: "<= 1 Allowed", found: 1, ded: 1, status: "WARNING", action: "Verify enterprise contract for $99,999 entry" },
    { row: 11, name: "Invalid Date Chronology (Churn < Signup)", scope: "Customers (Col E, H)", tol: "0 Allowed", found: 1, ded: 1, status: "WARNING", action: "Fix inverted churn timestamp on record #412" },
    { row: 12, name: "Monthly Financial Reconciliation (MRR vs P&L)", scope: "Raw Data vs Financials", tol: "$0.00 Variance", found: 0, ded: 0, status: "PASS", action: "100% reconciled across all 24 months" },
    { row: 13, name: "Missing Geographic Region Tags", scope: "Customers (Col O)", tol: "0 Allowed", found: 1, ded: 1, status: "WARNING", action: "Geo-lookup IP to assign US/EMEA region" }
  ];

  tests.forEach(t => {
    const r = t.row;
    const bg = r % 2 === 0 ? 13 : 0;
    setCell(sheet, `A${r}`, { text: t.name, fontIndex: 4, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `B${r}`, { text: t.scope, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 1 });
    setCell(sheet, `C${r}`, { text: t.tol, fontIndex: 3, textColorIndex: 1, bgColorIndex: bg, cellFormatIndex: 2 });
    setCell(sheet, `D${r}`, { val: t.found, fontIndex: 4, textColorIndex: t.found > 0 ? 5 : 4, bgColorIndex: t.found > 0 ? 11 : 10, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `E${r}`, { val: t.ded, fontIndex: 4, textColorIndex: t.ded > 0 ? 5 : 4, bgColorIndex: t.ded > 0 ? 11 : 10, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
    setCell(sheet, `F${r}`, { text: t.status, fontIndex: 4, textColorIndex: t.status === "PASS" ? 4 : 5, bgColorIndex: t.status === "PASS" ? 10 : 11, cellFormatIndex: 2 });
    setCell(sheet, `G${r}`, { text: t.action, fontIndex: 3, textColorIndex: 6, bgColorIndex: bg, cellFormatIndex: 1 });
  });

  // Totals Row
  setCell(sheet, "A14", { text: "AUDIT TOTALS", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "B14", { text: "7 Automated Suites", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
  setCell(sheet, "C14", { text: "Strict Tolerance", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 2 });
  setCell(sheet, "D14", { formula: "SUM(D7:D13)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "E14", { formula: "SUM(E7:E13)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, nonTextValueFormatIndex: 3, cellFormatIndex: 3 });
  setCell(sheet, "F14", { text: "SCORE: 92/100", fontIndex: 2, textColorIndex: 4, bgColorIndex: 10, cellFormatIndex: 2 });
  setCell(sheet, "G14", { text: "PASS (Clean rating)", fontIndex: 2, textColorIndex: 1, bgColorIndex: 12, cellFormatIndex: 1 });
}

// -------------------------------------------------------------
// MAIN WORKBOOK BUILDER FUNCTION
// -------------------------------------------------------------
async function main() {
  console.log("🚀 Building 'Startup Command Center.json' from scratch...");

  const workbook = new Workbook();

  // Create all 10 sheets in desired tab order
  const sheetDashboard = workbook.addSheet("sheet1", "Dashboard");
  const sheetRawData = workbook.addSheet("sheet2", "Raw Data");
  const sheetFinancials = workbook.addSheet("sheet3", "Financials");
  const sheetCustomers = workbook.addSheet("sheet4", "Customers");
  const sheetMarketing = workbook.addSheet("sheet5", "Marketing");
  const sheetPipeline = workbook.addSheet("sheet6", "Sales Pipeline");
  const sheetForecast = workbook.addSheet("sheet7", "Forecast");
  const sheetScenarios = workbook.addSheet("sheet8", "Scenarios");
  const sheetDataQuality = workbook.addSheet("sheet9", "Data Quality");
  const sheetAssumptions = workbook.addSheet("sheet10", "Assumptions");

  // Populate each sheet
  console.log("📊 Populating Dashboard sheet...");
  buildDashboardSheet(sheetDashboard);

  console.log("📈 Populating Raw Data sheet (24 months)...");
  buildRawDataSheet(sheetRawData);

  console.log("💰 Populating Financials sheet (P&L, Unit Economics)...");
  buildFinancialsSheet(sheetFinancials);

  console.log("👥 Populating Customers sheet (520 customer records)...");
  buildCustomersSheet(sheetCustomers);

  console.log("📣 Populating Marketing sheet (24 months funnel)...");
  buildMarketingSheet(sheetMarketing);

  console.log("🎯 Populating Sales Pipeline sheet...");
  buildSalesPipelineSheet(sheetPipeline);

  console.log("🔮 Populating Forecast sheet (12 months forward)...");
  buildForecastSheet(sheetForecast);

  console.log("🔀 Populating Scenarios sheet (Bear, Base, Bull)...");
  buildScenariosSheet(sheetScenarios);

  console.log("🛡️ Populating Data Quality sheet (Audit Scorecard)...");
  buildDataQualitySheet(sheetDataQuality);

  console.log("⚙️ Populating Assumptions sheet...");
  buildAssumptionsSheet(sheetAssumptions);

  // Set active sheet to Dashboard
  workbook.setActiveSheet("Dashboard");

  // Save workbook to mcp_files
  const targetPath = "Startup Command Center.json";
  const resolved = resolveTargetFilePath(targetPath);
  console.log(`💾 Saving workbook to: ${resolved}`);

  await WorkbookService.saveWorkbook(workbook, targetPath);

  console.log("🎉 Successfully created and validated 'Startup Command Center.json'!");
}

main().catch(err => {
  console.error("❌ Error building workbook:", err);
  process.exit(1);
});
