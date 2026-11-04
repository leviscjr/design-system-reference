# Fixture fotovoltaico — fontes e proveniência

As páginas 1 e 2 de cada documento são renderizadas como JPEG a 120 dpi e incorporadas ao HTML. As evidências abaixo estão na página 2 de seu próprio documento; valores, linhas extraídas e caixas normalizadas estão em `src/demo/pv.generated.json`.

| Documento | Revisão | SHA-256 | Parâmetros verificados |
|---|---|---|---|
| [Fox ESS H3 Plus](https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251204/ENH3PlusDatasheetV2.720251204-904.pdf) | 2.7 · 2025-12-04 | `26b171ed52d2d0ea6f0b694f7eed769482ff3587062d90ff555e5a259aced600` | H3-125-Plus: potência CA nominal 125 kW; potência máxima do arranjo 250 kW; corrente CA nominal por fase 190 A; 8 rastreadores MPP |
| [Fox ESS CQ16/CQ BOX](https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251203/ENCQ16CQBOXDatasheetV1.320251024.pdf) | 1.3 · 2025-10-24 | `d3098bfc10d4f1271a7f57346f6546d2a556ffe7b07f8016a8d7f0af762e688e` | CQ BOX: faixa operacional 101–1000 Vdc; CQ16: tensão nominal 51,2 Vdc; capacidade nominal 314 Ah e 16,07 kWh; corrente de pico 470 A por 60 s |

O script `tools/prepare_pv_fixture.py` verifica os hashes dos PDFs, a presença e unicidade da linha e os tokens de valor; no H3 valida a posição do valor na coluna mais à direita, correspondente ao H3-125-Plus. Nenhuma associação com os códigos WEG `BSCW400H T125 B241 W00`, `SBW400 C2400 W00` ou `SBW400 B160 W00` foi comprovada pelos PDFs Fox ESS e nenhuma é afirmada no fixture.

Os parâmetros são observações de documentos; estados de revisão e candidatos são simulados e não constituem aprovação técnica. As páginas incorporadas são imagens; não há extração genérica, pesquisa de texto no PDF, seleção de texto ou integração com catálogo externo.

Para regerar: `python sea/shell/tools/prepare_pv_fixture.py <H3.pdf> <CQ16.pdf>` com `pdfplumber` e `pdftoppm` disponíveis; depois `node sea/shell/build.cjs`. O build usa somente os dados e imagens gerados e cria um HTML único para `file://`. A versão anterior de NE555 permanece como material legado, sem entrar na demonstração atual.

## Interpretação semântica candidata

Referência somente para consulta: [`data_transform/docs/engineering_catalog/v0.10_candidate`](https://github.com/leviscjr/data_transform/tree/b11af1b8fd5b7ec34f51fb9e359a18f7a6d756f2/docs/engineering_catalog/v0.10_candidate), commit `b11af1b8fd5b7ec34f51fb9e359a18f7a6d756f2`. As cópias solicitadas ficam em `EXCLUDE/semantic-reference/`, marcadas como somente leitura. V0.10 é candidata, não um esquema implantado. As correspondências seguintes são interpretações para revisão; o fixture preserva os valores e condições originais do fabricante, sem gravar dados em catálogo ou promover campos a contrato aprovado.

| Observação do PDF | Correspondência candidata | Limite da interpretação |
|---|---|---|
| H3-125-Plus: potência CA nominal 125 kW | `dcac_ac_interface.nominal_power_kw` | Saída CA da rede, não potência FV nem aparente EPS. |
| CQ16: capacidade nominal 314 Ah | `battery_general.nominal_capacity_ah` | Capacidade da unidade CQ16, sem atribuí-la automaticamente à célula. |
| CQ16: energia nominal 16,07 kWh | `battery_general.nominal_energy_kwh` | Unidade CQ16; não é energia utilizável nem energia nominal integrada do BESS. |
| CQ16: tensão nominal 51,2 Vdc | `battery_electrical.nominal_voltage_v` | Tensão da unidade de bateria, não tensão nominal de célula ou limite do inversor. |
| CQ16: pico de descarga 470 A por 60 s | `battery_electrical.peak_discharge_current_a` e `battery_electrical.peak_discharge_duration_s` | Os dois campos candidatos compartilham a mesma evidência; não são corrente contínua nem tempo de transferência. |

Sem correspondência atribuída nesta demonstração: potência máxima do arranjo FV (250 kW), corrente CA nominal por fase (190 A), quantidade de 8 rastreadores e faixa de tensão operacional do controlador CQ BOX. Em particular, quantidade de rastreadores não é `mppt_index`, corrente nominal não é automaticamente corrente máxima, e limites do controlador não são limites da bateria. A falta de correspondência não invalida a observação documental e não justifica inferir campos adicionais.
