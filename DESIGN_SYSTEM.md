# Design System Reference (stack-agnostic)

> Especificação normativa de referência, independente de stack. A implementação de origem (histórica/provenance) foi um projeto NiceGUI/Python chamado "Shared_Arch" — citado ao longo deste documento só para rastreabilidade, nunca como requisito.

> **Documento normativo.** Este arquivo é a especificação. `tokens.json` é o dado. `reference.html` é apenas ilustrativo.
> Em caso de divergência, **este documento vence** — uma divergência no HTML é um bug do HTML, não uma correção da regra.
>
> Esta é a **terceira revisão** (rodada final de ajustes). A primeira cobria tokens + um subconjunto de componentes centrais. A segunda percorreu 34 arquivos de componentes/páginas/shell. Esta rodada final lê os 4 arquivos que ainda faltavam (`charts_demo.py`, `foundation.py`, `icons.py`, `charts.py`), promove inferências a fatos onde a leitura direta permitiu, e reconcilia onde `reference.html` corrige deliberadamente uma deficiência da fonte em vez de reproduzi-la (ver Seção 10a). Nenhuma lista aqui deve ser lida como definitivamente exaustiva, só como "o que foi encontrado até esta inspeção".

---

## 1. Propósito e como usar este pacote

Extrai o design system do projeto **Shared_Arch** (galeria de componentes NiceGUI/Python) em um contrato **independente de stack**, para outra IA ou desenvolvedor sem contexto do repositório original reconstruir uma interface aderente — sem portar NiceGUI, sem virar biblioteca universal de componentes.

Como usar:
1. Leia a Seção 2 (Princípios) e a Seção 3 (Invariantes) primeiro.
2. Use `tokens.json` para valores exatos.
3. Use a Seção 5 (Taxonomia) como especificação de propósito/estados/portabilidade de cada padrão — não como instrução de implementação.
4. Use `reference.html` só para conferir a aparência-alvo.
5. Leia a Seção 12 (Lacunas) antes de assumir que algo ausente foi esquecido — pode estar lá, registrado deliberadamente.

## 2. Papel de cada arquivo e precedência

| Arquivo | Papel | Precedência |
|---|---|---|
| `DESIGN_SYSTEM.md` | Especificação normativa | **1 (mais alta)** |
| `tokens.json` | Dado estruturado stack-agnostic | 2 |
| `reference.html` | Demonstração ilustrativa, nunca normativa | 3 |

---

## 3. Princípios de UX

Rotulados por grau de certeza — nenhum destes é uma regra escrita no repositório original; todos foram reconstruídos a partir de padrões de código.

- **[FATO]** Paleta de gráficos (`component.chart`) deliberadamente separada da paleta de UI (`semantic.color`) — comentário explícito na fonte.
- **[FATO]** Light e dark compartilham exatamente as mesmas 21 chaves de cor.
- **[FATO]** Todo componente de dado "sem dados/carregando/erro" reutiliza o mesmo primitivo (`empty_state`) em vez de duplicar layout — reuso deliberado, documentado nos próprios docstrings de `table_demo.py` e `dashboard_states.py`.
- **[INFERÊNCIA — alta confiança, 20+/20+ ocorrências]** Todo controle icon-only carrega explicação textual (tooltip na fonte). Escopo: controles **sem label visível** — não é regra geral contra texto.
- **[INFERÊNCIA — alta confiança]** Estado nunca só por cor — badges, KPI delta, stepper, seleção de button-group sempre combinam cor com um segundo canal.
- **[INFERÊNCIA — média confiança]** Overlays têm papéis diferenciados por intenção, não por preferência estética: modal interrompe o fluxo para uma decisão; drawer coexiste com o conteúdo para inspeção/detalhe contextual; popover (menu/flyout) resolve uma ação ou escolha pequena e local; tooltip só complementa, nunca é única fonte de informação crítica. Ver Seção 5.7.
- **[INFERÊNCIA — média confiança]** Responsividade no Shared_Arch reorganiza prioridade, não só reduz tamanho: sidebar cai para fluxo normal, paginação numerada vira "página X de Y", split horizontal empilha, breadcrumb colapsa itens do meio — cada um é uma mudança de comportamento, não só de escala. Ver Seção 6.
- **[NÃO ESPECIFICADO]** Não há vocabulário de motion/animação documentado como sistema (ver Seção 8) nem escala de sombra centralizada (ver Seção 4) — tratado à parte, não inferido como princípio.

---

## 4. Tokens

Fonte única: `tokens.json` — **inalterado nesta revisão** (nenhum valor novo qualificava como token centralizado; ver Seção 12 sobre por que constantes de sidebar/resize-handle NÃO foram promovidas a token).

Resumo: `primitive` (spacing, radius, breakpoints, `fontSizeLegacy`), `layout` (headerHeight), `semantic.color.{light,dark}` (21 chaves cada), `semantic.typography` (7 papéis), `component.button` (sm/md/lg), `component.chart.{light,dark}` (domínio separado), `component.map` (config do filtro do marcador, não-portável como cor direta).

`[FATO — confirmado por leitura direta de pages/foundation.py nesta rodada final]` A própria página de fundamentos da fonte já distingue as duas escalas de tamanho de texto na interface, com rótulos próprios: `fontSizeLegacy` aparece sob o rótulo "Escala bruta (font-size)", enquanto `semantic.typography` aparece separadamente sob "Papéis usados nos componentes (.sa-text-&lt;papel&gt;)" — confirma, por texto literal da fonte, a distinção já documentada na Seção 4 abaixo (não é mais uma inferência nossa, é o próprio autor do Shared_Arch nomeando as duas escalas de forma diferente). A mesma página também confirma por texto literal a proporção de padding do botão: "Padding vertical mantido proporcional ao horizontal (~55-60%) em todas as escalas" — upgrade de "convenção inferida do comentário de código" para "afirmação direta na UI da própria fonte".

