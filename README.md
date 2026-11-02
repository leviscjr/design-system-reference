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
- [`profiles/LC_HUB_PROFILE_V2.md`](./profiles/LC_HUB_PROFILE_V2.md) — referência histórica do perfil LC Hub, preservada para rastreabilidade.
- [`COMPONENTS.md`](./COMPONENTS.md) — **UDS v0.1 reference implementation** (portable HTML/CSS/JS, no framework): component contracts, states, ARIA and the `data-uds-*` behavior API.
- [`patterns/AUTHENTICATION.md`](./patterns/AUTHENTICATION.md) — universal authentication presentation pattern; deliberately excludes identity-provider integration, product branding, legal rules and authentication logic.
- [`tokens.vnext.json`](./tokens.vnext.json) — vNext semantic roles, provenance and declared WCAG contrast pairs. `tokens.json` stays untouched (hash-tested).
- [`css/`](./css) · [`js/uds.js`](./js/uds.js) — generated token CSS (`--sa-*`, `--uds-*`, light/dark/auto), scoped `.uds-*` components and optional CSP-safe behavior.
- [`examples/components.html`](./examples/components.html) — live demo of shell, explorer, launchers, forms with validation, drawers and menu (serve the repo root over HTTP).
- [`examples/authentication.html`](./examples/authentication.html) — neutral, CSP-safe composition of user, password, required checkbox, legal links and errors.
- [`dist/uds-v0.1/`](./dist/uds-v0.1) — generated, versioned package ready for consumption.
- [`CHANGELOG.md`](./CHANGELOG.md) — versions and verification evidence.

The normative contracts remain stack-agnostic. UDS v0.1 also ships an independent reference library in plain HTML/CSS/JS so consumers can vendor the generated package directly or reimplement the same contracts in React, Vue, Svelte or another stack.

## How to use this

1. Read the Principles and Invariants sections of `DESIGN_SYSTEM.md` first — that's what must survive translation into any stack.
2. Use `tokens.json` as the source of exact values.
3. Use the component taxonomy in `DESIGN_SYSTEM.md` as a specification of purpose/states/portability — not as implementation instructions.
4. Read `UNIVERSAL_DESIGN_VNEXT.md` when designing newer interaction/motion patterns. It extends, but does not falsify, the historical extraction.
5. Use `UI_VOCABULARY.md` for consistent references like `Explorer.Tree.ItemLabel`, `Workspace.Feed.Density` and `Rail.Audit.Badge`.
6. Keep product decisions and adapters outside the core. Keycloak themes, LC-HUB pages, logos and identity implementation belong to P2H.
7. Open `reference.html` to see the original target look and behavior. It does not yet demonstrate every vNext extension.

For the original extraction, `DESIGN_SYSTEM.md` and `tokens.json` remain authoritative over `reference.html`. For newly defined vNext behaviors, use `UNIVERSAL_DESIGN_VNEXT.md`. The archived LC Hub profile is historical evidence only; product defaults belong to P2H and must not become universal defaults.

## Build and test

Requires Python 3 (stdlib only); Node is optional (syntax check of `js/uds.js`).

```bash
python tools/uds_tokens.py build      # regenerate core CSS and dist/ packages
python tools/uds_tokens.py check      # fail if generated CSS is stale
python tools/uds_tokens.py contrast   # WCAG contrast report for every declared pair
python -m unittest discover -s tests  # static test suite
python -m http.server 8765            # then open http://127.0.0.1:8765/examples/components.html
```

`build` never writes into a consumer workspace or into the adapter source tree. `check` verifies every committed artifact and manifest without changing files.

## Provenance

The initial reference was extracted from a mature UI implementation originally built with NiceGUI/Python, then generalized into a stack-agnostic specification. That origin is cited in `DESIGN_SYSTEM.md` only for traceability (which source file a pattern came from, what was directly observed vs. inferred) — it is not a requirement, a recommendation, or a dependency of any kind.

## License

[MIT](./LICENSE)
