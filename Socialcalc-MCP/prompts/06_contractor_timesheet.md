# User Prompts: Contractor Timesheet (Business)

> **Theme Color**: `#334155` | **Total Prompts**: 4

---

## Prompt 1: Weekly Single Contractor Timesheet (TIME-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile weekly timesheet tracking daily hours and billable totals.

### Prompt Text:
```text
Create a mobile Weekly Contractor Timesheet for iPhone 15 Pro.
- Layout: 5 columns (Day / Date, Project Name, Task Description, Hours, Billable Total), width ~380px.
- Sheet Name: 'timesheet'
- Rows: Monday through Friday work log for Senior Full-Stack Contractor (@ $85.00/hr).
- Calculations: Total Hours Worked (=SUM), Gross Billable Amount (=TotalHours*HourlyRate).
- Theme: Slate #334155 header, white bold text, number formatting (0.0 hrs, $#,##0.00).
- Run validate_workbook_integrity to confirm 0 errors.
```

---

## Prompt 2: Bi-Weekly Overtime & Expense Job Sheet (TIME-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile contractor timesheet with overtime multipliers and reimbursable mileage.

### Prompt Text:
```text
Generate a Bi-Weekly Contractor Timesheet with Overtime on iPhone 15 Pro Max.
- Layout: 5 columns (Date, Client, Regular Hours, OT Hours, Total Earned), width ~415px.
- Sheet Name: 'biweeklytime'
- Rates: Regular Rate ($65/hr), Overtime Rate (1.5x = $97.50/hr).
- Entries: 10 working days logging standard hours and 6 overtime hours.
- Footer: Reimbursable Materials ($145.00), Total Invoice Amount (=Wages+Reimbursement).
- Apply #334155 Slate styling and validate.
```

---

## Prompt 3: Multi-Contractor Project Hours & Cost Tracker (TIME-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 8-column tablet timesheet tracking 8 subcontracted workers across job sites.

### Prompt Text:
```text
Build a Multi-Contractor Project Timesheet & Budget Allocation Sheet for iPad Air 11".
- Layout: 8 columns (Contractor Name, Trade/Role, Project Phase, Mon, Tue, Wed, Thu, Fri, Total Hours, Total Cost).
- Sheet Name: 'ProjectTimesheet'
- Data: 8 trade specialists (Electrician, Plumber, Drywall, Painter, Carpenter) logging 40-hour weeks with differing rates ($55 to $110/hr).
- Calculations: Total Hours per worker, Total Cost (=Hours*Rate), Daily Project Hours sum row.
- Theme: #334155 Slate header, KPI cards for Total Labor Spend & Total Project Hours.
```

---

## Prompt 4: Monthly Agency Timesheet, Billing & Margin Engine (TIME-04)

- **Target Device**: iPad Pro 12.9" (Widescreen - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 11-column master timesheet tracking billable vs non-billable hours, client billing, and contractor gross margins.

### Prompt Text:
```text
Create a Monthly Agency Timesheet, Client Billing & Gross Margin Model for iPad Pro 12.9".
- Layout: 11 columns across 2 sheets: 'MasterTimesheet', 'ClientInvoicing'.
- Columns: Contractor, Client Account, Project, Billable Hours, Non-Billable Hours, Pay Rate ($), Bill Rate ($), Contractor Cost, Client Billed, Gross Margin ($), Margin %.
- Top KPIs: Total Billed Revenue, Total Contractor Payout, Agency Gross Margin %, Total Billable Utilization Rate.
- Visuals: Slate #334155 styling, zebra striping, currency and percentage formats, execute strictly via MCP.
```

---