**Domínios de Foundation sem token centralizado, confirmados por inspeção**:
- **Shadows** — `[NÃO ESPECIFICADO como token]`. A sombra do `.sa-card:hover` é um valor CSS fixo (`rgba(15, 23, 42, 0.08)`), intencionalmente neutro/theme-invariant (documentado na primeira revisão). Não existe uma escala de elevação (`shadow-sm/md/lg`) na fonte.
- **Motion** — `[NÃO ESPECIFICADO como token]`. Durações existem espalhadas no código como detalhes de implementação, não como sistema: transição de hover de card (~0.15s, inferido do padrão CSS geral do projeto), slide do drawer confinado (0.2s ease, `drawer_demo.py`), delays de simulação assíncrona (1.0–1.2s em `form_demo.py`/`upload_demo.py` — esses são atrasos de rede *simulada*, não timing de UI). Nenhuma constante de duração/easing centralizada.

---

## 5. Taxonomia completa

Categorias ajustadas ao vocabulário real encontrado (nenhuma categoria/componente foi inventado só para preencher a lista pedida). Cada item: propósito, estados observados, comportamento, portabilidade.

### 5.1 Foundation
Colors / Typography / Spacing / Radius / Breakpoints — em `tokens.json`, ver Seção 4. Shadows / Motion — não especificados como token, ver Seção 4.

### 5.2 Layout

**App Shell** `[FATO]` — header + sidebar colapsável + área de conteúdo com largura máxima centralizada (1400px). Toda página só fornece conteúdo, nunca estrutura — a composição é responsabilidade de uma única camada (`shell.py`). *Portável*: o princípio de composição (chrome fixo + slot de conteúdo) é universal; a mecânica exata de refresh (duas regiões atualizáveis independentes para conteúdo e sidebar) é detalhe de implementação NiceGUI.

**Header** `[FATO]` — hambúrguer (toggle sidebar) + título + tabs de navegação primária + toggle de tema, com padding responsivo (menor em mobile, maior a partir do breakpoint `sm`) e quebra em múltiplas linhas (`flex-wrap`) se necessário, para nunca sobrepor conteúdo em telas estreitas.

**Sidebar** `[FATO]` — navegação rápida por âncoras (rola suavemente até a seção clicada), com dois estados de largura:
- Expandida (item = ícone + label, hover destacado)
- Mini/colapsada (item = ícone só, com tooltip mostrando o nome completo)
- Redimensionável por arraste quando expandida (largura mín/máx, mas os valores exatos em px são **constantes locais do componente**, não tokens centralizados — ver Seção 12)
- Três modos de acompanhamento de rolagem: **normal** (rola com a página), **sticky** (padrão — acompanha sem sair do fluxo), **fixed** (presa à viewport, compensando a largura do conteúdo). `[FATO, texto da própria UI]`: sticky e fixed caem para normal no mobile.

**Split View** `[FATO]` — dois painéis com handle de arraste real (não simulado); primeiro painel de tamanho fixo (`flex:0 0 auto`), segundo cresce para preencher (`flex:1 1 auto`); duplo-clique no handle reseta ao tamanho padrão. Orientação horizontal ou vertical.

**Resize Handle** `[FATO]` — mecanismo de arraste genérico reutilizado por Split View e Sidebar. Estados: idle, dragging (classe ativa), foco (`tabindex`). Acessibilidade: `role="separator"`, `aria-orientation`, `aria-label`, `tabindex="0"`, tooltip. *Portável*: o padrão de interação (arraste com clamps min/max, duplo-clique reseta, acessível via teclado com role=separator) é universal; a técnica de "um único listener delegado no documento inteiro" é uma solução específica para uma limitação de re-render do NiceGUI (scripts injetados em conteúdo carregado tardiamente não executam) — **não precisa ser reproduzida** em outra stack, só o comportamento resultante.

**Divider** `[FATO]` — linha horizontal simples, linha vertical simples, ou linha horizontal com label centralizado (útil em padrões tipo "ou" entre duas ações alternativas).

**Grid/Dashboard layout** `[FATO]` — grid responsivo: 1 coluna (mobile) → 2 colunas (≥600px) → 4 colunas (≥1024px) para cards de KPI; variante de 2 colunas (≥1024px) para blocos do tamanho de gráfico.

**Responsive stacking** — ver Seção 6 (tratada à parte por ser um comportamento transversal, não um componente).

### 5.3 Navigation

**Tabs** `[FATO]` — inativo / ativo (destaque automático) / desabilitado (exemplo real observado: aba não-clicável, esmaecida). Troca de conteúdo instantânea ao clicar. *Portável*: o contrato (lista de rótulos, um ativo por vez, conteúdo correspondente troca, estado desabilitado impede seleção) é universal — qualquer `<div role="tablist">` nativo ou lib de tabs replica isso. *Stack-specific*: a animação de troca e o comportamento de overflow/scroll de abas em telas estreitas vêm do Quasar por padrão e não foram customizados na fonte — **não há evidência de comportamento de overflow de tabs testado/documentado**, marcar como `[NÃO ESPECIFICADO]` para esse detalhe específico.

