import React, { useState, useMemo, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import {
  closeOutline,
  addOutline,
  trashOutline,
  checkboxOutline,
  searchOutline,
  layersOutline,
  imageOutline,
  documentTextOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import "./EditableCellsModal.css";

export interface EditableCellItem {
  id: string;
  sheet: string;
  path: (string | number)[];
  title: string;
  cell: string;
  type: "text" | "image" | "table" | "form" | string;
  editable: boolean;
  isNested?: boolean;
}

/**
 * Pure helper: parse appMapping into flat list of cell mapping items for UI display
 */
export function parseAppMappingToItems(appMapping: any, targetSheet?: string): EditableCellItem[] {
  const items: EditableCellItem[] = [];
  if (!appMapping || typeof appMapping !== "object") return items;

  const sheets = targetSheet && targetSheet !== "all" && appMapping[targetSheet]
    ? [targetSheet]
    : Object.keys(appMapping);

  for (const sheet of sheets) {
    const sheetData = appMapping[sheet];
    if (!sheetData || typeof sheetData !== "object") continue;

    for (const [topKey, topVal] of Object.entries(sheetData)) {
      const val: any = topVal;
      if (!val || typeof val !== "object") continue;

      // Case 1: Form with nested formContent
      if (val.type === "form" && val.formContent && typeof val.formContent === "object") {
        for (const [fieldKey, fieldVal] of Object.entries(val.formContent)) {
          const fVal: any = fieldVal;
          if (fVal && fVal.cell) {
            items.push({
              id: `${sheet}_${topKey}_${fieldKey}`,
              sheet,
              path: [sheet, topKey, "formContent", fieldKey],
              title: `${topKey} → ${fieldKey}`,
              cell: String(fVal.cell).toUpperCase().trim(),
              type: fVal.type || "text",
              editable: Boolean(fVal.editable),
              isNested: true,
            });
          }
        }
      }
      // Case 2: Table with columns
      else if (val.type === "table" && val.col && typeof val.col === "object") {
        for (const [colKey, colVal] of Object.entries(val.col)) {
          const cVal: any = colVal;
          if (cVal && cVal.cell) {
            const rowRange = val.rows ? `${val.rows.start}-${val.rows.end}` : "";
            items.push({
              id: `${sheet}_${topKey}_${colKey}`,
              sheet,
              path: [sheet, topKey, "col", colKey],
              title: `${topKey} → ${colKey}${rowRange ? ` (${rowRange})` : ""}`,
              cell: String(cVal.cell).toUpperCase().trim(),
              type: cVal.type || "text",
              editable: Boolean(cVal.editable),
              isNested: true,
            });
          }
        }
      }
      // Case 3: Direct cell item (text, image, etc.)
      else if (val.cell) {
        items.push({
          id: `${sheet}_${topKey}`,
          sheet,
          path: [sheet, topKey],
          title: topKey,
          cell: String(val.cell).toUpperCase().trim(),
          type: val.type || "text",
          editable: Boolean(val.editable),
          isNested: false,
        });
      }
    }
  }

  // Sort by cell coordinate alphanumeric
  items.sort((a, b) => a.cell.localeCompare(b.cell, undefined, { numeric: true }));
  return items;
}

/**
 * Pure helper: toggle editable boolean for a given item in appMapping
 */
export function toggleCellEditable(appMapping: any, item: EditableCellItem, newEditable: boolean): any {
  const cloned = JSON.parse(JSON.stringify(appMapping || {}));
  let curr = cloned;
  for (let i = 0; i < item.path.length - 1; i++) {
    const key = item.path[i];
    if (!curr[key]) return cloned;
    curr = curr[key];
  }
  const lastKey = item.path[item.path.length - 1];
  if (curr[lastKey]) {
    curr[lastKey].editable = newEditable;
  }
  return cloned;
}

/**
 * Pure helper: delete a cell mapping item from appMapping
 */
export function deleteCellMapping(appMapping: any, item: EditableCellItem): any {
  const cloned = JSON.parse(JSON.stringify(appMapping || {}));
  let curr = cloned;
  for (let i = 0; i < item.path.length - 1; i++) {
    const key = item.path[i];
    if (!curr[key]) return cloned;
    curr = curr[key];
  }
  const lastKey = item.path[item.path.length - 1];
  if (curr && curr[lastKey]) {
    delete curr[lastKey];
  }
  return cloned;
}

/**
 * Pure helper: add a new cell mapping to appMapping
 */
export function addCellMapping(
  appMapping: any,
  sheet: string,
  entry: { cell: string; title: string; type?: string; editable?: boolean }
): any {
  const cloned = JSON.parse(JSON.stringify(appMapping || {}));
  const sheetKey = sheet || "sheet1";
  if (!cloned[sheetKey]) {
    cloned[sheetKey] = {};
  }

  const cleanCell = entry.cell.toUpperCase().trim();
  // Create a clean key from title (remove special chars, fallback to Cell)
  const cleanKey = entry.title.replace(/[^a-zA-Z0-9_]/g, "") || `Cell_${cleanCell}`;

  cloned[sheetKey][cleanKey] = {
    cell: cleanCell,
    type: entry.type || "text",
    editable: entry.editable !== undefined ? entry.editable : true,
    name: entry.title.trim(),
  };

  return cloned;
}

export interface EditableCellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMapping?: any;
  currentSheet?: string;
  isStandalone?: boolean;
  onUpdateAppMapping?: (newAppMapping: any) => void;
}

export const EditableCellsModal: React.FC<EditableCellsModalProps> = ({
  isOpen,
  onClose,
  appMapping: externalMapping,
  currentSheet = "sheet1",
  isStandalone = false,
  onUpdateAppMapping,
}) => {
  const [internalMapping, setInternalMapping] = useState<any>({});
  const appMapping = externalMapping !== undefined ? externalMapping : internalMapping;

  const updateMapping = (newMap: any) => {
    if (onUpdateAppMapping) {
      onUpdateAppMapping(newMap);
    }
    setInternalMapping(newMap);
  };

  const availableSheets = useMemo(() => {
    // If explicitly in standalone template mode, always show only the current sheet
    if (isStandalone) {
      return [currentSheet || "sheet1"];
    }

    // Check if live SocialCalc workbook only has 1 sheet
    try {
      const sc = (window as any).SocialCalc;
      const ctrl = sc?.GetCurrentWorkBookControl?.();
      if (ctrl?.workbook?.sheetArr) {
        const liveSheets = Object.keys(ctrl.workbook.sheetArr);
        if (liveSheets.length <= 1) {
          return [currentSheet || liveSheets[0] || "sheet1"];
        }
      }
      if (ctrl?.sheetButtonArr) {
        const btnSheets = Object.keys(ctrl.sheetButtonArr);
        if (btnSheets.length <= 1) {
          return [currentSheet || btnSheets[0] || "sheet1"];
        }
      }
    } catch (_) {}

    const keys = Object.keys(appMapping || {});
    if (keys.length <= 1) {
      return keys.length === 1 ? keys : [currentSheet || "sheet1"];
    }
    return keys;
  }, [appMapping, currentSheet, isStandalone, isOpen]);

  const [selectedSheet, setSelectedSheet] = useState<string>(() => {
    if (appMapping && appMapping[currentSheet]) return currentSheet;
    return availableSheets[0] || "sheet1";
  });

  useEffect(() => {
    if (isStandalone) {
      setSelectedSheet(currentSheet || availableSheets[0] || "sheet1");
    } else if (appMapping && appMapping[currentSheet]) {
      setSelectedSheet(currentSheet);
    } else if (availableSheets.length > 0) {
      setSelectedSheet(availableSheets[0]);
    }
  }, [currentSheet, availableSheets, appMapping, isStandalone]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // New cell form state
  const [newCell, setNewCell] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"text" | "image">("text");
  const [newEditable, setNewEditable] = useState(true);
  const [formError, setFormError] = useState("");

  // Items for the selected sheet
  const items = useMemo(() => {
    return parseAppMappingToItems(appMapping, selectedSheet);
  }, [appMapping, selectedSheet]);

  // Filtered by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.cell.toLowerCase().includes(q) ||
        it.title.toLowerCase().includes(q) ||
        it.type.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const editableCount = useMemo(() => items.filter((it) => it.editable).length, [items]);

  // Handlers
  const handleToggleItem = (item: EditableCellItem, checked: boolean) => {
    const updated = toggleCellEditable(appMapping, item, checked);
    updateMapping(updated);
  };

  const handleDeleteItem = (item: EditableCellItem) => {
    const updated = deleteCellMapping(appMapping, item);
    updateMapping(updated);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cellTrimmed = newCell.trim().toUpperCase();
    if (!cellTrimmed) {
      setFormError("Please enter a valid cell coordinate (e.g. C5).");
      return;
    }
    // Basic cell coordinate check (letters followed by digits)
    if (!/^[A-Z]+[0-9]+$/.test(cellTrimmed)) {
      setFormError("Invalid cell format. Use standard reference like B2, C14, D20.");
      return;
    }
    if (!newTitle.trim()) {
      setFormError("Please enter a title or label for this cell.");
      return;
    }

    const updated = addCellMapping(appMapping, selectedSheet, {
      cell: cellTrimmed,
      title: newTitle.trim(),
      type: newType,
      editable: newEditable,
    });

    updateMapping(updated);

    // Reset form
    setNewCell("");
    setNewTitle("");
    setNewType("text");
    setNewEditable(true);
    setFormError("");
    setShowAddForm(false);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="editable-cells-modal">
      <IonHeader>
        <IonToolbar color="primary" className="editable-cells-modal-toolbar">
          <div className="editable-cells-modal-header-wrapper">
            <IonIcon icon={checkboxOutline} className="editable-cells-header-icon" />
            <IonTitle className="editable-cells-modal-title">Editable Cells & Mappings</IonTitle>
          </div>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose} className="editable-cells-close-btn">
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Sheet Selector Segment if multiple sheets exist */}
        {availableSheets.length > 1 && (
          <IonToolbar className="editable-cells-sheet-toolbar">
            <IonSegment
              value={selectedSheet}
              onIonChange={(e) => setSelectedSheet(String(e.detail.value))}
            >
              {availableSheets.map((sh) => (
                <IonSegmentButton key={sh} value={sh}>
                  <IonLabel>{sh}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent fullscreen className="editable-cells-modal-content ion-padding">
        {/* Top Summary Bar */}
        <div className="editable-cells-summary-row">
          <div className="editable-cells-stats">
            <IonBadge color="primary" className="editable-cells-badge">
              Total Mapped: {items.length}
            </IonBadge>
            <IonBadge color="success" className="editable-cells-badge">
              Editable: {editableCount}
            </IonBadge>
            <IonBadge color="medium" className="editable-cells-badge">
              Locked: {items.length - editableCount}
            </IonBadge>
          </div>

          <IonButton
            size="small"
            fill={showAddForm ? "outline" : "solid"}
            color="primary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setFormError("");
            }}
            className="editable-cells-add-btn"
          >
            <IonIcon icon={addOutline} slot="start" />
            {showAddForm ? "Cancel" : "Add Cell"}
          </IonButton>
        </div>

        {/* Add New Cell Form Card */}
        {showAddForm && (
          <IonCard className="editable-cells-form-card">
            <IonCardContent>
              <div className="editable-cells-form-header">
                <span className="editable-cells-form-title">Add New Cell Mapping</span>
                <span className="editable-cells-form-subtitle">Target Sheet: {selectedSheet}</span>
              </div>

              {formError && <div className="editable-cells-form-error">{formError}</div>}

              <form onSubmit={handleAddSubmit} className="editable-cells-form">
                <div className="editable-cells-inputs-grid">
                  <div className="editable-cells-input-group">
                    <IonLabel className="editable-cells-input-label">Cell Reference *</IonLabel>
                    <IonInput
                      value={newCell}
                      placeholder="e.g. C5, E18, B2"
                      onIonInput={(e) => setNewCell(String(e.detail.value || ""))}
                      className="editable-cells-custom-input cell-ref-input"
                      autocapitalize="characters"
                    />
                  </div>

                  <div className="editable-cells-input-group">
                    <IonLabel className="editable-cells-input-label">Field Title / Name *</IonLabel>
                    <IonInput
                      value={newTitle}
                      placeholder="e.g. Due Date, Notes"
                      onIonInput={(e) => setNewTitle(String(e.detail.value || ""))}
                      className="editable-cells-custom-input"
                    />
                  </div>

                  <div className="editable-cells-input-group">
                    <IonLabel className="editable-cells-input-label">Field Type</IonLabel>
                    <IonSelect
                      value={newType}
                      onIonChange={(e) => setNewType(e.detail.value)}
                      interface="popover"
                      className="editable-cells-custom-select"
                    >
                      <IonSelectOption value="text">Text / Number</IonSelectOption>
                      <IonSelectOption value="image">Image / Logo</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="editable-cells-toggle-group">
                    <IonLabel className="editable-cells-input-label">Editable</IonLabel>
                    <div className="editable-toggle-wrapper">
                      <IonToggle
                        checked={newEditable}
                        onIonChange={(e) => setNewEditable(e.detail.checked)}
                      />
                      <span className="editable-toggle-status">
                        {newEditable ? "Allowed" : "Locked"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="editable-cells-form-actions">
                  <IonButton
                    type="submit"
                    fill="solid"
                    color="primary"
                    size="small"
                    className="editable-cells-submit-btn"
                  >
                    <IonIcon icon={checkmarkCircleOutline} slot="start" />
                    Add Mapping
                  </IonButton>
                </div>
              </form>
            </IonCardContent>
          </IonCard>
        )}

        {/* Searchbar */}
        <div className="editable-cells-search-wrapper">
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || "")}
            placeholder="Search mapped cells or titles..."
            debounce={100}
            className="editable-cells-searchbar"
          />
        </div>

        {/* Mapped Cells List */}
        <IonList className="editable-cells-list" lines="full">
          {filteredItems.length === 0 ? (
            <div className="editable-cells-empty-state">
              <IonIcon icon={layersOutline} className="editable-cells-empty-icon" />
              <div className="editable-cells-empty-title">
                {items.length === 0
                  ? "No cell mappings found in this sheet"
                  : "No matching cells found"}
              </div>
              <div className="editable-cells-empty-desc">
                {items.length === 0
                  ? "Click 'Add Cell' above to map an editable cell."
                  : "Try a different search term or clear the filter."}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <IonItem key={item.id} className="editable-cell-item">
                {/* Cell Ref Badge */}
                <div slot="start" className="editable-cell-badge-wrap">
                  <span className="editable-cell-coord">{item.cell}</span>
                </div>

                {/* Title & Metadata */}
                <IonLabel className="editable-cell-label">
                  <div className="editable-cell-title-row">
                    <span className="editable-cell-title">{item.title}</span>
                    <IonBadge
                      color={item.type === "image" ? "secondary" : "light"}
                      className="editable-cell-type-badge"
                    >
                      <IonIcon
                        icon={item.type === "image" ? imageOutline : documentTextOutline}
                        className="editable-cell-type-icon"
                      />
                      {item.type.toUpperCase()}
                    </IonBadge>
                  </div>
                </IonLabel>

                {/* Editable Toggle */}
                <div slot="end" className="editable-cell-actions">
                  <IonToggle
                    checked={item.editable}
                    onIonChange={(e) => handleToggleItem(item, e.detail.checked)}
                    className="editable-cell-toggle"
                  />
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    onClick={() => handleDeleteItem(item)}
                    className="editable-cell-delete-btn"
                    title="Delete cell mapping"
                  >
                    <IonIcon icon={trashOutline} slot="icon-only" />
                  </IonButton>
                </div>
              </IonItem>
            ))
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};
