# SEA Workspace v0.2 — comparação experimental

Baseline funcional `origin/feat/claude-ui` em `c4612bb1cbfcd21475c334289e583fddffbd0cbb`.
Identidade T2U confirmada no mapa publicado `leviscjr/repo_modelo` `main`, commit `1004194d3f0563999971eaef3e444d1c7f4c5418`, blob `516fbd16b3b56ce56eec8894b56facf32f19d551`.
Fonte estética: `C:\Users\Levi Cidral\Downloads\IA_LEATORIO\SEA_T2U_entrega.zip`, SHA-256 `e52e2c23baa1e168da8abc5f2470ddb3f421d16bddbffd991ef94c35323d67f6`.
O pacote foi inspecionado antes da execução; sua extração permanece em EXCLUDE. Os valores SEA são candidatos experimentais, não tokens normativos.

| Elemento | Original | Workspace v0.1 | Diferença e solução v0.2 | Arquivos |
|---|---|---|---|---|
| Renderização, iluminação e refração | Shader WebGL com raios, cáusticas, refração cromática, correntes e ruído | Canvas 2D reconstruído com feixes e manchas | Reutilizar shader original com adaptador; manter Canvas do shell como fallback | `src/atmosphere/` e `build.cjs` |
| Profundidade e vida | Camadas, partículas e águas-vivas discretas | Partículas e gradientes sem shader | Recuperar parâmetros light/dark e camadas originais; profundidade fixa por ora | `sea.tokens.json`, shaders e adaptador |
| Materiais | Vidro com saturação 1,45, bordas suaves e sombras coloridas | Painéis de vidro mais neutros, canvas técnico denso | Recuperar tratamento do vidro no Explorer/Inspector e preservar maior opacidade do canvas técnico | `src/styles/shell.css` |
| Tipografia e geometria | Inter incorporada; cartões maiores | Fonte de sistema e shell compacto | Incorporar Inter com licença e manter geometria e densidade de trabalho | `src/assets/inter/`, `build.cjs`, `shell.css` |
| Exposição visual | Conteúdo de panorama deixa grande área para a atmosfera | Documento e painéis ocupam quase toda a viewport | Integrar luz por transparência controlada, sem reduzir a área útil do documento | `shell.css` |
| Movimento | Shader e springs próprios | Ambiente 0,4× e springs funcionais independentes | Manter 0,4×, ping e interações do shell; recuperar shader e rastro do ponteiro | adaptador; core não alterado |

Não há evidência de que a diferença tenha sido causada por Remora: o README da baseline informa que o código SEA anterior não estava disponível durante sua construção. As diferenças resultam de substituição do motor, parâmetros e fonte, além da composição compacta do workspace.

## Integridade das referências

SHA-256 das fontes originais, relativas a `SEA_T2U/sea-src/sea/`:

- `src/atmosphere/atmosphere.js`: `b89933a7416241eadce1c1dcd94e394db1c152e4b7691c89c9bb15b4e05c2056`
- `src/atmosphere/fallback2d.js`: `1df07eda84db694b571a828cc3dc34de0d756e2ce06068871a7267d92fbd22f2`
- `src/atmosphere/shaders/atmosphere.frag`: `6db59f368f7771958d7d689ca96f18fb27c18faa8e6c19050aa8f4e956fea024`
- `src/atmosphere/shaders/atmosphere.vert`: `982127cd52351787a9adb2370dad7b402a319ec6bf21984f3cfc1e5f82a67396`
- `sea.tokens.json`: `1475d798ff120fbfecba0d841c78c74cdeb434817ce810a3306c3e8c471d0f30`
- `vendor/inter/inter-latin-wght-normal.woff2`: `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62`

## Evidência visual

As capturas em `evidence/` foram feitas no Chrome, viewport 1440×900, com WebGL por software na original e na v0.2; a v0.1 usa Canvas 2D. `v02-mobile-dark.jpg` usa 390×800. Os arquivos `original-*`, `v01-*` e `v02-*` mostram a identidade em Light e Dark. A composição original é uma página de panorama e o workspace é um ambiente técnico: a comparação é de luz e material, não de layout equivalente.

A versão clara recupera a luz ciano e o vidro da original. Na escura, o documento e os painéis ocultam a maior parte da atmosfera; a identidade recuperada é mais discreta que no panorama original. A apreciação estética final continua sendo uma decisão humana.

Limitações: o adaptador usa resolução fixa de 0,4 e não recupera a qualidade adaptativa do host original; a profundidade permanece fixa e o fallback utilizado é o Canvas 2D já existente no shell, não uma cópia do fallback do ZIP. Não houve validação em GPU física, Safari, leitor de tela ou dispositivo móvel real.

O teste complementar `atmosphere.cjs` verifica que o shader WebGL inicializa, que a aplicação continua funcional quando WebGL é negado e que ambos os renderizadores param e removem seu canvas ao serem descartados. A suíte funcional e a baseline estão em `RESULTS.md` e `BASELINE.md`.