**Accordion (disclosure)** `[FATO]` — trigger (header clicável) alterna aberto/fechado; observado: um item aberto por padrão, um fechado por padrão, um item com aparência desabilitada. `[FATO, achado relevante]`: o item "desabilitado" observado usa só uma classe CSS de aparência — **não há confirmação de que ele esteja de fato impedido de abrir** (ao contrário das Tabs, que usam a prop real de desabilitar do Quasar). Registrar isso explicitamente como comportamento visual-apenas, não funcional, ao portar. Não há evidência de múltiplos itens simultaneamente abertos sendo testado — `[NÃO ESPECIFICADO]` se o padrão é single-open ou multi-open.

**Breadcrumb** `[FATO]` — trilha de itens clicáveis + item atual não-clicável (último). Colapso responsivo: quando a trilha excede um limite de itens (4 na fonte), os itens do meio colapsam atrás de um botão "…" com tooltip, que abre um menu listando os itens ocultos — sempre mantendo o primeiro e os dois últimos visíveis. Esse colapso é **disparado por contagem de itens, não por breakpoint de tela** — é o próprio mecanismo responsivo do componente.

**Pagination** `[FATO — confirmado na primeira revisão]` — numerada com "…" de overflow, mais um modo compacto "página X de Y" que substitui a versão numerada abaixo de 768px. Setas anterior/próxima com tooltip.

**Stepper** `[FATO — confirmado na primeira revisão]` — 5 estados (pending/active/completed/warning/error), conector colorido entre etapas alcançadas, navegação clicável só entre etapas já alcançadas (com tooltip "Ir para: {etapa}").

**Active Navigation** `[FATO]` — item ativo do menu lateral/tabs recebe tratamento visual combinando cor + peso de fonte (não cor isolada).

**Command Palette** `[FATO]` — abre por botão-gatilho (com tooltip documentando o atalho) ou atalho global Ctrl/Cmd+K, mesmo com outro campo de texto em foco (decisão deliberada). Busca local por substring (rótulo ou grupo), navegação por setas (circular), Enter confirma, Escape fecha. Resultados agrupados por categoria; item ativo destacado. Clique também executa. *Portável*: o contrato inteiro (atalho global, busca local, navegação por teclado circular, agrupamento, clique ou Enter executam) é universal e deve ser preservado — é um padrão avançado, não trivial. *Stack-specific*: a técnica de implementação via API de teclado do NiceGUI existe para contornar uma limitação de script injetado tardiamente — irrelevante para outra stack.

### 5.4 Actions

**Button** `[FATO]` — 3 tamanhos (sm/md/lg, ver `component.button` em tokens.json), variante outline.

**Icon Button** `[INFERÊNCIA — alta confiança]` — sempre com tooltip explicando a ação (ver Seção 3); usado para hambúrguer, colapsar sidebar, fechar drawer, setas de paginação, copiar, abrir command palette.

**Button Group** `[FATO — confirmado na primeira revisão]` — seleção única ou múltipla, 3 variantes (primary/secondary/ghost), estado selecionado comunicado por cor+borda+peso combinados.

**Switch** `[FATO]` — on/off, com label e descrição auxiliar opcional, estado desabilitado (label também esmaecido). Observado embutido dentro de um exemplo de formulário, não só isolado.

**Flyout Menu (ação/popover de ações)** `[FATO]` — duas formas: lista simples de ações (fecha ao clicar qualquer item) e forma "empilhada" com cabeçalho + corpo rolável + rodapé de ações de confirmação. `[FATO, achado relevante]`: na forma empilhada, itens do **corpo** não fecham o menu ao clicar, só os botões do **rodapé** fecham — inconsistência real observada na fonte, não documentada como intencional em comentário, mas plausivelmente por design (corpo = navegação/leitura, rodapé = commit da ação). Registrar como comportamento a decidir conscientemente ao portar, não copiar às cegas.

**Destructive Action** `[FATO]` — ações destrutivas (ex.: excluir) combinam cor negativa **com** tooltip explicativo ("Ação destrutiva — não pode ser desfeita") — reforça o princípio "nunca só cor" também para ações, não só para estado.

### 5.5 Data Entry

**Input / Textarea / Select / Checkbox / Radio / Switch** `[FATO]` — campos padrão observados em uma composição real de formulário (nome, e-mail, tipo, campo desabilitado, notas, checkbox, radio group).

**Upload** `[FATO]` — estados idle / uploading (spinner + progresso indeterminado) / success (ícone+texto) / error (ícone+texto). `[FATO, achado relevante — lacuna funcional da demo, não do design]`: o fluxo real de upload da demo está hardcoded para sempre suceder; só um botão de demonstração separado força o estado de erro. Ou seja, a demonstração cobre o estado de erro visualmente, mas não exercita o caminho real de falha — registrar isso como lacuna da implementação-fonte, não assumir que o padrão de erro real foi validado ponta a ponta.

**Help text / Validation / Required / Disabled** `[FATO]` — validação ao vivo observada em um campo de e-mail (checa presença de "@", mostra mensagem de erro abaixo do campo, roda a cada mudança e uma vez already-invalid no carregamento inicial). Campo desabilitado com valor somente-leitura. Não há evidência de indicador visual de campo obrigatório (asterisco etc.) — `[NÃO ESPECIFICADO]`.

**Loading (submit)** `[FATO]` — botão de envio muda de rótulo ("Enviando..." vs "Salvar") e ganha estado de loading+disabled durante o envio; sucesso dispara feedback positivo (toast).

