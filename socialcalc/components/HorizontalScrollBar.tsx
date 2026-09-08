import React, { useEffect, useState, useCallback } from "react";
import {
  getHorizontalScrollInfo,
  scrollToColumn,
  scrollHorizontalBy,
  subscribeHorizontalScroll
} from "../modules/horizontal-scroll.js";
import "./HorizontalScrollBar.css";

export interface HorizontalScrollBarProps {
  /** Optional custom step size for arrow button clicks (default: 1) */
  step?: number;
  /** Optional CSS class name */
  className?: string;
  /** Optional callback when column changes */
  onColumnChange?: (colInfo: { firstCol: number; colName: string; totalCols: number }) => void;
}

export const HorizontalScrollBar: React.FC<HorizontalScrollBarProps> = ({
  step = 1,
  className = "",
  onColumnChange
}) => {
  const [scrollInfo, setScrollInfo] = useState(() => getHorizontalScrollInfo());

  // Subscribe to external scroll events (e.g. from gestures or programmatic scrolls)
  useEffect(() => {
    // Initial sync
    setScrollInfo(getHorizontalScrollInfo());

    const unsubscribe = subscribeHorizontalScroll((info) => {
      setScrollInfo(info);
      if (onColumnChange) {
        onColumnChange({
          firstCol: info.currentFirstCol,
          colName: info.currentColName,
          totalCols: info.totalCols
        });
      }
    });

    // Also listen to custom window events for extra compatibility
    const handleCustomScroll = (e: any) => {
      if (e.detail) {
        setScrollInfo(e.detail);
      }
    };
    window.addEventListener("socialcalc:horizontal-scroll", handleCustomScroll);

    // Periodic check to keep in sync if canvas/DOM scrolls without direct event
    const timer = setInterval(() => {
      const current = getHorizontalScrollInfo();
      setScrollInfo((prev) => {
        if (
          prev.currentFirstCol !== current.currentFirstCol ||
          prev.totalCols !== current.totalCols
        ) {
          return current;
        }
        return prev;
      });
    }, 400);

    return () => {
      unsubscribe();
      window.removeEventListener("socialcalc:horizontal-scroll", handleCustomScroll);
      clearInterval(timer);
    };
  }, [onColumnChange]);

  const handlePrev = useCallback(() => {
    scrollHorizontalBy(-step);
  }, [step]);

  const handleNext = useCallback(() => {
    scrollHorizontalBy(step);
  }, [step]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    scrollToColumn(val);
  }, []);

  const isAtStart = scrollInfo.currentFirstCol <= 1;
  const isAtEnd = scrollInfo.currentFirstCol >= scrollInfo.totalCols;

  return (
    <div className={`sc-hscroll-container ${className}`}>
      {/* Left Arrow Button */}
      <button
        type="button"
        className="sc-hscroll-btn"
        onClick={handlePrev}
        disabled={isAtStart}
        title={`Scroll Left (${step} Column)`}
        aria-label="Scroll Left"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Slider and Pill */}
      <div className="sc-hscroll-track-wrapper">
        <input
          type="range"
          className="sc-hscroll-slider"
          min={1}
          max={scrollInfo.totalCols}
          value={scrollInfo.currentFirstCol}
          onChange={handleSliderChange}
          aria-label="Horizontal Column Slider"
        />

        <div className="sc-hscroll-indicator">
          <span>Col {scrollInfo.currentColName}</span>
          <span style={{ opacity: 0.65, fontSize: "10px" }}>
            ({scrollInfo.currentFirstCol}/{scrollInfo.totalCols})
          </span>
        </div>
      </div>

      {/* Right Arrow Button */}
      <button
        type="button"
        className="sc-hscroll-btn"
        onClick={handleNext}
        disabled={isAtEnd}
        title={`Scroll Right (${step} Column)`}
        aria-label="Scroll Right"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default HorizontalScrollBar;
