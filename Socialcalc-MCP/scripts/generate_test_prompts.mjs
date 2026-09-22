import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = path.resolve(__dirname, "../..");
const promptsDir = path.join(workspaceRoot, "Socialcalc-MCP/prompts");

if (!fs.existsSync(promptsDir)) {
  fs.mkdirSync(promptsDir, { recursive: true });
}

console.log(`📁 Generating 40 specialized user prompts in: ${promptsDir}`);

const apps = [
  {
    id: "01_atv_bill_of_sale",
    name: "ATV Bill of Sale",
    category: "Business",
    theme: "#8D6F56",
    prompts: [
      {
        id: "ATV-01",
        device: "iPhone 15 Pro (Mobile Portrait - 393 x 852 px)",
        mode: "mobile.json",
        title: "Single ATV Private Party Sale",
        description: "A compact 4-column mobile bill of sale for a quick private sale between individuals.",
        prompt: `Create a clean, mobile-optimized ATV Bill of Sale spreadsheet for my iPhone 15 Pro screen.
- Layout: 4 columns max (Item/Field, Details, Value, Notes), total width ~390px.
- Sheet Name: 'main'
- Include: Buyer & Seller contact details, ATV VIN number, Make (Polaris RZR XP 1000), Model Year (2023), Odometer hours, Purchase Price ($14,500), Deposit Paid ($2,000), and Balance Due calculation (=Price-Deposit).
- Styling: Warm automotive earth tone (#8D6F56 header), bold title banner, currency formatting ($#,##0), and digital signature line.
- Execute strictly via MCP tools and validate integrity.`
      },
      {
        id: "ATV-02",
        device: "iPhone 14 Plus / 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Dealership As-Is Vehicle Agreement",
        description: "5-column mobile commercial agreement with warranty disclaimers and itemized fees.",
        prompt: `Generate a mobile As-Is ATV Bill of Sale workbook tailored for iPhone 15 Pro Max display.
- Layout: 5 columns (Section, Specification, Serial / ID, Amount, Status), width ~420px.
- Sheet Name: 'atvbillofsale'
- Details: Include Dealership info, Buyer info, 2024 Can-Am Maverick X3 details, Base Vehicle Price ($22,900), Dealer Prep Fee ($650), Documentation Fee ($150), State Sales Tax (=Sum*7.5%), and Total Cash Due.
- Features: Add an 'AS-IS / NO WARRANTY' disclaimer row spanning columns, formatted total due with bold background (#8D6F56).
- Use composite MCP tools and run validation audit.`
      },
      {
        id: "ATV-03",
        device: "iPad Air 11\" (Tablet Landscape - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Commercial Multi-ATV Fleet Purchase Agreement",
        description: "8-column tablet workbook tracking a 5-vehicle commercial fleet transaction with trade-ins.",
        prompt: `Build a comprehensive Multi-Vehicle ATV Bill of Sale and Fleet Purchase Agreement for an iPad Air 11\".
- Layout: 8 columns (#, VIN / Serial, Make & Model, Year, Condition, Hours, Trade-In Credit, Net Price), width ~820px.
- Sheets: 'FleetAgreement' (Master transaction), 'Summary' (Payment breakdown).
- Table Data: 5 commercial off-road utility vehicles (Yamaha Grizzly, Honda Talon, Kawasaki Mule), unit prices between $9,500 and $18,000, trade-in deductions, delivery surcharge ($450), and auto-calculated Net Total (=SUM(H4:H8)+Charges).
- Styling: Automotive theme (#8D6F56), KPI cards for Total Fleet Value, Total Trade-In Credit, and Final Payable Amount.
- Build strictly using SocialCalc MCP batch tools.`
      },
      {
        id: "ATV-04",
        device: "iPad Pro 12.9\" / Desktop (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Dealership Master Sales & Registration Dossier",
        description: "10-column master tablet workbook with lienholder disclosures, tax matrix, and customer registry.",
        prompt: `Create a dealership-grade Master ATV Sales & Lienholder Registration Workbook for iPad Pro 12.9\".
- Layout: 10 columns across 3 sheets: 'SalesContract', 'VehicleSpecs', 'LienholderDetails'.
- Contract Sheet: Vehicle pricing, optional winch/plow accessories table (5 line items), State Tax (6.0%), Title & Registration transfer fees ($185), Down Payment ($5,000), Financed Balance (=GrandTotal-DownPayment).
- Aesthetics: Executive #8D6F56 styling, zebra striping (#F9F6F0), 4 KPI summary cards, and digital signature acknowledgment block.
- Validate with zero errors using validate_workbook_integrity.`
      }
    ]
  },
  {
    id: "02_auto_repair_invoice",
    name: "Auto Repair Invoice",
    category: "Business",
    theme: "#8D6F56",
    prompts: [
      {
        id: "AUTO-01",
        device: "iPhone 15 (Mobile Portrait - 393 x 852 px)",
        mode: "mobile.json",
        title: "Express Oil & Brake Service Work Order",
        description: "4-column mobile mechanic job card for quick routine maintenance billing.",
        prompt: `Create an express mobile Auto Repair Invoice for iPhone 15 screen.
- Layout: 4 columns (Item, Qty/Hrs, Rate, Total), total width ~380px.
- Sheet Name: 'workorder'
- Items: Synthetic Oil Change (5 Qts @ $12.00), Oil Filter ($15.00), Front Brake Pad Replacement (Labor 1.5 hrs @ $95/hr), Brake Pads Part ($65.00).
- Calculations: Parts Subtotal (=SUM), Labor Subtotal (=SUM), Shop Supplies Fee ($25.00), Tax (=Subtotal*8.25%), Grand Total (=Parts+Labor+Fee+Tax).
- Theme: #8D6F56 header, white bold text, currency format ($#,##0.00).
- Execute via MCP tools and verify with validate_workbook_integrity.`
      },
      {
        id: "AUTO-02",
        device: "iPhone 15 Pro Max (Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Collision & Body Repair Estimate",
        description: "5-column mobile invoice with separate parts, paint, and labor breakdowns.",
        prompt: `Generate an Auto Body Repair & Estimate invoice spreadsheet for iPhone 15 Pro Max.
- Layout: 5 columns (Part/Operation, Type, Qty/Hrs, Unit Price, Amount), width ~410px.
- Sheet Name: 'autorepair'
- Data: Front Bumper Cover ($380.00), Headlight Assembly ($290.00), Body Labor (4.0 hrs @ $85/hr), Paint Labor & Materials (3.5 hrs @ $90/hr).
- Summary: Auto-calculate Labor Total, Parts Total, EPA Environmental Surcharge ($18.00), Sales Tax (7.0%), Total Estimate.
- Apply official Auto Repair theme (#8D6F56 / #EADBC8) and validate.`
      },
      {
        id: "AUTO-03",
        device: "iPad Mini / iPad 10th Gen (Compact Tablet - 768 x 1024 px)",
        mode: "tablet.json",
        title: "Full Garage Repair Invoice with Diagnostics & Parts Catalog",
        description: "8-column tablet invoice featuring customer metadata, technician notes, and itemized labor.",
        prompt: `Build a complete Garage Auto Repair Invoice & Work Order for iPad 10th Gen tablet.
- Layout: 8 columns (#, Part #, Description, Category, Qty, Unit Price, Labor Hours, Line Total).
- Sheets: 'Invoice' (Main customer bill), 'PartsList' (Inventory lookup).
- Line Items: 8 repair items spanning Engine Diagnostics, Alternator Replacement, Serpentine Belt, Coolant Flush, and Wheel Alignment.
- Header Block: Customer name, Vehicle VIN, Odometer reading, License Plate, Service Advisor.
- Calculations: Total Parts, Total Labor, Environmental Fee, Sales Tax, Deposit Paid, Balance Due.
- Theme: #8D6F56 primary header, KPI cards for Total Labor Hours & Total Parts Cost.`
      },
      {
        id: "AUTO-04",
        device: "iPad Pro 12.9\" (Widescreen Tablet - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Commercial Fleet Maintenance & Diagnostic Ledger",
        description: "12-column comprehensive fleet repair station ledger tracking multiple trucks.",
        prompt: `Generate a commercial Fleet Auto Repair & Maintenance Ledger for iPad Pro 12.9\".
- Layout: 12 columns across 2 sheets: 'FleetRepairs', 'TechnicianHours'.
- Fleet Sheet: 12 repair jobs across delivery vans and trucks (Vehicle ID, Driver, Service Date, Service Code, Description, Parts Cost, Labor Cost, Subtotal, Tax, Total, Payment Method, Status).
- Features: 4 KPI cards at top (Total Maintenance Spend, Total Labor Hours, Active Work Orders, Completed Jobs).
- Styling: #8D6F56 brand palette, zebra striping, currency formatting, and automated summary total row.
- Execute strictly via MCP tools and run validation audit.`
      }
    ]
  },
  {
    id: "03_business_payroll",
    name: "Business Payroll",
    category: "Business",
    theme: "#1E3A8A",
    prompts: [
      {
        id: "PAY-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Individual Employee Bi-Weekly Paystub",
        description: "4-column mobile employee pay statement showing earnings and statutory deductions.",
        prompt: `Create a mobile Employee Paystub spreadsheet for iPhone 15 Pro.
- Layout: 4 columns (Earnings / Deduction Item, Hours/Rate, Current Period ($), YTD Total ($)), width ~380px.
- Sheet Name: 'paystub'
- Data: Regular Pay (80 hrs @ $32.50/hr), Overtime Pay (5 hrs @ $48.75/hr), Federal Income Tax (12%), State Tax (5%), FICA Social Security (6.2%), Medicare (1.45%), Health Insurance Deduction ($120.00).
- Formulas: Gross Pay (=Reg+OT), Total Deductions (=SUM), Net Pay (=Gross-Deductions).
- Theme: Corporate Blue (#1E3A8A / #DBEAFE), bold title banner, currency formatting.
- Execute via MCP tools with 0 validation errors.`
      },
      {
        id: "PAY-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Small Team Weekly Payroll Summary",
        description: "5-column mobile payroll tracker for a 6-person crew.",
        prompt: `Generate a compact Weekly Payroll Register for a 6-employee retail crew on iPhone 15 Pro Max.
- Layout: 5 columns (Employee Name, Reg Hours, OT Hours, Gross Pay, Net Pay), width ~415px.
- Sheet Name: 'payrollsummary'
- Formulas: Gross Pay (=RegHrs*Rate + OTHrs*Rate*1.5), Net Pay (=GrossPay*0.78).
- Include Total Summary Row summing all hours, gross wages, and net disbursements.
- Theme: #1E3A8A header, bold KPI metric for Total Payroll Outflow, currency formatted.`
      },
      {
        id: "PAY-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Comprehensive Monthly Company Payroll Journal",
        description: "9-column tablet payroll journal for 15 salaried and hourly employees with full tax withholding.",
        prompt: `Build a complete Monthly Business Payroll Journal for iPad Air 11\".
- Layout: 9 columns (Emp ID, Name, Department, Base Salary, Overtime, Gross Pay, Fed Tax, FICA/State, Net Pay).
- Sheet Name: 'PayrollJournal'
- Employees: 15 staff members across Engineering, Sales, Support, and Operations.
- Calculations: Automated Gross Pay, 15% Federal Tax, 7.65% FICA, Net Pay (=Gross-Fed-FICA).
- Executive Cockpit: 3 KPI cards (Total Gross Payroll, Total Tax Withheld, Net Payout).
- Theme: #1E3A8A primary, #DBEAFE accent, zebra striping, and auto-computed summary total row.`
      },
      {
        id: "PAY-04",
        device: "iPad Pro 12.9\" (Widescreen Tablet - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Enterprise Multi-Department Payroll & Benefits Allocator",
        description: "12-column master payroll system with employer contributions, 401k match, and department subtotals.",
        prompt: `Create an enterprise Payroll, Tax & Benefits Allocation Model for iPad Pro 12.9\".
- Layout: 12 columns across 2 sheets: 'PayrollRegister', 'DepartmentSummary'.
- Columns: Emp ID, Full Name, Title, Dept, Hourly Rate, Regular Hours, OT Hours, Gross Pay, 401k Pre-Tax (5%), Fed Tax (18%), FICA (7.65%), Net Pay.
- Department Summary: Aggregate total spend for Engineering, Sales, Product, Marketing, and G&A using SUM formulas.
- Styling: Deep Navy (#1E3A8A), 4 KPI cards, professional value formatting ($#,##0.00), and automated audit pass.`
      }
    ]
  },
  {
    id: "04_business_quote",
    name: "Business Quote",
    category: "Business",
    theme: "#4F46E5",
    prompts: [
      {
        id: "QUO-01",
        device: "iPhone 15 (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Quick Freelance Service Estimate",
        description: "4-column mobile price quotation for freelance design & development services.",
        prompt: `Generate a sleek mobile Freelance Price Quote for iPhone 15 display.
- Layout: 4 columns (Deliverable, Scope/Hrs, Rate, Subtotal), width ~380px.
- Sheet Name: 'quote'
- Items: UI/UX Wireframing (15 hrs @ $85), Frontend Web Development (30 hrs @ $95), SEO Setup ($450 flat), 1-Month Support ($600).
- Calculations: Subtotal (=SUM), Client Discount (10%), Net Quotation (=Subtotal-Discount), Valid for 30 Days note.
- Theme: Modern Indigo (#4F46E5 / #EEF2FF), clean currency format, execute via MCP.`
      },
      {
        id: "QUO-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "HVAC / Home Services Job Quote",
        description: "5-column mobile trade quote with equipment, parts, and labor lines.",
        prompt: `Create a mobile HVAC Commercial Installation Quote for iPhone 15 Pro Max.
- Layout: 5 columns (Item Description, Category, Qty, Unit Price, Amount), width ~415px.
- Sheet Name: 'hvacquote'
- Items: 4-Ton Heat Pump Unit ($3,850.00), Ductwork Modification ($950.00), Smart Thermostat ($280.00), Installation Labor (8 hrs @ $110/hr), Disposal Fee ($150.00).
- Summary: Equipment Subtotal, Labor Subtotal, State Rebate (-$500.00), Tax (6.5%), Total Proposed Investment.
- Theme: #4F46E5 header, bold totals, validate workbook integrity.`
      },
      {
        id: "QUO-03",
        device: "iPad 10th Gen (Tablet - 810 x 1080 px)",
        mode: "tablet.json",
        title: "Software & Cloud Architecture Formal Proposal",
        description: "8-column tablet commercial quotation with tiered options and payment milestones.",
        prompt: `Build a formal B2B Cloud Software Proposal & Price Quote for iPad 10th Gen.
- Layout: 8 columns (Milestone, Deliverable Description, Tech Stack, Qty/Seats, Unit Rate, Subtotal, Discount, Milestone Total).
- Sheet Name: 'CommercialQuote'
- Line Items: 6 development phases from Architecture Design to Cloud Deployment and Load Testing.
- Header: Client Name (Nexus Corp), Quote # (QUO-2026-092), Expiry Date, Payment Terms (50% Advance, 50% on UAT).
- Financials: Gross Quote, 8% Enterprise Discount, Taxable Value, GST (18%), Final Proposal Total.
- Theme: #4F46E5 primary, KPI cards for Project Duration, Total Days, and Total Investment.`
      },
      {
        id: "QUO-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Enterprise Turnkey IT Infrastructure Quotation",
        description: "10-column master quotation with hardware, software licenses, implementation, and recurring SLA tiers.",
        prompt: `Create an Enterprise Turnkey Infrastructure Price Quote for iPad Pro 12.9\".
- Layout: 10 columns across 2 sheets: 'QuotationMaster', 'RecurringSLA'.
- Quotation Sheet: 10 itemized capital expenditure lines (Servers, Firewalls, Switches, Fiber Cabling, Setup, Training).
- Recurring SLA Sheet: Tier 1 vs Tier 2 vs Tier 3 Monthly Maintenance comparison.
- Visuals: 4 Executive KPI Cards, Indigo #4F46E5 styling, terms & conditions block, and electronic approval sign-off.
- Build strictly using SocialCalc MCP tools.`
      }
    ]
  },
  {
    id: "05_cash_receipt",
    name: "Cash Receipt",
    category: "Business",
    theme: "#0D9488",
    prompts: [
      {
        id: "REC-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Point-of-Sale Quick Cash Receipt",
        description: "4-column mobile receipt for retail cash payment acknowledgment.",
        prompt: `Create a mobile Cash Receipt voucher for iPhone 15 Pro.
- Layout: 4 columns (Item Description, Qty, Unit Price, Amount), width ~380px.
- Sheet Name: 'receipt'
- Details: Receipt # CR-88102, Date, Received From (Sarah Jenkins), Purpose (Store Merchandise).
- Line Items: Leather Jacket ($180.00), Denim Jeans ($65.00), Cotton T-Shirt (2 @ $25.00).
- Calculations: Subtotal (=SUM), Cash Tendered ($350.00), Change Due (=Tendered-Subtotal).
- Theme: Teal #0D9488, white bold headers, centered transaction metadata, validate integrity.`
      },
      {
        id: "REC-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Service Deposit & Down Payment Cash Receipt",
        description: "5-column mobile receipt acknowledging advance payment for catering.",
        prompt: `Generate a mobile Cash Deposit Receipt on iPhone 15 Pro Max.
- Layout: 5 columns (Description, Event Date, Agreed Budget, Deposit Paid, Remaining Balance), width ~415px.
- Sheet Name: 'depositreceipt'
- Details: Wedding Catering Package ($4,500.00), Cash Deposit Received ($1,500.00), Balance Due on Delivery (=Budget-Deposit).
- Payment Confirmation: Cashier Name, Receipt Timestamp, Stamp/Signature acknowledgment block.
- Theme: #0D9488 primary, #CCFBF1 accent, explicit currency formatting ($#,##0.00).`
      },
      {
        id: "REC-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Daily Store Cash Reconciliation & Receipt Register",
        description: "8-column tablet cash journal recording all cash transactions and register drawer balancing.",
        prompt: `Build a Daily Cash Receipt & Register Balancing Journal for iPad Air 11\".
- Layout: 8 columns (Receipt #, Time, Customer Name, Description, Category, Cash In ($), Cash Out / Refund ($), Running Drawer Balance).
- Sheet Name: 'CashRegister'
- Records: 10 daily cash transactions showing starting float ($300.00), cash sales, petty cash expenses, and closing balance (=Previous+In-Out).
- Top KPIs: Opening Cash, Total Cash In, Total Payouts, Expected Drawer Cash.
- Theme: #0D9488 Teal, zebra striping, currency formats, and summary total row.`
      },
      {
        id: "REC-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Multi-Branch Cash Receipting & Bank Deposit Log",
        description: "10-column master cash audit sheet tracking multi-counter cash collections and armored pickup.",
        prompt: `Create a Master Commercial Cash Receipt & Bank Deposit Audit Log for iPad Pro 12.9\".
- Layout: 10 columns across 2 sheets: 'CashReceiptsLedger', 'BankDepositLog'.
- Receipts Sheet: 15 cash collection transactions across 3 store counters (Counter ID, Receipt #, Customer, Amount, Bill Denominations $100/$50/$20, Cashier).
- Deposit Sheet: Total Cash Counted, Armored Guard Pickup Slip #, Bank Deposit Verification.
- Visuals: 4 Executive KPI Cards, Teal #0D9488 styling, formula-driven totals, zero validation errors.`
      }
    ]
  },
  {
    id: "06_contractor_timesheet",
    name: "Contractor Timesheet",
    category: "Business",
    theme: "#334155",
    prompts: [
      {
        id: "TIME-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Weekly Single Contractor Timesheet",
        description: "5-column mobile weekly timesheet tracking daily hours and billable totals.",
        prompt: `Create a mobile Weekly Contractor Timesheet for iPhone 15 Pro.
- Layout: 5 columns (Day / Date, Project Name, Task Description, Hours, Billable Total), width ~380px.
- Sheet Name: 'timesheet'
- Rows: Monday through Friday work log for Senior Full-Stack Contractor (@ $85.00/hr).
- Calculations: Total Hours Worked (=SUM), Gross Billable Amount (=TotalHours*HourlyRate).
- Theme: Slate #334155 header, white bold text, number formatting (0.0 hrs, $#,##0.00).
- Run validate_workbook_integrity to confirm 0 errors.`
      },
      {
        id: "TIME-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Bi-Weekly Overtime & Expense Job Sheet",
        description: "5-column mobile contractor timesheet with overtime multipliers and reimbursable mileage.",
        prompt: `Generate a Bi-Weekly Contractor Timesheet with Overtime on iPhone 15 Pro Max.
- Layout: 5 columns (Date, Client, Regular Hours, OT Hours, Total Earned), width ~415px.
- Sheet Name: 'biweeklytime'
- Rates: Regular Rate ($65/hr), Overtime Rate (1.5x = $97.50/hr).
- Entries: 10 working days logging standard hours and 6 overtime hours.
- Footer: Reimbursable Materials ($145.00), Total Invoice Amount (=Wages+Reimbursement).
- Apply #334155 Slate styling and validate.`
      },
      {
        id: "TIME-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Multi-Contractor Project Hours & Cost Tracker",
        description: "8-column tablet timesheet tracking 8 subcontracted workers across job sites.",
        prompt: `Build a Multi-Contractor Project Timesheet & Budget Allocation Sheet for iPad Air 11\".
- Layout: 8 columns (Contractor Name, Trade/Role, Project Phase, Mon, Tue, Wed, Thu, Fri, Total Hours, Total Cost).
- Sheet Name: 'ProjectTimesheet'
- Data: 8 trade specialists (Electrician, Plumber, Drywall, Painter, Carpenter) logging 40-hour weeks with differing rates ($55 to $110/hr).
- Calculations: Total Hours per worker, Total Cost (=Hours*Rate), Daily Project Hours sum row.
- Theme: #334155 Slate header, KPI cards for Total Labor Spend & Total Project Hours.`
      },
      {
        id: "TIME-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Monthly Agency Timesheet, Billing & Margin Engine",
        description: "11-column master timesheet tracking billable vs non-billable hours, client billing, and contractor gross margins.",
        prompt: `Create a Monthly Agency Timesheet, Client Billing & Gross Margin Model for iPad Pro 12.9\".
- Layout: 11 columns across 2 sheets: 'MasterTimesheet', 'ClientInvoicing'.
- Columns: Contractor, Client Account, Project, Billable Hours, Non-Billable Hours, Pay Rate ($), Bill Rate ($), Contractor Cost, Client Billed, Gross Margin ($), Margin %.
- Top KPIs: Total Billed Revenue, Total Contractor Payout, Agency Gross Margin %, Total Billable Utilization Rate.
- Visuals: Slate #334155 styling, zebra striping, currency and percentage formats, execute strictly via MCP.`
      }
    ]
  },
  {
    id: "07_customer_invoice",
    name: "Customer Invoice",
    category: "Business",
    theme: "#2563EB",
    prompts: [
      {
        id: "CUST-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Simple Commercial Customer Invoice",
        description: "4-column mobile invoice for product sales with itemized subtotal and tax.",
        prompt: `Create a clean, mobile-optimized Customer Invoice for iPhone 15 Pro.
- Layout: 4 columns (Item Description, Qty, Unit Price, Line Total), width ~380px.
- Sheet Name: 'invoice'
- Header: Company Name (Apex Trading Co), Invoice # (INV-1092), Date, Customer (Blue Sky Retail).
- Line Items: 4 product lines (Display Monitors, USB-C Docks, Ergonomic Keyboards, Mousepads).
- Summary: Subtotal (=SUM), Standard Tax (8.5%), Shipping ($25.00), Total Amount Due.
- Theme: Royal Blue #2563EB, clean currency formats ($#,##0.00), validate integrity.`
      },
      {
        id: "CUST-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Service & Maintenance Billing Invoice",
        description: "5-column mobile invoice with discount codes and payment terms.",
        prompt: `Generate a mobile Service Billing Invoice for iPhone 15 Pro Max.
- Layout: 5 columns (Service Name, Description, Hours, Hourly Rate, Total), width ~415px.
- Sheet Name: 'serviceinvoice'
- Data: Security System Inspection (3 hrs @ $125/hr), Firmware Upgrade ($150), Sensor Replacement ($220).
- Formulas: Subtotal, Promotional Discount (-5%), Taxable Amount, Sales Tax (7.0%), Grand Total.
- Include Net 15 payment terms and bank deposit notes.
- Theme: #2563EB header, white bold text, execute via MCP.`
      },
      {
        id: "CUST-03",
        device: "iPad 10th Gen (Tablet - 810 x 1080 px)",
        mode: "tablet.json",
        title: "Comprehensive B2B Wholesale Customer Invoice",
        description: "8-column tablet invoice template supporting 12 products, shipping addresses, and GST breakdown.",
        prompt: `Build a comprehensive B2B Customer Invoice on iPad 10th Gen tablet.
- Layout: 8 columns (#, SKU, Product Description, Category, Qty, Unit Price, Disc %, Line Total).
- Sheet Name: 'Invoice'
- Header: Billed To / Shipped To addresses, Customer Tax ID, PO Number, Payment Due Date.
- Items: 10 wholesale consumer electronic goods with 5% bulk discounts on selected items.
- Financials: Gross Subtotal, Total Discounts, Net Taxable Value, CGST (9%), SGST (9%), Courier Freight, Total Due.
- Theme: #2563EB Blue, KPI cards for Items Count and Total Due, zero validation errors.`
      },
      {
        id: "CUST-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Master Customer Invoicing & Multi-Payment Ledger",
        description: "12-column master invoicing engine with itemized invoice generator, invoice register, and payments journal.",
        prompt: `Create a complete Master Customer Invoicing System for iPad Pro 12.9\".
- Sheets: 'InvoiceGenerator' (Active printable 15-item invoice), 'InvoiceRegister' (20 historical customer invoices), 'PaymentLog' (Payment settlements).
- Formulas: Automated cross-sheet lookups, tax calculations, balance outstanding (=GrandTotal-AmountPaid), and overdue days.
- Visuals: 4 Executive KPI Cards on Register, Blue #2563EB styling, complete currency formatting, and automated integrity validation.`
      }
    ]
  },
  {
    id: "08_inventory_lists",
    name: "Inventory Lists",
    category: "Business",
    theme: "#059669",
    prompts: [
      {
        id: "INV-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Retail Stock Count & Reorder Checklist",
        description: "5-column mobile inventory sheet tracking on-hand stock and reorder flags.",
        prompt: `Create a mobile Retail Stock Inventory & Reorder Checklist for iPhone 15 Pro.
- Layout: 5 columns (Item Name, SKU, In Stock, Min Level, Status), width ~385px.
- Sheet Name: 'inventory'
- Items: 8 retail grocery items (Coffee Beans, Almond Milk, Brown Sugar, Green Tea, etc.).
- Formula: Status column (=IF(InStock<=MinLevel, "REORDER", "OK")).
- Summary: Total SKU count, Total Units in Stock (=SUM).
- Theme: Emerald Green #059669 header, centered status badges, validate integrity.`
      },
      {
        id: "INV-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Warehouse Valuation & Asset Inventory",
        description: "5-column mobile inventory ledger with unit costs and total stock valuation.",
        prompt: `Generate an Inventory Valuation & Asset Sheet on iPhone 15 Pro Max.
- Layout: 5 columns (Item SKU, Description, Qty on Hand, Unit Cost, Total Value), width ~415px.
- Sheet Name: 'assetvaluation'
- Formula: Total Value (=QtyOnHand*UnitCost).
- Items: 8 computer hardware components (CPUs, GPUs, RAM sticks, SSDs, Power Supplies).
- Footer: Total Inventory Asset Value (=SUM), Average Unit Cost (=AVERAGE).
- Theme: #059669 primary, #D1FAE5 secondary, formatted currency ($#,##0.00).`
      },
      {
        id: "INV-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Perpetual Inventory Control & Supplier Tracking",
        description: "8-column tablet inventory sheet tracking received, sold, and safety stock levels.",
        prompt: `Build a Perpetual Inventory Control & Supplier Management Sheet for iPad Air 11\".
- Layout: 8 columns (SKU, Product Description, Category, Supplier, Starting Qty, Received, Sold, Current Stock).
- Sheet Name: 'PerpetualStock'
- Formula: Current Stock (=StartingQty + Received - Sold).
- Data: 12 warehouse SKUs spanning Raw Materials, Packaging, and Finished Goods.
- Cockpit: 3 KPI cards (Total Stock Units, Total Received This Month, Total Units Dispatched).
- Theme: Emerald #059669, zebra striping, centered quantities, zero validation errors.`
      },
      {
        id: "INV-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Master Enterprise Inventory, SKU Catalog & ABC Analysis",
        description: "12-column master inventory management model with stock turnover, unit economics, and ABC classification.",
        prompt: `Create a Master Enterprise Inventory & SKU Valuation System for iPad Pro 12.9\".
- Layout: 12 columns across 2 sheets: 'MasterInventory', 'SupplierDirectory'.
- Inventory Sheet: 20 SKUs with SKU, Name, Category, Location/Bin, Unit Cost, Selling Price, Margin %, Qty on Hand, Total Cost Value, Total Retail Value, Reorder Point, Stock Health.
- Features: 4 Executive KPI Cards (Total Inventory Value at Cost, Total Potential Retail Value, Out of Stock SKUs, Low Stock Alerts).
- Theme: #059669 Emerald styling, complete number formats, execute strictly via MCP.`
      }
    ]
  },
  {
    id: "09_monthly_rent_receipt",
    name: "Monthly Rent Receipt",
    category: "Business",
    theme: "#0D9488",
    prompts: [
      {
        id: "RENT-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Residential Tenant Rent Receipt",
        description: "4-column mobile rent payment receipt for a single apartment tenant.",
        prompt: `Create a mobile Monthly Rent Receipt for iPhone 15 Pro.
- Layout: 4 columns (Description / Item, Period, Paid Amount, Status), width ~380px.
- Sheet Name: 'rentreceipt'
- Details: Receipt # RENT-2026-02, Tenant Name (Alex Mercer), Property Address (Apt 4B, 742 Evergreen Terrace), Landlord (Oakmont Properties).
- Items: Monthly Apartment Rent ($1,850.00), Parking Space Fee ($150.00), Water Utility Share ($45.00).
- Calculations: Total Paid (=SUM), Payment Method (Zelle / Bank Transfer), Balance Remaining ($0.00).
- Theme: Teal #0D9488, clean bold headers, currency format ($#,##0.00), validate integrity.`
      },
      {
        id: "RENT-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Commercial Property Rent & CAM Fee Receipt",
        description: "5-column mobile receipt with common area maintenance and late fee calculations.",
        prompt: `Generate a Commercial Lease Rent Receipt for iPhone 15 Pro Max.
- Layout: 5 columns (Charge Description, Sq Ft / Basis, Base Rate, Amount ($), Payment Status), width ~415px.
- Sheet Name: 'commercialrent'
- Data: Retail Suite 101 Base Rent (1,200 sq ft @ $2.50/sq ft = $3,000.00), CAM Maintenance Fee ($350.00), Property Tax Surcharge ($180.00), Late Fee ($0.00).
- Summary: Total Billed (=SUM), Amount Paid ($3,530.00), Outstanding Balance ($0.00).
- Theme: #0D9488 header, white bold text, execute via MCP.`
      },
      {
        id: "RENT-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Multi-Unit Apartment Rent Roll & Receipt Register",
        description: "8-column tablet rent roll tracking 10 residential units, payment dates, and overdue rent.",
        prompt: `Build a Multi-Unit Apartment Rent Roll & Monthly Collection Ledger for iPad Air 11\".
- Layout: 8 columns (Unit #, Tenant Name, Lease Term, Monthly Rent ($), Payment Date, Paid Amount ($), Balance Due ($), Status).
- Sheet Name: 'RentRoll'
- Formula: Balance Due (=MonthlyRent - PaidAmount), Status (=IF(BalanceDue=0, "PAID", "OVERDUE")).
- Units: 10 apartment units with rents between $1,400 and $2,600.
- Summary Cards: Total Scheduled Rent, Total Collected Rent, Total Overdue Rent.
- Theme: #0D9488 Teal styling, zebra striping, currency formats, zero validation errors.`
      },
      {
        id: "RENT-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Property Management Annual Rent Collection & Revenue Dashboard",
        description: "12-column master property management workbook covering 12 months of rental collections across multi-building portfolios.",
        prompt: `Create a Master Property Management Rent Ledger & Annual Revenue Model for iPad Pro 12.9\".
- Layout: 12 columns across 2 sheets: 'RentCollectionMaster', 'AnnualIncomeSummary'.
- Master Sheet: 15 commercial and residential units logging tenant info, deposit held, monthly rent, payment method, late fees, and annual projected revenue (=MonthlyRent*12).
- Features: 4 Executive KPI Cards (Gross Potential Rent, Actual Collections, Economic Occupancy Rate, Total Security Deposits Held).
- Theme: Teal #0D9488, explicit value formatting ($#,##0), and automated integrity audit.`
      }
    ]
  },
  {
    id: "10_packing_slip",
    name: "Packing Slip",
    category: "Business",
    theme: "#475569",
    prompts: [
      {
        id: "PACK-01",
        device: "iPhone 15 Pro (Mobile - 393 x 852 px)",
        mode: "mobile.json",
        title: "Order Dispatch & Box Packing Slip",
        description: "4-column mobile packing slip verifying items, quantities ordered vs shipped.",
        prompt: `Create a mobile Packing Slip spreadsheet for iPhone 15 Pro.
- Layout: 4 columns (Item SKU, Product Description, Qty Ordered, Qty Shipped), width ~380px.
- Sheet Name: 'packingslip'
- Header: Order # (ORD-9941), Ship Date, Carrier (FedEx Ground), Tracking #, Consignee (Green Leaf Cafe).
- Items: 5 shipped items (Espresso Cups, Coffee Filters, Syrups, Milk Pitchers, Napkins).
- Summary: Total Items Ordered (=SUM), Total Items Shipped (=SUM), Discrepancy (=Ordered-Shipped).
- Theme: Slate #475569, clean alignment (SKU center, Description left, Qty center), validate integrity.`
      },
      {
        id: "PACK-02",
        device: "iPhone 15 Pro Max (Large Mobile - 430 x 932 px)",
        mode: "mobile.json",
        title: "Warehouse Multi-Package Shipping Manifest",
        description: "5-column mobile manifest with box weights and package identifiers.",
        prompt: `Generate a mobile Multi-Package Shipping Manifest for iPhone 15 Pro Max.
- Layout: 5 columns (Package #, SKU, Description, Qty, Weight (lbs)), width ~415px.
- Sheet Name: 'shipmanifest'
- Data: 6 package parcels containing hardware parts, with individual weights (4.5 lbs, 8.2 lbs, 12.0 lbs, etc.).
- Summary: Total Packages Count, Total Units Shipped, Total Shipment Weight (=SUM).
- Signature Block: Packed By, Inspected By, Courier Pickup Sign-off.
- Theme: #475569 header, white bold text, execute via MCP.`
      },
      {
        id: "PACK-03",
        device: "iPad Air 11\" (Tablet - 820 x 1180 px)",
        mode: "tablet.json",
        title: "Wholesale Order Packing Slip & Backorder Tracker",
        description: "8-column tablet packing slip tracking fulfilled quantities, backordered items, and bin locations.",
        prompt: `Build a Wholesale Packing Slip & Backorder Fulfillment Sheet for iPad Air 11\".
- Layout: 8 columns (Line #, Item Code, Description, Bin Location, Qty Ordered, Qty Shipped, Backordered, Fulfillment Status).
- Sheet Name: 'PackingSlip'
- Formula: Backordered (=QtyOrdered - QtyShipped), Status (=IF(Backordered=0, "FULFILLED", "PARTIAL")).
- Items: 10 wholesale parts with 2 items currently backordered.
- Top KPIs: Total Items Ordered, Total Shipped Units, Backorder Units Count.
- Theme: #475569 Slate, zebra striping, centered codes, zero validation errors.`
      },
      {
        id: "PACK-04",
        device: "iPad Pro 12.9\" (Widescreen - 1024 x 1366 px)",
        mode: "tablet.json",
        title: "Enterprise Freight Logistics & Container Packing Dossier",
        description: "11-column master shipping & export customs packing dossier tracking palletized cargo.",
        prompt: `Create a Master Freight Logistics & Container Packing Dossier for iPad Pro 12.9\".
- Layout: 11 columns across 2 sheets: 'ContainerPackingSlip', 'PalletWeights'.
- Slip Sheet: 15 export shipment lines (Pallet #, Harmonized HS Code, Commercial Description, Qty, Packaging Type, Net Weight kg, Gross Weight kg, Volume CBM, Country of Origin, Customs Value $).
- Calculations: Total Pallets, Total Net Weight, Total Gross Weight, Total Volume CBM, Total Customs Declared Value.
- Visuals: 4 Executive KPI Cards, Slate #475569 styling, complete value formatting, and automated integrity validation.`
      }
    ]
  }
];

