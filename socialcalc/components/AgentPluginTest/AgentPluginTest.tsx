import React, { useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  playOutline,
  calculatorOutline,
  trashOutline,
  flashOutline,
} from "ionicons/icons";
import {
  executeAgentActions,
  parseAgentResponse,
} from "../../modules/agent.js";
import "../AgentModal/AgentModal.css";

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
}

/**
 * AgentPluginTest (Agentplugintest) Component
 *
 * Standalone, removable testing component for direct spreadsheet plugin macros,
 * mapping injections, and custom JSON action executions.
 */
export const AgentPluginTest: React.FC<AgentPluginTestProps> = ({
  currentSheet = "sheet1",
  appMapping,
  context,
  onExecute,
  onLog,
  refreshContext,
  title = "Direct Plugin Quick Actions",
  subtitle = "Test instant deterministic spreadsheet macros and mapping execution",
  showCustomJson = true,
  className = "",
  style,
}) => {
  const [customInput, setCustomInput] = useState<string>("");

  const logMessage = (msg: string) => {
    if (onLog) {
      onLog(msg);
    } else {
      console.log(`[AgentPluginTest] ${msg}`);
    }
  };

  const runActions = (actions: any[], label: string) => {
    logMessage(`Executing: ${label}`);
    try {
      const result = executeAgentActions(actions, { sheetName: currentSheet, appMapping });
      logMessage(`Success: ${result.count}/${result.total} actions applied`);
      if (result.commands.length > 0) {
        logMessage(`Commands: ${result.commands.join(" | ")}`);
      }
      if (refreshContext) refreshContext();
      if (onExecute) onExecute(result);
    } catch (err: any) {
      logMessage(`Execution Error: ${err.message}`);
    }
  };

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
    runActions(actions, "Populate 3 Consulting Line Items");
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
        logMessage("No valid actions found in input JSON.");
        return;
      }
      runActions(parsed, `Custom JSON (${parsed.length} actions)`);
    } catch (e: any) {
      logMessage(`Parse error: ${e.message}`);
    }
  };

  return (
    <div className={`sc-card-executive ${className}`} style={style}>
      <div className="sc-card-header">
        <div>
          <h3 className="sc-card-title">
            <IonIcon icon={flashOutline} style={{ color: "#4f46e5" }} />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="sc-card-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="sc-card-body">
        <div className="sc-quick-actions-grid">
          <button className="sc-action-card-btn" onClick={handleFillAcmeInvoice}>
            <div className="sc-action-icon-box">
              <IonIcon icon={playOutline} />
            </div>
            <div className="sc-action-card-text">
              <strong>Fill Header Fields</strong>
              <span>Acme Corp address & contact</span>
            </div>
          </button>

          <button className="sc-action-card-btn" onClick={handleFillItems}>
            <div className="sc-action-icon-box">
              <IonIcon icon={playOutline} />
            </div>
            <div className="sc-action-card-text">
              <strong>Populate Line Items</strong>
              <span>Insert 3 consulting rows</span>
            </div>
          </button>

          <button className="sc-action-card-btn" onClick={handleSetCustomFormula}>
            <div className="sc-action-icon-box">
              <IonIcon icon={calculatorOutline} />
            </div>
            <div className="sc-action-card-text">
              <strong>Set Total Formula</strong>
              <span>Apply =SUM(F21:F33) on F34</span>
            </div>
          </button>

          <button className="sc-action-card-btn danger" onClick={handleClearTable}>
            <div className="sc-action-icon-box">
              <IonIcon icon={trashOutline} />
            </div>
            <div className="sc-action-card-text">
              <strong>Clear Line Items</strong>
              <span>Reset table values</span>
            </div>
          </button>
        </div>

        {/* Custom JSON Action Input */}
        {showCustomJson && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                Custom Action JSON / LLM Actions Array:
              </label>
              <button
                className="sc-btn-primary"
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={handleExecuteCustomJson}
                disabled={!customInput.trim()}
              >
                <IonIcon icon={playOutline} />
                <span>Execute JSON</span>
              </button>
            </div>
            <textarea
              className="sc-copilot-textarea"
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 12,
                minHeight: 85,
                borderColor: "#cbd5e1",
              }}
              placeholder={`[\n  { "action": "SET_CELL", "coord": "C5", "value": "New Client Inc" },\n  { "action": "SET_CELL", "coord": "F21", "value": 500, "type": "number" }\n]`}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Alias export to support exact casing requested by user
export const Agentplugintest = AgentPluginTest;
