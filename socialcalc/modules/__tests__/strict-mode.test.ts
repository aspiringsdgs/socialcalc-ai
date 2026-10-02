import { describe, it, expect, beforeAll } from "vitest";
import { bootEngine } from "../../../src/test/engine";

// The core ran as a sloppy-mode <script> in the original apps, where assigning to an
// undeclared name silently created a global. As an ES module it runs in strict mode,
// so every such assignment throws "ReferenceError: x is not defined".

let engine: Awaited<ReturnType<typeof bootEngine>>;

beforeAll(async () => {
  engine = await bootEngine();
}, 20000);

const valueOf = (coord: string) => engine.sheet().cells[coord]?.datavalue;

describe("core code paths that used implicit globals", () => {
  it("ScriptCheck accepts cells with <!--script ... script--> blocks", () => {
    const { SocialCalc } = engine;
    expect(() => SocialCalc.ScriptCheck("sheet1", "Z1", "<!--script var x = 1; script-->")).not.toThrow();
    expect(SocialCalc.ScriptInfo.scripts.Z1).toBe(" var x = 1; ");
  });

  it("Lookup finds the bracket for a value", () => {
    expect(engine.SocialCalc.Lookup(15, [0, 10, 20])).toBe(1);
  });

  it("evaluates SUBSTITUTE, RATE and DSUM", async () => {
    await engine.runtime.runCommands([
      "set Z10 text t a-b-c",
      "set Z11 formula SUBSTITUTE(Z10,\"-\",\"+\")",
      "set Z12 formula RATE(12,-100,1000)",
      "set Y20 text t name",
      "set Z20 text t amount",
      "set Y21 text t a",
      "set Z21 value n 5",
      "set Y22 text t b",
      "set Z22 value n 7",
      "set Y24 text t name",
      "set Y25 text t b",
      "set Z26 formula DSUM(Y20:Z22,\"amount\",Y24:Y25)",
    ]);
    expect(valueOf("Z11")).toBe("a+b+c");
    expect(valueOf("Z12")).toBeCloseTo(0.0292, 3);
    expect(valueOf("Z26")).toBe(7);
  });

  it("sorts a range", async () => {
    await engine.runtime.runCommands([
      "set X30 value n 3",
      "set X31 value n 1",
      "set X32 value n 2",
      "sort X30:X32 X up",
    ]);
    expect([valueOf("X30"), valueOf("X31"), valueOf("X32")]).toEqual([1, 2, 3]);
  });
});