// Write individual prompt markdown files and master JSON
let totalPromptsCount = 0;
const allPromptsIndex = [];

for (const app of apps) {
  const appPromptFile = path.join(promptsDir, `${app.id}.md`);
  let content = `# User Prompts: ${app.name} (${app.category})\n\n`;
  content += `> **Theme Color**: \`${app.theme}\` | **Total Prompts**: 4\n\n---\n\n`;

  app.prompts.forEach((p, idx) => {
    totalPromptsCount++;
    allPromptsIndex.push({
      promptId: p.id,
      appName: app.name,
      category: app.category,
      device: p.device,
      mode: p.mode,
      title: p.title,
      description: p.description,
      promptText: p.prompt
    });

    content += `## Prompt ${idx + 1}: ${p.title} (${p.id})\n\n`;
    content += `- **Target Device**: ${p.device}\n`;
    content += `- **Target Mode**: \`${p.mode}\`\n`;
    content += `- **Scenario**: ${p.description}\n\n`;
    content += `### Prompt Text:\n\`\`\`text\n${p.prompt}\n\`\`\`\n\n---\n\n`;
  });

  fs.writeFileSync(appPromptFile, content);
  console.log(`✅ Wrote 4 prompts for: ${app.name} -> ${app.id}.md`);
}

// Master README & JSON
fs.writeFileSync(
  path.join(promptsDir, "README.md"),
  `# SocialCalc MCP Specialized Test Prompts (40 Prompts)

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
2. Call \`create_full_workbook\` with appropriate lowercased sheet names.
3. Apply the official brand theme color tokens.
4. Populate all tables using \`insert_table\` with exact number formats.
5. Conclude with \`validate_workbook_integrity\` to certify 0 errors.
`
);

fs.writeFileSync(
  path.join(promptsDir, "all_prompts.json"),
  JSON.stringify(allPromptsIndex, null, 2)
);

console.log(`\n🎉 Successfully generated ${totalPromptsCount} user prompts in Socialcalc-MCP/prompts/!`);