Princípio: **[RECOMENDAÇÃO]** formulário deve privilegiar alinhamento, previsibilidade e baixa densidade decorativa — inferido do padrão observado (campos em linha com `flex-wrap` e `min-width`, sem ornamentação extra), não uma regra escrita na fonte.

### 5.6 Feedback

**Badge** `[FATO — confirmado]` — 4 variantes semânticas + default/neutro.

**Toast/Notificação** `[FATO]` — 4 tipos (info/positive/warning/negative) + variação de posição (topo padrão, canto inferior direito observado como alternativa). Sem customização de duração/dismiss além do padrão da lib usada na fonte — `[STACK-SPECIFIC]` esse detalhe de auto-dismiss.

**Progress** `[FATO]` — linear determinado, linear indeterminado, circular determinado (com valor numérico exibido dentro do anel), spinner indeterminado. Cores semânticas aplicadas (primary/positive/negative) mas sem um estado "warning" real observado nesse componente especificamente (só nos outros: badge, stepper, KPI).

**Loading (estado de sistema)** `[FATO]` — padrão recorrente: spinner + texto curto explicando o que está carregando (nunca só o spinner sozinho).

**Empty State** `[FATO]` — ícone grande (opacidade reduzida) + título + subtítulo opcional + ação opcional (só aparece se rótulo E callback forem fornecidos juntos). Reutilizado por Tabela e por Estados de Dashboard em vez de cada um duplicar seu próprio "vazio".

**Estados de dados de um painel** `[FATO]` — vocabulário de 5 estados observado explicitamente: **loading**, **empty** (nada configurado ainda — implica ausência de setup), **no data** (distinto de empty — implica filtros aplicados sem resultado), **error** (com ação de "tentar novamente"), **success/ok**. `[FATO, achado relevante]`: na demonstração, a ação de "tentar novamente" sempre força sucesso — não existe um caminho de retry-que-falha-de-novo demonstrado.

**Console/Logs** `[FATO]` — visualizador monoespaçado com linhas coloridas por nível (info/warn/error). `[FATO, achado relevante — lacunas da demo]`: o botão "Copiar" não copia de fato para a área de transferência, só simula com um toast (diferente do botão de copiar da galeria de ícones, que copia de verdade via clipboard real); o botão "Limpar" não tem nenhum handler — é decorativo na demo. Registrar essas duas lacunas explicitamente para não serem copiadas como "padrão validado" por engano.

**Unavailable/stale** — `[NÃO ESPECIFICADO]`. Não há um estado distinto de "dado desatualizado/indisponível" observado além dos 5 estados de painel já listados.

### 5.7 Overlays

Intenções a preservar (inferência a partir do uso observado + princípio geral de design de overlays, aplicado com moderação já que a fonte não documenta isso em texto):

- **Modal** `[FATO comportamento + INFERÊNCIA intenção]` — observado em dois usos: confirmação de ação destrutiva (título + aviso + Cancelar/Confirmar, confirmar fecha e dá feedback) e formulário curto dentro de modal (campos + Cancelar/Criar). **Intenção inferida**: usar quando a decisão interrompe legitimamente o fluxo atual; não usar para informação que poderia existir naturalmente na página.
- **Drawer** `[FATO comportamento]` — painel deslizante lateral, mostrado na fonte como uma versão *confinada* (dentro de uma caixa de preview, para não afetar a página real) do drawer real que a própria sidebar do shell usa. Abre/fecha por transform CSS com transição curta. **Intenção inferida**: preferível para inspeção contextual, detalhes, filtros — conteúdo que coexiste com a página, não a substitui.
- **Popover (Menu/Flyout)** `[FATO comportamento]` — ancorado ao botão-gatilho, fecha automaticamente ao clicar fora ou (na maioria dos itens) ao selecionar uma ação. **Intenção inferida**: ações pequenas, escolhas locais, informação contextual — não deve virar uma tela escondida (ver a ressalva do item "corpo x rodapé" na Seção 5.4).
- **Tooltip** `[FATO — extensamente confirmado]` — complementa controles compactos/icon-only; nunca única fonte de informação crítica (ver Seção 8).
- **Toast** — ver Seção 5.6.
- **Command Palette** — ver Seção 5.3 (é tecnicamente um modal/dialog na fonte, mas seu comportamento é o de um padrão de navegação avançado, por isso documentado em Navigation).

### 5.8 Data Display

**Card** `[FATO]` — superfície genérica com título, subtítulo opcional, corpo via callback. Estados: normal, loading (spinner ao lado do título), disabled. `[FATO, achado relevante]`: assim como o Accordion, o estado "disabled" do Card é só uma classe CSS de aparência — não há confirmação de bloqueio funcional de clique/interação. Mesma ressalva se aplica.

**KPI Card** `[FATO]` — título + valor + delta opcional (ícone de tendência + texto, cor por estado positive/neutral/warning/negative) + barra de progresso de meta opcional com legenda. Hierarquia visual observada: valor em destaque > delta > contexto/legenda da meta. **[INFERÊNCIA]** tendência nunca é só verde/vermelho — sempre acompanhada de um ícone de direção (seta cima/baixo/traço/exclamação conforme o estado).

**Table** `[FATO]` — cabeçalho, linhas, ordenação por coluna (quando marcada como ordenável), paginação nativa quando o total excede o tamanho de página, densidade compacta (`dense`), célula customizada para renderizar badges de status a partir do valor bruto. Estados alternativos: loading (spinner central) e empty (reaproveita o Empty State). *Stack-specific*: a customização de célula usa um mecanismo de template específico do Quasar/Vue — só a intenção (mapear valor→badge visualmente) é portável, não a técnica.

