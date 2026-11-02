# Integração LC Hub ← UDS v0.1

> 2026-11-02 · Consumidor: **P2H — LC-HUB INTERFACE** (`bda4489b-bd1f-4ba9-b6b0-5f4847e5c4aa`).
> Este documento orienta a adoção; **nenhuma alteração foi feita no P2H** nesta entrega. Perfil de decisões: `LC_HUB_PROFILE_V2.md`; tokens do perfil: `lc-hub.tokens.json`.

## 1. Observação de partida (somente leitura)

O hub atual (`SCRIPTS/hub/hub_app.py` no acervo `VPS_A1_HUB`, branch `claude/provider-check-console-v3`) declara no próprio `<style>`:
`--bg --surface --surface-border --surface-strong --text --text-dim --text-faint --accent --accent-strong --accent-soft --danger --danger-strong --good --warn --neutral --radius --radius-sm`
com **os mesmos valores** da extração Shared_Arch. Ou seja, o hub já descende do DS; a adoção é um redirecionamento, não um redesenho.

## 2. Plano de adoção em 3 passos (cada um reversível por remoção de `<link>`)

| Passo | O que muda no hub | Risco visual | Prova esperada |
|---|---|---|---|
| A. Ponte | servir `css/uds.tokens.css`, `css/uds.profile.lc-hub.css`, `adapters/lc-hub/lchub-bridge.css` como estáticos **same-origin**; `<html data-theme="light" data-uds-profile="lc-hub">` | 4 mudanças intencionais (abaixo) | screenshot antes/depois; contraste |
| B. Formulários | trocar campos/botões de `/access`, Provider Check e MCP para `.uds-field/.uds-input/.uds-btn` e `form[data-uds-validate]` + `js/uds.js` | baixo; CSRF/handlers intactos | validação acessível; testes HTTP existentes |
| C. Shell | migrar topbar/explorer/drawers para `.uds-shell`, `.uds-tree`, `.uds-drawer` (utility rail → drawers Atenção/Auditoria) | médio; seguir baseline "não regredir" do perfil V2 §2 | checklist §7 do perfil, 320–1920px |

Mudanças intencionais da ponte (todas por acessibilidade, ver comentários no arquivo):
1. `--text-faint` #94A3B8 → #5B6A80 (2.6:1 → 5.5:1).
2. `--danger-strong` #DC2626 → #B91C1C nos botões (4.83 → 6.47).
3. `--neutral` #94A3B8 → #64748B (indicador desconhecido ≥ 3:1).
4. Limite de `input/select/textarea` usa `--uds-border-interactive` (≥ 3:1).

`--radius`/`--radius-sm` (18/10px) do hub são decisão de produto e **não** são mapeados.

## 3. Restrições do consumidor preservadas

- CSP: tudo em arquivos externos; `js/uds.js` não usa `eval`/inline; atributos `data-uds-*`.
- Auth/sessão/CSRF/guards/rotas: o UDS não toca formulários além de classes e validação cliente; validação servidor permanece a autoridade.
- Dados honestos: usar `.uds-status--unknown` para fonte não integrada; não renderizar badges sem evidência.
- Defaults de cards (Aplicações/Capacidades expandidos, Atividade = 1) continuam definidos pelo hub via `aria-expanded` inicial.

## 4. Pendências de decisão (não tomadas aqui)

- Homologação humana de cor/contraste dos acentos de domínio (`lc-hub.tokens.json` → `CANDIDATE`) e da fluidez de accordions.
- Caminho de publicação dos estáticos no hub (`/static/uds/`?) e se o hub vendoriza os arquivos ou os obtém por release deste repositório.
- Tema escuro do hub (fora da rodada atual pelo perfil V2).
