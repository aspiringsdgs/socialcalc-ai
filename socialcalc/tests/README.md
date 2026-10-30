# socialcalc-ai tests

Library tests run with Vitest in jsdom, against the real SocialCalc engine. Run them from the
suite root (`ES6socialcalc-MVP-ionic-suite/`):

| Command | Runs | When |
| :--- | :--- | :--- |
| `npm run test:smoke` | `tests/smoke/` | Before every commit and release: entries load, the golden path works, the published build is sound |
| `npm run test:modules` | `tests/modules/` | One file per module (or close group of modules) |
| `npm run test:components` | `tests/components/` | React components rendered with Testing Library |
| `npm run test:regression` | `tests/regression/` | Bugs that were fixed; each test names the bug it guards |
| `npm run test:lib` | all of the above | `npm publish` runs this first (`prepublishOnly`) |
| `npm test -- --run` | library and demo-app tests | Full check, as required by `AGENTS.md` |

## Layout

```
tests/
  helpers/engine.ts     bootEngine(), idle(), run(), clickCell(), captureEditRequest(), cell()
  fixtures/             workbook templates used by the tests
  smoke/                entries.smoke, engine.smoke (golden path), dist.smoke (builds dist/)
  modules/              runtime-and-events, formatting, formatting-commands, listeners,
                        sheets-and-history, plugin-manager, view-plugins, editable-cells,
                        data-writers, utils-prompts-device, export-share, core-formulas
  components/           cell-edit-modal, horizontal-scroll-bar, row-action-popover,
                        editable-cells-modal-helpers
  regression/           editing-and-sync, engine-races, workbook-lifecycle
```

## Writing tests

- Boot the engine once per file in `beforeAll(() => bootEngine(), 20000)`. Files run isolated, so
  each file gets a fresh engine.
- Commands run asynchronously. After anything that edits the sheet, `await idle(engine)` before
  asserting. `idle` also waits for a command still on its timer, which `editor.busy` alone does
  not show.
- jsdom has no layout: `clickCell(engine, coord)` stubs the grid hit test, and only cells in the
  visible area (rows 1-46, columns A-P on a fresh engine) have rendered elements.
- Give each test its own cells (e.g. one column per file) so tests do not depend on each other.
- A regression test must fail without its fix. Check it by reverting the fix locally once.
