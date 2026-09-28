# Universal Design vNext — Proposals

Status: **experimental**

Esta pasta existe para evoluir o Design System sem alterar prematuramente o contrato estável de `main`.

## Regra de promoção

Uma proposta só deve ser promovida para `DESIGN_SYSTEM.md` / `tokens.json` quando:

1. tiver uma intenção de UX explícita;
2. puder ser expressa de forma stack-agnostic;
3. tiver sido testada em pelo menos uma interface real;
4. não depender de estética isolada sem função;
5. tiver comportamento light/dark e acessibilidade definidos;
6. estiver classificada como princípio, token, pattern ou recomendação.

Fluxo esperado:

```
proposal
  ↓
experimento em produto
  ↓
ajuste
  ↓
decisão
  ↓
contrato estável
```

## Primeira rodada

- `surfaces.md` — profundidade, elevação, vidro seletivo e hierarquia de superfícies.
- `motion.md` — vocabulário mínimo de movimento funcional.
- `composition.md` — Bento, hero, progressive disclosure e composição de dashboards.

## Princípio geral

O objetivo do vNext não é “decorar” interfaces. É aumentar clareza, reconhecimento, orientação e qualidade percebida sem sacrificar densidade, desempenho ou portabilidade.

O Design System atual continua sendo a fonte normativa estável. Tudo nesta pasta é candidato, não norma.
