const url = "http://localhost:5002/call";
const workbookPath = "data/invoice.json";

async function callTool(name, args) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, arguments: args })
  });
  const data = await res.json();
  if (data.isError) {
    throw new Error(`Tool ${name} failed: ${data.content[0].text}`);
  }
  console.log(`Tool ${name} succeeded: ${data.content[0].text}`);
}

async function main() {
  console.log("Starting invoice generation using MCP tools...");

  // 1. Clear sheet space
  await callTool("set_cell_to_default", { workbookPath, range: "A1:D20" });

  // 2. Set grid values & formulas
  await callTool("write_range", { workbookPath, range: "A1", value: "INVOICE" });
  
  await callTool("write_range", { workbookPath, range: "A3", value: "Invoice No:" });
  await callTool("write_range", { workbookPath, range: "B3", value: "INV-2026-001" });
  await callTool("write_range", { workbookPath, range: "A4", value: "Date:" });
  await callTool("write_range", { workbookPath, range: "B4", value: "2026-07-25" });
  await callTool("write_range", { workbookPath, range: "A5", value: "Due Date:" });
  await callTool("write_range", { workbookPath, range: "B5", value: "2026-08-25" });

  await callTool("write_range", { workbookPath, range: "A7", value: "Bill To:" });
  await callTool("write_range", { workbookPath, range: "A8", value: "Acme Corp" });
  await callTool("write_range", { workbookPath, range: "A9", value: "123 Business Rd" });

  // Headers
  await callTool("write_range", { workbookPath, range: "A11", value: "Description" });
  await callTool("write_range", { workbookPath, range: "B11", value: "Quantity" });
  await callTool("write_range", { workbookPath, range: "C11", value: "Unit Price" });
  await callTool("write_range", { workbookPath, range: "D11", value: "Amount" });

  // Item 1
  await callTool("write_range", { workbookPath, range: "A12", value: "Web Development Services" });
  await callTool("write_range", { workbookPath, range: "B12", value: "1" });
  await callTool("write_range", { workbookPath, range: "C12", value: "1500" });
  await callTool("write_range", { workbookPath, range: "D12", value: "=B12*C12" });

  // Item 2
  await callTool("write_range", { workbookPath, range: "A13", value: "Cloud Hosting Setup" });
  await callTool("write_range", { workbookPath, range: "B13", value: "1" });
  await callTool("write_range", { workbookPath, range: "C13", value: "250" });
  await callTool("write_range", { workbookPath, range: "D13", value: "=B13*C13" });

  // Item 3
  await callTool("write_range", { workbookPath, range: "A14", value: "Consulting Support" });
  await callTool("write_range", { workbookPath, range: "B14", value: "5" });
  await callTool("write_range", { workbookPath, range: "C14", value: "100" });
  await callTool("write_range", { workbookPath, range: "D14", value: "=B14*C14" });

  // Totals
  await callTool("write_range", { workbookPath, range: "C16", value: "Subtotal" });
  await callTool("write_range", { workbookPath, range: "D16", value: "=SUM(D12:D14)" });
  await callTool("write_range", { workbookPath, range: "C17", value: "Tax (10%)" });
  await callTool("write_range", { workbookPath, range: "D17", value: "=D16*0.1" });
  await callTool("write_range", { workbookPath, range: "C18", value: "Total Due" });
  await callTool("write_range", { workbookPath, range: "D18", value: "=D16+D17" });

  // 3. Styling & Formats
  // Merge A1:D1
  await callTool("merge_cells", { workbookPath, range: "A1:D1" });
  
  // Header Style: bold, size 16, centered, padding, blue background (#1e3a8a), white text (#ffffff)
  await callTool("set_font_style", { workbookPath, range: "A1", bold: true });
  await callTool("set_font_size", { workbookPath, range: "A1", size: "16" });
  await callTool("set_alignment", { workbookPath, range: "A1", align: "center", verticalAlign: "middle" });
  await callTool("set_cell_bg", { workbookPath, range: "A1", color: "#1e3a8a" });
  await callTool("set_font_color", { workbookPath, range: "A1", color: "#ffffff" });
  await callTool("set_padding", { workbookPath, range: "A1", padding: "12" });

  // Details Bold Label Styling
  await callTool("set_font_style", { workbookPath, range: "A3", bold: true });
  await callTool("set_font_style", { workbookPath, range: "A4", bold: true });
  await callTool("set_font_style", { workbookPath, range: "A5", bold: true });
  await callTool("set_font_style", { workbookPath, range: "A7", bold: true });

  // Table Headers formatting: bold, gray bg (#e5e7eb), center/right aligns, borders, padding
  await callTool("set_font_style", { workbookPath, range: "A11:D11", bold: true });
  await callTool("set_cell_bg", { workbookPath, range: "A11:D11", color: "#e5e7eb" });
  await callTool("set_alignment", { workbookPath, range: "A11", align: "left" });
  await callTool("set_alignment", { workbookPath, range: "B11", align: "center" });
  await callTool("set_alignment", { workbookPath, range: "C11:D11", align: "right" });
  await callTool("set_border", { workbookPath, range: "A11:D11", border: "1px solid #d1d5db" });
  await callTool("set_padding", { workbookPath, range: "A11:D11", padding: "6" });

  // Table Items formatting: alignment, borders, padding
  await callTool("set_alignment", { workbookPath, range: "B12:B14", align: "center" });
  await callTool("set_alignment", { workbookPath, range: "C12:D14", align: "right" });
  await callTool("set_border", { workbookPath, range: "A12:D14", border: "1px solid #e5e7eb" });
  await callTool("set_padding", { workbookPath, range: "A12:D14", padding: "4" });

  // Currency formats for prices and amounts
  await callTool("set_format", { workbookPath, range: "C12:D14", format: "$#,##0.00" });
  await callTool("set_format", { workbookPath, range: "D16:D18", format: "$#,##0.00" });

  // Totals formatting
  await callTool("set_font_style", { workbookPath, range: "C16:D16", bold: true });
  await callTool("set_font_style", { workbookPath, range: "C18:D18", bold: true });
  await callTool("set_cell_bg", { workbookPath, range: "C18:D18", color: "#1e3a8a" });
  await callTool("set_font_color", { workbookPath, range: "C18:D18", color: "#ffffff" });
  await callTool("set_padding", { workbookPath, range: "C18:D18", padding: "6" });
  await callTool("set_alignment", { workbookPath, range: "C16:C18", align: "right" });
  await callTool("set_alignment", { workbookPath, range: "D16:D18", align: "right" });

  console.log("Invoice generation completed successfully!");
}

main().catch(console.error);
