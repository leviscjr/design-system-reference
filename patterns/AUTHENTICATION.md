# Padrão universal — apresentação de autenticação

> Escopo do T2U: anatomia visual, estados e acessibilidade. Integração com provedores, identidade de produto, conteúdo jurídico e autenticação pertencem ao consumidor.

## Anatomia

Uma interface de entrada pode compor os componentes UDS existentes:

- título e texto auxiliar;
- campo de usuário ou e-mail com `autocomplete="username"`;
- campo de senha com `type="password"` e `autocomplete="current-password"`;
- checkbox nativo opcional ou obrigatório, conforme regra declarada pelo consumidor;
- links auxiliares e jurídicos fornecidos pelo consumidor;
- alerta geral e erros de campo ligados por `aria-describedby`;
- ação primária de envio e ações secundárias como links.

O exemplo `examples/authentication.html` demonstra somente apresentação. O `action="#"`, textos e URLs são placeholders explícitos; não implementam login, consentimento, recuperação de senha ou política jurídica.

## Contratos de acessibilidade

1. Todo controle tem nome acessível visível.
2. Obrigatoriedade usa o atributo HTML `required`; o asterisco é apenas visual.
3. Erros não dependem só de cor, usam texto e `aria-invalid`/`aria-describedby`.
4. O resumo de erros recebe `role="alert"` e o primeiro campo inválido recebe foco.
5. Links navegam; ações usam botões.
6. O checkbox permanece nativo e operável por teclado.
7. Foco visível e `prefers-reduced-motion` vêm dos componentes UDS.

## Fronteira do consumidor

O Design System não decide quando um aceite é obrigatório, não fornece termos ou política de privacidade, não armazena consentimento, não valida credenciais e não escolhe um provedor de identidade. Keycloak, LC-HUB e qualquer tema/marca específica são implementação do projeto consumidor.
