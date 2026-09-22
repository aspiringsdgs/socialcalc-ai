# User Prompts: Monthly Rent Receipt (Business)

> **Theme Color**: `#0D9488` | **Total Prompts**: 4

---

## Prompt 1: Residential Tenant Rent Receipt (RENT-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile rent payment receipt for a single apartment tenant.

### Prompt Text:
```text
Create a mobile Monthly Rent Receipt for iPhone 15 Pro.
- Layout: 4 columns (Description / Item, Period, Paid Amount, Status), width ~380px.
- Sheet Name: 'rentreceipt'
- Details: Receipt # RENT-2026-02, Tenant Name (Alex Mercer), Property Address (Apt 4B, 742 Evergreen Terrace), Landlord (Oakmont Properties).
- Items: Monthly Apartment Rent ($1,850.00), Parking Space Fee ($150.00), Water Utility Share ($45.00).
- Calculations: Total Paid (=SUM), Payment Method (Zelle / Bank Transfer), Balance Remaining ($0.00).
- Theme: Teal #0D9488, clean bold headers, currency format ($#,##0.00), validate integrity.
```

---

## Prompt 2: Commercial Property Rent & CAM Fee Receipt (RENT-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile receipt with common area maintenance and late fee calculations.

### Prompt Text:
```text
Generate a Commercial Lease Rent Receipt for iPhone 15 Pro Max.
- Layout: 5 columns (Charge Description, Sq Ft / Basis, Base Rate, Amount ($), Payment Status), width ~415px.
- Sheet Name: 'commercialrent'
- Data: Retail Suite 101 Base Rent (1,200 sq ft @ $2.50/sq ft = $3,000.00), CAM Maintenance Fee ($350.00), Property Tax Surcharge ($180.00), Late Fee ($0.00).
- Summary: Total Billed (=SUM), Amount Paid ($3,530.00), Outstanding Balance ($0.00).
- Theme: #0D9488 header, white bold text, execute via MCP.
```

---

## Prompt 3: Multi-Unit Apartment Rent Roll & Receipt Register (RENT-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet rent roll tracking 10 residential units, payment dates, and overdue rent.

### Prompt Text:
```text
Build a Multi-Unit Apartment Rent Roll & Monthly Collection Ledger for iPad Air 11".
- Layout: 8 columns (Unit #, Tenant Name, Lease Term, Monthly Rent ($), Payment Date, Paid Amount ($), Balance Due ($), Status).
- Sheet Name: 'RentRoll'
- Formula: Balance Due (=MonthlyRent - PaidAmount), Status (=IF(BalanceDue=0, "PAID", "OVERDUE")).
- Units: 10 apartment units with rents between $1,400 and $2,600.
- Summary Cards: Total Scheduled Rent, Total Collected Rent, Total Overdue Rent.
- Theme: #0D9488 Teal styling, zebra striping, currency formats, zero validation errors.
```

---

## Prompt 4: Property Management Annual Rent Collection & Revenue Dashboard (RENT-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 12-column master property management workbook covering 12 months of rental collections across multi-building portfolios.

### Prompt Text:
```text
Create a Master Property Management Rent Ledger & Annual Revenue Model for iPad Pro 12.9".
- Layout: 12 columns across 2 sheets: 'RentCollectionMaster', 'AnnualIncomeSummary'.
- Master Sheet: 15 commercial and residential units logging tenant info, deposit held, monthly rent, payment method, late fees, and annual projected revenue (=MonthlyRent*12).
- Features: 4 Executive KPI Cards (Gross Potential Rent, Actual Collections, Economic Occupancy Rate, Total Security Deposits Held).
- Theme: Teal #0D9488, explicit value formatting ($#,##0), and automated integrity audit.
```

---