**Accordion** — ver Seção 5.3 (é também um padrão de disclosure de dado/conteúdo, listado lá).

**Logs/Console** — ver Seção 5.6.

**Icons (catálogo)** `[FATO]` — não é um componente de produto, é uma ferramenta de navegação da própria galeria: busca local, variantes de cor (normal/muted/active/destructive) e tamanho (sm/md/lg), exemplos "aplicados em contexto" (ícone dentro de botão/badge/linha de sidebar/item de flyout) para mostrar que o mesmo ícone se adapta ao estilo do componente hospedeiro. **Fora do inventário de componentes de produto** — registrado aqui só por completude, não como algo a replicar como "componente".

### 5.9 Data Visualization

Regra central preservada desde a primeira revisão: **paleta de UI ≠ paleta de charts** (`semantic.color` vs `component.chart`), nunca fundir os domínios. A engine (biblioteca de gráfico/mapa) é escolha livre.

`[FATO — confirmado por leitura direta de charts_demo.py e charts.py nesta rodada final; promovido de inferência para fato]` Seis tipos confirmados: **line** (com legenda, tooltip por eixo, toggle reta/suavizada via Button Group, export CSV e export PNG via `getDataURL` nativo do ECharts), **bar** (clique numa barra abre um "drilldown" demonstrativo — um pequeno detalhe por semana, fictício), **area** (linha suavizada com preenchimento semi-transparente), **donut** (fatia selecionável, `selectedMode: single`), **sparkline** (mini-linha inline sem eixos, cor lida dinamicamente do estado positive/negative da paleta de chart), **heatmap** (escala de cor vertical/`visualMap`, tooltip por célula).

`[FATO, achado relevante — limitação real de sincronização]` A paleta de cada gráfico é lida de `CHART_LIGHT`/`CHART_DARK` **uma única vez, no momento em que o gráfico é construído** — comentário explícito no código-fonte confirma: se o tema for alternado com a aba de gráficos já aberta, os gráficos existentes **mantêm a paleta antiga até a aba ser revisitada** (não há hook de re-render global disparado pelo toggle de tema). Isto é diferente do resto do sistema, onde `--sa-*` (CSS custom properties) atualiza tudo instantaneamente. Registrar como limitação a decidir conscientemente ao portar — não assumir que troca de tema é instantânea para gráficos como é para o resto da UI.

**Mapa** `[FATO, herdado da primeira revisão]` — superfície especializada com marcador, marcador selecionado (aproximado via filtro CSS sobre um ícone fixo — não-portável como cor direta, ver `component.map` em tokens.json), popup com coordenadas e ação de copiar, seleção via clique. Contrato portável: existência de um marcador selecionável com destaque visual e um popup de detalhe — não a técnica Leaflet/tiles/filtro específica.

### 5.10 System / Interaction Patterns

Estados transversais observados nos componentes acima (não listados de novo individualmente, só consolidados aqui como o "alfabeto" comum): `default`, `hover` (implícito via CSS, geralmente não inspecionado a fundo nesta rodada — `[NÃO ESPECIFICADO]` em detalhe visual exato para a maioria dos componentes, só confirmada a existência da classe), `active/selected`, `focus-visible` (confirmado explicitamente só no resize handle via `tabindex`; para os demais componentes, herdado dos padrões nativos do Quasar sem customização visível — `[NÃO ESPECIFICADO]` se há tratamento visual próprio), `disabled` (com a ressalva importante: **pelo menos dois casos — Accordion e Card — implementam "disabled" apenas como aparência CSS, não como bloqueio funcional**; Tabs e o botão de modal usam a prop real de desabilitar), `loading`, `success`, `warning`, `error`.

Responsividade, densidade, microcopy e motion são tratados como princípios transversais nas Seções 6–9, não repetidos aqui por componente.

---

## 6. Responsividade — reorganização de prioridade, não só redimensionamento

`[FATO, confirmado por múltiplos componentes + pela própria página "Layout Lab" da galeria-fonte, cujo propósito declarado é ensinar esses princípios interativamente]`:

- **Desktop**: sidebar disponível (expandida ou mini), múltiplas colunas quando útil (grid de dashboard em 4 colunas, layouts de 3 colunas fixo+fluido+fixo), overlays de inspeção (drawer) podem coexistir com o conteúdo principal.
- **Tablet/estreito**: grid de dashboard reduz para 2 colunas; grids genéricos (`auto-fit`/`minmax`) reduzem número de colunas continuamente conforme o espaço disponível, sem depender de breakpoints fixos — este é o padrão-base de grid responsivo do sistema (confirmado pela lab de Viewport).
- **Mobile (~<768px, o breakpoint recorrente na fonte)**: sidebar sticky/fixed cai para normal (documentado na própria UI da fonte); paginação numerada desaparece, dá lugar ao modo compacto "página X de Y"; split view horizontal empilha verticalmente (com o handle de resize correspondente escondido); breadcrumb colapsa itens do meio já em qualquer largura quando excede a contagem-limite (mecanismo por contagem, não por viewport); grid de dashboard cai para 1 coluna.
- Header e área de conteúdo usam padding menor em telas estreitas, maior a partir do breakpoint `sm`, e o header pode quebrar em duas linhas (`flex-wrap`) em vez de comprimir/sobrepor elementos.

