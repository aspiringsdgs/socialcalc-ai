# User Prompts: ATV Bill of Sale (Business)

> **Theme Color**: `#8D6F56` | **Total Prompts**: 4

---

## Prompt 1: Single ATV Private Party Sale (ATV-01)

- **Target Device**: iPhone 15 Pro (Mobile Portrait - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: A compact 4-column mobile bill of sale for a quick private sale between individuals.

### Prompt Text:
```text
Create a clean, mobile-optimized ATV Bill of Sale spreadsheet for my iPhone 15 Pro screen.
- Layout: 4 columns max (Item/Field, Details, Value, Notes), total width ~390px.
- Sheet Name: 'main'
- Include: Buyer & Seller contact details, ATV VIN number, Make (Polaris RZR XP 1000), Model Year (2023), Odometer hours, Purchase Price ($14,500), Deposit Paid ($2,000), and Balance Due calculation (=Price-Deposit).
- Styling: Warm automotive earth tone (#8D6F56 header), bold title banner, currency formatting ($#,##0), and digital signature line.
- Execute strictly via MCP tools and validate integrity.
```

---

## Prompt 2: Dealership As-Is Vehicle Agreement (ATV-02)

- **Target Device**: iPhone 14 Plus / 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile commercial agreement with warranty disclaimers and itemized fees.

### Prompt Text:
```text
Generate a mobile As-Is ATV Bill of Sale workbook tailored for iPhone 15 Pro Max display.
- Layout: 5 columns (Section, Specification, Serial / ID, Amount, Status), width ~420px.
- Sheet Name: 'atvbillofsale'
- Details: Include Dealership info, Buyer info, 2024 Can-Am Maverick X3 details, Base Vehicle Price ($22,900), Dealer Prep Fee ($650), Documentation Fee ($150), State Sales Tax (=Sum*7.5%), and Total Cash Due.
- Features: Add an 'AS-IS / NO WARRANTY' disclaimer row spanning columns, formatted total due with bold background (#8D6F56).
- Use composite MCP tools and run validation audit.
```

---

## Prompt 3: Commercial Multi-ATV Fleet Purchase Agreement (ATV-03)

- **Target Device**: iPad Air 11" (Tablet Landscape - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet workbook tracking a 5-vehicle commercial fleet transaction with trade-ins.

### Prompt Text:
```text
Build a comprehensive Multi-Vehicle ATV Bill of Sale and Fleet Purchase Agreement for an iPad Air 11".
- Layout: 8 columns (#, VIN / Serial, Make & Model, Year, Condition, Hours, Trade-In Credit, Net Price), width ~820px.
- Sheets: 'FleetAgreement' (Master transaction), 'Summary' (Payment breakdown).
- Table Data: 5 commercial off-road utility vehicles (Yamaha Grizzly, Honda Talon, Kawasaki Mule), unit prices between $9,500 and $18,000, trade-in deductions, delivery surcharge ($450), and auto-calculated Net Total (=SUM(H4:H8)+Charges).
- Styling: Automotive theme (#8D6F56), KPI cards for Total Fleet Value, Total Trade-In Credit, and Final Payable Amount.
- Build strictly using SocialCalc MCP batch tools.
```

---

## Prompt 4: Dealership Master Sales & Registration Dossier (ATV-04)

- **Target Device**: iPad Pro 12.9" / Desktop (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 10-column master tablet workbook with lienholder disclosures, tax matrix, and customer registry.

### Prompt Text:
```text
Create a dealership-grade Master ATV Sales & Lienholder Registration Workbook for iPad Pro 12.9".
- Layout: 10 columns across 3 sheets: 'SalesContract', 'VehicleSpecs', 'LienholderDetails'.
- Contract Sheet: Vehicle pricing, optional winch/plow accessories table (5 line items), State Tax (6.0%), Title & Registration transfer fees ($185), Down Payment ($5,000), Financed Balance (=GrandTotal-DownPayment).
- Aesthetics: Executive #8D6F56 styling, zebra striping (#F9F6F0), 4 KPI summary cards, and digital signature acknowledgment block.
- Validate with zero errors using validate_workbook_integrity.
```

---

