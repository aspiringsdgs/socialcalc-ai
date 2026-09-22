import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, "../..");
const targetDir = path.join(workspaceRoot, "Agent-Instructions");
const metadataDir = path.join(workspaceRoot, "Socialcalc-MCP/Aspiring-apps-metadata");

console.log(`📁 Setting up flat Agent-Instructions/apps with templates at: ${targetDir}`);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Clean old categorized folders if they exist
const appsTargetDir = path.join(targetDir, "apps");
if (fs.existsSync(appsTargetDir)) {
  fs.rmSync(appsTargetDir, { recursive: true, force: true });
}
ensureDir(appsTargetDir);

// =========================================================================
// 1. UPDATE README.MD TO REFLECT TEMPLATES INCLUSION
// =========================================================================
fs.writeFileSync(
  path.join(targetDir, "README.md"),
  `# Agent-Instructions Architecture & Specialization Framework

Welcome to the **Agent-Instructions** repository. This framework establishes a modular, hierarchical architecture for AI agents interacting with the **SocialCalc Model Context Protocol (MCP) Server** to design, build, style, and validate specialized mobile, tablet, and desktop spreadsheet applications.

---

## 🏛️ Directory Hierarchy

\`\`\`
Agent-Instructions/
├── README.md                            # Framework documentation & agent routing guide
├── system-prompt.md                     # Global Master System Prompt for LangChain + SocialCalc MCP
│
├── skills/                              # Reusable Agent Skill Modules
│   ├── svg-logo-generator/              # Skill: Vector badges, branding logos & header artwork
│   ├── layout-generator/                # Skill: MCP composite table/grid/card layout engine
│   ├── device-specifications/           # Skill: Mobile vs. Tablet vs. Desktop viewport rules
│   ├── color-theming/                   # Skill: Palette extraction & harmonic styling tokens
│   └── formula-engine/                  # Skill: Calculation rules, tax logic & financial math
│
└── apps/                                # Specialized App Definition Packs (Flat Structure)
    ├── AutoRepairInvoice/               # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── BusinessPayroll/                 # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── CustomerInvoice/                 # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── MonthlyRentReceipt/              # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── PartsInventory/                  # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── CheckbookRegister/               # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── MonthlyBudget/                   # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── PortfolioTracker/                # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── BloodSugarLog/                   # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── DiabeticPlus/                    # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── EmployeeSchedule/                # [app-intent.md, system-prompt.md, theme.json, templates/]
    ├── FitnessPlanner/                  # [app-intent.md, system-prompt.md, theme.json, templates/]
    └── ...
\`\`\`

---

## 🧭 How an Agent Uses This Framework

1. **Base Layer (\`system-prompt.md\`)**:
   - Ingests global MCP rules, tool hierarchy, SocialCalc 1.5 token specifications, error iteration loop, and strict prohibitions.
2. **Skill Layer (\`skills/*\`)**:
   - Loads domain-specific capabilities as needed:
     - For branding $\\rightarrow$ \`skills/svg-logo-generator/SKILL.md\`
     - For grid structure $\\rightarrow$ \`skills/layout-generator/SKILL.md\`
     - For target screen size $\\rightarrow$ \`skills/device-specifications/SKILL.md\`
     - For color tokens $\\rightarrow$ \`skills/color-theming/SKILL.md\`
     - For formulas $\\rightarrow$ \`skills/formula-engine/SKILL.md\`
3. **App Specialization Layer (\`apps/<App>/\`)**:
   - Ingests the app's \`app-intent.md\` (business purpose, required formulas, expected sheets), \`system-prompt.md\` (exact hex/RGB palette, mobile vs tablet layout definitions, footer tabs), and reference spreadsheet models in \`templates/\`.
`
);

// =========================================================================
// 2. PARSE ALL APPS & COPY TEMPLATES
// =========================================================================
const appsIndexFile = path.join(metadataDir, "apps-index.json");
let appsList = [];
if (fs.existsSync(appsIndexFile)) {
  appsList = JSON.parse(fs.readFileSync(appsIndexFile, "utf-8"));
}