Princípio: responsividade = reorganizar o que é prioritário mostrar, não apenas encolher elementos proporcionalmente.

## 7. Densidade e hierarquia visual

**[RECOMENDAÇÃO, inferida do padrão consistente observado]**: densidade "compacta mas não apertada" — tabelas e listas usam a escala tipográfica mais compacta (`table`, `aux`), padding consistente vindo da escala de spacing central, controles pequenos (ícone/botão sm) quando o significado é inequívoco. A própria lab de Grid/Flex expõe "densidade" como um controle de primeira classe (mapeado a tokens de spacing xs/md/xl), confirmando que é tratado como uma dimensão de design deliberada, não acidental.

Hierarquia observada de forma consistente (não como regra escrita, como padrão repetido): valor/dado principal > estado/delta > contexto secundário/metadado; um botão primário por agrupamento de ações (demonstrado nos dialogs: uma ação primária/negativa + uma ação flat de cancelar, nunca dois botões primary competindo).

## 8. Motion

`[NÃO ESPECIFICADO como sistema]` — ver Seção 4. Únicos comportamentos de movimento observados: transição de hover em cards, slide do drawer confinado (translateX com easing curto), abrir/fechar nativo de dialog/menu/expansion (comportamento padrão da lib usada na fonte, não customizado). **[RECOMENDAÇÃO]** ao portar: movimento deve indicar mudança de estado ou relação espacial (abrir/fechar, expandir/colapsar), ser curto e discreto, e respeitar `prefers-reduced-motion` — esta é uma recomendação de boa prática, não uma regra confirmada na fonte, já que não há evidência de tratamento de `prefers-reduced-motion` no código.

## 9. Microcopy

**[INFERÊNCIA — alta confiança, por amostragem consistente]** Textos de ação observados são curtos e diretos: "Salvar", "Cancelar", "Copiar", "Abrir", "Limpar filtros", "Tentar novamente", "Nenhum resultado" (variações tipo "Nenhum ícone encontrado.", "Nenhum componente cadastrado"), confirmações específicas por contexto ("Removido (simulado).", "Formulário salvo (simulado).") em vez de um genérico "Sucesso". **[RECOMENDAÇÃO]** preservar esse padrão — texto curto, acionável e específico ao contexto — ao escrever microcopy nova.

## 10. Acessibilidade

Ampliado nesta revisão com achados concretos do inventário completo:

- **[CORREÇÃO DE ACESSIBILIDADE, herdada]** Accessible name obrigatório em todo controle icon-only — não confiar só em `title`/tooltip visual.
- **[FATO]** O Command Palette é o exemplo mais completo de acessibilidade por teclado na fonte: navegação circular por setas, Enter confirma, Escape fecha, atalho global funciona mesmo com outro campo em foco. Vale como referência de padrão a preservar ao portar busca/paleta de comandos para outra stack.
- **[FATO]** Resize handles têm `role="separator"`, `aria-orientation`, `aria-label`, `tabindex="0"` — o único componente com semântica ARIA explícita observada na fonte além de tooltips.
- **[CORREÇÃO DE ACESSIBILIDADE]** Os casos de "disabled visual-apenas" (Accordion, Card) são um risco de acessibilidade real se replicados sem ajuste — um elemento que parece desabilitado mas continua focável/clicável/anunciado como habilitado por um leitor de tela é uma armadilha. Ao portar, usar o atributo `disabled`/`aria-disabled` real, não só a classe CSS.
- **[RECOMENDAÇÃO]** `:focus-visible` deve existir em todo elemento interativo — a fonte não demonstra isso de forma customizada além do resize handle; tratar como recomendação, não fato generalizado.
- Contraste: `[NÃO ESPECIFICADO]` — sem teste formal WCAG documentado (herdado da primeira revisão).
- Tooltip nunca é única fonte de informação crítica — reforçado pelo próprio padrão observado de combinar tooltip + cor + ícone em ações destrutivas.

## 10a. Reconciliação: FONTE vs. CORREÇÃO DE REFERÊNCIA vs. RECOMENDAÇÃO

`reference.html` em alguns pontos deliberadamente melhora um comportamento observado no Shared_Arch em vez de reproduzi-lo tal como é. Isso é aceitável — o objetivo do pacote é a intenção do design system, não um clone bit-a-bit de uma implementação com falhas conhecidas — mas precisa estar rotulado sem ambiguidade. Três rótulos, nunca misturados:

- **[FONTE]** — comportamento realmente observado e reproduzido como está no Shared_Arch.
- **[CORREÇÃO DE REFERÊNCIA]** — a fonte tinha um comportamento diferente (geralmente uma falha ou lacuna), e `reference.html` ajusta deliberadamente por acessibilidade, semântica ou consistência. A aparência é preservada; o comportamento funcional muda.
- **[RECOMENDAÇÃO]** — não existe na fonte nem foi adicionado por necessidade de correção; é uma orientação para quem for implementar algo novo.

Casos identificados nesta exportação:

