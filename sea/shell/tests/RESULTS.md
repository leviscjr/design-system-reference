# SEA Workspace Shell — evidências de validação

Gerado por `node sea/shell/tests/validate.cjs` em 2026-11-04T17:22:59.733Z.

Artefato: cópia isolada de `sea/shell/index.html` (única peça em pasta temporária), aberta por `file://` com rede bloqueada e registrada (0 requisições externas).

sha256 `c61cf61384b68e476158a3afd5394635b56a7edc07474ca4afe55c98c6ebb7da` · 1074.0 KiB · Chromium 153.0.8010.12 · Node v22.23.4

Resultado: **33/33 aprovados**.

Headless/SwiftShader: tempos absolutos variam por máquina; as verificações usam limites relativos.

| ID | Verificação | Resultado | Detalhe |
|---|---|---|---|
| T00 | Artefato único sem referências externas (estático) | PASSOU | 1074 KiB · sha256 c61cf61384b68e47… |
| T01 | Carrega por file://, sem erros de console e sem requisições de rede | PASSOU |  |
| T02 | Estado inicial: árvore ARIA, seleção sincronizada nos três painéis | PASSOU | 23 itens na árvore |
| T03 | Explorer → Canvas/Inspector: clicar no documento troca o contexto | PASSOU |  |
| T04 | Estado vazio útil (documento sem páginas no fixture) e retorno | PASSOU | doc:slfs022k |
| T05 | Troca de viewer sem reconstruir o shell (mesma instância do DOM) | PASSOU | pdf:v,table:h,class:h,record:h |
| T06 | Canvas → Explorer/Inspector: linha da tabela seleciona, árvore acompanha, hero recebe o valor | PASSOU | 0 … 70°Cfaixa |
| T07 | Referência à origem: Enter na tabela localiza no PDF (destaque visível na área rolável) | PASSOU | página 4 |
| T08 | PDF → seleção: clicar na evidência seleciona o parâmetro e atualiza o Inspector | PASSOU | 98.5°C/Wtíp |
| T09 | Revisão por teclado (A/X/R): estado muda em Explorer, Canvas e Inspector; desfazer restaura | PASSOU | rev → acc → rev; faixa 1 → 2 → 1 |
| T10 | Morph: um fantasma por vez, interrompível, destino visível ao final | PASSOU | fantasmas durante=1, interrompido=1, final=0; assentou em 916 ms |
| T11 | Teclado na árvore: setas, Home/End, →/←, Enter, digitação | PASSOU | ok |
| T12 | Busca e filtros compactos | PASSOU | filtro por texto/estado/vazio |
| T13 | Explorer recolhe sem perder a seleção; Canvas aproveita o espaço; reversível e interrompível | PASSOU | Explorer 320→40→320px; Canvas 748→1028px |
| T14 | Redimensionamento por arraste, teclado e duplo clique; limites respeitados | PASSOU | Explorer 320→396→380→320; Inspector limitado a 560px |
| T15 | Inspector: recolhe/expande, grupos preservam estado entre seleções | PASSOU | recolhido 40px → 340px |
| T16 | Palette (Ctrl+K): busca, navegação por teclado, Enter seleciona, Esc devolve o foco | PASSOU | ok |
| T17 | Modo foco (F/Esc), histórico (Alt+←/→) e tema | PASSOU | dark→light→dark |
| T18 | Actionbar flutuante reposiciona para não cobrir a seleção (e volta) | PASSOU | bottom → top → bottom |
| T19 | Sem rolagem global; rolagem localizada independente (Explorer, Canvas, Inspector) | PASSOU | {"gs":true,"ov":"hidden","treeScroll":true,"pdfScroll":true,"inspScroll":true} |
| T20 | Acessibilidade: nomes acessíveis em icon-only, tooltips, foco visível, ARIA de tabs/separators | PASSOU | 41 botões de ícone com nome; tooltip "InspectorCtrl+I" |
| T21 | Contraste estimado do texto principal/secundário (WCAG AA ≥ 4,5:1) nos dois temas | PASSOU | dark: texto 15.2 · secundário 8.6 · acento 10.1 · light: texto 17.3 · secundário 7.1 · acento 5.4 |
| T22 | Persistência local: layout, tema, viewer e seleção sobrevivem ao recarregamento | PASSOU | tema light, aba tab-table, Explorer 352px |
| T23 | Viewport médio (1000×700): negocia espaço, Canvas ≥ 440 px, sem overflow | PASSOU | modo medium: Explorer 268, Canvas 440, Inspector 260; ao alargar Explorer volta a 320px |
| T24 | Mobile (390×800): Explorer em drawer, Inspector em sheet, ações acessíveis, sem overflow | PASSOU | peek 64px → sheet 502px; drawer 340px |
| T25 | Reduced motion: sem voo de morph, painéis sem animação, atmosfera estática | PASSOU | atmosfera idêntica após 900 ms; painel no destino em ≤ 80 ms |
| T26 | Velocidade ambiental ≈ 40% da referência e independente da interativa | PASSOU | ambiente 0.39× vs referência 1.01× (razão 0.39); recolher painel 329 ms / 328 ms |
| T27 | Interrupção de abas: alternância rápida deixa exatamente um viewer visível e a aba correta | PASSOU | {"vis":["record"],"tab":"tab-record","empty":false} |
| T28 | Pan/zoom somente onde cabe: Classificação sim (roda/arraste/ajustar); PDF/Tabela/Registro rolam | PASSOU | classificação transform muda (zoom/pan/fit); PDF rolou 403px |
| T29 | Estado de carregamento visível na 1ª abertura do viewer e preservação de estado ao voltar | PASSOU | skeleton exibido; ordenação preservada |
| T30 | Inspector alarga/reduz sob demanda (reversível) e respeita o espaço do Canvas | PASSOU | Inspector 340→460→340px; Canvas 748→628px |
| T31 | Acompanhar seleção: ligado revela na árvore; desligado não move a árvore | PASSOU | ok |
| T32 | Robustez: toda entidade × todo viewer renderiza sem erro; Inspector e breadcrumb coerentes | PASSOU | 188 seleções (47 entidades × 4 viewers) |
