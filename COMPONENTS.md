# UDS — Componentes v0.1 (implementação de referência)

> 2026-11-02 · Status: **IMPLEMENTED + TESTED_BROWSER (exemplos)**; **não HUMAN_APPROVED**.
> Implementa, em HTML/CSS/JS sem framework, a taxonomia de `DESIGN_SYSTEM.md` §5 e a extensão `UNIVERSAL_DESIGN_VNEXT.md`.
> É uma **implementação de referência portável**, não uma exigência de stack: consumidores em outra tecnologia reimplementam a mesma anatomia, estados e ARIA a partir destes contratos.

## 1. Arquivos e ordem de carga

| Arquivo | Papel | Editável |
|---|---|---|
| `tokens.json` | extração Shared_Arch (FATO) | não (teste de hash) |
| `tokens.vnext.json` | papéis semânticos vNext + proveniência + pares de contraste | sim |
| `profiles/<p>.tokens.json` | valores de produto, escopados | sim |
| `css/uds.tokens.css` | `--sa-*` + `--uds-*`, light/dark/auto | **gerado** |
| `css/uds.profile.<p>.css` | perfil em `:root[data-uds-profile="<p>"]` | **gerado** |
| `css/uds.components.css` | componentes `.uds-*` | sim |
| `js/uds.js` | comportamento por `data-uds-*` (opcional) | sim |

```html
<html data-theme="light" data-uds-profile="lc-hub">   <!-- data-theme: light | dark | auto -->
<link rel="stylesheet" href="css/uds.tokens.css">
<link rel="stylesheet" href="css/uds.profile.lc-hub.css">   <!-- opcional -->
<link rel="stylesheet" href="css/uds.components.css">
<script src="js/uds.js" defer></script>                    <!-- opcional -->
```

Regenerar após editar tokens: `python tools/uds_tokens.py build` · contraste: `python tools/uds_tokens.py contrast` · testes: `python -m unittest discover -s tests`.

**Escopo por classe.** Nenhum seletor global de elemento; `.uds-root` é opt-in. Adoção é incremental por componente.
**CSP.** Sem estilo/script inline e sem `eval`: compatível com `style-src 'self'` e `script-src 'self'`.

## 2. Foundation

- Cores por papel (`--uds-surface-*`, `--uds-text-*`, `--uds-border-*`, `--uds-action-*`, `--uds-link*`, `--uds-status-*`, `--uds-maturity-*`, `--uds-accent-domain-*`). `status` ≠ `maturity` ≠ `accent.domain` (vNext invariante 3).
- Tipografia: `--uds-type-<papel>-size|line|weight` derivados de `semantic.typography` (title, subtitle, label, field, table, nav, aux).
- Espaço/raio/controles: `--uds-space-*`, `--uds-radius-*`, `--uds-control-{sm,md,lg}-*` derivados da extração.
- Motion: `--uds-motion-fast|normal|panel` + `--uds-motion-easing` (candidatos); `prefers-reduced-motion` neutraliza transições sem remover função.
- Contraste: todo par declarado em `contrastPairs` passa (texto 4.5:1; limites/ícones/foco 3:1). Valores literais novos têm proveniência obrigatória (teste).

## 3. Formulários

| Componente | Markup mínimo | Estados | Acessibilidade |
|---|---|---|---|
| Field | `.uds-field > .uds-label + controle + .uds-help? + .uds-error` | — | `label[for]`; ajuda/erro em `aria-describedby` |
| Input / Select / Textarea | `.uds-input` · `.uds-select` · `.uds-textarea` | default, hover, focus-visible, `aria-invalid="true"`, `disabled` (tracejado), `readonly` | limite 3:1; inválido tem cor **e** barra lateral |
| Obrigatório | `<span class="uds-label__req" aria-hidden="true">*</span>` + atributo `required` | — | o `*` é visual; a semântica vem de `required` |
| Opcional | `.uds-label__opt` | — | texto explícito "(opcional)" |
| Checkbox / Radio | `label.uds-check > input + span`; grupo em `fieldset.uds-choices > legend` | checked, disabled, inválido | nativo + `accent-color` (sem recriação visual) |
| Erro de campo | `p.uds-error[data-uds-error-for=<id>]` | vazio = oculto | ícone + texto; não depende só de cor |
| Resumo de erros | `.uds-alert.uds-alert--error[role=alert][data-uds-error-summary][hidden]` | oculto até envio inválido | anunciado por `role=alert` |
| Botão | `.uds-btn` + `--primary|--secondary|--ghost|--danger`, `--sm|--lg|--block|--icon` | hover, focus-visible, `disabled`, `aria-busy="true"` (spinner) | ícone-só exige `aria-label`; toque ≥ 44px em `pointer: coarse` |
| Link | `.uds-link`, `.uds-link--quiet` | hover, focus-visible | link navega; ação usa botão (invariante 7) |

