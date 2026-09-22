export interface CellBorder {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class Cell {
  coord: string; // e.g. "A1"
  formula?: string; // formula string from vtf attribute
  valuetype?: string; // type from vt/vtc/vtf (e.g. n, nt, nd, n$, n%, nl, th, e)
  constantText?: string; // input text of a vtc constant (e.g. "1/1/11" for a date value)
  errorText?: string; // e attribute

  private _text?: string; // t attribute
  private _val?: number; // v attribute

  get text(): string | undefined {
    return this._text;
  }

  // Changing the value makes a vtc constant's input text stale, so drop it.
  set text(value: string | undefined) {
    this._text = value;
    this.constantText = undefined;
  }

  get val(): number | undefined {
    return this._val;
  }

  set val(value: number | undefined) {
    this._val = value;
    this.constantText = undefined;
  }
  
  // Style registry indices
  fontIndex?: number; // f attribute
  textColorIndex?: number; // c attribute
  bgColorIndex?: number; // bg attribute
  cellFormatIndex?: number; // cf attribute
  layoutIndex?: number; // l attribute
  nonTextValueFormatIndex?: number; // ntvf attribute
  textValueFormatIndex?: number; // tvf attribute
  
  borders?: CellBorder; // b attribute (top:right:bottom:left)
  colspan?: number;
  rowspan?: number;
  comment?: string; // comment attribute

  constructor(coord: string) {
    this.coord = coord.toUpperCase();
  }

  /**
   * Checks if this cell has any meaningful data or styling.
   */
  isEmpty(): boolean {
    return (
      this.text === undefined &&
      this.val === undefined &&
      this.formula === undefined &&
      this.constantText === undefined &&
      this.errorText === undefined &&
      this.fontIndex === undefined &&
      this.textColorIndex === undefined &&
      this.bgColorIndex === undefined &&
      this.cellFormatIndex === undefined &&
      this.layoutIndex === undefined &&
      this.nonTextValueFormatIndex === undefined &&
      this.textValueFormatIndex === undefined &&
      this.borders === undefined &&
      this.colspan === undefined &&
      this.rowspan === undefined &&
      this.comment === undefined
    );
  }
}
