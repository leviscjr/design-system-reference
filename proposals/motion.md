# Proposal — Motion

Status: **experimental**
Categoria candidata: Foundation + Interaction

## Problema

O Design System atual reconhece alguns movimentos funcionais, mas não possui um vocabulário centralizado de motion.

Sem contrato, cada aplicação tende a inventar duração, easing e intensidade.

## Intenção

Movimento deve explicar:
- mudança de estado;
- relação espacial;
- origem/destino;
- continuidade da interação.

Nunca deve existir apenas para “parecer moderno”.

## Princípios

1. **Motion é feedback.**
2. **Movimento contínuo é exceção.**
3. **Mudanças locais devem produzir movimento local.**
4. **Estados normais devem parecer calmos.**
5. **Anormalidade pode aumentar intensidade visual, sem virar distração.**
6. **Respeitar `prefers-reduced-motion`.**

## Escala candidata

### instant

Uso:
- mudança de cor;
- pressed;
- toggles simples.

Faixa sugerida: 80–120 ms.

### fast

Uso:
- hover;
- tooltip;
- badge/state transitions.

Faixa sugerida: 120–180 ms.

### normal

Uso:
- accordion;
- card expandido;
- troca de conteúdo local;
- pequenos painéis.

Faixa sugerida: 180–260 ms.

### spatial

Uso:
- drawer;
- command palette;
- modal;
- painel de inspeção.

Faixa sugerida: 220–320 ms.

> As faixas são candidatas. Só valores testados devem virar tokens.

## Easing candidato

Separar intenção:

- **enter**: desacelera ao chegar;
- **exit**: acelera ao sair;
- **move**: curva equilibrada para reposicionamento.

Não acoplar o contrato a nomes de uma biblioteca específica.

## Padrões

### Press feedback

Uma ação clicável pode usar compressão mínima, desde que:
- não cause layout shift;
- seja rápida;
- não seja o único feedback.

### Loading

Preferência:
1. skeleton quando a estrutura do conteúdo é conhecida;
2. progress quando duração/progresso são mensuráveis;
3. spinner quando nenhum dos dois anteriores fizer sentido.

Evitar loading silencioso.

### Content transition

Entrada de conteúdo assíncrono:
- fade curto;
- opcional pequeno deslocamento;
- sem animação dramática.

### Operational calm

Em dashboards operacionais:
- healthy: praticamente sem movimento;
- warning: mudança localizada;
- critical: feedback mais evidente, porém finito.

Não usar pulsação infinita para indicar estado normal.

## Reduced Motion

Com `prefers-reduced-motion: reduce`:
- remover transformações não essenciais;
- reduzir deslocamentos;
- evitar parallax;
- preservar feedback via cor, borda, texto e estado.

## Critério de aceite

Motion só entra no sistema se responder claramente:

> “Qual informação sobre estado, causa, continuidade ou espaço este movimento comunica?”

Se a resposta for apenas “fica mais bonito”, deve permanecer fora do contrato.
