#!/bin/bash
set -e

# MCP HTTP RPC details
URL="http://localhost:5002/call"
WORKBOOK="data/active_workbook.json"

echo "Executing MCP tool calls..."

# Helper function to run an MCP tool
call_mcp() {
  local tool_name="$1"
  local payload="$2"
  echo "Calling tool: $tool_name..."
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"name\": \"$tool_name\", \"arguments\": $payload}" \
    "$URL"
  echo ""
}

# 1. Reset A1:D20
call_mcp "set_cell_to_default" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1:D20\"}"

# 2. Write Text & Values
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"value\": \"INVOICE\"}"

call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A3\", \"value\": \"Invoice No:\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B3\", \"value\": \"INV-2026-001\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A4\", \"value\": \"Date:\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B4\", \"value\": \"2026-07-25\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A5\", \"value\": \"Due Date:\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B5\", \"value\": \"2026-08-25\"}"

call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A7\", \"value\": \"Bill To:\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A8\", \"value\": \"Acme Corp\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A9\", \"value\": \"123 Business Rd\"}"

# Headers
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11\", \"value\": \"Description\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B11\", \"value\": \"Quantity\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C11\", \"value\": \"Unit Price\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D11\", \"value\": \"Amount\"}"

# Items
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A12\", \"value\": \"Web Development Services\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B12\", \"value\": \"1\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C12\", \"value\": \"1500\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D12\", \"value\": \"=B12*C12\"}"

call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A13\", \"value\": \"Cloud Hosting Setup\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B13\", \"value\": \"1\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C13\", \"value\": \"250\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D13\", \"value\": \"=B13*C13\"}"

call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A14\", \"value\": \"Consulting Support\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B14\", \"value\": \"5\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C14\", \"value\": \"100\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D14\", \"value\": \"=B14*C14\"}"

# Totals
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C16\", \"value\": \"Subtotal\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D16\", \"value\": \"=SUM(D12:D14)\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C17\", \"value\": \"Tax (10%)\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D17\", \"value\": \"=D16*0.1\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C18\", \"value\": \"Total Due\"}"
call_mcp "write_range" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D18\", \"value\": \"=D16+D17\"}"

# 3. Apply Formatting & Styling
call_mcp "merge_cells" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1:D1\"}"
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"bold\": true}"
call_mcp "set_font_size" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"size\": \"16\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"align\": \"center\", \"verticalAlign\": \"middle\"}"
call_mcp "set_cell_bg" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"color\": \"#1e3a8a\"}"
call_mcp "set_font_color" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"color\": \"#ffffff\"}"
call_mcp "set_padding" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A1\", \"padding\": \"12\"}"

# Details label formats
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A3\", \"bold\": true}"
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A4\", \"bold\": true}"
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A5\", \"bold\": true}"
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A7\", \"bold\": true}"

# Header Row Format
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11:D11\", \"bold\": true}"
call_mcp "set_cell_bg" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11:D11\", \"color\": \"#e5e7eb\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11\", \"align\": \"left\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B11\", \"align\": \"center\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C11:D11\", \"align\": \"right\"}"
call_mcp "set_border" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11:D11\", \"border\": \"1px solid #d1d5db\"}"
call_mcp "set_padding" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A11:D11\", \"padding\": \"6\"}"

# Items format
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"B12:B14\", \"align\": \"center\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C12:D14\", \"align\": \"right\"}"
call_mcp "set_border" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A12:D14\", \"border\": \"1px solid #e5e7eb\"}"
call_mcp "set_padding" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"A12:D14\", \"padding\": \"4\"}"

# Formats
call_mcp "set_format" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C12:D14\", \"format\": \"\$#,##0.00\"}"
call_mcp "set_format" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D16:D18\", \"format\": \"\$#,##0.00\"}"

# Totals
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C16:D16\", \"bold\": true}"
call_mcp "set_font_style" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C18:D18\", \"bold\": true}"
call_mcp "set_cell_bg" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C18:D18\", \"color\": \"#1e3a8a\"}"
call_mcp "set_font_color" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C18:D18\", \"color\": \"#ffffff\"}"
call_mcp "set_padding" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C18:D18\", \"padding\": \"6\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"C16:C18\", \"align\": \"right\"}"
call_mcp "set_alignment" "{\"workbookPath\": \"$WORKBOOK\", \"range\": \"D16:D18\", \"align\": \"right\"}"

echo "MCP tool invoice generation complete!"
