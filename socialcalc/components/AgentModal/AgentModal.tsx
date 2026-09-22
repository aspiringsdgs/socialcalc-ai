import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from "@ionic/react";
import {
  closeOutline,
  sparklesOutline,
  playOutline,
  copyOutline,
  checkmarkOutline,
  codeSlashOutline,
  terminalOutline,
  informationCircleOutline,
  searchOutline,
  refreshOutline,
  chevronDownOutline,
  chevronUpOutline,
  layersOutline,
  gridOutline,
  documentTextOutline,
  trashOutline,
  cubeOutline,
  calculatorOutline,
  flashOutline,
} from "ionicons/icons";
import {
  getAgentContext,
  exportAgentContext,
  getAgentToolDefinitions,
  generateAgentSystemPrompt,
  executeAgentActions,
  parseAgentResponse,
} from "../../modules/agent.js";
import { marked } from "marked";
import { AgentPluginTest } from "../AgentPluginTest/AgentPluginTest";
import "./AgentModal.css";

export type AgentModalTabId = "actions" | "context" | "schemas" | "console";

export type AgentModalThemePreset =
  | "default"
  | "slate"
  | "neutral"
  | "corporate"
  | "blue"
  | "indigo"
  | "dark"
  | "midnight"
  | "light"
  | "minimal"
  | "emerald"
  | "purple"
  | "violet"
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

  // In-Depth Copilot & Actions Customization
  copilotBackground?: string;
  copilotBorder?: string;
  copilotShadow?: string;
  copilotTitleColor?: string;
  copilotBadgeBackground?: string;
  copilotBadgeColor?: string;
  copilotBadgeBorder?: string;
  copilotTextareaBackground?: string;
  copilotTextareaBorder?: string;
  copilotFocusBorder?: string;
  copilotFocusShadow?: string;
  suggestionsTitleColor?: string;
  suggestionsColor?: string;
  chipBackground?: string;
  chipBorder?: string;
  chipColor?: string;
  chipHoverBackground?: string;
  chipHoverBorder?: string;
  chipHoverColor?: string;
  primaryButtonBackground?: string;
  primaryButtonColor?: string;
  primaryButtonHoverBackground?: string;
  primaryButtonShadow?: string;

  // Custom style overrides
  customStyles?: Record<string, string>;
  copilotCardStyle?: React.CSSProperties;
  primaryButtonStyle?: React.CSSProperties;
}

export type AgentModalTheme = AgentModalThemePreset | AgentModalThemeConfig;

export interface AgentPromptSuggestion {
  label: string;
  prompt: string;
  category?: string;
}

export const DEFAULT_GENERIC_SUGGESTIONS: AgentPromptSuggestion[] = [
  {
    label: "Summarize Sheet",
    prompt: "Summarize the key data, totals, and primary insights from this spreadsheet.",
  },
  {
    label: "Explain Formulas",
    prompt: "Identify and explain the key formulas, calculations, and totals present in this sheet.",
  },
  {
    label: "Draft Summary Email",
    prompt: "Draft a concise, professional summary email communicating the figures in this sheet.",
  },
  {
    label: "Compute Totals",
    prompt: "Identify any numeric columns needing totals and apply the appropriate SUM formulas.",
  },
];

export const DEFAULT_INVOICE_SUGGESTIONS: AgentPromptSuggestion[] = [
  {
    label: "Fill Invoice Header",
    prompt: "Fill the invoice header with client name, address, current date, and invoice number.",
  },
  {
    label: "Add Line Items",
    prompt: "Populate line items with service descriptions, quantities/hours, and unit amounts.",
  },
  {
    label: "Summarize Balance",
    prompt: "Summarize the line items, calculate the balance due, and note payment terms.",
  },
  {
    label: "Draft Payment Request",
    prompt: "Draft a polite payment request email to the client using this invoice context.",
  },
  {
    label: "Apply Total Formula",
    prompt: "Set the total cell to compute the sum of all item amount cells.",
  },
];

export interface AgentModalTabDefinition {
  id: AgentModalTabId;
  label: string;
  icon: any;
  getBadge?: (ctx: any, logs: string[]) => number | null;
}

