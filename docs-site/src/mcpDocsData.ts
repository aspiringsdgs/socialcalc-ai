import type { DocChapter } from "./docsData";

// Developer documentation for the socialcalc-mcp package (Socialcalc-MCP/).
// Keep in sync with Socialcalc-MCP/src/server.ts: listTools() is the source of truth for tool names and parameters.

export const MCP_DOC_CATEGORIES = [
  "Getting Started",
  "Tool Reference",
  "Guides",
  "In Production",
] as const;

// Parameters shared by almost every sheet-level tool.
const SHEET_TARGET = "`workbookPath` plus optional `sheetName` or 1-based `sheetNumber` (defaults to the first sheet)";

export const MCP_DOCS_DATA: DocChapter[] = [
  {
    id: "mcp-overview",
    category: "Getting Started",
    title: "SocialCalc MCP Server",
    description: "A Model Context Protocol server that lets AI agents inspect, build, style and validate SocialCalc spreadsheet workbooks.",
    badge: "48 tools",
    content: `
### What it does

**socialcalc-mcp** gives an AI assistant a set of spreadsheet tools. The agent calls tools such as \`build_sheet\`, \`insert_table\` or \`write_range\`, and the server reads and writes SocialCalc workbook files (\`.json\` / \`.msc\`) on disk. Those are the same MSC workbooks the [socialcalc-ai module](/socialcalc) renders, so a workbook an agent builds opens directly in a SocialCalc app.

It works with any MCP client that supports the stdio transport, including Claude Desktop, Claude Code, Cursor, VS Code and Windsurf.

#### How it runs

\`\`\`
AI client (Claude, Cursor, VS Code…)
        │  MCP over stdio
        ▼
socialcalc-mcp ── SocialcalcMcpServer (48 tools)
        │                 │
        │                 └── SocialCalc parser / serializer
        ▼
mcp_files/*.json  ◄──►  HTTP bridge on :5002 (/tools, /call, /sync, /read-file)
\`\`\`

- **stdio transport**: how AI clients talk to the server. This is what you configure in your client.
- **HTTP bridge**: a small JSON API started alongside stdio, used by browser test pages and web clients to call the same tools and sync workbooks. See [HTTP bridge](/mcp#http-bridge).

#### Tool groups

| Group | Tools | Use it for |
| :--- | :--- | :--- |
| [Inspection](/mcp#tools-inspection) | 8 | Listing and reading workbooks, sheets and ranges |
| [Structure](/mcp#tools-structure) | 8 | New workbooks and sheets, rows, columns, widths |
| [Editing & styling](/mcp#tools-editing) | 15 | Values, formulas, colors, borders, fonts, formats, merges |
| [Composite builders](/mcp#tools-composite) | 9 | Whole sheets, tables, KPI cards and batches in one call, plus validation |
| [Formulas & discovery](/mcp#tools-discovery) | 4 | Formula reference and self-describing tool help |
| [Import & export](/mcp#tools-import-export) | 4 | CSV in and out (XLSX is not implemented yet) |

> **File formats**: every editing, styling and inspection tool works on \`.json\` and \`.msc\` SocialCalc workbooks only. Other extensions are rejected. Use the import/export tools to move data to and from CSV.
    `,
    codeSnippet: {
      language: "bash",
      code: `# Run the server (stdio + HTTP bridge on port 5002)
npx -y socialcalc-mcp`,
    },
  },
  {
    id: "mcp-install",
    category: "Getting Started",
    title: "Installation & Client Setup",
    description: "Run the server with npx, or build it from source, and register it with your AI client.",
    content: `
### Run it

The quickest way is \`npx\`, which downloads and runs the published package. Node.js 18 or newer is required.

\`\`\`bash
npx -y socialcalc-mcp
\`\`\`

Or install it globally, or build it from source:

\`\`\`bash
# Global install
npm install -g socialcalc-mcp
socialcalc-mcp

# From source
git clone https://github.com/aspiringsdgs/socialcalc-mcp.git
cd socialcalc-mcp
npm install
npm run build
npm start
\`\`\`

You normally don't start the server yourself: your AI client launches it using the config below.

### Claude Desktop

Add the server to \`claude_desktop_config.json\` (on macOS: \`~/Library/Application Support/Claude/claude_desktop_config.json\`), then restart Claude Desktop.

\`\`\`json
{
  "mcpServers": {
    "socialcalc-mcp": {
      "command": "npx",
      "args": ["-y", "socialcalc-mcp"],
      "env": { "MCP_FILES_DIR": "/Users/you/Documents/spreadsheets" }
    }
  }
}
\`\`\`

### Claude Code

\`\`\`bash
claude mcp add socialcalc-mcp -e MCP_FILES_DIR=$HOME/Documents/spreadsheets -- npx -y socialcalc-mcp
\`\`\`

### Cursor

Add it to \`~/.cursor/mcp.json\` (all projects) or \`.cursor/mcp.json\` (one project):

\`\`\`json
{
  "mcpServers": {
    "socialcalc-mcp": {
      "command": "npx",
      "args": ["-y", "socialcalc-mcp"]
    }
  }
}
\`\`\`

### VS Code

Add it to \`.vscode/mcp.json\` in your workspace. VS Code uses a \`servers\` key:

\`\`\`json
{
  "servers": {
    "socialcalc-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "socialcalc-mcp"]
    }
  }
}
\`\`\`

### Windsurf

Add the same \`mcpServers\` block as Cursor to \`~/.codeium/windsurf/mcp_config.json\`.

> Setting \`MCP_FILES_DIR\` is recommended. Without it, workbooks are saved inside the package's own folder, which is hard to find when running through \`npx\`. See [Configuration](/mcp#mcp-configuration).
    `,
  },
  {
    id: "mcp-configuration",
    category: "Getting Started",
    title: "Configuration & File Paths",
    description: "Environment variables, where workbooks are saved, and how paths are resolved.",
    content: `
### Environment variables

| Variable | Default | What it controls |
| :--- | :--- | :--- |
| \`MCP_FILES_DIR\` | \`mcp_files/\` inside the package | Folder where bare file names are read and written |
| \`SOCIALCALC_PORT\` | \`5002\` | Port for the HTTP bridge |
| \`PROJECT_ROOT\` | Two folders above \`dist/\` | Extra folder the HTTP bridge's \`/sync\` and \`/read-file\` endpoints may access |

### How \`workbookPath\` is resolved

Every tool that takes \`workbookPath\`, \`csvPath\` or \`xlsxPath\` resolves it the same way:

1. **Absolute paths** are used as-is: \`/Users/you/budget.json\`.
2. **Bare file names** go into \`MCP_FILES_DIR\`: \`budget.json\` → \`$MCP_FILES_DIR/budget.json\`.
3. **Paths starting with \`mcp_files/\`** also go into \`MCP_FILES_DIR\`.
4. **Other relative paths** resolve against the server's working directory: \`./data/foo.json\`.

In practice, tell the agent to use bare names like \`invoice.json\` and set \`MCP_FILES_DIR\` to the folder you want.

### Validation before a tool runs

- Required arguments are checked against the tool's input schema. A missing one returns \`Missing required argument '<name>' for tool '<tool>'\`.
- \`workbookPath\` must end in \`.json\` or \`.msc\`. Anything else returns an error telling the agent to use the import/export tools.

\`\`\`text
Error: Invalid workbook format: '.csv'. Core operations only support '.json'
and '.msc' files. For CSV or XLSX, please use the import/export tools.
\`\`\`

### Sheet names

Sheet names are stored in lowercase: \`build_sheet\` with \`sheetName: "Quote"\` creates a sheet named \`quote\`. Keep names free of spaces (\`rawdata\`, not \`Raw Data\`), and write cross-sheet references without quotes: \`=financials!B15\`, \`=SUM(invoices!K4:K50)\`.
    `,
  },
  {
    id: "mcp-first-workbook",
    category: "Getting Started",
    title: "Your First Workbook",
    description: "A complete walkthrough: create a workbook, build a styled quote table, read it back and validate it.",
    badge: "Tutorial",
    content: `
### What we'll build

A one-sheet project quote with a banner, a formatted table and a totals row, built in two tool calls and then checked. The responses below are real output from \`socialcalc-mcp\` v1.0.6.

You don't need to write these calls yourself: asking your assistant "Create a project quote for Acme with design, build and QA line items" makes it call the same tools. The walkthrough shows what happens underneath.

#### 1. Create the workbook

\`\`\`json
{ "name": "new_workbook", "arguments": { "workbookPath": "quote.json", "sheetName": "Quote" } }
\`\`\`

\`\`\`text
Successfully created workbook at '<MCP_FILES_DIR>/quote.json' with sheet 'Quote'.
\`\`\`

#### 2. Build the sheet in one call

\`build_sheet\` sets column widths, adds a banner and inserts a themed table with a totals row.

\`\`\`json
{
  "name": "build_sheet",
  "arguments": {
    "workbookPath": "quote.json",
    "sheetName": "Quote",
    "colWidths": { "A": 200, "B": 80, "C": 100, "D": 110 },
    "banner": { "title": "Project Quote", "subtitle": "Acme Corp · Q3 2026", "bgTitle": "#4F46E5" },
    "tables": [{
      "startCell": "A4",
      "headers": ["Item", "Qty", "Rate", "Amount"],
      "rows": [
        ["Design", 10, 120, "=B5*C5"],
        ["Build",  40,  95, "=B6*C6"],
        ["QA",     12,  80, "=B7*C7"]
      ],
      "columnFormats": ["text", "#,##0", "$#,##0.00", "$#,##0.00"],
      "theme": "indigo",
      "includeTotalRow": true
    }]
  }
}
\`\`\`

\`\`\`text
Successfully built sheet 'quote' in workbook '<MCP_FILES_DIR>/quote.json'
(Dimensions: 4 cols x 8 rows) in 1 atomic step.
\`\`\`

#### 3. Read it back

\`\`\`json
{ "name": "read_range", "arguments": { "workbookPath": "quote.json", "range": "A4:D8" } }
\`\`\`

\`\`\`text
### Sheet: quote (Range: A4:D8)

Row | A | B | C | D
--- | --- | --- | --- | ---
**4** | Item | Qty | Rate | Amount
**5** | Design | 10 | 120 | =B5*C5
**6** | Build | 40 | 95 | =B6*C6
**7** | QA | 12 | 80 | =B7*C7
**8** | Total | =SUM(B5:B7) | =SUM(C5:C7) | =SUM(D5:D7)
\`\`\`

Read tools return the stored formulas, not computed results. The values are calculated when the workbook opens in a SocialCalc app.

The totals row sums every column with a numeric format, including Rate. That's \`insert_table\`'s default (see [totals row](/mcp#tools-composite)). Clear a total you don't want with \`delete_text\` on that cell, here \`C8\`.

#### 4. Validate

\`\`\`json
{ "name": "validate_workbook_integrity", "arguments": { "workbookPath": "quote.json" } }
\`\`\`

\`\`\`text
### Workbook Integrity Audit: <MCP_FILES_DIR>/quote.json
**Status**: ✅ PASS
**Errors Count**: 0
**Warnings Count**: 0
\`\`\`

Open \`quote.json\` in any socialcalc-ai app, for example with \`loadWorkbookData()\` or the showcase app's **Upload JSON** button, to see the finished sheet.
    `,
  },

  // ---------------- Tool reference ----------------
  {
    id: "tools-inspection",
    category: "Tool Reference",
    title: "Inspection & Reading",
    description: "Find workbooks and read sheets, ranges, dimensions and summaries. None of these tools change files.",
    badge: "8 tools",
    content: `
Tools that take a sheet accept ${SHEET_TARGET}.

| Tool | Required | Optional | Returns |
| :--- | :--- | :--- | :--- |
| \`list_workbooks\` | none | \`directoryPath\` | Workbook files in the folder (default \`MCP_FILES_DIR\`) |
| \`list_sheets\` | \`workbookPath\` | none | Every sheet's name and metadata |
| \`read_sheet\` | \`workbookPath\` | sheet | The whole sheet as a Markdown table, plus raw cell details |
| \`read_range\` | \`workbookPath\`, \`range\` | sheet | A range such as \`A1:C10\` as a Markdown table |
| \`get_sheet_dimensions\` | \`workbookPath\` | sheet | Row and column counts |
| \`describe_sheet\` | \`workbookPath\` | sheet | Column names, header contents and size |
| \`summarize_sheet\` | \`workbookPath\` | sheet | Numeric and text summary of populated cells |
| \`summarize_workbook\` | \`workbookPath\` | none | All sheets with dimensions, hidden status and cell counts |

#### Tips for agents
- Call \`summarize_workbook\` or \`read_sheet\` before editing an existing workbook, so edits target the right coordinates.
- Prefer \`read_range\` for large sheets. It keeps responses small.
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "read_range",
  "arguments": { "workbookPath": "invoice.json", "sheetName": "sheet1", "range": "A1:F20" } }`,
    },
  },
  {
    id: "tools-structure",
    category: "Tool Reference",
    title: "Workbook & Sheet Structure",
    description: "Create workbooks and sheets, insert and delete rows and columns, and set column widths.",
    badge: "8 tools",
    content: `
| Tool | Required | Optional | What it does |
| :--- | :--- | :--- | :--- |
| \`new_workbook\` | \`workbookPath\` | \`sheetName\` (default \`sheet1\`) | Creates a workbook file with one sheet |
| \`new_sheet\` | \`workbookPath\`, \`sheetName\` | none | Adds an empty sheet |
| \`rename_sheet\` | \`workbookPath\`, \`oldName\`, \`newName\` | none | Renames a sheet |
| \`insert_row\` | \`workbookPath\`, \`row\` | sheet, \`count\` (1), \`position\` (\`before\` or \`after\`, default \`before\`) | Inserts empty rows |
| \`insert_col\` | \`workbookPath\`, \`column\` | sheet, \`count\` (1), \`position\` | Inserts empty columns, e.g. \`column: "C"\` |
| \`delete_row\` | \`workbookPath\`, \`row\` | sheet, \`count\` (1) | Deletes rows starting at \`row\` |
| \`delete_col\` | \`workbookPath\`, \`column\` | sheet, \`count\` (1) | Deletes columns starting at \`column\` |
| \`set_col_width\` | \`workbookPath\`, \`column\`, \`width\` | sheet | Sets a column's width in pixels |

Rows are 1-based numbers; columns are letters (\`A\`, \`B\`, \`AA\`).

For a new multi-sheet workbook, [create_full_workbook](/mcp#tools-composite) does the work of \`new_workbook\`, several \`new_sheet\` calls and all the \`set_col_width\` calls at once.
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "insert_row",
  "arguments": { "workbookPath": "invoice.json", "row": 22, "count": 3, "position": "after" } }`,
    },
  },
  {
    id: "tools-editing",
    category: "Tool Reference",
    title: "Editing & Styling",
    description: "Write values and formulas, clear cells, and control colors, borders, padding, fonts, number formats and merges.",
    badge: "15 tools",
    content: `
Every tool here takes ${SHEET_TARGET}, and a \`range\` such as \`B5\` or \`A1:D10\`.

#### Content

| Tool | Parameters | What it does |
| :--- | :--- | :--- |
| \`write_range\` | \`value\` (one value) or \`data\` (2D array) | Writes starting at the range's top-left cell. Strings starting with \`=\` become formulas |
| \`delete_text\` | none | Clears values and formulas, keeps styling |
| \`set_cell_to_default\` | none | Clears content and styling |

#### Styling

| Tool | Parameters | Example values |
| :--- | :--- | :--- |
| \`format_cells\` | \`bold\`, \`textColor\`, \`bgColor\`, \`align\` | Several styles in one call |
| \`set_font_color\` | \`color\` (required) | \`#ff0000\`, \`rgb(255,0,0)\` |
| \`set_cell_bg\` | \`color\` (required) | \`rgb(240,240,240)\` |
| \`set_border\` | \`border\` for all sides, or \`top\`/\`right\`/\`bottom\`/\`left\` | \`1px solid rgb(0,0,0)\`, \`2px dashed #ff0000\` |
| \`set_padding\` | \`padding\`, or \`top\`/\`right\`/\`bottom\`/\`left\` | \`6px\`, \`4px 8px\` |
| \`set_alignment\` | \`align\` (left, center, right), \`verticalAlign\` (top, middle, bottom) | |
| \`set_font_size\` | \`size\` (required) | \`12pt\`, \`14px\`, \`11\` |
| \`set_font_family\` | \`family\` (required) | \`Arial\`, \`Courier New\` |
| \`set_font_style\` | \`style\` (default, normal, italic, bold, bold italic) or \`bold\` | |
| \`set_format\` | \`format\` (required) | \`$#,##0.00\`, \`0.00%\`, \`Plain Text\`, \`HTML\`, \`Automatic\` |
| \`merge_cells\` | none | Merges the whole range, e.g. \`A1:D1\` |
| \`unmerge_cells\` | none | Splits a merged cell; pass its top-left cell |

Border styles: \`solid\`, \`dashed\`, \`dotted\`, \`double\`, \`groove\`, \`ridge\`, \`inset\`, \`outset\`, \`none\`.

#### Tips for agents
- Store numbers as numbers and apply a format: write \`5000\` and set \`$#,##0.00\`, rather than writing the text \`"$5,000"\`.
- Don't replace a formula with its computed value; update the input cells instead.
- Changing many scattered cells? Use one [batch_update_cells](/mcp#tools-composite) call instead of many small calls.
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "write_range",
  "arguments": {
    "workbookPath": "budget.json",
    "range": "A2",
    "data": [
      ["Rent",      1800, "=B2*12"],
      ["Utilities",  240, "=B3*12"],
      ["Total", "=SUM(B2:B3)", "=SUM(C2:C3)"]
    ]
  } }`,
    },
  },
  {
    id: "tools-composite",
    category: "Tool Reference",
    title: "Composite Builders & Validation",
    description: "Build whole workbooks, sheets, tables and KPI cards in one call, run batches, and audit the result.",
    badge: "9 tools",
    content: `
These tools do in one call what would otherwise take dozens. Agents should use them first when creating anything new.

| Tool | Required | What it does |
| :--- | :--- | :--- |
| \`create_full_workbook\` | \`workbookPath\`, \`sheets[]\` | New workbook with every sheet, column widths, title/subtitle banners and the active sheet |
| \`batch_add_sheets\` | \`workbookPath\`, \`sheets[]\` | Adds several sheets (with optional \`colWidths\`) to an existing workbook |
| \`build_sheet\` | \`workbookPath\` | One sheet end to end: \`colWidths\`, \`banner\`, \`kpiCards\`, \`tables\`, \`cells\`, \`mergedRanges\`, \`borders\`, \`formats\`, \`alignments\` |
| \`build_workbook\` | \`workbookPath\`, \`sheets[]\` | Several fully configured sheets; each item takes the same fields as \`build_sheet\` |
| \`insert_table\` | \`workbookPath\`, \`startCell\`, \`headers\`, \`rows\` | Formatted table with themes, zebra stripes, per-column formats and alignments, and an optional totals row |
| \`insert_kpi_cards\` | \`workbookPath\`, \`startCell\`, \`cards[]\` | Grid of metric cards, each with a title, a value or formula, a format and a theme |
| \`batch_update_cells\` | \`workbookPath\`, \`updates[]\` | Many cells at once: value, formula, bold, italic, font size, colors, alignment, format, colspan/rowspan, comment |
| \`batch_execute\` | \`workbookPath\`, \`operations[]\` | Runs a list of \`{ tool, args }\` steps on the workbook in memory, validates it, then saves once |
| \`validate_workbook_integrity\` | \`workbookPath\` | Audits syntax, sheet references, cell bounds and formats; returns PASS/FAIL with error and warning counts |

#### insert_table options
- \`theme\`: indigo, emerald, slate, navy, rose, purple, amber or dark.
- \`columnFormats\`: one per column, e.g. \`["text", "$#,##0", "0.0%"]\`.
- \`columnAligns\`: one per column: left, center or right.
- \`zebra\`: alternating row colors (default \`true\`).
- \`includeTotalRow\` adds a totals row, labelled with \`totalRowLabel\` (default \`Total\`).
- \`totalFormulas\` picks the formula per column: \`SUM\`, \`AVERAGE\`, \`COUNT\`, \`MIN\` or \`MAX\`. Keys are 0-based column indexes or header names, e.g. \`{ "3": "AVERAGE" }\` or \`{ "Amount": "MAX" }\`.
- Columns not listed in \`totalFormulas\` get \`SUM\` automatically when their format is numeric (containing \`$\` or \`#\`), or \`AVERAGE\` for \`0.0%\`.

#### KPI cards
Each card takes \`title\` plus \`value\` or \`formula\` (for example \`financials!B14\`), \`valueFormat\`, \`theme\` (indigo, emerald, amber, rose, purple or slate) and \`widthCols\` (default 2). \`cardsPerRow\` defaults to 4.

#### batch_execute
Operations run in order against one in-memory copy, so a batch either saves completely or not at all. Supported steps: \`set_col_width\`, \`write_range\`, \`format_cells\`, \`set_format\`, \`set_border\`, \`set_alignment\`, \`set_font_size\`, \`set_font_style\`, \`set_font_color\`, \`set_cell_bg\`, \`merge_cells\`, \`unmerge_cells\`, \`insert_table\`, \`insert_kpi_cards\`, \`batch_update_cells\`, \`new_sheet\`, \`build_sheet\`.
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "batch_execute",
  "arguments": {
    "workbookPath": "sales.json",
    "operations": [
      { "tool": "new_sheet", "args": { "sheetName": "summary" } },
      { "tool": "insert_kpi_cards", "args": {
          "sheetName": "summary", "startCell": "A2",
          "cards": [
            { "title": "Revenue", "formula": "SUM(data!D2:D200)", "valueFormat": "$#,##0", "theme": "emerald" },
            { "title": "Orders",  "formula": "COUNT(data!D2:D200)", "valueFormat": "#,##0", "theme": "indigo" }
          ] } },
      { "tool": "set_col_width", "args": { "sheetName": "summary", "column": "A", "width": 160 } }
    ]
  } }`,
    },
  },
  {
    id: "tools-discovery",
    category: "Tool Reference",
    title: "Formulas & Tool Discovery",
    description: "Let the agent look up SocialCalc formulas and the server's own tools while it works.",
    badge: "4 tools",
    content: `
| Tool | Required | Optional | Returns |
| :--- | :--- | :--- | :--- |
| \`get_formulas\` | none | \`category\` | Available formula functions, optionally one category |
| \`describe_formula\` | \`name\` | none | Explanation and example for a function such as \`VLOOKUP\` |
| \`list_tool\` | none | none | Every tool registered on the server |
| \`describe_tool\` | \`toolName\` | none | A tool's description and parameters |

Formula categories: **Math & Trig**, **Statistical**, **Text**, **Date & Time**, **Logical**, **Lookup & Reference**, **Financial**.

These help when an agent isn't sure a function exists in SocialCalc (it supports 109) or needs a tool's exact parameters.
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "get_formulas", "arguments": { "category": "Financial" } }
{ "name": "describe_formula", "arguments": { "name": "PMT" } }`,
    },
  },
  {
    id: "tools-import-export",
    category: "Tool Reference",
    title: "CSV & XLSX Import / Export",
    description: "Move sheet data between SocialCalc workbooks and CSV files.",
    badge: "4 tools",
    content: `
| Tool | Required | Optional | Status |
| :--- | :--- | :--- | :--- |
| \`export_to_csv\` | \`workbookPath\`, \`csvPath\` (.csv) | sheet | Works |
| \`import_from_csv\` | \`csvPath\`, \`workbookPath\` | \`sheetName\` (created if missing) | Works |
| \`export_to_xlsx\` | \`workbookPath\`, \`xlsxPath\` (.xlsx) | none | Not implemented |
| \`import_from_xlsx\` | \`xlsxPath\`, \`workbookPath\` | none | Not implemented |

> **XLSX is not available yet.** Both XLSX tools are registered but return an error:

\`\`\`text
Error: XLSX export is not implemented. Install 'exceljs' or 'xlsx' to enable Excel interoperability.
\`\`\`

Until then, export to CSV and open that in Excel. The adapter to implement is \`Socialcalc-MCP/src/adapters/xlsx/index.ts\` (\`workbookToXlsx\` and \`xlsxToWorkbook\`).
    `,
    codeSnippet: {
      language: "json",
      code: `{ "name": "import_from_csv",
  "arguments": { "csvPath": "/Users/you/Downloads/orders.csv", "workbookPath": "sales.json", "sheetName": "data" } }`,
    },
  },

  // ---------------- Guides ----------------
  {
    id: "agent-workflow",
    category: "Guides",
    title: "Agent Workflow & System Prompt",
    description: "How to steer an agent to build reliable, well-styled workbooks with the fewest tool calls.",
    content: `
The repository ships a tested system prompt at \`Socialcalc-MCP/system-prompt.md\` and 40 benchmark prompts in \`Socialcalc-MCP/prompts/\`, covering ten business apps (invoices, payroll, quotes, receipts, timesheets and more) across phone and tablet layouts. The recommended workflow:

#### 1. Inspect first
For an existing workbook, call \`summarize_workbook\`, \`read_sheet\` or \`read_range\` before changing anything.

#### 2. Build in batches
Create new content with composite tools: \`create_full_workbook\`, \`build_sheet\`, \`insert_table\`, \`insert_kpi_cards\`, \`batch_update_cells\`. Keep single-cell tools for small fixes.

#### 3. Validate and fix
Always finish with \`validate_workbook_integrity\`. If it reports errors, fix the named cells with \`batch_update_cells\` or \`write_range\` and validate again until errors and warnings are both 0.

#### 4. Report
Summarize the sheets, formulas and validation result.

### Rules that prevent most errors

| Don't | Do |
| :--- | :--- |
| Sheet names with spaces: \`Raw Data\` | \`rawdata\` |
| Quoted sheet references: \`='Raw Data'!C27\` | \`=rawdata!C27\` |
| 50 \`write_range\` calls to build a table | One \`insert_table\` call |
| Replace \`=B10*C10\` with \`25000\` | Update the input cells |
| Lowercase coordinates: \`a1\` | \`A1\`, \`AA100\` |
| Text \`"$5000"\` in a number cell | \`5000\` with format \`$#,##0.00\` |

### Styling conventions
- Title banner \`bold 14pt\`, table headers \`bold 10pt\`, data \`10pt\`, KPI values \`bold 16-18pt\`.
- Align text left; codes, dates and statuses center; numbers, currency and percentages right.
- Formats: currency \`$#,##0.00\`, percent \`0.0%\`, counts \`#,##0\`, dates \`YYYY-MM-DD\`.
    `,
  },
  {
    id: "http-bridge",
    category: "Guides",
    title: "HTTP Bridge API",
    description: "Call the same tools over HTTP from a browser or script, and sync workbooks between a web editor and disk.",
    content: `
When the server starts it also listens on \`http://localhost:5002\` (change it with \`SOCIALCALC_PORT\`). If the port is taken, it logs a warning and keeps running on stdio. CORS is open (\`*\`), so a local web page can call it.

> The bridge has no authentication. Keep it on localhost and don't expose the port to a network.

| Method & path | Body / query | Response |
| :--- | :--- | :--- |
| \`GET /tools\` | none | \`{ tools: [...] }\` with every tool's name, description and input schema |
| \`POST /call\` | \`{ name, arguments }\` | The MCP tool result: \`{ content: [{ type: "text", text }] }\`, with \`isError: true\` on failure |
| \`POST /sync\` | \`{ workbookPath, mscData }\` | Writes a workbook from the browser to disk |
| \`GET /read-file?path=…\` | \`path\` query parameter | \`{ success: true, data }\` with the file's contents |

\`/sync\` and \`/read-file\` only accept \`.json\` and \`.msc\` files inside \`PROJECT_ROOT\`, the package folder or \`MCP_FILES_DIR\`. Other paths return \`Access denied\`.

#### Round trip with the SocialCalc editor
1. The agent builds \`invoice.json\` through MCP.
2. A web page loads it with \`GET /read-file\` and passes it to \`loadWorkbookData()\` from socialcalc-ai.
3. The user edits it in the browser; the page sends \`getSpreadsheetContent()\` back with \`POST /sync\`.
4. The agent reads the updated file on its next tool call.
    `,
    codeSnippet: {
      language: "bash",
      code: `# List tools
curl -s localhost:5002/tools | jq '.tools | length'   # 48

# Call a tool
curl -s localhost:5002/call \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"read_range","arguments":{"workbookPath":"quote.json","range":"A4:D8"}}'`,
    },
  },
  {
    id: "programmatic-client",
    category: "Guides",
    title: "Calling Tools from Code",
    description: "Drive the server from your own Node.js script or agent with the official MCP SDK.",
    content: `
Any MCP client can launch the server over stdio and call its tools. This is how the repository's build scripts (\`Socialcalc-MCP/scripts/\`) generate the sample workbooks.

Install the SDK in your project:

\`\`\`bash
npm install @modelcontextprotocol/sdk
\`\`\`

The example launches the server, lists its tools, builds a workbook and validates it. Tool results come back as MCP content blocks; the text is in \`result.content[0].text\`, and \`result.isError\` is \`true\` when a call fails.

For an LLM agent framework (LangChain, the Claude Agent SDK, OpenAI Agents), register \`socialcalc-mcp\` as a stdio MCP server in that framework's config and pass it the [system prompt](/mcp#agent-workflow).
    `,
    codeSnippet: {
      language: "javascript",
      code: `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "socialcalc-mcp"],
  env: { ...process.env, MCP_FILES_DIR: "./workbooks" },
});
const client = new Client({ name: "my-app", version: "1.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
console.log(tools.length, "tools");            // 48

await client.callTool({
  name: "create_full_workbook",
  arguments: {
    workbookPath: "report.json",
    activeSheet: "dashboard",
    sheets: [
      { name: "dashboard", title: "Q3 Report", colWidths: { A: 180, B: 120 } },
      { name: "data", colWidths: { A: 120, B: 100, C: 100 } },
    ],
  },
});

const audit = await client.callTool({
  name: "validate_workbook_integrity",
  arguments: { workbookPath: "report.json" },
});
console.log(audit.content[0].text);           // **Status**: ✅ PASS ...

await client.close();`,
    },
  },

  // ---------------- Production ----------------
  {
    id: "aspiring-apps-mcp",
    category: "In Production",
    title: "Live at Aspiring Apps",
    description: "The SocialCalc MCP server already runs in production as Aspiring Apps' hosted connector.",
    badge: "Deployed",
    content: `
### SocialCalc MCP in production

**Aspiring Apps** runs this MCP server as a hosted connector at [aspiringapps.com/mcp](${"http://aspiringapps.com/mcp"}). AI assistants connect to it remotely, so there is nothing to install, and the workbooks it creates are the same SocialCalc files that open in Aspiring Apps' invoice, receipt, timesheet and budget apps.

The hosted connector exposes the spreadsheet tools documented here (\`build_sheet\`, \`insert_table\`, \`batch_update_cells\`, \`validate_workbook_integrity\` and the rest) and adds account-level tools for working with a user's apps, for example:

| Tool | What it does |
| :--- | :--- |
| \`list_my_apps\` | Lists the Aspiring Apps in the user's account |
| \`get_app_templates\` | Shows an app's built-in and custom templates |
| \`create_file_from_template\` | Copies a template into a new file ready to fill |
| \`create_custom_template\` | Starts a new blank template for a custom design |
| \`list_files\` | Lists the user's saved files |
| \`insert_image\` | Places a logo, stamp or signature image in a sheet |
| \`view_sheet\` | Renders a sheet so the agent can check its work |

A typical request such as "Make an invoice for Acme with two consulting line items" runs: \`list_my_apps\` → \`get_app_templates\` → \`create_file_from_template\` → \`batch_update_cells\` → \`view_sheet\`. The finished file then opens in the user's Aspiring Apps app.

### Try it
- Hosted connector: [aspiringapps.com/mcp](${"http://aspiringapps.com/mcp"})
- Apps built on SocialCalc: [aspiringapps.com](${"http://aspiringapps.com/web/home/index.html"})
- Run it yourself: [Installation & Client Setup](/mcp#mcp-install)
    `,
  },
];
