# User Prompts: Packing Slip (Business)

> **Theme Color**: `#475569` | **Total Prompts**: 4

---

## Prompt 1: Order Dispatch & Box Packing Slip (PACK-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile packing slip verifying items, quantities ordered vs shipped.

### Prompt Text:
```text
Create a mobile Packing Slip spreadsheet for iPhone 15 Pro.
- Layout: 4 columns (Item SKU, Product Description, Qty Ordered, Qty Shipped), width ~380px.
- Sheet Name: 'packingslip'
- Header: Order # (ORD-9941), Ship Date, Carrier (FedEx Ground), Tracking #, Consignee (Green Leaf Cafe).
- Items: 5 shipped items (Espresso Cups, Coffee Filters, Syrups, Milk Pitchers, Napkins).
- Summary: Total Items Ordered (=SUM), Total Items Shipped (=SUM), Discrepancy (=Ordered-Shipped).
- Theme: Slate #475569, clean alignment (SKU center, Description left, Qty center), validate integrity.
```

---

## Prompt 2: Warehouse Multi-Package Shipping Manifest (PACK-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile manifest with box weights and package identifiers.

### Prompt Text:
```text
Generate a mobile Multi-Package Shipping Manifest for iPhone 15 Pro Max.
- Layout: 5 columns (Package #, SKU, Description, Qty, Weight (lbs)), width ~415px.
- Sheet Name: 'shipmanifest'
- Data: 6 package parcels containing hardware parts, with individual weights (4.5 lbs, 8.2 lbs, 12.0 lbs, etc.).
- Summary: Total Packages Count, Total Units Shipped, Total Shipment Weight (=SUM).
- Signature Block: Packed By, Inspected By, Courier Pickup Sign-off.
- Theme: #475569 header, white bold text, execute via MCP.
```

---

## Prompt 3: Wholesale Order Packing Slip & Backorder Tracker (PACK-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet packing slip tracking fulfilled quantities, backordered items, and bin locations.

### Prompt Text:
```text
Build a Wholesale Packing Slip & Backorder Fulfillment Sheet for iPad Air 11".
- Layout: 8 columns (Line #, Item Code, Description, Bin Location, Qty Ordered, Qty Shipped, Backordered, Fulfillment Status).
- Sheet Name: 'PackingSlip'
- Formula: Backordered (=QtyOrdered - QtyShipped), Status (=IF(Backordered=0, "FULFILLED", "PARTIAL")).
- Items: 10 wholesale parts with 2 items currently backordered.
- Top KPIs: Total Items Ordered, Total Shipped Units, Backorder Units Count.
- Theme: #475569 Slate, zebra striping, centered codes, zero validation errors.
```

---

## Prompt 4: Enterprise Freight Logistics & Container Packing Dossier (PACK-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 11-column master shipping & export customs packing dossier tracking palletized cargo.

### Prompt Text:
```text
Create a Master Freight Logistics & Container Packing Dossier for iPad Pro 12.9".
- Layout: 11 columns across 2 sheets: 'ContainerPackingSlip', 'PalletWeights'.
- Slip Sheet: 15 export shipment lines (Pallet #, Harmonized HS Code, Commercial Description, Qty, Packaging Type, Net Weight kg, Gross Weight kg, Volume CBM, Country of Origin, Customs Value $).
- Calculations: Total Pallets, Total Net Weight, Total Gross Weight, Total Volume CBM, Total Customs Declared Value.
- Visuals: 4 Executive KPI Cards, Slate #475569 styling, complete value formatting, and automated integrity validation.
```

---