export const ALL_AGENT_MODAL_TABS: AgentModalTabDefinition[] = [
  { id: "actions", label: "AI Copilot & Actions", icon: sparklesOutline },
  { id: "context", label: "Sheet Context", icon: gridOutline, getBadge: (ctx) => ctx?.editableCells?.length || 0 },
  { id: "schemas", label: "LLM Schemas", icon: codeSlashOutline },
  { id: "console", label: "Console", icon: terminalOutline, getBadge: (_, logs) => logs.length },
];

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMapping?: any;
  currentSheet?: string;
  onExecute?: (result: any) => void;

  /**
   * Array of tab IDs to include in the modal.
   * Allows developers to choose any combination of:
   * ["actions", "context", "schemas", "console"]
   */
  enabledTabs?: AgentModalTabId[];

  /**
   * Individual boolean flags to include/exclude specific tabs:
   */
  showActionsTab?: boolean; // default: true
  showContextTab?: boolean; // default: true
  showSchemasTab?: boolean; // default: true
  showConsoleTab?: boolean; // default: true

  /**
   * Option to completely hide the tab header/navigation bar.
   * When true, only the active tab content is displayed with no tab header bar above it.
   * Aliases supported: `hideHeaders`, `hideTabBar`.
   */
  hideTabHeaders?: boolean;
  hideHeaders?: boolean;
  hideTabBar?: boolean;

  /**
   * Default active tab when the modal opens.
   * If not provided, defaults to the first enabled tab.
   */
  defaultTab?: AgentModalTabId;

  /**
   * Custom title for the modal window header.
   * Aliases: `title`, `headerTitle`.
   * Default: "SocialCalc AI Agent Workbench"
   */
  title?: string;
  headerTitle?: string;

  /**
   * Custom icon for the modal window header.
   * Pass an Ionicon (e.g. sparklesOutline, robotOutline, flashOutline),
   * a ReactNode, or false/null to hide.
   * Aliases: `headerIcon`, `icon`.
   * Default: sparklesOutline
   */
  headerIcon?: any;
  icon?: any;

  /**
   * Custom color for the modal window header icon.
   * Default: "#a855f7"
   */
  headerIconColor?: string;

  /**
   * Custom background color or CSS gradient for the modal window header toolbar.
   * Aliases: `headerColor`, `headerBackground`, `headerBg`.
   * Default: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)"
   */
  headerColor?: string;
  headerBackground?: string;
  headerBg?: string;

  /**
   * Custom text color for the modal window header.
   * Default: "#ffffff"
   */
  headerTextColor?: string;

  /**
   * Optional version tag or subtitle in the header.
   * Default: undefined (no badge rendered)
   */
  versionTag?: string | null | false;
  headerSubtitle?: string;

  /**
   * Custom title for the AI Copilot card inside the Actions tab.
   * Default: "Agentic Text-Editor Copilot"
   */
  copilotTitle?: string;

  /**
   * Custom icon for the AI Copilot card inside the Actions tab.
   * Pass false or null to hide.
   * Default: sparklesOutline
   */
  copilotIcon?: any;

  /**
   * Custom color for the AI Copilot card icon inside the Actions tab.
   */
  copilotIconColor?: string;

  /**
   * Show or hide the removable Direct Plugin Quick Actions & Custom JSON test component (AgentPluginTest).
   * Set to false to remove it and display a pure AI Copilot chat interface.
   * Aliases: `showQuickActions`, `hidePluginTest`.
   * Default: true.
   */
  showPluginTest?: boolean;
  showQuickActions?: boolean;
  hidePluginTest?: boolean;

  /**
   * Developer suggestions configuration:
   * - `AgentPromptSuggestion[]`: Custom array of `{ label, prompt }` items
   * - `"generic"`: Uses built-in generic spreadsheet suggestions (DEFAULT_GENERIC_SUGGESTIONS)
   * - `"invoice"`: Uses built-in invoice suggestions (DEFAULT_INVOICE_SUGGESTIONS)
   * - `false` / empty: No suggestions displayed (clean copilot interface)
   * Default: undefined (no suggestions rendered by default)
   */
  suggestions?: AgentPromptSuggestion[] | "generic" | "invoice" | boolean;

  /**
   * Custom title displayed above the suggestion chips (e.g. "Try asking:", "Quick Prompts:")
   * Default: "Suggestions:"
   */
  suggestionsTitle?: string;

  /**
   * Explicitly show or hide the suggestion chips row.
   */
  showSuggestions?: boolean;

  /**
   * Overall visual theme for the Agent Modal:
   * - Presets: `"default"` | `"slate"` | `"neutral"` | `"corporate"` | `"blue"` | `"indigo"` | `"dark"` | `"midnight"` | `"light"` | `"minimal"` | `"emerald"` | `"purple"` | `"violet"` | `"monochrome"`
   * - Custom Theme Object: `{ mode?: "light" | "dark", primaryColor?: string, copilotBackground?: string, ... }`
   * Default: `"default"` (Clean executive slate & neutral)
   */
  theme?: AgentModalTheme;

  /**
   * Direct copilot background override (CSS string, color, or gradient).
   */
  copilotBackground?: string;

  /**
   * Direct copilot border style or color override.
   */
  copilotBorder?: string;
  copilotBorderColor?: string;

  /**
   * Direct copilot card title color.
   */
  copilotTitleColor?: string;

  /**
   * Direct color for the suggestions row title label.
   */
  suggestionsTitleColor?: string;
  suggestionsColor?: string;

  /**
   * Direct background color for prompt suggestion chips.
   */
  chipBackground?: string;

  /**
   * Direct border color for prompt suggestion chips.
   */
  chipBorder?: string;

  /**
   * Direct text color for prompt suggestion chips.
   */
  chipColor?: string;

  /**
   * Direct background color or gradient for the primary execute button.
   */
  primaryButtonBackground?: string;
  primaryButtonBg?: string;

  /**
   * Direct text color for the primary execute button.
   */
  primaryButtonColor?: string;

  /**
   * Custom inline style object for the Copilot Card container.
   */
  copilotCardStyle?: React.CSSProperties;

  /**
   * Custom inline style object for the primary execute button.
   */
  primaryButtonStyle?: React.CSSProperties;

  /**
   * AI Agent Service API Endpoint URL.
   * Default: "/agent/socialcalc/test"
   */
  apiEndpoint?: string;

  /**
   * Optional custom request headers or an async function returning headers (e.g. for Bearer auth).
   */
  apiHeaders?: Record<string, string> | (() => Promise<Record<string, string>> | Record<string, string>);

  /**
   * Custom placeholder for the AI prompt textarea.
   */
  promptPlaceholder?: string;

  [key: string]: any;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  appMapping,
  currentSheet = "sheet1",
  onExecute,
  enabledTabs,
  showActionsTab = true,
  showContextTab = true,
  showSchemasTab = true,
  showConsoleTab = true,
  hideTabHeaders = false,
  hideHeaders = false,
  hideTabBar = false,
  defaultTab,
  title,
  headerTitle,
  headerIcon,
  icon,
  headerIconColor,
  headerColor,
  headerBackground,
  headerBg,
  headerTextColor,
  versionTag,
  headerSubtitle,
  copilotTitle = "AI Copilot",
  copilotIcon,
  copilotIconColor,
  copilotBackground,
  copilotBorder,
  copilotBorderColor,
  copilotTitleColor,
  suggestionsTitleColor,
  suggestionsColor,
  chipBackground,
  chipBorder,
  chipColor,
  primaryButtonBackground,
  primaryButtonBg,
  primaryButtonColor,
  copilotCardStyle,
  primaryButtonStyle,
  showPluginTest = true,
  showQuickActions = true,
  hidePluginTest = false,
  suggestions,
  suggestionsTitle = "Suggestions:",
  showSuggestions,
  theme = "default",
  apiEndpoint,
  apiHeaders,
  promptPlaceholder = "e.g. 'Fill cell C5 with Client Name, set F21 to 500' or 'Summarize this spreadsheet for me'...",
}) => {
  // Resolve theme preset and custom styles
  const themePreset: AgentModalThemePreset = useMemo(() => {
    if (!theme) return "default";
    if (typeof theme === "string") return theme;
    if (typeof theme === "object") {
      if (theme.preset) return theme.preset;
      if (theme.mode === "dark") return "dark";
      if (theme.mode === "light") return "light";
    }
    return "default";
  }, [theme]);

  const customThemeStyles = useMemo((): React.CSSProperties => {
    const themeObj = typeof theme === "object" ? theme : {};
    const styles: Record<string, string> = {};

    if (themeObj.contentBackground) styles["--background"] = themeObj.contentBackground;
    if (themeObj.cardBackground) styles["--sc-card-bg"] = themeObj.cardBackground;
    if (themeObj.cardBorder) styles["--sc-card-border"] = themeObj.cardBorder;
    if (themeObj.textColor) styles["--sc-text-main"] = themeObj.textColor;
    if (themeObj.textMuted) styles["--sc-text-muted"] = themeObj.textMuted;
    if (themeObj.primaryColor) styles["--sc-primary"] = themeObj.primaryColor;
    if (themeObj.primaryGradient) styles["--sc-primary-gradient"] = themeObj.primaryGradient;

    // Copilot Card In-Depth Styles
    const copilotBg = copilotBackground || themeObj.copilotBackground;
    if (copilotBg) styles["--sc-copilot-bg"] = copilotBg;

    const copilotBdr = copilotBorder || copilotBorderColor || themeObj.copilotBorder;
    if (copilotBdr) styles["--sc-copilot-border"] = copilotBdr;

    const copilotShd = themeObj.copilotShadow;
    if (copilotShd) styles["--sc-copilot-shadow"] = copilotShd;

    const titleColor = copilotTitleColor || themeObj.copilotTitleColor;
    if (titleColor) styles["--sc-copilot-title-color"] = titleColor;

    // Copilot Textarea
    const taBg = themeObj.copilotTextareaBackground;
    if (taBg) styles["--sc-copilot-textarea-bg"] = taBg;

    const taBdr = themeObj.copilotTextareaBorder;
    if (taBdr) styles["--sc-copilot-textarea-border"] = taBdr;

    const focusBdr = themeObj.copilotFocusBorder;
    if (focusBdr) styles["--sc-copilot-focus-border"] = focusBdr;

    const focusShd = themeObj.copilotFocusShadow;
    if (focusShd) styles["--sc-copilot-focus-shadow"] = focusShd;

    // Suggestions & Chips
    const suggColor = suggestionsTitleColor || suggestionsColor || themeObj.suggestionsTitleColor || themeObj.suggestionsColor;
    if (suggColor) styles["--sc-copilot-suggestions-color"] = suggColor;

    const chipBg = chipBackground || themeObj.chipBackground;
    if (chipBg) styles["--sc-copilot-chip-bg"] = chipBg;

    const chipBdr = chipBorder || themeObj.chipBorder;
    if (chipBdr) styles["--sc-copilot-chip-border"] = chipBdr;

    const chipClr = chipColor || themeObj.chipColor;
    if (chipClr) styles["--sc-copilot-chip-color"] = chipClr;

    const chipHovBg = themeObj.chipHoverBackground;
    if (chipHovBg) styles["--sc-copilot-chip-hover-bg"] = chipHovBg;

    const chipHovBdr = themeObj.chipHoverBorder;
    if (chipHovBdr) styles["--sc-copilot-chip-hover-border"] = chipHovBdr;

    const chipHovClr = themeObj.chipHoverColor;
    if (chipHovClr) styles["--sc-copilot-chip-hover-color"] = chipHovClr;

    // Primary Button
    const btnBg = primaryButtonBackground || primaryButtonBg || themeObj.primaryButtonBackground || (themeObj.primaryColor ? themeObj.primaryColor : undefined);
    if (btnBg) styles["--sc-primary-btn-bg"] = btnBg;

    const btnClr = primaryButtonColor || themeObj.primaryButtonColor;
    if (btnClr) styles["--sc-primary-btn-color"] = btnClr;

    const btnHovBg = themeObj.primaryButtonHoverBackground;
    if (btnHovBg) styles["--sc-primary-btn-hover-bg"] = btnHovBg;

    const btnShd = themeObj.primaryButtonShadow;
    if (btnShd) styles["--sc-primary-btn-shadow"] = btnShd;

    if (themeObj.customStyles) {
      Object.assign(styles, themeObj.customStyles);
    }

    return styles as React.CSSProperties;
  }, [
    theme,
    copilotBackground,
    copilotBorder,
    copilotBorderColor,
    copilotTitleColor,
    suggestionsTitleColor,
    suggestionsColor,
    chipBackground,
    chipBorder,
    chipColor,
    primaryButtonBackground,
    primaryButtonBg,
    primaryButtonColor,
  ]);

  // Resolve header customization
  const resolvedTitle = headerTitle || title || "SocialCalc AI Agent Workbench";
  const resolvedHeaderIcon = headerIcon !== undefined ? headerIcon : (icon !== undefined ? icon : null);
  const resolvedHeaderBg =
    headerColor ||
    headerBackground ||
    headerBg ||
    (typeof theme === "object" ? theme.headerBackground : undefined) ||
    undefined;
  const resolvedHeaderTextColor =
    headerTextColor ||
    (typeof theme === "object" ? theme.headerTextColor : undefined) ||
    undefined;
  const resolvedHeaderIconColor =
    headerIconColor ||
    (typeof theme === "object" ? theme.headerIconColor : undefined) ||
    (themePreset === "emerald"
      ? "#34d399"
      : themePreset === "purple" || themePreset === "violet"
      ? "#c084fc"
      : "#94a3b8");
  const resolvedVersionTag = versionTag === false || versionTag === null ? null : (headerSubtitle || versionTag || null);
  const resolvedCopilotIcon = copilotIcon !== undefined ? copilotIcon : null;

  // Resolve suggestions based on developer input
  const resolvedSuggestions = useMemo((): AgentPromptSuggestion[] => {
    if (showSuggestions === false || suggestions === false || !suggestions) {
      return [];
    }
    if (suggestions === "generic" || suggestions === true) {
      return DEFAULT_GENERIC_SUGGESTIONS;
    }
    if (suggestions === "invoice") {
      return DEFAULT_INVOICE_SUGGESTIONS;
    }
    if (Array.isArray(suggestions)) {
      return suggestions;
    }
    return [];
  }, [suggestions, showSuggestions]);
  const shouldShowPluginTest = showPluginTest !== false && showQuickActions !== false && !hidePluginTest;
  // Determine visible tabs based on enabledTabs array or individual boolean flags
  const visibleTabs = useMemo(() => {
    if (Array.isArray(enabledTabs) && enabledTabs.length > 0) {
      return ALL_AGENT_MODAL_TABS.filter((t) => enabledTabs.includes(t.id));
    }
    return ALL_AGENT_MODAL_TABS.filter((t) => {
      if (t.id === "actions" && showActionsTab === false) return false;
      if (t.id === "context" && showContextTab === false) return false;
      if (t.id === "schemas" && showSchemasTab === false) return false;
      if (t.id === "console" && showConsoleTab === false) return false;
      return true;
    });
  }, [enabledTabs, showActionsTab, showContextTab, showSchemasTab, showConsoleTab]);

  const isTabBarExplicitlyHidden = Boolean(hideTabHeaders || hideHeaders || hideTabBar);
  const shouldHideTabBar =
    isTabBarExplicitlyHidden ||
    (visibleTabs.length <= 1 && hideTabHeaders !== false && hideHeaders !== false && hideTabBar !== false);

  const getInitialTab = (): AgentModalTabId => {
    if (defaultTab && visibleTabs.some((t) => t.id === defaultTab)) {
      return defaultTab;
    }
    return visibleTabs[0]?.id || "actions";
  };

  const [activeTab, setActiveTab] = useState<AgentModalTabId>(getInitialTab);

  // Sync activeTab when modal opens or enabled tabs change
  useEffect(() => {
    if (isOpen) {
      if (!visibleTabs.some((t) => t.id === activeTab)) {
        setActiveTab(getInitialTab());
      }
    }
  }, [isOpen, visibleTabs, defaultTab]);

  const [context, setContext] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isCallingAi, setIsCallingAi] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiOffTopicNotice, setAiOffTopicNotice] = useState<string | null>(null);
  const [cellSearchQuery, setCellSearchQuery] = useState<string>("");
  const [isMappingsOpen, setIsMappingsOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState<"gemini" | "openai" | "system">("gemini");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const refreshContext = () => {
    try {
      const ctx = getAgentContext({ sheetName: currentSheet, appMapping });
      setContext(ctx);
    } catch (e: any) {
      console.error("[AgentModal] Error getting context:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshContext();
    }
  }, [isOpen, currentSheet, appMapping]);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 99),
    ]);
  };

  const runActions = (actions: any[], label: string) => {
    addLog(`Executing: ${label}`);
    try {
      const result = executeAgentActions(actions, { sheetName: currentSheet, appMapping });
      addLog(`Success: ${result.count}/${result.total} actions applied`);
      if (result.commands.length > 0) {
        addLog(`Commands: ${result.commands.join(" | ")}`);
      }
      refreshContext();
      if (onExecute) onExecute(result);
    } catch (err: any) {
      addLog(`Execution Error: ${err.message}`);
    }
  };

  // AI Agent Service Execution
  const handleCallLiveAiAgent = async () => {
    if (!aiPrompt.trim()) {
      addLog("Please enter an instruction or question for the AI.");
      return;
    }

    setIsCallingAi(true);
    setAiExplanation(null);
    setAiOffTopicNotice(null);
    addLog(`Agent Service Query: "${aiPrompt.trim()}"`);

    const resolvedApiEndpoint = apiEndpoint || "/agent/socialcalc/test";

    try {
      const ctx = exportAgentContext({ sheetName: currentSheet, appMapping });

      let customHeaders: Record<string, string> = {};
      if (typeof apiHeaders === "function") {
        try {
          customHeaders = await apiHeaders();
        } catch {}
      } else if (apiHeaders) {
        customHeaders = apiHeaders;
      }

      const res = await fetch(resolvedApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...customHeaders,
        },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          context: ctx,
        }),
      });

      if (res.status === 401) {
        const errorText = "Please sign in to use the AI Copilot.";
        setAiExplanation(`**Authentication Required (401):**\n\n${errorText}`);
        addLog(`Auth Error: 401 Unauthorized`);
        return;
      }

      const data = await res.json();

      if (res.status === 403) {
        const errorText = data.error || "Token quota limit reached. Please upgrade your subscription plan.";
        setAiExplanation(`**Token Quota Exceeded (403):**\n\n${errorText}`);
        addLog(`Quota Error: 403 Forbidden`);
        return;
      }

      // Case 1: Sheet Context Explanation / Summary / Email drafting
      if (data.type === "explanation") {
        setAiExplanation(data.message || "No explanation provided.");
        addLog(`AI Insight Received: ${String(data.message || "").slice(0, 60)}...`);
        return;
      }

      // Case 2: Off-topic / Out-of-context prompt
      if (
        data.type === "off_topic" ||
        (data.message &&
          (!data.actions || data.actions.length === 0) &&
          String(data.message).toLowerCase().includes("only write values"))
      ) {
        const msg =
          data.message ||
          "I can only write values to the spreadsheet cells, please give me input accordingly.";
        setAiOffTopicNotice(msg);
        addLog(`Agent Notice: ${msg}`);
        return;
      }

      // Case 3: Executable spreadsheet filling actions
      if (data.success && Array.isArray(data.actions) && data.actions.length > 0) {
        addLog(`AI Generated ${data.actions.length} action(s)${data.model ? ` (${data.model})` : ""}`);
        runActions(data.actions, `AI Execution (${data.actions.length} actions)`);
        setAiPrompt("");
      } else if (data.message) {
        setAiExplanation(data.message);
        addLog(`AI Message: ${data.message.slice(0, 60)}...`);
      } else {
        const errorText = data.error || data.message || "Failed to generate actions";
        setAiExplanation(`**AI Notice:** ${errorText}`);
        addLog(`AI Notice: ${errorText}`);
      }
    } catch (err: any) {
      const connErr = `**Server Unavailable:** Could not reach the AI service at \`${resolvedApiEndpoint}\`. Check your internet connection and try again.`;
      setAiExplanation(connErr);
      addLog(`Connection Error: ${err.message}`);
    } finally {
      setIsCallingAi(false);
    }
  };

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addLog(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered Editable Cells for Sheet Context tab
  const filteredEditableCells = useMemo(() => {
    if (!context?.editableCells) return [];
    if (!cellSearchQuery.trim()) return context.editableCells;
    const q = cellSearchQuery.toLowerCase().trim();
    return context.editableCells.filter((ec: any) => {
      const cell = String(ec.cell || "").toLowerCase();
      const title = String(ec.title || "").toLowerCase();
      const val = String(ec.currentValue || "").toLowerCase();
      return cell.includes(q) || title.includes(q) || val.includes(q);
    });
  }, [context?.editableCells, cellSearchQuery]);

  const templateFieldCount = useMemo(() => {
    if (!context?.mappings?.fields) return 0;
    return Object.keys(context.mappings.fields).filter((k) => k.includes(".")).length;
  }, [context?.mappings?.fields]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className={`sc-agent-modal sc-theme-${themePreset}`}
      style={customThemeStyles}
    >
      {/* Executive Modal Header */}
      <IonHeader>
        <IonToolbar
          style={{
            ...(resolvedHeaderBg ? { "--background": resolvedHeaderBg, background: resolvedHeaderBg } : {}),
            ...(resolvedHeaderTextColor ? { "--color": resolvedHeaderTextColor, color: resolvedHeaderTextColor } : {}),
          }}
        >
          <div className="sc-modal-header-title" style={{ color: resolvedHeaderTextColor || undefined }}>
            {resolvedHeaderIcon && (
              typeof resolvedHeaderIcon === "string" || typeof resolvedHeaderIcon === "object" ? (
                <IonIcon
                  icon={resolvedHeaderIcon}
                  style={{ color: resolvedHeaderIconColor, fontSize: 22 }}
                />
              ) : (
                resolvedHeaderIcon
              )
            )}
            <span>{resolvedTitle}</span>
            {resolvedVersionTag && (
              <span className="sc-modal-version-tag">{resolvedVersionTag}</span>
            )}
          </div>
          <IonButtons slot="end">
            <IonButton
              onClick={onClose}
              className="sc-modal-close-btn"
              title="Close modal"
              style={{ color: resolvedHeaderTextColor || undefined }}
            >
              <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Modal Body with Full Smooth Scroll Container */}
      <IonContent>
        <div className="sc-agent-container">
          {/* Custom Nav Tabs (Pill bar without IonSegment truncation) */}
          {!shouldHideTabBar && visibleTabs.length > 0 && (
            <div className="sc-agent-nav-bar">
              {visibleTabs.map((tab) => {
                const badge = tab.getBadge ? tab.getBadge(context, logs) : null;
                return (
                  <button
                    key={tab.id}
                    className={`sc-agent-nav-tab ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <IonIcon icon={tab.icon} />
                    <span>{tab.label}</span>
                    {badge !== null && badge !== undefined && (
                      <span className="sc-nav-badge">{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state if all tabs are disabled */}
          {visibleTabs.length === 0 && (
            <div className="sc-card-executive" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
              <IonIcon icon={informationCircleOutline} style={{ fontSize: 32, color: "#94a3b8", marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                No tabs are currently enabled in this AgentModal view.
              </p>
            </div>
          )}

          {/* TAB 1: COPILOT & QUICK ACTIONS */}
          {activeTab === "actions" && visibleTabs.some((t) => t.id === "actions") && (
            <div className="sc-tab-content">
              {/* AI Copilot Prompt Card */}
              <div className="sc-copilot-box" style={copilotCardStyle}>
                <div className="sc-copilot-header">
                  <div className="sc-copilot-title">
                    {resolvedCopilotIcon && (
                      <IonIcon
                        icon={resolvedCopilotIcon}
                        style={{ fontSize: 18, color: copilotIconColor || undefined }}
                      />
                    )}
                    <span>{copilotTitle}</span>
                  </div>
                  {isCallingAi && (
                    <span style={{ fontSize: 12, color: "var(--sc-copilot-focus-border, #2563eb)", fontWeight: 600 }}>
                      Processing instruction...
                    </span>
                  )}
                </div>

                <textarea
                  className="sc-copilot-textarea"
                  placeholder={promptPlaceholder}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isCallingAi}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      handleCallLiveAiAgent();
                    }
                  }}
                />

                {/* Optional Prompt Suggestion Chips */}
                {resolvedSuggestions.length > 0 && (
                  <div className="sc-prompt-chips-row">
                    {suggestionsTitle && (
                      <span className="sc-prompt-title" style={{ fontSize: 11, fontWeight: 700 }}>
                        {suggestionsTitle}
                      </span>
                    )}
                    {resolvedSuggestions.map((item, idx) => (
                      <button
                        key={`${item.label}-${idx}`}
                        className="sc-prompt-chip"
                        onClick={() => setAiPrompt(item.prompt)}
                        title={item.prompt}
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="sc-copilot-footer">
                  <div />
                  <button
                    className="sc-btn-primary"
                    style={primaryButtonStyle}
                    onClick={handleCallLiveAiAgent}
                    disabled={isCallingAi || !aiPrompt.trim()}
                  >
                    <span>{isCallingAi ? "Agent Thinking..." : "Run AI Agent"}</span>
                  </button>
                </div>

                {/* AI Markdown Insight Output Card */}
                {aiExplanation && (
                  <div className="sc-ai-markdown-card">
                    <div className="sc-ai-markdown-header">
                      <div className="sc-ai-markdown-title">
                        <IonIcon icon={documentTextOutline} style={{ fontSize: 18 }} />
                        <span>AI Sheet Insight & Response:</span>
                      </div>
                      <div className="sc-ai-markdown-actions">
                        <button
                          className="sc-btn-secondary"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => handleCopy(aiExplanation, "explanation", "AI Insight")}
                        >
                          <IonIcon icon={copiedKey === "explanation" ? checkmarkOutline : copyOutline} />
                          <span>{copiedKey === "explanation" ? "Copied!" : "Copy"}</span>
                        </button>
                        <button
                          onClick={() => setAiExplanation(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 16, fontWeight: 700 }}
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div
                      className="sc-agent-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(aiExplanation, { breaks: true }) as string,
                      }}
                    />
                  </div>
                )}

                {/* AI Off-Topic Notice Banner */}
                {aiOffTopicNotice && (
                  <div className="sc-ai-offtopic-banner">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IonIcon icon={informationCircleOutline} style={{ fontSize: 22, color: "#d97706", flexShrink: 0 }} />
                      <span>{aiOffTopicNotice}</span>
                    </div>
                    <button className="sc-close-btn" onClick={() => setAiOffTopicNotice(null)}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Removable Agent Plugin Test Component */}
              {shouldShowPluginTest && (
                <AgentPluginTest
                  currentSheet={currentSheet}
                  appMapping={appMapping}
                  context={context}
                  onExecute={(res) => {
                    refreshContext();
                    if (onExecute) onExecute(res);
                  }}
                  onLog={addLog}
                  refreshContext={refreshContext}
                />
              )}
            </div>
          )}

          {/* TAB 2: SHEET CONTEXT & EDITABLE CELLS */}
          {activeTab === "context" && visibleTabs.some((t) => t.id === "context") && (
            <div className="sc-tab-content">
              {/* Context Summary Metric Cards */}
              <div className="sc-stats-grid">
                <div className="sc-stat-card">
                  <span className="sc-stat-card-label">Used Range</span>
                  <span className="sc-stat-card-value highlight">
                    {context?.dimensions?.usedRange || "N/A"}
                  </span>
                </div>
                <div className="sc-stat-card">
                  <span className="sc-stat-card-label">Non-Empty Cells</span>
                  <span className="sc-stat-card-value">
                    {context?.dimensions?.nonBlankCount || 0}
                  </span>
                </div>
                <div className="sc-stat-card">
                  <span className="sc-stat-card-label">AI Editable Targets</span>
                  <span className="sc-stat-card-value highlight">
                    {context?.editableCells?.length || 0}
                  </span>
                </div>
                <div className="sc-stat-card">
                  <span className="sc-stat-card-label">Template Fields</span>
                  <span className="sc-stat-card-value">
                    {templateFieldCount}
                  </span>
                </div>
              </div>

              {/* Main Editable Cells Card */}
              <div className="sc-card-executive">
                <div className="sc-card-header">
                  <div>
                    <h3 className="sc-card-title">
                      <IonIcon icon={gridOutline} style={{ color: "#4f46e5" }} />
                      <span>Active Editable Cells Passed to AI</span>
                    </h3>
                    <p className="sc-card-subtitle">
                      Every cell coordinate, title, and current value available for the text-editor agent to modify
                    </p>
                  </div>
                  <button
                    className="sc-btn-secondary"
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(exportAgentContext({ sheetName: currentSheet, appMapping }), null, 2),
                        "context-json",
                        "Context JSON"
                      )
                    }
                  >
                    <IonIcon icon={copiedKey === "context-json" ? checkmarkOutline : copyOutline} />
                    <span>{copiedKey === "context-json" ? "Copied!" : "Copy Context JSON"}</span>
                  </button>
                </div>

                <div className="sc-card-body">
                  {/* Search and Filter Input */}
                  <div className="sc-search-bar-wrap">
                    <div className="sc-search-input-box">
                      <IonIcon icon={searchOutline} />
                      <input
                        type="text"
                        className="sc-search-input"
                        placeholder="Search by cell coord (e.g. C6), title (e.g. Bill To), or value..."
                        value={cellSearchQuery}
                        onChange={(e) => setCellSearchQuery(e.target.value)}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                      Showing {filteredEditableCells.length} of {context?.editableCells?.length || 0} cells
                    </span>
                  </div>

                  {/* Modern Sticky Table */}
                  {filteredEditableCells.length > 0 ? (
                    <div className="sc-modern-table-container">
                      <table className="sc-modern-table">
                        <thead>
                          <tr>
                            <th style={{ width: "90px" }}>Cell</th>
                            <th>Field / Mapping Title</th>
                            <th>Current Value</th>
                            <th style={{ width: "90px" }}>Type</th>
                            <th style={{ width: "90px" }}>Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEditableCells.map((ec: any, idx: number) => (
                            <tr key={`${ec.cell}-${idx}`}>
                              <td>
                                <span className="sc-coord-pill">{ec.cell}</span>
                              </td>
                              <td>
                                <strong style={{ color: "#1e293b" }}>{ec.title}</strong>
                              </td>
                              <td>
                                {ec.currentValue !== "" && ec.currentValue !== undefined ? (
                                  <span style={{ color: "#334155" }}>{String(ec.currentValue)}</span>
                                ) : (
                                  <em style={{ color: "#94a3b8" }}>(empty)</em>
                                )}
                              </td>
                              <td>
                                <span className="sc-type-pill">{ec.type || "text"}</span>
                              </td>
                              <td>
                                <span className="sc-badge-active">
                                  <IonIcon icon={checkmarkOutline} />
                                  <span>editable</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: 30, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 10 }}>
                      No cells match query &quot;{cellSearchQuery}&quot;
                    </div>
                  )}

                  {/* Accordion 1: Detected Template Mappings */}
                  {context?.hasMappings && (
                    <div className="sc-accordion-box">
                      <div
                        className={`sc-accordion-header ${isMappingsOpen ? "open" : ""}`}
                        onClick={() => setIsMappingsOpen(!isMappingsOpen)}
                      >
                        <div className="sc-accordion-header-title">
                          <IonIcon icon={layersOutline} style={{ color: "#6366f1" }} />
                          <span>Detected App Mappings ({templateFieldCount} fields)</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#64748b" }}>
                            {isMappingsOpen ? "Click to collapse" : "Click to view mappings"}
                          </span>
                          <IonIcon icon={isMappingsOpen ? chevronUpOutline : chevronDownOutline} />
                        </div>
                      </div>
                      {isMappingsOpen && (
                        <div className="sc-accordion-body">
                          <div className="sc-modern-table-container" style={{ maxHeight: 240 }}>
                            <table className="sc-modern-table">
                              <thead>
                                <tr>
                                  <th>Field Key</th>
                                  <th style={{ width: "90px" }}>Cell</th>
                                  <th>Current Value</th>
                                  <th style={{ width: "90px" }}>Editable</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(context?.mappings?.fields || {})
                                  .filter(([k]) => k.includes("."))
                                  .map(([k, f]: [string, any]) => (
                                    <tr key={k}>
                                      <td><strong>{k}</strong></td>
                                      <td><span className="sc-coord-pill">{f.cell}</span></td>
                                      <td>{f.currentValue || <em style={{ color: "#94a3b8" }}>(empty)</em>}</td>
                                      <td>
                                        <span className={f.editable ? "sc-badge-active" : "sc-type-pill"}>
                                          {f.editable ? "yes" : "no"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accordion 2: Compact Text Summary Injected to LLM */}
                  <div className="sc-accordion-box">
                    <div
                      className={`sc-accordion-header ${isSummaryOpen ? "open" : ""}`}
                      onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                    >
                      <div className="sc-accordion-header-title">
                        <IonIcon icon={documentTextOutline} style={{ color: "#0ea5e9" }} />
                        <span>Compact Prompt Summary (Context Injected into AI Prompt)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {isSummaryOpen ? "Click to collapse" : "Click to view prompt payload"}
                        </span>
                        <IonIcon icon={isSummaryOpen ? chevronUpOutline : chevronDownOutline} />
                      </div>
                    </div>
                    {isSummaryOpen && (
                      <div className="sc-accordion-body">
                        <div className="sc-terminal-window">
                          <div className="sc-terminal-header">
                            <div className="sc-terminal-dots">
                              <span className="sc-dot red" />
                              <span className="sc-dot yellow" />
                              <span className="sc-dot green" />
                            </div>
                            <span className="sc-terminal-title">llm_sheet_context.txt</span>
                            <button
                              className="sc-btn-secondary"
                              style={{ padding: "2px 8px", fontSize: 11, background: "#1e293b", color: "#e2e8f0", borderColor: "#334155" }}
                              onClick={() => handleCopy(context?.summary || "", "summary-txt", "Prompt Summary")}
                            >
                              <IonIcon icon={copiedKey === "summary-txt" ? checkmarkOutline : copyOutline} />
                              <span>{copiedKey === "summary-txt" ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                          <div className="sc-terminal-content" style={{ maxHeight: 200 }}>
                            {context?.summary || "No summary available"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LLM SCHEMAS */}
          {activeTab === "schemas" && visibleTabs.some((t) => t.id === "schemas") && (
            <div className="sc-tab-content">
              <div className="sc-card-executive">
                <div className="sc-card-header">
                  <div>
                    <h3 className="sc-card-title">
                      <IonIcon icon={codeSlashOutline} style={{ color: "#4f46e5" }} />
                      <span>LLM Tool Definitions & Prompt Templates</span>
                    </h3>
                    <p className="sc-card-subtitle">
                      Structured tool contracts ready for Gemini 1.5/2.0, Claude, OpenAI GPT-4o, and AWS Bedrock
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="sc-btn-secondary"
                      onClick={() => {
                        const content =
                          selectedSchemaType === "gemini"
                            ? JSON.stringify(getAgentToolDefinitions({ format: "gemini" }), null, 2)
                            : selectedSchemaType === "openai"
                            ? JSON.stringify(getAgentToolDefinitions({ format: "openai" }), null, 2)
                            : generateAgentSystemPrompt({ sheetName: currentSheet, appMapping });
                        handleCopy(content, selectedSchemaType, `${selectedSchemaType} schema`);
                      }}
                    >
                      <IonIcon icon={copiedKey === selectedSchemaType ? checkmarkOutline : copyOutline} />
                      <span>{copiedKey === selectedSchemaType ? "Copied!" : "Copy Active Schema"}</span>
                    </button>
                  </div>
                </div>
                <div className="sc-card-body">
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <button
                      className={`sc-agent-nav-tab ${selectedSchemaType === "gemini" ? "active" : ""}`}
                      onClick={() => setSelectedSchemaType("gemini")}
                    >
                      Gemini Tool Specs
                    </button>
                    <button
                      className={`sc-agent-nav-tab ${selectedSchemaType === "openai" ? "active" : ""}`}
                      onClick={() => setSelectedSchemaType("openai")}
                    >
                      OpenAI Tool Specs
                    </button>
                    <button
                      className={`sc-agent-nav-tab ${selectedSchemaType === "system" ? "active" : ""}`}
                      onClick={() => setSelectedSchemaType("system")}
                    >
                      System Prompt
                    </button>
                  </div>

                  <div className="sc-terminal-window">
                    <div className="sc-terminal-header">
                      <div className="sc-terminal-dots">
                        <span className="sc-dot red" />
                        <span className="sc-dot yellow" />
                        <span className="sc-dot green" />
                      </div>
                      <span className="sc-terminal-title">
                        {selectedSchemaType === "gemini"
                          ? "gemini_function_declarations.json"
                          : selectedSchemaType === "openai"
                          ? "openai_tools_schema.json"
                          : "agent_system_prompt.txt"}
                      </span>
                    </div>
                    <div className="sc-terminal-content" style={{ maxHeight: 380 }}>
                      {selectedSchemaType === "gemini"
                        ? JSON.stringify(getAgentToolDefinitions({ format: "gemini" }), null, 2)
                        : selectedSchemaType === "openai"
                        ? JSON.stringify(getAgentToolDefinitions({ format: "openai" }), null, 2)
                        : generateAgentSystemPrompt({ sheetName: currentSheet, appMapping })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONSOLE LOG */}
          {activeTab === "console" && visibleTabs.some((t) => t.id === "console") && (
            <div className="sc-tab-content">
              <div className="sc-card-executive">
                <div className="sc-card-header">
                  <div>
                    <h3 className="sc-card-title">
                      <IonIcon icon={terminalOutline} style={{ color: "#10b981" }} />
                      <span>Live Agent Execution Console</span>
                    </h3>
                    <p className="sc-card-subtitle">
                      Real-time command stream, action execution results, and error diagnostic traces
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="sc-btn-secondary"
                      onClick={() => handleCopy(logs.join("\n"), "console-logs", "Console Logs")}
                      disabled={logs.length === 0}
                    >
                      <IonIcon icon={copiedKey === "console-logs" ? checkmarkOutline : copyOutline} />
                      <span>{copiedKey === "console-logs" ? "Copied!" : "Copy Logs"}</span>
                    </button>
                    <button
                      className="sc-btn-secondary"
                      style={{ color: "#ef4444" }}
                      onClick={() => setLogs([])}
                    >
                      <IonIcon icon={trashOutline} />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
                <div className="sc-card-body">
                  <div className="sc-terminal-window">
                    <div className="sc-terminal-header">
                      <div className="sc-terminal-dots">
                        <span className="sc-dot red" />
                        <span className="sc-dot yellow" />
                        <span className="sc-dot green" />
                      </div>
                      <span className="sc-terminal-title">agent_execution.log ({logs.length} entries)</span>
                    </div>
                    <div className="sc-terminal-content" style={{ maxHeight: 420 }}>
                      {logs.length === 0 ? (
                        <div className="sc-console-empty">
                          Console initialized. Trigger an action or AI prompt to observe live execution.
                        </div>
                      ) : (
                        logs.map((log, index) => (
                          <div key={index} style={{ marginBottom: 4 }}>
                            {log}
                          </div>
                        ))
                      )}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