console.log(`📊 Found ${appsList.length} total apps in apps-index.json`);

// Default category color palettes if data.json theme is missing
const categoryThemes = {
  Business: { primary: "#4F46E5", secondary: "#EEF2FF", bg: "#FAFAFA" },
  Finance: { primary: "#0F766E", secondary: "#CCFBF1", bg: "#F0FDFA" },
  Healthcare: { primary: "#059669", secondary: "#D1FAE5", bg: "#F0FDF4" },
  Productivity: { primary: "#6366F1", secondary: "#EEF2FF", bg: "#F8FAFC" }
};

let count = 0;
let templatesCopied = 0;

for (const appItem of appsList) {
  const cleanFolderName = (appItem.id || appItem.name).replace(/[^a-zA-Z0-9]/g, "");
  if (!cleanFolderName) continue;

  const appDir = path.join(appsTargetDir, cleanFolderName);
  ensureDir(appDir);

  // Try to load app-specific data.json and templates from metadata folder
  let appData = null;
  const sourceAppDir = appItem.path ? path.join(metadataDir, appItem.path) : null;

  if (sourceAppDir && fs.existsSync(sourceAppDir)) {
    const dataJsonPath = path.join(sourceAppDir, "data.json");
    if (fs.existsSync(dataJsonPath)) {
      try {
        appData = JSON.parse(fs.readFileSync(dataJsonPath, "utf-8"));
      } catch (e) {}
    }

    // Copy template MSC json files into app's templates/ folder
    const mscCodesDir = path.join(sourceAppDir, "msc-codes");
    const templatesTargetDir = path.join(appDir, "templates");

    if (fs.existsSync(mscCodesDir)) {
      ensureDir(templatesTargetDir);
      const templateFiles = fs.readdirSync(mscCodesDir);
      for (const tFile of templateFiles) {
        if (tFile.endsWith(".json")) {
          fs.copyFileSync(
            path.join(mscCodesDir, tFile),
            path.join(templatesTargetDir, tFile)
          );
          templatesCopied++;
        }
      }
    }
  }

  const primaryColor = appData?.theme?.primaryColor || categoryThemes[appItem.category]?.primary || "#4F46E5";
  const secondaryColor = appData?.theme?.secondaryColor || categoryThemes[appItem.category]?.secondary || "#EEF2FF";
  const bgColor = appData?.theme?.backgroundColor || categoryThemes[appItem.category]?.bg || "#FAFAFA";
  const displayName = appItem.displayName || appItem.name;
  const description = appItem.description || `${displayName} - Professional spreadsheet application.`;
  const features = appItem.features || ["Offline spreadsheet management", "Professional calculation engine", "Export to PDF & CSV"];
  const footers = appItem.footers && Array.isArray(appItem.footers) ? appItem.footers : [];

  // 1. App Intent
  fs.writeFileSync(
    path.join(appDir, "app-intent.md"),
    `# App Intent & Domain Specification: ${displayName}

## 1. App Purpose & Value Proposition
- **App Name**: ${displayName}
- **Category**: ${appItem.category}
- **App Type**: ${appItem.appType || "spreadsheet-utility"}
- **Description**: ${description}

### Core Features:
${features.map((f) => `- ${f}`).join("\n")}

---

## 2. Target Worksheets & Footers
${
  footers.length > 0
    ? `### Configured Footer Tabs:
${footers.map((f) => `- \`${f.toLowerCase().replace(/[^a-z0-9]/g, "")}\` (${f})`).join("\n")}`
    : `### Default Recommended Sheet Structure:
- \`main\` (Active interactive sheet for entry and calculation)
- \`summary\` / \`dashboard\` (Aggregations and metric cards)
- \`settings\` (Configuration and constants)`
}

---

## 3. Reference Templates
Reference JSON templates for this app are located in \`templates/\`:
- \`templates/mobile.json\`: Streamlined 4-5 column mobile layout.
- \`templates/tablet.json\`: Multi-column tablet/desktop ledger layout.

---

## 4. Mathematical & Business Rules
- Automatic computation of subtotals, totals, differences, and domain metrics.
- Explicit formatting tokens on all numeric and currency columns.
- Clean header typography with high contrast ratio.
`
  );

  // 2. Specialized System Prompt
  fs.writeFileSync(
    path.join(appDir, "system-prompt.md"),
    `# Specialized System Prompt: ${displayName} Agent

You are the **Specialized ${displayName} Spreadsheet Agent**. Your sole responsibility is generating pixel-perfect, mathematically sound spreadsheet workbooks tailored for the **${displayName}** application **STRICTLY through real SocialCalc MCP Server tool calls**.

---

## 🛑 MANDATORY: REAL MCP TOOL CALLS ONLY (ZERO HALLUCINATION POLICY)

- **YOU MUST PHYSICALLY EXECUTE REAL MCP TOOLS**:
  - Do NOT output text claiming a sheet or workbook was created without invoking the real MCP tools (\`create_full_workbook\`, \`insert_table\`, \`batch_update_cells\`, etc.).
  - Do NOT print fake markdown tables or pseudo-code in place of actual spreadsheet generation.
- **NO DIRECT SCRIPT BYPASS**:
  - All workbook mutations must go through the SocialCalc MCP Server.
- **MANDATORY INTEGRITY AUDIT**:
  - Every task MUST conclude with a real tool call to \`validate_workbook_integrity\`. You may only report completion when it returns **PASS (0 Errors, 0 Warnings)**.

---

## 🎨 Mandatory Color Theme Tokens

You MUST apply the official **${displayName}** design tokens:
- **Primary Brand Color**: \`${primaryColor}\` (Use for Table Headers, Title Banners, and Primary Accents)
- **Secondary Accent**: \`${secondaryColor}\` (Use for KPI Backgrounds, Total Row Highlights)
- **Sheet Background**: \`${bgColor}\` (Use for Zebra Striping)
- **Header Text**: \`rgb(255,255,255)\` (High-contrast bold text on Primary)

---

## 📱 Viewport Guidelines

### For Mobile Generation (\`mobile.json\`):
- Restrict table layout to **4–5 columns max** (\`Col A\` to \`Col E\`).
- Column width budget: Max 400px total width.
- Use \`insert_table\` with clean, compact headers.
- You may refer to \`templates/mobile.json\` for structure.

### For Tablet / Desktop Generation (\`tablet.json\`):
- Provide comprehensive 8–12 column layout.
- Include KPI cards (\`insert_kpi_cards\`) using \`${primaryColor}\` and \`${secondaryColor}\` tones.
- Total row enabled with automated \`SUM\` formulas.
- You may refer to \`templates/tablet.json\` for structure.

---

## 🛠️ Execution Checklist
1. Call \`create_full_workbook\` with lowercased sheet names.
2. Insert title banner using \`${primaryColor}\` background.
3. Populate structured table using \`insert_table\` with explicit number formats.
4. Run \`validate_workbook_integrity\` to ensure 0 errors.
`
  );

  // 3. Theme JSON
  fs.writeFileSync(
    path.join(appDir, "theme.json"),
    JSON.stringify(
      {
        appName: displayName,
        category: appItem.category,
        appType: appItem.appType || "spreadsheet-utility",
        palette: {
          primary: primaryColor,
          secondary: secondaryColor,
          background: bgColor,
          textDark: "#0f172a",
          textLight: "#ffffff"
        },
        viewports: {
          mobile: { maxCols: 5, targetWidth: 390 },
          tablet: { maxCols: 12, targetWidth: 900 }
        }
      },
      null,
      2
    )
  );

  count++;
}

console.log(`\n🎉 Successfully processed ${count} apps and copied ${templatesCopied} template files into Agent-Instructions/apps/!`);
