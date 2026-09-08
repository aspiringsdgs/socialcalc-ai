import React from "react";
import "./RowActionPopover.css";

export interface RowActionPopoverProps {
  isOpen: boolean;
  rowNum: number | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onInsertAbove: (rowNum: number) => void;
  onInsertBelow: (rowNum: number) => void;
  onDeleteRow: (rowNum: number) => void;
}

export const RowActionPopover: React.FC<RowActionPopoverProps> = ({
  isOpen,
  rowNum,
  position,
  onClose,
  onInsertAbove,
  onInsertBelow,
  onDeleteRow,
}) => {
  if (!isOpen || rowNum === null || !position) return null;

  // Ensure popover stays within viewport bounds
  const left = Math.min(window.innerWidth - 200, Math.max(10, position.x + 8));
  const top = Math.min(window.innerHeight - 180, Math.max(10, position.y - 10));

  return (
    <>
      <div className="sc-row-popover-backdrop" onClick={onClose} />
      <div
        className="sc-row-popover-menu"
        style={{ left: `${left}px`, top: `${top}px` }}
      >
        <div className="sc-row-popover-header">
          <span className="sc-row-popover-title">Row {rowNum}</span>
        </div>

        <button
          type="button"
          className="sc-row-popover-item"
          onClick={() => {
            onInsertAbove(rowNum);
            onClose();
          }}
        >
          <span className="sc-row-popover-icon">+</span>
          <span>Insert above</span>
        </button>

        <button
          type="button"
          className="sc-row-popover-item"
          onClick={() => {
            onInsertBelow(rowNum);
            onClose();
          }}
        >
          <span className="sc-row-popover-icon">+</span>
          <span>Insert below</span>
        </button>

        <div className="sc-row-popover-divider" />

        <button
          type="button"
          className="sc-row-popover-item danger"
          onClick={() => {
            onDeleteRow(rowNum);
            onClose();
          }}
        >
          <span className="sc-row-popover-icon">&minus;</span>
          <span>Delete row</span>
        </button>
      </div>
    </>
  );
};

export default RowActionPopover;
