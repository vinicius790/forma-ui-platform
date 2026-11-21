# Versionamento, changelog e codemods

## SemVer

- **MAJOR:** quebra de API pública, semântica incompatível ou remoção após ciclo de depreciação.
- **MINOR:** funcionalidade compatível, novos componentes/props/exports.
- **PATCH:** correções compatíveis, segurança, documentação ou ajustes internos sem alterar contrato.

Cada pacote publicado possui versão independente, coordenada pelo Changesets (`fixed` e `linked` permanecem vazios). Alterações entre pacotes devem atualizar dependências internas de forma compatível.

## Processo de mudança

1. Criar um changeset com impacto e justificativa.
2. Atualizar documentação, tipos e testes de contrato.
3. Para depreciação, avisar com antecedência, explicar substituição e manter alias compatível pelo prazo definido.
4. Validar build, typecheck, exports, testes unitários, axe e playground.
5. Gerar changelog e publicar apenas depois de CI verde e aprovação humana.

## Codemods

`forma-codemod --from v0 --to v1 <glob>` opera em dry-run por padrão. `--write` grava mudanças. O motor usa AST TypeScript para renomear apenas propriedades/atributos reconhecidos. O codemod não aplica transformações em strings, comentários nem identificadores arbitrários; casos ambíguos são reportados para migração manual.

## Publicação

O workflow usa Changesets e `NODE_AUTH_TOKEN` (configurado a partir do secret `NPM_TOKEN`). Configure proteção de branch, revisão obrigatória, proveniência/publicação confiável quando suportada pelo registry e rotação de secrets. Não publique pacote com placeholder, artefato de teste ou build não reproduzível.
