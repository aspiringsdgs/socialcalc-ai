import SocialCalcFromCore from "./core/index.js";

// Use the imported SocialCalc
let SocialCalc = SocialCalcFromCore;

// Ensure SocialCalc is loaded from the global scope
if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  console.error("SocialCalc not found in global scope");
  SocialCalc = {}; // Fallback to prevent errors
}

// Export SocialCalc reference if needed elsewhere
export { SocialCalc };

// Re-export all functions from modules to maintain backward compatibility
export * from "./modules/device.js";
export * from "./modules/init.js";
export * from "./modules/sheets.js";
export * from "./modules/logos.js";
export * from "./modules/history.js";
export * from "./modules/formatting.js";
export * from "./modules/listeners.js";
export * from "./modules/exporters.js";
export * from "./modules/prompts.js";
export * from "./modules/utils.js";
export * from "./modules/weight.js";
export * from "./modules/touch-scroll.js";
export * from "./modules/plugin-manager.js";
export * from "./modules/row-col-headers.js";
export * from "./modules/horizontal-scroll.js";
export * from "./modules/grid-lines.js";
export * from "./modules/editable-cells.js";
export * from "./modules/invoice.js";
export { HorizontalScrollBar } from "./components/HorizontalScrollBar.tsx";
export { CellEditModal, FONT_COLORS, BG_COLORS } from "./components/CellEditModal/CellEditModal.tsx";
export { RowActionPopover } from "./components/RowActionPopover/RowActionPopover.tsx";
export { EditableCellsModal, parseAppMappingToItems } from "./components/EditableCellsModal/EditableCellsModal.tsx";
export { DemoVideosModal, FORMULA_GUIDES } from "./components/DemoVideosModal/DemoVideosModal.tsx";
export { compressImage } from "./utils/imageCompressor.ts";
