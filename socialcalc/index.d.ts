import React from "react";

export const SocialCalc: any;

// Module exports
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
export * from "./modules/agent.js";

// React & Ionic UI Components
export interface HorizontalScrollBarProps {
  sheetId?: string;
  className?: string;
}
export const HorizontalScrollBar: React.FC<any>;

export interface CellEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData?: any;
  onSave?: (data: any) => void;
  [key: string]: any;
}
export const CellEditModal: React.FC<any>;
export const FONT_COLORS: string[];
export const BG_COLORS: string[];

export interface RowActionPopoverProps {
  isOpen: boolean;
  event?: any;
  onDismiss: () => void;
  selectedRow?: number | null;
  [key: string]: any;
}
export const RowActionPopover: React.FC<any>;

export interface EditableCellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any;
}
export const EditableCellsModal: React.FC<any>;
export function parseAppMappingToItems(mapping: any): any[];

export interface DemoVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: any;
}
export const DemoVideosModal: React.FC<any>;
export const FORMULA_GUIDES: any[];

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMapping?: any;
  currentSheet?: string;
  onExecute?: (result: any) => void;
  [key: string]: any;
}
export const AgentModal: React.FC<any>;

export function compressImage(file: File, options?: any): Promise<string>;
