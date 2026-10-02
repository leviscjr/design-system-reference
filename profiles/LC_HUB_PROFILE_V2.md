# Perfil de produto — LC Hub / Visual System V2

> 2026-10-02. Este é um **perfil consumidor** de `UNIVERSAL_DESIGN_VNEXT.md`; não é um novo design system universal nem uma descrição factual do Shared_Arch. Decisões abaixo foram consolidadas em conversas e testes humanos do LC Hub. **Aprovado** indica preferência/contrato humano; não prova que todo item foi implementado em produção. **Pendente visual** exige confirmação humana.

## 1. Intenção de produto

Controle profissional, denso, legível, modular, com "calm UI expressiva": cores significativas, contraste reforçado, microinterações suaves e regiões operacionais honestas. A Home prioriza aplicações/capacidades e atividade resumida; detalhes de auditoria/atenção ficam disponíveis na utility rail. O perfil claro é o foco atual; dark não é requisito da rodada corrente.

## 2. Baseline que NÃO deve regredir

- Topbar compacta com navegação, A1/E2.1 reais, busca existente e identidade da sessão, sem duplicação de telemetria/busca no corpo.
- Workspace com largura útil completa; Aplicações/Capacidades alinhadas; sem grids fantasma.
- Árvore EXPLORAR com textos mais legíveis e scroll até o último item; drawer do iPhone funcional.
- Launchers compactos, ícones e textos em eixos consistentes; altura visual proporcional sem reduzir letras.
- Estados desconhecidos/indisponíveis explícitos; sem telemetria, alerta ou auditoria sintéticos.
- CSP/auth/session/CSRF/guards e semântica de rotas preservados.
- A função de login em `/access` do administrador **não faz parte do DS**: mudança funcional separada PPC-A1-021.

## 3. Defaults de componentes na Home

| Superfície | Estados | Default | Independência |
|---|---|---|---|
| Card Aplicações | expandido/recolhido | **expandido** | independente da sidebar e outros cards |
| Card Capacidades | expandido/recolhido | **expandido** | independente da sidebar e outros cards |
| Atividade recente | **1 / 3 / 5 / Todas** | **1** | densidade escolhida não muda cards irmãos |
| LEGADO | disclosure | preservar default atual até decisão específica | independente |
| Requer atenção | drawer pela utility rail | fechado | não ocupa card persistente na Home |
| Auditoria | drawer pela utility rail | fechado | não ocupa card persistente na Home |

Atividade recente: `Todas` expõe todos os eventos carregados da fonte, e paginação adicional apenas se suportada. Não criar registros fictícios. A seleção 1 é padrão tanto desktop quanto mobile; persistência inicial apenas no estado de UI durante a interação, sem banco.

## 4. Mudança de composição desejada

- Remover do workspace os cards permanentes Requer atenção e Auditoria **somente quando** os respectivos drawers funcionais estiverem disponíveis na utility rail.
- Reaproveitar os ícones já existentes na rail, não duplicar navegação.
- Atenção: numeração ou severidade apenas se alertas agregados forem reais. `unknown`/sem fonte ≠ “nenhuma atenção necessária”.
- Auditoria: ponto de novidade só se houver semântica real de eventos não lidos; fonte não integrada permanece neutra.
- Manter atividade compacta na Home; atalho extra na rail **não foi aprovado** como requisito.

## 5. Preferências visuais concretas

### Tipografia e densidade

| Papel | Referência aprovada de direção |
|---|---|
| EXPLORAR (rótulo) | ~12 px |
| Grupos e itens isolados | ~14–15 px, semibold para grupos |
| Subitens da árvore | ~14 px |
| Ícones de navegação | ~16–18 px |
| Cabeçalhos de cards | ~15–16 px |
| Labels de launcher | ~13–14 px |
| Metadados | ~12–13 px |

