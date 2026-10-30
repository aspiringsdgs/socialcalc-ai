/**
 * modules/plugin-manager.js: registry, lifecycle, configuration and change notifications.
 * No engine needed.
 */
import { describe, it, expect, vi } from "vitest";
import * as pm from "../../modules/plugin-manager.js";

function makePlugin(name: string) {
  let on = false;
  const configure = vi.fn();
  pm.registerPlugin(name, {
    metadata: { displayName: name },
    enable: () => {
      on = true;
      pm.notifyPluginStateChange(name);
    },
    disable: () => {
      on = false;
      pm.notifyPluginStateChange(name);
    },
    isEnabled: () => on,
    configure,
    api: { ping: () => "pong" },
  });
  return { configure, set: (v: boolean) => (on = v) };
}

describe("registry", () => {
  it("rejects plugins without a name", () => {
    expect(() => pm.registerPlugin("", {})).toThrow();
    expect(() => pm.registerPlugin(undefined as any, {})).toThrow();
  });

  it("lists registered plugins with state and metadata, including the built-ins", () => {
    makePlugin("test-list");
    const all = pm.getRegisteredPlugins();
    const mine = all.find((p: any) => p.name === "test-list");
    expect(mine).toMatchObject({ enabled: false, metadata: { displayName: "test-list" } });
    expect(pm.getPlugin("test-list").api.ping()).toBe("pong");
    expect(pm.getPlugin("missing")).toBeNull();
  });

  it("defaults isEnabled to the manager's own record when a plugin has none", () => {
    pm.registerPlugin("test-plain", {});
    expect(pm.isPluginEnabled("test-plain")).toBe(false);
    pm.enablePlugin("test-plain");
    expect(pm.isPluginEnabled("test-plain")).toBe(true);
    pm.disablePlugin("test-plain");
    expect(pm.isPluginEnabled("test-plain")).toBe(false);
  });
});

describe("lifecycle", () => {
  it("enables, disables, toggles and configures by name", () => {
    const { configure } = makePlugin("test-life");
    expect(pm.enablePlugin("test-life")).toBe(true);
    expect(pm.isPluginEnabled("test-life")).toBe(true);
    expect(pm.togglePlugin("test-life")).toBe(true); // toggled off
    expect(pm.isPluginEnabled("test-life")).toBe(false);
    pm.togglePlugin("test-life", true);
    expect(pm.isPluginEnabled("test-life")).toBe(true);
    pm.configurePlugin("test-life", { a: 1 });
    expect(configure).toHaveBeenCalledWith({ a: 1 });
  });

  it("returns false for unknown plugins and for plugins whose enable throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(pm.enablePlugin("nope")).toBe(false);
      expect(pm.disablePlugin("nope")).toBe(false);
      pm.registerPlugin("test-broken", {
        enable: () => {
          throw new Error("boom");
        },
      });
      expect(pm.enablePlugin("test-broken")).toBe(false);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });
});

describe("change notifications", () => {
  it("fire once per real change for registry and direct switches, with a window event", () => {
    const plugin = makePlugin("test-notify");
    const calls: any[] = [];
    const events: any[] = [];
    const off = pm.subscribePluginChanges((name: string, enabled: boolean) => {
      if (name === "test-notify") calls.push(enabled);
    });
    const onEvent = (e: any) => e.detail.plugin === "test-notify" && events.push(e.detail);
    window.addEventListener("socialcalc:plugin-change", onEvent);
    try {
      pm.enablePlugin("test-notify");
      pm.enablePlugin("test-notify"); // no change
      plugin.set(false); // switched directly, then announced
      pm.notifyPluginStateChange("test-notify");
      pm.notifyPluginStateChange("test-notify"); // no change
      expect(calls).toEqual([true, false]);
      expect(events).toEqual([
        { plugin: "test-notify", enabled: true },
        { plugin: "test-notify", enabled: false },
      ]);
    } finally {
      off();
      window.removeEventListener("socialcalc:plugin-change", onEvent);
    }
  });

  it("stops calling a listener after unsubscribe, and a throwing listener does not break others", () => {
    makePlugin("test-unsub");
    const good = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const offBad = pm.subscribePluginChanges(() => {
      throw new Error("listener bug");
    });
    const offGood = pm.subscribePluginChanges(good);
    try {
      pm.enablePlugin("test-unsub");
      expect(good).toHaveBeenCalledWith("test-unsub", true);
      offGood();
      pm.disablePlugin("test-unsub");
      expect(good).toHaveBeenCalledTimes(1);
    } finally {
      offBad();
      error.mockRestore();
    }
  });
});
