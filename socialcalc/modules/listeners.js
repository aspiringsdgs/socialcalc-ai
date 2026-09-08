// Cell change listeners and event handling
let SocialCalc;

// Ensure SocialCalc is loaded from the global scope
if (typeof window !== "undefined" && window.SocialCalc) {
  SocialCalc = window.SocialCalc;
} else if (typeof global !== "undefined" && global.SocialCalc) {
  SocialCalc = global.SocialCalc;
} else {
  console.error("SocialCalc not found in global scope");
  SocialCalc = {}; // Fallback to prevent errors
}

import { enhancedShowPrompt } from "./prompts.js";
import { registerPlugin } from "./plugin-manager.js";
import { selectRow, selectColumn, setColumnWidth, hideColumnResizeHandle, isRowColHeadersEnabled } from "./row-col-headers.js";
import { isEditableCellsOnlyEnabled, isCellEditable } from "./editable-cells.js";

let _cellEditModalEnabled = true;
if (typeof window !== "undefined") {
  window.SocialCalc = window.SocialCalc || {};
  window.SocialCalc.isCellEditModalEnabled = () => _cellEditModalEnabled;
}

/**
 * Enable Cell Edit Modal
 */
export function enableCellEditModal() {
  _cellEditModalEnabled = true;
  if (typeof window !== "undefined" && window.SocialCalc) {
    window.SocialCalc.isCellEditModalEnabled = () => true;
  }
}

/**
 * Disable Cell Edit Modal (falls back to native cell inputs)
 */
export function disableCellEditModal() {
  _cellEditModalEnabled = false;
  if (typeof window !== "undefined" && window.SocialCalc) {
    window.SocialCalc.isCellEditModalEnabled = () => false;
  }
}

/**
 * Check if Cell Edit Modal is enabled
 */
export function isCellEditModalEnabled() {
  return _cellEditModalEnabled;
}

/**
 * Toggle Cell Edit Modal
 */
export function toggleCellEditModal(show) {
  _cellEditModalEnabled = typeof show === "boolean" ? show : !_cellEditModalEnabled;
  if (typeof window !== "undefined" && window.SocialCalc) {
    window.SocialCalc.isCellEditModalEnabled = () => _cellEditModalEnabled;
  }
  return _cellEditModalEnabled;
}

// Register as a plugin in the plugin manager
registerPlugin("cellEditModal", {
  metadata: {
    displayName: "Cell Edit Modal",
    description: "Custom bottom sheet modal for cell value and color editing"
  },
  enable: enableCellEditModal,
  disable: disableCellEditModal,
  isEnabled: isCellEditModalEnabled,
  toggle: toggleCellEditModal
});

/**
 * Handle custom smooth column resizing
 */
function startColumnResize(startEvent, editor, colNum) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  const startX = startEvent.clientX;
  const initialWidth =
    (editor.colwidth && editor.colwidth[colNum]) ||
    (editor.context && editor.context.colwidth && editor.context.colwidth[colNum]) ||
    50;
  const colLetter = SocialCalc.rcColname ? SocialCalc.rcColname(colNum) : String.fromCharCode(64 + colNum);

  // Remove any legacy stuck resize display or previous guides
  const existing = document.querySelectorAll(".sc-col-resize-guide, .sc-col-resize-tooltip");
  existing.forEach((el) => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  // Modern vertical guideline
  const guide = document.createElement("div");
  guide.className = "sc-col-resize-guide";
  guide.style.position = "fixed";
  guide.style.top = "0px";
  guide.style.bottom = "0px";
  guide.style.width = "3px";
  guide.style.backgroundColor = "#2563eb";
  guide.style.zIndex = "99999";
  guide.style.pointerEvents = "none";
  guide.style.boxShadow = "0 0 8px rgba(37, 99, 235, 0.8)";
  guide.style.left = `${startEvent.clientX}px`;
  document.body.appendChild(guide);

  // Floating width tooltip badge
  const tooltip = document.createElement("div");
  tooltip.className = "sc-col-resize-tooltip";
  tooltip.style.position = "fixed";
  tooltip.style.top = `${Math.max(10, startEvent.clientY - 34)}px`;
  tooltip.style.left = `${startEvent.clientX + 8}px`;
  tooltip.style.backgroundColor = "#0f172a";
  tooltip.style.color = "#ffffff";
  tooltip.style.padding = "4px 8px";
  tooltip.style.borderRadius = "6px";
  tooltip.style.fontSize = "12px";
  tooltip.style.fontWeight = "700";
  tooltip.style.zIndex = "100000";
  tooltip.style.pointerEvents = "none";
  tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  tooltip.textContent = `Col ${colLetter}: ${initialWidth}px`;
  document.body.appendChild(tooltip);

  let currentWidth = initialWidth;
  let hasMoved = false;

  const onMouseMove = (moveEvent) => {
    const delta = moveEvent.clientX - startX;
    if (Math.abs(delta) > 3) {
      hasMoved = true;
    }
    const minWidth = (SocialCalc && SocialCalc.Constants && SocialCalc.Constants.defaultMinimumColWidth) || 10;
    currentWidth = Math.max(minWidth, Math.round(initialWidth + delta));
    guide.style.left = `${moveEvent.clientX}px`;
    tooltip.style.left = `${moveEvent.clientX + 8}px`;
    tooltip.textContent = `Col ${colLetter}: ${currentWidth}px`;
    if (moveEvent.preventDefault) moveEvent.preventDefault();
  };

  const onMouseUp = (upEvent) => {
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    if (guide.parentNode) guide.parentNode.removeChild(guide);
    if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);

    if (!hasMoved) {
      // User clicked on/near border without dragging: select column
      selectColumn(colNum);
    } else {
      // Apply the column width update
      setColumnWidth(colNum, currentWidth);
      setTimeout(() => {
        showColumnResizeHandle(colNum);
      }, 60);
    }
    if (upEvent.preventDefault) upEvent.preventDefault();
  };

  document.addEventListener("mousemove", onMouseMove, true);
  document.addEventListener("mouseup", onMouseUp, true);
}

