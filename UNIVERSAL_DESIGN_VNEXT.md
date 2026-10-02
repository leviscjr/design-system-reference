# Universal Design vNext — extensão de experiência

> Status: **normativo para novos padrões de interação**; diretrizes visuais são *candidatas* até validação de contraste e aprovação do consumidor. Data: 2026-10-02.
>
> Este documento **não modifica retroativamente a extração Shared_Arch** em `DESIGN_SYSTEM.md` ou os valores de proveniência em `tokens.json`. Para novas superfícies, aplicar esta extensão em conjunto com a referência original. Para conflitos entre comportamentos explicitamente definidos aqui e lacunas da extração, prevalece esta extensão; fatos históricos da fonte continuam descritos exclusivamente no documento original. Um perfil de produto pode escolher valores e defaults concretos sem transformar essas escolhas em regras universais.

## 1. Invariantes

1. **Densidade proporcional:** espaçamento, tamanho do texto e dimensão visual do contêiner evoluem juntos. Remover padding redundante antes de diminuir a fonte; não confundir *altura visual* com *área acionável*.
2. **Hierarquia legível:** mesmo papel tipográfico -> mesmo token, independentemente do card; labels da navegação não devem ser comprimidos para compensar um grid mal dimensionado.
3. **Cor com propósito:** separar (a) identidade de domínio, (b) estado operacional, (c) maturidade de implementação, (d) seleção e (e) severidade. Uma cor isolada nunca basta para transmitir estado.
4. **Movimento informa mudança:** a animação facilita reconhecer abertura, fechamento, seleção e continuidade espacial. Nunca usar pulsação permanente para simular atividade, nem animar dado não observado.
5. **Progressive disclosure:** informação detalhada sob demanda; superfícies vazias ou indisponíveis não devem reservar áreas grandes sem função.
6. **Dados honestos:** `unknown/unavailable` ≠ `0` ≠ `healthy` ≠ `empty`. Ausência de integração jamais autoriza afirmar inexistência de ocorrências.
7. **Ação inequívoca:** link navega; disclosure expande; menu apresenta comandos; ícone indisponível não aparenta executar ação.
8. **Fonte única de estado:** header, navegação, launcher e painel contextual compartilham significado de seleção/estado sem copiar telemetria.
9. **Acessibilidade funcional:** teclado, nomes acessíveis, foco e reduzido movimento são contrato, não acabamento.
10. **Portabilidade:** descrever anatomia, semântica e comportamento independentemente de React, HTML, NiceGUI, HTMX, Alpine ou outra stack.

## 2. Foundation extensível (sem alterar os tokens extraídos)

A base neutra permanece dominante. Acentos de domínio podem diferenciar famílias de conteúdo por ícone, fundo tonal suave e pequena linha de ênfase. Bordas e texto secundário devem ter contraste perceptível.

### Papéis semânticos a implementar no adapter

- `surface.page/card/raised/hover/selected`
- `text.primary/secondary/muted`
- `border.default/interactive/focus`
- `accent.domain.*` (identidade temática **não** significa saúde)
- `status.healthy/warning/critical/unknown`
- `maturity.planned/partial/complete` (não reuse nomes de status operacional)
- `motion.fast/normal/panel`
- `space.compact/comfortable`

Esses nomes são **papéis conceituais**, não obrigam renomear os tokens existentes. Atribuições e valores novos deverão entrar em camada de extensão, com paridade light/dark e verificações objetivas. Não reescrever `tokens.json` da extração como se valores V2 fossem observados no Shared_Arch.

### Referências para estudo, não defaults universais impostos

- feedback hover/cor: ~120–160 ms;
- disclosure: ~180–240 ms;
- drawer: ~200–260 ms;
- botão icon-only: label acessível; tooltip só complementa;
- escala de navegação compacta: tipicamente 14–15 px em aplicações densas, a confirmar por produto;
- texto comum: contraste WCAG AA (mín. 4.5:1 quando aplicável), componentes críticos/foco perceptíveis e alvos adequados para touch.

Evitar alterar geometria no estado hover/selected. Preferir `opacity`/`transform` em elementos apropriados e remover/reduzir movimento com `prefers-reduced-motion`. Motion **não substitui** atualização semântica de estado.

## 3. Anatomia: launcher compacto

`launcher = [slot ícone fixo] [label + metadado opcional flexível] [status opcional] [ação/chevron fixo]`.

- Eixos horizontais constantes para ícone, início do texto e ação, entre variantes.
- Ícones opticamente distintos podem exigir correção do SVG, mas não alteração arbitrária do padding do launcher.
- `min-width:0` no conteúdo flexível; truncamento deve preservar nome acessível.
- Seleção usa borda/fundo/ênfase, não uma mudança de largura ou padding.
- Altura visual pode ser compacta; superfície acionável segue o critério de toque/acessibilidade do contexto.
- Item `planned` ou `unavailable` não deve sugerir navegação operacional.
- Estados e alinhamentos devem ser testados para textos curtos/longos, ausência de ícone e zoom.

