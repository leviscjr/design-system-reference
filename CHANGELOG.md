# Changelog

## [0.1.0-candidate] — 2026-11-02 · branch `feat/uds-lchub-keycloak-v1`

Primeira implementação utilizável do UDS sobre `feat/universal-design-vnext` (393283b). Status: **IMPLEMENTED + TESTED_STATIC + TESTED_BROWSER (exemplos)**; **não HUMAN_APPROVED**, **não implantado**.

### Adicionado
- `tokens.vnext.json`: papéis semânticos light/dark (`--uds-*`), proveniência por papel e 23 pares de contraste declarados.
- `profiles/lc-hub.tokens.json`: perfil LC Hub (tipografia/geometria do explorer e launchers, acentos de domínio candidatos), escopado por `data-uds-profile`.
- `tools/uds_tokens.py` (stdlib): `build`, `check`, `contrast`; resolução de referências `{sa.*}`/`{uds.*}` com detecção de ciclo; espelhos gerados para o tema Keycloak.
- `css/uds.components.css` + `js/uds.js`: formulários (campos, estados, validação acessível), botões, links, status, AppShell, topbar, explorer/árvore, menu, drawers, disclosure, launchers; responsivo (≤1023 explorer off-canvas, ≤599 sheet), `pointer: coarse`, `prefers-reduced-motion`, compatível com CSP.
- `examples/components.html` e `examples/keycloak-login-preview.html`.
- `adapters/lc-hub/lchub-bridge.css`: mapeia as variáveis atuais do hub para `--uds-*` (P2H não modificado).
- `adapters/keycloak/lc-hub/login`: tema `login` herdando `keycloak.v2` (PF5), sem templates próprios.
- Documentação: `COMPONENTS.md`, `profiles/LC_HUB_INTEGRATION.md`, `profiles/KEYCLOAK_LOGIN_PROFILE.md`.
- `tests/test_uds.py`: 17 testes estáticos.

### Evidências
- `python -m unittest discover -s tests` → 17 testes OK.
- `python tools/uds_tokens.py contrast` → 53/53 PASS (texto ≥ 4.5:1; limites/foco/ícones ≥ 3:1).
- `tokens.json` inalterado (sha256 `904fefc2…516984`).
- Navegador (Chromium do painel, via `http.server` local): validação, drawers (focus trap, Escape, backdrop, foco devolvido), menu por teclado, árvore, 375px sem scroll horizontal, tema escuro; prévia do login Keycloak.

### Pendente de decisão humana
- Valores `CANDIDATE` de cor (acentos de domínio, `text.muted`, `border.interactive`, primário escuro) e de motion.
- As 4 mudanças visuais intencionais da ponte LC Hub.
- Validação do tema em Keycloak 26.7.2 real e implantação (tarefa P1/A1 separada).

### Não verificado
Leitor de tela real, zoom 200%, 1920px, Safari/iOS, demais páginas do tema de login.
