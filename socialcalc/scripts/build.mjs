#!/usr/bin/env node
/**
 * Builds the publishable package into dist/.
 *
 * The sources ship TypeScript/JSX components (.ts/.tsx) and import them by those extensions.
 * Vite transpiles that inside node_modules, but webpack, Create React App and Next.js do not,
 * and webpack also requires fully specified ".js" paths inside "type": "module" packages.
 * This mirrors the package into dist/ file by file (no bundling, so the global SocialCalc engine
 * and module boundaries stay exactly as in development):
 *   - .ts/.tsx  -> .js (esbuild, JSX with the automatic runtime)
 *   - every relative import is rewritten to the emitted file's full ".js" path
 *   - .js, .css and .d.ts files are copied
 */
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");

const ENTRY_FILES = ["index.js", "react.js", "ionic.js", "pdf-export.js", "share.js"];
const TYPE_FILES = ["index.d.ts", "react.d.ts", "ionic.d.ts", "pdf-export.d.ts", "share.d.ts"];
const SOURCE_DIRS = ["core", "modules", "components", "utils"];
const SKIP = /(\.test\.|\.spec\.|__tests__|README\.md$)/;
const RESOLVE_EXTS = ["", ".js", ".ts", ".tsx", "/index.js", "/index.ts", "/index.tsx"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP.test(full)) continue;
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

/** Output path of a source file inside dist/ (.ts/.tsx become .js). */
function outPathFor(file) {
  const rel = path.relative(root, file).replace(/\.(tsx|ts)$/, ".js");
  return path.join(out, rel);
}

/** Rewrites relative import/export specifiers to the emitted ".js" files. */
function rewriteImports(code, fromFile) {
  const fromDir = path.dirname(fromFile);
  const fix = (spec) => {
    if (!spec.startsWith("./") && !spec.startsWith("../")) return spec;
    for (const ext of RESOLVE_EXTS) {
      const candidate = path.resolve(fromDir, spec + ext);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        if (candidate.endsWith(".css")) return spec;
        let rel = path.relative(fromDir, candidate).replace(/\.(tsx|ts)$/, ".js").split(path.sep).join("/");
        if (!rel.startsWith(".")) rel = "./" + rel;
        return rel;
      }
    }
    throw new Error(`Cannot resolve "${spec}" imported from ${path.relative(root, fromFile)}`);
  };
  return code
    .replace(/(\bfrom\s*)(["'])([^"']+)\2/g, (m, pre, q, spec) => pre + q + fix(spec) + q)
    .replace(/(\bimport\s*)(["'])([^"']+)\2/g, (m, pre, q, spec) => pre + q + fix(spec) + q)
    .replace(/(\bimport\(\s*)(["'])([^"']+)\2(\s*\))/g, (m, pre, q, spec, post) => pre + q + fix(spec) + q + post);
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

async function main() {
  fs.rmSync(out, { recursive: true, force: true });

  const files = [
    ...ENTRY_FILES.map((f) => path.join(root, f)),
    ...SOURCE_DIRS.flatMap((d) => walk(path.join(root, d))),
  ];

  let count = 0;
  for (const file of files) {
    const ext = path.extname(file);
    const target = outPathFor(file);
    if (ext === ".ts" || ext === ".tsx") {
      const result = await build({
        entryPoints: [file],
        bundle: false,
        write: false,
        format: "esm",
        platform: "neutral",
        target: "es2019",
        jsx: "automatic",
        loader: { ".ts": "ts", ".tsx": "tsx" },
        logLevel: "silent",
      });
      write(target, rewriteImports(result.outputFiles[0].text, file));
    } else if (ext === ".js" || ext === ".mjs") {
      write(target, rewriteImports(fs.readFileSync(file, "utf8"), file));
    } else if (ext === ".css" || ext === ".json") {
      write(target, fs.readFileSync(file));
    } else {
      continue;
    }
    count++;
  }

  for (const typeFile of TYPE_FILES) {
    const src = path.join(root, typeFile);
    if (fs.existsSync(src)) write(path.join(out, typeFile), fs.readFileSync(src));
  }

  console.log(`socialcalc-ai: built ${count} files into dist/`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
