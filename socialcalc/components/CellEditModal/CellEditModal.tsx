import React, { useState, useEffect, useRef } from 'react';
import * as AppGeneral from '../../index.js';
import { compressImage } from '../../utils/imageCompressor';
import './CellEditModal.css';

export interface CellData {
  coord: string;
  text: string;
  okfn: (value: string) => void;
  cleanup?: () => void;
}

export interface CellEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: CellData | null;
  /** Optional custom title */
  title?: string;
}

export const FONT_COLORS = [
  { name: 'Default', color: null, value: null },
  { name: 'Black', color: '#000000', value: 'black' },
  { name: 'White', color: '#ffffff', value: 'white' },
  { name: 'Red', color: '#ef4444', value: 'red' },
  { name: 'Blue', color: '#3b82f6', value: 'blue' },
  { name: 'Green', color: '#22c55e', value: 'green' },
  { name: 'Yellow', color: '#eab308', value: 'yellow' },
  { name: 'Purple', color: '#a855f7', value: 'purple' },
];

export const BG_COLORS = [
  { name: 'Default', color: null, value: null },
  { name: 'White', color: '#ffffff', value: 'white' },
  { name: 'Light Gray', color: '#d1d5db', value: 'lightgray' },
  { name: 'Light Blue', color: '#bfdbfe', value: 'lightblue' },
  { name: 'Light Green', color: '#bbf7d0', value: 'lightgreen' },
  { name: 'Light Yellow', color: '#fef08a', value: 'lightyellow' },
  { name: 'Light Pink', color: '#fbcfe8', value: 'lightpink' },
];

export const BORDER_POSITIONS = [
  { id: 'all', label: 'All' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'none', label: 'None' },
];

export const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
export const BORDER_WIDTHS = ['1px', '2px', '3px', '4px'];
export const BORDER_COLORS = [
  { name: 'Black', color: '#000000' },
  { name: 'Slate', color: '#334155' },
  { name: 'Light Gray', color: '#cbd5e1' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Green', color: '#16a34a' },
];

export interface CellFormatOption {
  id: string;
  name: string;
  formatString: string;
  category: 'general' | 'number' | 'currency' | 'percent' | 'date' | 'time';
  preview: string;
}

export const CELL_FORMAT_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'number', label: 'Number' },
  { id: 'currency', label: 'Currency' },
  { id: 'percent', label: 'Percent' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
];

export const POPULAR_CELL_FORMATS: CellFormatOption[] = [
  // General
  { id: 'default', name: 'Default', formatString: '', category: 'general', preview: 'Automatic' },
  { id: 'auto_commas', name: 'Auto w/ commas', formatString: '[,]General', category: 'general', preview: '1,234.56' },

  // Numbers
  { id: 'num_2dec', name: '1,234.56', formatString: '#,##0.00', category: 'number', preview: '1,234.56' },
  { id: 'num_int', name: '1,234', formatString: '#,##0', category: 'number', preview: '1,234' },
  { id: 'num_1dec', name: '1,234.5', formatString: '#,##0.0', category: 'number', preview: '1,234.5' },
  { id: 'num_plain', name: '1234', formatString: '0', category: 'number', preview: '1234' },
  { id: 'num_parens', name: '(1,234.56)', formatString: '#,##0.00_);(#,##0.00)', category: 'number', preview: '(1,234.56)' },

  // Currency
  { id: 'curr_2dec', name: '$1,234.56', formatString: '$#,##0.00', category: 'currency', preview: '$1,234.56' },
  { id: 'curr_whole', name: '$1,234', formatString: '$#,##0', category: 'currency', preview: '$1,234' },
  { id: 'curr_1dec', name: '$1,234.5', formatString: '$#,##0.0', category: 'currency', preview: '$1,234.5' },
  { id: 'curr_parens', name: '($1,234.56)', formatString: '$#,##0.00_);($#,##0.00)', category: 'currency', preview: '($1,234.56)' },

  // Percent
  { id: 'pct_whole', name: '1,234%', formatString: '#,##0%', category: 'percent', preview: '12%' },
  { id: 'pct_1dec', name: '1,234.5%', formatString: '#,##0.0%', category: 'percent', preview: '12.5%' },
  { id: 'pct_2dec', name: '1,234.56%', formatString: '#,##0.00%', category: 'percent', preview: '12.34%' },

  // Date
  { id: 'date_us', name: '01/04/2006', formatString: 'mm/dd/yyyy', category: 'date', preview: '01/04/2026' },
  { id: 'date_short', name: '1/4/06', formatString: 'm/d/yy', category: 'date', preview: '1/4/26' },
  { id: 'date_iso', name: '2006-01-04', formatString: 'yyyy-mm-dd', category: 'date', preview: '2026-01-04' },
  { id: 'date_med', name: '04-Jan-2006', formatString: 'dd-mmm-yyyy', category: 'date', preview: '04-Jan-2026' },
  { id: 'date_long', name: 'January 4, 2006', formatString: 'mmmm d, yyyy', category: 'date', preview: 'January 4, 2026' },

  // Time
  { id: 'time_12h', name: '1:23 PM', formatString: 'h:mm AM/PM', category: 'time', preview: '1:23 PM' },
  { id: 'time_24h_sec', name: '01:23:45', formatString: 'hh:mm:ss', category: 'time', preview: '01:23:45' },
  { id: 'time_24h', name: '1:23', formatString: 'h:mm', category: 'time', preview: '1:23' },
];

