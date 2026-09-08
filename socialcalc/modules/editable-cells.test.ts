import { describe, it, expect, beforeEach } from 'vitest';
import {
  enableEditableCellsOnly,
  disableEditableCellsOnly,
  isEditableCellsOnlyEnabled,
  toggleEditableCellsOnly,
  isCellEditable,
  generateEditableCells,
} from './editable-cells.js';

describe('editable-cells plugin', () => {
  beforeEach(() => {
    disableEditableCellsOnly();
    // Reset global SocialCalc
    (global as any).SocialCalc = {};
  });

  describe('toggle and state management', () => {
    it('defaults to disabled', () => {
      expect(isEditableCellsOnlyEnabled()).toBe(false);
    });

    it('enables editable cells only mode', () => {
      enableEditableCellsOnly();
      expect(isEditableCellsOnlyEnabled()).toBe(true);
    });

    it('disables editable cells only mode', () => {
      enableEditableCellsOnly();
      expect(isEditableCellsOnlyEnabled()).toBe(true);
      disableEditableCellsOnly();
      expect(isEditableCellsOnlyEnabled()).toBe(false);
    });

    it('toggles mode with toggleEditableCellsOnly', () => {
      expect(toggleEditableCellsOnly()).toBe(true);
      expect(isEditableCellsOnlyEnabled()).toBe(true);
      expect(toggleEditableCellsOnly()).toBe(false);
      expect(isEditableCellsOnlyEnabled()).toBe(false);

      // Explicit argument
      expect(toggleEditableCellsOnly(true)).toBe(true);
      expect(toggleEditableCellsOnly(true)).toBe(true);
      expect(toggleEditableCellsOnly(false)).toBe(false);
    });
  });

  describe('isCellEditable', () => {
    it('returns true when no editor is provided and no global editor exists', () => {
      expect(isCellEditable(null)).toBe(true);
    });

    it('returns true when SocialCalc.EditableCells is undefined', () => {
      const editor = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'A1' },
      };
      expect(isCellEditable(editor)).toBe(true);
    });

    it('returns true for all cells when EditableCells.allow is false', () => {
      (global as any).SocialCalc = {
        EditableCells: {
          allow: false,
          cells: { 'sheet1!A1': true },
        },
      };

      const editor = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'B2' },
      };

      expect(isCellEditable(editor, 'B2')).toBe(true);
    });

    it('returns true only for allowed cells when EditableCells.allow is true', () => {
      (global as any).SocialCalc = {
        EditableCells: {
          allow: true,
          cells: {
            'sheet1!A1': true,
            'sheet1!C20': true,
          },
        },
      };

      const editor = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'A1' },
      };

      // Allowed cell A1
      expect(isCellEditable(editor, 'A1')).toBe(true);
      // Allowed cell C20 via parameter
      expect(isCellEditable(editor, 'C20')).toBe(true);
      // Not allowed cell B2
      expect(isCellEditable(editor, 'B2')).toBe(false);
      // Not allowed cell D10
      expect(isCellEditable(editor, 'D10')).toBe(false);
    });

    it('respects different sheet names in EditableCells', () => {
      (global as any).SocialCalc = {
        EditableCells: {
          allow: true,
          cells: {
            'sheet2!B5': true,
          },
        },
      };

      const editorSheet1 = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'B5' },
      };

      const editorSheet2 = {
        workingvalues: { currentsheet: 'sheet2' },
        ecell: { coord: 'B5' },
      };

      expect(isCellEditable(editorSheet1, 'B5')).toBe(false);
      expect(isCellEditable(editorSheet2, 'B5')).toBe(true);
    });

    it('falls back to SocialCalc.Callbacks.IsCellEditable if EditableCells is missing', () => {
      (global as any).SocialCalc = {
        Callbacks: {
          IsCellEditable: (ed: any) => ed.ecell.coord === 'E10',
        },
      };

      const editorAllowed = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'E10' },
      };

      const editorDenied = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'E11' },
      };

      expect(isCellEditable(editorAllowed)).toBe(true);
      expect(isCellEditable(editorDenied)).toBe(false);
    });

    it('marks Logo and Signature image cells as editable from appMapping', () => {
      const mockAppMapping = {
        sheet1: {
          Logo: {
            cell: 'E5',
            editable: true,
            type: 'image',
          },
          Signature: {
            cell: 'D36',
            editable: true,
            type: 'image',
          },
          Total: {
            cell: 'F34',
            editable: false,
            type: 'text',
          },
        },
      };

      const result = generateEditableCells(mockAppMapping, 'sheet1');
      expect(result.cells['sheet1!E5']).toBe(true);
      expect(result.cells['sheet1!D36']).toBe(true);
      expect(result.cells['sheet1!F34']).toBeUndefined();

      (global as any).SocialCalc = {
        EditableCells: result,
      };

      const logoEditor = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'E5' },
      };

      const nonEditableEditor = {
        workingvalues: { currentsheet: 'sheet1' },
        ecell: { coord: 'F34' },
      };

      expect(isCellEditable(logoEditor, 'E5')).toBe(true);
      expect(isCellEditable(nonEditableEditor, 'F34')).toBe(false);
    });
  });
});
