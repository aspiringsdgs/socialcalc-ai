import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToggle,
  IonBadge,
} from "@ionic/react";
import {
  closeOutline,
  sparklesOutline,
  playOutline,
  copyOutline,
  codeSlashOutline,
  listOutline,
  checkmarkCircleOutline,
  terminalOutline,
} from "ionicons/icons";
import {
  getAgentContext,
  exportAgentContext,
  getAgentToolDefinitions,
  generateAgentSystemPrompt,
  executeAgentActions,
  parseAgentResponse,
  isAgentEnabled,
  toggleAgent,
} from "../../modules/agent.js";
import "./AgentModal.css";

export interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMapping?: any;
  currentSheet?: string;
  onExecute?: (result: any) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  appMapping,
  currentSheet = "sheet1",
  onExecute,
}) => {
  const [activeTab, setActiveTab] = useState<"actions" | "context" | "schemas" | "console">("actions");
  const [enabled, setEnabled] = useState<boolean>(() => isAgentEnabled());
  const [context, setContext] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState<string>("");

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
      setEnabled(isAgentEnabled());
    }
  }, [isOpen, currentSheet, appMapping]);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  };

  const handleToggle = (e: any) => {
    const nextState = Boolean(e.detail.checked);
    const updated = toggleAgent(nextState);
    setEnabled(updated);
    addLog(`AI Agent Plugin toggled: ${updated ? "ENABLED" : "DISABLED"}`);
  };

  const runActions = (actions: any[], label: string) => {
    addLog(`Executing: ${label}`);
    try {
      const result = executeAgentActions(actions, { sheetName: currentSheet, appMapping });
      addLog(`Result: ${result.count}/${result.total} actions succeeded`);
      if (result.commands.length > 0) {
        addLog(`Commands: ${result.commands.join(" | ")}`);
      }
      refreshContext();
      if (onExecute) onExecute(result);
    } catch (err: any) {
      addLog(`Execution Error: ${err.message}`);
    }
  };

  // Pre-configured text editor agent test scenarios
  const handleFillAcmeInvoice = () => {
    const actions = [
      { action: "SET_MAPPING_FIELD", field: "BillTo.Name", value: "Acme Corporation" },
      { action: "SET_MAPPING_FIELD", field: "BillTo.Address", value: "100 Innovation Way" },
      { action: "SET_MAPPING_FIELD", field: "BillTo.StreetAddress", value: "100 Innovation Way" },
      { action: "SET_MAPPING_FIELD", field: "BillTo.CityStateZip", value: "San Francisco, CA 94107" },
      { action: "SET_MAPPING_FIELD", field: "BillTo.Phone", value: "+1 (555) 019-2834" },
      { action: "SET_MAPPING_FIELD", field: "BillTo.Email", value: "billing@acmecorp.com" },
      { action: "SET_MAPPING_FIELD", field: "InvoiceNumber", value: "INV-2026-9042" },
      { action: "SET_MAPPING_FIELD", field: "Date", value: new Date().toISOString().split("T")[0] },
    ];
    runActions(actions, "Fill Acme Corp Invoice Header");
  };

  const handleFillItems = () => {
    const actions = [
      {
        action: "APPLY_MAPPING_DATA",
        data: {
          Items: [
            { Description: "Cloud Architecture Advisory", Amount: 2400 },
            { Description: "Frontend Engine Optimization", Amount: 1800 },
            { Description: "Mobile Touch Integration", Amount: 950 },
          ],
        },
      },
    ];
    runActions(actions, "Populate Items Table (3 Rows)");
  };

  const handleClearTable = () => {
    const table = context?.mappings?.tables?.Items;
    if (table) {
      const coordsToClear: string[] = [];
      for (let r = table.startRow; r <= table.endRow; r++) {
        for (const col of Object.values(table.columns) as any[]) {
          coordsToClear.push(`${col.columnLetter}${r}`);
        }
      }
      runActions([{ action: "CLEAR_CELLS", coords: coordsToClear }], "Clear Items Table");
    } else {
      // Fallback coordinate clear
      runActions(
        [{ action: "RAW_COMMAND", command: "erase C21:F33 formulas" }],
        "Clear table range C21:F33"
      );
    }
  };

  const handleSetCustomFormula = () => {
    runActions(
      [{ action: "SET_CELL", coord: "F34", value: "=SUM(F21:F33)", type: "formula" }],
      "Set Total Formula =SUM(F21:F33) on F34"
    );
  };

  const handleExecuteCustomJson = () => {
    if (!customInput.trim()) return;
    try {
      const parsed = parseAgentResponse(customInput);
      if (parsed.length === 0) {
        addLog("No valid actions found in input.");
        return;
      }
      runActions(parsed, `Custom JSON Input (${parsed.length} actions)`);
    } catch (e: any) {
      addLog(`Parse error: ${e.message}`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addLog(`Copied ${label} to clipboard`);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="sc-agent-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            <IonIcon icon={sparklesOutline} style={{ verticalAlign: "middle", marginRight: 8 }} />
            SocialCalc AI Agent Workbench
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="sc-agent-container">
          {/* Status Bar */}
          <div className="sc-agent-status-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`sc-agent-status-badge ${enabled ? "active" : "inactive"}`}>
                <IonIcon icon={checkmarkCircleOutline} />
                Agent Plugin: {enabled ? "Active" : "Disabled"}
              </span>
              <span style={{ color: "#64748b" }}>
                Sheet: <strong>{context?.sheetName || currentSheet}</strong>
              </span>
              <span style={{ color: "#64748b" }}>
                Mappings: <strong>{context?.hasMappings ? "Detected" : "None (Free-form)"}</strong>
              </span>
            </div>
            <IonToggle checked={enabled} onIonChange={handleToggle} />
          </div>

          {/* Tab Selector */}
          <IonSegment
            value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value as any)}
            className="sc-agent-tab-bar"
          >
            <IonSegmentButton value="actions">
              <IonLabel>Quick Actions</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="context">
              <IonLabel>Sheet Context</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="schemas">
              <IonLabel>LLM Schemas</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="console">
              <IonLabel>Agent Console ({logs.length})</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* TAB 1: QUICK ACTIONS */}
          {activeTab === "actions" && (
            <div>
              <IonCard className="sc-agent-card">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: "16px" }}>Text Editor Agent Commands</IonCardTitle>
                  <IonCardSubtitle>
                    Simulate direct AI Agent actions or enter custom JSON commands
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
                    Test how the AI Text Editor Agent maps semantic fields to coordinates and executes
                    atomic spreadsheet updates.
                  </p>

                  <div className="sc-quick-actions-grid">
                    <button className="sc-quick-btn" onClick={handleFillAcmeInvoice}>
                      <IonIcon icon={playOutline} /> Fill Header (Acme Corp)
                    </button>
                    <button className="sc-quick-btn" onClick={handleFillItems}>
                      <IonIcon icon={playOutline} /> Populate 3 Line Items
                    </button>
                    <button className="sc-quick-btn" onClick={handleSetCustomFormula}>
                      <IonIcon icon={playOutline} /> Set Total Formula
                    </button>
                    <button
                      className="sc-quick-btn"
                      onClick={handleClearTable}
                      style={{ color: "#ef4444", background: "#fef2f2" }}
                    >
                      <IonIcon icon={playOutline} /> Clear Line Items
                    </button>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                      Custom Action JSON / LLM Output:
                    </label>
                    <textarea
                      placeholder={`[\n  { "action": "SET_CELL", "coord": "C5", "value": "New Client Ltd" },\n  { "action": "SET_CELL", "coord": "F21", "value": 500, "type": "number" }\n]`}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      style={{
                        width: "100%",
                        height: "100px",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        marginTop: "6px",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <button
                        className="sc-quick-btn"
                        style={{ background: "#2563eb", color: "#fff" }}
                        onClick={handleExecuteCustomJson}
                      >
                        <IonIcon icon={playOutline} /> Execute Custom JSON
                      </button>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* TAB 2: CONTEXT & MAPPINGS */}
          {activeTab === "context" && (
            <div>
              <IonCard className="sc-agent-card">
                <IonCardHeader>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <IonCardTitle style={{ fontSize: "16px" }}>Extracted Sheet Context</IonCardTitle>
                      <IonCardSubtitle>
                        Used Range: {context?.dimensions?.usedRange} ({context?.dimensions?.nonBlankCount} non-empty cells)
                      </IonCardSubtitle>
                    </div>
                    <button
                      className="sc-quick-btn"
                      onClick={() =>
                        handleCopy(JSON.stringify(exportAgentContext({ sheetName: currentSheet, appMapping }), null, 2), "Context JSON")
                      }
                    >
                      <IonIcon icon={copyOutline} /> Copy JSON Payload
                    </button>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  {context?.hasMappings ? (
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#334155" }}>
                        Detected Template Mappings ({Object.keys(context?.mappings?.fields || {}).length} fields):
                      </h4>
                      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <table className="sc-mapping-table">
                          <thead>
                            <tr>
                              <th>Field / Key</th>
                              <th>Cell</th>
                              <th>Current Value</th>
                              <th>Editable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(context?.mappings?.fields || {})
                              .filter(([k]) => k.includes("."))
                              .map(([k, f]: [string, any]) => (
                                <tr key={k}>
                                  <td><strong>{k}</strong></td>
                                  <td><span className="sc-mapping-cell-badge">{f.cell}</span></td>
                                  <td>{f.currentValue || <em style={{ color: "#94a3b8" }}>(empty)</em>}</td>
                                  <td>
                                    <IonBadge color={f.editable ? "success" : "medium"}>
                                      {f.editable ? "yes" : "no"}
                                    </IonBadge>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 8 }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                        No structured <code>appMapping</code> was found for this sheet. Operating in free-form spreadsheet mode.
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#334155" }}>
                      Compact Text Summary (Injected into LLM Prompt):
                    </h4>
                    <div className="sc-console-box" style={{ maxHeight: "140px" }}>
                      {context?.summary}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* TAB 3: SCHEMAS & PROMPTS */}
          {activeTab === "schemas" && (
            <div>
              <IonCard className="sc-agent-card">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: "16px" }}>LLM Integration Schemas</IonCardTitle>
                  <IonCardSubtitle>
                    Client-side Gemini API or Backend (Node.js Express / Python Tornado)
                  </IonCardSubtitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <button
                      className="sc-quick-btn"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(getAgentToolDefinitions({ format: "gemini" }), null, 2),
                          "Gemini Function Declarations"
                        )
                      }
                    >
                      <IonIcon icon={copyOutline} /> Copy Gemini Tools
                    </button>
                    <button
                      className="sc-quick-btn"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(getAgentToolDefinitions({ format: "openai" }), null, 2),
                          "OpenAI Tool Schema"
                        )
                      }
                    >
                      <IonIcon icon={copyOutline} /> Copy OpenAI Tools
                    </button>
                    <button
                      className="sc-quick-btn"
                      onClick={() =>
                        handleCopy(generateAgentSystemPrompt({ sheetName: currentSheet, appMapping }), "System Prompt")
                      }
                    >
                      <IonIcon icon={copyOutline} /> Copy System Prompt
                    </button>
                  </div>

                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                    Gemini Function Declarations (Preview):
                  </label>
                  <div className="sc-console-box" style={{ maxHeight: "220px", marginTop: 4 }}>
                    {JSON.stringify(getAgentToolDefinitions({ format: "gemini" }), null, 2)}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* TAB 4: CONSOLE LOG */}
          {activeTab === "console" && (
            <div>
              <IonCard className="sc-agent-card">
                <IonCardHeader>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <IonCardTitle style={{ fontSize: "16px" }}>
                      <IonIcon icon={terminalOutline} style={{ marginRight: 6 }} />
                      Execution Log
                    </IonCardTitle>
                    <button className="sc-quick-btn" onClick={() => setLogs([])}>
                      Clear Logs
                    </button>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <div className="sc-console-box" style={{ maxHeight: "300px" }}>
                    {logs.length === 0 ? "No actions executed yet. Use Quick Actions or custom JSON." : logs.join("\n")}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
