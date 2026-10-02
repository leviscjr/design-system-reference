# Vocabulário da interface — regiões e componentes (v1)

> Contrato de **referência verbal**, stack-agnostic: `Região.Componente.Subcomponente`. Exemplos e mapa concreto do LC Hub; não é prova de existência de classes HTML, funções Python ou implantação. Consulte `UNIVERSAL_DESIGN_VNEXT.md` para regras transversais e `profiles/LC_HUB_PROFILE_V2.md` para defaults do LC Hub.

## 1. Convenções

- **PascalCase** por segmento, separado por ponto: `Topbar.Status.A1`, `Explorer.Tree.ItemLabel`. Prefixo opcional `LC_HUB.` apenas em buscas interprojetos.
- **Região** representa uma área estável do AppShell; **componente** representa função; **subcomponente** representa parte nomeável. Ex.: `Explorer` → `Explorer.Tree` → `Explorer.Tree.ItemLabel`.
- Caminhos expressam **hierarquia conceitual**, não obrigam o DOM a ter exatamente os mesmos níveis. CSS, IDs de teste e nomes de funções podem fazer mapeamento explícito.
- Diferenciar **componente** de **estado**: `Explorer.Tree.Item.State` pode ser `active`; isso não determina `operational_health` do serviço. Estado de navegação, saúde da máquina, maturidade da capacidade e severidade do alerta são dimensões diferentes.
- Nomes formais propostos não afirmam implementação. Elementos podem estar **observados/implantados**, **aprovados mas pendentes** ou **opcionais/futuros**. O perfil do produto controla a matriz de implantação.
- Regras de acessibilidade continuam associadas ao controle real; a gramática de nomes **não substitui** labels acessíveis.

## 2. Regiões do AppShell

| Curto | Nome descritivo | Escopo | Papel |
|---|---|---|---|
| `Topbar` | Global Header | AppShell | marca, navegação, status, busca, usuário |
| `Explorer` | Navigation Sidebar | AppShell | árvore e destinos navegáveis |
| `Workspace` | Main Workspace | página | cabeçalho, seções e conteúdo |
| `Rail` | Utility Rail | AppShell | ações contextuais e sinalização |
| `Drawer` | Contextual Drawer / Responsive Sheet | overlay temporário | inspeção sem trocar página |

`Drawer` é **sobreposição transitória**, não quinta coluna física permanente. `Workspace` designa uma região estável; cards e componentes internos vivem nela. `Modal` é um componente transversal distinto, usado para confirmação/decisão.

## 3. Vocabulário canônico do LC Hub

```text
LC_HUB
├── Topbar
│   ├── Brand
│   ├── Nav
│   │   ├── NavItem
│   │   └── Active
│   ├── Status
│   │   ├── A1
│   │   ├── E2
│   │   └── Metric
│   ├── Search
│   └── User
│       ├── Avatar
│       └── Menu
├── Explorer
│   ├── Header
│   ├── Toggle
│   ├── Tree
│   │   ├── Group
│   │   │   ├── GroupIcon
│   │   │   ├── GroupLabel
│   │   │   └── Chevron
│   │   ├── Item
│   │   │   ├── ItemIcon
│   │   │   ├── ItemLabel
│   │   │   └── State
│   │   └── Subtree
│   ├── Scroll
│   └── Footer
├── Workspace
│   ├── PageHeader
│   │   ├── Title
│   │   ├── Subtitle
│   │   └── Actions
│   ├── Apps
│   │   ├── Header
│   │   ├── Toggle
│   │   ├── Count
│   │   └── LauncherGrid
│   │       └── Launcher
│   │           ├── Icon
│   │           ├── Label
│   │           ├── Meta
│   │           ├── State
│   │           └── Action
│   ├── Caps
│   │   ├── Header
│   │   ├── Toggle
│   │   ├── Count
│   │   └── LauncherGrid
│   │       └── Launcher
│   │           ├── Icon
│   │           ├── Label
│   │           ├── Meta
│   │           ├── State
│   │           └── Action
│   ├── Feed
│   │   ├── Header
│   │   ├── Density
│   │   ├── EventList
│   │   │   └── Event
│   │   │       ├── Icon
│   │   │       ├── Source
│   │   │       ├── Action
│   │   │       ├── Timestamp
│   │   │       └── Result
│   │   └── EmptyState
│   └── Legacy
│       ├── Header
│       ├── Toggle
│       └── LinkList
├── Rail
│   ├── Health
│   ├── Attention
│   │   └── Badge
│   ├── Audit
│   │   └── Badge
│   ├── UtilityAction
│   └── Tooltip
└── Drawer
    ├── Backdrop
    ├── Header
    │   ├── Icon
    │   ├── Title
    │   ├── Status
    │   └── Close
    ├── Body
    │   ├── ItemList
    │   ├── EmptyState
    │   ├── Unavailable
    │   ├── Loading
    │   └── Error
    └── Footer
```

### Leitura da árvore

