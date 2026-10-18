import { describe, it, expect, beforeEach } from 'vitest';
import { updateCellValueAndFormat } from '../../modules/formatting.js';

describe('updateCellValueAndFormat - preserving borders and cell properties', () => {
  let executedCommands: string[] = [];

  beforeEach(() => {
    executedCommands = [];

    // Mock SocialCalc global environment
    (global as any).SocialCalc = {
      GetCurrentWorkBookControl: () => ({
        currentSheetButton: { id: 'sheet1' },
        ExecuteWorkBookControlCommand: (commandObj: { cmdstr: string }) => {
          executedCommands = commandObj.cmdstr.split('\n').filter(Boolean);
        },
        workbook: {
          spreadsheet: {
            editor: {
              EditorScheduleSheetCommands: (cmdstr: string) => {
                executedCommands = cmdstr.split('\n').filter(Boolean);
              },
            },
          },
        },
      }),
      encodeForSave: (str: string) => str,
    };
  });

  it('updates text WITHOUT emitting any border or color commands', () => {
    updateCellValueAndFormat('C20', 'Updated Description', {});

    expect(executedCommands).toEqual(['set C20 text t Updated Description']);
    // Verify no border or color commands are present
    expect(executedCommands.some((c) => c.includes(' bt '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' bb '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' bl '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' br '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' color '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' bgcolor '))).toBe(false);
  });

  it('updates numeric value without disrupting borders or formatting', () => {
    updateCellValueAndFormat('F20', '250', {});

    expect(executedCommands).toEqual(['set F20 value n 250']);
    expect(executedCommands.some((c) => c.includes(' bt '))).toBe(false);
    expect(executedCommands.some((c) => c.includes(' bb '))).toBe(false);
  });

  it('handles formula input correctly', () => {
    updateCellValueAndFormat('F34', '=SUM(F21:F33)', {});

    expect(executedCommands).toEqual(['set F34 formula SUM(F21:F33)']);
  });

  it('handles empty input cleanly by setting cell to empty', () => {
    updateCellValueAndFormat('C20', '', {});

    expect(executedCommands).toEqual(['set C20 empty']);
  });

  it('applies borders ONLY when explicitly specified in formatting.borders', () => {
    updateCellValueAndFormat('C20', 'Total', {
      borders: {
        bottom: '2px solid #000000',
        top: '',
        left: '',
        right: '',
      },
    });

    expect(executedCommands).toContain('set C20 text t Total');
    expect(executedCommands).toContain('set C20 bb 2px solid #000000');
    expect(executedCommands).toContain('set C20 bt ');
    expect(executedCommands).toContain('set C20 bl ');
    expect(executedCommands).toContain('set C20 br ');
  });

  it('applies fontColor ONLY when explicitly specified', () => {
    updateCellValueAndFormat('C20', 'Important Note', {
      fontColor: 'red',
    });

    expect(executedCommands).toEqual([
      'set C20 text t Important Note',
      'set C20 color red',
    ]);
  });

  it('resets fontColor to default when explicitly passed as empty string', () => {
    updateCellValueAndFormat('C20', 'Regular Note', {
      fontColor: '',
    });

    expect(executedCommands).toEqual([
      'set C20 text t Regular Note',
      'set C20 color ',
    ]);
  });

  it('never emits [object Object] if an object is passed for fontColor or bgColor', () => {
    updateCellValueAndFormat('C20', 'Test', {
      fontColor: { name: 'Black', value: 'black' } as any,
      bgColor: { name: 'Default', value: null } as any,
    });

    for (const cmd of executedCommands) {
      expect(cmd).not.toContain('[object Object]');
    }
    expect(executedCommands).toContain('set C20 color black');
    expect(executedCommands).toContain('set C20 bgcolor ');
  });

  it('applies valueFormat when explicitly specified', () => {
    updateCellValueAndFormat('F20', '1234.56', {
      valueFormat: '$#,##0.00',
    });

    expect(executedCommands).toEqual([
      'set F20 value n 1234.56',
      'set F20 nontextvalueformat $#,##0.00',
    ]);
  });

  it('clears valueFormat when passed as empty string or default', () => {
    updateCellValueAndFormat('F20', '1234.56', {
      valueFormat: '',
    });

    expect(executedCommands).toEqual([
      'set F20 value n 1234.56',
      'set F20 nontextvalueformat ',
    ]);
  });
});
