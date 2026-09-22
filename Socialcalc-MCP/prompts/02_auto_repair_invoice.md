# User Prompts: Auto Repair Invoice (Business)

> **Theme Color**: `#8D6F56` | **Total Prompts**: 4

---

## Prompt 1: Express Oil & Brake Service Work Order (AUTO-01)

- **Target Device**: iPhone 15 (Mobile Portrait - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile mechanic job card for quick routine maintenance billing.

### Prompt Text:
```text
Create an express mobile Auto Repair Invoice for iPhone 15 screen.
- Layout: 4 columns (Item, Qty/Hrs, Rate, Total), total width ~380px.
- Sheet Name: 'workorder'
- Items: Synthetic Oil Change (5 Qts @ $12.00), Oil Filter ($15.00), Front Brake Pad Replacement (Labor 1.5 hrs @ $95/hr), Brake Pads Part ($65.00).
- Calculations: Parts Subtotal (=SUM), Labor Subtotal (=SUM), Shop Supplies Fee ($25.00), Tax (=Subtotal*8.25%), Grand Total (=Parts+Labor+Fee+Tax).
- Theme: #8D6F56 header, white bold text, currency format ($#,##0.00).
- Execute via MCP tools and verify with validate_workbook_integrity.
```

---

## Prompt 2: Collision & Body Repair Estimate (AUTO-02)

- **Target Device**: iPhone 15 Pro Max (Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile invoice with separate parts, paint, and labor breakdowns.

### Prompt Text:
```text
Generate an Auto Body Repair & Estimate invoice spreadsheet for iPhone 15 Pro Max.
- Layout: 5 columns (Part/Operation, Type, Qty/Hrs, Unit Price, Amount), width ~410px.
- Sheet Name: 'autorepair'
- Data: Front Bumper Cover ($380.00), Headlight Assembly ($290.00), Body Labor (4.0 hrs @ $85/hr), Paint Labor & Materials (3.5 hrs @ $90/hr).
- Summary: Auto-calculate Labor Total, Parts Total, EPA Environmental Surcharge ($18.00), Sales Tax (7.0%), Total Estimate.
- Apply official Auto Repair theme (#8D6F56 / #EADBC8) and validate.
```

---

## Prompt 3: Full Garage Repair Invoice with Diagnostics & Parts Catalog (AUTO-03)

- **Target Device**: iPad Mini / iPad 10th Gen (Compact Tablet - 768 x 1024 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet invoice featuring customer metadata, technician notes, and itemized labor.

### Prompt Text:
```text
Build a complete Garage Auto Repair Invoice & Work Order for iPad 10th Gen tablet.
- Layout: 8 columns (#, Part #, Description, Category, Qty, Unit Price, Labor Hours, Line Total).
- Sheets: 'Invoice' (Main customer bill), 'PartsList' (Inventory lookup).
- Line Items: 8 repair items spanning Engine Diagnostics, Alternator Replacement, Serpentine Belt, Coolant Flush, and Wheel Alignment.
- Header Block: Customer name, Vehicle VIN, Odometer reading, License Plate, Service Advisor.
- Calculations: Total Parts, Total Labor, Environmental Fee, Sales Tax, Deposit Paid, Balance Due.
- Theme: #8D6F56 primary header, KPI cards for Total Labor Hours & Total Parts Cost.
```

---

## Prompt 4: Commercial Fleet Maintenance & Diagnostic Ledger (AUTO-04)

- **Target Device**: iPad Pro 12.9" (Widescreen Tablet - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 12-column comprehensive fleet repair station ledger tracking multiple trucks.

### Prompt Text:
```text
Generate a commercial Fleet Auto Repair & Maintenance Ledger for iPad Pro 12.9".
- Layout: 12 columns across 2 sheets: 'FleetRepairs', 'TechnicianHours'.
- Fleet Sheet: 12 repair jobs across delivery vans and trucks (Vehicle ID, Driver, Service Date, Service Code, Description, Parts Cost, Labor Cost, Subtotal, Tax, Total, Payment Method, Status).
- Features: 4 KPI cards at top (Total Maintenance Spend, Total Labor Hours, Active Work Orders, Completed Jobs).
- Styling: #8D6F56 brand palette, zebra striping, currency formatting, and automated summary total row.
- Execute strictly via MCP tools and run validation audit.
```

---

