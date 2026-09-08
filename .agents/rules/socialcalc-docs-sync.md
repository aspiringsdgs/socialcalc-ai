# SocialCalc Documentation Synchronization Rule

When editing, improving, fixing, or extending anything in `./socialcalc` (including the engine core, plugins, React/Ionic components, utilities, or formula evaluation):

1. **Mandatory Documentation Updates**:
   - The agent MUST update documentation whenever any change to `./socialcalc` is made.
   - Specifically update:
     1. `socialcalc/README.md`: Technical API documentation, configuration options, plugin methods, props, and exports.
     2. `docs/src/docsData.ts`: Dedicated modern documentation website chapters, ensuring code examples, feature descriptions, and guides reflect the latest state.

2. **No Orphan Changes**:
   - Never implement a new plugin, modify component props, or change calculation behavior without updating both documentation targets.
   - If an improvement fixes a known edge case or changes default parameters, document the rationale and behavior in the documentation website.
