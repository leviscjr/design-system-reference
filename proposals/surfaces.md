# Proposal — Surfaces & Depth

Status: **experimental**
Categoria candidata: Foundation + Composition

## Problema

O Design System atual define `bg`, `surface`, `surface-alt`, borda e cores semânticas, mas não possui um contrato explícito para profundidade visual, elevação, translucidez ou hierarquia entre superfícies.

Isso limita a capacidade de criar interfaces visualmente refinadas sem cada aplicação inventar sua própria solução.

## Intenção

Criar profundidade suficiente para orientar atenção e relações espaciais, sem transformar a interface em uma coleção de efeitos decorativos.

## Princípios

1. **Profundidade comunica relação, não luxo.**
2. **Surface padrão deve permanecer neutra.**
3. **Glass é uma superfície especial, não o padrão de todos os cards.**
4. **Elevação deve ser rara e proporcional à importância/interação.**
5. **Contraste e legibilidade vencem translucidez.**
6. **Dark mode não é uma simples inversão de sombras do light mode.**

## Modelo candidato

### Surface 0 — Canvas

Fundo estrutural da aplicação.

Uso:
- viewport;
- áreas vazias;
- plano mais distante.

### Surface 1 — Base

Superfície de trabalho padrão.

Uso:
- cards;
- tabelas;
- painéis persistentes;
- grupos de formulário.

Características:
- borda discreta;
- sem glow permanente;
- sombra ausente ou mínima.

### Surface 2 — Raised

Superfície temporariamente destacada.

Uso:
- hover significativo;
- popover;
- card selecionado;
- painel em inspeção.

Características:
- borda mais perceptível;
- sombra curta;
- deslocamento visual mínimo.

### Surface 3 — Overlay

Superfície acima do fluxo principal.

Uso:
- drawer;
- command palette;
- modal;
- menus flutuantes.

Pode usar translucidez e backdrop blur se:
- o conteúdo permanecer legível;
- a hierarquia continuar clara;
- houver fallback visual sem blur.

### Surface Glass — Special

Uso restrito.

Casos apropriados:
- command palette;
- toolbar flutuante;
- overlay contextual;
- hero quando houver justificativa visual.

Não usar:
- em toda métrica de dashboard;
- atrás de texto de alta densidade;
- para substituir contraste;
- apenas por estética.

## Tokens candidatos

Ainda **não promover para `tokens.json`**. Primeiro validar.

```yaml
semantic:
  surface:
    canvas
    base
    raised
    overlay
    glass

primitive:
  shadow:
    xs
    sm
    md
    lg

  blur:
    sm
    md
```

## Interação com estados

Estados operacionais não devem depender de elevação.

Exemplo:
- healthy = superfície normal + indicador semântico;
- warning = destaque localizado;
- critical = aumento de prioridade visual, não necessariamente sombra maior.

## Acessibilidade

- Nunca colocar texto diretamente sobre fundo visualmente instável sem contraste garantido.
- Glass deve possuir background fallback opaco.
- Focus-visible deve permanecer mais forte que a borda decorativa.
- Surface selecionada precisa de segundo canal além de sombra.

## Critério de aceite

Uma implementação aderente deve continuar compreensível se:
- todas as sombras forem removidas;
- backdrop blur estiver indisponível;
- animações estiverem desabilitadas.

Se a hierarquia desaparecer nessas condições, a profundidade está carregando informação demais.
