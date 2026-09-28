# Proposal — Composition

Status: **experimental**
Categoria candidata: Layout + UX Principle

## Problema

O Design System atual cobre componentes e responsividade, mas ainda não possui um contrato forte para composição de dashboards e telas densas.

Uma interface pode usar componentes corretos e ainda assim falhar por:
- excesso de elementos de igual peso;
- ausência de foco;
- cards equivalentes competindo entre si;
- complexidade apresentada cedo demais.

## Intenção

Definir regras universais de composição que preservem densidade sem perder hierarquia.

## Princípios

### 1. Um hero contextual

Cada viewport/tela deve ter uma tarefa, informação ou estado dominante.

“Hero” não significa necessariamente banner grande. Significa o elemento com maior prioridade perceptiva.

### 2. Recognition over recall

Informações necessárias à decisão devem permanecer visíveis ou recuperáveis no contexto atual.

Preferir:
- labels claros;
- estados visíveis;
- filtros ativos;
- histórico recente;
- sugestões contextuais;
- command palette/busca.

Evitar depender de memória entre telas.

### 3. Progressive disclosure

Mostrar primeiro o necessário para a decisão atual.

Detalhes entram por:
- expand;
- drawer;
- tabs;
- drill-down;
- popover quando local.

### 4. Bento é hierarquia, não decoração

Bento Grid pode ser usado quando os blocos possuem importâncias ou funções diferentes.

Não criar um mosaico de cards de mesmo peso.

O tamanho relativo deve comunicar prioridade.

### 5. Calm by default

Estado normal deve ocupar pouca energia visual.

Atenção deve ser conquistada por:
- exceção;
- mudança;
- ação atual;
- foco explícito do usuário.

### 6. Ação primária limitada

Um agrupamento funcional deve possuir no máximo uma ação visualmente primária.

Ações destrutivas não devem competir espacialmente com ações frequentes.

## Modelo de dashboard candidato

```
┌──────────────────────────────────────────────┐
│ Contexto / busca / estado global             │
├──────────────────────────┬───────────────────┤
│ HERO                     │ resumo secundário │
│ informação dominante     │ serviços/estado   │
├───────────┬──────────────┼───────────────────┤
│ métrica   │ métrica      │ contexto técnico  │
├───────────┴──────────────┴───────────────────┤
│ histórico / eventos / atividade              │
└──────────────────────────────────────────────┘
```

## Breakpoints

Responsividade deve preservar prioridade:

### Desktop
- hero + contexto coexistem;
- Bento pode ter assimetria;
- drawers podem coexistir.

### Tablet
- reduzir simultaneidade;
- preservar hero no topo;
- secundários reorganizam.

### Mobile
- ordem > geometria;
- hero primeiro;
- detalhes progressivos;
- métricas secundárias empilhadas;
- ações principais acessíveis.

## Operational UI

Para interfaces de infraestrutura/observabilidade:

### Global Health
Pode ocupar a posição hero.

Deve responder rapidamente:
- está saudável?
- mudou recentemente?
- há algo que requer ação?

### Métricas
CPU/RAM/disco/rede não devem automaticamente competir com estado global.

### Serviços
Preferir reconhecimento:
- nome;
- função curta;
- estado;
- última mudança;
- ação contextual.

### Eventos
Histórico deve permitir entender “o que aconteceu” sem abrir logs imediatamente.

### Detalhes técnicos
Versões, pacotes, portas, variáveis, logs extensos:
- disponíveis;
- pesquisáveis;
- progressivamente revelados.

## Anti-padrões

- dashboard = grade uniforme de cartões;
- glass em todos os blocos;
- 5 CTAs primários simultâneos;
- animação constante em estado normal;
- esconder filtros ativos;
- cor como único indicador de saúde;
- hero puramente decorativo.

## Critério de aceite

Antes de aprovar uma tela, deve ser possível responder em poucos segundos:

1. Onde estou?
2. O que é mais importante aqui?
3. O sistema está normal?
4. O que mudou?
5. Qual ação é esperada de mim?
6. Onde encontro o detalhe sem perder contexto?