| Onde | Comportamento na fonte | O que `reference.html` faz | Rótulo |
|---|---|---|---|
| Accordion, item "Indisponível" | **[FONTE]** Estado "desabilitado" é só uma classe CSS (`sa-state-disabled`) — o item continua tecnicamente clicável/expansível, sem bloqueio real (achado da Seção 5.3/12). | O JS do `reference.html` verifica `aria-disabled="true"` e **bloqueia de fato** o clique, preservando a aparência esmaecida mas não replicando a falha funcional. | **[CORREÇÃO DE REFERÊNCIA]** — texto da demo em `reference.html` foi corrigido nesta rodada para declarar isso explicitamente (ver seção 11 do HTML), em vez de dizer que "reproduz" a deficiência. |
| Controles icon-only (hambúrguer, copiar, fechar, command palette) | **[FONTE]** Usa `.tooltip()` do NiceGUI/Quasar — fornece um tooltip visual; não há confirmação de que isso gere um accessible name equivalente a `aria-label` em todos os casos. | Todo icon-only em `reference.html` recebe `aria-label` explícito **além do** tooltip visual custom. | **[CORREÇÃO DE ACESSIBILIDADE]** (já rotulado assim desde a 1ª revisão, mantido). |
| `:focus-visible` em botões, campos, tabs, accordion, popover, handles | **[FONTE]** Não há customização visível de foco além do que o Quasar aplica nativamente por padrão (não inspecionado a fundo — `[NÃO ESPECIFICADO]`). | `reference.html` define `:focus-visible` explícito em praticamente todo elemento interativo. | **[CORREÇÃO DE REFERÊNCIA]** aplicada uniformemente, não uma reprodução de algo observado. |
| `@media (prefers-reduced-motion: reduce)` no spinner | **[FONTE]** Nenhuma menção a `prefers-reduced-motion` em lugar nenhum do código (Seção 8 — Motion é `[NÃO ESPECIFICADO]`). | `reference.html` respeita a preferência, alongando a duração da animação do spinner. | **[RECOMENDAÇÃO]** aplicada no HTML como exemplo — não é correção de uma falha documentada, é a prática recomendada da Seção 8 sendo demonstrada. |
| Resize handle: `role="separator"`, `aria-orientation`, `aria-label`, `tabindex`, navegação por setas | **[FONTE]** Confirmado literalmente em `resize_handle.py` — todos esses atributos já existem na fonte. | `reference.html` reproduz o mesmo padrão (inclusive navegação por setas no handle do split view demo). | **[FONTE]** — nenhuma correção aqui, é reprodução fiel. |
| Command Palette: atalho global, navegação circular por setas, Enter/Escape | **[FONTE]** Confirmado literalmente em `command_palette.py`. | `reference.html` reproduz o mesmo contrato numa implementação simplificada. | **[FONTE]** — nenhuma correção, reprodução fiel do contrato (não da técnica de implementação). |

Regra geral daqui para frente: qualquer nova adição ao `reference.html` que não reproduza um comportamento já confirmado como FATO na Seção 5 deve ser explicitamente rotulada no próprio HTML (comentário) e, se relevante o suficiente, referenciada aqui.

## 11. Adaptação por stack

**Obrigatório preservar**: nomes semânticos de token; paridade de chaves light/dark; accessible name real (não só tooltip) em icon-only; estado em 2+ canais; separação do domínio de paleta chart/map; a intenção de cada tipo de overlay (Seção 5.7); a reorganização de prioridade por breakpoint (Seção 6), não só escala.

**Livre escolha**: framework, metodologia CSS, biblioteca de ícones, biblioteca de gráfico/mapa, biblioteca de overlay (Radix, Headless UI, componente próprio, CSS puro) — o que precisa sobreviver da implementação NiceGUI de cada overlay é **quando usar, onde aparece, como abre/fecha, relação com o conteúdo principal, hierarquia, estados, acessibilidade, tokens e comportamento responsivo** — não a biblioteca original.

## 12. Limitações, não-objetivos e lacunas registradas

**Não-objetivos** (herdados): não é clone do NiceGUI/Quasar; não inclui implementação real de gráfico/mapa; não propõe nova identidade visual; não é biblioteca pronta para importar.

**Lacunas e ambiguidades desta revisão** (registradas para não serem "completadas por bom senso"):
- "Disabled" visual-apenas (não funcional) em **Accordion** e **Card** — inconsistente com o "disabled" real (prop nativa) usado em **Tabs** e no botão de modal indisponível. Um padrão a decidir conscientemente ao portar, não a copiar cegamente.
- Botão "Limpar" do console de logs não tem handler (morto na demo); botão "Copiar" do console de logs não copia de verdade (só simula com toast) — ao contrário do botão de copiar da galeria de ícones, que copia de fato via clipboard real. Duas implementações do "mesmo" padrão de cópia divergem — registrar como inconsistência da fonte, não como duas variantes intencionais.
- Fluxo real de Upload nunca demonstra erro organicamente — só um botão de demo separado força esse estado.
- Ação de "tentar novamente" nos estados de dashboard sempre força sucesso — não há caminho de retry-que-falha-de-novo demonstrado.
- Flyout empilhado: itens do corpo não fecham o menu ao clicar, só os do rodapé — plausivelmente intencional (leitura vs. commit), mas não documentado como tal na fonte.
- Sidebar em modo "fixed": um redimensionamento manual da largura da sidebar durante esse modo pode dessincronizar a compensação de margem do conteúdo até o próximo toggle de modo/mini — limitação reconhecida explicitamente em comentário da fonte, não é bug a esconder.
- Larguras/limites da Sidebar (expandida/mini/mín/máx) e do Split View (padrão/mín/máx) são **constantes locais dentro do respectivo arquivo de componente**, não tokens centralizados em `tokens.py` — por isso **não foram adicionadas a `tokens.json`** (regra da Fase 5: não promover propriedade local a token). Ao portar, é uma decisão livre de implementação onde colocar esses valores, mas vale saber que a fonte não os trata como parte do sistema central de tokens.
- Hover/focus-visible detalhado por componente: existência confirmada via nomes de classe, mas o valor visual exato não foi reinspecionado a fundo nesta rodada para todos os ~35 padrões — tratar ausência de detalhe aqui como `[NÃO ESPECIFICADO]`, não como "não existe".
- Overflow de Tabs em telas estreitas: comportamento padrão da lib, não testado/documentado explicitamente na fonte.
- (Herdadas da 1ª revisão) `shadow-primary` == `accent` hoje no light mas podem divergir; `map-selected` não-portável como cor direta; sem teste formal de contraste WCAG.

