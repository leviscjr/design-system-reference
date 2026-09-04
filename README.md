# Design System Reference

Stack-agnostic UI design system reference for consistent, portable interfaces across frameworks.

This repository provides a portable UI design reference composed of:

- design intent and UX principles;
- semantic design tokens;
- reusable component patterns;
- an interactive visual reference.

## Contents

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — normative specification: principles, invariants, component taxonomy, states, responsiveness, accessibility, and a traceability table.
- [`tokens.json`](./tokens.json) — structured design-token data (primitive / semantic / component layers, light and dark themes).
- [`reference.html`](./reference.html) — illustrative visual/interaction reference. Open it directly in any browser — no build step, no server, no dependency.

**This is not a component library and does not require a specific framework.** The tokens and patterns here are meant to be re-implemented in whatever stack you're using — React, Vue, Svelte, plain HTML/CSS/JS, or anything else.

## How to use this

1. Read the Principles and Invariants sections of `DESIGN_SYSTEM.md` first — that's what must survive translation into any stack.
2. Use `tokens.json` as the source of exact values.
3. Use the component taxonomy in `DESIGN_SYSTEM.md` as a specification of purpose/states/portability — not as implementation instructions.
4. Open `reference.html` to see the target look and behavior.

If `DESIGN_SYSTEM.md` and `reference.html` ever disagree, the Markdown document is authoritative — a mismatch in the HTML is a bug in the HTML, not a spec change.

## Provenance

The initial reference was extracted from a mature UI implementation originally built with NiceGUI/Python, then generalized into a stack-agnostic specification. That origin is cited in `DESIGN_SYSTEM.md` only for traceability (which source file a pattern came from, what was directly observed vs. inferred) — it is not a requirement, a recommendation, or a dependency of any kind.

## License

[MIT](./LICENSE)