**Validação (`form[data-uds-validate][novalidate]`).** Usa a Constraint Validation API. Campo vazio só é acusado no envio; campo preenchido é validado ao sair; corrigir remove o erro durante a digitação. No envio inválido: foco no primeiro campo, `aria-invalid`, mensagem e resumo. Mensagens customizáveis: `data-uds-msg-required|type|pattern`.

## 4. Navegação

| Componente | Markup | Comportamento |
|---|---|---|
| AppShell | `.uds-shell > .uds-topbar + .uds-explorer + .uds-workspace` | grid; explorer e workspace com scroll independente (`min-height:0`) |
| Topbar | `.uds-topbar__brand`, `__nav > ul > a.uds-topbar__link[aria-current=page]`, `__spacer`, `__actions` | ativo = sublinhado interno + peso (sem mudar largura) |
| Itens recolhíveis | `.uds-topbar__collapse` | saem da topbar ≤599px; **o consumidor deve oferecer a mesma função em menu/explorer** (não ocultar função real) |
| Explorer | `.uds-explorer > __header(__heading) + __scroll(nav > .uds-tree) + __footer` | ≤1023px vira drawer à esquerda com `.uds-explorer-toggle[data-uds-drawer-open=<id>]` |
| Árvore | `button.uds-tree__group[data-uds-disclosure][aria-expanded][aria-controls]` + `ul.uds-tree__subtree` · `a.uds-tree__item[aria-current=page]` · `[aria-disabled=true]` para planejado | seleção por fundo + marcador interno; planejado não sugere navegação |
| Menu | `.uds-menu > button[data-uds-menu][aria-haspopup=menu][aria-expanded][aria-controls] + ul.uds-menu__list[role=menu][hidden] > li[role=none] > .uds-menu__item[role=menuitem]` | ↑/↓/Home/End, Escape devolve foco, Tab/clique fora fecha |
| Drawer | `aside.uds-drawer#id > __header(__title + [data-uds-drawer-close]) + __body`; acionador `[data-uds-drawer-open=id][aria-controls][aria-expanded]` | um overlay por vez, `role=dialog aria-modal`, focus trap, Escape, backdrop, scroll lock, foco devolvido; ≤599px vira sheet inferior; `--start` abre à esquerda; `[data-uds-autofocus]` |
| Disclosure de card | `.uds-disclosure__header > button.uds-disclosure__trigger[data-uds-disclosure]` + `.uds-disclosure__panel[hidden]` | fechado não ocupa altura; default pertence ao perfil |
| Launcher | `a.uds-launcher.uds-accent--<domínio> > __icon + __text(__label + __meta) + .uds-status?` | eixos fixos (grid), truncamento com `min-width:0`, `aria-disabled` tracejado |
| Status | `.uds-status--healthy|warning|critical|unknown` | forma diferente por estado (círculo, losango, quadrado, tracejado) + texto: `unknown` ≠ `healthy` ≠ `0` |

## 5. Verificação realizada (2026-11-02)

- Estática (17 testes): hash da extração, paridade light/dark, referências, proveniência, 53 pares de contraste, CSS atualizado, variáveis definidas, CSP dos exemplos, IDs/ARIA, JS sem `eval`, sintaxe.
- Navegador (`examples/components.html`, Chromium do painel): desktop ~800px e mobile 375px sem scroll horizontal; validação (3 inválidos, foco, resumo, correção ao digitar); drawer (foco, Escape, backdrop, devolução de foco, autofocus); menu (abrir, setas, Escape); árvore; explorer como drawer no mobile; tema escuro.
- **Não verificado:** leitor de tela real, zoom 125–200%, 1920px, Safari/iOS, homologação humana de cor/motion.
