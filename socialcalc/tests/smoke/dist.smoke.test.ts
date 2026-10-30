/**
 * Smoke: the published build. Builds dist/ and checks what npm consumers actually get:
 * every package.json export target exists, no TypeScript files or extensionless imports leak
 * into dist/ (webpack requires fully specified paths in "type": "module" packages), and each
 * built entry exports the same names as its source entry.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LIB = path.resolve(__dirname, "../..");
const DIST = path.join(LIB, "dist");
const pkg = JSON.parse(fs.readFileSync(path.join(LIB, "package.json"), "utf8"));

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

beforeAll(() => {
  execFileSync(process.execPath, [path.join(LIB, "scripts/build.mjs")], { cwd: LIB, stdio: "pipe" });
}, 60000);

describe("published build (dist/)", () => {
  it("every package.json export target exists", () => {
    const targets: string[] = [];
    for (const value of Object.values(pkg.exports) as any[]) {
      if (typeof value === "string") targets.push(value);
      else targets.push(...(Object.values(value) as string[]));
    }
    targets.push(pkg.main, pkg.module, pkg.types);
    const missing = targets.filter((t) => !fs.existsSync(path.join(LIB, t)));
    expect(missing).toEqual([]);
  });

  it("ships only dist/ and the README", () => {
    expect(pkg.files).toEqual(["dist", "README.md"]);
    expect(pkg.scripts.prepublishOnly).toMatch(/build\.mjs/);
  });

  it("contains no TypeScript sources and only fully specified relative imports", () => {
    const files = walk(DIST);
    expect(files.filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".d.ts"))).toEqual([]);
    const problems: string[] = [];
    for (const file of files.filter((f) => f.endsWith(".js"))) {
      const src = fs.readFileSync(file, "utf8");
      for (const m of src.matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
        const spec = m[1];
        const target = path.resolve(path.dirname(file), spec);
        if (!/\.(js|css|json)$/.test(spec)) problems.push(`${path.relative(DIST, file)}: not fully specified "${spec}"`);
        else if (!fs.existsSync(target)) problems.push(`${path.relative(DIST, file)}: missing "${spec}"`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("keeps component stylesheets next to the built components", () => {
    expect(fs.existsSync(path.join(DIST, "components/CellEditModal/CellEditModal.css"))).toBe(true);
    expect(fs.existsSync(path.join(DIST, "components/HorizontalScrollBar.css"))).toBe(true);
  });

  it("built entries export the same names as the source entries", async () => {
    for (const entry of ["react.js", "ionic.js", "pdf-export.js", "share.js"]) {
      const source = Object.keys(await import(/* @vite-ignore */ path.join(LIB, entry))).sort();
      const built = Object.keys(await import(/* @vite-ignore */ path.join(DIST, entry))).sort();
      expect({ entry, names: built }).toEqual({ entry, names: source });
    }
  }, 30000);
});
