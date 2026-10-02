# SocialCalc Modularization

## 📊 SocialCalc File Breakdown

The original SocialCalc spreadsheet engine was contained in a single monolithic file: `SocialCalc.js`. This large file has now been broken down into focused, modular files within `src/components/socialcalc/core/` for better maintainability and development experience.

## Core Module Structure

The `src/components/socialcalc/core/` directory contains the following modularized files:

| File | Purpose | Description |
|------|---------|-------------|
| **`constants.js`** | Configuration & Localization | Contains all constants, strings, and configuration values used throughout SocialCalc. This is the main place for localization and customization of labels and settings. |
| **`core.js`** | Core Spreadsheet Logic | Implements the core spreadsheet logic, including cell and sheet data structures, calculation engine, and essential functions for manipulating spreadsheet data. |
| **`format-number.js`** | Number Formatting | Handles number formatting, including currency, percentage, and custom formats. Ensures that spreadsheet values are displayed according to user preferences and locale. |
| **`formula.js`** | Formula Engine | Provides formula parsing and calculation capabilities. This module interprets spreadsheet formulas and computes their results, supporting a wide range of functions. |
| **`table-editor.js`** | Grid UI & Interactions | Manages the table/grid UI, including rendering, scrolling, and user interactions like keyboard and mouse input. Responsible for the spreadsheet's visual editing experience. |
| **`spreadsheet-control.js`** | High-level Controls | Offers high-level controls for embedding the spreadsheet in a web page, including toolbars and UI integration. Enables features like multi-sheet management and advanced controls. |
| **`index.js`** | Module Entry Point | Entry point that imports all the above modules in the correct order and exposes the global `SocialCalc` object for use throughout the app. |

## Modularization Benefits

> **📝 Legacy to Modern:**  
> The monolithic `SocialCalc.js` file has been modernized and split into these focused modules, providing:
> 
> - **Better Maintainability**: Each module handles a specific aspect of spreadsheet functionality
> - **Improved Scalability**: Easier to extend and modify individual components
> - **Enhanced Development Experience**: Clearer code organization and easier debugging
> - **Modular Loading**: Ability to load only required functionality
> - **Better Testing**: Individual modules can be tested in isolation

# socialcalc-ai
