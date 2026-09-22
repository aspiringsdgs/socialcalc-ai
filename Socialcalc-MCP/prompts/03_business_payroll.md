# User Prompts: Business Payroll (Business)

> **Theme Color**: `#1E3A8A` | **Total Prompts**: 4

---

## Prompt 1: Individual Employee Bi-Weekly Paystub (PAY-01)

- **Target Device**: iPhone 15 Pro (Mobile - 393 x 852 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 4-column mobile employee pay statement showing earnings and statutory deductions.

### Prompt Text:
```text
Create a mobile Employee Paystub spreadsheet for iPhone 15 Pro.
- Layout: 4 columns (Earnings / Deduction Item, Hours/Rate, Current Period ($), YTD Total ($)), width ~380px.
- Sheet Name: 'paystub'
- Data: Regular Pay (80 hrs @ $32.50/hr), Overtime Pay (5 hrs @ $48.75/hr), Federal Income Tax (12%), State Tax (5%), FICA Social Security (6.2%), Medicare (1.45%), Health Insurance Deduction ($120.00).
- Formulas: Gross Pay (=Reg+OT), Total Deductions (=SUM), Net Pay (=Gross-Deductions).
- Theme: Corporate Blue (#1E3A8A / #DBEAFE), bold title banner, currency formatting.
- Execute via MCP tools with 0 validation errors.
```

---

## Prompt 2: Small Team Weekly Payroll Summary (PAY-02)

- **Target Device**: iPhone 15 Pro Max (Large Mobile - 430 x 932 px)
- **Target Mode**: `mobile.json`
- **Scenario**: 5-column mobile payroll tracker for a 6-person crew.

### Prompt Text:
```text
Generate a compact Weekly Payroll Register for a 6-employee retail crew on iPhone 15 Pro Max.
- Layout: 5 columns (Employee Name, Reg Hours, OT Hours, Gross Pay, Net Pay), width ~415px.
- Sheet Name: 'payrollsummary'
- Formulas: Gross Pay (=RegHrs*Rate + OTHrs*Rate*1.5), Net Pay (=GrossPay*0.78).
- Include Total Summary Row summing all hours, gross wages, and net disbursements.
- Theme: #1E3A8A header, bold KPI metric for Total Payroll Outflow, currency formatted.
```

---

## Prompt 3: Comprehensive Monthly Company Payroll Journal (PAY-03)

- **Target Device**: iPad Air 11" (Tablet - 820 x 1180 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 9-column tablet payroll journal for 15 salaried and hourly employees with full tax withholding.

### Prompt Text:
```text
Build a complete Monthly Business Payroll Journal for iPad Air 11".
- Layout: 9 columns (Emp ID, Name, Department, Base Salary, Overtime, Gross Pay, Fed Tax, FICA/State, Net Pay).
- Sheet Name: 'PayrollJournal'
- Employees: 15 staff members across Engineering, Sales, Support, and Operations.
- Calculations: Automated Gross Pay, 15% Federal Tax, 7.65% FICA, Net Pay (=Gross-Fed-FICA).
- Executive Cockpit: 3 KPI cards (Total Gross Payroll, Total Tax Withheld, Net Payout).
- Theme: #1E3A8A primary, #DBEAFE accent, zebra striping, and auto-computed summary total row.
```

---

## Prompt 4: Enterprise Multi-Department Payroll & Benefits Allocator (PAY-04)

- **Target Device**: iPad Pro 12.9" (Widescreen Tablet - 1024 x 1366 px)
- **Target Mode**: `tablet.json`
- **Scenario**: 12-column master payroll system with employer contributions, 401k match, and department subtotals.

### Prompt Text:
```text
Create an enterprise Payroll, Tax & Benefits Allocation Model for iPad Pro 12.9".
- Layout: 12 columns across 2 sheets: 'PayrollRegister', 'DepartmentSummary'.
- Columns: Emp ID, Full Name, Title, Dept, Hourly Rate, Regular Hours, OT Hours, Gross Pay, 401k Pre-Tax (5%), Fed Tax (18%), FICA (7.65%), Net Pay.
- Department Summary: Aggregate total spend for Engineering, Sales, Product, Marketing, and G&A using SUM formulas.
- Styling: Deep Navy (#1E3A8A), 4 KPI cards, professional value formatting ($#,##0.00), and automated audit pass.
```

---

