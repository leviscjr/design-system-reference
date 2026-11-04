# Revisão perceptual SEA — 2026-11-04

Revisão em Chrome headless com WebGL por software, desktop 1440×900 e viewport 390×800. As imagens `evidence/review-before-*` e `evidence/review-after-*` registram os dois temas antes e depois. O estado e a posição de rolagem do documento podem variar entre capturas; a comparação é de materialidade e legibilidade, não pixel a pixel.

O Dark inicial tinha atmosfera pouco aparente sob as superfícies. O Explorer e o Inspector receberam um reflexo direcional sutil e vidro escuro com opacidade 0,62, valor da identidade original. No Light, o mesmo tratamento acrescenta um reflexo claro e uma transição fria discreta. A superfície do documento mantém opacidade separada. A avaliação estética continua aberta à pessoa revisora.

O shader continua com escala fixa 0,4 e limite aproximado de 30 quadros/s. Esta revisão não mediu desempenho em GPU física nem comparou objetivamente nitidez com escalas diferentes; por isso não altera a política de qualidade. A separação entre movimento ambiental e interações foi preservada. A suíte automatizada mede a proporção de velocidade, mas não substitui inspeção perceptual individual de raios, partículas, cáusticas e rastros ao longo do tempo.

## Fontes para o fixture fotovoltaico

- Fox ESS H3 Plus, versão 2.7 de 2025-12-04, tabela na página 2: https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251204/ENH3PlusDatasheetV2.720251204-904.pdf — SHA-256 `26b171ed52d2d0ea6f0b694f7eed769482ff3587062d90ff555e5a259aced600`.
- Fox ESS CQ16/CQ BOX, versão 1.3 de 2025-10-24, tabelas na página 2: https://www.fox-ess.com/Public/Uploads/uploadfile/files/20251203/ENCQ16CQBOXDatasheetV1.320251024.pdf — SHA-256 `d3098bfc10d4f1271a7f57346f6546d2a556ffe7b07f8016a8d7f0af762e688e`.

Os PDFs originais e a verificação inicial de palavras e coordenadas estão em `EXCLUDE/sea-pv-sources/`. As equivalências com os códigos WEG citados na solicitação não foram confirmadas e não são afirmadas. O fixture fotovoltaico e sua procedência são documentados em `PV-SOURCES.md`; as capturas de revisão visual desta página são históricas e mostram a versão anterior com NE555.