Launchers desktop: altura visual alvo ~40–42 px, padding-inline ~10–12 px, padding-block ~4–6 px, caixa de ícone ~28–30 px e gap ~8 px. Valores são referências, não substituições cegas da implementação. Garantir acessibilidade de toque/foco.

### Cores — direção sujeita a contraste e aceite visual

Manter superfícies neutras. Sugestões exploradas (não fechar como paleta aprovada definitiva):

| Papel | Candidato |
|---|---|
| Ação/Aplicações | `#245BE8` |
| Capacidades | `#7436DE` |
| Atividade | `#087F83` |
| Auditoria | `#087FBA` |
| Atenção | `#B96A06` |
| Sucesso operacional | `#13804B` |

Cor de domínio não declara condição operacional. Não pintar cards inteiros sem necessidade. Preferir acentos em ícones, borda de estado e fundo selecionado discreto. **Cor e contraste da V2 ainda não tinham homologação humana no último checklist.**

### Movimento — intenção pendente de homologação humana

- Feedback de hover/cor: ~120–160 ms.
- Accordion: ~180–240 ms, indicador e conteúdo coordenados.
- Drawer contextual: ~200–260 ms, com Escape/retorno de foco.
- Sem looping de brilho, pulsação decorativa ou animação de métricas.
- `prefers-reduced-motion` desativa/reduz transições sem afetar ação.
- O último checklist humano não aprovou ainda a fluidez dos accordions.

## 6. Especificação dos drawers

**Atenção:** título, estado da cobertura, contagem conhecida, lista de ocorrências reais ordenadas por severidade/tempo, origem e ação contextual quando existente. Unknown / empty / partial / error distintos; não inferir "saudável" de silêncio.

**Auditoria:** fonte de evidência, eventos reais quando disponíveis, ator/ação/objeto/data/resultados somente se campos fornecidos pela fonte; `not integrated` é distinto de "sem eventos". Dot de não-lido requer mecanismo real de leitura.

Painel desktop contextual lateral; mobile sheet/drawer acessível com safe areas. Focus trap adequado, Escape, backdrop, controle fechar, foco devolvido ao ícone. Nenhum badge fictício. Duração/gestos/altura exatos do sheet **ainda são decisões de implementação a homologar**, não universalizar.

## 7. Requisitos de verificação

Separar `IMPLEMENTED`, `TESTED_BROWSER`, `HUMAN_APPROVED`. Nas últimas rodadas: tipografia da árvore, geometria dos launchers, scroll da sidebar, topbar e comportamento mobile foram aprovados pelo usuário; cor/contraste e fluidez dos accordions permaneceram não homologados. Não transformar PPC-A1-020 `REVIEW/PASS operacional` em `CLOSED` por inferência.

Na próxima implementação, testar: sidebars esquerda/direita, accordion open/close independente, 1/3/5/Todas, indicador de estado sem dados, foco/restauração, Safari iPhone, 320–1920 px, zoom 125/200%, reduced motion. Preservar os resultados de UI já aprovados.

## 8. Escopo de sistema vs. produto

Universal: contrato de drawer contextual, badge com fonte verificável, disclosure, selector de densidade, anatomia de launcher, semântica visual, motion e acessibilidade.

Específico do LC Hub: nomes A1/E2.1, layout da Home, utilidade da rail, categorias Aplicações/Capacidades, defaults 1/3/5/Todas, PPCs 008/019/020/021 e endpoints. Não propagar esses nomes/defaults para outros consumidores automaticamente.

## 9. Protocolo de adoção

1. Consultar `DESIGN_SYSTEM.md` (fatos e princípios extraídos), `tokens.json` (valores extraídos), `UNIVERSAL_DESIGN_VNEXT.md` (novos padrões) e este perfil (escolhas LC Hub).
2. Levantar implementação existente, sem reescrever componentes aprovados.
3. Escolher gate e PPC aptos antes de modificar runtime.
4. Implementar mudanças faltantes como correção cumulativa.
5. Comparar browser + aceitação humana; publicar evidência distinta de checklist de código.