- `Workspace.Apps` e `Workspace.Caps` são seções colapsáveis **independentes**; defaults do LC Hub = expandidas. Não são os grupos de `Explorer.Tree`.
- `Workspace.Feed.Density`: seletor `1 / 3 / 5 / Todas`, padrão LC Hub = `1` (não é um padrão global).
- `Rail.Attention` e `Rail.Audit` acionam um `Drawer`; não significa que os respectivos drawers já foram publicados.
- `Topbar.Status.E2` é a chave curta da E2.1 Micro, não a descrição de uma terceira máquina.
- `Explorer.Footer`, `Workspace.Feed.Event.Result`, `Drawer.Body.ItemList`, contadores e alguns outros nós são **opcionais/condicionais** à existência de elementos e dados. Nunca fabricar markup/telemetria apenas para satisfazer a árvore.

## 4. Componentes transversais

| Nome | Responsabilidade | Observação |
|---|---|---|
| `Card` | agrupar conteúdo | superfície visual, não sinônimo de accordion |
| `Accordion` | disclosure com expansão/retração | open/closed, foco, reduced-motion |
| `Badge` | indicar número/estado real | contador somente com fonte verificável |
| `Pill` | metadado compacto | não transformar em controle sem affordance |
| `Tooltip` | orientação complementar | nunca único canal crítico |
| `Status` | estado operacional | separar maturidade/saúde/seleção |
| `Skeleton` | carregamento | apenas durante estado loading real |
| `EmptyState` | consulta concluída sem dados | não equivale a unavailable |
| `Unavailable` | fonte indisponível/não integrada | não afirmar ausência de alertas |
| `Popover` | ação ou menu local | distinto de drawer |
| `Modal` | decisão ou confirmação bloqueante | distinto de drawer |
| `Drawer` | inspeção contextual | foco restaurado ao acionador |
| `Density` | quantidade visível de linhas | sem fabricar dados |
| `Toggle` | alternância | semântica varia por componente |
| `Divider` | separação visual | não substitui hierarquia |
| `ScrollRegion` | rolagem independente | teclado/touch/safe-area |

## 5. Exemplos práticos de referência

| Pedido humano | Endereço estável | Escopo objetivo |
|---|---|---|
| “Aumente o tamanho dos nomes da árvore.” | `Explorer.Tree.ItemLabel` | texto de itens, sem inflar linha toda |
| “Deixe o grupo Aplicações na sidebar mais legível.” | `Explorer.Tree.Group.GroupLabel` | tipografia do grupo, não card central |
| “Ajuste a distância entre ícone e texto dos launchers.” | `Workspace.Apps.LauncherGrid.Launcher` | layout do item; conferir também `Caps` |
| “Faça Capacidades abrir e recolher suavemente.” | `Workspace.Caps.Toggle` | interação do accordion, não `Explorer.Tree` |
| “Quero só uma atividade ao entrar.” | `Workspace.Feed.Density` | default = 1, demais opções 3/5/Todas |
| “Coloque um indicador de alertas na direita.” | `Rail.Attention.Badge` | apenas com fonte real |
| “Abra auditoria num painel pela direita.” | `Rail.Audit` → `Drawer` | acionamento, overlay e foco |
| “O status da A1 está muito largo.” | `Topbar.Status.A1` | dimensão/legibilidade, não valor falso |
| “Não consigo rolar até o último link.” | `Explorer.Scroll` | região rolável/altura/safe area |
| “A data do evento está ilegível.” | `Workspace.Feed.EventList.Event.Timestamp` | texto temporal, contraste |

### Exemplo de prompt para um agente

```text
Área: LC_HUB.Workspace.Feed.Density
Intenção: exibir 1/3/5/Todas com default 1.
Restrições: dados reais, não regressar responsividade, não mudar Explorer.Tree,
não alterar contratos de auth nem HTML de componentes não envolvidos.
Aceite: controle de teclado, 1 atividade no primeiro carregamento,
3 e 5 exibem até N eventos carregados, Todas explica a paginação se houver;
Safari iPhone e desktop funcionam.
```

### Exemplo de reporte de bug e de teste

```text
BUG UI: Explorer.Scroll
Sintoma: com todos os grupos abertos no iPhone, o último item não fica acessível.
Esperado: scroll independente até o fim, sem conflito com Drawer/Topbar.
Evidência: largura, browser, screenshot, passo para reproduzir.

TEST ID: LC_HUB.Workspace.Caps.Toggle::collapse-independent
Pré-condições: Apps e Caps abertos.
Ação: recolher Caps.
Esperado: Caps fecha sem altura residual, Apps fica aberto,
aria-expanded muda e foco continua visível.
```

## 6. Regra para nomes no código e testes

Quando viável, mapear a referência conceitual para identificadores verificáveis, por exemplo `data-ui="Explorer.Tree.Item"`, mas **não exigir uma refatoração geral do DOM** para adotar o vocabulário. Testes devem preferir semântica e papéis acessíveis, usando `data-ui` apenas quando necessário. Em relatórios e PPCs, citar o caminho conceitual e o componente concreto existente (arquivo/função/seletor) separadamente.

## 7. Limites do contrato

Este arquivo é um **léxico de comunicação e rastreabilidade**. Não define SQL, API, modelo de dados, autenticação, autorização, nem disponibilidade de alertas. Nomes e árvore não impõem aparência. Se houver divergência entre “previsto” e runtime, documentar a diferença em vez de preencher o vazio artificialmente.
