# SocialCalc MCP Specialized Test Prompts (40 Prompts)

This directory contains **40 production-grade user prompts** designed to stress-test and benchmark AI agents generating spreadsheets via the **SocialCalc MCP Server**.

The prompts cover the **first 10 core business apps** across various iPhone and iPad screen form factors, business scenarios, and calculation complexities.

---

## 📱 Matrix of Prompts & Target Devices

| # | App Name | Prompt 1 (iPhone Mobile) | Prompt 2 (iPhone Large) | Prompt 3 (iPad Tablet) | Prompt 4 (iPad Pro Widescreen) |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | **ATV Bill of Sale** | Private Sale (4 cols) | As-Is Agreement (5 cols) | Fleet Purchase (8 cols) | Dealership Master (10 cols) |
| 2 | **Auto Repair Invoice** | Express Oil & Brake (4 cols) | Body Repair Estimate (5 cols) | Garage Repair (8 cols) | Fleet Maintenance Ledger (12 cols) |
| 3 | **Business Payroll** | Employee Paystub (4 cols) | Weekly Crew Register (5 cols) | Monthly Journal (9 cols) | Enterprise Benefits Allocator (12 cols) |
| 4 | **Business Quote** | Freelance Estimate (4 cols) | HVAC Trade Quote (5 cols) | Cloud Proposal (8 cols) | Turnkey Infrastructure Quote (10 cols) |
| 5 | **Cash Receipt** | POS Cash Receipt (4 cols) | Event Deposit Receipt (5 cols) | Daily Cash Register (8 cols) | Bank Deposit Audit Log (10 cols) |
| 6 | **Contractor Timesheet** | Weekly Timesheet (5 cols) | Bi-Weekly Overtime (5 cols) | Multi-Worker Project (8 cols) | Monthly Agency Margin Engine (11 cols) |
| 7 | **Customer Invoice** | Simple Retail Invoice (4 cols) | Service Billing (5 cols) | Wholesale Invoice (8 cols) | Master Invoicing System (12 cols) |
| 8 | **Inventory Lists** | Stock Checklist (5 cols) | Asset Valuation (5 cols) | Perpetual Inventory (8 cols) | Enterprise SKU & ABC Matrix (12 cols) |
| 9 | **Monthly Rent Receipt** | Tenant Rent Receipt (4 cols) | Commercial CAM Receipt (5 cols)| Multi-Unit Rent Roll (8 cols) | Property Portfolio Model (12 cols) |
| 10| **Packing Slip** | Dispatch Slip (4 cols) | Shipping Manifest (5 cols) | Wholesale Backorder (8 cols) | Export Cargo Dossier (11 cols) |

---

## 🚀 How to Execute with MCP Agents
Pass any of the prompts in this directory to your LangChain cloud agent. The agent must:
1. Identify the target device and column width budget.
2. Call `create_full_workbook` with appropriate lowercased sheet names.
3. Apply the official brand theme color tokens.
4. Populate all tables using `insert_table` with exact number formats.
5. Conclude with `validate_workbook_integrity` to certify 0 errors.