## 4. Disclosure / accordion

- Trigger explícito, foco, `aria-expanded`, `aria-controls` com ID válido, indicador coerente; independente de disclosures irmãos quando o contrato for multi-open.
- Conteúdo fechado não captura foco/cliques e **não ocupa altura residual**.
- A transição deve acompanhar o conteúdo e o indicador, respeitando reduced-motion; o mecanismo não pode depender de transições para funcionar.
- Um card poderá ser aberto por padrão, outros não: **o default pertence ao perfil da aplicação**.
- Contador/título permanecem visíveis quando recolhido. Ações independentes do cabeçalho não disparam toggle acidental.
- Não confundir disclosure de card com agrupamento da árvore de navegação.

## 5. Seletor de densidade de lista

Padrão genérico `ListDensitySelector` permite `N1/N2/…/all` definido pelo consumidor.

- Possui estado selecionado identificado por mais de cor, nome acessível e controle por teclado.
- Mudar densidade não navega, não inventa linhas e não altera fontes de dados.
- `all` significa todos os registros **carregados**; quando houver paginação, esclarecer limite e oferecer continuação explícita.
- O valor inicial e a persistência são definidos por produto, nunca supostos globalmente.
- Itens não carregados não devem ser tratados como inexistentes.

## 6. Utility rail + painel contextual

Quando atenção e auditoria forem funções secundárias disponíveis a partir de ícones:

- **Drawer contextual**, não modal de confirmação; desktop lateral, mobile sheet/drawer responsivo.
- Um overlay ativo por vez, acionador destacado, close/Escape/backdrop conforme contrato, foco gerido dentro do painel e restaurado ao acionador.
- Labels e estados discerníveis mesmo sem tooltip; não usar tooltip como única explicação.
- Ícones podem ter badges **apenas com evidência real**: atenção com contagem/severidade verificáveis; auditoria com novo/não-lido somente se existir leitura persistida ou equivalente.
- `unknown`/fonte não integrada usa aviso neutro explícito e não pode se tornar badge de sucesso nem indicador `0`.
- Evitar animações contínuas para status; notificações com atualização discreta e acessível.
- Estado `loading/empty/unknown/error/data` precisa estar distinto no drawer.

## 7. Shell: distribuição e scroll

- `topbar` comporta navegação, busca real, status compacto e usuário sem duplicar controles no workspace.
- Nas larguras estreitas, **reorganizar prioridade** antes de encolher tudo: mover controles para drawer/área acessível, não ocultar silenciosamente função real.
- Sidebar com região rolável independente; `min-height:0`, scroll completo e rodapé acessível.
- Drawer mobile trata foco, backdrop, Escape, safe-area e scroll lock/restauração.
- `workspace` usa largura útil disponível, sem terceira coluna vazia ou `max-width` herdado inadequadamente; perfil do produto decide max-width editorial quando justificável.
- O conteúdo não deve ficar encoberto pela utility rail nem duplicar informações operacionais já presentes na topbar.

## 8. Modelo de verificação

Aderência tem dois eixos independentes:

| Eixo | Exige |
|---|---|
| Operacional | fonte de dados, ações reais, autenticação e rotas preservadas, smokes e testes |
| Visual/interativo | navegador, largura medida, contraste, scroll, foco, abertura/retração, breakpoints e zoom |

Testar pelo menos larguras representativas entre 320 e 1920 px, reduced-motion e zoom 125–200%. Tests de CSS/ARIA isolados não provam que o browser reproduz a intenção; `PASS` estrutural não implica homologação humana.

## 9. Migração e compatibilidade

1. Mapear tokens e componentes que já existem.
2. Anotar os requisitos V2 como **extensão**, não como evidência retrospectiva da extração.
3. Adotar por componente e testar regressão antes de substituir estilos compartilhados.
4. Distinguir padrão universal de valor de produto (ver `profiles/LC_HUB_PROFILE_V2.md`).
5. Preservar CSS CSP-compatible e JS sem `unsafe-eval` quando o consumidor assim exigir.
6. Manter paridade de intenção nos temas light/dark se um consumidor oferecer ambos; não obrigar novo tema em uma implantação ainda em acabamento.

## 10. Checklist de conformidade V2

- [ ] Cores de domínio separadas de condição operacional e maturidade.
- [ ] Densidade não reduz tipografia ou alvo interativo de forma indevida.
- [ ] Ícones e chevrons seguem eixos consistentes.
- [ ] Sidebar/rail/drawer alcançáveis por teclado, touch e rolagem.
- [ ] Accordions e disclosures retraem sem altura residual.
- [ ] Densidade de listas mostra somente dados reais.
- [ ] Badge representa fato observável, não estado imaginado.
- [ ] Panel contextual com foco, Escape e retorno ao acionador.
- [ ] Responsividade reorganiza prioridade funcional.
- [ ] Testes de navegador e aceite humano diferenciados.
