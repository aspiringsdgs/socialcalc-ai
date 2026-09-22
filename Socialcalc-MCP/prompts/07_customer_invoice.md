# User Prompts: Customer Invoice (Business)

> **Theme Color**: `#2563EB` | **Total Prompts**: 4

---

## Prompt 1: Simple Commercial Customer Invoice (CUST-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile invoice for product sales with itemized subtotal and tax.

### Prompt Text:
```text
Create a clean, mobile-optimized Customer Invoice for iPhone 15 Pro.
- Layout: 4 columns (Item Description, Qty, Unit Price, Line Total), width ~380px.
- Sheet Name: 'invoice'
- Header: Company Name (Apex Trading Co), Invoice # (INV-1092), Date, Customer (Blue Sky Retail).
- Line Items: 4 product lines (Display Monitors, USB-C Docks, Ergonomic Keyboards, Mousepads).
- Summary: Subtotal (=SUM), Standard Tax (8.5%), Shipping ($25.00), Total Amount Due.
- Theme: Royal Blue #2563EB, clean currency formats ($#,##0.00), validate integrity.
```

---

## Prompt 2: Service & Maintenance Billing Invoice (CUST-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile invoice with discount codes and payment terms.

### Prompt Text:
```text
Generate a mobile Service Billing Invoice for iPhone 15 Pro Max.
- Layout: 5 columns (Service Name, Description, Hours, Hourly Rate, Total), width ~415px.
- Sheet Name: 'serviceinvoice'
- Data: Security System Inspection (3 hrs @ $125/hr), Firmware Upgrade ($150), Sensor Replacement ($220).
- Formulas: Subtotal, Promotional Discount (-5%), Taxable Amount, Sales Tax (7.0%), Grand Total.
- Include Net 15 payment terms and bank deposit notes.
- Theme: #2563EB header, white bold text, execute via MCP.
```

---

## Prompt 3: Comprehensive B2B Wholesale Customer Invoice (CUST-03)

- **Target Device**: iPad 10th Gen (Tablet - 810 x 1080 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet invoice template supporting 12 products, shipping addresses, and GST breakdown.

### Prompt Text:
```text
Build a comprehensive B2B Customer Invoice on iPad 10th Gen tablet.
- Layout: 8 columns (#, SKU, Product Description, Category, Qty, Unit Price, Disc %, Line Total).
- Sheet Name: 'Invoice'
- Header: Billed To / Shipped To addresses, Customer Tax ID, PO Number, Payment Due Date.
- Items: 10 wholesale consumer electronic goods with 5% bulk discounts on selected items.
- Financials: Gross Subtotal, Total Discounts, Net Taxable Value, CGST (9%), SGST (9%), Courier Freight, Total Due.
- Theme: #2563EB Blue, KPI cards for Items Count and Total Due, zero validation errors.
```

---

## Prompt 4: Master Customer Invoicing & Multi-Payment Ledger (CUST-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 12-column master invoicing engine with itemized invoice generator, invoice register, and payments journal.

### Prompt Text:
```text
Create a complete Master Customer Invoicing System for iPad Pro 12.9".
- Sheets: 'InvoiceGenerator' (Active printable 15-item invoice), 'InvoiceRegister' (20 historical customer invoices), 'PaymentLog' (Payment settlements).
- Formulas: Automated cross-sheet lookups, tax calculations, balance outstanding (=GrandTotal-AmountPaid), and overdue days.
- Visuals: 4 Executive KPI Cards on Register, Blue #2563EB styling, complete currency formatting, and automated integrity validation.
```

---

