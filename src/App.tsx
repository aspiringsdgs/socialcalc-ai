import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonToast,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  setupIonicReact,
} from "@ionic/react";
import {
  arrowUndo,
  arrowRedo,
  textOutline,
  colorPaletteOutline,
  codeSlashOutline,
  sunnyOutline,
  moonOutline,
  closeOutline,
  documentTextOutline,
  gridOutline,
  appsOutline,
  handLeftOutline,
  createOutline,
  videocamOutline,
  settingsOutline,
  lockClosedOutline,
  lockOpenOutline,
  cloudUploadOutline,
} from "ionicons/icons";

import * as AppGeneral from "socialcalc";
import {
  CellEditModal,
  RowActionPopover,
  HorizontalScrollBar,
  EditableCellsModal,
  DemoVideosModal,
} from "socialcalc";

// Standard MSC templates from src/data
import template100001 from "./data/100001.json";
import template100002 from "./data/100002.json";
import template100003 from "./data/100003.json";

/* Core CSS required for Ionic */
import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./App.css";

setupIonicReact();

interface FooterItem {
  name: string;
  index: number;
  isActive?: boolean;
}

const STANDARD_TEMPLATES: Record<string, { id: string; name: string; data: any }> = {
  "100001": {
    id: "100001",
    name: "Invoice 100001 (Clean Services)",
    data: template100001,
  },
  "100002": {
    id: "100002",
    name: "Invoice 100002 (Hourly Rates)",
    data: template100002,
  },
  "100003": {
    id: "100003",
    name: "Invoice 100003 (Corporate Billing)",
    data: template100003,
  },
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("socialcalc_dark_mode") === "true";
  });

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("100001");
  const [activeSheet, setActiveSheet] = useState<number>(1);
  const [footers, setFooters] = useState<FooterItem[]>(() => {
    return (template100001 as any).footers || [
      { name: "Invoice 1", index: 1, isActive: true },
      { name: "Invoice 2", index: 2, isActive: false },
      { name: "Invoice 3", index: 3, isActive: false },
      { name: "Invoice 4", index: 4, isActive: false },
    ];
  });
  const [appMapping, setAppMapping] = useState<any>(() => (template100001 as any).appMapping || {});

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [lastEditedCell, setLastEditedCell] = useState<string>("None");

  // Plugin toggles state
  const [gridLinesActive, setGridLinesActive] = useState<boolean>(true);
  const [headersActive, setHeadersActive] = useState<boolean>(true);
  const [touchScrollActive, setTouchScrollActive] = useState<boolean>(true);
  const [cellEditModalActive, setCellEditModalActive] = useState<boolean>(true);
  const [editableCellsOnlyActive, setEditableCellsOnlyActive] = useState<boolean>(false);

  // Cell Edit Modal state
  const [cellEditData, setCellEditData] = useState<{
    coord: string;
    text: string;
    okfn: (val: string) => void;
    cleanup?: () => void;
  } | null>(null);
  const [showCellEditModal, setShowCellEditModal] = useState<boolean>(false);

  // Row Action Popover state
  const [rowActionState, setRowActionState] = useState<{
    isOpen: boolean;
    rowNum: number | null;
    position: { x: number; y: number } | null;
  }>({
    isOpen: false,
    rowNum: null,
    position: null,
  });

  // Modal dialog states
  const [showDataModal, setShowDataModal] = useState(false);
  const [exportData, setExportData] = useState("");
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorMode, setColorMode] = useState<"background" | "font">("background");
  const [showEditableCellsModal, setShowEditableCellsModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const colors = [
    { name: "red", label: "Red", hex: "#ff4444" },
    { name: "blue", label: "Blue", hex: "#3880ff" },
    { name: "green", label: "Green", hex: "#2dd36f" },
    { name: "yellow", label: "Yellow", hex: "#ffc409" },
    { name: "purple", label: "Purple", hex: "#6f58d8" },
    { name: "black", label: "Black", hex: "#000000" },
    { name: "white", label: "White", hex: "#ffffff" },
    { name: "default", label: "Default", hex: "#f4f5f8" },
  ];

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  // Dark mode effect
  useEffect(() => {
    const body = document.body;
    if (isDarkMode) {
      body.classList.add("dark");
      document.documentElement.classList.add("ion-palette-dark");
    } else {
      body.classList.remove("dark");
      document.documentElement.classList.remove("ion-palette-dark");
    }
    localStorage.setItem("socialcalc_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  // Apply template helper
  const applyTemplate = useCallback((templateData: any, templateName = "Template") => {
    try {
      const mscData = templateData.msc || templateData;
      AppGeneral.loadWorkbookData(mscData);

      // Determine footers / sheets
      let newFooters: FooterItem[] = [];
      if (templateData.footers && Array.isArray(templateData.footers) && templateData.footers.length > 0) {
        newFooters = templateData.footers;
      } else if (mscData.sheetArr) {
        newFooters = Object.keys(mscData.sheetArr).map((sheetKey, idx) => ({
          name: mscData.sheetArr[sheetKey]?.name || sheetKey,
          index: idx + 1,
          isActive: idx === 0,
        }));
      }
      setFooters(newFooters);
      setActiveSheet(1);

      // Update editable cell mappings
      if (templateData.appMapping) {
        setAppMapping(templateData.appMapping);
        AppGeneral.setAppMapping(templateData.appMapping);
      } else {
        setAppMapping({});
        AppGeneral.setAppMapping({});
      }

      // Re-apply plugin styles after sheet switch
      setTimeout(() => {
        try {
          if (headersActive) AppGeneral.enableRowColHeaders();
          if (gridLinesActive) AppGeneral.enableGridLines();
        } catch (e) {
          // ignore
        }
      }, 150);

      notify(`Loaded ${templateName}`);
    } catch (err) {
      console.error("Failed to apply template:", err);
      notify("Error loading template");
    }
  }, [headersActive, gridLinesActive]);

  // Initial load of default template (100001.json)
  useEffect(() => {
    try {
      const initialMSC = (template100001 as any).msc;
      AppGeneral.initializeApp(JSON.stringify(initialMSC));

      if ((template100001 as any).appMapping) {
        AppGeneral.setAppMapping((template100001 as any).appMapping);
      }

      // Enable row & column headers (123 / ABCD) by default
      setTimeout(() => {
        try {
          if (AppGeneral.enableRowColHeaders) {
            AppGeneral.enableRowColHeaders();
            setHeadersActive(true);
          }
          if (AppGeneral.initGridLines) {
            AppGeneral.initGridLines();
            setGridLinesActive(true);
          }
          if (AppGeneral.initTouchScroll) {
            AppGeneral.initTouchScroll();
            setTouchScrollActive(true);
          }
        } catch (e) {
          console.warn("Plugin initial enable caught:", e);
        }
      }, 200);

      // Listen for cell change events
      const removeListener = AppGeneral.setupCellChangeListener((coord: string) => {
        try {
          const control = (window as any).SocialCalc?.GetCurrentWorkBookControl();
          const sheet = control?.workbook?.spreadsheet?.editor?.workingvalues?.currentsheet || "sheet1";
          const cell = control?.workbook?.spreadsheet?.editor?.context?.sheet?.cells?.[coord];
          const val = cell?.v !== undefined ? cell.v : cell?.t || "";
          setLastEditedCell(`${sheet}!${coord} = "${val}"`);
        } catch {
          setLastEditedCell(coord);
        }
      });

      // Listen for Cell Edit Modal request events from listeners module
      const handleCellEditRequest = (e: any) => {
        if (e.detail) {
          setCellEditData(e.detail);
          setShowCellEditModal(true);
        }
      };
      window.addEventListener("socialcalc:cell-edit-request", handleCellEditRequest);

      // Listen for Row Header Click events to trigger RowActionPopover
      const handleRowHeaderClick = (e: any) => {
        if (e.detail) {
          setRowActionState({
            isOpen: true,
            rowNum: e.detail.rowNum,
            position: { x: e.detail.clientX, y: e.detail.clientY },
          });
        }
      };
      window.addEventListener("socialcalc:row-header-click", handleRowHeaderClick);

      return () => {
        if (typeof removeListener === "function") {
          removeListener();
        }
        window.removeEventListener("socialcalc:cell-edit-request", handleCellEditRequest);
        window.removeEventListener("socialcalc:row-header-click", handleRowHeaderClick);
      };
    } catch (err) {
      console.error("Failed to initialize SocialCalc:", err);
    }
  }, []);

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateKey(templateId);
    const tmpl = STANDARD_TEMPLATES[templateId];
    if (tmpl) {
      applyTemplate(tmpl.data, tmpl.name);
    }
  };

  // Handle custom JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.msc && !parsed.sheetArr) {
          notify("Invalid SocialCalc MSC JSON file format");
          return;
        }
        setSelectedTemplateKey("custom");
        applyTemplate(parsed, file.name);
      } catch (err) {
        console.error("Failed to parse uploaded JSON:", err);
        notify("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    // Reset file input so user can pick same file again if desired
    e.target.value = "";
  };

  // Handlers for Undo / Redo
  const handleUndo = () => {
    AppGeneral.undo();
    notify("Undo executed");
  };

  const handleRedo = () => {
    AppGeneral.redo();
    notify("Redo executed");
  };

  const handleToggleFormat = () => {
    AppGeneral.toggleCellFormatting();
    notify("Cell formatting toggled");
  };

  const handleSheetSwitch = (index: number) => {
    setActiveSheet(index);
    AppGeneral.activateFooterButton(index);
    const footerItem = footers.find((f) => f.index === index);
    notify(`Switched to ${footerItem?.name || `Sheet ${index}`}`);
  };

  const handleColorSelect = (colorName: string) => {
    try {
      if (colorMode === "background") {
        AppGeneral.changeSheetBackgroundColor(colorName);
        notify(`Background changed to ${colorName}`);
      } else {
        AppGeneral.changeSheetFontColor(colorName);
        notify(`Font color changed to ${colorName}`);
      }
      setShowColorModal(false);
    } catch (err) {
      console.error(err);
      notify("Failed to change color");
    }
  };

  const handleViewSaveData = () => {
    try {
      const content = AppGeneral.getSpreadsheetContent();
      setExportData(content);
      setShowDataModal(true);
    } catch (err) {
      console.error(err);
      notify("Failed to get spreadsheet content");
    }
  };

  // Plugin toggles
  const handleToggleGridLines = () => {
    try {
      const active = AppGeneral.toggleGridLines();
      setGridLinesActive(active);
      notify(`Grid lines: ${active ? "ON" : "OFF"}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHeaders = () => {
    try {
      const active = AppGeneral.toggleRowColHeaders();
      setHeadersActive(active);
      notify(`Row & Col Headers: ${active ? "ON" : "OFF"}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTouchScroll = () => {
    try {
      const active = AppGeneral.toggleTouchScroll();
      setTouchScrollActive(active);
      notify(`Touch scroll: ${active ? "ON" : "OFF"}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCellEditModal = () => {
    try {
      const active = AppGeneral.toggleCellEditModal();
      setCellEditModalActive(active);
      notify(`Cell Edit Modal: ${active ? "ON" : "OFF (native input fallback)"}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleEditableCellsOnly = () => {
    try {
      const active = AppGeneral.toggleEditableCellsOnly();
      setEditableCellsOnlyActive(active);
      notify(`Editable Cells Only Mode: ${active ? "LOCKED" : "UNLOCKED"}`);
    } catch (e) {
      console.error(e);
    }
  };

  // Row Action Popover Actions
  const handleInsertRowAbove = (rowNum: number) => {
    try {
      AppGeneral.executeSheetCommand(`insertrow A${rowNum}`);
      notify(`Inserted row above row ${rowNum}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInsertRowBelow = (rowNum: number) => {
    try {
      AppGeneral.executeSheetCommand(`insertrow A${rowNum + 1}`);
      notify(`Inserted row below row ${rowNum}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRow = (rowNum: number) => {
    try {
      AppGeneral.executeSheetCommand(`deleterow A${rowNum}`);
      notify(`Deleted row ${rowNum}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearSheet = () => {
    try {
      const emptySaveStr = "version:1.5\nsheet:c:26:r:50:h:12.75\n";
      AppGeneral.viewFile(`sheet${activeSheet}`, emptySaveStr);
      notify("Sheet cleared");
    } catch (err) {
      console.error(err);
      notify("Failed to clear sheet");
    }
  };

  return (
    <IonApp className={isDarkMode ? "dark-theme" : "light-theme"}>
      <IonHeader>
        {/* Main Toolbar */}
        <IonToolbar color="primary">
          <IonTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IonIcon icon={documentTextOutline} />
              <span>SocialCalc Modernized Studio</span>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            {/* Standard MSC JSON Template Switcher */}
            <div className="template-select-container">
                  <span className="template-label">Template:</span>
                  <select
                    className="template-select-dropdown"
                    value={selectedTemplateKey}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    title="Select a standard MSC JSON template from public/data"
                  >
                    {Object.entries(STANDARD_TEMPLATES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                      </option>
                    ))}
                    {selectedTemplateKey === "custom" && (
                      <option value="custom">Custom Uploaded JSON</option>
                    )}
                  </select>
                  <label className="upload-json-btn" title="Upload custom MSC JSON">
                    <IonIcon icon={cloudUploadOutline} style={{ marginRight: 4 }} />
                    Upload JSON
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <IonButton title="Undo" onClick={handleUndo}>
                  <IonIcon slot="icon-only" icon={arrowUndo} />
                </IonButton>
                <IonButton title="Redo" onClick={handleRedo}>
                  <IonIcon slot="icon-only" icon={arrowRedo} />
                </IonButton>
                <IonButton title="Format Cell" onClick={handleToggleFormat}>
                  <IonIcon slot="icon-only" icon={textOutline} />
                </IonButton>
                <IonButton title="Sheet Color" onClick={() => setShowColorModal(true)}>
                  <IonIcon slot="icon-only" icon={colorPaletteOutline} />
                </IonButton>
                <IonButton title="Formula Guides & Demos" onClick={() => setShowDemoModal(true)}>
                  <IonIcon slot="icon-only" icon={videocamOutline} />
                </IonButton>
                <IonButton title="Manage Cell Mappings" onClick={() => setShowEditableCellsModal(true)}>
                  <IonIcon slot="icon-only" icon={settingsOutline} />
                </IonButton>
                <IonButton title="View Save Data / MSC" onClick={handleViewSaveData}>
                  <IonIcon slot="icon-only" icon={codeSlashOutline} />
                </IonButton>
                <IonButton title="Toggle Dark/Light Mode" onClick={() => setIsDarkMode(!isDarkMode)}>
                  <IonIcon slot="icon-only" icon={isDarkMode ? sunnyOutline : moonOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>

        {/* Secondary Sheet Navigation & Controls Bar */}
        <IonToolbar color="light">
          <div className="sub-toolbar-container">
            {/* Dynamic Sheet Tabs from template footers */}
            <div className="sheet-buttons-group">
              {footers.map((footer) => (
                <button
                  key={footer.index}
                  className={`sheet-tab-btn ${activeSheet === footer.index ? "active" : ""}`}
                  onClick={() => handleSheetSwitch(footer.index)}
                >
                  {footer.name}
                </button>
              ))}
            </div>

            {/* Plugin Toggle Pills */}
            <div className="plugin-toggles-group">
              <button
                className={`plugin-btn ${headersActive ? "active" : ""}`}
                onClick={handleToggleHeaders}
                title="Toggle 123 / ABCD row & column headers"
              >
                <IonIcon icon={appsOutline} style={{ marginRight: 4 }} />
                Headers: {headersActive ? "ON" : "OFF"}
              </button>
              <button
                className={`plugin-btn ${gridLinesActive ? "active" : ""}`}
                onClick={handleToggleGridLines}
                title="Toggle dynamic grid lines"
              >
                <IonIcon icon={gridOutline} style={{ marginRight: 4 }} />
                Grid: {gridLinesActive ? "ON" : "OFF"}
              </button>
              <button
                className={`plugin-btn ${touchScrollActive ? "active" : ""}`}
                onClick={handleToggleTouchScroll}
                title="Toggle touch & gesture scrolling"
              >
                <IonIcon icon={handLeftOutline} style={{ marginRight: 4 }} />
                Touch: {touchScrollActive ? "ON" : "OFF"}
              </button>
              <button
                className={`plugin-btn ${cellEditModalActive ? "active" : ""}`}
                onClick={handleToggleCellEditModal}
                title="Toggle Cell Edit Modal on click"
              >
                <IonIcon icon={createOutline} style={{ marginRight: 4 }} />
                Modal: {cellEditModalActive ? "ON" : "OFF"}
              </button>
              <button
                className={`plugin-btn ${editableCellsOnlyActive ? "active alert" : ""}`}
                onClick={handleToggleEditableCellsOnly}
                title="Toggle Editable Cells Only (Lock non-mapped cells)"
              >
                <IonIcon
                  icon={editableCellsOnlyActive ? lockClosedOutline : lockOpenOutline}
                  style={{ marginRight: 4 }}
                />
                {editableCellsOnlyActive ? "Locked" : "Unlocked"}
              </button>
            </div>

            <div className="action-buttons-group">
              <button
                className="pill-btn primary"
                onClick={() => {
                  const tmpl = STANDARD_TEMPLATES[selectedTemplateKey] || STANDARD_TEMPLATES["100001"];
                  applyTemplate(tmpl.data, tmpl.name);
                }}
              >
                Reload Template
              </button>
              <button className="pill-btn secondary" onClick={handleClearSheet}>
                Clear
              </button>
            </div>

            <div className="event-listener-display">
              <span className="event-label">Last Cell:</span>
              <span className="event-val">{lastEditedCell}</span>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* SocialCalc mounting targets */}
        <div id="container">
          <div id="workbookControl"></div>
          <div id="tableeditor"></div>
          <div id="msg"></div>
        </div>

        {/* Horizontal Scroll Bar Component */}
        <div className="horizontal-scrollbar-wrapper">
          <HorizontalScrollBar />
        </div>

        {/* Cell Edit Modal Component */}
        <CellEditModal
          isOpen={showCellEditModal}
          cellData={cellEditData}
          onClose={() => {
            setShowCellEditModal(false);
            if (cellEditData?.cleanup) cellEditData.cleanup();
          }}
        />

        {/* Row Action Popover Component */}
        <RowActionPopover
          isOpen={rowActionState.isOpen}
          rowNum={rowActionState.rowNum}
          position={rowActionState.position}
          onClose={() => setRowActionState((prev) => ({ ...prev, isOpen: false }))}
          onInsertAbove={handleInsertRowAbove}
          onInsertBelow={handleInsertRowBelow}
          onDeleteRow={handleDeleteRow}
        />

        {/* Editable Cells Management Modal */}
        <EditableCellsModal
          isOpen={showEditableCellsModal}
          appMapping={appMapping}
          currentSheet={`sheet${activeSheet}`}
          onUpdateAppMapping={(newMapping) => {
            setAppMapping(newMapping);
            AppGeneral.setAppMapping(newMapping);
          }}
          onClose={() => setShowEditableCellsModal(false)}
        />

        {/* Demo Videos & Formula Guides Modal */}
        <DemoVideosModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
        />

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2000}
          position="bottom"
        />

        {/* Color Picker Modal */}
        <IonModal isOpen={showColorModal} onDidDismiss={() => setShowColorModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Change Sheet Color</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowColorModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonSegment
              value={colorMode}
              onIonChange={(e) => setColorMode(e.detail.value as "background" | "font")}
            >
              <IonSegmentButton value="background">
                <IonLabel>Background</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="font">
                <IonLabel>Font Color</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            <IonGrid style={{ marginTop: "20px" }}>
              <IonRow>
                {colors.map((c) => (
                  <IonCol size="3" key={c.name} style={{ textAlign: "center" }}>
                    <div
                      onClick={() => handleColorSelect(c.name)}
                      style={{
                        backgroundColor: c.hex,
                        width: "50px",
                        height: "50px",
                        borderRadius: "8px",
                        margin: "0 auto",
                        cursor: "pointer",
                        border: "2px solid #aaa",
                      }}
                    />
                    <div style={{ marginTop: "4px", fontSize: "12px" }}>{c.label}</div>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </IonContent>
        </IonModal>

        {/* Save Data / Export Modal */}
        <IonModal isOpen={showDataModal} onDidDismiss={() => setShowDataModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>SocialCalc Save String (MSC)</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDataModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <p style={{ fontSize: "13px", color: "#666" }}>
              Below is the raw serialized state generated by <code>AppGeneral.getSpreadsheetContent()</code>:
            </p>
            <textarea
              readOnly
              value={exportData}
              style={{
                width: "100%",
                height: "400px",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                backgroundColor: isDarkMode ? "#1e1e1e" : "#f8f9fa",
                color: isDarkMode ? "#00ff66" : "#222",
              }}
            />
          </IonContent>
        </IonModal>
      </IonContent>
    </IonApp>
  );
};

export default App;

