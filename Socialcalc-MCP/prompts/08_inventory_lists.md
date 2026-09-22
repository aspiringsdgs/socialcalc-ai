# User Prompts: Inventory Lists (Business)

> **Theme Color**: `#059669` | **Total Prompts**: 4

---

## Prompt 1: Retail Stock Count & Reorder Checklist (INV-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile inventory sheet tracking on-hand stock and reorder flags.

### Prompt Text:
```text
Create a mobile Retail Stock Inventory & Reorder Checklist for iPhone 15 Pro.
- Layout: 5 columns (Item Name, SKU, In Stock, Min Level, Status), width ~385px.
- Sheet Name: 'inventory'
- Items: 8 retail grocery items (Coffee Beans, Almond Milk, Brown Sugar, Green Tea, etc.).
- Formula: Status column (=IF(InStock<=MinLevel, "REORDER", "OK")).
- Summary: Total SKU count, Total Units in Stock (=SUM).
- Theme: Emerald Green #059669 header, centered status badges, validate integrity.
```

---

## Prompt 2: Warehouse Valuation & Asset Inventory (INV-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile inventory ledger with unit costs and total stock valuation.

### Prompt Text:
```text
Generate an Inventory Valuation & Asset Sheet on iPhone 15 Pro Max.
- Layout: 5 columns (Item SKU, Description, Qty on Hand, Unit Cost, Total Value), width ~415px.
- Sheet Name: 'assetvaluation'
- Formula: Total Value (=QtyOnHand*UnitCost).
- Items: 8 computer hardware components (CPUs, GPUs, RAM sticks, SSDs, Power Supplies).
- Footer: Total Inventory Asset Value (=SUM), Average Unit Cost (=AVERAGE).
- Theme: #059669 primary, #D1FAE5 secondary, formatted currency ($#,##0.00).
```

---

## Prompt 3: Perpetual Inventory Control & Supplier Tracking (INV-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet inventory sheet tracking received, sold, and safety stock levels.

### Prompt Text:
```text
Build a Perpetual Inventory Control & Supplier Management Sheet for iPad Air 11".
- Layout: 8 columns (SKU, Product Description, Category, Supplier, Starting Qty, Received, Sold, Current Stock).
- Sheet Name: 'PerpetualStock'
- Formula: Current Stock (=StartingQty + Received - Sold).
- Data: 12 warehouse SKUs spanning Raw Materials, Packaging, and Finished Goods.
- Cockpit: 3 KPI cards (Total Stock Units, Total Received This Month, Total Units Dispatched).
- Theme: Emerald #059669, zebra striping, centered quantities, zero validation errors.
```

---

## Prompt 4: Master Enterprise Inventory, SKU Catalog & ABC Analysis (INV-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 12-column master inventory management model with stock turnover, unit economics, and ABC classification.

### Prompt Text:
```text
Create a Master Enterprise Inventory & SKU Valuation System for iPad Pro 12.9".
- Layout: 12 columns across 2 sheets: 'MasterInventory', 'SupplierDirectory'.
- Inventory Sheet: 20 SKUs with SKU, Name, Category, Location/Bin, Unit Cost, Selling Price, Margin %, Qty on Hand, Total Cost Value, Total Retail Value, Reorder Point, Stock Health.
- Features: 4 Executive KPI Cards (Total Inventory Value at Cost, Total Potential Retail Value, Out of Stock SKUs, Low Stock Alerts).
- Theme: #059669 Emerald styling, complete number formats, execute strictly via MCP.
```

---

