# Perfil Keycloak — tema de login `lc-hub`

> 2026-11-02 · Status: **IMPLEMENTED (tema) + TESTED_BROWSER (prévia aproximada)**; **não testado em Keycloak real; não implantado.**
> Consumidor: login do LC Hub (Keycloak na A1, versão observada no acervo: **26.7.2**). O login funcional de `/access` (PPC-A1-021) continua fora do DS.

## 1. O que é

Um tema Keycloak do tipo `login` que **herda `keycloak.v2`** (PatternFly 5) e acrescenta só CSS:

```
adapters/keycloak/lc-hub/login/
├── theme.properties                    parent=keycloak.v2 · styles=css/styles.css + UDS · darkMode=false
└── resources/css/
    ├── uds.tokens.css                  GERADO (espelho de css/uds.tokens.css)
    ├── uds.profile.lc-hub.css          GERADO (perfil LC Hub com escopo :root)
    └── uds-login.css                   mapeamento PF5 → --uds-* + ajustes por ID estável
```

Decisões:
- **Sem templates FreeMarker próprios**: upgrades do Keycloak continuam trazendo correções de template e de segurança.
- **Variáveis globais PF5** (`--pf-v5-global--*`) remapeadas para papéis `--uds-*`: menos dependente de markup do que sobrescrever classes.
- IDs dos templates (`#kc-header`, `#kc-page-title`, `#username`, `#kc-login`, `#kc-form-options`) como âncoras estáveis.
- Light only (`darkMode=false`), coerente com o perfil V2 §1.
- Nenhum recurso remoto (fontes, imagens, scripts): compatível com a CSP padrão do Keycloak.

## 2. Cobertura

Página de login: marca/realm, título, campos (limite 3:1, foco, inválido com cor + barra), mensagem de erro, alerta de credencial inválida, "lembrar de mim", links auxiliares, botão primário (AA), reduced-motion. Outras páginas do tipo `login` (reset de senha, OTP, atualização de perfil) herdam o mesmo CSS por compartilharem os componentes PF5 — **não verificadas individualmente**.

## 3. Verificação

- Testes estáticos: `theme.properties` herda `keycloak.v2`, lista `css/styles.css` primeiro e todos os CSS existem; todas as variáveis `--uds-*` usadas estão definidas nos espelhos gerados.
- Prévia: `examples/keycloak-login-preview.html` (markup PF5 reconstituído + PatternFly 5.4.2 via CDN apenas na prévia). **É aproximação**, não o template real.

## 4. Implantação (NÃO executada; exige tarefa própria na P1/A1)

1. Copiar `adapters/keycloak/lc-hub` para `/opt/keycloak/themes/lc-hub` do contêiner (volume) ou empacotar em JAR (`META-INF/keycloak-themes.json` + `theme/lc-hub/login/...`) em `providers/`.
2. Em ambiente de teste/realm não produtivo: Realm settings → Themes → Login theme = `lc-hub`.
3. Validar no Keycloak 26.7.2 real: seletores PF5 (`.pf-v5-c-login__main`, `.pf-v5-c-form-control`), herança de `styles`, `darkMode`, páginas de reset/OTP, mobile 320px, zoom 200%.
4. Rollback: voltar o Login theme para `keycloak.v2`.

## 5. Riscos e pendências

- Nomes de classes/variáveis PF5 podem mudar entre versões do Keycloak (PF5 → PF6 em versões futuras): revisar a cada upgrade maior.
- Cor dos acentos do perfil LC Hub não homologada (o login usa só `action.primary`, `link`, `status.*` — derivados ou candidatos com AA comprovado).