export function setupMouseListener() {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (!SocialCalc || !SocialCalc.EditorMouseInfo) return;

  const originalDblClick = SocialCalc.ProcessEditorDblClick;

  // Intercept Cell Clicks
  SocialCalc.ProcessEditorMouseDown = function (e) {
    var editor, result, coord, range;
    var event = e || window.event;

    // Helper to get viewport info safely
    var viewport = SocialCalc.GetViewportInfo ? SocialCalc.GetViewportInfo() : { horizontalScroll: 0, verticalScroll: 0 };
    var clientX = event.clientX + viewport.horizontalScroll;
    var clientY = event.clientY + viewport.verticalScroll;

    var mouseinfo = SocialCalc.EditorMouseInfo;
    var ele = event.target || event.srcElement;
    var mobj;

    if (mouseinfo.ignore) return;

    // Traverse up to find the editor element
    for (mobj = null; !mobj && ele; ele = ele.parentNode) {
      if (SocialCalc.LookupElement) {
        mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
      }
    }
    if (!mobj) {
      mouseinfo.editor = null;
      return;
    }

    editor = mobj.editor;
    mouseinfo.element = ele;
    range = editor.range;

    // Get grid position
    if (SocialCalc.GridMousePosition) {
      result = SocialCalc.GridMousePosition(editor, clientX, clientY);
    }

    if (!result) return;
    mouseinfo.editor = editor;

    // Handle Row Header Click -> Highlight Row and dispatch Row Action Popover Event
    if (isRowColHeadersEnabled() && result.rowheader) {
      var rowNum = result.row;
      selectRow(rowNum);
      window.dispatchEvent(new CustomEvent("socialcalc:row-header-click", {
        detail: {
          rowNum: rowNum,
          clientX: event.clientX,
          clientY: event.clientY
        }
      }));
      if (event.stopPropagation) event.stopPropagation();
      if (event.preventDefault) event.preventDefault();
      return;
    }

    // Handle Column Header Click vs Right-Edge Resize
    var isColHeader = Boolean(result && result.colheader);
    var headerTd = ele;
    while (headerTd && headerTd.tagName !== "TD" && headerTd.tagName !== "TH" && headerTd !== document.body) {
      headerTd = headerTd.parentNode;
    }
    if (!isColHeader && headerTd && headerTd.className && typeof headerTd.className === "string" && headerTd.className.indexOf("colname") !== -1) {
      isColHeader = true;
    }

    if (isRowColHeadersEnabled() && isColHeader) {
      var colNum = result ? result.col : null;

      // 1. Direct letter resolution from clicked DOM element (most accurate for narrow columns like G)
      var clickedLetter = (headerTd && headerTd.textContent) ? headerTd.textContent.trim().toUpperCase() : "";
      if (clickedLetter && clickedLetter.length <= 2 && /^[A-Z]+$/.test(clickedLetter)) {
        var parsedCol = 0;
        for (var ci = 0; ci < clickedLetter.length; ci++) {
          parsedCol = parsedCol * 26 + (clickedLetter.charCodeAt(ci) - 64);
        }
        if (parsedCol > 0) {
          colNum = parsedCol;
        }
      }

      // Clamp colNum to sheet bounds
      var lastCol = (editor.context && editor.context.sheetobj && editor.context.sheetobj.attribs && editor.context.sheetobj.attribs.lastcol) || 26;
      if (!colNum || colNum < 1) colNum = 1;
      if (colNum > lastCol) colNum = lastCol;

      var colRight = (editor.colpositions && editor.colpositions[colNum] !== undefined && editor.colwidth && editor.colwidth[colNum] !== undefined)
        ? (editor.colpositions[colNum] + editor.colwidth[colNum])
        : 0;
      var colLeft = (editor.colpositions && editor.colpositions[colNum] !== undefined) ? editor.colpositions[colNum] : 0;
      var colWidth = (editor.colwidth && editor.colwidth[colNum] !== undefined) ? editor.colwidth[colNum] : (colRight - colLeft);

      // Small columns (<= 45px) or touch interactions ALWAYS select the column directly
      // This ensures narrow columns (like G) can be selected easily without edge-resize hijacking the click
      var isTouch = Boolean(event.touches && event.touches.length > 0) || Boolean(window.TouchEvent && event instanceof TouchEvent);
      var canEdgeResize = !isTouch && colWidth > 45;

      var isNearRightEdge = canEdgeResize && colRight > 0 && Math.abs(clientX - colRight) <= 4;
      var isNearLeftEdge = canEdgeResize && colLeft > 0 && Math.abs(clientX - colLeft) <= 4;

      if (isNearRightEdge) {
        startColumnResize(event, editor, colNum);
      } else if (isNearLeftEdge && colNum > 1) {
        startColumnResize(event, editor, colNum - 1);
      } else {
        selectColumn(colNum);
      }
      if (event.stopPropagation) event.stopPropagation();
      if (event.preventDefault) event.preventDefault();
      return;
    }

    if (!result.coord) return;
    hideColumnResizeHandle();

    // Shift key Range Anchor
    if (!range.hasrange) {
      if (e.shiftKey) editor.RangeAnchor();
    }

    // Toggle Cell Callback
    if (SocialCalc.Callbacks && SocialCalc.Callbacks.ToggleCell) {
      SocialCalc.Callbacks.ToggleCell(result.coord);
    }

    // Move ECell (Updates Selection)
    coord = editor.MoveECell(result.coord);

    // Handle Range Extension
    if (range.hasrange) {
      if (e.shiftKey) editor.RangeExtend();
      else editor.RangeRemove();
    }

    mouseinfo.mousedowncoord = coord;
    mouseinfo.mouselastcoord = coord;

    // Update Mouse Range
    editor.EditorMouseRange(coord);

    // --- CUSTOM LOGIC ---
    if (_cellEditModalEnabled) {
      const onlyEditable =
        (typeof isEditableCellsOnlyEnabled === "function" && isEditableCellsOnlyEnabled()) ||
        (typeof window !== "undefined" && window.SocialCalc && window.SocialCalc.isEditableCellsOnlyEnabled && window.SocialCalc.isEditableCellsOnlyEnabled());

      if (onlyEditable && !isCellEditable(editor, coord)) {
        // Cell is not marked as editable: selection has moved, do not trigger modal
      } else {
        triggerCustomModal(editor);
      }
    } else {
      // Default to native cell input
      if (editor && editor.ecell && editor.EditorOpenCellEdit) {
        editor.EditorOpenCellEdit(coord);
      }
    }
    // --------------------

    // Setup drag listeners (mousemove, mouseup)
    if (document.addEventListener) {
      document.addEventListener("mousemove", SocialCalc.ProcessEditorMouseMove, true);
      document.addEventListener("mouseup", SocialCalc.ProcessEditorMouseUp, true);
    } else if (ele.attachEvent) {
      ele.setCapture();
      ele.attachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
      ele.attachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
      ele.attachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
    }

    // Prevent default browser actions
    if (event.stopPropagation) event.stopPropagation();
    else event.cancelBubble = true;
    if (event.preventDefault) event.preventDefault();
    else event.returnValue = false;

    return;
  };

  // Override Double Click to suppress native input logic if modal enabled
  SocialCalc.ProcessEditorDblClick = function (e) {
    if (_cellEditModalEnabled) {
      var event = e || window.event;
      if (event.stopPropagation) event.stopPropagation();
      else event.cancelBubble = true;
      if (event.preventDefault) event.preventDefault();
      else event.returnValue = false;
      return false;
    }
    if (originalDblClick) return originalDblClick.apply(this, arguments);
  };

  // --- KB Patch: Prevent SocialCalc from stealing keys when Modal is open ---
  const originalKeyDown = SocialCalc.ProcessKeyDown;
  const originalKeyPress = SocialCalc.ProcessKeyPress;

  SocialCalc.ProcessKeyDown = function (e) {
    const isModalOpen = !!document.querySelector(".sc-cell-edit-backdrop");
    const activeElement = document.activeElement;
    const isTypingInInput =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true");

    if (isModalOpen || isTypingInInput) {
      return true; // Let standard browser inputs handle key events
    }

    if (originalKeyDown) {
      return originalKeyDown.apply(this, arguments);
    }
    return true;
  };

  SocialCalc.ProcessKeyPress = function (e) {
    const isModalOpen = !!document.querySelector(".sc-cell-edit-backdrop");
    const activeElement = document.activeElement;
    const isTypingInInput =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.getAttribute("contenteditable") === "true");

    if (isModalOpen || isTypingInInput) {
      return true;
    }

    if (originalKeyPress) {
      return originalKeyPress.apply(this, arguments);
    }
    return true;
  };

  return () => {
    // Cleanup if needed
  };
}

