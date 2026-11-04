# SEA Workspace Shell (T2U)

Workspace universal — Topbar compacta · Explorer · Canvas (ContentHost) · Inspector · Actionbar — com a identidade atmosférica SEA.
O shell **não conhece o domínio**: recebe conteúdo e seleção por contratos. A associação com o Remora é só um *caso de uso* (documentos técnicos); SEA é só identidade visual.

- **Executar:** abrir [`index.html`](./index.html) (autocontido, `file://`, sem rede). A v0.2 recupera o shader e a fonte da SEA original; [comparação, hashes e capturas](./tests/SEA-V02-COMPARISON.md).
- **Fontes:** `src/` (módulos simples, sem framework). **Build:** `node sea/shell/build.cjs` → regera `index.html`.
- **Validar:** `NODE_PATH=$(npm root -g) node sea/shell/tests/validate.cjs` → [`tests/RESULTS.md`](./tests/RESULTS.md).
- **Motor:** `node sea/shell/tests/atmosphere.cjs` verifica WebGL e fallback sem WebGL; com Chrome instalado fora do caminho padrão do Playwright, defina `SEA_CHROME_PATH` para o executável. A suíte requer o pacote `playwright` apenas para desenvolvimento.
- Escopo: T2U apenas. Contratos normativos (`DESIGN_SYSTEM.md`, `tokens.json`, `reference.html`, `project.yaml`) **não foram alterados**; as cores semânticas reutilizam `tokens.json` (`--sa-*`). O repositório Remora foi lido (somente leitura) para entender objetos e fluxo.

## Componentes

| Conceito | Arquivo | Papel |
|---|---|---|
| `WorkspaceShell` | `src/core/shell.js` | Compõe tudo; comandos/atalhos; tema; configurações |
| `PanelLayout` | `src/core/layout.js` | Geometria: painéis retráteis/redimensionáveis, negociação de espaço, modo foco, drawers/sheet. `resolve()` é uma função pura |
| `Explorer` | `src/core/explorer.js` | TreeView ARIA (hierarquia = pertencimento), filtro, chips de estado, glide gooey, acompanha a seleção |
| `ContentHost` | `src/core/host.js` | Canvas universal: registro de viewers, vazio/carregando, instâncias preservadas, toolbar contextual |
| `ContextInspector` | `src/core/inspector.js` | Seções colapsáveis, hero, ações; responde à seleção |
| `ContextActionbar` / `FloatingActionbar` | `src/core/actionbar.js` | Ícone‑primeiro, grupos, overflow automático; barra flutuante que se reposiciona |
| `CompactTopbar` | `src/core/topbar.js` | 40 px: identidade, histórico, breadcrumb, busca, painéis, tema, configurações |
| `SeaAtmosphere` | `src/atmosphere/atmosphere.js` | Luz subaquática, feixes, cáusticas, ondulações, partículas; plugável |
| utilitários | `util.js` (springs, prefs) · `ui.js` (store, tooltip, menu, toast) · `morph.js` · `palette.js` · `icons.js` | |

Caso de uso (Remora/documentos): `src/demo/` — `fixture.js` (modelo), `viewers/{pdf,table,structure,record}.js`, `inspect.js` (Inspector + ações), `main.js`.

## Contratos

```
model   = { entities:[{id,kind,label,parent?,state?,tree?,…}], kinds:{kind:{icon,label}}, states:{id:{label,tone,icon}}, scopeOf(store,id) }
viewer  = { id,label,icon,interaction:'scroll'|'pan-zoom'|'text', supports(ctx)→true|{icon,title,action?},
            create(host)→{ el, update(ctx)→void|Promise, toolbar()→item[], selectionRect()?, onShow?(), locate?(id) } }
inspect = (store, entity) → { summary, hero?, sections:[{id,title,count?,open?,body}] }
actions = (store, entity, app) → [{id,icon,label,kbd?,text?,tone?,group,secondary?,pressed?,run}]
atmosphere = { mount(parent), setTheme('light'|'dark'), setSpeed(x), ping(x,y) }
```

`parent` = pertencimento (Explorer). Relações entre entidades (evidência → candidato) são outro dado (`REL`), desenhadas só no viewer de Classificação.

