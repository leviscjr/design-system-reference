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
- [`UNIVERSAL_DESIGN_VNEXT.md`](./UNIVERSAL_DESIGN_VNEXT.md) — **new, stack-agnostic extension** for interaction, density, semantic color, motion, drawers, disclosures, list density and validation; does not rewrite facts extracted from Shared_Arch.
- [`profiles/LC_HUB_PROFILE_V2.md`](./profiles/LC_HUB_PROFILE_V2.md) — **LC Hub consumer profile**: approved layout/typography preferences and proposed contextual panels, defaults and still-pending human approvals.

**This is not a component library and does not require a specific framework.** The tokens and patterns here are meant to be re-implemented in whatever stack you're using — React, Vue, Svelte, plain HTML/CSS/JS, or anything else.

## How to use this

1. Read the Principles and Invariants sections of `DESIGN_SYSTEM.md` first — that's what must survive translation into any stack.
2. Use `tokens.json` as the source of exact values.
3. Use the component taxonomy in `DESIGN_SYSTEM.md` as a specification of purpose/states/portability — not as implementation instructions.
4. Read `UNIVERSAL_DESIGN_VNEXT.md` when designing newer interaction/motion patterns. It extends, but does not falsify, the historical extraction.
5. Read the relevant consumer profile (e.g. `profiles/LC_HUB_PROFILE_V2.md`) for product-specific decisions that must **not** become global defaults.
6. Open `reference.html` to see the original target look and behavior. It does not yet demonstrate every vNext extension.

For the original extraction, `DESIGN_SYSTEM.md` and `tokens.json` remain authoritative over `reference.html`. For newly defined vNext behaviors, use `UNIVERSAL_DESIGN_VNEXT.md`; for LC Hub defaults, use its profile. Do not interpret new product choices as historical facts about Shared_Arch.

## Provenance

The initial reference was extracted from a mature UI implementation originally built with NiceGUI/Python, then generalized into a stack-agnostic specification. That origin is cited in `DESIGN_SYSTEM.md` only for traceability (which source file a pattern came from, what was directly observed vs. inferred) — it is not a requirement, a recommendation, or a dependency of any kind.

## License

[MIT](./LICENSE)
