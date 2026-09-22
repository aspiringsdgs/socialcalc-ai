/**
 * Horizontal Scroll Module & Plugin for SocialCalc
 * 
 * Provides slider controls, left/right arrow buttons, and column navigation
 * to smoothly scroll spreadsheets horizontally.
 */

import { getActiveEditor, registerPlugin } from "./plugin-manager.js";

import { SocialCalcRef } from "./runtime.js";

// Live reference to the global SocialCalc object (never a stale import-time copy)
let SocialCalc = SocialCalcRef;

let _enabled = false;
let _domContainer = null;
let _domElement = null;
const _scrollListeners = new Set();

/**
 * Convert 1-based column number to column name (e.g. 1 -> A, 27 -> AA)
 */
export function getColumnLetter(colNum) {
  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }
  if (SocialCalc && typeof SocialCalc.rcColname === "function") {
    return SocialCalc.rcColname(colNum);
  }
  let s = "";
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    colNum = Math.floor((colNum - mod) / 26);
  }
  return s || "A";
}

/**
 * Get current horizontal scroll metrics
 */
export function getHorizontalScrollInfo() {
  const editor = getActiveEditor();
  if (!editor || !editor.context) {
    return {
      currentFirstCol: 1,
      currentLastCol: 10,
      totalCols: 26,
      currentColName: "A",
      lastColName: "J"
    };
  }

  const colpanes = editor.context.colpanes;
  const lastPane = colpanes && colpanes.length > 0 ? colpanes[colpanes.length - 1] : { first: 1, last: 10 };
  const currentFirstCol = lastPane.first || 1;
  const currentLastCol = lastPane.last || 10;
  const sheetLastCol = editor.context.sheetobj?.attribs?.lastcol || 26;
  const totalCols = Math.max(26, sheetLastCol);

  return {
    currentFirstCol,
    currentLastCol,
    totalCols,
    currentColName: getColumnLetter(currentFirstCol),
    lastColName: getColumnLetter(currentLastCol)
  };
}

/**
 * Scroll horizontally by a relative column delta
 * @param {number} colDelta Positive to scroll right, negative to scroll left
 */
export function scrollHorizontalBy(colDelta) {
  if (colDelta === 0) return;
  const editor = getActiveEditor();
  if (!editor) return;

  if (typeof window !== "undefined" && window.SocialCalc) {
    SocialCalc = window.SocialCalc;
  }

  if (editor.ScrollRelativeBoth) {
    editor.ScrollRelativeBoth(0, colDelta);
  } else if (SocialCalc.ScrollRelativeBoth) {
    SocialCalc.ScrollRelativeBoth(editor, 0, colDelta);
  }

  notifyScrollChange();
}

/**
 * Scroll horizontally to a specific 1-based column
 * @param {number} targetCol 
 */
export function scrollToColumn(targetCol) {
  const info = getHorizontalScrollInfo();
  const clampedTarget = Math.max(1, Math.min(info.totalCols, targetCol));
  const delta = clampedTarget - info.currentFirstCol;
  if (delta !== 0) {
    scrollHorizontalBy(delta);
  }
}

/**
 * Subscribe to horizontal scroll changes
 * @param {function(object): void} listener 
 * @returns {function(): void} Unsubscribe
 */
export function subscribeHorizontalScroll(listener) {
  _scrollListeners.add(listener);
  return () => _scrollListeners.delete(listener);
}

function notifyScrollChange() {
  const info = getHorizontalScrollInfo();
  for (const listener of _scrollListeners) {
    try {
      listener(info);
    } catch (e) {
      console.error("[HorizontalScroll] Listener error:", e);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("socialcalc:horizontal-scroll", { detail: info }));
  }

  if (_domElement) {
    updateDomSlider();
  }
}

/**
 * Enable horizontal scroll module
 */
export function enableHorizontalScroll(options = {}) {
  _enabled = true;
  if (options.container) {
    mountHorizontalScrollBar(options.container, options);
  }
  notifyScrollChange();
}

/**
 * Disable horizontal scroll module
 */
export function disableHorizontalScroll() {
  _enabled = false;
  unmountHorizontalScrollBar();
  notifyScrollChange();
}

/**
 * Check if horizontal scroll module is enabled
 */
export function isHorizontalScrollEnabled() {
  return _enabled;
}

/**
 * Mount a vanilla DOM horizontal slider bar into a container element
 */
export function mountHorizontalScrollBar(container, options = {}) {
  unmountHorizontalScrollBar();

  if (typeof container === "string") {
    container = document.querySelector(container);
  }
  if (!container) return;

  _domContainer = container;

  const wrapper = document.createElement("div");
  wrapper.className = "sc-horizontal-scroll-bar";
  wrapper.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -2px 6px rgba(0,0,0,0.04);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    z-index: 10;
  `;

  // Left button
  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.innerHTML = "&#9664;"; // ◀
  leftBtn.title = "Scroll Left (1 Column)";
  leftBtn.style.cssText = `
    border: none;
    background: #f1f5f9;
    color: #334155;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  `;
  leftBtn.onclick = () => scrollHorizontalBy(-1);

  // Slider container
  const sliderContainer = document.createElement("div");
  sliderContainer.style.cssText = `
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  // Range Slider
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "26";
  slider.value = "1";
  slider.style.cssText = `
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: #cbd5e1;
    outline: none;
    cursor: pointer;
    accent-color: #3b82f6;
  `;
  slider.oninput = (e) => {
    const val = parseInt(e.target.value, 10);
    scrollToColumn(val);
  };

  // Column indicator pill
  const pill = document.createElement("span");
  pill.style.cssText = `
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
    flex-shrink: 0;
  `;
  pill.textContent = "Col A (1)";

  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(pill);

  // Right button
  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.innerHTML = "&#9654;"; // ▶
  rightBtn.title = "Scroll Right (1 Column)";
  rightBtn.style.cssText = `
    border: none;
    background: #f1f5f9;
    color: #334155;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  `;
  rightBtn.onclick = () => scrollHorizontalBy(1);

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(sliderContainer);
  wrapper.appendChild(rightBtn);

  _domContainer.appendChild(wrapper);
  _domElement = wrapper;

  updateDomSlider();
}

/**
 * Update the mounted DOM slider
 */
function updateDomSlider() {
  if (!_domElement) return;
  const slider = _domElement.querySelector('input[type="range"]');
  const pill = _domElement.querySelector("span");
  const info = getHorizontalScrollInfo();

  if (slider) {
    slider.max = info.totalCols.toString();
    slider.value = info.currentFirstCol.toString();
  }
  if (pill) {
    pill.textContent = `Col ${info.currentColName} (${info.currentFirstCol}/${info.totalCols})`;
  }
}

/**
 * Unmount the vanilla DOM horizontal scroll bar
 */
export function unmountHorizontalScrollBar() {
  if (_domElement && _domElement.parentNode) {
    _domElement.parentNode.removeChild(_domElement);
  }
  _domElement = null;
  _domContainer = null;
}

// Register as a plugin in the plugin manager
registerPlugin("horizontalScroll", {
  metadata: {
    displayName: "Horizontal Scroll Slider",
    description: "Slider with arrow buttons at the bottom to scroll spreadsheet horizontally"
  },
  enable: enableHorizontalScroll,
  disable: disableHorizontalScroll,
  isEnabled: isHorizontalScrollEnabled
});
