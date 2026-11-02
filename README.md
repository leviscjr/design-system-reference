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
- [`UI_VOCABULARY.md`](./UI_VOCABULARY.md) — **formal naming map** of AppShell regions, components and subcomponents, including usage examples for briefs, testing and traceability.
- [`profiles/LC_HUB_PROFILE_V2.md`](./profiles/LC_HUB_PROFILE_V2.md) — **LC Hub consumer profile**: approved layout/typography preferences and proposed contextual panels, defaults and still-pending human approvals.
- [`COMPONENTS.md`](./COMPONENTS.md) — **UDS v0.1 reference implementation** (portable HTML/CSS/JS, no framework): component contracts, states, ARIA and the `data-uds-*` behavior API.
- [`tokens.vnext.json`](./tokens.vnext.json) + [`profiles/lc-hub.tokens.json`](./profiles/lc-hub.tokens.json) — vNext semantic roles and the LC Hub profile, with provenance and declared WCAG contrast pairs. `tokens.json` stays untouched (hash-tested).
- [`css/`](./css) · [`js/uds.js`](./js/uds.js) — generated token CSS (`--sa-*`, `--uds-*`, light/dark/auto), scoped `.uds-*` components and optional CSP-safe behavior.
- [`examples/components.html`](./examples/components.html) — live demo of shell, explorer, launchers, forms with validation, drawers and menu (serve the repo root over HTTP).
- [`adapters/lc-hub/lchub-bridge.css`](./adapters/lc-hub/lchub-bridge.css) + [`profiles/LC_HUB_INTEGRATION.md`](./profiles/LC_HUB_INTEGRATION.md) — incremental adoption path for the current LC Hub.
- [`adapters/keycloak/lc-hub/`](./adapters/keycloak/lc-hub) + [`profiles/KEYCLOAK_LOGIN_PROFILE.md`](./profiles/KEYCLOAK_LOGIN_PROFILE.md) — Keycloak `login` theme extending `keycloak.v2` (not yet validated on a real Keycloak).
- [`CHANGELOG.md`](./CHANGELOG.md) — versions and verification evidence.

**This is not a component library and does not require a specific framework.** The tokens and patterns here are meant to be re-implemented in whatever stack you're using — React, Vue, Svelte, plain HTML/CSS/JS, or anything else.

## How to use this

1. Read the Principles and Invariants sections of `DESIGN_SYSTEM.md` first — that's what must survive translation into any stack.
2. Use `tokens.json` as the source of exact values.
3. Use the component taxonomy in `DESIGN_SYSTEM.md` as a specification of purpose/states/portability — not as implementation instructions.
4. Read `UNIVERSAL_DESIGN_VNEXT.md` when designing newer interaction/motion patterns. It extends, but does not falsify, the historical extraction.
5. Use `UI_VOCABULARY.md` for consistent references like `Explorer.Tree.ItemLabel`, `Workspace.Feed.Density` and `Rail.Audit.Badge`.
6. Read the relevant consumer profile (e.g. `profiles/LC_HUB_PROFILE_V2.md`) for product-specific decisions that must **not** become global defaults.
7. Open `reference.html` to see the original target look and behavior. It does not yet demonstrate every vNext extension.

For the original extraction, `DESIGN_SYSTEM.md` and `tokens.json` remain authoritative over `reference.html`. For newly defined vNext behaviors, use `UNIVERSAL_DESIGN_VNEXT.md`; for LC Hub defaults, use its profile. Do not interpret new product choices as historical facts about Shared_Arch.

## Build and test

Requires Python 3 (stdlib only); Node is optional (syntax check of `js/uds.js`).

```bash
python tools/uds_tokens.py build      # regenerate css/*.css and Keycloak mirrors from the token JSON
python tools/uds_tokens.py check      # fail if generated CSS is stale
python tools/uds_tokens.py contrast   # WCAG contrast report for every declared pair
python -m unittest discover -s tests  # static test suite
python -m http.server 8765            # then open http://127.0.0.1:8765/examples/components.html
```

## Provenance

The initial reference was extracted from a mature UI implementation originally built with NiceGUI/Python, then generalized into a stack-agnostic specification. That origin is cited in `DESIGN_SYSTEM.md` only for traceability (which source file a pattern came from, what was directly observed vs. inferred) — it is not a requirement, a recommendation, or a dependency of any kind.

## License

[MIT](./LICENSE)
