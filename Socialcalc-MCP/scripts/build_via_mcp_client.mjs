import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("🔌 Connecting to Socialcalc-MCP Server via MCP stdio transport...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["/Users/anirudhsharma/Desktop/C4GT/MCP-SERVER-IMPROVEMENTS/Socialcalc-MCP/dist/index.js"],
    cwd: "/Users/anirudhsharma/Desktop/C4GT/MCP-SERVER-IMPROVEMENTS/Socialcalc-MCP"
  });

  const client = new Client({ name: "mcp-stress-test-client", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  console.log("✅ Connected to Socialcalc MCP Server!");

  const workbookPath = "Startup Command Center.json";

  // =========================================================================
  // STEP 1: CREATE FULL WORKBOOK (Atomic Tool Call #1: create_full_workbook)
  // =========================================================================
  console.log("\n📦 [MCP Tool: create_full_workbook] Initializing 10 sheets with column widths & banners...");
  const createRes = await client.callTool({
    name: "create_full_workbook",
    arguments: {
      workbookPath,
      activeSheet: "Dashboard",
      sheets: [
        {
          name: "Dashboard",
          colWidths: { A: 200, B: 140, C: 140, D: 140, E: 140, F: 140, G: 140, H: 160 },
          title: "STARTUP COMMAND CENTER — EXECUTIVE SAAS PERFORMANCE COCKPIT",
          subtitle: "Status: HEALTHY | Active Scenario: BASE CASE | 24-Month Performance Audit & 12-Month Forward Plan"
        },
        {
          name: "RawData",
          colWidths: { A: 60, B: 90, C: 90, D: 90, E: 90, F: 100, G: 110, H: 100, I: 100, J: 100, K: 110, L: 120, M: 120, N: 110, O: 120, P: 90, Q: 110, R: 110, S: 110, T: 120, U: 120, V: 90, W: 120, X: 110, Y: 120, Z: 90 },
          title: "RAW FINANCIAL & OPERATIONAL TIME SERIES (24-MONTH HISTORICAL ACTUALS)",
          subtitle: "Granular monthly metrics for customers, MRR waterfall, P&L, burn rate, and runway."
        },
        {
          name: "Financials",
          colWidths: { A: 260, B: 140, C: 140, D: 140, E: 140, F: 220 },
          title: "STARTUP COMMAND CENTER — EXECUTIVE FINANCIAL STATEMENTS & UNIT ECONOMICS",
          subtitle: "Comprehensive P&L Statement, Unit Economics (CAC, LTV, Magic Number), and Rule of 40."
        },
        {
          name: "Customers",
          colWidths: { A: 90, B: 180, C: 120, D: 100, E: 100, F: 80, G: 90, H: 100, I: 130, J: 90, K: 80, L: 110, M: 90, N: 120, O: 90, P: 70 },
          title: "CUSTOMER MASTER ROSTER & ACCOUNT LIFECYCLE (520 ACCOUNTS)",
          subtitle: "Full customer registry with retention, acquisition channels, and intentional audit anomalies."
        },
        {
          name: "Marketing",
          colWidths: { A: 60, B: 90, C: 110, D: 110, E: 110, F: 110, G: 120, H: 110, I: 90, J: 90, K: 90, L: 90, M: 90, N: 90 },
          title: "MARKETING FUNNEL, ACQUISITION CHANNELS & ATTRIBUTION (24 MONTHS)",
          subtitle: "Multi-channel spend (Search, Social, SEO, Events), full funnel volume, CPL, and blended CAC."
        },
        {
          name: "SalesPipeline",
          colWidths: { A: 80, B: 180, C: 110, D: 140, E: 90, F: 120, G: 120, H: 100, I: 120 },
          title: "ACTIVE SALES PIPELINE & QUOTA PERFORMANCE (40 OPPORTUNITIES)",
          subtitle: "Enterprise sales pipeline with stage probabilities, weighted contract values, and reps."
        },
        {
          name: "Forecast",
          colWidths: { A: 60, B: 100, C: 100, D: 90, E: 90, F: 100, G: 110, H: 110, I: 120, J: 120, K: 110, L: 120, M: 120, N: 120, O: 120 },
          title: "12-MONTH FORWARD FINANCIAL & OPERATIONAL FORECAST (YEAR 3 / M25 TO M36)",
          subtitle: "Driven by Assumptions base growth (6.5% MoM) and Unit Economics trajectory."
        },
        {
          name: "Scenarios",
          colWidths: { A: 240, B: 140, C: 140, D: 140, E: 140, F: 200 },
          title: "STARTUP COMMAND CENTER — 3-CASE SCENARIO SENSITIVITY ENGINE",
          subtitle: "Sensitivity analysis modeling runway, growth, and break-even across Bear, Base, and Bull trajectories."
        },
        {
          name: "DataQuality",
          colWidths: { A: 220, B: 140, C: 110, D: 90, E: 90, F: 110, G: 240 },
          title: "STARTUP COMMAND CENTER — DATA QUALITY AUDIT & ANOMALY DETECTION ENGINE",
          subtitle: "7-suite automated audit engine scanning for duplicates, outliers, date inversions, and missing tags."
        },
        {
          name: "Assumptions",
          colWidths: { A: 240, B: 140, C: 140, D: 140, E: 140, F: 260 },
          title: "STARTUP FINANCIAL MODEL — CORE DRIVERS & ASSUMPTIONS",
          subtitle: "Centralized inputs driving growth, churn, pricing tiers, CAC, cloud hosting, and payroll."
        }
      ]
    }
  });
  console.log("Response:", createRes.content[0].text);

  // =========================================================================
  // STEP 2: POPULATE DASHBOARD (MCP Tools: insert_kpi_cards, insert_table, batch_update_cells)
  // =========================================================================
  console.log("\n🎛️ [MCP Tools: Dashboard] Inserting KPI Cards and Executive Summary Table...");
  
  // 1. KPI Cards
  await client.callTool({
    name: "insert_kpi_cards",
    arguments: {
      workbookPath,
      sheetName: "Dashboard",
      startCell: "A4",
      cardsPerRow: 4,
      cards: [
        { title: "ANNUAL RECURRING REVENUE (ARR)", formula: "Financials!B15", valueFormat: "$#,##0", theme: "indigo", widthCols: 2 },
        { title: "MONTHLY RECURRING REVENUE (MRR)", formula: "Financials!B14", valueFormat: "$#,##0", theme: "indigo", widthCols: 2 },
        { title: "ACTIVE CUSTOMERS", formula: "Financials!B8", valueFormat: "#,##0", theme: "indigo", widthCols: 2 },
        { title: "MONTHLY LOGO CHURN %", formula: "Financials!B9", valueFormat: "0.0%", theme: "indigo", widthCols: 2 },
        { title: "GROSS MARGIN %", formula: "Financials!B33", valueFormat: "0.0%", theme: "indigo", widthCols: 2 },
        { title: "CASH BALANCE & RUNWAY", formula: "Financials!B27", valueFormat: "$#,##0", theme: "indigo", widthCols: 2 },
        { title: "LTV : CAC RATIO", formula: "Financials!B35", valueFormat: "0.0x", theme: "indigo", widthCols: 2 },
        { title: "DATA QUALITY SCORE", formula: "DataQuality!B4", valueFormat: "#,##0", theme: "indigo", widthCols: 2 }
      ]
    }
  });

  // 2. Executive Performance Summary Table
  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Dashboard",
      startCell: "A10",
      title: "EXECUTIVE SAAS PERFORMANCE SUMMARY & TRAJECTORY",
      headers: ["Metric Name", "Year 1 (Actual)", "Year 2 (Actual)", "2-Year Total", "YoY Growth %", "Forecast Y3", "Benchmark Target", "Health Status"],
      columnFormats: ["text", "$#,##0", "$#,##0", "$#,##0", "0.0%", "$#,##0", "text", "text"],
      columnAligns: ["left", "right", "right", "right", "right", "right", "center", "center"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Total Revenue ($)", 785000, 2465000, "=B12+C12", "=(C12-B12)/B12", 5200000, "$2.0M+", "ON TARGET"],
        ["Ending ARR ($)", 1080000, 2948400, "=B13+C13", "=(C13-B13)/B13", 6500000, "$2.5M+", "EXCELLENT"],
        ["Ending Customers (#)", 210, 482, "=B14+C14", "=(C14-B14)/B14", 950, "450+", "STRONG"],
        ["Blended ARPU ($/mo)", 428, 510, "=AVERAGE(B15:C15)", "=(C15-B15)/B15", 570, "$500+", "HEALTHY"],
        ["Gross Profit ($)", 612300, 2006510, "=B16+C16", "=(C16-B16)/B16", 4316000, "80%+", "EXPANDING"],
        ["Gross Margin %", 0.78, 0.814, "=AVERAGE(B17:C17)", "=(C17-B17)/B17", 0.83, "80.0%", "ABOVE TARGET"],
        ["Total Operating Expenses ($)", 1450000, 2680000, "=B18+C18", "=(C18-B18)/B18", 4100000, "< $3.0M", "CONTROLLED"],
        ["EBITDA ($)", -837700, -673490, "=B19+C19", "=(C19-B19)/B19", 216000, "Breakeven Y3", "ON TRACK"],
        ["Net Cash Burn ($)", 890000, 830000, "=B20+C20", "=(C20-B20)/B20", -216000, "< $1.0M/yr", "MODERATE"],
        ["Ending Cash Balance ($)", 4110000, 3280000, "=C21", "=(C21-B21)/B21", 3496000, "> $2.0M", "28+ MOS RUNWAY"],
        ["LTV : CAC Ratio", 3.4, 4.2, "=AVERAGE(B22:C22)", "=(C22-B22)/B22", 4.8, "> 3.0x", "WORLD-CLASS"],
        ["CAC Payback Period (Months)", 14.2, 10.8, "=AVERAGE(B23:C23)", "=(C23-B23)/B23", 8.5, "< 12.0 Mos", "EFFICIENT"]
      ]
    }
  });

  // 3. Strategic Alert Cards
  await client.callTool({
    name: "batch_update_cells",
    arguments: {
      workbookPath,
      sheetName: "Dashboard",
      updates: [
        { coord: "A25", value: "AUTOMATED MANAGEMENT ALERTS & STRATEGIC RECOMMENDATIONS", bold: true, fontSize: "10pt", textColor: "rgb(255,255,255)", bgColor: "rgb(79,70,229)", colspan: 8, align: "left" },
        { coord: "A26", value: "Cash Runway & Capital Efficiency", bold: true, textColor: "rgb(15,23,42)", bgColor: "rgb(238,242,255)", colspan: 3, align: "left" },
        { coord: "D26", value: "Cash reserves stand at $3.28M with average monthly net burn of ~$69K, providing 28+ months of operating runway without additional equity dilution.", textColor: "rgb(15,23,42)", bgColor: "rgb(248,250,252)", colspan: 5, align: "left" },
        { coord: "A27", value: "Net Revenue Retention (NRR) Expansion", bold: true, textColor: "rgb(15,23,42)", bgColor: "rgb(238,242,255)", colspan: 3, align: "left" },
        { coord: "D27", value: "NRR expanded to 108.4% in Year 2 driven by Pro-to-Enterprise tier upgrades ($999/mo tier now accounts for 44% of total MRR).", textColor: "rgb(15,23,42)", bgColor: "rgb(248,250,252)", colspan: 5, align: "left" },
        { coord: "A28", value: "Marketing Channel CAC Variance", bold: true, textColor: "rgb(15,23,42)", bgColor: "rgb(238,242,255)", colspan: 3, align: "left" },
        { coord: "D28", value: "Paid Search CAC rose +12% in Q4 to $420. Reallocating $15,000/mo budget to Organic/Inbound SEO and Channel Partner ecosystem recommended.", textColor: "rgb(15,23,42)", bgColor: "rgb(248,250,252)", colspan: 5, align: "left" },
        { coord: "A29", value: "Data Quality Anomaly Detection", bold: true, textColor: "rgb(15,23,42)", bgColor: "rgb(238,242,255)", colspan: 3, align: "left" },
        { coord: "D29", value: "Automated Data Quality engine identified 4 duplicate customer IDs and 3 missing industry tags in the CRM dataset. Score remains at 92/100 (Pass).", textColor: "rgb(15,23,42)", bgColor: "rgb(248,250,252)", colspan: 5, align: "left" }
      ]
    }
  });

  // =========================================================================
  // STEP 3: POPULATE RAW DATA (24 Months Time Series via insert_table)
  // =========================================================================
  console.log("\n📈 [MCP Tool: Raw Data] Inserting 24-Month Time-Series Table with Auto-Totals...");
  
  const rawMonths = [
    "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
    "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
    "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
    "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"
  ];

  let curCust = 50;
  let curMRR = 21000;
  let curCash = 5000000;
  const rawRows = [];

  for (let m = 1; m <= 24; m++) {
    const rowNum = m + 3;
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

    rawRows.push([
      m,
      rawMonths[m - 1],
      startCust,
      newCust,
      churnCust,
      `=C${rowNum}+D${rowNum}-E${rowNum}`,
      startMRR,
      newMRR,
      expMRR,
      churnMRR,
      `=G${rowNum}+H${rowNum}+I${rowNum}-J${rowNum}`,
      `=K${rowNum}*12`,
      totalRev,
      cogs,
      `=M${rowNum}-N${rowNum}`,
      `=O${rowNum}/M${rowNum}`,
      sm,
      rd,
      ga,
      `=Q${rowNum}+R${rowNum}+S${rowNum}`,
      `=O${rowNum}-T${rowNum}`,
      `=U${rowNum}/M${rowNum}`,
      startCash,
      netBurn,
      `=W${rowNum}+X${rowNum}`,
      runway
    ]);
  }

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "RawData",
      startCell: "A3",
      headers: [
        "Mo #", "Period", "Start Cust", "New Cust", "Churn Cust", "End Cust",
        "Start MRR ($)", "New MRR ($)", "Exp MRR ($)", "Churn MRR ($)", "End MRR ($)", "Ending ARR ($)",
        "Total Rev ($)", "COGS ($)", "Gross Profit ($)", "GM %",
        "S&M ($)", "R&D ($)", "G&A ($)", "Total OpEx ($)", "EBITDA ($)", "EBITDA %",
        "Start Cash ($)", "Net Burn ($)", "End Cash ($)", "Runway"
      ],
      columnFormats: [
        "text", "text", "#,##0", "#,##0", "#,##0", "#,##0",
        "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0",
        "$#,##0", "$#,##0", "$#,##0", "0.0%",
        "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0", "0.0%",
        "$#,##0", "$#,##0", "$#,##0", "0.0"
      ],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "24-Mo Aggregates",
      rows: rawRows
    }
  });

  // =========================================================================
  // STEP 4: POPULATE FINANCIALS (P&L & Unit Economics)
  // =========================================================================
  console.log("\n💰 [MCP Tools: Financials] Inserting P&L Statement & Unit Economics Tables...");

  // Section 1: Operating Metrics
  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Financials",
      startCell: "A4",
      title: "1. KEY OPERATING & SAAS METRICS",
      headers: ["Metric", "Latest (Month 24)", "Prior Year (Month 12)", "YoY Variance", "YoY % Change", "Health Benchmark"],
      columnFormats: ["text", "#,##0", "#,##0", "#,##0", "0.0%", "text"],
      columnAligns: ["left", "right", "right", "right", "right", "left"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Starting Customers", "=RawData!C27", "=RawData!C15", "=B6-C6", "=(B6-C6)/C6", "Growing"],
        ["New Customers Added", "=RawData!D27", "=RawData!D15", "=B7-C7", "=(B7-C7)/C7", "> 30 / mo"],
        ["Ending Active Customers", "=RawData!F27", "=RawData!F15", "=B8-C8", "=(B8-C8)/C8", "450+ Target"],
        ["Monthly Logo Churn %", "=RawData!E27/RawData!C27", "=RawData!E15/RawData!C15", "=B9-C9", "=(B9-C9)/C9", "< 2.0%"],
        ["Starting MRR ($)", "=RawData!G27", "=RawData!G15", "=B10-C10", "=(B10-C10)/C10", "Compounding"],
        ["New Bookings MRR ($)", "=RawData!H27", "=RawData!H15", "=B11-C11", "=(B11-C11)/C11", "> $15K / mo"],
        ["Expansion MRR ($)", "=RawData!I27", "=RawData!I15", "=B12-C12", "=(B12-C12)/C12", "> $5K / mo"],
        ["Churned MRR ($)", "=RawData!J27", "=RawData!J15", "=B13-C13", "=(B13-C13)/C13", "< $5K / mo"],
        ["Ending MRR ($)", "=RawData!K27", "=RawData!K15", "=B14-C14", "=(B14-C14)/C14", "$200K+ Target"],
        ["Ending ARR ($)", "=RawData!L27", "=RawData!L15", "=B15-C15", "=(B15-C15)/C15", "$2.5M+ Target"]
      ]
    }
  });

  // Section 2: P&L Statement
  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Financials",
      startCell: "A17",
      title: "2. INCOME STATEMENT (P&L SUMMARY)",
      headers: ["P&L Line Item", "Year 1 (M1-M12)", "Year 2 (M13-M24)", "2-Year Total", "% of Total Revenue", "Strategic Benchmark"],
      columnFormats: ["text", "$#,##0", "$#,##0", "$#,##0", "0.0%", "text"],
      columnAligns: ["left", "right", "right", "right", "right", "left"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Total Revenue ($)", "=SUM(RawData!M4:M15)", "=SUM(RawData!M16:M27)", "=B19+C19", "=D19/D19", "100% (Baseline)"],
        ["Cost of Goods Sold (COGS) ($)", "=SUM(RawData!N4:N15)", "=SUM(RawData!N16:N27)", "=B20+C20", "=D20/D19", "< 20% of Rev"],
        ["Gross Profit ($)", "=B19-B20", "=C19-C20", "=B21+C21", "=D21/D19", "> 80% Gross Margin"],
        ["Sales & Marketing (S&M) ($)", "=SUM(RawData!Q4:Q15)", "=SUM(RawData!Q16:Q27)", "=B22+C22", "=D22/D19", "35% - 40% of Rev"],
        ["Research & Development (R&D) ($)", "=SUM(RawData!R4:R15)", "=SUM(RawData!R16:R27)", "=B23+C23", "=D23/D19", "30% - 35% of Rev"],
        ["General & Administrative (G&A) ($)", "=SUM(RawData!S4:S15)", "=SUM(RawData!S16:S27)", "=B24+C24", "=D24/D19", "10% - 15% of Rev"],
        ["Total Operating Expenses ($)", "=B22+B23+B24", "=C22+C23+C24", "=B25+C25", "=D25/D19", "Operating Discipline"],
        ["EBITDA ($)", "=B21-B25", "=C21-C25", "=B26+C26", "=D26/D19", "Breakeven Trajectory"],
        ["Ending Cash Balance ($)", "=RawData!Y15", "=RawData!Y27", "=C27", "=D27/D19", "> $2.0M Treasury"]
      ]
    }
  });

  // Section 3: Unit Economics
  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Financials",
      startCell: "A29",
      title: "3. SAAS UNIT ECONOMICS & CAPITAL EFFICIENCY METRICS",
      headers: ["Efficiency Metric", "Year 1 Actual", "Year 2 Actual", "Target Goal", "Efficiency Grade", "Strategic Interpretation"],
      columnFormats: ["text", "$#,##0", "$#,##0", "text", "text", "text"],
      columnAligns: ["left", "right", "right", "center", "center", "left"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Blended ARPU ($/mo)", 428, 510, "$500+", "A+", "Strong tier migration to Pro & Enterprise"],
        ["Customer Acquisition Cost (CAC) ($)", 490, 415, "< $450", "A", "Lower paid acquisition costs via SEO"],
        ["Gross Margin %", 0.78, 0.814, "> 80.0%", "A+", "Cloud optimization & infra leverage"],
        ["Customer Lifetime Value (LTV) ($)", 1669, 1743, "> $1,500", "A", "ARPU * Gross Margin / Churn Rate"],
        ["LTV : CAC Ratio", 3.4, 4.2, "> 3.0x", "A+", "Highly profitable unit acquisition"],
        ["CAC Payback Period (Months)", 14.7, 10.0, "< 12.0 Mos", "A", "Capital recycled within 10 months"],
        ["Magic Number (Sales Efficiency)", 0.75, 1.12, "> 0.75", "EXCELLENT", "Net New ARR / Prior Period S&M"],
        ["Rule of 40 Index (Growth% + EBITDA%)", 0.32, 0.44, "> 40.0%", "PASSED", "ARR Growth (184%) + EBITDA Margin (-27%)"]
      ]
    }
  });

  // =========================================================================
  // STEP 5: POPULATE CUSTOMERS (520 Detailed Records via insert_table)
  // =========================================================================
  console.log("\n👥 [MCP Tool: Customers] Bulk inserting 520 customer records with anomalies...");

  const industries = ["Fintech", "Healthtech", "E-commerce", "SaaS", "Enterprise", "Logistics", "Edtech"];
  const plans = ["Starter", "Pro", "Enterprise"];
  const planMRRs = { Starter: 49, Pro: 199, Enterprise: 999 };
  const channels = ["Paid Search", "Organic Inbound", "Outbound Sales", "Partner Referral", "Events"];
  const channelCACs = { "Paid Search": 420, "Organic Inbound": 95, "Outbound Sales": 1450, "Partner Referral": 650, Events: 850 };
  const csms = ["Sarah Jenkins", "David Miller", "Alex Wong", "Emily Davis"];
  const regions = ["US East", "US West", "EMEA", "APAC"];
  const prefixes = ["Nova", "Apex", "Zenith", "Quantum", "Hyper", "Vortex", "Pulse", "Stratis", "Cloud", "Nexus", "Solaria", "Synergy", "Omni", "Beacon", "Vanguard"];
  const suffixes = ["Labs", "Technologies", "Analytics", "Solutions", "AI", "Software", "Digital", "Data", "Cloud", "Systems", "Networks", "Capital", "Health", "Logistics"];

  const custRows = [];
  for (let i = 1; i <= 520; i++) {
    const rowNum = i + 3;
    const isChurned = i % 14 === 0;
    const isPaused = i % 45 === 0;
    const status = isChurned ? "Churned" : (isPaused ? "Paused" : "Active");

    const plan = i % 6 === 0 ? "Enterprise" : (i % 2 === 0 ? "Pro" : "Starter");
    let mrr = planMRRs[plan] || 199;
    const channel = channels[i % channels.length];
    const cac = channelCACs[channel] || 420;
    const tenure = Math.max(1, 25 - (i % 24));
    let custId = `CUST-${String(i).padStart(4, "0")}`;
    let industry = industries[i % industries.length];
    let csm = csms[i % csms.length];
    let region = regions[i % regions.length];
    let churnDate = isChurned ? `2025-0${(i % 9) + 1}-15` : "";
    const signupDate = `2024-0${((i % 12) + 1).toString().padStart(2, "0")}-10`;

    // Seed intentional audit anomalies
    if (i === 42) custId = "CUST-0038";
    if (i === 88) industry = "";
    if (i === 115) csm = "";
    if (i === 164) mrr = 99999;
    if (i === 210) custId = "CUST-0195";
    if (i === 275) mrr = -199;
    if (i === 340) region = "";
    if (i === 412) churnDate = "2023-11-01";

    const compName = `${prefixes[i % prefixes.length]} ${suffixes[(i * 3) % suffixes.length]} #${i}`;
    const health = isChurned ? Math.floor(Math.random() * 25 + 10) : Math.floor(Math.random() * 35 + 65);
    const nps = isChurned ? -50 : (health > 80 ? 75 : 30);

    custRows.push([
      custId,
      compName,
      industry,
      plan,
      signupDate,
      status,
      mrr,
      churnDate,
      channel,
      cac,
      tenure,
      `=G${rowNum}*K${rowNum}`,
      health,
      csm,
      region,
      nps
    ]);
  }

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Customers",
      startCell: "A3",
      headers: [
        "Cust ID", "Company Name", "Industry", "Plan Tier", "Signup Date", "Status",
        "MRR ($)", "Churn Date", "Acq Channel", "CAC ($)", "Tenure (Mo)", "Total Rev ($)",
        "Health Score", "CSM Assigned", "Region", "NPS"
      ],
      columnFormats: [
        "text", "text", "text", "text", "text", "text",
        "$#,##0", "text", "text", "$#,##0", "#,##0", "$#,##0",
        "#,##0", "text", "text", "#,##0"
      ],
      columnAligns: [
        "left", "left", "left", "center", "center", "center",
        "right", "center", "left", "right", "right", "right",
        "center", "left", "center", "center"
      ],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "520 Total Records",
      rows: custRows
    }
  });

  // =========================================================================
  // STEP 6: POPULATE MARKETING (24-Month Funnel Table)
  // =========================================================================
  console.log("\n📣 [MCP Tool: Marketing] Inserting 24-Month Marketing Funnel Table...");

  const mktRows = [];
  for (let m = 1; m <= 24; m++) {
    const rowNum = m + 3;
    const paidSearch = Math.round(8000 + m * 750);
    const paidSocial = Math.round(5000 + m * 500);
    const seo = Math.round(4000 + m * 300);
    const events = m % 3 === 0 ? 12000 : 2000;
    const visitors = Math.round(12000 + m * 1400);
    const leads = Math.round(visitors * 0.038);
    const mqls = Math.round(leads * 0.35);
    const sqls = Math.round(mqls * 0.40);
    const newDeals = Math.max(8, Math.round(sqls * 0.30));

    mktRows.push([
      m,
      rawMonths[m - 1],
      paidSearch,
      paidSocial,
      seo,
      events,
      `=SUM(C${rowNum}:F${rowNum})`,
      visitors,
      leads,
      mqls,
      sqls,
      newDeals,
      `=G${rowNum}/I${rowNum}`,
      `=G${rowNum}/L${rowNum}`
    ]);
  }

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Marketing",
      startCell: "A3",
      headers: [
        "Mo #", "Period", "Paid Search ($)", "Paid Social ($)", "SEO / Content ($)", "Events ($)", "Total Spend ($)",
        "Web Visitors", "Leads", "MQLs", "SQLs", "New Deals", "CPL ($)", "CAC ($)"
      ],
      columnFormats: [
        "text", "text", "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0",
        "#,##0", "#,##0", "#,##0", "#,##0", "#,##0", "$#,##0.00", "$#,##0"
      ],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "24-Mo Marketing Total",
      rows: mktRows
    }
  });

  // =========================================================================
  // STEP 7: POPULATE SALES PIPELINE (40 Opportunities)
  // =========================================================================
  console.log("\n🎯 [MCP Tool: Sales Pipeline] Inserting 40 Sales Deals Table...");

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

  const pipeRows = [];
  for (let i = 1; i <= 40; i++) {
    const rowNum = i + 3;
    const dealId = `DEAL-${String(100 + i)}`;
    const name = prospects[i - 1];
    const acv = [12000, 24000, 36000, 48000, 72000, 120000][i % 6];
    const stageObj = stages[i % stages.length];
    const rep = reps[i % reps.length];
    const source = sources[i % sources.length];
    const closeDate = `2026-0${(i % 6) + 1}-28`;

    pipeRows.push([
      dealId,
      name,
      acv,
      stageObj.name,
      stageObj.prob,
      `=C${rowNum}*E${rowNum}`,
      rep,
      closeDate,
      source
    ]);
  }

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "SalesPipeline",
      startCell: "A3",
      headers: ["Deal ID", "Prospect Name", "Deal ACV ($)", "Pipeline Stage", "Prob %", "Weighted ($)", "Sales Rep", "Close Date", "Lead Source"],
      columnFormats: ["text", "text", "$#,##0", "text", "0.0%", "$#,##0", "text", "text", "text"],
      columnAligns: ["left", "left", "right", "center", "right", "right", "left", "center", "left"],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "40 Active Deals",
      rows: pipeRows
    }
  });

  // =========================================================================
  // STEP 8: POPULATE FORECAST (12-Month Forward Projection)
  // =========================================================================
  console.log("\n🔮 [MCP Tool: Forecast] Inserting 12-Month Forward Forecast Table...");

  const forecastMonths = [
    "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
    "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"
  ];

  let fCust = 482;
  let fMRR = 245700;
  const fRows = [];

  for (let m = 1; m <= 12; m++) {
    const moNum = m + 24;
    const rowNum = m + 3;
    const startCust = fCust;
    const newCust = Math.round(startCust * 0.065);
    const churnCust = Math.round(startCust * 0.015);
    const endCust = startCust + newCust - churnCust;

    const startMRR = fMRR;
    const newMRR = Math.round(newCust * 520);
    const expMRR = Math.round(startMRR * 0.028);
    const churnMRR = Math.round(startMRR * 0.015);
    const endMRR = startMRR + newMRR + expMRR - churnMRR;

    const rev = Math.round(endMRR * 1.04);
    const cogs = Math.round(rev * 0.17);
    const opex = Math.round(230000 + m * 8000);

    fCust = endCust;
    fMRR = endMRR;

    fRows.push([
      moNum,
      forecastMonths[m - 1],
      startCust,
      newCust,
      churnCust,
      `=C${rowNum}+D${rowNum}-E${rowNum}`,
      startMRR,
      newMRR,
      `=G${rowNum}+H${rowNum}`,
      `=I${rowNum}*12`,
      rev,
      cogs,
      `=K${rowNum}-L${rowNum}`,
      opex,
      `=M${rowNum}-N${rowNum}`
    ]);
  }

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Forecast",
      startCell: "A3",
      headers: [
        "Mo #", "Period", "Start Cust", "New Cust", "Churn Cust", "End Cust",
        "Start MRR ($)", "New MRR ($)", "End MRR ($)", "Forecast ARR ($)", "Revenue ($)",
        "COGS ($)", "Gross Profit ($)", "OpEx ($)", "Forecast EBITDA ($)"
      ],
      columnFormats: [
        "text", "text", "#,##0", "#,##0", "#,##0", "#,##0",
        "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0",
        "$#,##0", "$#,##0", "$#,##0", "$#,##0"
      ],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "12-Mo Forecast Total",
      rows: fRows
    }
  });

  // =========================================================================
  // STEP 9: POPULATE SCENARIOS (3-Case Sensitivity Table)
  // =========================================================================
  console.log("\n🔀 [MCP Tool: Scenarios] Inserting 3-Case Sensitivity Engine Table...");

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Scenarios",
      startCell: "A4",
      headers: ["Executive Financial Metric", "Bear Case", "Base Case", "Bull Case", "Active Case Output", "Variance (Bull vs Bear)"],
      columnFormats: ["text", "$#,##0", "$#,##0", "$#,##0", "$#,##0", "$#,##0"],
      columnAligns: ["left", "right", "right", "right", "right", "right"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Month 24 ARR ($)", 1850000, 2948400, 4420000, "=C5", "=D5-B5"],
        ["Month 24 Ending MRR ($)", 154167, 245700, 368333, "=C6", "=D6-B6"],
        ["Month 24 Active Customers (#)", 340, 482, 680, "=C7", "=D7-B7"],
        ["Cumulative 24M Revenue ($)", 2150000, 3250000, 4890000, "=C8", "=D8-B8"],
        ["Cumulative 24M Gross Profit ($)", 1591000, 2618810, 4205400, "=C9", "=D9-B9"],
        ["Cumulative 24M OpEx ($)", 3820000, 4130000, 4680000, "=C10", "=D10-B10"],
        ["Ending Cash Reserves ($)", 1920000, 3280000, 4750000, "=C11", "=D11-B11"],
        ["Remaining Runway at M24 (Months)", 16.4, 28.4, 42.0, "=C12", "=D12-B12"],
        ["EBITDA Break-Even Month", 32, 26, 21, "=C13", "=D13-B13"],
        ["Blended LTV : CAC Ratio", 2.6, 4.2, 5.9, "=C14", "=D14-B14"],
        ["Net Revenue Retention (NRR %)", 0.96, 1.084, 1.185, "=C15", "=D15-B15"]
      ]
    }
  });

  // =========================================================================
  // STEP 10: POPULATE DATA QUALITY AUDIT (Scorecard & Anomaly Table)
  // =========================================================================
  console.log("\n🛡️ [MCP Tool: Data Quality] Inserting Data Quality KPI Cards and Audit Table...");

  await client.callTool({
    name: "insert_kpi_cards",
    arguments: {
      workbookPath,
      sheetName: "DataQuality",
      startCell: "A3",
      cardsPerRow: 3,
      cards: [
        { title: "OVERALL DATA QUALITY SCORE", formula: "100-SUM(E7:E13)", valueFormat: "#,##0", theme: "indigo", widthCols: 2 },
        { title: "AUDIT STATUS", value: "PASS / GOOD", theme: "emerald", widthCols: 2 },
        { title: "TOTAL ANOMALIES DETECTED", formula: "SUM(D7:D13)", valueFormat: "#,##0", theme: "rose", widthCols: 3 }
      ]
    }
  });

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "DataQuality",
      startCell: "A6",
      headers: ["Audit Test Specification", "Target Scope / Sheet", "Tolerance Threshold", "Anomalies Found", "Score Deduction", "Test Status", "Remediation & Action Plan"],
      columnFormats: ["text", "text", "text", "#,##0", "#,##0", "text", "text"],
      columnAligns: ["left", "left", "center", "right", "right", "center", "left"],
      theme: "indigo",
      zebra: true,
      includeTotalRow: true,
      totalRowLabel: "7 Automated Suites Total",
      rows: [
        ["Missing Required Fields (Industry/CSM)", "Customers (Col C, N)", "0 Allowed", 2, 2, "WARNING", "Impute missing industry & assign backup CSM"],
        ["Duplicate Customer Account IDs", "Customers (Col A)", "0 Allowed", 2, 2, "WARNING", "Deduplicate CUST-0038 and CUST-0195 records"],
        ["Negative or Zero MRR Values", "Customers (Col G)", "0 Allowed", 1, 1, "WARNING", "Correct -$199 refund entry to positive MRR"],
        ["Extreme Statistical Outliers (> $50K MRR)", "Customers (Col G)", "<= 1 Allowed", 1, 1, "WARNING", "Verify enterprise contract for $99,999 entry"],
        ["Invalid Date Chronology (Churn < Signup)", "Customers (Col E, H)", "0 Allowed", 1, 1, "WARNING", "Fix inverted churn timestamp on record #412"],
        ["Monthly Financial Reconciliation (MRR vs P&L)", "Raw Data vs Financials", "$0.00 Variance", 0, 0, "PASS", "100% reconciled across all 24 months"],
        ["Missing Geographic Region Tags", "Customers (Col O)", "0 Allowed", 1, 1, "WARNING", "Geo-lookup IP to assign US/EMEA region"]
      ]
    }
  });

  // =========================================================================
  // STEP 11: POPULATE ASSUMPTIONS (Model Drivers Table)
  // =========================================================================
  console.log("\n⚙️ [MCP Tool: Assumptions] Inserting Model Drivers Table...");

  await client.callTool({
    name: "insert_table",
    arguments: {
      workbookPath,
      sheetName: "Assumptions",
      startCell: "A4",
      headers: ["Model Parameter / Driver", "Bear Case", "Base Case", "Bull Case", "Active Selection", "Strategic Notes / Driver Logic"],
      columnFormats: ["text", "$#,##0", "$#,##0", "$#,##0", "$#,##0", "text"],
      columnAligns: ["left", "right", "right", "right", "right", "left"],
      theme: "indigo",
      zebra: true,
      rows: [
        ["Active Scenario Selector", "Bear", "Base", "Bull", "Base", "Controls dynamic scenario formulas across model"],
        ["Monthly Customer Growth Rate", 0.035, 0.065, 0.100, 0.065, "Compound MoM net new customer additions"],
        ["Monthly Logo Churn Rate", 0.032, 0.018, 0.011, 0.018, "Monthly % of customer accounts canceling"],
        ["Monthly Expansion MRR Rate", 0.010, 0.025, 0.042, 0.025, "Expansion & upsell % applied to baseline MRR"],
        ["Starter Plan Pricing ($/mo)", 49, 49, 59, 49, "Entry-level SaaS tier pricing"],
        ["Professional Plan Pricing ($/mo)", 179, 199, 229, 199, "Mid-market standard tier pricing"],
        ["Enterprise Plan Pricing ($/mo)", 899, 999, 1199, 999, "Annual committed high-touch tier"],
        ["Target Blended ARPU ($/mo)", 410, 510, 620, 510, "Weighted average revenue per active account"],
        ["Blended Paid CAC ($)", 550, 420, 340, 420, "Fully-loaded paid acquisition cost per deal"],
        ["Organic / Referral CAC ($)", 120, 95, 75, 95, "Cost per inbound organic acquisition"],
        ["Outbound Sales CAC ($)", 1800, 1450, 1150, 1450, "SDR + AE commission loaded enterprise CAC"],
        ["Target Gross Margin %", 0.74, 0.814, 0.86, 0.814, "Revenue less hosting, infra & customer support"],
        ["Base Monthly Cloud / Hosting Cost ($)", 15000, 12000, 10000, 12000, "Fixed monthly AWS / GCP infrastructure baseline"],
        ["Variable Cloud Cost per Customer ($/mo)", 5.20, 3.80, 2.90, 3.80, "Incremental cloud compute & DB cost per user"],
        ["Average Annual Employee Salary ($)", 135000, 125000, 118000, 125000, "Blended across Engineering, Sales, and G&A"],
        ["Payroll Taxes & Benefits Overhead %", 0.22, 0.20, 0.18, 0.20, "Health, 401k match, insurance, payroll taxes"],
        ["Target S&M Spend (% of Revenue)", 0.45, 0.35, 0.28, 0.35, "Target Sales & Marketing reinvestment ratio"],
        ["Starting Cash Balance ($)", 5000000, 5000000, 5000000, 5000000, "Series A treasury balance at Month 1"]
      ]
    }
  });

  // =========================================================================
  // STEP 12: WORKBOOK INTEGRITY AUDIT (MCP Tool: validate_workbook_integrity)
  // =========================================================================
  console.log("\n🔍 [MCP Tool: validate_workbook_integrity] Auditing generated workbook...");
  const auditRes = await client.callTool({
    name: "validate_workbook_integrity",
    arguments: { workbookPath }
  });
  console.log(auditRes.content[0].text);

  console.log("\n🎉 WORKBOOK SUCCESSFULLY BUILT ENTIRELY VIA MCP SERVER TOOLS!");
  await client.close();
}

main().catch(err => {
  console.error("❌ MCP Execution Error:", err);
  process.exit(1);
});
