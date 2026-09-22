# User Prompts: Cash Receipt (Business)

> **Theme Color**: `#0D9488` | **Total Prompts**: 4

---

## Prompt 1: Point-of-Sale Quick Cash Receipt (REC-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile receipt for retail cash payment acknowledgment.

### Prompt Text:
```text
Create a mobile Cash Receipt voucher for iPhone 15 Pro.
- Layout: 4 columns (Item Description, Qty, Unit Price, Amount), width ~380px.
- Sheet Name: 'receipt'
- Details: Receipt # CR-88102, Date, Received From (Sarah Jenkins), Purpose (Store Merchandise).
- Line Items: Leather Jacket ($180.00), Denim Jeans ($65.00), Cotton T-Shirt (2 @ $25.00).
- Calculations: Subtotal (=SUM), Cash Tendered ($350.00), Change Due (=Tendered-Subtotal).
- Theme: Teal #0D9488, white bold headers, centered transaction metadata, validate integrity.
```

---

## Prompt 2: Service Deposit & Down Payment Cash Receipt (REC-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile receipt acknowledging advance payment for catering.

### Prompt Text:
```text
Generate a mobile Cash Deposit Receipt on iPhone 15 Pro Max.
- Layout: 5 columns (Description, Event Date, Agreed Budget, Deposit Paid, Remaining Balance), width ~415px.
- Sheet Name: 'depositreceipt'
- Details: Wedding Catering Package ($4,500.00), Cash Deposit Received ($1,500.00), Balance Due on Delivery (=Budget-Deposit).
- Payment Confirmation: Cashier Name, Receipt Timestamp, Stamp/Signature acknowledgment block.
- Theme: #0D9488 primary, #CCFBF1 accent, explicit currency formatting ($#,##0.00).
```

---

## Prompt 3: Daily Store Cash Reconciliation & Receipt Register (REC-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet cash journal recording all cash transactions and register drawer balancing.

### Prompt Text:
```text
Build a Daily Cash Receipt & Register Balancing Journal for iPad Air 11".
- Layout: 8 columns (Receipt #, Time, Customer Name, Description, Category, Cash In ($), Cash Out / Refund ($), Running Drawer Balance).
- Sheet Name: 'CashRegister'
- Records: 10 daily cash transactions showing starting float ($300.00), cash sales, petty cash expenses, and closing balance (=Previous+In-Out).
- Top KPIs: Opening Cash, Total Cash In, Total Payouts, Expected Drawer Cash.
- Theme: #0D9488 Teal, zebra striping, currency formats, and summary total row.
```

---

## Prompt 4: Multi-Branch Cash Receipting & Bank Deposit Log (REC-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 10-column master cash audit sheet tracking multi-counter cash collections and armored pickup.

### Prompt Text:
```text
Create a Master Commercial Cash Receipt & Bank Deposit Audit Log for iPad Pro 12.9".
- Layout: 10 columns across 2 sheets: 'CashReceiptsLedger', 'BankDepositLog'.
- Receipts Sheet: 15 cash collection transactions across 3 store counters (Counter ID, Receipt #, Customer, Amount, Bill Denominations $100/$50/$20, Cashier).
- Deposit Sheet: Total Cash Counted, Armored Guard Pickup Slip #, Bank Deposit Verification.
- Visuals: 4 Executive KPI Cards, Teal #0D9488 styling, formula-driven totals, zero validation errors.
```

---