/**
 * Extracts cell text and dispatches custom modal event
 */
function triggerCustomModal(editor) {
  if (!editor || !editor.ecell) return;

  const coord = editor.ecell.coord;
  const sheet = editor.context.sheetobj;
  const cell = sheet.GetAssuredCell(coord);

  // Hide the native input box and cancel its timer
  if (editor.inputBox) {
    if (editor.inputBox.timer) {
      window.clearTimeout(editor.inputBox.timer);
      editor.inputBox.timer = null;
    }
    if (editor.inputBox.element) {
      editor.inputBox.element.style.display = "none";
    }
    editor.inputBox.active = false;
  }

  // Remove any legacy formulabardiv attached by SocialCalc core
  const formulaDiv = document.getElementById("formulabardiv");
  if (formulaDiv) {
    formulaDiv.style.display = "none";
    if (formulaDiv.parentNode) {
      formulaDiv.parentNode.removeChild(formulaDiv);
    }
  }

  // Determine initial text
  let initialText = "";
  if (cell.datavalue !== undefined && cell.datavalue !== null) {
    initialText = String(cell.datavalue);
  } else if (cell.displaystring !== undefined && cell.displaystring !== null) {
    initialText = String(cell.displaystring);
  }

  // Callback when user confirms edit in Modal
  const handleOk = (newValue) => {
    let cmd = "";
    const isNum = !isNaN(Number(newValue)) && newValue.trim() !== "";

    if (isNum) {
      cmd = `set ${coord} value n ${newValue}`;
    } else {
      const isHtml = /<[a-z][\s\S]*>/i.test(newValue);
      if (isHtml) {
        cmd = `set ${coord} text th ${newValue}\nset ${coord} textvalueformat text-html`;
      } else {
        cmd = `set ${coord} text t ${newValue}`;
      }
    }

    // Schedule command on active editor
    if (editor.EditorScheduleSheetCommands) {
      editor.EditorScheduleSheetCommands(cmd, true, false);
    }

    // Dispatch cell change event
    window.dispatchEvent(
      new CustomEvent("socialcalc:cell-change", {
        detail: { coord, value: newValue }
      })
    );
  };

  // Dispatch custom event for React to show bottom sheet Modal
  window.dispatchEvent(
    new CustomEvent("socialcalc:cell-edit-request", {
      detail: {
        coord: coord,
        text: initialText,
        okfn: handleOk,
        cleanup: () => {
          // Re-render and schedule positions
          if (editor.ScheduleRender) editor.ScheduleRender();
        },
      },
    })
  );
}

/**
 * Setup a callback listener for cell value changes.
 * Returns a cleanup function to remove the listener.
 */
export function setupCellChangeListener(callback) {
  if (typeof window === "undefined") return () => {};

  const handleCellChange = (e) => {
    if (callback && e.detail && e.detail.coord) {
      callback(e.detail.coord);
    }
  };

  window.addEventListener("socialcalc:cell-change", handleCellChange);

  let origStatusCallback = null;
  if (window.SocialCalc && window.SocialCalc.EditorSheetStatusCallback) {
    origStatusCallback = window.SocialCalc.EditorSheetStatusCallback;
    window.SocialCalc.EditorSheetStatusCallback = function (recalcdata, status, arg, editor) {
      if (origStatusCallback) {
        origStatusCallback.apply(this, arguments);
      }
      if (status === "done" && arg && callback) {
        callback(arg);
      }
    };
  }

  return () => {
    window.removeEventListener("socialcalc:cell-change", handleCellChange);
    if (origStatusCallback && window.SocialCalc) {
      window.SocialCalc.EditorSheetStatusCallback = origStatusCallback;
    }
  };
}