---

## 13. Tabela de rastreabilidade (evidência da Fase 1)

Inspeção acumulada: **38 arquivos lidos integralmente** ao longo das três rodadas — os 34 da segunda revisão (todos os componentes de `src/shared_arch/components/`, todas as páginas de `src/shared_arch/pages/`, `src/shared_arch/layouts/shell.py`, `app.py`) mais os 4 fechados nesta rodada final: `charts_demo.py`, `foundation.py`, `icons.py`, `charts.py`. Arquivos cobertos pela primeira revisão e reutilizados sem releitura desde então: `tokens.py`, `theme.py`, `button_group.py`, `badge.py`, `pagination.py`, `stepper.py`, `map_demo.py`. **Nenhum arquivo do projeto permanece fora da inspeção nesta linha de componentes/páginas** — o escopo restante fora desta exportação é deliberado (testes, scripts de start, config de ambiente), não uma lacuna de inventário.

| Padrão | Categoria | Arquivo-fonte | Confiança |
|---|---|---|---|
| Tabs | Navigation | components/tabs_demo.py | FATO |
| Accordion | Navigation/Data Display | components/accordion_demo.py | FATO (+ lacuna disabled) |
| Modal | Overlays | components/modal_demo.py | FATO |
| Drawer | Overlays | components/drawer_demo.py | FATO |
| Flyout/Popover | Overlays/Actions | components/flyout_menu.py | FATO (+ inconsistência corpo/rodapé) |
| Toast | Feedback | components/toast_demo.py | FATO |
| Form fields | Data Entry | components/form_demo.py | FATO |
| Table | Data Display | components/table_demo.py | FATO |
| Command Palette | Navigation | components/command_palette.py | FATO |
| Dashboard Filter Bar | Data Entry/Layout | components/dashboard_filters.py | FATO |
| Dashboard Data States | Feedback | components/dashboard_states.py | FATO (+ lacuna retry) |
| Split View | Layout | components/split_view.py | FATO |
| Resize Handle | Layout | components/resize_handle.py | FATO |
| Breadcrumb | Navigation | components/breadcrumb.py | FATO |
| Progress | Feedback | components/progress_demo.py | FATO |
| Upload | Data Entry | components/upload_demo.py | FATO (+ lacuna erro real) |
| Switch | Actions/Data Entry | components/switch_demo.py | FATO |
| Logs/Console | Feedback | components/logs_demo.py | FATO (+ lacunas copiar/limpar) |
| Empty State | Feedback | components/empty_state.py | FATO |
| Section (anchor wrapper) | System | components/section.py | FATO |
| Sidebar | Layout | components/sidebar.py | FATO |
| Header | Layout | components/header.py | FATO |
| Icon catalog | Data Display (ferramenta da galeria) | components/icon_gallery.py | FATO |
| KPI Card | Data Display | components/kpi_card.py | FATO |
| Card | Data Display | components/card.py | FATO (+ lacuna disabled) |
| Divider | Layout | components/divider.py | FATO |
| App Shell | Layout | layouts/shell.py | FATO |
| Button, Button Group, Badge, Pagination, Stepper, Mapa | Actions/Navigation/Data Viz | (1ª revisão — ver histórico) | FATO |
| Line/Bar/Area/Donut/Sparkline/Heatmap | Data Visualization | components/charts_demo.py, pages/charts.py | FATO (promovido de inferência nesta rodada final, por leitura direta) |
| Foundation (cores/spacing/tipografia/botões, tour de tokens) | Foundation (ferramenta da galeria) | pages/foundation.py | FATO |
| Icon catalog / Sizes & Variants / Aplicados | Data Display (ferramenta da galeria) | pages/icons.py | FATO |
| Composição da aba Charts (Gráficos + Mapa) | Data Visualization | pages/charts.py | FATO |

---

## 14. Checklist de conformidade

- [ ] 21 tokens semânticos de cor, paridade light/dark
- [ ] Paleta chart/map como domínio separado
- [ ] Escala tipográfica real aplicada (não a legada)
- [ ] Accessible name real (não só tooltip) em todo icon-only
- [ ] Estado em 2+ canais em todos os componentes de feedback
- [ ] "Disabled" implementado como bloqueio funcional real, não só aparência (ver lacuna da Seção 12)
- [ ] Overlays escolhidos por intenção (modal=decisão que interrompe, drawer=contexto coexistente, popover=ação local, tooltip=complemento nunca crítico)
- [ ] Tabs, Accordion, Breadcrumb, Pagination, Stepper, Command Palette implementados com seus estados documentados (Seção 5.3)
- [ ] Formulário com validação/loading/disabled documentados (Seção 5.5)
- [ ] Tabela com sort/loading/empty/paginação (Seção 5.8)
- [ ] Responsividade como reorganização de prioridade (Seção 6), não só escala
- [ ] Nenhum token novo inventado sem marcá-lo como extensão fora da extração original