export const CellEditModal: React.FC<CellEditModalProps> = ({
  isOpen,
  onClose,
  cellData,
  title = 'Edit Cell'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Formatting state
  const [selectedFontColor, setSelectedFontColor] = useState<any>(FONT_COLORS[0]);
  const [selectedBgColor, setSelectedBgColor] = useState<any>(BG_COLORS[0]);
  const [showOptions, setShowOptions] = useState(false);
  const [showFontColors, setShowFontColors] = useState(false);
  const [showBgColors, setShowBgColors] = useState(false);

  // Cell format state
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedValueFormat, setSelectedValueFormat] = useState<CellFormatOption>(POPULAR_CELL_FORMATS[0]);
  const [selectedFormatCategory, setSelectedFormatCategory] = useState<string>('all');
  const [isValueFormatChanged, setIsValueFormatChanged] = useState(false);

  // Border state
  const [showBorderOptions, setShowBorderOptions] = useState(false);
  const [borderPlacement, setBorderPlacement] = useState<string>('none');
  const [borderStyle, setBorderStyle] = useState<string>('solid');
  const [borderWidth, setBorderWidth] = useState<string>('1px');
  const [borderColor, setBorderColor] = useState<string>('#000000');

  // Change tracking flags - ensure editing one property does not alter or disrupt others
  const [isFontColorChanged, setIsFontColorChanged] = useState(false);
  const [isBgColorChanged, setIsBgColorChanged] = useState(false);
  const [isBorderChanged, setIsBorderChanged] = useState(false);

  // Logo / Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard offset detection via visualViewport
  useEffect(() => {
    if (!isOpen) {
      setKeyboardHeight(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const onViewportResize = () => {
      const kbHeight = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardHeight(kbHeight);
    };

    viewport.addEventListener('resize', onViewportResize);
    viewport.addEventListener('scroll', onViewportResize);
    onViewportResize();

    return () => {
      viewport.removeEventListener('resize', onViewportResize);
      viewport.removeEventListener('scroll', onViewportResize);
      setKeyboardHeight(0);
    };
  }, [isOpen]);

  // Sync cell data when modal opens
  useEffect(() => {
    if (isOpen && cellData) {
      setInputValue(cellData.text || '');
      setIsFontColorChanged(false);
      setIsBgColorChanged(false);
      setIsBorderChanged(false);
      setIsValueFormatChanged(false);
      setShowFormatOptions(false);
      setSelectedFormatCategory('all');

      let matchedFont = FONT_COLORS[0];
      let matchedBg = BG_COLORS[0];
      let matchedFormat = POPULAR_CELL_FORMATS[0];

      try {
        const formatting = AppGeneral.getCellFormatting
          ? AppGeneral.getCellFormatting(cellData.coord)
          : null;
        if (formatting) {
          if (formatting.color) {
            const fColorLower = formatting.color.toLowerCase().trim();
            const found = FONT_COLORS.find(
              (c) =>
                (c.value && c.value.toLowerCase() === fColorLower) ||
                (c.color && c.color.toLowerCase() === fColorLower)
            );
            matchedFont = found || { name: 'Current', color: formatting.color, value: formatting.color };
          }
          if (formatting.bgcolor) {
            const bColorLower = formatting.bgcolor.toLowerCase().trim();
            const found = BG_COLORS.find(
              (c) =>
                (c.value && c.value.toLowerCase() === bColorLower) ||
                (c.color && c.color.toLowerCase() === bColorLower)
            );
            matchedBg = found || { name: 'Current', color: formatting.bgcolor, value: formatting.bgcolor };
          }

          if (formatting.valueFormat) {
            const rawFmt = formatting.valueFormat.trim();
            const foundFmt = POPULAR_CELL_FORMATS.find(
              (f) => f.formatString === rawFmt || f.formatString.toLowerCase() === rawFmt.toLowerCase()
            );
            matchedFormat = foundFmt || {
              id: 'custom',
              name: rawFmt,
              formatString: rawFmt,
              category: 'number',
              preview: rawFmt,
            };
          }

          // Inspect cell borders
          const b = formatting.borders;
          const topB = b?.top;
          const bottomB = b?.bottom;
          const leftB = b?.left;
          const rightB = b?.right;

          let detectedPlacement = 'none';
          if (topB && bottomB && leftB && rightB) {
            detectedPlacement = 'all';
          } else if (bottomB && !topB && !leftB && !rightB) {
            detectedPlacement = 'bottom';
          } else if (topB && !bottomB && !leftB && !rightB) {
            detectedPlacement = 'top';
          } else if (leftB && !topB && !bottomB && !rightB) {
            detectedPlacement = 'left';
          } else if (rightB && !topB && !bottomB && !leftB) {
            detectedPlacement = 'right';
          } else if (bottomB) {
            detectedPlacement = 'bottom';
          } else if (topB) {
            detectedPlacement = 'top';
          }

          setBorderPlacement(detectedPlacement);

          const existingBorderStr = bottomB || topB || leftB || rightB;
          if (existingBorderStr) {
            const match = existingBorderStr.match(/(\S+)\s+(\S+)\s+(\S.+)/);
            if (match) {
              const w = match[1];
              const s = match[2];
              const c = match[3];
              if (BORDER_WIDTHS.includes(w)) {
                setBorderWidth(w);
              } else if (w === 'thin') {
                setBorderWidth('1px');
              } else if (w === 'medium') {
                setBorderWidth('2px');
              } else if (w === 'thick') {
                setBorderWidth('3px');
              }
              if (BORDER_STYLES.includes(s.toLowerCase())) {
                setBorderStyle(s.toLowerCase());
              }
              if (c) {
                setBorderColor(c);
              }
            }
          } else {
            setBorderWidth('1px');
            setBorderStyle('solid');
            setBorderColor('#000000');
          }
        } else {
          setBorderPlacement('none');
          setBorderWidth('1px');
          setBorderStyle('solid');
          setBorderColor('#000000');
        }
      } catch (e) {
        console.warn('Could not read cell formatting:', e);
        setBorderPlacement('none');
      }
      setSelectedFontColor(matchedFont);
      setSelectedBgColor(matchedBg);
      setSelectedValueFormat(matchedFormat);
      setShowFontColors(false);
      setShowBgColors(false);
      setShowBorderOptions(false);
      setShowFormatOptions(false);
      setImagePreview(null);

      // Check if current cell already contains an embedded image
      if (cellData.text && cellData.text.includes('<img')) {
        const match = cellData.text.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) {
          setImagePreview(match[1]);
        }
      }

      // Auto-focus input timed with iOS keyboard
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 240);
    }
  }, [isOpen, cellData]);

  if (!isOpen || !cellData) return null;

  const handleClear = () => {
    setInputValue('');
    setImagePreview(null);
    inputRef.current?.focus();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      // Downscale & compress image to ~30-40 KB target
      const compressedDataUrl = await compressImage(file, 40 * 1024);
      setImagePreview(compressedDataUrl);
      // Construct img tag for the cell
      const imgTag = `<img src="${compressedDataUrl}" style="max-height:80px;max-width:100%;object-fit:contain;" alt="Logo" />`;
      setInputValue(imgTag);
    } catch (error) {
      console.error('Error compressing image:', error);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setInputValue('');
  };

  const handleApply = () => {
    if (!cellData) return;

    // Only construct formatting for properties that were explicitly modified by the user
    const formatting: any = {};

    if (isFontColorChanged) {
      // If user selected 'Default', value is null -> pass "" to clear/reset color
      formatting.fontColor = selectedFontColor?.value ?? '';
    }

    if (isBgColorChanged) {
      // If user selected 'Default', value is null -> pass "" to clear/reset bgcolor
      formatting.bgColor = selectedBgColor?.value ?? '';
    }

    if (isBorderChanged) {
      let bordersConfig: { top?: string; bottom?: string; left?: string; right?: string } = {};
      if (borderPlacement === 'none') {
        // Clear all borders on cell
        bordersConfig = { top: '', bottom: '', left: '', right: '' };
      } else if (borderPlacement === 'all') {
        const borderDef = `${borderWidth} ${borderStyle} ${borderColor}`;
        bordersConfig = { top: borderDef, bottom: borderDef, left: borderDef, right: borderDef };
      } else if (borderPlacement === 'top') {
        const borderDef = `${borderWidth} ${borderStyle} ${borderColor}`;
        bordersConfig = { top: borderDef, bottom: '', left: '', right: '' };
      } else if (borderPlacement === 'bottom') {
        const borderDef = `${borderWidth} ${borderStyle} ${borderColor}`;
        bordersConfig = { top: '', bottom: borderDef, left: '', right: '' };
      } else if (borderPlacement === 'left') {
        const borderDef = `${borderWidth} ${borderStyle} ${borderColor}`;
        bordersConfig = { top: '', bottom: '', left: borderDef, right: '' };
      } else if (borderPlacement === 'right') {
        const borderDef = `${borderWidth} ${borderStyle} ${borderColor}`;
        bordersConfig = { top: '', bottom: '', left: '', right: borderDef };
      }
      formatting.borders = bordersConfig;
    }

    if (isValueFormatChanged) {
      // If default/empty, SocialCalc clears nontextvalueformat
      formatting.valueFormat = selectedValueFormat ? selectedValueFormat.formatString : '';
    }

    try {
      if (AppGeneral.updateCellValueAndFormat) {
        AppGeneral.updateCellValueAndFormat(cellData.coord, inputValue, formatting);
      } else {
        if (cellData.okfn) {
          cellData.okfn(inputValue);
        }
      }
    } catch (error) {
      console.error('Error applying cell changes:', error);
      if (cellData.okfn) cellData.okfn(inputValue);
    }

    if (cellData.cleanup) cellData.cleanup();
    onClose();
  };

  const handleCancel = () => {
    if (cellData?.cleanup) cellData.cleanup();
    onClose();
  };

  return (
    <div
      className="sc-cell-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      style={keyboardHeight > 0 ? { paddingBottom: `${keyboardHeight + 16}px` } : undefined}
    >
      <div className="sc-cell-modal-dialog" role="dialog" aria-modal="true">
        <div className="sc-cell-modal-content">
          {/* Header */}
          <div className="sc-cell-header">
            <div className="sc-cell-title-group">
              <h2 className="sc-cell-title">{title}</h2>
              <span className="sc-cell-coord-badge">{cellData.coord}</span>
            </div>
            <button
              type="button"
              className="sc-cell-close-btn"
              onClick={handleCancel}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Input Section */}
          <div className="sc-cell-input-section">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleApply();
                if (e.key === 'Escape') handleCancel();
              }}
              placeholder="Enter value"
              className="sc-cell-input"
            />
            {inputValue.length > 0 && (
              <button
                type="button"
                className="sc-cell-clear-btn"
                onClick={handleClear}
                aria-label="Clear Input"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Image / Logo Preview if present */}
          {imagePreview && (
            <div className="sc-image-preview-card">
              <img src={imagePreview} alt="Cell Logo" className="sc-image-preview-thumb" />
              <div className="sc-image-preview-info">
                <span className="sc-image-preview-label">Image attached</span>
                <button type="button" className="sc-image-remove-btn" onClick={handleRemoveImage}>
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Options Accordion */}
          <div className="sc-cell-accordion">
            <button
              type="button"
              className="sc-accordion-toggle"
              onClick={() => setShowOptions(!showOptions)}
            >
              <span>Options</span>
              <span>{showOptions ? '▲' : '▼'}</span>
            </button>

            {showOptions && (
              <div className="sc-accordion-body">
                {/* 1. Font Color */}
                <div className="sc-property-row">
                  <button
                    type="button"
                    className="sc-property-btn"
                    onClick={() => {
                      setShowFontColors(!showFontColors);
                      setShowBgColors(false);
                      setShowBorderOptions(false);
                      setShowFormatOptions(false);
                    }}
                  >
                    <div className="sc-property-btn-left">
                      <span>Text Color</span>
                    </div>
                    <div className="sc-property-btn-right">
                      {selectedFontColor?.color && (
                        <div className="sc-color-dot" style={{ background: selectedFontColor.color }} />
                      )}
                      <span>{selectedFontColor ? selectedFontColor.name : 'Default'}</span>
                      <span>{showFontColors ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {showFontColors && (
                    <div className="sc-color-grid">
                      {FONT_COLORS.map((c) => (
                        <div
                          key={c.name}
                          className={`sc-color-swatch ${selectedFontColor?.name === c.name ? 'selected' : ''} ${!c.color ? 'default-swatch' : ''}`}
                          style={c.color ? { background: c.color } : {}}
                          onClick={() => {
                            setSelectedFontColor(c);
                            setIsFontColorChanged(true);
                            setShowFontColors(false);
                          }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Background Color */}
                <div className="sc-property-row">
                  <button
                    type="button"
                    className="sc-property-btn"
                    onClick={() => {
                      setShowBgColors(!showBgColors);
                      setShowFontColors(false);
                      setShowBorderOptions(false);
                      setShowFormatOptions(false);
                    }}
                  >
                    <div className="sc-property-btn-left">
                      <span>Background Color</span>
                    </div>
                    <div className="sc-property-btn-right">
                      {selectedBgColor?.color && (
                        <div className="sc-color-dot" style={{ background: selectedBgColor.color }} />
                      )}
                      <span>{selectedBgColor ? selectedBgColor.name : 'Default'}</span>
                      <span>{showBgColors ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {showBgColors && (
                    <div className="sc-color-grid">
                      {BG_COLORS.map((c) => (
                        <div
                          key={c.name}
                          className={`sc-color-swatch ${selectedBgColor?.name === c.name ? 'selected' : ''} ${!c.color ? 'default-swatch' : ''}`}
                          style={c.color ? { background: c.color } : {}}
                          onClick={() => {
                            setSelectedBgColor(c);
                            setIsBgColorChanged(true);
                            setShowBgColors(false);
                          }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Number & Date Format */}
                <div className="sc-property-row">
                  <button
                    type="button"
                    className="sc-property-btn"
                    onClick={() => {
                      setShowFormatOptions(!showFormatOptions);
                      setShowFontColors(false);
                      setShowBgColors(false);
                      setShowBorderOptions(false);
                    }}
                  >
                    <div className="sc-property-btn-left">
                      <span>Format</span>
                    </div>
                    <div className="sc-property-btn-right">
                      <span className="sc-format-current-badge">
                        {selectedValueFormat ? selectedValueFormat.name : 'Default'}
                      </span>
                      <span>{showFormatOptions ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {showFormatOptions && (
                    <div className="sc-format-controls">
                      {/* Category Filter Pills */}
                      <div className="sc-format-category-pills">
                        {CELL_FORMAT_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`sc-format-pill-btn ${selectedFormatCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedFormatCategory(cat.id)}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Format Options Grid */}
                      <div className="sc-format-options-grid">
                        {POPULAR_CELL_FORMATS
                          .filter(
                            (f) =>
                              selectedFormatCategory === 'all' ||
                              f.category === selectedFormatCategory ||
                              f.id === 'default'
                          )
                          .map((format) => {
                            const isSelected =
                              selectedValueFormat?.formatString === format.formatString;
                            return (
                              <button
                                key={format.id}
                                type="button"
                                className={`sc-format-card-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedValueFormat(format);
                                  setIsValueFormatChanged(true);
                                }}
                              >
                                <span className="sc-format-card-name">{format.name}</span>
                                <span className="sc-format-card-preview">{format.preview}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Borders Section */}
                <div className="sc-property-row">
                  <button
                    type="button"
                    className="sc-property-btn"
                    onClick={() => {
                      setShowBorderOptions(!showBorderOptions);
                      setShowFontColors(false);
                      setShowBgColors(false);
                      setShowFormatOptions(false);
                    }}
                  >
                    <div className="sc-property-btn-left">
                      <span>Cell Borders</span>
                    </div>
                    <div className="sc-property-btn-right">
                      <span style={{ textTransform: 'capitalize' }}>{borderPlacement}</span>
                      <span>{showBorderOptions ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {showBorderOptions && (
                    <div className="sc-border-controls">
                      {/* Position Tabs */}
                      <div className="sc-border-position-tabs">
                        {BORDER_POSITIONS.map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            className={`sc-border-pos-btn ${borderPlacement === pos.id ? 'active' : ''}`}
                            onClick={() => {
                              setBorderPlacement(pos.id);
                              setIsBorderChanged(true);
                            }}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>

                      {borderPlacement !== 'none' && (
                        <>
                          {/* Style & Width */}
                          <div className="sc-border-inline-row">
                            <div className="sc-border-select-group">
                              <label>Style</label>
                              <select
                                value={borderStyle}
                                onChange={(e) => {
                                  setBorderStyle(e.target.value);
                                  setIsBorderChanged(true);
                                }}
                                className="sc-border-select"
                              >
                                {BORDER_STYLES.map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>

                            <div className="sc-border-select-group">
                              <label>Width</label>
                              <select
                                value={borderWidth}
                                onChange={(e) => {
                                  setBorderWidth(e.target.value);
                                  setIsBorderChanged(true);
                                }}
                                className="sc-border-select"
                              >
                                {BORDER_WIDTHS.map((w) => (
                                  <option key={w} value={w}>{w}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Border Color */}
                          <div className="sc-border-color-row">
                            <label>Color</label>
                            <div className="sc-color-grid mini">
                              {BORDER_COLORS.map((c) => (
                                <div
                                  key={c.name}
                                  className={`sc-color-swatch ${borderColor === c.color ? 'selected' : ''}`}
                                  style={{ background: c.color }}
                                  onClick={() => {
                                    setBorderColor(c.color);
                                    setIsBorderChanged(true);
                                  }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Logo / Image Upload Section */}
                <div className="sc-property-row sc-logo-upload-row">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="sc-logo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>{isProcessingImage ? 'Compressing...' : 'Insert Logo / Image'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="sc-cell-actions">
            <button
              type="button"
              className="sc-cell-btn-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sc-cell-btn-apply"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CellEditModal;
