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

export type AgentModalTabId = "actions" | "context" | "schemas" | "console";

export type AgentModalThemePreset =
  | "default"
  | "indigo"
  | "dark"
  | "midnight"
  | "light"
  | "minimal"
  | "emerald"
  | "purple"
  | "violet"
  | "slate"
  | "monochrome";

export interface AgentModalThemeConfig {
  mode?: "light" | "dark";
  preset?: AgentModalThemePreset;
  primaryColor?: string;
  primaryGradient?: string;
  headerBackground?: string;
  headerTextColor?: string;
  headerIconColor?: string;
  contentBackground?: string;
  cardBackground?: string;
  cardBorder?: string;
  textColor?: string;
  textMuted?: string;
  copilotBackground?: string;
  copilotBorder?: string;
}

export type AgentModalTheme = AgentModalThemePreset | AgentModalThemeConfig;

export interface AgentPromptSuggestion {
  label: string;
  prompt: string;
  category?: string;
}
export const DEFAULT_GENERIC_SUGGESTIONS: AgentPromptSuggestion[];
export const DEFAULT_INVOICE_SUGGESTIONS: AgentPromptSuggestion[];

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMapping?: any;
  currentSheet?: string;
  onExecute?: (result: any) => void;
  enabledTabs?: AgentModalTabId[];
  showActionsTab?: boolean;
  showContextTab?: boolean;
  showSchemasTab?: boolean;
  showConsoleTab?: boolean;
  hideTabHeaders?: boolean;
  hideHeaders?: boolean;
  hideTabBar?: boolean;
  defaultTab?: AgentModalTabId;
  title?: string;
  headerTitle?: string;
  headerIcon?: any;
  icon?: any;
  headerIconColor?: string;
  headerColor?: string;
  headerBackground?: string;
  headerBg?: string;
  headerTextColor?: string;
  versionTag?: string | null | false;
  headerSubtitle?: string;
  copilotTitle?: string;
  copilotIcon?: any;
  copilotIconColor?: string;
  showPluginTest?: boolean;
  showQuickActions?: boolean;
  hidePluginTest?: boolean;
  suggestions?: AgentPromptSuggestion[] | "generic" | "invoice" | boolean;
  suggestionsTitle?: string;
  showSuggestions?: boolean;
  theme?: AgentModalTheme;
  apiEndpoint?: string;
  promptPlaceholder?: string;
  [key: string]: any;
}
export const AgentModal: React.FC<AgentModalProps>;

export interface AgentPluginTestProps {
  currentSheet?: string;
  appMapping?: any;
  context?: any;
  onExecute?: (result: any) => void;
  onLog?: (msg: string) => void;
  refreshContext?: () => void;
  title?: string;
  subtitle?: string;
  showCustomJson?: boolean;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}
export const AgentPluginTest: React.FC<AgentPluginTestProps>;
export const Agentplugintest: React.FC<AgentPluginTestProps>;

export function compressImage(file: File, options?: any): Promise<string>;