## Comportamento adaptativo (sinais observáveis → regra)

`PanelLayout.resolve(largura, preferências, foco)`; sempre com springs retargetáveis (interrompíveis, reversíveis).

1. **Viewport** ≥ 1180 / 760–1179 / < 760 (wide / medium / narrow).
2. **Densidade de espaço:** canvas mínimo 440 px. Falta de espaço → Inspector encolhe até 260 → Explorer até 200 → Explorer vira trilho → Inspector sobrepõe o Canvas. Ao alargar, tudo volta ao tamanho preferido do usuário.
3. **Seleção:** o trilho do Explorer mostra o ícone da seleção (tooltip com o nome); selecionar com o Inspector recolhido o reabre, **exceto** se o usuário o recolheu (então só pulsa).
4. **Sobreposição:** a barra flutuante fica no rodapé; se cobrir a seleção, vai ao topo; volta quando livre.
5. **Foco:** `F`/Esc recolhe os dois painéis (reversível). **Gesto:** arrastar/teclado/duplo clique nos separadores.
6. **Narrow:** Explorer em drawer, Inspector em bottom sheet (peek 64 px → aberto).
7. Densidade da tabela/árvore (compacta/confortável) em Configurações.

## Movimento

Ambiente e interação são independentes. `SEA.motion.ambient` = 0,4 (experimento; opções: calma 0,4× · anterior 1× · estática); controles usam springs de tempo real. `prefers-reduced-motion`: atmosfera estática, springs viram saltos, sem voo de morph.
Gooey: glide de seleção do Explorer e cápsulas da barra flutuante. Morph: elemento compartilhado origem → Inspector (um fantasma por vez; nova seleção parte da geometria atual).

## Dados do caso de uso — real × fixture

- **Real:** datasheet oficial TI **SLFS022K — xx555 Precision Timers (Rev. K)** (`https://www.ti.com/lit/ds/symlink/ne555.pdf`, sha256 em `src/demo/fixture.generated.json`). 24 parâmetros (valores, unidades, nomes, condições) e 4 observações são **copiados da tabela** e localizados no PDF por `tools/prepare_fixture.py`, que **falha** se algum valor não estiver na linha encontrada. 4 das 39 páginas (1, 4, 5, 7) estão renderizadas (120 dpi). Segundo documento (LM358/SLOS068AB, 68 p.): só metadados — serve ao estado vazio.
- **Fixture (simulado, marcado "fixture" na UI):** estados de classificação/revisão (observado/candidato/aceito/revisar/rejeitado), histórico de revisão, agrupamentos lógicos ("Catálogo", "Temporizadores", "Amplificadores operacionais"), a existência de candidatos e as ações de revisão (em memória; não persistem). **Nada disso é validação executada pelo Remora.**
- Regerar: `python3 sea/shell/tools/prepare_fixture.py <ne555.pdf>` (precisa de `pdftotext`/`pdftoppm`; o PDF não é versionado).
- Páginas do datasheet são © Texas Instruments; usadas como material de demonstração.

## Atalhos

`Ctrl/⌘+K` busca · `Ctrl/⌘+B` Explorer · `Ctrl/⌘+I` Inspector · `F` foco · `/` filtrar · `Alt+1…4` viewers · `Alt+←/→` histórico · `L` localizar na origem · `A`/`X`/`R` aceitar/rejeitar/revisar (fixture) · `Ctrl/⌘+Shift+L` tema. Árvore: setas, Home/End, →/←, `*`, Enter/Espaço, digitação.

## Limites conhecidos

- O shader SEA anterior foi recuperado do ZIP fornecido; o host é adaptado ao shell e a velocidade 1,0 segue a referência experimental do shell. Resolução fixa 0,4; sem ajuste automático de qualidade.
- Validado em Chromium headless (renderização por software). Não testados: Safari/Firefox, dispositivos reais, leitor de tela (apenas atributos ARIA), gestos de toque no sheet (há toque para alternar; arrastar o sheet não foi implementado).
- Tela de PDF = páginas rasterizadas + caixas de evidência (sem camada de texto/seleção de texto no PDF).
- Estados de revisão não persistem; layout, tema, viewer, seleção, filtros e zoom do PDF persistem em `localStorage`.
