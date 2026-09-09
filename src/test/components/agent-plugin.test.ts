import { describe, it, expect, vi, beforeEach } from "vitest";
import * as AppGeneral from "socialcalc";
import template100001 from "../../data/100001.json";

describe("SocialCalc AI Agent Plugin (Text Editor Agent)", () => {
  beforeEach(() => {
    AppGeneral.enableAgent();
  });

  it("should have all agent plugin methods exported and registered", () => {
    expect(typeof AppGeneral.enableAgent).toBe("function");
    expect(typeof AppGeneral.disableAgent).toBe("function");
    expect(typeof AppGeneral.toggleAgent).toBe("function");
    expect(typeof AppGeneral.isAgentEnabled).toBe("function");
    expect(typeof AppGeneral.getAgentContext).toBe("function");
    expect(typeof AppGeneral.exportAgentContext).toBe("function");
    expect(typeof AppGeneral.getAgentToolDefinitions).toBe("function");
    expect(typeof AppGeneral.generateAgentSystemPrompt).toBe("function");
    expect(typeof AppGeneral.executeAgentActions).toBe("function");
    expect(typeof AppGeneral.parseAgentResponse).toBe("function");
    expect(typeof AppGeneral.executeAgentResponse).toBe("function");
    expect(typeof AppGeneral.registerAgentActionHandler).toBe("function");
  });

  it("should toggle agent enabled state correctly", () => {
    AppGeneral.enableAgent();
    expect(AppGeneral.isAgentEnabled()).toBe(true);

    AppGeneral.disableAgent();
    expect(AppGeneral.isAgentEnabled()).toBe(false);

    AppGeneral.toggleAgent(true);
    expect(AppGeneral.isAgentEnabled()).toBe(true);

    AppGeneral.toggleAgent();
    expect(AppGeneral.isAgentEnabled()).toBe(false);

    AppGeneral.enableAgent();
  });

  it("should extract structured context when appMapping is provided", () => {
    const mapping = template100001.appMapping;
    const context = AppGeneral.getAgentContext({
      sheetName: "sheet1",
      appMapping: mapping,
    });

    expect(context).toBeDefined();
    expect(context.sheetName).toBe("sheet1");
    expect(context.hasMappings).toBe(true);
    expect(context.mappings).toBeDefined();
    expect(context.mappings.fields).toBeDefined();

    // Check mapped fields from template 100001 (e.g. BillTo.Name, InvoiceNumber)
    expect(context.mappings.fields["BillTo.Name"]).toBeDefined();
    expect(context.mappings.fields["BillTo.Name"].cell).toBe("C5");
    expect(context.mappings.fields["InvoiceNumber"]).toBeDefined();
    expect(context.mappings.fields["InvoiceNumber"].cell).toBe("C18");

    // Check table mapping (Items)
    expect(context.mappings.tables.Items).toBeDefined();
    expect(context.mappings.tables.Items.startRow).toBe(21);
    expect(context.mappings.tables.Items.endRow).toBe(33);
    expect(context.mappings.tables.Items.columns.Description).toBeDefined();
    expect(context.mappings.tables.Items.columns.Amount).toBeDefined();

    // Summary string check
    expect(context.summary).toContain("Sheet: \"sheet1\"");
    expect(context.summary).toContain("BillTo.Name");
    expect(context.summary).toContain("Table \"Items\"");
  });

  it("should handle empty appMapping gracefully (free-form spreadsheet mode)", () => {
    const context = AppGeneral.getAgentContext({
      sheetName: "sheet1",
      appMapping: {},
    });

    expect(context).toBeDefined();
    expect(context.hasMappings).toBe(false);
    expect(Object.keys(context.mappings.fields).length).toBe(0);
    expect(context.summary).toContain("No template appMappings detected");
  });

  it("should export serializable JSON context", () => {
    const exported = AppGeneral.exportAgentContext({
      sheetName: "sheet1",
      appMapping: template100001.appMapping,
    });

    expect(typeof exported).toBe("object");
    expect(JSON.stringify(exported)).toBeTruthy();
    expect(exported.sheetName).toBe("sheet1");
    expect(exported.hasMappings).toBe(true);
  });

  it("should provide Gemini function declarations", () => {
    const geminiTools: any = AppGeneral.getAgentToolDefinitions({ format: "gemini" });
    expect(geminiTools.functionDeclarations).toBeDefined();
    expect(Array.isArray(geminiTools.functionDeclarations)).toBe(true);

    const names = geminiTools.functionDeclarations.map((d: any) => d.name);
    expect(names).toContain("set_cell_value");
    expect(names).toContain("set_cell_values");
    expect(names).toContain("clear_cell");
    expect(names).toContain("set_mapping_field");
    expect(names).toContain("apply_mapping_data");
  });

  it("should provide OpenAI tool definitions", () => {
    const openAiTools = AppGeneral.getAgentToolDefinitions({ format: "openai" });
    expect(Array.isArray(openAiTools)).toBe(true);
    expect(openAiTools[0].type).toBe("function");
    expect(openAiTools[0].function.name).toBe("set_cell_value");
  });

  it("should generate a comprehensive system prompt for LLMs", () => {
    const prompt = AppGeneral.generateAgentSystemPrompt({
      sheetName: "sheet1",
      appMapping: template100001.appMapping,
    });

    expect(typeof prompt).toBe("string");
    expect(prompt).toContain("SocialCalc Spreadsheet Text Editor Assistant");
    expect(prompt).toContain("Current Sheet Context");
    expect(prompt).toContain("BillTo.Name");
    expect(prompt).toContain("SET_CELL");
    expect(prompt).toContain("APPLY_MAPPING_DATA");
  });

  it("should build accurate SocialCalc cell commands", () => {
    const sc = AppGeneral.SocialCalc;

    // Number
    const numCmd = AppGeneral.buildSetCellCommand(sc, "F21", 125.5, "number");
    expect(numCmd).toBe("set F21 value n 125.5");

    // Text
    const textCmd = AppGeneral.buildSetCellCommand(sc, "C5", "Acme Corporation", "text");
    expect(textCmd).toContain("set C5 text t Acme Corporation");

    // Formula
    const formulaCmd = AppGeneral.buildSetCellCommand(sc, "F34", "=SUM(F21:F33)", "formula");
    expect(formulaCmd).toBe("set F34 formula SUM(F21:F33)");

    // Clear
    const clearCmd = AppGeneral.buildSetCellCommand(sc, "C5", "", "text");
    expect(clearCmd).toContain("erase C5 formulas");
    expect(clearCmd).toContain("set C5 empty");
  });

  it("should parse LLM responses across different formats", () => {
    // Direct array
    const direct = [{ action: "SET_CELL", coord: "A1", value: "Test" }];
    expect(AppGeneral.parseAgentResponse(direct)).toEqual(direct);

    // Object with actions array
    const objWithActions = { message: "Updated", actions: direct };
    expect(AppGeneral.parseAgentResponse(objWithActions)).toEqual(direct);

    // Markdown JSON code block
    const markdown = '```json\n[{"action":"SET_CELL","coord":"B2","value":99}]\n```';
    const parsedMd = AppGeneral.parseAgentResponse(markdown);
    expect(parsedMd.length).toBe(1);
    expect(parsedMd[0].coord).toBe("B2");
    expect(parsedMd[0].value).toBe(99);

    // Gemini tool call
    const geminiCall = {
      functionCalls: [
        { name: "set_cell_value", args: { coord: "C5", value: "Acme" } },
      ],
    };
    const parsedGemini = AppGeneral.parseAgentResponse(geminiCall);
    expect(parsedGemini.length).toBe(1);
    expect(parsedGemini[0].action).toBe("SET_CELL");
    expect(parsedGemini[0].coord).toBe("C5");

    // OpenAI tool call
    const openAiCall = {
      tool_calls: [
        {
          function: {
            name: "set_cell_value",
            arguments: JSON.stringify({ coord: "D10", value: 500 }),
          },
        },
      ],
    };
    const parsedOpenAi = AppGeneral.parseAgentResponse(openAiCall);
    expect(parsedOpenAi.length).toBe(1);
    expect(parsedOpenAi[0].coord).toBe("D10");
  });

  it("should execute agent actions and dispatch custom window events", () => {
    const eventSpy = vi.fn();
    window.addEventListener("socialcalc:agent-action", eventSpy);

    const actions = [
      { action: "SET_CELL", coord: "C5", value: "Acme Inc" },
      { action: "SET_CELL", coord: "F21", value: 250, type: "number" },
      { action: "CLEAR_CELL", coord: "C6" },
    ];

    const result = AppGeneral.executeAgentActions(actions, {
      sheetName: "sheet1",
      appMapping: template100001.appMapping,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.commands.length).toBeGreaterThan(0);
    expect(eventSpy).toHaveBeenCalled();

    window.removeEventListener("socialcalc:agent-action", eventSpy);
  });

  it("should support registering custom action handlers for future agents", () => {
    const customHandler = vi.fn((actionObj, { commands }) => {
      commands.push(`set ${actionObj.coord} bgcolor ${actionObj.color}`);
      return { styled: true };
    });

    AppGeneral.registerAgentActionHandler("SET_CELL_BG", customHandler);

    const result = AppGeneral.executeAgentActions([
      { action: "SET_CELL_BG", coord: "A1", color: "#ff0000" },
    ]);

    expect(customHandler).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.commands).toContain("set A1 bgcolor #ff0000");
  });
});
