# Design tokens e interoperabilidade

## Camadas de token

- **Primitive:** escala bruta (ex.: `blue.500`, `space.4`).
- **Semantic:** intenção contextual (ex.: `color.text.primary`, `color.surface.canvas`).
- **Component:** token específico de um componente, criado apenas quando uma intenção semântica existente não for suficiente.

Não criar alias redundante para cada componente. Tokens de componente são uma extensão, não a origem dos valores.

## Exportadores

`@forma-ui/tokens` mantém os valores canônicos e conversores. `createFormaDtcgDocument()` emite formato inspirado/compatível com o Design Tokens Format Module 2025.10. O documento 2025.10 foi publicado pelo Design Tokens Community Group em 28 de outubro de 2025 e não é um W3C Standard nem faz parte da W3C Standards Track; esse status deve ser comunicado corretamente.

Exportações previstas:

- TypeScript/JavaScript para aplicações.
- CSS Custom Properties com prefixo `--forma-`.
- DTCG JSON para ferramentas de design e transformação.
- Tailwind 4 `@theme` e mapeamento de compatibilidade para Tailwind 3.
- UnoCSS preset opcional.
- Integração futura com Style Dictionary deve ser um pacote opcional; não importar Style Dictionary dentro do runtime.

## Contraste

A calculadora segue a fórmula de luminância relativa sRGB da WCAG. Os testes devem cobrir pares reais de token semântico, estados hover/focus/disabled, high contrast e os modos light/dark. Um valor de contraste isolado não prova conformidade completa: tamanho do texto, espessura, uso de cor, foco e conteúdo também importam.

## Temas

- `light`, `dark` e `high-contrast` são explicitamente aplicados pelo consumidor.
- Nenhum tema injeta globalmente CSS sem ação opt-in.
- Preferências do sistema podem ser usadas por uma função helper, mas não devem mudar temas implicitamente depois de o usuário selecionar uma escolha manual.
- Paletas de marca podem sobrescrever tokens semânticos mantendo a estrutura.

## Validação

1. Validar nomes e tipos no JSON DTCG.
2. Resolver referências/aliases e rejeitar ciclos.
3. Gerar CSS e confirmar que cada variável referenciada existe.
4. Calcular contraste entre pares de foreground/background documentados.
5. Gerar relatório de diffs de token para revisão humana.
